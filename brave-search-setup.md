# Brave Search MCP Server 设置指南

## 概述

Brave Search MCP Server 是一个为AI助手提供Brave搜索引擎访问能力的MCP（Model Context Protocol）服务器。它支持网页、新闻、图片、视频等多种搜索类型。

## 功能特性

### 🔍 搜索功能
- **网页搜索**: `brave_search` - 标准网页搜索
- **新闻搜索**: `brave_news_search` - 实时新闻搜索
- **图片搜索**: `brave_images_search` - 图片内容搜索
- **视频搜索**: `brave_videos_search` - 视频内容搜索

### 🧙 智能功能
- **搜索建议**: `get_search_suggestions` - 获取相关搜索建议
- **热门趋势**: `get_trending_searches` - 获取当前热门搜索

### 🌐 国际化支持
- **多语言**: 支持中文、英文等多种语言
- **地区化**: 支持不同国家和地区的搜索结果
- **安全搜索**: 多级安全搜索过滤

## 安装和配置

### 1. 获取Brave Search API密钥

#### 步骤一：注册Brave Search API
1. 访问 [Brave Search API](https://brave.com/search/api/)
2. 点击"Get started"或"Sign up"
3. 创建账户并验证邮箱

#### 步骤二：获取API密钥
1. 登录Brave Search API控制台
2. 进入"API Keys"页面
3. 点击"Create new key"
4. 复制生成的API密钥

#### 步骤三：查看配额和限制
- 每月免费搜索次数：2,000次
- 每秒请求限制：100次
- 支持的搜索类型：web, news, images, videos

### 2. 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn
- 有效的网络连接

### 3. 安装依赖
```bash
# 安装MCP SDK
npm install @modelcontextprotocol/sdk

# 或使用yarn
yarn add @modelcontextprotocol/sdk
```

### 4. 配置环境变量

#### 方法一：设置系统环境变量
```bash
# Windows (PowerShell)
$env:BRAVE_API_KEY = "your_actual_api_key_here"

# Linux/macOS
export BRAVE_API_KEY="your_actual_api_key_here"
```

#### 方法二：在MCP配置中设置
编辑 `claude_desktop_config.json` 或 `brave-search-config.json`：

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["c:/Users/Administrator/CodeBuddy/20251205164818/brave-search-mcp-server.js"],
      "env": {
        "BRAVE_API_KEY": "your_actual_api_key_here"
      }
    }
  }
}
```

#### 方法三：创建.env文件
```bash
# 创建.env文件
echo "BRAVE_API_KEY=your_actual_api_key_here" > .env

# 加载环境变量
source .env  # Linux/macOS
# 或在Windows中使用
# $env:BRAVE_API_KEY = Get-Content .env
```

### 5. 配置MCP服务器

#### 在Claude Desktop中配置
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["c:/path/to/brave-search-mcp-server.js"],
      "env": {
        "BRAVE_API_KEY": "your_actual_api_key_here"
      }
    }
  }
}
```

## API 使用示例

### 基础网页搜索
```javascript
// 搜索网页内容
await mcp_call_tool('brave-search', 'brave_search', {
  query: '人工智能最新发展',
  count: 10,
  lang: 'zh-CN',
  country: 'CN',
  safesearch: 'moderate'
});
```

### 新闻搜索
```javascript
// 搜索最新新闻
await mcp_call_tool('brave-search', 'brave_news_search', {
  query: 'ChatGPT更新',
  count: 5,
  lang: 'zh-CN',
  freshness: 'pw' // 过去一周
});
```

### 图片搜索
```javascript
// 搜索图片
await mcp_call_tool('brave-search', 'brave_images_search', {
  query: '可爱猫咪',
  count: 20,
  safesearch: 'strict'
});
```

### 视频搜索
```javascript
// 搜索视频
await mcp_call_tool('brave-search', 'brave_videos_search', {
  query: '机器学习教程',
  count: 10,
  lang: 'zh-CN'
});
```

### 获取搜索建议
```javascript
// 获取搜索建议
await mcp_call_tool('brave-search', 'get_search_suggestions', {
  query: '人工智能',
  lang: 'zh-CN'
});
```

### 获取热门搜索
```javascript
// 获取热门搜索
await mcp_call_tool('brave-search', 'get_trending_searches', {
  country: 'CN',
  lang: 'zh-CN',
  count: 10
});
```

## 参数详解

### 搜索类型参数

| 参数 | 类型 | 说明 | 默认值 | 选项 |
|------|------|------|--------|------|
| `query` | string | 搜索关键词 | 必需 | - |
| `count` | number | 结果数量 | 10 | 1-20/50 |
| `offset` | number | 偏移量 | 0 | ≥0 |
| `lang` | string | 搜索语言 | zh-CN | 语言代码 |
| `country` | string | 国家代码 | CN | 国家代码 |
| `safesearch` | string | 安全搜索 | moderate | strict, moderate, off |
| `freshness` | string | 时间过滤 | - | pd, pw, pm, py |

### 时间过滤选项
- `pd`: 过去一天 (past day)
- `pw`: 过去一周 (past week)  
- `pm`: 过去一月 (past month)
- `py`: 过去一年 (past year)

### 语言代码示例
- `zh-CN`: 简体中文
- `zh-TW`: 繁体中文
- `en`: 英语
- `ja`: 日语
- `ko`: 韩语

### 国家代码示例
- `CN`: 中国
- `US`: 美国
- `JP`: 日本
- `KR`: 韩国
- `GB`: 英国

## 高级用法

### 复合搜索查询
```javascript
// 使用引号精确搜索
await mcp_call_tool('brave-search', 'brave_search', {
  query: '"人工智能" "机器学习" 应用',
  count: 10
});

// 使用排除词
await mcp_call_tool('brave-search', 'brave_search', {
  query: '人工智能 -chatgpt',
  count: 10
});

// 使用站点限制
await mcp_call_tool('brave-search', 'brave_search', {
  query: 'AI site:github.com',
  count: 10
});
```

### 批量搜索
```javascript
// 并行搜索多个查询
const queries = ['人工智能', '机器学习', '深度学习'];
const results = await Promise.all(
  queries.map(query => 
    mcp_call_tool('brave-search', 'brave_search', { query })
  )
);
```

### 搜索结果处理
```javascript
// 处理搜索结果
const searchResult = await mcp_call_tool('brave-search', 'brave_search', {
  query: 'AI发展趋势',
  count: 10
});

const result = JSON.parse(searchResult.content[0].text);
if (result.success) {
  console.log(`找到 ${result.total_results} 个结果`);
  result.results.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   ${item.snippet}`);
    console.log(`   ${item.url}`);
  });
}
```

## 配置参考

### 完整配置示例
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["c:/path/to/brave-search-mcp-server.js"],
      "env": {
        "BRAVE_API_KEY": "your_actual_api_key_here",
        "NODE_ENV": "production",
        "BRAVE_SEARCH_TIMEOUT": "10000",
        "BRAVE_MAX_RESULTS": "20"
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
| `BRAVE_API_KEY` | Brave Search API密钥 | 必需 |
| `NODE_ENV` | 运行环境 | production |
| `BRAVE_SEARCH_TIMEOUT` | 请求超时时间(ms) | 10000 |
| `BRAVE_MAX_RESULTS` | 最大结果数量 | 20 |

## 故障排除

### 常见问题

#### 1. API密钥错误
**症状**: "Invalid API key" 错误
**解决方案**:
- 验证API密钥是否正确
- 检查是否有过期的密钥
- 确认环境变量设置正确

#### 2. 频率限制
**症状**: "Rate limit exceeded" 错误
**解决方案**:
- 减少请求频率
- 实现请求缓存
- 升级API计划

#### 3. 网络连接问题
**症状**: "Request timeout" 或连接失败
**解决方案**:
- 检查网络连接
- 验证防火墙设置
- 增加超时时间

#### 4. 无搜索结果
**症状**: 返回空结果
**解决方案**:
- 检查搜索关键词
- 尝试不同的语言设置
- 使用更通用的搜索词

### 调试模式
启用详细日志：
```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "brave-search:*"
  }
}
```

### 性能优化
- 实现搜索结果缓存
- 使用适当的搜索过滤条件
- 限制返回结果数量
- 批量处理搜索请求

## 安全和隐私

### 数据隐私
- 搜索查询会发送到Brave API
- 不会存储用户搜索历史
- 支持安全搜索过滤

### API密钥安全
- 不要在代码中硬编码API密钥
- 使用环境变量存储密钥
- 定期轮换API密钥
- 监控API使用情况

## 配额和计费

### 免费计划限制
- 每月2,000次搜索
- 每秒100次请求
- 标准搜索功能

### 付费计划
- 更高的搜索配额
- 更快的响应速度
- 优先技术支持
- 高级搜索功能

## 监控和分析

### 使用统计
```javascript
// 监控API使用情况
const usage = {
  totalSearches: 0,
  newsSearches: 0,
  imageSearches: 0,
  videoSearches: 0,
  errors: 0
};
```

### 性能指标
- 响应时间
- 成功率
- 错误类型分布
- 最受欢迎的搜索查询

## 扩展开发

### 添加自定义搜索类型
```javascript
// 在brave-search-mcp-server.js中添加新工具
{
    name: 'custom_search',
    description: '自定义搜索功能',
    inputSchema: {
        // 参数定义
    }
}
```

### 集成其他搜索引擎
- Google Custom Search
- Bing Search API
- DuckDuckGo
- 其他专业搜索引擎

## 支持和社区

- 官方文档: [Brave Search API Docs](https://brave.com/search/api/documentation/)
- API状态: [Brave Status](https://status.brave.com/)
- 社区论坛: [Brave Community](https://community.brave.com/)
- GitHub Issues: 报告问题和功能请求

## 更新日志

### v1.0.0 (2024-12-15)
- ✅ 初始版本发布
- ✅ 基础搜索功能
- ✅ 多媒体搜索支持
- ✅ 搜索建议和趋势
- ✅ 国际化支持

### 即将推出
- 🔄 搜索历史缓存
- 🔄 自定义过滤规则
- 🔄 搜索结果分析
- 🔄 批量搜索优化

---

*本指南将随着功能更新持续完善，如有问题请提交Issue或联系维护者。*