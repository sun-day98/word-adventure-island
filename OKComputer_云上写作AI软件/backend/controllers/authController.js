/**
 * 认证控制器
 * 处理用户注册、登录、认证等相关操作
 */

const User = require('../models/User');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

class AuthController {
  /**
   * 用户注册
   */
  async register(req, res) {
    try {
      const { username, email, password, displayName, bio } = req.body;

      // 验证必填字段
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名、邮箱和密码为必填项'
        });
      }

      // 验证输入格式
      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({
          success: false,
          message: '用户名长度必须在3-50个字符之间'
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码长度至少6个字符'
        });
      }

      // 检查用户名是否已存在
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 检查邮箱是否已存在
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: '邮箱已被注册'
        });
      }

      // 创建新用户
      const newUser = await User.create({
        username,
        email,
        password,
        displayName,
        bio
      });

      logger.info(`新用户注册成功: ${username} (${email})`);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.display_name,
          role: newUser.role,
          createdAt: newUser.created_at
        }
      });

    } catch (error) {
      logger.error('用户注册失败:', error);
      res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试'
      });
    }
  }

  /**
   * 用户登录
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码为必填项'
        });
      }

      const loginResult = await User.login(username, password);

      if (!loginResult) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      logger.info(`用户登录成功: ${loginResult.user.username}`);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: loginResult.user,
          token: loginResult.token,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      logger.error('用户登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试'
      });
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 获取用户统计信息
      const stats = await User.getStats(userId);

      res.json({
        success: true,
        data: {
          ...user,
          stats
        }
      });

    } catch (error) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // 如果要更新邮箱，检查是否已被使用
      if (updateData.email) {
        const existingEmail = await User.findByEmail(updateData.email);
        if (existingEmail && existingEmail.id !== userId) {
          return res.status(409).json({
            success: false,
            message: '该邮箱已被其他用户使用'
          });
        }
      }

      const updatedUser = await User.update(userId, updateData);

      logger.info(`用户信息更新成功: ${updatedUser.username}`);

      res.json({
        success: true,
        message: '更新成功',
        data: updatedUser
      });

    } catch (error) {
      logger.error('更新用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新失败，请稍后重试'
      });
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '当前密码和新密码为必填项'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '新密码长度至少6个字符'
        });
      }

      // 验证当前密码
      const user = await User.findById(userId);
      const loginResult = await User.login(user.username, currentPassword);

      if (!loginResult) {
        return res.status(400).json({
          success: false,
          message: '当前密码不正确'
        });
      }

      // 更新密码
      await User.updatePassword(userId, newPassword);

      logger.info(`用户密码修改成功: ${user.username}`);

      res.json({
        success: true,
        message: '密码修改成功'
      });

    } catch (error) {
      logger.error('修改密码失败:', error);
      res.status(500).json({
        success: false,
        message: '修改密码失败，请稍后重试'
      });
    }
  }

  /**
   * 用户登出
   */
  async logout(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (user) {
        logger.info(`用户登出: ${user.username}`);
      }

      // 在JWT方案中，客户端删除token即可
      // 这里可以做一些清理工作，比如记录登出时间等

      res.json({
        success: true,
        message: '登出成功'
      });

    } catch (error) {
      logger.error('用户登出失败:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 生成新的JWT令牌
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          token,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      logger.error('刷新令牌失败:', error);
      res.status(500).json({
        success: false,
        message: '刷新令牌失败'
      });
    }
  }

  /**
   * 验证令牌有效性
   */
  async verifyToken(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '令牌无效'
        });
      }

      res.json({
        success: true,
        message: '令牌有效',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error) {
      logger.error('验证令牌失败:', error);
      res.status(500).json({
        success: false,
        message: '验证令牌失败'
      });
    }
  }
}

module.exports = new AuthController();