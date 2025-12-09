"""
ROS2接口模块
实现农业机器人与ROS2系统的集成
"""

import rclpy
from rclpy.node import Node
from rclpy.publisher import Publisher
from rclpy.subscription import Subscription
from rclpy.service import Service
from rclpy.action import ActionServer
from geometry_msgs.msg import Twist, PoseStamped, Point
from sensor_msgs.msg import Image, CompressedImage, JointState
from std_msgs.msg import String, Bool, Float32
from agricultural_robot_interfaces.msg import DetectionResult, DetectionArray
from agricultural_robot_interfaces.srv import ControlActuator, GetStatus
from agricultural_robot_interfaces.action import NavigateToTarget, ExecuteTask
import cv2
import numpy as np
import json
import threading
import time
from typing import Dict, List, Optional, Callable
import transform_generator as TG
from std_srvs.srv import Trigger

class AgriculturalRobotNode(Node):
    """农业机器人ROS2节点"""
    
    def __init__(self, config: dict):
        """
        初始化ROS2节点
        
        Args:
            config: 配置参数字典
        """
        super().__init__('agricultural_robot_node')
        
        self.config = config
        self.node_name = config.get('node_name', 'agricultural_robot')
        
        # 状态管理
        self.robot_status = {
            'mode': 'idle',          # idle, navigating, detecting, executing
            'position': {'x': 0.0, 'y': 0.0, 'theta': 0.0},
            'battery_voltage': 24.0,
            'last_update': time.time()
        }
        
        # 硬件接口
        self.chassis = None
        self.camera = None
        self.actuators = None
        self.detector = None
        
        # 发布器和订阅器
        self.publishers = {}
        self.subscriptions = {}
        self.services = {}
        self.actions = {}
        
        # 初始化发布器
        self._initialize_publishers()
        
        # 初始化订阅器
        self._initialize_subscriptions()
        
        # 初始化服务
        self._initialize_services()
        
        # 初始化动作服务器
        self._initialize_actions()
        
        # 启动状态发布线程
        self.status_thread = None
        self.running = True
        self._start_status_thread()
        
        self.get_logger().info(f"农业机器人节点 '{self.node_name}' 已启动")
    
    def _initialize_publishers(self):
        """初始化发布器"""
        # 机器人状态发布
        self.publishers['status'] = self.create_publisher(
            String, f'/{self.node_name}/status', 10
        )
        
        # 机器人位置发布
        self.publishers['pose'] = self.create_publisher(
            PoseStamped, f'/{self.node_name}/pose', 10
        )
        
        # 电池电压发布
        self.publishers['battery'] = self.create_publisher(
            Float32, f'/{self.node_name}/battery_voltage', 10
        )
        
        # 检测结果发布
        self.publishers['detections'] = self.create_publisher(
            DetectionArray, f'/{self.node_name}/detections', 10
        )
        
        # 图像发布（压缩格式）
        self.publishers['image_compressed'] = self.create_publisher(
            CompressedImage, f'/{self.node_name}/image/compressed', 10
        )
    
    def _initialize_subscriptions(self):
        """初始化订阅器"""
        # 速度命令订阅
        self.subscriptions['cmd_vel'] = self.create_subscription(
            Twist, f'/{self.node_name}/cmd_vel', 
            self._cmd_vel_callback, 10
        )
        
        # 模式切换订阅
        self.subscriptions['mode'] = self.create_subscription(
            String, f'/{self.node_name}/mode', 
            self._mode_callback, 10
        )
        
        # 紧急停止订阅
        self.subscriptions['emergency_stop'] = self.create_subscription(
            Bool, f'/{self.node_name}/emergency_stop', 
            self._emergency_stop_callback, 10
        )
        
        # 外部检测结果订阅（其他节点提供）
        self.subscriptions['external_detections'] = self.create_subscription(
            DetectionArray, f'/{self.node_name}/external_detections', 
            self._external_detections_callback, 10
        )
    
    def _initialize_services(self):
        """初始化服务"""
        # 执行机构控制服务
        self.services['control_actuator'] = self.create_service(
            ControlActuator, f'/{self.node_name}/control_actuator',
            self._control_actuator_callback
        )
        
        # 获取状态服务
        self.services['get_status'] = self.create_service(
            GetStatus, f'/{self.node_name}/get_status',
            self._get_status_callback
        )
        
        # 紧急停止服务
        self.services['emergency_stop_service'] = self.create_service(
            Trigger, f'/{self.node_name}/emergency_stop',
            self._emergency_stop_service_callback
        )
    
    def _initialize_actions(self):
        """初始化动作服务器"""
        # 导航到目标点
        self.actions['navigate_to_target'] = ActionServer(
            self, NavigateToTarget, f'/{self.node_name}/navigate_to_target',
            self._navigate_to_target_callback
        )
        
        # 执行任务
        self.actions['execute_task'] = ActionServer(
            self, ExecuteTask, f'/{self.node_name}/execute_task',
            self._execute_task_callback
        )
    
    def _cmd_vel_callback(self, msg: Twist):
        """速度命令回调"""
        if self.chassis:
            linear_velocity = msg.linear.x
            angular_velocity = msg.angular.z
            
            # 发送到底盘控制器
            success = self.chassis.set_velocity(linear_velocity, angular_velocity)
            if not success:
                self.get_logger().warn("速度命令发送失败")
    
    def _mode_callback(self, msg: String):
        """模式切换回调"""
        new_mode = msg.data
        if new_mode in ['idle', 'navigating', 'detecting', 'executing']:
            old_mode = self.robot_status['mode']
            self.robot_status['mode'] = new_mode
            self.get_logger().info(f"模式切换: {old_mode} -> {new_mode}")
        else:
            self.get_logger().warn(f"未知模式: {new_mode}")
    
    def _emergency_stop_callback(self, msg: Bool):
        """紧急停止回调"""
        if msg.data:
            self._emergency_stop()
    
    def _external_detections_callback(self, msg: DetectionArray):
        """外部检测结果回调"""
        # 处理其他节点提供的检测结果
        self.get_logger().info(f"接收到 {len(msg.detections)} 个外部检测结果")
        
        # 转换为内部格式并处理
        for detection_msg in msg.detections:
            detection = {
                'class_id': detection_msg.class_id,
                'class_name': detection_msg.class_name,
                'confidence': detection_msg.confidence,
                'bbox': [detection_msg.x, detection_msg.y, detection_msg.width, detection_msg.height],
                'timestamp': self.get_clock().now().to_msg()
            }
            
            # 触发基于检测的动作
            self._trigger_detection_action(detection)
    
    def _control_actuator_callback(self, request: ControlActuator.Request, 
                                 response: ControlActuator.Response) -> ControlActuator.Response:
        """执行机构控制服务回调"""
        try:
            if self.actuators:
                result = self.actuators.execute_command({
                    'actuator_id': request.actuator_id,
                    'action': request.action,
                    'parameters': json.loads(request.parameters) if request.parameters else {}
                })
                
                response.success = result.get('success', False)
                response.message = result.get('message', '')
            else:
                response.success = False
                response.message = '执行机构未初始化'
        
        except Exception as e:
            response.success = False
            response.message = f'控制失败: {e}'
        
        return response
    
    def _get_status_callback(self, request: GetStatus.Request, 
                            response: GetStatus.Response) -> GetStatus.Response:
        """获取状态服务回调"""
        try:
            # 获取各个组件状态
            chassis_status = self.chassis.get_status() if self.chassis else {}
            actuators_status = self.actuators.get_all_status() if self.actuators else {}
            
            # 构建响应
            response.robot_status = json.dumps(self.robot_status)
            response.chassis_status = json.dumps(chassis_status)
            response.actuators_status = json.dumps(actuators_status)
            response.success = True
            response.message = '状态获取成功'
        
        except Exception as e:
            response.success = False
            response.message = f'状态获取失败: {e}'
        
        return response
    
    def _emergency_stop_service_callback(self, request: Trigger.Request, 
                                       response: Trigger.Response) -> Trigger.Response:
        """紧急停止服务回调"""
        try:
            self._emergency_stop()
            response.success = True
            response.message = '紧急停止已执行'
        except Exception as e:
            response.success = False
            response.message = f'紧急停止失败: {e}'
        
        return response
    
    async def _navigate_to_target_callback(self, goal_handle):
        """导航到目标点动作回调"""
        self.get_logger().info('开始导航到目标点')
        
        feedback_msg = NavigateToTarget.Feedback()
        
        try:
            # 获取目标点
            target_x = goal_handle.request.target_x
            target_y = goal_handle.request.target_y
            target_theta = goal_handle.request.target_theta
            
            # 切换到导航模式
            self.robot_status['mode'] = 'navigating'
            
            # 执行导航（这里应该调用实际的导航算法）
            success = await self._perform_navigation(target_x, target_y, target_theta, goal_handle)
            
            if success:
                goal_handle.succeed()
                result = NavigateToTarget.Result()
                result.success = True
                result.message = '导航完成'
                return result
            else:
                goal_handle.abort()
                result = NavigateToTarget.Result()
                result.success = False
                result.message = '导航失败'
                return result
        
        except Exception as e:
            self.get_logger().error(f'导航过程出错: {e}')
            goal_handle.abort()
            result = NavigateToTarget.Result()
            result.success = False
            result.message = str(e)
            return result
        
        finally:
            self.robot_status['mode'] = 'idle'
    
    async def _perform_navigation(self, target_x: float, target_y: float, 
                                target_theta: float, goal_handle) -> bool:
        """执行导航逻辑"""
        if not self.chassis:
            return False
        
        # 这里应该实现实际的导航算法
        # 简化实现：直接移动到目标位置
        start_time = time.time()
        timeout = 60.0  # 60秒超时
        
        while time.time() - start_time < timeout:
            # 检查是否被取消
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                return False
            
            # 移动到目标位置
            success = self.chassis.move_to_position(target_x, target_y)
            if success:
                # 调整朝向
                current_theta = self.robot_status['position']['theta']
                angle_diff = target_theta - current_theta
                
                # 归一化角度差
                while angle_diff > np.pi:
                    angle_diff -= 2 * np.pi
                while angle_diff < -np.pi:
                    angle_diff += 2 * np.pi
                
                if abs(angle_diff) > 0.1:  # 如果角度差大于阈值
                    success = self.chassis.set_velocity(0.0, angle_diff)
                    time.sleep(2.0)  # 等待转向完成
                
                # 更新位置
                self.robot_status['position']['x'] = target_x
                self.robot_status['position']['y'] = target_y
                self.robot_status['position']['theta'] = target_theta
                
                return True
            
            # 发送反馈
            feedback = NavigateToTarget.Feedback()
            feedback.current_x = self.robot_status['position']['x']
            feedback.current_y = self.robot_status['position']['y']
            feedback.current_theta = self.robot_status['position']['theta']
            feedback.distance_to_target = np.sqrt(
                (target_x - self.robot_status['position']['x'])**2 + 
                (target_y - self.robot_status['position']['y'])**2
            )
            goal_handle.publish_feedback(feedback)
            
            await asyncio.sleep(0.1)
        
        return False
    
    async def _execute_task_callback(self, goal_handle):
        """执行任务动作回调"""
        self.get_logger().info('开始执行任务')
        
        try:
            # 获取任务参数
            task_type = goal_handle.request.task_type
            task_parameters = json.loads(goal_handle.request.parameters) if goal_handle.request.parameters else {}
            
            # 切换到执行模式
            self.robot_status['mode'] = 'executing'
            
            # 执行任务
            success = await self._perform_task(task_type, task_parameters, goal_handle)
            
            if success:
                goal_handle.succeed()
                result = ExecuteTask.Result()
                result.success = True
                result.message = '任务执行完成'
                result.result_data = json.dumps({'execution_time': time.time()})
                return result
            else:
                goal_handle.abort()
                result = ExecuteTask.Result()
                result.success = False
                result.message = '任务执行失败'
                return result
        
        except Exception as e:
            self.get_logger().error(f'任务执行出错: {e}')
            goal_handle.abort()
            result = ExecuteTask.Result()
            result.success = False
            result.message = str(e)
            return result
        
        finally:
            self.robot_status['mode'] = 'idle'
    
    async def _perform_task(self, task_type: str, parameters: Dict, 
                           goal_handle) -> bool:
        """执行具体任务"""
        try:
            if task_type == 'irrigation':
                return await self._execute_irrigation_task(parameters)
            elif task_type == 'detection':
                return await self._execute_detection_task(parameters)
            elif task_type == 'harvesting':
                return await self._execute_harvesting_task(parameters)
            else:
                self.get_logger().error(f'未知任务类型: {task_type}')
                return False
        
        except Exception as e:
            self.get_logger().error(f'任务执行失败: {e}')
            return False
    
    async def _execute_irrigation_task(self, parameters: Dict) -> bool:
        """执行灌溉任务"""
        if not self.actuators:
            return False
        
        # 获取目标位置和灌溉参数
        target_x = parameters.get('target_x', 0)
        target_y = parameters.get('target_y', 0)
        flow_rate = parameters.get('flow_rate', 1.0)
        duration = parameters.get('duration', 30)
        
        # 导航到目标位置
        success = self.chassis.move_to_position(target_x, target_y)
        if not success:
            return False
        
        # 启动水泵
        result = self.actuators.execute_command({
            'actuator_id': 'water_pump_1',
            'action': 'set',
            'parameters': {'flow_rate': flow_rate}
        })
        
        if not result.get('success', False):
            return False
        
        # 灌溉指定时间
        await asyncio.sleep(duration)
        
        # 停止水泵
        result = self.actuators.execute_command({
            'actuator_id': 'water_pump_1',
            'action': 'stop'
        })
        
        return result.get('success', False)
    
    async def _execute_detection_task(self, parameters: Dict) -> bool:
        """执行检测任务"""
        if not self.detector or not self.camera:
            return False
        
        # 获取检测参数
        target_classes = parameters.get('target_classes', [])
        confidence_threshold = parameters.get('confidence_threshold', 0.5)
        
        # 执行检测
        frame = self.camera.get_frame()
        if frame is None:
            return False
        
        detections = self.detector.detect(frame)
        
        # 过滤检测结果
        filtered_detections = []
        for detection in detections:
            if detection.confidence >= confidence_threshold:
                if not target_classes or detection.class_name in target_classes:
                    filtered_detections.append(detection)
        
        # 发布检测结果
        self._publish_detections(filtered_detections)
        
        return True
    
    async def _execute_harvesting_task(self, parameters: Dict) -> bool:
        """执行采摘任务"""
        # 采摘任务的实现（需要机械臂）
        # 这里提供基本框架
        self.get_logger().info("执行采摘任务（待实现）")
        return True
    
    def _trigger_detection_action(self, detection: Dict):
        """根据检测结果触发动作"""
        class_name = detection['class_name']
        confidence = detection['confidence']
        
        # 根据不同的检测结果执行不同的动作
        if class_name == 'dry_soil' and confidence > 0.8:
            # 检测到干燥土壤，触发灌溉
            self._auto_irrigation(detection)
        
        elif class_name == 'weed' and confidence > 0.7:
            # 检测到杂草，触发除草
            self._auto_weeding(detection)
        
        elif class_name in ['potato', 'sweet_potato'] and confidence > 0.9:
            # 检测到成熟作物，记录位置
            self._record_crop_location(detection)
    
    def _auto_irrigation(self, detection: Dict):
        """自动灌溉"""
        bbox = detection['bbox']
        center_x = bbox[0] + bbox[2] / 2
        center_y = bbox[1] + bbox[3] / 2
        
        # 转换为世界坐标（需要相机标定）
        # 这里简化处理
        target_x = center_x / 100.0  # 假设比例尺
        target_y = center_y / 100.0
        
        # 启动灌溉任务
        self.get_logger().info(f"检测到干燥土壤，启动自动灌溉: ({target_x:.2f}, {target_y:.2f})")
        
        # 这里可以创建一个异步任务来执行灌溉
        # 或者发布一个任务消息
    
    def _auto_weeding(self, detection: Dict):
        """自动除草"""
        bbox = detection['bbox']
        center_x = bbox[0] + bbox[2] / 2
        center_y = bbox[1] + bbox[3] / 2
        
        target_x = center_x / 100.0
        target_y = center_y / 100.0
        
        self.get_logger().info(f"检测到杂草，启动自动除草: ({target_x:.2f}, {target_y:.2f})")
    
    def _record_crop_location(self, detection: Dict):
        """记录作物位置"""
        bbox = detection['bbox']
        center_x = bbox[0] + bbox[2] / 2
        center_y = bbox[1] + bbox[3] / 2
        
        target_x = center_x / 100.0
        target_y = center_y / 100.0
        
        self.get_logger().info(f"记录作物位置 {detection['class_name']}: ({target_x:.2f}, {target_y:.2f})")
        
        # 保存到数据库或文件
        crop_info = {
            'class_name': detection['class_name'],
            'location': {'x': target_x, 'y': target_y},
            'confidence': detection['confidence'],
            'timestamp': time.time()
        }
        
        # TODO: 保存到持久化存储
    
    def _publish_detections(self, detections: List[Dict]):
        """发布检测结果"""
        detection_array = DetectionArray()
        detection_array.header.stamp = self.get_clock().now().to_msg()
        detection_array.header.frame_id = self.node_name
        
        for detection in detections:
            detection_msg = DetectionResult()
            detection_msg.class_id = detection['class_id']
            detection_msg.class_name = detection['class_name']
            detection_msg.confidence = detection['confidence']
            detection_msg.x = detection['bbox'][0]
            detection_msg.y = detection['bbox'][1]
            detection_msg.width = detection['bbox'][2]
            detection_msg.height = detection['bbox'][3]
            
            detection_array.detections.append(detection_msg)
        
        self.publishers['detections'].publish(detection_array)
    
    def _start_status_thread(self):
        """启动状态发布线程"""
        def status_publisher():
            while self.running:
                try:
                    # 更新状态
                    self._update_robot_status()
                    
                    # 发布状态消息
                    self._publish_status_messages()
                    
                    time.sleep(1.0)  # 1秒发布一次
                except Exception as e:
                    self.get_logger().error(f"状态发布错误: {e}")
        
        self.status_thread = threading.Thread(target=status_publisher, daemon=True)
        self.status_thread.start()
    
    def _update_robot_status(self):
        """更新机器人状态"""
        # 更新位置（从底盘获取）
        if self.chassis:
            chassis_status = self.chassis.get_status()
            pose = chassis_status.get('pose', {})
            self.robot_status['position'] = pose
        
        # 更新电池电压（从执行机构获取）
        if self.actuators:
            actuator_status = self.actuators.get_all_status()
            self.robot_status['battery_voltage'] = actuator_status.get('battery_voltage', 24.0)
        
        self.robot_status['last_update'] = time.time()
    
    def _publish_status_messages(self):
        """发布状态消息"""
        # 发布机器人状态
        status_msg = String()
        status_msg.data = json.dumps(self.robot_status)
        self.publishers['status'].publish(status_msg)
        
        # 发布位置信息
        pose_msg = PoseStamped()
        pose_msg.header.stamp = self.get_clock().now().to_msg()
        pose_msg.header.frame_id = 'map'
        pose_msg.pose.position.x = self.robot_status['position']['x']
        pose_msg.pose.position.y = self.robot_status['position']['y']
        
        # 从theta创建四元数
        theta = self.robot_status['position']['theta']
        pose_msg.pose.orientation.w = np.cos(theta / 2)
        pose_msg.pose.orientation.z = np.sin(theta / 2)
        
        self.publishers['pose'].publish(pose_msg)
        
        # 发布电池电压
        battery_msg = Float32()
        battery_msg.data = self.robot_status['battery_voltage']
        self.publishers['battery'].publish(battery_msg)
        
        # 发布图像（如果有摄像头）
        if self.camera:
            self._publish_camera_image()
    
    def _publish_camera_image(self):
        """发布摄像头图像"""
        frame = self.camera.get_frame()
        if frame is None:
            return
        
        # 压缩图像
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
        _, compressed_data = cv2.imencode('.jpg', frame, encode_param)
        
        # 创建压缩图像消息
        image_msg = CompressedImage()
        image_msg.header.stamp = self.get_clock().now().to_msg()
        image_msg.header.frame_id = f'{self.node_name}_camera'
        image_msg.format = 'jpeg'
        image_msg.data = compressed_data.tobytes()
        
        self.publishers['image_compressed'].publish(image_msg)
    
    def _emergency_stop(self):
        """执行紧急停止"""
        self.get_logger().warn("执行紧急停止")
        
        # 停止底盘
        if self.chassis:
            self.chassis.emergency_stop()
        
        # 停止所有执行机构
        if self.actuators:
            self.actuators.emergency_stop()
        
        # 切换到空闲模式
        self.robot_status['mode'] = 'idle'
    
    def set_hardware_interfaces(self, chassis, camera, actuators, detector):
        """设置硬件接口"""
        self.chassis = chassis
        self.camera = camera
        self.actuators = actuators
        self.detector = detector
        
        self.get_logger().info("硬件接口已设置完成")
    
    def shutdown(self):
        """关闭节点"""
        self.running = False
        
        if self.status_thread:
            self.status_thread.join(timeout=2.0)
        
        # 紧急停止所有硬件
        self._emergency_stop()
        
        self.get_logger().info("农业机器人节点已关闭")

# ROS2接口管理器
class ROS2InterfaceManager:
    """ROS2接口管理器"""
    
    def __init__(self):
        self.nodes = {}
        self.context = None
    
    def initialize(self, args=None):
        """初始化ROS2"""
        rclpy.init(args=args)
        self.context = rclpy.get_default_context()
    
    def create_robot_node(self, node_name: str, config: dict) -> AgriculturalRobotNode:
        """创建机器人节点"""
        node = AgriculturalRobotNode(config)
        self.nodes[node_name] = node
        return node
    
    def spin(self, node_name: str):
        """运行指定节点"""
        if node_name in self.nodes:
            rclpy.spin(self.nodes[node_name])
    
    def spin_all(self):
        """运行所有节点"""
        try:
            rclpy.spin_once()
        except KeyboardInterrupt:
            pass
    
    def shutdown(self):
        """关闭所有节点"""
        for node in self.nodes.values():
            node.shutdown()
        
        if rclpy.ok():
            rclpy.shutdown()

# 使用示例
if __name__ == "__main__":
    import asyncio
    
    # 配置参数
    config = {
        'node_name': 'agricultural_robot_01',
        'publish_rate': 10,  # Hz
        'enable_image_publishing': True,
        'enable_detection': True
    }
    
    # 创建ROS2接口管理器
    ros_manager = ROS2InterfaceManager()
    
    try:
        # 初始化ROS2
        ros_manager.initialize()
        
        # 创建机器人节点
        robot_node = ros_manager.create_robot_node('agricultural_robot_01', config)
        
        # 设置硬件接口（这里需要实际的硬件实例）
        # robot_node.set_hardware_interfaces(chassis, camera, actuators, detector)
        
        # 运行节点
        ros_manager.spin('agricultural_robot_01')
        
    except KeyboardInterrupt:
        print("用户中断")
    
    finally:
        # 关闭
        ros_manager.shutdown()