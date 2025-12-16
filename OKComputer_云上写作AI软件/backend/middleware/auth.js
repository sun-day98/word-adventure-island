/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * 设置认证中间件
 * @param {express.Application} app Express应用
 * @param {mysql.Connection} dbConnection 数据库连接
 */
function setupAuthMiddleware(app, dbConnection) {
  // 用户注册接口
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email, nickname } = req.body;
      
      // 验证输入
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空'
        });
      }
      
      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 模拟用户注册（如果没有数据库连接）
      if (dbConnection) {
        // 使用数据库注册用户
        try {
          const insertSQL = `INSERT INTO user (username, password, email, nickname, role) VALUES (?, ?, ?, ?, ?)`;
          const [result] = await dbConnection.execute(insertSQL, [username, hashedPassword, email || null, nickname || username, 'user']);
          
          logger.info(`✅ 用户注册成功: ${username}`);
          res.json({
            code: 200,
            message: '注册成功',
            data: {
              id: result.insertId,
              username,
              nickname: nickname || username
            }
          });
        } catch (dbError) {
          if (dbError.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
              code: 400,
              message: '用户名已存在'
            });
          }
          throw dbError;
        }
      } else {
        // 模拟注册
        logger.info(`✅ 用户注册成功(模拟): ${username}`);
        res.json({
          code: 200,
          message: '注册成功',
          data: {
            id: Date.now(),
            username,
            nickname: nickname || username
          }
        });
      }
      
    } catch (error) {
      logger.error('❌ 用户注册失败:', error);
      res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  });
  
  // 用户登录接口
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 验证输入
      if (!username || !password) {
        return res.status(400).json({
          code: 400,
          message: '用户名和密码不能为空'
        });
      }
      
      let user;
      
      if (dbConnection) {
        // 使用数据库查询用户
        const selectSQL = `SELECT id, username, password, nickname, email, role, avatar FROM user WHERE username = ?`;
        const [rows] = await dbConnection.execute(selectSQL, [username]);
        
        if (rows.length === 0) {
          return res.status(401).json({
            code: 401,
            message: '用户名或密码错误'
          });
        }
        
        user = rows[0];
      } else {
        // 模拟用户验证
        user = {
          id: 1,
          username,
          password: await bcrypt.hash('123456', 10), // 模拟密码
          nickname: username,
          email: null,
          role: 'user',
          avatar: null
        };
      }
      
      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          code: 401,
          message: '用户名或密码错误'
        });
      }
      
      // 生成JWT令牌
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-jwt-secret-key',
        { expiresIn: '7d' }
      );
      
      // 更新最后登录时间
      if (dbConnection) {
        const updateSQL = `UPDATE user SET last_login_time = ? WHERE id = ?`;
        await dbConnection.execute(updateSQL, [new Date(), user.id]);
      }
      
      logger.info(`✅ 用户登录成功: ${username}`);
      
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            avatar: user.avatar
          }
        }
      });
      
    } catch (error) {
      logger.error('❌ 用户登录失败:', error);
      res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  });
  
  // JWT验证中间件
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失'
      });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({
          code: 403,
          message: '访问令牌无效或已过期'
        });
      }
      
      req.user = user;
      next();
    });
  };
  
  // 中间件：将用户信息添加到请求中
  const addUserToRequest = (req, res, next) => {
    if (req.user) {
      req.role = req.user.role;
      req.userId = req.user.userId;
      req.username = req.user.username;
    }
    next();
  };
  
  // 受保护的路由
  app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
      let user;
      
      if (dbConnection) {
        const selectSQL = `SELECT id, username, nickname, email, role, avatar, created_at FROM user WHERE id = ?`;
        const [rows] = await dbConnection.execute(selectSQL, [req.user.userId]);
        
        if (rows.length === 0) {
          return res.status(404).json({
            code: 404,
            message: '用户不存在'
          });
        }
        
        user = rows[0];
      } else {
        // 模拟用户数据
        user = {
          id: req.user.userId,
          username: req.user.username,
          nickname: req.user.username,
          email: null,
          role: req.user.role,
          avatar: null,
          created_at: new Date().toISOString()
        };
      }
      
      res.json({
        code: 200,
        message: '获取成功',
        data: user
      });
      
    } catch (error) {
      logger.error('❌ 获取用户信息失败:', error);
      res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  });
  
  // 管理员权限验证
  const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '需要管理员权限'
      });
    }
    next();
  };
  
  // 系统统计接口（仅管理员）
  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
      let userCount = 0, projectCount = 0, aiGenCount = 0;
      
      if (dbConnection) {
        // 获取用户总数
        const [userRows] = await dbConnection.execute('SELECT COUNT(*) as count FROM user');
        userCount = userRows[0].count;
        
        // 获取项目总数
        const [projectRows] = await dbConnection.execute('SELECT COUNT(*) as count FROM document_project');
        projectCount = projectRows[0].count;
        
        // 获取AI生成记录总数
        const [aiRows] = await dbConnection.execute('SELECT COUNT(*) as count FROM ai_writer_log');
        aiGenCount = aiRows[0].count;
      } else {
        // 模拟统计数据
        userCount = 100;
        projectCount = 500;
        aiGenCount = 1000;
      }
      
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          userCount,
          projectCount,
          aiGenerationCount: aiGenCount,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('❌ 获取系统统计失败:', error);
      res.status(500).json({
        code: 500,
        message: '服务器内部错误'
      });
    }
  });
  
  logger.info('✅ 认证中间件设置完成');
}

module.exports = {
  setupAuthMiddleware
};