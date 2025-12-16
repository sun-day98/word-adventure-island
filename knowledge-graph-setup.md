# Knowledge Graph Memory Server 设置指南

## 概述

Knowledge Graph Memory Server 是一个用于构建和管理结构化知识网络的MCP服务器。它允许AI助手存储、查询和分析实体之间的关系，形成知识图谱。

## 功能特性

### 🏗️ 知识图谱构建
- **实体管理**: 添加、更新、删除知识实体
- **关系建模**: 建立实体间的各种关系
- **属性支持**: 为实体和关系添加丰富的属性
- **标签系统**: 使用标签进行分类和检索

### 🔍 智能查询
- **实体搜索**: 按名称、类型、标签搜索
- **路径查找**: 发现实体间的连接路径
- **邻居探索**: 获取实体的相关实体网络
- **图查询**: 支持简单的图查询语言

### 📊 分析统计
- **图谱统计**: 实体和关系的数量统计
- **类型分析**: 实体和关系类型分布
- **路径分析**: 实体间连接分析

### 💾 数据管理
- **持久化存储**: JSON格式的本地存储
- **导入导出**: 支持JSON和CSV格式
- **数据备份**: 自动化的元数据管理

## 安装和配置

### 1. 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn
- 足够的磁盘空间用于数据存储

### 2. 安装依赖
```bash
# 安装MCP SDK
npm install @modelcontextprotocol/sdk

# 或使用yarn
yarn add @modelcontextprotocol/sdk
```

### 3. 数据目录配置

#### 默认数据目录
服务器会在当前工作目录下创建 `knowledge-graph-data` 文件夹：
```
knowledge-graph-data/
├── entities.json      # 实体数据
├── relations.json     # 关系数据
└── metadata.json      # 元数据信息
```

#### 自定义数据目录
通过环境变量设置：
```bash
# Windows
set KNOWLEDGE_GRAPH_DATA_PATH=D:\path\to\knowledge-data

# Linux/macOS
export KNOWLEDGE_GRAPH_DATA_PATH="/path/to/knowledge-data"
```

### 4. MCP服务器配置

#### 在Claude Desktop中配置
编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "knowledge-graph": {
      "command": "node",
      "args": ["c:/path/to/knowledge-graph-memory-server.js"],
      "env": {
        "KNOWLEDGE_GRAPH_DATA_PATH": "c:/path/to/knowledge-graph-data"
      }
    }
  }
}
```

#### 使用提供的配置文件
复制 `knowledge-graph-config.json` 到您的MCP配置目录。

## 核心概念

### 实体（Entity）
知识图谱中的基本节点，代表现实世界中的对象：

```javascript
{
  "id": "artificial_intelligence",
  "name": "人工智能",
  "type": "concept",
  "description": "模拟人类智能的计算机技术领域",
  "category": "技术",
  "tags": ["计算机科学", "技术", "AI"],
  "properties": {
    "founded_year": 1956,
    "founder": "约翰·麦卡锡"
  },
  "createdAt": "2024-12-15T10:00:00.000Z",
  "updatedAt": "2024-12-15T10:00:00.000Z"
}
```

### 关系（Relation）
实体间的连接，描述它们之间的关系：

```javascript
{
  "id": "abc123def456",
  "from": "machine_learning",
  "to": "artificial_intelligence",
  "from_name": "机器学习",
  "to_name": "人工智能",
  "relation_type": "is_subfield_of",
  "weight": 0.9,
  "confidence": 1.0,
  "bidirectional": false,
  "properties": {
    "description": "机器学习是人工智能的一个子领域"
  },
  "createdAt": "2024-12-15T10:00:00.000Z"
}
```

## API 使用示例

### 添加实体
```javascript
await mcp_call_tool('knowledge-graph', 'add_entity', {
  name: '深度学习',
  type: 'concept',
  description: '基于多层神经网络的机器学习方法',
  category: '技术',
  tags: ['机器学习', '神经网络', 'AI'],
  properties: {
    parent_field: '机器学习',
    popular_frameworks: ['TensorFlow', 'PyTorch']
  }
});
```

### 添加关系
```javascript
await mcp_call_tool('knowledge-graph', 'add_relation', {
  from: '深度学习',
  to: '机器学习',
  relation_type: 'is_subfield_of',
  weight: 0.8,
  confidence: 1.0,
  properties: {
    description: '深度学习是机器学习的一个子领域'
  }
});
```

### 搜索实体
```javascript
// 按名称搜索
await mcp_call_tool('knowledge-graph', 'search_entities', {
  query: '人工智能',
  limit: 10
});

// 按类型和标签搜索
await mcp_call_tool('knowledge-graph', 'search_entities', {
  type: 'concept',
  tags: ['AI', '技术'],
  limit: 20
});
```

### 获取实体详情
```javascript
await mcp_call_tool('knowledge-graph', 'get_entity', {
  id: '人工智能',
  include_relations: true
});
```

### 查找路径
```javascript
await mcp_call_tool('knowledge-graph', 'find_path', {
  from: '深度学习',
  to: 'OpenAI',
  max_depth: 5
});
```

### 获取邻居
```javascript
await mcp_call_tool('knowledge-graph', 'get_neighbors', {
  id: '人工智能',
  depth: 2,
  limit: 20
});
```

### 图查询
```javascript
// 按类型查询
await mcp_call_tool('knowledge-graph', 'query_graph', {
  query: 'concept'
});

// 路径查询
await mcp_call_tool('knowledge-graph', 'query_graph', {
  query: 'path FROM 人工智能 TO ChatGPT'
});

// 邻居查询
await mcp_call_tool('knowledge-graph', 'query_graph', {
  query: 'neighbors OF OpenAI depth 1'
});
```

## 查询语言

### 基本语法
知识图谱支持简单的查询语言：

#### 类型查询
```
person
concept
organization
```

#### 条件查询
```
person WHERE age > 30
concept WHERE tags CONTAINS 'AI'
```

#### 路径查询
```
path FROM A TO B
path FROM 人工智能 TO ChatGPT
```

#### 邻居查询
```
neighbors OF A depth 2
neighbors OF OpenAI depth 1
```

#### 关键词搜索
```
人工智能
AI技术
深度学习
```

### 支持的操作符
- `=` : 等于
- `!=` : 不等于
- `>` : 大于
- `<` : 小于
- `>=` : 大于等于
- `<=` : 小于等于
- `LIKE` : 包含（字符串匹配）
- `CONTAINS` : 包含（数组包含）

## 高级用法

### 批量操作
```javascript
// 批量添加实体
const entities = [
  { name: '实体1', type: 'concept' },
  { name: '实体2', type: 'person' }
];

for (const entity of entities) {
  await mcp_call_tool('knowledge-graph', 'add_entity', entity);
}

// 批量添加关系
const relations = [
  { from: '实体1', to: '实体2', relation_type: 'related_to' }
];

for (const relation of relations) {
  await mcp_call_tool('knowledge-graph', 'add_relation', relation);
}
```

### 知识图谱分析
```javascript
// 获取统计信息
const stats = await mcp_call_tool('knowledge-graph', 'get_statistics', {
  include_types: true,
  include_relations: true
});

// 分析实体类型分布
const typeDistribution = stats.statistics.entity_types;
console.log('实体类型分布:', typeDistribution);

// 分析关系类型分布
const relationDistribution = stats.statistics.relation_types;
console.log('关系类型分布:', relationDistribution);
```

### 路径分析
```javascript
// 查找所有可能路径
const startEntity = '人工智能';
const endEntity = 'ChatGPT';

const pathResult = await mcp_call_tool('knowledge-graph', 'find_path', {
  from: startEntity,
  to: endEntity,
  max_depth: 3
});

if (pathResult.success && pathResult.path) {
  console.log(`找到路径: ${pathResult.from} → ${pathResult.to}`);
  console.log(`路径长度: ${pathResult.path_length}`);
  
  // 分析路径上的实体
  pathResult.path.forEach((entity, index) => {
    console.log(`${index}. ${entity.name} (${entity.type})`);
  });
}
```

### 网络分析
```javascript
// 获取实体的完整邻居网络
const networkResult = await mcp_call_tool('knowledge-graph', 'get_neighbors', {
  id: '人工智能',
  depth: 2,
  limit: 50
});

// 构建网络图
const network = {
  center: '人工智能',
  nodes: [],
  edges: []
};

networkResult.neighbors.forEach(neighbor => {
  network.nodes.push({
    id: neighbor.id,
    name: neighbor.name,
    type: neighbor.type,
    depth: neighbor.depth
  });
  
  network.edges.push({
    from: neighbor.relation.from,
    to: neighbor.relation.to,
    type: neighbor.relation.relation_type
  });
});
```

## 数据导入导出

### 导出知识图谱
```javascript
// 导出为JSON
await mcp_call_tool('knowledge-graph', 'export_graph', {
  format: 'json',
  output_path: 'knowledge-graph-export.json',
  include_metadata: true
});

// 导出为CSV
await mcp_call_tool('knowledge-graph', 'export_graph', {
  format: 'csv',
  output_path: 'knowledge-graph-export.csv'
});
```

### 导入知识图谱
```javascript
// 从JSON导入
await mcp_call_tool('knowledge-graph', 'import_graph', {
  format: 'json',
  data_path: 'knowledge-graph-data.json',
  merge_strategy: 'merge'  // replace, merge, skip
});
```

### 数据格式示例

#### JSON格式
```json
{
  "entities": [
    {
      "id": "ai",
      "name": "人工智能",
      "type": "concept",
      "description": "模拟人类智能的技术",
      "properties": {}
    }
  ],
  "relations": [
    {
      "id": "rel1",
      "from": "ml",
      "to": "ai",
      "relation_type": "is_subfield_of",
      "weight": 0.9,
      "confidence": 1.0
    }
  ],
  "metadata": {
    "created": "2024-12-15T10:00:00.000Z",
    "entityCount": 100,
    "relationCount": 150
  }
}
```

#### CSV格式
```csv
id,name,type,description,category,tags,properties,created_at,updated_at
ai,人工智能,concept,模拟人类智能的技术,技术,"AI;计算机科学","{}","2024-12-15T10:00:00.000Z","2024-12-15T10:00:00.000Z"
```

## 性能优化

### 数据结构优化
- 使用合适的实体ID策略
- 避免过深的嵌套属性
- 合理使用关系权重和置信度

### 查询优化
- 使用精确的搜索条件
- 限制搜索结果数量
- 合理设置路径搜索深度

### 存储优化
- 定期清理无用的实体和关系
- 使用压缩存储大量数据
- 定期备份重要数据

## 故障排除

### 常见问题

#### 1. 数据加载失败
**症状**: 服务器启动时显示数据加载错误
**解决方案**:
- 检查数据目录权限
- 验证JSON文件格式
- 确保磁盘空间充足

#### 2. 实体或关系未找到
**症状**: 搜索返回空结果
**解决方案**:
- 检查实体名称拼写
- 使用正确的实体ID
- 验证数据是否已正确添加

#### 3. 路径查找失败
**症状**: find_path返回null
**解决方案**:
- 增加max_depth参数
- 检查实体间的连接关系
- 验证关系类型是否正确

#### 4. 查询性能慢
**症状**: 复杂查询响应时间长
**解决方案**:
- 限制查询结果数量
- 使用更精确的搜索条件
- 考虑优化数据结构

### 调试模式
启用详细日志：
```bash
# 设置调试环境变量
export DEBUG=true
export KNOWLEDGE_GRAPH_DEBUG=true

# 运行服务器
node knowledge-graph-memory-server.js
```

## 扩展开发

### 自定义关系类型
```javascript
// 添加自定义关系类型
await mcp_call_tool('knowledge-graph', 'add_relation', {
  from: 'A',
  to: 'B',
  relation_type: 'custom_relation_type',
  properties: {
    custom_property: 'value'
  }
});
```

### 扩展查询语言
可以修改 `executeSimpleQuery` 方法来支持更复杂的查询语法。

### 集成外部数据源
```javascript
// 从外部数据源导入实体
async function importFromWikipedia(title) {
  // 调用Wikipedia API
  const wikiData = await fetchWikipediaData(title);
  
  // 转换为知识图谱实体
  const entity = {
    name: title,
    type: 'concept',
    description: wikiData.description,
    properties: wikiData.infobox
  };
  
  await mcp_call_tool('knowledge-graph', 'add_entity', entity);
}
```

## 配置参考

### 完整配置示例
```json
{
  "mcpServers": {
    "knowledge-graph": {
      "command": "node",
      "args": ["c:/path/to/knowledge-graph-memory-server.js"],
      "env": {
        "KNOWLEDGE_GRAPH_DATA_PATH": "c:/path/to/data",
        "NODE_ENV": "production",
        "MAX_ENTITIES": "10000",
        "MAX_RELATIONS": "20000",
        "DEBUG": "false"
      },
      "timeout": 30000,
      "retries": 3
    }
  }
}
```

### 环境变量列表
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `KNOWLEDGE_GRAPH_DATA_PATH` | 数据存储路径 | ./knowledge-graph-data |
| `NODE_ENV` | 运行环境 | production |
| `MAX_ENTITIES` | 最大实体数量 | 无限制 |
| `MAX_RELATIONS` | 最大关系数量 | 无限制 |
| `DEBUG` | 调试模式 | false |

## 最佳实践

### 实体设计
- 使用清晰、唯一的实体名称
- 选择合适的实体类型
- 提供详细的描述信息
- 合理使用标签和分类

### 关系建模
- 选择精确的关系类型
- 设置合适的关系权重
- 提供关系置信度
- 避免循环依赖

### 数据维护
- 定期验证数据一致性
- 清理重复的实体和关系
- 备份重要数据
- 监控系统性能

## 更新日志

### v1.0.0 (2024-12-15)
- ✅ 初始版本发布
- ✅ 基础实体和关系管理
- ✅ 图查询和路径查找
- ✅ 数据导入导出功能
- ✅ 统计分析功能

### 即将推出
- 🔄 支持更多查询语法
- 🔄 图可视化功能
- 🔄 性能优化
- 🔄 支持分布式存储

---

*本指南将随着功能更新持续完善，如有问题请提交Issue或联系维护者。*