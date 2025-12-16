/**
 * Unity API Bridge
 * 为Unity提供小说创作系统的API接口
 */

class UnityAPIBridge {
    constructor() {
        this.storyAgent = null;
        this.storyTemplates = null;
        this.coordinator = null;
        
        // Unity消息队列
        this.unityMessageQueue = [];
        this.isUnityConnected = false;
        
        this.initialize();
    }

    /**
     * 初始化API桥接
     */
    initialize() {
        console.log('🔌 Unity API Bridge 初始化...');
        
        // 检查Unity环境
        this.detectUnityEnvironment();
        
        // 初始化小说创作系统
        this.initializeStorySystem();
        
        // 设置消息监听
        this.setupMessageListener();
    }

    /**
     * 检测Unity环境
     */
    detectUnityEnvironment() {
        // 检查是否在Unity WebView中运行
        if (typeof window.Unity !== 'undefined' || 
            typeof window.unity !== 'undefined' ||
            navigator.userAgent.includes('Unity')) {
            this.isUnityConnected = true;
            console.log('✅ 检测到Unity环境');
            
            // 通知Unity初始化完成
            this.sendToUnity('OnWebBridgeReady', {
                status: 'ready',
                version: '1.0.0',
                features: [
                    'story_creation',
                    'template_library', 
                    'character_generation',
                    'ai_assistance'
                ]
            });
        }
    }

    /**
     * 初始化小说创作系统
     */
    async initializeStorySystem() {
        try {
            // 初始化模板库
            if (typeof StoryTemplates !== 'undefined') {
                this.storyTemplates = new StoryTemplates();
            }
            
            // 初始化代理协调器
            if (typeof MultiAgentCoordinator !== 'undefined') {
                this.coordinator = new MultiAgentCoordinator();
                this.coordinator.initializeAgents({
                    planning: new PlanningAgent(),
                    execution: new ExecutionAgent(),
                    response: new ResponseAgent(),
                    storyCreator: new StoryCreationAgent()
                });
                this.storyAgent = this.coordinator.agents.storyCreator;
            }
            
            console.log('✅ 小说创作系统初始化完成');
        } catch (error) {
            console.error('❌ 小说创作系统初始化失败:', error);
        }
    }

    /**
     * 设置消息监听
     */
    setupMessageListener() {
        // 监听Unity发来的消息
        window.addEventListener('message', (event) => {
            this.handleUnityMessage(event.data);
        });

        // 如果Unity提供了全局通信对象
        if (typeof window.unity !== 'undefined') {
            window.unity.call = (methodName, data) => {
                this.handleUnityCall(methodName, data);
            };
        }
    }

    /**
     * 处理Unity消息
     */
    handleUnityMessage(data) {
        try {
            const message = typeof data === 'string' ? JSON.parse(data) : data;
            
            console.log('📨 收到Unity消息:', message);
            
            switch (message.type) {
                case 'CREATE_STORY':
                    this.handleCreateStory(message.data);
                    break;
                case 'GET_TEMPLATES':
                    this.handleGetTemplates(message.data);
                    break;
                case 'GENERATE_CHARACTER':
                    this.handleGenerateCharacter(message.data);
                    break;
                case 'AI_ASSIST':
                    this.handleAIAssist(message.data);
                    break;
                case 'SAVE_PROJECT':
                    this.handleSaveProject(message.data);
                    break;
                case 'LOAD_PROJECT':
                    this.handleLoadProject(message.data);
                    break;
                default:
                    console.warn('未知消息类型:', message.type);
            }
        } catch (error) {
            console.error('处理Unity消息失败:', error);
            this.sendErrorToUnity('MESSAGE_PARSE_ERROR', error.message);
        }
    }

    /**
     * 处理Unity调用
     */
    async handleUnityCall(methodName, data) {
        console.log('🔧 Unity调用:', methodName, data);
        
        switch (methodName) {
            case 'CreateStory':
                await this.handleCreateStory(data);
                break;
            case 'GetTemplates':
                await this.handleGetTemplates(data);
                break;
            case 'GenerateCharacter':
                await this.handleGenerateCharacter(data);
                break;
            case 'AIAssist':
                await this.handleAIAssist(data);
                break;
            default:
                console.warn('未知调用方法:', methodName);
        }
    }

    /**
     * 处理创建故事请求
     */
    async handleCreateStory(data) {
        try {
            const { title, genre, templateId } = data;
            
            let storyData = {
                title: title || '新故事',
                genre: genre || 'romance',
                template: null,
                characters: [],
                plot: [],
                chapters: []
            };

            // 如果指定了模板ID，应用模板
            if (templateId && this.storyTemplates) {
                const template = this.storyTemplates.getTemplate(genre, templateId);
                if (template) {
                    storyData.template = template;
                    storyData.genre = genre;
                }
            }

            this.sendToUnity('OnStoryCreated', {
                success: true,
                storyData: storyData
            });

        } catch (error) {
            this.sendErrorToUnity('CREATE_STORY_ERROR', error.message);
        }
    }

    /**
     * 处理获取模板请求
     */
    async handleGetTemplates(data) {
        try {
            const { genre } = data;
            let templates = [];

            if (this.storyTemplates) {
                if (genre) {
                    templates = this.storyTemplates.getTemplatesByGenre(genre);
                } else {
                    // 获取所有模板
                    for (const [g, genreData] of Object.entries(this.storyTemplates.templates)) {
                        genreData.templates.forEach(template => {
                            templates.push({
                                ...template,
                                genre: g
                            });
                        });
                    }
                }
            }

            this.sendToUnity('OnTemplatesLoaded', {
                success: true,
                templates: templates
            });

        } catch (error) {
            this.sendErrorToUnity('GET_TEMPLATES_ERROR', error.message);
        }
    }

    /**
     * 处理生成角色请求
     */
    async handleGenerateCharacter(data) {
        try {
            const { archetype, name } = data;
            let character;

            if (this.storyTemplates) {
                character = this.storyTemplates.generateCharacter(archetype);
                
                // 如果指定了名字，使用指定的名字
                if (name) {
                    character.name = name;
                }
            }

            this.sendToUnity('OnCharacterGenerated', {
                success: true,
                character: character
            });

        } catch (error) {
            this.sendErrorToUnity('GENERATE_CHARACTER_ERROR', error.message);
        }
    }

    /**
     * 处理AI协助请求
     */
    async handleAIAssist(data) {
        try {
            const { query, context } = data;
            let response;

            if (this.storyAgent) {
                response = await this.storyAgent.processUserInput(query, context);
            } else {
                response = {
                    type: 'general',
                    message: 'AI助手暂不可用，请稍后重试'
                };
            }

            this.sendToUnity('OnAIResponse', {
                success: true,
                response: response
            });

        } catch (error) {
            this.sendErrorToUnity('AI_ASSIST_ERROR', error.message);
        }
    }

    /**
     * 处理保存项目请求
     */
    async handleSaveProject(data) {
        try {
            const { projectData, fileName } = data;
            
            // 保存到本地存储
            if (projectData) {
                localStorage.setItem('unityStoryProject', JSON.stringify({
                    ...projectData,
                    savedAt: new Date().toISOString()
                }));
            }

            // 如果指定了文件名，创建下载
            if (fileName && projectData.content) {
                this.downloadFile(fileName, projectData.content);
            }

            this.sendToUnity('OnProjectSaved', {
                success: true,
                fileName: fileName
            });

        } catch (error) {
            this.sendErrorToUnity('SAVE_PROJECT_ERROR', error.message);
        }
    }

    /**
     * 处理加载项目请求
     */
    async handleLoadProject(data) {
        try {
            const { projectId } = data;
            
            let projectData = null;
            
            if (projectId) {
                // 从本地存储加载特定项目
                const saved = localStorage.getItem('unityStoryProject_' + projectId);
                if (saved) {
                    projectData = JSON.parse(saved);
                }
            } else {
                // 加载默认项目
                const saved = localStorage.getItem('unityStoryProject');
                if (saved) {
                    projectData = JSON.parse(saved);
                }
            }

            this.sendToUnity('OnProjectLoaded', {
                success: true,
                projectData: projectData
            });

        } catch (error) {
            this.sendErrorToUnity('LOAD_PROJECT_ERROR', error.message);
        }
    }

    /**
     * 发送消息到Unity
     */
    sendToUnity(methodName, data) {
        const message = {
            type: 'UNITY_CALL',
            method: methodName,
            data: data,
            timestamp: new Date().toISOString()
        };

        console.log('📤 发送消息到Unity:', methodName, data);

        try {
            // 方法1: 通过Unity的JavaScript桥接
            if (typeof window.Unity !== 'undefined' && window.Unity.call) {
                window.Unity.call(methodName, JSON.stringify(data));
            }
            // 方法2: 通过WebView的postMessage
            else if (window.parent && window.parent.postMessage) {
                window.parent.postMessage(JSON.stringify(message), '*');
            }
            // 方法3: 通过自定义Unity对象
            else if (typeof window.unity !== 'undefined') {
                window.unity.SendMessage('WebBridgeObject', methodName, JSON.stringify(data));
            }
            // 方法4: 存储到队列，等待Unity轮询
            else {
                this.unityMessageQueue.push(message);
            }
        } catch (error) {
            console.error('发送Unity消息失败:', error);
        }
    }

    /**
     * 发送错误到Unity
     */
    sendErrorToUnity(errorType, errorMessage) {
        this.sendToUnity('OnError', {
            type: errorType,
            message: errorMessage,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 下载文件
     */
    downloadFile(fileName, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 获取Unity消息队列
     */
    getUnityMessages() {
        const messages = [...this.unityMessageQueue];
        this.unityMessageQueue = [];
        return messages;
    }

    /**
     * 检查连接状态
     */
    isConnected() {
        return this.isUnityConnected;
    }

    /**
     * 获取API功能列表
     */
    getAvailableFeatures() {
        return [
            {
                name: 'CREATE_STORY',
                description: '创建新故事',
                parameters: ['title', 'genre', 'templateId']
            },
            {
                name: 'GET_TEMPLATES',
                description: '获取故事模板',
                parameters: ['genre']
            },
            {
                name: 'GENERATE_CHARACTER',
                description: '生成角色',
                parameters: ['archetype', 'name']
            },
            {
                name: 'AI_ASSIST',
                description: 'AI协助',
                parameters: ['query', 'context']
            },
            {
                name: 'SAVE_PROJECT',
                description: '保存项目',
                parameters: ['projectData', 'fileName']
            },
            {
                name: 'LOAD_PROJECT',
                description: '加载项目',
                parameters: ['projectId']
            }
        ];
    }
}

// Unity端C#脚本示例
const UNITY_CSHARP_EXAMPLE = `
using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

public class StoryCreatorBridge : MonoBehaviour
{
    public WebViewObject webView;
    public Text statusText;
    public Button createStoryButton;
    public Button generateCharacterButton;
    
    void Start()
    {
        // 初始化WebView
        webView.Init((success) => {
            if (success) {
                statusText.text = "网页加载成功";
            }
        });
        
        // 设置按钮事件
        createStoryButton.onClick.AddListener(OnCreateStory);
        generateCharacterButton.onClick.AddListener(OnGenerateCharacter);
    }
    
    void OnCreateStory()
    {
        var storyData = new {
            title = "我的新故事",
            genre = "romance",
            templateId = "modern_city_love"
        };
        
        // 调用JavaScript API
        webView.EvaluateJS(@"
            if (window.unityBridge) {
                window.unityBridge.handleCreateStory(" + JsonUtility.ToJson(storyData) + @");
            }
        ");
    }
    
    void OnGenerateCharacter()
    {
        var characterRequest = new {
            archetype = "hero",
            name = ""
        };
        
        webView.EvaluateJS(@"
            if (window.unityBridge) {
                window.unityBridge.handleGenerateCharacter(" + JsonUtility.ToJson(characterRequest) + @");
            }
        ");
    }
    
    // JavaScript回调方法
    public void OnStoryCreated(string jsonData)
    {
        var response = JsonUtility.FromJson<StoryResponse>(jsonData);
        Debug.Log("故事创建成功: " + response.storyData.title);
        statusText.text = "故事创建成功!";
    }
    
    public void OnCharacterGenerated(string jsonData)
    {
        var response = JsonUtility.FromJson<CharacterResponse>(jsonData);
        Debug.Log("角色生成: " + response.character.name);
    }
    
    public void OnError(string jsonData)
    {
        var error = JsonUtility.FromJson<ErrorResponse>(jsonData);
        Debug.LogError("发生错误: " + error.message);
        statusText.text = "错误: " + error.message;
    }
}

[System.Serializable]
public class StoryResponse
{
    public bool success;
    public StoryData storyData;
}

[System.Serializable]
public class CharacterResponse
{
    public bool success;
    public CharacterData character;
}

[System.Serializable]
public class ErrorResponse
{
    public string type;
    public string message;
    public string timestamp;
}
`;

// 初始化全局桥接对象
window.unityBridge = new UnityAPIBridge();

// 导出给Unity使用
if (typeof window !== 'undefined') {
    window.UnityAPIBridge = UnityAPIBridge;
}