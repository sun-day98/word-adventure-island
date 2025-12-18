/**
 * 数据库集成模块
 * 将数据库功能集成到现有的AI写作软件中
 */

// 数据库集成管理器
class DatabaseIntegration {
  constructor() {
    this.isDBAvailable = false;
    this.currentUser = null;
    this.syncEnabled = false;
    this.autoSaveInterval = null;
    this.onlineMode = false;
  }

  /**
   * 初始化数据库集成
   */
  async initialize() {
    try {
      console.log('🔄 正在初始化数据库集成...');
      
      // 检查数据库API是否可用
      if (typeof databaseAPI !== 'undefined') {
        this.isDBAvailable = true;
        console.log('✅ 数据库API可用');
      } else {
        console.warn('⚠️ 数据库API不可用，将使用本地存储');
        return false;
      }

      // 检查用户登录状态
      await this.checkUserAuth();
      
      // 设置自动保存
      this.setupAutoSave();
      
      // 设置数据同步
      this.setupDataSync();
      
      console.log('✅ 数据库集成初始化完成');
      return true;
      
    } catch (error) {
      console.error('❌ 数据库集成初始化失败:', error);
      return false;
    }
  }

  /**
   * 检查用户认证状态
   */
  async checkUserAuth() {
    try {
      if (!this.isDBAvailable) return false;
      
      const authStatus = await databaseAPI.checkAuthStatus();
      
      if (authStatus.authenticated) {
        this.currentUser = authStatus.user;
        this.onlineMode = true;
        this.syncEnabled = true;
        
        console.log(`✅ 用户已登录: ${this.currentUser.username}`);
        return true;
      } else {
        this.currentUser = null;
        this.onlineMode = false;
        this.syncEnabled = false;
        
        console.log('⚠️ 用户未登录，使用离线模式');
        return false;
      }
    } catch (error) {
      console.error('检查用户认证失败:', error);
      return false;
    }
  }

  /**
   * 用户登录
   * @param {string} username 用户名
   * @param {string} password 密码
   */
  async login(username, password) {
    try {
      if (!this.isDBAvailable) {
        throw new Error('数据库API不可用');
      }
      
      const result = await databaseAPI.login(username, password);
      
      if (result.success) {
        this.currentUser = result.data.user;
        this.onlineMode = true;
        this.syncEnabled = true;
        
        // 登录成功后同步本地数据
        await this.syncLocalToDatabase();
        
        // 显示登录成功消息
        this.showNotification('登录成功！', 'success');
        
        return true;
      } else {
        throw new Error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.showNotification('登录失败: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * 用户注册
   * @param {Object} userData 用户数据
   */
  async register(userData) {
    try {
      if (!this.isDBAvailable) {
        throw new Error('数据库API不可用');
      }
      
      const result = await databaseAPI.register(userData);
      
      if (result.success) {
        this.showNotification('注册成功！请登录', 'success');
        return true;
      } else {
        throw new Error(result.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      this.showNotification('注册失败: ' + error.message, 'error');
      return false;
    }
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      if (this.isDBAvailable) {
        await databaseAPI.logout();
      }
      
      this.currentUser = null;
      this.onlineMode = false;
      this.syncEnabled = false;
      
      this.showNotification('已登出', 'info');
      
      // 刷新页面以清理状态
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('登出失败:', error);
      this.showNotification('登出失败: ' + error.message, 'error');
    }
  }

  /**
   * 设置自动保存
   */
  setupAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // 每30秒自动保存一次
    this.autoSaveInterval = setInterval(async () => {
      if (this.syncEnabled && currentProject && currentProject !== 'novel') {
        await this.autoSaveCurrentProject();
      }
    }, 30000);
  }

  /**
   * 自动保存当前项目
   */
  async autoSaveCurrentProject() {
    try {
      const projectData = this.getCurrentProjectData();
      if (projectData) {
        await this.saveProjectToDatabase(projectData);
        console.log('📝 项目已自动保存到数据库');
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  /**
   * 获取当前项目数据
   */
  getCurrentProjectData() {
    try {
      const titleInput = document.getElementById('document-title');
      const editor = document.getElementById('writing-editor');
      
      if (!titleInput || !editor || !currentProject) {
        return null;
      }
      
      return {
        id: currentProject,
        title: titleInput.value,
        content: editor.value,
        lastModified: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取项目数据失败:', error);
      return null;
    }
  }

  /**
   * 保存项目到数据库
   * @param {Object} projectData 项目数据
   */
  async saveProjectToDatabase(projectData) {
    try {
      if (!this.isDBAvailable || !this.syncEnabled) {
        return false;
      }
      
      // 构造数据库项目数据
      const dbProjectData = {
        title: projectData.title,
        description: projectData.description || '',
        genre: projectData.genre || 'novel',
        category: projectData.category || 'novel',
        tags: projectData.tags || [],
        metadata: {
          lastModified: projectData.lastModified,
          wordCount: projectData.content ? projectData.content.length : 0,
          // 保留其他元数据
          ...(projectData.metadata || {})
        }
      };
      
      let result;
      if (projectData.id && !projectData.id.startsWith('doc_')) {
        // 更新现有项目
        result = await databaseAPI.updateProject(projectData.id, dbProjectData);
      } else {
        // 创建新项目
        result = await databaseAPI.createProject(dbProjectData);
        if (result.success) {
          // 更新当前项目ID
          currentProject = result.data.id;
          projectData.id = result.data.id;
        }
      }
      
      // 保存文档内容
      if (result.success && projectData.content) {
        const documentData = {
          title: projectData.title,
          content: projectData.content,
          contentType: 'chapter',
          orderIndex: 0
        };
        
        const projectId = result.data.id || projectData.id;
        await databaseAPI.createDocument(projectId, documentData);
      }
      
      return result.success;
      
    } catch (error) {
      console.error('保存项目到数据库失败:', error);
      return false;
    }
  }

  /**
   * 从数据库加载项目
   * @param {string} projectId 项目ID
   */
  async loadProjectFromDatabase(projectId) {
    try {
      if (!this.isDBAvailable || !this.syncEnabled) {
        return null;
      }
      
      const result = await databaseAPI.loadProject(projectId);
      
      if (result) {
        // 更新编辑器内容
        this.updateEditorContent(result);
        return result;
      }
      
      return null;
      
    } catch (error) {
      console.error('从数据库加载项目失败:', error);
      return null;
    }
  }

  /**
   * 更新编辑器内容
   * @param {Object} project 项目数据
   */
  updateEditorContent(project) {
    try {
      const titleInput = document.getElementById('document-title');
      const editor = document.getElementById('writing-editor');
      
      if (titleInput) {
        titleInput.value = project.title || '';
      }
      
      if (editor) {
        // 从文档中获取内容
        let content = '';
        if (project.documents && project.documents.length > 0) {
          content = project.documents[0].content || '';
        }
        editor.value = content;
        
        // 更新统计信息
        if (typeof updateStats === 'function') {
          updateStats();
        }
      }
      
      console.log(`📄 已加载项目: ${project.title}`);
      
    } catch (error) {
      console.error('更新编辑器内容失败:', error);
    }
  }

  /**
   * 同步本地数据到数据库
   */
  async syncLocalToDatabase() {
    try {
      if (!this.isDBAvailable || !this.syncEnabled) {
        return;
      }
      
      console.log('🔄 开始同步本地数据到数据库...');
      
      // 获取本地项目
      const localProjects = this.getLocalProjects();
      
      // 同步到数据库
      const syncResults = await databaseAPI.syncProjectsToDatabase(localProjects);
      
      let successCount = 0;
      let failCount = 0;
      
      syncResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`同步失败 ${result.localId}: ${result.error}`);
        }
      });
      
      console.log(`✅ 同步完成: ${successCount} 成功, ${failCount} 失败`);
      
      if (failCount > 0) {
        this.showNotification(`同步完成，${failCount} 个项目同步失败`, 'warning');
      } else {
        this.showNotification('所有项目同步成功', 'success');
      }
      
    } catch (error) {
      console.error('同步本地数据失败:', error);
      this.showNotification('同步失败: ' + error.message, 'error');
    }
  }

  /**
   * 获取本地项目
   */
  getLocalProjects() {
    const projects = [];
    
    // 从localStorage获取项目数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('document_') && key !== 'document_novel') {
        try {
          const projectData = JSON.parse(localStorage.getItem(key));
          if (projectData.title) {
            projects.push({
              id: key.replace('document_', ''),
              title: projectData.title,
              content: projectData.content || '',
              lastModified: projectData.lastModified || new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`解析本地项目失败 ${key}:`, error);
        }
      }
    }
    
    return projects;
  }

  /**
   * 设置数据同步
   */
  setupDataSync() {
    // 监听在线/离线状态变化
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });
    
    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });
    
    // 页面卸载时保存数据
    window.addEventListener('beforeunload', () => {
      if (this.syncEnabled) {
        this.autoSaveCurrentProject();
      }
    });
  }

  /**
   * 处理在线状态变化
   * @param {boolean} isOnline 是否在线
   */
  async handleOnlineStatusChange(isOnline) {
    if (isOnline) {
      console.log('🌐 网络已连接，尝试重新认证...');
      const authSuccess = await this.checkUserAuth();
      
      if (authSuccess) {
        this.showNotification('网络已连接，数据同步已恢复', 'success');
        await this.syncLocalToDatabase();
      }
    } else {
      console.log('📵 网络已断开，切换到离线模式');
      this.showNotification('网络已断开，使用离线模式', 'warning');
    }
  }

  /**
   * 显示通知
   * @param {string} message 通知消息
   * @param {string} type 通知类型
   */
  showNotification(message, type = 'info') {
    // 使用现有的通知系统或创建简单的通知
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      // 创建简单的通知
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
      `;
      
      // 设置背景颜色
      const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
      };
      notification.style.backgroundColor = colors[type] || colors.info;
      
      document.body.appendChild(notification);
      
      // 显示动画
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      }, 100);
      
      // 自动移除
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  }

  /**
   * 获取数据库状态
   */
  getStatus() {
    return {
      isDBAvailable: this.isDBAvailable,
      currentUser: this.currentUser,
      onlineMode: this.onlineMode,
      syncEnabled: this.syncEnabled
    };
  }
}

// 创建全局数据库集成实例
const dbIntegration = new DatabaseIntegration();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  await dbIntegration.initialize();
});

// 导出数据库集成实例（如果支持模块导出）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatabaseIntegration, dbIntegration };
} else {
  window.DatabaseIntegration = DatabaseIntegration;
  window.dbIntegration = dbIntegration;
}