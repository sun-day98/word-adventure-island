/**
 * AI助手模型
 * 处理AI生成内容相关的数据库操作
 */

const { executeQuery, executeTransaction } = require('../config/database');

class AIAssistant {
  constructor() {
    this.assistantsTable = 'ai_assistants';
    this.contentTable = 'ai_generated_content';
  }

  /**
   * 创建AI助手配置
   * @param {Object} assistantData - 助手数据
   * @returns {Promise<Object>} 创建的助手信息
   */
  async createAssistant(assistantData) {
    const { 
      userId, 
      projectId, 
      assistantType, 
      name, 
      configuration = {} 
    } = assistantData;
    
    const sql = `
      INSERT INTO ${this.assistantsTable} 
      (user_id, project_id, assistant_type, name, configuration)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [
      userId, projectId, assistantType, name, JSON.stringify(configuration)
    ]);
    
    return await this.getAssistantById(result.insertId);
  }

  /**
   * 获取AI助手详情
   * @param {number} assistantId - 助手ID
   * @returns {Promise<Object|null>} 助手信息
   */
  async getAssistantById(assistantId) {
    const sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM ${this.assistantsTable}
      WHERE id = ? AND is_active = TRUE
    `;
    
    const assistants = await executeQuery(global.dbConnection, sql, [assistantId]);
    
    if (!assistants[0]) {
      return null;
    }
    
    const assistant = assistants[0];
    if (assistant.configuration) {
      try {
        assistant.configuration = JSON.parse(assistant.configuration);
      } catch (e) {
        assistant.configuration = {};
      }
    }
    
    return assistant;
  }

  /**
   * 获取用户的AI助手列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 助手列表
   */
  async getUserAssistants(userId, options = {}) {
    const { projectId = null, assistantType = null, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM ${this.assistantsTable}
      WHERE user_id = ? AND is_active = TRUE
    `;
    const params = [userId];
    
    if (projectId) {
      sql += ` AND project_id = ?`;
      params.push(projectId);
    }
    
    if (assistantType) {
      sql += ` AND assistant_type = ?`;
      params.push(assistantType);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const assistants = await executeQuery(global.dbConnection, sql, params);
    
    return assistants.map(assistant => {
      if (assistant.configuration) {
        try {
          assistant.configuration = JSON.parse(assistant.configuration);
        } catch (e) {
          assistant.configuration = {};
        }
      }
      return assistant;
    });
  }

  /**
   * 更新AI助手
   * @param {number} assistantId - 助手ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的助手信息
   */
  async updateAssistant(assistantId, updateData) {
    const allowedFields = ['name', 'configuration', 'is_active'];
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        
        if (key === 'configuration' && typeof value === 'object') {
          updateValues.push(JSON.stringify(value));
        } else {
          updateValues.push(value);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return await this.getAssistantById(assistantId);
    }
    
    const sql = `
      UPDATE ${this.assistantsTable} 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    updateValues.push(assistantId);
    await executeQuery(global.dbConnection, sql, updateValues);
    
    return await this.getAssistantById(assistantId);
  }

  /**
   * 删除AI助手（软删除）
   * @param {number} assistantId - 助手ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteAssistant(assistantId) {
    const sql = `UPDATE ${this.assistantsTable} SET is_active = FALSE WHERE id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [assistantId]);
    return result.affectedRows > 0;
  }

  /**
   * 增加助手使用次数
   * @param {number} assistantId - 助手ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  async incrementUsage(assistantId) {
    const sql = `UPDATE ${this.assistantsTable} SET usage_count = usage_count + 1 WHERE id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [assistantId]);
    return result.affectedRows > 0;
  }

  /**
   * 记录AI生成内容
   * @param {Object} contentData - 内容数据
   * @returns {Promise<Object>} 创建的记录
   */
  async recordGeneratedContent(contentData) {
    const { 
      userId, 
      projectId, 
      assistantId, 
      contentType, 
      prompt, 
      generatedContent, 
      modelUsed = 'gpt-3.5-turbo',
      tokensUsed = 0,
      responseTime = 0
    } = contentData;
    
    const sql = `
      INSERT INTO ${this.contentTable} 
      (user_id, project_id, assistant_id, content_type, prompt, 
       generated_content, model_used, tokens_used, response_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [
      userId, projectId, assistantId, contentType, prompt, 
      generatedContent, modelUsed, tokensUsed, responseTime
    ]);
    
    // 增加助手使用次数
    if (assistantId) {
      await this.incrementUsage(assistantId);
    }
    
    return await this.getContentById(result.insertId);
  }

  /**
   * 获取生成内容详情
   * @param {number} contentId - 内容ID
   * @returns {Promise<Object|null>} 内容信息
   */
  async getContentById(contentId) {
    const sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM ${this.contentTable}
      WHERE id = ?
    `;
    
    const contents = await executeQuery(global.dbConnection, sql, [contentId]);
    return contents[0] || null;
  }

  /**
   * 获取用户的AI生成内容列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 内容列表
   */
  async getUserContent(userId, options = {}) {
    const { 
      projectId = null, 
      assistantId = null, 
      contentType = null,
      isUsed = null,
      page = 1, 
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM ${this.contentTable}
      WHERE user_id = ?
    `;
    const params = [userId];
    
    if (projectId) {
      sql += ` AND project_id = ?`;
      params.push(projectId);
    }
    
    if (assistantId) {
      sql += ` AND assistant_id = ?`;
      params.push(assistantId);
    }
    
    if (contentType) {
      sql += ` AND content_type = ?`;
      params.push(contentType);
    }
    
    if (isUsed !== null) {
      sql += ` AND is_used = ?`;
      params.push(isUsed);
    }
    
    sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await executeQuery(global.dbConnection, sql, params);
  }

  /**
   * 更新生成内容的反馈
   * @param {number} contentId - 内容ID
   * @param {Object} feedbackData - 反馈数据
   * @returns {Promise<Object|null>} 更新后的内容信息
   */
  async updateContentFeedback(contentId, feedbackData) {
    const { userFeedback, isUsed, qualityScore } = feedbackData;
    
    const updateFields = [];
    const updateValues = [];
    
    if (userFeedback !== undefined) {
      updateFields.push('user_feedback = ?');
      updateValues.push(userFeedback);
    }
    
    if (isUsed !== undefined) {
      updateFields.push('is_used = ?');
      updateValues.push(isUsed);
    }
    
    if (qualityScore !== undefined) {
      updateFields.push('quality_score = ?');
      updateValues.push(qualityScore);
    }
    
    if (updateFields.length === 0) {
      return await this.getContentById(contentId);
    }
    
    const sql = `
      UPDATE ${this.contentTable} 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    updateValues.push(contentId);
    await executeQuery(global.dbConnection, sql, updateValues);
    
    return await this.getContentById(contentId);
  }

  /**
   * 获取AI使用统计
   * @param {number} userId - 用户ID
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>} 统计信息
   */
  async getUsageStats(userId, options = {}) {
    const { 
      startDate = null, 
      endDate = null, 
      projectId = null,
      assistantId = null 
    } = options;
    
    let sql = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens,
        AVG(response_time) as avg_response_time,
        COUNT(CASE WHEN user_feedback = 'like' THEN 1 END) as liked_count,
        COUNT(CASE WHEN user_feedback = 'dislike' THEN 1 END) as disliked_count,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_count,
        AVG(quality_score) as avg_quality_score,
        COUNT(DISTINCT assistant_id) as unique_assistants_used,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM ${this.contentTable}
      WHERE user_id = ?
    `;
    const params = [userId];
    
    if (startDate) {
      sql += ` AND created_at >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND created_at <= ?`;
      params.push(endDate);
    }
    
    if (projectId) {
      sql += ` AND project_id = ?`;
      params.push(projectId);
    }
    
    if (assistantId) {
      sql += ` AND assistant_id = ?`;
      params.push(assistantId);
    }
    
    const result = await executeQuery(global.dbConnection, sql, params);
    const stats = result[0] || {};
    
    // 转换为合适的格式
    Object.keys(stats).forEach(key => {
      if (stats[key] === null) {
        if (key.includes('count') || key.includes('requests') || key.includes('tokens')) {
          stats[key] = 0;
        } else if (key.includes('avg')) {
          stats[key] = 0.0;
        } else {
          stats[key] = null;
        }
      }
    });
    
    return stats;
  }

  /**
   * 获取每日使用统计
   * @param {number} userId - 用户ID
   * @param {number} days - 天数
   * @returns {Promise<Array>} 每日统计
   */
  async getDailyUsageStats(userId, days = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests_count,
        SUM(tokens_used) as tokens_used,
        AVG(response_time) as avg_response_time,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_count
      FROM ${this.contentTable}
      WHERE user_id = ? 
        AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    return await executeQuery(global.dbConnection, sql, [userId, days]);
  }

  /**
   * 获取热门内容类型
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 热门内容类型
   */
  async getPopularContentTypes(userId, limit = 10) {
    const sql = `
      SELECT 
        content_type,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_count,
        AVG(quality_score) as avg_quality
      FROM ${this.contentTable}
      WHERE user_id = ?
      GROUP BY content_type
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    
    return await executeQuery(global.dbConnection, sql, [userId, limit]);
  }

  /**
   * 获取助手性能统计
   * @param {number} assistantId - 助手ID
   * @returns {Promise<Object>} 助手性能统计
   */
  async getAssistantPerformanceStats(assistantId) {
    const sql = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(tokens_used) as total_tokens,
        AVG(response_time) as avg_response_time,
        COUNT(CASE WHEN user_feedback = 'like' THEN 1 END) as liked_count,
        COUNT(CASE WHEN user_feedback = 'dislike' THEN 1 END) as disliked_count,
        COUNT(CASE WHEN is_used = TRUE THEN 1 END) as used_count,
        AVG(quality_score) as avg_quality_score,
        COUNT(DISTINCT user_id) as unique_users
      FROM ${this.contentTable}
      WHERE assistant_id = ?
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [assistantId]);
    return result[0] || {};
  }

  /**
   * 清理旧的生成内容记录
   * @param {number} daysOld - 保留天数
   * @returns {Promise<number>} 删除的记录数
   */
  async cleanupOldContent(daysOld = 90) {
    const sql = `
      DELETE FROM ${this.contentTable}
      WHERE created_at < DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
        AND is_used = FALSE
        AND user_feedback IS NULL
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [daysOld]);
    return result.affectedRows;
  }
}

module.exports = new AIAssistant();