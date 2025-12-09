# 农业巡检机器人及智慧终端

## 项目概述

通过智能化技术解决农业场景中的巡检效率低、人工成本高、作业精度差等问题，推动"无人化农场"落地。

## 核心目标

- 实现作物/果实的自动识别与定位（如土豆、地瓜等）
- 联动农业设备（水泵、滑台、底盘）完成自动化作业
- 提供Web可视化监控与远程管理，降低农业操作门槛

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Web可视化层                                │
│                  Vue.js/React + WebSocket                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API服务层                                  │
│                 Flask/Django + REST API                      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    算法处理层                                  │
│           YOLOv11检测 + 路径规划 + 设备控制                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    嵌入式控制层                                  │
│                 ROS/嵌入式系统 + 通信协议                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    硬件执行层                                   │
│         底盘 + 传感器 + 执行机构 + 通信模块                      │
└─────────────────────────────────────────────────────────────┘
```

## 项目结构

```
project-nongye-tudouji/
├── hardware/                 # 硬件控制模块
│   ├── chassis/             # 底盘控制
│   ├── sensors/              # 传感器接口
│   ├── actuators/            # 执行机构
│   └── communication/        # 通信模块
├── software/                # 软件系统
│   ├── backend/              # 后端API服务
│   ├── frontend/             # Web前端
│   └── embedded/             # 嵌入式程序
├── algorithms/               # 算法模块
│   ├── detection/            # YOLOv11检测
│   ├── planning/             # 路径规划
│   └── control/              # 控制算法
├── data/                     # 数据管理
│   ├── datasets/             # 数据集
│   ├── models/               # 模型文件
│   └── logs/                 # 日志文件
├── config/                   # 配置文件
│   ├── hardware/             # 硬件配置
│   ├── software/             # 软件配置
│   └── deployment/           # 部署配置
├── docs/                     # 文档资料
│   ├── api/                  # API文档
│   ├── hardware/             # 硬件文档
│   └── user/                 # 用户手册
└── scripts/                  # 部署脚本
    ├── install/              # 安装脚本
    ├── deploy/               # 部署脚本
    └── maintenance/          # 维护脚本
```

## 快速开始

### 环境要求

- Python 3.8+
- ROS2 (Humble/Foxy)
- Node.js 16+
- CUDA 11.0+ (GPU加速)

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/project-nongye-tudouji.git
cd project-nongye-tudouji
```

2. **安装依赖**
```bash
# Python依赖
pip install -r requirements.txt

# 前端依赖
cd software/frontend
npm install

# ROS依赖
rosdep install --from-paths src --ignore-src -r -y
```

3. **配置环境**
```bash
# 复制配置文件
cp config/software/config.example.yaml config/software/config.yaml

# 配置硬件参数
vim config/software/config.yaml
```

4. **启动系统**
```bash
# 启动ROS节点
ros2 launch agricultural_robot system.launch.py

# 启动后端服务
cd software/backend && python app.py

# 启动前端
cd software/frontend && npm run serve
```

## 核心功能

### 🤖 自动识别与定位
- 基于YOLOv11的高精度作物识别
- 支持土豆、地瓜、杂草、病虫害等多类别检测
- 实时目标定位与状态分析

### 🚗 智能巡检与作业
- 自主导航与路径规划
- 多设备联动控制（底盘、水泵、滑台等）
- 基于检测结果的自动化作业流程

### 📊 可视化监控
- 实时视频流与检测结果展示
- 历史数据分析与报告生成
- 远程任务下发与参数配置

### 🔄 多设备协同
- 支持多台机器人同时作业
- 智能任务分配与冲突避免
- 分布式数据采集与处理

## 应用场景

### 🌱 智能温室
- 作物生长状态监测
- 环境参数自动调节
- 精准灌溉与施肥

### 🌾 大田作物管理
- 大面积作物巡检
- 病虫害早期发现
- 自动化除草与喷药

### 🍎 果园管理
- 果实成熟度检测
- 智能采摘调度
- 产量预测分析

## 开发指南

### 添加新的检测类别
1. 准备标注数据集
2. 训练YOLOv11模型
3. 更新配置文件
4. 测试验证效果

### 扩展硬件支持
1. 在`hardware/`下添加驱动代码
2. 实现ROS接口
3. 更新配置参数
4. 编写单元测试

### 集成新算法
1. 在`algorithms/`下实现算法
2. 编写API接口
3. 添加配置选项
4. 性能测试优化

## API文档

### 检测接口
```
POST /api/detection
Content-Type: application/json

{
  "image": "base64_image_data"
}

Response:
{
  "detections": [
    {
      "class": "potato",
      "confidence": 0.95,
      "bbox": [x, y, w, h]
    }
  ]
}
```

### 控制接口
```
POST /api/control
Content-Type: application/json

{
  "device": "chassis",
  "action": "move",
  "parameters": {
    "x": 1.0,
    "y": 0.5
  }
}
```

## 配置说明

### 硬件配置 (config/hardware/)
```yaml
chassis:
  max_speed: 1.0  # m/s
  wheel_base: 0.5 # m
  
sensors:
  camera:
    resolution: [1920, 1080]
    fps: 30
  
actuators:
  pump:
    max_flow: 2.0 # L/min
```

### 算法配置 (config/software/)
```yaml
detection:
  model_path: "data/models/yolov11.pt"
  confidence_threshold: 0.7
  nms_threshold: 0.4
  
planning:
  algorithm: "A*"
  grid_resolution: 0.1
```

## 开源协议

本项目采用 MIT License 开源协议，允许商业使用。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 联系方式

- 项目维护者：Your Name
- 邮箱：your.email@example.com
- 技术交流群：QQ群号

## 致谢

感谢所有为本项目做出贡献的开发者和研究机构。

---

**让我们一起推动农业智能化，建设更美好的未来！** 🌾