const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
const OUTLINES_DIR = path.join(DATA_DIR, 'outlines');
const CHARACTERS_DIR = path.join(DATA_DIR, 'characters');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');

// 初始化数据目录
async function initDirectories() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(OUTLINES_DIR, { recursive: true });
        await fs.mkdir(CHARACTERS_DIR, { recursive: true });
        await fs.mkdir(TEMPLATES_DIR, { recursive: true });
        console.log('📁 数据目录初始化完成');
    } catch (error) {
        console.error('❌ 目录初始化失败:', error);
    }
}

// 情节大纲相关API
app.get('/api/outlines', async (req, res) => {
    try {
        const files = await fs.readdir(OUTLINES_DIR);
        const outlines = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(OUTLINES_DIR, file), 'utf8');
                outlines.push(JSON.parse(content));
            }
        }
        
        res.json({ success: true, data: outlines });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/outlines/:id', async (req, res) => {
    try {
        const filePath = path.join(OUTLINES_DIR, `${req.params.id}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        const outline = JSON.parse(content);
        res.json({ success: true, data: outline });
    } catch (error) {
        res.status(404).json({ success: false, error: '大纲未找到' });
    }
});

app.post('/api/outlines', async (req, res) => {
    try {
        const outline = {
            id: uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const filePath = path.join(OUTLINES_DIR, `${outline.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(outline, null, 2));
        
        res.json({ success: true, data: outline });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/outlines/:id', async (req, res) => {
    try {
        const filePath = path.join(OUTLINES_DIR, `${req.params.id}.json`);
        const existing = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        const updated = {
            ...existing,
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/outlines/:id', async (req, res) => {
    try {
        const filePath = path.join(OUTLINES_DIR, `${req.params.id}.json`);
        await fs.unlink(filePath);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 角色管理API
app.get('/api/characters', async (req, res) => {
    try {
        const files = await fs.readdir(CHARACTERS_DIR);
        const characters = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(CHARACTERS_DIR, file), 'utf8');
                characters.push(JSON.parse(content));
            }
        }
        
        res.json({ success: true, data: characters });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/characters', async (req, res) => {
    try {
        const character = {
            id: uuidv4(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        const filePath = path.join(CHARACTERS_DIR, `${character.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(character, null, 2));
        
        res.json({ success: true, data: character });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 模板库API
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await loadTemplates();
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// AI辅助API
app.post('/api/ai/suggest', async (req, res) => {
    try {
        const { type, content, context } = req.body;
        const suggestion = await generateAISuggestion(type, content, context);
        res.json({ success: true, data: suggestion });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/ai/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        const analysis = await analyzeText(text);
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 搜索API
app.get('/api/search', async (req, res) => {
    try {
        const { q, type } = req.query;
        const results = await searchData(q, type);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 辅助函数
async function loadTemplates() {
    const templatesPath = path.join(__dirname, 'templates.json');
    try {
        const content = await fs.readFile(templatesPath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        // 如果模板文件不存在，返回默认模板
        return getDefaultTemplates();
    }
}

function getDefaultTemplates() {
    return {
        plotStructures: [
            {
                id: 'three_act',
                name: '三幕式结构',
                description: '经典的故事结构：开始-发展-结局',
                phases: ['建立', '对抗', '解决']
            },
            {
                id: 'hero_journey',
                name: '英雄之旅',
                description: '主角历险成长的经典模式',
                phases: ['平凡世界', '历险召唤', '导师帮助', '跨越边界', '考验', '终极宝物', '回归之路']
            }
        ],
        characterArchetypes: [
            {
                id: 'hero',
                name: '英雄',
                traits: ['勇敢', '正义', '坚持', '成长'],
                description: '推动故事发展的主要角色'
            },
            {
                id: 'mentor',
                name: '导师',
                traits: ['智慧', '经验', '神秘', '指导'],
                description: '为主角提供帮助和指导的角色'
            },
            {
                id: 'antagonist',
                name: '反派',
                traits: ['阻碍', '冲突', '力量', '动机'],
                description: '制造障碍和冲突的角色'
            }
        ],
        plotDevices: [
            {
                id: 'mystery',
                name: '悬疑设置',
                description: '通过谜题和未知吸引读者',
                examples: ['神秘物品', '身份疑问', '隐藏真相']
            },
            {
                id: 'conflict',
                name: '冲突设计',
                description: '制造紧张感和戏剧性',
                examples: ['价值观冲突', '资源争夺', '信任危机']
            }
        ]
    };
}

async function generateAISuggestion(type, content, context) {
    // 模拟AI建议生成
    const suggestions = {
        plot_twist: [
            '主角发现盟友其实是敌人',
            '看似无关的事件暗藏联系',
            '主角的身份并非表面那样',
            '一直相信的真相是谎言'
        ],
        character_development: [
            '角色需要面对内心恐惧',
            '通过挫折获得成长',
            '价值观受到挑战',
            '学会新的技能或品质'
        ],
        dialogue_improvement: [
            '增加更多潜台词和暗示',
            '让每个角色说话方式独特',
            '加入情感波动和节奏变化',
            '通过对话展现角色关系'
        ],
        pacing_suggestion: [
            '在高潮前增加紧张感',
            '安排平静时刻缓解紧张',
            '使用短句加速节奏',
            '通过环境描写调节节奏'
        ]
    };

    const suggestionList = suggestions[type] || [];
    const random = suggestionList[Math.floor(Math.random() * suggestionList.length)];
    
    return {
        type,
        suggestion: random || '继续发展当前情节',
        confidence: 0.8,
        alternatives: suggestionList.slice(0, 3)
    };
}

async function analyzeText(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[。！？.!?]/).length;
    const paragraphs = text.split(/\n\n+/).length;
    
    // 简单的情感分析
    const emotions = {
        positive: ['快乐', '希望', '爱', '成功', '胜利', '幸福'],
        negative: ['悲伤', '恐惧', '愤怒', '失败', '绝望', '痛苦'],
        tension: ['紧张', '悬疑', '冲突', '危险', '危机', '压力']
    };
    
    let emotionCounts = { positive: 0, negative: 0, tension: 0 };
    
    Object.entries(emotions).forEach(([emotion, words]) => {
        words.forEach(word => {
            if (text.includes(word)) {
                emotionCounts[emotion]++;
            }
        });
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0][0];
    
    return {
        statistics: {
            words,
            sentences,
            paragraphs,
            avgWordsPerSentence: Math.round(words / sentences),
            readability: words / sentences > 20 ? 'complex' : words / sentences > 10 ? 'moderate' : 'simple'
        },
        emotions: {
            counts: emotionCounts,
            dominant: dominantEmotion
        },
        suggestions: generateWritingSuggestions(text, words, sentences)
    };
}

function generateWritingSuggestions(text, words, sentences) {
    const suggestions = [];
    
    if (words < 100) {
        suggestions.push('内容较少，建议增加更多细节描写');
    }
    
    if (sentences < 5) {
        suggestions.push('句子数量偏少，建议分段写作');
    }
    
    if (words / sentences > 25) {
        suggestions.push('句子较长，建议增加短句调节节奏');
    }
    
    const punctuationRatio = (text.match(/[，。！？]/g) || []).length / words;
    if (punctuationRatio < 0.05) {
        suggestions.push('标点使用较少，注意句子停顿');
    }
    
    return suggestions;
}

async function searchData(query, type) {
    const results = [];
    
    if (!type || type === 'outlines') {
        // 搜索大纲
        const outlineFiles = await fs.readdir(OUTLINES_DIR);
        for (const file of outlineFiles) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(OUTLINES_DIR, file), 'utf8');
                const outline = JSON.parse(content);
                
                if (outline.mainContent && outline.mainContent.includes(query)) {
                    results.push({
                        type: 'outline',
                        id: outline.id,
                        title: outline.mainContent,
                        content: outline
                    });
                }
            }
        }
    }
    
    if (!type || type === 'characters') {
        // 搜索角色
        const characterFiles = await fs.readdir(CHARACTERS_DIR);
        for (const file of characterFiles) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(CHARACTERS_DIR, file), 'utf8');
                const character = JSON.parse(content);
                
                if (character.name && character.name.includes(query)) {
                    results.push({
                        type: 'character',
                        id: character.id,
                        title: character.name,
                        content: character
                    });
                }
            }
        }
    }
    
    return results;
}

// 启动服务器
async function startServer() {
    await initDirectories();
    
    app.listen(PORT, () => {
        console.log(`🚀 小说创作系统后端服务已启动`);
        console.log(`📡 服务地址: http://localhost:${PORT}`);
        console.log(`📚 API文档: http://localhost:${PORT}/api`);
        console.log(`🎯 主要功能:`);
        console.log(`   - 情节大纲管理`);
        console.log(`   - 角色数据库`);
        console.log(`   - AI智能建议`);
        console.log(`   - 全文搜索`);
    });
}

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('❌ 服务器错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.path
    });
});

// 启动服务器
startServer().catch(console.error);

module.exports = app;