/**
 * APIJSON配置文件
 * 详细的APIJSON功能配置和权限设置
 */

module.exports = {
  // APIJSON服务器配置
  server: {
    debug: process.env.NODE_ENV !== 'production',
    defaultRole: 'user',
    md5Key: process.env.MD5_KEY || 'your-md5-key-here',
    tokenExpireTime: 7 * 24 * 60 * 60 * 1000, // 7天
    salt: process.env.PASSWORD_SALT || 'your-salt-here',
    
    // 接口配置
    api: {
      version: 'v1',
      baseUrl: '/v1',
      docUrl: '/v1/doc'
    }
  },
  
  // 数据库配置
  database: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ai_writing_db',
    charset: 'utf8mb4',
    timezone: '+08:00',
    
    // 连接池配置
    pool: {
      min: 5,
      max: 20,
      acquire: 60000,
      idle: 30000
    }
  },
  
  // 安全配置
  security: {
    enableVerify: true,
    verifyLogin: true,
    verifyAdmin: true,
    verifyContent: true,
    contentMaxLength: 10000,
    
    // JWT配置
    jwt: {
      secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
      expiresIn: '7d',
      algorithm: 'HS256'
    },
    
    // 密码配置
    password: {
      minLength: 6,
      maxLength: 50,
      saltRounds: 10
    }
  },
  
  // 权限配置
  permissions: {
    // 用户角色权限
    roles: {
      admin: {
        canAccessAll: true,
        canDeleteAnyUser: true,
        canModifySystemConfig: true,
        canViewAllData: true
      },
      user: {
        canAccessOwn: true,
        canCreateProject: true,
        canModifyOwnProject: true,
        canDeleteOwnProject: true,
        maxProjects: 100,
        maxDailyWords: 10000,
        maxDailyAIRequests: 50
      },
      guest: {
        canViewPublic: true,
        maxProjects: 5,
        maxDailyWords: 1000,
        maxDailyAIRequests: 10
      }
    },
    
    // 表级权限
    tables: {
      user: {
        read: ['admin', 'self'],
        write: ['admin', 'self'],
        delete: ['admin']
      },
      document_project: {
        read: ['admin', 'owner'],
        write: ['admin', 'owner'],
        delete: ['admin', 'owner']
      },
      document_content: {
        read: ['admin', 'owner'],
        write: ['admin', 'owner'],
        delete: ['admin', 'owner']
      },
      ai_writer_log: {
        read: ['admin', 'owner'],
        write: ['admin', 'system'],
        delete: ['admin']
      },
      writing_statistics: {
        read: ['admin', 'owner'],
        write: ['admin', 'system'],
        delete: ['admin']
      },
      system_config: {
        read: ['admin'],
        write: ['admin'],
        delete: ['admin']
      }
    }
  },
  
  // 业务规则配置
  businessRules: {
    // 项目配置
    project: {
      maxTitleLength: 200,
      maxDescriptionLength: 1000,
      allowedGenres: ['fantasy', 'romance', 'urban', 'scifi', 'historical'],
      allowedTypes: ['novel', 'essay', 'blog', 'report', 'thesis'],
      allowedStatus: ['draft', 'writing', 'completed', 'archived']
    },
    
    // AI-Writer配置
    aiWriter: {
      maxContentLength: parseInt(process.env.AI_WRITER_MAX_LENGTH) || 1000,
      defaultTemperature: parseFloat(process.env.AI_WRITER_TEMPERATURE) || 0.8,
      maxDailyRequests: 50,
      minPromptLength: 10,
      maxPromptLength: 1000,
      allowedGenres: ['fantasy', 'romance', 'urban', 'scifi', 'historical'],
      allowedModes: ['continuation', 'inspiration', 'dialogue', 'description', 'climax']
    },
    
    // 统计配置
    statistics: {
      retentionDays: 365, // 保留统计数据的时长
      aggregationPeriod: 'daily', // 统计聚合周期：daily, weekly, monthly
      autoCleanup: true // 自动清理过期数据
    }
  },
  
  // 缓存配置
  cache: {
    redis: {
      enabled: !!process.env.REDIS_HOST,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: 0,
      keyPrefix: 'ai_writing:',
      ttl: 3600 // 1小时
    },
    
    // 本地缓存配置
    local: {
      enabled: true,
      maxSize: 100, // 最大缓存条目数
      ttl: 300 // 5分钟
    }
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_FILE_PATH || 'logs/',
    maxFiles: 10,
    maxSize: '10m',
    datePattern: 'YYYY-MM-DD',
    
    // 请求日志
    request: {
      enabled: true,
      includeHeaders: false,
      includeBody: false,
      excludePaths: ['/health', '/v1/doc']
    },
    
    // 错误日志
    error: {
      enabled: true,
      includeStack: process.env.NODE_ENV !== 'production'
    }
  },
  
  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    
    // 不同端点的特殊限流
    endpoints: {
      '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 登录限流
      '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 注册限流
      '/v1/ai_writer_log': { maxRequests: 50, windowMs: 60 * 60 * 1000 } // AI生成限流
    }
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    avatar: {
      maxWidth: 200,
      maxHeight: 200,
      quality: 80
    }
  },
  
  // CORS配置
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Token'],
    maxAge: 86400 // 24小时
  }
};