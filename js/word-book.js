/**
 * 单词学习应用 - 主脚本
 * 包含智能机器人助手功能
 */

// ===== 全局变量 =====
let currentWords = [];
let currentWordIndex = 0;
let testWords = [];
let currentTestIndex = 0;
let testScore = 0;
let reviewWords = [];
let learnedWords = new Set();
let speechSynthesis = window.speechSynthesis;

// ===== 机器人助手类 =====
class RobotAssistant {
    constructor() {
        this.isVisible = false;
        this.isSpeaking = false;
        this.messages = {
            welcome: [
                "嗨！我是你的学习助手小智！今天想学什么新单词呢？",
                "你好呀！我是小智，准备好一起学习英语单词了吗？",
                "欢迎回来！今天又是充实的一天呢！"
            ],
            encouragement: [
                "你真棒！继续加油！",
                "做得好！学习就是这样一点点积累的！",
                "太厉害了！你的进步真大！",
                "继续努力，你是最棒的！",
                "相信自己，你一定可以的！"
            ],
            hints: [
                "试试把单词拆开记忆，比如 'book' 可以想象成 '宝库'！",
                "发音很重要，跟着我一起念：",
                "每个单词都有自己的故事，你知道吗？",
                "联想记忆是个好方法哦！",
                "试着用这个单词造个句子吧！"
            ],
            tips: [
                "每天坚持学习10分钟，效果比一周学一次好很多！",
                "复习是记忆之母，记得经常温习学过的单词！",
                "单词要在语境中学习，不要孤立记忆！",
                "听说读写结合，学习效果更佳！",
                "遇到困难时，休息一下再继续！"
            ]
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSpeechRecognition();
    }

    setupEventListeners() {
        const robotFab = document.getElementById('robotFab');
        const robotAssistant = document.getElementById('robotAssistant');
        const robotCloseBtn = document.getElementById('robotCloseBtn');
        const robotHelpBtn = document.getElementById('robotHelpBtn');
        const robotTipBtn = document.getElementById('robotTipBtn');
        const robotVoiceBtn = document.getElementById('robotVoiceBtn');

        // 打开机器人助手
        if (robotFab) {
            robotFab.addEventListener('click', () => {
                this.show();
                this.speak(this.getRandomMessage('welcome'));
            });
        }

        // 关闭机器人助手
        if (robotCloseBtn) {
            robotCloseBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // 帮助按钮
        if (robotHelpBtn) {
            robotHelpBtn.addEventListener('click', () => {
                this.provideContextHelp();
            });
        }

        // 提示按钮
        if (robotTipBtn) {
            robotTipBtn.addEventListener('click', () => {
                this.giveTip();
            });
        }

        // 语音按钮
        if (robotVoiceBtn) {
            robotVoiceBtn.addEventListener('click', () => {
                this.toggleVoice();
            });
        }

        // 学习建议按钮
        const robotAdviceBtn = document.getElementById('robotAdviceBtn');
        if (robotAdviceBtn) {
            robotAdviceBtn.addEventListener('click', () => {
                this.provideStudyAdvice();
            });
        }

        // 游戏按钮
        const robotGameBtn = document.getElementById('robotGameBtn');
        if (robotGameBtn) {
            robotGameBtn.addEventListener('click', () => {
                this.startMiniGame();
            });
        }

        // 语音识别按钮
        const robotMicBtn = document.getElementById('robotMicBtn');
        if (robotMicBtn) {
            robotMicBtn.addEventListener('click', () => {
                this.startVoiceRecognition();
            });
        }
            robotAdviceBtn.addEventListener('click', () => {
                this.provideStudyAdvice();
            });
        }

        // 游戏按钮
        const robotGameBtn = document.getElementById('robotGameBtn');
        if (robotGameBtn) {
            robotGameBtn.addEventListener('click', () => {
                this.startMiniGame();
            });
        }

        // 语音识别按钮
        const robotMicBtn = document.getElementById('robotMicBtn');
        if (robotMicBtn) {
            robotMicBtn.addEventListener('click', () => {
                this.startVoiceRecognition();
            });
        }
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'zh-CN';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceCommand(transcript);
            };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.updateMessage("语音识别失败，请再试一次！", 'error');
        };

        this.recognition.onend = () => {
            console.log('语音识别结束');
        };
    }

    // 触发语音识别
    startVoiceRecognition() {
        if (this.recognition) {
            this.updateMessage("🎤 正在听你说...（支持语音命令：帮助、提示、开始、关闭）");
            this.setEmotion('thinking');
            try {
                this.recognition.start();
            } catch (error) {
                console.error('启动语音识别失败:', error);
                this.updateMessage("语音识别启动失败，请检查浏览器权限", 'error');
            }
        } else {
            this.updateMessage("您的浏览器不支持语音识别功能", 'error');
        }
    }
    }

    show() {
        const robotAssistant = document.getElementById('robotAssistant');
        const robotFab = document.getElementById('robotFab');
        
        if (robotAssistant) {
            robotAssistant.classList.add('active');
            robotAssistant.classList.remove('hidden');
        }
        
        if (robotFab) {
            robotFab.style.display = 'none';
        }
        
        this.isVisible = true;
        this.animateRobot();
    }

    hide() {
        const robotAssistant = document.getElementById('robotAssistant');
        const robotFab = document.getElementById('robotFab');
        
        if (robotAssistant) {
            robotAssistant.classList.remove('active');
            robotAssistant.classList.add('hidden');
        }
        
        if (robotFab) {
            robotFab.style.display = 'flex';
        }
        
        this.isVisible = false;
    }

    animateRobot() {
        const eyes = document.querySelectorAll('.eye');
        const mouth = document.querySelector('.robot-mouth');
        
        // 眼睛动画
        eyes.forEach(eye => {
            eye.style.animation = 'blink 4s infinite';
        });
        
        // 嘴巴动画
        if (mouth) {
            mouth.style.animation = 'talk 2s infinite';
        }
    }

    updateMessage(message, type = 'normal') {
        const messageBubble = document.getElementById('messageBubble');
        if (messageBubble) {
            messageBubble.textContent = message;
            messageBubble.className = 'message-bubble';
            
            // 添加消息类型样式
            if (type === 'success') {
                messageBubble.style.background = '#d4edda';
                messageBubble.style.color = '#155724';
            } else if (type === 'error') {
                messageBubble.style.background = '#f8d7da';
                messageBubble.style.color = '#721c24';
            } else if (type === 'tip') {
                messageBubble.style.background = '#fff3cd';
                messageBubble.style.color = '#856404';
            }
            
            // 添加动画效果
            messageBubble.style.animation = 'fadeIn 0.5s ease';
        }
    }

    speak(text, lang = 'zh-CN') {
        if (!speechSynthesis) return;
        
        // 停止当前语音
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = lang === 'en-US' ? 0.8 : 0.9;
        utterance.pitch = lang === 'en-US' ? 1.0 : 1.1;
        utterance.volume = 0.8;
        
        // 显示正在说话的状态
        const messageBubble = document.getElementById('messageBubble');
        if (messageBubble) {
            messageBubble.classList.add('typing');
        }
        
        utterance.onstart = () => {
            this.isSpeaking = true;
            const voiceBtn = document.getElementById('robotVoiceBtn');
            if (voiceBtn) voiceBtn.textContent = '🔇';
            
            // 设置机器人表情和状态
            this.setEmotion('excited');
            console.log(`开始语音播放: ${text} (${lang})`);
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            const voiceBtn = document.getElementById('robotVoiceBtn');
            if (voiceBtn) voiceBtn.textContent = '🔊';
            
            if (messageBubble) {
                messageBubble.classList.remove('typing');
            }
            console.log('语音播放结束');
        };
        
        utterance.onerror = (event) => {
            console.error('语音播放错误:', event.error);
            this.updateMessage("语音播放出现问题，请检查浏览器设置", 'error');
            this.isSpeaking = false;
            const voiceBtn = document.getElementById('robotVoiceBtn');
            if (voiceBtn) voiceBtn.textContent = '🔊';
        };
        
        speechSynthesis.speak(utterance);
    }

    getRandomMessage(category) {
        const messages = this.messages[category];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    provideContextHelp() {
        const activeTab = document.querySelector('.tab-btn.active');
        const tabName = activeTab ? activeTab.dataset.tab : 'categories';
        
        let helpMessage = '';
        let additionalAdvice = this.getModeSpecificAdvice(tabName);
        
        switch (tabName) {
            case 'categories':
                this.setEmotion('thinking');
                helpMessage = "🗂️ 分类浏览：选择你感兴趣的主题开始学习！" + 
                           "\n💡 建议从简单的'颜色'或'动物'分类开始。" +
                           "\n🎯 每个分类都有不同数量的单词等待你发现！";
                break;
            case 'study':
                this.setEmotion('excited');
                helpMessage = "📖 学习模式：这是最重要的学习环节！" +
                           "\n👆 先选择分类，点击'开始学习'按钮。" +
                           "\n💡 每个单词都有音标和记忆技巧！" +
                           "\n🔊 别忘了点击'发音'按钮听标准发音！";
                break;
            case 'test':
                this.setEmotion('thinking');
                helpMessage = "🎯 测试模式：检验学习成果的好机会！" +
                           "\n✅ 选择分类开始测试，共有10道题目。" +
                           "\n💡 认真读题，选择最准确的中文意思。" +
                           "\n📊 测试结束后会给出详细的成绩分析！";
                break;
            case 'review':
                this.setEmotion('happy');
                helpMessage = "🔄 复习模式：温故而知新，可以为师矣！" +
                           "\n📚 这里显示你所有学过的单词。" +
                           "\n⏰ 建议定期复习，加深记忆印象。" +
                           "\n🌟 复习是最好的记忆巩固方法！";
                break;
        }
        
        this.updateMessage(helpMessage, 'tip');
        
        // 延迟播报具体建议，避免信息过载
        setTimeout(() => {
            this.speak(additionalAdvice);
        }, 2000);
    }

    giveTip() {
        const tip = this.getRandomMessage('tips');
        this.updateMessage(tip, 'tip');
        this.speak(tip);
    }

    toggleVoice() {
        if (this.isSpeaking) {
            speechSynthesis.cancel();
            this.isSpeaking = false;
            const voiceBtn = document.getElementById('robotVoiceBtn');
            if (voiceBtn) voiceBtn.textContent = '🔊';
        } else {
            const message = document.getElementById('messageBubble').textContent;
            if (message) {
                this.speak(message);
            }
        }
    }

    handleVoiceCommand(command) {
        this.updateMessage(`你说：${command}`);
        
        // 简单的语音命令处理
        if (command.includes('帮助') || command.includes('help')) {
            this.provideContextHelp();
        } else if (command.includes('提示') || command.includes('tip')) {
            this.giveTip();
        } else if (command.includes('关闭') || command.includes('close')) {
            this.hide();
        } else if (command.includes('开始') || command.includes('start')) {
            this.startLearning();
        }
    }

    // 学习相关方法
    onWordLearned(word) {
        learnedWords.add(word.word);
        this.updateMessage(`太棒了！你学会了新单词"${word.word}"！`, 'success');
        this.speak(`恭喜你学会了单词${word.word}`);
        this.celebrate();
    }

    onTestCompleted(score, total) {
        const percentage = Math.round((score / total) * 100);
        let message = `测试完成！你答对了${score}题，正确率${percentage}%！`;
        
        if (percentage >= 90) {
            message += " 太优秀了！";
        } else if (percentage >= 70) {
            message += " 做得不错，继续加油！";
        } else {
            message += " 别灰心，多练习会更好的！";
        }
        
        this.updateMessage(message, 'success');
        this.speak(message);
    }

    onStudyProgress(current, total) {
        const progress = Math.round((current / total) * 100);
        
        // 里程碑进度提醒
        if (current === total) {
            this.setEmotion('happy');
            this.updateMessage("🎉 恭喜！你已经完成了这个分类的学习！", 'success');
            this.speak("学习完成！你真棒！");
            this.celebrate();
        } else if (progress >= 75) {
            this.updateMessage(`💪 进度${progress}%，马上就要完成了！继续加油！`);
        } else if (progress >= 50) {
            this.updateMessage(`⭐ 进度${progress}%，已经完成一半了！`);
        } else if (progress >= 25) {
            this.updateMessage(`🚀 进度${progress}%，开了个好头！`);
        } else if (current === 1) {
            this.updateMessage("📖 学习开始！让我们一起探索这个分类的单词！");
        }
        
        // 语音提醒（避免过于频繁）
        if (current === 1 || current === total || progress % 25 === 0) {
            this.speak(`学习进度${progress}百分之`);
        }
    }

    celebrate() {
        const robotAssistant = document.getElementById('robotAssistant');
        if (robotAssistant) {
            robotAssistant.classList.add('excited');
            setTimeout(() => {
                robotAssistant.classList.remove('excited');
            }, 1000);
            
            // 添加庆祝消息
            this.updateMessage("🎉 太棒了！继续保持这个状态！");
        }
    }

    // 设置机器人表情
    setEmotion(emotion) {
        const robotAssistant = document.getElementById('robotAssistant');
        if (!robotAssistant) return;
        
        // 移除所有表情类
        robotAssistant.classList.remove('happy', 'excited', 'thinking');
        
        // 添加新的表情类
        robotAssistant.classList.add(emotion);
        
        // 3秒后移除表情
        setTimeout(() => {
            robotAssistant.classList.remove(emotion);
        }, 3000);
    }

    // 智能学习建议
    provideStudyAdvice() {
        this.setEmotion('thinking');
        
        const advice = this.getStudySuggestion();
        this.updateMessage("💭 " + advice, 'tip');
        
        setTimeout(() => {
            this.speak(advice);
        }, 500);
    }

    // 发音练习助手
    helpWithPronunciation(word) {
        this.setEmotion('excited');
        
        if (word && word.phonetic) {
            const message = `让我来教你发音：${word.word}，音标是：${word.phonetic}`;
            this.updateMessage(message);
            
            // 朗读单词和音标
            setTimeout(() => {
                this.speak(word.word, 'en-US');
            }, 1000);
            
            setTimeout(() => {
                this.speak(`音标：${word.phonetic}`, 'zh-CN');
            }, 2000);
        }
    }

    // 游戏化学习
    startMiniGame() {
        this.setEmotion('excited');
        const games = [
            "我们来玩个游戏吧！我来描述，你来猜是什么单词！",
            "单词接龙游戏准备好了吗？",
            "挑战时间！我给你中文，你说英文！"
        ];
        
        const gameMessage = games[Math.floor(Math.random() * games.length)];
        this.updateMessage("🎮 " + gameMessage);
        this.speak(gameMessage);
    }

    startLearning() {
        const studyBtn = document.getElementById('startStudyBtn');
        if (studyBtn && !studyBtn.disabled) {
            studyBtn.click();
        } else {
            this.updateMessage("请先选择一个分类，然后开始学习！");
        }
    }

    // 智能学习建议
    getStudySuggestion() {
        const totalLearned = learnedWords.size;
        const suggestion = [];
        
        if (totalLearned === 0) {
            suggestion.push("🌟 新手建议：从最基础的'颜色'或'动物'分类开始，这些词汇简单实用！");
            suggestion.push("💡 学习方法：每天学习5个单词，重点掌握发音和中文意思。");
        } else if (totalLearned < 10) {
            suggestion.push("🎯 进步期：你已经有了很好的开始！建议现在尝试'人体部位'分类。");
            suggestion.push("📚 学习策略：可以开始使用测试模式来巩固已学单词。");
        } else if (totalLearned < 30) {
            suggestion.push("🚀 成长期：学习进度不错！建议挑战'学习用品'和'人物'分类。");
            suggestion.push("🎮 学习方法：结合游戏化学习，尝试单词接龙等互动方式。");
        } else if (totalLearned < 50) {
            suggestion.push("⭐ 突破期：你已经掌握了基础词汇！可以学习'食物'分类。");
            suggestion.push("🔍 深度学习：开始关注单词的用法，尝试造句练习。");
        } else {
            suggestion.push("👑 熟练期：太棒了！你已经掌握了大量单词，重点转向复习和应用。");
            suggestion.push("🌈 挑战自我：尝试教别人学英语，这是最好的巩固方式！");
        }
        
        return suggestion.join(' ');
    }

    // 基于学习模式的具体建议
    getModeSpecificAdvice(mode) {
        const advice = {
            categories: "💭 分类选择：建议按难度从易到难：颜色→动物→人体部位→学习用品→人物→食物",
            study: "📖 学习技巧：先看英文，试着回忆中文，再看答案加深印象",
            test: "🎯 测试策略：遇到不会的不要慌，用排除法提高正确率",
            review: "🔄 复习方法：遵循艾宾浩斯遗忘曲线，1天、3天、7天后复习效果最佳"
        };
        
        return advice[mode] || "💡 通用建议：坚持每天学习，积少成多！";
    }

    // 单词联想提示
    getWordAssociation(word) {
        if (word.mnemonic) {
            return `记忆技巧：${word.mnemonic}`;
        }
        if (word.association) {
            return `联想：${word.association}`;
        }
        return `试着把这个单词和生活中的事物联系起来！`;
    }
}

// ===== 初始化应用 =====
let robotAssistant;

document.addEventListener('DOMContentLoaded', function() {
    // 初始化机器人助手
    robotAssistant = new RobotAssistant();
    
    // 初始化应用其他功能
    initializeApp();
});

function initializeApp() {
    loadCategories();
    setupEventListeners();
    loadProgress();
    updateStats();
}

// ===== 分类管理 =====
function loadCategories() {
    const categories = [
        { id: 'body', name: '人体部位', icon: '👤', count: WordDatabase.body.length },
        { id: 'colours', name: '颜色', icon: '🎨', count: WordDatabase.colours.length },
        { id: 'school', name: '学习用品', icon: '📚', count: WordDatabase.school.length },
        { id: 'animals', name: '动物', icon: '🐾', count: WordDatabase.animals.length },
        { id: 'people', name: '人物', icon: '👥', count: WordDatabase.people.length },
        { id: 'food', name: '食物', icon: '🍎', count: WordDatabase.food.length }
    ];

    const categoryGrid = document.getElementById('categoryGrid');
    if (!categoryGrid) return;

    categoryGrid.innerHTML = '';
    categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="category-icon">${category.icon}</div>
            <div class="category-name">${category.name}</div>
            <div class="category-count">${category.count}个单词</div>
        `;
        card.addEventListener('click', () => selectCategory(category.id));
        categoryGrid.appendChild(card);
    });
}

function selectCategory(categoryId) {
    const category = WordDatabase[categoryId];
    if (!category) return;

    currentWords = category;
    
    // 切换到学习模式
    const studyTab = document.querySelector('[data-tab="study"]');
    if (studyTab) {
        studyTab.click();
    }
    
    // 更新分类选择
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.value = categoryId;
    }
    
    // 机器人提示
    if (robotAssistant) {
        const categoryNames = {
            body: '人体部位',
            colours: '颜色',
            school: '学习用品',
            animals: '动物',
            people: '人物',
            food: '食物'
        };
        const categoryName = categoryNames[categoryId] || categoryId;
        robotAssistant.updateMessage(`太好了！你选择了"${categoryName}"分类，点击"开始学习"按钮开始吧！`);
    }
}

// ===== 学习模式 =====
function startStudy() {
    if (!currentWords.length) {
        alert('请先选择一个分类！');
        return;
    }

    currentWordIndex = 0;
    const container = document.getElementById('wordCardContainer');
    if (container) container.style.display = 'block';

    showCurrentWord();
}

function showCurrentWord() {
    if (!currentWords[currentWordIndex]) return;

    const word = currentWords[currentWordIndex];
    const wordEnglish = document.getElementById('wordEnglish');
    const wordPhonetic = document.getElementById('wordPhonetic');
    const wordChinese = document.getElementById('wordChinese');
    const progressFill = document.getElementById('progressFill');

    if (wordEnglish) wordEnglish.textContent = word.word;
    if (wordPhonetic) wordPhonetic.textContent = word.phonetic;
    if (wordChinese) {
        wordChinese.style.display = 'none';
        wordChinese.textContent = word.chinese;
    }

    const progress = ((currentWordIndex + 1) / currentWords.length) * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;

    // 机器人助手进度提醒
    if (robotAssistant) {
        robotAssistant.onStudyProgress(currentWordIndex + 1, currentWords.length);
    }
}

function showAnswer() {
    const wordChinese = document.getElementById('wordChinese');
    if (wordChinese && currentWords[currentWordIndex]) {
        wordChinese.style.display = 'block';
        
        // 机器人提示记忆技巧
        if (robotAssistant) {
            robotAssistant.setEmotion('thinking');
            const association = robotAssistant.getWordAssociation(currentWords[currentWordIndex]);
            robotAssistant.updateMessage(association, 'tip');
            
            // 延迟播报，让用户先看到内容
            setTimeout(() => {
                robotAssistant.speak(association);
            }, 1000);
        }
    }
}

function nextWord() {
    if (currentWords[currentWordIndex]) {
        learnedWords.add(currentWords[currentWordIndex].word);
        
        // 机器人祝贺
        if (robotAssistant) {
            robotAssistant.onWordLearned(currentWords[currentWordIndex]);
        }
    }

    currentWordIndex++;
    if (currentWordIndex < currentWords.length) {
        showCurrentWord();
        const wordChinese = document.getElementById('wordChinese');
        if (wordChinese) wordChinese.style.display = 'none';
    } else {
        // 学习完成
        const container = document.getElementById('wordCardContainer');
        if (container) container.style.display = 'none';
        saveProgress();
        updateStats();
    }
}

function prevWord() {
    currentWordIndex = Math.max(0, currentWordIndex - 1);
    showCurrentWord();
    const wordChinese = document.getElementById('wordChinese');
    if (wordChinese) wordChinese.style.display = 'none';
}

// ===== 测试模式 =====
function startTest() {
    const categorySelect = document.getElementById('testCategorySelect');
    const selectedCategory = categorySelect ? categorySelect.value : '';
    
    if (!selectedCategory) {
        alert('请先选择一个测试分类！');
        return;
    }

    const category = WordDatabase[selectedCategory];
    if (!category) return;

    // 随机选择10个单词进行测试
    testWords = [...category].sort(() => Math.random() - 0.5).slice(0, 10);
    currentTestIndex = 0;
    testScore = 0;

    const container = document.getElementById('testContainer');
    if (container) container.style.display = 'block';

    showTestQuestion();
}

function showTestQuestion() {
    if (!testWords[currentTestIndex]) return;

    const word = testWords[currentTestIndex];
    const questionWord = document.getElementById('questionWord');
    const questionPhonetic = document.getElementById('questionPhonetic');
    const testProgress = document.getElementById('testProgress');
    const testScoreEl = document.getElementById('testScore');

    if (questionWord) questionWord.textContent = word.word;
    if (questionPhonetic) questionPhonetic.textContent = word.phonetic;
    if (testProgress) testProgress.textContent = `${currentTestIndex + 1}/10`;
    if (testScoreEl) testScoreEl.textContent = `得分: ${testScore}`;

    // 生成选项
    generateTestOptions(word);
}

function generateTestOptions(correctWord) {
    const testOptions = document.getElementById('testOptions');
    if (!testOptions) return;

    // 创建选项数组
    const options = [correctWord.chinese];
    
    // 从其他单词中随机选择3个错误选项
    const otherWords = Object.values(WordDatabase).flat().filter(w => w.word !== correctWord.word);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
        options.push(shuffled[i].chinese);
    }

    // 打乱选项顺序
    options.sort(() => Math.random() - 0.5);

    // 生成选项按钮
    testOptions.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.addEventListener('click', () => checkAnswer(option, correctWord.chinese));
        testOptions.appendChild(btn);
    });
}

function checkAnswer(selected, correct) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) {
            btn.classList.add('correct');
        } else if (btn.textContent === selected && selected !== correct) {
            btn.classList.add('incorrect');
        }
    });

    if (selected === correct) {
        testScore++;
        if (robotAssistant) {
            robotAssistant.updateMessage("答对了！太棒了！🎉");
        }
    } else {
        if (robotAssistant) {
            robotAssistant.updateMessage(`答错了！正确答案是：${correct}`);
        }
    }

    setTimeout(() => {
        currentTestIndex++;
        if (currentTestIndex < testWords.length) {
            showTestQuestion();
        } else {
            endTest();
        }
    }, 2000);
}

function endTest() {
    const container = document.getElementById('testContainer');
    if (container) container.style.display = 'none';

    // 机器人助手评价
    if (robotAssistant) {
        robotAssistant.onTestCompleted(testScore, testWords.length);
    }

    saveProgress();
    updateStats();
}

// ===== 复习模式 =====
function startReview() {
    // 获取需要复习的单词（这里简化为所有学过的单词）
    reviewWords = Array.from(learnedWords).map(word => {
        for (let category of Object.values(WordDatabase)) {
            const found = category.find(w => w.word === word);
            if (found) return found;
        }
        return null;
    }).filter(Boolean);

    const container = document.getElementById('reviewContainer');
    if (container) container.style.display = 'block';

    displayReviewWords();
}

function displayReviewWords() {
    const reviewWordList = document.getElementById('reviewWordList');
    const needReviewCount = document.getElementById('needReviewCount');
    const masteredCount = document.getElementById('masteredCount');

    if (needReviewCount) needReviewCount.textContent = reviewWords.length;
    if (masteredCount) masteredCount.textContent = learnedWords.size;

    if (!reviewWordList) return;

    reviewWordList.innerHTML = '';
    reviewWords.forEach(word => {
        const item = document.createElement('div');
        item.className = 'review-word-item';
        item.innerHTML = `
            <div class="review-word-english">${word.word}</div>
            <div class="review-word-phonetic">${word.phonetic}</div>
            <div class="review-word-chinese">${word.chinese}</div>
        `;
        reviewWordList.appendChild(item);
    });
}

// ===== 事件监听器设置 =====
function setupEventListeners() {
    // Tab切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 更新内容显示
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));
            
            const targetContent = document.getElementById(tabName);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // 学习模式按钮
    const startStudyBtn = document.getElementById('startStudyBtn');
    if (startStudyBtn) {
        startStudyBtn.addEventListener('click', startStudy);
    }

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', prevWord);
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextWord);
    }

    const showAnswerBtn = document.getElementById('showAnswerBtn');
    if (showAnswerBtn) {
        showAnswerBtn.addEventListener('click', showAnswer);
    }

    const pronounceBtn = document.getElementById('pronounceBtn');
    if (pronounceBtn) {
        pronounceBtn.addEventListener('click', () => {
            if (currentWords[currentWordIndex]) {
                const word = currentWords[currentWordIndex];
                if (robotAssistant) {
                    robotAssistant.helpWithPronunciation(word);
                }
            }
        });
    }

    // 测试模式按钮
    const startTestBtn = document.getElementById('startTestBtn');
    if (startTestBtn) {
        startTestBtn.addEventListener('click', startTest);
    }

    // 复习模式按钮
    const startReviewBtn = document.getElementById('startReviewBtn');
    if (startReviewBtn) {
        startReviewBtn.addEventListener('click', startReview);
    }

    // 填充分类选择器
    const categorySelects = ['categorySelect', 'testCategorySelect'];
    categorySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">选择分类</option>';
            
            const categories = [
                { id: 'body', name: '人体部位' },
                { id: 'colours', name: '颜色' },
                { id: 'school', name: '学习用品' },
                { id: 'animals', name: '动物' },
                { id: 'people', name: '人物' },
                { id: 'food', name: '食物' }
            ];

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
    });
}

// ===== 进度管理 =====
function saveProgress() {
    const progress = {
        learnedWords: Array.from(learnedWords),
        lastStudyDate: new Date().toISOString()
    };
    localStorage.setItem('wordBookProgress', JSON.stringify(progress));
}

function loadProgress() {
    const saved = localStorage.getItem('wordBookProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        learnedWords = new Set(progress.learnedWords || []);
    }
}

function updateStats() {
    const learnedCount = document.getElementById('learnedCount');
    const totalCount = document.getElementById('totalCount');

    if (learnedCount) learnedCount.textContent = learnedWords.size;
    
    // 计算总单词数
    let totalWords = 0;
    Object.values(WordDatabase).forEach(category => {
        totalWords += category.length;
    });

    if (totalCount) totalCount.textContent = totalWords;
}