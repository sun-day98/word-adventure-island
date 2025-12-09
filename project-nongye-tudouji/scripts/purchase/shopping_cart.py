#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人采购助手
一键生成购物清单和价格对比
"""

import webbrowser
import json
import time
from pathlib import Path

class ShoppingAssistant:
    def __init__(self):
        self.items = self._load_items()
        self.total_budget = 560
        self.current_total = 0
        
    def _load_items(self):
        """加载采购项目"""
        return [
            {
                'name': '树莓派 Zero W 套装',
                'search_keyword': '树莓派 Zero W 套装',
                'price': 150,
                'quantity': 1,
                'priority': '🔥🔥🔥',
                'platform': 'taobao',
                'category': '核心控制',
                'alternatives': [
                    {'name': '树莓派 3A+', 'price': 200, 'note': '性能更强'},
                    {'name': 'Orange Pi Zero', 'price': 80, 'note': '性价比高'}
                ]
            },
            {
                'name': 'TT马达+轮子套件',
                'search_keyword': 'TT马达 小车轮子套件',
                'price': 60,
                'quantity': 1,
                'priority': '🔥🔥🔥',
                'platform': 'taobao',
                'category': '移动平台',
                'alternatives': [
                    {'name': 'N20金属齿轮电机', 'price': 80, 'note': '质量更好'},
                    {'name': '减速电机套装', 'price': 120, 'note': '扭矩更大'}
                ]
            },
            {
                'name': '树莓派摄像头 V2',
                'search_keyword': '树莓派摄像头 V2',
                'price': 100,
                'quantity': 1,
                'priority': '🔥🔥🔥',
                'platform': 'taobao',
                'category': '核心控制',
                'alternatives': [
                    {'name': 'USB摄像头', 'price': 50, 'note': '分辨率稍低'},
                    {'name': '奥尼摄像头', 'price': 60, 'note': '兼容性好'}
                ]
            },
            {
                'name': 'SG90舵机',
                'search_keyword': 'SG90舵机 9g',
                'price': 15,
                'quantity': 1,
                'priority': '🔥🔥',
                'platform': 'taobao',
                'category': '传感器',
                'alternatives': [
                    {'name': 'MG90S舵机', 'price': 20, 'note': '金属齿轮'},
                    {'name': 'SG92R舵机', 'price': 18, 'note': '改进版'}
                ]
            },
            {
                'name': 'HC-SR04超声波传感器',
                'search_keyword': 'HC-SR04超声波模块',
                'price': 20,
                'quantity': 1,
                'priority': '🔥🔥',
                'platform': 'taobao',
                'category': '传感器',
                'alternatives': [
                    {'name': 'JSN-SR04T', 'price': 25, 'note': '防水版'},
                    {'name': 'HC-SR04+', 'price': 22, 'note': '改进精度'}
                ]
            },
            {
                'name': '杜邦线+面包板套装',
                'search_keyword': '杜邦线 公母头 40根',
                'price': 35,
                'quantity': 1,
                'priority': '🔥🔥',
                'platform': 'taobao',
                'category': '电子元件',
                'alternatives': [
                    {'name': '面包板套装', 'price': 45, 'note': '更多配件'},
                    {'name': '杜邦线套装', 'price': 30, 'note': '基础版'}
                ]
            },
            {
                'name': '20000mAh移动电源',
                'search_keyword': '罗马仕移动电源 20000mAh',
                'price': 100,
                'quantity': 1,
                'priority': '🔥',
                'platform': 'jd',
                'category': '电源',
                'alternatives': [
                    {'name': '小米移动电源', 'price': 120, 'note': '品质更好'},
                    {'name': 'Anker移动电源', 'price': 150, 'note': '快充版'}
                ]
            },
            {
                'name': '工具套装',
                'search_keyword': '热熔胶枪 20W',
                'price': 40,
                'quantity': 1,
                'priority': '🔥',
                'platform': 'taobao',
                'category': '工具',
                'alternatives': [
                    {'name': '电动螺丝刀', 'price': 80, 'note': '更专业'},
                    {'name': '基础工具套装', 'price': 30, 'note': '最小配置'}
                ]
            }
        ]
    
    def show_summary(self):
        """显示采购清单摘要"""
        print("🛒 农业巡检机器人采购清单")
        print("="*60)
        
        # 计算总价
        self.current_total = sum(item['price'] * item['quantity'] for item in self.items)
        
        print(f"💰 预算总额: ¥{self.total_budget}")
        print(f"💵 当前总价: ¥{self.current_total}")
        print(f"💎 预计节省: ¥{self.total_budget - self.current_total}")
        print(f"📊 项目数量: {len(self.items)} 件")
        print()
        
        # 按优先级分组
        high_priority = [item for item in self.items if '🔥🔥🔥' in item['priority']]
        medium_priority = [item for item in self.items if '🔥🔥' in item['priority']]
        low_priority = [item for item in self.items if '🔥' in item['priority']]
        
        print("🔥 今日必买 (核心件):")
        for item in high_priority:
            print(f"  {item['priority']} {item['name']:<20} ¥{item['price']:>3} x{item['quantity']}")
        
        print(f"\n🔥 今日必买 (传感器):")
        for item in medium_priority:
            print(f"  {item['priority']} {item['name']:<20} ¥{item['price']:>3} x{item['quantity']}")
        
        print(f"\n🔥 今日必买 (配件):")
        for item in low_priority:
            print(f"  {item['priority']} {item['name']:<20} ¥{item['price']:>3} x{item['quantity']}")
    
    def generate_taobao_links(self):
        """生成淘宝搜索链接"""
        print("\n🛍️ 淘宝一键搜索链接:")
        print("="*50)
        
        taobao_items = [item for item in self.items if item['platform'] == 'taobao']
        
        for i, item in enumerate(taobao_items, 1):
            print(f"{i}. 搜索: \"{item['search_keyword']}\"")
            print(f"   价格: ¥{item['price']} | 优先级: {item['priority']}")
            print(f"   直接链接: https://s.taobao.com/search?q={item['search_keyword'].replace(' ', '%20')}")
            print()
    
    def generate_jd_links(self):
        """生成京东搜索链接"""
        print("🛍️ 京东搜索链接:")
        print("="*30)
        
        jd_items = [item for item in self.items if item['platform'] == 'jd']
        
        for item in jd_items:
            print(f"搜索: \"{item['search_keyword']}\"")
            print(f"价格: ¥{item['price']} | 优先级: {item['priority']}")
            print(f"直接链接: https://search.jd.com/Search?keyword={item['search_keyword'].replace(' ', '%20')}")
            print()
    
    def open_browsers(self):
        """在浏览器中打开搜索链接"""
        print("🌐 正在打开搜索链接...")
        
        taobao_items = [item for item in self.items if item['platform'] == 'taobao']
        
        for i, item in enumerate(taobao_items[:3]):  # 只打开前3个最重要的
            url = f"https://s.taobao.com/search?q={item['search_keyword'].replace(' ', '%20')}"
            webbrowser.open(url)
            time.sleep(1)  # 避免同时打开太多标签页
        
        print(f"已打开前3个核心商品的搜索页面")
        print("请在浏览器中完成搜索和购买")
    
    def show_alternatives(self):
        """显示替代方案"""
        print("\n💡 替代方案建议:")
        print("="*40)
        
        for item in self.items:
            if item['alternatives']:
                print(f"\n{item['name']}:")
                for alt in item['alternatives']:
                    price_diff = alt['price'] - item['price']
                    diff_text = f"({price_diff:+d})" if price_diff != 0 else ""
                    print(f"  └── {alt['name']} ¥{alt['price']}{diff_text} - {alt['note']}")
    
    def save_shopping_list(self):
        """保存购物清单到文件"""
        shopping_list = {
            'date': time.strftime('%Y-%m-%d %H:%M:%S'),
            'budget': self.total_budget,
            'total': self.current_total,
            'items': self.items
        }
        
        with open('shopping_list.json', 'w', encoding='utf-8') as f:
            json.dump(shopping_list, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 购物清单已保存到: shopping_list.json")
    
    def create_purchasing_plan(self):
        """创建详细采购计划"""
        plan = f"""
🗓️ 采购执行计划
================

⏰ 时间安排:
上午 (9:00-12:00):
├── 树莓派 Zero W 套装 (¥150)
├── TT马达+轮子套件 (¥60)
└── 树莓派摄像头 V2 (¥100)

下午 (14:00-17:00):
├── SG90舵机 (¥15)
├── HC-SR04超声波 (¥20)
└── 杜邦线+面包板 (¥35)

晚上 (19:00-21:00):
├── 移动电源 (¥100)
└── 工具套装 (¥40)

📱 手机APP操作:
1. 打开淘宝APP
2. 按清单搜索商品
3. 对比价格和评价
4. 加入购物车并付款
5. 确认发货时间

🔍 质量检查:
├── 树莓派：检查主板无划痕，金手指完好
├── 摄像头：镜头无指纹，排线接口完整
├── 电机：转动顺畅，无异响
└── 传感器：引脚无弯曲，标识清晰

📞 紧急联系:
├── 淘宝客服：9:00-23:00
├── 京东客服：9:00-22:00
├── 本地电子城：9:00-18:00
└── 项目技术支持：138-0000-0000

💰 费用跟踪:
├── 预算：¥560
├── 预计花费：¥{self.current_total}
└── 预计节省：¥{self.total_budget - self.current_total}
"""
        return plan
    
    def interactive_mode(self):
        """交互式采购模式"""
        while True:
            print("\n" + "="*50)
            print("🛒 农业巡检机器人采购助手")
            print("="*50)
            print("1. 查看采购清单")
            print("2. 生成搜索链接")
            print("3. 打开浏览器搜索")
            print("4. 查看替代方案")
            print("5. 保存购物清单")
            print("6. 查看采购计划")
            print("7. 退出")
            
            choice = input("\n请选择操作 (1-7): ").strip()
            
            if choice == '1':
                self.show_summary()
            elif choice == '2':
                self.generate_taobao_links()
                self.generate_jd_links()
            elif choice == '3':
                self.open_browsers()
            elif choice == '4':
                self.show_alternatives()
            elif choice == '5':
                self.save_shopping_list()
            elif choice == '6':
                print(self.create_purchasing_plan())
            elif choice == '7':
                print("🎉 采购完成，祝您成功！")
                break
            else:
                print("❌ 无效选择，请重试")

def main():
    """主函数"""
    print("🛒 农业巡检机器人采购助手启动中...")
    
    assistant = ShoppingAssistant()
    
    # 显示摘要
    assistant.show_summary()
    
    # 询问是否进入交互模式
    choice = input("\n是否进入交互式采购模式？(y/n): ").strip().lower()
    
    if choice in ['y', 'yes', '是']:
        assistant.interactive_mode()
    else:
        # 显示核心信息
        print("\n🔥 立即采购核心组件:")
        core_items = [item for item in assistant.items if '🔥🔥🔥' in item['priority']]
        for item in core_items:
            print(f"  搜索: \"{item['search_keyword']}\" - ¥{item['price']}")
        
        print(f"\n💰 总计: ¥{assistant.current_total}")
        print(f"🎯 建议立即下单，明天就能到货！")

if __name__ == "__main__":
    main()