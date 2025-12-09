#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本 - 电机控制模块
控制TT马达实现前进、后退、转向等基础移动功能
"""

import RPi.GPIO as GPIO
import time
import json
import logging
from pathlib import Path

class MotorController:
    """电机控制器类"""
    
    def __init__(self, config_file=None):
        """初始化电机控制器"""
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
        self.is_moving = False
        self.current_speed = 100  # PWM占空比 0-100
        self.logger.info("电机控制器初始化完成")
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('MotorController')
    
    def load_config(self, config_file):
        """加载配置文件"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.pins = config['motor_pins']
                self.logger.info(f"配置加载成功: {config_file}")
        except Exception as e:
            self.logger.error(f"配置加载失败: {e}")
            self.load_default_config()
    
    def load_default_config(self):
        """加载默认配置"""
        self.pins = {
            'left_motor_forward': 17,
            'left_motor_backward': 18,
            'right_motor_forward': 22,
            'right_motor_backward': 23
        }
        self.logger.info("使用默认配置")
    
    def setup_gpio(self):
        """设置GPIO引脚"""
        try:
            for pin_name, pin_num in self.pins.items():
                GPIO.setup(pin_num, GPIO.OUT)
                GPIO.output(pin_num, GPIO.LOW)
                self.logger.info(f"GPIO {pin_num} ({pin_name}) 设置完成")
        except Exception as e:
            self.logger.error(f"GPIO设置失败: {e}")
            raise
    
    def stop(self):
        """停止所有电机"""
        try:
            for pin_num in self.pins.values():
                GPIO.output(pin_num, GPIO.LOW)
            self.is_moving = False
            self.logger.info("电机已停止")
            return True
        except Exception as e:
            self.logger.error(f"停止失败: {e}")
            return False
    
    def forward(self, duration=None):
        """前进"""
        try:
            # 左电机正转
            GPIO.output(self.pins['left_motor_forward'], GPIO.HIGH)
            GPIO.output(self.pins['left_motor_backward'], GPIO.LOW)
            
            # 右电机正转
            GPIO.output(self.pins['right_motor_forward'], GPIO.HIGH)
            GPIO.output(self.pins['right_motor_backward'], GPIO.LOW)
            
            self.is_moving = True
            self.logger.info("机器人开始前进")
            
            if duration:
                time.sleep(duration)
                self.stop()
            
            return True
        except Exception as e:
            self.logger.error(f"前进失败: {e}")
            return False
    
    def backward(self, duration=None):
        """后退"""
        try:
            # 左电机反转
            GPIO.output(self.pins['left_motor_forward'], GPIO.LOW)
            GPIO.output(self.pins['left_motor_backward'], GPIO.HIGH)
            
            # 右电机反转
            GPIO.output(self.pins['right_motor_forward'], GPIO.LOW)
            GPIO.output(self.pins['right_motor_backward'], GPIO.HIGH)
            
            self.is_moving = True
            self.logger.info("机器人开始后退")
            
            if duration:
                time.sleep(duration)
                self.stop()
            
            return True
        except Exception as e:
            self.logger.error(f"后退失败: {e}")
            return False
    
    def left_turn(self, duration=None):
        """左转"""
        try:
            # 左电机停止，右电机正转
            GPIO.output(self.pins['left_motor_forward'], GPIO.LOW)
            GPIO.output(self.pins['left_motor_backward'], GPIO.LOW)
            
            GPIO.output(self.pins['right_motor_forward'], GPIO.HIGH)
            GPIO.output(self.pins['right_motor_backward'], GPIO.LOW)
            
            self.is_moving = True
            self.logger.info("机器人开始左转")
            
            if duration:
                time.sleep(duration)
                self.stop()
            
            return True
        except Exception as e:
            self.logger.error(f"左转失败: {e}")
            return False
    
    def right_turn(self, duration=None):
        """右转"""
        try:
            # 左电机正转，右电机停止
            GPIO.output(self.pins['left_motor_forward'], GPIO.HIGH)
            GPIO.output(self.pins['left_motor_backward'], GPIO.LOW)
            
            GPIO.output(self.pins['right_motor_forward'], GPIO.LOW)
            GPIO.output(self.pins['right_motor_backward'], GPIO.LOW)
            
            self.is_moving = True
            self.logger.info("机器人开始右转")
            
            if duration:
                time.sleep(duration)
                self.stop()
            
            return True
        except Exception as e:
            self.logger.error(f"右转失败: {e}")
            return False
    
    def spin_left(self, duration=None):
        """原地左转"""
        try:
            # 左电机反转，右电机正转
            GPIO.output(self.pins['left_motor_forward'], GPIO.LOW)
            GPIO.output(self.pins['left_motor_backward'], GPIO.HIGH)
            
            GPIO.output(self.pins['right_motor_forward'], GPIO.HIGH)
            GPIO.output(self.pins['right_motor_backward'], GPIO.LOW)
            
            self.is_moving = True
            self.logger.info("机器人开始原地左转")
            
            if duration:
                time.sleep(duration)
                self.stop()
            
            return True
        except Exception as e:
            self.logger.error(f"原地左转失败: {e}")
            return False
    
    def spin_right(self, duration=None):
        """原地右转"""
        try:
            # 左电机正转，右电机反转
            GPIO.output(self.pins['left_motor_forward'], GPIO.HIGH)
            GPIO.output(self.pins['left_motor_backward'], GPIO.LOW)
            
            GPIO.output(self.pins['right_motor_forward'], GPIO.LOW)
            GPIO.output(self.pins['right_motor_backward'], GPIO.HIGH)
            
            self.is_moving = True
            self.logger.info("机器人开始原地右转")
            
            if duration:
                time.sleep(duration)
                self.stop()
            
            return True
        except Exception as e:
            self.logger.error(f"原地右转失败: {e}")
            return False
    
    def move_with_direction(self, direction, duration=1.0):
        """根据方向移动"""
        direction_map = {
            'forward': self.forward,
            'backward': self.backward,
            'left': self.left_turn,
            'right': self.right_turn,
            'spin_left': self.spin_left,
            'spin_right': self.spin_right,
            'stop': self.stop
        }
        
        if direction in direction_map:
            return direction_map[direction](duration)
        else:
            self.logger.error(f"未知方向: {direction}")
            return False
    
    def get_status(self):
        """获取当前状态"""
        return {
            'is_moving': self.is_moving,
            'current_speed': self.current_speed,
            'pins': self.pins
        }
    
    def test_motors(self):
        """测试所有电机"""
        self.logger.info("开始电机测试...")
        
        try:
            # 前进测试
            self.logger.info("测试前进...")
            self.forward(2)
            time.sleep(1)
            
            # 后退测试
            self.logger.info("测试后退...")
            self.backward(2)
            time.sleep(1)
            
            # 左转测试
            self.logger.info("测试左转...")
            self.left_turn(1)
            time.sleep(1)
            
            # 右转测试
            self.logger.info("测试右转...")
            self.right_turn(1)
            time.sleep(1)
            
            self.logger.info("电机测试完成")
            return True
            
        except Exception as e:
            self.logger.error(f"电机测试失败: {e}")
            return False
    
    def cleanup(self):
        """清理GPIO资源"""
        try:
            self.stop()
            GPIO.cleanup()
            self.logger.info("GPIO资源已清理")
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
    
    motor = MotorController(config_file)
    
    try:
        # 交互式测试
        print("电机控制器测试模式")
        print("可用命令: forward, backward, left, right, spin_left, spin_right, stop, test, quit")
        
        while True:
            cmd = input("请输入命令: ").strip().lower()
            
            if cmd == 'quit':
                break
            elif cmd == 'test':
                motor.test_motors()
            elif cmd in ['forward', 'backward', 'left', 'right', 'spin_left', 'spin_right']:
                motor.move_with_direction(cmd, 1)
            elif cmd == 'stop':
                motor.stop()
            else:
                print(f"未知命令: {cmd}")
        
    except KeyboardInterrupt:
        print("\n程序被用户中断")
    finally:
        motor.cleanup()