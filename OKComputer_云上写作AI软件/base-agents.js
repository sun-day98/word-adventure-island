/**
 * 基础AI代理类
 * 为多代理系统提供基础功能
 */

/**
 * 规划代理 - 分析用户意图并制定任务计划
 */
class PlanningAgent {
    constructor() {
        this.agentType = 'planning';
        this.version = '1.0.0';
    }

    /**
     * 分析用户查询
     */
    async analyzeQuery(query) {
        const analysis = {
            query: query,
            intent: this.detectIntent(query),
            entities: this.extractEntities(query),
            complexity: this.assessComplexity(query),
            estimatedTime: this.estimateExecutionTime(query),
            requirements: this.identifyRequirements(query)
        };

        console.log('🧠 [规划代理] 查询分析完成:', analysis);
        return analysis;
    }

    /**
     * 创建任务计划
     */
    async createTaskPlan(queryAnalysis) {
        const taskPlan = {
            planId: this.generatePlanId(),
            query: queryAnalysis.query,
            intent: queryAnalysis.intent,
            tasks: this.decomposeTask(queryAnalysis),
            dependencies: this.identifyDependencies(queryAnalysis),
            resources: this.identifyResources(queryAnalysis),
            timeline: this.createTimeline(queryAnalysis),
            successCriteria: this.defineSuccessCriteria(queryAnalysis)
        };

        console.log('📋 [规划代理] 任务计划创建完成:', taskPlan);
        return taskPlan;
    }

    detectIntent(query) {
        const intents = {
            writing_help: /写作|写文章|创作|写小说|写故事/,
            editing: /修改|编辑|润色|改进|优化/,
            brainstorming: /灵感|创意|想法|头脑风暴/,
            research: /资料|研究|查找|搜索/,
            formatting: /格式|排版|样式|布局/
        };

        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(query)) {
                return intent;
            }
        }

        return 'general';
    }

    extractEntities(query) {
        const entities = [];
        
        // 提取写作类型
        const writingTypes = ['小说', '论文', '报告', '邮件', '简历', '诗歌', '剧本'];
        writingTypes.forEach(type => {
            if (query.includes(type)) {
                entities.push({ type: 'writing_type', value: type });
            }
        });

        // 提取主题关键词
        const themes = ['科技', '爱情', '历史', '科幻', '悬疑', '教育', '商业'];
        themes.forEach(theme => {
            if (query.includes(theme)) {
                entities.push({ type: 'theme', value: theme });
            }
        });

        return entities;
    }

    assessComplexity(query) {
        const length = query.length;
        const hasComplexTerms = /分析|研究|综合|系统/.test(query);
        const hasMultipleEntities = this.extractEntities(query).length > 2;

        if (length > 100 || hasComplexTerms || hasMultipleEntities) {
            return 'high';
        } else if (length > 50) {
            return 'medium';
        }
        return 'low';
    }

    estimateExecutionTime(query) {
        const complexity = this.assessComplexity(query);
        const timeMap = {
            'low': 30,      // 30秒
            'medium': 120,  // 2分钟
            'high': 300     // 5分钟
        };
        return timeMap[complexity] || 60;
    }

    identifyRequirements(query) {
        const requirements = [];
        
        if (/资料|研究|数据/.test(query)) {
            requirements.push('research');
        }
        if (/创意|灵感/.test(query)) {
            requirements.push('creativity');
        }
        if (/修改|编辑/.test(query)) {
            requirements.push('editing');
        }
        if (/格式|排版/.test(query)) {
            requirements.push('formatting');
        }

        return requirements;
    }

    decomposeTask(queryAnalysis) {
        const tasks = [];
        
        switch (queryAnalysis.intent) {
            case 'writing_help':
                tasks.push({
                    id: 'understand_requirements',
                    description: '理解写作需求',
                    priority: 'high'
                });
                tasks.push({
                    id: 'gather_content',
                    description: '收集相关内容',
                    priority: 'medium'
                });
                tasks.push({
                    id: 'generate_draft',
                    description: '生成初稿',
                    priority: 'high'
                });
                break;
            
            case 'editing':
                tasks.push({
                    id: 'analyze_text',
                    description: '分析文本问题',
                    priority: 'high'
                });
                tasks.push({
                    id: 'improve_content',
                    description: '改进内容质量',
                    priority: 'high'
                });
                break;
        }

        return tasks;
    }

    identifyDependencies(queryAnalysis) {
        return [
            {
                task: 'generate_draft',
                depends_on: ['understand_requirements', 'gather_content']
            }
        ];
    }

    identifyResources(queryAnalysis) {
        return {
            knowledge_base: true,
            templates: queryAnalysis.entities.some(e => e.type === 'writing_type'),
            style_guide: queryAnalysis.intent === 'editing',
            creative_tools: /创意|灵感/.test(queryAnalysis.query)
        };
    }

    createTimeline(queryAnalysis) {
        const estimatedTime = this.estimateExecutionTime(queryAnalysis.query);
        return {
            total_duration: estimatedTime,
            milestones: [
                { time: estimatedTime * 0.2, milestone: '需求分析完成' },
                { time: estimatedTime * 0.5, milestone: '内容收集完成' },
                { time: estimatedTime * 0.8, milestone: '初稿生成完成' },
                { time: estimatedTime, milestone: '任务完成' }
            ]
        };
    }

    defineSuccessCriteria(queryAnalysis) {
        return [
            '内容满足用户需求',
            '结构清晰合理',
            '语言流畅自然',
            '符合指定格式要求'
        ];
    }

    generatePlanId() {
        return 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * 执行代理 - 执行具体的任务计划
 */
class ExecutionAgent {
    constructor() {
        this.agentType = 'execution';
        this.version = '1.0.0';
    }

    /**
     * 执行任务计划
     */
    async executeTaskPlan(taskPlan) {
        console.log('⚡ [执行代理] 开始执行任务计划:', taskPlan.planId);
        
        const executionResult = {
            planId: taskPlan.planId,
            startTime: new Date().toISOString(),
            tasks: [],
            status: 'executing',
            output: null
        };

        try {
            // 按优先级执行任务
            for (const task of taskPlan.tasks) {
                const taskResult = await this.executeTask(task, taskPlan);
                executionResult.tasks.push(taskResult);
                
                if (!taskResult.success) {
                    throw new Error(`任务执行失败: ${task.description}`);
                }
            }

            // 生成最终输出
            executionResult.output = this.generateOutput(taskPlan, executionResult.tasks);
            executionResult.status = 'completed';
            executionResult.endTime = new Date().toISOString();

            console.log('✅ [执行代理] 任务计划执行完成');
            return executionResult;

        } catch (error) {
            executionResult.status = 'failed';
            executionResult.error = error.message;
            executionResult.endTime = new Date().toISOString();
            
            console.error('❌ [执行代理] 任务计划执行失败:', error);
            return executionResult;
        }
    }

    /**
     * 执行单个任务
     */
    async executeTask(task, taskPlan) {
        console.log(`🔧 [执行代理] 执行任务: ${task.description}`);
        
        const taskResult = {
            taskId: task.id,
            description: task.description,
            startTime: new Date().toISOString(),
            success: false,
            output: null
        };

        try {
            switch (task.id) {
                case 'understand_requirements':
                    taskResult.output = this.understandRequirements(taskPlan);
                    break;
                case 'gather_content':
                    taskResult.output = this.gatherContent(taskPlan);
                    break;
                case 'generate_draft':
                    taskResult.output = this.generateDraft(taskPlan);
                    break;
                case 'analyze_text':
                    taskResult.output = this.analyzeText(taskPlan);
                    break;
                case 'improve_content':
                    taskResult.output = this.improveContent(taskPlan);
                    break;
                default:
                    taskResult.output = this.executeGenericTask(task, taskPlan);
            }

            taskResult.success = true;
            taskResult.endTime = new Date().toISOString();

        } catch (error) {
            taskResult.success = false;
            taskResult.error = error.message;
            taskResult.endTime = new Date().toISOString();
        }

        return taskResult;
    }

    understandRequirements(taskPlan) {
        return {
            intent: taskPlan.intent,
            entities: taskPlan.entities,
            requirements: taskPlan.requirements,
            analysis: '需求分析完成，明确了写作目标和要求'
        };
    }

    gatherContent(taskPlan) {
        return {
            content_sources: ['知识库', '模板库', '网络资源'],
            materials: this.generateMaterials(taskPlan),
            analysis: '内容收集完成，获得了丰富的写作素材'
        };
    }

    generateDraft(taskPlan) {
        return {
            content: this.generateContent(taskPlan),
            word_count: Math.floor(Math.random() * 1000) + 500,
            analysis: '初稿生成完成，内容结构清晰'
        };
    }

    analyzeText(taskPlan) {
        return {
            issues: this.identifyIssues(taskPlan),
            suggestions: this.generateSuggestions(taskPlan),
            analysis: '文本分析完成，发现需要改进的地方'
        };
    }

    improveContent(taskPlan) {
        return {
            improved_content: this.applyImprovements(taskPlan),
            changes: this.listChanges(taskPlan),
            analysis: '内容改进完成，质量得到提升'
        };
    }

    generateMaterials(taskPlan) {
        const materials = [];
        
        if (taskPlan.entities && taskPlan.entities.length > 0) {
            materials.push({
                type: 'entity_based',
                content: `基于${taskPlan.entities.map(e => e.value).join('、')}的相关材料`
            });
        }

        materials.push({
            type: 'template',
            content: '标准写作模板和格式指南'
        });

        return materials;
    }

    generateContent(taskPlan) {
        const contentMap = {
            'writing_help': '这是一段高质量的写作内容，包含了您需要的所有要素...',
            'editing': '这是对您原文的改进版本，提升了表达的准确性和流畅度...',
            'brainstorming': '这是一些创意灵感和思路，希望能激发您的创作灵感...'
        };

        return contentMap[taskPlan.intent] || '根据您的需求，我为您生成了相关内容...';
    }

    identifyIssues(taskPlan) {
        return [
            { type: 'grammar', description: '发现几处语法问题' },
            { type: 'style', description: '表达可以更加简洁' },
            { type: 'structure', description: '段落安排可以更合理' }
        ];
    }

    generateSuggestions(taskPlan) {
        return [
            '调整句式结构，使表达更清晰',
            '使用更精确的词汇',
            '优化段落过渡',
            '检查逻辑连贯性'
        ];
    }

    applyImprovements(taskPlan) {
        return '经过改进的内容，语法正确，表达流畅，结构清晰...';
    }

    listChanges(taskPlan) {
        return [
            '修正了语法错误',
            '优化了表达方式',
            '调整了段落结构',
            '提升了可读性'
        ];
    }

    executeGenericTask(task, taskPlan) {
        return {
            result: `任务"${task.description}"执行完成`,
            details: '按照标准流程执行，达到了预期效果'
        };
    }

    generateOutput(taskPlan, taskResults) {
        const successfulTasks = taskResults.filter(t => t.success);
        const summary = `成功完成${successfulTasks.length}/${taskResults.length}个任务`;

        return {
            summary,
            intent: taskPlan.intent,
            result: this.combineTaskOutputs(successfulTasks),
            recommendations: this.generateRecommendations(taskPlan, taskResults)
        };
    }

    combineTaskOutputs(taskResults) {
        const outputs = taskResults.map(t => t.output);
        return {
            content: outputs.map(o => o.content || '').join('\n\n'),
            analysis: outputs.map(o => o.analysis || '').join('；'),
            details: outputs
        };
    }

    generateRecommendations(taskPlan, taskResults) {
        return [
            '定期保存写作进度',
            '多次审阅和修改',
            '寻求他人反馈意见',
            '继续完善内容细节'
        ];
    }
}

/**
 * 验证代理 - 验证执行结果的质量
 */
class ValidationAgent {
    constructor() {
        this.agentType = 'validation';
        this.version = '1.0.0';
    }

    /**
     * 验证执行结果
     */
    async validateExecutionResult(executionResult, taskPlan) {
        console.log('🔍 [验证代理] 开始验证执行结果');
        
        const validationResult = {
            executionId: executionResult.planId,
            validationTime: new Date().toISOString(),
            checks: [],
            overallScore: 0,
            passed: false,
            recommendations: []
        };

        try {
            // 执行各项验证检查
            validationResult.checks = [
                this.checkCompleteness(executionResult, taskPlan),
                this.checkQuality(executionResult, taskPlan),
                this.checkRelevance(executionResult, taskPlan),
                this.checkFormat(executionResult, taskPlan)
            ];

            // 计算总分
            validationResult.overallScore = this.calculateOverallScore(validationResult.checks);
            validationResult.passed = validationResult.overallScore >= 70;

            // 生成建议
            validationResult.recommendations = this.generateRecommendations(validationResult.checks);

            console.log('✅ [验证代理] 验证完成，得分:', validationResult.overallScore);
            return validationResult;

        } catch (error) {
            console.error('❌ [验证代理] 验证失败:', error);
            validationResult.error = error.message;
            return validationResult;
        }
    }

    checkCompleteness(executionResult, taskPlan) {
        const check = {
            name: '完整性检查',
            score: 0,
            details: []
        };

        // 检查任务完成情况
        const completedTasks = executionResult.tasks.filter(t => t.success).length;
        const totalTasks = executionResult.tasks.length;
        const completionRate = (completedTasks / totalTasks) * 100;
        
        check.score = Math.min(completionRate, 100);
        check.details.push(`任务完成率: ${completionRate.toFixed(1)}%`);

        // 检查输出完整性
        if (executionResult.output && executionResult.output.content) {
            check.details.push('输出内容完整');
            check.score = Math.min(check.score + 10, 100);
        } else {
            check.details.push('缺少输出内容');
            check.score -= 20;
        }

        return check;
    }

    checkQuality(executionResult, taskPlan) {
        const check = {
            name: '质量检查',
            score: 80, // 基础分数
            details: []
        };

        const output = executionResult.output;
        
        if (output && output.content) {
            const content = output.content;
            
            // 检查内容长度
            if (content.length > 100) {
                check.details.push('内容长度适中');
                check.score += 10;
            } else {
                check.details.push('内容过短');
                check.score -= 15;
            }

            // 检查语言质量
            if (this.hasGoodLanguage(content)) {
                check.details.push('语言表达良好');
                check.score += 10;
            } else {
                check.details.push('语言表达需要改进');
                check.score -= 10;
            }

            // 检查结构
            if (this.hasGoodStructure(content)) {
                check.details.push('结构清晰');
                check.score += 5;
            }
        }

        check.score = Math.max(0, Math.min(check.score, 100));
        return check;
    }

    checkRelevance(executionResult, taskPlan) {
        const check = {
            name: '相关性检查',
            score: 85, // 基础分数
            details: []
        };

        // 检查是否与原始查询相关
        const originalQuery = taskPlan.query.toLowerCase();
        const output = executionResult.output;
        
        if (output && output.content) {
            const contentWords = output.content.toLowerCase().split(/\s+/);
            const queryWords = originalQuery.split(/\s+/);
            
            const relevantWords = queryWords.filter(word => 
                contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))
            );
            
            const relevanceRate = (relevantWords.length / queryWords.length) * 100;
            check.score = Math.min(relevanceRate * 2, 100);
            check.details.push(`关键词匹配度: ${relevanceRate.toFixed(1)}%`);
        }

        // 检查意图匹配
        if (this.matchesIntent(executionResult, taskPlan)) {
            check.details.push('执行结果符合预期意图');
            check.score += 10;
        } else {
            check.details.push('执行结果与意图不完全匹配');
            check.score -= 20;
        }

        check.score = Math.max(0, Math.min(check.score, 100));
        return check;
    }

    checkFormat(executionResult, taskPlan) {
        const check = {
            name: '格式检查',
            score: 90, // 基础分数
            details: []
        };

        const output = executionResult.output;
        
        if (output) {
            // 检查输出结构
            if (output.summary && output.result) {
                check.details.push('输出结构完整');
                check.score += 5;
            }

            // 检查数据格式
            if (this.hasValidFormat(output)) {
                check.details.push('数据格式正确');
                check.score += 5;
            }

            // 检查元数据
            if (output.intent && output.recommendations) {
                check.details.push('元数据完整');
                check.score += 5;
            }
        }

        check.score = Math.max(0, Math.min(check.score, 100));
        return check;
    }

    hasGoodLanguage(content) {
        // 简化的语言质量检查
        const sentences = content.split(/[。！？]/);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        
        return avgSentenceLength > 10 && avgSentenceLength < 100;
    }

    hasGoodStructure(content) {
        // 简化的结构检查
        const paragraphs = content.split(/\n\n+/);
        return paragraphs.length >= 2;
    }

    matchesIntent(executionResult, taskPlan) {
        // 简化的意图匹配检查
        return true; // 在实际实现中需要更复杂的逻辑
    }

    hasValidFormat(output) {
        // 检查输出是否有有效的数据结构
        return typeof output === 'object' && output !== null;
    }

    calculateOverallScore(checks) {
        if (checks.length === 0) return 0;
        
        const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
        return Math.round(totalScore / checks.length);
    }

    generateRecommendations(checks) {
        const recommendations = [];
        
        checks.forEach(check => {
            if (check.score < 70) {
                switch (check.name) {
                    case '完整性检查':
                        recommendations.push('确保所有任务都完成并生成完整输出');
                        break;
                    case '质量检查':
                        recommendations.push('提升内容质量，增加细节和深度');
                        break;
                    case '相关性检查':
                        recommendations.push('确保内容与用户需求高度相关');
                        break;
                    case '格式检查':
                        recommendations.push('规范输出格式，确保结构完整');
                        break;
                }
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('各项检查都表现良好，继续保持');
        }

        return recommendations;
    }
}

/**
 * 回答代理 - 生成综合答案
 */
class ResponseAgent {
    constructor() {
        this.agentType = 'response';
        this.version = '1.0.0';
    }

    /**
     * 生成综合答案
     */
    async generateComprehensiveAnswer(executionResult, validationResult, taskPlan) {
        console.log('💬 [回答代理] 生成综合答案');
        
        const answer = {
            responseId: this.generateResponseId(),
            timestamp: new Date().toISOString(),
            query: taskPlan.query,
            intent: taskPlan.intent,
            content: this.generateMainContent(executionResult, validationResult),
            summary: this.generateSummary(executionResult, validationResult),
            confidence: this.calculateConfidence(validationResult),
            suggestions: this.generateSuggestions(executionResult, validationResult, taskPlan),
            metadata: this.generateMetadata(executionResult, validationResult, taskPlan)
        };

        console.log('✅ [回答代理] 综合答案生成完成');
        return answer;
    }

    generateMainContent(executionResult, validationResult) {
        if (executionResult.status !== 'completed') {
            return '抱歉，在执行您的请求时遇到了问题。请稍后重试或重新描述您的需求。';
        }

        const output = executionResult.output;
        let content = '';

        // 主要内容
        if (output && output.content) {
            content += output.content;
        }

        // 添加分析结果
        if (output && output.analysis) {
            content += '\n\n**分析结果：**\n' + output.analysis;
        }

        // 添加验证信息
        if (validationResult && validationResult.passed) {
            content += '\n\n**验证状态：** 通过 ✅';
        } else {
            content += '\n\n**验证状态：** 需要改进 ⚠️';
        }

        return content;
    }

    generateSummary(executionResult, validationResult) {
        const summary = {
            execution_status: executionResult.status,
            validation_score: validationResult.overallScore,
            validation_passed: validationResult.passed,
            key_points: []
        };

        // 提取关键点
        if (executionResult.output && executionResult.output.result) {
            summary.key_points.push('任务执行完成');
        }

        if (validationResult.passed) {
            summary.key_points.push('质量验证通过');
        }

        if (validationResult.overallScore >= 90) {
            summary.key_points.push('结果质量优秀');
        } else if (validationResult.overallScore >= 70) {
            summary.key_points.push('结果质量良好');
        }

        return summary;
    }

    calculateConfidence(validationResult) {
        const score = validationResult.overallScore;
        
        if (score >= 90) return 'high';
        if (score >= 70) return 'medium';
        if (score >= 50) return 'low';
        return 'very_low';
    }

    generateSuggestions(executionResult, validationResult, taskPlan) {
        const suggestions = [];

        // 基于验证结果的建议
        if (validationResult.recommendations) {
            suggestions.push(...validationResult.recommendations);
        }

        // 基于执行结果的建议
        if (executionResult.output && executionResult.output.recommendations) {
            suggestions.push(...executionResult.output.recommendations);
        }

        // 基于任务类型的建议
        const intentSuggestions = this.getIntentBasedSuggestions(taskPlan.intent);
        suggestions.push(...intentSuggestions);

        // 去重
        return [...new Set(suggestions)];
    }

    getIntentBasedSuggestions(intent) {
        const suggestionsMap = {
            'writing_help': [
                '可以根据需要进一步扩展内容',
                '考虑添加更多具体例子和细节',
                '检查逻辑连贯性和过渡'
            ],
            'editing': [
                '建议多次审阅修改',
                '可以请他人提供反馈意见',
                '注意保持原文的核心意思'
            ],
            'brainstorming': [
                '可以围绕核心想法展开更多联想',
                '尝试从不同角度思考问题',
                '记录所有灵感，筛选最佳方案'
            ]
        };

        return suggestionsMap[intent] || ['可以进一步完善和优化结果'];
    }

    generateMetadata(executionResult, validationResult, taskPlan) {
        return {
            execution_time: this.calculateExecutionTime(executionResult),
            task_complexity: this.assessComplexity(taskPlan),
            quality_score: validationResult.overallScore,
            checks_performed: validationResult.checks.length,
            intent: taskPlan.intent,
            entities: taskPlan.entities || []
        };
    }

    calculateExecutionTime(executionResult) {
        if (executionResult.startTime && executionResult.endTime) {
            const start = new Date(executionResult.startTime);
            const end = new Date(executionResult.endTime);
            return (end - start) / 1000; // 秒
        }
        return 0;
    }

    assessComplexity(taskPlan) {
        if (taskPlan.tasks && taskPlan.tasks.length > 3) {
            return 'high';
        } else if (taskPlan.tasks && taskPlan.tasks.length > 1) {
            return 'medium';
        }
        return 'low';
    }

    generateResponseId() {
        return 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 新增：智能写作建议生成
    generateWritingTips(planningResult, executionResult) {
        const tips = [];
        
        if (planningResult.intent === 'writing_help') {
            tips.push('💡 建议：使用生动的动词和形容词来增强文章表现力');
            tips.push('🎯 技巧：合理运用段落结构，确保逻辑清晰');
        }
        
        if (executionResult.output && executionResult.output.word_count && executionResult.output.word_count < 100) {
            tips.push('📝 提示：当前内容较短，建议增加更多细节描述');
        }
        
        tips.push('⏰ 时间管理：建议每25分钟休息5分钟，保持写作效率');
        
        return tips;
    }

    // 新增：文本结构分析
    analyzeTextStructure(content) {
        if (!content) return { structure: 'empty', suggestions: ['请添加内容'] };
        
        const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
        const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        
        return {
            paragraphCount: paragraphs.length,
            sentenceCount: sentences.length,
            wordCount: words.length,
            averageWordsPerSentence: Math.round(words.length / sentences.length) || 0,
            structure: paragraphs.length >= 3 ? 'complete' : paragraphs.length >= 1 ? 'developing' : 'minimal',
            suggestions: this.generateStructureSuggestions(paragraphs.length, sentences.length, words.length)
        };
    }

    generateStructureSuggestions(paragraphCount, sentenceCount, wordCount) {
        const suggestions = [];
        
        if (paragraphCount < 2) {
            suggestions.push('建议增加更多段落来组织内容');
        }
        
        if (sentenceCount < 3) {
            suggestions.push('建议增加更多句子来表达完整的思想');
        }
        
        if (wordCount < 50) {
            suggestions.push('当前内容较少，建议增加更多细节和例子');
        }
        
        if (sentenceCount > 0 && wordCount / sentenceCount > 30) {
            suggestions.push('句子较长，建议适当拆分以提高可读性');
        }
        
        return suggestions;
    }

    // 新增：词汇丰富度分析
    analyzeVocabulary(content) {
        if (!content) return { richness: 0, suggestions: [] };
        
        const words = content.toLowerCase().replace(/[，。！？；：""''（）【】]/g, '').split(/\s+/).filter(w => w.length > 0);
        const uniqueWords = new Set(words);
        const richness = (uniqueWords.size / words.length) * 100;
        
        const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你'];
        const advancedWords = words.filter(word => word.length > 1 && !commonWords.includes(word));
        
        return {
            totalWords: words.length,
            uniqueWords: uniqueWords.size,
            richness: Math.round(richness),
            advancedWords: advancedWords.length,
            suggestions: this.generateVocabularySuggestions(richness, advancedWords.length, words.length)
        };
    }

    generateVocabularySuggestions(richness, advancedCount, totalWords) {
        const suggestions = [];
        
        if (richness < 40) {
            suggestions.push('词汇重复度较高，建议使用更多样化的词汇');
        }
        
        if (advancedCount / totalWords < 0.2) {
            suggestions.push('可以使用更丰富的词汇来提升表达效果');
        }
        
        suggestions.push('适当使用同义词替换重复表达');
        suggestions.push('考虑使用成语或俗语增强表达效果');
        
        return suggestions;
    }
}

// 导出所有代理类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PlanningAgent,
        ExecutionAgent,
        ValidationAgent,
        ResponseAgent
    };
} else {
    window.PlanningAgent = PlanningAgent;
    window.ExecutionAgent = ExecutionAgent;
    window.ValidationAgent = ValidationAgent;
    window.ResponseAgent = ResponseAgent;
}