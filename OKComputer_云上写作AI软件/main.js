// AI写作助手主要JavaScript逻辑

// 多代理协调系统
let multiAgentCoordinator = null;
let storyCreationAgent = null;
let storyTemplates = null;

// AI-Writer 系统
let aiWriter = null;
let aiWriterPanelVisible = false;
let currentAIContent = null;

// 初始化多代理系统
function initializeMultiAgentSystem() {
    try {
        // 初始化基础代理
        const baseAgents = {
            planning: new PlanningAgent(),
            execution: new ExecutionAgent(),
            validation: new ValidationAgent(),
            response: new ResponseAgent()
        };

        // 初始化故事创作代理
        storyCreationAgent = new StoryCreationAgent();
        baseAgents.storyCreator = storyCreationAgent;

        // 初始化多代理协调器
        multiAgentCoordinator = new MultiAgentCoordinator();
        multiAgentCoordinator.initializeAgents(baseAgents);

        // 初始化故事模板
        storyTemplates = new StoryTemplates();

        console.log('🚀 多代理系统初始化完成');
    } catch (error) {
        console.error('❌ 多代理系统初始化失败:', error);
    }
}

// 全局变量
let currentProject = 'novel';
let writingStats = {
    wordCount: 1247,
    charCount: 5678,
    startTime: Date.now(),
    writingSpeed: 45
};

let aiSuggestions = [
    "建议增加更多关于飞船内部环境的描写，让读者更有代入感。",
    "可以考虑在对话中加入更多角色个性，让对话更加生动。",
    "尝试添加一些科幻元素的技术细节，增强故事的真实感。",
    "可以在场景转换处添加过渡段落，让故事更加连贯。",
    "建议为角色添加更多的内心独白，展现人物性格。"
];

let inspirationIdeas = [
    "在未知的星系中，团队发现了一个古老的外星文明遗迹...",
    "主角发现自己拥有特殊的能力，可以感知到维度裂缝...",
    "飞船的人工智能突然产生了自我意识，开始质疑人类的命令...",
    "探索队遇到了一个友好的外星种族，他们愿意分享先进的技术...",
    "在星球表面发现了神秘的符号，似乎是某种古老语言的记录...",
    "团队成员之间产生了分歧，关于是否应该继续深入探索...",
    "主角发现了一个关于自己身世的惊人秘密...",
    "飞船遭遇了时空扭曲，团队被困在了不同的时间线中..."
];

// 初始化函数
function initializeApp() {
    // 初始化多代理系统
    initializeMultiAgentSystem();
    
    // 初始化AI-Writer
    initializeAIWriter();
    
    setupParticleBackground();
    setupTypingAnimation();
    updateStats();
    loadUserData();
    
    // 添加页面加载动画
    anime({
        targets: '.feature-card',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(200),
        duration: 800,
        easing: 'easeOutExpo'
    });
}

// 粒子背景设置
function setupParticleBackground() {
    const container = document.getElementById('particle-container');
    if (!container) return;
    
    // 使用p5.js创建粒子背景
    new p5((p) => {
        let particles = [];
        
        p.setup = () => {
            const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
            canvas.parent(container);
            
            // 创建粒子
            for (let i = 0; i < 50; i++) {
                particles.push({
                    x: p.random(p.width),
                    y: p.random(p.height),
                    vx: p.random(-1, 1),
                    vy: p.random(-1, 1),
                    size: p.random(2, 6),
                    alpha: p.random(0.3, 0.8)
                });
            }
        };
        
        p.draw = () => {
            p.clear();
            
            // 绘制粒子
            particles.forEach(particle => {
                p.fill(246, 173, 85, particle.alpha * 255);
                p.noStroke();
                p.ellipse(particle.x, particle.y, particle.size);
                
                // 更新位置
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // 边界检测
                if (particle.x < 0 || particle.x > p.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > p.height) particle.vy *= -1;
            });
            
            // 绘制连接线
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    let dist = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    if (dist < 100) {
                        p.stroke(246, 173, 85, (1 - dist / 100) * 50);
                        p.strokeWeight(1);
                        p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    }
                }
            }
        };
        
        p.windowResized = () => {
            p.resizeCanvas(container.offsetWidth, container.offsetHeight);
        };
    });
}

// 打字机动画设置
function setupTypingAnimation() {
    const typingElement = document.querySelector('.typing-animation');
    if (!typingElement) return;
    
    const text = typingElement.textContent;
    typingElement.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            typingElement.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };
    
    setTimeout(typeWriter, 1000);
}

// 更新写作统计
function updateStats() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const text = editor.value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    
    writingStats.wordCount = words.length;
    writingStats.charCount = characters;
    
    // 更新显示
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');
    const readTimeEl = document.getElementById('read-time');
    const writingSpeedEl = document.getElementById('writing-speed');
    
    if (wordCountEl) wordCountEl.textContent = words.length.toLocaleString();
    if (charCountEl) charCountEl.textContent = characters.toLocaleString();
    if (readTimeEl) {
        const readTime = Math.ceil(words.length / 200); // 假设每分钟阅读200字
        readTimeEl.textContent = `约${readTime}分钟`;
    }
    if (writingSpeedEl) {
        writingSpeedEl.textContent = `${writingStats.writingSpeed}字/分钟`;
    }
    
    // 更新光标位置
    updateCursorPosition();
    
    // 更新自动保存时间
    updateLastSavedTime();
}

// 更新光标位置
function updateCursorPosition() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const cursorPos = editor.selectionStart;
    const textBeforeCursor = editor.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length;
    const currentColumn = lines[lines.length - 1].length + 1;
    
    const positionEl = document.getElementById('cursor-position');
    if (positionEl) {
        positionEl.textContent = `行 ${currentLine}, 列 ${currentColumn}`;
    }
}

// 更新最后保存时间
function updateLastSavedTime() {
    const lastSavedEl = document.getElementById('last-saved');
    if (lastSavedEl && writingStats.lastSavedTime) {
        const now = Date.now();
        const timeDiff = Math.floor((now - writingStats.lastSavedTime) / 1000 / 60); // 分钟
        
        if (timeDiff < 1) {
            lastSavedEl.textContent = '刚刚保存';
        } else if (timeDiff < 60) {
            lastSavedEl.textContent = `自动保存于 ${timeDiff} 分钟前`;
        } else {
            const hours = Math.floor(timeDiff / 60);
            lastSavedEl.textContent = `自动保存于 ${hours} 小时前`;
        }
    }
}

// 全屏编辑模式
function toggleFullscreen() {
    const editorContainer = document.querySelector('.writing-area');
    const editor = document.getElementById('writing-editor');
    
    if (!document.fullscreenElement) {
        editorContainer.requestFullscreen().then(() => {
            editor.classList.add('fullscreen-editor');
            showNotification('按 ESC 退出全屏模式', 'info');
        });
    } else {
        document.exitFullscreen();
        editor.classList.remove('fullscreen-editor');
    }
}

// 专注模式
let focusMode = false;
function toggleFocusMode() {
    const editorContainer = document.querySelector('.writing-area');
    const sidebar = document.querySelector('.sidebar');
    const aiPanel = document.querySelector('.ai-panel');
    
    focusMode = !focusMode;
    
    if (focusMode) {
        // 隐藏侧边栏和AI面板
        if (sidebar) sidebar.style.display = 'none';
        if (aiPanel) aiPanel.style.display = 'none';
        editorContainer.classList.add('focus-mode');
        showNotification('专注模式已开启', 'success');
    } else {
        // 显示侧边栏和AI面板
        if (sidebar) sidebar.style.display = 'block';
        if (aiPanel) aiPanel.style.display = 'block';
        editorContainer.classList.remove('focus-mode');
        showNotification('专注模式已关闭', 'info');
    }
}

// 文本格式化
function formatText(format) {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    if (!selectedText) {
        showNotification('请先选择要格式化的文本', 'warning');
        return;
    }
    
    let formattedText = '';
    switch (format) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            break;
        case 'underline':
            formattedText = `__${selectedText}__`;
            break;
        default:
            formattedText = selectedText;
    }
    
    const newText = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
    editor.value = newText;
    
    // 重新选中格式化后的文本
    editor.selectionStart = start;
    editor.selectionEnd = start + formattedText.length;
    editor.focus();
    
    updateStats();
}

// 改变写作风格
function changeWritingStyle(style) {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    let styleGuide = '';
    switch (style) {
        case 'creative':
            styleGuide = '\n// 创意风格：使用生动的描述，丰富的想象力，独特的表达方式\n';
            break;
        case 'formal':
            styleGuide = '\n// 正式风格：使用规范的语法，专业的词汇，客观的表达\n';
            break;
        case 'academic':
            styleGuide = '\n// 学术风格：逻辑严谨，论证充分，引用准确，表达精确\n';
            break;
        case 'narrative':
            styleGuide = '\n// 叙事风格：故事性强，时间线清晰，人物鲜明，情节紧凑\n';
            break;
        default:
            styleGuide = '\n// 标准风格：简洁明了，通俗易懂，结构清晰\n';
    }
    
    showNotification(`已切换到${document.querySelector('#writing-style option:checked').text}`, 'success');
}

// 编辑器滚动处理
function handleEditorScroll() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    updateCursorPosition();
}

// 情感分析
async function insertEmotionAnalysis() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    const analysisText = selectedText || editor.value.substring(Math.max(0, editor.value.length - 500));
    
    if (!analysisText.trim()) {
        showNotification('请先输入一些文本进行分析', 'warning');
        return;
    }
    
    try {
        showLoadingIndicator('正在进行情感分析...');
        
        if (multiAgentCoordinator) {
            const result = await multiAgentCoordinator.startWorkflow(`分析以下文本的情感色彩：${analysisText}`);
            
            hideLoadingIndicator();
            
            if (result.success) {
                const analysis = result.workflow.results.response.answer.content;
                insertTextAtCursor(`\n\n[情感分析]\n${analysis}\n`);
                showNotification('情感分析已完成', 'success');
            } else {
                showNotification('情感分析失败，请重试', 'error');
            }
        } else {
            // 简化的情感分析
            const emotions = ['积极', '消极', '中性'];
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            insertTextAtCursor(`\n\n[情感分析：${emotion}]\n`);
            hideLoadingIndicator();
        }
        
    } catch (error) {
        console.error('情感分析失败:', error);
        hideLoadingIndicator();
        showNotification('情感分析失败，请重试', 'error');
    }
}

// 结构建议
async function insertStructureSuggestion() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const currentText = editor.value;
    
    try {
        showLoadingIndicator('正在生成结构建议...');
        
        if (storyCreationAgent) {
            const result = await storyCreationAgent.processUserInput('为当前文本提供结构建议和优化方案');
            
            hideLoadingIndicator();
            
            if (result && result.type === 'plot_planning') {
                const suggestions = result.suggestions || ['增加更多细节描述', '优化段落过渡', '加强逻辑连贯性'];
                insertTextAtCursor(`\n\n[结构建议]\n${suggestions.join('\n• ')}\n`);
                showNotification('结构建议已生成', 'success');
            } else {
                showNotification('结构建议生成失败，请重试', 'error');
            }
        } else {
            // 简化的结构建议
            const suggestions = [
                '建议在开头设置一个引人入胜的钩子',
                '中间部分可以增加更多细节和例子',
                '结尾应该有力并呼应开头'
            ];
            insertTextAtCursor(`\n\n[结构建议]\n${suggestions.join('\n• ')}\n`);
            hideLoadingIndicator();
        }
        
    } catch (error) {
        console.error('结构建议生成失败:', error);
        hideLoadingIndicator();
        showNotification('结构建议生成失败，请重试', 'error');
    }
}

// 在光标位置插入文本
function insertTextAtCursor(text) {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const currentText = editor.value;
    
    const newText = currentText.substring(0, start) + text + currentText.substring(end);
    editor.value = newText;
    
    // 设置光标位置
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus();
    
    updateStats();
}

// 增强自动保存
function enhanceAutoSave() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    // 添加输入监听
    let saveTimeout;
    editor.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            autoSaveDocument();
        }, 2000); // 2秒后自动保存
    });
    
    // 添加光标移动监听
    editor.addEventListener('keyup', updateCursorPosition);
    editor.addEventListener('click', updateCursorPosition);
}

// 自动保存文档
function autoSaveDocument() {
    const editor = document.getElementById('writing-editor');
    const titleInput = document.getElementById('document-title');
    
    if (!editor || !titleInput) return;
    
    const document = {
        title: titleInput.value,
        content: editor.value,
        wordCount: writingStats.wordCount,
        lastModified: new Date().toISOString(),
        project: currentProject
    };
    
    // 保存到localStorage
    localStorage.setItem(`autosave_${currentProject}`, JSON.stringify(document));
    writingStats.lastSavedTime = Date.now();
    updateLastSavedTime();
    
    console.log('自动保存完成');
}

// 显示加载指示器
function showLoadingIndicator(message = '处理中...') {
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    indicator.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(indicator);
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 更新AI建议
function updateAISuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('ai-suggestions');
    if (!suggestionsContainer || !suggestions || suggestions.length === 0) return;
    
    suggestionsContainer.innerHTML = '';
    
    suggestions.slice(0, 3).forEach((suggestion, index) => {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'ai-suggestion p-3 rounded-lg';
        suggestionEl.innerHTML = `
            <p class="text-sm text-gray-700">${suggestion}</p>
            <button onclick="applySuggestion(${index})" class="text-xs text-orange-600 hover:text-orange-800 mt-2">应用建议</button>
        `;
        suggestionsContainer.appendChild(suggestionEl);
    });
}

// 高级故事创作功能
async function createStoryWithAI(genre, theme) {
    try {
        if (!storyCreationAgent) {
            console.warn('故事创作代理未初始化，使用本地模板');
            return null;
        }
        
        const query = `创作一个${genre}类型的故事，主题是${theme}，请生成故事大纲`;
        const result = await storyCreationAgent.processUserInput(query);
        
        if (result && result.type === 'plot_planning') {
            // 处理情节规划结果
            const outlineItems = result.outline || [];
            const suggestions = result.suggestions || [];
            
            return {
                outline: outlineItems.map(item => `${item.phase}：${item.description}`).concat(suggestions),
                templates: result.structures ? Object.keys(result.structures) : [],
                questions: []
            };
        }
        
        if (result && result.type === 'story_creation') {
            // 处理故事创建结果
            return {
                outline: result.suggestions || ['故事创作建议1', '故事创作建议2'],
                templates: result.templates || ['模板1', '模板2'],
                questions: result.questions || []
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('故事创作失败:', error);
        return null;
    }
}

// 智能角色生成
function generateCharacter(archetype) {
    if (!storyTemplates) {
        return null;
    }
    
    try {
        const character = storyTemplates.generateCharacter(archetype);
        
        // 格式化角色信息
        const formattedCharacter = `
角色名称：${character.name}
角色原型：${character.archetype}
外貌特征：${character.physical.bodyType}，${character.physical.hairColor}头发，${character.physical.eyeColor}眼睛
性格特点：${character.traits ? character.traits.join('、') : '待定'}
背景故事：${character.backstory || '待定'}
        `;
        
        return {
            raw: character,
            formatted: formattedCharacter.trim()
        };
        
    } catch (error) {
        console.error('角色生成失败:', error);
        return null;
    }
}

// 获取故事模板
function getStoryTemplates(genre = null) {
    if (!storyTemplates) {
        return [];
    }
    
    try {
        if (genre) {
            return storyTemplates.getTemplatesByGenre(genre);
        }
        
        // 返回所有模板
        const allTemplates = [];
        for (const [genreKey, genreData] of Object.entries(storyTemplates.templates)) {
            genreData.templates.forEach(template => {
                allTemplates.push({
                    genre: genreData.name,
                    ...template
                });
            });
        }
        
        return allTemplates;
        
    } catch (error) {
        console.error('获取模板失败:', error);
        return [];
    }
}

// 智能文本分析
async function analyzeTextAdvanced(text) {
    try {
        showLoadingIndicator('正在分析文本...');
        
        if (!multiAgentCoordinator) {
            throw new Error('多代理系统未初始化');
        }
        
        const query = `分析以下文本的质量和改进建议：${text}`;
        const result = await multiAgentCoordinator.startWorkflow(query);
        
        hideLoadingIndicator();
        
        if (result.success) {
            return {
                analysis: result.workflow.results.response.answer.content,
                suggestions: result.workflow.results.response.answer.suggestions,
                score: result.workflow.results.validation.overallScore
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('文本分析失败:', error);
        hideLoadingIndicator();
        return null;
    }
}

// 生成AI建议
function generateAISuggestions(text) {
    if (!text || text.length < 50) return;
    
    const suggestionsContainer = document.getElementById('ai-suggestions');
    if (!suggestionsContainer) return;
    
    // 模拟AI分析延迟
    setTimeout(() => {
        const randomSuggestions = aiSuggestions.slice(0, 2);
        suggestionsContainer.innerHTML = '';
        
        randomSuggestions.forEach((suggestion, index) => {
            const suggestionEl = document.createElement('div');
            suggestionEl.className = 'ai-suggestion p-3 rounded-lg';
            suggestionEl.innerHTML = `
                <p class="text-sm text-gray-700">${suggestion}</p>
                <button onclick="applySuggestion(${index})" class="text-xs text-orange-600 hover:text-orange-800 mt-2">应用建议</button>
            `;
            suggestionsContainer.appendChild(suggestionEl);
        });
    }, 1000);
}

// 新建文档函数
function createNewDocument() {
    const projectName = prompt('请输入文档名称：');
    if (!projectName || projectName.trim() === '') {
        return;
    }
    
    // 生成唯一的项目ID
    const projectId = 'doc_' + Date.now();
    
    // 创建新项目到项目列表
    const projectList = document.getElementById('project-list');
    const newProject = document.createElement('div');
    newProject.className = 'document-item p-3 rounded-lg border border-gray-200';
    newProject.onclick = () => selectProject(projectId);
    newProject.innerHTML = `
        <div class="flex items-center">
            <div class="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <div>
                <h4 class="font-medium text-gray-800">${projectName}</h4>
                <p class="text-sm text-gray-500">刚刚创建</p>
            </div>
        </div>
    `;
    
    // 插入到项目列表顶部
    projectList.insertBefore(newProject, projectList.firstChild);
    
    // 清空编辑器并设置新标题
    const editor = document.getElementById('writing-editor');
    const titleInput = document.getElementById('document-title');
    
    if (titleInput) {
        titleInput.value = projectName;
    }
    
    if (editor) {
        editor.value = '';
        updateStats();
    }
    
    // 更新当前项目
    currentProject = projectId;
    
    // 显示创建动画
    anime({
        targets: newProject,
        translateX: [-300, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutExpo'
    });
    
    // 显示成功提示
    showNotification('新文档创建成功', 'success');
    
    // 自动聚焦到编辑器
    if (editor) {
        setTimeout(() => {
            editor.focus();
        }, 300);
    }
}

// 项目相关函数
function selectProject(projectId) {
    currentProject = projectId;
    
    // 更新UI显示
    const projectItems = document.querySelectorAll('.document-item');
    projectItems.forEach(item => {
        item.classList.remove('bg-blue-50', 'border-blue-300');
    });
    
    event.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
    
    // 加载项目内容
    loadProjectContent(projectId);
    
    // 显示选择动画
    anime({
        targets: event.currentTarget,
        scale: [1, 1.05, 1],
        duration: 300,
        easing: 'easeInOutQuad'
    });
}

function createNewProject() {
    const projectName = prompt('请输入项目名称：');
    if (!projectName) return;
    
    // 创建新项目
    const projectList = document.getElementById('project-list');
    const newProject = document.createElement('div');
    newProject.className = 'document-item p-3 rounded-lg border border-gray-200';
    newProject.onclick = () => selectProject('new-project');
    newProject.innerHTML = `
        <div class="flex items-center">
            <div class="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <div>
                <h4 class="font-medium text-gray-800">${projectName}</h4>
                <p class="text-sm text-gray-500">刚刚创建</p>
            </div>
        </div>
    `;
    
    projectList.insertBefore(newProject, projectList.firstChild);
    
    // 添加创建动画
    anime({
        targets: newProject,
        translateX: [-300, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutExpo'
    });
}

function loadProjectContent(projectId) {
    const editor = document.getElementById('writing-editor');
    const titleInput = document.getElementById('document-title');
    
    const projectContents = {
        'novel': {
            title: '科幻小说：星际迷航',
            content: '在遥远的未来，人类已经掌握了星际旅行的技术。主角李明是一名星际探索队的队长，他带领着团队前往未知的星系进行探索任务。\n\n这是他们第47次执行任务，目标是位于银河系边缘的一个神秘星系。据探测，这个星系中可能存在适合人类居住的行星。\n\n"所有人注意，我们即将进入目标星系。"李明通过通讯器向全队发出通知。飞船上的每个人都紧张而兴奋，因为这次任务可能会改变人类的历史。'
        },
        'essay': {
            title: '人工智能对现代社会的影响',
            content: '人工智能技术的发展正在深刻地改变着我们的社会。从工业生产到日常生活，AI的应用无处不在。\n\n首先，在工业领域，人工智能大大提高了生产效率。智能机器人可以24小时不间断工作，减少了人力成本，提高了产品质量。\n\n其次，在服务行业，AI技术也发挥着重要作用。智能客服、推荐系统、自动驾驶等技术正在改变着我们的生活方式。'
        },
        'blog': {
            title: '如何提高写作效率',
            content: '写作是一项需要持续练习的技能。想要提高写作效率，需要掌握一些实用的技巧。\n\n第一，建立固定的写作习惯。每天安排固定的时间进行写作，让大脑形成写作的条件反射。\n\n第二，学会使用大纲。在写作前先列出文章大纲，明确每个段落的要点，这样可以避免写作过程中的思路混乱。\n\n第三，善用写作工具。现代科技为我们提供了很多优秀的写作工具，合理利用这些工具可以大大提高写作效率。'
        },
        'report': {
            title: '2025年第一季度工作总结',
            content: '本季度，我们团队在公司领导的指导下，圆满完成了各项工作任务。现将主要工作情况总结如下：\n\n一、业务发展情况\n本季度新增客户15个，完成销售额500万元，超额完成季度目标的120%。\n\n二、团队建设情况\n新招聘员工3名，组织了2次专业技能培训，团队整体业务能力得到提升。\n\n三、存在的问题\n1. 客户维护工作需要加强\n2. 内部沟通机制有待完善\n3. 项目管理流程需要优化'
        }
    };
    
    const project = projectContents[projectId] || projectContents['novel'];
    
    if (titleInput) titleInput.value = project.title;
    if (editor) editor.value = project.content;
    
    updateStats();
}

// AI功能相关函数
function generateContent() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const currentText = editor.value;
    
    // 使用多代理系统生成内容
    if (multiAgentCoordinator && storyCreationAgent) {
        generateAdvancedContent(currentText, editor);
    } else {
        // 回退到原有方法
        const generatedContent = generateStoryContinuation(currentText);
        editor.value = currentText + '\n\n' + generatedContent;
        updateStats();
    }
    
    // 显示生成动画
    const button = event.target;
    anime({
        targets: button,
        scale: [1, 1.1, 1],
        backgroundColor: ['#FED7AA', '#F6AD55', '#FED7AA'],
        duration: 600,
        easing: 'easeInOutQuad'
    });
}

// 高级内容生成 - 使用多代理系统
async function generateAdvancedContent(currentText, editor) {
    try {
        // 显示加载状态
        showLoadingIndicator('正在生成内容...');
        
        // 使用多代理协调器处理请求
        const query = `续写以下内容：${currentText.substring(Math.max(0, currentText.length - 200))}`;
        const result = await multiAgentCoordinator.startWorkflow(query);
        
        if (result.success) {
            const generatedContent = result.finalAnswer.content || result.workflow.results.response.answer.content;
            editor.value = currentText + '\n\n' + generatedContent;
            
            // 更新AI建议面板
            updateAISuggestions(result.workflow.results.response.answer.suggestions || []);
        } else {
            console.error('内容生成失败:', result.error);
            // 回退到原有方法
            const fallbackContent = generateStoryContinuation(currentText);
            editor.value = currentText + '\n\n' + fallbackContent;
        }
        
        updateStats();
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('高级内容生成出错:', error);
        hideLoadingIndicator();
        
        // 回退到原有方法
        const fallbackContent = generateStoryContinuation(currentText);
        editor.value = currentText + '\n\n' + fallbackContent;
        updateStats();
    }
}

function improveText() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    if (!selectedText) {
        alert('请先选择要优化的文本');
        return;
    }
    
    // 使用高级文本分析
    if (multiAgentCoordinator) {
        improveTextAdvanced(selectedText, editor);
    } else {
        // 回退到原有方法
        const improvedText = improveSelectedText(selectedText);
        const fullText = editor.value;
        const newText = fullText.substring(0, editor.selectionStart) + improvedText + fullText.substring(editor.selectionEnd);
        editor.value = newText;
        updateStats();
    }
}

// 高级文本改进
async function improveTextAdvanced(selectedText, editor) {
    try {
        showLoadingIndicator('正在优化文本...');
        
        const query = `改进和优化以下文本：${selectedText}`;
        const result = await multiAgentCoordinator.startWorkflow(query);
        
        hideLoadingIndicator();
        
        if (result.success) {
            const improvedContent = result.workflow.results.response.answer.content;
            const fullText = editor.value;
            const newText = fullText.substring(0, editor.selectionStart) + improvedContent + fullText.substring(editor.selectionEnd);
            
            editor.value = newText;
            updateStats();
            
            // 显示改进建议
            if (result.workflow.results.response.answer.suggestions) {
                showNotification('文本已优化，请查看改进建议', 'success');
            }
        } else {
            // 回退到原有方法
            const improvedText = improveSelectedText(selectedText);
            const fullText = editor.value;
            const newText = fullText.substring(0, editor.selectionStart) + improvedText + fullText.substring(editor.selectionEnd);
            editor.value = newText;
            updateStats();
        }
        
    } catch (error) {
        console.error('高级文本改进失败:', error);
        hideLoadingIndicator();
        
        // 回退到原有方法
        const improvedText = improveSelectedText(selectedText);
        const fullText = editor.value;
        const newText = fullText.substring(0, editor.selectionStart) + improvedText + fullText.substring(editor.selectionEnd);
        editor.value = newText;
        updateStats();
    }
}

function checkGrammar() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    // 模拟语法检查
    const issues = [
        { text: '所有人注意', suggestion: '所有人请注意', type: '语法' },
        { text: '紧张而兴奋', suggestion: '既紧张又兴奋', type: '表达' }
    ];
    
    if (issues.length > 0) {
        let message = '发现以下问题：\n';
        issues.forEach(issue => {
            message += `- ${issue.type}问题: "${issue.text}" → "${issue.suggestion}"\n`;
        });
        alert(message);
    } else {
        alert('没有发现语法问题！');
    }
}

function generateInspiration() {
    const inspirationContent = document.getElementById('inspiration-content');
    if (!inspirationContent) return;
    
    const randomInspiration = inspirationIdeas[Math.floor(Math.random() * inspirationIdeas.length)];
    inspirationContent.textContent = randomInspiration;
    
    // 添加生成动画
    anime({
        targets: inspirationContent,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutExpo'
    });
}

function generateOutline() {
    const editor = document.getElementById('writing-editor');
    if (!editor) {
        showNotification('找不到编辑器', 'error');
        return;
    }
    
    const currentText = editor.value;
    
    // 生成基础大纲模板
    const outline = `# 故事大纲

## 主要角色
- 主角：待定
- 配角：待定  
- 反派：待定

## 故事背景
- 时间：现代/古代/未来
- 地点：待定
- 世界观：待定

## 情节发展
### 第一阶段：开端
- 介绍主要角色和背景设定
- 确立故事的基本冲突
- 为后续发展埋下伏笔

### 第二阶段：发展
- 主角面临挑战和困难
- 各种矛盾逐渐激化
- 角色经历成长和变化

### 第三阶段：高潮
- 故事冲突达到顶点
- 主角做出关键选择
- 决定最终走向

### 第四阶段：结局
- 解决主要冲突
- 角色命运的最终安排
- 留下思考空间或后续发展

## 主题思想
- 核心主题：待定
- 次要主题：待定

## 创作笔记
- 每章字数目标：2000-3000字
- 重点描写：人物心理、场景细节、对话风格
- 时间安排：每日一章，定期回顾`;
    
    // 在编辑器中添加大纲
    editor.value = currentText + '\n\n' + outline;
    updateStats();
    showNotification('大纲模板已添加到编辑器', 'success');
}

function analyzeTone() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const text = editor.value;
    const tone = analyzeTextTone(text);
    
    alert(`文本语调分析：\n- 主要语调: ${tone.primary}\n- 情感色彩: ${tone.emotion}\n- 正式程度: ${tone.formality}`);
}

function findSynonyms() {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
    if (!selectedText) {
        alert('请先选择要查找同义词的词语');
        return;
    }
    
    const synonyms = getSynonyms(selectedText);
    if (synonyms.length > 0) {
        alert(`"${selectedText}"的同义词：\n${synonyms.join(', ')}`);
    } else {
        alert('未找到同义词');
    }
}

// 应用建议
function applySuggestion(index) {
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    // 根据建议索引应用不同的改进
    switch(index) {
        case 0:
            // 添加环境描写
            const environmentText = '\n\n飞船内部充满了科技感的蓝光，控制台上的显示屏不断闪烁着各种数据。空气中弥漫着轻微的臭氧味道，这是离子引擎运行时产生的特征气味。';
            editor.value = editor.value + environmentText;
            break;
        case 1:
            // 改进对话
            const improvedDialogue = '\n\n"所有人注意，我们即将进入目标星系。"李明的声音通过通讯系统传遍整个飞船，语调中既有指挥官的威严，又难掩内心的激动。"检查所有系统，确保一切正常。"';
            editor.value = editor.value.replace(/"所有人注意，我们即将进入目标星系。"李明通过通讯器向全队发出通知。/, improvedDialogue);
            break;
    }
    
    updateStats();
    
    // 显示应用成功动画
    anime({
        targets: editor,
        backgroundColor: ['#ffffff', '#f0fff4', '#ffffff'],
        duration: 1000,
        easing: 'easeInOutQuad'
    });
}

// 文档操作函数
function saveDocument() {
    const editor = document.getElementById('writing-editor');
    const titleInput = document.getElementById('document-title');
    
    if (!editor || !titleInput) return;
    
    const document = {
        title: titleInput.value,
        content: editor.value,
        wordCount: writingStats.wordCount,
        lastModified: new Date().toISOString(),
        project: currentProject
    };
    
    // 保存到localStorage
    localStorage.setItem(`document_${currentProject}`, JSON.stringify(document));
    
    // 显示保存成功动画
    const saveButton = event.target;
    anime({
        targets: saveButton,
        scale: [1, 1.1, 1],
        backgroundColor: ['#F0FDF4', '#22C55E', '#F0FDF4'],
        duration: 800,
        easing: 'easeInOutQuad'
    });
    
    // 显示保存成功消息
    showNotification('文档已保存', 'success');
}

// 增强的导出功能
function exportDocument(format = 'txt') {
    const editor = document.getElementById('writing-editor');
    const titleInput = document.getElementById('document-title');
    
    if (!editor || !titleInput) return;
    
    const title = titleInput.value || '未命名作品';
    const content = editor.value;
    let exportContent = '';
    let mimeType = '';
    let fileExtension = '';

    switch(format) {
        case 'html':
            exportContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Noto Serif SC', serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { color: #2D3748; border-bottom: 2px solid #F6AD55; padding-bottom: 10px; }
        .meta { color: #718096; margin-bottom: 30px; }
        .stats { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="meta">
        <p>字数：${writingStats.charCount} | 创建时间：${new Date().toLocaleString()}</p>
    </div>
    <div class="stats">
        <strong>写作统计：</strong>
        <ul>
            <li>预计阅读时间：${Math.ceil(writingStats.charCount / 300)}分钟</li>
            <li>写作速度：${writingStats.writingSpeed}字/分钟</li>
        </ul>
    </div>
    <div>${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
            mimeType = 'text/html';
            fileExtension = 'html';
            break;
        case 'markdown':
            exportContent = `# ${title}\n\n---\n\n**统计信息**\n- 字数：${writingStats.charCount}\n- 预计阅读时间：${Math.ceil(writingStats.charCount / 300)}分钟\n- 写作速度：${writingStats.writingSpeed}字/分钟\n- 创建时间：${new Date().toLocaleString()}\n---\n\n${content}`;
            mimeType = 'text/markdown';
            fileExtension = 'md';
            break;
        case 'pdf':
            // 注意：实际PDF生成需要专门的库，这里简化为HTML
            exportContent = generatePDFFormat(title, content);
            mimeType = 'application/pdf';
            fileExtension = 'pdf';
            break;
        case 'docx':
            exportContent = generateWordFormat(title, content);
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fileExtension = 'docx';
            break;
        default: // txt
            exportContent = `${title}\n${'='.repeat(title.length)}\n\n统计信息：\n- 字数：${writingStats.charCount}\n- 预计阅读时间：${Math.ceil(writingStats.charCount / 300)}分钟\n- 写作速度：${writingStats.writingSpeed}字/分钟\n- 创建时间：${new Date().toLocaleString()}\n\n${content}`;
            mimeType = 'text/plain';
            fileExtension = 'txt';
    }

    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`✅ 文档已导出为 ${format.toUpperCase()} 格式`, 'success');
}

// 生成PDF格式（简化版）
function generatePDFFormat(title, content) {
    return `<html>
<head><title>${title}</title></head>
<body style="font-family: 'Noto Serif SC', serif;">
<h1>${title}</h1>
<p>字数：${writingStats.charCount} | 创建时间：${new Date().toLocaleString()}</p>
<div>${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
}

// 生成Word格式（简化版）
function generateWordFormat(title, content) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title></head><body>
<h1>${title}</h1>
<div class="stats">
<p>字数：${writingStats.charCount} | 创建时间：${new Date().toLocaleString()}</p>
</div>
<div>${content.replace(/\n/g, '</p><p>')}</div>
</body></html>`;
}

// 分享功能
function shareDocument() {
    const title = document.getElementById('document-title').value || '未命名作品';
    const content = document.getElementById('writing-editor').value;
    const shareData = {
        title: title,
        text: `查看我的作品《${title}》\n字数：${writingStats.charCount}\n预计阅读时间：${Math.ceil(writingStats.charCount / 300)}分钟`,
        url: window.location.href
    };

    // 创建分享模态框
    const shareModal = document.createElement('div');
    shareModal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    shareModal.innerHTML = `
        <div class="bg-white rounded-lg max-w-md w-full p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800">分享作品</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-700">${shareData.text}</p>
                </div>
                
                <div class="flex space-x-2">
                    ${navigator.share ? `
                        <button onclick="shareNative()" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                            系统分享
                        </button>
                    ` : ''}
                    <button onclick="copyShareText()" class="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                        复制链接
                    </button>
                    <button onclick="generateShareImage()" class="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors">
                        生成图片
                    </button>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">更多分享选项：</h4>
                    <div class="grid grid-cols-3 gap-2">
                        <button onclick="shareToWeChat()" class="p-2 bg-green-50 rounded-lg text-green-700 text-sm hover:bg-green-100">
                            微信
                        </button>
                        <button onclick="shareToWeibo()" class="p-2 bg-red-50 rounded-lg text-red-700 text-sm hover:bg-red-100">
                            微博
                        </button>
                        <button onclick="shareToQQ()" class="p-2 bg-blue-50 rounded-lg text-blue-700 text-sm hover:bg-blue-100">
                            QQ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(shareModal);
    
    // 绑定全局函数
    window.shareNative = () => {
        navigator.share(shareData)
            .then(() => {
                showNotification('✅ 分享成功', 'success');
                shareModal.remove();
            })
            .catch(err => console.log('分享取消或失败', err));
    };
    
    window.copyShareText = () => {
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`).then(() => {
            showNotification('📋 链接已复制到剪贴板', 'success');
            shareModal.remove();
        });
    };
    
    window.generateShareImage = () => {
        generateShareImageCard(title, writingStats);
        shareModal.remove();
    };
    
    window.shareToWeChat = () => showNotification('📱 请使用微信扫码分享', 'info');
    window.shareToWeibo = () => openShareWindow('weibo', shareData);
    window.shareToQQ = () => openShareWindow('qq', shareData);
}

// 打开分享窗口
function openShareWindow(platform, data) {
    const urls = {
        weibo: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`,
        qq: `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(data.title)}&summary=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    showNotification(`正在打开${platform}分享页面`, 'info');
}

// 生成分享图片卡片
function generateShareImageCard(title, stats) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;
    
    // 绘制背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 800, 400);
    gradient.addColorStop(0, '#F6AD55');
    gradient.addColorStop(1, '#2D3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 400);
    
    // 绘制文本
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Noto Sans SC';
    ctx.textAlign = 'center';
    ctx.fillText('AI写作助手', 400, 80);
    
    ctx.font = '28px Noto Serif SC';
    ctx.fillText(title, 400, 180);
    
    ctx.font = '18px Noto Sans SC';
    ctx.fillText(`字数：${stats.charCount}`, 400, 250);
    ctx.fillText(`阅读时间：${Math.ceil(stats.charCount / 300)}分钟`, 400, 280);
    
    ctx.font = '14px Noto Sans SC';
    ctx.fillText(new Date().toLocaleDateString(), 400, 350);
    
    // 下载图片
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}_分享卡片.png`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('📸 分享图片已生成', 'success');
    });
}

// 辅助函数
function startWriting() {
    const editor = document.getElementById('writing-editor');
    if (editor) {
        editor.focus();
        editor.scrollIntoView({ behavior: 'smooth' });
    }
}

function showFeatures() {
    const featuresSection = document.querySelector('.py-16.bg-white');
    if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function loadUserData() {
    // 从localStorage加载用户数据
    const savedData = localStorage.getItem('ai_writing_user_data');
    if (savedData) {
        const userData = JSON.parse(savedData);
        // 应用保存的用户设置
        console.log('加载用户数据:', userData);
    }
}

function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 显示动画
    anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutExpo'
    });
    
    // 3秒后自动消失
    setTimeout(() => {
        anime({
            targets: notification,
            translateX: [0, 300],
            opacity: [1, 0],
            duration: 500,
            easing: 'easeInExpo',
            complete: () => {
                document.body.removeChild(notification);
            }
        });
    }, 3000);
}

// AI内容生成函数
function generateStoryContinuation(currentText) {
    const continuations = [
        '突然，飞船的警报系统响起了刺耳的警报声。"检测到未知能量源！"副驾驶小王紧张地报告。李明立即走到控制台前，查看着显示屏上的数据。\n\n"所有人保持冷静，按照应急预案行动。"李明沉声说道，同时快速分析着眼前的状况。',
        '就在这时，飞船外的景象发生了奇妙的变化。原本漆黑的太空中突然出现了一道绚丽的光带，像是某种神秘的力量在引导着他们。\n\n"这是什么？"团队成员们都惊呆了。李明仔细观察着这道光带，发现它似乎在指向某个特定的方向。',
        '飞船的通讯系统突然接收到了一段神秘的信号。经过一番解码，他们发现这似乎是一种欢迎的信息。\n\n"看来我们不是第一个来到这里的人类。"李明若有所思地说道。这个发现让整个团队都兴奋不已，同时也充满了疑问。'
    ];
    
    return continuations[Math.floor(Math.random() * continuations.length)];
}

function improveSelectedText(selectedText) {
    const improvements = {
        '所有人注意': '所有人请注意',
        '紧张而兴奋': '既紧张又兴奋',
        '通过通讯器': '通过通讯系统',
        '发出了通知': '下达了指令'
    };
    
    return improvements[selectedText] || selectedText;
}

function analyzeTextTone(text) {
    return {
        primary: '叙事性',
        emotion: '中性偏积极',
        formality: '中等正式'
    };
}

function getSynonyms(word) {
    const synonymMap = {
        '紧张': ['焦虑', '担忧', '不安'],
        '兴奋': ['激动', '振奋', '激昂'],
        '神秘': ['神奇', '奇异', '奥妙'],
        '探索': ['探险', '考察', '研究']
    };
    
    return synonymMap[word] || [];
}

function generateStoryOutline(text) {
    return `1. 引言部分\n   - 介绍主角和背景\n   - 设定故事基调\n\n2. 发展阶段\n   - 团队进入目标星系\n   - 发现异常情况\n   - 面临挑战和选择\n\n3. 高潮部分\n   - 关键事件的发生\n   - 角色成长和转变\n\n4. 结局部分\n   - 问题解决或新的发展\n   - 为未来故事埋下伏笔`;
}

// ================== AI-Writer 相关函数 ==================

// 初始化AI-Writer
async function initializeAIWriter() {
    try {
        aiWriter = new AIWriter();
        console.log('🤖 [AI-Writer] 初始化中...');
        
        // 异步初始化（不阻塞主界面）
        setTimeout(async () => {
            const result = await aiWriter.initialize();
            if (result.status === 'success') {
                console.log('✅ [AI-Writer] 初始化成功');
                showNotification('AI-Writer已就绪，支持5种网络小说题材', 'success');
            } else {
                console.error('❌ [AI-Writer] 初始化失败:', result.message);
                showNotification('AI-Writer初始化失败，将使用简化模式', 'error');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ [AI-Writer] 初始化错误:', error);
        showNotification('AI-Writer暂时不可用', 'error');
    }
}

// 切换AI-Writer面板显示
function toggleAIWriter() {
    const panel = document.getElementById('ai-writer-panel');
    if (!panel) return;
    
    aiWriterPanelVisible = !aiWriterPanelVisible;
    
    if (aiWriterPanelVisible) {
        panel.classList.remove('hidden');
        panel.classList.add('ai-writer-panel');
        
        // 添加显示动画
        anime({
            targets: panel,
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 500,
            easing: 'easeOutExpo'
        });
        
    } else {
        panel.classList.add('hidden');
    }
}

// 生成AI内容
async function generateAIContent() {
    if (!aiWriter) {
        showNotification('AI-Writer尚未初始化完成', 'warning');
        return;
    }
    
    const editor = document.getElementById('writing-editor');
    const genreSelect = document.getElementById('genre-select');
    const modeSelect = document.getElementById('mode-select');
    const statusDiv = document.getElementById('ai-writer-status');
    const resultDiv = document.getElementById('ai-writer-result');
    const contentDiv = document.getElementById('ai-generated-content');
    
    if (!editor || !genreSelect || !modeSelect) return;
    
    const selectedGenre = genreSelect.value;
    const selectedMode = modeSelect.value;
    
    // 获取当前文本作为上下文
    const currentText = editor.value;
    const prompt = currentText.length > 0 
        ? currentText.substring(Math.max(0, currentText.length - 500)) 
        : `请生成一个${getGenreName(selectedGenre)}题材的${getModeName(selectedMode)}内容`;
    
    // 显示状态
    statusDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    try {
        // 调用AI-Writer生成内容
        const result = await aiWriter.generateContent(prompt, {
            genre: selectedGenre,
            mode: selectedMode,
            length: 300,
            temperature: 0.8
        });
        
        if (result.status === 'success') {
            currentAIContent = result.content;
            
            // 显示生成结果
            contentDiv.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center gap-2">
                        <span class="genre-badge genre-${selectedGenre}">${getGenreName(selectedGenre)}</span>
                        <span class="text-xs text-gray-500">${getModeName(selectedMode)}</span>
                    </div>
                    <p class="text-gray-700 leading-relaxed">${result.content}</p>
                    <div class="text-xs text-gray-500 border-t pt-2 mt-2">
                        <span>质量: ${result.statistics.quality}</span> | 
                        <span>字数: ${result.statistics.wordCount}</span> | 
                        <span>用时: ${result.statistics.generationTime.toFixed(1)}s</span>
                    </div>
                </div>
            `;
            
            // 显示结果面板
            resultDiv.classList.remove('hidden');
            
            // 添加显示动画
            anime({
                targets: resultDiv,
                opacity: [0, 1],
                scale: [0.95, 1],
                duration: 300,
                easing: 'easeOutExpo'
            });
            
            console.log('✅ [AI-Writer] 内容生成成功:', result);
            
        } else {
            throw new Error(result.message || '生成失败');
        }
        
    } catch (error) {
        console.error('❌ [AI-Writer] 生成失败:', error);
        
        // 显示错误信息和备用内容
        currentAIContent = result.fallbackContent || '内容生成暂时不可用，请稍后重试。';
        contentDiv.innerHTML = `
            <p class="text-gray-700">${currentAIContent}</p>
            <p class="text-xs text-red-500 mt-2">生成遇到问题，这是备用内容</p>
        `;
        resultDiv.classList.remove('hidden');
        
    } finally {
        // 隐藏状态
        statusDiv.classList.add('hidden');
    }
}

// 应用AI-Writer生成的内容
function applyAIWriterContent() {
    if (!currentAIContent) {
        showNotification('没有可应用的内容', 'warning');
        return;
    }
    
    const editor = document.getElementById('writing-editor');
    if (!editor) return;
    
    // 在光标位置插入内容
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, cursorPos);
    const textAfter = editor.value.substring(cursorPos);
    
    editor.value = textBefore + '\n\n' + currentAIContent + '\n\n' + textAfter;
    
    // 设置新的光标位置
    const newCursorPos = cursorPos + 2 + currentAIContent.length;
    editor.setSelectionRange(newCursorPos, newCursorPos);
    
    // 更新统计
    updateStats();
    
    // 显示成功动画
    anime({
        targets: editor,
        backgroundColor: ['#ffffff', '#f0f9ff', '#ffffff'],
        duration: 1000,
        easing: 'easeInOutQuad'
    });
    
    showNotification('AI-Writer内容已应用到编辑器', 'success');
    
    // 隐藏结果面板
    const resultDiv = document.getElementById('ai-writer-result');
    if (resultDiv) {
        resultDiv.classList.add('hidden');
    }
}

// 获取题材中文名
function getGenreName(genre) {
    const genreNames = {
        fantasy: '玄幻',
        romance: '言情', 
        urban: '都市',
        scifi: '科幻',
        historical: '历史'
    };
    return genreNames[genre] || '未知';
}

// 获取模式中文名
function getModeName(mode) {
    const modeNames = {
        continuation: '自动续写',
        inspiration: '灵感创作',
        dialogue: '对话生成',
        description: '场景描写',
        climax: '高潮情节'
    };
    return modeNames[mode] || '未知';
}

// ================== 原有函数继续 ==================

// 登录注册相关函数
function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

function showRegisterModal() {
    document.getElementById('register-modal').classList.remove('hidden');
}

function closeRegisterModal() {
    document.getElementById('register-modal').classList.add('hidden');
}

function switchToRegister() {
    closeLoginModal();
    showRegisterModal();
}

function switchToLogin() {
    closeRegisterModal();
    showLoginModal();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        showNotification('请填写用户名和密码', 'error');
        return;
    }
    
    try {
        const success = await dbIntegration.login(username, password);
        
        if (success) {
            closeLoginModal();
            updateUserInterface();
            showNotification('登录成功！', 'success');
        }
    } catch (error) {
        console.error('登录失败:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const displayName = document.getElementById('register-displayname').value;
    const password = document.getElementById('register-password').value;
    
    if (!username || !email || !password) {
        showNotification('请填写必填项', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密码长度至少6位', 'error');
        return;
    }
    
    try {
        const success = await dbIntegration.register({
            username,
            email,
            displayName,
            password
        });
        
        if (success) {
            closeRegisterModal();
            showLoginModal();
        }
    } catch (error) {
        console.error('注册失败:', error);
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    menu.classList.toggle('hidden');
}

function showUserProfile() {
    document.getElementById('user-menu').classList.add('hidden');
    showNotification('个人资料功能开发中...', 'info');
}

function updateUserInterface() {
    const status = dbIntegration.getStatus();
    const loginButtons = document.getElementById('login-buttons');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const syncIndicator = document.getElementById('sync-indicator');
    const syncText = document.getElementById('sync-text');
    
    if (status.currentUser) {
        // 已登录状态
        loginButtons.classList.add('hidden');
        userInfo.classList.remove('hidden');
        usernameDisplay.textContent = status.currentUser.username;
        
        if (status.onlineMode) {
            syncIndicator.className = 'w-2 h-2 bg-green-500 rounded-full';
            syncText.textContent = '已同步';
        } else {
            syncIndicator.className = 'w-2 h-2 bg-yellow-500 rounded-full';
            syncText.textContent = '离线';
        }
    } else {
        // 未登录状态
        loginButtons.classList.remove('hidden');
        userInfo.classList.add('hidden');
        
        syncIndicator.className = 'w-2 h-2 bg-gray-400 rounded-full';
        syncText.textContent = '离线';
    }
}

// 定期更新用户界面状态
setInterval(updateUserInterface, 5000);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeApp);

// 等待数据库集成初始化完成后更新界面
setTimeout(() => {
    updateUserInterface();
}, 2000);

// 故事创作工具函数
function openStoryCreator() {
    const modal = document.createElement('div');
    modal.id = 'story-creator-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold serif-font text-gray-800">故事创作器</h2>
                    <button onclick="closeModal('story-creator-modal')" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">故事类型</label>
                        <select id="story-genre" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">请选择类型</option>
                            <option value="romance">言情小说</option>
                            <option value="fantasy">玄幻小说</option>
                            <option value="mystery">悬疑推理</option>
                            <option value="historical">历史小说</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">故事主题</label>
                        <input type="text" id="story-theme" placeholder="例如：冒险、爱情、成长" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">主角设定</label>
                        <input type="text" id="story-protagonist" placeholder="描述您的主角" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                    </div>
                    
                    <div class="flex space-x-2">
                        <button onclick="generateStoryOutline()" class="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors">
                            生成大纲
                        </button>
                        <button onclick="generateStoryIdeas()" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                            获取创意
                        </button>
                    </div>
                    
                    <div id="story-result" class="hidden bg-gray-50 p-4 rounded-lg">
                        <!-- 故事生成结果将显示在这里 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateCharacterPanel() {
    const modal = document.createElement('div');
    modal.id = 'character-generator-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-xl w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">角色生成器</h2>
                    <button onclick="closeModal('character-generator-modal')" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">角色原型</label>
                        <select id="character-archetype" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">随机选择</option>
                            <option value="hero">英雄</option>
                            <option value="mentor">导师</option>
                            <option value="villain">反派</option>
                            <option value="sidekick">伙伴</option>
                            <option value="love_interest">恋人</option>
                        </select>
                    </div>
                    
                    <button onclick="generateNewCharacter()" class="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors">
                        生成角色
                    </button>
                    
                    <div id="character-result" class="hidden bg-gray-50 p-4 rounded-lg">
                        <!-- 角色信息将显示在这里 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showStoryTemplates() {
    const modal = document.createElement('div');
    modal.id = 'story-templates-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div class="p-6 border-b">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800">故事模板库</h2>
                    <button onclick="closeModal('story-templates-modal')" class="text-gray-500 hover:text-gray-700">✕</button>
                </div>
            </div>
            
            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="templates-container">
                    <!-- 模板卡片将在这里动态生成 -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadStoryTemplatesToModal();
}

function loadStoryTemplatesToModal() {
    const container = document.getElementById('templates-container');
    if (!container) return;
    
    const templates = getStoryTemplates();
    
    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer';
        card.innerHTML = `
            <h3 class="font-semibold text-gray-800 mb-2">${template.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${template.description}</p>
            <div class="flex items-center justify-between">
                <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">${template.genre}</span>
                <button onclick="useTemplate('${template.id}')" class="text-xs text-blue-600 hover:text-blue-800">
                    使用模板
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function generateStoryOutline() {
    try {
        // 检查元素是否存在，如果不存在则显示提示
        const genreElement = document.getElementById('story-genre');
        const themeElement = document.getElementById('story-theme');
        const protagonistElement = document.getElementById('story-protagonist');
        
        if (!genreElement || !themeElement) {
            showNotification('请先打开故事创作面板', 'info');
            // 尝试打开故事创作模态框
            showModal('story-creator-modal');
            return;
        }
        
        const genre = genreElement.value;
        const theme = themeElement.value;
        const protagonist = protagonistElement ? protagonistElement.value : '';
        
        if (!genre || !theme) {
            showNotification('请填写故事类型和主题', 'error');
            return;
        }
        
        showLoadingIndicator('正在生成故事大纲...');
        
        const result = await createStoryWithAI(genre, theme);
        const resultDiv = document.getElementById('story-result');
        
        if (result && result.outline) {
            resultDiv.innerHTML = `
                <h3 class="font-semibold text-gray-800 mb-2">故事大纲</h3>
                <div class="space-y-2 text-sm text-gray-700">
                    <p><strong>类型：</strong>${genre}</p>
                    <p><strong>主题：</strong>${theme}</p>
                    <p><strong>主角：</strong>${protagonist || '未设定'}</p>
                    <p><strong>大纲建议：</strong></p>
                    <div class="bg-orange-50 p-3 rounded-lg mt-2">
                        ${Array.isArray(result.outline) ? result.outline.map(item => `<p class="mb-2">• ${item}</p>`).join('') : `<p>${result.outline}</p>`}
                    </div>
                    ${result.templates ? `
                        <p><strong>写作模板：</strong></p>
                        <div class="bg-blue-50 p-3 rounded-lg mt-2">
                            ${result.templates.map(template => `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1 text-xs">${template}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            resultDiv.classList.remove('hidden');
            showNotification('大纲生成成功！', 'success');
        } else {
            // 如果AI生成失败，使用默认大纲模板
            const defaultOutline = generateDefaultOutline(genre, theme, protagonist);
            resultDiv.innerHTML = `
                <h3 class="font-semibold text-gray-800 mb-2">故事大纲（模板）</h3>
                <div class="space-y-2 text-sm text-gray-700">
                    <p><strong>类型：</strong>${genre}</p>
                    <p><strong>主题：</strong>${theme}</p>
                    <p><strong>主角：</strong>${protagonist || '未设定'}</p>
                    <div class="bg-gray-50 p-3 rounded-lg mt-2">
                        ${defaultOutline}
                    </div>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            showNotification('已生成基础大纲模板', 'info');
        }
        
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('生成大纲失败:', error);
        hideLoadingIndicator();
        showNotification('大纲生成失败，请重试', 'error');
    }
}

// 生成默认大纲模板
function generateDefaultOutline(genre, theme, protagonist) {
    const genreOutlines = {
        romance: {
            title: '言情小说大纲',
            outline: `
                <div class="space-y-3">
                    <div class="border-l-4 border-pink-500 pl-3">
                        <h4 class="font-medium text-pink-700">第一章：初遇</h4>
                        <p>主角${protagonist || '她'}在一个偶然的机会中遇到了命中注定的人，故事由此展开...</p>
                    </div>
                    <div class="border-l-4 border-pink-500 pl-3">
                        <h4 class="font-medium text-pink-700">第二章：情感萌芽</h4>
                        <p>两人通过日常接触逐渐了解彼此，${theme}开始在两人之间产生微妙的化学反应...</p>
                    </div>
                    <div class="border-l-4 border-pink-500 pl-3">
                        <h4 class="font-medium text-pink-700">第三章：波折出现</h4>
                        <p>感情发展遇到阻碍，可能是误会、外界因素或是内心的犹豫...</p>
                    </div>
                    <div class="border-l-4 border-pink-500 pl-3">
                        <h4 class="font-medium text-pink-700">第四章：解决与成长</h4>
                        <p>经历波折后，主角们学会了成长，最终找到了属于他们的幸福...</p>
                    </div>
                </div>
            `
        },
        fantasy: {
            title: '玄幻小说大纲',
            outline: `
                <div class="space-y-3">
                    <div class="border-l-4 border-purple-500 pl-3">
                        <h4 class="font-medium text-purple-700">第一章：凡人觉醒</h4>
                        <p>主角${protagonist || '他'}原本是普通凡人，却意外获得神秘传承或灵根，踏上了修仙之路...</p>
                    </div>
                    <div class="border-l-4 border-purple-500 pl-3">
                        <h4 class="font-medium text-purple-700">第二章：初入仙途</h4>
                        <p>拜入仙门，开始修炼功法，结识师兄弟，初次体验${theme}的修仙世界...</p>
                    </div>
                    <div class="border-l-4 border-purple-500 pl-3">
                        <h4 class="font-medium text-purple-700">第三章：历练成长</h4>
                        <p>下山历练，斩妖除魔，寻找天材地宝，实力不断突破，遇到红颜知己和宿敌...</p>
                    </div>
                    <div class="border-l-4 border-purple-500 pl-3">
                        <h4 class="font-medium text-purple-700">第四章：巅峰对决</h4>
                        <p>面对强大的敌人，${theme}达到顶点，主角突破境界，施展绝学展开惊天大战...</p>
                    </div>
                    <div class="border-l-4 border-purple-500 pl-3">
                        <h4 class="font-medium text-purple-700">第五章：飞升成仙</h4>
                        <p>渡劫成功，飞升仙界，或成为一方霸主，或继续追求更高境界...</p>
                    </div>
                </div>
            `
        },
        mystery: {
            title: '悬疑推理大纲',
            outline: `
                <div class="space-y-3">
                    <div class="border-l-4 border-gray-600 pl-3">
                        <h4 class="font-medium text-gray-700">第一章：案件发生</h4>
                        <p>一起离奇的${theme}案件发生，${protagonist || '侦探'}被卷入其中...</p>
                    </div>
                    <div class="border-l-4 border-gray-600 pl-3">
                        <h4 class="font-medium text-gray-700">第二章：调查开始</h4>
                        <p>深入调查过程中，发现了越来越多的线索和可疑人物...</p>
                    </div>
                    <div class="border-l-4 border-gray-600 pl-3">
                        <h4 class="font-medium text-gray-700">第三章：真相浮现</h4>
                        <p>看似无关的事件开始串联起来，真相逐渐浮现...</p>
                    </div>
                    <div class="border-l-4 border-gray-600 pl-3">
                        <h4 class="font-medium text-gray-700">第四章：最终解谜</h4>
                        <p>在最后的对决中，${protagonist || '侦探'}揭示了案件的真相...</p>
                    </div>
                </div>
            `
        }
    };
    
    const selectedOutline = genreOutlines[genre] || genreOutlines.fantasy;
    return `
        <h4 class="font-semibold text-lg text-gray-800 mb-3">${selectedOutline.title}</h4>
        ${selectedOutline.outline}
        <div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p class="text-sm text-yellow-800">
                <strong>创作提示：</strong>这是一个基础大纲模板，你可以根据${theme}的主题自由发挥，
                在每个章节中添加更多细节和对话，让故事更加生动有趣。
            </p>
        </div>
    `;
}

async function generateStoryIdeas() {
    const genre = document.getElementById('story-genre').value;
    const theme = document.getElementById('story-theme').value;
    
    if (!storyCreationAgent) {
        showNotification('故事创作代理未初始化', 'error');
        return;
    }
    
    try {
        showLoadingIndicator('正在生成创意...');
        
        const query = `为${genre}类型的故事提供关于${theme}的创意灵感`;
        const result = await storyCreationAgent.processUserInput(query);
        const resultDiv = document.getElementById('story-result');
        
        if (result && result.type === 'inspiration') {
            resultDiv.innerHTML = `
                <h3 class="font-semibold text-gray-800 mb-2">创意灵感</h3>
                <div class="space-y-3">
                    <div>
                        <h4 class="text-sm font-medium text-gray-700">写作提示：</h4>
                        <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                            ${result.prompts.map(prompt => `<li>${prompt}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-sm font-medium text-gray-700">故事点子：</h4>
                        <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                            ${result.ideas.map(idea => `<li>${idea}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            resultDiv.classList.remove('hidden');
        } else {
            showNotification('创意生成失败，请重试', 'error');
        }
        
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('生成创意失败:', error);
        hideLoadingIndicator();
        showNotification('创意生成失败，请重试', 'error');
    }
}

function generateNewCharacter() {
    const archetype = document.getElementById('character-archetype').value;
    
    const character = generateCharacter(archetype);
    const resultDiv = document.getElementById('character-result');
    
    if (character) {
        resultDiv.innerHTML = `
            <div class="whitespace-pre-line text-sm text-gray-700">
                ${character.formatted}
            </div>
            <button onclick="insertCharacterToEditor('${character.formatted.replace(/'/g, "\\'")}')" class="mt-3 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm">
                插入到编辑器
            </button>
        `;
        resultDiv.classList.remove('hidden');
    } else {
        showNotification('角色生成失败，请重试', 'error');
    }
}

function useTemplate(templateId) {
    if (!storyTemplates) return;
    
    // 查找模板
    let template = null;
    for (const [genreKey, genreData] of Object.entries(storyTemplates.templates)) {
        const found = genreData.templates.find(t => t.id === templateId);
        if (found) {
            template = found;
            break;
        }
    }
    
    if (template) {
        // 插入模板结构到编辑器
        const editor = document.getElementById('writing-editor');
        if (editor) {
            const templateContent = `
# ${template.title}

## 故事结构
${Object.entries(template.structure).map(([key, value]) => `**${key}：**${value}`).join('\n')}

## 故事元素
- **角色类型：**${template.elements.characters.join('、')}
- **场景设定：**${template.elements.settings.join('、')}
- **冲突类型：**${template.elements.conflicts.join('、')}

## 开始写作
${template.description}

---

在这里开始创作您的${template.title}...
            `;
            
            editor.value = templateContent.trim();
            updateStats();
            closeModal('story-templates-modal');
            showNotification('模板已应用，开始创作吧！', 'success');
        }
    }
}

function insertCharacterToEditor(characterText) {
    const editor = document.getElementById('writing-editor');
    if (editor) {
        const currentText = editor.value;
        const cursorPos = editor.selectionStart;
        const newText = currentText.substring(0, cursorPos) + 
                         '\n\n' + characterText + '\n\n' + 
                         currentText.substring(editor.selectionEnd);
        editor.value = newText;
        updateStats();
        closeModal('character-generator-modal');
        showNotification('角色信息已插入编辑器', 'success');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// 导出菜单切换
function toggleExportMenu() {
    const menu = document.getElementById('export-menu');
    if (menu) {
        menu.classList.toggle('show');
        
        // 点击其他地方关闭菜单
        if (menu.classList.contains('show')) {
            setTimeout(() => {
                document.addEventListener('click', closeExportMenu);
            }, 100);
        }
    }
}

function closeExportMenu(event) {
    const menu = document.getElementById('export-menu');
    if (menu && !menu.contains(event.target) && !event.target.closest('.export-dropdown button')) {
        menu.classList.remove('show');
        document.removeEventListener('click', closeExportMenu);
    }
}

// 导出函数供HTML调用
window.startWriting = startWriting;
window.showFeatures = showFeatures;
window.selectProject = selectProject;
window.createNewProject = createNewProject;
window.createNewDocument = createNewDocument;
window.updateStats = updateStats;
window.generateAISuggestions = generateAISuggestions;
window.generateContent = generateContent;
window.improveText = improveText;
window.checkGrammar = checkGrammar;
window.generateInspiration = generateInspiration;
window.generateOutline = generateOutline;
window.analyzeTone = analyzeTone;
window.findSynonyms = findSynonyms;
window.applySuggestion = applySuggestion;
window.saveDocument = saveDocument;
window.exportDocument = exportDocument;
window.toggleExportMenu = toggleExportMenu;
window.shareDocument = shareDocument;

// 故事创作工具函数
window.openStoryCreator = openStoryCreator;
window.generateCharacterPanel = generateCharacterPanel;
window.showStoryTemplates = showStoryTemplates;
window.generateStoryOutline = generateStoryOutline;
window.generateStoryIdeas = generateStoryIdeas;
window.generateNewCharacter = generateNewCharacter;
window.useTemplate = useTemplate;
window.insertCharacterToEditor = insertCharacterToEditor;
window.closeModal = closeModal;