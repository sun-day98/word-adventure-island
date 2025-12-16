/**
 * AI写作软件后端服务 - 基于Express框架
 * 提供用户管理、文档存储、AI-Writer数据管理等核心功能
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 创建必要的目录
const requiredDirs = ['logs', 'uploads'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../' + dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 创建目录: ${dirPath}`);
  }
});

const { createDatabaseConnection } = require('./config/database');
const { setupLogger } = require('./utils/logger');
const { registerCustomFunctions } = require('./functions/custom-functions');
const { setupAuthMiddleware } = require('./middleware/auth');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 设置日志
const logger = setupLogger();

// 基础中间件配置
app.use(helmet()); // 安全头
app.use(compression()); // 压缩响应
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // 日志记录

// CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Token']
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 限制每个IP的请求次数
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date().toISOString()
  }
});
app.use('/v1/', limiter);

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_writing_db',
  charset: 'utf8mb4'
};

// 初始化数据库连接
async function initializeDatabase() {
  try {
    logger.info('🚀 正在初始化数据库连接...');
    
    // 连接数据库
    const connection = await createDatabaseConnection(dbConfig);
    logger.info('✅ 数据库连接成功');
    
    // 创建数据库表结构
    await createTables(connection);
    logger.info('✅ 数据库表结构创建完成');
    
    return connection;
    
  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error);
    // 如果没有数据库配置，创建内存数据库模拟
    logger.warn('⚠️ 使用内存存储模式（未配置数据库）');
    return null;
  }
}

// 创建数据库表结构
async function createTables(connection) {
  const tables = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS user (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
      password VARCHAR(100) NOT NULL COMMENT '密码',
      email VARCHAR(100) UNIQUE COMMENT '邮箱',
      nickname VARCHAR(50) COMMENT '昵称',
      avatar VARCHAR(500) COMMENT '头像URL',
      gender TINYINT DEFAULT 0 COMMENT '性别:0未知,1男,2女',
      birthday DATE COMMENT '生日',
      role ENUM('admin', 'user', 'guest') DEFAULT 'user' COMMENT '角色',
      status TINYINT DEFAULT 1 COMMENT '状态:0禁用,1正常',
      last_login_time DATETIME COMMENT '最后登录时间',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      tag_count INT DEFAULT 0 COMMENT '标签数量',
      picture_count INT DEFAULT 0 COMMENT '图片数量',
      comment_count INT DEFAULT 0 COMMENT '评论数量'
    ) COMMENT '用户表'`,
    
    // 文档项目表
    `CREATE TABLE IF NOT EXISTS document_project (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL COMMENT '用户ID',
      title VARCHAR(200) NOT NULL COMMENT '项目标题',
      description TEXT COMMENT '项目描述',
      genre VARCHAR(20) DEFAULT 'fantasy' COMMENT '题材: fantasy, romance, urban, scifi, historical',
      type VARCHAR(50) DEFAULT 'novel' COMMENT '类型: novel, essay, blog, report',
      status ENUM('draft', 'writing', 'completed', 'archived') DEFAULT 'draft' COMMENT '状态',
      word_count INT DEFAULT 0 COMMENT '字数',
      target_word_count INT DEFAULT 0 COMMENT '目标字数',
      writing_days INT DEFAULT 0 COMMENT '写作天数',
      total_time INT DEFAULT 0 COMMENT '总写作时间(分钟)',
      tags JSON COMMENT '标签列表',
      settings JSON COMMENT '项目设置',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    ) COMMENT '文档项目表'`,
    
    // 文档内容表
    `CREATE TABLE IF NOT EXISTS document_content (
      id INT PRIMARY KEY AUTO_INCREMENT,
      project_id INT NOT NULL COMMENT '项目ID',
      version INT DEFAULT 1 COMMENT '版本号',
      title VARCHAR(200) COMMENT '章节标题',
      content LONGTEXT COMMENT '内容',
      summary TEXT COMMENT '摘要',
      word_count INT DEFAULT 0 COMMENT '字数',
      auto_save TINYINT DEFAULT 1 COMMENT '是否自动保存',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES document_project(id) ON DELETE CASCADE
    ) COMMENT '文档内容表'`,
    
    // AI-Writer生成记录表
    `CREATE TABLE IF NOT EXISTS ai_writer_log (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL COMMENT '用户ID',
      project_id INT COMMENT '项目ID',
      genre VARCHAR(20) NOT NULL COMMENT '题材',
      generation_mode VARCHAR(20) NOT NULL COMMENT '生成模式',
      prompt TEXT COMMENT '输入提示',
      generated_content LONGTEXT COMMENT '生成内容',
      content_length INT DEFAULT 0 COMMENT '内容长度',
      generation_time DECIMAL(5,2) COMMENT '生成耗时(秒)',
      quality_score VARCHAR(20) COMMENT '质量评分',
      applied TINYINT DEFAULT 0 COMMENT '是否应用到文档',
      feedback_score TINYINT COMMENT '用户反馈评分1-5',
      feedback_comment TEXT COMMENT '用户反馈评论',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES document_project(id) ON DELETE SET NULL
    ) COMMENT 'AI-Writer生成记录表'`,
    
    // 写作统计表
    `CREATE TABLE IF NOT EXISTS writing_statistics (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL COMMENT '用户ID',
      project_id INT COMMENT '项目ID',
      stat_date DATE NOT NULL COMMENT '统计日期',
      word_count INT DEFAULT 0 COMMENT '当日字数',
      writing_time INT DEFAULT 0 COMMENT '写作时间(分钟)',
      session_count INT DEFAULT 0 COMMENT '写作会话次数',
      ai_generation_count INT DEFAULT 0 COMMENT 'AI生成次数',
      genre_distribution JSON COMMENT '题材分布',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES document_project(id) ON DELETE SET NULL,
      UNIQUE KEY unique_user_project_date (user_id, project_id, stat_date)
    ) COMMENT '写作统计表'`,
    
    // 系统配置表
    `CREATE TABLE IF NOT EXISTS system_config (
      id INT PRIMARY KEY AUTO_INCREMENT,
      config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
      config_value TEXT COMMENT '配置值',
      description TEXT COMMENT '描述',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT '系统配置表'`
  ];
  
  for (const sql of tables) {
    await connection.execute(sql);
  }
  
  // 插入默认配置
  const defaultConfigs = [
    ['ai_writer_max_length', '1000', 'AI-Writer最大生成字数'],
    ['ai_writer_temperature', '0.8', 'AI-Writer生成温度参数'],
    ['max_project_count', '100', '用户最大项目数量'],
    ['max_word_count_per_day', '10000', '每日最大字数限制']
  ];
  
  for (const [key, value, desc] of defaultConfigs) {
    const insertSQL = `INSERT IGNORE INTO system_config (config_key, config_value, description) VALUES (?, ?, ?)`;
    await connection.execute(insertSQL, [key, value, desc]);
  }
}

// 主服务器启动函数
async function startServer() {
  try {
    logger.info('🔧 正在启动AI写作后端服务...');
    
    // 初始化数据库
    const dbConnection = await initializeDatabase();
    
    // 设置认证中间件
    setupAuthMiddleware(app, dbConnection);
    
    // 设置自定义API路由
    setupAPIRoutes(app, dbConnection);
    
    // 健康检查接口
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        framework: 'Express'
      });
    });
    
    // 根路径接口
    app.get('/', (req, res) => {
      res.json({
        name: 'AI Writing Backend',
        version: '1.0.0',
        status: 'running',
        message: '欢迎使用AI写作软件后端服务！',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: '/v1',
          docs: '/api/info'
        }
      });
    });

    // API信息接口
    app.get('/api/info', (req, res) => {
      res.json({
        name: 'AI Writing Backend',
        version: '1.0.0',
        framework: 'Express',
        features: [
          '用户管理',
          '文档存储',
          'AI-Writer集成',
          '数据统计',
          '权限控制'
        ],
        endpoints: {
          api: '/v1',
          health: '/health',
          docs: '/api/info'
        }
      });
    });
    
    // 错误处理中间件
    app.use((error, req, res, next) => {
      logger.error('❌ 服务器错误:', error);
      res.status(500).json({
        code: 500,
        message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    // 404处理
    app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: '接口不存在',
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });
    
    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`🎉 服务器启动成功!`);
      logger.info(`📍 服务地址: http://localhost:${PORT}`);
      logger.info(`📚 API文档: http://localhost:${PORT}/v1/doc`);
      logger.info(`🏥 健康检查: http://localhost:${PORT}/health`);
      logger.info(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 设置API路由
function setupAPIRoutes(app, dbConnection) {
  const router = express.Router();
  
  // 用户相关路由
  router.post('/auth/register', async (req, res) => {
    try {
      const { username, password, email } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空'
        });
      }
      
      // 简单的模拟注册（实际应该有密码加密和数据库操作）
      logger.info(`用户注册: ${username}`);
      
      res.json({
        code: 200,
        message: '注册成功',
        data: {
          id: Date.now(),
          username,
          email,
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('注册失败:', error);
      res.status(500).json({
        code: 500,
        message: '注册失败'
      });
    }
  });
  
  router.post('/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空'
        });
      }
      
      // 简单的模拟登录
      logger.info(`用户登录: ${username}`);
      
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          token: 'mock-token-' + Date.now(),
          user: {
            id: 1,
            username,
            nickname: username,
            role: 'user'
          }
        }
      });
    } catch (error) {
      logger.error('登录失败:', error);
      res.status(500).json({
        code: 500,
        message: '登录失败'
      });
    }
  });
  
  // 文档相关路由
  router.get('/documents', async (req, res) => {
    try {
      // 模拟返回文档列表
      res.json({
        code: 200,
        message: '获取成功',
        data: [
          {
            id: 1,
            title: '示例文档',
            content: '这是一个示例文档内容...',
            genre: 'fantasy',
            status: 'draft',
            word_count: 1000,
            created_at: new Date().toISOString()
          }
        ]
      });
    } catch (error) {
      logger.error('获取文档失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取文档失败'
      });
    }
  });
  
  router.post('/documents', async (req, res) => {
    try {
      const { title, content, genre } = req.body;
      
      if (!title) {
        return res.status(400).json({
          code: 400,
          message: '标题不能为空'
        });
      }
      
      // 模拟创建文档
      const docId = Date.now();
      logger.info(`创建文档: ${title}`);
      
      res.json({
        code: 200,
        message: '创建成功',
        data: {
          id: docId,
          title,
          content: content || '',
          genre: genre || 'fantasy',
          status: 'draft',
          word_count: (content || '').length,
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('创建文档失败:', error);
      res.status(500).json({
        code: 500,
        message: '创建文档失败'
      });
    }
  });
  
  // AI-Writer相关路由
  router.post('/ai-writer/generate', async (req, res) => {
    try {
      const { genre, mode, prompt } = req.body;
      
      if (!genre || !mode || !prompt) {
        return res.status(400).json({
          code: 400,
          message: '参数不能为空'
        });
      }
      
      logger.info(`AI生成请求: ${genre} - ${mode}`);
      
      // 模拟AI生成
      const generatedContent = generateMockContent(genre, mode, prompt);
      
      res.json({
        code: 200,
        message: '生成成功',
        data: {
          id: Date.now(),
          genre,
          mode,
          prompt,
          generated_content: generatedContent,
          content_length: generatedContent.length,
          generation_time: 1.5,
          quality_score: 'good',
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('AI生成失败:', error);
      res.status(500).json({
        code: 500,
        message: 'AI生成失败'
      });
    }
  });
  
  // 挂载路由
  app.use('/v1', router);
}

// 模拟AI内容生成
function generateMockContent(genre, mode, prompt) {
  const templates = {
    fantasy: {
      continuation: `在古老的魔法大陆上，${prompt}。突然，一道耀眼的光芒划破天际，神秘的力量开始觉醒...`,
      inspiration: `灵感提示：${prompt}。或许可以想到一个隐藏的魔法遗迹，一个失落的咒语，或者一个古老的神器...`,
      dialogue: `主角深吸一口气，对身旁的同伴说："关于${prompt}，我有一个重要的发现..."`,
      description: `眼前的景象令人震撼：${prompt}。空气中弥漫着魔法的气息，远处传来龙的咆哮...`,
      climax: `在最关键的时刻，${prompt}！整个世界的命运都系于此举...`
    },
    romance: {
      continuation: `雨后的花园里，${prompt}。她的心跳如小鹿乱撞，期待着那个熟悉的身影...`,
      inspiration: `浪漫构思：${prompt}。也许是一场意外邂逅，一个深情的告白，或是一个难忘的约定...`,
      dialogue: `他温柔地凝视着她，轻声说道："关于${prompt}，我想对你说..."`,
      description: `夕阳西下，${prompt}。微风吹过，带来了花香和对未来的憧憬...`,
      climax: `在这一刻，${prompt}！所有的误会都烟消云散，只剩下彼此真挚的情感...`
    }
  };
  
  const defaultTemplates = {
    continuation: `${prompt}。故事继续发展，新的情节即将展开...`,
    inspiration: `创作灵感：${prompt}。可以考虑不同的角度和可能性...`,
    dialogue: `角色思考着"${prompt}"，然后开口说道...`,
    description: `详细的描写：${prompt}。周围的环境细节丰富，氛围浓厚...`,
    climax: `高潮来临：${prompt}！这是故事的关键时刻...`
  };
  
  const genreTemplates = templates[genre] || defaultTemplates;
  return genreTemplates[mode] || `${prompt}...（生成内容）`;
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('📴 收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('📴 收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer().catch(error => {
  logger.error('❌ 启动过程中发生致命错误:', error);
  process.exit(1);
});