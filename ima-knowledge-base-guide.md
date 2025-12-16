# 微信IMA知识库连接指南

## 概述

本指南介绍如何在AI小说创作系统中连接和使用微信IMA知识库，为您的创作提供更丰富的知识支持。

## 功能特性

### 🔗 智能知识检索
- 实时搜索微信开发相关文档
- 支持API、组件、教程、最佳实践等多种分类
- 智能相关性评分和排序

### 📚 知识分类
- **API文档**: 微信小程序API接口文档
- **组件文档**: 内置组件使用说明
- **教程指南**: 开发教程和最佳实践
- **最佳实践**: 开发经验和建议
- **问题排查**: 常见问题和解决方案

### 🧠 智能集成
- 与小说创作系统无缝集成
- 基于上下文的知识推荐
- 缓存机制提升响应速度

## 快速开始

### 1. 配置IMA知识库

#### 步骤一：获取微信小程序配置
1. 登录[微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" → "开发管理" → "开发设置"
3. 获取AppID和AppSecret

#### 步骤二：在系统中配置
1. 打开`story-creator-with-ima.html`
2. 点击右上角"IMA知识库配置"按钮
3. 填入以下信息：
   - **微信小程序AppID**: 您的小程序AppID
   - **微信小程序AppSecret**: 您的小程序AppSecret
   - **IMA知识库API密钥**: 可选，用于高级功能

#### 步骤三：保存配置
点击"保存配置"按钮，系统将自动验证连接并保存配置。

### 2. 使用IMA知识库

#### 搜索知识
1. 点击右侧"IMA知识库"按钮打开知识面板
2. 在搜索框中输入关键词（如"登录API"、"view组件"等）
3. 按Enter键或选择分类进行搜索

#### 应用知识
1. 浏览搜索结果
2. 点击相关条目，知识内容将自动应用到创作区域
3. 知识建议会以绿色提示框形式显示

## 详细配置

### 高级配置选项

```javascript
// 自定义IMA配置
const imaConfig = {
    appId: 'your_app_id',
    appSecret: 'your_app_secret',
    imaApiKey: 'your_ima_api_key',
    customEndpoint: 'https://custom.ima.api.com',
    cacheTimeout: 300000 // 5分钟缓存
};

// 初始化IMA知识库
const imaKnowledgeBase = new WeixinIMAKnowledgeBase();
await imaKnowledgeBase.initialize(imaConfig);
```

### API配置选项

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| appId | string | 是 | 微信小程序AppID |
| appSecret | string | 是 | 微信小程序AppSecret |
| imaApiKey | string | 否 | IMA知识库API密钥 |
| customEndpoint | string | 否 | 自定义API端点 |
| cacheTimeout | number | 否 | 缓存超时时间（毫秒） |

## 使用示例

### 1. 搜索API文档

```javascript
// 搜索登录相关API
const results = await imaKnowledgeBase.search('登录', {
    category: 'api',
    limit: 5
});

// 结果示例
[
    {
        id: 'wx_api_login',
        title: '微信登录API',
        content: 'wx.login() - 获取临时登录凭证code',
        category: 'api',
        tags: ['登录', 'api', '认证'],
        relevance: 10
    }
]
```

### 2. 获取特定知识条目

```javascript
// 获取特定API文档
const knowledge = await imaKnowledgeBase.getKnowledge('wx_api_login');
```

### 3. 批量搜索

```javascript
// 同时搜索多个分类
const categories = ['api', 'component', 'tutorial'];
const allResults = {};

for (const category of categories) {
    allResults[category] = await imaKnowledgeBase.search('按钮', {
        category: category,
        limit: 3
    });
}
```

## 集成到创作流程

### 1. 智能推荐

系统会根据您的创作内容，自动推荐相关的技术知识：

```javascript
// 基于创作内容推荐知识
async function recommendKnowledge(content) {
    const keywords = extractKeywords(content);
    const recommendations = [];
    
    for (const keyword of keywords) {
        const results = await imaKnowledgeBase.search(keyword, {
            category: 'all',
            limit: 2
        });
        recommendations.push(...results);
    }
    
    return recommendations.filter(r => r.relevance > 5);
}
```

### 2. 上下文感知

```javascript
// 获取创作上下文相关知识
const context = {
    genre: 'scifi',
    elements: ['technology', 'future', 'ai'],
    currentChapter: 'AI助手开发'
};

const relevantKnowledge = await imaKnowledgeBase.search('AI助手开发', {
    category: 'tutorial'
});
```

## 故障排除

### 常见问题

#### 1. 连接失败
**问题**: 显示"未连接"状态
**解决方案**:
- 检查AppID和AppSecret是否正确
- 确认网络连接正常
- 验证微信小程序账号状态

#### 2. 搜索无结果
**问题**: 搜索返回空结果
**解决方案**:
- 尝试使用不同的关键词
- 检查分类选择是否正确
- 确认IMA知识库中有相关内容

#### 3. 响应缓慢
**问题**: 搜索响应时间过长
**解决方案**:
- 检查网络连接质量
- 考虑使用缓存功能
- 减少搜索结果数量限制

### 调试模式

启用调试模式获取详细日志：

```javascript
// 启用调试模式
localStorage.setItem('ima_debug', 'true');

// 查看控制台日志
console.log('IMA状态:', imaKnowledgeBase.getStatus());
```

## 最佳实践

### 1. 配置管理
- 定期更新AppSecret以确保安全性
- 使用环境变量存储敏感信息
- 定期检查API配额使用情况

### 2. 搜索优化
- 使用具体的关键词提高搜索准确性
- 合理使用分类筛选
- 利用标签进行精确匹配

### 3. 性能优化
- 合理设置缓存超时时间
- 避免频繁的小批量搜索
- 使用批量查询API（如果可用）

### 4. 内容集成
- 将技术知识自然融入故事情节
- 避免直接复制技术文档
- 考虑读者背景调整技术深度

## 扩展功能

### 1. 自定义知识库

```javascript
// 添加自定义知识
imaKnowledgeBase.addCustomKnowledge([
    {
        id: 'custom_001',
        title: '自定义技术概念',
        content: '您自己的技术解释',
        category: 'custom',
        tags: ['自定义', '技术']
    }
]);
```

### 2. 知识分析

```javascript
// 分析知识使用情况
const analysis = await imaKnowledgeBase.analyzeUsage({
    timeRange: 'last_30_days',
    category: 'api'
});
```

### 3. 智能补全

```javascript
// 基于上下文智能补全
const suggestions = await imaKnowledgeBase.getSmartSuggestions({
    partialInput: 'wx.',
    context: 'api_call',
    limit: 5
});
```

## 技术支持

### 文档资源
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [IMA知识库API文档](https://ima.weixin.qq.com/docs)

### 社区支持
- 微信开发者社区
- IMA知识库用户群
- GitHub Issues

### 联系方式
- 技术支持邮箱：support@ima.weixin.qq.com
- 开发者交流群：微信群二维码

## 更新日志

### v1.0.0 (2024-12-15)
- ✅ 初始版本发布
- ✅ 基础知识搜索功能
- ✅ 分类筛选支持
- ✅ 缓存机制
- ✅ 与创作系统集成

### 即将推出
- 🔄 离线模式支持
- 🔄 多语言知识库
- 🔄 AI知识推荐算法优化
- 🔄 个性化知识订阅

---

*本指南将持续更新，请关注最新版本。如有问题或建议，欢迎提交反馈。*