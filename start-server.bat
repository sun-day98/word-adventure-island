@echo off
echo ===================================
echo    AI小说创作系统 - 服务器启动
echo ===================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js环境
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js环境正常
echo.

echo 正在检查依赖包...
if not exist node_modules (
    echo 📦 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖包已存在
)

echo.
echo 🚀 启动AI小说创作系统后端服务...
echo 服务地址: http://localhost:3000
echo 前端界面: http://localhost:3000/novel-creation-full.html
echo.
echo 按 Ctrl+C 停止服务器
echo ===================================
echo.

npm start

pause