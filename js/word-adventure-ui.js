/**
 * 单词冒险岛 - UI交互管理器
 * 负责用户界面交互、动画效果、响应式处理等前端功能
 */

class WordAdventureUI {
    constructor() {
        this.currentTheme = 'default';
        this.soundEnabled = true;
        this.vibrationEnabled = true;
        this.animationsEnabled = true;
        this.isInitialized = false;
        
        // UI组件缓存
        this.components = new Map();
        this.activePopups = new Set();
        
        // 动画队列
        this.animationQueue = [];
        this.isAnimating = false;
    }
    
    // ===== 初始化 =====
    async init() {
        if (this.isInitialized) return;
        
        try {
            // 加载用户设置
            this.loadUserSettings();
            
            // 初始化主题
            this.initTheme();
            
            // 设置全局事件监听
            this.setupGlobalEventListeners();
            
            // 初始化音频系统
            this.initAudioSystem();
            
            // 初始化动画系统
            this.initAnimationSystem();
            
            // 设置触摸优化
            this.setupTouchOptimizations();
            
            // 初始化响应式处理
            this.initResponsiveHandling();
            
            this.isInitialized = true;
            console.log('WordAdventure UI 初始化完成');
            
        } catch (error) {
            console.error('UI 初始化失败:', error);
        }
    }
    
    // ===== 设置管理 =====
    loadUserSettings() {
        if (typeof WordAdventure !== 'undefined') {
            const settings = WordAdventure.gameState.settings;
            this.soundEnabled = settings.soundEnabled !== false;
            this.vibrationEnabled = settings.vibrationEnabled !== false;
            this.animationsEnabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : true;
        }
    }
    
    // ===== 主题系统 =====
    initTheme() {
        const savedTheme = localStorage.getItem('word_adventure_theme') || 'default';
        this.setTheme(savedTheme);
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    setTheme(themeName) {
        this.currentTheme = themeName;
        localStorage.setItem('word_adventure_theme', themeName);
        
        if (themeName === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(themeName);
        }
    }
    
    applyTheme(themeName) {
        const body = document.body;
        
        // 移除所有主题类
        body.classList.remove('theme-light', 'theme-dark', 'theme-default');
        
        // 添加新主题类
        body.classList.add(`theme-${themeName}`);
        
        // 更新主题色变量
        if (themeName === 'dark') {
            this.setCSSVariables({
                '--primary-color': '#8E44AD',
                '--secondary-color': '#3498DB',
                '--background-color': '#1a1a1a',
                '--surface-color': '#2c2c2e',
                '--text-color': '#ffffff',
                '--text-secondary': '#bdc3c7'
            });
        }
    }
    
    setCSSVariables(variables) {
        const root = document.documentElement;
        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }
    
    // ===== 音频系统 =====
    initAudioSystem() {
        this.audioContext = null;
        this.sounds = new Map();
        
        // 预加载音效
        this.preloadSounds();
    }
    
    preloadSounds() {
        const soundList = [
            'click',
            'success',
            'error',
            'achievement',
            'levelup',
            'word_learned',
            'challenge_complete',
            'coin_collect',
            'magic_cast'
        ];
        
        soundList.forEach(soundName => {
            this.loadSound(soundName);
        });
    }
    
    loadSound(soundName) {
        // 这里应该加载实际的音频文件
        // 暂时使用 Web Audio API 生成简单音效
        this.sounds.set(soundName, {
            name: soundName,
            loaded: true
        });
    }
    
    playSound(soundName, options = {}) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds.get(soundName);
        if (!sound) return;
        
        try {
            // 使用 Web Audio API 播放音效
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 根据音效类型设置不同的音频参数
            this.setSoundParameters(oscillator, gainNode, soundName, options);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + (options.duration || 0.2));
            
        } catch (error) {
            console.warn('音效播放失败:', error);
        }
    }
    
    setSoundParameters(oscillator, gainNode, soundName, options) {
        const volume = options.volume || 0.3;
        
        switch (soundName) {
            case 'click':
                oscillator.frequency.value = 800;
                gainNode.gain.value = volume;
                break;
            case 'success':
                oscillator.frequency.value = 1200;
                gainNode.gain.value = volume;
                break;
            case 'achievement':
                oscillator.frequency.value = 1600;
                gainNode.gain.value = volume * 1.5;
                break;
            case 'levelup':
                // 创建上升音调
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.3);
                gainNode.gain.value = volume;
                break;
            case 'coin_collect':
                oscillator.frequency.value = 2000;
                gainNode.gain.value = volume;
                break;
            default:
                oscillator.frequency.value = 1000;
                gainNode.gain.value = volume;
        }
    }
    
    // ===== 动画系统 =====
    initAnimationSystem() {
        this.animationFrameId = null;
        this.setupIntersectionObserver();
    }
    
    setupIntersectionObserver() {
        // 设置滚动动画
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });
        
        // 观察需要动画的元素
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            this.intersectionObserver.observe(el);
        });
    }
    
    animate(element, animationType, options = {}) {
        if (!this.animationsEnabled) {
            if (options.callback) options.callback();
            return;
        }
        
        const animations = {
            'fade-in': () => this.fadeIn(element, options),
            'slide-up': () => this.slideUp(element, options),
            'bounce': () => this.bounce(element, options),
            'pulse': () => this.pulse(element, options),
            'shake': () => this.shake(element, options),
            'flip': () => this.flip(element, options)
        };
        
        const animation = animations[animationType];
        if (animation) {
            animation();
        }
    }
    
    fadeIn(element, options = {}) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        const duration = options.duration || 300;
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
        
        setTimeout(() => {
            if (options.callback) options.callback();
        }, duration);
    }
    
    slideUp(element, options = {}) {
        element.style.transform = 'translateY(100%)';
        element.style.opacity = '0';
        
        const duration = options.duration || 400;
        element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        });
        
        setTimeout(() => {
            if (options.callback) options.callback();
        }, duration);
    }
    
    bounce(element, options = {}) {
        element.style.animation = `bounce ${options.duration || 600}ms ease`;
        
        setTimeout(() => {
            element.style.animation = '';
            if (options.callback) options.callback();
        }, options.duration || 600);
    }
    
    pulse(element, options = {}) {
        element.style.animation = `pulse ${options.duration || 800}ms ease infinite`;
        
        if (options.callback) {
            setTimeout(options.callback, options.duration || 800);
        }
    }
    
    shake(element, options = {}) {
        element.style.animation = `shake ${options.duration || 500}ms ease`;
        
        setTimeout(() => {
            element.style.animation = '';
            if (options.callback) options.callback();
        }, options.duration || 500);
    }
    
    flip(element, options = {}) {
        element.style.transform = 'rotateY(0deg)';
        element.style.transition = `transform ${options.duration || 600}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'rotateY(360deg)';
        });
        
        setTimeout(() => {
            element.style.transform = 'rotateY(0deg)';
            if (options.callback) options.callback();
        }, options.duration || 600);
    }
    
    // ===== 弹窗系统 =====
    showModal(content, options = {}) {
        const modalId = options.id || 'modal_' + Date.now();
        const modal = this.createModal(modalId, content, options);
        
        document.body.appendChild(modal);
        this.activePopups.add(modalId);
        
        // 添加到动画队列
        this.queueAnimation(() => {
            this.animate(modal.querySelector('.modal-content'), 'fade-in', {
                duration: options.animationDuration || 300
            });
        });
        
        // 播放音效
        this.playSound('click');
        
        // 触发震动
        this.vibrate(options.vibration || [10]);
        
        return modalId;
    }
    
    createModal(modalId, content, options) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = modalId;
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="WordAdventureUI.closeModal('${modalId}')"></div>
            <div class="modal-content ${options.size || 'medium'}">
                ${options.title ? `<div class="modal-header"><h3>${options.title}</h3></div>` : ''}
                <div class="modal-body">
                    ${content}
                </div>
                ${options.showFooter !== false ? `
                    <div class="modal-footer">
                        ${options.buttons ? this.createModalButtons(options.buttons, modalId) : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        return modal;
    }
    
    createModalButtons(buttons, modalId) {
        return buttons.map(btn => {
            const btnClass = btn.type === 'primary' ? 'primary-btn' : 'secondary-btn';
            return `<button class="${btnClass}" onclick="WordAdventureUI.handleModalButton('${btn.action}', '${modalId}')">${btn.text}</button>`;
        }).join('');
    }
    
    handleModalButton(action, modalId) {
        switch (action) {
            case 'close':
                this.closeModal(modalId);
                break;
            case 'confirm':
                this.closeModal(modalId);
                // 触发确认事件
                document.dispatchEvent(new CustomEvent('modalConfirmed', { detail: { modalId } }));
                break;
            default:
                // 自定义动作
                document.dispatchEvent(new CustomEvent('modalCustomAction', { detail: { action, modalId } }));
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        content.style.transition = 'opacity 300ms ease, transform 300ms ease';
        content.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            modal.remove();
            this.activePopups.delete(modalId);
        }, 300);
        
        this.playSound('click');
    }
    
    closeAllModals() {
        this.activePopups.forEach(modalId => {
            this.closeModal(modalId);
        });
    }
    
    // ===== 提示系统 =====
    showToast(message, type = 'info', options = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-message">${message}</div>
            ${options.closable ? '<button class="toast-close" onclick="this.parentElement.remove()">×</button>' : ''}
        `;
        
        document.body.appendChild(toast);
        
        // 动画进入
        this.queueAnimation(() => {
            this.animate(toast, 'slide-up', { duration: 200 });
        });
        
        // 自动移除
        if (options.autoClose !== false) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
                setTimeout(() => toast.remove(), 300);
            }, options.duration || 3000);
        }
        
        // 音效和震动
        this.playSound(type === 'error' ? 'error' : 'click');
        if (type === 'error' || type === 'warning') {
            this.vibrate([50, 100, 50]);
        }
    }
    
    showNotification(title, message, type = 'info', options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/assets/images/icon.png',
                badge: '/assets/images/badge.png',
                tag: options.tag || 'word-adventure'
            });
        } else {
            this.showToast(`${title}: ${message}`, type, options);
        }
    }
    
    // ===== 加载指示器 =====
    showLoading(message = '加载中...', options = {}) {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.id = 'global-loading-overlay';
        
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner ${options.spinnerType || 'default'}"></div>
                <div class="loading-text">${message}</div>
                ${options.showCancel ? '<button class="loading-cancel" onclick="WordAdventureUI.hideLoading()">取消</button>' : ''}
            </div>
        `;
        
        document.body.appendChild(loading);
        
        // 动画效果
        this.animate(loading, 'fade-in', { duration: 200 });
        
        return loading;
    }
    
    hideLoading() {
        const loading = document.getElementById('global-loading-overlay');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 300);
        }
    }
    
    // ===== 确认对话框 =====
    showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            const modalId = this.showModal(`
                <div class="confirm-content">
                    <div class="confirm-icon">${options.icon || '❓'}</div>
                    <div class="confirm-message">${message}</div>
                </div>
            `, {
                title: options.title || '确认',
                buttons: [
                    { text: '取消', type: 'secondary', action: 'cancel' },
                    { text: options.confirmText || '确认', type: 'primary', action: 'confirm' }
                ]
            });
            
            // 监听确认事件
            const handleConfirm = (e) => {
                document.removeEventListener('modalConfirmed', handleConfirm);
                document.removeEventListener('modalCustomAction', handleCancel);
                resolve(true);
            };
            
            const handleCancel = (e) => {
                if (e.detail.action === 'cancel') {
                    document.removeEventListener('modalConfirmed', handleConfirm);
                    document.removeEventListener('modalCustomAction', handleCancel);
                    resolve(false);
                }
            };
            
            document.addEventListener('modalConfirmed', handleConfirm);
            document.addEventListener('modalCustomAction', handleCancel);
        });
    }
    
    // ===== 表单验证 =====
    validateForm(formElement, rules) {
        const errors = {};
        let isValid = true;
        
        rules.forEach(rule => {
            const field = formElement.querySelector(`[name="${rule.name}"]`);
            if (!field) return;
            
            const value = field.value.trim();
            
            // 检查必填
            if (rule.required && !value) {
                errors[rule.name] = rule.requiredMessage || '此字段为必填项';
                isValid = false;
            }
            
            // 检查长度
            if (value && rule.minLength && value.length < rule.minLength) {
                errors[rule.name] = `最少需要${rule.minLength}个字符`;
                isValid = false;
            }
            
            if (value && rule.maxLength && value.length > rule.maxLength) {
                errors[rule.name] = `最多允许${rule.maxLength}个字符`;
                isValid = false;
            }
            
            // 自定义验证
            if (value && rule.validator && !rule.validator(value)) {
                errors[rule.name] = rule.message || '输入格式不正确';
                isValid = false;
            }
            
            // 显示错误
            if (errors[rule.name]) {
                this.showFieldError(field, errors[rule.name]);
            } else {
                this.hideFieldError(field);
            }
        });
        
        return { isValid, errors };
    }
    
    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    hideFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    // ===== 触摸优化 =====
    setupTouchOptimizations() {
        // 防止双击缩放
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 添加触摸反馈
        document.addEventListener('touchstart', function(e) {
            const target = e.target.closest('button, .btn, .clickable');
            if (target) {
                target.classList.add('touch-active');
            }
        });
        
        document.addEventListener('touchend', function(e) {
            const target = e.target.closest('button, .btn, .clickable');
            if (target) {
                setTimeout(() => target.classList.remove('touch-active'), 150);
            }
        });
    }
    
    // ===== 响应式处理 =====
    initResponsiveHandling() {
        // 监听屏幕尺寸变化
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 监听方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 100);
        });
        
        // 初始检查
        this.handleResize();
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 更新响应式类
        document.body.classList.remove('mobile', 'tablet', 'desktop');
        
        if (width < 768) {
            document.body.classList.add('mobile');
            this.adjustForMobile();
        } else if (width < 1024) {
            document.body.classList.add('tablet');
            this.adjustForTablet();
        } else {
            document.body.classList.add('desktop');
            this.adjustForDesktop();
        }
        
        // 调整游戏界面
        this.adjustGameInterface(width, height);
    }
    
    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
        
        // 重新调整游戏界面
        this.adjustGameInterface(window.innerWidth, window.innerHeight);
    }
    
    adjustForMobile() {
        // 移动端适配
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.paddingTop = '104px'; // 状态栏 + 玩家状态栏
        }
    }
    
    adjustForTablet() {
        // 平板适配
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.paddingTop = '104px';
        }
    }
    
    adjustForDesktop() {
        // 桌面适配
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.paddingTop = '44px'; // 只需要状态栏
        }
    }
    
    adjustGameInterface(width, height) {
        // 动态调整游戏界面元素
        const aspectRatio = width / height;
        
        if (aspectRatio > 1.5) {
            // 宽屏
            document.body.classList.add('wide-screen');
        } else {
            document.body.classList.remove('wide-screen');
        }
    }
    
    // ===== 全局事件监听 =====
    setupGlobalEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.hideLoading();
            }
        });
        
        // 网络状态
        window.addEventListener('online', () => {
            this.showToast('网络连接已恢复', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('网络连接已断开', 'warning');
        });
        
        // 页面可见性
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseBackgroundProcesses();
            } else {
                this.resumeBackgroundProcesses();
            }
        });
    }
    
    // ===== 后台进程管理 =====
    pauseBackgroundProcesses() {
        // 暂停音频
        if (this.audioContext) {
            this.audioContext.suspend();
        }
        
        // 暂停动画
        this.isAnimating = false;
    }
    
    resumeBackgroundProcesses() {
        // 恢复音频
        if (this.audioContext) {
            this.audioContext.resume();
        }
        
        // 恢复动画
        this.isAnimating = true;
        this.processAnimationQueue();
    }
    
    // ===== 动画队列 =====
    queueAnimation(animation) {
        this.animationQueue.push(animation);
        this.processAnimationQueue();
    }
    
    processAnimationQueue() {
        if (this.isAnimating || this.animationQueue.length === 0) return;
        
        this.isAnimating = true;
        const animation = this.animationQueue.shift();
        
        try {
            animation();
        } catch (error) {
            console.error('动画执行错误:', error);
        }
        
        // 处理下一个动画
        setTimeout(() => {
            this.isAnimating = false;
            this.processAnimationQueue();
        }, 50);
    }
    
    // ===== 工具方法 =====
    vibrate(pattern) {
        if (this.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
    
    debounce(func, wait) {
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
    
    throttle(func, limit) {
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
    
    // ===== 状态管理 =====
    saveUIState() {
        const state = {
            theme: this.currentTheme,
            soundEnabled: this.soundEnabled,
            vibrationEnabled: this.vibrationEnabled,
            animationsEnabled: this.animationsEnabled
        };
        
        localStorage.setItem('word_adventure_ui_state', JSON.stringify(state));
    }
    
    loadUIState() {
        try {
            const saved = localStorage.getItem('word_adventure_ui_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.currentTheme = state.theme || 'default';
                this.soundEnabled = state.soundEnabled !== false;
                this.vibrationEnabled = state.vibrationEnabled !== false;
                this.animationsEnabled = state.animationsEnabled !== false;
            }
        } catch (error) {
            console.warn('加载UI状态失败:', error);
        }
    }
}

// 创建全局UI管理器实例
window.WordAdventureUI = new WordAdventureUI();

// 添加全局CSS动画
const animationCSS = `
@keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0, -30px, 0); }
    70% { transform: translate3d(0, -15px, 0); }
    90% { transform: translate3d(0, -4px, 0); }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10000;
    max-width: 80%;
    text-align: center;
    font-size: 14px;
}

.toast-success { background: rgba(76, 175, 80, 0.9); }
.toast-error { background: rgba(244, 67, 54, 0.9); }
.toast-warning { background: rgba(255, 152, 0, 0.9); }
.toast-info { background: rgba(33, 150, 243, 0.9); }

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    max-width: 250px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #6A11CB;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
}

.loading-cancel {
    background: #f44336;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
}

.touch-active {
    transform: scale(0.95);
    opacity: 0.8;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    z-index: 1;
}

.modal-content.medium { max-width: 500px; }
.modal-content.large { max-width: 800px; }
.modal-content.small { max-width: 300px; }

.modal-header {
    padding: 20px 20px 0 20px;
    border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #333;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    padding: 0 20px 20px 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.field-error {
    color: #f44336;
    font-size: 12px;
    margin-top: 4px;
    display: none;
}

.error {
    border-color: #f44336 !important;
}

.confirm-content {
    text-align: center;
    padding: 20px 0;
}

.confirm-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.confirm-message {
    font-size: 16px;
    color: #333;
    line-height: 1.5;
}

.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-on-scroll.animate-in {
    opacity: 1;
    transform: translateY(0);
}
`;

// 添加样式到页面
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = animationCSS;
        document.head.appendChild(style);
    });
} else {
    const style = document.createElement('style');
    style.textContent = animationCSS;
    document.head.appendChild(style);
}