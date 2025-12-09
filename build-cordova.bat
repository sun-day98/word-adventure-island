@echo off
echo ========================================
echo FitLife Cordova APK 自动构建脚本
echo ========================================
echo.

:: 检查Node.js
echo [1/6] 检查Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Node.js
    echo 🔧 请从以下地址下载安装: https://nodejs.org/
    echo 💡 建议安装LTS版本
    pause
    exit /b 1
)
echo ✅ Node.js已安装

:: 检查Java
echo [2/6] 检查Java JDK...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到Java JDK
    echo 🔧 请从以下地址下载安装: https://adoptium.net/
    echo 💡 建议安装JDK 11或更高版本
    pause
    exit /b 1
)
echo ✅ Java JDK已安装

:: 安装Cordova
echo [3/6] 安装Cordova CLI...
npm install -g cordova
if %errorlevel% neq 0 (
    echo ❌ Cordova安装失败
    pause
    exit /b 1
)
echo ✅ Cordova安装完成

:: 创建Cordova项目
echo [4/6] 创建Cordova项目...
if exist FitLifeCordova rmdir /s /q FitLifeCordova
cordova create FitLifeCordova com.fitlife.app FitLife
cd FitLifeCordova
echo ✅ Cordova项目创建完成

:: 添加Android平台
echo [5/6] 添加Android平台...
cordova platform add android
if %errorlevel% neq 0 (
    echo ❌ Android平台添加失败
    echo 💡 请确保已安装Android Studio和Android SDK
    echo 🔧 设置环境变量: ANDROID_HOME
    pause
    exit /b 1
)
echo ✅ Android平台添加完成

:: 复制FitLife项目文件
echo [6/6] 复制项目文件...
xcopy ..\*.* www\ /E /I /Y /Q
echo ✅ 项目文件复制完成

echo.
echo ========================================
echo 🎉 Cordova项目构建完成！
echo ========================================
echo.
echo 📁 项目位置: %cd%\FitLifeCordova
echo 🔧 下一步操作:
echo    1. cd FitLifeCordova
echo    2. cordova requirements android  # 检查环境
echo    3. cordova build android          # 构建调试版本
echo    4. cordova build android --release  # 构建发布版本
echo.
echo 💡 提示: 如果遇到Android SDK问题，请:
echo    - 安装Android Studio
echo    - 设置ANDROID_HOME环境变量
echo    - 运行: sdkmanager "platforms;android-33"
echo.
pause