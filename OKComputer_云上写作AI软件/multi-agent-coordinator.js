/**
 * 多代理协调器 - 代理协调机制和通信协议
 * 负责协调各个代理之间的工作流程和数据传递
 */

class MultiAgentCoordinator {
    constructor() {
        this.name = '多代理协调器';
        this.version = '1.0.0';
        
        // 初始化各个代理
        this.agents = {
            planning: null,      // 规划代理
            execution: null,     // 执行代理
            validation: null,    // 验证代理
            response: null,      // 回答代理
            storyCreator: null    // 小说创作代理
        };
        
        // 工作流状态
        this.workflowState = {
            status: 'idle',      // idle, planning, executing, validating, responding, completed, failed
            currentTask: null,
            currentAgent: null,
            startTime: null,
            progress: 0,
            errors: [],
            warnings: []
        };
        
        // 通信协议
        this.communicationProtocol = {
            messageTypes: {
                TASK_START: 'task_start',
                TASK_COMPLETE: 'task_complete',
                TASK_FAILED: 'task_failed',
                DATA_TRANSFER: 'data_transfer',
                STATUS_UPDATE: 'status_update',
                ERROR_REPORT: 'error_report',
                WORKFLOW_COMPLETE: 'workflow_complete'
            },
            messageQueue: [],
            messageHandlers: new Map()
        };
        
        // 数据存储
        this.dataStore = {
            taskPlans: new Map(),
            executionResults: new Map(),
            validationResults: new Map(),
            responseResults: new Map(),
            workflowLogs: []
        };
        
        // 配置选项
        this.config = {
            maxRetries: 3,
            timeoutMs: 300000,        // 5分钟超时
            enableLogging: true,
            enableMonitoring: true,
            parallelExecution: false,
            fallbackOnError: true
        };
        
        // 事件监听器
        this.eventListeners = {
            onWorkflowStart: [],
            onWorkflowComplete: [],
            onAgentComplete: [],
            onError: []
        };
    }

    /**
     * 初始化代理
     * @param {Object} agents - 代理实例
     */
    initializeAgents(agents) {
        console.log('🔄 [协调器] 初始化代理...');
        
        this.agents = {
            planning: agents.planning || new PlanningAgent(),
            execution: agents.execution || new ExecutionAgent(),
            validation: agents.validation || new ValidationAgent(),
            response: agents.response || new ResponseAgent(),
            storyCreator: agents.storyCreator || (typeof StoryCreationAgent !== 'undefined' ? new StoryCreationAgent() : null)
        };
        
        // 设置消息处理器
        this.setupMessageHandlers();
        
        console.log('🔄 [协调器] 代理初始化完成');
    }

    /**
     * 设置消息处理器
     */
    setupMessageHandlers() {
        this.communicationProtocol.messageHandlers.set(
            this.communicationProtocol.messageTypes.TASK_COMPLETE,
            this.handleTaskComplete.bind(this)
        );
        
        this.communicationProtocol.messageHandlers.set(
            this.communicationProtocol.messageTypes.TASK_FAILED,
            this.handleTaskFailed.bind(this)
        );
        
        this.communicationProtocol.messageHandlers.set(
            this.communicationProtocol.messageTypes.STATUS_UPDATE,
            this.handleStatusUpdate.bind(this)
        );
        
        this.communicationProtocol.messageHandlers.set(
            this.communicationProtocol.messageTypes.ERROR_REPORT,
            this.handleErrorReport.bind(this)
        );
    }

    /**
     * 启动工作流
     * @param {string} query - 用户查询
     * @returns {Object} 工作流结果
     */
    async startWorkflow(query) {
        console.log('🔄 [协调器] 启动工作流:', query);
        
        const workflowId = this.generateWorkflowId();
        const workflow = {
            id: workflowId,
            query,
            status: 'in_progress',
            startTime: new Date().toISOString(),
            endTime: null,
            results: {},
            errors: []
        };
        
        this.workflowState.status = 'planning';
        this.workflowState.startTime = new Date();
        this.workflowState.currentTask = query;
        
        try {
            // 触发工作流开始事件
            this.triggerEvent('onWorkflowStart', { workflowId, query });
            
            // 记录日志
            this.logWorkflowEvent('workflow_started', { workflowId, query });
            
            // 第一阶段：规划
            const planningResult = await this.executePlanningPhase(query);
            workflow.results.planning = planningResult;
            
            if (!planningResult.success) {
                throw new Error('规划阶段失败: ' + planningResult.error);
            }
            
            // 第二阶段：执行
            const executionResult = await this.executeExecutionPhase(planningResult.taskPlan);
            workflow.results.execution = executionResult;
            
            if (!executionResult.success) {
                throw new Error('执行阶段失败: ' + executionResult.error);
            }
            
            // 第三阶段：验证
            const validationResult = await this.executeValidationPhase(executionResult, planningResult.taskPlan);
            workflow.results.validation = validationResult;
            
            // 第四阶段：回答生成
            const responseResult = await this.executeResponsePhase(executionResult, validationResult, planningResult.taskPlan);
            workflow.results.response = responseResult;
            
            // 第五阶段：小说创作（如果适用）
            if (this.isStoryCreationQuery(query)) {
                const storyCreationResult = await this.executeStoryCreationPhase(query, responseResult, planningResult.taskPlan);
                workflow.results.storyCreation = storyCreationResult;
            }
            
            // 完成工作流
            workflow.status = 'completed';
            workflow.endTime = new Date().toISOString();
            this.workflowState.status = 'completed';
            
            // 触发完成事件
            this.triggerEvent('onWorkflowComplete', { workflowId, result: workflow });
            
            this.logWorkflowEvent('workflow_completed', { workflowId, success: true });
            
            console.log('🔄 [协调器] 工作流完成');
            
            return {
                success: true,
                workflowId,
                workflow,
                finalAnswer: responseResult.answer
            };
            
        } catch (error) {
            workflow.status = 'failed';
            workflow.endTime = new Date().toISOString();
            workflow.errors.push(error.message);
            this.workflowState.status = 'failed';
            
            // 触发错误事件
            this.triggerEvent('onError', { workflowId, error });
            
            this.logWorkflowEvent('workflow_failed', { workflowId, error: error.message });
            
            console.error('🔄 [协调器] 工作流失败:', error);
            
            if (this.config.fallbackOnError) {
                return this.generateFallbackResponse(query, workflowId, error);
            }
            
            return {
                success: false,
                workflowId,
                workflow,
                error: error.message
            };
        }
    }

    /**
     * 执行规划阶段
     */
    async executePlanningPhase(query) {
        console.log('🔄 [协调器] 执行规划阶段...');
        
        this.workflowState.status = 'planning';
        this.workflowState.currentAgent = 'planning';
        
        try {
            // 分析查询
            const queryAnalysis = await this.agents.planning.analyzeQuery(query);
            
            // 创建任务计划
            const taskPlan = await this.agents.planning.createTaskPlan(queryAnalysis);
            
            // 存储结果
            this.dataStore.taskPlans.set(taskPlan.planId, taskPlan);
            
            // 发送任务完成消息
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_COMPLETE,
                sender: 'coordinator',
                receiver: 'planning',
                data: { taskPlanId: taskPlan.planId },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                queryAnalysis,
                taskPlan
            };
            
        } catch (error) {
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_FAILED,
                sender: 'coordinator',
                receiver: 'planning',
                data: { error: error.message },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 执行执行阶段
     */
    async executeExecutionPhase(taskPlan) {
        console.log('🔄 [协调器] 执行执行阶段...');
        
        this.workflowState.status = 'executing';
        this.workflowState.currentAgent = 'execution';
        this.workflowState.progress = 25;
        
        try {
            // 执行任务计划
            const executionResult = await this.agents.execution.executeTaskPlan(taskPlan);
            
            // 存储结果
            this.dataStore.executionResults.set(executionResult.planId, executionResult);
            
            // 发送任务完成消息
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_COMPLETE,
                sender: 'coordinator',
                receiver: 'execution',
                data: { executionId: executionResult.planId },
                timestamp: new Date().toISOString()
            });
            
            this.workflowState.progress = 50;
            
            return {
                success: true,
                executionResult
            };
            
        } catch (error) {
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_FAILED,
                sender: 'coordinator',
                receiver: 'execution',
                data: { error: error.message },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 执行验证阶段
     */
    async executeValidationPhase(executionResult, taskPlan) {
        console.log('🔄 [协调器] 执行验证阶段...');
        
        this.workflowState.status = 'validating';
        this.workflowState.currentAgent = 'validation';
        this.workflowState.progress = 75;
        
        try {
            // 验证执行结果
            const validationResult = await this.agents.validation.validateExecutionResult(executionResult, taskPlan);
            
            // 存储结果
            this.dataStore.validationResults.set(validationResult.executionId, validationResult);
            
            // 发送任务完成消息
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_COMPLETE,
                sender: 'coordinator',
                receiver: 'validation',
                data: { validationId: validationResult.executionId },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: true,
                validationResult
            };
            
        } catch (error) {
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_FAILED,
                sender: 'coordinator',
                receiver: 'validation',
                data: { error: error.message },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 执行回答生成阶段
     */
    async executeResponsePhase(executionResult, validationResult, taskPlan) {
        console.log('🔄 [协调器] 执行回答生成阶段...');
        
        this.workflowState.status = 'responding';
        this.workflowState.currentAgent = 'response';
        this.workflowState.progress = 90;
        
        try {
            // 生成综合答案
            const answer = await this.agents.response.generateComprehensiveAnswer(
                executionResult, 
                validationResult, 
                taskPlan
            );
            
            // 存储结果
            this.dataStore.responseResults.set(answer.responseId, answer);
            
            // 发送任务完成消息
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_COMPLETE,
                sender: 'coordinator',
                receiver: 'response',
                data: { responseId: answer.responseId },
                timestamp: new Date().toISOString()
            });
            
            this.workflowState.progress = 100;
            
            return {
                success: true,
                answer
            };
            
        } catch (error) {
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_FAILED,
                sender: 'coordinator',
                receiver: 'response',
                data: { error: error.message },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 执行小说创作阶段
     */
    async executeStoryCreationPhase(query, responseResult, taskPlan) {
        console.log('🔄 [协调器] 执行小说创作阶段...');
        
        this.workflowState.status = 'story_creating';
        this.workflowState.currentAgent = 'storyCreator';
        this.workflowState.progress = 95;
        
        try {
            if (!this.agents.storyCreator) {
                throw new Error('小说创作代理未初始化');
            }
            
            // 处理小说创作请求
            const storyCreationResult = await this.agents.storyCreator.processUserInput(query, {
                responseResult,
                taskPlan
            });
            
            // 存储结果
            this.dataStore.storyCreationResults = this.dataStore.storyCreationResults || new Map();
            this.dataStore.storyCreationResults.set(storyCreationResult.id || Date.now(), storyCreationResult);
            
            // 发送任务完成消息
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_COMPLETE,
                sender: 'coordinator',
                receiver: 'storyCreator',
                data: { storyCreationId: storyCreationResult.id || Date.now() },
                timestamp: new Date().toISOString()
            });
            
            this.workflowState.progress = 100;
            
            return {
                success: true,
                storyCreationResult
            };
            
        } catch (error) {
            this.sendMessage({
                type: this.communicationProtocol.messageTypes.TASK_FAILED,
                sender: 'coordinator',
                receiver: 'storyCreator',
                data: { error: error.message },
                timestamp: new Date().toISOString()
            });
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 判断是否为小说创作查询
     */
    isStoryCreationQuery(query) {
        const storyKeywords = [
            '写小说', '创作故事', '小说创作', '故事创作', 
            '角色设定', '情节规划', '写故事', '小说写作',
            '文学创作', '创意写作', '故事大纲', '人物塑造'
        ];
        
        return storyKeywords.some(keyword => query.includes(keyword));
    }

    /**
     * 发送消息
     */
    sendMessage(message) {
        message.id = this.generateMessageId();
        this.communicationProtocol.messageQueue.push(message);
        
        // 处理消息
        this.processMessage(message);
        
        if (this.config.enableLogging) {
            console.log('🔄 [协调器] 发送消息:', message.type, message.sender, '->', message.receiver);
        }
    }

    /**
     * 处理消息
     */
    processMessage(message) {
        const handler = this.communicationProtocol.messageHandlers.get(message.type);
        if (handler) {
            try {
                handler(message);
            } catch (error) {
                console.error('🔄 [协调器] 消息处理失败:', error);
            }
        }
    }

    /**
     * 处理任务完成消息
     */
    handleTaskComplete(message) {
        const { sender, data } = message;
        
        // 触发代理完成事件
        this.triggerEvent('onAgentComplete', {
            agent: sender,
            data,
            timestamp: message.timestamp
        });
        
        // 更新工作流状态
        this.updateWorkflowProgress(sender);
    }

    /**
     * 处理任务失败消息
     */
    handleTaskFailed(message) {
        const { sender, data } = message;
        
        // 记录错误
        this.workflowState.errors.push({
            agent: sender,
            error: data.error,
            timestamp: message.timestamp
        });
        
        // 触发错误事件
        this.triggerEvent('onError', {
            agent: sender,
            error: data.error,
            timestamp: message.timestamp
        });
    }

    /**
     * 处理状态更新消息
     */
    handleStatusUpdate(message) {
        const { sender, data } = message;
        
        if (this.config.enableMonitoring) {
            console.log('🔄 [协调器] 状态更新:', sender, data);
        }
    }

    /**
     * 处理错误报告消息
     */
    handleErrorReport(message) {
        const { sender, data } = message;
        
        this.workflowState.warnings.push({
            agent: sender,
            warning: data.warning,
            timestamp: message.timestamp
        });
    }

    /**
     * 更新工作流进度
     */
    updateWorkflowProgress(completedAgent) {
        const progressMap = {
            'planning': 25,
            'execution': 50,
            'validation': 75,
            'response': 90,
            'storyCreator': 100
        };
        
        this.workflowState.progress = progressMap[completedAgent] || this.workflowState.progress;
    }

    /**
     * 触发事件
     */
    triggerEvent(eventType, data) {
        const listeners = this.eventListeners[eventType];
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(data);
                } catch (error) {
                    console.error('🔄 [协调器] 事件监听器执行失败:', error);
                }
            }
        }
    }

    /**
     * 添加事件监听器
     */
    addEventListener(eventType, listener) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].push(listener);
        }
    }

    /**
     * 移除事件监听器
     */
    removeEventListener(eventType, listener) {
        if (this.eventListeners[eventType]) {
            const index = this.eventListeners[eventType].indexOf(listener);
            if (index > -1) {
                this.eventListeners[eventType].splice(index, 1);
            }
        }
    }

    /**
     * 记录工作流事件
     */
    logWorkflowEvent(eventType, data) {
        const logEntry = {
            eventType,
            timestamp: new Date().toISOString(),
            data
        };
        
        this.dataStore.workflowLogs.push(logEntry);
        
        if (this.config.enableLogging) {
            console.log('🔄 [协调器] 工作流事件:', eventType, data);
        }
    }

    /**
     * 生成后备响应
     */
    generateFallbackResponse(query, workflowId, error) {
        console.log('🔄 [协调器] 生成后备响应...');
        
        const fallbackResponse = {
            responseId: this.generateResponseId(),
            timestamp: new Date().toISOString(),
            query,
            error: error.message,
            fallback: true,
            content: {
                summary: '抱歉，处理您的查询时遇到了问题',
                error: error.message,
                suggestion: '请稍后重试或联系技术支持'
            }
        };
        
        return {
            success: false,
            workflowId,
            fallbackResponse,
            error: error.message
        };
    }

    /**
     * 获取工作流状态
     */
    getWorkflowState() {
        return {
            ...this.workflowState,
            messageQueueLength: this.communicationProtocol.messageQueue.length,
            dataStoreSize: {
                taskPlans: this.dataStore.taskPlans.size,
                executionResults: this.dataStore.executionResults.size,
                validationResults: this.dataStore.validationResults.size,
                responseResults: this.dataStore.responseResults.size
            }
        };
    }

    /**
     * 获取工作流日志
     */
    getWorkflowLogs(limit = 50) {
        return this.dataStore.workflowLogs.slice(-limit);
    }

    /**
     * 获取数据存储内容
     */
    getDataStore() {
        return {
            taskPlans: Array.from(this.dataStore.taskPlans.values()),
            executionResults: Array.from(this.dataStore.executionResults.values()),
            validationResults: Array.from(this.dataStore.validationResults.values()),
            responseResults: Array.from(this.dataStore.responseResults.values()),
            logs: this.dataStore.workflowLogs
        };
    }

    /**
     * 生成工作流ID
     */
    generateWorkflowId() {
        return 'workflow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 生成消息ID
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 生成响应ID
     */
    generateResponseId() {
        return 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiAgentCoordinator;
}

// 示例使用
if (typeof window !== 'undefined') {
    window.MultiAgentCoordinator = MultiAgentCoordinator;
}