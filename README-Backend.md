# AI小说创作系统 - 完整后端版

## 📋 系统概述

这是一个完整的AI小说创作系统，包含前端界面和Node.js后端服务，支持数据持久化存储、API接口调用和智能AI辅助功能。

## 🎯 核心功能

### 📝 情节大纲工具
- **专业分集设定**：完整的故事结构设计
- **多阶段情节**：开端→发展→高潮→结局
- **人物关系网**：复杂的角色关联系统
- **伏笔悬念设计**：专业的编剧技巧指导

### 👥 角色管理系统
- **角色数据库**：支持多种角色类型
- **详细设定**：特质、背景、关系
- **可视化展示**：直观的角色卡片
- **角色成长线**：完整的角色发展轨迹

### 🤖 AI智能辅助
- **情节转折生成**：智能意外转折点
- **对话优化**：改善对话质量和个性
- **节奏控制**：调节叙事节奏
- **风格建议**：多种写作风格适配

### 📚 素材模板库
- **情节结构模板**：三幕式、英雄之旅等
- **角色原型库**：英雄、导师、反派等
- **冲突设计模板**：价值观冲突、资源争夺
- **场景素材**：丰富的环境描写素材

## 🚀 快速开始

### 1. 安装依赖
```bash
cd /path/to/project
npm install
```

### 2. 启动后端服务
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 3. 访问前端界面
打开浏览器访问：
- **主界面**：`http://localhost:3000/novel-creation-full.html`
- **情节大纲工具**：`http://localhost:3000/plot-outline-tool.html`
- **基础创作工具**：`http://localhost:3000/story-creator.html`

## 📡 API接口文档

### 情节大纲管理
```
GET    /api/outlines          # 获取所有大纲
GET    /api/outlines/:id      # 获取特定大纲
POST   /api/outlines          # 创建新大纲
PUT    /api/outlines/:id      # 更新大纲
DELETE /api/outlines/:id      # 删除大纲
```

### 角色管理
```
GET    /api/characters        # 获取所有角色
POST   /api/characters        # 创建新角色
PUT    /api/characters/:id    # 更新角色
DELETE /api/characters/:id    # 删除角色
```

### AI辅助功能
```
POST   /api/ai/suggest       # 获取AI建议
POST   /api/ai/analyze       # 文本分析
```

### 搜索功能
```
GET    /api/search?q=关键词&type=outlines   # 搜索大纲
GET    /api/search?q=关键词&type=characters  # 搜索角色
```

## 📊 数据结构

### 情节大纲数据格式
```json
{
  "id": "唯一标识符",
  "mainContent": "主要内容一句话概括",
  "environment": {
    "description": "环境描述",
    "keywords": "场景关键词"
  },
  "characters": [
    {
      "id": "角色ID",
      "name": "角色姓名",
      "type": "角色类型",
      "traits": ["特质1", "特质2"],
      "background": "背景故事",
      "relations": "与其他角色的关系"
    }
  ],
  "plot": {
    "beginning": "故事开端",
    "development": "发展过程",
    "climax": "高潮冲突",
    "ending": "结尾结局",
    "newSuspense": "新的悬念"
  },
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 角色数据格式
```json
{
  "id": "角色唯一标识",
  "name": "角色姓名",
  "type": "hero/antagonist/supporting/mentor",
  "traits": ["勇敢", "智慧", "冲动"],
  "background": "详细背景故事",
  "relations": "与其他角色的关系描述",
  "createdAt": "创建时间"
}
```

## 🎨 界面特色

### 响应式设计
- **桌面端**：三栏布局，信息密集
- **平板端**：自适应两栏布局
- **移动端**：单栏垂直布局，触控优化

### 现代化UI
- **毛玻璃效果**：半透明背景 + 模糊
- **渐变色彩**：紫色系渐变主题
- **微交互动画**：悬停、点击反馈
- **加载状态**：优雅的加载动画

### 实时功能
- **服务器状态监测**：在线/离线指示器
- **数据同步**：前后端实时数据交换
- **自动保存**：防止数据丢失
- **智能搜索**：实时过滤结果

## 🔧 技术架构

### 后端技术栈
- **Node.js**：服务器运行环境
- **Express.js**：Web框架
- **JSON文件存储**：轻量级数据持久化
- **UUID**：唯一标识符生成
- **CORS**：跨域请求支持

### 前端技术栈
- **原生JavaScript**：无框架依赖
- **CSS3动画**：现代化视觉体验
- **Fetch API**：异步数据请求
- **Local Storage**：本地数据备份

### 数据存储结构
```
/data/
├── outlines/          # 情节大纲文件
├── characters/        # 角色设定文件
└── templates.json     # 系统模板配置
```

## 🎯 使用场景

### 📱 个人创作者
- **独立创作**：完整的个人创作环境
- **灵感管理**：随时记录创作想法
- **进度跟踪**：可视化创作进度

### 👥 团队协作
- **角色共享**：团队统一角色设定
- **情节对齐**：故事线同步管理
- **模板复用**：提高创作效率

### 📚 教学培训
- **编剧教学**：专业结构化指导
- **创意训练**：AI辅助激发灵感
- **作品分析**：写作技巧提升

## 🚀 部署说明

### 本地开发
```bash
git clone <repository>
cd novel-creation-system
npm install
npm run dev
```

### 生产部署
```bash
# 使用PM2进程管理
npm install -g pm2
pm2 start server.js --name "novel-creation-api"

# 使用Docker
docker build -t novel-creation-api .
docker run -p 3000:3000 novel-creation-api
```

### 环境变量
```bash
NODE_ENV=production        # 生产环境
PORT=3000                # 服务端口
DATA_DIR=/app/data       # 数据存储目录
```

## 🔒 安全考虑

- **输入验证**：所有API接口参数验证
- **错误处理**：统一错误响应格式
- **数据备份**：定期备份JSON数据文件
- **访问控制**：CORS策略配置

## 📈 性能优化

- **数据缓存**：内存缓存常用数据
- **异步处理**：非阻塞I/O操作
- **分页查询**：大数据集分页加载
- **压缩传输**：Gzip响应压缩

## 🐛 故障排除

### 常见问题

**Q: 服务器启动失败**
A: 检查端口3000是否被占用，使用`netstat -an | grep 3000`查看

**Q: API接口无响应**
A: 检查后端服务是否正常启动，查看控制台错误日志

**Q: 数据保存失败**
A: 检查data目录权限，确保应用有写入权限

**Q: 前端页面空白**
A: 检查浏览器控制台错误，确保静态文件路径正确

### 日志查看
```bash
# 查看实时日志
tail -f /var/log/novel-creation.log

# 查看错误日志
grep ERROR /var/log/novel-creation.log
```

## 📞 技术支持

- **文档更新**：定期更新API文档
- **版本管理**：语义化版本控制
- **社区支持**：GitHub Issues反馈
- **示例项目**：提供完整的使用案例

---

🎭 **开始您的创作之旅吧！**

这个完整的AI小说创作系统将为您提供专业级的创作工具，让每一个故事都能精彩呈现。