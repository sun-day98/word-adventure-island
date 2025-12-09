#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本快速启动脚本
一键配置系统和运行测试
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path

class QuickStart:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.config_dir = self.project_root / "config" / "experimental"
        self.logs_dir = self.project_root / "logs"
        self.logs_dir.mkdir(exist_ok=True)
        
    def print_banner(self):
        """打印启动横幅"""
        print("""
╔══════════════════════════════════════════════════════════════╗
║                🤖 农业巡检机器人实验版本                          ║
║                     快速启动系统 v1.0                          ║
║                                                              ║
║  预算：560元 | 制作时间：2天 | 成功率：95%                    ║
╚══════════════════════════════════════════════════════════════╝
        """)
    
    def check_system(self):
        """检查系统环境"""
        print("🔍 检查系统环境...")
        
        # 检查是否在树莓派上运行
        try:
            with open('/proc/cpuinfo', 'r') as f:
                cpuinfo = f.read()
                if 'BCM2835' in cpuinfo:
                    print("✅ 检测到树莓派平台")
                else:
                    print("⚠️  警告：未检测到树莓派，某些功能可能不可用")
        except:
            print("❌ 无法读取系统信息")
        
        # 检查GPIO权限
        try:
            import RPi.GPIO as GPIO
            print("✅ GPIO库可用")
        except ImportError:
            print("❌ 请先安装RPi.GPIO: pip install RPi.GPIO")
            return False
        except Exception as e:
            print(f"⚠️  GPIO权限可能有问题: {e}")
        
        # 检查摄像头
        try:
            from picamera import PiCamera
            print("✅ 摄像头库可用")
        except ImportError:
            print("❌ 请先安装picamera: pip install picamera")
            return False
        
        return True
    
    def install_dependencies(self):
        """安装依赖包"""
        print("📦 安装依赖包...")
        
        packages = [
            'RPi.GPIO',
            'picamera',
            'opencv-python',
            'numpy',
            'flask',
            'requests'
        ]
        
        for package in packages:
            try:
                __import__(package.replace('-', '_').lower())
                print(f"✅ {package} 已安装")
            except ImportError:
                print(f"⬇️  正在安装 {package}...")
                try:
                    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                    print(f"✅ {package} 安装成功")
                except subprocess.CalledProcessError:
                    print(f"❌ {package} 安装失败")
                    return False
        
        return True
    
    def create_config_files(self):
        """创建配置文件"""
        print("⚙️  创建配置文件...")
        
        # 创建硬件配置
        hardware_config = {
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
            }
        }
        
        config_file = self.config_dir / "hardware_config.json"
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(hardware_config, f, indent=2, ensure_ascii=False)
        print(f"✅ 硬件配置已创建: {config_file}")
        
        # 创建检测参数配置
        detection_config = {
            "color_detection": {
                "plant_lower_hsv": [35, 40, 40],
                "plant_upper_hsv": [85, 255, 255],
                "min_area": 500,
                "max_area": 10000
            },
            "obstacle_detection": {
                "safe_distance": 30,  # cm
                "stop_distance": 20,   # cm
                "backup_distance": 15  # cm
            },
            "patrol": {
                "forward_time": 2.0,   # seconds
                "turn_time": 0.8,      # seconds
                "detect_interval": 1.0  # seconds
            }
        }
        
        detection_file = self.config_dir / "detection_config.json"
        with open(detection_file, 'w', encoding='utf-8') as f:
            json.dump(detection_config, f, indent=2, ensure_ascii=False)
        print(f"✅ 检测配置已创建: {detection_file}")
    
    def run_hardware_test(self):
        """运行硬件测试"""
        print("🧪 运行硬件测试...")
        
        # 测试GPIO
        try:
            import RPi.GPIO as GPIO
            
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(17, GPIO.OUT)
            GPIO.output(17, GPIO.HIGH)
            time.sleep(0.1)
            GPIO.output(17, GPIO.LOW)
            GPIO.cleanup(17)
            print("✅ GPIO测试通过")
        except Exception as e:
            print(f"❌ GPIO测试失败: {e}")
            return False
        
        # 测试摄像头
        try:
            from picamera import PiCamera
            camera = PiCamera()
            camera.start_preview()
            time.sleep(2)
            camera.stop_preview()
            camera.close()
            print("✅ 摄像头测试通过")
        except Exception as e:
            print(f"❌ 摄像头测试失败: {e}")
            print("   请检查摄像头连接和配置")
            return False
        
        return True
    
    def create_startup_scripts(self):
        """创建启动脚本"""
        print("📝 创建启动脚本...")
        
        # 创建主控制脚本
        main_script = """#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 农业巡检机器人主控制脚本

import time
import json
from pathlib import Path

# 导入本地模块
sys.path.append(str(Path(__file__).parent))

try:
    from hardware.motor_control import MotorController
    from hardware.simple_detection import SimpleDetector
    from web.web_control import start_web_server
    
    def main():
        print("🤖 农业巡检机器人启动中...")
        
        # 初始化硬件
        motor = MotorController()
        detector = SimpleDetector()
        
        print("✅ 硬件初始化完成")
        
        # 启动Web服务器（非阻塞）
        import threading
        web_thread = threading.Thread(target=start_web_server, daemon=True)
        web_thread.start()
        
        print("🌐 Web服务器已启动: http://localhost:5000")
        print("🎮 请使用手机或电脑访问控制界面")
        
        # 主循环
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\\n🛑 系统停止...")
            motor.cleanup()
    
    if __name__ == "__main__":
        main()

except ImportError as e:
    print(f"❌ 模块导入失败: {e}")
    print("请确保所有依赖都已正确安装")
"""
        
        script_path = self.project_root / "main.py"
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(main_script)
        script_path.chmod(0o755)
        print(f"✅ 主启动脚本已创建: {script_path}")
        
        # 创建服务启动脚本
        service_script = """#!/bin/bash
# 农业巡检机器人服务启动脚本

echo "🤖 启动农业巡检机器人服务..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装"
    exit 1
fi

# 切换到项目目录
cd "$(dirname "$0")"

# 启动主程序
python3 main.py
"""
        
        service_path = self.project_root / "start.sh"
        with open(service_path, 'w', encoding='utf-8') as f:
            f.write(service_script)
        service_path.chmod(0o755)
        print(f"✅ 服务启动脚本已创建: {service_path}")
    
    def show_usage_guide(self):
        """显示使用指南"""
        print("""
📖 使用指南
═══════════════════════════════════════════════════════════════

🚀 快速启动:
   python3 scripts/experimental/quick_start.py

🎮 Web控制界面:
   http://树莓派IP地址:5000

🧪 功能测试:
   python3 scripts/experimental/hardware_test.py

📱 手机控制:
   1. 确保手机和树莓派在同一WiFi
   2. 打开浏览器访问上述地址
   3. 使用控制按钮操作机器人

🔧 常见问题:
   - 摄像头无法工作: 运行 sudo raspi-config 启用摄像头
   - GPIO权限问题: 使用 sudo 运行程序
   - WiFi连接问题: 检查网络配置

📞 技术支持:
   - 查看完整文档: docs/实验版本快速指南.md
   - GitHub Issues: 提交问题到项目仓库
═══════════════════════════════════════════════════════════════
        """)
    
    def run(self):
        """运行快速启动流程"""
        self.print_banner()
        
        # 检查系统环境
        if not self.check_system():
            print("❌ 系统环境检查失败，请先解决上述问题")
            return False
        
        # 安装依赖
        if not self.install_dependencies():
            print("❌ 依赖安装失败")
            return False
        
        # 创建配置文件
        self.create_config_files()
        
        # 硬件测试
        print("\n" + "="*50)
        print("🧪 硬件测试阶段")
        print("="*50)
        input("请确保硬件已正确连接，按回车继续...")
        
        if not self.run_hardware_test():
            print("❌ 硬件测试失败，请检查连接")
            return False
        
        # 创建启动脚本
        self.create_startup_scripts()
        
        # 显示使用指南
        self.show_usage_guide()
        
        print("🎉 快速启动配置完成！")
        print("💡 提示：运行 './start.sh' 启动机器人")
        
        return True

def main():
    """主函数"""
    quick_start = QuickStart()
    success = quick_start.run()
    
    if success:
        print("\n✅ 配置成功！可以开始使用实验版本了。")
        sys.exit(0)
    else:
        print("\n❌ 配置失败，请检查错误信息后重试。")
        sys.exit(1)

if __name__ == "__main__":
    main()