"""
农业机器人底盘差速驱动控制模块
支持多种地形适配和路径跟踪功能
"""

import math
import time
import threading
from enum import Enum
from typing import Tuple, Optional

class DriveMode(Enum):
    """驱动模式枚举"""
    MANUAL = "manual"          # 手动控制
    AUTO = "auto"              # 自动导航
    TRACKING = "tracking"       # 路径跟踪
    EMERGENCY_STOP = "emergency_stop"  # 紧急停止

class DifferentialDriveController:
    """差速驱动控制器"""
    
    def __init__(self, config: dict):
        """
        初始化底盘控制器
        
        Args:
            config: 配置参数字典
        """
        self.config = config
        self.wheel_base = config.get('wheel_base', 0.5)  # 轴距 (m)
        self.wheel_radius = config.get('wheel_radius', 0.1)  # 轮径 (m)
        self.max_speed = config.get('max_speed', 1.0)  # 最大速度 (m/s)
        self.max_angular_velocity = config.get('max_angular_velocity', 1.5)  # 最大角速度 (rad/s)
        
        # 状态变量
        self.current_mode = DriveMode.MANUAL
        self.current_pose = {'x': 0.0, 'y': 0.0, 'theta': 0.0}
        self.current_velocity = {'linear': 0.0, 'angular': 0.0}
        self.target_velocity = {'linear': 0.0, 'angular': 0.0}
        
        # 控制参数
        self.kp_linear = 2.0  # 线速度P参数
        self.kp_angular = 3.0  # 角速度P参数
        self.ki_linear = 0.1  # 线速度I参数
        self.ki_angular = 0.2  # 角速度I参数
        
        # PID积分项
        self.error_integral_linear = 0.0
        self.error_integral_angular = 0.0
        
        # 安全参数
        self.emergency_stop_triggered = False
        self.battery_voltage = 24.0  # 假设24V电池
        self.min_battery_voltage = 20.0  # 最低电压
        
        # 电机接口（需要根据实际硬件实现）
        self.left_motor_speed = 0.0
        self.right_motor_speed = 0.0
        
        # 线程锁
        self.lock = threading.Lock()
        
        # 控制线程
        self.control_thread = None
        self.running = True
        
        # 启动控制循环
        self.start_control_loop()
    
    def set_mode(self, mode: DriveMode) -> bool:
        """设置驱动模式"""
        if mode == DriveMode.EMERGENCY_STOP:
            self.emergency_stop()
            return True
        
        with self.lock:
            self.current_mode = mode
            if mode == DriveMode.EMERGENCY_STOP:
                self.target_velocity = {'linear': 0.0, 'angular': 0.0}
        return True
    
    def emergency_stop(self):
        """紧急停止"""
        with self.lock:
            self.emergency_stop_triggered = True
            self.current_mode = DriveMode.EMERGENCY_STOP
            self.target_velocity = {'linear': 0.0, 'angular': 0.0}
            self.left_motor_speed = 0.0
            self.right_motor_speed = 0.0
            self._send_motor_commands(0.0, 0.0)
    
    def set_velocity(self, linear_velocity: float, angular_velocity: float) -> bool:
        """
        设置目标速度
        
        Args:
            linear_velocity: 线速度 (m/s)
            angular_velocity: 角速度 (rad/s)
        
        Returns:
            bool: 设置是否成功
        """
        if self.emergency_stop_triggered:
            return False
        
        if self.current_mode == DriveMode.EMERGENCY_STOP:
            return False
        
        # 速度限制
        linear_velocity = max(-self.max_speed, min(self.max_speed, linear_velocity))
        angular_velocity = max(-self.max_angular_velocity, min(self.max_angular_velocity, angular_velocity))
        
        with self.lock:
            self.target_velocity = {
                'linear': linear_velocity,
                'angular': angular_velocity
            }
        
        return True
    
    def move_to_position(self, target_x: float, target_y: float) -> bool:
        """
        移动到指定位置（简单实现）
        
        Args:
            target_x: 目标X坐标
            target_y: 目标Y坐标
        
        Returns:
            bool: 命令是否成功发送
        """
        # 计算目标角度
        dx = target_x - self.current_pose['x']
        dy = target_y - self.current_pose['y']
        target_angle = math.atan2(dy, dx)
        
        # 计算距离
        distance = math.sqrt(dx**2 + dy**2)
        
        # 角度差
        angle_diff = self._normalize_angle(target_angle - self.current_pose['theta'])
        
        if distance < 0.1:  # 到达目标
            return self.set_velocity(0.0, 0.0)
        
        # 简单控制策略
        if abs(angle_diff) > 0.1:  # 先转向
            return self.set_velocity(0.0, angle_diff)
        else:  # 再前进
            return self.set_velocity(min(distance, self.max_speed), 0.0)
    
    def _normalize_angle(self, angle: float) -> float:
        """角度归一化到[-π, π]"""
        while angle > math.pi:
            angle -= 2 * math.pi
        while angle < -math.pi:
            angle += 2 * math.pi
        return angle
    
    def _inverse_kinematics(self, linear_velocity: float, angular_velocity: float) -> Tuple[float, float]:
        """
        运动学逆解：线速度和角速度转换为左右轮速度
        
        Args:
            linear_velocity: 线速度 (m/s)
            angular_velocity: 角速度 (rad/s)
        
        Returns:
            Tuple[float, float]: (左轮速度, 右轮速度) in rad/s
        """
        # 左轮角速度
        left_angular_velocity = (linear_velocity - angular_velocity * self.wheel_base / 2) / self.wheel_radius
        
        # 右轮角速度
        right_angular_velocity = (linear_velocity + angular_velocity * self.wheel_base / 2) / self.wheel_radius
        
        return left_angular_velocity, right_angular_velocity
    
    def _send_motor_commands(self, left_speed: float, right_speed: float):
        """
        发送电机控制命令（需要根据实际硬件实现）
        
        Args:
            left_speed: 左轮速度 (rad/s)
            right_speed: 右轮速度 (rad/s)
        """
        # 这里应该调用实际的电机驱动接口
        # 例如：通过串口、CAN总线或GPIO控制电机
        
        # 示例实现（伪代码）
        try:
            # 转换为PWM值（-255 到 255）
            max_pwm = 255
            left_pwm = int(max(left_speed / 10, -1) * max_pwm)  # 假设最大10 rad/s
            right_pwm = int(max(right_speed / 10, -1) * max_pwm)
            
            # 发送到电机驱动器
            self._send_to_motor_driver(left_pwm, right_pwm)
            
            self.left_motor_speed = left_speed
            self.right_motor_speed = right_speed
            
        except Exception as e:
            print(f"电机控制错误: {e}")
    
    def _send_to_motor_driver(self, left_pwm: int, right_pwm: int):
        """实际发送PWM信号到电机驱动器（硬件相关）"""
        # 这里需要根据实际硬件实现
        # 可能是：串口通信、I2C、SPI等
        pass
    
    def _update_odometry(self, dt: float):
        """更新里程计"""
        # 根据轮速计算位置变化
        left_linear_velocity = self.left_motor_speed * self.wheel_radius
        right_linear_velocity = self.right_motor_speed * self.wheel_radius
        
        # 线速度和角速度
        linear_velocity = (left_linear_velocity + right_linear_velocity) / 2
        angular_velocity = (right_linear_velocity - left_linear_velocity) / self.wheel_base
        
        # 更新位置
        with self.lock:
            self.current_pose['x'] += linear_velocity * math.cos(self.current_pose['theta']) * dt
            self.current_pose['y'] += linear_velocity * math.sin(self.current_pose['theta']) * dt
            self.current_pose['theta'] += angular_velocity * dt
            self.current_pose['theta'] = self._normalize_angle(self.current_pose['theta'])
            
            self.current_velocity['linear'] = linear_velocity
            self.current_velocity['angular'] = angular_velocity
    
    def _control_loop(self):
        """控制循环线程"""
        last_time = time.time()
        
        while self.running:
            current_time = time.time()
            dt = current_time - last_time
            last_time = current_time
            
            if self.emergency_stop_triggered:
                time.sleep(0.01)
                continue
            
            # 获取目标速度
            with self.lock:
                target_linear = self.target_velocity['linear']
                target_angular = self.target_velocity['angular']
            
            # PID控制
            linear_error = target_linear - self.current_velocity['linear']
            angular_error = target_angular - self.current_velocity['angular']
            
            # 积分项累加
            self.error_integral_linear += linear_error * dt
            self.error_integral_angular += angular_error * dt
            
            # 积分限幅
            integral_limit = 5.0
            self.error_integral_linear = max(-integral_limit, min(integral_limit, self.error_integral_linear))
            self.error_integral_angular = max(-integral_limit, min(integral_limit, self.error_integral_angular))
            
            # PID输出
            linear_output = (self.kp_linear * linear_error + 
                             self.ki_linear * self.error_integral_linear)
            angular_output = (self.kp_angular * angular_error + 
                             self.ki_angular * self.error_integral_angular)
            
            # 运动学逆解
            left_speed, right_speed = self._inverse_kinematics(linear_output, angular_output)
            
            # 发送电机命令
            self._send_motor_commands(left_speed, right_speed)
            
            # 更新里程计
            self._update_odometry(dt)
            
            # 控制周期
            time.sleep(0.02)  # 50Hz
    
    def start_control_loop(self):
        """启动控制循环"""
        if self.control_thread is None or not self.control_thread.is_alive():
            self.control_thread = threading.Thread(target=self._control_loop, daemon=True)
            self.control_thread.start()
    
    def stop_control_loop(self):
        """停止控制循环"""
        self.running = False
        if self.control_thread:
            self.control_thread.join(timeout=1.0)
    
    def get_status(self) -> dict:
        """获取底盘状态"""
        with self.lock:
            return {
                'mode': self.current_mode.value,
                'pose': self.current_pose.copy(),
                'velocity': self.current_velocity.copy(),
                'target_velocity': self.target_velocity.copy(),
                'motor_speeds': {
                    'left': self.left_motor_speed,
                    'right': self.right_motor_speed
                },
                'emergency_stop': self.emergency_stop_triggered,
                'battery_voltage': self.battery_voltage
            }
    
    def reset(self):
        """重置底盘状态"""
        with self.lock:
            self.current_pose = {'x': 0.0, 'y': 0.0, 'theta': 0.0}
            self.current_velocity = {'linear': 0.0, 'angular': 0.0}
            self.target_velocity = {'linear': 0.0, 'angular': 0.0}
            self.error_integral_linear = 0.0
            self.error_integral_angular = 0.0
            self.emergency_stop_triggered = False
            self.current_mode = DriveMode.MANUAL

# 使用示例
if __name__ == "__main__":
    # 配置参数
    config = {
        'wheel_base': 0.5,      # 轴距50cm
        'wheel_radius': 0.1,    # 轮径10cm
        'max_speed': 1.0,        # 最大速度1m/s
        'max_angular_velocity': 1.5  # 最大角速度1.5rad/s
    }
    
    # 创建底盘控制器
    chassis = DifferentialDriveController(config)
    
    try:
        # 测试：前进2秒
        print("开始前进...")
        chassis.set_velocity(0.5, 0.0)  # 前进0.5m/s
        time.sleep(2.0)
        
        # 测试：左转
        print("开始左转...")
        chassis.set_velocity(0.0, 0.5)  # 左转0.5rad/s
        time.sleep(2.0)
        
        # 测试：移动到指定位置
        print("移动到目标位置...")
        chassis.move_to_position(2.0, 1.0)
        time.sleep(3.0)
        
        # 停止
        chassis.set_velocity(0.0, 0.0)
        
    except KeyboardInterrupt:
        print("用户中断")
    
    finally:
        # 紧急停止
        chassis.emergency_stop()
        chassis.stop_control_loop()
        
        # 打印状态
        status = chassis.get_status()
        print(f"最终位置: x={status['pose']['x']:.2f}, y={status['pose']['y']:.2f}, theta={status['pose']['theta']:.2f}")