// Cordova项目设置脚本
// 使用Node.js自动创建完整的Cordova项目结构

const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置Cordova项目...');

// 创建必要的目录结构
const directories = [
    'res/icon/android',
    'res/icon/ios', 
    'res/screen/android',
    'res/screen/ios',
    'hooks',
    'platforms',
    'plugins',
    'www/css',
    'www/js',
    'www/assets/images',
    'www/assets/icons'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ 创建目录: ${dir}`);
    }
});

// 创建package.json（如果不存在）
if (!fs.existsSync('package.json')) {
    const packageJson = {
        name: "fitlife-cordova",
        version: "1.0.0",
        description: "FitLife运动健身APP - Cordova版本",
        main: "index.js",
        scripts: {
            "build": "cordova build android",
            "run": "cordova run android",
            "prepare": "cordova prepare android",
            "clean": "cordova clean android"
        },
        keywords: [
            "fitness",
            "health",
            "cordova",
            "mobile"
        ],
        author: "FitLife Team",
        license: "MIT",
        devDependencies: {
            "cordova": "^12.0.0",
            "cordova-android": "^12.0.0",
            "cordova-plugin-statusbar": "^2.4.3",
            "cordova-plugin-splashscreen": "^6.0.0",
            "cordova-plugin-network-information": "^3.0.0",
            "cordova-plugin-vibration": "^3.1.1",
            "cordova-plugin-camera": "^6.0.0",
            "cordova-plugin-geolocation": "^4.1.0",
            "cordova-plugin-local-notification": "^0.9.0",
            "cordova-plugin-inappbrowser": "^5.0.0"
        },
       cordova: {
            platforms: [
                "android"
            ],
            plugins: {
                "cordova-plugin-statusbar": {},
                "cordova-plugin-splashscreen": {},
                "cordova-plugin-network-information": {},
                "cordova-plugin-vibration": {},
                "cordova-plugin-camera": {
                    "CAMERA_USAGE_DESCRIPTION": "FitLife需要访问相机来拍摄健身照片",
                    "PHOTOLIBRARY_USAGE_DESCRIPTION": "FitLife需要访问相册来选择健身照片"
                },
                "cordova-plugin-geolocation": {
                    "GPS_REQUIRED": "false"
                },
                "cordova-plugin-local-notification": {},
                "cordova-plugin-inappbrowser": {}
            }
        }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ 创建package.json');
}

// 复制文件函数
function copyFile(src, dest, description) {
    try {
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✅ ${description}`);
        } else {
            console.log(`⚠️  文件不存在: ${src}`);
        }
    } catch (error) {
        console.log(`❌ 复制失败 ${description}:`, error.message);
    }
}

// 复制核心文件到www目录
const filesToCopy = [
    ['index-cordova.html', 'www/index.html', 'Cordova增强版主页面'],
    ['config.xml', 'config.xml', 'Cordova配置文件'],
    ['css/styles.css', 'www/css/styles.css', '主样式文件'],
    ['css/ios-status-bar.css', 'www/css/ios-status-bar.css', 'iOS状态栏样式'],
    ['js/main-cordova.js', 'www/js/main-cordova.js', 'Cordova增强主逻辑'],
    ['js/form-validation.js', 'www/js/form-validation.js', '表单验证脚本'],
    ['js/data-charts.js', 'www/js/data-charts.js', '图表脚本'],
    ['js/mock-data.js', 'www/js/mock-data.js', '模拟数据'],
    ['README.md', 'www/README.md', '项目说明']
];

filesToCopy.forEach(([src, dest, desc]) => {
    copyFile(src, dest, desc);
});

// 复制HTML页面
const htmlPages = [
    'home.html',
    'login.html', 
    'register.html',
    'courses.html',
    'course-detail.html',
    'diet.html',
    'diet-detail.html',
    'food-search.html',
    'health-assessment.html',
    'profile.html',
    'profile-edit.html',
    'body-data-record.html',
    'vip-membership.html',
    'settings.html',
    'privacy-policy.html',
    'global-loading.html',
    'modal-confirm.html',
    'action-sheet.html'
];

htmlPages.forEach(page => {
    copyFile(page, `www/${page}`, `页面: ${page}`);
});

// 复制资源文件
if (fs.existsSync('assets')) {
    const copyRecursive = (src, dest) => {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        if (isDirectory) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(childItemName => {
                copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    };
    
    copyRecursive('assets', 'www/assets');
    console.log('✅ 复制资源文件');
}

// 创建默认图标（使用SVG）
function createDefaultIcon(size, filename) {
    const svgIcon = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="${size}" height="${size}" rx="${size/6}" fill="#007AFF"/>
<path d="M${size/2} ${size/4} L${size*3/4} ${size/2} L${size/2} ${size*3/4} L${size/4} ${size/2} Z" fill="white"/>
</svg>`;
    
    fs.writeFileSync(filename, svgIcon);
}

// 创建Android图标
const androidIcons = [
    { size: 36, density: 'ldpi' },
    { size: 48, density: 'mdpi' },
    { size: 72, density: 'hdpi' },
    { size: 96, density: 'xhdpi' },
    { size: 144, density: 'xxhdpi' },
    { size: 192, density: 'xxxhdpi' }
];

androidIcons.forEach(icon => {
    const filename = `res/icon/android/icon-${icon.size}-${icon.density}.png`;
    createDefaultIcon(icon.size, filename);
    console.log(`✅ 创建Android图标: ${filename}`);
});

// 创建启动画面
function createSplashScreen(width, height, filename) {
    const svgSplash = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="${width}" height="${height}" fill="#007AFF"/>
<text x="${width/2}" y="${height/2}" font-family="Arial, sans-serif" font-size="${width/10}" fill="white" text-anchor="middle" dominant-baseline="middle">FitLife</text>
</svg>`;
    
    fs.writeFileSync(filename, svgSplash);
}

// 创建Android启动画面
const androidSplashes = [
    { width: 480, height: 320, mode: 'land-hdpi' },
    { width: 320, height: 480, mode: 'port-hdpi' },
    { width: 640, height: 360, mode: 'land-xhdpi' },
    { width: 360, height: 640, mode: 'port-xhdpi' }
];

androidSplashes.forEach(splash => {
    const filename = `res/screen/android/screen-${splash.mode}.png`;
    createSplashScreen(splash.width, splash.height, filename);
    console.log(`✅ 创建启动画面: ${filename}`);
});

// 创建构建脚本
const buildScript = `#!/bin/bash
# FitLife Cordova 构建脚本

echo "🚀 开始构建FitLife Cordova应用..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 请先安装Node.js"
    exit 1
fi

# 检查Cordova
if ! command -v cordova &> /dev/null; then
    echo "📦 安装Cordova..."
    npm install -g cordova
fi

# 添加平台
echo "📱 添加Android平台..."
cordova platform add android

# 安装插件
echo "🔌 安装Cordova插件..."
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-vibration

# 构建应用
echo "🔨 构建Android应用..."
cordova build android

echo "✅ 构建完成！"
echo "📁 APK位置: platforms/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🚀 运行应用: cordova run android"
echo "📱 构建发布版本: cordova build android --release"
`;

fs.writeFileSync('build.sh', buildScript);
console.log('✅ 创建构建脚本');

// 创建Windows构建脚本
const windowsBuildScript = `@echo off
echo 🚀 开始构建FitLife Cordova应用...

:: 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 请先安装Node.js
    pause
    exit /b 1
)

:: 检查Cordova
cordova --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 安装Cordova...
    npm install -g cordova
)

:: 添加平台
echo 📱 添加Android平台...
cordova platform add android

:: 安装插件
echo 🔌 安装Cordova插件...
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-vibration

:: 构建应用
echo 🔨 构建Android应用...
cordova build android

echo ✅ 构建完成！
echo 📁 APK位置: platforms\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk
echo.
echo 🚀 运行应用: cordova run android
echo 📱 构建发布版本: cordova build android --release
pause
`;

fs.writeFileSync('build.bat', windowsBuildScript);
console.log('✅ 创建Windows构建脚本');

console.log('\n🎉 Cordova项目设置完成！');
console.log('\n📋 下一步操作：');
console.log('1. cd .. # 返回项目根目录');
console.log('2. cordova create FitLifeCordova com.fitlife.app FitLife');
console.log('3. cd FitLifeCordova');
console.log('4. 将当前目录下的所有文件复制到FitLifeCordova目录');
console.log('5. 运行 build.sh 或 build.bat 来构建应用');
console.log('\n💡 提示：请确保已安装Node.js和Android Studio');