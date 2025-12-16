# Windows系统部署指南

## 🪟 Windows环境快速部署

### 🚀 快速开始（Windows版本）

#### 1. 打开命令提示符

按 `Win + R`，输入 `cmd`，按回车键打开命令提示符。

#### 2. 导航到项目目录

```cmd
cd C:\Users\Administrator\CodeBuddy\20251205164818\OKComputer_云上写作AI软件
```

#### 3. 进入后端目录

```cmd
cd backend
```

#### 4. 安装依赖

```cmd
npm install
```

#### 5. 配置环境变量

```cmd
rem 复制环境变量模板（Windows使用copy命令）
copy .env.example .env

rem 使用记事本编辑配置文件
notepad .env
```

#### 6. 编辑.env文件内容

在记事本中，将以下内容替换为您的实际配置：

```env
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=ai_writing_db

# APIJSON配置
MD5_KEY=your-md5-secret-key-here
PASSWORD_SALT=your-password-salt-here
JWT_SECRET=your-jwt-secret-key-here

# 安全配置
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

保存文件并关闭记事本。

#### 7. 安装和配置MySQL（如果还没有）

##### 方法1：使用XAMPP（推荐）

1. 下载 [XAMPP](https://www.apachefriends.org/zh_cn/download.html)
2. 安装后，启动XAMPP控制面板
3. 启动MySQL和Apache服务

##### 方法2：单独安装MySQL

1. 下载 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
2. 安装时记住root密码
3. 启动MySQL服务

#### 8. 创建数据库

```cmd
rem 登录MySQL（在MySQL的bin目录下执行）
cd C:\xampp\mysql\bin
mysql -u root -p
```

在MySQL命令行中执行：

```sql
CREATE DATABASE ai_writing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 9. 启动后端服务

```cmd
rem 在backend目录下执行
node index.js
```

或者使用npm：

```cmd
npm start
```

### 🐳 Docker部署（Windows）

#### 1. 安装Docker Desktop

下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

#### 2. 使用PowerShell执行部署

```powershell
# 切换到项目根目录
cd C:\Users\Administrator\CodeBuddy\20251205164818\OKComputer_云上写作AI软件

# 使用Docker Compose一键部署
docker-compose up -d
```

### 🌐 启动前端

在新的命令提示符窗口中：

```cmd
cd C:\Users\Administrator\CodeBuddy\20251205164818\OKComputer_云上写作AI软件

rem 使用Python启动HTTP服务器
python -m http.server 8000
```

或者使用Node.js：

```cmd
npx http-server -p 8000
```

### 📍 访问应用

- **前端应用**: http://localhost:8000
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/v1/doc
- **健康检查**: http://localhost:3000/health

## 🔧 Windows特定问题解决

### 问题1：'cp'不是内部或外部命令

**原因**: Windows使用`copy`而不是`cp`

**解决**:
```cmd
copy .env.example .env
```

### 问题2：找不到路径

**原因**: 路径中包含中文或空格

**解决**:
```cmd
cd /d "C:\Users\Administrator\CodeBuddy\20251205164818\OKComputer_云上写作AI软件"
```

### 问题3：Node.js版本过低

**检查Node.js版本**:
```cmd
node --version
npm --version
```

**安装最新Node.js**:
- 访问 [Node.js官网](https://nodejs.org/)
- 下载并安装LTS版本

### 问题4：MySQL连接失败

**检查MySQL服务**:
```cmd
rem 如果使用XAMPP
cd C:\xampp
xampp-control.exe

rem 或者检查Windows服务
services.msc
```

### 问题5：端口被占用

**检查端口占用**:
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

**结束占用进程**:
```cmd
taskkill /PID <进程ID> /F
```

## 📋 Windows批处理脚本

创建 `deploy.bat` 文件来自动化部署：

```batch
@echo off
echo ============================================
echo    AI写作软件 Windows 自动部署脚本
echo ============================================

rem 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

rem 检查npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

echo ✅ Node.js 和 npm 检查通过

rem 进入后端目录
cd /d "%~dp0backend"
if %errorlevel% neq 0 (
    echo ❌ 无法进入backend目录
    pause
    exit /b 1
)

echo 📁 当前目录: %CD%

rem 检查package.json
if not exist package.json (
    echo ❌ package.json 文件不存在
    pause
    exit /b 1
)

rem 安装依赖
echo 📦 正在安装依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

rem 配置环境变量
if not exist .env (
    echo ⚙️ 创建环境变量文件...
    copy .env.example .env
    echo 📝 请编辑 .env 文件配置数据库信息
    notepad .env
) else (
    echo ✅ 环境变量文件已存在
)

rem 提示用户启动数据库
echo 📊 请确保MySQL服务已启动
echo 💡 如果使用XAMPP，请启动MySQL服务

rem 询问是否启动服务
set /p start_server="是否现在启动后端服务? (y/n): "
if /i "%start_server%"=="y" (
    echo 🚀 启动后端服务...
    start cmd /k "node index.js"
    echo ✅ 后端服务已启动在端口 3000
)

rem 询问是否启动前端
set /p start_frontend="是否启动前端服务? (y/n): "
if /i "%start_frontend%"=="y" (
    cd /d "%~dp0"
    echo 🌐 启动前端服务...
    start cmd /k "python -m http.server 8000"
    echo ✅ 前端服务已启动在端口 8000
)

echo 🎉 部署完成！
echo 📍 前端地址: http://localhost:8000
echo 📍 后端地址: http://localhost:3000
echo 📍 API文档: http://localhost:3000/v1/doc

pause
```

### 使用批处理脚本

1. 将上述代码保存为 `deploy.bat`
2. 双击运行
3. 按照提示操作

## 🎯 一键启动脚本

创建 `start.bat` 用于快速启动：

```batch
@echo off
echo 🚀 启动AI写作软件...

rem 启动后端
cd /d "%~dp0backend"
start "Backend Server" cmd /k "node index.js"

rem 等待3秒
timeout /t 3 /nobreak >nul

rem 启动前端
cd /d "%~dp0"
start "Frontend Server" cmd /k "python -m http.server 8000"

echo ✅ 服务已启动
echo 📍 前端: http://localhost:8000
echo 📍 后端: http://localhost:3000

rem 自动打开浏览器
timeout /t 5 /nobreak >nul
start http://localhost:8000
```

## 🔍 常用Windows命令

### 文件操作
```cmd
rem 复制文件
copy source.txt destination.txt

rem 删除文件
del file.txt

rem 创建目录
mkdir new_folder

rem 删除目录
rmdir /s folder
```

### 进程管理
```cmd
rem 查看进程
tasklist

rem 结束进程
taskkill /PID 1234 /F
taskkill /IM node.exe /F

rem 查看端口占用
netstat -ano | findstr :3000
```

### 服务管理
```cmd
rem 查看服务列表
services.msc

rem 启动/停止服务（管理员权限）
net start mysql
net stop mysql
```

## 💡 开发建议

1. **使用Windows Terminal**: 更好的终端体验
2. **安装VS Code**: 优秀的代码编辑器
3. **使用PowerShell**: 比cmd更强大的shell
4. **配置环境变量**: 将Node.js和npm添加到PATH

## 🆘 故障排除

### 常见错误及解决方案

1. **npm命令找不到**
   - 重新安装Node.js
   - 检查环境变量PATH

2. **MySQL连接失败**
   - 检查MySQL服务状态
   - 验证用户名和密码
   - 检查防火墙设置

3. **端口冲突**
   - 修改.env中的端口配置
   - 结束占用端口的进程

4. **权限问题**
   - 以管理员身份运行命令提示符
   - 检查文件夹权限设置

---

🎉 **祝您在Windows上部署顺利！**

如有问题，请参考故障排除章节或联系技术支持。