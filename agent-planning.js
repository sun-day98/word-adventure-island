/**
 * 规划代理 - 任务分析与分解模块
 * 负责分析用户查询，创建结构化任务列表，制定执行策略
 */

class PlanningAgent {
    constructor() {
        this.name = '规划代理';
        this.version = '1.0.0';
        this.capabilities = [
            'queryAnalysis',      // 查询分析
            'taskDecomposition',  // 任务分解
            'priorityAssignment',  // 优先级分配
            'resourcePlanning',    // 资源规划
            'executionStrategy'    // 执行策略制定
        ];
    }

    /**
     * 分析用户查询
     * @param {string} query - 用户输入的查询
     * @returns {Object} 查询分析结果
     */
    async analyzeQuery(query) {
        console.log(`📋 [规划代理] 开始分析查询: "${query}"`);
        
        const analysis = {
            originalQuery: query,
            queryType: this.identifyQueryType(query),
            complexity: this.assessComplexity(query),
            keywords: this.extractKeywords(query),
            intent: this.determineIntent(query),
            requiredData: this.identifyRequiredData(query),
            estimatedEffort: this.estimateEffort(query),
            constraints: this.identifyConstraints(query)
        };
        
        console.log(`📋 [规划代理] 查询分析完成:`, analysis);
        return analysis;
    }

    /**
     * 创建结构化任务列表
     * @param {Object} queryAnalysis - 查询分析结果
     * @returns {Object} 任务计划
     */
    async createTaskPlan(queryAnalysis) {
        console.log('📋 [规划代理] 开始创建任务计划...');
        
        const taskPlan = {
            planId: this.generatePlanId(),
            createdAt: new Date().toISOString(),
            queryAnalysis: queryAnalysis,
            tasks: this.decomposeIntoTasks(queryAnalysis),
            executionStrategy: this.createExecutionStrategy(queryAnalysis),
            resourceRequirements: this.planResources(queryAnalysis),
            estimatedDuration: this.estimateTotalDuration(queryAnalysis),
            qualityCriteria: this.defineQualityCriteria(queryAnalysis)
        };
        
        console.log('📋 [规划代理] 任务计划创建完成:', taskPlan);
        return taskPlan;
    }

    /**
     * 识别查询类型
     */
    identifyQueryType(query) {
        const patterns = {
            informational: /什么是|如何|解释|介绍|定义/,
            comparative: /比较|对比|区别|优劣/,
            analytical: /分析|评估|研究|趋势/,
            practical: /怎么做|步骤|方法|指南/,
            troubleshooting: /解决|问题|错误|故障/,
            predictive: /预测|未来|发展|趋势/
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(query)) {
                return type;
            }
        }
        
        return 'general';
    }

    /**
     * 评估查询复杂度
     */
    assessComplexity(query) {
        let complexity = 1;
        
        // 基于查询长度
        complexity += Math.min(query.length / 100, 3);
        
        // 基于关键词复杂度
        const complexKeywords = ['趋势', '影响', '分析', '评估', '预测', '发展'];
        const matches = query.match(new RegExp(complexKeywords.join('|'), 'gi'));
        complexity += (matches || []).length * 0.5;
        
        // 基于句子结构
        const sentences = query.split(/[。！？]/).filter(s => s.trim());
        complexity += Math.min(sentences.length * 0.3, 2);
        
        if (complexity <= 2) return 'low';
        if (complexity <= 4) return 'medium';
        return 'high';
    }

    /**
     * 提取关键词
     */
    extractKeywords(query) {
        // 简单的关键词提取
        const stopWords = ['的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它', '这', '那'];
        const words = query.split(/[\s，。！？；：]/);
        
        return words
            .filter(word => word.length > 1 && !stopWords.includes(word))
            .slice(0, 10); // 限制关键词数量
    }

    /**
     * 确定查询意图
     */
    determineIntent(query) {
        const intents = {
            learn: /学习|了解|知道|掌握/,
            solve: /解决|处理|应对|克服/,
            compare: /比较|对比|选择|判断/,
            create: /创建|制作|开发|设计/,
            evaluate: /评估|评价|判断|考量/,
            predict: /预测|预估|展望|判断/
        };
        
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(query)) {
                return intent;
            }
        }
        
        return 'information';
    }

    /**
     * 识别所需数据
     */
    identifyRequiredData(query) {
        const dataRequirements = [];
        
        if (/技术|发展|趋势/.test(query)) {
            dataRequirements.push('技术报告', '研究论文', '行业数据');
        }
        
        if (/市场|商业|经济/.test(query)) {
            dataRequirements.push('市场分析', '经济数据', '商业报告');
        }
        
        if (/产品|服务|应用/.test(query)) {
            dataRequirements.push('产品信息', '用户评价', '应用案例');
        }
        
        if (/历史|发展|演变/.test(query)) {
            dataRequirements.push('历史数据', '发展记录', '时间线');
        }
        
        return dataRequirements.length > 0 ? dataRequirements : ['通用信息', '背景资料'];
    }

    /**
     * 估算工作努力程度
     */
    estimateEffort(query) {
        const complexity = this.assessComplexity(query);
        const effortMap = {
            'low': '1-3分钟',
            'medium': '3-8分钟',
            'high': '8-15分钟'
        };
        
        return effortMap[complexity] || '3-8分钟';
    }

    /**
     * 识别约束条件
     */
    identifyConstraints(query) {
        const constraints = [];
        
        if (/最新|最近/.test(query)) {
            constraints.push('时间范围: 最近1-2年');
        }
        
        if (/国内|中国/.test(query)) {
            constraints.push('地理范围: 中国国内');
        }
        
        if (/简单|基础|入门/.test(query)) {
            constraints.push('难度级别: 基础');
        }
        
        if (/详细|深入|全面/.test(query)) {
            constraints.push('详细程度: 深入全面');
        }
        
        return constraints;
    }

    /**
     * 将查询分解为具体任务
     */
    decomposeIntoTasks(queryAnalysis) {
        const baseTasks = [];
        const { queryType, keywords, intent } = queryAnalysis;
        
        // 基础信息收集任务
        baseTasks.push({
            id: 'info_collection',
            name: '信息收集',
            description: '收集相关的背景信息和基础数据',
            priority: 'high',
            estimatedTime: '2-5分钟',
            dependencies: [],
            tools: ['search_content', 'web_search'],
            outputs: ['背景资料', '基础数据']
        });
        
        // 根据查询类型添加特定任务
        switch (queryType) {
            case 'analytical':
                baseTasks.push({
                    id: 'trend_analysis',
                    name: '趋势分析',
                    description: '分析发展趋势和模式',
                    priority: 'high',
                    estimatedTime: '3-6分钟',
                    dependencies: ['info_collection'],
                    tools: ['search_content', 'web_search'],
                    outputs: ['趋势报告', '分析图表']
                });
                break;
                
            case 'comparative':
                baseTasks.push({
                    id: 'comparison',
                    name: '对比分析',
                    description: '对比不同方案的优缺点',
                    priority: 'high',
                    estimatedTime: '3-5分钟',
                    dependencies: ['info_collection'],
                    tools: ['search_content'],
                    outputs: ['对比表格', '评估报告']
                });
                break;
                
            case 'practical':
                baseTasks.push({
                    id: 'practical_guide',
                    name: '实践指南',
                    description: '制定具体的实施步骤',
                    priority: 'high',
                    estimatedTime: '2-4分钟',
                    dependencies: ['info_collection'],
                    tools: ['search_content'],
                    outputs: ['步骤指南', '操作清单']
                });
                break;
        }
        
        // 添加验证任务
        baseTasks.push({
            id: 'verification',
            name: '信息验证',
            description: '验证收集信息的准确性和完整性',
            priority: 'medium',
            estimatedTime: '1-2分钟',
            dependencies: baseTasks.map(t => t.id),
            tools: [],
            outputs: ['验证报告']
        });
        
        return baseTasks;
    }

    /**
     * 创建执行策略
     */
    createExecutionStrategy(queryAnalysis) {
        const { complexity, queryType } = queryAnalysis;
        
        return {
            approach: this.selectApproach(queryType, complexity),
            parallelism: complexity === 'high' ? 'partial' : 'sequential',
            fallbackStrategy: 'simplify_scope',
            qualityGate: true,
            iterationLimit: 3,
            timeoutStrategy: 'partial_results'
        };
    }

    /**
     * 选择处理方法
     */
    selectApproach(queryType, complexity) {
        const approaches = {
            informational: 'comprehensive_research',
            comparative: 'systematic_comparison',
            analytical: 'deep_analysis',
            practical: 'step_by_step_guide',
            troubleshooting: 'diagnostic_approach',
            predictive: 'trend_forecasting'
        };
        
        return approaches[queryType] || 'comprehensive_research';
    }

    /**
     * 规划资源需求
     */
    planResources(queryAnalysis) {
        const { complexity, requiredData } = queryAnalysis;
        
        return {
            computational: this.calculateComputationalNeeds(complexity),
            data: requiredData,
            tools: this.requiredTools(queryAnalysis),
            time: this.estimateTotalDuration(queryAnalysis),
            human: complexity === 'high' ? 'minimal_supervision' : 'automated'
        };
    }

    /**
     * 计算计算需求
     */
    calculateComputationalNeeds(complexity) {
        const needs = {
            'low': 'minimal',
            'medium': 'moderate',
            'high': 'intensive'
        };
        
        return needs[complexity] || 'moderate';
    }

    /**
     * 确定所需工具
     */
    requiredTools(queryAnalysis) {
        const tools = ['search_content']; // 基础搜索工具
        
        if (queryAnalysis.queryType === 'analytical') {
            tools.push('web_search');
        }
        
        if (queryAnalysis.queryType === 'predictive') {
            tools.push('web_search', 'task');
        }
        
        return tools;
    }

    /**
     * 估算总持续时间
     */
    estimateTotalDuration(queryAnalysis) {
        const effortMap = {
            'low': '2-5分钟',
            'medium': '5-10分钟',
            'high': '10-20分钟'
        };
        
        return effortMap[queryAnalysis.complexity] || '5-10分钟';
    }

    /**
     * 定义质量标准
     */
    defineQualityCriteria(queryAnalysis) {
        return {
            completeness: queryAnalysis.complexity === 'high' ? '95%' : '90%',
            accuracy: 'high',
            relevance: 'very_high',
            clarity: 'excellent',
            timeliness: 'recent',
            sourceReliability: 'authoritative'
        };
    }

    /**
     * 生成计划ID
     */
    generatePlanId() {
        return 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 导出计划为JSON
     */
    exportPlan(taskPlan) {
        return JSON.stringify(taskPlan, null, 2);
    }

    /**
     * 验证任务计划的完整性
     */
    validateTaskPlan(taskPlan) {
        const requiredFields = ['planId', 'tasks', 'executionStrategy', 'resourceRequirements'];
        const missingFields = requiredFields.filter(field => !taskPlan[field]);
        
        return {
            isValid: missingFields.length === 0,
            missingFields,
            score: Math.max(0, 100 - missingFields.length * 25)
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlanningAgent;
}

// 示例使用
if (typeof window !== 'undefined') {
    window.PlanningAgent = PlanningAgent;
}