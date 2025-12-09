# 农业巡检机器人API文档

## 概述

本文档描述了农业巡检机器人系统的RESTful API接口，包括认证、机器人控制、目标检测、数据查询等功能。

## 基础信息

- **Base URL**: `http://localhost:5000/api`
- **API版本**: v1
- **认证方式**: JWT Token
- **数据格式**: JSON

## 认证

### 登录
获取访问令牌，用于后续API调用。

**请求**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**错误响应**
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

### 使用Token
在请求头中添加认证信息：
```
Authorization: Bearer <access_token>
```

## 机器人管理

### 获取机器人列表
获取所有机器人的基本信息。

**请求**
```http
GET /api/robots
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "robots": [
    {
      "id": "robot_01",
      "name": "机器人01",
      "type": "agricultural",
      "status": "online",
      "position": {
        "x": 12.5,
        "y": 8.3,
        "theta": 1.57
      },
      "battery_level": 85,
      "last_seen": "2024-12-05T10:30:00Z",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### 获取单个机器人信息
获取指定机器人的详细信息。

**请求**
```http
GET /api/robots/{robot_id}
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "robot": {
    "id": "robot_01",
    "name": "机器人01",
    "type": "agricultural",
    "status": "online",
    "position": {
      "x": 12.5,
      "y": 8.3,
      "theta": 1.57
    },
    "battery_level": 85,
    "mode": "patrol",
    "velocity": 0.8,
    "last_seen": "2024-12-05T10:30:00Z",
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

### 控制机器人
向机器人发送控制命令。

**请求**
```http
POST /api/robots/{robot_id}/control
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "move",
  "linear_velocity": 0.5,
  "angular_velocity": 0.2
}
```

**移动控制参数**
- `type`: `move`
- `linear_velocity`: 线速度 (-1.0 到 1.0 m/s)
- `angular_velocity`: 角速度 (-1.5 到 1.5 rad/s)

**导航控制参数**
```json
{
  "type": "navigate",
  "target_x": 10.0,
  "target_y": 15.0,
  "target_theta": 0.0
}
```

**执行机构控制参数**
```json
{
  "type": "actuator",
  "actuator_id": "water_pump_1",
  "action": "set",
  "parameters": {
    "flow_rate": 1.5
  }
}
```

**响应**
```json
{
  "success": true,
  "message": "命令发送成功"
}
```

## 任务管理

### 获取任务列表
获取任务列表，支持过滤。

**请求**
```http
GET /api/tasks?robot_id=robot_01&status=running
Authorization: Bearer <access_token>
```

**查询参数**
- `robot_id` (可选): 机器人ID
- `status` (可选): 任务状态 (pending, running, completed, failed)
- `limit` (可选): 返回数量限制

**响应**
```json
{
  "success": true,
  "tasks": [
    {
      "id": 1,
      "robot_id": "robot_01",
      "task_type": "irrigation",
      "parameters": {
        "target_x": 10.0,
        "target_y": 15.0,
        "duration": 30
      },
      "status": "running",
      "progress": 65,
      "created_at": "2024-12-05T10:00:00Z",
      "started_at": "2024-12-05T10:01:00Z",
      "completed_at": null
    }
  ]
}
```

### 创建任务
创建新的任务。

**请求**
```http
POST /api/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "robot_id": "robot_01",
  "task_type": "irrigation",
  "parameters": {
    "target_x": 10.0,
    "target_y": 15.0,
    "duration": 30
  }
}
```

**任务类型**
- `irrigation`: 灌溉任务
- `patrol`: 巡检任务
- `detection`: 检测任务
- `harvesting`: 采摘任务

**响应**
```json
{
  "success": true,
  "task_id": 2,
  "message": "任务创建成功"
}
```

## 目标检测

### 执行检测
对上传的图像进行目标检测。

**请求**
```http
POST /api/detect
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "robot_id": "robot_01",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

**响应**
```json
{
  "success": true,
  "detections": [
    {
      "class_id": 0,
      "class_name": "土豆",
      "confidence": 0.92,
      "bbox": [100, 100, 120, 80]
    }
  ],
  "detection_count": 1
}
```

### 获取检测结果
获取历史检测结果。

**请求**
```http
GET /api/detections?robot_id=robot_01&class_name=土豆&limit=100
Authorization: Bearer <access_token>
```

**查询参数**
- `robot_id` (可选): 机器人ID
- `class_name` (可选): 检测类别
- `start_time` (可选): 开始时间
- `end_time` (可选): 结束时间
- `limit` (可选): 返回数量限制

**响应**
```json
{
  "success": true,
  "detections": [
    {
      "id": 1,
      "robot_id": "robot_01",
      "class_name": "土豆",
      "confidence": 0.92,
      "bbox": [100, 100, 120, 80],
      "image_path": "/uploads/detection_1.jpg",
      "timestamp": "2024-12-05T10:30:00Z"
    }
  ],
  "total_count": 1
}
```

## 环境数据

### 获取环境数据
获取环境传感器数据。

**请求**
```http
GET /api/environment?robot_id=robot_01&hours=24
Authorization: Bearer <access_token>
```

**查询参数**
- `robot_id` (可选): 机器人ID
- `hours` (可选): 时间范围（小时）

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "robot_id": "robot_01",
      "temperature": 25.6,
      "humidity": 68.5,
      "soil_ph": 6.8,
      "light_intensity": 12500,
      "timestamp": "2024-12-05T10:30:00Z"
    }
  ],
  "count": 1
}
```

## 视频流

### 获取视频流
获取机器人实时视频流。

**请求**
```http
GET /api/video/stream/{robot_id}
Authorization: Bearer <access_token>
```

**响应**
返回MJPEG视频流。

## WebSocket事件

### 连接
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// 连接事件
socket.on('connect', () => {
  console.log('Connected to server');
});

// 机器人状态更新
socket.on('robot_status_update', (data) => {
  console.log('Robot status:', data);
});

// 检测结果
socket.on('detection_result', (data) => {
  console.log('Detection:', data);
});

// 任务更新
socket.on('task_update', (data) => {
  console.log('Task update:', data);
});
```

### 加入机器人房间
```javascript
// 加入特定机器人的房间
socket.emit('join_robot_room', {
  robot_id: 'robot_01'
});
```

### 发送命令
```javascript
// 发送机器人命令
socket.emit('robot_command', {
  robot_id: 'robot_01',
  command: {
    type: 'move',
    linear_velocity: 0.5,
    angular_velocity: 0.0
  }
});
```

## 错误处理

### 标准错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error_code": "ERROR_CODE"
}
```

### 常见错误码
- `UNAUTHORIZED`: 未授权访问
- `FORBIDDEN`: 权限不足
- `NOT_FOUND`: 资源未找到
- `VALIDATION_ERROR`: 参数验证失败
- `INTERNAL_ERROR`: 内部服务器错误

## 限制

### 请求频率
- 每个IP每分钟最多100个请求
- 超出限制返回429状态码

### 文件上传
- 最大文件大小: 16MB
- 支持格式: jpg, jpeg, png, mp4, avi

### 数据返回
- 默认返回数量: 100条
- 最大返回数量: 1000条

## 示例代码

### JavaScript/Node.js
```javascript
const axios = require('axios');

class AgriculturalRobotAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
  }

  async getRobots() {
    try {
      const response = await this.client.get('/robots');
      return response.data;
    } catch (error) {
      console.error('Get robots failed:', error.response.data);
      throw error;
    }
  }

  async controlRobot(robotId, command) {
    try {
      const response = await this.client.post(`/robots/${robotId}/control`, command);
      return response.data;
    } catch (error) {
      console.error('Control robot failed:', error.response.data);
      throw error;
    }
  }

  async performDetection(robotId, imageBase64) {
    try {
      const response = await this.client.post('/detect', {
        robot_id: robotId,
        image: imageBase64
      });
      return response.data;
    } catch (error) {
      console.error('Detection failed:', error.response.data);
      throw error;
    }
  }
}

// 使用示例
const api = new AgriculturalRobotAPI('http://localhost:5000/api', 'your-token');

// 获取机器人列表
api.getRobots().then(result => {
  console.log('Robots:', result.robots);
});

// 控制机器人
api.controlRobot('robot_01', {
  type: 'move',
  linear_velocity: 0.5,
  angular_velocity: 0.0
}).then(result => {
  console.log('Control result:', result);
});
```

### Python
```python
import requests
import json
import base64

class AgriculturalRobotAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_robots(self):
        """获取机器人列表"""
        response = requests.get(f'{self.base_url}/robots', headers=self.headers)
        return response.json()

    def control_robot(self, robot_id, command):
        """控制机器人"""
        url = f'{self.base_url}/robots/{robot_id}/control'
        response = requests.post(url, json=command, headers=self.headers)
        return response.json()

    def perform_detection(self, robot_id, image_path):
        """执行检测"""
        with open(image_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        data = {
            'robot_id': robot_id,
            'image': f'data:image/jpeg;base64,{image_data}'
        }
        
        response = requests.post(f'{self.base_url}/detect', 
                               json=data, headers=self.headers)
        return response.json()

# 使用示例
api = AgriculturalRobotAPI('http://localhost:5000/api', 'your-token')

# 获取机器人列表
robots = api.get_robots()
print('Robots:', robots)

# 控制机器人
result = api.control_robot('robot_01', {
    'type': 'move',
    'linear_velocity': 0.5,
    'angular_velocity': 0.0
})
print('Control result:', result)
```

## 版本更新

### v1.0.0
- 初始版本发布
- 支持基础机器人控制
- 支持目标检测
- 支持任务管理

### 更新记录
- 检查更新: `GET /api/version`
- 更新日志: `GET /api/changelog`

## 联系支持

- **技术支持**: tech-support@agricultural-robot.com
- **文档更新**: docs@agricultural-robot.com
- **问题反馈**: https://github.com/project-nongye-tudouji/issues