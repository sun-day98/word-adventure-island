/**
 * 用户模型
 * 处理用户相关的数据库操作
 */

const { executeQuery, executeTransaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  constructor() {
    this.tableName = 'users';
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 创建的用户信息
   */
  async create(userData) {
    const { username, email, password, displayName, bio } = userData;
    
    // 密码加密
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const sql = `
      INSERT INTO ${this.tableName} 
      (username, email, password_hash, display_name, bio) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [
      username, email, passwordHash, displayName || username, bio
    ]);
    
    return await this.findById(result.insertId);
  }

  /**
   * 根据ID查找用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 用户信息
   */
  async findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? AND status = 'active'`;
    const users = await executeQuery(global.dbConnection, sql, [id]);
    return users[0] || null;
  }

  /**
   * 根据用户名查找用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByUsername(username) {
    const sql = `SELECT * FROM ${this.tableName} WHERE username = ?`;
    const users = await executeQuery(global.dbConnection, sql, [username]);
    return users[0] || null;
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 用户信息
   */
  async findByEmail(email) {
    const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
    const users = await executeQuery(global.dbConnection, sql, [email]);
    return users[0] || null;
  }

  /**
   * 用户登录验证
   * @param {string} username - 用户名或邮箱
   * @param {string} password - 密码
   * @returns {Promise<Object|null>} 登录结果
   */
  async login(username, password) {
    // 查找用户（支持用户名或邮箱登录）
    const sql = `SELECT * FROM ${this.tableName} WHERE (username = ? OR email = ?) AND status = 'active'`;
    const users = await executeQuery(global.dbConnection, sql, [username, username]);
    
    if (!users[0]) {
      return null;
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    // 更新最后登录时间
    await this.updateLastLogin(user.id);
    
    // 生成JWT令牌
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
    
    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的用户信息
   */
  async update(id, updateData) {
    const allowedFields = ['display_name', 'email', 'bio', 'avatar_url', 'settings'];
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      return await this.findById(id);
    }
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    updateValues.push(id);
    await executeQuery(global.dbConnection, sql, updateValues);
    
    return await this.findById(id);
  }

  /**
   * 更新密码
   * @param {number} id - 用户ID
   * @param {string} newPassword - 新密码
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const sql = `UPDATE ${this.tableName} SET password_hash = ? WHERE id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [passwordHash, id]);
    
    return result.affectedRows > 0;
  }

  /**
   * 更新最后登录时间
   * @param {number} id - 用户ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateLastLogin(id) {
    const sql = `UPDATE ${this.tableName} SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Promise<Object|null>} 解码后的用户信息
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await this.findById(decoded.userId);
      
      if (!user) {
        return null;
      }
      
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取用户列表（管理员功能）
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 用户列表
   */
  async getList(options = {}) {
    const { page = 1, limit = 20, status = 'active', role = null } = options;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT id, username, email, display_name, role, status, 
             created_at, last_login_at
      FROM ${this.tableName}
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await executeQuery(global.dbConnection, sql, params);
  }

  /**
   * 获取用户统计信息
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 用户统计信息
   */
  async getStats(id) {
    const sql = `
      SELECT 
        COUNT(wp.id) as total_projects,
        SUM(wp.word_count) as total_words,
        COUNT(CASE WHEN wp.status = 'completed' THEN 1 END) as completed_projects,
        MAX(wp.updated_at) as last_project_update,
        (SELECT COUNT(*) FROM ai_generated_content WHERE user_id = ?) as ai_requests_count
      FROM users u
      LEFT JOIN writing_projects wp ON u.id = wp.user_id
      WHERE u.id = ?
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [id, id]);
    return result[0] || {
      total_projects: 0,
      total_words: 0,
      completed_projects: 0,
      last_project_update: null,
      ai_requests_count: 0
    };
  }

  /**
   * 删除用户（软删除）
   * @param {number} id - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    const sql = `UPDATE ${this.tableName} SET status = 'inactive' WHERE id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new User();