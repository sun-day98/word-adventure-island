"""
农业巡检机器人后端API服务
基于Flask的RESTful API，提供机器人控制、数据管理、实时通信等功能
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
import cv2
import numpy as np
import base64
import json
import time
import threading
import os
from datetime import datetime, timedelta
import sqlite3
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = 'agricultural-robot-secret-key'
app.config['JWT_SECRET_KEY'] = 'agricultural-robot-jwt-secret'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# 初始化扩展
CORS(app, origins=['*'])
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 数据库初始化
def init_database():
    """初始化数据库"""
    conn = sqlite3.connect('agricultural_robot.db')
    cursor = conn.cursor()
    
    # 用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'operator',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 机器人表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS robots (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'agricultural',
            status TEXT DEFAULT 'offline',
            position_x REAL DEFAULT 0,
            position_y REAL DEFAULT 0,
            position_theta REAL DEFAULT 0,
            battery_level INTEGER DEFAULT 0,
            last_seen TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 任务表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            robot_id TEXT NOT NULL,
            task_type TEXT NOT NULL,
            parameters TEXT,
            status TEXT DEFAULT 'pending',
            progress INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (robot_id) REFERENCES robots (id)
        )
    ''')
    
    # 检测结果表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            robot_id TEXT NOT NULL,
            class_name TEXT NOT NULL,
            confidence REAL NOT NULL,
            bbox_x REAL NOT NULL,
            bbox_y REAL NOT NULL,
            bbox_width REAL NOT NULL,
            bbox_height REAL NOT NULL,
            image_path TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (robot_id) REFERENCES robots (id)
        )
    ''')
    
    # 环境数据表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS environment_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            robot_id TEXT NOT NULL,
            temperature REAL,
            humidity REAL,
            soil_ph REAL,
            light_intensity REAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (robot_id) REFERENCES robots (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# 全局状态管理
class GlobalState:
    """全局状态管理类"""
    
    def __init__(self):
        self.robots = {}  # 机器人状态
        self.camera_streams = {}  # 摄像头流
        self.detection_results = {}  # 检测结果
        self.active_tasks = {}  # 活跃任务
        self.connected_clients = set()  # 连接的客户端
        
    def update_robot_status(self, robot_id: str, status: Dict):
        """更新机器人状态"""
        self.robots[robot_id] = {
            **status,
            'last_update': time.time()
        }
        
        # 广播状态更新
        socketio.emit('robot_status_update', {
            'robot_id': robot_id,
            'status': status
        }, room='dashboard')
    
    def add_detection_result(self, robot_id: str, detection: Dict):
        """添加检测结果"""
        if robot_id not in self.detection_results:
            self.detection_results[robot_id] = []
        
        self.detection_results[robot_id].append({
            **detection,
            'timestamp': time.time()
        })
        
        # 限制结果数量
        if len(self.detection_results[robot_id]) > 100:
            self.detection_results[robot_id] = self.detection_results[robot_id][-100:]
        
        # 广播检测结果
        socketio.emit('detection_result', {
            'robot_id': robot_id,
            'detection': detection
        }, room='dashboard')
    
    def update_task_progress(self, task_id: int, progress: int, status: str = None):
        """更新任务进度"""
        if task_id in self.active_tasks:
            self.active_tasks[task_id]['progress'] = progress
            if status:
                self.active_tasks[task_id]['status'] = status
            
            # 广播任务更新
            socketio.emit('task_update', {
                'task_id': task_id,
                'progress': progress,
                'status': status or self.active_tasks[task_id]['status']
            }, room='dashboard')

# 创建全局状态实例
global_state = GlobalState()

# 硬件接口模拟
class HardwareInterface:
    """硬件接口模拟类"""
    
    @staticmethod
    def capture_image(robot_id: str) -> Optional[np.ndarray]:
        """模拟图像捕获"""
        try:
            # 这里应该调用实际的摄像头接口
            # 模拟生成图像
            image = np.zeros((480, 640, 3), dtype=np.uint8)
            image[:] = (50, 100, 150)  # 随机颜色
            
            # 添加一些模拟的作物区域
            cv2.rectangle(image, (100, 100), (200, 200), (0, 255, 0), -1)
            cv2.rectangle(image, (300, 150), (400, 250), (0, 255, 0), -1)
            
            return image
        except Exception as e:
            logger.error(f"图像捕获失败: {e}")
            return None
    
    @staticmethod
    def control_robot(robot_id: str, command: Dict) -> Dict:
        """模拟机器人控制"""
        try:
            # 这里应该调用实际的机器人控制接口
            command_type = command.get('type')
            
            if command_type == 'move':
                # 移动控制
                linear_velocity = command.get('linear_velocity', 0)
                angular_velocity = command.get('angular_velocity', 0)
                
                logger.info(f"控制机器人 {robot_id}: 移动 (线速度={linear_velocity}, 角速度={angular_velocity})")
                
                return {
                    'success': True,
                    'message': '移动命令已发送'
                }
            
            elif command_type == 'navigate':
                # 导航控制
                target_x = command.get('target_x', 0)
                target_y = command.get('target_y', 0)
                
                logger.info(f"控制机器人 {robot_id}: 导航到 ({target_x}, {target_y})")
                
                return {
                    'success': True,
                    'message': '导航命令已发送'
                }
            
            elif command_type == 'actuator':
                # 执行机构控制
                actuator_id = command.get('actuator_id')
                action = command.get('action')
                parameters = command.get('parameters', {})
                
                logger.info(f"控制机器人 {robot_id}: 执行机构 {actuator_id} {action}")
                
                return {
                    'success': True,
                    'message': '执行机构命令已发送'
                }
            
            else:
                return {
                    'success': False,
                    'message': f'未知命令类型: {command_type}'
                }
        
        except Exception as e:
            logger.error(f"机器人控制失败: {e}")
            return {
                'success': False,
                'message': str(e)
            }

# 认证路由
@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # 简单的用户验证（实际应该使用密码哈希）
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            access_token = create_access_token(identity=username)
            return jsonify({
                'success': True,
                'access_token': access_token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[3],
                    'role': user[4]
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': '用户名或密码错误'
            }), 401
    
    except Exception as e:
        logger.error(f"登录失败: {e}")
        return jsonify({
            'success': False,
            'message': '登录失败'
        }), 500

# 机器人管理路由
@app.route('/api/robots', methods=['GET'])
@jwt_required()
def get_robots():
    """获取机器人列表"""
    try:
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM robots ORDER BY name')
        robots = cursor.fetchall()
        conn.close()
        
        robot_list = []
        for robot in robots:
            robot_list.append({
                'id': robot[0],
                'name': robot[1],
                'type': robot[2],
                'status': robot[3],
                'position': {
                    'x': robot[4],
                    'y': robot[5],
                    'theta': robot[6]
                },
                'battery_level': robot[7],
                'last_seen': robot[8],
                'created_at': robot[9]
            })
        
        return jsonify({
            'success': True,
            'robots': robot_list
        })
    
    except Exception as e:
        logger.error(f"获取机器人列表失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/robots/<robot_id>', methods=['GET'])
@jwt_required()
def get_robot(robot_id):
    """获取单个机器人信息"""
    try:
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM robots WHERE id = ?', (robot_id,))
        robot = cursor.fetchone()
        conn.close()
        
        if robot:
            robot_data = {
                'id': robot[0],
                'name': robot[1],
                'type': robot[2],
                'status': robot[3],
                'position': {
                    'x': robot[4],
                    'y': robot[5],
                    'theta': robot[6]
                },
                'battery_level': robot[7],
                'last_seen': robot[8],
                'created_at': robot[9]
            }
            
            # 添加实时状态
            if robot_id in global_state.robots:
                robot_data.update(global_state.robots[robot_id])
            
            return jsonify({
                'success': True,
                'robot': robot_data
            })
        else:
            return jsonify({
                'success': False,
                'message': '机器人不存在'
            }), 404
    
    except Exception as e:
        logger.error(f"获取机器人信息失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/robots/<robot_id>/control', methods=['POST'])
@jwt_required()
def control_robot(robot_id):
    """控制机器人"""
    try:
        command = request.get_json()
        
        # 调用硬件接口
        result = HardwareInterface.control_robot(robot_id, command)
        
        # 如果是移动命令，更新机器人状态
        if command.get('type') == 'move':
            global_state.update_robot_status(robot_id, {
                'mode': 'moving',
                'last_command': command,
                'timestamp': datetime.now().isoformat()
            })
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"机器人控制失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 任务管理路由
@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    """获取任务列表"""
    try:
        robot_id = request.args.get('robot_id')
        status = request.args.get('status')
        
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        
        query = 'SELECT * FROM tasks'
        params = []
        
        if robot_id:
            query += ' WHERE robot_id = ?'
            params.append(robot_id)
        
        if status:
            query += ' AND status = ?' if robot_id else ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY created_at DESC'
        
        cursor.execute(query, params)
        tasks = cursor.fetchall()
        conn.close()
        
        task_list = []
        for task in tasks:
            task_list.append({
                'id': task[0],
                'robot_id': task[1],
                'task_type': task[2],
                'parameters': json.loads(task[3]) if task[3] else {},
                'status': task[4],
                'progress': task[5],
                'created_at': task[6],
                'started_at': task[7],
                'completed_at': task[8]
            })
        
        return jsonify({
            'success': True,
            'tasks': task_list
        })
    
    except Exception as e:
        logger.error(f"获取任务列表失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    """创建任务"""
    try:
        data = request.get_json()
        robot_id = data.get('robot_id')
        task_type = data.get('task_type')
        parameters = json.dumps(data.get('parameters', {}))
        
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tasks (robot_id, task_type, parameters)
            VALUES (?, ?, ?)
        ''', (robot_id, task_type, parameters))
        
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # 添加到活跃任务
        global_state.active_tasks[task_id] = {
            'robot_id': robot_id,
            'task_type': task_type,
            'parameters': json.loads(parameters),
            'status': 'pending',
            'progress': 0
        }
        
        # 广播任务创建
        socketio.emit('task_created', {
            'task_id': task_id,
            'robot_id': robot_id,
            'task_type': task_type
        }, room='dashboard')
        
        return jsonify({
            'success': True,
            'task_id': task_id,
            'message': '任务创建成功'
        })
    
    except Exception as e:
        logger.error(f"创建任务失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 检测相关路由
@app.route('/api/detect', methods=['POST'])
@jwt_required()
def perform_detection():
    """执行目标检测"""
    try:
        data = request.get_json()
        robot_id = data.get('robot_id')
        image_data = data.get('image')
        
        if not robot_id or not image_data:
            return jsonify({
                'success': False,
                'message': '缺少必要参数'
            }), 400
        
        # 解码图像
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({
                'success': False,
                'message': '图像解码失败'
            }), 400
        
        # 这里应该调用实际的检测模型
        # 模拟检测结果
        detections = [
            {
                'class_id': 0,
                'class_name': '土豆',
                'confidence': 0.92,
                'bbox': [100, 100, 120, 80]
            },
            {
                'class_id': 2,
                'class_name': '杂草',
                'confidence': 0.78,
                'bbox': [300, 200, 60, 40]
            }
        ]
        
        # 保存检测结果到数据库
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        
        for detection in detections:
            cursor.execute('''
                INSERT INTO detections (robot_id, class_name, confidence, bbox_x, bbox_y, bbox_width, bbox_height)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                robot_id,
                detection['class_name'],
                detection['confidence'],
                detection['bbox'][0],
                detection['bbox'][1],
                detection['bbox'][2],
                detection['bbox'][3]
            ))
        
        conn.commit()
        conn.close()
        
        # 添加到全局状态
        for detection in detections:
            global_state.add_detection_result(robot_id, detection)
        
        return jsonify({
            'success': True,
            'detections': detections,
            'detection_count': len(detections)
        })
    
    except Exception as e:
        logger.error(f"检测失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/detections', methods=['GET'])
@jwt_required()
def get_detections():
    """获取检测结果"""
    try:
        robot_id = request.args.get('robot_id')
        class_name = request.args.get('class_name')
        limit = int(request.args.get('limit', 100))
        
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        
        query = 'SELECT * FROM detections'
        params = []
        
        if robot_id:
            query += ' WHERE robot_id = ?'
            params.append(robot_id)
        
        if class_name:
            query += ' AND class_name = ?' if robot_id else ' WHERE class_name = ?'
            params.append(class_name)
        
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        detections = cursor.fetchall()
        conn.close()
        
        detection_list = []
        for detection in detections:
            detection_list.append({
                'id': detection[0],
                'robot_id': detection[1],
                'class_name': detection[2],
                'confidence': detection[3],
                'bbox': [detection[4], detection[5], detection[6], detection[7]],
                'image_path': detection[8],
                'timestamp': detection[9]
            })
        
        return jsonify({
            'success': True,
            'detections': detection_list,
            'total_count': len(detection_list)
        })
    
    except Exception as e:
        logger.error(f"获取检测结果失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 环境数据路由
@app.route('/api/environment', methods=['GET'])
@jwt_required()
def get_environment_data():
    """获取环境数据"""
    try:
        robot_id = request.args.get('robot_id')
        hours = int(request.args.get('hours', 24))
        
        conn = sqlite3.connect('agricultural_robot.db')
        cursor = conn.cursor()
        
        query = '''
            SELECT * FROM environment_data
            WHERE timestamp > datetime('now', '-{} hours')
        '''.format(hours)
        params = []
        
        if robot_id:
            query += ' AND robot_id = ?'
            params.append(robot_id)
        
        query += ' ORDER BY timestamp DESC'
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        conn.close()
        
        data_list = []
        for record in records:
            data_list.append({
                'id': record[0],
                'robot_id': record[1],
                'temperature': record[2],
                'humidity': record[3],
                'soil_ph': record[4],
                'light_intensity': record[5],
                'timestamp': record[6]
            })
        
        return jsonify({
            'success': True,
            'data': data_list,
            'count': len(data_list)
        })
    
    except Exception as e:
        logger.error(f"获取环境数据失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 视频流路由
@app.route('/api/video/stream/<robot_id>')
@jwt_required()
def video_stream(robot_id):
    """视频流端点"""
    def generate_frames():
        """生成视频帧"""
        while True:
            # 捕获图像
            image = HardwareInterface.capture_image(robot_id)
            
            if image is not None:
                # 编码图像
                ret, buffer = cv2.imencode('.jpg', image)
                if ret:
                    frame = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
            time.sleep(0.1)  # 10 FPS
    
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

# WebSocket事件处理
@socketio.on('connect')
def handle_connect():
    """客户端连接"""
    logger.info(f"客户端连接: {request.sid}")
    global_state.connected_clients.add(request.sid)
    
    # 加入仪表板房间
    join_room('dashboard')
    
    # 发送初始状态
    emit('initial_state', {
        'robots': global_state.robots,
        'active_tasks': global_state.active_tasks
    })

@socketio.on('disconnect')
def handle_disconnect():
    """客户端断开连接"""
    logger.info(f"客户端断开连接: {request.sid}")
    global_state.connected_clients.discard(request.sid)
    leave_room('dashboard')

@socketio.on('join_robot_room')
def handle_join_robot_room(data):
    """加入机器人房间"""
    robot_id = data.get('robot_id')
    if robot_id:
        room = f'robot_{robot_id}'
        join_room(room)
        logger.info(f"客户端 {request.sid} 加入机器人房间: {room}")

@socketio.on('robot_command')
def handle_robot_command(data):
    """处理机器人命令"""
    robot_id = data.get('robot_id')
    command = data.get('command')
    
    if robot_id and command:
        result = HardwareInterface.control_robot(robot_id, command)
        
        emit('command_response', {
            'robot_id': robot_id,
            'command': command,
            'result': result
        }, room=request.sid)

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'API端点不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': '内部服务器错误'}), 500

# 健康检查
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'connected_clients': len(global_state.connected_clients)
    })

# 主函数
def main():
    """主函数"""
    # 初始化数据库
    init_database()
    
    # 创建默认管理员用户
    conn = sqlite3.connect('agricultural_robot.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO users (username, password, email, role)
            VALUES (?, ?, ?, ?)
        ''', ('admin', 'admin123', 'admin@example.com', 'admin'))
        conn.commit()
        logger.info("创建默认管理员用户: admin/admin123")
    conn.close()
    
    logger.info("农业机器人API服务启动")
    logger.info("默认管理员账号: admin/admin123")

if __name__ == '__main__':
    main()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)