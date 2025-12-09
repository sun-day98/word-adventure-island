#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人硬件采购跟踪系统
用于管理和跟踪硬件采购进度、预算控制和供应商信息
"""

import csv
import json
import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass
class Component:
    """硬件组件数据类"""
    component_id: str
    component_name: str
    model_specification: str
    category: str
    version: str
    unit_price: float
    quantity: int
    total_price: float
    supplier: str
    delivery_date: str
    delivery_status: str = "pending"  # pending, ordered, shipped, delivered
    actual_delivery_date: Optional[str] = None
    quality_check: str = "pending"  # pending, passed, failed
    remarks: str = ""
    purchase_date: Optional[str] = None
    
class HardwarePurchaseTracker:
    """硬件采购跟踪器"""
    
    def __init__(self, csv_file: str = "config/hardware/components_list.xlsx"):
        self.csv_file = Path(csv_file)
        self.components: List[Component] = []
        self.load_components()
    
    def load_components(self):
        """从CSV文件加载组件列表"""
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    component = Component(
                        component_id=row['component_id'],
                        component_name=row['component_name'],
                        model_specification=row['model_specification'],
                        category=row['category'],
                        version=row['version'],
                        unit_price=float(row['unit_price']),
                        quantity=int(row['quantity']),
                        total_price=float(row['total_price']),
                        supplier=row['supplier'],
                        delivery_date=row['delivery_date'],
                        remarks=row['remarks']
                    )
                    self.components.append(component)
            print(f"✅ 已加载 {len(self.components)} 个硬件组件")
        except FileNotFoundError:
            print(f"❌ 找不到文件: {self.csv_file}")
        except Exception as e:
            print(f"❌ 加载组件列表失败: {e}")
    
    def get_total_budget(self) -> float:
        """获取总预算"""
        return sum(comp.total_price for comp in self.components)
    
    def get_budget_by_category(self) -> Dict[str, float]:
        """按类别获取预算"""
        category_budget = {}
        for comp in self.components:
            if comp.category not in category_budget:
                category_budget[comp.category] = 0
            category_budget[comp.category] += comp.total_price
        return category_budget
    
    def get_components_by_category(self, category: str) -> List[Component]:
        """获取指定类别的组件"""
        return [comp for comp in self.components if comp.category == category]
    
    def update_component_status(self, component_id: str, status: str, 
                               actual_date: str = None, quality: str = None):
        """更新组件状态"""
        for comp in self.components:
            if comp.component_id == component_id:
                comp.delivery_status = status
                if actual_date:
                    comp.actual_delivery_date = actual_date
                if quality:
                    comp.quality_check = quality
                if status == "ordered" and not comp.purchase_date:
                    comp.purchase_date = datetime.date.today().isoformat()
                print(f"✅ 已更新组件 {component_id} 状态为 {status}")
                return True
        print(f"❌ 未找到组件 {component_id}")
        return False
    
    def get_pending_components(self) -> List[Component]:
        """获取待采购组件"""
        return [comp for comp in self.components if comp.delivery_status == "pending"]
    
    def get_overdue_components(self) -> List[Component]:
        """获取逾期未交付组件"""
        today = datetime.date.today()
        overdue = []
        for comp in self.components:
            if comp.delivery_status in ["pending", "ordered", "shipped"]:
                delivery_date = datetime.datetime.strptime(comp.delivery_date, "%Y-%m-%d").date()
                if delivery_date < today:
                    overdue.append(comp)
        return overdue
    
    def get_supplier_summary(self) -> Dict[str, Dict]:
        """获取供应商汇总信息"""
        suppliers = {}
        for comp in self.components:
            if comp.supplier not in suppliers:
                suppliers[comp.supplier] = {
                    'total_value': 0,
                    'components': [],
                    'delivered_count': 0
                }
            suppliers[comp.supplier]['total_value'] += comp.total_price
            suppliers[comp.supplier]['components'].append(comp)
            if comp.delivery_status == "delivered":
                suppliers[comp.supplier]['delivered_count'] += 1
        return suppliers
    
    def generate_purchase_report(self) -> str:
        """生成采购报告"""
        total_budget = self.get_total_budget()
        delivered_value = sum(comp.total_price for comp in self.components 
                             if comp.delivery_status == "delivered")
        pending_count = len(self.get_pending_components())
        overdue_count = len(self.get_overdue_components())
        
        report = f"""
📊 农业巡检机器人硬件采购报告
{'='*50}
📅 报告日期: {datetime.date.today().isoformat()}

💰 预算概览:
   总预算: ¥{total_budget:,.2f}
   已交付: ¥{delivered_value:,.2f} ({delivered_value/total_budget*100:.1f}%)
   待交付: ¥{total_budget-delivered_value:,.2f}

📦 组件状态:
   总组件数: {len(self.components)}
   待采购: {pending_count}
   已交付: {len([c for c in self.components if c.delivery_status == 'delivered'])}
   逾期未交付: {overdue_count}

🏷️ 预算分类:
"""
        category_budget = self.get_budget_by_category()
        for category, budget in sorted(category_budget.items(), key=lambda x: x[1], reverse=True):
            percentage = budget / total_budget * 100
            report += f"   {category}: ¥{budget:,.2f} ({percentage:.1f}%)\n"
        
        return report
    
    def export_to_json(self, filename: str = "hardware_status.json"):
        """导出状态到JSON文件"""
        data = {
            'export_date': datetime.date.today().isoformat(),
            'total_budget': self.get_total_budget(),
            'components': [asdict(comp) for comp in self.components],
            'category_budget': self.get_budget_by_category(),
            'supplier_summary': self.get_supplier_summary()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已导出硬件状态到 {filename}")
    
    def suggest_purchase_order(self) -> List[Component]:
        """建议采购优先级"""
        # 按交付日期和重要性排序
        components = self.get_pending_components()
        # 这里可以添加更复杂的优先级逻辑
        return sorted(components, key=lambda x: x.delivery_date)

def main():
    """主函数 - 演示使用"""
    print("🤖 农业巡检机器人硬件采购跟踪系统")
    print("="*50)
    
    # 初始化跟踪器
    tracker = HardwarePurchaseTracker()
    
    # 生成报告
    print(tracker.generate_purchase_report())
    
    # 获取待采购组件
    pending = tracker.get_pending_components()
    if pending:
        print(f"\n📋 待采购组件 ({len(pending)}个):")
        for comp in pending[:5]:  # 只显示前5个
            print(f"   {comp.component_id}: {comp.component_name} - {comp.supplier}")
    
    # 检查逾期组件
    overdue = tracker.get_overdue_components()
    if overdue:
        print(f"\n⚠️  逾期组件 ({len(overdue)}个):")
        for comp in overdue:
            print(f"   {comp.component_id}: {comp.component_name} - 应于{comp.delivery_date}交付")
    
    # 导出状态
    tracker.export_to_json()

if __name__ == "__main__":
    main()