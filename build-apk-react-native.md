# 使用React Native封装FitLife APK

## 步骤1：环境准备

### 1.1 安装React Native CLI
```bash
npm install -g react-native-cli
```

### 1.2 安装Android Studio和SDK
- 下载Android Studio
- 配置Android SDK
- 设置环境变量

### 1.3 安装Java
```bash
# 安装JDK 11或更高版本
# 设置JAVA_HOME环境变量
```

## 步骤2：创建React Native项目

```bash
# 创建项目
npx react-native init FitLifeApp

# 进入项目目录
cd FitLifeApp

# 在Android设备上运行
npx react-native run-android
```

## 步骤3：集成FitLife Web应用

### 3.1 使用WebView组件
```javascript
// App.js
import React, {Component} from 'react';
import {WebView, StyleSheet, View, ActivityIndicator} from 'react-native';

class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <WebView
          source={{uri: 'file:///android_asset/www/index.html'}}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          mixedContentMode="compatibility"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
```

### 3.2 复制Web资源
```bash
# 创建assets/www目录
mkdir android/app/src/main/assets/www

# 复制FitLife项目文件
cp -r /path/to/fitness-app-prototype/* android/app/src/main/assets/www/
```

## 步骤4：配置应用

### 4.1 修改AndroidManifest.xml
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.fitlife.app">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:allowBackup="false"
      android:theme="@style/AppTheme"
      android:usesCleartextTraffic="true">
      
      <activity
        android:name=".MainActivity"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
        android:launchMode="singleTask"
        android:windowSoftInputMode="adjustResize"
        android:screenOrientation="portrait">
        
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
    </application>
</manifest>
```

### 4.2 配置app/build.gradle
```gradle
android {
    compileSdkVersion rootProject.ext.compileSdkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }

    defaultConfig {
        applicationId "com.fitlife.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }

    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

## 步骤5：构建APK

### 5.1 调试版本
```bash
# 构建调试APK
cd android
./gradlew assembleDebug

# APK位置: android/app/build/outputs/apk/debug/app-debug.apk
```

### 5.2 发布版本
```bash
# 生成签名密钥
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 设置gradle.properties
echo 'MYAPP_UPLOAD_STORE_FILE=my-release-key.keystore' >> gradle.properties
echo 'MYAPP_UPLOAD_KEY_ALIAS=my-key-alias' >> gradle.properties
echo 'MYAPP_UPLOAD_STORE_PASSWORD=yourpassword' >> gradle.properties
echo 'MYAPP_UPLOAD_KEY_PASSWORD=yourpassword' >> gradle.properties

# 构建发布APK
./gradlew assembleRelease

# APK位置: android/app/build/outputs/apk/release/app-release.apk
```

## 步骤6：运行和测试

### 6.1 连接设备
```bash
# 检查设备连接
adb devices

# 在设备上运行
npx react-native run-android --variant=release
```

### 6.2 调试
```bash
# 启动Metro服务器
npx react-native start

# 启用开发者菜单（摇动设备）
# 选择"Debug JS Remotely"
```

## 高级功能

### 6.1 添加原生功能
```javascript
// 安装必要插件
npm install react-native-permissions
npm install react-native-push-notification
npm install react-native-fs

// 使用原生功能
import {PermissionsAndroid} from 'react-native';
import PushNotification from 'react-native-push-notification';
import RNFS from 'react-native-fs';

// 请求权限
async function requestStoragePermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}
```

### 6.2 自定义WebView桥接
```javascript
// 创建桥接组件
import {WebView} from 'react-native-webview';

const WebViewBridge = () => {
  const injectedJavaScript = `
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ready',
      data: navigator.userAgent
    }));
    
    window.showToast = (message) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'toast',
        data: message
      }));
    };
  `;

  const onMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    
    switch (data.type) {
      case 'ready':
        console.log('WebView ready:', data.data);
        break;
      case 'toast':
        ToastAndroid.show(data.data, ToastAndroid.SHORT);
        break;
    }
  };

  return (
    <WebView
      source={{uri: 'file:///android_asset/www/index.html'}}
      injectedJavaScript={injectedJavaScript}
      onMessage={onMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
};
```

## 性能优化

### 7.1 WebView优化
```javascript
const webViewProps = {
  // 启用硬件加速
  javaScriptEnabled: true,
  domStorageEnabled: true,
  startInLoadingState: true,
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  
  // 性能优化
  cacheEnabled: true,
  cacheMode: 'LOAD_DEFAULT',
  
  // 网络优化
  allowsAirPlayForMediaPlayback: true,
  allowsPictureInPictureMediaPlayback: true,
};
```

### 7.2 内存优化
```javascript
// 清理WebView缓存
const clearCache = () => {
  if (webViewRef.current) {
    webViewRef.current.clearCache(true);
    webViewRef.current.clearHistory();
  }
};

// 组件卸载时清理资源
useEffect(() => {
  return () => {
    clearCache();
  };
}, []);
```

## 发布准备

### 8.1 应用图标
```bash
# 生成不同尺寸的图标
# 72x72 - mdpi
# 96x96 - hdpi  
# 144x144 - xhdpi
# 192x192 - xxhdpi
# 256x256 - xxxhdpi

# 放置到 android/app/src/main/res/mipmap-*/ic_launcher.png
```

### 8.2 启动画面
```xml
<!-- res/values/styles.xml -->
<style name="SplashTheme" parent="Theme.AppCompat.NoActionBar">
    <item name="android:windowBackground">@drawable/splash</item>
    <item name="android:windowNoTitle">true</item>
    <item name="android:windowActionBar">false</item>
</style>
```

## 故障排除

### 常见问题
1. **Metro服务器连接失败**: 检查端口占用
2. **ADB设备未找到**: 检查USB调试
3. **构建失败**: 检查Android SDK和Gradle版本
4. **WebView白屏**: 检查文件路径和权限

### 调试工具
```bash
# 查看日志
adb logcat

# 性能监控
adb shell dumpsys meminfo com.fitlife.app

# 网络调试
adb shell setprop debug.log.tags ReactNative:V
adb logcat *:S ReactNative:V ReactNativeJS:V
```

## 优势和劣势

### ✅ 优势
- 高性能
- 原生UI组件
- 丰富的生态系统
- 优秀的调试工具

### ❌ 劣势
- 学习曲线较陡
- 开发复杂度高
- 包体积较大
- 维护成本高