@echo off
echo ========================================
echo Filesystem MCP Server 启动脚本
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
echo 🚀 启动 Filesystem MCP Server...
echo 按 Ctrl+C 停止服务器
echo.

:: 启动服务器
node filesystem-mcp-server.js

echo.
echo 服务器已停止
pause