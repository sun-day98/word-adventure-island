#!/usr/bin/env node

/**
 * Knowledge Graph Memory Server Demo
 * 演示如何使用知识图谱记忆服务器
 */

const KnowledgeGraphMemoryServer = require('./knowledge-graph-memory-server');

class KnowledgeGraphDemo {
    constructor(dataPath = null) {
        this.server = new KnowledgeGraphMemoryServer(dataPath);
        this.demoData = {
            entities: [
                {
                    name: '人工智能',
                    type: 'concept',
                    description: '模拟人类智能的计算机技术领域',
                    category: '技术',
                    tags: ['计算机科学', '技术', 'AI'],
                    properties: {
                        founded_year: 1956,
                        founder: '约翰·麦卡锡',
                        applications: ['自然语言处理', '计算机视觉', '机器人学']
                    }
                },
                {
                    name: '机器学习',
                    type: 'concept',
                    description: '让计算机系统自动学习和改进的AI子领域',
                    category: '技术',
                    tags: ['人工智能', '算法', '数据科学'],
                    properties: {
                        parent_field: '人工智能',
                        key_algorithms: ['神经网络', '决策树', '支持向量机']
                    }
                },
                {
                    name: '深度学习',
                    type: 'concept',
                    description: '基于多层神经网络的机器学习方法',
                    category: '技术',
                    tags: ['机器学习', '神经网络', 'AI'],
                    properties: {
                        parent_field: '机器学习',
                        popular_frameworks: ['TensorFlow', 'PyTorch', 'Keras']
                    }
                },
                {
                    name: 'OpenAI',
                    type: 'organization',
                    description: '领先的人工智能研究公司',
                    category: '公司',
                    tags: ['AI公司', '研究', '技术'],
                    properties: {
                        founded: 2015,
                        founder: 'Sam Altman',
                        headquarters: '旧金山',
                        notable_products: ['GPT', 'DALL-E', 'ChatGPT']
                    }
                },
                {
                    name: 'ChatGPT',
                    type: 'product',
                    description: 'OpenAI开发的对话AI助手',
                    category: '产品',
                    tags: ['OpenAI', '对话AI', 'GPT'],
                    properties: {
                        developer: 'OpenAI',
                        launched: 2022,
                        model: 'GPT-3.5/GPT-4',
                        users: '1亿+'
                    }
                }
            ],
            relations: [
                {
                    from: '机器学习',
                    to: '人工智能',
                    relation_type: 'is_subfield_of',
                    weight: 0.9,
                    confidence: 1.0,
                    bidirectional: false,
                    properties: {
                        description: '机器学习是人工智能的一个子领域'
                    }
                },
                {
                    from: '深度学习',
                    to: '机器学习',
                    relation_type: 'is_subfield_of',
                    weight: 0.8,
                    confidence: 1.0,
                    bidirectional: false,
                    properties: {
                        description: '深度学习是机器学习的一个子领域'
                    }
                },
                {
                    from: 'ChatGPT',
                    to: 'OpenAI',
                    relation_type: 'developed_by',
                    weight: 1.0,
                    confidence: 1.0,
                    bidirectional: false,
                    properties: {
                        description: 'ChatGPT由OpenAI开发'
                    }
                },
                {
                    from: 'ChatGPT',
                    to: '深度学习',
                    relation_type: 'uses_technology',
                    weight: 0.9,
                    confidence: 0.9,
                    bidirectional: false,
                    properties: {
                        description: 'ChatGPT基于深度学习技术'
                    }
                },
                {
                    from: 'OpenAI',
                    to: '人工智能',
                    relation_type: 'works_in',
                    weight: 0.9,
                    confidence: 1.0,
                    bidirectional: true,
                    properties: {
                        description: 'OpenAI从事人工智能研究'
                    }
                }
            ]
        };
    }

    async runDemo() {
        console.log('🧠 Knowledge Graph Memory Server Demo\n');

        try {
            await this.server.loadData();
            
            // 清理现有数据（可选）
            console.log('🧹 清理现有数据...');
            await this.clearGraph();

            // 演示各种功能
            await this.demoAddEntities();
            await this.demoAddRelations();
            await this.demoSearchEntities();
            await this.demoGetEntity();
            await this.demoFindPath();
            await this.demoGetNeighbors();
            await this.demoUpdateEntity();
            await this.demoQueryGraph();
            await this.demoGetStatistics();
            await this.demoExportGraph();
            
            console.log('\n🎉 Demo completed successfully!');
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        } finally {
            // 保存数据
            try {
                await this.server.saveData();
                console.log('💾 数据已保存');
            } catch (error) {
                console.error('保存数据失败:', error.message);
            }
        }
    }

    async clearGraph() {
        this.server.graph.entities.clear();
        this.server.graph.relations.clear();
        console.log('✅ 知识图谱已清空\n');
    }

    async demoAddEntities() {
        console.log('📝 Demo: Adding Entities\n');

        for (const entityData of this.demoData.entities) {
            console.log(`添加实体: ${entityData.name}`);
            const result = await this.server.handleAddEntity(entityData);
            const response = JSON.parse(result.content[0].text);
            
            if (response.success) {
                console.log(`  ✅ ${response.message}`);
                console.log(`  📋 ID: ${response.entity.id}`);
            } else {
                console.log(`  ❌ 添加失败: ${response.error}`);
            }
        }
        console.log();
    }

    async demoAddRelations() {
        console.log('🔗 Demo: Adding Relations\n');

        for (const relationData of this.demoData.relations) {
            console.log(`添加关系: ${relationData.from} -> ${relationData.relation_type} -> ${relationData.to}`);
            const result = await this.server.handleAddRelation(relationData);
            const response = JSON.parse(result.content[0].text);
            
            if (response.success) {
                console.log(`  ✅ ${response.message}`);
            } else {
                console.log(`  ❌ 添加失败: ${response.error}`);
            }
        }
        console.log();
    }

    async demoSearchEntities() {
        console.log('🔍 Demo: Searching Entities\n');

        const searches = [
            { query: '人工智能', type: 'concept' },
            { query: 'OpenAI', type: 'organization' },
            { tags: ['AI', '技术'] },
            { query: '学习' }
        ];

        for (const search of searches) {
            console.log(`搜索: ${JSON.stringify(search)}`);
            const result = await this.server.handleSearchEntities(search);
            const response = JSON.parse(result.content[0].text);
            
            if (response.success && response.results.length > 0) {
                console.log(`  ✅ 找到 ${response.total_found} 个结果:`);
                response.results.forEach(entity => {
                    console.log(`    - ${entity.name} (${entity.type})`);
                });
            } else {
                console.log(`  ⚠️  未找到结果`);
            }
            console.log();
        }
    }

    async demoGetEntity() {
        console.log('📋 Demo: Getting Entity Details\n');

        const entityNames = ['人工智能', 'OpenAI', 'ChatGPT'];

        for (const name of entityNames) {
            console.log(`获取实体: ${name}`);
            const result = await this.server.handleGetEntity({ id: name, include_relations: true });
            const response = JSON.parse(result.content[0].text);
            
            if (response.success) {
                const entity = response.entity;
                console.log(`  ✅ 找到实体:`);
                console.log(`    名称: ${entity.name}`);
                console.log(`    类型: ${entity.type}`);
                console.log(`    描述: ${entity.description}`);
                console.log(`    标签: ${entity.tags.join(', ')}`);
                
                if (entity.relations && entity.relations.length > 0) {
                    console.log(`    关系: ${entity.relations.length}个`);
                    entity.relations.forEach(rel => {
                        const direction = rel.direction === 'outgoing' ? '→' : '←';
                        const otherEntity = rel.direction === 'outgoing' ? rel.to_name : rel.from_name;
                        console.log(`      ${direction} ${rel.relation_type} ${otherEntity}`);
                    });
                }
            } else {
                console.log(`  ❌ 未找到: ${response.error}`);
            }
            console.log();
        }
    }

    async demoFindPath() {
        console.log('🛤️  Demo: Finding Paths\n');

        const pathQueries = [
            { from: '深度学习', to: 'OpenAI' },
            { from: 'ChatGPT', to: '人工智能' },
            { from: 'OpenAI', to: '机器学习' }
        ];

        for (const query of pathQueries) {
            console.log(`查找路径: ${query.from} → ${query.to}`);
            const result = await this.server.handleFindPath(query);
            const response = JSON.parse(result.content[0].text);
            
            if (response.success && response.path) {
                console.log(`  ✅ 找到路径 (长度: ${response.path_length}):`);
                const pathNames = response.path.map(p => p.name);
                console.log(`    ${pathNames.join(' → ')}`);
            } else {
                console.log(`  ⚠️  未找到路径`);
            }
            console.log();
        }
    }

    async demoGetNeighbors() {
        console.log('🏘️  Demo: Getting Neighbors\n');

        const neighborQueries = [
            { id: '人工智能', depth: 1 },
            { id: 'OpenAI', depth: 2 },
            { id: 'ChatGPT', depth: 1, limit: 5 }
        ];

        for (const query of neighborQueries) {
            console.log(`获取邻居: ${query.id} (深度: ${query.depth})`);
            const result = await this.server.handleGetNeighbors(query);
            const response = JSON.parse(result.content[0].text);
            
            if (response.success && response.neighbors.length > 0) {
                console.log(`  ✅ 找到 ${response.total_neighbors} 个邻居:`);
                response.neighbors.forEach(neighbor => {
                    const relationSymbol = neighbor.relation.from === neighbor.id ? '→' : '←';
                    const otherEntity = neighbor.relation.from === neighbor.id ? 
                        neighbor.relation.to_name : neighbor.relation.from_name;
                    console.log(`    ${neighbor.depth}层: ${neighbor.name} (${neighbor.type}) ${relationSymbol} ${neighbor.relation.relation_type} ${otherEntity}`);
                });
            } else {
                console.log(`  ⚠️  未找到邻居`);
            }
            console.log();
        }
    }

    async demoUpdateEntity() {
        console.log('✏️  Demo: Updating Entity\n');

        const updateData = {
            id: 'ChatGPT',
            properties: {
                version: 'GPT-4',
                features: ['对话', '写作', '编程', '翻译']
            },
            add_tags: ['GPT-4', '多模态'],
            remove_tags: []
        };

        console.log(`更新实体: ${updateData.id}`);
        const result = await this.server.handleUpdateEntity(updateData);
        const response = JSON.parse(result.content[0].text);
        
        if (response.success) {
            console.log(`  ✅ ${response.message}`);
            console.log(`  🏷️  新标签: ${response.entity.tags.join(', ')}`);
            console.log(`  ⚙️  属性: ${JSON.stringify(response.entity.properties, null, 2)}`);
        } else {
            console.log(`  ❌ 更新失败: ${response.error}`);
        }
        console.log();
    }

    async demoQueryGraph() {
        console.log('🔎 Demo: Querying Graph\n');

        const queries = [
            'concept',
            'person WHERE age > 30',
            'path FROM 人工智能 TO ChatGPT',
            'neighbors OF OpenAI depth 1',
            'AI'
        ];

        for (const query of queries) {
            console.log(`查询: ${query}`);
            const result = await this.server.handleQueryGraph({ query });
            const response = JSON.parse(result.content[0].text);
            
            if (response.success && response.results.length > 0) {
                console.log(`  ✅ 找到 ${response.result_count} 个结果:`);
                response.results.forEach(item => {
                    if (item.name) {
                        console.log(`    - ${item.name} (${item.type})`);
                    } else if (Array.isArray(item)) {
                        console.log(`    - 路径: ${item.map(p => p.name).join(' → ')}`);
                    } else {
                        console.log(`    - ${JSON.stringify(item)}`);
                    }
                });
            } else {
                console.log(`  ⚠️  未找到结果`);
            }
            console.log();
        }
    }

    async demoGetStatistics() {
        console.log('📊 Demo: Getting Statistics\n');

        const result = await this.server.handleGetStatistics({});
        const response = JSON.parse(result.content[0].text);
        
        if (response.success) {
            const stats = response.statistics;
            console.log(`  ✅ 知识图谱统计:`);
            console.log(`    总实体数: ${stats.total_entities}`);
            console.log(`    总关系数: ${stats.total_relations}`);
            console.log(`    创建时间: ${stats.created}`);
            console.log(`    最后修改: ${stats.last_modified}`);
            console.log(`    版本: ${stats.version}`);
            
            if (stats.entity_types) {
                console.log(`  📋 实体类型分布:`);
                Object.entries(stats.entity_types).forEach(([type, count]) => {
                    console.log(`    ${type}: ${count}`);
                });
            }
            
            if (stats.relation_types) {
                console.log(`  🔗 关系类型分布:`);
                Object.entries(stats.relation_types).forEach(([type, count]) => {
                    console.log(`    ${type}: ${count}`);
                });
            }
        } else {
            console.log(`  ❌ 获取统计失败: ${response.error}`);
        }
        console.log();
    }

    async demoExportGraph() {
        console.log('📤 Demo: Exporting Graph\n');

        const exportFormats = ['json', 'csv'];

        for (const format of exportFormats) {
            console.log(`导出格式: ${format}`);
            const result = await this.server.handleExportGraph({
                format: format,
                include_metadata: true
            });
            const response = JSON.parse(result.content[0].text);
            
            if (response.success) {
                console.log(`  ✅ 导出成功: ${response.message}`);
                if (format === 'json') {
                    console.log(`    实体数: ${response.data.entities?.length || 0}`);
                    console.log(`    关系数: ${response.data.relations?.length || 0}`);
                } else if (format === 'csv') {
                    console.log(`    CSV文件已生成`);
                }
            } else {
                console.log(`  ❌ 导出失败: ${response.error}`);
            }
            console.log();
        }
    }
}

// 运行演示
if (require.main === module) {
    const dataPath = process.env.KNOWLEDGE_GRAPH_DATA_PATH;
    const demo = new KnowledgeGraphDemo(dataPath);
    demo.runDemo();
}

module.exports = KnowledgeGraphDemo;