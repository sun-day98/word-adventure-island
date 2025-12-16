#!/usr/bin/env node

/**
 * Brave Search MCP Server Demo
 * 演示如何使用Brave搜索MCP服务器
 */

const BraveSearchMCPServer = require('./brave-search-mcp-server');

class BraveSearchDemo {
    constructor(apiKey = null) {
        this.server = new BraveSearchMCPServer(apiKey);
        this.testQueries = [
            '人工智能最新发展',
            'ChatGPT应用案例',
            '新能源汽车市场',
            '机器学习算法'
        ];
    }

    async runDemo() {
        console.log('🔍 Brave Search MCP Server Demo\n');

        // 检查API密钥
        if (!this.server.apiKey) {
            console.log('⚠️  警告: 未设置BRAVE_API_KEY环境变量');
            console.log('📝 将使用模拟模式运行演示\n');
        } else {
            console.log('✅ API密钥已配置，使用真实搜索\n');
        }

        try {
            // 演示各种搜索功能
            await this.demoWebSearch();
            await this.demoNewsSearch();
            await this.demoImagesSearch();
            await this.demoVideosSearch();
            await this.demoSearchSuggestions();
            await this.demoTrendingSearches();
            
            console.log('\n🎉 Demo completed successfully!');
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        }
    }

    async demoWebSearch() {
        console.log('🌐 Demo: Web Search\n');

        const query = this.testQueries[0];
        console.log(`🔍 搜索查询: "${query}"`);

        try {
            const result = await this.server.handleBraveSearch({
                query: query,
                count: 5,
                lang: 'zh-CN',
                country: 'CN',
                safesearch: 'moderate'
            });

            const response = JSON.parse(result.content[0].text);
            this.displayResults('网页搜索', response);
        } catch (error) {
            console.log(`❌ 网页搜索失败: ${error.message}`);
        }
    }

    async demoNewsSearch() {
        console.log('\n📰 Demo: News Search\n');

        const query = 'AI技术突破';
        console.log(`🔍 新闻搜索: "${query}"`);

        try {
            const result = await this.server.handleBraveNewsSearch({
                query: query,
                count: 5,
                lang: 'zh-CN',
                country: 'CN',
                freshness: 'pw' // 过去一周
            });

            const response = JSON.parse(result.content[0].text);
            this.displayResults('新闻搜索', response);
        } catch (error) {
            console.log(`❌ 新闻搜索失败: ${error.message}`);
        }
    }

    async demoImagesSearch() {
        console.log('\n🖼️  Demo: Images Search\n');

        const query = '可爱动物';
        console.log(`🔍 图片搜索: "${query}"`);

        try {
            const result = await this.server.handleBraveImagesSearch({
                query: query,
                count: 5,
                lang: 'zh-CN',
                country: 'CN',
                safesearch: 'strict'
            });

            const response = JSON.parse(result.content[0].text);
            this.displayResults('图片搜索', response);
        } catch (error) {
            console.log(`❌ 图片搜索失败: ${error.message}`);
        }
    }

    async demoVideosSearch() {
        console.log('\n🎥 Demo: Videos Search\n');

        const query = 'AI教程';
        console.log(`🔍 视频搜索: "${query}"`);

        try {
            const result = await this.server.handleBraveVideosSearch({
                query: query,
                count: 5,
                lang: 'zh-CN',
                country: 'CN',
                safesearch: 'moderate'
            });

            const response = JSON.parse(result.content[0].text);
            this.displayResults('视频搜索', response);
        } catch (error) {
            console.log(`❌ 视频搜索失败: ${error.message}`);
        }
    }

    async demoSearchSuggestions() {
        console.log('\n💡 Demo: Search Suggestions\n');

        const query = '人工智能';
        console.log(`🔍 获取搜索建议: "${query}"`);

        try {
            const result = await this.server.getSearchSuggestions({
                query: query,
                lang: 'zh-CN',
                country: 'CN'
            });

            const response = JSON.parse(result.content[0].text);
            this.displaySuggestions(response);
        } catch (error) {
            console.log(`❌ 搜索建议失败: ${error.message}`);
        }
    }

    async demoTrendingSearches() {
        console.log('\n🔥 Demo: Trending Searches\n');

        try {
            const result = await this.server.getTrendingSearches({
                country: 'CN',
                lang: 'zh-CN',
                count: 10
            });

            const response = JSON.parse(result.content[0].text);
            this.displayTrending(response);
        } catch (error) {
            console.log(`❌ 热门搜索失败: ${error.message}`);
        }
    }

    displayResults(searchType, response) {
        console.log(`\n📊 ${searchType}结果:`);
        
        if (response.success) {
            console.log(`✅ 搜索成功`);
            console.log(`📈 找到 ${response.total_results} 个结果`);
            console.log(`⏰ 搜索时间: ${response.search_time}`);
            
            if (response.results && response.results.length > 0) {
                console.log('\n📋 结果详情:');
                response.results.forEach((item, index) => {
                    console.log(`\n${index + 1}. ${item.title}`);
                    console.log(`   🔗 ${item.url}`);
                    console.log(`   📝 ${item.snippet}`);
                    
                    if (item.source) {
                        console.log(`   📰 来源: ${item.source}`);
                    }
                    
                    if (item.published_date) {
                        console.log(`   📅 发布时间: ${item.published_date}`);
                    }
                    
                    if (item.type && item.type !== 'web') {
                        console.log(`   🏷️  类型: ${item.type}`);
                    }
                });
            } else {
                console.log('⚠️  未找到结果');
            }
        } else {
            console.log(`❌ 搜索失败: ${response.error}`);
            if (response.suggestion) {
                console.log(`💡 建议: ${response.suggestion}`);
            }
        }
    }

    displaySuggestions(response) {
        console.log('\n💡 搜索建议结果:');
        
        if (response.success) {
            console.log(`✅ 建议获取成功`);
            console.log(`🔍 基于查询: "${response.query}"`);
            console.log(`⏰ 生成时间: ${response.generated_at}`);
            
            if (response.suggestions && response.suggestions.length > 0) {
                console.log('\n📋 建议列表:');
                response.suggestions.forEach((suggestion, index) => {
                    console.log(`${index + 1}. ${suggestion}`);
                });
            } else {
                console.log('⚠️  未找到建议');
            }
        } else {
            console.log(`❌ 建议获取失败: ${response.error}`);
        }
    }

    displayTrending(response) {
        console.log('\n🔥 热门搜索结果:');
        
        if (response.success) {
            console.log(`✅ 热门搜索获取成功`);
            console.log(`🌍 地区: ${response.country}`);
            console.log(`🌐 语言: ${response.lang}`);
            console.log(`⏰ 生成时间: ${response.generated_at}`);
            
            if (response.trending_searches && response.trending_searches.length > 0) {
                console.log('\n🔥 热门搜索列表:');
                response.trending_searches.forEach((trend, index) => {
                    console.log(`${index + 1}. ${trend}`);
                });
            } else {
                console.log('⚠️  未找到热门搜索');
            }
        } else {
            console.log(`❌ 热门搜索获取失败: ${response.error}`);
        }
    }

    // 模拟真实搜索结果（当没有API密钥时使用）
    static getMockResults(query, type = 'web') {
        const mockData = {
            web: {
                results: [
                    {
                        title: `${query} - 维基百科`,
                        url: 'https://zh.wikipedia.org/wiki/' + encodeURIComponent(query),
                        snippet: `关于${query}的详细信息，包括定义、历史、应用等。`,
                        type: 'web',
                        source: 'Wikipedia'
                    },
                    {
                        title: `${query}的最新研究报告`,
                        url: 'https://example.com/research',
                        snippet: `最新的${query}研究成果和技术进展。`,
                        type: 'web',
                        source: 'Research Hub'
                    }
                ]
            },
            news: {
                results: [
                    {
                        title: `${query}重大突破新闻`,
                        url: 'https://news.example.com/breakthrough',
                        snippet: `${query}领域取得重大技术突破，将产生深远影响。`,
                        type: 'news',
                        source: 'Tech News',
                        published_date: '2小时前'
                    }
                ]
            },
            images: {
                results: [
                    {
                        title: `${query}相关图片`,
                        url: 'https://images.example.com/image1.jpg',
                        thumbnail_url: 'https://images.example.com/thumb1.jpg',
                        snippet: `高质量${query}图片`,
                        type: 'image'
                    }
                ]
            },
            videos: {
                results: [
                    {
                        title: `${query}教程视频`,
                        url: 'https://videos.example.com/tutorial',
                        thumbnail_url: 'https://videos.example.com/thumb.jpg',
                        snippet: `详细的${query}教程和演示`,
                        type: 'video',
                        duration: '10:30'
                    }
                ]
            }
        };

        return mockData[type] || mockData.web;
    }
}

// 运行演示
if (require.main === module) {
    const apiKey = process.env.BRAVE_API_KEY;
    const demo = new BraveSearchDemo(apiKey);
    demo.runDemo();
}

module.exports = BraveSearchDemo;