/**
 * 微信IMA知识库连接器
 * 用于连接和检索微信开发相关的知识库内容
 */

class WeixinIMAKnowledgeBase {
    constructor() {
        this.apiEndpoint = 'https://ima.weixin.qq.com/api'; // 假设的IMA API端点
        this.appId = null;
        this.appSecret = null;
        this.accessToken = null;
        this.isInitialized = false;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    /**
     * 初始化IMA知识库连接
     * @param {Object} config - 配置参数
     * @param {string} config.appId - 微信小程序AppID
     * @param {string} config.appSecret - 微信小程序AppSecret
     * @param {string} config.imaApiKey - IMA知识库API密钥
     */
    async initialize(config = {}) {
        try {
            console.log('🔗 初始化微信IMA知识库连接...');
            
            this.appId = config.appId || localStorage.getItem('wx_app_id');
            this.appSecret = config.appSecret || localStorage.getItem('wx_app_secret');
            
            if (!this.appId || !this.appSecret) {
                throw new Error('缺少微信小程序配置信息');
            }

            // 获取访问令牌
            await this.refreshAccessToken();
            
            this.isInitialized = true;
            console.log('✅ 微信IMA知识库连接成功');
            
            return true;
        } catch (error) {
            console.error('❌ IMA知识库初始化失败:', error);
            return false;
        }
    }

    /**
     * 刷新访问令牌
     */
    async refreshAccessToken() {
        try {
            const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
            
            const response = await fetch(tokenUrl);
            const data = await response.json();
            
            if (data.access_token) {
                this.accessToken = data.access_token;
                localStorage.setItem('wx_access_token', this.accessToken);
                localStorage.setItem('wx_token_expires', Date.now() + (data.expires_in * 1000));
            } else {
                throw new Error(data.errmsg || '获取访问令牌失败');
            }
        } catch (error) {
            console.error('刷新访问令牌失败:', error);
            throw error;
        }
    }

    /**
     * 搜索IMA知识库
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @param {string} options.category - 知识分类 (api, ui, component, best-practice等)
     * @param {number} options.limit - 返回结果数量限制
     * @param {number} options.page - 页码
     */
    async search(query, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const {
            category = 'all',
            limit = 10,
            page = 1
        } = options;

        // 检查缓存
        const cacheKey = `ima_search_${query}_${category}_${limit}_${page}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // 构建IMA API请求
            const searchUrl = `${this.apiEndpoint}/knowledge/search`;
            const requestBody = {
                query: query,
                category: category,
                limit: limit,
                page: page,
                access_token: this.accessToken
            };

            const response = await fetch(searchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.success) {
                const results = this.formatSearchResults(data.results);
                this.setCache(cacheKey, results);
                return results;
            } else {
                throw new Error(data.message || '搜索失败');
            }
            
        } catch (error) {
            console.error('IMA知识库搜索失败:', error);
            
            // 降级到本地知识库
            return this.searchLocalKnowledge(query, options);
        }
    }

    /**
     * 获取特定知识条目
     * @param {string} knowledgeId - 知识条目ID
     */
    async getKnowledge(knowledgeId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // 检查缓存
        const cacheKey = `ima_knowledge_${knowledgeId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const url = `${this.apiEndpoint}/knowledge/${knowledgeId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.setCache(cacheKey, data.data);
                return data.data;
            } else {
                throw new Error(data.message || '获取知识失败');
            }
            
        } catch (error) {
            console.error('获取知识条目失败:', error);
            return null;
        }
    }

    /**
     * 获取知识分类列表
     */
    async getCategories() {
        try {
            const url = `${this.apiEndpoint}/categories`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            const data = await response.json();
            return data.success ? data.categories : [];
        } catch (error) {
            console.error('获取分类失败:', error);
            return this.getDefaultCategories();
        }
    }

    /**
     * 格式化搜索结果
     * @param {Array} results - 原始搜索结果
     */
    formatSearchResults(results) {
        return results.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content || item.description,
            category: item.category,
            tags: item.tags || [],
            relevance: item.relevance_score || 0,
            lastUpdated: item.updated_at,
            url: item.url || `#${item.id}`,
            type: item.type || 'article'
        }));
    }

    /**
     * 本地知识库搜索（降级方案）
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     */
    searchLocalKnowledge(query, options = {}) {
        const localKnowledge = this.getLocalKnowledgeBase();
        const lowerQuery = query.toLowerCase();
        
        let results = [];
        
        Object.values(localKnowledge).forEach(category => {
            category.forEach(item => {
                const relevance = this.calculateRelevance(lowerQuery, item);
                if (relevance > 0) {
                    results.push({
                        ...item,
                        relevance: relevance
                    });
                }
            });
        });
        
        // 按相关性排序
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results.slice(0, options.limit || 10);
    }

    /**
     * 获取本地知识库
     */
    getLocalKnowledgeBase() {
        return {
            api: [
                {
                    id: 'wx_api_login',
                    title: '微信登录API',
                    content: 'wx.login() - 获取临时登录凭证code',
                    category: 'api',
                    tags: ['登录', 'api', '认证'],
                    type: 'api'
                },
                {
                    id: 'wx_api_request',
                    title: '网络请求API',
                    content: 'wx.request() - 发起HTTPS网络请求',
                    category: 'api',
                    tags: ['网络', '请求', 'http'],
                    type: 'api'
                }
            ],
            component: [
                {
                    id: 'wx_view',
                    title: 'view组件',
                    content: '基础视图容器，类似于HTML的div',
                    category: 'component',
                    tags: ['组件', '视图', '布局'],
                    type: 'component'
                },
                {
                    id: 'wx_text',
                    title: 'text组件',
                    content: '文本组件，支持长按选中',
                    category: 'component',
                    tags: ['组件', '文本', '显示'],
                    type: 'component'
                }
            ],
            best_practice: [
                {
                    id: 'wx_performance',
                    title: '性能优化最佳实践',
                    content: '减少setData调用频率，避免频繁操作DOM',
                    category: 'best_practice',
                    tags: ['性能', '优化', '最佳实践'],
                    type: 'guide'
                }
            ]
        };
    }

    /**
     * 计算搜索相关性
     * @param {string} query - 搜索查询
     * @param {Object} item - 知识条目
     */
    calculateRelevance(query, item) {
        const title = (item.title || '').toLowerCase();
        const content = (item.content || '').toLowerCase();
        const tags = (item.tags || []).map(tag => tag.toLowerCase()).join(' ');
        
        let score = 0;
        
        // 标题匹配权重最高
        if (title.includes(query)) score += 10;
        
        // 标签匹配权重中等
        if (tags.includes(query)) score += 5;
        
        // 内容匹配权重较低
        if (content.includes(query)) score += 2;
        
        // 部分匹配
        const queryWords = query.split(' ');
        queryWords.forEach(word => {
            if (word.length > 1) {
                if (title.includes(word)) score += 3;
                if (tags.includes(word)) score += 2;
                if (content.includes(word)) score += 1;
            }
        });
        
        return score;
    }

    /**
     * 获取默认分类
     */
    getDefaultCategories() {
        return [
            { id: 'api', name: 'API文档', description: '微信小程序API接口文档' },
            { id: 'component', name: '组件文档', description: '内置组件使用说明' },
            { id: 'tutorial', name: '教程指南', description: '开发教程和最佳实践' },
            { id: 'best_practice', name: '最佳实践', description: '开发经验和建议' },
            { id: 'troubleshooting', name: '问题排查', description: '常见问题和解决方案' }
        ];
    }

    /**
     * 缓存管理 - 获取缓存
     * @param {string} key - 缓存键
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * 缓存管理 - 设置缓存
     * @param {string} key - 缓存键
     * @param {any} data - 缓存数据
     */
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // 限制缓存大小
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 IMA知识库缓存已清理');
    }

    /**
     * 获取连接状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasAccessToken: !!this.accessToken,
            cacheSize: this.cache.size,
            lastActivity: new Date().toISOString()
        };
    }

    /**
     * 断开连接
     */
    disconnect() {
        this.accessToken = null;
        this.isInitialized = false;
        this.clearCache();
        localStorage.removeItem('wx_access_token');
        localStorage.removeItem('wx_token_expires');
        console.log('🔌 已断开IMA知识库连接');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeixinIMAKnowledgeBase;
} else {
    window.WeixinIMAKnowledgeBase = WeixinIMAKnowledgeBase;
}