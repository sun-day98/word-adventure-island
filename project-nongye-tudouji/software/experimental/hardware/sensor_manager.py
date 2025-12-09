#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本 - 传感器管理模块
管理超声波传感器、舵机等各类传感器
"""

import RPi.GPIO as GPIO
import time
import json
import logging
import threading
import math
from pathlib import Path

class SensorManager:
    """传感器管理器类"""
    
    def __init__(self, config_file=None):
        """初始化传感器管理器"""
        self.setup_logging()
        
        # 加载配置
        if config_file:
            self.load_config(config_file)
        else:
            self.load_default_config()
        
        # 设置GPIO
        GPIO.setmode(GPIO.BCM)
        self.setup_gpio()
        
        # 初始化状态
        self.is_monitoring = False
        self.monitor_thread = None
        self.sensor_data = {}
        
        self.logger.info("传感器管理器初始化完成")
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('SensorManager')
    
    def load_config(self, config_file):
        """加载配置文件"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.pins = config['sensor_pins']
                self.ultrasonic_config = config.get('ultrasonic_config', {})
                self.servo_config = config.get('servo_config', {})
                self.logger.info(f"传感器配置加载成功: {config_file}")
        except Exception as e:
            self.logger.error(f"配置加载失败: {e}")
            self.load_default_config()
    
    def load_default_config(self):
        """加载默认配置"""
        self.pins = {
            'ultrasonic_trig': 24,
            'ultrasonic_echo': 25,
            'servo': 12
        }
        
        self.ultrasonic_config = {
            'max_distance': 400,  # cm
            'timeout': 0.1,       # seconds
            'sound_speed': 34300  # cm/s
        }
        
        self.servo_config = {
            'min_pulse': 500,   # microseconds
            'max_pulse': 2500,   # microseconds
            'frequency': 50,     # Hz
            'angles': {
                0: 500,
                45: 1000,
                90: 1500,
                135: 2000,
                180: 2500
            }
        }
        
        self.logger.info("使用默认传感器配置")
    
    def setup_gpio(self):
        """设置GPIO引脚"""
        try:
            # 设置超声波传感器
            GPIO.setup(self.pins['ultrasonic_trig'], GPIO.OUT)
            GPIO.setup(self.pins['ultrasonic_echo'], GPIO.IN)
            
            # 设置舵机
            GPIO.setup(self.pins['servo'], GPIO.OUT)
            
            # 初始化舵机PWM
            self.servo_pwm = GPIO.PWM(self.pins['servo'], self.servo_config['frequency'])
            self.servo_pwm.start(0)
            
            self.logger.info("GPIO引脚设置完成")
        except Exception as e:
            self.logger.error(f"GPIO设置失败: {e}")
            raise
    
    def measure_distance(self, samples=1):
        """测量距离"""
        distances = []
        
        for _ in range(samples):
            try:
                # 发送超声波脉冲
                GPIO.output(self.pins['ultrasonic_trig'], GPIO.HIGH)
                time.sleep(0.00001)
                GPIO.output(self.pins['ultrasonic_trig'], GPIO.LOW)
                
                # 等待回波开始
                start_time = time.time()
                while GPIO.input(self.pins['ultrasonic_echo']) == 0:
                    start_time = time.time()
                    if time.time() - start_time > self.ultrasonic_config['timeout']:
                        return self.ultrasonic_config['max_distance']
                
                # 等待回波结束
                end_time = time.time()
                while GPIO.input(self.pins['ultrasonic_echo']) == 1:
                    end_time = time.time()
                    if time.time() - end_time > self.ultrasonic_config['timeout']:
                        return self.ultrasonic_config['max_distance']
                
                # 计算距离
                pulse_duration = end_time - start_time
                distance = (pulse_duration * self.ultrasonic_config['sound_speed']) / 2
                
                # 限制范围
                distance = max(0, min(distance, self.ultrasonic_config['max_distance']))
                distances.append(distance)
                
                time.sleep(0.01)  # 短暂延迟
                
            except Exception as e:
                self.logger.error(f"距离测量失败: {e}")
                distances.append(self.ultrasonic_config['max_distance'])
        
        # 返回平均值
        if distances:
            avg_distance = sum(distances) / len(distances)
            self.sensor_data['ultrasonic_distance'] = avg_distance
            return avg_distance
        else:
            return self.ultrasonic_config['max_distance']
    
    def set_servo_angle(self, angle):
        """设置舵机角度"""
        try:
            # 限制角度范围
            angle = max(0, min(180, angle))
            
            # 获取对应的脉宽
            if angle in self.servo_config['angles']:
                pulse_width = self.servo_config['angles'][angle]
            else:
                # 线性插值计算脉宽
                pulse_width = self.servo_config['min_pulse'] + \
                            (angle / 180) * (self.servo_config['max_pulse'] - self.servo_config['min_pulse'])
            
            # 设置PWM占空比
            duty_cycle = (pulse_width / 1000000) * self.servo_config['frequency'] * 100
            self.servo_pwm.ChangeDutyCycle(duty_cycle)
            
            time.sleep(0.5)  # 等待舵机转动到位
            self.servo_pwm.ChangeDutyCycle(0)
            
            self.sensor_data['servo_angle'] = angle
            self.logger.info(f"舵机角度设置为: {angle}度")
            return True
            
        except Exception as e:
            self.logger.error(f"设置舵机角度失败: {e}")
            return False
    
    def scan_surroundings(self, start_angle=0, end_angle=180, step=15):
        """扫描周围环境"""
        self.logger.info(f"开始扫描环境，角度范围: {start_angle}°-{end_angle}°，步长: {step}°")
        
        scan_results = {}
        
        try:
            for angle in range(start_angle, end_angle + 1, step):
                # 设置舵机角度
                self.set_servo_angle(angle)
                time.sleep(0.5)  # 等待稳定
                
                # 测量距离
                distance = self.measure_distance(3)  # 3次测量取平均
                scan_results[angle] = distance
                
                self.logger.info(f"角度{angle}°: 距离{distance:.1f}cm")
            
            # 恢复中心位置
            self.set_servo_angle(90)
            
            self.sensor_data['scan_results'] = scan_results
            return scan_results
            
        except Exception as e:
            self.logger.error(f"环境扫描失败: {e}")
            return {}
    
    def find_safest_direction(self, scan_results=None):
        """找到最安全的方向"""
        if scan_results is None:
            scan_results = self.sensor_data.get('scan_results', {})
        
        if not scan_results:
            return None, 0
        
        # 找到最远的距离和对应角度
        max_distance = -1
        safest_angle = 90  # 默认向前
        
        for angle, distance in scan_results.items():
            if distance > max_distance:
                max_distance = distance
                safest_angle = angle
        
        self.logger.info(f"最安全方向: {safest_angle}°, 距离: {max_distance:.1f}cm")
        return safest_angle, max_distance
    
    def detect_obstacles(self, safe_distance=30):
        """检测障碍物"""
        distances = []
        
        # 测量多个方向的距离
        angles = [0, 45, 90, 135, 180]
        for angle in angles:
            self.set_servo_angle(angle)
            time.sleep(0.3)
            distance = self.measure_distance(2)
            distances.append(distance)
        
        # 恢复中心位置
        self.set_servo_angle(90)
        
        # 分析障碍物
        obstacles = []
        for i, (angle, distance) in enumerate(zip(angles, distances)):
            if distance < safe_distance:
                direction = ['左后', '左', '前', '右', '右后'][i]
                obstacles.append({
                    'direction': direction,
                    'angle': angle,
                    'distance': distance,
                    'severity': 'high' if distance < 15 else 'medium'
                })
        
        self.sensor_data['obstacles'] = obstacles
        return obstacles
    
    def continuous_monitoring(self, interval=0.5, callback=None):
        """连续监测"""
        def monitor():
            self.is_monitoring = True
            self.logger.info(f"开始连续监测，间隔{interval}秒")
            
            while self.is_monitoring:
                try:
                    # 测量前方距离
                    self.set_servo_angle(90)
                    distance = self.measure_distance()
                    
                    # 检测障碍物
                    obstacles = self.detect_obstacles()
                    
                    # 传感器数据
                    sensor_data = {
                        'timestamp': time.time(),
                        'front_distance': distance,
                        'obstacles': obstacles,
                        'battery_voltage': self.read_battery_voltage()
                    }
                    
                    self.sensor_data.update(sensor_data)
                    
                    # 调用回调函数
                    if callback:
                        callback(sensor_data)
                    
                    time.sleep(interval)
                    
                except Exception as e:
                    self.logger.error(f"监测错误: {e}")
                    time.sleep(interval)
        
        if self.monitor_thread is None or not self.monitor_thread.is_alive():
            self.monitor_thread = threading.Thread(target=monitor, daemon=True)
            self.monitor_thread.start()
        else:
            self.logger.warning("监测线程已在运行")
    
    def stop_monitoring(self):
        """停止监测"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
        self.logger.info("监测已停止")
    
    def read_battery_voltage(self):
        """读取电池电压（如果有ADC）"""
        # 这里可以实现电池电压检测
        # 由于实验版本没有专门的ADC，返回模拟值
        return 4.2  # 模拟电压值
    
    def get_sensor_data(self):
        """获取传感器数据"""
        return self.sensor_data.copy()
    
    def test_sensors(self):
        """测试所有传感器"""
        self.logger.info("开始传感器测试...")
        
        test_results = {}
        
        try:
            # 测试超声波传感器
            self.logger.info("测试超声波传感器...")
            distance = self.measure_distance(5)
            test_results['ultrasonic'] = {
                'status': 'pass' if 0 < distance < self.ultrasonic_config['max_distance'] else 'fail',
                'distance': distance
            }
            
            # 测试舵机
            self.logger.info("测试舵机...")
            test_angles = [0, 90, 180, 90]
            servo_test = True
            for angle in test_angles:
                if not self.set_servo_angle(angle):
                    servo_test = False
                    break
                time.sleep(0.5)
            
            test_results['servo'] = {
                'status': 'pass' if servo_test else 'fail',
                'angles_tested': test_angles
            }
            
            # 测试扫描功能
            self.logger.info("测试环境扫描...")
            scan_results = self.scan_surroundings(0, 180, 45)
            test_results['scan'] = {
                'status': 'pass' if len(scan_results) > 0 else 'fail',
                'scan_points': len(scan_results)
            }
            
            self.logger.info("传感器测试完成")
            return test_results
            
        except Exception as e:
            self.logger.error(f"传感器测试失败: {e}")
            return {'error': str(e)}
    
    def cleanup(self):
        """清理资源"""
        try:
            self.stop_monitoring()
            
            if hasattr(self, 'servo_pwm'):
                self.servo_pwm.stop()
            
            GPIO.cleanup()
            self.logger.info("传感器资源已清理")
        except Exception as e:
            self.logger.error(f"清理失败: {e}")
    
    def __del__(self):
        """析构函数"""
        self.cleanup()

# 测试代码
if __name__ == "__main__":
    import sys
    
    config_file = None
    
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    
    sensor = SensorManager(config_file)
    
    try:
        command = input("选择测试模式 (test/scan/monitor/manual): ").strip().lower()
        
        if command == "test":
            results = sensor.test_sensors()
            print("测试结果:")
            for sensor_name, result in results.items():
                print(f"  {sensor_name}: {result}")
        
        elif command == "scan":
            scan_results = sensor.scan_surroundings()
            print("扫描结果:")
            for angle, distance in scan_results.items():
                print(f"  角度{angle}°: {distance:.1f}cm")
        
        elif command == "monitor":
            def sensor_callback(data):
                print(f"前方距离: {data['front_distance']:.1f}cm, "
                      f"障碍物: {len(data['obstacles'])}个")
            
            sensor.continuous_monitoring(callback=sensor_callback)
            input("按回车停止监测...")
            sensor.stop_monitoring()
        
        elif command == "manual":
            while True:
                cmd = input("输入命令 (distance/angle/scan/quit): ").strip().lower()
                
                if cmd == "quit":
                    break
                elif cmd == "distance":
                    distance = sensor.measure_distance(5)
                    print(f"距离: {distance:.1f}cm")
                elif cmd.startswith("angle"):
                    try:
                        angle = int(cmd.split()[1])
                        sensor.set_servo_angle(angle)
                        print(f"舵机角度设置为: {angle}°")
                    except:
                        print("用法: angle <角度>")
                elif cmd == "scan":
                    sensor.scan_surroundings()
                else:
                    print("未知命令")
        
        else:
            print("无效命令")
    
    except KeyboardInterrupt:
        print("\n程序被用户中断")
    finally:
        sensor.cleanup()