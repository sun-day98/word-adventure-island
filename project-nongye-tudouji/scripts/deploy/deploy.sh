#!/bin/bash

# 农业巡检机器人部署脚本
# 支持开发、测试、生产环境部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查Python
    check_command python3
    python_version=$(python3 --version 2>&1 | cut -d' ' -f2)
    log_info "Python版本: $python_version"
    
    # 检查Node.js (前端需要)
    if command -v node &> /dev/null; then
        node_version=$(node --version)
        log_info "Node.js版本: $node_version"
    else
        log_warn "Node.js未找到，前端构建将跳过"
    fi
    
    # 检查ROS2
    if command -v ros2 &> /dev/null; then
        log_info "ROS2已安装"
    else
        log_warn "ROS2未找到，请先安装ROS2"
    fi
    
    # 检查Docker (可选)
    if command -v docker &> /dev/null; then
        log_info "Docker已安装"
    else
        log_warn "Docker未找到，容器化部署将跳过"
    fi
}

# 设置环境变量
setup_environment() {
    log_info "设置环境变量..."
    
    # 读取配置文件
    if [ -f "config/software/config.yaml" ]; then
        export AGRI_ROBOT_CONFIG="config/software/config.yaml"
        log_info "配置文件已加载: $AGRI_ROBOT_CONFIG"
    else
        log_error "配置文件未找到: config/software/config.yaml"
        exit 1
    fi
    
    # 设置Python路径
    export PYTHONPATH="${PYTHONPATH}:$(pwd)"
    export PYTHONPATH="${PYTHONPATH}:$(pwd)/hardware"
    export PYTHONPATH="${PYTHONPATH}:$(pwd)/algorithms"
    export PYTHONPATH="${PYTHONPATH}:$(pwd)/software"
    
    # 创建必要目录
    mkdir -p data/models
    mkdir -p data/logs
    mkdir -p uploads
    mkdir -p backups
    mkdir -p logs
    
    log_info "目录结构已创建"
}

# 安装Python依赖
install_python_dependencies() {
    log_info "安装Python依赖..."
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        log_info "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 升级pip
    pip install --upgrade pip
    
    # 安装依赖
    if [ -f "software/backend/requirements.txt" ]; then
        pip install -r software/backend/requirements.txt
        log_info "后端依赖已安装"
    fi
    
    # 安装额外依赖
    pip install pyyaml matplotlib seaborn pandas opencv-python-headless
    pip install rospkg catkin_pkg
    
    log_info "Python依赖安装完成"
}

# 安装前端依赖
install_frontend_dependencies() {
    if [ ! -d "software/frontend" ]; then
        log_warn "前端目录不存在，跳过前端构建"
        return
    fi
    
    if ! command -v node &> /dev/null; then
        log_warn "Node.js未找到，跳过前端构建"
        return
    fi
    
    log_info "安装前端依赖..."
    
    cd software/frontend
    
    # 安装依赖
    if [ -f "package.json" ]; then
        npm install
        log_info "前端依赖已安装"
    fi
    
    # 构建前端
    log_info "构建前端..."
    npm run build
    
    cd ../..
    log_info "前端构建完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    source venv/bin/activate
    
    # 运行数据库初始化
    python3 -c "
from software.backend.app import init_database
init_database()
print('数据库初始化完成')
"
    
    # 创建默认管理员用户
    python3 -c "
import sqlite3
conn = sqlite3.connect('agricultural_robot.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
if not cursor.fetchone():
    cursor.execute('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                   ('admin', 'admin123', 'admin@agricultural-robot.com', 'admin'))
    conn.commit()
    print('默认管理员用户已创建: admin/admin123')
conn.close()
"
}

# 下载模型文件
download_models() {
    log_info "下载模型文件..."
    
    # 检查模型目录
    if [ ! -d "data/models" ]; then
        mkdir -p data/models
    fi
    
    # 这里可以添加模型下载逻辑
    # 例如：从云端下载或使用预训练模型
    
    if [ ! -f "data/models/yolov11.pt" ]; then
        log_warn "YOLOv11模型未找到，请手动下载到 data/models/yolov11.pt"
        log_info "下载地址: https://github.com/ultralytics/ultralytics/releases"
    fi
}

# 配置服务
setup_services() {
    log_info "配置系统服务..."
    
    # 创建systemd服务文件
    cat > agricultural-robot.service << EOF
[Unit]
Description=Agricultural Robot Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PYTHONPATH=$(pwd)
ExecStart=$(pwd)/venv/bin/python software/backend/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    log_info "服务文件已创建: agricultural-robot.service"
    log_info "要启用服务，请运行:"
    log_info "  sudo cp agricultural-robot.service /etc/systemd/system/"
    log_info "  sudo systemctl daemon-reload"
    log_info "  sudo systemctl enable agricultural-robot"
    log_info "  sudo systemctl start agricultural-robot"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 检查端口占用
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
        log_warn "端口5000已被占用，请检查是否有其他服务运行"
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 启动后端服务
    nohup python software/backend/app.py > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    
    log_info "后端服务已启动，PID: $BACKEND_PID"
    log_info "访问地址: http://localhost:5000"
    
    # 启动ROS2节点（如果可用）
    if command -v ros2 &> /dev/null; then
        source /opt/ros/$ROS_DISTRO/setup.bash
        nohup ros2 launch agricultural_robot system.launch.py > logs/ros2.log 2>&1 &
        ROS2_PID=$!
        echo $ROS2_PID > .ros2.pid
        
        log_info "ROS2节点已启动，PID: $ROS2_PID"
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    # 停止后端服务
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            log_info "后端服务已停止"
        fi
        rm .backend.pid
    fi
    
    # 停止ROS2节点
    if [ -f ".ros2.pid" ]; then
        ROS2_PID=$(cat .ros2.pid)
        if kill -0 $ROS2_PID 2>/dev/null; then
            kill $ROS2_PID
            log_info "ROS2节点已停止"
        fi
        rm .ros2.pid
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查后端服务
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:5000/api/health > /dev/null; then
            log_info "后端服务: 正常"
        else
            log_error "后端服务: 异常"
        fi
    else
        log_warn "curl命令未找到，无法检查后端服务"
    fi
    
    # 检查数据库
    if [ -f "agricultural_robot.db" ]; then
        log_info "数据库: 正常"
    else
        log_error "数据库: 未找到"
    fi
    
    # 检查日志
    if [ -d "logs" ]; then
        log_info "日志目录: 正常"
    else
        log_warn "日志目录: 未找到"
    fi
}

# 清理
cleanup() {
    log_info "清理临时文件..."
    
    # 停止服务
    stop_services
    
    # 清理日志（可选）
    read -p "是否清理日志文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -d "logs" ]; then
            rm -rf logs/*
            log_info "日志文件已清理"
        fi
    fi
    
    # 清理构建文件（可选）
    read -p "是否清理构建文件? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf software/frontend/dist
        rm -rf software/frontend/node_modules/.cache
        log_info "构建文件已清理"
    fi
}

# 备份数据
backup_data() {
    log_info "备份数据..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # 备份数据库
    if [ -f "agricultural_robot.db" ]; then
        cp agricultural_robot.db $BACKUP_DIR/
        log_info "数据库已备份到 $BACKUP_DIR"
    fi
    
    # 备份配置文件
    if [ -d "config" ]; then
        cp -r config $BACKUP_DIR/
        log_info "配置文件已备份到 $BACKUP_DIR"
    fi
    
    # 备份日志
    if [ -d "logs" ]; then
        cp -r logs $BACKUP_DIR/
        log_info "日志文件已备份到 $BACKUP_DIR"
    fi
    
    log_info "数据备份完成: $BACKUP_DIR"
}

# 显示帮助信息
show_help() {
    echo "农业巡检机器人部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  deploy      完整部署"
    echo "  dev         开发环境部署"
    echo "  prod        生产环境部署"
    echo "  start       启动服务"
    echo "  stop        停止服务"
    echo "  restart     重启服务"
    echo "  status      查看状态"
    echo "  health      健康检查"
    echo "  backup      备份数据"
    echo "  cleanup     清理"
    echo "  help        显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 deploy     # 完整部署"
    echo "  $0 dev        # 开发环境部署"
    echo "  $0 start      # 启动服务"
}

# 主函数
main() {
    case "$1" in
        "deploy")
            log_info "开始完整部署..."
            check_requirements
            setup_environment
            install_python_dependencies
            install_frontend_dependencies
            init_database
            download_models
            setup_services
            start_services
            health_check
            log_info "部署完成！"
            ;;
        "dev")
            log_info "开发环境部署..."
            check_requirements
            setup_environment
            install_python_dependencies
            init_database
            log_info "开发环境部署完成！"
            ;;
        "prod")
            log_info "生产环境部署..."
            check_requirements
            setup_environment
            install_python_dependencies
            install_frontend_dependencies
            init_database
            setup_services
            log_info "生产环境部署完成！"
            ;;
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            start_services
            ;;
        "status")
            health_check
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_data
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "config/software/config.yaml" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

# 执行主函数
main "$@"