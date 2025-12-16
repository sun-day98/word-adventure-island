/**
 * 小说创作AI智能体
 * 基于现有多代理架构系统扩展
 */

class StoryCreationAgent {
    constructor() {
        this.agentType = 'story-creator';
        this.version = '1.0.0';
        
        // 故事创作状态
        this.storyState = {
            currentProject: null,
            genre: null,
            characters: [],
            plot: [],
            chapters: [],
            currentChapter: 1,
            wordCount: 0,
            targetWordCount: 50000
        };

        // 创作模式
        this.creationModes = {
            interactive: 'interactive',      // 交互式创作
            guided: 'guided',              // 引导式创作
            automatic: 'automatic',        // 自动生成
            collaborative: 'collaborative' // 协作创作
        };

        // 故事类型
        this.genres = {
            romance: {
                name: '言情小说',
                templates: ['现代都市', '古代宫斗', '校园青春', '职场情缘'],
                keywords: ['爱情', '浪漫', '情感纠葛', '甜蜜', '虐心']
            },
            fantasy: {
                name: '玄幻小说',
                templates: ['魔法世界', '玄幻修仙', '科幻未来', '异世界穿越'],
                keywords: ['魔法', '冒险', '成长', '战斗', '奇遇']
            },
            mystery: {
                name: '悬疑推理',
                templates: ['侦探破案', '心理悬疑', '犯罪推理', '惊悚恐怖'],
                keywords: ['悬疑', '推理', '破案', '真相', '反转']
            },
            historical: {
                name: '历史小说',
                templates: ['古代战争', '宫廷权谋', '民间故事', '历史人物'],
                keywords: ['历史', '权谋', '战争', '传奇', '文化']
            }
        };

        // 角色原型
        this.characterArchetypes = {
            protagonist: ['英雄', '普通人', '叛逆者', '智者', '梦想家'],
            antagonist: ['反派', '对手', '诱惑者', '障碍者', '黑暗面'],
            supporting: ['导师', '朋友', '恋人', '伙伴', '旁观者']
        };

        // 情节结构模板
        this.plotStructures = {
            threeAct: {
                name: '三幕式结构',
                phases: ['起因设定', '发展对抗', '结局解决']
            },
            heroJourney: {
                name: '英雄之旅',
                phases: ['平凡世界', '历险召唤', '导师帮助', '跨越边界', '考验盟友敌人', '深入洞穴', '严峻考验', '获得奖励', '回归之路', '复活重生', '满载而归']
            },
            freytag: {
                name: '弗雷塔格金字塔',
                phases: ['介绍', '上升', '高潮', '下降', '结局']
            }
        };

        this.initializeAgent();
    }

    initializeAgent() {
        console.log(`📚 小说创作AI智能体 ${this.version} 已启动`);
        this.loadStoryTemplates();
    }

    /**
     * 处理用户输入并生成响应
     */
    async processUserInput(userInput, context = {}) {
        const intent = this.analyzeIntent(userInput);
        
        switch (intent.type) {
            case 'create_story':
                return await this.handleStoryCreation(intent, context);
            case 'develop_character':
                return await this.handleCharacterDevelopment(intent, context);
            case 'plot_planning':
                return await this.handlePlotPlanning(intent, context);
            case 'write_chapter':
                return await this.handleChapterWriting(intent, context);
            case 'improve_text':
                return await this.handleTextImprovement(intent, context);
            case 'get_inspiration':
                return await this.handleInspirationRequest(intent, context);
            default:
                return this.generateGeneralResponse(userInput, context);
        }
    }

    /**
     * 分析用户意图
     */
    analyzeIntent(input) {
        const patterns = {
            create_story: /写小说|创作|开始故事|新建小说|故事创作/,
            develop_character: /角色|人物|主角|角色塑造|人物设定/,
            plot_planning: /情节|大纲|剧情|故事线|剧情发展/,
            write_chapter: /写章节|章节内容|继续写|生成章节/,
            improve_text: /修改|优化|润色|改进|重写/,
            get_inspiration: /灵感|创意|想法|素材|点子/
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(input)) {
                return {
                    type,
                    confidence: 0.8,
                    entities: this.extractEntities(input, type)
                };
            }
        }

        return { type: 'general', confidence: 0.5, entities: [] };
    }

    /**
     * 提取实体信息
     */
    extractEntities(input, intentType) {
        const entities = [];
        
        // 提取故事类型
        for (const [key, genre] of Object.entries(this.genres)) {
            if (input.includes(genre.name)) {
                entities.push({ type: 'genre', value: key });
            }
        }

        // 提取数字（章节数、字数等）
        const numbers = input.match(/\d+/g);
        if (numbers) {
            numbers.forEach(num => {
                if (input.includes('章')) {
                    entities.push({ type: 'chapter', value: parseInt(num) });
                } else if (input.includes('字')) {
                    entities.push({ type: 'word_count', value: parseInt(num) });
                }
            });
        }

        return entities;
    }

    /**
     * 处理故事创作
     */
    async handleStoryCreation(intent, context) {
        const response = {
            type: 'story_creation',
            suggestions: [],
            questions: [],
            templates: []
        };

        // 生成创作建议
        response.suggestions = this.generateCreationSuggestions();
        
        // 生成引导问题
        response.questions = [
            '你想写什么类型的故事？',
            '主角是什么样的人？',
            '故事发生在什么时代和地点？',
            '你希望传达什么主题？'
        ];

        // 推荐故事模板
        response.templates = this.getRecommendedTemplates();

        return response;
    }

    /**
     * 处理角色发展
     */
    async handleCharacterDevelopment(intent, context) {
        const response = {
            type: 'character_development',
            archetypes: [],
            traits: [],
            questions: []
        };

        // 推荐角色原型
        response.archetypes = this.characterArchetypes;

        // 生成角色特质
        response.traits = this.generateCharacterTraits();

        // 生成角色发展问题
        response.questions = [
            '这个角色的外貌特征是什么？',
            '他们的性格特点和缺点是什么？',
            '角色有什么背景故事？',
            '他们的目标和动机是什么？'
        ];

        return response;
    }

    /**
     * 处理情节规划
     */
    async handlePlotPlanning(intent, context) {
        const response = {
            type: 'plot_planning',
            structures: this.plotStructures,
            outline: [],
            suggestions: []
        };

        // 生成情节大纲建议
        if (this.storyState.genre) {
            response.outline = this.generatePlotOutline();
        }

        response.suggestions = [
            '设置一个引人入胜的开场',
            '在第一章就埋下伏笔',
            '每个章节都应该推动故事发展',
            '在故事中设置转折点',
            '确保结局令人满意'
        ];

        return response;
    }

    /**
     * 处理章节写作
     */
    async handleChapterWriting(intent, context) {
        const response = {
            type: 'chapter_writing',
            content: '',
            suggestions: [],
            wordCount: 0
        };

        const chapterNum = intent.entities.find(e => e.type === 'chapter')?.value || this.storyState.currentChapter;

        response.content = this.generateChapterContent(chapterNum);
        response.wordCount = response.content.length;
        response.suggestions = this.getWritingSuggestions(chapterNum);

        return response;
    }

    /**
     * 处理文本改进
     */
    async handleTextImprovement(intent, context) {
        const response = {
            type: 'text_improvement',
            suggestions: [],
            improvedVersion: '',
            analysis: {}
        };

        if (context.originalText) {
            response.analysis = this.analyzeText(context.originalText);
            response.improvedVersion = this.improveText(context.originalText);
            response.suggestions = this.getImprovementSuggestions(response.analysis);
        }

        return response;
    }

    /**
     * 处理灵感请求
     */
    async handleInspirationRequest(intent, context) {
        const response = {
            type: 'inspiration',
            prompts: [],
            ideas: [],
            images: []
        };

        response.prompts = this.generateCreativePrompts();
        response.ideas = this.generateStoryIdeas();
        response.images = this.generateImagePrompts();

        return response;
    }

    /**
     * 生成创作建议
     */
    generateCreationSuggestions() {
        return [
            '从你熟悉或感兴趣的领域开始创作',
            '设定一个明确的写作目标和时间表',
            '先完成初稿，再进行修改润色',
            '多阅读优秀作品，积累创作素材',
            '找到适合自己的创作时间和环境'
        ];
    }

    /**
     * 获取推荐模板
     */
    getRecommendedTemplates() {
        const templates = [];
        
        for (const [key, genre] of Object.entries(this.genres)) {
            genre.templates.forEach(template => {
                templates.push({
                    genre: genre.name,
                    template: template,
                    description: this.getTemplateDescription(template)
                });
            });
        }

        return templates;
    }

    /**
     * 生成角色特质
     */
    generateCharacterTraits() {
        const traits = {
            personality: ['勇敢', '善良', '聪明', '固执', '幽默', '内向', '外向', '冲动', '谨慎', '理想主义'],
            appearance: ['高大', '瘦小', '英俊', '美丽', '普通', '独特', '神秘', '亲和'],
            background: ['孤儿', '贵族', '平民', '学者', '商人', '军人', '艺术家', '医生'],
            skills: ['剑术', '魔法', '智慧', '领导力', '艺术天赋', '商业头脑', '医疗技能', '格斗技巧']
        };

        return traits;
    }

    /**
     * 生成情节大纲
     */
    generatePlotOutline() {
        const outline = [];
        const structure = this.plotStructures.threeAct;

        structure.phases.forEach((phase, index) => {
            outline.push({
                phase: phase,
                chapter: Math.floor((index + 1) * 5),
                description: this.getPhaseDescription(phase),
                keyEvents: this.getPhaseKeyEvents(phase)
            });
        });

        return outline;
    }

    /**
     * 生成章节内容
     */
    generateChapterContent(chapterNum) {
        const chapterTemplates = {
            1: `第一章开始，主角${this.generateCharacterName()}正在${this.generateScene()}。突然，${this.generatePlotEvent()}...`,
            2: `第二章，主角开始调查${this.generateMystery()}。在这个过程中，遇到了${this.generateCharacterName()}...`,
            3: `第三章，故事出现了新的转折。${this.generateTwistEvent()}。主角必须做出选择...`
        };

        return chapterTemplates[chapterNum] || `第${chapterNum}章内容正在创作中...`;
    }

    /**
     * 分析文本
     */
    analyzeText(text) {
        return {
            wordCount: text.length,
            sentenceCount: text.split('。').length,
            readability: this.calculateReadability(text),
            emotions: this.analyzeEmotions(text),
            themes: this.extractThemes(text)
        };
    }

    /**
     * 生成通用响应
     */
    generateGeneralResponse(input, context) {
        return {
            type: 'general',
            message: '我理解你的想法。让我们一起创作一个精彩的故事吧！你希望从哪里开始？',
            suggestions: [
                '开始创作新故事',
                '发展角色设定',
                '规划故事大纲',
                '写作特定章节'
            ]
        };
    }

    /**
     * 辅助方法
     */
    generateCharacterName() {
        const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
        const names = ['明', '华', '强', '敏', '静', '丽', '军', '洋', '勇', '艳'];
        return surnames[Math.floor(Math.random() * surnames.length)] + 
               names[Math.floor(Math.random() * names.length)];
    }

    generateScene() {
        const scenes = ['繁华的都市街头', '宁静的乡村小屋', '古老的图书馆', '神秘的森林深处', '现代化的办公室'];
        return scenes[Math.floor(Math.random() * scenes.length)];
    }

    generatePlotEvent() {
        const events = ['接到了一个神秘的电话', '发现了一件奇怪的物品', '遇到了意想不到的人', '得知了一个惊人的秘密'];
        return events[Math.floor(Math.random() * events.length)];
    }

    generateMystery() {
        const mysteries = ['一桩离奇的失踪案', '一个古老的传说', '一家公司的内幕', '一段被遗忘的历史'];
        return mysteries[Math.floor(Math.random() * mysteries.length)];
    }

    generateTwistEvent() {
        const twists = ['原来主角的身份并非表面那样', '一直信任的伙伴竟然背叛了', '看似无关的事件暗藏联系'];
        return twists[Math.floor(Math.random() * twists.length)];
    }

    getTemplateDescription(template) {
        const descriptions = {
            '现代都市': '发生在现代城市背景下的爱情故事',
            '古代宫斗': '以宫廷为背景的权谋争斗故事',
            '校园青春': '描绘校园生活的青春成长故事',
            '职场情缘': '职场中发生的爱情故事',
            '魔法世界': '充满魔法和奇幻元素的故事',
            '玄幻修仙': '东方玄幻修仙题材故事',
            '科幻未来': '以未来科技为背景的故事',
            '异世界穿越': '主角穿越到异世界的故事',
            '侦探破案': '侦探破解悬案的故事',
            '心理悬疑': '注重心理描写的悬疑故事',
            '犯罪推理': '犯罪题材的推理故事',
            '惊悚恐怖': '恐怖惊悚类型的故事',
            '古代战争': '古代战争题材的历史故事',
            '宫廷权谋': '以宫廷权谋为主题的故事',
            '民间故事': '民间传说改编的故事',
            '历史人物': '以历史人物为主角的故事'
        };

        return descriptions[template] || '精彩的故事模板';
    }

    getPhaseDescription(phase) {
        const descriptions = {
            '起因设定': '介绍故事背景，建立主要角色和初始情境',
            '发展对抗': '引入冲突，角色面临挑战和障碍',
            '结局解决': '解决冲突，角色获得成长，故事达到高潮并结束'
        };

        return descriptions[phase] || '';
    }

    getPhaseKeyEvents(phase) {
        const events = {
            '起因设定': ['角色登场', '背景设定', '目标确立'],
            '发展对抗': ['遇到困难', '面临选择', '角色成长'],
            '结局解决': ['冲突爆发', '问题解决', '结局收尾']
        };

        return events[phase] || [];
    }

    getWritingSuggestions(chapterNum) {
        const suggestions = [
            '确保章节开头有吸引力',
            '在章节中设置小冲突',
            '注意章节间的衔接',
            '控制章节长度',
            '在章节结尾留下悬念'
        ];

        return suggestions;
    }

    calculateReadability(text) {
        // 简化的可读性计算
        const avgSentenceLength = text.length / text.split('。').length;
        if (avgSentenceLength < 10) return '简单易懂';
        if (avgSentenceLength < 20) return '中等难度';
        return '较难理解';
    }

    analyzeEmotions(text) {
        const emotions = ['快乐', '悲伤', '愤怒', '恐惧', '惊讶', '厌恶'];
        return emotions.filter(emotion => Math.random() > 0.7);
    }

    extractThemes(text) {
        const themes = ['爱情', '友情', '成长', '复仇', '正义', '自由'];
        return themes.filter(theme => Math.random() > 0.8);
    }

    improveText(originalText) {
        // 简化的文本改进
        return originalText
            .replace(/很/g, '非常')
            .replace(/好/g, '优秀')
            .replace(/说/g, '表示');
    }

    getImprovementSuggestions(analysis) {
        return [
            '增加更多感官描写',
            '使用更生动的词汇',
            '注意句式变化',
            '加强情感表达',
            '检查逻辑连贯性'
        ];
    }

    generateCreativePrompts() {
        return [
            '如果时间可以倒流，你会改变什么？',
            '描述一个你从未见过的颜色',
            '写一封给未来自己的信',
            '如果你的影子会说话，它会说什么？'
        ];
    }

    generateStoryIdeas() {
        return [
            '一个能在梦境中改变现实的程序员',
            '失去记忆的侦探破获自己的失踪案',
            '能与动物交流的环保主义者',
            '时间旅行者试图修正历史错误'
        ];
    }

    generateImagePrompts() {
        return [
            '雨夜的霓虹城市街道',
            '古老图书馆的阳光角落',
            '星空下的废弃教堂',
            '魔法森林的发光植物'
        ];
    }

    /**
     * 加载故事模板
     */
    loadStoryTemplates() {
        // 可以从本地存储或服务器加载预设模板
        console.log('📖 故事模板加载完成');
    }

    /**
     * 保存故事进度
     */
    saveStoryProgress() {
        localStorage.setItem('storyState', JSON.stringify(this.storyState));
    }

    /**
     * 加载故事进度
     */
    loadStoryProgress() {
        const saved = localStorage.getItem('storyState');
        if (saved) {
            this.storyState = JSON.parse(saved);
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryCreationAgent;
} else {
    window.StoryCreationAgent = StoryCreationAgent;
}