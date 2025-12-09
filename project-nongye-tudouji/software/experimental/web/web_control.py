#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
农业巡检机器人实验版本 - Web控制界面
提供基于Flask的Web控制界面，支持远程控制和实时监控
"""

from flask import Flask, render_template_string, request, jsonify, Response
import json
import time
import logging
import threading
import base64
import cv2
from pathlib import Path

# 导入硬件控制模块
try:
    from hardware.motor_control import MotorController
    from hardware.simple_detection import SimpleDetector
    from hardware.sensor_manager import SensorManager
except ImportError:
    print("警告：硬件模块导入失败，使用模拟模式")
    MotorController = None
    SimpleDetector = None
    SensorManager = None

class WebController:
    """Web控制器类"""
    
    def __init__(self, config_file=None, host='0.0.0.0', port=5000):
        """初始化Web控制器"""
        self.setup_logging()
        
        # Flask应用
        self.app = Flask(__name__)
        self.host = host
        self.port = port
        
        # 初始化硬件
        self.setup_hardware(config_file)
        
        # 状态变量
        self.is_running = False
        self.current_mode = "manual"
        self.patrol_thread = None
        self.monitoring_thread = None
        
        # 设置路由
        self.setup_routes()
        
        self.logger.info("Web控制器初始化完成")
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('WebController')
    
    def setup_hardware(self, config_file):
        """设置硬件模块"""
        try:
            if MotorController:
                self.motor = MotorController(config_file)
                self.logger.info("电机控制器初始化成功")
            else:
                self.motor = None
                self.logger.warning("电机控制器不可用，使用模拟模式")
            
            if SimpleDetector:
                self.detector = SimpleDetector(config_file)
                self.logger.info("检测器初始化成功")
            else:
                self.detector = None
                self.logger.warning("检测器不可用")
            
            if SensorManager:
                self.sensor = SensorManager(config_file)
                self.logger.info("传感器管理器初始化成功")
            else:
                self.sensor = None
                self.logger.warning("传感器管理器不可用")
                
        except Exception as e:
            self.logger.error(f"硬件初始化失败: {e}")
            self.motor = None
            self.detector = None
            self.sensor = None
    
    def setup_routes(self):
        """设置路由"""
        
        @self.app.route('/')
        def index():
            """主页面"""
            return render_template_string(self.get_main_html())
        
        @self.app.route('/control', methods=['POST'])
        def control():
            """控制接口"""
            try:
                data = request.json
                command = data.get('command', '')
                
                if command == 'stop':
                    result = self.stop_robot()
                elif command == 'forward':
                    result = self.move_forward(data.get('duration', 1))
                elif command == 'backward':
                    result = self.move_backward(data.get('duration', 1))
                elif command == 'left':
                    result = self.turn_left(data.get('duration', 0.5))
                elif command == 'right':
                    result = self.turn_right(data.get('duration', 0.5))
                elif command == 'spin_left':
                    result = self.spin_left(data.get('duration', 0.8))
                elif command == 'spin_right':
                    result = self.spin_right(data.get('duration', 0.8))
                elif command == 'start_patrol':
                    result = self.start_patrol()
                elif command == 'stop_patrol':
                    result = self.stop_patrol()
                elif command == 'detect':
                    result = self.detect_plants()
                elif command == 'scan':
                    result = self.scan_environment()
                else:
                    result = {'status': 'error', 'message': f'未知命令: {command}'}
                
                return jsonify(result)
                
            except Exception as e:
                self.logger.error(f"控制命令执行失败: {e}")
                return jsonify({'status': 'error', 'message': str(e)})
        
        @self.app.route('/status')
        def status():
            """状态接口"""
            return jsonify(self.get_robot_status())
        
        @self.app.route('/camera_feed')
        def camera_feed():
            """摄像头流"""
            return Response(self.generate_camera_stream(),
                         mimetype='multipart/x-mixed-replace; boundary=frame')
        
        @self.app.route('/detection')
        def detection():
            """检测接口"""
            return jsonify(self.run_detection())
        
        @self.app.route('/scan')
        def scan():
            """扫描接口"""
            return jsonify(self.run_scan())
    
    def get_main_html(self):
        """获取主页面HTML"""
        return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 农业巡检机器人控制面板</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Microsoft YaHei', Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        .status-panel {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
        }
        .control-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .control-panel {
            background: #fff;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .control-panel h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .direction-controls {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .btn {
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .btn:active {
            transform: translateY(0);
        }
        .btn-primary { background: #007bff; }
        .btn-success { background: #28a745; }
        .btn-warning { background: #ffc107; color: #333; }
        .btn-danger { background: #dc3545; }
        .btn-info { background: #17a2b8; }
        .btn-secondary { background: #6c757d; }
        .camera-section {
            background: #fff;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .camera-feed {
            width: 100%;
            max-width: 640px;
            height: auto;
            border-radius: 8px;
            border: 2px solid #ddd;
        }
        .detection-results {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            max-height: 200px;
            overflow-y: auto;
        }
        .sensor-data {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .sensor-card {
            background: #fff;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        .sensor-value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .sensor-label {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .alert-danger { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        
        @media (max-width: 768px) {
            .control-section {
                grid-template-columns: 1fr;
            }
            .direction-controls {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 农业巡检机器人</h1>
            <p>实验版本 - 远程控制与监控系统</p>
        </div>
        
        <div class="status-panel" id="status-panel">
            <strong>状态:</strong> <span id="robot-status">初始化中...</span>
        </div>
        
        <div class="control-section">
            <div class="control-panel">
                <h3>🎮 方向控制</h3>
                <div class="direction-controls">
                    <div></div>
                    <button class="btn btn-primary" onclick="sendCommand('forward')">⬆️ 前进</button>
                    <div></div>
                    <button class="btn btn-primary" onclick="sendCommand('left')">⬅️ 左转</button>
                    <button class="btn btn-danger" onclick="sendCommand('stop')">⏹️ 停止</button>
                    <button class="btn btn-primary" onclick="sendCommand('right')">➡️ 右转</button>
                    <div></div>
                    <button class="btn btn-warning" onclick="sendCommand('backward')">⬇️ 后退</button>
                    <div></div>
                </div>
                
                <h3>🔄 旋转控制</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="btn btn-info" onclick="sendCommand('spin_left')">↺ 原地左转</button>
                    <button class="btn btn-info" onclick="sendCommand('spin_right')">↻ 原地右转</button>
                </div>
            </div>
            
            <div class="control-panel">
                <h3>🎯 自动功能</h3>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    <button class="btn btn-success" onclick="sendCommand('start_patrol')">🚀 开始巡逻</button>
                    <button class="btn btn-secondary" onclick="sendCommand('stop_patrol')">⏹️ 停止巡逻</button>
                    <button class="btn btn-info" onclick="detectPlants()">🌿 检测植物</button>
                    <button class="btn btn-warning" onclick="scanEnvironment()">📡 扫描环境</button>
                </div>
            </div>
        </div>
        
        <div class="camera-section">
            <h3>📷 实时摄像头</h3>
            <img id="camera-feed" class="camera-feed" src="/camera_feed" alt="摄像头画面">
            <div class="detection-results" id="detection-results">
                <strong>检测结果:</strong> 等待检测...
            </div>
        </div>
        
        <div class="sensor-data" id="sensor-data">
            <div class="sensor-card">
                <div class="sensor-value" id="distance-value">--</div>
                <div class="sensor-label">前方距离 (cm)</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-value" id="plants-value">--</div>
                <div class="sensor-label">检测到的植物</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-value" id="obstacles-value">--</div>
                <div class="sensor-label">障碍物数量</div>
            </div>
            <div class="sensor-card">
                <div class="sensor-value" id="battery-value">--</div>
                <div class="sensor-label">电池电压 (V)</div>
            </div>
        </div>
    </div>
    
    <script>
        let statusUpdateInterval;
        let sensorUpdateInterval;
        
        function updateStatus() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('robot-status').textContent = 
                        `模式: ${data.mode} | 状态: ${data.is_running ? '运行中' : '停止'}`;
                })
                .catch(error => console.error('状态更新失败:', error));
        }
        
        function updateSensors() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    if (data.sensors) {
                        document.getElementById('distance-value').textContent = 
                            data.sensors.front_distance ? data.sensors.front_distance.toFixed(1) : '--';
                        document.getElementById('battery-value').textContent = 
                            data.sensors.battery_voltage ? data.sensors.battery_voltage.toFixed(1) : '--';
                    }
                    document.getElementById('plants-value').textContent = 
                        data.plant_count || '--';
                    document.getElementById('obstacles-value').textContent = 
                        data.obstacle_count || '--';
                })
                .catch(error => console.error('传感器更新失败:', error));
        }
        
        function sendCommand(command, duration) {
            const data = {command: command};
            if (duration) {
                data.duration = duration;
            }
            
            updateStatusDisplay(`发送命令: ${command}`);
            
            fetch('/control', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    updateStatusDisplay(data.message || '命令执行成功', 'success');
                } else {
                    updateStatusDisplay(data.message || '命令执行失败', 'danger');
                }
            })
            .catch(error => {
                updateStatusDisplay(`通信错误: ${error}`, 'danger');
            });
        }
        
        function detectPlants() {
            updateStatusDisplay('正在检测植物...');
            
            fetch('/detection')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        let resultHtml = `<strong>检测结果:</strong> 找到 ${data.plants.length} 个植物<br>`;
                        data.plants.forEach((plant, index) => {
                            resultHtml += `植物${index+1}: 位置${plant.position}, 面积${plant.area}<br>`;
                        });
                        document.getElementById('detection-results').innerHTML = resultHtml;
                        updateStatusDisplay(`检测完成，找到${data.plants.length}个植物`, 'success');
                    } else {
                        updateStatusDisplay(data.message || '检测失败', 'danger');
                    }
                })
                .catch(error => {
                    updateStatusDisplay(`检测错误: ${error}`, 'danger');
                });
        }
        
        function scanEnvironment() {
            updateStatusDisplay('正在扫描环境...');
            
            fetch('/scan')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        updateStatusDisplay(`环境扫描完成，最安全方向: ${data.safest_direction}°`, 'success');
                    } else {
                        updateStatusDisplay(data.message || '扫描失败', 'danger');
                    }
                })
                .catch(error => {
                    updateStatusDisplay(`扫描错误: ${error}`, 'danger');
                });
        }
        
        function updateStatusDisplay(message, type = 'info') {
            const statusPanel = document.getElementById('status-panel');
            const alertClass = type === 'success' ? 'alert-success' : 
                             type === 'danger' ? 'alert-danger' : 'alert-warning';
            statusPanel.className = `status-panel alert ${alertClass}`;
            statusPanel.innerHTML = `<strong>${message}</strong>`;
            
            // 3秒后恢复正常状态
            setTimeout(() => {
                statusPanel.className = 'status-panel';
                updateStatus();
            }, 3000);
        }
        
        // 启动定期更新
        window.onload = function() {
            statusUpdateInterval = setInterval(updateStatus, 5000);
            sensorUpdateInterval = setInterval(updateSensors, 2000);
            updateStatus();
            updateSensors();
        };
        
        // 页面关闭时清理
        window.onbeforeunload = function() {
            if (statusUpdateInterval) clearInterval(statusUpdateInterval);
            if (sensorUpdateInterval) clearInterval(sensorUpdateInterval);
        };
    </script>
</body>
</html>
        """
    
    # 硬件控制方法
    def move_forward(self, duration=1):
        """前进"""
        if self.motor:
            return self.motor.forward(duration)
        return {'status': 'success', 'message': '模拟前进完成'}
    
    def move_backward(self, duration=1):
        """后退"""
        if self.motor:
            return self.motor.backward(duration)
        return {'status': 'success', 'message': '模拟后退完成'}
    
    def turn_left(self, duration=0.5):
        """左转"""
        if self.motor:
            return self.motor.left_turn(duration)
        return {'status': 'success', 'message': '模拟左转完成'}
    
    def turn_right(self, duration=0.5):
        """右转"""
        if self.motor:
            return self.motor.right_turn(duration)
        return {'status': 'success', 'message': '模拟右转完成'}
    
    def spin_left(self, duration=0.8):
        """原地左转"""
        if self.motor:
            return self.motor.spin_left(duration)
        return {'status': 'success', 'message': '模拟原地左转完成'}
    
    def spin_right(self, duration=0.8):
        """原地右转"""
        if self.motor:
            return self.motor.spin_right(duration)
        return {'status': 'success', 'message': '模拟原地右转完成'}
    
    def stop_robot(self):
        """停止机器人"""
        if self.motor:
            success = self.motor.stop()
            self.stop_patrol()
            return {'status': 'success' if success else 'error', 'message': '机器人已停止'}
        return {'status': 'success', 'message': '模拟停止完成'}
    
    def start_patrol(self):
        """开始巡逻"""
        if self.patrol_thread and self.patrol_thread.is_alive():
            return {'status': 'error', 'message': '巡逻已在运行'}
        
        self.patrol_thread = threading.Thread(target=self.patrol_loop, daemon=True)
        self.patrol_thread.start()
        return {'status': 'success', 'message': '巡逻已开始'}
    
    def stop_patrol(self):
        """停止巡逻"""
        self.current_mode = "manual"
        return {'status': 'success', 'message': '巡逻已停止'}
    
    def patrol_loop(self):
        """巡逻循环"""
        self.current_mode = "patrol"
        self.logger.info("开始自动巡逻")
        
        try:
            while self.current_mode == "patrol":
                # 前进2秒
                if self.motor:
                    self.motor.forward(2)
                time.sleep(0.5)
                
                # 检测植物
                if self.detector:
                    image = self.detector.capture_image(save=False)
                    if image is not None:
                        plants, _ = self.detector.detect_green_plants(image)
                        if plants:
                            self.logger.info(f"巡逻中发现{len(plants)}个植物")
                
                # 右转1秒
                if self.motor:
                    self.motor.right_turn(1)
                time.sleep(0.5)
                
        except Exception as e:
            self.logger.error(f"巡逻循环出错: {e}")
    
    def detect_plants(self):
        """检测植物"""
        if not self.detector:
            return {'status': 'error', 'message': '检测器不可用'}
        
        try:
            image = self.detector.capture_image()
            if image is None:
                return {'status': 'error', 'message': '无法捕获图像'}
            
            plants, _ = self.detector.detect_green_plants(image)
            
            return {
                'status': 'success',
                'message': f'检测到{len(plants)}个植物',
                'plants': plants
            }
            
        except Exception as e:
            self.logger.error(f"植物检测失败: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def scan_environment(self):
        """扫描环境"""
        if not self.sensor:
            return {'status': 'error', 'message': '传感器不可用'}
        
        try:
            scan_results = self.sensor.scan_surroundings()
            safest_angle, max_distance = self.sensor.find_safest_direction(scan_results)
            
            return {
                'status': 'success',
                'message': f'环境扫描完成，最安全方向: {safest_angle}°',
                'scan_results': scan_results,
                'safest_direction': safest_angle,
                'max_distance': max_distance
            }
            
        except Exception as e:
            self.logger.error(f"环境扫描失败: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def generate_camera_stream(self):
        """生成摄像头流"""
        while True:
            try:
                if self.detector:
                    frame = self.detector.capture_image(save=False)
                    if frame is not None:
                        # 编码为JPEG
                        ret, jpeg = cv2.imencode('.jpg', frame)
                        if ret:
                            frame_bytes = jpeg.tobytes()
                            yield (b'--frame\r\n'
                                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                else:
                    # 生成测试图像
                    test_frame = self.generate_test_frame()
                    ret, jpeg = cv2.imencode('.jpg', test_frame)
                    if ret:
                        frame_bytes = jpeg.tobytes()
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                time.sleep(0.1)  # 控制帧率
                
            except Exception as e:
                self.logger.error(f"摄像头流生成失败: {e}")
                break
    
    def generate_test_frame(self):
        """生成测试图像"""
        import numpy as np
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # 添加测试文本
        cv2.putText(frame, 'Camera Test Mode', (200, 240), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(frame, time.strftime('%Y-%m-%d %H:%M:%S'), (200, 280), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        return frame
    
    def get_robot_status(self):
        """获取机器人状态"""
        status = {
            'mode': self.current_mode,
            'is_running': self.is_running,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # 获取传感器数据
        if self.sensor:
            sensor_data = self.sensor.get_sensor_data()
            status['sensors'] = sensor_data
            status['plant_count'] = len(sensor_data.get('obstacles', []))
            status['obstacle_count'] = len(sensor_data.get('obstacles', []))
        else:
            status['sensors'] = {}
            status['plant_count'] = 0
            status['obstacle_count'] = 0
        
        return status
    
    def run_detection(self):
        """运行检测"""
        return self.detect_plants()
    
    def run_scan(self):
        """运行扫描"""
        return self.scan_environment()
    
    def run(self, debug=False):
        """运行Web服务器"""
        self.logger.info(f"启动Web服务器: http://{self.host}:{self.port}")
        self.is_running = True
        
        try:
            self.app.run(host=self.host, port=self.port, debug=debug, threaded=True)
        except Exception as e:
            self.logger.error(f"Web服务器启动失败: {e}")
    
    def stop(self):
        """停止Web服务器"""
        self.is_running = False
        self.stop_patrol()
        self.logger.info("Web服务器已停止")

def start_web_server(config_file=None, host='0.0.0.0', port=5000):
    """启动Web服务器的便捷函数"""
    web_controller = WebController(config_file, host, port)
    return web_controller

# 主程序
if __name__ == "__main__":
    import sys
    
    config_file = None
    host = '0.0.0.0'
    port = 5000
    
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    if len(sys.argv) > 2:
        host = sys.argv[2]
    if len(sys.argv) > 3:
        port = int(sys.argv[3])
    
    controller = start_web_server(config_file, host, port)
    
    try:
        controller.run(debug=False)
    except KeyboardInterrupt:
        print("\nWeb服务器被用户中断")
        controller.stop()