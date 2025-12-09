/**
 * 单词冒险岛 - 主入口文件
 * 负责页面导航、全局状态管理和核心功能协调
 */

// ===== 全局状态管理 =====
const GameState = {
    currentPlayer: {
        name: '冒险者',
        level: 1,
        exp: 0,
        coins: 100,
        avatar: 'assets/images/avatars/feifei.png',
        progress: {
            streak: 0,
            lastPlayDate: null,
            totalTime: 0,
            wordsLearned: 0
        }
    },
    
    // 游戏配置
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true,
        difficulty: 'normal'
    },
    
    // 当前页面
    currentPage: 'adventure-home'
};

// ===== 页面导航管理 =====
class NavigationManager {
    constructor() {
        this.currentPage = null;
        this.pageFrame = document.getElementById('page-frame');
    }
    
    navigateToPage(pageUrl, pageName = null) {
        if (!this.pageFrame) {
            console.error('页面容器未找到');
            return;
        }
        
        try {
            this.pageFrame.src = pageUrl;
            GameState.currentPage = pageName || pageUrl.replace('.html', '');
            
            // 更新导航栏状态
            this.updateNavigation(pageName || pageUrl.replace('.html', ''));
            
            // 记录页面访问
            this.logPageVisit(pageName || pageUrl);
            
        } catch (error) {
            console.error('页面导航失败:', error);
            this.showError('页面加载失败，请重试');
        }
    }
    
    updateNavigation(pageName) {
        // 更新导航栏激活状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });
    }
    
    logPageVisit(pageName) {
        console.log(`访问页面: ${pageName}`);
        // 这里可以添加访问统计
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-toast';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(220, 53, 69, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 16px;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// ===== 全局事件管理 =====
class EventManager {
    constructor() {
        this.events = {};
    }
    
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }
    
    emit(eventName, data = {}) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理错误 [${eventName}]:`, error);
                }
            });
        }
    }
    
    off(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
        }
    }
}

// ===== 全局实例 =====
const Navigation = new NavigationManager();
const Events = new EventManager();

// ===== 页面加载完成后的初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('单词冒险岛开始初始化...');
    
    try {
        // 初始化游戏
        initializeGame();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 检查本地存储
        loadGameState();
        
        // 显示欢迎界面
        showWelcomeScreen();
        
        console.log('单词冒险岛初始化完成');
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showInitializationError(error);
    }
});

// ===== 游戏初始化 =====
function initializeGame() {
    // 确保必要的DOM元素存在
    const requiredElements = [
        'page-frame',
        'player-level',
        'exp-fill',
        'exp-text',
        'coins-amount'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.warn('缺少DOM元素:', missingElements);
    }
    
    // 初始化导航系统
    if (Navigation.pageFrame) {
        Navigation.pageFrame.addEventListener('load', function() {
            console.log('页面加载完成');
        });
    }
}

// ===== 事件监听器设置 =====
function setupEventListeners() {
    // 导航链接点击事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            const href = this.getAttribute('href');
            Navigation.navigateToPage(href, page);
        });
    });
    
    // 底部导航栏外部链接处理
    document.querySelectorAll('.bottom-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const page = this.dataset.page || href.replace('.html', '');
            Navigation.navigateToPage(href, page);
        });
    });
    
    // 全局错误处理
    window.addEventListener('error', function(event) {
        console.error('全局错误:', event.error);
        
        // 如果是关键错误，显示错误页面
        if (event.error && event.error.message.includes('WordAdventure')) {
            showCriticalError();
        }
    });
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // 页面隐藏时暂停游戏
            pauseGame();
        } else {
            // 页面显示时恢复游戏
            resumeGame();
        }
    });
}

// ===== 游戏状态管理 =====
function loadGameState() {
    const savedState = localStorage.getItem('word-adventure-game-state');
    
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            Object.assign(GameState, parsedState);
            console.log('游戏状态已加载');
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            resetGameState();
        }
    } else {
        console.log('首次游戏，创建新状态');
        saveGameState();
    }
    
    updateUI();
}

function saveGameState() {
    try {
        localStorage.setItem('word-adventure-game-state', JSON.stringify(GameState));
        console.log('游戏状态已保存');
    } catch (error) {
        console.error('保存游戏状态失败:', error);
    }
}

function resetGameState() {
    GameState.currentPlayer = {
        name: '冒险者',
        level: 1,
        exp: 0,
        coins: 100,
        avatar: 'assets/images/avatars/feifei.png',
        progress: {
            streak: 0,
            lastPlayDate: null,
            totalTime: 0,
            wordsLearned: 0
        }
    };
    saveGameState();
}

// ===== UI更新 =====
function updateUI() {
    updatePlayerStats();
    updateNavigationState();
}

function updatePlayerStats() {
    const player = GameState.currentPlayer;
    
    // 更新等级
    const levelElement = document.getElementById('player-level');
    if (levelElement) {
        levelElement.textContent = player.level;
    }
    
    // 更新经验条
    const expNeeded = player.level * 100;
    const expPercentage = (player.exp / expNeeded) * 100;
    
    const expFill = document.getElementById('exp-fill');
    const expText = document.getElementById('exp-text');
    
    if (expFill) {
        expFill.style.width = `${expPercentage}%`;
    }
    
    if (expText) {
        expText.textContent = `${player.exp}/${expNeeded}`;
    }
    
    // 更新金币
    const coinsElement = document.getElementById('coins-amount');
    if (coinsElement) {
        coinsElement.textContent = player.coins;
    }
}

function updateNavigationState() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === GameState.currentPage) {
            item.classList.add('active');
        }
    });
}

// ===== 游戏控制 =====
function pauseGame() {
    console.log('游戏已暂停');
    Events.emit('gamePaused');
}

function resumeGame() {
    console.log('游戏已恢复');
    Events.emit('gameResumed');
}

// ===== 界面显示 =====
function showWelcomeScreen() {
    const lastPlayDate = GameState.currentPlayer.progress.lastPlayDate;
    const today = new Date().toDateString();
    
    if (lastPlayDate !== today) {
        // 新的一天，显示欢迎消息
        showWelcomeMessage();
        checkDailyReward();
    }
}

function showWelcomeMessage() {
    const messages = [
        '欢迎回到单词冒险岛！',
        '今天的冒险开始了！',
        '新的单词等待你去发现！',
        '继续你的魔法学习之旅！'
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    if (typeof showFloatingText === 'function') {
        showFloatingText(message, 'welcome');
    }
}

function checkDailyReward() {
    // 检查每日登录奖励
    const streak = GameState.currentPlayer.progress.streak;
    const reward = Math.max(10, streak * 5);
    
    GameState.currentPlayer.coins += reward;
    saveGameState();
    
    if (typeof showFloatingText === 'function') {
        showFloatingText(`每日登录 +${reward} 💰`, 'daily-bonus');
    }
}

function showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'initialization-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h2>😔 启动失败</h2>
            <p>游戏无法正常启动</p>
            <p>错误信息: ${error.message}</p>
            <button onclick="location.reload()">重新加载</button>
        </div>
    `;
    
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
    `;
    
    document.body.appendChild(errorDiv);
}

function showCriticalError() {
    alert('游戏发生严重错误，建议刷新页面重试');
}

// ===== 工具函数 =====
function showFloatingText(text, type = 'info') {
    const floatingText = document.createElement('div');
    floatingText.className = `floating-text floating-${type}`;
    floatingText.textContent = text;
    
    floatingText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 1000;
        font-size: 16px;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(floatingText);
    
    setTimeout(() => {
        if (floatingText.parentNode) {
            floatingText.parentNode.removeChild(floatingText);
        }
    }, 2000);
}

// ===== 导出全局对象 =====
window.GameState = GameState;
window.NavigationManager = NavigationManager;
window.EventManager = EventManager;
window.Navigation = Navigation;
window.Events = Events;

// ===== 添加CSS动画 =====
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    
    .error-toast {
        animation: fadeInOut 3s ease-in-out;
    }
`;
document.head.appendChild(style);