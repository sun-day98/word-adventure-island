/**
 * FitLife 运动健身APP - 主逻辑文件
 * 负责页面导航、数据模拟、全局状态管理等核心功能
 */

// ===== 全局状态管理 =====
const AppState = {
    currentUser: {
        id: 'user_001',
        name: 'Alex Chen',
        avatar: 'assets/images/ui/avatar-default.png',
        phone: '13800138000',
        email: 'alex@example.com',
        isVIP: true,
        vipExpiry: '2025-06-05',
        level: 12,
        exp: 2450,
        nextLevelExp: 3000
    },
    
    // 用户健身数据
    fitnessData: {
        todayStats: {
            calories: 485,
            steps: 8542,
            exerciseMinutes: 45,
            water: 1.8
        },
        
        weeklyStats: {
            totalWorkouts: 5,
            totalCalories: 2450,
            totalMinutes: 180,
            activeDays: 5
        },
        
        bodyData: {
            height: 175,
            weight: 68.5,
            targetWeight: 65,
            bodyFat: 18.2,
            muscleMass: 52.3
        },
        
        goals: {
            weightGoal: 65,
            bodyFatGoal: 15,
            weeklyWorkouts: 4,
            dailyCalories: 2000
        }
    },
    
    // 应用设置
    settings: {
        language: 'zh-CN',
        units: 'metric',
        notifications: {
            workout: true,
            diet: true,
            water: false,
            achievement: true
        },
        darkMode: false,
        autoPlay: true,
        hdVideo: true
    },
    
    // 页面历史记录
    pageHistory: [],
    currentPage: 'home.html'
};

// ===== 页面导航管理 =====
class NavigationManager {
    constructor() {
        this.iframe = document.getElementById('page-frame');
        this.bottomNav = document.querySelector('.bottom-nav');
        this.init();
    }
    
    init() {
        // 监听底部导航点击
        if (this.bottomNav) {
            this.bottomNav.addEventListener('click', this.handleNavClick.bind(this));
        }
        
        // 监听浏览器返回按钮
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        // 监听iframe加载完成
        if (this.iframe) {
            this.iframe.addEventListener('load', this.handlePageLoad.bind(this));
        }
        
        // 初始化第一个页面
        this.navigateToPage('home.html', false);
    }
    
    handleNavClick(event) {
        event.preventDefault();
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            const page = navItem.dataset.page;
            const pageUrl = this.getPageUrl(page);
            this.navigateToPage(pageUrl);
        }
    }
    
    handlePopState(event) {
        if (event.state && event.state.page) {
            this.loadPage(event.state.page, false);
        }
    }
    
    handlePageLoad() {
        const currentUrl = this.iframe.contentWindow.location.href;
        const pageName = currentUrl.split('/').pop();
        
        // 更新底部导航状态
        this.updateBottomNav(pageName);
        
        // 更新页面历史
        AppState.pageHistory.push(pageName);
        AppState.currentPage = pageName;
        
        console.log(`页面加载完成: ${pageName}`);
    }
    
    getPageUrl(page) {
        const pageMap = {
            'home': 'home.html',
            'courses': 'courses.html',
            'diet': 'diet.html',
            'profile': 'profile.html'
        };
        return pageMap[page] || page;
    }
    
    navigateToPage(pageUrl, addToHistory = true) {
        if (this.iframe) {
            this.loadPage(pageUrl, addToHistory);
        }
    }
    
    loadPage(pageUrl, addToHistory = true) {
        if (this.iframe) {
            this.iframe.src = pageUrl;
            
            if (addToHistory) {
                // 更新浏览器历史
                const state = { page: pageUrl };
                const title = this.getPageTitle(pageUrl);
                history.pushState(state, title, pageUrl);
            }
        }
    }
    
    updateBottomNav(pageName) {
        if (!this.bottomNav) return;
        
        // 移除所有active类
        const navItems = this.bottomNav.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        // 添加active类到当前页面
        const pageKey = this.getPageKey(pageName);
        const activeItem = this.bottomNav.querySelector(`[data-page="${pageKey}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    
    getPageKey(pageName) {
        const keyMap = {
            'home.html': 'home',
            'courses.html': 'courses',
            'diet.html': 'diet',
            'profile.html': 'profile'
        };
        return keyMap[pageName] || 'home';
    }
    
    getPageTitle(pageName) {
        const titleMap = {
            'home.html': '首页 - FitLife',
            'courses.html': '课程 - FitLife',
            'diet.html': '饮食 - FitLife',
            'profile.html': '我的 - FitLife'
        };
        return titleMap[pageName] || 'FitLife';
    }
    
    goBack() {
        if (AppState.pageHistory.length > 1) {
            AppState.pageHistory.pop();
            const previousPage = AppState.pageHistory[AppState.pageHistory.length - 1];
            this.navigateToPage(previousPage, false);
        } else {
            // 如果没有历史记录，返回首页
            this.navigateToPage('home.html', false);
        }
    }
}

// 全局导航函数（供iframe中的页面调用）
window.navigateToPage = function(pageUrl) {
    if (window.parent && window.parent.NavigationManager) {
        window.parent.NavigationManager.navigateToPage(pageUrl);
    }
};

// ===== 数据管理器 =====
class DataManager {
    constructor() {
        this.storageKey = 'fitlife_app_data';
        this.init();
    }
    
    init() {
        // 从本地存储加载数据
        this.loadFromStorage();
        
        // 定期保存数据
        setInterval(() => {
            this.saveToStorage();
        }, 30000); // 每30秒保存一次
    }
    
    loadFromStorage() {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            if (storedData) {
                const data = JSON.parse(storedData);
                // 合并存储的数据到当前状态
                Object.assign(AppState, data);
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }
    
    saveToStorage() {
        try {
            const dataToSave = JSON.stringify(AppState);
            localStorage.setItem(this.storageKey, dataToSave);
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }
    
    // 更新用户数据
    updateUserData(data) {
        Object.assign(AppState.currentUser, data);
        this.saveToStorage();
    }
    
    // 更新健身数据
    updateFitnessData(data) {
        Object.assign(AppState.fitnessData, data);
        this.saveToStorage();
    }
    
    // 更新设置
    updateSettings(settings) {
        Object.assign(AppState.settings, settings);
        this.saveToStorage();
    }
    
    // 记录运动数据
    recordWorkout(workoutData) {
        const today = new Date().toISOString().split('T')[0];
        
        if (!AppState.fitnessData.workoutHistory) {
            AppState.fitnessData.workoutHistory = {};
        }
        
        if (!AppState.fitnessData.workoutHistory[today]) {
            AppState.fitnessData.workoutHistory[today] = [];
        }
        
        AppState.fitnessData.workoutHistory[today].push({
            ...workoutData,
            timestamp: new Date().toISOString()
        });
        
        // 更新今日统计
        AppState.fitnessData.todayStats.calories += workoutData.calories || 0;
        AppState.fitnessData.todayStats.exerciseMinutes += workoutData.duration || 0;
        
        this.saveToStorage();
    }
    
    // 记录饮食数据
    recordDiet(dietData) {
        const today = new Date().toISOString().split('T')[0];
        
        if (!AppState.fitnessData.dietHistory) {
            AppState.fitnessData.dietHistory = {};
        }
        
        if (!AppState.fitnessData.dietHistory[today]) {
            AppState.fitnessData.dietHistory[today] = [];
        }
        
        AppState.fitnessData.dietHistory[today].push({
            ...dietData,
            timestamp: new Date().toISOString()
        });
        
        // 更新今日营养摄入
        if (dietData.calories) {
            // 这里应该有更复杂的营养计算逻辑
            console.log(`记录饮食: ${dietData.mealType}, ${dietData.calories}卡路里`);
        }
        
        this.saveToStorage();
    }
    
    // 获取历史数据
    getHistoryData(type = 'workout', days = 7) {
        const history = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            let dayData = { date: dateStr, count: 0, duration: 0, calories: 0 };
            
            if (type === 'workout' && AppState.fitnessData.workoutHistory) {
                const workouts = AppState.fitnessData.workoutHistory[dateStr] || [];
                dayData.count = workouts.length;
                dayData.duration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
                dayData.calories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
            } else if (type === 'diet' && AppState.fitnessData.dietHistory) {
                const meals = AppState.fitnessData.dietHistory[dateStr] || [];
                dayData.count = meals.length;
                dayData.calories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
            }
            
            history.push(dayData);
        }
        
        return history;
    }
}

// ===== 用户认证管理 =====
class AuthManager {
    constructor() {
        this.isLoggedIn = false;
        this.init();
    }
    
    init() {
        // 检查本地存储的登录状态
        const loginStatus = localStorage.getItem('fitlife_login_status');
        const userData = localStorage.getItem('fitlife_user_data');
        
        if (loginStatus === 'true' && userData) {
            try {
                const user = JSON.parse(userData);
                AppState.currentUser = user;
                this.isLoggedIn = true;
            } catch (error) {
                console.error('解析用户数据失败:', error);
                this.logout();
            }
        }
    }
    
    login(credentials) {
        return new Promise((resolve, reject) => {
            // 模拟登录API调用
            setTimeout(() => {
                // 验证凭据（这里应该调用真实的API）
                if (credentials.phone && credentials.password) {
                    // 模拟登录成功
                    this.isLoggedIn = true;
                    
                    // 更新用户数据
                    AppState.currentUser = {
                        ...AppState.currentUser,
                        phone: credentials.phone,
                        lastLogin: new Date().toISOString()
                    };
                    
                    // 保存到本地存储
                    localStorage.setItem('fitlife_login_status', 'true');
                    localStorage.setItem('fitlife_user_data', JSON.stringify(AppState.currentUser));
                    
                    resolve(AppState.currentUser);
                } else {
                    reject(new Error('手机号或密码错误'));
                }
            }, 1000);
        });
    }
    
    logout() {
        this.isLoggedIn = false;
        
        // 清除本地存储
        localStorage.removeItem('fitlife_login_status');
        localStorage.removeItem('fitlife_user_data');
        
        // 重置用户状态
        AppState.currentUser = {
            id: '',
            name: '',
            avatar: '',
            phone: '',
            email: '',
            isVIP: false,
            level: 1,
            exp: 0
        };
        
        // 跳转到登录页
        if (window.parent && window.parent.NavigationManager) {
            window.parent.NavigationManager.navigateToPage('login.html');
        }
    }
    
    register(userData) {
        return new Promise((resolve, reject) => {
            // 模拟注册API调用
            setTimeout(() => {
                // 验证用户数据
                if (userData.phone && userData.password && userData.name) {
                    // 模拟注册成功
                    this.isLoggedIn = true;
                    
                    // 创建新用户
                    AppState.currentUser = {
                        id: 'user_' + Date.now(),
                        name: userData.name,
                        phone: userData.phone,
                        email: userData.email || '',
                        avatar: 'assets/images/ui/avatar-default.png',
                        isVIP: false,
                        vipExpiry: null,
                        level: 1,
                        exp: 0,
                        joinDate: new Date().toISOString()
                    };
                    
                    // 保存到本地存储
                    localStorage.setItem('fitlife_login_status', 'true');
                    localStorage.setItem('fitlife_user_data', JSON.stringify(AppState.currentUser));
                    
                    resolve(AppState.currentUser);
                } else {
                    reject(new Error('请填写完整的注册信息'));
                }
            }, 1000);
        });
    }
    
    checkAuthStatus() {
        return this.isLoggedIn;
    }
    
    requireAuth() {
        if (!this.isLoggedIn) {
            // 重定向到登录页
            if (window.parent && window.parent.NavigationManager) {
                window.parent.NavigationManager.navigateToPage('login.html');
            }
            return false;
        }
        return true;
    }
}

// ===== 工具函数 =====
class Utils {
    // 格式化日期
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    }
    
    // 格式化数字
    static formatNumber(num, decimals = 1) {
        if (num === null || num === undefined) return '0';
        return parseFloat(num).toFixed(decimals);
    }
    
    // 计算BMI
    static calculateBMI(weight, height) {
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    
    // 生成随机ID
    static generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // 深拷贝对象
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 显示提示消息
    static showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 添加样式
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#FF3B30' : '#007AFF'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
}

// ===== 初始化应用 =====
document.addEventListener('DOMContentLoaded', function() {
    // 初始化各个管理器
    window.NavigationManager = new NavigationManager();
    window.DataManager = new DataManager();
    window.AuthManager = new AuthManager();
    window.Utils = Utils;
    window.AppState = AppState;
    
    // 设置全局错误处理
    window.addEventListener('error', function(event) {
        console.error('全局错误:', event.error);
        Utils.showToast('应用发生错误，请刷新页面重试', 'error');
    });
    
    // 设置未处理的Promise拒绝
    window.addEventListener('unhandledrejection', function(event) {
        console.error('未处理的Promise拒绝:', event.reason);
    });
    
    // 初始化主题
    if (AppState.settings.darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    console.log('FitLife应用初始化完成');
    
    // 如果是生产环境，移除console.log
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.log = function() {};
        console.error = function() {};
        console.warn = function() {};
    }
});

// 导出到全局作用域（供其他脚本使用）
window.FitLife = {
    AppState,
    NavigationManager: window.NavigationManager,
    DataManager: window.DataManager,
    AuthManager: window.AuthManager,
    Utils: window.Utils
};