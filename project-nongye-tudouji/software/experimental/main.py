#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本 - 主程序
整合所有硬件模块，提供统一的启动接口
"""

import sys
import time
import json
import logging
import signal
import threading
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

try:
    from hardware.motor_control import MotorController
    from hardware.simple_detection import SimpleDetector
    from hardware.sensor_manager import SensorManager
    from web.web_control import start_web_server
except ImportError as e:
    print(f"模块导入失败: {e}")
    print("请确保所有依赖已正确安装")
    sys.exit(1)

class AgriculturalRobot:
    """农业巡检机器人类"""
    
    def __init__(self, config_file=None):
        """初始化机器人"""
        self.setup_logging()
        self.load_config(config_file)
        self.setup_hardware()
        self.setup_signal_handlers()
        
        self.logger.info("农业巡检机器人初始化完成")
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('robot.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('AgriculturalRobot')
    
    def load_config(self, config_file):
        """加载配置"""
        if config_file and Path(config_file).exists():
            self.config_file = config_file
            self.logger.info(f"使用配置文件: {config_file}")
        else:
            # 使用默认配置文件
            self.config_file = project_root / "config" / "experimental" / "hardware_config.json"
            if not self.config_file.exists():
                self.create_default_config()
            self.logger.info(f"使用默认配置文件: {self.config_file}")
    
    def create_default_config(self):
        """创建默认配置文件"""
        default_config = {
            "motor_pins": {
                "left_motor_forward": 17,
                "left_motor_backward": 18,
                "right_motor_forward": 22,
                "right_motor_backward": 23
            },
            "sensor_pins": {
                "ultrasonic_trig": 24,
                "ultrasonic_echo": 25,
                "servo": 12
            },
            "camera": {
                "resolution": [640, 480],
                "framerate": 30,
                "rotation": 0
            },
            "power": {
                "battery_voltage": 5.0,
                "low_voltage_threshold": 3.7
            },
            "web": {
                "host": "0.0.0.0",
                "port": 5000
            }
        }
        
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"创建默认配置文件: {self.config_file}")
    
    def setup_hardware(self):
        """设置硬件"""
        try:
            self.logger.info("初始化硬件模块...")
            
            # 初始化电机控制器
            self.motor = MotorController(self.config_file)
            
            # 初始化检测器
            self.detector = SimpleDetector(self.config_file)
            
            # 初始化传感器管理器
            self.sensor = SensorManager(self.config_file)
            
            self.logger.info("所有硬件模块初始化成功")
            
        except Exception as e:
            self.logger.error(f"硬件初始化失败: {e}")
            self.motor = None
            self.detector = None
            self.sensor = None
    
    def setup_signal_handlers(self):
        """设置信号处理器"""
        def signal_handler(signum, frame):
            self.logger.info(f"接收到信号 {signum}，正在关闭...")
            self.shutdown()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def run_self_test(self):
        """运行自检"""
        self.logger.info("开始系统自检...")
        
        test_results = {
            'motor': False,
            'detector': False,
            'sensor': False,
            'overall': False
        }
        
        try:
            # 测试电机
            if self.motor:
                self.logger.info("测试电机...")
                self.motor.forward(1)
                time.sleep(1)
                self.motor.stop()
                test_results['motor'] = True
                self.logger.info("电机测试通过")
            
            # 测试检测器
            if self.detector:
                self.logger.info("测试检测器...")
                success = self.detector.test_detection()
                test_results['detector'] = success
                self.logger.info(f"检测器测试{'通过' if success else '失败'}")
            
            # 测试传感器
            if self.sensor:
                self.logger.info("测试传感器...")
                results = self.sensor.test_sensors()
                test_results['sensor'] = all(result.get('status') == 'pass' for result in results.values() if isinstance(result, dict))
                self.logger.info(f"传感器测试{'通过' if test_results['sensor'] else '失败'}")
            
            # 整体评估
            test_results['overall'] = all([test_results['motor'], test_results['detector'], test_results['sensor']])
            
        except Exception as e:
            self.logger.error(f"自检过程中出错: {e}")
        
        return test_results
    
    def start_autonomous_mode(self):
        """启动自主模式"""
        self.logger.info("启动自主巡检模式...")
        
        def autonomous_loop():
            try:
                while True:
                    # 检测前方障碍
                    distance = self.sensor.measure_distance(3)
                    self.logger.info(f"前方距离: {distance:.1f}cm")
                    
                    if distance < 30:  # 有障碍
                        self.logger.info("检测到障碍，执行避障")
                        self.motor.backward(1)
                        self.motor.right_turn(1)
                    else:
                        # 前进并检测植物
                        self.motor.forward(2)
                        
                        # 检测植物
                        image = self.detector.capture_image()
                        if image is not None:
                            plants, _ = self.detector.detect_green_plants(image)
                            if plants:
                                self.logger.info(f"发现{len(plants)}个植物")
                                # 在这里可以添加更多植物处理逻辑
                        else:
                            self.logger.warning("图像捕获失败")
                    
                    time.sleep(0.5)
                    
            except Exception as e:
                self.logger.error(f"自主循环出错: {e}")
        
        autonomous_thread = threading.Thread(target=autonomous_loop, daemon=True)
        autonomous_thread.start()
        return autonomous_thread
    
    def start_web_interface(self):
        """启动Web界面"""
        self.logger.info("启动Web控制界面...")
        
        # 从配置中读取Web设置
        try:
            with open(self.config_file, 'r') as f:
                config = json.load(f)
                web_config = config.get('web', {})
                host = web_config.get('host', '0.0.0.0')
                port = web_config.get('port', 5000)
        except:
            host = '0.0.0.0'
            port = 5000
        
        self.web_controller = start_web_server(self.config_file, host, port)
        
        # 在单独线程中启动Web服务器
        web_thread = threading.Thread(target=self.web_controller.run, daemon=True)
        web_thread.start()
        
        self.logger.info(f"Web界面已启动: http://{host}:{port}")
        return web_thread
    
    def run_interactive_mode(self):
        """运行交互模式"""
        print("""
🤖 农业巡检机器人 - 交互模式
================================
可用命令:
  test      - 运行自检
  forward   - 前进
  backward  - 后退
  left      - 左转
  right     - 右转
  stop      - 停止
  detect    - 检测植物
  scan      - 扫描环境
  auto      - 启动自主模式
  web       - 启动Web界面
  status    - 显示状态
  quit      - 退出
================================
        """)
        
        while True:
            try:
                command = input("请输入命令: ").strip().lower()
                
                if command == 'quit':
                    break
                elif command == 'test':
                    results = self.run_self_test()
                    print("自检结果:")
                    for module, result in results.items():
                        status = "✅ 通过" if result else "❌ 失败"
                        print(f"  {module}: {status}")
                
                elif command == 'forward':
                    if self.motor:
                        self.motor.forward(1)
                        print("前进完成")
                
                elif command == 'backward':
                    if self.motor:
                        self.motor.backward(1)
                        print("后退完成")
                
                elif command == 'left':
                    if self.motor:
                        self.motor.left_turn(0.5)
                        print("左转完成")
                
                elif command == 'right':
                    if self.motor:
                        self.motor.right_turn(0.5)
                        print("右转完成")
                
                elif command == 'stop':
                    if self.motor:
                        self.motor.stop()
                        print("机器人已停止")
                
                elif command == 'detect':
                    if self.detector:
                        print("正在检测植物...")
                        success = self.detector.test_detection()
                        print(f"检测完成: {'成功' if success else '失败'}")
                
                elif command == 'scan':
                    if self.sensor:
                        print("正在扫描环境...")
                        scan_results = self.sensor.scan_surroundings()
                        print("扫描结果:")
                        for angle, distance in scan_results.items():
                            print(f"  角度{angle}°: {distance:.1f}cm")
                
                elif command == 'auto':
                    self.start_autonomous_mode()
                    print("自主模式已启动")
                
                elif command == 'web':
                    self.start_web_interface()
                    print("Web界面已启动")
                
                elif command == 'status':
                    self.show_status()
                
                else:
                    print(f"未知命令: {command}")
            
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"命令执行出错: {e}")
    
    def show_status(self):
        """显示状态"""
        print("\n🤖 机器人状态")
        print("=" * 40)
        
        if self.motor:
            motor_status = self.motor.get_status()
            print(f"电机状态: {'运行中' if motor_status['is_moving'] else '停止'}")
            print(f"电机引脚: {motor_status['pins']}")
        
        if self.sensor:
            sensor_data = self.sensor.get_sensor_data()
            distance = sensor_data.get('ultrasonic_distance')
            if distance:
                print(f"前方距离: {distance:.1f}cm")
        
        print(f"配置文件: {self.config_file}")
        print("=" * 40)
    
    def shutdown(self):
        """关闭系统"""
        self.logger.info("正在关闭系统...")
        
        try:
            # 停止所有硬件
            if self.motor:
                self.motor.stop()
                self.motor.cleanup()
            
            if self.detector:
                self.detector.cleanup()
            
            if self.sensor:
                self.sensor.cleanup()
            
            if hasattr(self, 'web_controller'):
                self.web_controller.stop()
            
            self.logger.info("系统关闭完成")
            
        except Exception as e:
            self.logger.error(f"关闭过程中出错: {e}")

def main():
    """主函数"""
    print("🤖 农业巡检机器人实验版本")
    print("=" * 50)
    
    # 解析命令行参数
    config_file = None
    mode = "interactive"
    
    if len(sys.argv) > 1:
        if sys.argv[1] in ['interactive', 'auto', 'web', 'test']:
            mode = sys.argv[1]
        else:
            config_file = sys.argv[1]
    
    if len(sys.argv) > 2:
        mode = sys.argv[2]
    
    # 创建机器人实例
    robot = AgriculturalRobot(config_file)
    
    try:
        if mode == 'test':
            # 只运行自检
            print("🔍 运行系统自检...")
            results = robot.run_self_test()
            print("\n自检结果:")
            for module, result in results.items():
                status = "✅ 通过" if result else "❌ 失败"
                print(f"  {module}: {status}")
            
            if results['overall']:
                print("\n🎉 所有模块测试通过，系统可以正常运行！")
            else:
                print("\n⚠️  部分模块测试失败，请检查硬件连接")
        
        elif mode == 'auto':
            # 运行自主模式
            print("🚀 启动自主巡检模式...")
            autonomous_thread = robot.start_autonomous_mode()
            autonomous_thread.join()
        
        elif mode == 'web':
            # 启动Web界面
            print("🌐 启动Web控制界面...")
            web_thread = robot.start_web_interface()
            print(f"访问 http://localhost:5000 进行控制")
            web_thread.join()
        
        else:
            # 交互模式（默认）
            robot.run_interactive_mode()
    
    except KeyboardInterrupt:
        print("\n👋 用户中断，正在退出...")
    except Exception as e:
        print(f"❌ 程序运行出错: {e}")
    finally:
        robot.shutdown()

if __name__ == "__main__":
    main()