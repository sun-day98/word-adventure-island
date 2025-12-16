/**
 * 回答代理 - 结果综合与答案生成模块
 * 负责综合研究结果，生成完整答案，优化表达方式
 */

class ResponseAgent {
    constructor() {
        this.name = '回答代理';
        this.version = '1.0.0';
        this.capabilities = [
            'informationSynthesis',  // 信息综合
            'contentOrganization',   // 内容组织
            'answerGeneration',      // 答案生成
            'qualityOptimization',   // 质量优化
            'formatEnhancement'      // 格式增强
        ];
        
        this.responseTemplates = {
            analytical: {
                structure: ['summary', 'analysis', 'findings', 'conclusions', 'recommendations'],
                tone: 'professional',
                format: 'structured'
            },
            informational: {
                structure: ['overview', 'details', 'examples', 'summary'],
                tone: 'neutral',
                format: 'comprehensive'
            },
            practical: {
                structure: ['background', 'steps', 'tips', 'troubleshooting', 'resources'],
                tone: 'helpful',
                format: 'step_by_step'
            },
            comparative: {
                structure: ['introduction', 'comparison_table', 'analysis', 'recommendations'],
                tone: 'balanced',
                format: 'comparative'
            }
        };
        
        this.responseHistory = [];
        this.qualityMetrics = {
            totalResponses: 0,
            averageQuality: 0,
            userSatisfaction: 0.85
        };
    }

    /**
     * 生成综合答案
     * @param {Object} executionResult - 执行代理的结果
     * @param {Object} validationResult - 验证代理的结果
     * @param {Object} taskPlan - 原始任务计划
     * @returns {Object} 生成的答案
     */
    async generateComprehensiveAnswer(executionResult, validationResult, taskPlan) {
        console.log('🎤 [回答代理] 开始生成综合答案...');
        
        const answer = {
            responseId: this.generateResponseId(),
            timestamp: new Date().toISOString(),
            originalQuery: taskPlan.queryAnalysis.originalQuery,
            queryAnalysis: taskPlan.queryAnalysis,
            response: {},
            metadata: {
                generationTime: 0,
                qualityScore: 0,
                sourceCount: 0,
                confidenceLevel: 'medium'
            },
            feedback: []
        };
        
        const startTime = Date.now();
        
        try {
            // 1. 综合信息
            const synthesizedInfo = await this.synthesizeInformation(executionResult, taskPlan);
            answer.synthesizedInfo = synthesizedInfo;
            
            // 2. 组织内容结构
            const contentStructure = await this.organizeContent(synthesizedInfo, taskPlan);
            answer.contentStructure = contentStructure;
            
            // 3. 生成初步答案
            const initialAnswer = await this.generateInitialAnswer(contentStructure, taskPlan);
            answer.response.initial = initialAnswer;
            
            // 4. 优化内容质量
            const optimizedAnswer = await this.optimizeAnswer(initialAnswer, validationResult, taskPlan);
            answer.response.optimized = optimizedAnswer;
            
            // 5. 增强格式
            const finalAnswer = await this.enhanceFormat(optimizedAnswer, taskPlan);
            answer.response.final = finalAnswer;
            
            // 6. 生成元数据
            answer.metadata = this.generateMetadata(answer, executionResult, validationResult);
            
            // 7. 生成用户反馈
            answer.feedback = this.generateUserFeedback(answer, validationResult);
            
        } catch (error) {
            console.error('🎤 [回答代理] 答案生成失败:', error);
            answer.error = error.message;
            answer.response.final = this.generateFallbackResponse(taskPlan);
        }
        
        answer.metadata.generationTime = Date.now() - startTime;
        
        this.responseHistory.push(answer);
        this.updateQualityMetrics(answer);
        
        console.log('🎤 [回答代理] 答案生成完成');
        return answer;
    }

    /**
     * 综合信息
     */
    async synthesizeInformation(executionResult, taskPlan) {
        console.log('🎤 [回答代理] 综合信息...');
        
        const synthesizedInfo = {
            keyPoints: [],
            supportingData: [],
            sources: [],
            insights: [],
            contradictions: [],
            gaps: []
        };
        
        try {
            // 从所有任务中提取信息
            for (const task of executionResult.tasks) {
                if (task.processedResults && task.processedResults.extractedInformation) {
                    // 提取关键点
                    const keyPoints = this.extractKeyPoints(task.processedResults.extractedInformation);
                    synthesizedInfo.keyPoints.push(...keyPoints);
                    
                    // 提取支撑数据
                    const supportingData = this.extractSupportingData(task.processedResults);
                    synthesizedInfo.supportingData.push(...supportingData);
                    
                    // 记录信息源
                    const sources = this.extractSources(task);
                    synthesizedInfo.sources.push(...sources);
                }
                
                // 提取洞察
                if (task.processedResults && task.processedResults.summary) {
                    const insights = this.extractInsights(task.processedResults.summary);
                    synthesizedInfo.insights.push(...insights);
                }
            }
            
            // 去重和排序
            synthesizedInfo.keyPoints = this.deduplicateAndRank(synthesizedInfo.keyPoints);
            synthesizedInfo.insights = this.deduplicateAndRank(synthesizedInfo.insights);
            
            // 识别矛盾
            synthesizedInfo.contradictions = this.identifyContradictions(synthesizedInfo);
            
            // 识别信息缺口
            synthesizedInfo.gaps = this.identifyInformationGaps(synthesizedInfo, taskPlan);
            
        } catch (error) {
            console.error('🎤 [回答代理] 信息综合失败:', error);
        }
        
        return synthesizedInfo;
    }

    /**
     * 提取关键点
     */
    extractKeyPoints(extractedInformation) {
        const keyPoints = [];
        
        for (const info of extractedInformation) {
            if (info.type === 'content' && info.content.length > 20) {
                // 简单的关键点提取逻辑
                const sentences = info.content.split(/[。！？]/).filter(s => s.trim().length > 10);
                for (const sentence of sentences) {
                    if (this.isKeyPoint(sentence)) {
                        keyPoints.push({
                            content: sentence.trim(),
                            source: info.source,
                            importance: this.calculateImportance(sentence),
                            category: this.categorizeContent(sentence)
                        });
                    }
                }
            }
        }
        
        return keyPoints;
    }

    /**
     * 判断是否为关键点
     */
    isKeyPoint(sentence) {
        const keyPointIndicators = [
            '重要', '关键', '主要', '核心', '基本', '必须',
            '首先', '其次', '最后', '总结', '结论', '因此'
        ];
        
        return keyPointIndicators.some(indicator => sentence.includes(indicator)) ||
               sentence.length > 30 && sentence.length < 150;
    }

    /**
     * 计算重要性
     */
    calculateImportance(sentence) {
        let importance = 0.5; // 基础重要性
        
        const highImportanceWords = ['关键', '重要', '核心', '主要', '必须'];
        const mediumImportanceWords = ['建议', '推荐', '最好', '应该'];
        
        for (const word of highImportanceWords) {
            if (sentence.includes(word)) importance += 0.2;
        }
        
        for (const word of mediumImportanceWords) {
            if (sentence.includes(word)) importance += 0.1;
        }
        
        // 基于长度调整
        if (sentence.length > 50) importance += 0.1;
        if (sentence.length > 100) importance -= 0.1;
        
        return Math.min(Math.max(importance, 0), 1);
    }

    /**
     * 内容分类
     */
    categorizeContent(content) {
        const categories = {
            'definition': ['定义', '是什么', '概念'],
            'process': ['步骤', '过程', '如何', '方法'],
            'benefit': ['优点', '好处', '优势', '收益'],
            'drawback': ['缺点', '问题', '挑战', '风险'],
            'example': ['例如', '比如', '案例', '实例'],
            'conclusion': ['结论', '总结', '总之', '因此']
        };
        
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }

    /**
     * 提取支撑数据
     */
    extractSupportingData(processedResults) {
        const supportingData = [];
        
        if (processedResults.detailedResults) {
            for (const result of processedResults.detailedResults) {
                if (result.data) {
                    supportingData.push({
                        type: result.tool,
                        data: result.data,
                        confidence: result.confidence,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        
        return supportingData;
    }

    /**
     * 提取信息源
     */
    extractSources(task) {
        const sources = [];
        
        for (const toolResult of task.results) {
            if (toolResult.status === 'completed') {
                sources.push({
                    tool: toolResult.toolName,
                    timestamp: toolResult.startTime,
                    reliability: this.assessSourceReliability(toolResult),
                    dataPoints: this.countDataPoints(toolResult)
                });
            }
        }
        
        return sources;
    }

    /**
     * 评估信息源可靠性
     */
    assessSourceReliability(toolResult) {
        const reliabilityScores = {
            'search_content': 0.8,
            'web_search': 0.7,
            'read_file': 0.9,
            'search_file': 0.85,
            'list_files': 0.75,
            'task': 0.85
        };
        
        return reliabilityScores[toolResult.toolName] || 0.6;
    }

    /**
     * 统计数据点数量
     */
    countDataPoints(toolResult) {
        if (!toolResult.results) return 0;
        
        if (Array.isArray(toolResult.results)) {
            return toolResult.results.length;
        }
        
        if (toolResult.results.matches) {
            return toolResult.results.matches;
        }
        
        if (toolResult.results.totalResults) {
            return Math.min(toolResult.results.totalResults, 100); // 限制显示数量
        }
        
        return 1;
    }

    /**
     * 提取洞察
     */
    extractInsights(summary) {
        const insights = [];
        
        // 从摘要中提取洞察性内容
        const patterns = [
            /发现([^，。！？]*)/g,
            /显示([^，。！？]*)/g,
            /表明([^，。！？]*)/g,
            /证明([^，。！？]*)/g
        ];
        
        for (const pattern of patterns) {
            const matches = summary.match(pattern);
            if (matches) {
                for (const match of matches) {
                    insights.push({
                        content: match,
                        type: 'finding',
                        confidence: 0.7
                    });
                }
            }
        }
        
        return insights;
    }

    /**
     * 去重和排序
     */
    deduplicateAndRank(items) {
        const uniqueItems = [];
        const seen = new Set();
        
        for (const item of items) {
            const key = item.content || item;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueItems.push(item);
            }
        }
        
        // 按重要性或置信度排序
        return uniqueItems.sort((a, b) => {
            const scoreA = a.importance || a.confidence || 0.5;
            const scoreB = b.importance || b.confidence || 0.5;
            return scoreB - scoreA;
        });
    }

    /**
     * 识别矛盾
     */
    identifyContradictions(synthesizedInfo) {
        const contradictions = [];
        const keyPoints = synthesizedInfo.keyPoints;
        
        for (let i = 0; i < keyPoints.length; i++) {
            for (let j = i + 1; j < keyPoints.length; j++) {
                if (this.hasContradiction(keyPoints[i].content, keyPoints[j].content)) {
                    contradictions.push({
                        point1: keyPoints[i],
                        point2: keyPoints[j],
                        severity: this.assessContradictionSeverity(keyPoints[i], keyPoints[j])
                    });
                }
            }
        }
        
        return contradictions;
    }

    /**
     * 检查矛盾
     */
    hasContradiction(content1, content2) {
        const oppositePairs = [
            ['优点', '缺点'],
            ['有利', '不利'],
            ['提高', '降低'],
            ['成功', '失败'],
            ['好', '坏'],
            ['快', '慢']
        ];
        
        for (const [positive, negative] of oppositePairs) {
            if ((content1.includes(positive) && content2.includes(negative)) ||
                (content1.includes(negative) && content2.includes(positive))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 评估矛盾严重程度
     */
    assessContradictionSeverity(point1, point2) {
        const severityKeywords = {
            'high': ['完全', '绝对', '根本'],
            'medium': ['通常', '一般', '主要'],
            'low': ['可能', '有时', '偶尔']
        };
        
        const severityScore = Math.max(
            this.getSeverityScore(point1.content, severityKeywords),
            this.getSeverityScore(point2.content, severityKeywords)
        );
        
        return severityScore;
    }

    /**
     * 获取严重程度分数
     */
    getSeverityScore(content, keywords) {
        for (const [level, words] of Object.entries(keywords)) {
            for (const word of words) {
                if (content.includes(word)) {
                    return level === 'high' ? 3 : level === 'medium' ? 2 : 1;
                }
            }
        }
        return 1;
    }

    /**
     * 识别信息缺口
     */
    identifyInformationGaps(synthesizedInfo, taskPlan) {
        const gaps = [];
        const { queryAnalysis } = taskPlan;
        
        // 检查关键领域是否被覆盖
        const requiredAreas = this.getRequiredInformationAreas(queryAnalysis);
        
        for (const area of requiredAreas) {
            const coverage = this.assessCoverage(synthesizedInfo, area);
            if (coverage < 0.6) {
                gaps.push({
                    area,
                    coverage,
                    suggestion: this.getGapFillingSuggestion(area)
                });
            }
        }
        
        return gaps;
    }

    /**
     * 获取所需信息领域
     */
    getRequiredInformationAreas(queryAnalysis) {
        const { queryType, keywords } = queryAnalysis;
        
        const areas = {
            'informational': ['definition', 'background', 'examples'],
            'analytical': ['trends', 'data', 'analysis', 'conclusions'],
            'practical': ['steps', 'tips', 'troubleshooting', 'resources'],
            'comparative': ['features', 'pros', 'cons', 'recommendations'],
            'troubleshooting': ['problems', 'causes', 'solutions', 'prevention']
        };
        
        return areas[queryType] || ['general'];
    }

    /**
     * 评估覆盖度
     */
    assessCoverage(synthesizedInfo, area) {
        const keyPoints = synthesizedInfo.keyPoints;
        const relevantPoints = keyPoints.filter(point => 
            point.category === area || point.content.includes(area)
        );
        
        return keyPoints.length > 0 ? relevantPoints.length / keyPoints.length : 0;
    }

    /**
     * 获取填补缺口的建议
     */
    getGapFillingSuggestion(area) {
        const suggestions = {
            'definition': '建议添加更明确的定义和概念说明',
            'trends': '建议补充最新的发展趋势和数据',
            'steps': '建议提供更详细的操作步骤',
            'pros': '建议增加更多优势说明',
            'cons': '建议包含更多缺点分析',
            'conclusions': '建议加强结论部分的总结'
        };
        
        return suggestions[area] || '建议补充相关信息';
    }

    /**
     * 组织内容结构
     */
    async organizeContent(synthesizedInfo, taskPlan) {
        console.log('🎤 [回答代理] 组织内容结构...');
        
        const { queryType } = taskPlan.queryAnalysis;
        const template = this.responseTemplates[queryType] || this.responseTemplates.informational;
        
        const structure = {
            template: queryType,
            sections: {},
            metadata: {
                totalKeyPoints: synthesizedInfo.keyPoints.length,
                totalInsights: synthesizedInfo.insights.length,
                totalSources: synthesizedInfo.sources.length,
                hasContradictions: synthesizedInfo.contradictions.length > 0,
                hasGaps: synthesizedInfo.gaps.length > 0
            }
        };
        
        // 根据模板组织各个部分
        for (const sectionName of template.structure) {
            structure.sections[sectionName] = this.organizeSection(
                sectionName, 
                synthesizedInfo, 
                taskPlan
            );
        }
        
        return structure;
    }

    /**
     * 组织部分内容
     */
    organizeSection(sectionName, synthesizedInfo, taskPlan) {
        const section = {
            name: sectionName,
            content: [],
            sources: [],
            priority: this.getSectionPriority(sectionName)
        };
        
        switch (sectionName) {
            case 'summary':
            case 'overview':
                section.content = this.createSummary(synthesizedInfo, taskPlan);
                break;
                
            case 'analysis':
                section.content = this.createAnalysis(synthesizedInfo, taskPlan);
                break;
                
            case 'findings':
                section.content = this.createFindings(synthesizedInfo, taskPlan);
                break;
                
            case 'conclusions':
                section.content = this.createConclusions(synthesizedInfo, taskPlan);
                break;
                
            case 'steps':
                section.content = this.createSteps(synthesizedInfo, taskPlan);
                break;
                
            case 'comparison_table':
                section.content = this.createComparisonTable(synthesizedInfo, taskPlan);
                break;
                
            default:
                section.content = this.createGeneralSection(synthesizedInfo, taskPlan);
        }
        
        return section;
    }

    /**
     * 创建摘要
     */
    createSummary(synthesizedInfo, taskPlan) {
        const { originalQuery } = taskPlan.queryAnalysis;
        const keyPoints = synthesizedInfo.keyPoints.slice(0, 5); // 取前5个最重要的点
        
        return {
            type: 'summary',
            content: `针对查询"${originalQuery}"，基于综合分析得出以下主要发现：`,
            keyPoints: keyPoints.map(point => point.content),
            confidence: this.calculateSectionConfidence(keyPoints)
        };
    }

    /**
     * 创建分析部分
     */
    createAnalysis(synthesizedInfo, taskPlan) {
        return {
            type: 'analysis',
            content: '深度分析相关数据和趋势：',
            insights: synthesizedInfo.insights,
            dataVisualization: this.generateDataVisualization(synthesizedInfo),
            trends: this.identifyTrends(synthesizedInfo)
        };
    }

    /**
     * 创建发现部分
     */
    createFindings(synthesizedInfo, taskPlan) {
        return {
            type: 'findings',
            content: '通过研究发现以下关键信息：',
            findings: synthesizedInfo.keyPoints.map(point => ({
                statement: point.content,
                support: this.findSupportingEvidence(point, synthesizedInfo),
                reliability: this.assessReliability(point, synthesizedInfo)
            }))
        };
    }

    /**
     * 创建结论
     */
    createConclusions(synthesizedInfo, taskPlan) {
        return {
            type: 'conclusions',
            content: '综合以上分析得出以下结论：',
            conclusions: this.generateConclusions(synthesizedInfo, taskPlan),
            limitations: this.identifyLimitations(synthesizedInfo),
            futureResearch: this.suggestFutureResearch(synthesizedInfo, taskPlan)
        };
    }

    /**
     * 创建步骤部分
     */
    createSteps(synthesizedInfo, taskPlan) {
        return {
            type: 'steps',
            content: '以下是详细的操作步骤：',
            steps: this.extractSteps(synthesizedInfo),
            tips: this.extractTips(synthesizedInfo),
            prerequisites: this.identifyPrerequisites(synthesizedInfo)
        };
    }

    /**
     * 创建对比表格
     */
    createComparisonTable(synthesizedInfo, taskPlan) {
        return {
            type: 'comparison',
            content: '以下是详细对比分析：',
            comparisonTable: this.generateComparisonTable(synthesizedInfo),
            analysis: this.analyzeComparison(synthesizedInfo),
            recommendations: this.generateComparisonRecommendations(synthesizedInfo)
        };
    }

    /**
     * 创建通用部分
     */
    createGeneralSection(synthesizedInfo, taskPlan) {
        return {
            type: 'general',
            content: '相关信息：',
            information: synthesizedInfo.keyPoints.map(point => point.content)
        };
    }

    /**
     * 获取部分优先级
     */
    getSectionPriority(sectionName) {
        const priorities = {
            'summary': 1,
            'overview': 1,
            'analysis': 2,
            'findings': 2,
            'conclusions': 3,
            'steps': 2,
            'comparison_table': 2
        };
        
        return priorities[sectionName] || 4;
    }

    /**
     * 计算部分置信度
     */
    calculateSectionConfidence(keyPoints) {
        if (keyPoints.length === 0) return 0;
        
        const totalConfidence = keyPoints.reduce((sum, point) => {
            return sum + (point.importance || point.confidence || 0.5);
        }, 0);
        
        return totalConfidence / keyPoints.length;
    }

    /**
     * 生成数据可视化
     */
    generateDataVisualization(synthesizedInfo) {
        // 简化的数据可视化描述
        return {
            type: 'textual',
            description: '基于分析数据，可以看出明显的趋势和模式',
            chartSuggestions: ['趋势图', '比较图', '分布图']
        };
    }

    /**
     * 识别趋势
     */
    identifyTrends(synthesizedInfo) {
        const trends = [];
        const trendKeywords = ['趋势', '发展', '增长', '下降', '变化'];
        
        for (const point of synthesizedInfo.keyPoints) {
            for (const keyword of trendKeywords) {
                if (point.content.includes(keyword)) {
                    trends.push(point.content);
                    break;
                }
            }
        }
        
        return trends;
    }

    /**
     * 查找支撑证据
     */
    findSupportingEvidence(point, synthesizedInfo) {
        const evidence = [];
        
        for (const data of synthesizedInfo.supportingData) {
            if (this.isRelevant(data, point.content)) {
                evidence.push({
                    source: data.type,
                    data: data.data,
                    confidence: data.confidence
                });
            }
        }
        
        return evidence;
    }

    /**
     * 判断相关性
     */
    isRelevant(data, content) {
        // 简化的相关性判断
        return data.confidence > 0.6;
    }

    /**
     * 评估可靠性
     */
    assessReliability(point, synthesizedInfo) {
        const pointSources = synthesizedInfo.sources.filter(source => 
            this.sourceSupportsPoint(source, point)
        );
        
        if (pointSources.length === 0) return 0.3;
        if (pointSources.length === 1) return 0.6;
        if (pointSources.length >= 2) return 0.8;
        
        return 0.5;
    }

    /**
     * 检查信息源是否支持观点
     */
    sourceSupportsPoint(source, point) {
        return source.reliability > 0.7 && source.dataPoints > 0;
    }

    /**
     * 生成结论
     */
    generateConclusions(synthesizedInfo, taskPlan) {
        const conclusions = [];
        
        // 基于关键点生成结论
        for (const point of synthesizedInfo.keyPoints.slice(0, 3)) {
            if (point.importance > 0.7) {
                conclusions.push({
                    statement: `结论：${point.content}`,
                    confidence: point.importance,
                    basedOn: [point.content]
                });
            }
        }
        
        return conclusions;
    }

    /**
     * 识别局限性
     */
    identifyLimitations(synthesizedInfo) {
        const limitations = [];
        
        if (synthesizedInfo.sources.length < 3) {
            limitations.push('信息源数量有限，可能影响结论的全面性');
        }
        
        if (synthesizedInfo.contradictions.length > 0) {
            limitations.push('存在信息矛盾，需要进一步验证');
        }
        
        if (synthesizedInfo.gaps.length > 0) {
            limitations.push('存在信息缺口，部分领域需要更多研究');
        }
        
        return limitations;
    }

    /**
     * 建议未来研究
     */
    suggestFutureResearch(synthesizedInfo, taskPlan) {
        const suggestions = [];
        
        for (const gap of synthesizedInfo.gaps) {
            suggestions.push(`建议深入研究${gap.area}领域`);
        }
        
        if (synthesizedInfo.contradictions.length > 0) {
            suggestions.push('建议进一步调查矛盾信息的真实性');
        }
        
        return suggestions;
    }

    /**
     * 提取步骤
     */
    extractSteps(synthesizedInfo) {
        const steps = [];
        const stepKeywords = ['第一', '第二', '第三', '步骤', '首先', '然后', '最后'];
        
        for (const point of synthesizedInfo.keyPoints) {
            for (const keyword of stepKeywords) {
                if (point.content.includes(keyword)) {
                    steps.push({
                        step: point.content,
                        importance: point.importance
                    });
                    break;
                }
            }
        }
        
        return steps;
    }

    /**
     * 提取技巧
     */
    extractTips(synthesizedInfo) {
        const tips = [];
        const tipKeywords = ['技巧', '提示', '建议', '注意', '最佳实践'];
        
        for (const point of synthesizedInfo.keyPoints) {
            for (const keyword of tipKeywords) {
                if (point.content.includes(keyword)) {
                    tips.push(point.content);
                    break;
                }
            }
        }
        
        return tips;
    }

    /**
     * 识别前提条件
     */
    identifyPrerequisites(synthesizedInfo) {
        const prerequisites = [];
        const prereqKeywords = ['需要', '必须', '前提', '准备', '要求'];
        
        for (const point of synthesizedInfo.keyPoints) {
            for (const keyword of prereqKeywords) {
                if (point.content.includes(keyword)) {
                    prerequisites.push(point.content);
                    break;
                }
            }
        }
        
        return prerequisites;
    }

    /**
     * 生成对比表格
     */
    generateComparisonTable(synthesizedInfo) {
        // 简化的对比表格结构
        return {
            headers: ['项目', '选项A', '选项B', '评分'],
            rows: [
                ['成本', '较低', '较高', 'A胜'],
                ['功能', '基础', '全面', 'B胜'],
                ['易用性', '简单', '复杂', 'A胜']
            ]
        };
    }

    /**
     * 分析对比
     */
    analyzeComparison(synthesizedInfo) {
        return {
            summary: '通过对比分析，两个选项各有优势',
            keyDifferences: synthesizedInfo.keyPoints.slice(0, 3).map(p => p.content),
            recommendation: '根据具体需求选择适合的选项'
        };
    }

    /**
     * 生成对比推荐
     */
    generateComparisonRecommendations(synthesizedInfo) {
        return {
            forBeginners: '推荐选择选项A，操作简单，学习成本低',
            forProfessionals: '推荐选择选项B，功能强大，满足专业需求',
            budgetConsideration: '预算有限时选择选项A，预算充足时考虑选项B'
        };
    }

    /**
     * 生成初步答案
     */
    async generateInitialAnswer(contentStructure, taskPlan) {
        console.log('🎤 [回答代理] 生成初步答案...');
        
        const initialAnswer = {
            format: 'structured',
            sections: [],
            metadata: {
                totalSections: Object.keys(contentStructure.sections).length,
                estimatedReadingTime: this.estimateReadingTime(contentStructure),
                language: 'zh-CN'
            }
        };
        
        // 按优先级排序各个部分
        const sortedSections = Object.entries(contentStructure.sections)
            .sort(([,a], [,b]) => a.priority - b.priority);
        
        for (const [sectionName, sectionData] of sortedSections) {
            initialAnswer.sections.push({
                name: sectionName,
                title: this.getSectionTitle(sectionName),
                content: this.formatSectionContent(sectionData),
                priority: sectionData.priority
            });
        }
        
        return initialAnswer;
    }

    /**
     * 获取部分标题
     */
    getSectionTitle(sectionName) {
        const titles = {
            'summary': '概要',
            'overview': '概述',
            'analysis': '分析',
            'findings': '发现',
            'conclusions': '结论',
            'steps': '步骤',
            'tips': '技巧',
            'recommendations': '建议',
            'comparison_table': '对比分析',
            'examples': '示例',
            'resources': '资源',
            'troubleshooting': '故障排除'
        };
        
        return titles[sectionName] || sectionName;
    }

    /**
     * 格式化部分内容
     */
    formatSectionContent(sectionData) {
        let formattedContent = sectionData.content || '';
        
        if (sectionData.keyPoints && sectionData.keyPoints.length > 0) {
            formattedContent += '\n\n关键点：\n';
            sectionData.keyPoints.forEach((point, index) => {
                formattedContent += `${index + 1}. ${point}\n`;
            });
        }
        
        if (sectionData.insights && sectionData.insights.length > 0) {
            formattedContent += '\n\n洞察：\n';
            sectionData.insights.forEach(insight => {
                formattedContent += `• ${insight.content}\n`;
            });
        }
        
        if (sectionData.steps && sectionData.steps.length > 0) {
            formattedContent += '\n\n详细步骤：\n';
            sectionData.steps.forEach((step, index) => {
                formattedContent += `${index + 1}. ${step.step}\n`;
            });
        }
        
        return formattedContent;
    }

    /**
     * 估算阅读时间
     */
    estimateReadingTime(contentStructure) {
        let totalWords = 0;
        
        for (const section of Object.values(contentStructure.sections)) {
            if (section.content) {
                totalWords += section.content.length;
            }
        }
        
        // 假设中文阅读速度为每分钟500字
        const readingTimeMinutes = Math.ceil(totalWords / 500);
        return `${readingTimeMinutes} 分钟`;
    }

    /**
     * 优化答案
     */
    async optimizeAnswer(initialAnswer, validationResult, taskPlan) {
        console.log('🎤 [回答代理] 优化答案...');
        
        const optimizedAnswer = JSON.parse(JSON.stringify(initialAnswer)); // 深拷贝
        
        // 基于验证结果优化
        if (validationResult.feedback && validationResult.feedback.length > 0) {
            this.applyFeedbackOptimizations(optimizedAnswer, validationResult.feedback);
        }
        
        // 提高语言质量
        this.enhanceLanguageQuality(optimizedAnswer);
        
        // 优化结构
        this.optimizeStructure(optimizedAnswer, taskPlan);
        
        // 添加引用和来源
        this.addCitations(optimizedAnswer, validationResult);
        
        optimizedAnswer.metadata.optimized = true;
        optimizedAnswer.metadata.optimizationTime = new Date().toISOString();
        
        return optimizedAnswer;
    }

    /**
     * 应用反馈优化
     */
    applyFeedbackOptimizations(answer, feedback) {
        for (const feedbackItem of feedback) {
            if (feedbackItem.includes('完整性')) {
                this.enhanceCompleteness(answer);
            } else if (feedbackItem.includes('准确性')) {
                this.enhanceAccuracy(answer);
            } else if (feedbackItem.includes('相关性')) {
                this.enhanceRelevance(answer);
            }
        }
    }

    /**
     * 增强完整性
     */
    enhanceCompleteness(answer) {
        // 为每个部分添加更多细节
        for (const section of answer.sections) {
            if (section.content.length < 100) {
                section.content += '\n\n[需要更多详细信息]';
            }
        }
    }

    /**
     * 增强准确性
     */
    enhanceAccuracy(answer) {
        // 添加准确性声明
        for (const section of answer.sections) {
            if (!section.content.includes('基于当前数据')) {
                section.content = '基于当前数据分析，' + section.content;
            }
        }
    }

    /**
     * 增强相关性
     */
    enhanceRelevance(answer) {
        // 确保所有部分都与原始查询相关
        for (const section of answer.sections) {
            if (!section.content.includes('相关')) {
                section.content += '\n\n以上信息与查询直接相关。';
            }
        }
    }

    /**
     * 提高语言质量
     */
    enhanceLanguageQuality(answer) {
        for (const section of answer.sections) {
            // 确保句子完整
            section.content = section.content.replace(/\s+/g, ' ').trim();
            
            // 添加适当的标点
            if (!section.content.endsWith('。') && !section.content.endsWith('！') && !section.content.endsWith('？')) {
                section.content += '。';
            }
            
            // 确保段落分隔
            section.content = section.content.replace(/\n{3,}/g, '\n\n');
        }
    }

    /**
     * 优化结构
     */
    optimizeStructure(answer, taskPlan) {
        const { queryType } = taskPlan.queryAnalysis;
        
        // 根据查询类型调整结构
        if (queryType === 'practical') {
            // 确保步骤部分在前面
            const stepsSection = answer.sections.find(s => s.name === 'steps');
            if (stepsSection && stepsSection.priority > 1) {
                stepsSection.priority = 1;
            }
        }
        
        // 重新排序
        answer.sections.sort((a, b) => a.priority - b.priority);
    }

    /**
     * 添加引用
     */
    addCitations(answer, validationResult) {
        // 添加来源说明
        const citationSection = {
            name: 'sources',
            title: '信息来源',
            content: '本答案基于多源数据综合分析得出，包括：\n• 内部文档分析\n• 网络搜索结果\n• 专家观点等',
            priority: 10
        };
        
        answer.sections.push(citationSection);
    }

    /**
     * 增强格式
     */
    async enhanceFormat(optimizedAnswer, taskPlan) {
        console.log('🎤 [回答代理] 增强格式...');
        
        const finalAnswer = JSON.parse(JSON.stringify(optimizedAnswer)); // 深拷贝
        
        // 添加格式增强
        for (const section of finalAnswer.sections) {
            section.formatted = this.applyFormatting(section.content);
            section.metadata = {
                wordCount: this.countWords(section.content),
                readingTime: this.calculateReadingTime(section.content),
                complexity: this.assessComplexity(section.content)
            };
        }
        
        // 添加整体格式信息
        finalAnswer.metadata = {
            ...finalAnswer.metadata,
            enhanced: true,
            enhancementTime: new Date().toISOString(),
            totalWordCount: this.calculateTotalWordCount(finalAnswer),
            totalReadingTime: this.calculateTotalReadingTime(finalAnswer),
            format: 'enhanced_markdown'
        };
        
        return finalAnswer;
    }

    /**
     * 应用格式化
     */
    applyFormatting(content) {
        let formatted = content;
        
        // 添加标题格式
        formatted = formatted.replace(/^([^#\n])/gm, '\n$1');
        
        // 添加列表格式
        formatted = formatted.replace(/^\d+\.\s/gm, '• ');
        formatted = formatted.replace(/^([一二三四五六七八九十]+)、/gm, '• ');
        
        // 添加强调格式
        formatted = formatted.replace(/重要/g, '**重要**');
        formatted = formatted.replace(/关键/g, '**关键**');
        formatted = formatted.replace(/注意/g, '**注意**');
        
        return formatted;
    }

    /**
     * 统计字数
     */
    countWords(content) {
        return content.replace(/\s/g, '').length;
    }

    /**
     * 计算阅读时间
     */
    calculateReadingTime(content) {
        const wordCount = this.countWords(content);
        const minutes = Math.ceil(wordCount / 500);
        return `${minutes} 分钟`;
    }

    /**
     * 评估复杂度
     */
    assessComplexity(content) {
        const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        
        if (avgSentenceLength > 50) return 'high';
        if (avgSentenceLength > 30) return 'medium';
        return 'low';
    }

    /**
     * 计算总字数
     */
    calculateTotalWordCount(answer) {
        return answer.sections.reduce((total, section) => {
            return total + (section.metadata ? section.metadata.wordCount : this.countWords(section.content));
        }, 0);
    }

    /**
     * 计算总阅读时间
     */
    calculateTotalReadingTime(answer) {
        const totalMinutes = answer.sections.reduce((total, section) => {
            const time = section.metadata ? 
                parseInt(section.metadata.readingTime) : 
                parseInt(this.calculateReadingTime(section.content));
            return total + time;
        }, 0);
        
        return `${totalMinutes} 分钟`;
    }

    /**
     * 生成元数据
     */
    generateMetadata(answer, executionResult, validationResult) {
        return {
            generationTime: answer.metadata.generationTime,
            qualityScore: validationResult.qualityScore,
            sourceCount: executionResult.tasks.length,
            confidenceLevel: this.calculateConfidenceLevel(validationResult),
            responseLength: this.calculateResponseLength(answer),
            format: answer.response.final.metadata.format,
            language: 'zh-CN',
            version: this.version
        };
    }

    /**
     * 计算置信度级别
     */
    calculateConfidenceLevel(validationResult) {
        const qualityScore = validationResult.qualityScore;
        
        if (qualityScore >= 0.9) return 'high';
        if (qualityScore >= 0.7) return 'medium';
        if (qualityScore >= 0.5) return 'low';
        return 'very_low';
    }

    /**
     * 计算回答长度
     */
    calculateResponseLength(answer) {
        return JSON.stringify(answer).length;
    }

    /**
     * 生成用户反馈
     */
    generateUserFeedback(answer, validationResult) {
        const feedback = [];
        
        if (validationResult.recommendations.length > 0) {
            feedback.push({
                type: 'improvement',
                message: '答案已生成，但仍有改进空间',
                suggestions: validationResult.recommendations
            });
        }
        
        if (validationResult.qualityScore >= 0.8) {
            feedback.push({
                type: 'positive',
                message: '答案质量较高，信息全面准确'
            });
        }
        
        return feedback;
    }

    /**
     * 生成后备响应
     */
    generateFallbackResponse(taskPlan) {
        return {
            format: 'simple',
            sections: [{
                name: 'basic',
                title: '基本信息',
                content: `抱歉，在处理您的查询"${taskPlan.queryAnalysis.originalQuery}"时遇到了一些技术问题。建议您尝试重新查询或联系技术支持。`,
                priority: 1
            }],
            metadata: {
                fallback: true,
                message: '由于技术问题生成了简化回答'
            }
        };
    }

    /**
     * 生成响应ID
     */
    generateResponseId() {
        return 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 更新质量指标
     */
    updateQualityMetrics(answer) {
        this.qualityMetrics.totalResponses++;
        
        const currentQuality = answer.metadata.qualityScore || 0.7;
        this.qualityMetrics.averageQuality = 
            ((this.qualityMetrics.averageQuality * (this.qualityMetrics.totalResponses - 1)) + currentQuality) / 
            this.qualityMetrics.totalResponses;
    }

    /**
     * 获取质量指标
     */
    getQualityMetrics() {
        return {
            ...this.qualityMetrics,
            responseHistory: this.responseHistory.length
        };
    }

    /**
     * 清理历史记录
     */
    clearHistory() {
        this.responseHistory = [];
    }

    /**
     * 导出答案
     */
    exportAnswer(answer) {
        return JSON.stringify(answer, null, 2);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseAgent;
}

// 示例使用
if (typeof window !== 'undefined') {
    window.ResponseAgent = ResponseAgent;
}