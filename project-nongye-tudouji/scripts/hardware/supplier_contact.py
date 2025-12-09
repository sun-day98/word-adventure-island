#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人供应商联系信息管理
包含主要供应商的联系方式、技术支持和售后服务信息
"""

import json
from dataclasses import dataclass, asdict
from typing import List, Dict
from pathlib import Path

@dataclass
class Supplier:
    """供应商信息数据类"""
    name: str
    category: str  # electronic, mechanical, industrial, international
    contact_person: str
    phone: str
    email: str
    website: str
    address: str
    specialties: List[str]
    support_services: List[str]
    warranty_period: str
    response_time: str
    price_level: str  # low, medium, high
    rating: float  # 1-5
    notes: str = ""

class SupplierManager:
    """供应商管理器"""
    
    def __init__(self):
        self.suppliers = self._load_default_suppliers()
    
    def _load_default_suppliers(self) -> List[Supplier]:
        """加载默认供应商列表"""
        suppliers = [
            # 电子元件供应商
            Supplier(
                name="树莓派官方",
                category="electronic",
                contact_person="李工程师",
                phone="400-888-8888",
                email="support@raspberrypi.org",
                website="https://www.raspberrypi.org",
                address="深圳南山区科技园",
                specialties=["树莓派系列产品", "嵌入式开发板", "配件"],
                support_services=["技术热线", "在线文档", "社区支持"],
                warranty_period="2年",
                response_time="24小时",
                price_level="medium",
                rating=4.5,
                notes="官方正品，技术支持完善"
            ),
            Supplier(
                name="海康威视",
                category="electronic",
                contact_person="王经理",
                phone="0571-88075998",
                email="support@hikvision.com",
                website="https://www.hikvision.com",
                address="杭州市滨江区阡陌路555号",
                specialties=["工业相机", "监控设备", "图像采集卡"],
                support_services=["7x24小时热线", "现场服务", "SDK支持"],
                warranty_period="3年",
                response_time="8小时",
                price_level="high",
                rating=4.8,
                notes="专业视觉设备，质量可靠"
            ),
            Supplier(
                name="大疆创新",
                category="electronic",
                contact_person="张工程师",
                phone="86-755-26656666",
                email="enterprise@dji.com",
                website="https://www.dji.com",
                address="深圳市南山区高新南四道18号创维半导体设计大厦西座",
                specialties=["云台", "飞控系统", "机器人电机"],
                support_services=["技术培训", "定制开发", "售后维修"],
                warranty_period="2年",
                response_time="12小时",
                price_level="high",
                rating=4.7,
                notes="机器人技术领先，产品质量优秀"
            ),
            # 机械部件供应商
            Supplier(
                name="深圳机器人配件厂",
                category="mechanical",
                contact_person="陈厂长",
                phone="0755-88887777",
                email="sales@sz-robot-parts.com",
                website="http://www.sz-robot-parts.com",
                address="深圳市宝安区松岗镇",
                specialties=["机器人底盘", "机械结构件", "定制加工"],
                support_services=["设计支持", "样品制作", "批量生产"],
                warranty_period="1年",
                response_time="24小时",
                price_level="medium",
                rating=4.2,
                notes="定制能力强，性价比高"
            ),
            # 工业设备供应商
            Supplier(
                name="研华科技",
                category="industrial",
                contact_person="刘经理",
                phone="800-810-0335",
                email="china@advantech.com",
                website="https://www.advantech.com.cn",
                address="北京市海淀区上地十街1号院",
                specialties=["工控机", "嵌入式控制器", "工业显示器"],
                support_services=["全国联保", "现场服务", "技术培训"],
                warranty_period="3年",
                response_time="4小时",
                price_level="high",
                rating=4.6,
                notes="工业级产品，稳定性高"
            ),
            Supplier(
                name="汇川技术",
                category="industrial",
                contact_person="赵工程师",
                phone="400-888-8888",
                email="service@inovance.com",
                website="https://www.inovance.com",
                address="苏州市吴中区吴江经济开发区",
                specialties=["伺服电机", "运动控制器", "变频器"],
                support_services=["技术支持", "应用开发", "培训服务"],
                warranty_period="2年",
                response_time="8小时",
                price_level="high",
                rating=4.4,
                notes="伺服技术专业，性能稳定"
            ),
            # 国际供应商
            Supplier(
                name="Pololu Robotics",
                category="international",
                contact_person="International Sales",
                phone="+1-702-262-6648",
                email="sales@pololu.com",
                website="https://www.pololu.com",
                address="9550 Diplomacy St, Las Vegas, NV 89123, USA",
                specialties=["机器人电机", "机械零件", "控制器"],
                support_services=["国际客服", "技术文档", "DHL快递"],
                warranty_period="1年",
                response_time="48小时",
                price_level="medium",
                rating=4.3,
                notes="精密机械零件，适合精密机器人"
            ),
            Supplier(
                name="SparkFun Electronics",
                category="international",
                contact_person="Customer Service",
                phone="+1-303-284-0970",
                email="support@sparkfun.com",
                website="https://www.sparkfun.com",
                address="6175 Longbow Dr, Suite 200, Colorado Springs, CO 80919, USA",
                specialties=["开源硬件", "传感器模块", "开发板"],
                support_services=["技术论坛", "教程资源", "全球配送"],
                warranty_period="90天",
                response_time="72小时",
                price_level="low",
                rating=4.1,
                notes="开源硬件，适合原型开发"
            ),
            # 电池和电源供应商
            Supplier(
                name="宁德时代",
                category="electronic",
                contact_person="周经理",
                phone="0593-8968666",
                email="battery@catl.com",
                website="https://www.catl.com",
                address="福建省宁德市东侨经济技术开发区",
                specialties=["动力电池", "储能电池", "电池管理系统"],
                support_services=["技术支持", "定制开发", "售后维护"],
                warranty_period="5年",
                response_time="12小时",
                price_level="high",
                rating=4.7,
                notes="全球领先的动力电池制造商"
            ),
            # 传感器供应商
            Supplier(
                name="传感器之家",
                category="electronic",
                contact_person="孙工程师",
                phone="400-888-7777",
                email="sales@sensor-home.com",
                website="https://www.sensor-home.com",
                address="上海市浦东新区张江高科技园区",
                specialties=["温湿度传感器", "气体传感器", "压力传感器"],
                support_services=["技术咨询", "样品测试", "批量供货"],
                warranty_period="1年",
                response_time="24小时",
                price_level="medium",
                rating=4.0,
                notes="传感器品种齐全，价格合理"
            )
        ]
        return suppliers
    
    def get_suppliers_by_category(self, category: str) -> List[Supplier]:
        """按类别获取供应商"""
        return [s for s in self.suppliers if s.category == category]
    
    def get_suppliers_by_specialty(self, specialty: str) -> List[Supplier]:
        """按专业领域获取供应商"""
        return [s for s in self.suppliers if specialty in s.specialties]
    
    def get_top_rated_suppliers(self, min_rating: float = 4.5) -> List[Supplier]:
        """获取高评分供应商"""
        return [s for s in self.suppliers if s.rating >= min_rating]
    
    def get_affordable_suppliers(self, max_price_level: str = "medium") -> List[Supplier]:
        """获取价格合适的供应商"""
        price_order = {"low": 1, "medium": 2, "high": 3}
        max_level = price_order.get(max_price_level, 3)
        return [s for s in self.suppliers if price_order.get(s.price_level, 3) <= max_level]
    
    def generate_supplier_report(self) -> str:
        """生成供应商报告"""
        total = len(self.suppliers)
        high_rated = len(self.get_top_rated_suppliers())
        affordable = len(self.get_affordable_suppliers())
        
        report = f"""
🏢 供应商信息报告
{'='*50}
📅 生成日期: {datetime.datetime.now().strftime('%Y-%m-%d')}

📊 供应商统计:
   总数量: {total}
   高评分(≥4.5): {high_rated} ({high_rated/total*100:.1f}%)
   价格合理: {affordable} ({affordable/total*100:.1f}%)

🏷️ 分类统计:
"""
        categories = {}
        for supplier in self.suppliers:
            if supplier.category not in categories:
                categories[supplier.category] = 0
            categories[supplier.category] += 1
        
        for category, count in categories.items():
            report += f"   {category}: {count}家\n"
        
        return report
    
    def export_to_json(self, filename: str = "suppliers.json"):
        """导出供应商信息到JSON文件"""
        data = {
            'export_date': datetime.datetime.now().isoformat(),
            'suppliers': [asdict(supplier) for supplier in self.suppliers]
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已导出供应商信息到 {filename}")
    
    def find_best_supplier(self, requirements: Dict[str, str]) -> List[Supplier]:
        """根据需求找到最佳供应商"""
        matching_suppliers = []
        
        for supplier in self.suppliers:
            score = 0
            # 根据专业匹配评分
            if 'specialty' in requirements:
                specialty = requirements['specialty']
                if specialty in supplier.specialties:
                    score += 3
            
            # 根据价格评分
            if 'price_level' in requirements:
                price_req = requirements['price_level']
                if supplier.price_level == price_req:
                    score += 2
                elif supplier.price_level == 'medium' and price_req in ['low', 'medium']:
                    score += 1
            
            # 根据响应时间评分
            if 'response_time' in requirements:
                response_req = requirements['response_time']
                if supplier.response_time <= response_req:
                    score += 1
            
            # 根据评分加分
            score += supplier.rating
            
            if score > 5:  # 只返回评分较高的供应商
                matching_suppliers.append((score, supplier))
        
        # 按评分排序
        matching_suppliers.sort(key=lambda x: x[0], reverse=True)
        return [supplier for _, supplier in matching_suppliers]

def main():
    """主函数 - 演示使用"""
    import datetime
    
    print("🏢 农业巡检机器人供应商管理系统")
    print("="*50)
    
    # 初始化供应商管理器
    manager = SupplierManager()
    
    # 生成报告
    print(manager.generate_supplier_report())
    
    # 查找高评分供应商
    top_suppliers = manager.get_top_rated_suppliers()
    print(f"\n⭐ 高评分供应商 ({len(top_suppliers)}家):")
    for supplier in top_suppliers:
        print(f"   {supplier.name} - 评分: {supplier.rating} - {supplier.contact_person}")
    
    # 查找专业供应商
    camera_suppliers = manager.get_suppliers_by_specialty("工业相机")
    if camera_suppliers:
        print(f"\n📷 工业相机供应商:")
        for supplier in camera_suppliers:
            print(f"   {supplier.name} - {supplier.phone}")
    
    # 根据需求推荐供应商
    requirements = {
        'specialty': '工控机',
        'price_level': 'medium',
        'response_time': '8小时'
    }
    
    best_suppliers = manager.find_best_supplier(requirements)
    if best_suppliers:
        print(f"\n🎯 根据需求推荐的供应商:")
        for supplier in best_suppliers[:3]:
            print(f"   {supplier.name} - 评分: {supplier.rating} - 价格: {supplier.price_level}")
    
    # 导出信息
    manager.export_to_json()

if __name__ == "__main__":
    main()