/**
 * 数据库API客户端
 * 与新的数据库后端API进行交互
 */

class DatabaseAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/v2';
    this.token = localStorage.getItem('ai_writing_token') || null;
  }

  /**
   * 设置认证令牌
   * @param {string} token JWT令牌
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('ai_writing_token', token);
    } else {
      localStorage.removeItem('ai_writing_token');
    }
  }

  /**
   * 获取请求头
   * @returns {Object} 请求头
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * 通用请求方法
   * @param {string} method HTTP方法
   * @param {string} url 请求URL
   * @param {Object} data 请求数据
   * @returns {Promise} 请求结果
   */
  async request(method, url, data = null) {
    try {
      const config = {
        method,
        headers: this.getHeaders()
      };
      
      if (data) {
        config.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${this.baseURL}${url}`, config);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // ========== 认证相关API ==========
  
  /**
   * 用户注册
   * @param {Object} userData 用户数据
   */
  async register(userData) {
    return await this.request('POST', '/auth/register', userData);
  }

  /**
   * 用户登录
   * @param {string} username 用户名或邮箱
   * @param {string} password 密码
   */
  async login(username, password) {
    const result = await this.request('POST', '/auth/login', { username, password });
    
    if (result.success && result.data.token) {
      this.setToken(result.data.token);
    }
    
    return result;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    return await this.request('GET', '/auth/me');
  }

  /**
   * 更新用户信息
   * @param {Object} updateData 更新数据
   */
  async updateUser(updateData) {
    return await this.request('PUT', '/auth/me', updateData);
  }

  /**
   * 修改密码
   * @param {string} currentPassword 当前密码
   * @param {string} newPassword 新密码
   */
  async changePassword(currentPassword, newPassword) {
    return await this.request('PUT', '/auth/password', { 
      currentPassword, 
      newPassword 
    });
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      await this.request('POST', '/auth/logout');
    } catch (error) {
      console.warn('登出请求失败，但清理本地数据:', error);
    }
    
    this.setToken(null);
  }

  /**
   * 检查登录状态
   */
  async checkAuthStatus() {
    try {
      if (!this.token) {
        return { authenticated: false };
      }
      
      const result = await this.request('GET', '/auth/verify');
      return { 
        authenticated: result.success, 
        user: result.success ? result.data.user : null 
      };
    } catch (error) {
      console.warn('认证状态检查失败:', error);
      this.setToken(null);
      return { authenticated: false };
    }
  }

  // ========== 项目相关API ==========
  
  /**
   * 创建新项目
   * @param {Object} projectData 项目数据
   */
  async createProject(projectData) {
    return await this.request('POST', '/projects', projectData);
  }

  /**
   * 获取项目列表
   * @param {Object} options 查询选项
   */
  async getProjects(options = {}) {
    const params = new URLSearchParams(options);
    const url = `/projects?${params.toString()}`;
    return await this.request('GET', url);
  }

  /**
   * 获取项目详情
   * @param {string} projectId 项目ID
   */
  async getProject(projectId) {
    return await this.request('GET', `/projects/${projectId}`);
  }

  /**
   * 更新项目
   * @param {string} projectId 项目ID
   * @param {Object} updateData 更新数据
   */
  async updateProject(projectId, updateData) {
    return await this.request('PUT', `/projects/${projectId}`, updateData);
  }

  /**
   * 删除项目
   * @param {string} projectId 项目ID
   */
  async deleteProject(projectId) {
    return await this.request('DELETE', `/projects/${projectId}`);
  }

  /**
   * 复制项目
   * @param {string} projectId 原项目ID
   * @param {string} newTitle 新项目标题
   */
  async duplicateProject(projectId, newTitle) {
    return await this.request('POST', `/projects/${projectId}/duplicate`, { newTitle });
  }

  /**
   * 获取项目统计信息
   * @param {string} projectId 项目ID
   */
  async getProjectStats(projectId) {
    return await this.request('GET', `/projects/${projectId}/stats`);
  }

  // ========== 文档相关API ==========
  
  /**
   * 获取项目文档
   * @param {string} projectId 项目ID
   * @param {Object} options 查询选项
   */
  async getProjectDocuments(projectId, options = {}) {
    const params = new URLSearchParams(options);
    const url = `/projects/${projectId}/documents?${params.toString()}`;
    return await this.request('GET', url);
  }

  /**
   * 创建项目文档
   * @param {string} projectId 项目ID
   * @param {Object} documentData 文档数据
   */
  async createDocument(projectId, documentData) {
    return await this.request('POST', `/projects/${projectId}/documents`, documentData);
  }

  /**
   * 获取文档详情
   * @param {number} documentId 文档ID
   */
  async getDocument(documentId) {
    return await this.request('GET', `/projects/documents/${documentId}`);
  }

  /**
   * 更新文档
   * @param {number} documentId 文档ID
   * @param {Object} updateData 更新数据
   */
  async updateDocument(documentId, updateData) {
    return await this.request('PUT', `/projects/documents/${documentId}`, updateData);
  }

  /**
   * 删除文档
   * @param {number} documentId 文档ID
   */
  async deleteDocument(documentId) {
    return await this.request('DELETE', `/projects/documents/${documentId}`);
  }

  // ========== 数据同步相关方法 ==========
  
  /**
   * 保存项目到数据库
   * @param {Object} project 项目数据
   */
  async saveProject(project) {
    try {
      if (project.id && project.id.startsWith('doc_')) {
        // 如果是本地创建的项目，需要创建为数据库项目
        const projectData = {
          title: project.title,
          description: project.description || '',
          genre: project.genre || '',
          category: project.category || 'novel',
          tags: project.tags || [],
          metadata: project.metadata || {}
        };
        
        const result = await this.createProject(projectData);
        
        if (result.success) {
          // 保存项目中的文档
          if (project.documents && project.documents.length > 0) {
            for (const doc of project.documents) {
              await this.createDocument(result.data.id, {
                title: doc.title,
                content: doc.content || '',
                contentType: doc.contentType || 'chapter',
                orderIndex: doc.orderIndex || 0
              });
            }
          }
          
          return result.data;
        }
      } else {
        // 更新现有项目
        return await this.updateProject(project.id, project);
      }
    } catch (error) {
      console.error('保存项目失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库加载项目
   * @param {string} projectId 项目ID
   */
  async loadProject(projectId) {
    try {
      const result = await this.getProject(projectId);
      
      if (result.success) {
        const project = result.data.project;
        
        // 合并文档和统计信息
        project.documents = result.data.documents || [];
        project.stats = result.data.stats || {};
        
        return project;
      }
      
      return null;
    } catch (error) {
      console.error('加载项目失败:', error);
      throw error;
    }
  }

  /**
   * 同步本地项目到数据库
   * @param {Array} localProjects 本地项目列表
   */
  async syncProjectsToDatabase(localProjects) {
    try {
      const syncResults = [];
      
      for (const localProject of localProjects) {
        try {
          const savedProject = await this.saveProject(localProject);
          syncResults.push({
            localId: localProject.id,
            success: true,
            data: savedProject
          });
        } catch (error) {
          syncResults.push({
            localId: localProject.id,
            success: false,
            error: error.message
          });
        }
      }
      
      return syncResults;
    } catch (error) {
      console.error('同步项目失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库加载所有项目
   */
  async loadAllProjects() {
    try {
      const result = await this.getProjects();
      
      if (result.success) {
        return result.data.projects;
      }
      
      return [];
    } catch (error) {
      console.error('加载所有项目失败:', error);
      throw error;
    }
  }
}

// 创建全局API实例
const databaseAPI = new DatabaseAPI();

// 导出API实例和类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatabaseAPI, databaseAPI };
} else {
  window.DatabaseAPI = DatabaseAPI;
  window.databaseAPI = databaseAPI;
}