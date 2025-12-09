"""
农业机器人执行机构管理器
包括水泵、滑台、机械臂等设备的控制
"""

import time
import threading
from enum import Enum
from typing import Dict, List, Optional, Tuple
import json

class ActuatorType(Enum):
    """执行机构类型枚举"""
    WATER_PUMP = "water_pump"        # 水泵
    SLIDING_RAIL = "sliding_rail"    # 滑台
    MECHANICAL_ARM = "mechanical_arm" # 机械臂
    VALVE = "valve"                  # 阀门
    FAN = "fan"                      # 风扇
    LED = "led"                      # LED灯
    SPRAYER = "sprayer"              # 喷雾器

class ActuatorStatus(Enum):
    """执行机构状态枚举"""
    IDLE = "idle"                    # 空闲
    RUNNING = "running"              # 运行中
    ERROR = "error"                  # 错误
    MAINTENANCE = "maintenance"      # 维护中
    DISABLED = "disabled"            # 禁用

class BaseActuator:
    """执行机构基类"""
    
    def __init__(self, config: dict):
        """
        初始化执行机构
        
        Args:
            config: 配置参数字典
        """
        self.id = config.get('id', 'unknown')
        self.name = config.get('name', 'Unknown Actuator')
        self.type = config.get('type', 'unknown')
        self.status = ActuatorStatus.IDLE
        
        # 物理参数
        self.position = config.get('position', [0, 0, 0])  # [x, y, z] 位置
        self.power_consumption = config.get('power_consumption', 0)  # 功耗(W)
        self.max_load = config.get('max_load', 0)  # 最大负载
        
        # 控制参数
        self.enabled = config.get('enabled', True)
        self.auto_shutdown_time = config.get('auto_shutdown_time', 300)  # 自动关机时间(秒)
        
        # 运行状态
        self.running_time = 0
        self.total_runtime = 0
        self.last_start_time = 0
        self.error_message = ""
        
        # 传感器接口
        self.has_feedback = config.get('has_feedback', False)
        self.sensor_value = 0
        
        # 线程锁
        self.lock = threading.Lock()
    
    def enable(self) -> bool:
        """启用执行机构"""
        with self.lock:
            if self.status == ActuatorStatus.ERROR:
                return False
            self.enabled = True
            return True
    
    def disable(self) -> bool:
        """禁用执行机构"""
        with self.lock:
            self.stop()
            self.enabled = False
            self.status = ActuatorStatus.DISABLED
            return True
    
    def start(self) -> bool:
        """启动执行机构"""
        with self.lock:
            if not self.enabled:
                return False
            
            if self.status != ActuatorStatus.IDLE:
                return False
            
            if not self._start_hardware():
                self.status = ActuatorStatus.ERROR
                return False
            
            self.status = ActuatorStatus.RUNNING
            self.last_start_time = time.time()
            return True
    
    def stop(self) -> bool:
        """停止执行机构"""
        with self.lock:
            if self.status != ActuatorStatus.RUNNING:
                return False
            
            if not self._stop_hardware():
                self.status = ActuatorStatus.ERROR
                return False
            
            # 更新运行时间
            if self.last_start_time > 0:
                run_time = time.time() - self.last_start_time
                self.running_time = run_time
                self.total_runtime += run_time
                self.last_start_time = 0
            
            self.status = ActuatorStatus.IDLE
            return True
    
    def _start_hardware(self) -> bool:
        """启动硬件（子类实现）"""
        return True
    
    def _stop_hardware(self) -> bool:
        """停止硬件（子类实现）"""
        return True
    
    def get_status(self) -> Dict:
        """获取执行机构状态"""
        with self.lock:
            return {
                'id': self.id,
                'name': self.name,
                'type': self.type,
                'status': self.status.value,
                'enabled': self.enabled,
                'position': self.position,
                'running_time': self.running_time,
                'total_runtime': self.total_runtime,
                'power_consumption': self.power_consumption,
                'sensor_value': self.sensor_value,
                'error_message': self.error_message
            }

class WaterPump(BaseActuator):
    """水泵控制器"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.type = ActuatorType.WATER_PUMP.value
        
        # 水泵参数
        self.max_flow_rate = config.get('max_flow_rate', 2.0)  # 最大流量(L/min)
        self.current_flow_rate = 0.0
        self.pressure = 0.0  # 当前压力(bar)
        
        # 控制接口
        self.pwm_pin = config.get('pwm_pin', 18)  # PWM控制引脚
        self.sensor_pin = config.get('sensor_pin', 4)  # 流量传感器引脚
        
        # 阀门控制
        self.has_valve = config.get('has_valve', False)
        self.valve_open = False
        
    def _start_hardware(self) -> bool:
        """启动水泵"""
        try:
            # 打开阀门
            if self.has_valve:
                self._open_valve()
            
            # 设置PWM输出
            self._set_pwm(50)  # 默认50%功率启动
            
            # 启动流量监控
            if self.has_feedback:
                self._start_flow_monitoring()
            
            return True
        except Exception as e:
            self.error_message = f"启动失败: {e}"
            return False
    
    def _stop_hardware(self) -> bool:
        """停止水泵"""
        try:
            # 关闭PWM输出
            self._set_pwm(0)
            
            # 关闭阀门
            if self.has_valve:
                self._close_valve()
            
            # 停止流量监控
            if self.has_feedback:
                self._stop_flow_monitoring()
            
            self.current_flow_rate = 0.0
            self.pressure = 0.0
            return True
        except Exception as e:
            self.error_message = f"停止失败: {e}"
            return False
    
    def set_flow_rate(self, flow_rate: float) -> bool:
        """
        设置流量
        
        Args:
            flow_rate: 目标流量 (L/min)
        
        Returns:
            bool: 设置是否成功
        """
        if not self.enabled or self.status != ActuatorStatus.RUNNING:
            return False
        
        # 限制流量范围
        flow_rate = max(0, min(self.max_flow_rate, flow_rate))
        
        # 计算PWM值 (线性映射)
        pwm_value = int((flow_rate / self.max_flow_rate) * 100)
        
        # 设置PWM
        self._set_pwm(pwm_value)
        self.current_flow_rate = flow_rate
        
        return True
    
    def _set_pwm(self, value: int):
        """设置PWM值（硬件相关）"""
        # 这里需要根据实际硬件实现PWM控制
        # 例如：通过GPIO、串口、I2C等接口
        pass
    
    def _open_valve(self):
        """打开阀门"""
        self.valve_open = True
        # 控制阀门的硬件接口
        pass
    
    def _close_valve(self):
        """关闭阀门"""
        self.valve_open = False
        # 控制阀门的硬件接口
        pass
    
    def _start_flow_monitoring(self):
        """启动流量监控"""
        pass
    
    def _stop_flow_monitoring(self):
        """停止流量监控"""
        pass

class SlidingRail(BaseActuator):
    """滑台控制器"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.type = ActuatorType.SLIDING_RAIL.value
        
        # 滑台参数
        self.max_length = config.get('max_length', 1000)  # 最大行程(mm)
        self.max_speed = config.get('max_speed', 100)  # 最大速度(mm/s)
        self.current_position = 0.0  # 当前位置(mm)
        self.target_position = 0.0  # 目标位置(mm)
        
        # 电机参数
        self.step_per_mm = config.get('step_per_mm', 100)  # 每毫米步数
        self.enable_pin = config.get('enable_pin', 27)
        self.direction_pin = config.get('direction_pin', 17)
        self.step_pin = config.get('step_pin', 22)
        self.limit_switch_pin = config.get('limit_switch_pin', 23)
        
        # 运动状态
        self.is_moving = False
        self.homing_required = True
        
    def _start_hardware(self) -> bool:
        """启动滑台"""
        try:
            # 使能电机
            self._enable_motor()
            
            # 如果需要回零
            if self.homing_required:
                if not self._home():
                    return False
            
            return True
        except Exception as e:
            self.error_message = f"启动失败: {e}"
            return False
    
    def _stop_hardware(self) -> bool:
        """停止滑台"""
        try:
            # 失能电机
            self._disable_motor()
            self.is_moving = False
            return True
        except Exception as e:
            self.error_message = f"停止失败: {e}"
            return False
    
    def move_to_position(self, position: float) -> bool:
        """
        移动到指定位置
        
        Args:
            position: 目标位置 (mm)
        
        Returns:
            bool: 移动命令是否发送成功
        """
        if not self.enabled or self.status != ActuatorStatus.RUNNING:
            return False
        
        # 限制位置范围
        position = max(0, min(self.max_length, position))
        
        self.target_position = position
        self.is_moving = True
        
        # 启动移动线程
        threading.Thread(target=self._move_to_position_thread, daemon=True).start()
        
        return True
    
    def _move_to_position_thread(self):
        """移动线程"""
        try:
            # 计算需要移动的步数
            delta = self.target_position - self.current_position
            steps = int(delta * self.step_per_mm)
            
            if steps == 0:
                self.is_moving = False
                return
            
            # 设置方向
            direction = 1 if steps > 0 else -1
            self._set_direction(direction)
            
            # 发送步进脉冲
            steps = abs(steps)
            for i in range(steps):
                if not self.is_moving:  # 检查是否被停止
                    break
                
                self._step_pulse()
                time.sleep(1.0 / (self.max_speed * self.step_per_mm))
                
                # 更新当前位置
                self.current_position += direction / self.step_per_mm
            
            self.current_position = self.target_position
            self.is_moving = False
            
        except Exception as e:
            self.error_message = f"移动失败: {e}"
            self.status = ActuatorStatus.ERROR
            self.is_moving = False
    
    def home(self) -> bool:
        """回零操作"""
        if not self.enabled:
            return False
        
        return self._home()
    
    def _home(self) -> bool:
        """执行回零"""
        try:
            # 设置回零方向
            self._set_direction(-1)
            
            # 检查限位开关状态
            while not self._read_limit_switch():
                self._step_pulse()
                time.sleep(0.001)  # 1ms延时
            
            # 设置当前位置为0
            self.current_position = 0.0
            self.homing_required = False
            
            return True
        except Exception as e:
            self.error_message = f"回零失败: {e}"
            return False
    
    def _enable_motor(self):
        """使能电机"""
        # 硬件使能
        pass
    
    def _disable_motor(self):
        """失能电机"""
        # 硬件失能
        pass
    
    def _set_direction(self, direction: int):
        """设置移动方向"""
        # 硬件方向控制
        pass
    
    def _step_pulse(self):
        """发送步进脉冲"""
        # 硬件脉冲控制
        pass
    
    def _read_limit_switch(self) -> bool:
        """读取限位开关状态"""
        # 硬件限位开关读取
        return False

class ActuatorManager:
    """执行机构管理器"""
    
    def __init__(self, config: dict):
        """
        初始化执行机构管理器
        
        Args:
            config: 配置参数字典
        """
        self.config = config
        self.actuators: Dict[str, BaseActuator] = {}
        self.actuator_configs = config.get('actuators', [])
        
        # 初始化执行机构
        self._initialize_actuators()
        
        # 安全参数
        self.emergency_stop_triggered = False
        self.auto_shutdown_enabled = config.get('auto_shutdown', True)
        self.max_total_power = config.get('max_total_power', 1000)  # 最大总功率(W)
        
        # 监控线程
        self.monitor_thread = None
        self.running = True
        
        # 启动监控
        self._start_monitoring()
    
    def _initialize_actuators(self):
        """初始化所有执行机构"""
        for actuator_config in self.actuator_configs:
            actuator_type = actuator_config.get('type', '')
            actuator_id = actuator_config.get('id', '')
            
            if not actuator_type or not actuator_id:
                continue
            
            # 根据类型创建执行机构
            if actuator_type == 'water_pump':
                actuator = WaterPump(actuator_config)
            elif actuator_type == 'sliding_rail':
                actuator = SlidingRail(actuator_config)
            else:
                actuator = BaseActuator(actuator_config)
            
            self.actuators[actuator_id] = actuator
            print(f"已添加执行机构: {actuator.name} ({actuator_id})")
    
    def _start_monitoring(self):
        """启动监控线程"""
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
    
    def _monitoring_loop(self):
        """监控循环"""
        while self.running:
            try:
                # 检查紧急停止
                if self.emergency_stop_triggered:
                    self._emergency_stop_all()
                
                # 自动关机检查
                if self.auto_shutdown_enabled:
                    self._check_auto_shutdown()
                
                # 功率监控
                self._check_power_consumption()
                
                # 状态更新
                self._update_status()
                
                time.sleep(1.0)  # 1秒监控周期
                
            except Exception as e:
                print(f"监控循环错误: {e}")
                time.sleep(5.0)
    
    def _emergency_stop_all(self):
        """紧急停止所有执行机构"""
        for actuator_id, actuator in self.actuators.items():
            actuator.stop()
    
    def _check_auto_shutdown(self):
        """检查自动关机"""
        current_time = time.time()
        for actuator in self.actuators.values():
            if (actuator.status == ActuatorStatus.RUNNING and 
                current_time - actuator.last_start_time > actuator.auto_shutdown_time):
                print(f"自动关机: {actuator.name}")
                actuator.stop()
    
    def _check_power_consumption(self):
        """检查功率消耗"""
        total_power = sum(actuator.power_consumption for actuator in self.actuators.values() 
                         if actuator.status == ActuatorStatus.RUNNING)
        
        if total_power > self.max_total_power:
            print(f"功率超限: {total_power}W > {self.max_total_power}W")
            # 优先级较低的设备先停止
            self._shutdown_low_priority_actuators()
    
    def _shutdown_low_priority_actuators(self):
        """关闭低优先级设备"""
        # 按优先级排序，优先级低的先关闭
        priority_order = ['led', 'fan', 'sprayer', 'mechanical_arm', 'sliding_rail', 'water_pump']
        
        for actuator_type in priority_order:
            for actuator in self.actuators.values():
                if (actuator.type == actuator_type and 
                    actuator.status == ActuatorStatus.RUNNING):
                    actuator.stop()
                    print(f"关闭低优先级设备: {actuator.name}")
                    return
    
    def _update_status(self):
        """更新状态信息"""
        for actuator in self.actuators.values():
            if actuator.has_feedback:
                # 更新传感器数值
                actuator.sensor_value = self._read_sensor(actuator)
    
    def _read_sensor(self, actuator: BaseActuator) -> float:
        """读取传感器数值（硬件相关）"""
        # 这里需要根据实际硬件实现传感器读取
        return 0.0
    
    def emergency_stop(self):
        """紧急停止"""
        self.emergency_stop_triggered = True
    
    def reset_emergency_stop(self):
        """重置紧急停止"""
        self.emergency_stop_triggered = False
    
    def start_actuator(self, actuator_id: str) -> bool:
        """启动指定执行机构"""
        if self.emergency_stop_triggered:
            return False
        
        if actuator_id in self.actuators:
            return self.actuators[actuator_id].start()
        return False
    
    def stop_actuator(self, actuator_id: str) -> bool:
        """停止指定执行机构"""
        if actuator_id in self.actuators:
            return self.actuators[actuator_id].stop()
        return False
    
    def get_actuator_status(self, actuator_id: str) -> Optional[Dict]:
        """获取指定执行机构状态"""
        if actuator_id in self.actuators:
            return self.actuators[actuator_id].get_status()
        return None
    
    def get_all_status(self) -> Dict:
        """获取所有执行机构状态"""
        return {
            'emergency_stop': self.emergency_stop_triggered,
            'total_power_consumption': sum(
                actuator.power_consumption for actuator in self.actuators.values() 
                if actuator.status == ActuatorStatus.RUNNING
            ),
            'actuators': {
                actuator_id: actuator.get_status() 
                for actuator_id, actuator in self.actuators.items()
            }
        }
    
    def execute_command(self, command: Dict) -> Dict:
        """
        执行执行机构命令
        
        Args:
            command: 命令字典，包含：
                - actuator_id: 执行机构ID
                - action: 动作（start/stop/set）
                - parameters: 参数（可选）
        
        Returns:
            Dict: 执行结果
        """
        actuator_id = command.get('actuator_id', '')
        action = command.get('action', '')
        parameters = command.get('parameters', {})
        
        if actuator_id not in self.actuators:
            return {'success': False, 'message': '执行机构不存在'}
        
        actuator = self.actuators[actuator_id]
        
        if action == 'start':
            success = actuator.start()
            return {'success': success, 'message': '启动命令已发送'}
        
        elif action == 'stop':
            success = actuator.stop()
            return {'success': success, 'message': '停止命令已发送'}
        
        elif action == 'set':
            # 特殊参数设置
            if actuator.type == 'water_pump' and 'flow_rate' in parameters:
                pump = actuator
                success = pump.set_flow_rate(parameters['flow_rate'])
                return {'success': success, 'message': '流量设置成功'}
            
            elif actuator.type == 'sliding_rail' and 'position' in parameters:
                rail = actuator
                success = rail.move_to_position(parameters['position'])
                return {'success': success, 'message': '移动命令已发送'}
        
        return {'success': False, 'message': '未知命令或参数'}
    
    def shutdown(self):
        """关闭管理器"""
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2.0)
        
        # 停止所有执行机构
        for actuator in self.actuators.values():
            actuator.stop()

# 使用示例
if __name__ == "__main__":
    # 配置示例
    config = {
        'auto_shutdown': True,
        'max_total_power': 1000,
        'actuators': [
            {
                'id': 'water_pump_1',
                'name': '主水泵',
                'type': 'water_pump',
                'max_flow_rate': 2.0,
                'has_valve': True,
                'pwm_pin': 18,
                'enabled': True
            },
            {
                'id': 'sliding_rail_1',
                'name': '摄像头滑台',
                'type': 'sliding_rail',
                'max_length': 1000,
                'max_speed': 100,
                'enabled': True
            }
        ]
    }
    
    # 创建执行机构管理器
    manager = ActuatorManager(config)
    
    try:
        # 启动水泵
        print("启动水泵...")
        result = manager.execute_command({
            'actuator_id': 'water_pump_1',
            'action': 'start'
        })
        print(result)
        
        # 设置水泵流量
        print("设置水泵流量...")
        result = manager.execute_command({
            'actuator_id': 'water_pump_1',
            'action': 'set',
            'parameters': {'flow_rate': 1.5}
        })
        print(result)
        
        # 移动滑台
        print("移动滑台...")
        result = manager.execute_command({
            'actuator_id': 'sliding_rail_1',
            'action': 'set',
            'parameters': {'position': 500}
        })
        print(result)
        
        # 运行一段时间
        time.sleep(5.0)
        
        # 停止所有设备
        print("停止所有设备...")
        for actuator_id in ['water_pump_1', 'sliding_rail_1']:
            result = manager.execute_command({
                'actuator_id': actuator_id,
                'action': 'stop'
            })
            print(f"{actuator_id}: {result}")
        
        # 打印状态
        print("\n所有执行机构状态:")
        status = manager.get_all_status()
        print(json.dumps(status, indent=2, ensure_ascii=False))
        
    except KeyboardInterrupt:
        print("用户中断")
    
    finally:
        manager.shutdown()