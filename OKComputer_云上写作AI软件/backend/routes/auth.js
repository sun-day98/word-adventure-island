/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

// 获取当前用户信息 (需要认证)
router.get('/me', authenticateToken, authController.getCurrentUser);

// 更新用户信息 (需要认证)
router.put('/me', authenticateToken, authController.updateUser);

// 修改密码 (需要认证)
router.put('/password', authenticateToken, authController.changePassword);

// 用户登出 (需要认证)
router.post('/logout', authenticateToken, authController.logout);

// 刷新令牌 (需要认证)
router.post('/refresh', authenticateToken, authController.refreshToken);

// 验证令牌有效性 (需要认证)
router.get('/verify', authenticateToken, authController.verifyToken);

module.exports = router;