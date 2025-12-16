/**
 * 执行代理 - 工具选择与执行模块
 * 负责选择合适工具，执行具体研究步骤，收集和分析数据
 */

class ExecutionAgent {
    constructor() {
        this.name = '执行代理';
        this.version = '1.0.0';
        this.capabilities = [
            'toolSelection',     // 工具选择
            'taskExecution',     // 任务执行
            'dataCollection',    // 数据收集
            'resultProcessing',  // 结果处理
            'errorHandling'      // 错误处理
        ];
        
        this.availableTools = {
            search_content: {
                name: '内容搜索',
                description: '在代码库中搜索特定内容和模式',
               适用场景: ['代码分析', '文本搜索', '模式匹配'],
                complexity: 'low'
            },
            search_file: {
                name: '文件搜索',
                description: '按文件名模式搜索文件',
                适用场景: ['文件定位', '项目结构分析', '资源查找'],
                complexity: 'low'
            },
            list_files: {
                name: '目录列表',
                description: '列出目录结构和文件',
                适用场景: ['项目结构分析', '文件组织', '导航'],
                complexity: 'low'
            },
            read_file: {
                name: '文件读取',
                description: '读取文件内容',
                适用场景: ['内容分析', '数据提取', '信息收集'],
                complexity: 'low'
            },
            web_search: {
                name: '网络搜索',
                description: '在互联网上搜索信息',
                适用场景: ['最新信息', '外部数据', '趋势分析'],
                complexity: 'medium'
            },
            task: {
                name: '子任务调用',
                description: '调用专门的子代理处理复杂任务',
                适用场景: ['代码探索', '大型项目分析', '复杂搜索'],
                complexity: 'high'
            }
        };
        
        this.executionHistory = [];
        this.currentTask = null;
    }

    /**
     * 执行任务计划
     * @param {Object} taskPlan - 规划代理生成的任务计划
     * @returns {Object} 执行结果
     */
    async executeTaskPlan(taskPlan) {
        console.log('⚙️ [执行代理] 开始执行任务计划...');
        
        const executionResult = {
            planId: taskPlan.planId,
            startTime: new Date().toISOString(),
            tasks: [],
            overallStatus: 'in_progress',
            totalDuration: 0,
            errors: [],
            warnings: []
        };
        
        try {
            // 按优先级和依赖关系执行任务
            const sortedTasks = this.sortTasksByPriority(taskPlan.tasks);
            
            for (const task of sortedTasks) {
                const taskResult = await this.executeSingleTask(task, taskPlan);
                executionResult.tasks.push(taskResult);
                
                if (taskResult.status === 'failed') {
                    executionResult.errors.push(`任务 ${task.name} 执行失败: ${taskResult.error}`);
                    // 根据错误策略决定是否继续
                    if (task.priority === 'high' && taskResult.critical) {
                        throw new Error(`关键任务失败: ${task.name}`);
                    }
                }
            }
            
            executionResult.overallStatus = executionResult.errors.length > 0 ? 'completed_with_errors' : 'completed';
            
        } catch (error) {
            executionResult.overallStatus = 'failed';
            executionResult.errors.push(`执行计划失败: ${error.message}`);
        }
        
        executionResult.endTime = new Date().toISOString();
        executionResult.totalDuration = this.calculateDuration(executionResult.startTime, executionResult.endTime);
        
        console.log('⚙️ [执行代理] 任务计划执行完成:', executionResult);
        return executionResult;
    }

    /**
     * 执行单个任务
     * @param {Object} task - 单个任务
     * @param {Object} context - 执行上下文
     * @returns {Object} 任务执行结果
     */
    async executeSingleTask(task, context) {
        console.log(`⚙️ [执行代理] 执行任务: ${task.name}`);
        
        const taskResult = {
            taskId: task.id,
            taskName: task.name,
            startTime: new Date().toISOString(),
            status: 'in_progress',
            selectedTools: [],
            results: [],
            errors: []
        };
        
        try {
            // 1. 选择合适的工具
            const selectedTools = this.selectTools(task, context);
            taskResult.selectedTools = selectedTools.map(t => t.name);
            
            // 2. 执行工具
            for (const tool of selectedTools) {
                const toolResult = await this.executeTool(tool, task, context);
                taskResult.results.push(toolResult);
                
                if (toolResult.status === 'failed') {
                    taskResult.errors.push(`工具 ${tool.name} 执行失败: ${toolResult.error}`);
                }
            }
            
            // 3. 处理结果
            const processedResults = this.processResults(taskResult.results, task);
            taskResult.processedResults = processedResults;
            
            // 4. 评估任务完成度
            const completionAssessment = this.assessTaskCompletion(task, processedResults);
            taskResult.completionAssessment = completionAssessment;
            
            taskResult.status = taskResult.errors.length > 0 ? 'completed_with_errors' : 'completed';
            
        } catch (error) {
            taskResult.status = 'failed';
            taskResult.errors.push(error.message);
        }
        
        taskResult.endTime = new Date().toISOString();
        taskResult.duration = this.calculateDuration(taskResult.startTime, taskResult.endTime);
        
        console.log(`⚙️ [执行代理] 任务 ${task.name} 执行完成:`, taskResult.status);
        return taskResult;
    }

    /**
     * 选择合适的工具
     * @param {Object} task - 任务信息
     * @param {Object} context - 执行上下文
     * @returns {Array} 选择的工具列表
     */
    selectTools(task, context) {
        const selectedTools = [];
        const queryAnalysis = context.queryAnalysis;
        
        // 基于任务类型和查询分析选择工具
        switch (task.id) {
            case 'info_collection':
                selectedTools.push(
                    this.availableTools.search_content,
                    this.availableTools.web_search
                );
                break;
                
            case 'trend_analysis':
                selectedTools.push(
                    this.availableTools.search_content,
                    this.availableTools.web_search,
                    this.availableTools.read_file
                );
                break;
                
            case 'comparison':
                selectedTools.push(
                    this.availableTools.search_content,
                    this.availableTools.list_files
                );
                break;
                
            case 'practical_guide':
                selectedTools.push(
                    this.availableTools.search_content,
                    this.availableTools.search_file
                );
                break;
                
            case 'verification':
                selectedTools.push(
                    this.availableTools.search_content,
                    this.availableTools.read_file
                );
                break;
                
            default:
                selectedTools.push(this.availableTools.search_content);
        }
        
        // 根据查询复杂度调整工具选择
        if (queryAnalysis.complexity === 'high') {
            selectedTools.push(this.availableTools.task);
        }
        
        return selectedTools;
    }

    /**
     * 执行具体工具
     * @param {Object} tool - 工具对象
     * @param {Object} task - 任务信息
     * @param {Object} context - 执行上下文
     * @returns {Object} 工具执行结果
     */
    async executeTool(tool, task, context) {
        console.log(`⚙️ [执行代理] 使用工具: ${tool.name}`);
        
        const toolResult = {
            toolName: tool.name,
            startTime: new Date().toISOString(),
            status: 'in_progress',
            parameters: {},
            results: null,
            error: null
        };
        
        try {
            // 构建工具参数
            const parameters = this.buildToolParameters(tool, task, context);
            toolResult.parameters = parameters;
            
            // 模拟工具执行 - 在实际环境中会调用真实的工具
            const results = await this.simulateToolExecution(tool, parameters);
            toolResult.results = results;
            toolResult.status = 'completed';
            
        } catch (error) {
            toolResult.status = 'failed';
            toolResult.error = error.message;
        }
        
        toolResult.endTime = new Date().toISOString();
        toolResult.duration = this.calculateDuration(toolResult.startTime, toolResult.endTime);
        
        return toolResult;
    }

    /**
     * 构建工具参数
     */
    buildToolParameters(tool, task, context) {
        const { queryAnalysis, originalQuery } = context;
        const parameters = {};
        
        switch (tool.name) {
            case 'search_content':
                parameters.pattern = this.buildSearchPattern(task, queryAnalysis);
                parameters.directory = this.getSearchDirectory(context);
                parameters.fileTypes = this.getTargetFileTypes(task, queryAnalysis);
                parameters.contextLines = 3;
                break;
                
            case 'search_file':
                parameters.pattern = this.buildFilePattern(task, queryAnalysis);
                parameters.targetDirectory = this.getSearchDirectory(context);
                parameters.recursive = true;
                parameters.caseSensitive = false;
                break;
                
            case 'web_search':
                parameters.searchTerm = this.buildWebSearchTerm(task, queryAnalysis);
                parameters.explanation = `为任务 ${task.name} 搜索相关信息`;
                break;
                
            case 'read_file':
                parameters.filePath = this.getTargetFilePath(task, context);
                break;
                
            case 'list_files':
                parameters.targetDirectory = this.getSearchDirectory(context);
                parameters.depth = 3;
                parameters.offset = 0;
                parameters.limit = 100;
                break;
        }
        
        return parameters;
    }

    /**
     * 构建搜索模式
     */
    buildSearchPattern(task, queryAnalysis) {
        const { keywords, queryType } = queryAnalysis;
        
        switch (task.id) {
            case 'info_collection':
                return keywords.join('|') || '.*';
                
            case 'trend_analysis':
                return `(trend|development|evolution|${keywords.join('|')})`;
                
            case 'comparison':
                return `(compare|contrast|difference|versus|${keywords.join('|')})`;
                
            case 'practical_guide':
                return `(step|guide|tutorial|how.*to|${keywords.join('|')})`;
                
            default:
                return keywords.join('|') || queryAnalysis.originalQuery.split(' ').join('|');
        }
    }

    /**
     * 构建网络搜索词
     */
    buildWebSearchTerm(task, queryAnalysis) {
        const { keywords, originalQuery } = queryAnalysis;
        const timeRange = this.getTimeRangeFilter(queryAnalysis);
        
        let searchTerm = keywords.join(' ') || originalQuery;
        
        if (task.id === 'trend_analysis') {
            searchTerm += ' trend development 2024';
        }
        
        if (timeRange) {
            searchTerm += ' ' + timeRange;
        }
        
        return searchTerm;
    }

    /**
     * 获取时间范围过滤器
     */
    getTimeRangeFilter(queryAnalysis) {
        const constraints = queryAnalysis.constraints || [];
        const timeConstraint = constraints.find(c => c.includes('时间范围'));
        
        if (timeConstraint) {
            return '2024';
        }
        
        return '2024'; // 默认搜索2024年的信息
    }

    /**
     * 获取目标文件类型
     */
    getTargetFileTypes(task, queryAnalysis) {
        const fileTypes = {
            'info_collection': '.md,.txt,.js,.html',
            'trend_analysis': '.md,.txt,.json,.csv',
            'comparison': '.md,.txt,.html,.js',
            'practical_guide': '.md,.txt,.js,.py',
            'verification': '.md,.txt,.js,.json'
        };
        
        return fileTypes[task.id] || '.md,.txt,.js';
    }

    /**
     * 模拟工具执行（在实际环境中会调用真实工具）
     */
    async simulateToolExecution(tool, parameters) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
        
        // 模拟不同的工具结果
        switch (tool.name) {
            case 'search_content':
                return this.simulateContentSearch(parameters);
                
            case 'search_file':
                return this.simulateFileSearch(parameters);
                
            case 'web_search':
                return this.simulateWebSearch(parameters);
                
            case 'read_file':
                return this.simulateFileRead(parameters);
                
            case 'list_files':
                return this.simulateFileList(parameters);
                
            default:
                return { message: '工具执行完成', data: null };
        }
    }

    /**
     * 模拟内容搜索结果
     */
    simulateContentSearch(parameters) {
        return {
            matches: Math.floor(Math.random() * 20) + 5,
            files: [
                'README.md',
                'docs/guide.md',
                'src/app.js',
                'config.json'
            ],
            preview: '找到相关内容...',
            confidence: 0.85
        };
    }

    /**
     * 模拟网络搜索结果
     */
    simulateWebSearch(parameters) {
        return {
            results: [
                {
                    title: '最新AI技术发展趋势',
                    url: 'https://example.com/ai-trends',
                    snippet: '2024年人工智能技术快速发展...'
                },
                {
                    title: '深度学习应用案例',
                    url: 'https://example.com/dl-cases',
                    snippet: '深度学习在各领域的实际应用...'
                }
            ],
            totalResults: Math.floor(Math.random() * 1000000) + 100000,
            searchTime: '0.5s'
        };
    }

    /**
     * 模拟文件搜索结果
     */
    simulateFileSearch(parameters) {
        return {
            files: [
                'app.js',
                'utils.js',
                'config.json',
                'data.json'
            ],
            totalFiles: Math.floor(Math.random() * 50) + 10
        };
    }

    /**
     * 模拟文件读取结果
     */
    simulateFileRead(parameters) {
        return {
            content: '这是文件内容的模拟结果...',
            size: Math.floor(Math.random() * 10000) + 100,
            lines: Math.floor(Math.random() * 200) + 50
        };
    }

    /**
     * 模拟文件列表结果
     */
    simulateFileList(parameters) {
        return {
            files: [
                { name: 'index.html', type: 'file', size: 2048 },
                { name: 'css', type: 'directory', size: 0 },
                { name: 'js', type: 'directory', size: 0 },
                { name: 'README.md', type: 'file', size: 1024 }
            ],
            total: Math.floor(Math.random() * 30) + 10
        };
    }

    /**
     * 处理工具结果
     */
    processResults(toolResults, task) {
        const processedData = {
            summary: '',
            detailedResults: [],
            extractedInformation: [],
            dataQuality: 'good',
            recommendations: []
        };
        
        // 合并所有工具结果
        for (const result of toolResults) {
            if (result.status === 'completed' && result.results) {
                processedData.detailedResults.push({
                    tool: result.toolName,
                    data: result.results,
                    confidence: this.calculateConfidence(result.results)
                });
                
                // 提取关键信息
                const extracted = this.extractKeyInformation(result.results, task);
                processedData.extractedInformation.push(...extracted);
            }
        }
        
        // 生成摘要
        processedData.summary = this.generateSummary(processedData.detailedResults, task);
        
        // 生成推荐
        processedData.recommendations = this.generateRecommendations(processedData, task);
        
        return processedData;
    }

    /**
     * 计算结果置信度
     */
    calculateConfidence(results) {
        if (!results) return 0;
        
        let confidence = 0.5; // 基础置信度
        
        if (results.matches) {
            confidence += Math.min(results.matches / 20, 0.3);
        }
        
        if (results.totalResults) {
            confidence += Math.min(results.totalResults / 100000, 0.2);
        }
        
        return Math.min(confidence, 0.95);
    }

    /**
     * 提取关键信息
     */
    extractKeyInformation(results, task) {
        const information = [];
        
        if (results.results && Array.isArray(results.results)) {
            for (const item of results.results) {
                if (item.title || item.name) {
                    information.push({
                        type: 'title',
                        content: item.title || item.name,
                        source: 'tool_result'
                    });
                }
                
                if (item.snippet || item.content) {
                    information.push({
                        type: 'content',
                        content: (item.snippet || item.content).substring(0, 100),
                        source: 'tool_result'
                    });
                }
            }
        }
        
        return information;
    }

    /**
     * 生成结果摘要
     */
    generateSummary(detailedResults, task) {
        const totalTools = detailedResults.length;
        const successfulTools = detailedResults.filter(r => r.confidence > 0.5).length;
        const avgConfidence = detailedResults.reduce((sum, r) => sum + r.confidence, 0) / totalTools;
        
        return `任务 ${task.name} 执行完成。使用了 ${totalTools} 个工具，${successfulTools} 个成功，平均置信度 ${(avgConfidence * 100).toFixed(1)}%。`;
    }

    /**
     * 生成推荐
     */
    generateRecommendations(processedData, task) {
        const recommendations = [];
        
        if (processedData.dataQuality === 'low') {
            recommendations.push('建议增加搜索范围或使用更多工具');
        }
        
        if (processedData.extractedInformation.length < 3) {
            recommendations.push('信息量较少，建议进一步收集数据');
        }
        
        const avgConfidence = processedData.detailedResults.reduce((sum, r) => sum + r.confidence, 0) / processedData.detailedResults.length;
        if (avgConfidence < 0.7) {
            recommendations.push('建议验证结果的准确性');
        }
        
        return recommendations;
    }

    /**
     * 评估任务完成度
     */
    assessTaskCompletion(task, processedResults) {
        const assessment = {
            completionRate: 0,
            qualityScore: 0,
            meetsRequirements: false,
            needsMoreWork: false,
            confidenceLevel: 'medium'
        };
        
        // 基于结果数量和质量评估完成度
        const infoCount = processedResults.extractedInformation.length;
        const avgConfidence = processedResults.detailedResults.length > 0 
            ? processedResults.detailedResults.reduce((sum, r) => sum + r.confidence, 0) / processedResults.detailedResults.length 
            : 0;
        
        assessment.completionRate = Math.min(infoCount / 5, 1.0); // 假设5个信息点为100%完成
        assessment.qualityScore = avgConfidence;
        
        // 判断是否满足要求
        assessment.meetsRequirements = assessment.completionRate >= 0.8 && assessment.qualityScore >= 0.7;
        assessment.needsMoreWork = !assessment.meetsRequirements;
        
        // 设置置信度级别
        if (assessment.qualityScore >= 0.8) {
            assessment.confidenceLevel = 'high';
        } else if (assessment.qualityScore >= 0.6) {
            assessment.confidenceLevel = 'medium';
        } else {
            assessment.confidenceLevel = 'low';
        }
        
        return assessment;
    }

    /**
     * 按优先级和依赖关系排序任务
     */
    sortTasksByPriority(tasks) {
        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        
        return tasks.sort((a, b) => {
            // 首先按优先级排序
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // 然后按依赖关系排序
            if (a.dependencies && a.dependencies.length > 0) return 1;
            if (b.dependencies && b.dependencies.length > 0) return -1;
            
            return 0;
        });
    }

    /**
     * 计算持续时间
     */
    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return end - start; // 返回毫秒数
    }

    /**
     * 导出执行结果
     */
    exportResults(executionResult) {
        return JSON.stringify(executionResult, null, 2);
    }

    /**
     * 获取执行历史
     */
    getExecutionHistory() {
        return this.executionHistory;
    }

    /**
     * 清理执行历史
     */
    clearHistory() {
        this.executionHistory = [];
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExecutionAgent;
}

// 示例使用
if (typeof window !== 'undefined') {
    window.ExecutionAgent = ExecutionAgent;
}