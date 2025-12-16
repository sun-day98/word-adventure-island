@echo off
chcp 65001 > nul
title AI写作软件 - 一键启动

echo.
echo ==========================================
echo    AI写作软件 - 一键启动系统
echo ==========================================
echo.

echo [1/3] 检查环境...
cd /d "%~dp0"

echo [2/3] 启动后端服务...
start "AI写作后端" cmd /k "cd backend && echo 启动后端服务... && npm start"

echo [3/3] 等待后端启动...
timeout /t 3 /nobreak > nul

echo.
echo ==========================================
echo    系统启动完成！
echo ==========================================
echo.
echo 后端服务地址：http://localhost:3000
echo 健康检查地址：http://localhost:3000/health
echo.
echo 正在打开主界面...
start http://localhost:8000
echo.
echo 也可以访问后端API文档：http://localhost:3000/api/info
echo.
echo 如需停止服务，请关闭相应的命令行窗口
echo.

pause