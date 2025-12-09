# 使用Apache Cordova封装FitLife APK

## 步骤1：安装环境

### 1.1 安装Node.js
```bash
# 下载并安装Node.js LTS版本
# https://nodejs.org/
```

### 1.2 安装Cordova CLI
```bash
npm install -g cordova
```

### 1.3 安装Android Studio
- 下载Android Studio: https://developer.android.com/studio
- 安装Android SDK
- 配置环境变量:
  ```bash
  ANDROID_HOME=/path/to/Android/Sdk
  PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

## 步骤2：创建Cordova项目

```bash
# 创建Cordova项目
cordova create FitLifeApp com.fitlife.app FitLife

# 进入项目目录
cd FitLifeApp

# 添加Android平台
cordova platform add android

# 检查环境
cordova requirements android
```

## 步骤3：集成FitLife项目

### 3.1 复制文件到www目录
```bash
# 将FitLife项目文件复制到Cordova的www目录
cp -r /path/to/fitness-app-prototype/* FitLifeApp/www/
```

### 3.2 配置config.xml
```xml
<!-- FitLifeApp/config.xml -->
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.fitlife.app" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>FitLife运动健身</name>
    <description>专业的运动健身管理应用</description>
    <author email="dev@fitlife.com" href="http://fitlife.com">FitLife团队</author>
    
    <!-- 配置启动页面 -->
    <content src="index.html" />
    
    <!-- 权限配置 -->
    <uses-permission name="android.permission.INTERNET" />
    <uses-permission name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission name="android.permission.VIBRATE" />
    
    <!-- 偏好设置 -->
    <preference name="DisallowOverscroll" value="true" />
    <preference name="android-minSdkVersion" value="22" />
    <preference name="android-targetSdkVersion" value="33" />
    <preference name="SplashScreen" value="screen" />
    <preference name="SplashScreenDelay" value="3000" />
    
    <!-- 图标配置 -->
    <icon src="res/icon/android/ldpi.png" density="ldpi" />
    <icon src="res/icon/android/mdpi.png" density="mdpi" />
    <icon src="res/icon/android/hdpi.png" density="hdpi" />
    <icon src="res/icon/android/xhdpi.png" density="xhdpi" />
    <icon src="res/icon/android/xxhdpi.png" density="xxhdpi" />
    
    <!-- 启动画面 -->
    <splash src="res/screen/android/splash-land-hdpi.png" density="land-hdpi"/>
    <splash src="res/screen/android/splash-port-hdpi.png" density="port-hdpi"/>
</widget>
```

## 步骤4：构建APK

### 4.1 调试版本
```bash
# 构建调试版本APK
cordova build android --debug

# APK文件位置: platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### 4.2 发布版本
```bash
# 生成密钥
keytool -genkey -v -keystore fitlife-release-key.keystore -alias fitlife -keyalg RSA -keysize 2048 -validity 10000

# 构建发布版本
cordova build android --release -- --keystore=fitlife-release-key.keystore --alias=fitlife --storePassword=yourpassword --password=yourpassword

# APK文件位置: platforms/android/app/build/outputs/apk/release/app-release.apk
```

## 步骤5：安装和测试

```bash
# 通过ADB安装APK
adb install platforms/android/app/build/outputs/apk/debug/app-debug.apk

# 运行应用
cordova run android
```

## 优化建议

### 性能优化
1. 启用硬件加速
2. 压缩图片资源
3. 使用CDN加载静态资源
4. 实现离线缓存

### 功能增强
1. 添加推送通知插件
2. 集成本地存储增强
3. 添加分享功能
4. 支持深色模式

### 插件推荐
```bash
# 状态栏插件
cordova plugin add cordova-plugin-statusbar

# 网络状态检测
cordova plugin add cordova-plugin-network-information

# 本地通知
cordova plugin add cordova-plugin-local-notification

# 文件操作
cordova plugin add cordova-plugin-file

# 分享功能
cordova plugin add cordova-plugin-x-socialsharing
```

## 故障排除

### 常见问题
1. **Gradle构建失败**: 检查Android SDK和Gradle版本
2. **权限问题**: 确保AndroidManifest.xml中权限配置正确
3. **资源加载失败**: 检查文件路径和大小写
4. **白屏问题**: 添加启动画面和错误处理

### 调试工具
```bash
# 查看日志
adb logcat

# Chrome调试
chrome://inspect/#devices

# 性能分析
cordova run android -- --profile
```