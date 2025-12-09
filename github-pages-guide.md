# GitHub Pages 部署详细步骤

## 🚀 第一步：创建GitHub账号（如果还没有）

1. 访问 [https://github.com](https://github.com)
2. 点击 "Sign up" 注册新账号
3. 填写邮箱、用户名、密码
4. 验证邮箱地址

---

## 📁 第二步：创建新仓库

### 1. 登录GitHub后，点击右上角的"+"号
### 2. 选择 "New repository"

### 3. 填写仓库信息：
- **Repository name**: `word-adventure-island`（建议使用这个名称）
- **Description**（可选）: 单词冒险岛 - 英语学习游戏
- **Public** ✅: 必须选择公开才能使用免费Pages
- **Private**: ❌ 不选（收费才能使用Pages）
- **Add a README file**: ❌ 不选（我们已有自己的README）
- **Add .gitignore**: ❌ 不选
- **Choose a license**: ❌ 不选

### 4. 点击 "Create repository"

---

## 💻 第三步：安装Git（如果本地没有）

### Windows系统：
1. 访问 [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. 下载并安装Git
3. 安装时保持默认设置，一路点击"Next"

### 验证安装：
1. 打开命令提示符（Win+R，输入cmd）
2. 输入：`git --version`
3. 如果显示版本号说明安装成功

---

## 📂 第四步：初始化本地Git仓库

### 1. 打开命令提示符或PowerShell
### 2. 进入项目目录：
```bash
cd "c:/Users/Administrator/CodeBuddy/20251205164818"
```

### 3. 初始化Git仓库：
```bash
git init
```

### 4. 添加所有文件到暂存区：
```bash
git add .
```

### 5. 提交文件：
```bash
git commit -m "初始化单词冒险岛项目"
```

---

## 🔗 第五步：连接本地仓库到GitHub

### 1. 获取仓库地址
- 在GitHub仓库页面，点击绿色的"Code"按钮
- 复制HTTPS地址（类似：`https://github.com/你的用户名/word-adventure-island.git`）

### 2. 在命令行中连接远程仓库：
```bash
git remote add origin https://github.com/你的用户名/word-adventure-island.git
```

### 3. 设置默认分支为main：
```bash
git branch -M main
```

---

## 🚀 第六步：推送代码到GitHub

### 1. 第一次推送：
```bash
git push -u origin main
```

### 2. 如果提示输入用户名和密码：
- **用户名**: 你的GitHub用户名
- **密码**: 不是登录密码，而是Personal Access Token（见下面说明）

---

## 🔑 第七步：创建Personal Access Token（密码认证）

GitHub不再支持密码认证，需要创建Token：

### 1. 在GitHub上：
- 点击右上角头像 → Settings
- 左侧菜单最下方 → Developer settings
- Personal access tokens → Tokens (classic)
- Generate new token → Generate new token (classic)

### 2. 设置Token：
- **Note**: 输入描述，如"Word Adventure Deploy"
- **Expiration**: 选择90天或自定义
- **Scopes**: 勾选 `repo`（全部勾选）

### 3. 生成Token：
- 点击 "Generate token"
- **立即复制Token**（只显示一次，务必保存）

### 4. 使用Token：
- 推送时，用户名输入GitHub用户名
- 密码输入刚才复制的Token

---

## ⚙️ 第八步：启用GitHub Pages

### 1. 在GitHub仓库页面：
- 点击 "Settings" 选项卡

### 2. 找到Pages设置：
- 左侧菜单找到 "Pages"
- 在 "Build and deployment" 部分

### 3. 配置Pages：
- **Source**: 选择 "Deploy from a branch"
- **Branch**: 选择 "main"
- **Folder**: 选择 "/ (root)"
- 点击 "Save"

### 4. 等待部署：
- 等待1-3分钟
- 页面会显示你的网站地址

---

## 🌐 第九步：访问网站

### 网站地址格式：
```
https://你的用户名.github.io/word-adventure-island/
```

### 示例：
如果用户名是 `zhangsan`，地址就是：
```
https://zhangsan.github.io/word-adventure-island/
```

---

## 🔄 第十步：更新网站（后续操作）

### 修改代码后：
```bash
# 添加修改的文件
git add .

# 提交修改
git commit -m "更新描述"

# 推送到GitHub
git push origin main
```

### 自动更新：
- GitHub Pages会自动检测更改
- 1-2分钟后网站自动更新

---

## 🛠️ 常见问题解决

### 问题1：推送时提示认证失败
**解决**：使用Personal Access Token而不是密码

### 问题2：Pages显示404
**解决**：
1. 检查分支设置是否正确
2. 确保仓库是Public
3. 等待几分钟让系统处理

### 问题3：页面显示空白
**解决**：
1. 检查`index.html`是否在根目录
2. 确保文件路径正确
3. 检查浏览器控制台是否有错误

### 问题4：样式加载失败
**解决**：
1. 检查CSS文件路径是否正确
2. 确保所有文件都已推送
3. 使用相对路径而非绝对路径

---

## 📱 移动端优化建议

部署成功后，可以添加PWA功能：

### 1. 添加到主屏幕
- 在手机浏览器打开网站
- 点击"分享"→"添加到主屏幕"

### 2. 启用全屏模式
- 网站会自动适应屏幕
- 获得类似原生App的体验

---

## 🎯 完整检查清单

部署完成后，检查以下项目：

- [ ] 网站能正常访问
- [ ] 首页显示正确
- [ ] 所有导航链接工作正常
- [ ] 游戏功能正常
- [ ] 移动端显示正常
- [ ] 语音识别功能（需要HTTPS）
- [ ] 图片和样式正确加载

---

## 📞 获取帮助

如果在部署过程中遇到问题：

1. **查看GitHub状态**：[https://www.githubstatus.com](https://www.githubstatus.com)
2. **检查仓库设置**：确保Public仓库
3. **查看Pages日志**：在仓库的Actions页面查看部署日志
4. **清理缓存**：强制刷新浏览器（Ctrl+F5）

完成这些步骤后，你的"单词冒险岛"就可以在全球范围内访问了！🎉