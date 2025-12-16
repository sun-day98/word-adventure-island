#!/usr/bin/env node

/**
 * Knowledge Graph Memory Server
 * 知识图谱记忆服务器 - 构建和管理结构化的知识网络
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class KnowledgeGraphMemoryServer {
    constructor(dataPath = null) {
        this.server = new Server(
            {
                name: 'knowledge-graph-memory-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.dataPath = dataPath || path.join(process.cwd(), 'knowledge-graph-data');
        this.graphFile = path.join(this.dataPath, 'knowledge-graph.json');
        this.entitiesFile = path.join(this.dataPath, 'entities.json');
        this.relationsFile = path.join(this.dataPath, 'relations.json');
        this.metadataFile = path.join(this.dataPath, 'metadata.json');
        
        this.graph = {
            entities: new Map(),
            relations: new Map(),
            metadata: {
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                entityCount: 0,
                relationCount: 0,
                version: '1.0.0'
            }
        };

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.saveData();
            await this.server.close();
            process.exit(0);
        });
    }

    setupToolHandlers() {
        // 列出可用工具
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'add_entity',
                    description: '添加知识实体到图谱',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: '实体名称',
                            },
                            type: {
                                type: 'string',
                                description: '实体类型 (person, place, concept, event, object等)',
                            },
                            properties: {
                                type: 'object',
                                description: '实体属性',
                                additionalProperties: true
                            },
                            description: {
                                type: 'string',
                                description: '实体描述',
                            },
                            category: {
                                type: 'string',
                                description: '实体分类',
                            },
                            aliases: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '别名列表',
                            },
                            tags: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '标签列表',
                            }
                        },
                        required: ['name', 'type'],
                    },
                },
                {
                    name: 'add_relation',
                    description: '添加实体间的关系',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            from: {
                                type: 'string',
                                description: '起始实体名称或ID',
                            },
                            to: {
                                type: 'string',
                                description: '目标实体名称或ID',
                            },
                            relation_type: {
                                type: 'string',
                                description: '关系类型 (is_a, part_of, related_to, causes, located_in等)',
                            },
                            properties: {
                                type: 'object',
                                description: '关系属性',
                                additionalProperties: true
                            },
                            weight: {
                                type: 'number',
                                description: '关系权重 (0-1)',
                                minimum: 0,
                                maximum: 1,
                                default: 0.5
                            },
                            confidence: {
                                type: 'number',
                                description: '置信度 (0-1)',
                                minimum: 0,
                                maximum: 1,
                                default: 0.8
                            },
                            bidirectional: {
                                type: 'boolean',
                                description: '是否为双向关系',
                                default: false
                            }
                        },
                        required: ['from', 'to', 'relation_type'],
                    },
                },
                {
                    name: 'search_entities',
                    description: '搜索知识图谱中的实体',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '搜索关键词',
                            },
                            type: {
                                type: 'string',
                                description: '按类型过滤',
                            },
                            category: {
                                type: 'string',
                                description: '按分类过滤',
                            },
                            tags: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '按标签过滤',
                            },
                            limit: {
                                type: 'number',
                                description: '最大结果数',
                                default: 10,
                                minimum: 1,
                                maximum: 50
                            },
                            exact_match: {
                                type: 'boolean',
                                description: '是否精确匹配',
                                default: false
                            }
                        },
                    },
                },
                {
                    name: 'get_entity',
                    description: '获取特定实体的详细信息',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: '实体ID或名称',
                            },
                            include_relations: {
                                type: 'boolean',
                                description: '是否包含相关关系',
                                default: true
                            }
                        },
                        required: ['id'],
                    },
                },
                {
                    name: 'find_path',
                    description: '查找两个实体间的路径',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            from: {
                                type: 'string',
                                description: '起始实体名称或ID',
                            },
                            to: {
                                type: 'string',
                                description: '目标实体名称或ID',
                            },
                            max_depth: {
                                type: 'number',
                                description: '最大搜索深度',
                                default: 5,
                                minimum: 1,
                                maximum: 10
                            },
                            relation_types: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '允许的关系类型'
                            }
                        },
                        required: ['from', 'to'],
                    },
                },
                {
                    name: 'get_neighbors',
                    description: '获取实体的邻居节点',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: '实体ID或名称',
                            },
                            depth: {
                                type: 'number',
                                description: '邻居深度',
                                default: 1,
                                minimum: 1,
                                maximum: 3
                            },
                            relation_types: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '过滤关系类型'
                            },
                            limit: {
                                type: 'number',
                                description: '最大结果数',
                                default: 20,
                                minimum: 1,
                                maximum: 100
                            }
                        },
                        required: ['id'],
                    },
                },
                {
                    name: 'update_entity',
                    description: '更新实体信息',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: '实体ID或名称',
                            },
                            properties: {
                                type: 'object',
                                description: '要更新的属性',
                                additionalProperties: true
                            },
                            add_tags: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '要添加的标签'
                            },
                            remove_tags: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '要移除的标签'
                            }
                        },
                        required: ['id'],
                    },
                },
                {
                    name: 'delete_entity',
                    description: '删除实体及其关系',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                description: '实体ID或名称',
                            },
                            cascade: {
                                type: 'boolean',
                                description: '是否级联删除相关关系',
                                default: true
                            }
                        },
                        required: ['id'],
                    },
                },
                {
                    name: 'query_graph',
                    description: '执行图查询（支持简单查询语言）',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: '图查询语句，如: "person WHERE age > 30" 或 "path FROM A TO B"',
                            },
                            limit: {
                                type: 'number',
                                description: '最大结果数',
                                default: 50
                            }
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_statistics',
                    description: '获取知识图谱统计信息',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            include_types: {
                                type: 'boolean',
                                description: '是否包含类型统计',
                                default: true
                            },
                            include_relations: {
                                type: 'boolean',
                                description: '是否包含关系统计',
                                default: true
                            }
                        },
                    },
                },
                {
                    name: 'export_graph',
                    description: '导出知识图谱',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            format: {
                                type: 'string',
                                description: '导出格式 (json, csv, graphml, gexf)',
                                enum: ['json', 'csv', 'graphml', 'gexf'],
                                default: 'json'
                            },
                            output_path: {
                                type: 'string',
                                description: '输出文件路径（可选）',
                            },
                            include_metadata: {
                                type: 'boolean',
                                description: '是否包含元数据',
                                default: true
                            }
                        },
                    },
                },
                {
                    name: 'import_graph',
                    description: '导入知识图谱数据',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            format: {
                                type: 'string',
                                description: '导入格式 (json, csv)',
                                enum: ['json', 'csv'],
                                default: 'json'
                            },
                            data_path: {
                                type: 'string',
                                description: '数据文件路径',
                            },
                            merge_strategy: {
                                type: 'string',
                                description: '合并策略 (replace, merge, skip)',
                                enum: ['replace', 'merge', 'skip'],
                                default: 'merge'
                            }
                        },
                        required: ['data_path'],
                    },
                }
            ],
        }));

        // 处理工具调用
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                // 确保数据已加载
                await this.loadData();

                switch (name) {
                    case 'add_entity':
                        return await this.handleAddEntity(args);
                    case 'add_relation':
                        return await this.handleAddRelation(args);
                    case 'search_entities':
                        return await this.handleSearchEntities(args);
                    case 'get_entity':
                        return await this.handleGetEntity(args);
                    case 'find_path':
                        return await this.handleFindPath(args);
                    case 'get_neighbors':
                        return await this.handleGetNeighbors(args);
                    case 'update_entity':
                        return await this.handleUpdateEntity(args);
                    case 'delete_entity':
                        return await this.handleDeleteEntity(args);
                    case 'query_graph':
                        return await this.handleQueryGraph(args);
                    case 'get_statistics':
                        return await this.handleGetStatistics(args);
                    case 'export_graph':
                        return await this.handleExportGraph(args);
                    case 'import_graph':
                        return await this.handleImportGraph(args);
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

    // 数据管理方法
    async loadData() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });

            // 加载实体数据
            try {
                const entitiesData = await fs.readFile(this.entitiesFile, 'utf-8');
                const entitiesArray = JSON.parse(entitiesData);
                this.graph.entities = new Map(entitiesArray);
            } catch (error) {
                this.graph.entities = new Map();
            }

            // 加载关系数据
            try {
                const relationsData = await fs.readFile(this.relationsFile, 'utf-8');
                const relationsArray = JSON.parse(relationsData);
                this.graph.relations = new Map(relationsArray);
            } catch (error) {
                this.graph.relations = new Map();
            }

            // 加载元数据
            try {
                const metadataData = await fs.readFile(this.metadataFile, 'utf-8');
                this.graph.metadata = JSON.parse(metadataData);
            } catch (error) {
                this.graph.metadata = {
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    entityCount: this.graph.entities.size,
                    relationCount: this.graph.relations.size,
                    version: '1.0.0'
                };
            }
        } catch (error) {
            console.error('Error loading data:', error);
            throw new Error(`Failed to load knowledge graph data: ${error.message}`);
        }
    }

    async saveData() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });

            // 保存实体数据
            const entitiesArray = Array.from(this.graph.entities.entries());
            await fs.writeFile(this.entitiesFile, JSON.stringify(entitiesArray, null, 2), 'utf-8');

            // 保存关系数据
            const relationsArray = Array.from(this.graph.relations.entries());
            await fs.writeFile(this.relationsFile, JSON.stringify(relationsArray, null, 2), 'utf-8');

            // 更新和保存元数据
            this.graph.metadata.lastModified = new Date().toISOString();
            this.graph.metadata.entityCount = this.graph.entities.size;
            this.graph.metadata.relationCount = this.graph.relations.size;
            await fs.writeFile(this.metadataFile, JSON.stringify(this.graph.metadata, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error saving data:', error);
            throw new Error(`Failed to save knowledge graph data: ${error.message}`);
        }
    }

    // 实体管理方法
    generateEntityId(name) {
        const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let id = baseId;
        let counter = 1;
        
        while (this.graph.entities.has(id)) {
            id = `${baseId}_${counter}`;
            counter++;
        }
        
        return id;
    }

    handleAddEntity(args) {
        const { name, type, properties = {}, description, category, aliases = [], tags = [] } = args;

        try {
            const id = this.generateEntityId(name);
            
            const entity = {
                id,
                name,
                type,
                description: description || '',
                category: category || '',
                aliases: [...new Set([...aliases])],
                tags: [...new Set([...tags])],
                properties: { ...properties },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.graph.entities.set(id, entity);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            entity: entity,
                            message: `实体 "${name}" 添加成功`
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    handleSearchEntities(args) {
        const { query, type, category, tags, limit = 10, exact_match = false } = args;

        try {
            let results = Array.from(this.graph.entities.values());

            // 应用过滤条件
            if (query) {
                const searchQuery = query.toLowerCase();
                results = results.filter(entity => {
                    const searchText = `${entity.name} ${entity.description} ${entity.aliases.join(' ')}`.toLowerCase();
                    return exact_match ? 
                        entity.name.toLowerCase() === searchQuery || entity.aliases.some(alias => alias.toLowerCase() === searchQuery) :
                        searchText.includes(searchQuery);
                });
            }

            if (type) {
                results = results.filter(entity => entity.type === type);
            }

            if (category) {
                results = results.filter(entity => entity.category === category);
            }

            if (tags && tags.length > 0) {
                results = results.filter(entity => 
                    tags.some(tag => entity.tags.includes(tag))
                );
            }

            // 限制结果数量
            results = results.slice(0, limit);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: { query, type, category, tags, limit },
                            total_found: results.length,
                            results: results
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    handleGetEntity(args) {
        const { id, include_relations = true } = args;

        try {
            const entity = this.graph.entities.get(id) || 
                         Array.from(this.graph.entities.values()).find(e => e.name === id);
            
            if (!entity) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: `实体 "${id}" 未找到`
                            }, null, 2)
                        }
                    ]
                };
            }

            const result = { ...entity };

            if (include_relations) {
                const relations = this.getEntityRelations(entity.id);
                result.relations = relations;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            entity: result
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    getEntityRelations(entityId) {
        const relations = [];
        
        for (const [relationId, relation] of this.graph.relations) {
            if (relation.from === entityId || relation.to === entityId) {
                relations.push({
                    id: relationId,
                    ...relation,
                    direction: relation.from === entityId ? 'outgoing' : 'incoming'
                });
            }
        }

        return relations;
    }

    // 关系管理方法
    handleAddRelation(args) {
        const { from, to, relation_type, properties = {}, weight = 0.5, confidence = 0.8, bidirectional = false } = args;

        try {
            const fromEntity = this.findEntity(from);
            const toEntity = this.findEntity(to);

            if (!fromEntity) {
                throw new Error(`起始实体 "${from}" 未找到`);
            }
            if (!toEntity) {
                throw new Error(`目标实体 "${to}" 未找到`);
            }

            const relationId = this.generateRelationId(fromEntity.id, toEntity.id, relation_type);
            
            const relation = {
                id: relationId,
                from: fromEntity.id,
                to: toEntity.id,
                from_name: fromEntity.name,
                to_name: toEntity.name,
                relation_type,
                properties: { ...properties },
                weight,
                confidence,
                bidirectional,
                createdAt: new Date().toISOString()
            };

            this.graph.relations.set(relationId, relation);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            relation: relation,
                            message: `关系 "${fromEntity.name} -> ${relation_type} -> ${toEntity.name}" 添加成功`
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    generateRelationId(fromId, toId, relationType) {
        const baseId = `${fromId}_${relationType}_${toId}`;
        return crypto.createHash('md5').update(baseId).digest('hex').substring(0, 16);
    }

    findEntity(identifier) {
        return this.graph.entities.get(identifier) || 
               Array.from(this.graph.entities.values()).find(e => e.name === identifier);
    }

    // 图查询方法
    handleFindPath(args) {
        const { from, to, max_depth = 5, relation_types } = args;

        try {
            const fromEntity = this.findEntity(from);
            const toEntity = this.findEntity(to);

            if (!fromEntity) {
                throw new Error(`起始实体 "${from}" 未找到`);
            }
            if (!toEntity) {
                throw new Error(`目标实体 "${to}" 未找到`);
            }

            const path = this.findShortestPath(fromEntity.id, toEntity.id, max_depth, relation_types);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            from: fromEntity.name,
                            to: toEntity.name,
                            path: path,
                            path_length: path ? path.length - 1 : -1
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    findShortestPath(fromId, toId, maxDepth, allowedRelationTypes) {
        const visited = new Set();
        const queue = [{ entityId: fromId, path: [fromId] }];
        visited.add(fromId);

        while (queue.length > 0) {
            const { entityId, path } = queue.shift();

            if (entityId === toId) {
                return this.buildPathDetails(path);
            }

            if (path.length > maxDepth) {
                continue;
            }

            const neighbors = this.getEntityNeighbors(entityId, allowedRelationTypes);
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.entityId)) {
                    visited.add(neighbor.entityId);
                    queue.push({
                        entityId: neighbor.entityId,
                        path: [...path, neighbor.entityId]
                    });
                }
            }
        }

        return null;
    }

    getEntityNeighbors(entityId, allowedRelationTypes) {
        const neighbors = [];
        
        for (const relation of this.graph.relations.values()) {
            if (allowedRelationTypes && !allowedRelationTypes.includes(relation.relation_type)) {
                continue;
            }

            let neighborId = null;
            if (relation.from === entityId) {
                neighborId = relation.to;
            } else if (relation.bidirectional || relation.to === entityId) {
                neighborId = relation.from;
            }

            if (neighborId && neighborId !== entityId) {
                neighbors.push({
                    entityId: neighborId,
                    relation: relation
                });
            }
        }

        return neighbors;
    }

    buildPathDetails(entityIds) {
        const path = [];
        
        for (let i = 0; i < entityIds.length; i++) {
            const entity = this.graph.entities.get(entityIds[i]);
            if (entity) {
                path.push({
                    id: entity.id,
                    name: entity.name,
                    type: entity.type
                });
            }
        }

        return path;
    }

    handleGetNeighbors(args) {
        const { id, depth = 1, relation_types, limit = 20 } = args;

        try {
            const entity = this.findEntity(id);
            if (!entity) {
                throw new Error(`实体 "${id}" 未找到`);
            }

            const neighbors = this.getEntityNeighborsAtDepth(entity.id, depth, relation_types, limit);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            entity: entity.name,
                            depth,
                            neighbors: neighbors,
                            total_neighbors: neighbors.length
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    getEntityNeighborsAtDepth(entityId, maxDepth, allowedRelationTypes, limit) {
        const visited = new Set();
        const result = [];
        const queue = [{ id: entityId, depth: 0, path: [entityId] }];
        visited.add(entityId);

        while (queue.length > 0 && result.length < limit) {
            const { id, depth, path } = queue.shift();

            if (depth >= maxDepth) {
                continue;
            }

            const neighbors = this.getEntityNeighbors(id, allowedRelationTypes);
            
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.entityId)) {
                    visited.add(neighbor.entityId);
                    
                    const entity = this.graph.entities.get(neighbor.entityId);
                    if (entity) {
                        result.push({
                            id: entity.id,
                            name: entity.name,
                            type: entity.type,
                            depth: depth + 1,
                            relation: neighbor.relation,
                            path: [...path, entity.id]
                        });

                        if (depth + 1 < maxDepth) {
                            queue.push({
                                id: neighbor.entityId,
                                depth: depth + 1,
                                path: [...path, entity.id]
                            });
                        }
                    }
                }
            }
        }

        return result.slice(0, limit);
    }

    // 其他工具处理方法
    handleUpdateEntity(args) {
        const { id, properties = {}, add_tags = [], remove_tags = [] } = args;

        try {
            const entity = this.findEntity(id);
            if (!entity) {
                throw new Error(`实体 "${id}" 未找到`);
            }

            // 更新属性
            if (Object.keys(properties).length > 0) {
                entity.properties = { ...entity.properties, ...properties };
            }

            // 添加标签
            if (add_tags.length > 0) {
                const newTags = [...new Set([...entity.tags, ...add_tags])];
                entity.tags = newTags;
            }

            // 移除标签
            if (remove_tags.length > 0) {
                entity.tags = entity.tags.filter(tag => !remove_tags.includes(tag));
            }

            entity.updatedAt = new Date().toISOString();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            entity: entity,
                            message: `实体 "${entity.name}" 更新成功`
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    handleDeleteEntity(args) {
        const { id, cascade = true } = args;

        try {
            const entity = this.findEntity(id);
            if (!entity) {
                throw new Error(`实体 "${id}" 未找到`);
            }

            // 删除相关关系
            if (cascade) {
                const relationsToDelete = [];
                for (const [relationId, relation] of this.graph.relations) {
                    if (relation.from === entity.id || relation.to === entity.id) {
                        relationsToDelete.push(relationId);
                    }
                }

                for (const relationId of relationsToDelete) {
                    this.graph.relations.delete(relationId);
                }
            }

            // 删除实体
            this.graph.entities.delete(entity.id);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            deleted_entity: entity.name,
                            deleted_relations: cascade ? relationsToDelete?.length || 0 : 0,
                            message: `实体 "${entity.name}" 删除成功`
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    handleQueryGraph(args) {
        const { query, limit = 50 } = args;

        try {
            // 简单的查询解析和执行
            const results = this.executeSimpleQuery(query, limit);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            query: query,
                            results: results,
                            result_count: results.length
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    executeSimpleQuery(query, limit) {
        // 简化的查询语言解析
        // 支持的格式:
        // "person WHERE age > 30"
        // "path FROM A TO B"
        // "neighbors OF A depth 2"

        if (query.includes('WHERE')) {
            return this.executeWhereQuery(query, limit);
        } else if (query.includes('FROM') && query.includes('TO')) {
            return this.executeFromToQuery(query, limit);
        } else if (query.includes('OF') && query.includes('depth')) {
            return this.executeNeighborsQuery(query, limit);
        } else {
            // 默认为搜索查询
            return this.executeSearchQuery(query, limit);
        }
    }

    executeWhereQuery(query, limit) {
        const match = query.match(/(\w+)\s+WHERE\s+(.+)/i);
        if (!match) return [];

        const [, type, conditions] = match;
        let results = Array.from(this.graph.entities.values()).filter(e => e.type === type);

        // 简单的条件解析（支持基本的比较操作）
        const conditionsList = conditions.split('AND').map(c => c.trim());
        
        for (const condition of conditionsList) {
            results = results.filter(entity => {
                // 这里可以实现更复杂的条件解析
                return this.evaluateCondition(entity, condition);
            });
        }

        return results.slice(0, limit);
    }

    evaluateCondition(entity, condition) {
        // 简化的条件评估
        // 支持基本的属性比较
        const match = condition.match(/(\w+)\s*(>=|<=|>|<|=|!=|LIKE)\s*(.+)/);
        if (!match) return true;

        const [, property, operator, value] = match;
        const entityValue = entity.properties[property];
        const comparisonValue = value.replace(/['"]/g, '');

        switch (operator) {
            case '>':
                return parseFloat(entityValue) > parseFloat(comparisonValue);
            case '<':
                return parseFloat(entityValue) < parseFloat(comparisonValue);
            case '=':
                return entityValue === comparisonValue;
            case 'LIKE':
                return String(entityValue).toLowerCase().includes(comparisonValue.toLowerCase());
            default:
                return true;
        }
    }

    executeFromToQuery(query, limit) {
        const match = query.match(/path\s+FROM\s+(.+?)\s+TO\s+(.+)/i);
        if (!match) return [];

        const [, from, to] = match;
        const pathResult = this.findShortestPath(from, to, 5, []);
        
        return pathResult ? [pathResult] : [];
    }

    executeNeighborsQuery(query, limit) {
        const match = query.match(/neighbors\s+OF\s+(.+?)\s+(?:depth\s+(\d+))?/i);
        if (!match) return [];

        const [, entityName, depthStr] = match;
        const depth = depthStr ? parseInt(depthStr) : 1;
        
        const neighbors = this.getEntityNeighborsAtDepth(entityName, depth, [], limit);
        return neighbors;
    }

    executeSearchQuery(query, limit) {
        const results = Array.from(this.graph.entities.values()).filter(entity => {
            const searchText = `${entity.name} ${entity.description} ${entity.tags.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        return results.slice(0, limit);
    }

    handleGetStatistics(args) {
        const { include_types = true, include_relations = true } = args;

        try {
            const stats = {
                total_entities: this.graph.entities.size,
                total_relations: this.graph.relations.size,
                created: this.graph.metadata.created,
                last_modified: this.graph.metadata.lastModified,
                version: this.graph.metadata.version
            };

            if (include_types) {
                const typeStats = {};
                for (const entity of this.graph.entities.values()) {
                    typeStats[entity.type] = (typeStats[entity.type] || 0) + 1;
                }
                stats.entity_types = typeStats;
            }

            if (include_relations) {
                const relationStats = {};
                for (const relation of this.graph.relations.values()) {
                    relationStats[relation.relation_type] = (relationStats[relation.relation_type] || 0) + 1;
                }
                stats.relation_types = relationStats;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            statistics: stats
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    handleExportGraph(args) {
        const { format = 'json', output_path, include_metadata = true } = args;

        try {
            let exportData = {};
            
            if (format === 'json') {
                exportData = {
                    entities: Array.from(this.graph.entities.values()),
                    relations: Array.from(this.graph.relations.values())
                };
                
                if (include_metadata) {
                    exportData.metadata = this.graph.metadata;
                }
            } else if (format === 'csv') {
                exportData = {
                    entities_csv: this.convertEntitiesToCSV(),
                    relations_csv: this.convertRelationsToCSV()
                };
            } else {
                throw new Error(`导出格式 "${format}" 暂不支持`);
            }

            if (output_path) {
                const fileName = path.basename(output_path);
                const fullOutputPath = path.join(this.dataPath, fileName);
                
                if (format === 'json') {
                    await fs.writeFile(fullOutputPath, JSON.stringify(exportData, null, 2), 'utf-8');
                } else if (format === 'csv') {
                    await fs.writeFile(fullOutputPath.replace('.csv', '_entities.csv'), exportData.entities_csv, 'utf-8');
                    await fs.writeFile(fullOutputPath.replace('.csv', '_relations.csv'), exportData.relations_csv, 'utf-8');
                }
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            format: format,
                            data: exportData,
                            output_path: output_path,
                            message: `知识图谱导出为 ${format} 格式成功`
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    convertEntitiesToCSV() {
        const headers = ['id', 'name', 'type', 'description', 'category', 'tags', 'properties', 'created_at', 'updated_at'];
        const rows = [headers.join(',')];

        for (const entity of this.graph.entities.values()) {
            const row = [
                entity.id,
                `"${entity.name}"`,
                entity.type,
                `"${entity.description}"`,
                entity.category || '',
                `"${entity.tags.join(';')}"`,
                `"${JSON.stringify(entity.properties).replace(/"/g, '""')}"`,
                entity.createdAt,
                entity.updatedAt
            ];
            rows.push(row.join(','));
        }

        return rows.join('\n');
    }

    convertRelationsToCSV() {
        const headers = ['id', 'from', 'to', 'relation_type', 'weight', 'confidence', 'bidirectional', 'properties', 'created_at'];
        const rows = [headers.join(',')];

        for (const relation of this.graph.relations.values()) {
            const row = [
                relation.id,
                relation.from,
                relation.to,
                relation.relation_type,
                relation.weight,
                relation.confidence,
                relation.bidirectional,
                `"${JSON.stringify(relation.properties).replace(/"/g, '""')}"`,
                relation.createdAt
            ];
            rows.push(row.join(','));
        }

        return rows.join('\n');
    }

    async handleImportGraph(args) {
        const { format = 'json', data_path, merge_strategy = 'merge' } = args;

        try {
            let importData;
            
            if (format === 'json') {
                const dataContent = await fs.readFile(data_path, 'utf-8');
                importData = JSON.parse(dataContent);
            } else {
                throw new Error(`导入格式 "${format}" 暂不支持`);
            }

            let importedEntities = 0;
            let importedRelations = 0;

            if (merge_strategy === 'replace') {
                this.graph.entities.clear();
                this.graph.relations.clear();
            }

            // 导入实体
            if (importData.entities) {
                for (const entity of importData.entities) {
                    if (merge_strategy === 'skip' && this.graph.entities.has(entity.id)) {
                        continue;
                    }
                    
                    this.graph.entities.set(entity.id, {
                        ...entity,
                        importedAt: new Date().toISOString()
                    });
                    importedEntities++;
                }
            }

            // 导入关系
            if (importData.relations) {
                for (const relation of importData.relations) {
                    if (merge_strategy === 'skip' && this.graph.relations.has(relation.id)) {
                        continue;
                    }
                    
                    this.graph.relations.set(relation.id, {
                        ...relation,
                        importedAt: new Date().toISOString()
                    });
                    importedRelations++;
                }
            }

            // 保存数据
            await this.saveData();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            import_results: {
                                entities_imported: importedEntities,
                                relations_imported: importedRelations,
                                merge_strategy: merge_strategy
                            },
                            message: `知识图谱导入成功`
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async run() {
        try {
            await this.loadData();
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.error('Knowledge Graph Memory Server running on stdio');
        } catch (error) {
            console.error('Failed to start server:', error);
        }
    }
}

// 启动服务器
if (require.main === module) {
    const dataPath = process.env.KNOWLEDGE_GRAPH_DATA_PATH;
    const server = new KnowledgeGraphMemoryServer(dataPath);
    server.run().catch(console.error);
}

module.exports = KnowledgeGraphMemoryServer;