# 单词冒险岛 - 部署指南

## 🚀 快速部署到服务器

### 方案一：GitHub Pages（推荐，免费）

#### 步骤1：创建GitHub仓库
1. 访问 [GitHub](https://github.com) 创建新仓库
2. 仓库名：`word-adventure-island`
3. 设置为公开仓库

#### 步骤2：上传代码
```bash
# 初始化本地仓库
git init
git add .
git commit -m "初始化单词冒险岛项目"

# 关联远程仓库
git remote add origin https://github.com/你的用户名/word-adventure-island.git
git branch -M main
git push -u origin main
```

#### 步骤3：启用GitHub Pages
1. 进入仓库设置 Settings
2. 找到 Pages 选项
3. Source 选择 "Deploy from a branch"
4. Branch 选择 "main"，文件夹选择 "/(root)"
5. 点击 Save

#### 步骤4：访问网站
等待几分钟后，通过以下地址访问：
`https://你的用户名.github.io/word-adventure-island/`

---

### 方案二：Netlify（推荐，功能更丰富）

#### 步骤1：拖拽部署
1. 访问 [Netlify](https://netlify.com)
2. 注册账号
3. 将项目文件夹直接拖拽到部署区域

#### 步骤2：自定义域名（可选）
- 自动获得 `xxx.netlify.app` 域名
- 可绑定自定义域名

---

### 方案三：Vercel（适合React项目）

#### 步骤1：导入项目
1. 访问 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入GitHub仓库或直接上传

#### 步骤2：配置项目
- Framework Preset: "Other"
- Build Command: 留空
- Output Directory: 留空

---

### 方案四：自己的服务器

#### 步骤1：准备服务器
需要支持静态文件托管的服务器（Nginx、Apache等）

#### 步骤2：上传文件
```bash
# 使用scp上传
scp -r /path/to/project/* user@your-server:/var/www/html/

# 或使用FTP工具上传所有文件到网站根目录
```

#### 步骤3：配置Web服务器

**Nginx配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache配置示例：**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>
    
    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
    </Location>
</VirtualHost>
```

---

## 🛠️ 部署前检查清单

### 文件结构确认
```
project/
├── index.html          # 主入口文件
├── adventure-home.html # 冒险主页
├── challenge.html      # 挑战页面
├── word-book.html     # 单词图鉴
├── challenges.html    # 挑战列表
├── css/               # 样式文件
│   ├── word-adventure.css
│   └── styles.css
├── js/                # JavaScript文件
│   ├── word-adventure-data.js
│   ├── word-adventure-engine.js
│   ├── word-adventure-ui.js
│   └── app.js
├── assets/            # 静态资源
└── README.md          # 说明文档
```

### 优化建议
1. **启用Gzip压缩**：减少文件传输大小
2. **设置缓存策略**：提高加载速度
3. **使用HTTPS**：确保安全性
4. **配置CDN**：加速静态资源访问

### 测试检查
- [ ] 所有页面都能正常访问
- [ ] 图片和样式文件正常加载
- [ ] JavaScript功能正常工作
- [ ] 移动端响应式正常
- [ ] 语音识别功能（需要HTTPS）

---

## 🔧 常见问题解决

### 1. 404错误
检查文件路径是否正确，确保所有文件都已上传

### 2. 样式丢失
检查CSS文件路径，使用相对路径

### 3. 功能异常
检查浏览器控制台是否有JavaScript错误

### 4. 语音识别不工作
确保使用HTTPS协议，语音识别需要安全连接

---

## 📱 移动端优化

如果需要更好的移动端体验，可以考虑：

### 1. PWA配置
添加 `manifest.json` 文件：
```json
{
  "name": "单词冒险岛",
  "short_name": "单词冒险",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#6B46C1",
  "theme_color": "#6B46C1",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Service Worker
添加离线功能支持

---

选择最适合你的部署方案，推荐从GitHub Pages开始，简单快捷且完全免费！