/**
 * 后端集成脚本
 * 将现有的前端功能与APIJSON后端进行集成
 */

// 全局变量
let currentUser = null;
let apiClient = null;

// 简单的API客户端模拟
const mockAPIClient = {
  request: async function(method, url, data) {
    console.log(`API请求: ${method} ${url}`, data);
    return { success: true, data: data || {} };
  }
};

// 初始化API客户端
async function initializeAPIIntegration() {
  try {
    // 检查是否已有全局API客户端
    if (typeof window.apiClient !== 'undefined') {
      apiClient = window.apiClient;
    } else if (typeof apiClient !== 'undefined') {
      apiClient = apiClient;
    } else {
      console.warn('API客户端未找到，使用本地模拟');
      apiClient = mockAPIClient;
    }

    // 恢复用户会话
    const token = localStorage.getItem('ai_writing_token');
    if (token) {
      const profileResult = await window.apiClient.getProfile();
      if (profileResult.success && profileResult.data.code === 200) {
        currentUser = profileResult.data.data;
        updateUserUI();
        console.log('✅ 用户会话已恢复:', currentUser.username);
      } else {
        // 令牌无效，清除
        localStorage.removeItem('ai_writing_token');
      }
    }

    // 监听认证事件
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:login', handleLogin);

    console.log('✅ APIJSON后端集成初始化完成');

  } catch (error) {
    console.error('❌ APIJSON后端集成初始化失败:', error);
  }
}

// 用户登录
async function handleLogin(event) {
  if (event.detail) {
    currentUser = event.detail.user;
    updateUserUI();
  }
}

// 用户登出
function handleLogout() {
  currentUser = null;
  updateUserUI();
  // 可以重定向到登录页面
  showNotification('已退出登录', 'info');
}

// 更新用户界面
function updateUserUI() {
  if (currentUser) {
    // 更新导航栏用户信息
    const userNav = document.querySelector('.user-nav');
    if (userNav) {
      userNav.innerHTML = `
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">欢迎, ${currentUser.nickname || currentUser.username}</span>
          <button onclick="logoutUser()" class="text-sm text-red-600 hover:text-red-800">退出</button>
        </div>
      `;
    }

    // 启用需要登录的功能
    enablePremiumFeatures();
  } else {
    // 显示登录按钮
    const userNav = document.querySelector('.user-nav');
    if (userNav) {
      userNav.innerHTML = `
        <button onclick="showLoginModal()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium">登录</button>
      `;
    }

    // 禁用高级功能
    disablePremiumFeatures();
  }
}

// 显示登录模态框
function showLoginModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">登录AI写作助手</h3>
      <form id="login-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input type="text" name="username" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input type="password" name="password" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div class="flex space-x-3">
          <button type="submit" class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">登录</button>
          <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">取消</button>
        </div>
      </form>
      <div class="mt-4 text-center">
        <a href="#" onclick="showRegisterModal(); this.closest('.fixed').remove(); return false;" class="text-sm text-blue-600 hover:text-blue-800">还没有账号？立即注册</a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 绑定登录表单提交
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const result = await window.apiClient.login(username, password);
      
      if (result.success && result.data.code === 200) {
        currentUser = result.data.data.user;
        updateUserUI();
        modal.remove();
        showNotification('登录成功！', 'success');
        
        // 加载用户数据
        await loadUserData();
      } else {
        showNotification(result.data.message || '登录失败', 'error');
      }
    } catch (error) {
      console.error('登录错误:', error);
      showNotification('登录失败，请重试', 'error');
    }
  });
}

// 显示注册模态框
function showRegisterModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">注册AI写作助手</h3>
      <form id="register-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input type="text" name="username" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input type="password" name="password" required minlength="6" class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">邮箱（可选）</label>
          <input type="email" name="email" class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">昵称（可选）</label>
          <input type="text" name="nickname" class="w-full border border-gray-300 rounded-lg px-3 py-2">
        </div>
        <div class="flex space-x-3">
          <button type="submit" class="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">注册</button>
          <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">取消</button>
        </div>
      </form>
      <div class="mt-4 text-center">
        <a href="#" onclick="showLoginModal(); this.closest('.fixed').remove(); return false;" class="text-sm text-blue-600 hover:text-blue-800">已有账号？立即登录</a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 绑定注册表单提交
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const userData = {
      username: formData.get('username'),
      password: formData.get('password'),
      email: formData.get('email') || null,
      nickname: formData.get('nickname') || null
    };

    try {
      const result = await window.apiClient.register(userData);
      
      if (result.success && result.data.code === 200) {
        modal.remove();
        showNotification('注册成功！请登录', 'success');
        
        // 自动显示登录框
        setTimeout(() => showLoginModal(), 1000);
      } else {
        showNotification(result.data.message || '注册失败', 'error');
      }
    } catch (error) {
      console.error('注册错误:', error);
      showNotification('注册失败，请重试', 'error');
    }
  });
}

// 用户登出
function logoutUser() {
  if (window.apiClient) {
    window.apiClient.logout();
  }
}

// 启用高级功能
function enablePremiumFeatures() {
  // 启用AI-Writer功能
  const aiWriterButton = document.querySelector('[onclick="toggleAIWriter()"]');
  if (aiWriterButton) {
    aiWriterButton.disabled = false;
    aiWriterButton.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  // 启用项目保存到云端
  const saveButton = document.querySelector('[onclick="saveDocument()"]');
  if (saveButton) {
    saveButton.innerHTML = '保存到云端';
  }

  // 显示更多统计信息
  loadUserStatistics();
}

// 禁用高级功能
function disablePremiumFeatures() {
  // 禁用AI-Writer功能
  const aiWriterButton = document.querySelector('[onclick="toggleAIWriter()"]');
  if (aiWriterButton) {
    aiWriterButton.disabled = true;
    aiWriterButton.classList.add('opacity-50', 'cursor-not-allowed');
  }

  // 更改保存按钮文本
  const saveButton = document.querySelector('[onclick="saveDocument()"]');
  if (saveButton) {
    saveButton.innerHTML = '保存到本地';
  }
}

// 加载用户统计信息
async function loadUserStatistics() {
  if (!currentUser || !window.apiClient) return;

  try {
    const statsResult = await window.apiClient.getWritingStats();
    
    if (statsResult.success && statsResult.data.code === 200) {
      const stats = statsResult.data.data;
      
      // 更新界面统计信息
      updateWritingStats(stats);
      
      // 更新仪表板数据
      if (typeof updateDashboardCharts === 'function') {
        updateDashboardCharts(stats);
      }
    }
  } catch (error) {
    console.error('加载用户统计失败:', error);
  }
}

// 更新写作统计
function updateWritingStats(stats) {
  // 更新字数统计
  const wordCountElement = document.getElementById('word-count');
  if (wordCountElement) {
    wordCountElement.textContent = stats.totalWords.toLocaleString();
  }

  // 更新项目数量
  const projectCountElement = document.querySelector('.stats-card .text-2xl');
  if (projectCountElement) {
    projectCountElement.textContent = stats.totalProjects;
  }

  // 更新写作速度
  const writingSpeedElement = document.getElementById('writing-speed');
  if (writingSpeedElement) {
    writingSpeedElement.textContent = `${stats.averageWordsPerSession}字/会话`;
  }
}

// 集成AI-Writer到后端
async function integrateAIWriterToBackend() {
  if (!window.apiClient || !currentUser) {
    showNotification('请先登录使用AI-Writer功能', 'warning');
    return;
  }

  // 重写AI-Writer生成函数以使用后端
  window.generateAIContent = async function() {
    if (!window.aiWriter) {
      showNotification('AI-Writer尚未初始化完成', 'warning');
      return;
    }
    
    const genreSelect = document.getElementById('genre-select');
    const modeSelect = document.getElementById('mode-select');
    const statusDiv = document.getElementById('ai-writer-status');
    const resultDiv = document.getElementById('ai-writer-result');
    const contentDiv = document.getElementById('ai-generated-content');
    
    if (!genreSelect || !modeSelect) return;
    
    const selectedGenre = genreSelect.value;
    const selectedMode = modeSelect.value;
    
    // 获取当前文本作为上下文
    const editor = document.getElementById('writing-editor');
    const currentText = editor ? editor.value : '';
    const prompt = currentText.length > 0 
      ? currentText.substring(Math.max(0, currentText.length - 500)) 
      : `请生成一个${getGenreName(selectedGenre)}题材的${getModeName(selectedMode)}内容`;
    
    // 显示状态
    if (statusDiv) statusDiv.classList.remove('hidden');
    if (resultDiv) resultDiv.classList.add('hidden');
    
    try {
      // 调用后端AI生成接口
      const result = await window.apiClient.generateAIContent({
        genre: selectedGenre,
        mode: selectedMode,
        prompt: prompt,
        projectId: currentProject || null
      });
      
      if (result.success && result.data.code === 200) {
        const aiResult = result.data.data;
        currentAIContent = aiResult.content;
        
        // 显示生成结果
        if (contentDiv) {
          contentDiv.innerHTML = `
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="genre-badge genre-${selectedGenre}">${getGenreName(selectedGenre)}</span>
                <span class="text-xs text-gray-500">${getModeName(selectedMode)}</span>
                <span class="text-xs text-green-600">云端生成</span>
              </div>
              <p class="text-gray-700 leading-relaxed">${aiResult.content}</p>
              <div class="text-xs text-gray-500 border-t pt-2 mt-2">
                <span>质量: ${aiResult.qualityScore}</span> | 
                <span>字数: ${aiResult.contentLength}</span> | 
                <span>用时: ${aiResult.generationTime}s</span>
              </div>
            </div>
          `;
        }
        
        // 显示结果面板
        if (resultDiv) {
          resultDiv.classList.remove('hidden');
          
          // 添加显示动画
          anime({
            targets: resultDiv,
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 300,
            easing: 'easeOutExpo'
          });
        }
        
        showNotification('AI内容生成成功（云端）', 'success');
        console.log('✅ [AI-Writer Backend] 内容生成成功:', aiResult);
        
      } else {
        throw new Error(result.data.message || '生成失败');
      }
      
    } catch (error) {
      console.error('❌ [AI-Writer Backend] 生成失败:', error);
      showNotification('云端生成失败，切换到本地模式', 'warning');
      
      // 回退到本地生成
      if (typeof originalGenerateAIContent === 'function') {
        originalGenerateAIContent();
      }
    } finally {
      // 隐藏状态
      if (statusDiv) statusDiv.classList.add('hidden');
    }
  };
}

// 保存文档到云端
async function saveDocumentToCloud() {
  if (!currentUser || !window.apiClient) {
    showNotification('请先登录', 'warning');
    return;
  }

  const editor = document.getElementById('writing-editor');
  const titleInput = document.getElementById('document-title');
  
  if (!editor || !titleInput) return;
  
  const documentData = {
    title: titleInput.value || '未命名文档',
    content: editor.value,
    word_count: editor.value.length,
    genre: 'fantasy', // 可以从其他地方获取
    type: 'novel',
    status: 'writing'
  };

  try {
    // 检查是否有当前项目
    if (currentProject && currentProject !== 'novel') {
      // 更新现有项目
      const result = await window.apiClient.updateProject(currentProject, documentData);
      
      if (result.success && result.data.code === 200) {
        showNotification('文档已保存到云端', 'success');
      } else {
        throw new Error('保存失败');
      }
    } else {
      // 创建新项目
      const result = await window.apiClient.createProject(documentData);
      
      if (result.success && result.data.code === 200) {
        currentProject = result.data.data.id;
        showNotification('新项目已创建并保存到云端', 'success');
      } else {
        throw new Error('创建失败');
      }
    }
    
  } catch (error) {
    console.error('保存到云端失败:', error);
    showNotification('云端保存失败，将保存到本地', 'warning');
    
    // 回退到本地保存
    saveDocument();
  }
}

// 导出函数供HTML使用
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.logoutUser = logoutUser;
window.saveDocumentToCloud = saveDocumentToCloud;

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟初始化以确保所有脚本加载完成
  setTimeout(() => {
    initializeAPIIntegration();
    
    // 如果用户已登录，集成AI-Writer
    if (currentUser) {
      integrateAIWriterToBackend();
    }
  }, 1000);
});