/**
 * 写作项目模型
 * 处理写作项目相关的数据库操作
 */

const { executeQuery, executeTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class WritingProject {
  constructor() {
    this.tableName = 'writing_projects';
  }

  /**
   * 创建新项目
   * @param {Object} projectData - 项目数据
   * @returns {Promise<Object>} 创建的项目信息
   */
  async create(projectData) {
    const { 
      userId, 
      title, 
      description, 
      genre, 
      category = 'novel',
      tags = [],
      metadata = {}
    } = projectData;
    
    const projectId = uuidv4();
    
    const sql = `
      INSERT INTO ${this.tableName} 
      (id, user_id, title, description, genre, category, tags, metadata) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(global.dbConnection, sql, [
      projectId, userId, title, description, genre, category,
      JSON.stringify(tags), JSON.stringify(metadata)
    ]);
    
    return await this.findById(projectId);
  }

  /**
   * 根据ID查找项目
   * @param {string} id - 项目ID
   * @returns {Promise<Object|null>} 项目信息
   */
  async findById(id) {
    const sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM ${this.tableName} 
      WHERE id = ?
    `;
    
    const projects = await executeQuery(global.dbConnection, sql, [id]);
    
    if (!projects[0]) {
      return null;
    }
    
    // 解析JSON字段
    const project = projects[0];
    if (project.tags) {
      try {
        project.tags = JSON.parse(project.tags);
      } catch (e) {
        project.tags = [];
      }
    }
    if (project.metadata) {
      try {
        project.metadata = JSON.parse(project.metadata);
      } catch (e) {
        project.metadata = {};
      }
    }
    
    return project;
  }

  /**
   * 获取用户的项目列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 项目列表
   */
  async getUserProjects(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status = null, 
      genre = null, 
      category = null,
      sortBy = 'updated_at',
      sortOrder = 'DESC'
    } = options;
    
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM ${this.tableName}
      WHERE user_id = ?
    `;
    const params = [userId];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    if (genre) {
      sql += ` AND genre = ?`;
      params.push(genre);
    }
    
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    
    sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const projects = await executeQuery(global.dbConnection, sql, params);
    
    // 解析JSON字段
    return projects.map(project => {
      if (project.tags) {
        try {
          project.tags = JSON.parse(project.tags);
        } catch (e) {
          project.tags = [];
        }
      }
      if (project.metadata) {
        try {
          project.metadata = JSON.parse(project.metadata);
        } catch (e) {
          project.metadata = {};
        }
      }
      return project;
    });
  }

  /**
   * 更新项目信息
   * @param {string} id - 项目ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的项目信息
   */
  async update(id, updateData) {
    const allowedFields = [
      'title', 'description', 'genre', 'category', 'status', 
      'cover_image', 'tags', 'metadata', 'is_public', 
      'word_count', 'char_count', 'reading_time'
    ];
    
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        
        // JSON字段需要字符串化
        if (['tags', 'metadata'].includes(key) && typeof value === 'object') {
          updateValues.push(JSON.stringify(value));
        } else {
          updateValues.push(value);
        }
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
   * 更新项目字数统计
   * @param {string} id - 项目ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateWordCount(id) {
    const sql = `
      UPDATE ${this.tableName} wp
      SET 
        word_count = (
          SELECT COALESCE(SUM(word_count), 0) 
          FROM documents 
          WHERE project_id = ? AND is_deleted = FALSE
        ),
        char_count = (
          SELECT COALESCE(SUM(char_count), 0) 
          FROM documents 
          WHERE project_id = ? AND is_deleted = FALSE
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [id, id, id]);
    return result.affectedRows > 0;
  }

  /**
   * 删除项目（物理删除）
   * @param {string} id - 项目ID
   * @param {number} userId - 用户ID（验证权限）
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id, userId) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ? AND user_id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * 复制项目
   * @param {string} id - 原项目ID
   * @param {number} userId - 用户ID
   * @param {string} newTitle - 新项目标题
   * @returns {Promise<Object|null>} 新项目信息
   */
  async duplicate(id, userId, newTitle) {
    const originalProject = await this.findById(id);
    
    if (!originalProject || originalProject.user_id !== userId) {
      return null;
    }
    
    const newProjectData = {
      userId,
      title: newTitle,
      description: originalProject.description,
      genre: originalProject.genre,
      category: originalProject.category,
      tags: originalProject.tags,
      metadata: { ...originalProject.metadata, duplicated_from: id }
    };
    
    const newProject = await this.create(newProjectData);
    
    // 复制文档内容
    const documents = await this.getProjectDocuments(id);
    for (const doc of documents) {
      await this.createDocument(newProject.id, {
        title: doc.title,
        content: doc.content,
        content_type: doc.content_type,
        order_index: doc.order_index,
        parent_id: null
      });
    }
    
    return newProject;
  }

  /**
   * 获取项目文档
   * @param {string} projectId - 项目ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 文档列表
   */
  async getProjectDocuments(projectId, options = {}) {
    const { contentType = null, includeDeleted = false } = options;
    
    let sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM documents
      WHERE project_id = ?
    `;
    const params = [projectId];
    
    if (contentType) {
      sql += ` AND content_type = ?`;
      params.push(contentType);
    }
    
    if (!includeDeleted) {
      sql += ` AND is_deleted = FALSE`;
    }
    
    sql += ` ORDER BY order_index ASC, created_at ASC`;
    
    return await executeQuery(global.dbConnection, sql, params);
  }

  /**
   * 创建项目文档
   * @param {string} projectId - 项目ID
   * @param {Object} documentData - 文档数据
   * @returns {Promise<Object>} 创建的文档信息
   */
  async createDocument(projectId, documentData) {
    const { 
      title, 
      content = '', 
      content_type = 'chapter', 
      order_index = 0, 
      parent_id = null 
    } = documentData;
    
    const wordCount = content ? content.length : 0;
    const charCount = content ? content.replace(/\s/g, '').length : 0;
    
    const sql = `
      INSERT INTO documents 
      (project_id, title, content, content_type, order_index, parent_id, word_count, char_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [
      projectId, title, content, content_type, order_index, parent_id, wordCount, charCount
    ]);
    
    // 更新项目字数统计
    await this.updateWordCount(projectId);
    
    return await this.getDocumentById(result.insertId);
  }

  /**
   * 获取文档详情
   * @param {number} documentId - 文档ID
   * @returns {Promise<Object|null>} 文档信息
   */
  async getDocumentById(documentId) {
    const sql = `
      SELECT *, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at
      FROM documents
      WHERE id = ? AND is_deleted = FALSE
    `;
    
    const documents = await executeQuery(global.dbConnection, sql, [documentId]);
    return documents[0] || null;
  }

  /**
   * 更新文档
   * @param {number} documentId - 文档ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的文档信息
   */
  async updateDocument(documentId, updateData) {
    const allowedFields = ['title', 'content', 'content_type', 'order_index', 'parent_id'];
    const updateFields = [];
    const updateValues = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }
    
    // 如果更新了内容，重新计算字数
    if (updateData.content !== undefined) {
      const content = updateData.content || '';
      const wordCount = content.length;
      const charCount = content.replace(/\s/g, '').length;
      
      updateFields.push('word_count = ?');
      updateFields.push('char_count = ?');
      updateValues.push(wordCount, charCount);
    }
    
    if (updateFields.length > 0) {
      const sql = `
        UPDATE documents 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      
      updateValues.push(documentId);
      await executeQuery(global.dbConnection, sql, updateValues);
      
      // 获取文档所属项目ID并更新项目统计
      const doc = await this.getDocumentById(documentId);
      if (doc) {
        await this.updateWordCount(doc.project_id);
      }
    }
    
    return await this.getDocumentById(documentId);
  }

  /**
   * 删除文档（软删除）
   * @param {number} documentId - 文档ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteDocument(documentId) {
    const doc = await this.getDocumentById(documentId);
    if (!doc) {
      return false;
    }
    
    const sql = `UPDATE documents SET is_deleted = TRUE WHERE id = ?`;
    const result = await executeQuery(global.dbConnection, sql, [documentId]);
    
    if (result.affectedRows > 0) {
      await this.updateWordCount(doc.project_id);
    }
    
    return result.affectedRows > 0;
  }

  /**
   * 获取项目统计信息
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 项目统计信息
   */
  async getProjectStats(projectId) {
    const sql = `
      SELECT 
        COUNT(*) as total_documents,
        SUM(word_count) as total_words,
        SUM(char_count) as total_chars,
        COUNT(CASE WHEN content_type = 'chapter' THEN 1 END) as chapters,
        COUNT(CASE WHEN content_type = 'outline' THEN 1 END) as outlines,
        COUNT(CASE WHEN content_type = 'note' THEN 1 END) as notes,
        MAX(updated_at) as last_updated
      FROM documents
      WHERE project_id = ? AND is_deleted = FALSE
    `;
    
    const result = await executeQuery(global.dbConnection, sql, [projectId]);
    return result[0] || {
      total_documents: 0,
      total_words: 0,
      total_chars: 0,
      chapters: 0,
      outlines: 0,
      notes: 0,
      last_updated: null
    };
  }
}

module.exports = new WritingProject();