/**
 * 单词冒险岛 - 游戏核心引擎
 * 负责游戏状态管理、逻辑处理、数据持久化等核心功能
 */

// ===== 游戏状态管理 =====
class WordAdventureGame {
    constructor() {
        this.storageKey = 'word_adventure_save';
        this.gameState = this.initGameState();
        this.eventListeners = new Map();
        this.isInitialized = false;
    }
    
    initGameState() {
        return {
            // 玩家信息
            player: {
                ...WordAdventureData.Characters.player,
                stats: { ...WordAdventureData.Characters.player.initialStats },
                unlocked: {
                    islands: ['creature_island'],
                    levels: ['l001'],
                    items: ['hint_scroll'],
                    achievements: []
                },
                progress: {
                    currentIsland: 'creature_island',
                    currentLevel: 'l001',
                    completedLevels: [],
                    totalWords: 0,
                    streak: 0,
                    lastPlayDate: null
                },
                inventory: {
                    coins: 100,
                    items: {
                        hint_scroll: 3,
                        time_crystal: 1,
                        heart_potion: 2
                    }
                }
            },
            
            // 学习数据
            learning: {
                learnedWords: [],           // 已学会的单词
                reviewingWords: [],         // 需要复习的单词
                masteredWords: [],          // 完全掌握的单词
                wordHistory: {},            // 单词学习历史
                challengeHistory: []        // 挑战记录
            },
            
            // 游戏设置
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                vibrationEnabled: true,
                difficulty: 'auto',        // auto, easy, normal, hard
                dailyTarget: 10,
                reminderEnabled: true,
                reminderTime: '19:00',
                parentMode: false
            },
            
            // 统计数据
            statistics: {
                totalPlayTime: 0,
                sessions: [],
                achievements: {},
                lastSession: null
            }
        };
    }
    
    // ===== 初始化游戏 =====
    async init() {
        if (this.isInitialized) return;
        
        try {
            // 加载存档
            this.loadGame();
            
            // 检查每日重置
            this.checkDailyReset();
            
            // 初始化复习系统
            this.initReviewSystem();
            
            // 注册事件监听
            this.registerEventListeners();
            
            // 启动自动保存
            this.startAutoSave();
            
            this.isInitialized = true;
            console.log('单词冒险岛游戏引擎初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            throw error;
        }
    }
    
    // ===== 存档管理 =====
    saveGame() {
        try {
            const saveData = {
                version: WordAdventureData.GameConfig.version,
                gameState: this.gameState,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            console.log('游戏已保存');
        } catch (error) {
            console.error('保存游戏失败:', error);
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.storageKey);
            if (saveData) {
                const data = JSON.parse(saveData);
                this.gameState = this.mergeGameState(this.gameState, data.gameState);
                console.log('游戏存档已加载');
            }
        } catch (error) {
            console.error('加载存档失败:', error);
            // 使用默认状态
        }
    }
    
    mergeGameState(defaultState, savedState) {
        // 深度合并，确保新版本的数据结构兼容
        const merged = JSON.parse(JSON.stringify(defaultState));
        
        function merge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        merge(merged, savedState);
        return merged;
    }
    
    // ===== 学习管理 =====
    learnWord(wordId, score = 100) {
        const word = this.findWord(wordId);
        if (!word) return false;
        
        const learningData = this.gameState.learning;
        const now = Date.now();
        
        // 更新单词学习状态
        if (!learningData.learnedWords.includes(wordId)) {
            learningData.learnedWords.push(wordId);
            this.gameState.player.progress.totalWords++;
        }
        
        // 记录学习历史
        if (!learningData.wordHistory[wordId]) {
            learningData.wordHistory[wordId] = [];
        }
        
        learningData.wordHistory[wordId].push({
            timestamp: now,
            score: score,
            attempts: 1,
            masteryLevel: this.calculateMasteryLevel(wordId)
        });
        
        // 检查是否需要加入复习队列
        if (score >= 80) {
            this.scheduleReview(wordId);
        }
        
        // 奖励经验值
        this.addExperience(WordAdventureData.GameConfig.expRewards.wordLearn);
        
        // 触发事件
        this.emit('wordLearned', { wordId, word, score });
        
        // 检查成就
        this.checkAchievements();
        
        this.saveGame();
        return true;
    }
    
    scheduleReview(wordId) {
        const reviewData = this.gameState.learning.reviewingWords;
        const intervals = WordAdventureData.GameConfig.reviewInterval;
        
        // 移除已存在的复习计划
        this.gameState.learning.reviewingWords = reviewData.filter(
            item => item.wordId !== wordId
        );
        
        // 添加新的复习计划
        const lastHistory = this.gameState.learning.wordHistory[wordId];
        const reviewCount = lastHistory ? lastHistory.length : 0;
        const intervalDays = intervals[Math.min(reviewCount, intervals.length - 1)];
        
        this.gameState.learning.reviewingWords.push({
            wordId: wordId,
            reviewDate: Date.now() + (intervalDays * 24 * 60 * 60 * 1000),
            interval: intervalDays,
            priority: this.calculateReviewPriority(wordId)
        });
    }
    
    calculateMasteryLevel(wordId) {
        const history = this.gameState.learning.wordHistory[wordId];
        if (!history || history.length === 0) return 0;
        
        const recentScores = history.slice(-3);
        const avgScore = recentScores.reduce((sum, h) => sum + h.score, 0) / recentScores.length;
        
        if (avgScore >= 95) return 5;      // 完全掌握
        if (avgScore >= 90) return 4;      // 熟练
        if (avgScore >= 80) return 3;      // 良好
        if (avgScore >= 70) return 2;      // 初步掌握
        return 1;                          // 刚学习
    }
    
    calculateReviewPriority(wordId) {
        const history = this.gameState.learning.wordHistory[wordId];
        if (!history) return 3;
        
        const lastScore = history[history.length - 1].score;
        const mastery = this.calculateMasteryLevel(wordId);
        
        // 分数越低，掌握程度越低，优先级越高
        return Math.max(1, 5 - Math.floor(lastScore / 20) - mastery);
    }
    
    // ===== 关卡系统 =====
    unlockIsland(islandId) {
        const island = WordAdventureData.LevelConfig[islandId];
        if (!island) return false;
        
        // 检查解锁条件
        if (island.unlockRequirement) {
            const req = island.unlockRequirement;
            if (!this.checkUnlockRequirement(req)) {
                return false;
            }
        }
        
        if (!this.gameState.player.unlocked.islands.includes(islandId)) {
            this.gameState.player.unlocked.islands.push(islandId);
            this.emit('islandUnlocked', { islandId, island });
            this.saveGame();
            return true;
        }
        
        return false;
    }
    
    checkUnlockRequirement(requirement) {
        if (requirement.island) {
            const island = WordAdventureData.LevelConfig[requirement.island];
            const completedInIsland = island.levels.filter(levelId =>
                this.gameState.player.progress.completedLevels.includes(levelId)
            ).length;
            
            return completedInIsland >= requirement.levels;
        }
        
        return true;
    }
    
    completeLevel(levelId, score, stars) {
        if (!this.gameState.player.progress.completedLevels.includes(levelId)) {
            this.gameState.player.progress.completedLevels.push(levelId);
            
            // 奖励经验值和金币
            const level = this.findLevel(levelId);
            if (level) {
                this.addExperience(level.rewards.exp);
                this.addCoins(level.rewards.coins);
                
                // 解锁下一关卡
                this.unlockNextLevel(levelId);
                
                // 检查岛屿解锁
                this.checkIslandUnlocks();
            }
            
            this.emit('levelCompleted', { levelId, score, stars });
        }
        
        this.saveGame();
    }
    
    unlockNextLevel(currentLevelId) {
        // 查找并解锁当前关卡的下一关
        for (const islandId in WordAdventureData.LevelConfig) {
            const island = WordAdventureData.LevelConfig[islandId];
            const currentIndex = island.levels.findIndex(level => level.id === currentLevelId);
            
            if (currentIndex !== -1 && currentIndex < island.levels.length - 1) {
                const nextLevel = island.levels[currentIndex + 1];
                if (!this.gameState.player.unlocked.levels.includes(nextLevel.id)) {
                    this.gameState.player.unlocked.levels.push(nextLevel.id);
                    this.emit('levelUnlocked', { levelId: nextLevel.id });
                }
            }
        }
    }
    
    checkIslandUnlocks() {
        for (const islandId in WordAdventureData.LevelConfig) {
            if (!this.gameState.player.unlocked.islands.includes(islandId)) {
                this.unlockIsland(islandId);
            }
        }
    }
    
    // ===== 挑战系统 =====
    startChallenge(challengeType, wordIds, difficulty = 'normal') {
        const challenge = {
            id: this.generateChallengeId(),
            type: challengeType,
            words: wordIds,
            difficulty: difficulty,
            startTime: Date.now(),
            score: 0,
            status: 'active',
            attempts: 0,
            maxAttempts: 3,
            timeLimit: this.getChallengeTimeLimit(challengeType),
            currentWord: null
        };
        
        this.emit('challengeStarted', challenge);
        return challenge;
    }
    
    submitChallengeAnswer(challengeId, answer) {
        const challenge = this.getActiveChallenge(challengeId);
        if (!challenge || challenge.status !== 'active') return false;
        
        challenge.attempts++;
        const isCorrect = this.validateAnswer(challenge, answer);
        
        if (isCorrect) {
            challenge.score = this.calculateChallengeScore(challenge);
            challenge.status = 'completed';
            
            // 记录挑战历史
            this.gameState.learning.challengeHistory.push({
                ...challenge,
                completedTime: Date.now()
            });
            
            this.emit('challengeCompleted', challenge);
        } else if (challenge.attempts >= challenge.maxAttempts) {
            challenge.status = 'failed';
            this.emit('challengeFailed', challenge);
        }
        
        return isCorrect;
    }
    
    getActiveChallenge(challengeId) {
        // 这里应该从当前活动的挑战中查找
        // 简化实现，实际应该维护一个活动挑战列表
        return null;
    }
    
    validateAnswer(challenge, answer) {
        // 根据挑战类型验证答案
        const challengeType = WordAdventureData.ChallengeTypes[challenge.type];
        
        switch (challenge.type) {
            case 'pronunciation':
                return this.validatePronunciation(challenge.currentWord, answer);
            case 'spelling':
                return this.validateSpelling(challenge.currentWord, answer);
            case 'matching':
                return this.validateMatching(challenge.currentWord, answer);
            default:
                return answer === this.getCorrectAnswer(challenge.currentWord);
        }
    }
    
    validatePronunciation(wordId, audioData) {
        // 模拟语音识别验证
        // 实际实现需要调用语音识别API
        return Math.random() > 0.3; // 70%成功率
    }
    
    validateSpelling(wordId, userSpelling) {
        const word = this.findWord(wordId);
        if (!word) return false;
        
        return userSpelling.toLowerCase().trim() === word.word.toLowerCase();
    }
    
    validateMatching(wordId, selectedOption) {
        const word = this.findWord(wordId);
        if (!word) return false;
        
        return selectedOption === word.chinese;
    }
    
    getCorrectAnswer(wordId) {
        const word = this.findWord(wordId);
        return word ? word.word : '';
    }
    
    calculateChallengeScore(challenge) {
        const baseScore = 100;
        const accuracyBonus = (1 - (challenge.attempts - 1) / challenge.maxAttempts) * 50;
        const timeBonus = Math.max(0, (challenge.timeLimit - (Date.now() - challenge.startTime)) / 1000) * 2;
        
        return Math.round(baseScore + accuracyBonus + timeBonus);
    }
    
    getChallengeTimeLimit(challengeType) {
        const type = WordAdventureData.ChallengeTypes[challengeType];
        return type ? type.duration * 1000 : 60000; // 默认60秒
    }
    
    // ===== 角色成长 =====
    updateCharacterGrowth(characterId, stage) {
        const character = WordAdventureData.Characters[characterId];
        if (!character || !character.growth) return;
        
        // 更新角色成长状态
        if (!this.gameState.characterGrowth) {
            this.gameState.characterGrowth = {};
        }
        
        this.gameState.characterGrowth[characterId] = {
            currentStage: stage,
            unlockedDialogue: this.getUnlockedDialogue(characterId, stage),
            lastUpdated: Date.now()
        };
        
        this.emit('characterGrowth', { characterId, stage });
        this.saveGame();
    }
    
    getUnlockedDialogue(characterId, stage) {
        // 根据角色和成长阶段返回解锁的对话
        // 实际实现应该根据剧情章节来确定
        return [];
    }
    
    // ===== 成就系统 =====
    checkAchievements() {
        const achievements = WordAdventureData.Achievements;
        
        for (const achievementId in achievements) {
            const achievement = achievements[achievementId];
            if (!this.gameState.player.unlocked.achievements.includes(achievementId)) {
                if (this.checkAchievementCondition(achievement.condition)) {
                    this.unlockAchievement(achievementId, achievement);
                }
            }
        }
    }
    
    checkAchievementCondition(condition) {
        switch (condition.type) {
            case 'word_count':
                return this.gameState.learning.learnedWords.length >= condition.value;
            case 'perfect_score':
                const perfectChallenges = this.gameState.learning.challengeHistory.filter(
                    c => c.score >= 95
                ).length;
                return perfectChallenges >= condition.value;
            case 'streak':
                return this.gameState.player.progress.streak >= condition.value;
            case 'island_unlock':
                return this.gameState.player.unlocked.islands.length >= condition.value;
            default:
                return false;
        }
    }
    
    unlockAchievement(achievementId, achievement) {
        this.gameState.player.unlocked.achievements.push(achievementId);
        this.addExperience(achievement.expReward || 0);
        
        this.emit('achievementUnlocked', { achievementId, achievement });
        this.saveGame();
    }
    
    // ===== 道具系统 =====
    useItem(itemId, context = {}) {
        const item = WordAdventureData.Items[itemId];
        if (!item) return false;
        
        const inventory = this.gameState.player.inventory.items;
        if (!inventory[itemId] || inventory[itemId] <= 0) {
            return false;
        }
        
        // 使用道具
        inventory[itemId]--;
        
        let effectResult = null;
        switch (item.effect) {
            case 'show_first_letter':
                effectResult = this.showFirstLetter(context.wordId);
                break;
            case 'extend_time_30':
                effectResult = this.extendChallengeTime(30000);
                break;
            case 'extra_life':
                effectResult = this.addExtraLife();
                break;
        }
        
        this.emit('itemUsed', { itemId, item, effect: effectResult });
        this.saveGame();
        
        return effectResult;
    }
    
    showFirstLetter(wordId) {
        const word = this.findWord(wordId);
        return word ? word.word.charAt(0) : '';
    }
    
    extendChallengeTime(milliseconds) {
        // 延长当前挑战时间
        this.emit('challengeTimeExtended', { milliseconds });
        return true;
    }
    
    addExtraLife() {
        // 添加额外的生命值
        this.emit('extraLifeAdded');
        return true;
    }
    
    // ===== 经验和等级系统 =====
    addExperience(amount) {
        const stats = this.gameState.player.stats;
        stats.exp += amount;
        
        // 检查升级
        const expNeeded = this.getExpForNextLevel(stats.level);
        if (stats.exp >= expNeeded) {
            this.levelUp();
        }
        
        this.emit('experienceGained', { amount, currentExp: stats.exp });
    }
    
    levelUp() {
        const stats = this.gameState.player.stats;
        stats.level++;
        stats.exp = 0; // 重置经验值
        
        // 升级奖励
        const reward = this.calculateLevelUpReward(stats.level);
        this.addCoins(reward.coins);
        
        // 解锁新内容
        this.checkLevelUnlocks(stats.level);
        
        this.emit('levelUp', { newLevel: stats.level, reward });
    }
    
    getExpForNextLevel(level) {
        return level * 100; // 每级需要100*等级的经验值
    }
    
    calculateLevelUpReward(level) {
        return {
            coins: level * 50,
            items: level % 5 === 0 ? ['time_crystal'] : null,
            unlocks: level % 3 === 0 ? ['new_item'] : null
        };
    }
    
    checkLevelUnlocks(level) {
        // 根据等级解锁新功能
        if (level === 5) {
            this.unlockIsland('volcano_island');
        } else if (level === 10) {
            this.unlockIsland('pyramid_island');
        }
    }
    
    addCoins(amount) {
        this.gameState.player.inventory.coins += amount;
        this.emit('coinsGained', { amount });
    }
    
    // ===== 复习系统 =====
    initReviewSystem() {
        this.checkPendingReviews();
        
        // 每小时检查一次复习
        setInterval(() => {
            this.checkPendingReviews();
        }, 60 * 60 * 1000);
    }
    
    checkPendingReviews() {
        const now = Date.now();
        const reviewingWords = this.gameState.learning.reviewingWords;
        
        const dueWords = reviewingWords.filter(review => review.reviewDate <= now);
        
        if (dueWords.length > 0) {
            this.emit('reviewWordsDue', { words: dueWords });
        }
    }
    
    completeReview(wordId, score) {
        const reviewingWords = this.gameState.learning.reviewingWords;
        const index = reviewingWords.findIndex(review => review.wordId === wordId);
        
        if (index !== -1) {
            reviewingWords.splice(index, 1);
            
            // 记录复习历史
            if (!this.gameState.learning.wordHistory[wordId]) {
                this.gameState.learning.wordHistory[wordId] = [];
            }
            
            this.gameState.learning.wordHistory[wordId].push({
                timestamp: Date.now(),
                score: score,
                isReview: true,
                masteryLevel: this.calculateMasteryLevel(wordId)
            });
            
            // 如果分数很高，安排下一次复习
            if (score >= 80) {
                this.scheduleReview(wordId);
            } else {
                // 分数较低，重新学习
                this.learnWord(wordId, score);
            }
            
            this.emit('reviewCompleted', { wordId, score });
            this.saveGame();
        }
    }
    
    // ===== 每日系统 =====
    checkDailyReset() {
        const today = new Date().toDateString();
        const lastPlay = this.gameState.player.progress.lastPlayDate;
        
        if (lastPlay !== today) {
            this.performDailyReset(lastPlay);
            this.gameState.player.progress.lastPlayDate = today;
        }
    }
    
    performDailyReset(lastPlayDate) {
        if (!lastPlayDate) {
            // 首次游戏
            return;
        }
        
        const lastDate = new Date(lastPlayDate);
        const today = new Date();
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // 连续登录
            this.gameState.player.progress.streak++;
            this.addExperience(WordAdventureData.GameConfig.expRewards.dailyLogin);
            this.emit('dailyLogin', { streak: this.gameState.player.progress.streak });
        } else {
            // 中断了连续登录
            this.gameState.player.progress.streak = 1;
            this.emit('streakBroken', { daysDiff });
        }
        
        // 重置每日任务
        this.resetDailyTasks();
    }
    
    resetDailyTasks() {
        this.gameState.dailyTasks = {
            wordsLearned: 0,
            challengesCompleted: 0,
            reviewCompleted: 0,
            timeSpent: 0
        };
        
        this.emit('dailyTasksReset');
    }
    
    // ===== 工具方法 =====
    findWord(wordId) {
        for (const difficulty in WordAdventureData.WordDatabase) {
            const word = WordAdventureData.WordDatabase[difficulty].find(w => w.id === wordId);
            if (word) return word;
        }
        return null;
    }
    
    findLevel(levelId) {
        for (const islandId in WordAdventureData.LevelConfig) {
            const island = WordAdventureData.LevelConfig[islandId];
            const level = island.levels.find(l => l.id === levelId);
            if (level) return { ...level, islandId, island };
        }
        return null;
    }
    
    generateChallengeId() {
        return 'challenge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ===== 事件系统 =====
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`事件处理错误 (${event}):`, error);
                }
            });
        }
    }
    
    // ===== 自动保存 =====
    startAutoSave() {
        setInterval(() => {
            this.saveGame();
        }, 30000); // 每30秒自动保存
    }
    
    // ===== 统计功能 =====
    updateStatistics(sessionData) {
        const stats = this.gameState.statistics;
        
        // 更新总游戏时间
        stats.totalPlayTime += sessionData.duration;
        
        // 记录会话
        stats.sessions.push({
            startTime: sessionData.startTime,
            duration: sessionData.duration,
            wordsLearned: sessionData.wordsLearned || 0,
            challengesCompleted: sessionData.challengesCompleted || 0,
            expGained: sessionData.expGained || 0
        });
        
        stats.lastSession = Date.now();
        
        // 保存统计
        this.saveGame();
    }
    
    getStatistics() {
        return {
            ...this.gameState.statistics,
            currentLevel: this.gameState.player.stats.level,
            totalWords: this.gameState.learning.learnedWords.length,
            masteredWords: this.gameState.learning.masteredWords.length,
            currentStreak: this.gameState.player.progress.streak,
            unlockedIslands: this.gameState.player.unlocked.islands.length,
            achievementsUnlocked: this.gameState.player.unlocked.achievements.length
        };
    }
}

// 创建全局游戏实例
window.WordAdventure = new WordAdventureGame();

// 导出给其他模块使用
window.GameEngine = window.WordAdventure;