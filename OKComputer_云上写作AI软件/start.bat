@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo 🚀 AI写作软件 - 快速启动
echo ══════════════════════════════════════════════════════════
echo.

rem 检查是否在正确目录
if not exist "index.html" (
    echo ❌ 请在项目根目录运行此脚本
    pause
    exit /b 1
)

rem 启动后端
echo 🔧 启动后端服务...
cd backend
if not exist ".env" (
    echo ⚠️  .env 文件不存在，请先运行 deploy.bat 进行配置
    pause
    exit /b 1
)

start "AI写作后端" cmd /k "title AI写作后端 - 端口3000 && echo 🚀 后端服务启动中... && node index.js"

rem 等待后端启动
echo ⏳ 等待后端服务启动...
timeout /t 3 /nobreak >nul

rem 启动前端
echo 🎨 启动前端服务...
cd ..
start "AI写作前端" cmd /k "title AI写作前端 - 端口8000 && echo 🚀 前端服务启动中... && python -m http.server 8000"

rem 等待前端启动
echo ⏳ 等待前端服务启动...
timeout /t 3 /nobreak >nul

echo.
echo ✅ 服务启动完成！
echo.
echo 📍 访问地址：
echo    🌐 前端应用: http://localhost:8000
echo    🔧 后端API: http://localhost:3000
echo    📚 API文档: http://localhost:3000/v1/doc
echo.

rem 等待一下再打开浏览器
timeout /t 2 /nobreak >nul

rem 自动打开浏览器
echo 🌐 正在打开浏览器...
start http://localhost:8000

echo.
echo 🎉 启动完成！服务正在后台运行...
echo 💡 关闭此窗口不会影响服务运行
echo 💡 如需停止服务，请关闭相应的命令行窗口
echo.
pause