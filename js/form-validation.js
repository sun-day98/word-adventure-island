/**
 * FitLife - 表单验证模块
 * 提供统一的表单验证功能，支持各种验证规则和自定义错误消息
 */

// ===== 验证规则定义 =====
const ValidationRules = {
    // 必填验证
    required: {
        validate: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
        message: '此字段为必填项'
    },
    
    // 手机号验证（中国）
    phone: {
        validate: (value) => /^1[3-9]\d{9}$/.test(value),
        message: '请输入正确的手机号码'
    },
    
    // 邮箱验证
    email: {
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: '请输入正确的邮箱地址'
    },
    
    // 密码验证
    password: {
        validate: (value) => value.length >= 6 && value.length <= 20,
        message: '密码长度应为6-20位'
    },
    
    // 强密码验证
    strongPassword: {
        validate: (value) => {
            // 至少8位，包含大小写字母、数字和特殊字符
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message: '密码应至少8位，包含大小写字母、数字和特殊字符'
    },
    
    // 确认密码验证
    passwordConfirm: {
        validate: (value, context) => {
            const passwordField = context.form.querySelector('[name="password"], #password, #reg-password');
            return passwordField && value === passwordField.value;
        },
        message: '两次密码输入不一致'
    },
    
    // 验证码验证
    verificationCode: {
        validate: (value) => /^\d{6}$/.test(value),
        message: '请输入6位数字验证码'
    },
    
    // 用户名验证
    username: {
        validate: (value) => {
            const trimmed = value.trim();
            return trimmed.length >= 2 && trimmed.length <= 10 && /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(trimmed);
        },
        message: '用户名应为2-10位，支持中英文、数字和下划线'
    },
    
    // 年龄验证
    age: {
        validate: (value) => {
            const age = parseInt(value);
            return !isNaN(age) && age >= 12 && age <= 100;
        },
        message: '年龄应在12-100岁之间'
    },
    
    // 身高验证
    height: {
        validate: (value) => {
            const height = parseFloat(value);
            return !isNaN(height) && height >= 100 && height <= 250;
        },
        message: '身高应在100-250cm之间'
    },
    
    // 体重验证
    weight: {
        validate: (value) => {
            const weight = parseFloat(value);
            return !isNaN(weight) && weight >= 30 && weight <= 200;
        },
        message: '体重应在30-200kg之间'
    },
    
    // 体脂率验证
    bodyFat: {
        validate: (value) => {
            const bodyFat = parseFloat(value);
            return !isNaN(bodyFat) && bodyFat >= 5 && bodyFat <= 50;
        },
        message: '体脂率应在5-50%之间'
    },
    
    // 日期验证
    date: {
        validate: (value) => {
            const date = new Date(value);
            return !isNaN(date.getTime());
        },
        message: '请输入有效的日期'
    },
    
    // 生日验证（不能是未来日期）
    birthday: {
        validate: (value) => {
            const date = new Date(value);
            const today = new Date();
            return !isNaN(date.getTime()) && date < today;
        },
        message: '生日不能是未来日期'
    },
    
    // 数字验证
    number: {
        validate: (value) => !isNaN(parseFloat(value)) && isFinite(value),
        message: '请输入有效的数字'
    },
    
    // 正整数验证
    positiveInteger: {
        validate: (value) => /^\d+$/.test(value) && parseInt(value) > 0,
        message: '请输入正整数'
    },
    
    // URL验证
    url: {
        validate: (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        },
        message: '请输入有效的URL地址'
    },
    
    // 身份证验证（简单版）
    idCard: {
        validate: (value) => /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value),
        message: '请输入有效的身份证号码'
    },
    
    // 最小长度验证
    minLength: (min) => ({
        validate: (value) => value.length >= min,
        message: `最少需要${min}个字符`
    }),
    
    // 最大长度验证
    maxLength: (max) => ({
        validate: (value) => value.length <= max,
        message: `最多允许${max}个字符`
    }),
    
    // 自定义正则验证
    pattern: (regex, message) => ({
        validate: (value) => regex.test(value),
        message: message || '格式不正确'
    })
};

// ===== 表单验证器类 =====
class FormValidator {
    constructor(form, options = {}) {
        this.form = form;
        this.options = {
            errorClass: 'error',
            errorMessageClass: 'error-message',
            successClass: 'success',
            realTime: true,
            showErrorSummary: true,
            ...options
        };
        
        this.errors = new Map();
        this.validators = new Map();
        
        this.init();
    }
    
    init() {
        if (!this.form) {
            console.error('表单元素不存在');
            return;
        }
        
        // 添加data-rule属性解析
        this.parseValidationRules();
        
        // 绑定事件
        this.bindEvents();
        
        // 创建错误消息容器
        this.createErrorContainer();
    }
    
    parseValidationRules() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            const ruleAttr = field.dataset.rule;
            if (ruleAttr) {
                const rules = this.parseRuleAttribute(ruleAttr);
                this.validators.set(field, rules);
            }
        });
    }
    
    parseRuleAttribute(ruleAttr) {
        const rules = [];
        const ruleParts = ruleAttr.split('|');
        
        ruleParts.forEach(part => {
            // 解析带参数的规则，如 minLength:6
            const [ruleName, ...params] = part.split(':');
            
            if (ValidationRules[ruleName]) {
                const rule = typeof ValidationRules[ruleName] === 'function' 
                    ? ValidationRules[ruleName](...params) 
                    : ValidationRules[ruleName];
                rules.push({ name: ruleName, ...rule });
            } else if (ruleName.startsWith('pattern:')) {
                // 自定义正则表达式 pattern:/^\d{6}$/
                const match = ruleName.match(/pattern:\/(.+)\/$/);
                if (match) {
                    const regex = new RegExp(match[1]);
                    const message = params[0] || '格式不正确';
                    rules.push({
                        name: 'pattern',
                        validate: (value) => regex.test(value),
                        message
                    });
                }
            }
        });
        
        return rules;
    }
    
    bindEvents() {
        // 表单提交事件
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateAll();
        });
        
        // 实时验证事件
        if (this.options.realTime) {
            this.validators.forEach((rules, field) => {
                // 输入时验证
                field.addEventListener('input', () => {
                    this.validateField(field);
                });
                
                // 失去焦点时验证
                field.addEventListener('blur', () => {
                    this.validateField(field);
                });
                
                // 获得焦点时清除错误
                field.addEventListener('focus', () => {
                    this.clearFieldError(field);
                });
            });
        }
    }
    
    createErrorContainer() {
        if (this.options.showErrorSummary) {
            this.errorContainer = document.createElement('div');
            this.errorContainer.className = 'validation-summary';
            this.errorContainer.style.display = 'none';
            this.form.appendChild(this.errorContainer);
        }
    }
    
    validateField(field) {
        const value = field.value;
        const rules = this.validators.get(field);
        
        if (!rules || rules.length === 0) {
            return true;
        }
        
        // 清除之前的错误
        this.clearFieldError(field);
        
        const context = { form: this.form, field };
        
        for (const rule of rules) {
            if (!rule.validate(value, context)) {
                this.showFieldError(field, rule.message);
                return false;
            }
        }
        
        // 验证通过
        field.classList.add(this.options.successClass);
        return true;
    }
    
    validateAll() {
        let isValid = true;
        const firstErrorField = null;
        
        this.validators.forEach((rules, field) => {
            if (!this.validateField(field)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = field;
                }
            }
        });
        
        if (!isValid) {
            this.showErrorSummary();
            // 滚动到第一个错误字段
            if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            this.hideErrorSummary();
            // 触发表单提交成功事件
            this.form.dispatchEvent(new CustomEvent('validationSuccess', { bubbles: true }));
        }
        
        return isValid;
    }
    
    showFieldError(field, message) {
        // 添加错误样式
        field.classList.add(this.options.errorClass);
        field.classList.remove(this.options.successClass);
        
        // 查找或创建错误消息元素
        let errorElement = field.parentNode.querySelector(`.${this.options.errorMessageClass}`);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = this.options.errorMessageClass;
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        
        // 记录错误
        this.errors.set(field, message);
    }
    
    clearFieldError(field) {
        field.classList.remove(this.options.errorClass, this.options.successClass);
        
        const errorElement = field.parentNode.querySelector(`.${this.options.errorMessageClass}`);
        if (errorElement) {
            errorElement.remove();
        }
        
        this.errors.delete(field);
    }
    
    showErrorSummary() {
        if (!this.errorContainer || this.errors.size === 0) return;
        
        const errorMessages = Array.from(this.errors.values());
        this.errorContainer.innerHTML = `
            <div class="error-title">请修正以下错误：</div>
            <ul class="error-list">
                ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
            </ul>
        `;
        
        this.errorContainer.style.display = 'block';
    }
    
    hideErrorSummary() {
        if (this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
    }
    
    // 添加自定义验证规则
    addRule(name, rule) {
        ValidationRules[name] = rule;
    }
    
    // 动态添加字段验证
    addFieldValidation(field, rules) {
        const parsedRules = this.parseRuleAttribute(rules);
        this.validators.set(field, parsedRules);
        
        // 绑定事件
        field.addEventListener('input', () => {
            this.validateField(field);
        });
        
        field.addEventListener('blur', () => {
            this.validateField(field);
        });
    }
    
    // 移除字段验证
    removeFieldValidation(field) {
        this.validators.delete(field);
        this.clearFieldError(field);
    }
    
    // 重置验证状态
    reset() {
        this.validators.forEach((rules, field) => {
            this.clearFieldError(field);
        });
        this.hideErrorSummary();
    }
}

// ===== 快捷验证函数 =====
const QuickValidator = {
    // 验证手机号
    isValidPhone(phone) {
        return ValidationRules.phone.validate(phone);
    },
    
    // 验证邮箱
    isValidEmail(email) {
        return ValidationRules.email.validate(email);
    },
    
    // 验证密码强度
    getPasswordStrength(password) {
        if (ValidationRules.strongPassword.validate(password)) {
            return { level: 'strong', message: '密码强度：强' };
        } else if (password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
            return { level: 'medium', message: '密码强度：中等' };
        } else {
            return { level: 'weak', message: '密码强度：弱' };
        }
    },
    
    // 验证身份证号
    isValidIdCard(idCard) {
        return ValidationRules.idCard.validate(idCard);
    },
    
    // 验证URL
    isValidUrl(url) {
        return ValidationRules.url.validate(url);
    }
};

// ===== 自动初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    // 自动为带有data-validate属性的表单添加验证
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        const options = form.dataset.validateOptions 
            ? JSON.parse(form.dataset.validateOptions) 
            : {};
        new FormValidator(form, options);
    });
    
    console.log('表单验证模块初始化完成');
});

// ===== 导出到全局 =====
window.FormValidator = FormValidator;
window.ValidationRules = ValidationRules;
window.QuickValidator = QuickValidator;

// ===== CSS样式定义 =====
const validationStyles = `
<style>
.error-message {
    color: #FF3B30;
    font-size: 12px;
    margin-top: 4px;
    display: block;
}

.error {
    border-color: #FF3B30 !important;
    box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.1) !important;
}

.success {
    border-color: #4CAF50 !important;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1) !important;
}

.validation-summary {
    background: #FFF2F0;
    border: 1px solid #FFCCCB;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
}

.error-title {
    font-weight: 600;
    color: #D32F2F;
    margin-bottom: 8px;
}

.error-list {
    margin: 0;
    padding-left: 16px;
    color: #D32F2F;
}

.error-list li {
    margin-bottom: 4px;
}

/* 动画效果 */
.error-message {
    animation: shakeIn 0.3s ease-out;
}

@keyframes shakeIn {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

/* 输入框聚焦时的错误提示 */
.error:focus {
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.1); }
    50% { box-shadow: 0 0 0 4px rgba(255, 59, 48, 0.2); }
}
</style>
`;

// 注入样式到页面
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', validationStyles);
}