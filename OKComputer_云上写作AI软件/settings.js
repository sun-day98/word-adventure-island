/**
 * 设置页面JavaScript逻辑
 * 处理用户设置保存、加载和验证
 */

// 设置默认值
const defaultSettings = {
    profile: {
        username: '写作达人',
        email: 'writer@example.com',
        writingField: 'fiction',
        bio: '热爱写作，专注于科幻小说创作，希望通过AI工具提升写作效率。'
    },
    preferences: {
        writingStyle: 'creative',
        defaultDocType: 'novel',
        targetWordCount: 1000,
        autoSave: true,
        grammarCheck: true
    },
    aiSettings: {
        suggestionFrequency: 'medium',
        creativity: 5,
        autocomplete: true,
        multilingualSupport: false,
        specialty: 'general',
        languageStyle: 'professional',
        smartContinue: true,
        inspirationTips: true
    },
    uiSettings: {
        themeColor: '#F6AD55',
        fontSize: 'medium',
        darkMode: false,
        compactMode: false,
        showLineNumbers: true,
        showWordCount: true,
        showReadingTime: true
    },
    notifications: {
        emailNotifications: true,
        writingReminders: true,
        achievementAlerts: true,
        weeklyReports: true,
        systemUpdates: false
    }
};

// 当前设置
let currentSettings = { ...defaultSettings };

// 初始化设置页面
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    initializeEventListeners();
    setupRangeSliders();
    animateSettingsCards();
});

// 加载设置
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('ai_writing_settings');
        if (savedSettings) {
            currentSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
    } catch (error) {
        console.error('加载设置失败:', error);
        currentSettings = { ...defaultSettings };
    }
    
    // 应用设置到UI
    applySettingsToUI();
}

// 应用设置到UI
function applySettingsToUI() {
    // 个人资料
    document.getElementById('username').value = currentSettings.profile.username;
    document.getElementById('email').value = currentSettings.profile.email;
    document.getElementById('writing-field').value = currentSettings.profile.writingField;
    document.getElementById('bio').value = currentSettings.profile.bio;
    
    // 写作偏好
    document.querySelector(`input[name="writing-style"][value="${currentSettings.preferences.writingStyle}"]`).checked = true;
    document.getElementById('default-doc-type').value = currentSettings.preferences.defaultDocType;
    document.getElementById('target-word-count').value = currentSettings.preferences.targetWordCount;
    document.getElementById('auto-save').checked = currentSettings.preferences.autoSave;
    document.getElementById('grammar-check').checked = currentSettings.preferences.grammarCheck;
    
    // AI设置
    document.getElementById('ai-suggestion-frequency').value = currentSettings.aiSettings.suggestionFrequency;
    document.getElementById('ai-creativity').value = currentSettings.aiSettings.creativity;
    document.getElementById('ai-autocomplete').checked = currentSettings.aiSettings.autocomplete;
    document.getElementById('multilingual-support').checked = currentSettings.aiSettings.multilingualSupport;
    document.getElementById('ai-specialty').value = currentSettings.aiSettings.specialty;
    document.querySelector(`input[name="ai-language"][value="${currentSettings.aiSettings.languageStyle}"]`).checked = true;
    document.getElementById('smart-continue').checked = currentSettings.aiSettings.smartContinue;
    document.getElementById('inspiration-tips').checked = currentSettings.aiSettings.inspirationTips;
    
    // 更新创意程度滑块显示
    updateCreativityDisplay(currentSettings.aiSettings.creativity);
}

// 保存所有设置
function saveAllSettings() {
    try {
        // 收集表单数据
        currentSettings.profile = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            writingField: document.getElementById('writing-field').value,
            bio: document.getElementById('bio').value
        };
        
        currentSettings.preferences = {
            writingStyle: document.querySelector('input[name="writing-style"]:checked').value,
            defaultDocType: document.getElementById('default-doc-type').value,
            targetWordCount: parseInt(document.getElementById('target-word-count').value),
            autoSave: document.getElementById('auto-save').checked,
            grammarCheck: document.getElementById('grammar-check').checked
        };
        
        currentSettings.aiSettings = {
            suggestionFrequency: document.getElementById('ai-suggestion-frequency').value,
            creativity: parseInt(document.getElementById('ai-creativity').value),
            autocomplete: document.getElementById('ai-autocomplete').checked,
            multilingualSupport: document.getElementById('multilingual-support').checked,
            specialty: document.getElementById('ai-specialty').value,
            languageStyle: document.querySelector('input[name="ai-language"]:checked').value,
            smartContinue: document.getElementById('smart-continue').checked,
            inspirationTips: document.getElementById('inspiration-tips').checked
        };
        
        // 保存到localStorage
        localStorage.setItem('ai_writing_settings', JSON.stringify(currentSettings));
        
        // 显示成功消息
        showNotification('✅ 设置已保存', 'success');
        
        // 触发设置更新事件
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: currentSettings }));
        
        // 应用主题颜色
        applyThemeColor(currentSettings.uiSettings.themeColor);
        
    } catch (error) {
        console.error('保存设置失败:', error);
        showNotification('❌ 保存失败，请重试', 'error');
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    // 主题颜色选择
    document.querySelectorAll('.color-picker').forEach(picker => {
        picker.addEventListener('click', function() {
            selectColor(this.style.backgroundColor, this);
        });
    });
    
    // 字体大小滑块
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            updateFontSizeDisplay(this.value);
        });
    }
    
    // 创意程度滑块
    const creativitySlider = document.getElementById('ai-creativity');
    if (creativitySlider) {
        creativitySlider.addEventListener('input', function() {
            updateCreativityDisplay(this.value);
        });
    }
    
    // 重置设置按钮
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // 导出设置按钮
    const exportBtn = document.getElementById('export-settings');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSettings);
    }
    
    // 导入设置按钮
    const importBtn = document.getElementById('import-settings');
    if (importBtn) {
        importBtn.addEventListener('click', importSettings);
    }
}

// 选择主题颜色
function selectColor(color, element) {
    // 更新UI
    document.querySelectorAll('.color-picker').forEach(picker => {
        picker.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // 更新设置
    currentSettings.uiSettings.themeColor = color;
    
    // 应用到页面
    applyThemeColor(color);
}

// 应用主题颜色
function applyThemeColor(color) {
    document.documentElement.style.setProperty('--secondary-color', color);
    
    // 更新所有使用主题颜色的元素
    const elements = document.querySelectorAll('.btn-primary, .settings-card:hover');
    elements.forEach(el => {
        el.style.setProperty('--button-color', color);
    });
}

// 更新创意程度显示
function updateCreativityDisplay(value) {
    const display = document.getElementById('creativity-display');
    if (display) {
        const labels = ['非常保守', '保守', '较保守', '适中偏保守', '适中', 
                      '适中偏创新', '较创新', '创新', '较激进', '非常创新'];
        display.textContent = labels[value - 1] || '适中';
    }
}

// 更新字体大小显示
function updateFontSizeDisplay(value) {
    const display = document.getElementById('font-size-display');
    if (display) {
        const labels = {
            12: '很小',
            14: '小',
            16: '中等',
            18: '大',
            20: '很大',
            22: '巨大'
        };
        display.textContent = labels[value] || '中等';
    }
}

// 设置范围滑块
function setupRangeSliders() {
    // 创意程度滑块
    const creativitySlider = document.getElementById('ai-creativity');
    if (creativitySlider) {
        // 自定义滑块样式
        creativitySlider.style.background = `linear-gradient(to right, #F6AD55 0%, #F6AD55 ${creativitySlider.value * 10}%, #E5E7EB ${creativitySlider.value * 10}%, #E5E7EB 100%)`;
        
        creativitySlider.addEventListener('input', function() {
            this.style.background = `linear-gradient(to right, #F6AD55 0%, #F6AD55 ${this.value * 10}%, #E5E7EB ${this.value * 10}%, #E5E7EB 100%)`;
        });
    }
}

// 动画设置卡片
function animateSettingsCards() {
    anime({
        targets: '.settings-card',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(150),
        duration: 800,
        easing: 'easeOutExpo'
    });
}

// 重置设置
function resetSettings() {
    if (confirm('确定要重置所有设置吗？这将恢复到默认配置。')) {
        currentSettings = { ...defaultSettings };
        localStorage.removeItem('ai_writing_settings');
        applySettingsToUI();
        showNotification('✅ 设置已重置', 'success');
    }
}

// 导出设置
function exportSettings() {
    try {
        const dataStr = JSON.stringify(currentSettings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ai-writing-settings.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('✅ 设置已导出', 'success');
    } catch (error) {
        console.error('导出设置失败:', error);
        showNotification('❌ 导出失败，请重试', 'error');
    }
}

// 导入设置
function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedSettings = JSON.parse(event.target.result);
                    currentSettings = { ...defaultSettings, ...importedSettings };
                    localStorage.setItem('ai_writing_settings', JSON.stringify(currentSettings));
                    applySettingsToUI();
                    showNotification('✅ 设置已导入', 'success');
                } catch (error) {
                    console.error('导入设置失败:', error);
                    showNotification('❌ 导入失败，文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// 验证邮箱格式
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutExpo'
    });
    
    setTimeout(() => {
        anime({
            targets: notification,
            translateX: [0, 300],
            opacity: [1, 0],
            duration: 500,
            easing: 'easeInExpo',
            complete: () => {
                document.body.removeChild(notification);
            }
        });
    }, 3000);
}

// 获取当前设置
function getCurrentSettings() {
    return { ...currentSettings };
}

// 更新特定设置
function updateSetting(category, key, value) {
    if (currentSettings[category]) {
        currentSettings[category][key] = value;
        localStorage.setItem('ai_writing_settings', JSON.stringify(currentSettings));
    }
}

// 导出函数供HTML使用
window.saveAllSettings = saveAllSettings;
window.selectColor = selectColor;
window.resetSettings = resetSettings;
window.exportSettings = exportSettings;
window.importSettings = importSettings;
window.getCurrentSettings = getCurrentSettings;
window.updateSetting = updateSetting;