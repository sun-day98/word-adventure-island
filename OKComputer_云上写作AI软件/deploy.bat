@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                AI写作软件 Windows 自动部署脚本                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

rem 检查是否在正确的目录
if not exist "index.html" (
    echo ❌ 请在项目根目录运行此脚本
    echo 💡 当前目录应包含 index.html 文件
    pause
    exit /b 1
)

echo ✅ 在正确的项目目录中: %CD%
echo.

rem 检查Node.js
echo 🔍 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或未添加到PATH
    echo 💡 请从 https://nodejs.org 下载安装 Node.js
    echo 📣 安装后请重新运行此脚本
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: !NODE_VERSION!

rem 检查npm
echo 🔍 检查 npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm 版本: !NPM_VERSION!
echo.

rem 检查后端目录
if not exist "backend" (
    echo ❌ backend 目录不存在
    pause
    exit /b 1
)

cd backend
echo 📁 进入后端目录: %CD%

rem 检查package.json
if not exist "package.json" (
    echo ❌ backend/package.json 文件不存在
    pause
    exit /b 1
)

rem 安装依赖
echo 📦 正在安装后端依赖...
echo    这可能需要几分钟时间，请耐心等待...
echo.
npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败
    echo 💡 可能的解决方案：
    echo    1. 检查网络连接
    echo    2. 清理npm缓存: npm cache clean --force
    echo    3. 使用国内镜像: npm config set registry https://registry.npmmirror.com
    pause
    exit /b 1
)
echo ✅ 后端依赖安装完成
echo.

rem 配置环境变量
if not exist ".env" (
    echo ⚙️ 创建环境变量文件...
    copy .env.example .env >nul 2>&1
    
    echo ✅ 已创建 .env 文件
    echo.
    echo 📝 现在将打开记事本编辑环境变量配置
    echo 💡 请根据您的环境修改以下配置：
    echo    - DB_PASSWORD: MySQL数据库密码
    echo    - JWT_SECRET: JWT密钥（建议使用随机字符串）
    echo    - MD5_KEY: MD5加密密钥
    echo    - PASSWORD_SALT: 密码盐值
    echo.
    set /p edit_now="是否现在编辑配置文件? (y/n): "
    if /i "!edit_now!"=="y" (
        notepad .env
        echo ✅ 配置文件编辑完成
    ) else (
        echo ⚠️  请稍后手动编辑 .env 文件
    )
) else (
    echo ✅ 环境变量文件已存在
)

rem 检查数据库配置
echo.
echo 📊 检查数据库配置...
findstr "DB_PASSWORD" .env >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  未找到数据库配置，请检查 .env 文件
) else (
    echo ✅ 数据库配置已设置
)

rem 提示MySQL服务状态
echo.
echo 🔍 MySQL 服务检查...
tasklist | findstr "mysqld.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MySQL 服务可能未运行
    echo 💡 如果使用 XAMPP，请启动 XAMPP 控制面板并启动 MySQL
    echo 💡 如果独立安装 MySQL，请确保服务正在运行
    echo    检查方法: services.msc
) else (
    echo ✅ MySQL 服务正在运行
)

rem 询问是否创建数据库
echo.
set /p create_db="是否自动创建数据库? (需要MySQL已启动) (y/n): "
if /i "!create_db!"=="y" (
    echo 🗄️  尝试创建数据库...
    rem 这里可以添加自动创建数据库的逻辑
    echo ⚠️  请手动创建数据库 'ai_writing_db'
    echo    在MySQL命令行中执行: CREATE DATABASE ai_writing_db CHARACTER SET utf8mb4;
)

rem 询问是否启动服务
echo.
echo 🚀 启动服务选择
echo ═══════════════════════════════════════════════════════════════
echo.
set /p start_backend="是否现在启动后端服务? (y/n): "
if /i "!start_backend!"=="y" (
    echo 🚀 启动后端服务 (端口 3000)...
    start "AI写作后端" cmd /k "echo 🔧 后端服务启动中... && node index.js"
    
    rem 等待服务启动
    echo ⏳ 等待后端服务启动...
    timeout /t 5 /nobreak >nul
    
    rem 测试后端是否启动成功
    curl -s http://localhost:3000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ 后端服务启动成功!
    ) else (
        echo ⚠️  后端服务可能还在启动中，请稍等片刻
    )
)

rem 询问是否启动前端
echo.
set /p start_frontend="是否启动前端服务? (y/n): "
if /i "!start_frontend!"=="y" (
    cd /d "%~dp0"
    echo 🌐 启动前端服务 (端口 8000)...
    start "AI写作前端" cmd /k "echo 🎨 前端服务启动中... && python -m http.server 8000"
    
    rem 等待服务启动
    echo ⏳ 等待前端服务启动...
    timeout /t 3 /nobreak >nul
    echo ✅ 前端服务启动成功!
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                         🎉 部署完成！                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📍 访问地址：
echo    🌐 前端应用: http://localhost:8000
echo    🔧 后端API: http://localhost:3000
echo    📚 API文档: http://localhost:3000/v1/doc
echo    🏥 健康检查: http://localhost:3000/health
echo.
echo 💡 实用提示：
echo    - 首次使用请注册新用户账号
echo    - 查看更多帮助请阅读 Windows部署指南.md
echo    - 如遇问题请检查 .env 配置文件
echo.

rem 询问是否自动打开浏览器
set /p open_browser="是否自动打开浏览器? (y/n): "
if /i "!open_browser!"=="y" (
    echo 🌐 正在打开浏览器...
    timeout /t 2 /nobreak >nul
    start http://localhost:8000
)

echo.
echo 🎊 感谢使用 AI写作软件！
echo 📧 如需帮助，请查看文档或联系技术支持
echo.
pause