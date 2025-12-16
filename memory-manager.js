/**
 * MemOS记忆管理集成
 * 为AI小说创作系统添加记忆功能
 */

class MemoryManager {
    constructor() {
        this.isMemOSAvailable = false;
        this.userId = 'story_creator_user';
        this.channel = 'STORY_CREATION';
        this.conversationHistory = [];
        this.creativeMemory = {
            stories: [],
            characters: [],
            settings: [],
            preferences: [],
            writingStyle: {}
        };
        
        this.initialize();
    }

    /**
     * 初始化记忆管理器
     */
    async initialize() {
        console.log('🧠 初始化MemOS记忆管理...');
        
        try {
            // 检查MCP工具是否可用
            if (typeof mcp_call_tool === 'function') {
                this.isMemOSAvailable = true;
                console.log('✅ MemOS MCP工具可用');
                
                // 加载用户记忆
                await this.loadUserMemory();
            } else {
                console.log('⚠️ MemOS MCP工具不可用，使用本地存储');
                this.initializeLocalMemory();
            }
        } catch (error) {
            console.error('❌ 记忆管理初始化失败:', error);
            this.initializeLocalMemory();
        }
    }

    /**
     * 初始化本地记忆存储
     */
    initializeLocalMemory() {
        // 从localStorage加载记忆
        const savedMemory = localStorage.getItem('storyCreatorMemory');
        if (savedMemory) {
            try {
                this.creativeMemory = JSON.parse(savedMemory);
            } catch (error) {
                console.error('加载本地记忆失败:', error);
            }
        }
    }

    /**
     * 保存对话到记忆
     */
    async saveConversation(userMessage, aiResponse) {
        try {
            const messages = [
                { role: 'user', content: userMessage, chat_time: new Date().toISOString() },
                { role: 'assistant', content: aiResponse, chat_time: new Date().toISOString() }
            ];

            if (this.isMemOSAvailable) {
                // 使用MCP工具保存到MemOS
                await mcp_call_tool('IGCQVfQcLPJ1gaZmcpN3o', 'add_message', JSON.stringify({
                    conversation_first_message: this.getFirstMessage(),
                    messages: messages
                }));
            } else {
                // 本地保存
                this.saveLocalMemory(messages);
            }

        } catch (error) {
            console.error('保存对话记忆失败:', error);
        }
    }

    /**
     * 搜索相关记忆
     */
    async searchRelevantMemory(query) {
        try {
            if (this.isMemOSAvailable) {
                // 使用MCP工具搜索MemOS
                const result = await mcp_call_tool('IGCQVfQcLPJ1gaZmcpN3o', 'search_memory', JSON.stringify({
                    query: query,
                    conversation_first_message: this.getFirstMessage(),
                    memory_limit_number: 6
                }));
                
                return this.parseMemoryResults(result);
            } else {
                // 本地搜索
                return this.searchLocalMemory(query);
            }
        } catch (error) {
            console.error('搜索记忆失败:', error);
            return [];
        }
    }

    /**
     * 获取完整对话历史
     */
    async getFullConversation() {
        try {
            if (this.isMemOSAvailable) {
                // 使用MCP工具获取完整对话
                const result = await mcp_call_tool('IGCQVfQcLPJ1gaZmcpN3o', 'get_message', JSON.stringify({
                    conversation_first_message: this.getFirstMessage()
                }));
                
                return this.parseConversationHistory(result);
            } else {
                // 本地获取
                return this.conversationHistory;
            }
        } catch (error) {
            console.error('获取对话历史失败:', error);
            return this.conversationHistory;
        }
    }

    /**
     * 保存创作记忆
     */
    async saveCreativeMemory(type, content) {
        try {
            const memory = {
                type: type,
                content: content,
                timestamp: new Date().toISOString(),
                tags: this.generateTags(type, content)
            };

            if (this.isMemOSAvailable) {
                // 保存到MemOS
                await this.saveConversation('creative_memory', JSON.stringify(memory));
            } else {
                // 本地保存
                this.creativeMemory[type].push(memory);
                this.saveLocalCreativeMemory();
            }

        } catch (error) {
            console.error('保存创作记忆失败:', error);
        }
    }

    /**
     * 获取创作记忆
     */
    async getCreativeMemory(type, limit = 10) {
        try {
            if (this.isMemOSAvailable) {
                // 从MemOS搜索创作记忆
                const query = `创作记忆 ${type}`;
                const results = await this.searchRelevantMemory(query);
                return results.filter(memory => 
                    memory.content && memory.content.includes(type)
                ).slice(0, limit);
            } else {
                // 本地获取
                const memories = this.creativeMemory[type] || [];
                return memories.slice(-limit);
            }
        } catch (error) {
            console.error('获取创作记忆失败:', error);
            return [];
        }
    }

    /**
     * 保存用户偏好
     */
    async saveUserPreferences(preferences) {
        try {
            this.creativeMemory.preferences = {
                ...this.creativeMemory.preferences,
                ...preferences,
                lastUpdated: new Date().toISOString()
            };

            if (this.isMemOSAvailable) {
                await this.saveConversation('user_preferences', JSON.stringify(preferences));
            } else {
                this.saveLocalCreativeMemory();
            }

        } catch (error) {
            console.error('保存用户偏好失败:', error);
        }
    }

    /**
     * 获取用户偏好
     */
    async getUserPreferences() {
        try {
            if (this.isMemOSAvailable) {
                // 从MemOS搜索用户偏好
                const results = await this.searchRelevantMemory('用户偏好');
                return this.parseUserPreferences(results);
            } else {
                // 本地获取
                return this.creativeMemory.preferences || {};
            }
        } catch (error) {
            console.error('获取用户偏好失败:', error);
            return {};
        }
    }

    /**
     * 分析用户写作风格
     */
    async analyzeWritingStyle(text) {
        try {
            const styleAnalysis = {
                wordCount: text.length,
                avgSentenceLength: this.calculateAvgSentenceLength(text),
                complexity: this.analyzeComplexity(text),
                tone: this.analyzeTone(text),
                favoriteGenres: await this.getFavoriteGenres(),
                characterStyle: await this.getCharacterStyle()
            };

            // 保存风格分析
            this.creativeMemory.writingStyle = {
                ...this.creativeMemory.writingStyle,
                ...styleAnalysis,
                lastAnalyzed: new Date().toISOString()
            };

            if (this.isMemOSAvailable) {
                await this.saveConversation('writing_style', JSON.stringify(styleAnalysis));
            } else {
                this.saveLocalCreativeMemory();
            }

            return styleAnalysis;
        } catch (error) {
            console.error('分析写作风格失败:', error);
            return null;
        }
    }

    /**
     * 生成个性化建议
     */
    async generatePersonalizedSuggestions(currentContext) {
        try {
            const memories = await this.searchRelevantMemory(currentContext);
            const preferences = await this.getUserPreferences();
            const writingStyle = this.creativeMemory.writingStyle;

            const suggestions = {
                storyIdeas: this.generateStoryIdeas(memories, preferences),
                characterAdvice: this.generateCharacterAdvice(memories, writingStyle),
                plotSuggestions: this.generatePlotSuggestions(memories, preferences),
                styleTips: this.generateStyleTips(writingStyle, preferences)
            };

            return suggestions;
        } catch (error) {
            console.error('生成个性化建议失败:', error);
            return null;
        }
    }

    /**
     * 辅助方法 - 获取第一条消息
     */
    getFirstMessage() {
        return this.conversationHistory.length > 0 ? 
            this.conversationHistory[0].content : '开始创作对话';
    }

    /**
     * 辅助方法 - 解析记忆结果
     */
    parseMemoryResults(result) {
        try {
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            return result || [];
        } catch (error) {
            console.error('解析记忆结果失败:', error);
            return [];
        }
    }

    /**
     * 辅助方法 - 解析对话历史
     */
    parseConversationHistory(result) {
        try {
            if (typeof result === 'string') {
                const parsed = JSON.parse(result);
                return parsed.messages || parsed;
            }
            return result || this.conversationHistory;
        } catch (error) {
            console.error('解析对话历史失败:', error);
            return this.conversationHistory;
        }
    }

    /**
     * 辅助方法 - 解析用户偏好
     */
    parseUserPreferences(memories) {
        const preferences = {};
        memories.forEach(memory => {
            if (memory.content && memory.content.includes('user_preferences')) {
                try {
                    Object.assign(preferences, JSON.parse(memory.content));
                } catch (e) {
                    console.error('解析用户偏好失败:', e);
                }
            }
        });
        return preferences;
    }

    /**
     * 辅助方法 - 生成标签
     */
    generateTags(type, content) {
        const tags = [type];
        
        // 基于内容生成标签
        if (typeof content === 'string') {
            if (content.includes('浪漫') || content.includes('爱情')) tags.push('romance');
            if (content.includes('奇幻') || content.includes('魔法')) tags.push('fantasy');
            if (content.includes('悬疑') || content.includes('推理')) tags.push('mystery');
            if (content.includes('历史') || content.includes('古代')) tags.push('historical');
        }
        
        return tags;
    }

    /**
     * 辅助方法 - 本地保存记忆
     */
    saveLocalMemory(messages) {
        this.conversationHistory.push(...messages);
        if (this.conversationHistory.length > 100) {
            this.conversationHistory = this.conversationHistory.slice(-100);
        }
        localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
    }

    /**
     * 辅助方法 - 本地搜索记忆
     */
    searchLocalMemory(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // 搜索对话历史
        this.conversationHistory.forEach(message => {
            if (message.content.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: 'conversation',
                    content: message.content,
                    timestamp: message.chat_time,
                    relevance: this.calculateRelevance(query, message.content)
                });
            }
        });
        
        // 搜索创作记忆
        Object.values(this.creativeMemory).forEach(memories => {
            if (Array.isArray(memories)) {
                memories.forEach(memory => {
                    if (JSON.stringify(memory).toLowerCase().includes(lowerQuery)) {
                        results.push({
                            type: 'creative_memory',
                            content: memory.content,
                            timestamp: memory.timestamp,
                            relevance: this.calculateRelevance(query, JSON.stringify(memory))
                        });
                    }
                });
            }
        });
        
        return results.sort((a, b) => b.relevance - a.relevance).slice(0, 6);
    }

    /**
     * 辅助方法 - 保存创作记忆
     */
    saveLocalCreativeMemory() {
        localStorage.setItem('storyCreatorMemory', JSON.stringify(this.creativeMemory));
    }

    /**
     * 辅助方法 - 计算平均句长
     */
    calculateAvgSentenceLength(text) {
        const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
        if (sentences.length === 0) return 0;
        return Math.round(text.length / sentences.length);
    }

    /**
     * 辅助方法 - 分析复杂度
     */
    analyzeComplexity(text) {
        const words = text.length;
        const sentences = text.split(/[。！？.!?]/).length;
        const avgWordsPerSentence = words / sentences;
        
        if (avgWordsPerSentence < 10) return 'simple';
        if (avgWordsPerSentence < 20) return 'moderate';
        return 'complex';
    }

    /**
     * 辅助方法 - 分析语调
     */
    analyzeTone(text) {
        const emotionalWords = {
            happy: ['快乐', '高兴', '愉快', '兴奋', '开心'],
            sad: ['悲伤', '难过', '伤心', '痛苦', '失望'],
            angry: ['愤怒', '生气', '愤怒', '暴怒', '恼火'],
            calm: ['平静', '安静', '冷静', '宁静', '淡定']
        };
        
        const lowerText = text.toLowerCase();
        let maxCount = 0;
        let detectedTone = 'neutral';
        
        Object.entries(emotionalWords).forEach(([tone, words]) => {
            const count = words.filter(word => lowerText.includes(word)).length;
            if (count > maxCount) {
                maxCount = count;
                detectedTone = tone;
            }
        });
        
        return detectedTone;
    }

    /**
     * 辅助方法 - 获取偏好类型
     */
    async getFavoriteGenres() {
        const memories = await this.getCreativeMemory('stories', 20);
        const genreCount = {};
        
        memories.forEach(memory => {
            if (memory.content && memory.content.genre) {
                const genre = memory.content.genre;
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            }
        });
        
        return Object.entries(genreCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([genre]) => genre);
    }

    /**
     * 辅助方法 - 获取角色风格
     */
    async getCharacterStyle() {
        const characters = await this.getCreativeMemory('characters', 10);
        const traits = {};
        
        characters.forEach(memory => {
            if (memory.content && memory.content.traits) {
                memory.content.traits.forEach(trait => {
                    traits[trait] = (traits[trait] || 0) + 1;
                });
            }
        });
        
        return Object.entries(traits)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([trait]) => trait);
    }

    /**
     * 辅助方法 - 计算相关性
     */
    calculateRelevance(query, content) {
        if (!content) return 0;
        
        const queryWords = query.toLowerCase().split(' ');
        const contentWords = content.toLowerCase().split(' ');
        
        let matches = 0;
        queryWords.forEach(queryWord => {
            if (contentWords.some(contentWord => contentWord.includes(queryWord))) {
                matches++;
            }
        });
        
        return matches / queryWords.length;
    }

    /**
     * 辅助方法 - 生成故事想法
     */
    generateStoryIdeas(memories, preferences) {
        const ideas = [];
        
        if (preferences.favoriteGenre) {
            ideas.push(`继续创作${preferences.favoriteGenre}类型的故事`);
        }
        
        const storyMemories = memories.filter(m => m.type === 'creative_memory' && m.content.includes('story'));
        if (storyMemories.length > 0) {
            ideas.push('基于之前的创作经验继续发展');
        }
        
        return ideas;
    }

    /**
     * 辅助方法 - 生成角色建议
     */
    generateCharacterAdvice(memories, writingStyle) {
        const advice = [];
        
        if (writingStyle.characterStyle && writingStyle.characterStyle.length > 0) {
            advice.push(`基于您偏好的角色风格：${writingStyle.characterStyle.join('、')}`);
        }
        
        const characterMemories = memories.filter(m => m.content && m.content.includes('character'));
        if (characterMemories.length > 3) {
            advice.push('您已创建了丰富的角色，可以考虑角色间的关系发展');
        }
        
        return advice;
    }

    /**
     * 辅助方法 - 生成情节建议
     */
    generatePlotSuggestions(memories, preferences) {
        const suggestions = [];
        
        if (preferences.plotStructure) {
            suggestions.push(`使用${preferences.plotStructure}结构来组织情节`);
        }
        
        const plotMemories = memories.filter(m => m.content && m.content.includes('plot'));
        if (plotMemories.length > 0) {
            suggestions.push('参考之前的情节规划经验');
        }
        
        return suggestions;
    }

    /**
     * 辅助方法 - 生成风格建议
     */
    generateStyleTips(writingStyle, preferences) {
        const tips = [];
        
        if (writingStyle.complexity === 'simple') {
            tips.push('可以尝试使用更丰富的词汇和句式来提升表达效果');
        } else if (writingStyle.complexity === 'complex') {
            tips.push('当前写作较为复杂，注意保持读者理解度');
        }
        
        if (writingStyle.tone !== 'neutral') {
            tips.push(`您倾向于${writingStyle.tone}的表达方式，这很有特色`);
        }
        
        return tips;
    }

    /**
     * 获取记忆统计
     */
    getMemoryStats() {
        return {
            conversations: this.conversationHistory.length,
            stories: this.creativeMemory.stories.length,
            characters: this.creativeMemory.characters.length,
            settings: this.creativeMemory.settings.length,
            isMemOSAvailable: this.isMemOSAvailable,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 清理记忆
     */
    clearMemory() {
        this.conversationHistory = [];
        this.creativeMemory = {
            stories: [],
            characters: [],
            settings: [],
            preferences: [],
            writingStyle: {}
        };
        
        localStorage.removeItem('conversationHistory');
        localStorage.removeItem('storyCreatorMemory');
        
        console.log('🧹 记忆已清理');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryManager;
} else {
    window.MemoryManager = MemoryManager;
}