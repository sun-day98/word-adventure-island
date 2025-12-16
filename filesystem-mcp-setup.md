# Filesystem MCP Server 设置指南

## 概述

Filesystem MCP Server 是一个为AI助手提供安全文件系统操作的MCP（Model Context Protocol）服务器。它允许AI助手执行各种文件操作，同时确保安全性。

## 功能特性

### 🗂️ 基本文件操作
- **读取文件**: `read_file` - 读取文件内容
- **写入文件**: `write_file` - 创建或修改文件
- **复制文件**: `copy_file` - 复制文件到新位置
- **移动文件**: `move_file` - 移动或重命名文件
- **删除文件**: `delete_file` - 删除文件或目录

### 📁 目录管理
- **列出目录**: `list_directory` - 浏览目录内容
- **创建目录**: `create_directory` - 创建新目录
- **获取信息**: `get_file_info` - 获取文件/目录详细信息

### 🔍 搜索功能
- **搜索文件**: `search_files` - 按名称或内容搜索
- **模式匹配**: 支持通配符和正则表达式
- **递归搜索**: 支持深度目录搜索

### ⚙️ 系统功能
- **工作目录**: `get_working_directory` - 获取系统路径信息
- **文件监听**: `watch_file` - 监控文件变化

## 安装和配置

### 1. 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn
- 有效的文件系统权限

### 2. 安装依赖
```bash
# 安装MCP SDK
npm install @modelcontextprotocol/sdk

# 或使用yarn
yarn add @modelcontextprotocol/sdk
```

### 3. 配置MCP服务器

#### 方法一：在Claude Desktop中配置
编辑 `claude_desktop_config.json` 文件：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["c:/Users/Administrator/CodeBuddy/20251205164818/filesystem-mcp-server.js"],
      "env": {
        "NODE_ENV": "production",
        "FS_ALLOWED_PATHS": "c:/Users/Administrator/CodeBuddy,c:/Users/Administrator/Documents,c:/temp"
      }
    }
  }
}
```

#### 方法二：使用提供的配置文件
复制 `filesystem-mcp-config.json` 到您的MCP配置目录。

### 4. 环境变量设置
```bash
# Windows (PowerShell)
$env:FS_ALLOWED_PATHS = "c:/Users/Administrator/CodeBuddy,c:/Users/Administrator/Documents"

# Linux/macOS
export FS_ALLOWED_PATHS="/home/user/documents,/tmp"
```

## 安全配置

### 路径限制
服务器默认只允许访问以下路径：
- 当前工作目录
- 用户主目录
- 临时目录

您可以通过环境变量 `FS_ALLOWED_PATHS` 自定义允许访问的路径：

```json
{
  "env": {
    "FS_ALLOWED_PATHS": "c:/safe/path1,d:/safe/path2,/safe/unix/path"
  }
}
```

### 安全特性
- **路径验证**: 防止路径遍历攻击
- **权限检查**: 验证文件访问权限
- **操作限制**: 禁止危险操作
- **错误处理**: 安全的错误信息返回

## API 使用示例

### 读取文件
```javascript
// 使用MCP调用工具
await mcp_call_tool('filesystem', 'read_file', {
  path: 'c:/Users/Administrator/CodeBuddy/20251205164818/package.json',
  encoding: 'utf-8'
});
```

### 写入文件
```javascript
await mcp_call_tool('filesystem', 'write_file', {
  path: 'c:/temp/example.txt',
  content: 'Hello, World!',
  createDirs: true
});
```

### 列出目录
```javascript
await mcp_call_tool('filesystem', 'list_directory', {
  path: 'c:/Users/Administrator/CodeBuddy/20251205164818',
  recursive: false,
  showHidden: false,
  pattern: '*.js'
});
```

### 搜索文件
```javascript
await mcp_call_tool('filesystem', 'search_files', {
  directory: 'c:/Users/Administrator/CodeBuddy/20251205164818',
  pattern: '*.js',
  content: 'function',
  caseSensitive: false,
  maxResults: 20
});
```

## 高级用法

### 批量操作
```javascript
// 批量读取配置文件
const configFiles = [
  'config.json',
  'package.json', 
  '.env.example'
];

const configs = await Promise.all(
  configFiles.map(file => 
    mcp_call_tool('filesystem', 'read_file', { path: file })
  )
);
```

### 文件监控
```javascript
// 监控文件变化
const watcher = await mcp_call_tool('filesystem', 'watch_file', {
  path: 'c:/Users/Administrator/CodeBuddy/20251205164818/package.json',
  events: ['change', 'rename']
});

console.log('Watcher ID:', watcher.watcherId);
```

### 递归搜索
```javascript
// 在项目中搜索所有包含"TODO"的文件
const todoResults = await mcp_call_tool('filesystem', 'search_files', {
  directory: 'c:/Users/Administrator/CodeBuddy/20251205164818',
  content: 'TODO',
  recursive: true,
  maxResults: 50
});
```

## 故障排除

### 常见问题

#### 1. 服务器启动失败
**症状**: 无法连接到MCP服务器
**解决方案**:
- 检查Node.js版本
- 验证文件路径
- 查看错误日志

#### 2. 权限被拒绝
**症状**: "Path access denied" 错误
**解决方案**:
- 检查 `FS_ALLOWED_PATHS` 配置
- 确认文件系统权限
- 验证路径格式

#### 3. 文件不存在
**症状**: "ENOENT" 错误
**解决方案**:
- 使用 `createDirs: true` 选项
- 检查路径拼写
- 使用绝对路径

#### 4. 编码问题
**症状**: 乱码或读取失败
**解决方案**:
- 指定正确的编码格式
- 检查文件实际编码
- 使用二进制模式

### 调试模式
启用详细日志输出：
```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "filesystem:*"
  }
}
```

### 性能优化
- 限制搜索结果数量
- 使用适当的递归深度
- 避免大文件操作
- 合理使用缓存

## 配置参考

### 完整配置示例
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["c:/path/to/filesystem-mcp-server.js"],
      "env": {
        "NODE_ENV": "production",
        "FS_ALLOWED_PATHS": "c:/Users/Administrator/CodeBuddy,c:/temp",
        "FS_MAX_FILE_SIZE": "10485760",
        "FS_MAX_SEARCH_RESULTS": "100",
        "DEBUG": "false"
      },
      "timeout": 30000,
      "retries": 3
    }
  }
}
```

### 环境变量列表
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `FS_ALLOWED_PATHS` | 允许访问的路径 | 当前目录,主目录,临时目录 |
| `FS_MAX_FILE_SIZE` | 最大文件大小（字节） | 10MB |
| `FS_MAX_SEARCH_RESULTS` | 最大搜索结果数 | 50 |
| `NODE_ENV` | 运行环境 | production |
| `DEBUG` | 调试模式 | false |

## 更新和维护

### 版本更新
```bash
# 更新依赖
npm update @modelcontextprotocol/sdk

# 检查新版本
npm outdated
```

### 备份配置
```bash
# 备份配置文件
cp filesystem-mcp-config.json filesystem-mcp-config.backup.json
```

### 日志管理
```bash
# 查看日志
tail -f ~/.mcp/filesystem.log

# 清理日志
rm ~/.mcp/filesystem.log
```

## 扩展开发

### 添加新工具
```javascript
// 在filesystem-mcp-server.js中添加新工具
{
    name: 'custom_tool',
    description: '自定义工具',
    inputSchema: {
        type: 'object',
        properties: {
            // 参数定义
        }
    }
}
```

### 自定义安全检查
```javascript
// 扩展安全检查逻辑
isPathSafe(filePath) {
    // 自定义安全逻辑
    return true; // 或 false
}
```

## 支持和社区

- GitHub Issues: 报告问题和功能请求
- 文档: 详细API文档和示例
- 社区: 用户讨论和经验分享

## 许可证

MIT License - 详见 LICENSE 文件

---

*本指南将随着功能更新持续完善，如有问题请提交Issue或联系维护者。*