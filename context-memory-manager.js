/**
 * 上下文记忆管理器
 * 专门为长篇小说创作设计，确保AI不会忘记前文
 */

class ContextMemoryManager {
    constructor() {
        this.version = '1.0.0';
        this.maxContextLength = 8000; // 最大上下文长度
        this.maxHistoryItems = 50; // 最大历史记录数
        
        // 记忆存储结构
        this.memory = {
            project: {
                title: '',
                genre: '',
                summary: '',
                characters: [],
                plotPoints: [],
                settings: {}
            },
            chapters: [],
            currentChapter: 0,
            conversationHistory: [],
            keyEvents: [],
            characterRelationships: [],
            worldBuilding: {},
            writingStyle: {
                tone: '',
                perspective: '',
                tense: '',
                style: ''
            }
        };
        
        // 重要信息权重
        this.importanceWeights = {
            characterIntroduction: 10,
            plotDevelopment: 9,
            worldBuilding: 8,
            relationship: 7,
            dialogue: 6,
            description: 5,
            action: 4
        };
        
        this.initializeMemory();
    }

    /**
     * 初始化记忆系统
     */
    initializeMemory() {
        // 从localStorage加载记忆
        const saved = localStorage.getItem('storyMemory');
        if (saved) {
            try {
                this.memory = JSON.parse(saved);
            } catch (error) {
                console.warn('记忆数据损坏，重新初始化');
                this.clearMemory();
            }
        }
    }

    /**
     * 保存记忆到本地存储
     */
    saveMemory() {
        localStorage.setItem('storyMemory', JSON.stringify(this.memory));
    }

    /**
     * 更新项目上下文
     */
    updateProjectContext(projectData) {
        this.memory.project = {
            ...this.memory.project,
            ...projectData
        };
        this.saveMemory();
    }

    /**
     * 添加章节内容
     */
    addChapter(chapterNumber, content, summary = '') {
        const chapter = {
            number: chapterNumber,
            content: content,
            summary: summary || this.generateChapterSummary(content),
            wordCount: content.length,
            addedAt: new Date().toISOString(),
            keyElements: this.extractKeyElements(content)
        };
        
        // 更新或添加章节
        const existingIndex = this.memory.chapters.findIndex(ch => ch.number === chapterNumber);
        if (existingIndex >= 0) {
            this.memory.chapters[existingIndex] = chapter;
        } else {
            this.memory.chapters.push(chapter);
        }
        
        // 按章节号排序
        this.memory.chapters.sort((a, b) => a.number - b.number);
        
        this.memory.currentChapter = chapterNumber;
        this.saveMemory();
    }

    /**
     * 生成章节摘要
     */
    generateChapterSummary(content) {
        if (content.length < 100) {
            return content;
        }
        
        // 简化的摘要生成（实际应用中可以使用AI）
        const sentences = content.split(/[。！？]/);
        const summary = sentences.slice(0, 3).join('。') + '。';
        
        return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
    }

    /**
     * 提取关键元素
     */
    extractKeyElements(content) {
        const elements = {
            characters: [],
            places: [],
            events: [],
            emotions: [],
            dialogues: []
        };
        
        // 简化的关键信息提取（实际应用中可以使用NLP）
        const characterPatterns = /([A-Za-z\u4e00-\u9fa5]{2,4})[说道|想|认为|感觉|说]/g;
        const placePatterns = /(在|来到|进入)([A-Za-z\u4e00-\u9fa5]{2,10})/g;
        const emotionPatterns = /((?:高兴|悲伤|愤怒|恐惧|惊讶|厌恶|快乐|痛苦|兴奋|紧张|放松))/g;
        const dialoguePattern = /"([^"]+)"/g;
        
        let match;
        while ((match = characterPatterns.exec(content)) !== null) {
            if (!elements.characters.includes(match[1])) {
                elements.characters.push(match[1]);
            }
        }
        
        while ((match = placePatterns.exec(content)) !== null) {
            if (!elements.places.includes(match[2])) {
                elements.places.push(match[2]);
            }
        }
        
        while ((match = emotionPatterns.exec(content)) !== null) {
            if (!elements.emotions.includes(match[1])) {
                elements.emotions.push(match[1]);
            }
        }
        
        while ((match = dialoguePattern.exec(content)) !== null) {
            elements.dialogues.push(match[1]);
        }
        
        return elements;
    }

    /**
     * 记录对话历史
     */
    recordConversation(userMessage, aiResponse, context = {}) {
        const conversation = {
            timestamp: new Date().toISOString(),
            userMessage,
            aiResponse,
            context: {
                chapter: this.memory.currentChapter,
                wordCount: this.getTotalWordCount(),
                ...context
            }
        };
        
        this.memory.conversationHistory.push(conversation);
        
        // 限制历史记录数量
        if (this.memory.conversationHistory.length > this.maxHistoryItems) {
            this.memory.conversationHistory = this.memory.conversationHistory.slice(-this.maxHistoryItems);
        }
        
        this.saveMemory();
    }

    /**
     * 记录关键事件
     */
    recordKeyEvent(eventType, description, importance = 5, chapter = null) {
        const keyEvent = {
            id: Date.now(),
            type: eventType,
            description,
            importance,
            chapter: chapter || this.memory.currentChapter,
            timestamp: new Date().toISOString()
        };
        
        this.memory.keyEvents.push(keyEvent);
        
        // 按重要性排序，保留最重要的前20个事件
        this.memory.keyEvents.sort((a, b) => b.importance - a.importance);
        if (this.memory.keyEvents.length > 20) {
            this.memory.keyEvents = this.memory.keyEvents.slice(0, 20);
        }
        
        this.saveMemory();
    }

    /**
     * 更新角色关系
     */
    updateCharacterRelationship(character1, character2, relationship, description = '') {
        const relationshipData = {
            character1,
            character2,
            relationship,
            description,
            chapter: this.memory.currentChapter,
            updatedAt: new Date().toISOString()
        };
        
        const existingIndex = this.memory.characterRelationships.findIndex(
            rel => (rel.character1 === character1 && rel.character2 === character2) ||
                   (rel.character1 === character2 && rel.character2 === character1)
        );
        
        if (existingIndex >= 0) {
            this.memory.characterRelationships[existingIndex] = relationshipData;
        } else {
            this.memory.characterRelationships.push(relationshipData);
        }
        
        this.saveMemory();
    }

    /**
     * 记录世界观设定
     */
    recordWorldBuilding(category, key, value) {
        if (!this.memory.worldBuilding[category]) {
            this.memory.worldBuilding[category] = {};
        }
        
        this.memory.worldBuilding[category][key] = {
            value,
            addedAt: new Date().toISOString(),
            chapter: this.memory.currentChapter
        };
        
        this.saveMemory();
    }

    /**
     * 分析写作风格
     */
    analyzeWritingStyle(content) {
        // 简化的风格分析（实际应用中可以使用更复杂的NLP）
        const style = {
            tone: this.detectTone(content),
            perspective: this.detectPerspective(content),
            tense: this.detectTense(content),
            style: this.detectWritingStyle(content)
        };
        
        this.memory.writingStyle = { ...this.memory.writingStyle, ...style };
        this.saveMemory();
        
        return style;
    }

    /**
     * 检测语调
     */
    detectTone(content) {
        const positiveWords = ['快乐', '幸福', '美好', '温暖', '希望'];
        const negativeWords = ['悲伤', '痛苦', '黑暗', '绝望', '愤怒'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        positiveWords.forEach(word => {
            if (content.includes(word)) positiveCount++;
        });
        
        negativeWords.forEach(word => {
            if (content.includes(word)) negativeCount++;
        });
        
        if (positiveCount > negativeCount) return '积极';
        if (negativeCount > positiveCount) return '消极';
        return '中性';
    }

    /**
     * 检测视角
     */
    detectPerspective(content) {
        const firstPerson = content.includes('我') || content.includes('我们');
        const secondPerson = content.includes('你') || content.includes('你们');
        const thirdPerson = !firstPerson && !secondPerson;
        
        if (firstPerson) return '第一人称';
        if (secondPerson) return '第二人称';
        return '第三人称';
    }

    /**
     * 检测时态
     */
    detectTense(content) {
        const pastWords = ['了', '过', '曾经', '过去'];
        const presentWords = ['正在', '现在', '当前'];
        const futureWords = ['将要', '未来', '明天'];
        
        for (const word of pastWords) {
            if (content.includes(word)) return '过去时';
        }
        for (const word of futureWords) {
            if (content.includes(word)) return '将来时';
        }
        
        return '现在时';
    }

    /**
     * 检测写作风格
     */
    detectWritingStyle(content) {
        const description = content.match(/[\u4e00-\u9fa5]{2,10}的[\u4e00-\u9fa5]{2,10}/g) || [];
        const dialogue = content.match(/"[^"]+"/g) || [];
        
        if (description.length > dialogue.length * 2) return '描写型';
        if (dialogue.length > description.length) return '对话型';
        return '平衡型';
    }

    /**
     * 获取完整上下文
     */
    getFullContext(maxLength = null) {
        const context = {
            project: this.memory.project,
            chapters: this.memory.chapters,
            currentChapter: this.memory.currentChapter,
            recentHistory: this.getRecentHistory(),
            keyEvents: this.memory.keyEvents,
            relationships: this.memory.characterRelationships,
            worldBuilding: this.memory.worldBuilding,
            writingStyle: this.memory.writingStyle,
            totalWordCount: this.getTotalWordCount()
        };
        
        // 如果指定了最大长度，压缩上下文
        if (maxLength) {
            return this.compressContext(context, maxLength);
        }
        
        return context;
    }

    /**
     * 获取最近的历史记录
     */
    getRecentHistory(count = 10) {
        return this.memory.conversationHistory.slice(-count);
    }

    /**
     * 压缩上下文以适应长度限制
     */
    compressContext(context, maxLength) {
        const compressed = { ...context };
        
        // 压缩章节内容（只保留摘要）
        compressed.chapters = context.chapters.map(chapter => ({
            number: chapter.number,
            summary: chapter.summary,
            wordCount: chapter.wordCount,
            keyElements: chapter.keyElements
        }));
        
        // 限制历史记录
        compressed.recentHistory = context.recentHistory.slice(-5);
        
        // 只保留重要的关键事件
        compressed.keyEvents = context.keyEvents.slice(0, 10);
        
        return compressed;
    }

    /**
     * 搜索相关内容
     */
    searchMemory(query, type = 'all') {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // 搜索章节
        if (type === 'all' || type === 'chapters') {
            this.memory.chapters.forEach(chapter => {
                if (chapter.content.toLowerCase().includes(lowerQuery) || 
                    chapter.summary.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        type: 'chapter',
                        chapter: chapter.number,
                        content: chapter.summary,
                        relevance: this.calculateRelevance(query, chapter.content)
                    });
                }
            });
        }
        
        // 搜索角色
        if (type === 'all' || type === 'characters') {
            this.memory.project.characters.forEach(character => {
                if (character.name.toLowerCase().includes(lowerQuery) ||
                    (character.description && character.description.toLowerCase().includes(lowerQuery))) {
                    results.push({
                        type: 'character',
                        name: character.name,
                        content: character.description,
                        relevance: 9
                    });
                }
            });
        }
        
        // 搜索关键事件
        if (type === 'all' || type === 'events') {
            this.memory.keyEvents.forEach(event => {
                if (event.description.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        type: 'event',
                        description: event.description,
                        chapter: event.chapter,
                        relevance: event.importance
                    });
                }
            });
        }
        
        // 按相关性排序
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results.slice(0, 10); // 返回前10个结果
    }

    /**
     * 计算查询相关性
     */
    calculateRelevance(query, content) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const contentWords = content.toLowerCase().split(/\s+/);
        
        let matchCount = 0;
        queryWords.forEach(queryWord => {
            if (contentWords.some(contentWord => contentWord.includes(queryWord))) {
                matchCount++;
            }
        });
        
        return (matchCount / queryWords.length) * 10;
    }

    /**
     * 获取总字数
     */
    getTotalWordCount() {
        return this.memory.chapters.reduce((total, chapter) => total + chapter.wordCount, 0);
    }

    /**
     * 清空记忆
     */
    clearMemory() {
        this.memory = {
            project: {
                title: '',
                genre: '',
                summary: '',
                characters: [],
                plotPoints: [],
                settings: {}
            },
            chapters: [],
            currentChapter: 0,
            conversationHistory: [],
            keyEvents: [],
            characterRelationships: [],
            worldBuilding: {},
            writingStyle: {
                tone: '',
                perspective: '',
                tense: '',
                style: ''
            }
        };
        this.saveMemory();
    }

    /**
     * 导出记忆数据
     */
    exportMemory() {
        return {
            memory: this.memory,
            exportedAt: new Date().toISOString(),
            version: this.version
        };
    }

    /**
     * 导入记忆数据
     */
    importMemory(exportedData) {
        if (exportedData.memory) {
            this.memory = exportedData.memory;
            this.saveMemory();
            return true;
        }
        return false;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextMemoryManager;
} else {
    window.ContextMemoryManager = ContextMemoryManager;
}