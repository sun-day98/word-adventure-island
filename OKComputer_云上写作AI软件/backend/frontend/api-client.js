/**
 * APIJSON前端客户端
 * 提供简化的API调用接口，封装认证、错误处理等功能
 */

class APIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('ai_writing_token') || null;
    this.user = this.parseToken(this.token);
  }

  /**
   * 解析JWT令牌
   * @param {string} token JWT令牌
   * @returns {Object|null} 用户信息
   */
  parseToken(token) {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        username: payload.username,
        role: payload.role
      };
    } catch (error) {
      console.error('Token解析失败:', error);
      return null;
    }
  }

  /**
   * 设置认证令牌
   * @param {string} token JWT令牌
   */
  setToken(token) {
    this.token = token;
    this.user = this.parseToken(token);
    if (token) {
      localStorage.setItem('ai_writing_token', token);
    } else {
      localStorage.removeItem('ai_writing_token');
    }
  }

  /**
   * 通用API请求
   * @param {string} method HTTP方法
   * @param {string} endpoint 接口路径
   * @param {Object} data 请求数据
   * @returns {Promise} 请求结果
   */
  async request(method, endpoint, data = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // 添加认证头
    if (this.token) {
      options.headers.Authorization = `Bearer ${this.token}`;
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(data).length > 0) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      // 处理认证错误
      if (response.status === 401) {
        this.setToken(null);
        // 可以触发登录跳转
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      return {
        success: response.ok,
        status: response.status,
        data: result
      };

    } catch (error) {
      console.error('API请求失败:', error);
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  // =================== 认证相关接口 ===================

  /**
   * 用户注册
   * @param {Object} userData 用户数据
   */
  async register(userData) {
    return this.request('POST', '/v1/auth/register', userData);
  }

  /**
   * 用户登录
   * @param {string} username 用户名
   * @param {string} password 密码
   */
  async login(username, password) {
    const result = await this.request('POST', '/v1/auth/login', {
      username,
      password
    });

    if (result.success && result.data.code === 200) {
      this.setToken(result.data.data.token);
    }

    return result;
  }

  /**
   * 获取用户信息
   */
  async getProfile() {
    return this.request('GET', '/v1/auth/profile');
  }

  /**
   * 登出
   */
  logout() {
    this.setToken(null);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  // =================== APIJSON通用接口 ===================

  /**
   * 通用查询接口
   * @param {Object} query APIJSON查询对象
   */
  async get(query) {
    return this.request('POST', '/v1/query', query);
  }

  /**
   * 通用新增接口
   * @param {Object} data 数据对象
   * @param {string} table 表名
   */
  async post(data, table) {
    const payload = { ...data, table };
    return this.request('POST', '/v1/create', payload);
  }

  /**
   * 通用更新接口
   * @param {Object} data 数据对象
   * @param {string} table 表名
   */
  async put(data, table) {
    const payload = { ...data, table };
    return this.request('PUT', '/v1/update', payload);
  }

  /**
   * 通用删除接口
   * @param {Object} condition 删除条件
   * @param {string} table 表名
   */
  async delete(condition, table) {
    const payload = { ...condition, table };
    return this.request('DELETE', '/v1/delete', payload);
  }

  // =================== 业务相关接口 ===================

  /**
   * 获取写作统计
   * @param {Object} params 参数
   */
  async getWritingStats(params = {}) {
    return this.request('GET', '/v1/stats/writing', params);
  }

  /**
   * 生成AI内容
   * @param {Object} params 生成参数
   */
  async generateAIContent(params) {
    return this.request('POST', '/v1/ai-writer/generate', {
      ...params,
      userId: this.user?.userId
    });
  }

  /**
   * 计算项目进度
   * @param {string} projectId 项目ID
   */
  async calculateProjectProgress(projectId) {
    return this.request('GET', `/v1/projects/${projectId}/progress`);
  }

  /**
   * 获取热门题材
   * @param {string} userId 用户ID（可选）
   */
  async getPopularGenres(userId = null) {
    return this.request('GET', '/v1/genres/popular', { userId });
  }

  // =================== 项目管理接口 ===================

  /**
   * 获取项目列表
   * @param {Object} filters 筛选条件
   */
  async getProjects(filters = {}) {
    return this.request('GET', '/v1/documents', {
      ...filters,
      user_id: this.user?.userId
    });
  }

  /**
   * 创建项目
   * @param {Object} projectData 项目数据
   */
  async createProject(projectData) {
    return this.request('POST', '/v1/documents', {
      ...projectData,
      user_id: this.user?.userId
    });
  }

  /**
   * 更新项目
   * @param {string} projectId 项目ID
   * @param {Object} updateData 更新数据
   */
  async updateProject(projectId, updateData) {
    return this.request('PUT', `/v1/documents/${projectId}`, {
      user_id: this.user?.userId,
      ...updateData
    });
  }

  /**
   * 删除项目
   * @param {string} projectId 项目ID
   */
  async deleteProject(projectId) {
    return this.request('DELETE', `/v1/documents/${projectId}`, {
      user_id: this.user?.userId
    });
  }

  // =================== 文档内容接口 ===================

  /**
   * 获取文档内容
   * @param {string} projectId 项目ID
   * @param {string} version 版本号（可选）
   */
  async getDocumentContent(projectId, version = null) {
    const condition = {
      project_id: projectId
    };
    
    if (version) {
      condition.version = version;
    } else {
      condition['@order'] = 'version-DESC';
    }

    const query = {
      '[]': {
        'document_content': condition
      },
      '@role': this.user?.role || 'guest'
    };

    return this.get(query);
  }

  /**
   * 保存文档内容
   * @param {Object} contentData 内容数据
   */
  async saveDocumentContent(contentData) {
    return this.post({
      ...contentData,
      user_id: this.user?.userId
    }, 'document_content');
  }

  /**
   * 更新文档内容
   * @param {string} contentId 内容ID
   * @param {Object} updateData 更新数据
   */
  async updateDocumentContent(contentId, updateData) {
    return this.put({
      id: contentId,
      ...updateData
    }, 'document_content');
  }

  // =================== 系统管理接口 ===================

  /**
   * 获取系统配置（仅管理员）
   */
  async getSystemConfig() {
    return this.get({
      '[]': {
        'system_config': {},
        '@role': 'admin'
      }
    });
  }

  /**
   * 获取系统统计（仅管理员）
   */
  async getSystemStats() {
    return this.request('GET', '/v1/admin/stats');
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    return this.request('GET', '/health');
  }

  /**
   * 获取API信息
   */
  async getAPIInfo() {
    return this.request('GET', '/api/info');
  }
}

// 创建全局实例
const apiClient = new APIClient();

// 导出类和全局实例
export { APIClient, apiClient };

// 如果是CommonJS环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient, apiClient };
}