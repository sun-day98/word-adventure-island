#!/usr/bin/env node

/**
 * Brave Search MCP Server
 * 为AI助手提供Brave搜索引擎的MCP服务器
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class BraveSearchMCPServer {
    constructor(apiKey = null) {
        this.server = new Server(
            {
                name: 'brave-search-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.apiKey = apiKey || process.env.BRAVE_API_KEY;
        this.baseUrl = 'https://api.search.brave.com/res/v1/web/search';
        this.userAgent = 'Brave-Search-MCP-Server/1.0.0';
        
        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    setupToolHandlers() {
        // 列出可用工具
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'brave_search',
                    description: '使用Brave搜索引擎进行网络搜索',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '搜索查询关键词',
                            },
                            count: {
                                type: 'number',
                                description: '返回结果数量 (1-20)',
                                minimum: 1,
                                maximum: 20,
                                default: 10
                            },
                            offset: {
                                type: 'number',
                                description: '结果偏移量（用于分页）',
                                minimum: 0,
                                default: 0
                            },
                            lang: {
                                type: 'string',
                                description: '搜索语言代码 (如: zh, en, zh-CN)',
                                default: 'zh-CN'
                            },
                            country: {
                                type: 'string',
                                description: '国家代码 (如: CN, US)',
                                default: 'CN'
                            },
                            search_lang: {
                                type: 'string',
                                description: '搜索结果语言',
                                default: 'zh-CN'
                            },
                            text_decorations: {
                                type: 'boolean',
                                description: '是否包含文本装饰',
                                default: false
                            },
                            spellcheck: {
                                type: 'boolean',
                                description: '是否启用拼写检查',
                                default: true
                            },
                            result_filter: {
                                type: 'string',
                                description: '结果过滤器 (web, news, images, videos)',
                                enum: ['web', 'news', 'images', 'videos'],
                                default: 'web'
                            },
                            safesearch: {
                                type: 'string',
                                description: '安全搜索级别',
                                enum: ['strict', 'moderate', 'off'],
                                default: 'moderate'
                            },
                            freshness: {
                                type: 'string',
                                description: '时间过滤 (pd, pw, pm, py)',
                                enum: ['pd', 'pw', 'pm', 'py'],
                                default: null
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'brave_news_search',
                    description: '搜索Brave新闻',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '新闻搜索关键词',
                            },
                            count: {
                                type: 'number',
                                description: '返回结果数量 (1-20)',
                                minimum: 1,
                                maximum: 20,
                                default: 10
                            },
                            offset: {
                                type: 'number',
                                description: '结果偏移量',
                                minimum: 0,
                                default: 0
                            },
                            lang: {
                                type: 'string',
                                description: '搜索语言代码',
                                default: 'zh-CN'
                            },
                            country: {
                                type: 'string',
                                description: '国家代码',
                                default: 'CN'
                            },
                            freshness: {
                                type: 'string',
                                description: '时间过滤 (pd, pw, pm, py)',
                                enum: ['pd', 'pw', 'pm', 'py'],
                                default: 'pw'
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'brave_images_search',
                    description: '搜索Brave图片',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '图片搜索关键词',
                            },
                            count: {
                                type: 'number',
                                description: '返回结果数量 (1-50)',
                                minimum: 1,
                                maximum: 50,
                                default: 20
                            },
                            offset: {
                                type: 'number',
                                description: '结果偏移量',
                                minimum: 0,
                                default: 0
                            },
                            lang: {
                                type: 'string',
                                description: '搜索语言代码',
                                default: 'zh-CN'
                            },
                            country: {
                                type: 'string',
                                description: '国家代码',
                                default: 'CN'
                            },
                            safesearch: {
                                type: 'string',
                                description: '安全搜索级别',
                                enum: ['strict', 'moderate', 'off'],
                                default: 'moderate'
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'brave_videos_search',
                    description: '搜索Brave视频',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '视频搜索关键词',
                            },
                            count: {
                                type: 'number',
                                description: '返回结果数量 (1-20)',
                                minimum: 1,
                                maximum: 20,
                                default: 10
                            },
                            offset: {
                                type: 'number',
                                description: '结果偏移量',
                                minimum: 0,
                                default: 0
                            },
                            lang: {
                                type: 'string',
                                description: '搜索语言代码',
                                default: 'zh-CN'
                            },
                            country: {
                                type: 'string',
                                description: '国家代码',
                                default: 'CN'
                            },
                            safesearch: {
                                type: 'string',
                                description: '安全搜索级别',
                                enum: ['strict', 'moderate', 'off'],
                                default: 'moderate'
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_search_suggestions',
                    description: '获取搜索建议',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '获取建议的查询词',
                            },
                            lang: {
                                type: 'string',
                                description: '语言代码',
                                default: 'zh-CN'
                            },
                            country: {
                                type: 'string',
                                description: '国家代码',
                                default: 'CN'
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_trending_searches',
                    description: '获取当前热门搜索',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            country: {
                                type: 'string',
                                description: '国家代码',
                                default: 'CN'
                            },
                            lang: {
                                type: 'string',
                                description: '语言代码',
                                default: 'zh-CN'
                            },
                            count: {
                                type: 'number',
                                description: '返回结果数量',
                                minimum: 1,
                                maximum: 20,
                                default: 10
                            }
                        },
                    },
                }
            ],
        }));

        // 处理工具调用
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'brave_search':
                        return await this.handleBraveSearch(args);
                    case 'brave_news_search':
                        return await this.handleBraveNewsSearch(args);
                    case 'brave_images_search':
                        return await this.handleBraveImagesSearch(args);
                    case 'brave_videos_search':
                        return await this.handleBraveVideosSearch(args);
                    case 'get_search_suggestions':
                        return await this.getSearchSuggestions(args);
                    case 'get_trending_searches':
                        return await this.getTrendingSearches(args);
                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${name}`
                        );
                }
            } catch (error) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error.message}`
                );
            }
        });
    }

    async handleBraveSearch(args) {
        const {
            query,
            count = 10,
            offset = 0,
            lang = 'zh-CN',
            country = 'CN',
            search_lang = 'zh-CN',
            text_decorations = false,
            spellcheck = true,
            result_filter = 'web',
            safesearch = 'moderate',
            freshness
        } = args;

        try {
            const searchParams = new URLSearchParams({
                q: query,
                count: Math.min(count, 20).toString(),
                offset: offset.toString(),
                lang: lang,
                country: country,
                search_lang: search_lang,
                text_decorations: text_decorations.toString(),
                spellcheck: spellcheck.toString(),
                safesearch: safesearch,
                result_filter: result_filter
            });

            if (freshness) {
                searchParams.append('freshness', freshness);
            }

            const result = await this.makeRequest(`${this.baseUrl}?${searchParams}`);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: query,
                            type: 'web_search',
                            total_results: result.web?.results?.length || 0,
                            results: this.formatWebResults(result.web?.results || []),
                            mixed_results: this.formatMixedResults(result.mixed?.results || []),
                            search_time: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return this.handleError(error, 'web search');
        }
    }

    async handleBraveNewsSearch(args) {
        const {
            query,
            count = 10,
            offset = 0,
            lang = 'zh-CN',
            country = 'CN',
            freshness = 'pw'
        } = args;

        try {
            const searchParams = new URLSearchParams({
                q: query,
                count: Math.min(count, 20).toString(),
                offset: offset.toString(),
                lang: lang,
                country: country,
                freshness: freshness,
                result_filter: 'news'
            });

            const result = await this.makeRequest(`${this.baseUrl}?${searchParams}`);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: query,
                            type: 'news_search',
                            total_results: result.news?.results?.length || 0,
                            results: this.formatNewsResults(result.news?.results || []),
                            search_time: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return this.handleError(error, 'news search');
        }
    }

    async handleBraveImagesSearch(args) {
        const {
            query,
            count = 20,
            offset = 0,
            lang = 'zh-CN',
            country = 'CN',
            safesearch = 'moderate'
        } = args;

        try {
            const searchParams = new URLSearchParams({
                q: query,
                count: Math.min(count, 50).toString(),
                offset: offset.toString(),
                lang: lang,
                country: country,
                safesearch: safesearch,
                result_filter: 'images'
            });

            const result = await this.makeRequest(`${this.baseUrl}?${searchParams}`);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: query,
                            type: 'images_search',
                            total_results: result.images?.results?.length || 0,
                            results: this.formatImagesResults(result.images?.results || []),
                            search_time: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return this.handleError(error, 'images search');
        }
    }

    async handleBraveVideosSearch(args) {
        const {
            query,
            count = 10,
            offset = 0,
            lang = 'zh-CN',
            country = 'CN',
            safesearch = 'moderate'
        } = args;

        try {
            const searchParams = new URLSearchParams({
                q: query,
                count: Math.min(count, 20).toString(),
                offset: offset.toString(),
                lang: lang,
                country: country,
                safesearch: safesearch,
                result_filter: 'videos'
            });

            const result = await this.makeRequest(`${this.baseUrl}?${searchParams}`);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: query,
                            type: 'videos_search',
                            total_results: result.videos?.results?.length || 0,
                            results: this.formatVideosResults(result.videos?.results || []),
                            search_time: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return this.handleError(error, 'videos search');
        }
    }

    async getSearchSuggestions(args) {
        const { query, lang = 'zh-CN', country = 'CN' } = args;

        try {
            // 模拟搜索建议（实际需要调用Brave建议API）
            const suggestions = await this.getMockSuggestions(query, lang, country);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: query,
                            suggestions: suggestions,
                            generated_at: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return this.handleError(error, 'search suggestions');
        }
    }

    async getTrendingSearches(args) {
        const { country = 'CN', lang = 'zh-CN', count = 10 } = args;

        try {
            // 模拟热门搜索（实际需要调用Brave趋势API）
            const trending = await this.getMockTrending(country, lang, count);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            country: country,
                            lang: lang,
                            trending_searches: trending,
                            generated_at: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return this.handleError(error, 'trending searches');
        }
    }

    // HTTP请求方法
    async makeRequest(url) {
        if (!this.apiKey) {
            throw new Error('Brave Search API key not configured. Please set BRAVE_API_KEY environment variable.');
        }

        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': this.userAgent,
                    'X-Subscription-Token': this.apiKey
                }
            };

            const req = httpModule.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode === 200) {
                            resolve(JSON.parse(data));
                        } else if (res.statusCode === 401) {
                            reject(new Error('Invalid API key'));
                        } else if (res.statusCode === 429) {
                            reject(new Error('Rate limit exceeded'));
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.setTimeout(10000, () => {
                req.abort();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    // 结果格式化方法
    formatWebResults(results) {
        return results.map(result => ({
            title: result.title || '',
            url: result.url || '',
            snippet: result.description || '',
            published_date: result.age || null,
            language: result.language || null,
            relevance_score: result.score || null,
            family_friendly: result.family_friendly || true,
            type: result.type || 'web',
            subtype: result.subtype || null
        }));
    }

    formatNewsResults(results) {
        return results.map(result => ({
            title: result.title || '',
            url: result.url || '',
            snippet: result.description || '',
            published_date: result.age || null,
            source: result.name || '',
            language: result.language || null,
            relevance_score: result.score || null,
            family_friendly: result.family_friendly || true,
            type: 'news'
        }));
    }

    formatImagesResults(results) {
        return results.map(result => ({
            title: result.title || '',
            url: result.url || '',
            thumbnail_url: result.thumbnail?.src || '',
            image_url: result.properties?.url || '',
            width: result.properties?.width || null,
            height: result.properties?.height || null,
            size: result.properties?.size || null,
            source: result.source?.name || '',
            relevance_score: result.score || null,
            family_friendly: result.family_friendly || true,
            type: 'image'
        }));
    }

    formatVideosResults(results) {
        return results.map(result => ({
            title: result.title || '',
            url: result.url || '',
            thumbnail_url: result.thumbnail?.src || '',
            duration: result.properties?.duration || null,
            source: result.source?.name || '',
            published_date: result.age || null,
            language: result.language || null,
            relevance_score: result.score || null,
            family_friendly: result.family_friendly || true,
            type: 'video'
        }));
    }

    formatMixedResults(results) {
        return results.map(result => ({
            title: result.title || '',
            url: result.url || '',
            snippet: result.description || '',
            type: result.type || 'mixed',
            published_date: result.age || null,
            source: result.name || '',
            relevance_score: result.score || null
        }));
    }

    // 模拟方法（实际使用中应该调用真实API）
    async getMockSuggestions(query, lang, country) {
        // 基于查询生成模拟建议
        const suggestions = [
            `${query} 教程`,
            `${query} 下载`,
            `${query} 官网`,
            `${query} 价格`,
            `${query} 评价`
        ];
        
        return suggestions.slice(0, 5);
    }

    async getMockTrending(country, lang, count) {
        // 基于地区生成模拟热门搜索
        const trends = {
            'CN': ['人工智能', 'ChatGPT', '新能源汽车', '房价', '股市行情'],
            'US': ['AI', 'ChatGPT', 'stock market', 'weather', 'news'],
            'default': ['technology', 'news', 'weather', 'sports', 'entertainment']
        };

        const localTrends = trends[country] || trends['default'];
        return localTrends.slice(0, count);
    }

    handleError(error, operation) {
        console.error(`Brave Search ${operation} error:`, error.message);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: error.message,
                        operation: operation,
                        timestamp: new Date().toISOString(),
                        suggestion: this.getErrorSuggestion(error)
                    }, null, 2)
                }
            ]
        };
    }

    getErrorSuggestion(error) {
        if (error.message.includes('API key')) {
            return '请设置有效的Brave Search API密钥';
        } else if (error.message.includes('Rate limit')) {
            return 'API调用频率过高，请稍后重试';
        } else if (error.message.includes('timeout')) {
            return '网络请求超时，请检查网络连接';
        } else {
            return '搜索失败，请检查查询参数和网络连接';
        }
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Brave Search MCP Server running on stdio');
        
        if (!this.apiKey) {
            console.warn('Warning: BRAVE_API_KEY environment variable not set');
        }
    }
}

// 启动服务器
if (require.main === module) {
    const apiKey = process.env.BRAVE_API_KEY;
    const server = new BraveSearchMCPServer(apiKey);
    server.run().catch(console.error);
}

module.exports = BraveSearchMCPServer;