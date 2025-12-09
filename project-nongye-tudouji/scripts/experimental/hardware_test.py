#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本硬件测试脚本
用于验证各硬件组件是否正常工作
"""

import time
import json
import RPi.GPIO as GPIO
from pathlib import Path
import sys

class HardwareTester:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.config_dir = self.project_root / "config" / "experimental"
        self.config = self.load_config()
        GPIO.setmode(GPIO.BCM)
        self.GPIO_pins_used = []
    
    def load_config(self):
        """加载硬件配置"""
        try:
            with open(self.config_dir / "hardware_config.json", 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print("❌ 配置文件不存在，请先运行 quick_start.py")
            return None
    
    def cleanup_gpio(self):
        """清理GPIO"""
        for pin in self.GPIO_pins_used:
            GPIO.cleanup(pin)
        self.GPIO_pins_used.clear()
    
    def test_gpio_output(self, pin, name, duration=1.0):
        """测试GPIO输出"""
        print(f"🔌 测试 {name} (GPIO {pin})...")
        
        try:
            GPIO.setup(pin, GPIO.OUT)
            self.GPIO_pins_used.append(pin)
            
            GPIO.output(pin, GPIO.HIGH)
            print(f"   💡 {name} 开启 (高电平)")
            time.sleep(duration / 2)
            
            GPIO.output(pin, GPIO.LOW)
            print(f"   🔌 {name} 关闭 (低电平)")
            time.sleep(duration / 2)
            
            print(f"   ✅ {name} 测试通过")
            return True
            
        except Exception as e:
            print(f"   ❌ {name} 测试失败: {e}")
            return False
    
    def test_gpio_input(self, pin, name):
        """测试GPIO输入"""
        print(f"📡 测试 {name} 输入 (GPIO {pin})...")
        
        try:
            GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
            self.GPIO_pins_used.append(pin)
            
            initial_state = GPIO.input(pin)
            print(f"   📊 初始状态: {'高' if initial_state else '低'}")
            
            print(f"   🙏 请手动触发 {name} (连接3.3V)")
            input("   按回车键继续...")
            
            final_state = GPIO.input(pin)
            print(f"   📊 触发后状态: {'高' if final_state else '低'}")
            
            if final_state != initial_state:
                print(f"   ✅ {name} 输入测试通过")
                return True
            else:
                print(f"   ⚠️  {name} 状态未改变，请检查连接")
                return False
                
        except Exception as e:
            print(f"   ❌ {name} 输入测试失败: {e}")
            return False
    
    def test_motors(self):
        """测试电机控制"""
        print("\n🚗 测试电机系统")
        print("="*50)
        
        if not self.config:
            print("❌ 无法加载电机配置")
            return False
        
        motor_pins = self.config['motor_pins']
        
        # 测试左电机
        print("\n🔧 测试左电机...")
        left_forward = motor_pins['left_motor_forward']
        left_backward = motor_pins['left_motor_backward']
        
        # 正转测试
        print("   ⬆️  左电机正转测试 (应该向前转动)")
        GPIO.setup(left_forward, GPIO.OUT)
        GPIO.setup(left_backward, GPIO.OUT)
        self.GPIO_pins_used.extend([left_forward, left_backward])
        
        GPIO.output(left_forward, GPIO.HIGH)
        GPIO.output(left_backward, GPIO.LOW)
        time.sleep(2)
        
        GPIO.output(left_forward, GPIO.LOW)
        GPIO.output(left_backward, GPIO.LOW)
        time.sleep(1)
        
        # 反转测试
        print("   ⬇️  左电机反转测试 (应该向后转动)")
        GPIO.output(left_forward, GPIO.LOW)
        GPIO.output(left_backward, GPIO.HIGH)
        time.sleep(2)
        
        GPIO.output(left_forward, GPIO.LOW)
        GPIO.output(left_backward, GPIO.LOW)
        print("   ✅ 左电机测试完成")
        
        # 测试右电机
        print("\n🔧 测试右电机...")
        right_forward = motor_pins['right_motor_forward']
        right_backward = motor_pins['right_motor_backward']
        
        GPIO.setup(right_forward, GPIO.OUT)
        GPIO.setup(right_backward, GPIO.OUT)
        self.GPIO_pins_used.extend([right_forward, right_backward])
        
        # 正转测试
        print("   ⬆️  右电机正转测试 (应该向前转动)")
        GPIO.output(right_forward, GPIO.HIGH)
        GPIO.output(right_backward, GPIO.LOW)
        time.sleep(2)
        
        GPIO.output(right_forward, GPIO.LOW)
        GPIO.output(right_backward, GPIO.LOW)
        time.sleep(1)
        
        # 反转测试
        print("   ⬇️  右电机反转测试 (应该向后转动)")
        GPIO.output(right_forward, GPIO.LOW)
        GPIO.output(right_backward, GPIO.HIGH)
        time.sleep(2)
        
        GPIO.output(right_forward, GPIO.LOW)
        GPIO.output(right_backward, GPIO.LOW)
        print("   ✅ 右电机测试完成")
        
        return True
    
    def test_camera(self):
        """测试摄像头"""
        print("\n📷 测试摄像头")
        print("="*50)
        
        try:
            from picamera import PiCamera
            
            print("   📸 初始化摄像头...")
            camera = PiCamera()
            camera.resolution = tuple(self.config['camera']['resolution'])
            
            print("   🔍 预览测试 (5秒)")
            camera.start_preview()
            time.sleep(5)
            camera.stop_preview()
            
            print("   📸 拍照测试...")
            camera.capture('/tmp/test_photo.jpg')
            print("   💾 照片已保存到 /tmp/test_photo.jpg")
            
            print("   🎥 录制视频测试 (3秒)")
            camera.start_recording('/tmp/test_video.h264')
            time.sleep(3)
            camera.stop_recording()
            print("   💾 视频已保存到 /tmp/test_video.h264")
            
            camera.close()
            print("   ✅ 摄像头测试通过")
            return True
            
        except ImportError:
            print("   ❌ 无法导入picamera库，请安装: pip install picamera")
            return False
        except Exception as e:
            print(f"   ❌ 摄像头测试失败: {e}")
            print("   💡 请检查:")
            print("      1. 摄像头排线是否松动")
            print("      2. 运行 sudo raspi-config 启用摄像头")
            print("      3. 重启系统后重试")
            return False
    
    def test_ultrasonic(self):
        """测试超声波传感器"""
        print("\n📡 测试超声波传感器")
        print("="*50)
        
        sensor_pins = self.config['sensor_pins']
        trig_pin = sensor_pins['ultrasonic_trig']
        echo_pin = sensor_pins['ultrasonic_echo']
        
        try:
            GPIO.setup(trig_pin, GPIO.OUT)
            GPIO.setup(echo_pin, GPIO.IN)
            self.GPIO_pins_used.extend([trig_pin, echo_pin])
            
            print("   📏 测距测试 (10次)")
            
            distances = []
            for i in range(10):
                # 发送超声波脉冲
                GPIO.output(trig_pin, GPIO.HIGH)
                time.sleep(0.00001)
                GPIO.output(trig_pin, GPIO.LOW)
                
                # 等待回波
                start_time = time.time()
                while GPIO.input(echo_pin) == 0:
                    start_time = time.time()
                
                while GPIO.input(echo_pin) == 1:
                    end_time = time.time()
                
                # 计算距离
                distance = (end_time - start_time) * 17150
                distances.append(distance)
                
                print(f"   测量 {i+1}: {distance:.2f}cm")
                time.sleep(0.5)
            
            # 计算平均值
            avg_distance = sum(distances) / len(distances)
            max_distance = max(distances)
            min_distance = min(distances)
            
            print(f"   📊 测量结果:")
            print(f"      平均距离: {avg_distance:.2f}cm")
            print(f"      最大距离: {max_distance:.2f}cm")
            print(f"      最小距离: {min_distance:.2f}cm")
            
            # 检查测量是否合理
            if 2 <= avg_distance <= 400:
                print("   ✅ 超声波传感器测试通过")
                return True
            else:
                print("   ⚠️  测量值异常，请检查传感器连接")
                return False
                
        except Exception as e:
            print(f"   ❌ 超声波传感器测试失败: {e}")
            return False
    
    def test_servo(self):
        """测试舵机"""
        print("\n⚙️  测试舵机")
        print("="*50)
        
        try:
            import RPi.GPIO as GPIO
            servo_pin = self.config['sensor_pins']['servo']
            
            # 设置舵机PWM
            GPIO.setup(servo_pin, GPIO.OUT)
            self.GPIO_pins_used.append(servo_pin)
            pwm = GPIO.PWM(servo_pin, 50)  # 50Hz
            pwm.start(0)
            
            print("   🔄 舵机角度测试")
            
            # 测试不同角度
            angles = [
                (0,   2.5,   "0度位置"),
                (45,  5.0,   "45度位置"),
                (90,  7.5,   "90度位置"),
                (135, 10.0,  "135度位置"),
                (180, 12.5,  "180度位置")
            ]
            
            for angle, duty_cycle, description in angles:
                print(f"   🎯 {description}")
                pwm.ChangeDutyCycle(duty_cycle)
                time.sleep(1.5)
            
            # 回到中心位置
            print("   🎯 回到中心位置 (90度)")
            pwm.ChangeDutyCycle(7.5)
            time.sleep(1)
            pwm.ChangeDutyCycle(0)
            
            print("   ✅ 舵机测试通过")
            return True
            
        except Exception as e:
            print(f"   ❌ 舵机测试失败: {e}")
            print("   💡 请检查:")
            print("      1. 舵机接线是否正确 (信号线->GPIO, 电源线->5V, 地线->GND)")
            print("      2. 舵机电源是否充足")
            return False
    
    def test_power_system(self):
        """测试电源系统"""
        print("\n🔋 测试电源系统")
        print("="*50)
        
        try:
            # 检查电池电压（如果有模拟输入）
            print("   🔌 检查电源连接...")
            
            # 检查系统电压
            with open('/sys/class/power_supply/bat/voltage_now', 'r') if Path('/sys/class/power_supply/bat/voltage_now').exists() else None:
                voltage = None
            
            if voltage:
                voltage_v = int(voltage.read().strip()) / 1000000
                print(f"   📊 系统电压: {voltage_v:.2f}V")
                
                if voltage_v >= 3.7:
                    print("   ✅ 电压正常")
                else:
                    print("   ⚠️  电压偏低，建议充电")
            else:
                print("   ℹ️  无法读取电压信息")
            
            # 测试系统负载
            print("   💻 系统负载检查...")
            
            # CPU温度
            try:
                with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                    temp = int(f.read().strip()) / 1000
                    print(f"   🌡️  CPU温度: {temp}°C")
                    
                    if temp < 70:
                        print("   ✅ 温度正常")
                    elif temp < 80:
                        print("   ⚠️  温度偏高，建议散热")
                    else:
                        print("   ❌ 温度过高，请立即降温")
            except:
                print("   ℹ️  无法读取CPU温度")
            
            print("   ✅ 电源系统检查完成")
            return True
            
        except Exception as e:
            print(f"   ❌ 电源系统测试失败: {e}")
            return False
    
    def run_full_test(self):
        """运行完整测试"""
        print("🧪 农业巡检机器人硬件全面测试")
        print("="*60)
        
        if not self.config:
            print("❌ 无法加载配置文件")
            return False
        
        test_results = {}
        
        # 运行各项测试
        test_functions = [
            ("电机系统", self.test_motors),
            ("摄像头", self.test_camera),
            ("超声波传感器", self.test_ultrasonic),
            ("舵机", self.test_servo),
            ("电源系统", self.test_power_system)
        ]
        
        for test_name, test_func in test_functions:
            try:
                print(f"\n🔄 开始测试 {test_name}...")
                result = test_func()
                test_results[test_name] = result
                self.cleanup_gpio()
                time.sleep(1)  # 测试间隔
                
            except KeyboardInterrupt:
                print(f"\n⚠️  测试被用户中断")
                break
            except Exception as e:
                print(f"❌ {test_name} 测试出现异常: {e}")
                test_results[test_name] = False
        
        # 显示测试结果
        self.show_test_summary(test_results)
        
        return test_results
    
    def show_test_summary(self, results):
        """显示测试结果摘要"""
        print("\n" + "="*60)
        print("📊 测试结果摘要")
        print("="*60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results.items():
            status = "✅ 通过" if result else "❌ 失败"
            print(f"{test_name:15} : {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print("-" * 60)
        print(f"总计: {len(results)} 项测试")
        print(f"通过: {passed} 项")
        print(f"失败: {failed} 项")
        
        success_rate = (passed / len(results)) * 100 if results else 0
        print(f"成功率: {success_rate:.1f}%")
        
        # 给出建议
        if success_rate >= 80:
            print("\n🎉 硬件测试基本通过，可以开始使用实验版本！")
            if failed > 0:
                print("💡 建议先修复失败的测试项以获得最佳体验")
        elif success_rate >= 60:
            print("\n⚠️  部分硬件有问题，建议先修复再使用")
        else:
            print("\n❌ 硬件问题较多，建议检查连接和配置后重试")
        
        # 清理
        self.cleanup_gpio()
    
    def __del__(self):
        """析构函数，清理资源"""
        self.cleanup_gpio()

def main():
    """主函数"""
    print("🧪 农业巡检机器人硬件测试程序")
    print("="*50)
    
    if len(sys.argv) > 1:
        test_type = sys.argv[1].lower()
        tester = HardwareTester()
        
        if test_type == "motor":
            tester.test_motors()
        elif test_type == "camera":
            tester.test_camera()
        elif test_type == "ultrasonic":
            tester.test_ultrasonic()
        elif test_type == "servo":
            tester.test_servo()
        elif test_type == "power":
            tester.test_power_system()
        else:
            print(f"未知测试类型: {test_type}")
            print("可用测试: motor, camera, ultrasonic, servo, power")
    else:
        # 运行完整测试
        tester = HardwareTester()
        tester.run_full_test()

if __name__ == "__main__":
    main()