# 使用PWA + TWA封装FitLife APK

## 概述

PWA (Progressive Web App) + TWA (Trusted Web Activity) 是最简单的封装方案，可以将现有的FitLife Web应用快速转换为Android应用。

## 步骤1：准备PWA版本

### 1.1 创建manifest.json
```json
{
  "name": "FitLife运动健身",
  "short_name": "FitLife",
  "description": "专业的运动健身管理应用",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["health", "fitness", "lifestyle"],
  "lang": "zh-CN"
}
```

### 1.2 创建Service Worker
```javascript
// sw.js
const CACHE_NAME = 'fitlife-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/courses.html',
  '/diet.html',
  '/profile.html',
  '/css/styles.css',
  '/css/ios-status-bar.css',
  '/js/main.js',
  '/js/mock-data.js',
  '/js/form-validation.js',
  '/js/data-charts.js',
  '/assets/images/ui/logo.svg',
  '/assets/icons/home.svg',
  '/assets/icons/courses.svg',
  '/assets/icons/diet.svg',
  '/assets/icons/profile.svg'
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到缓存响应，返回缓存的版本
        if (response) {
          return response;
        }
        
        // 否则发起网络请求
        return fetch(event.request);
      })
  );
});

// 更新缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 1.3 修改index.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#007AFF">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="FitLife">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" href="/assets/icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="152x152" href="/assets/icons/icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/icon-180x180.png">
    
    <!-- 安装提示 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <title>FitLife运动健身</title>
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/ios-status-bar.css">
</head>
<body>
    <div id="app-container">
        <iframe id="main-iframe" src="home.html" frameborder="0"></iframe>
        <div id="bottom-nav">
            <a href="home.html" class="nav-item active">
                <i class="fas fa-home"></i>
                <span>首页</span>
            </a>
            <a href="courses.html" class="nav-item">
                <i class="fas fa-dumbbell"></i>
                <span>课程</span>
            </a>
            <a href="diet.html" class="nav-item">
                <i class="fas fa-utensils"></i>
                <span>饮食</span>
            </a>
            <a href="profile.html" class="nav-item">
                <i class="fas fa-user"></i>
                <span>我的</span>
            </a>
        </div>
    </div>
    
    <!-- PWA安装提示 -->
    <div id="install-prompt" class="install-prompt" style="display: none;">
        <div class="prompt-content">
            <h3>安装FitLife应用</h3>
            <p>将FitLife添加到主屏幕，享受更好的使用体验</p>
            <div class="prompt-buttons">
                <button id="install-btn" class="btn-primary">安装</button>
                <button id="dismiss-btn" class="btn-secondary">稍后</button>
            </div>
        </div>
    </div>

    <script src="js/main.js"></script>
    <script src="js/form-validation.js"></script>
    <script src="js/data-charts.js"></script>
    <script src="js/mock-data.js"></script>
    
    <!-- PWA Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // PWA安装提示
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('install-prompt').style.display = 'flex';
        });

        document.getElementById('install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
            }
            document.getElementById('install-prompt').style.display = 'none';
        });

        document.getElementById('dismiss-btn').addEventListener('click', () => {
            document.getElementById('install-prompt').style.display = 'none';
        });
    </script>
</body>
</html>
```

## 步骤2：使用Bubblewrap创建TWA应用

### 2.1 安装Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
```

### 2.2 创建TWA项目
```bash
# 初始化项目
bubblewrap init --manifest https://your-domain.com/manifest.json

# 配置项目信息
# App name: FitLife运动健身
# Package name: com.fitlife.app
# Launcher name: FitLife
# Display mode: fullscreen
# Status bar: default
```

### 2.3 配置签名
```bash
# 创建签名密钥
keytool -genkey -v -keystore fitlife-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fitlife

# 配置签名
bubblewrap sign --keystore fitlife-key.jks --key-alias fitlife
```

### 2.4 构建APK
```bash
# 构建发布版本
bubblewrap build

# APK文件位置: app-release-signed.apk
```

## 步骤3：手动创建TWA应用

### 3.1 使用Android Studio创建项目
1. 打开Android Studio
2. 创建新项目
3. 选择"No Activity"模板
4. 配置项目信息

### 3.2 添加TWA依赖
```gradle
// build.gradle (Module: app)
dependencies {
    implementation 'androidx.browser:browser:1.4.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.3.0'
}
```

### 3.3 创建MainActivity
```java
// MainActivity.java
package com.fitlife.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.browser.customtabs.CustomTabsIntent;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

public class MainActivity extends LauncherActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 配置TWA参数
        getLauncherActivityDelegate()
            .setStatusBarColor(0xFF007AFF)
            .setNavigationBarColor(0xFFFFFFFF)
            .setNavigationBarDividerColor(0xFFE5E5E7);
    }
}
```

### 3.4 配置AndroidManifest.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.fitlife.app">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://your-domain.com" />
                
            <meta-data
                android:name="android.app.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />
                
            <meta-data
                android:name="android.app.customtabs.trusted.NAVIGATION_BAR_COLOR"
                android:resource="@color/navigationBarColor" />
        </activity>
        
        <service
            android:name="androidx.browser.customtabs.TrustedWebActivityService"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.support.customtabs.trusted.TRUSTED_WEB_ACTIVITY_SERVICE"/>
                <category android:name="android.intent.category.DEFAULT"/>
            </intent-filter>
        </service>
    </application>
</manifest>
```

## 步骤4：部署PWA到线上

### 4.1 部署到静态托管服务
```bash
# 使用Netlify部署
npm install -g netlify-cli
netlify deploy --prod --dir .

# 或使用Vercel部署
npm install -g vercel
vercel --prod

# 或使用GitHub Pages
# 将项目推送到GitHub仓库
# 在仓库设置中启用GitHub Pages
```

### 4.2 配置HTTPS
确保PWA部署在HTTPS域名下，这是TWA的要求。

## 步骤5：测试和发布

### 5.1 测试PWA
```bash
# 使用Lighthouse测试
# 在Chrome开发者工具中运行Lighthouse
# 确保PWA评分达到90+
```

### 5.2 测试TWA
```bash
# 安装到设备
adb install app-release-signed.apk

# 测试功能
# 1. 启动速度
# 2. 离线功能
# 3. 原生体验
# 4. 推送通知
```

### 5.3 发布到应用商店
1. **Google Play Store**
   - 创建开发者账号
   - 上传APK/AAB文件
   - 填写应用信息
   - 通过审核

2. **华为应用市场**
   - 注册开发者账号
   - 提交应用
   - 等待审核

## 优势和劣势

### ✅ 优势
- **开发简单**: 基于现有Web应用
- **维护成本低**: 单一代码库
- **更新方便**: Web端更新即应用更新
- **性能优秀**: Chrome浏览器的性能
- **原生体验**: TWA提供原生般的体验

### ❌ 劣势
- **依赖网络**: 离线功能有限
- **平台限制**: 某些原生功能无法访问
- **审核要求**: 需要符合PWA标准

## 推荐方案

对于FitLife项目，**推荐使用PWA + TWA方案**，因为：

1. **开发效率高**: 基于现有HTML/CSS/JS代码
2. **维护成本低**: 无需重写代码
3. **用户体验好**: 接近原生应用体验
4. **部署简单**: 一键构建和发布

## 快速开始脚本

```bash
#!/bin/bash
# quick-build.sh

echo "FitLife PWA+TWA 快速构建脚本"

# 1. 检查环境
if ! command -v node &> /dev/null; then
    echo "请先安装Node.js"
    exit 1
fi

if ! command -v keytool &> /dev/null; then
    echo "请先安装Java JDK"
    exit 1
fi

# 2. 安装依赖
echo "安装Bubblewrap CLI..."
npm install -g @bubblewrap/cli

# 3. 创建签名
echo "创建签名密钥..."
keytool -genkey -v -keystore fitlife-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias fitlife -dname "CN=FitLife, OU=FitLife, O=FitLife, L=Beijing, ST=Beijing, C=CN"

# 4. 构建APK
echo "构建TWA应用..."
bubblewrap init --manifest https://your-domain.com/manifest.json
bubblewrap build

echo "构建完成！APK文件位置: app-release-signed.apk"
```