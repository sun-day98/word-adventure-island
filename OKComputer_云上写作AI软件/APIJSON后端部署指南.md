# APIJSON后端部署指南

## 📋 概述

本指南详细说明如何部署基于APIJSON框架的AI写作软件后端服务。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │  APIJSON后端    │    │   MySQL数据库   │
│   (HTTP/HTTPS)  │◄──►│  服务器         │◄──►│   (存储数据)    │
│   端口: 8000    │    │   端口: 3000    │    │   端口: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户认证      │    │   APIJSON ORM   │    │   数据持久化    │
│   JWT Token     │    │   通用接口      │    │   事务管理      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 环境要求

### 最低配置
- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **MySQL**: >= 5.7.0
- **内存**: >= 512MB
- **磁盘**: >= 1GB

### 推荐配置
- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0.0
- **内存**: >= 2GB
- **磁盘**: >= 5GB
- **Redis**: >= 6.0 (可选，用于缓存)

## 🚀 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd OKComputer_云上写作AI软件
```

### 2. 安装后端依赖

```bash
cd backend
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**必须配置的变量：**
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_writing_db

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-here
MD5_KEY=your-md5-secret-key-here
PASSWORD_SALT=your-password-salt-here

# 服务器配置
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-domain.com
```

### 4. 创建数据库

```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE ai_writing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（可选）
CREATE USER 'ai_writing'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ai_writing_db.* TO 'ai_writing'@'localhost';
FLUSH PRIVILEGES;
```

### 5. 初始化数据库表

```bash
# 启动服务会自动创建表结构
npm start
```

或手动执行：

```bash
node -e "
const { createDatabaseConnection } = require('./config/database');
const fs = require('fs');

async function initDB() {
  const connection = await createDatabaseConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  // 执行建表SQL
  const sql = fs.readFileSync('./database/init.sql', 'utf8');
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      await connection.execute(statement);
    }
  }
  
  console.log('✅ 数据库表初始化完成');
  await connection.end();
}

initDB().catch(console.error);
"
```

### 6. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 7. 验证部署

```bash
# 健康检查
curl http://localhost:3000/health

# API信息
curl http://localhost:3000/api/info

# APIJSON文档
curl http://localhost:3000/v1/doc
```

## 🐳 Docker部署

### 1. 创建Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动服务
CMD ["npm", "start"]
```

### 2. 创建docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
      MYSQL_DATABASE: ai_writing_db
      MYSQL_USER: ai_writing
      MYSQL_PASSWORD: your_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ai_writing
      DB_PASSWORD: your_password
      DB_NAME: ai_writing_db
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: your-super-secret-jwt-key
      MD5_KEY: your-md5-secret-key
      PASSWORD_SALT: your-password-salt
      ALLOWED_ORIGINS: https://your-domain.com
    depends_on:
      - mysql
      - redis
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads

  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

volumes:
  mysql_data:
  redis_data:
```

### 3. 部署到Docker

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

## 🌐 Nginx配置

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json application/xml;

    # 上游后端服务器
    upstream backend {
        server backend:3000;
    }

    # HTTP服务器（重定向到HTTPS）
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL证书配置
        ssl_certificate /path/to/your/certificate.crt;
        ssl_certificate_key /path/to/your/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
            
            # 缓存静态资源
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API接口代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # APIJSON接口代理
        location /v1/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 健康检查
        location /health {
            proxy_pass http://backend;
        }

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    }
}
```

## 🔒 安全配置

### 1. 数据库安全

```sql
-- 创建专用数据库用户
CREATE USER 'ai_writing'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_writing_db.* TO 'ai_writing'@'localhost';

-- 限制连接
ALTER USER 'ai_writing'@'localhost' WITH MAX_QUERIES_PER_HOUR 1000;
ALTER USER 'ai_writing'@'localhost' WITH MAX_CONNECTIONS_PER_HOUR 100;
```

### 2. 应用安全

```bash
# 设置文件权限
chmod 600 .env
chmod 755 .
chmod 644 logs/*.log

# 使用非root用户运行
useradd -m -s /bin/bash aiwriting
chown -R aiwriting:aiwriting /path/to/project
sudo -u aiwriting npm start
```

### 3. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📊 监控与日志

### 1. 日志管理

```bash
# 日志轮转配置
cat > /etc/logrotate.d/ai-writing << EOF
/path/to/project/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        systemctl reload ai-writing
    endscript
}
EOF
```

### 2. 系统监控

```bash
# 创建systemd服务文件
sudo cat > /etc/systemd/system/ai-writing.service << EOF
[Unit]
Description=AI Writing Backend Service
After=network.target mysql.service

[Service]
Type=simple
User=aiwriting
WorkingDirectory=/path/to/project/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=ai-writing

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable ai-writing
sudo systemctl start ai-writing
sudo systemctl status ai-writing
```

### 3. 性能监控

```javascript
// 添加性能监控中间件
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn(`慢请求: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});
```

## 🔄 更新与维护

### 1. 应用更新

```bash
#!/bin/bash
# update.sh - 更新脚本

echo "开始更新AI写作后端..."

# 备份当前版本
cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S)

# 拉取最新代码
git pull origin main

# 安装新依赖
cd backend
npm install

# 运行数据库迁移（如果有）
npm run migrate

# 重启服务
sudo systemctl restart ai-writing

echo "更新完成！"
```

### 2. 数据备份

```bash
#!/bin/bash
# backup.sh - 数据备份脚本

BACKUP_DIR="/backup/ai-writing"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u ai_writing -p ai_writing_db > $BACKUP_DIR/database_$DATE.sql

# 备份应用数据
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz backend/uploads/

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
```

### 3. 定时任务

```bash
# 添加crontab任务
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/project/backup.sh

# 每周一凌晨3点更新
0 3 * * 1 /path/to/project/update.sh

# 每小时检查服务状态
0 * * * * systemctl is-active ai-writing || systemctl restart ai-writing
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查MySQL服务
   systemctl status mysql
   
   # 测试连接
   mysql -u ai_writing -p ai_writing_db
   
   # 查看错误日志
   tail -f backend/logs/error.log
   ```

2. **端口占用**
   ```bash
   # 查看端口占用
   netstat -tlnp | grep 3000
   
   # 杀死进程
   kill -9 <PID>
   ```

3. **内存不足**
   ```bash
   # 查看内存使用
   free -h
   
   # 查看Node.js进程内存
   ps aux | grep node
   
   # 优化内存（增加swap）
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **权限问题**
   ```bash
   # 修复文件权限
   chown -R aiwriting:aiwriting /path/to/project
   chmod -R 755 /path/to/project
   chmod 600 /path/to/project/.env
   ```

## 📞 技术支持

- **文档**: [APIJSON官方文档](https://github.com/Tencent/APIJSON)
- **社区**: [GitHub Issues](https://github.com/Tencent/APIJSON/issues)
- **邮件**: support@your-domain.com

---

🎉 **恭喜！您的APIJSON后端已成功部署！**

如遇到问题，请参考故障排除章节或联系技术支持。