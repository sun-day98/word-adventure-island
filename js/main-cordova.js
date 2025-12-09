// FitLife 运动健身APP - Cordova增强版主逻辑
// 支持Cordova原生功能集成

// 全局变量
let currentPage = 'home';
let isAppReady = false;
let isOnline = navigator.onLine;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成');
    initializeApp();
});

// 应用初始化函数
function initializeApp() {
    // 初始化导航
    initializeNavigation();
    
    // 初始化全局加载
    initializeLoading();
    
    // 初始化数据
    if (typeof dataUtils !== 'undefined') {
        dataUtils.loadFromLocalStorage();
    }
    
    // 初始化图表
    if (typeof initCharts === 'function') {
        initCharts();
    }
    
    // 初始化表单验证
    if (typeof initializeValidation === 'function') {
        initializeValidation();
    }
    
    isAppReady = true;
    console.log('FitLife应用初始化完成');
}

// 初始化导航功能
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const iframe = document.getElementById('page-frame');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.dataset.page;
            if (page === currentPage) return;
            
            // 添加震动反馈（Cordova设备）
            if (window.cordova && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // 切换导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 显示加载状态
            showGlobalLoading();
            
            // 加载新页面
            const pageUrl = this.getAttribute('href');
            
            iframe.onload = function() {
                hideGlobalLoading();
                currentPage = page;
                
                // 页面加载完成后的回调
                if (typeof window.onPageChanged === 'function') {
                    window.onPageChanged(page);
                }
                
                console.log(`页面切换到: ${page}`);
            };
            
            iframe.onerror = function() {
                hideGlobalLoading();
                showToast('页面加载失败，请重试');
                console.error(`页面加载失败: ${pageUrl}`);
            };
            
            iframe.src = pageUrl;
        });
    });
}

// 初始化全局加载功能
function initializeLoading() {
    // 监听iframe内页面的加载事件
    const iframe = document.getElementById('page-frame');
    
    if (iframe) {
        // 创建消息监听器，用于子页面与父页面通信
        window.addEventListener('message', function(event) {
            const data = event.data;
            
            switch (data.type) {
                case 'showLoading':
                    showGlobalLoading(data.message);
                    break;
                case 'hideLoading':
                    hideGlobalLoading();
                    break;
                case 'showToast':
                    showToast(data.message, data.duration);
                    break;
                case 'navigate':
                    navigateToPage(data.page);
                    break;
                case 'vibrate':
                    if (window.cordova && navigator.vibrate) {
                        navigator.vibrate(data.duration || 100);
                    }
                    break;
            }
        });
    }
}

// 显示全局加载
function showGlobalLoading(message = '加载中...') {
    const loadingEl = document.getElementById('global-loading');
    const textEl = loadingEl.querySelector('p');
    
    if (textEl) {
        textEl.textContent = message;
    }
    
    loadingEl.style.display = 'flex';
    loadingEl.style.opacity = '1';
}

// 隐藏全局加载
function hideGlobalLoading() {
    const loadingEl = document.getElementById('global-loading');
    loadingEl.style.opacity = '0';
    
    setTimeout(() => {
        loadingEl.style.display = 'none';
    }, 300);
}

// 显示提示信息
function showToast(message, duration = 2000) {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: '10000',
        maxWidth: '80%',
        textAlign: 'center',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// 导航到指定页面
function navigateToPage(pageName) {
    const navItem = document.querySelector(`[data-page="${pageName}"]`);
    if (navItem) {
        navItem.click();
    }
}

// Cordova设备信息获取
function getDeviceInfo() {
    if (window.cordova && window.device) {
        return {
            platform: device.platform,
            version: device.version,
            model: device.model,
            uuid: device.uuid,
            cordova: device.cordova
        };
    }
    return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        isWeb: true
    };
}

// 网络状态检查
function checkNetworkStatus() {
    if (navigator.connection) {
        const connectionType = navigator.connection.type;
        const effectiveType = navigator.connection.effectiveType;
        
        return {
            online: navigator.onLine,
            type: connectionType,
            effectiveType: effectiveType
        };
    }
    
    return {
        online: navigator.onLine,
        type: 'unknown'
    };
}

// 文件操作（Cordova）
function saveToFile(data, filename) {
    if (window.cordova && window.resolveLocalFileSystemURL) {
        return new Promise((resolve, reject) => {
            window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                fileSystem.root.getFile(filename, {create: true, exclusive: false}, function(fileEntry) {
                    fileEntry.createWriter(function(fileWriter) {
                        fileWriter.onwriteend = function() {
                            resolve(fileEntry.toURL());
                        };
                        
                        fileWriter.onerror = function(e) {
                            reject(e);
                        };
                        
                        const blob = new Blob([data], {type: 'text/plain'});
                        fileWriter.write(blob);
                    }, reject);
                }, reject);
            }, reject);
        });
    } else {
        // Web端使用下载
        return Promise.resolve(saveToWebStorage(data, filename));
    }
}

// Web端存储替代
function saveToWebStorage(data, filename) {
    const key = `fitlife_${filename}`;
    localStorage.setItem(key, JSON.stringify({
        data: data,
        timestamp: Date.now(),
        filename: filename
    }));
    return `localStorage://${key}`;
}

// 相机功能（Cordova）
function takePicture() {
    return new Promise((resolve, reject) => {
        if (navigator.camera) {
            navigator.camera.getPicture(
                function(imageURI) {
                    resolve(imageURI);
                },
                function(error) {
                    reject(error);
                },
                {
                    quality: 80,
                    destinationType: navigator.camera.DestinationType.FILE_URI,
                    sourceType: navigator.camera.PictureSourceType.CAMERA,
                    encodingType: navigator.camera.EncodingType.JPEG,
                    targetWidth: 800,
                    targetHeight: 600
                }
            );
        } else {
            reject('相机功能不可用');
        }
    });
}

// 获取位置信息
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                function(error) {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        } else {
            reject('地理位置功能不可用');
        }
    });
}

// 推送通知（Cordova）
function scheduleNotification(title, message, time) {
    if (window.cordova && window.plugin && window.plugin.notification) {
        window.plugin.notification.local.schedule({
            title: title,
            message: message,
            date: new Date(time),
            sound: 'file://notification.mp3'
        });
    }
}

// 应用版本检查
function checkForUpdates() {
    // 这里可以添加版本检查逻辑
    console.log('检查应用更新...');
    
    // 模拟更新检查
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                hasUpdate: false,
                currentVersion: '1.0.0',
                latestVersion: '1.0.0'
            });
        }, 1000);
    });
}

// 页面切换回调
window.onPageChanged = function(pageName) {
    console.log(`当前页面: ${pageName}`);
    
    // 页面特定的初始化逻辑
    switch (pageName) {
        case 'home':
            // 首页初始化
            break;
        case 'courses':
            // 课程页面初始化
            break;
        case 'diet':
            // 饮食页面初始化
            break;
        case 'profile':
            // 个人中心初始化
            break;
    }
};

// Cordova设备就绪后的额外初始化
document.addEventListener('deviceready', function() {
    console.log('Cordova设备就绪，执行额外初始化');
    
    // 获取设备信息
    const deviceInfo = getDeviceInfo();
    console.log('设备信息:', deviceInfo);
    
    // 检查网络状态
    const networkStatus = checkNetworkStatus();
    console.log('网络状态:', networkStatus);
    
    // 初始化推送通知（如果需要）
    if (window.PushNotification) {
        initializePushNotifications();
    }
    
    // 初始化应用内购买（如果需要）
    if (window.inAppPurchase) {
        initializeInAppPurchase();
    }
});

// 初始化推送通知
function initializePushNotifications() {
    const push = PushNotification.init({
        android: {
            senderID: "YOUR_SENDER_ID"
        },
        ios: {
            alert: "true",
            badge: "true",
            sound: "true"
        }
    });
    
    push.on('registration', function(data) {
        console.log('推送注册成功:', data.registrationId);
    });
    
    push.on('notification', function(data) {
        console.log('收到推送通知:', data);
    });
    
    push.on('error', function(e) {
        console.error('推送注册失败:', e.message);
    });
}

// 初始化应用内购买
function initializeInAppPurchase() {
    // 应用内购买初始化逻辑
    console.log('应用内购买功能初始化');
}

// 导出全局函数
window.FitLife = {
    showToast: showToast,
    showLoading: showGlobalLoading,
    hideLoading: hideGlobalLoading,
    navigateTo: navigateToPage,
    getDeviceInfo: getDeviceInfo,
    checkNetwork: checkNetworkStatus,
    saveToFile: saveToFile,
    takePicture: takePicture,
    getLocation: getCurrentPosition,
    scheduleNotification: scheduleNotification,
    checkUpdates: checkForUpdates
};

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    // 保存数据
    if (typeof dataUtils !== 'undefined') {
        dataUtils.saveToLocalStorage();
    }
    
    console.log('FitLife应用即将卸载');
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('应用错误:', e.error);
    
    // 可以添加错误上报逻辑
    if (window.cordova && navigator.onLine) {
        // 上报错误到服务器
    }
});

console.log('FitLife Cordova增强脚本加载完成');