/**
 * 模板库JavaScript逻辑
 * 处理故事模板的展示、筛选和应用
 */

// 全局变量
let templatesData = [];
let currentCategory = 'all';
let splideInstance = null;
let storyTemplatesInstance = null;

// 初始化模板库
function initializeTemplates() {
    initializeStoryTemplates();
    loadTemplates();
    setupEventListeners();
    initializeSplide();
    
    // 添加页面加载动画
    anime({
        targets: '.template-card',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutExpo'
    });
}

// 初始化故事模板实例
function initializeStoryTemplates() {
    try {
        storyTemplatesInstance = new StoryTemplates();
        console.log('✅ 故事模板库初始化成功');
    } catch (error) {
        console.error('❌ 故事模板库初始化失败:', error);
    }
}

// 加载模板数据
function loadTemplates() {
    // 从StoryTemplates实例获取模板数据
    if (storyTemplatesInstance) {
        templatesData = convertTemplatesFromInstance(storyTemplatesInstance);
    } else {
        // 回退到模拟数据
        templatesData = generateMockTemplates();
    }
    
    displayTemplates(currentCategory);
}

// 从StoryTemplates实例转换模板数据
function convertTemplatesFromInstance(instance) {
    const templates = [];
    
    // 获取所有模板类型
    for (const [genreKey, genreData] of Object.entries(instance.templates)) {
        genreData.templates.forEach(template => {
            templates.push({
                id: template.id,
                title: template.title,
                description: template.description,
                genre: genreData.name,
                genreKey: genreKey,
                category: template.category || 'standard',
                structure: template.structure,
                elements: template.elements,
                difficulty: template.difficulty || 'medium',
                estimatedWords: template.estimatedWords || 5000,
                tags: template.tags || [],
                isPremium: template.isPremium || false,
                rating: template.rating || 4.5,
                usageCount: template.usageCount || Math.floor(Math.random() * 1000),
                preview: generateTemplatePreview(template),
                author: template.author || 'AI写作助手',
                createdAt: template.createdAt || new Date().toISOString()
            });
        });
    }
    
    return templates;
}

// 生成模拟模板数据
function generateMockTemplates() {
    return [
        {
            id: 'modern_romance_1',
            title: '现代都市爱情故事',
            description: '发生在现代都市背景下的浪漫爱情故事，适合初学者和有经验作者',
            genre: '言情小说',
            genreKey: 'romance',
            category: 'popular',
            structure: {
                opening: '男女主角在偶然的场合相遇，产生初次的吸引',
                development: '经历误会、挑战和成长，感情逐渐升温',
                climax: '重大危机考验感情，主角必须做出重要选择',
                resolution: '克服困难，找到真正的爱情，故事圆满结束'
            },
            elements: {
                characters: ['职场精英', '艺术家', '学生', '创业者'],
                settings: ['繁华都市', '咖啡馆', '办公室', '海边'],
                conflicts: ['身份差距', '第三者介入', '家庭反对', '职业冲突']
            },
            difficulty: 'easy',
            estimatedWords: 5000,
            tags: ['爱情', '现代', '都市', '浪漫'],
            isPremium: false,
            rating: 4.8,
            usageCount: 1256,
            preview: '这是一个关于两个都市年轻人相遇相爱的温馨故事...',
            author: 'AI写作助手',
            createdAt: '2025-01-10T10:00:00Z'
        },
        {
            id: 'fantasy_magic_1',
            title: '魔法学院冒险',
            description: '充满魔法和奇幻元素的冒险故事，适合喜欢幻想题材的作者',
            genre: '玄幻小说',
            genreKey: 'fantasy',
            category: 'featured',
            structure: {
                opening: '平凡世界的主角发现魔法天赋，进入魔法学院',
                development: '学习魔法技能，结交朋友，面对挑战',
                climax: '对抗邪恶势力，保护魔法世界',
                resolution: '成为强大的魔法师，世界重获和平'
            },
            elements: {
                characters: ['魔法师', '战士', '精灵', '矮人', '兽人'],
                settings: ['魔法学院', '精灵森林', '龙穴', '黑暗城堡'],
                conflicts: ['魔法禁忌', '种族战争', '邪恶势力', '内心挣扎']
            },
            difficulty: 'medium',
            estimatedWords: 8000,
            tags: ['魔法', '冒险', '奇幻', '学院'],
            isPremium: true,
            rating: 4.6,
            usageCount: 892,
            preview: '在一个充满魔法的世界里，年轻的主角将展开冒险...',
            author: 'AI写作助手',
            createdAt: '2025-01-08T14:30:00Z'
        },
        {
            id: 'mystery_detective_1',
            title: '侦探破案故事',
            description: '经典的侦探推理故事，充满悬疑和智力挑战',
            genre: '悬疑推理',
            genreKey: 'mystery',
            category: 'classic',
            structure: {
                opening: '案件发生，侦探介入调查',
                development: '收集线索，分析推理，寻找真相',
                climax: '揭露真凶，还原案件真相',
                resolution: '案件告破，正义得到伸张'
            },
            elements: {
                characters: ['侦探', '警察', '嫌疑人', '被害人', '目击者'],
                settings: ['犯罪现场', '警察局', '审讯室', '城市街道'],
                conflicts: ['线索缺失', '证据不足', '时间紧迫', '真凶狡猾']
            },
            difficulty: 'hard',
            estimatedWords: 7000,
            tags: ['悬疑', '推理', '侦探', '破案'],
            isPremium: false,
            rating: 4.4,
            usageCount: 654,
            preview: '一桩离奇的案件，只有最优秀的侦探能够破解...',
            author: 'AI写作助手',
            createdAt: '2025-01-05T09:15:00Z'
        },
        {
            id: 'historical_war_1',
            title: '古代战争史诗',
            description: '以古代战争为背景的宏大故事，展现历史的波澜壮阔',
            genre: '历史小说',
            genreKey: 'historical',
            category: 'epic',
            structure: {
                opening: '战乱年代，英雄崛起',
                development: '征战沙场，建功立业',
                climax: '决定性战役，生死存亡',
                resolution: '战争结束，新时代来临'
            },
            elements: {
                characters: ['将军', '士兵', '君王', '谋士', '平民'],
                settings: ['战场', '军营', '皇宫', '村庄'],
                conflicts: ['国家战争', '权力争夺', '忠诚背叛', '生死抉择']
            },
            difficulty: 'hard',
            estimatedWords: 12000,
            tags: ['历史', '战争', '史诗', '古代'],
            isPremium: true,
            rating: 4.7,
            usageCount: 423,
            preview: '在那个战火纷飞的年代，英雄们用鲜血和汗水铸就历史...',
            author: 'AI写作助手',
            createdAt: '2025-01-03T16:45:00Z'
        }
    ];
}

// 生成模板预览
function generateTemplatePreview(template) {
    const { structure, elements } = template;
    
    let preview = `# ${template.title}\n\n`;
    preview += `**类型**: ${template.genre}\n`;
    preview += `**难度**: ${template.difficulty}\n`;
    preview += `**预计字数**: ${template.estimatedWords.toLocaleString()}\n\n`;
    
    preview += `## 故事结构\n`;
    Object.entries(structure).forEach(([key, value]) => {
        const phaseNames = {
            opening: '开端',
            development: '发展',
            climax: '高潮',
            resolution: '结局'
        };
        preview += `**${phaseNames[key]}**: ${value}\n`;
    });
    
    if (elements) {
        preview += `\n## 故事元素\n`;
        Object.entries(elements).forEach(([key, value]) => {
            const elementNames = {
                characters: '角色类型',
                settings: '场景设定',
                conflicts: '冲突类型'
            };
            preview += `**${elementNames[key]}**: ${Array.isArray(value) ? value.join('、') : value}\n`;
        });
    }
    
    preview += `\n## 开始创作\n`;
    preview += `${template.preview}...\n\n`;
    preview += `使用此模板开始您的${template.genre}创作之旅！`;
    
    return preview;
}

// 显示模板
function displayTemplates(category = 'all') {
    const templatesContainer = document.getElementById('templates-container');
    if (!templatesContainer) return;
    
    const filteredTemplates = category === 'all' ? templatesData : 
        templatesData.filter(template => template.genreKey === category);
    
    templatesContainer.innerHTML = '';
    
    filteredTemplates.forEach(template => {
        const templateCard = createTemplateCard(template);
        templatesContainer.appendChild(templateCard);
    });
    
    // 重新初始化轮播
    if (splideInstance) {
        splideInstance.destroy();
    }
    initializeSplide();
}

// 创建模板卡片
function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card splide__slide';
    
    const ratingStars = generateRatingStars(template.rating);
    const difficultyBadge = getDifficultyBadge(template.difficulty);
    const categoryBadge = getCategoryBadge(template.category);
    
    card.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 h-full">
            <!-- 模板头部 -->
            <div class="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 border-b border-gray-100">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900 mb-1">${template.title}</h3>
                        <p class="text-sm text-gray-600">${template.description}</p>
                    </div>
                    ${template.isPremium ? '<span class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-2 py-1 rounded-full">PRO</span>' : ''}
                </div>
                
                <div class="flex items-center space-x-2 text-sm">
                    <span class="text-gray-500">${template.genre}</span>
                    ${difficultyBadge}
                    ${categoryBadge}
                </div>
            </div>
            
            <!-- 模板内容 -->
            <div class="p-4">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 text-orange-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="text-sm text-gray-600">${template.estimatedWords.toLocaleString()} 字</span>
                        </div>
                        <div class="flex items-center">
                            ${ratingStars}
                            <span class="text-sm text-gray-500 ml-1">(${template.rating})</span>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${template.tags.map(tag => `<span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="text-sm text-gray-700 mb-3">
                        <div class="font-medium mb-1">故事结构:</div>
                        <div class="space-y-1">
                            ${Object.entries(template.structure).slice(0, 3).map(([key, value]) => 
                                `<div class="text-xs">• ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}</div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="flex space-x-2">
                    <button onclick="previewTemplate('${template.id}')" class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        预览
                    </button>
                    <button onclick="useTemplate('${template.id}')" class="flex-1 btn-primary py-2 px-3 rounded-lg text-sm font-medium">
                        使用模板
                    </button>
                </div>
            </div>
            
            <!-- 底部信息 -->
            <div class="bg-gray-50 px-4 py-2 border-t border-gray-100">
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>作者: ${template.author}</span>
                    <span>使用 ${template.usageCount.toLocaleString()} 次</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// 生成评分星级
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<svg class="w-4 h-4 text-yellow-400 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462a1 1 0 00.95-.69l1.07-3.292a1 1 0 00-1.902 0l-1.07 3.292a1 1 0 00.95-.69H8.084a1 1 0 00.95.69l1.07-3.292z"></path></svg>';
    }
    
    if (hasHalfStar) {
        stars += '<svg class="w-4 h-4 text-yellow-400 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462a1 1 0 00.95-.69l1.07-3.292a1 1 0 00-1.902 0l-1.07 3.292a1 1 0 00.95-.69H8.084a1 1 0 00.95.69l1.07-3.292z"></path></svg>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<svg class="w-4 h-4 text-gray-300 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462a1 1 0 00.95-.69l1.07-3.292a1 1 0 00-1.902 0l-1.07 3.292a1 1 0 00.95-.69H8.084a1 1 0 00.95.69l1.07-3.292z"></path></svg>';
    }
    
    return stars;
}

// 获取难度徽章
function getDifficultyBadge(difficulty) {
    const badges = {
        easy: '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">简单</span>',
        medium: '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">中等</span>',
        hard: '<span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">困难</span>'
    };
    
    return badges[difficulty] || badges.medium;
}

// 获取分类徽章
function getCategoryBadge(category) {
    const badges = {
        popular: '<span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">热门</span>',
        featured: '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">精选</span>',
        classic: '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">经典</span>',
        epic: '<span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">史诗</span>'
    };
    
    return badges[category] || '';
}

// 初始化Splide轮播
function initializeSplide() {
    try {
        splideInstance = new Splide('.template-carousel', {
            type: 'slide',
            perPage: 3,
            perMove: 1,
            gap: '1rem',
            padding: '2rem',
            breakpoints: {
                640: {
                    perPage: 1,
                    gap: '0.5rem',
                    padding: '1rem'
                },
                768: {
                    perPage: 2,
                    gap: '0.75rem',
                    padding: '1.5rem'
                },
                1024: {
                    perPage: 2,
                    gap: '1rem',
                    padding: '2rem'
                },
                1280: {
                    perPage: 3,
                    gap: '1rem',
                    padding: '2rem'
                }
            }
        });
        
        splideInstance.mount();
        console.log('✅ Splide轮播初始化成功');
    } catch (error) {
        console.error('❌ Splide轮播初始化失败:', error);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 分类筛选按钮
    const categoryButtons = document.querySelectorAll('.category-filter');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            setActiveCategory(category);
            displayTemplates(category);
        });
    });
    
    // 搜索功能
    const searchInput = document.getElementById('template-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounceSearch);
    }
    
    // 筛选器变化
    const difficultyFilter = document.getElementById('difficulty-filter');
    const genreFilter = document.getElementById('genre-filter');
    
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', applyFilters);
    }
    
    if (genreFilter) {
        genreFilter.addEventListener('change', applyFilters);
    }
}

// 设置活动分类
function setActiveCategory(category) {
    currentCategory = category;
    
    const categoryButtons = document.querySelectorAll('.category-filter');
    categoryButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.category === category) {
            button.classList.add('active');
        }
    });
}

// 防抖搜索
function debounceSearch(event) {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        searchTemplates(event.target.value);
    }, 300);
}

// 搜索模板
function searchTemplates(query) {
    if (!query.trim()) {
        displayTemplates(currentCategory);
        return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filteredTemplates = templatesData.filter(template => {
        return template.title.toLowerCase().includes(lowerQuery) ||
               template.description.toLowerCase().includes(lowerQuery) ||
               template.genre.toLowerCase().includes(lowerQuery) ||
               template.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    });
    
    displayFilteredTemplates(filteredTemplates);
}

// 应用筛选器
function applyFilters() {
    const difficulty = document.getElementById('difficulty-filter').value;
    const genre = document.getElementById('genre-filter').value;
    
    let filteredTemplates = templatesData;
    
    // 应用分类筛选
    if (currentCategory !== 'all') {
        filteredTemplates = filteredTemplates.filter(template => template.genreKey === currentCategory);
    }
    
    // 应用难度筛选
    if (difficulty !== 'all') {
        filteredTemplates = filteredTemplates.filter(template => template.difficulty === difficulty);
    }
    
    // 应用类型筛选
    if (genre !== 'all') {
        filteredTemplates = filteredTemplates.filter(template => template.genreKey === genre);
    }
    
    displayFilteredTemplates(filteredTemplates);
}

// 显示筛选后的模板
function displayFilteredTemplates(templates) {
    const templatesContainer = document.getElementById('templates-container');
    if (!templatesContainer) return;
    
    templatesContainer.innerHTML = '';
    
    if (templates.length === 0) {
        templatesContainer.innerHTML = `
            <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0L9 10l3.953 3.953a4 4 0 10-5.656 0l3.953-3.953a4 4 0 115.656 0L21 12a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 01.881-2.527z"></path>
                </svg>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">没有找到匹配的模板</h3>
                <p class="text-gray-500">请尝试调整筛选条件或搜索关键词</p>
            </div>
        `;
        return;
    }
    
    templates.forEach(template => {
        const templateCard = createTemplateCard(template);
        templatesContainer.appendChild(templateCard);
    });
    
    // 重新初始化轮播
    if (splideInstance) {
        splideInstance.destroy();
    }
    initializeSplide();
}

// 预览模板
function previewTemplate(templateId) {
    const template = templatesData.find(t => t.id === templateId);
    if (!template) return;
    
    const modal = document.createElement('div');
    modal.id = 'template-preview-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="modal-content max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-900">模板预览: ${template.title}</h2>
                <button onclick="closeModal('template-preview-modal')" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="p-6">
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600">类型:</span>
                                <span class="font-medium">${template.genre}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">难度:</span>
                                <span class="font-medium">${template.difficulty}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">预计字数:</span>
                                <span class="font-medium">${template.estimatedWords.toLocaleString()}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">评分:</span>
                                <span class="font-medium">${template.rating} ⭐</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">故事结构</h3>
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            ${Object.entries(template.structure).map(([key, value]) => 
                                `<div class="mb-2">
                                    <div class="font-medium text-gray-700 capitalize">${key}:</div>
                                    <div class="text-gray-600">${value}</div>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">故事元素</h3>
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            ${Object.entries(template.elements).map(([key, value]) => 
                                `<div class="mb-2">
                                    <div class="font-medium text-gray-700 capitalize">${key}:</div>
                                    <div class="text-gray-600">${Array.isArray(value) ? value.join('、') : value}</div>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">预览内容</h3>
                        <div class="template-preview bg-gray-50 rounded-lg p-4 whitespace-pre-line text-sm">
                            ${template.preview}
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="closeModal('template-preview-modal'); useTemplate('${template.id}')" 
                                class="btn-primary px-6 py-2 rounded-lg">
                            使用此模板
                        </button>
                        <button onclick="addToFavorites('${template.id}')" 
                                class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            收藏模板
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 使用模板
function useTemplate(templateId) {
    const template = templatesData.find(t => t.id === templateId);
    if (!template) return;
    
    // 检查是否是付费模板
    if (template.isPremium) {
        if (!confirm('这是一个高级模板，需要升级到专业版才能使用。是否继续？')) {
            return;
        }
    }
    
    // 生成模板内容
    const templateContent = generateTemplateContent(template);
    
    // 保存到localStorage
    const documentData = {
        title: template.title,
        content: templateContent,
        templateId: template.id,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`template_${templateId}`, JSON.stringify(documentData));
    
    // 关闭模态框（如果打开的）
    closeModal('template-preview-modal');
    
    // 跳转到写作页面
    window.location.href = 'index.html?template=' + templateId;
    
    showNotification('模板已应用，开始创作吧！', 'success');
}

// 生成模板内容
function generateTemplateContent(template) {
    let content = `# ${template.title}\n\n`;
    content += `**模板类型**: ${template.genre}\n`;
    content += `**难度等级**: ${template.difficulty}\n`;
    content += `**预计字数**: ${template.estimatedWords.toLocaleString()}\n\n`;
    
    content += `## 故事简介\n`;
    content += `${template.description}\n\n`;
    
    content += `## 故事结构\n`;
    Object.entries(template.structure).forEach(([key, value]) => {
        const phaseNames = {
            opening: '开端',
            development: '发展',
            climax: '高潮',
            resolution: '结局'
        };
        content += `### ${phaseNames[key]}\n${value}\n\n`;
    });
    
    content += `## 角色设定\n`;
    if (template.elements.characters) {
        content += `可选角色类型: ${template.elements.characters.join('、')}\n\n`;
    }
    
    content += `## 场景设置\n`;
    if (template.elements.settings) {
        content += `推荐场景: ${template.elements.settings.join('、')}\n\n`;
    }
    
    content += `## 主要冲突\n`;
    if (template.elements.conflicts) {
        content += `可能的故事冲突: ${template.elements.conflicts.join('、')}\n\n`;
    }
    
    content += `## 开始创作\n`;
    content += `${template.preview}\n\n`;
    content += `---\n\n`;
    content += `在这里开始您的${template.genre}创作...\n`;
    
    return content;
}

// 添加到收藏
function addToFavorites(templateId) {
    let favorites = JSON.parse(localStorage.getItem('favorite_templates') || '[]');
    
    if (!favorites.includes(templateId)) {
        favorites.push(templateId);
        localStorage.setItem('favorite_templates', JSON.stringify(favorites));
        showNotification('模板已添加到收藏', 'success');
    } else {
        showNotification('模板已在收藏中', 'info');
    }
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// 创建自定义模板
function createCustomTemplate() {
    const modal = document.createElement('div');
    modal.id = 'create-template-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">创建自定义模板</h2>
                    <button onclick="closeModal('create-template-modal')" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <form onsubmit="saveCustomTemplate(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
                        <input type="text" name="title" required class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="输入模板名称">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">模板描述</label>
                        <textarea name="description" required rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="描述模板的用途和特点"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">故事类型</label>
                        <select name="genre" required class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">请选择类型</option>
                            <option value="romance">言情小说</option>
                            <option value="fantasy">玄幻小说</option>
                            <option value="mystery">悬疑推理</option>
                            <option value="historical">历史小说</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">模板内容</label>
                        <textarea name="content" required rows="8" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="输入模板的详细内容结构..."></textarea>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button type="button" onclick="closeModal('create-template-modal')" class="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            取消
                        </button>
                        <button type="submit" class="btn-primary px-6 py-2 rounded-lg">
                            保存模板
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 保存自定义模板
function saveCustomTemplate(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const templateData = {
        id: 'custom_' + Date.now(),
        title: formData.get('title'),
        description: formData.get('description'),
        genre: formData.get('genre'),
        genreKey: formData.get('genre'),
        category: 'custom',
        structure: parseTemplateContent(formData.get('content')),
        elements: {},
        difficulty: 'medium',
        estimatedWords: 5000,
        tags: ['自定义'],
        isPremium: false,
        rating: 0,
        usageCount: 0,
        preview: formData.get('description'),
        author: '用户自定义',
        createdAt: new Date().toISOString(),
        isCustom: true
    };
    
    // 保存自定义模板
    let customTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]');
    customTemplates.push(templateData);
    localStorage.setItem('custom_templates', JSON.stringify(customTemplates));
    
    // 添加到模板列表
    templatesData.push(templateData);
    displayTemplates(currentCategory);
    
    closeModal('create-template-modal');
    showNotification('自定义模板已保存', 'success');
}

// 解析模板内容
function parseTemplateContent(content) {
    // 简化解析，实际应该更复杂
    const lines = content.split('\n').filter(line => line.trim());
    const structure = {};
    
    let currentSection = '';
    lines.forEach(line => {
        if (line.startsWith('#') || line.startsWith('##')) {
            currentSection = line.replace(/^#+\s*/, '').toLowerCase();
            structure[currentSection] = '';
        } else if (currentSection && line.trim()) {
            structure[currentSection] += line + '\n';
        }
    });
    
    return structure;
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeTemplates);

// 导出函数供HTML调用
window.previewTemplate = previewTemplate;
window.useTemplate = useTemplate;
window.addToFavorites = addToFavorites;
window.createCustomTemplate = createCustomTemplate;
window.saveCustomTemplate = saveCustomTemplate;
window.closeModal = closeModal;