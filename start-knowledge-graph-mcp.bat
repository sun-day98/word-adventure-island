@echo off
echo ========================================
echo Knowledge Graph Memory Server 启动脚本
echo ========================================
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js
    echo 请先安装 Node.js 16.0 或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

:: 安装依赖（如果需要）
echo 📦 检查依赖...
if not exist "node_modules\@modelcontextprotocol" (
    echo 正在安装 MCP SDK...
    npm install @modelcontextprotocol/sdk
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

echo.
:: 创建数据目录
if not exist "knowledge-graph-data" (
    echo 📁 创建数据目录...
    mkdir knowledge-graph-data
    echo ✅ 数据目录已创建
)

echo.
echo 🚀 启动 Knowledge Graph Memory Server...
echo 按 Ctrl+C 停止服务器
echo.

:: 启动服务器
node knowledge-graph-memory-server.js

echo.
echo 服务器已停止
pause