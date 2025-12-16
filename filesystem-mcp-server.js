#!/usr/bin/env node

/**
 * Filesystem MCP Server
 * 为AI助手提供文件系统操作的MCP服务器
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class FilesystemMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'filesystem-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    setupToolHandlers() {
        // 列出可用工具
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'read_file',
                    description: '读取文件内容',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '要读取的文件路径（绝对路径）',
                            },
                            encoding: {
                                type: 'string',
                                description: '文件编码，默认utf-8',
                                default: 'utf-8'
                            }
                        },
                        required: ['path'],
                    },
                },
                {
                    name: 'write_file',
                    description: '写入文件内容',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '要写入的文件路径（绝对路径）',
                            },
                            content: {
                                type: 'string',
                                description: '文件内容',
                            },
                            encoding: {
                                type: 'string',
                                description: '文件编码，默认utf-8',
                                default: 'utf-8'
                            },
                            createDirs: {
                                type: 'boolean',
                                description: '如果目录不存在是否创建',
                                default: true
                            }
                        },
                        required: ['path', 'content'],
                    },
                },
                {
                    name: 'list_directory',
                    description: '列出目录内容',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '要列出的目录路径（绝对路径）',
                            },
                            recursive: {
                                type: 'boolean',
                                description: '是否递归列出子目录',
                                default: false
                            },
                            showHidden: {
                                type: 'boolean',
                                description: '是否显示隐藏文件',
                                default: false
                            },
                            pattern: {
                                type: 'string',
                                description: '文件名模式匹配（支持通配符）',
                            }
                        },
                        required: ['path'],
                    },
                },
                {
                    name: 'create_directory',
                    description: '创建目录',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '要创建的目录路径（绝对路径）',
                            },
                            recursive: {
                                type: 'boolean',
                                description: '是否递归创建父目录',
                                default: true
                            }
                        },
                        required: ['path'],
                    },
                },
                {
                    name: 'delete_file',
                    description: '删除文件或目录',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '要删除的文件或目录路径（绝对路径）',
                            },
                            recursive: {
                                type: 'boolean',
                                description: '是否递归删除目录',
                                default: false
                            }
                        },
                        required: ['path'],
                    },
                },
                {
                    name: 'copy_file',
                    description: '复制文件或目录',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            source: {
                                type: 'string',
                                description: '源文件路径（绝对路径）',
                            },
                            destination: {
                                type: 'string',
                                description: '目标路径（绝对路径）',
                            },
                            overwrite: {
                                type: 'boolean',
                                description: '是否覆盖已存在的文件',
                                default: false
                            }
                        },
                        required: ['source', 'destination'],
                    },
                },
                {
                    name: 'move_file',
                    description: '移动或重命名文件或目录',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            source: {
                                type: 'string',
                                description: '源文件路径（绝对路径）',
                            },
                            destination: {
                                type: 'string',
                                description: '目标路径（绝对路径）',
                            },
                            overwrite: {
                                type: 'boolean',
                                description: '是否覆盖已存在的文件',
                                default: false
                            }
                        },
                        required: ['source', 'destination'],
                    },
                },
                {
                    name: 'get_file_info',
                    description: '获取文件或目录信息',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '文件或目录路径（绝对路径）',
                            }
                        },
                        required: ['path'],
                    },
                },
                {
                    name: 'search_files',
                    description: '搜索文件',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            directory: {
                                type: 'string',
                                description: '搜索根目录（绝对路径）',
                            },
                            pattern: {
                                type: 'string',
                                description: '文件名模式（支持正则表达式）',
                            },
                            content: {
                                type: 'string',
                                description: '文件内容搜索关键词',
                            },
                            maxResults: {
                                type: 'number',
                                description: '最大结果数量',
                                default: 50
                            },
                            caseSensitive: {
                                type: 'boolean',
                                description: '是否区分大小写',
                                default: false
                            }
                        },
                        required: ['directory'],
                    },
                },
                {
                    name: 'get_working_directory',
                    description: '获取当前工作目录',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
                {
                    name: 'watch_file',
                    description: '监听文件变化（返回监听器ID）',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            path: {
                                type: 'string',
                                description: '要监听的文件路径（绝对路径）',
                            },
                            events: {
                                type: 'array',
                                items: { type: 'string' },
                                description: '要监听的事件类型：change, rename, delete',
                                default: ['change']
                            }
                        },
                        required: ['path'],
                    },
                }
            ],
        }));

        // 处理工具调用
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'read_file':
                        return await this.handleReadFile(args);
                    case 'write_file':
                        return await this.handleWriteFile(args);
                    case 'list_directory':
                        return await this.handleListDirectory(args);
                    case 'create_directory':
                        return await this.handleCreateDirectory(args);
                    case 'delete_file':
                        return await this.handleDeleteFile(args);
                    case 'copy_file':
                        return await this.handleCopyFile(args);
                    case 'move_file':
                        return await this.handleMoveFile(args);
                    case 'get_file_info':
                        return await this.handleGetFileInfo(args);
                    case 'search_files':
                        return await this.handleSearchFiles(args);
                    case 'get_working_directory':
                        return await this.handleGetWorkingDirectory();
                    case 'watch_file':
                        return await this.handleWatchFile(args);
                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${name}`
                        );
                }
            } catch (error) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error.message}`
                );
            }
        });
    }

    async handleReadFile(args) {
        const { path: filePath, encoding = 'utf-8' } = args;
        
        // 安全检查
        if (!this.isPathSafe(filePath)) {
            throw new Error('Path access denied');
        }

        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                throw new Error('Path is a directory, not a file');
            }

            const content = await fs.readFile(filePath, encoding);
            const info = await this.getFileInfo(filePath);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            content: content,
                            info: info
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleWriteFile(args) {
        const { path: filePath, content, encoding = 'utf-8', createDirs = true } = args;
        
        // 安全检查
        if (!this.isPathSafe(filePath)) {
            throw new Error('Path access denied');
        }

        try {
            // 创建目录（如果需要）
            if (createDirs) {
                const dir = path.dirname(filePath);
                await fs.mkdir(dir, { recursive: true });
            }

            await fs.writeFile(filePath, content, encoding);
            const info = await this.getFileInfo(filePath);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'File written successfully',
                            info: info
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleListDirectory(args) {
        const { path: dirPath, recursive = false, showHidden = false, pattern } = args;
        
        // 安全检查
        if (!this.isPathSafe(dirPath)) {
            throw new Error('Path access denied');
        }

        try {
            const results = await this.listDirectory(dirPath, {
                recursive,
                showHidden,
                pattern
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            directory: dirPath,
                            items: results
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleCreateDirectory(args) {
        const { path: dirPath, recursive = true } = args;
        
        // 安全检查
        if (!this.isPathSafe(dirPath)) {
            throw new Error('Path access denied');
        }

        try {
            await fs.mkdir(dirPath, { recursive });
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Directory created successfully',
                            path: dirPath
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleDeleteFile(args) {
        const { path: filePath, recursive = false } = args;
        
        // 安全检查
        if (!this.isPathSafe(filePath)) {
            throw new Error('Path access denied');
        }

        try {
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                if (recursive) {
                    await fs.rmdir(filePath, { recursive: true });
                } else {
                    throw new Error('Directory is not empty, use recursive=true to delete');
                }
            } else {
                await fs.unlink(filePath);
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'File/directory deleted successfully',
                            path: filePath
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleCopyFile(args) {
        const { source, destination, overwrite = false } = args;
        
        // 安全检查
        if (!this.isPathSafe(source) || !this.isPathSafe(destination)) {
            throw new Error('Path access denied');
        }

        try {
            // 检查目标文件是否存在
            try {
                await fs.access(destination);
                if (!overwrite) {
                    throw new Error('Destination file exists and overwrite=false');
                }
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
            }

            // 创建目标目录
            const destDir = path.dirname(destination);
            await fs.mkdir(destDir, { recursive: true });

            // 复制文件
            await fs.copyFile(source, destination);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'File copied successfully',
                            source: source,
                            destination: destination
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleMoveFile(args) {
        const { source, destination, overwrite = false } = args;
        
        // 安全检查
        if (!this.isPathSafe(source) || !this.isPathSafe(destination)) {
            throw new Error('Path access denied');
        }

        try {
            // 检查目标文件是否存在
            try {
                await fs.access(destination);
                if (!overwrite) {
                    throw new Error('Destination file exists and overwrite=false');
                }
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
            }

            // 创建目标目录
            const destDir = path.dirname(destination);
            await fs.mkdir(destDir, { recursive: true });

            // 移动文件
            await fs.rename(source, destination);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'File moved successfully',
                            source: source,
                            destination: destination
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleGetFileInfo(args) {
        const { path: filePath } = args;
        
        // 安全检查
        if (!this.isPathSafe(filePath)) {
            throw new Error('Path access denied');
        }

        try {
            const info = await this.getFileInfo(filePath);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            info: info
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleSearchFiles(args) {
        const { directory, pattern, content, maxResults = 50, caseSensitive = false } = args;
        
        // 安全检查
        if (!this.isPathSafe(directory)) {
            throw new Error('Path access denied');
        }

        try {
            const results = await this.searchFiles(directory, {
                pattern,
                content,
                maxResults,
                caseSensitive
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            directory: directory,
                            results: results,
                            count: results.length
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message
                        }, null, 2)
                    }
                ]
            };
        }
    }

    async handleGetWorkingDirectory() {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        workingDirectory: process.cwd(),
                        homeDirectory: os.homedir(),
                        tempDirectory: os.tmpdir()
                    }, null, 2)
                }
            ]
        };
    }

    async handleWatchFile(args) {
        const { path: filePath, events = ['change'] } = args;
        
        // 安全检查
        if (!this.isPathSafe(filePath)) {
            throw new Error('Path access denied');
        }

        const watcherId = `watcher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        watcherId: watcherId,
                        message: 'File watcher created (note: actual watching requires implementation)',
                        path: filePath,
                        events: events
                    }, null, 2)
                }
            ]
        };
    }

    // 辅助方法
    isPathSafe(filePath) {
        const resolvedPath = path.resolve(filePath);
        
        // 检查路径是否包含危险字符
        if (filePath.includes('..') || filePath.includes('~')) {
            return false;
        }
        
        // 检查路径是否在允许的范围内
        const allowedPaths = [
            process.cwd(),
            os.homedir(),
            os.tmpdir()
        ];
        
        return allowedPaths.some(allowedPath => 
            resolvedPath.startsWith(path.resolve(allowedPath))
        );
    }

    async getFileInfo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                path: filePath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                permissions: stats.mode,
                isReadable: true, // 简化实现
                isWritable: true  // 简化实现
            };
        } catch (error) {
            throw new Error(`Cannot get file info: ${error.message}`);
        }
    }

    async listDirectory(dirPath, options = {}) {
        const { recursive = false, showHidden = false, pattern } = options;
        const results = [];

        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });

            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                
                // 跳过隐藏文件
                if (!showHidden && item.name.startsWith('.')) {
                    continue;
                }

                // 模式匹配
                if (pattern && !this.matchPattern(item.name, pattern)) {
                    continue;
                }

                const info = await this.getFileInfo(itemPath);
                results.push(info);

                // 递归处理子目录
                if (recursive && item.isDirectory()) {
                    const subResults = await this.listDirectory(itemPath, options);
                    results.push(...subResults);
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Cannot list directory: ${error.message}`);
        }
    }

    async searchFiles(directory, options = {}) {
        const { pattern, content, maxResults = 50, caseSensitive = false } = options;
        const results = [];

        try {
            const items = await this.listDirectory(directory, { recursive: true });
            
            for (const item of items) {
                if (results.length >= maxResults) break;

                if (item.type !== 'file') continue;

                // 文件名匹配
                if (pattern && !this.matchPattern(path.basename(item.path), pattern)) {
                    continue;
                }

                // 内容搜索
                if (content) {
                    try {
                        const fileContent = await fs.readFile(item.path, 'utf-8');
                        const searchContent = caseSensitive ? fileContent : fileContent.toLowerCase();
                        const searchTerm = caseSensitive ? content : content.toLowerCase();
                        
                        if (searchContent.includes(searchTerm)) {
                            results.push({
                                path: item.path,
                                size: item.size,
                                modified: item.modified,
                                matches: [content] // 简化实现
                            });
                        }
                    } catch (error) {
                        // 忽略读取错误的文件
                        continue;
                    }
                } else {
                    results.push({
                        path: item.path,
                        size: item.size,
                        modified: item.modified
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    matchPattern(filename, pattern) {
        // 简单的通配符匹配实现
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(filename);
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Filesystem MCP Server running on stdio');
    }
}

// 启动服务器
if (require.main === module) {
    const server = new FilesystemMCPServer();
    server.run().catch(console.error);
}

module.exports = FilesystemMCPServer;