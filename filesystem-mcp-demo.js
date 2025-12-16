#!/usr/bin/env node

/**
 * Filesystem MCP Server Demo
 * 演示如何使用文件系统MCP服务器
 */

const path = require('path');
const fs = require('fs').promises;

class FilesystemMCPDemo {
    constructor() {
        this.testDir = path.join(__dirname, 'mcp-test-files');
        this.demoFiles = [];
    }

    async runDemo() {
        console.log('🚀 Filesystem MCP Server Demo\n');

        try {
            // 准备测试环境
            await this.setupTestEnvironment();

            // 演示各种操作
            await this.demoBasicOperations();
            await this.demoDirectoryOperations();
            await this.demoSearchOperations();
            await this.demoFileOperations();
            
            console.log('\n✅ Demo completed successfully!');
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        } finally {
            // 清理测试环境
            await this.cleanup();
        }
    }

    async setupTestEnvironment() {
        console.log('📁 Setting up test environment...');
        
        try {
            await fs.mkdir(this.testDir, { recursive: true });
            
            // 创建测试文件
            const testFiles = [
                { name: 'hello.txt', content: 'Hello, World!' },
                { name: 'config.json', content: '{"name": "demo", "version": "1.0.0"}' },
                { name: 'script.js', content: 'console.log("Hello from script!");' },
                { name: 'readme.md', content: '# Demo File\nThis is a demo file for testing.' }
            ];

            for (const file of testFiles) {
                const filePath = path.join(this.testDir, file.name);
                await fs.writeFile(filePath, file.content, 'utf-8');
                this.demoFiles.push(filePath);
            }

            // 创建子目录和文件
            const subDir = path.join(this.testDir, 'subdirectory');
            await fs.mkdir(subDir, { recursive: true });
            
            const subFile = path.join(subDir, 'nested.txt');
            await fs.writeFile(subFile, 'Nested file content', 'utf-8');
            this.demoFiles.push(subFile);

            console.log(`✅ Created test directory: ${this.testDir}`);
            console.log(`📄 Created ${this.demoFiles.length} test files\n`);
        } catch (error) {
            throw new Error(`Setup failed: ${error.message}`);
        }
    }

    async demoBasicOperations() {
        console.log('🔧 Demo: Basic File Operations\n');

        // 模拟MCP调用 - 读取文件
        console.log('1. Reading a file:');
        const filePath = this.demoFiles[0]; // hello.txt
        console.log(`   Path: ${filePath}`);
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            console.log(`   Content: "${content}"`);
            console.log('   ✅ Read operation successful\n');
        } catch (error) {
            console.log(`   ❌ Read failed: ${error.message}\n`);
        }

        // 模拟MCP调用 - 获取文件信息
        console.log('2. Getting file information:');
        try {
            const stats = await fs.stat(filePath);
            console.log(`   Size: ${stats.size} bytes`);
            console.log(`   Type: ${stats.isDirectory() ? 'directory' : 'file'}`);
            console.log(`   Modified: ${stats.mtime}`);
            console.log('   ✅ File info retrieved\n');
        } catch (error) {
            console.log(`   ❌ Get info failed: ${error.message}\n`);
        }

        // 模拟MCP调用 - 写入文件
        console.log('3. Writing to a file:');
        const newFilePath = path.join(this.testDir, 'new-file.txt');
        const newContent = 'This is a newly created file by the demo!';
        
        try {
            await fs.writeFile(newFilePath, newContent, 'utf-8');
            console.log(`   Path: ${newFilePath}`);
            console.log(`   Content: "${newContent}"`);
            console.log('   ✅ Write operation successful\n');
            
            // 清理
            await fs.unlink(newFilePath);
        } catch (error) {
            console.log(`   ❌ Write failed: ${error.message}\n`);
        }
    }

    async demoDirectoryOperations() {
        console.log('📂 Demo: Directory Operations\n');

        // 列出目录内容
        console.log('1. Listing directory contents:');
        console.log(`   Directory: ${this.testDir}`);
        
        try {
            const items = await fs.readdir(this.testDir, { withFileTypes: true });
            console.log('   Contents:');
            
            for (const item of items) {
                const itemPath = path.join(this.testDir, item.name);
                const stats = await fs.stat(itemPath);
                const type = stats.isDirectory() ? 'DIR' : 'FILE';
                console.log(`   - ${item.name} (${type})`);
            }
            
            console.log('   ✅ Directory listing successful\n');
        } catch (error) {
            console.log(`   ❌ Listing failed: ${error.message}\n`);
        }

        // 创建新目录
        console.log('2. Creating a new directory:');
        const newDir = path.join(this.testDir, 'new-directory');
        
        try {
            await fs.mkdir(newDir, { recursive: true });
            console.log(`   Path: ${newDir}`);
            console.log('   ✅ Directory created successfully\n');
            
            // 清理
            await fs.rmdir(newDir);
        } catch (error) {
            console.log(`   ❌ Directory creation failed: ${error.message}\n`);
        }
    }

    async demoSearchOperations() {
        console.log('🔍 Demo: Search Operations\n');

        // 搜索JavaScript文件
        console.log('1. Searching for JavaScript files:');
        console.log(`   Directory: ${this.testDir}`);
        console.log('   Pattern: *.js');
        
        try {
            const allFiles = await this.getAllFiles(this.testDir);
            const jsFiles = allFiles.filter(file => file.endsWith('.js'));
            
            console.log('   Results:');
            jsFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
            console.log(`   Found ${jsFiles.length} JavaScript files\n`);
        } catch (error) {
            console.log(`   ❌ Search failed: ${error.message}\n`);
        }

        // 搜索包含特定内容的文件
        console.log('2. Searching files containing "Hello":');
        try {
            const allFiles = await this.getAllFiles(this.testDir);
            const matchingFiles = [];
            
            for (const file of allFiles) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    if (content.toLowerCase().includes('hello')) {
                        const stats = await fs.stat(file);
                        matchingFiles.push({
                            path: file,
                            size: stats.size,
                            modified: stats.mtime
                        });
                    }
                } catch (error) {
                    // 忽略读取失败的文件
                }
            }
            
            console.log('   Results:');
            matchingFiles.forEach(file => {
                console.log(`   - ${file.path} (${file.size} bytes)`);
            });
            console.log(`   Found ${matchingFiles.length} matching files\n`);
        } catch (error) {
            console.log(`   ❌ Content search failed: ${error.message}\n`);
        }
    }

    async demoFileOperations() {
        console.log('📋 Demo: Advanced File Operations\n');

        // 复制文件
        console.log('1. Copying a file:');
        const sourceFile = this.demoFiles[0]; // hello.txt
        const copyFile = path.join(this.testDir, 'hello-copy.txt');
        
        try {
            await fs.copyFile(sourceFile, copyFile);
            console.log(`   Source: ${sourceFile}`);
            console.log(`   Destination: ${copyFile}`);
            console.log('   ✅ File copied successfully');
            
            // 验证复制
            const originalContent = await fs.readFile(sourceFile, 'utf-8');
            const copiedContent = await fs.readFile(copyFile, 'utf-8');
            console.log(`   Verification: ${originalContent === copiedContent ? '✅' : '❌'}\n`);
            
            // 清理
            await fs.unlink(copyFile);
        } catch (error) {
            console.log(`   ❌ Copy failed: ${error.message}\n`);
        }

        // 重命名文件
        console.log('2. Renaming a file:');
        const renameFile = path.join(this.testDir, 'temp-rename.txt');
        const originalFile = this.demoFiles[1]; // config.json
        
        try {
            // 先创建一个临时文件用于重命名演示
            await fs.copyFile(originalFile, renameFile);
            
            const renamedFile = path.join(this.testDir, 'renamed-config.json');
            await fs.rename(renameFile, renamedFile);
            
            console.log(`   Original: ${renameFile}`);
            console.log(`   Renamed: ${renamedFile}`);
            console.log('   ✅ File renamed successfully\n');
            
            // 清理
            await fs.unlink(renamedFile);
        } catch (error) {
            console.log(`   ❌ Rename failed: ${error.message}\n`);
        }

        // 递归列出所有文件
        console.log('3. Recursive directory listing:');
        try {
            const allFiles = await this.getAllFiles(this.testDir);
            console.log(`   Total files: ${allFiles.length}`);
            console.log('   File tree:');
            
            const fileTree = this.buildFileTree(this.testDir, allFiles);
            console.log(this.formatFileTree(fileTree, 1));
        } catch (error) {
            console.log(`   ❌ Recursive listing failed: ${error.message}\n`);
        }
    }

    // 辅助方法
    async getAllFiles(dirPath) {
        const files = [];
        
        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    const subFiles = await this.getAllFiles(itemPath);
                    files.push(...subFiles);
                } else {
                    files.push(itemPath);
                }
            }
        } catch (error) {
            // 忽略无法访问的目录
        }
        
        return files;
    }

    buildFileTree(rootDir, files) {
        const tree = {};
        
        for (const file of files) {
            const relativePath = path.relative(rootDir, file);
            const parts = relativePath.split(path.sep);
            
            let current = tree;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;
                
                if (!current[part]) {
                    current[part] = isLast ? 'FILE' : {};
                }
                
                current = current[part];
            }
        }
        
        return tree;
    }

    formatFileTree(tree, indent = 0) {
        let result = '';
        const spaces = '  '.repeat(indent);
        
        const entries = Object.entries(tree);
        for (const [name, value] of entries) {
            if (value === 'FILE') {
                result += `${spaces}📄 ${name}\n`;
            } else {
                result += `${spaces}📁 ${name}/\n`;
                result += this.formatFileTree(value, indent + 1);
            }
        }
        
        return result;
    }

    async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        
        try {
            // 递归删除测试目录
            await this.deleteDirectory(this.testDir);
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.log(`❌ Cleanup failed: ${error.message}`);
        }
    }

    async deleteDirectory(dirPath) {
        try {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    await this.deleteDirectory(itemPath);
                } else {
                    await fs.unlink(itemPath);
                }
            }
            
            await fs.rmdir(dirPath);
        } catch (error) {
            // 忽略不存在的目录
        }
    }
}

// 运行演示
if (require.main === module) {
    const demo = new FilesystemMCPDemo();
    demo.runDemo();
}

module.exports = FilesystemMCPDemo;