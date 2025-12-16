/**
 * 仪表板JavaScript逻辑
 * 处理数据可视化和统计功能
 */

// 全局变量
let dashboardCharts = {};
let dashboardData = {
    writingStats: [],
    projects: [],
    goals: {},
    insights: []
};

// 初始化仪表板
function initializeDashboard() {
    loadDashboardData();
    initializeCharts();
    loadProjects();
    generateAIInsights();
    setupEventListeners();
    
    // 添加页面加载动画
    anime({
        targets: '.stats-card',
        translateY: [30, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutExpo'
    });
}

// 加载仪表板数据
function loadDashboardData() {
    // 从localStorage加载写作统计数据
    const savedStats = localStorage.getItem('writing_statistics');
    if (savedStats) {
        dashboardData.writingStats = JSON.parse(savedStats);
    } else {
        // 生成模拟数据
        dashboardData.writingStats = generateMockWritingData();
    }
    
    // 加载项目数据
    const savedProjects = localStorage.getItem('writing_projects');
    if (savedProjects) {
        dashboardData.projects = JSON.parse(savedProjects);
    } else {
        dashboardData.projects = generateMockProjects();
    }
    
    // 更新统计卡片
    updateStatCards();
}

// 生成模拟写作数据
function generateMockWritingData() {
    const data = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
            date: date.toISOString().split('T')[0],
            words: Math.floor(Math.random() * 2000) + 500,
            writingTime: Math.floor(Math.random() * 120) + 30,
            projects: Math.floor(Math.random() * 3) + 1,
            quality: Math.random() * 40 + 60
        });
    }
    
    return data;
}

// 生成模拟项目数据
function generateMockProjects() {
    return [
        {
            id: 1,
            title: '科幻小说：星际迷航',
            type: 'novel',
            words: 15678,
            lastModified: new Date().toISOString(),
            progress: 75,
            status: 'active',
            tags: ['科幻', '冒险', '技术'],
            writingStreak: 15,
            averageQuality: 85
        },
        {
            id: 2,
            title: '人工智能研究论文',
            type: 'essay',
            words: 8432,
            lastModified: new Date(Date.now() - 86400000).toISOString(),
            progress: 60,
            status: 'active',
            tags: ['技术', '学术', 'AI'],
            writingStreak: 8,
            averageQuality: 92
        },
        {
            id: 3,
            title: '技术博客集',
            type: 'blog',
            words: 23456,
            lastModified: new Date(Date.now() - 172800000).toISOString(),
            progress: 90,
            status: 'active'
        },
        {
            id: 4,
            title: '年度工作报告',
            type: 'report',
            words: 5678,
            lastModified: new Date(Date.now() - 259200000).toISOString(),
            progress: 100,
            status: 'completed'
        },
        {
            id: 5,
            title: '创意短篇集',
            type: 'novel',
            words: 12345,
            lastModified: new Date(Date.now() - 345600000).toISOString(),
            progress: 45,
            status: 'active'
        },
        {
            id: 6,
            title: '哲学思考随笔',
            type: 'essay',
            words: 9876,
            lastModified: new Date(Date.now() - 432000000).toISOString(),
            progress: 80,
            status: 'active'
        }
    ];
}

// 更新统计卡片
function updateStatCards() {
    const totalWords = dashboardData.writingStats.reduce((sum, day) => sum + day.words, 0);
    const totalDocuments = dashboardData.projects.length;
    const totalWritingTime = dashboardData.writingStats.reduce((sum, day) => sum + day.writingTime, 0);
    const writingStreak = calculateWritingStreak();
    
    // 更新DOM元素
    animateNumber('total-words', totalWords);
    animateNumber('total-documents', totalDocuments);
    animateNumber('writing-time', Math.floor(totalWritingTime / 60));
    animateNumber('writing-streak', writingStreak);
}

// 数字动画效果
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// 计算连续写作天数
function calculateWritingStreak() {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = dashboardData.writingStats.find(d => d.date === dateStr);
        if (dayData && dayData.words > 0) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    
    return streak;
}

// 初始化所有图表
function initializeCharts() {
    initializeWritingTrendChart();
    initializeProjectDistributionChart();
    initializeDailyWritingTimeChart();
    initializeWritingEfficiencyChart();
    initializeWritingHabitsChart();
    initializeVocabularyChart();
    initializeEmotionChart();
    initializeQualityScoreChart();
    initializeWritingGoalsChart();
    initializeProductivityHeatmap();
    initializeTopicAnalysisChart();
}

// 新增：写作目标图表
function initializeWritingGoalsChart() {
    const chartDom = document.getElementById('writing-goals-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const goals = [
        { name: '每日1000字', target: 1000, current: 850 },
        { name: '每周7000字', target: 7000, current: 5200 },
        { name: '每月30000字', target: 30000, current: 24000 }
    ];
    
    const option = {
        title: {
            text: '写作目标完成情况',
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 'normal' }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: ['目标', '实际完成'],
            top: 30
        },
        xAxis: {
            type: 'category',
            data: goals.map(g => g.name)
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: '目标',
                type: 'bar',
                data: goals.map(g => g.target),
                itemStyle: { color: '#E5E7EB' }
            },
            {
                name: '实际完成',
                type: 'bar',
                data: goals.map(g => g.current),
                itemStyle: { color: '#10B981' }
            }
        ]
    };
    
    chart.setOption(option);
    dashboardCharts.writingGoals = chart;
}

// 新增：生产力热力图
function initializeProductivityHeatmap() {
    const chartDom = document.getElementById('productivity-heatmap');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 生成过去12周的热力图数据
    const data = [];
    const today = new Date();
    
    for (let week = 11; week >= 0; week--) {
        for (let day = 0; day < 7; day++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (week * 7 + day));
            
            const dateStr = date.toISOString().split('T')[0];
            const dayData = dashboardData.writingStats.find(d => d.date === dateStr);
            const words = dayData ? dayData.words : 0;
            
            data.push([
                day,
                11 - week,
                words
            ]);
        }
    }
    
    const option = {
        title: {
            text: '写作生产力热力图',
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 'normal' }
        },
        tooltip: {
            position: 'top',
            formatter: function(params) {
                return `${params.data[2]} 字`;
            }
        },
        grid: {
            height: '70%',
            top: '10%'
        },
        xAxis: {
            type: 'category',
            data: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
            splitArea: { show: true },
            axisLabel: { fontSize: 10 }
        },
        yAxis: {
            type: 'category',
            data: Array.from({length: 12}, (_, i) => `第${12-i}周`),
            splitArea: { show: true },
            axisLabel: { fontSize: 10 }
        },
        visualMap: {
            min: 0,
            max: 2000,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: {
                color: ['#F3F4F6', '#FEF3C7', '#F59E0B', '#D97706', '#92400E']
            }
        },
        series: [{
            name: '写作字数',
            type: 'heatmap',
            data: data,
            label: { show: false },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.productivityHeatmap = chart;
}

// 新增：主题分析图表
function initializeTopicAnalysisChart() {
    const chartDom = document.getElementById('topic-analysis-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 分析项目主题分布
    const topics = {};
    dashboardData.projects.forEach(project => {
        if (project.tags) {
            project.tags.forEach(tag => {
                topics[tag] = (topics[tag] || 0) + project.words;
            });
        }
    });
    
    const data = Object.entries(topics)
        .map(([topic, words]) => ({ name: topic, value: words }))
        .sort((a, b) => b.value - a.value);
    
    const option = {
        title: {
            text: '写作主题分析',
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 'normal' }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} 字 ({d}%)'
        },
        series: [{
            name: '主题字数',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '18',
                    fontWeight: 'bold'
                }
            },
            labelLine: { show: false },
            data: data,
            color: ['#F6AD55', '#38A169', '#3182CE', '#D69E2E', '#E53E3E', '#805AD5']
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.topicAnalysis = chart;
}

// 写作趋势图表
function initializeWritingTrendChart() {
    const chartDom = document.getElementById('writing-trend-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const dates = dashboardData.writingStats.map(d => d.date);
    const words = dashboardData.writingStats.map(d => d.words);
    
    const option = {
        title: {
            text: '过去30天写作趋势',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} 字'
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                formatter: function(value) {
                    return value.substring(5);
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '字数'
        },
        series: [{
            data: words,
            type: 'line',
            smooth: true,
            lineStyle: {
                color: '#F6AD55',
                width: 3
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(246, 173, 85, 0.3)' },
                    { offset: 1, color: 'rgba(246, 173, 85, 0.1)' }
                ])
            },
            itemStyle: {
                color: '#F6AD55'
            }
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.writingTrend = chart;
}

// 项目分布图表
function initializeProjectDistributionChart() {
    const chartDom = document.getElementById('project-distribution-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const projectTypes = {};
    dashboardData.projects.forEach(project => {
        projectTypes[project.type] = (projectTypes[project.type] || 0) + 1;
    });
    
    const data = Object.entries(projectTypes).map(([type, count]) => ({
        name: getProjectTypeName(type),
        value: count
    }));
    
    const option = {
        title: {
            text: '项目类型分布',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
            name: '项目类型',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: false
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '16',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: data
        }],
        color: ['#F6AD55', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444']
    };
    
    chart.setOption(option);
    dashboardCharts.projectDistribution = chart;
}

// 每日写作时间分布图表
function initializeDailyWritingTimeChart() {
    const chartDom = document.getElementById('daily-writing-time-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    // 生成24小时时间段的数据
    const hours = Array.from({length: 24}, (_, i) => i);
    const timeData = hours.map(hour => {
        // 模拟写作时间分布，通常在早上8-10点和晚上8-11点写作较多
        let baseValue = Math.random() * 10;
        if ((hour >= 8 && hour <= 10) || (hour >= 20 && hour <= 23)) {
            baseValue += Math.random() * 30 + 20;
        }
        return baseValue;
    });
    
    const option = {
        title: {
            text: '每日写作时间分布',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: '{b}:00 - {b}:59<br/>写作时长: {c} 分钟'
        },
        xAxis: {
            type: 'category',
            data: hours.map(h => h + ':00'),
            axisLabel: {
                interval: 2
            }
        },
        yAxis: {
            type: 'value',
            name: '分钟'
        },
        series: [{
            data: timeData,
            type: 'bar',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#3B82F6' },
                    { offset: 1, color: '#1D4ED8' }
                ]),
                borderRadius: [5, 5, 0, 0]
            }
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.dailyWritingTime = chart;
}

// 写作效率分析图表
function initializeWritingEfficiencyChart() {
    const chartDom = document.getElementById('writing-efficiency-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const efficiencyData = dashboardData.writingStats.map(d => ({
        date: d.date.substring(5),
        efficiency: d.words / Math.max(d.writingTime, 1),
        quality: d.quality
    }));
    
    const option = {
        title: {
            text: '写作效率与质量分析',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                const efficiency = params[0];
                const quality = params[1];
                return `${params[0].name}<br/>效率: ${efficiency.value.toFixed(1)} 字/分钟<br/>质量: ${quality.value.toFixed(1)}%`;
            }
        },
        legend: {
            data: ['效率', '质量'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: efficiencyData.map(d => d.date)
        },
        yAxis: [
            {
                type: 'value',
                name: '效率(字/分钟)',
                position: 'left'
            },
            {
                type: 'value',
                name: '质量(%)',
                position: 'right',
                max: 100
            }
        ],
        series: [
            {
                name: '效率',
                type: 'line',
                data: efficiencyData.map(d => d.efficiency),
                smooth: true,
                itemStyle: {
                    color: '#10B981'
                }
            },
            {
                name: '质量',
                type: 'line',
                yAxisIndex: 1,
                data: efficiencyData.map(d => d.quality),
                smooth: true,
                itemStyle: {
                    color: '#8B5CF6'
                }
            }
        ]
    };
    
    chart.setOption(option);
    dashboardCharts.writingEfficiency = chart;
}

// 写作习惯分析图表
function initializeWritingHabitsChart() {
    const chartDom = document.getElementById('writing-habits-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const habitData = [
        { habit: '早起写作', value: 65 },
        { habit: '晚间写作', value: 85 },
        { habit: '周末写作', value: 45 },
        { habit: '定时休息', value: 70 },
        { habit: '笔记记录', value: 90 }
    ];
    
    const option = {
        title: {
            text: '写作习惯分析',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}%'
        },
        radar: {
            indicator: habitData.map(item => ({
                name: item.habit,
                max: 100
            }))
        },
        series: [{
            type: 'radar',
            data: [{
                value: habitData.map(item => item.value),
                name: '写作习惯',
                itemStyle: {
                    color: '#F6AD55'
                },
                areaStyle: {
                    color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, 0.5, [
                        { offset: 0, color: 'rgba(246, 173, 85, 0.1)' },
                        { offset: 1, color: 'rgba(246, 173, 85, 0.3)' }
                    ])
                }
            }]
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.writingHabits = chart;
}

// 词汇丰富度图表
function initializeVocabularyChart() {
    const chartDom = document.getElementById('vocabulary-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const vocabularyData = [
        { category: '高频词', value: 1200 },
        { category: '中频词', value: 3400 },
        { category: '低频词', value: 2100 },
        { category: '专业词汇', value: 800 },
        { category: '情感词汇', value: 600 }
    ];
    
    const option = {
        title: {
            text: '词汇丰富度分析',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} 个'
        },
        xAxis: {
            type: 'category',
            data: vocabularyData.map(item => item.category)
        },
        yAxis: {
            type: 'value',
            name: '词汇数量'
        },
        series: [{
            type: 'bar',
            data: vocabularyData.map(item => item.value),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#8B5CF6' },
                    { offset: 1, color: '#7C3AED' }
                ]),
                borderRadius: [5, 5, 0, 0]
            }
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.vocabulary = chart;
}

// 情感分析趋势图表
function initializeEmotionChart() {
    const chartDom = document.getElementById('emotion-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const emotionData = dashboardData.writingStats.slice(-14).map(d => ({
        date: d.date.substring(5),
        positive: Math.random() * 40 + 60,
        negative: Math.random() * 20 + 10,
        neutral: Math.random() * 30 + 20
    }));
    
    const option = {
        title: {
            text: '情感分析趋势',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['积极', '消极', '中性'],
            bottom: 0
        },
        xAxis: {
            type: 'category',
            data: emotionData.map(d => d.date)
        },
        yAxis: {
            type: 'value',
            name: '比例(%)',
            max: 100
        },
        series: [
            {
                name: '积极',
                type: 'line',
                stack: 'emotion',
                data: emotionData.map(d => d.positive),
                itemStyle: { color: '#10B981' },
                areaStyle: { color: 'rgba(16, 185, 129, 0.3)' }
            },
            {
                name: '中性',
                type: 'line',
                stack: 'emotion',
                data: emotionData.map(d => d.neutral),
                itemStyle: { color: '#6B7280' },
                areaStyle: { color: 'rgba(107, 114, 128, 0.3)' }
            },
            {
                name: '消极',
                type: 'line',
                stack: 'emotion',
                data: emotionData.map(d => d.negative),
                itemStyle: { color: '#EF4444' },
                areaStyle: { color: 'rgba(239, 68, 68, 0.3)' }
            }
        ]
    };
    
    chart.setOption(option);
    dashboardCharts.emotion = chart;
}

// 写作质量评分图表
function initializeQualityScoreChart() {
    const chartDom = document.getElementById('quality-score-chart');
    if (!chartDom) return;
    
    const chart = echarts.init(chartDom);
    
    const qualityMetrics = [
        { metric: '语法正确性', score: 92 },
        { metric: '结构完整性', score: 85 },
        { metric: '逻辑连贯性', score: 88 },
        { metric: '表达准确性', score: 90 },
        { metric: '创意性', score: 78 },
        { metric: '可读性', score: 95 }
    ];
    
    const option = {
        title: {
            text: '写作质量评分',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: '{b}: {c} 分'
        },
        xAxis: {
            type: 'value',
            name: '分数',
            min: 0,
            max: 100
        },
        yAxis: {
            type: 'category',
            data: qualityMetrics.map(m => m.metric),
            axisLine: {
                show: true
            },
            axisTick: {
                show: false
            }
        },
        series: [{
            type: 'bar',
            data: qualityMetrics.map(m => m.score),
            itemStyle: {
                color: function(params) {
                    const colors = ['#10B981', '#F6AD55', '#3B82F6', '#8B5CF6', '#EF4444', '#6B7280'];
                    return colors[params.dataIndex % colors.length];
                },
                borderRadius: [0, 5, 5, 0]
            },
            label: {
                show: true,
                position: 'right',
                formatter: '{c}'
            }
        }]
    };
    
    chart.setOption(option);
    dashboardCharts.qualityScore = chart;
}

// 获取项目类型中文名称
function getProjectTypeName(type) {
    const typeNames = {
        'novel': '小说',
        'essay': '论文',
        'blog': '博客',
        'report': '报告'
    };
    return typeNames[type] || type;
}

// 加载项目列表
function loadProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;
    
    projectsGrid.innerHTML = '';
    
    dashboardData.projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
}

// 创建项目卡片
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-item bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer';
    
    const statusColor = project.status === 'completed' ? 'green' : 'blue';
    const statusText = project.status === 'completed' ? '已完成' : '进行中';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h4 class="font-semibold text-gray-900 text-sm">${project.title}</h4>
            <span class="text-xs bg-${statusColor}-100 text-${statusColor}-800 px-2 py-1 rounded">${statusText}</span>
        </div>
        <div class="space-y-2 text-sm text-gray-600">
            <div class="flex justify-between">
                <span>字数:</span>
                <span class="font-medium">${project.words.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
                <span>进度:</span>
                <span class="font-medium">${project.progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div class="bg-orange-500 h-2 rounded-full transition-all duration-300" style="width: ${project.progress}%"></div>
            </div>
            <div class="text-xs text-gray-500">
                ${formatLastModified(project.lastModified)}
            </div>
        </div>
        <div class="flex justify-between mt-3">
            <button onclick="editProject(${project.id})" class="text-blue-600 hover:text-blue-800 text-xs">编辑</button>
            <button onclick="deleteProject(${project.id})" class="text-red-600 hover:text-red-800 text-xs">删除</button>
        </div>
    `;
    
    // 添加动画效果
    anime({
        targets: card,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutExpo'
    });
    
    return card;
}

// 格式化最后修改时间
function formatLastModified(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return '今天';
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays < 7) {
        return `${diffDays} 天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 生成AI洞察
function generateAIInsights() {
    const insightsContainer = document.getElementById('insights-container');
    if (!insightsContainer) return;
    
    const insights = [
        {
            title: '写作效率提升',
            description: '相比上周，您的写作效率提升了15%，平均每日字数从890字增长到1023字。',
            type: 'positive',
            icon: '📈'
        },
        {
            title: '最佳写作时间',
            description: '数据分析显示，您在晚上8-10点写作效率最高，建议在此时间段安排重要写作任务。',
            type: 'neutral',
            icon: '⏰'
        },
        {
            title: '词汇多样性',
            description: '您的词汇丰富度评分为85分，建议尝试使用更多样化的词汇表达。',
            type: 'warning',
            icon: '📚'
        }
    ];
    
    insightsContainer.innerHTML = '';
    
    insights.forEach(insight => {
        const insightCard = createInsightCard(insight);
        insightsContainer.appendChild(insightCard);
    });
}

// 创建洞察卡片
function createInsightCard(insight) {
    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
    
    const borderColors = {
        positive: 'border-green-300',
        neutral: 'border-blue-300',
        warning: 'border-yellow-300'
    };
    
    const bgColors = {
        positive: 'bg-green-50',
        neutral: 'bg-blue-50',
        warning: 'bg-yellow-50'
    };
    
    card.className += ` ${borderColors[insight.type]} ${bgColors[insight.type]}`;
    
    card.innerHTML = `
        <div class="flex items-start space-x-3">
            <span class="text-2xl">${insight.icon}</span>
            <div>
                <h4 class="font-semibold text-gray-900 mb-1">${insight.title}</h4>
                <p class="text-sm text-gray-700">${insight.description}</p>
            </div>
        </div>
    `;
    
    return card;
}

// 设置事件监听器
function setupEventListeners() {
    // 项目筛选器
    const projectFilter = document.getElementById('project-filter');
    if (projectFilter) {
        projectFilter.addEventListener('change', filterProjects);
    }
    
    // 窗口大小变化时重新调整图表
    window.addEventListener('resize', () => {
        Object.values(dashboardCharts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    });
}

// 筛选项目
function filterProjects() {
    const filter = document.getElementById('project-filter').value;
    const projects = dashboardData.projects;
    
    const filteredProjects = filter === 'all' ? projects : projects.filter(p => p.type === filter);
    
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        projectsGrid.innerHTML = '';
        filteredProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
    }
}

// 刷新仪表板
function refreshDashboard() {
    showLoadingIndicator('正在刷新数据...');
    
    setTimeout(() => {
        loadDashboardData();
        loadProjects();
        generateAIInsights();
        
        // 重新渲染图表
        Object.values(dashboardCharts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
        
        hideLoadingIndicator();
        showNotification('数据已刷新', 'success');
    }, 1000);
}

// 导出所有数据
function exportAllData() {
    const exportData = {
        writingStats: dashboardData.writingStats,
        projects: dashboardData.projects,
        exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `writing-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('数据已导出', 'success');
}

// 编辑项目
function editProject(projectId) {
    const project = dashboardData.projects.find(p => p.id === projectId);
    if (project) {
        // 这里可以打开编辑模态框或跳转到编辑页面
        showNotification(`编辑项目: ${project.title}`, 'info');
    }
}

// 删除项目
function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？')) {
        dashboardData.projects = dashboardData.projects.filter(p => p.id !== projectId);
        localStorage.setItem('writing_projects', JSON.stringify(dashboardData.projects));
        loadProjects();
        showNotification('项目已删除', 'success');
    }
}

// 创建新项目
function createNewProject() {
    const projectName = prompt('请输入项目名称：');
    if (projectName) {
        const newProject = {
            id: Date.now(),
            title: projectName,
            type: 'novel',
            words: 0,
            lastModified: new Date().toISOString(),
            progress: 0,
            status: 'active'
        };
        
        dashboardData.projects.push(newProject);
        localStorage.setItem('writing_projects', JSON.stringify(dashboardData.projects));
        loadProjects();
        showNotification('项目已创建', 'success');
    }
}

// 显示加载指示器
function showLoadingIndicator(message = '处理中...') {
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
    indicator.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>${message}</span>
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
document.addEventListener('DOMContentLoaded', initializeDashboard);

// 导出函数供HTML调用
window.refreshDashboard = refreshDashboard;
window.exportAllData = exportAllData;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.createNewProject = createNewProject;
window.generateAIInsights = generateAIInsights;