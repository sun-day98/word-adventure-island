#!/bin/bash
# 农业巡检机器人实验版本启动脚本

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在树莓派上
check_raspberry_pi() {
    if [ -f /proc/cpuinfo ]; then
        if grep -q "BCM2835" /proc/cpuinfo; then
            print_success "检测到树莓派平台"
            return 0
        fi
    fi
    print_warning "未检测到树莓派，某些功能可能不可用"
    return 1
}

# 检查Python环境
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python3已安装，版本: $PYTHON_VERSION"
        return 0
    else
        print_error "Python3未安装，请先安装Python3"
        exit 1
    fi
}

# 检查依赖包
check_dependencies() {
    print_info "检查Python依赖包..."
    
    # 检查关键依赖
    python3 -c "import RPi.GPIO" 2>/dev/null || {
        print_error "RPi.GPIO未安装，运行: pip install RPi.GPIO"
        return 1
    }
    
    python3 -c "import picamera" 2>/dev/null || {
        print_error "picamera未安装，运行: pip install picamera"
        return 1
    }
    
    python3 -c "import cv2" 2>/dev/null || {
        print_error "OpenCV未安装，运行: pip install opencv-python"
        return 1
    }
    
    python3 -c "import flask" 2>/dev/null || {
        print_error "Flask未安装，运行: pip install flask"
        return 1
    }
    
    print_success "所有依赖包已安装"
    return 0
}

# 检查硬件权限
check_hardware_permissions() {
    print_info "检查硬件权限..."
    
    # 检查GPIO权限
    if [ -w /dev/gpiomem ] || groups $USER | grep -q "gpio"; then
        print_success "GPIO权限正常"
    else
        print_warning "GPIO权限可能不足，建议使用sudo运行"
    fi
    
    # 检查摄像头权限
    if [ -c /dev/vchiq ] || [ -c /dev/video0 ]; then
        print_success "摄像头设备检测正常"
    else
        print_warning "未检测到摄像头设备，请检查连接"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装Python依赖包..."
    
    if [ -f requirements.txt ]; then
        pip3 install -r requirements.txt
        if [ $? -eq 0 ]; then
            print_success "依赖包安装完成"
        else
            print_error "依赖包安装失败"
            exit 1
        fi
    else
        print_error "未找到requirements.txt文件"
        exit 1
    fi
}

# 创建配置文件
create_config() {
    CONFIG_DIR="config/experimental"
    if [ ! -d "$CONFIG_DIR" ]; then
        mkdir -p "$CONFIG_DIR"
        print_info "创建配置目录: $CONFIG_DIR"
    fi
    
    if [ ! -f "$CONFIG_DIR/hardware_config.json" ]; then
        print_info "创建默认配置文件..."
        python3 -c "
import json
config = {
    'motor_pins': {
        'left_motor_forward': 17,
        'left_motor_backward': 18,
        'right_motor_forward': 22,
        'right_motor_backward': 23
    },
    'sensor_pins': {
        'ultrasonic_trig': 24,
        'ultrasonic_echo': 25,
        'servo': 12
    },
    'camera': {
        'resolution': [640, 480],
        'framerate': 30,
        'rotation': 0
    },
    'web': {
        'host': '0.0.0.0',
        'port': 5000
    }
}
with open('config/experimental/hardware_config.json', 'w') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
print('配置文件创建完成')
"
        print_success "配置文件创建完成"
    fi
}

# 系统自检
run_self_test() {
    print_info "运行系统自检..."
    
    python3 main.py test
    
    if [ $? -eq 0 ]; then
        print_success "系统自检通过"
    else
        print_warning "系统自检发现问题，但可以继续运行"
    fi
}

# 显示使用帮助
show_help() {
    echo "农业巡检机器人启动脚本"
    echo ""
    echo "用法: $0 [选项] [模式]"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示此帮助信息"
    echo "  -c, --check     仅进行系统检查，不启动机器人"
    echo "  -i, --install   安装依赖包"
    echo "  -t, --test      运行自检"
    echo ""
    echo "模式:"
    echo "  interactive     交互模式（默认）"
    echo "  web            Web控制模式"
    echo "  auto           自主巡检模式"
    echo "  test           仅运行自检"
    echo ""
    echo "示例:"
    echo "  $0                 # 默认交互模式"
    echo "  $0 web             # 启动Web控制界面"
    echo "  $0 -c              # 仅检查系统"
    echo "  $0 -i              # 安装依赖"
}

# 主函数
main() {
    MODE="interactive"
    CHECK_ONLY=false
    INSTALL_DEPS=false
    RUN_TEST=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check)
                CHECK_ONLY=true
                shift
                ;;
            -i|--install)
                INSTALL_DEPS=true
                shift
                ;;
            -t|--test)
                RUN_TEST=true
                shift
                ;;
            web|auto|test|interactive)
                MODE=$1
                shift
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示启动横幅
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🤖 农业巡检机器人实验版本                    ║"
    echo "║                      启动脚本 v1.0                        ║"
    echo "║                                                              ║"
    echo "║  预算：560元 | 制作时间：2天 | 成功率：95%                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # 系统检查
    print_info "开始系统检查..."
    check_raspberry_pi
    check_python
    
    if [ "$INSTALL_DEPS" = true ]; then
        install_dependencies
        create_config
        print_success "依赖安装完成，可以启动了"
        exit 0
    fi
    
    check_dependencies
    check_hardware_permissions
    create_config
    
    if [ "$CHECK_ONLY" = true ]; then
        print_success "系统检查完成"
        exit 0
    fi
    
    if [ "$RUN_TEST" = true ]; then
        run_self_test
        exit 0
    fi
    
    # 启动机器人
    print_success "系统检查完成，启动机器人..."
    print_info "启动模式: $MODE"
    echo ""
    
    case $MODE in
        "web")
            print_info "启动Web控制界面..."
            print_info "访问地址: http://localhost:5000"
            print_info "手机访问: http://树莓派IP:5000"
            echo ""
            python3 main.py web
            ;;
        "auto")
            print_info "启动自主巡检模式..."
            print_warning "按Ctrl+C停止"
            echo ""
            python3 main.py auto
            ;;
        "test")
            run_self_test
            ;;
        *)
            print_info "启动交互模式..."
            print_info "可用命令: test, forward, backward, left, right, stop, detect, scan, auto, web, quit"
            echo ""
            python3 main.py interactive
            ;;
    esac
}

# 脚本入口
main "$@"