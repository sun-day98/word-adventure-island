# Brave Search API密钥配置指南

## 📋 获取API密钥步骤

### 1. 注册Brave账户
1. 访问 [Brave Search API](https://brave.com/search/api/)
2. 点击 "Get started" 或 "Sign up"
3. 使用邮箱注册新账户
4. 验证邮箱地址

### 2. 创建API密钥
1. 登录后进入 [API控制台](https://api.search.brave.com/)
2. 点击 "API Keys" 标签页
3. 点击 "Create new key" 按钮
4. 给密钥起一个描述性名称（如 "MCP-Server"）
5. 选择配额计划（免费或付费）
6. 复制生成的API密钥

### 3. 查看配额信息
- **免费计划**: 每月2,000次搜索
- **请求限制**: 每秒100次请求
- **搜索类型**: 支持web、news、images、videos

## 🔧 配置API密钥

### 方法一：环境变量（推荐）

#### Windows (PowerShell)
```powershell
# 临时设置（当前会话）
$env:BRAVE_API_KEY = "your_actual_api_key_here"

# 永久设置
[System.Environment]::SetEnvironmentVariable('BRAVE_API_KEY', 'your_actual_api_key_here', 'User')
```

#### Windows (CMD)
```cmd
# 临时设置
set BRAVE_API_KEY=your_actual_api_key_here

# 永久设置（需要管理员权限）
setx BRAVE_API_KEY "your_actual_api_key_here"
```

#### Linux/macOS
```bash
# 临时设置
export BRAVE_API_KEY="your_actual_api_key_here"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export BRAVE_API_KEY="your_actual_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

### 方法二：.env文件

1. 创建 `.env` 文件：
```bash
echo "BRAVE_API_KEY=your_actual_api_key_here" > .env
```

2. 使用 `dotenv` 加载（需要安装 `npm install dotenv`）

### 方法三：MCP配置文件

在 `claude_desktop_config.json` 中配置：
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["c:/path/to/brave-search-mcp-server.js"],
      "env": {
        "BRAVE_API_KEY": "your_actual_api_key_here"
      }
    }
  }
}
```

### 方法四：命令行参数

```bash
# 直接设置环境变量运行
BRAVE_API_KEY=your_key_here node brave-search-mcp-server.js

# 在Windows PowerShell中
$env:BRAVE_API_KEY="your_key_here"; node brave-search-mcp-server.js
```

## 🧪 验证配置

### 1. 检查环境变量
```bash
# Windows
echo %BRAVE_API_KEY%

# Linux/macOS
echo $BRAVE_API_KEY

# PowerShell
$env:BRAVE_API_KEY
```

### 2. 运行演示脚本
```bash
node brave-search-demo.js
```

### 3. 测试API连接
```bash
# 使用curl测试
curl -H "X-Subscription-Token: your_api_key" \
     "https://api.search.brave.com/res/v1/web/search?q=test"
```

## 🔒 安全注意事项

### 1. 保护API密钥
- ❌ 不要在代码中硬编码密钥
- ❌ 不要提交到版本控制系统
- ✅ 使用环境变量
- ✅ 使用密钥管理服务
- ✅ 定期轮换密钥

### 2. 访问控制
- 限制API密钥的使用范围
- 监控API使用情况
- 设置使用配额和警报

### 3. 文件权限
```bash
# 设置.env文件权限（仅当前用户可读写）
chmod 600 .env
```

## 📊 监控使用情况

### 1. API控制台
- 登录 [Brave API控制台](https://api.search.brave.com/)
- 查看"Usage"或"Analytics"页面
- 监控请求次数和错误率

### 2. 本地日志
```javascript
// 在代码中添加使用统计
const usageLog = {
  timestamp: new Date().toISOString(),
  endpoint: endpoint,
  query: query,
  responseTime: responseTime
};

console.log('API Usage:', JSON.stringify(usageLog));
```

## 🔧 故障排除

### 常见错误

#### 1. "Invalid API key"
- 检查密钥是否正确复制
- 确认密钥没有过期
- 验证环境变量设置

#### 2. "Rate limit exceeded"
- 减少请求频率
- 实现请求缓存
- 升级API计划

#### 3. "Request timeout"
- 检查网络连接
- 增加超时时间
- 验证防火墙设置

### 调试模式
启用详细日志：
```bash
# 设置调试环境变量
export DEBUG=true
export BRAVE_API_DEBUG=true

# 运行服务器
node brave-search-mcp-server.js
```

## 📝 示例配置

### 开发环境
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["./brave-search-mcp-server.js"],
      "env": {
        "BRAVE_API_KEY": "your_dev_key_here",
        "NODE_ENV": "development",
        "DEBUG": "true"
      }
    }
  }
}
```

### 生产环境
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["./brave-search-mcp-server.js"],
      "env": {
        "BRAVE_API_KEY": "your_prod_key_here",
        "NODE_ENV": "production",
        "BRAVE_SEARCH_TIMEOUT": "10000"
      }
    }
  }
}
```

## 🚀 快速开始脚本

创建 `setup-brave-api.sh`（Linux/macOS）或 `setup-brave-api.bat`（Windows）：

### setup-brave-api.bat
```batch
@echo off
echo ========================================
echo Brave Search API 密钥配置
echo ========================================
echo.

set /p API_KEY="请输入您的Brave Search API密钥: "

if "%API_KEY%"=="" (
    echo 错误: API密钥不能为空
    pause
    exit /b 1
)

echo 设置环境变量...
setx BRAVE_API_KEY "%API_KEY%"

echo 验证配置...
echo %BRAVE_API_KEY%

echo.
echo ✅ API密钥配置完成！
echo 请重启终端以使环境变量生效
pause
```

### setup-brave-api.sh
```bash
#!/bin/bash
echo "========================================"
echo "Brave Search API 密钥配置"
echo "========================================"
echo

read -p "请输入您的Brave Search API密钥: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "错误: API密钥不能为空"
    exit 1
fi

echo "设置环境变量..."
echo "export BRAVE_API_KEY=\"$API_KEY\"" >> ~/.bashrc

echo "验证配置..."
source ~/.bashrc
echo $BRAVE_API_KEY

echo
echo "✅ API密钥配置完成！"
echo "请运行 'source ~/.bashrc' 或重新打开终端"
```

## 📞 支持和帮助

### 官方资源
- [Brave Search API文档](https://brave.com/search/api/documentation/)
- [API状态页面](https://status.brave.com/)
- [Brave社区论坛](https://community.brave.com/)

### 常用链接
- 获取API密钥: https://brave.com/search/api/
- API控制台: https://api.search.brave.com/
- 开发者文档: https://brave.com/search/api/documentation/

---

*配置完成后，您就可以使用Brave Search MCP Server进行网络搜索了！*