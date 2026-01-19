# 警察-村长违章消息系统 部署文档

## 部署环境

- 操作系统: Ubuntu (阿里云)
- 已安装: Docker, Docker Compose
- 域名: api.police.message.creteper.xyz

---

## 一、准备工作

### 1.1 服务器端口开放

在阿里云安全组中开放以下端口：
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (API服务，可选，建议仅内网访问)

### 1.2 域名解析

在域名管理中添加 A 记录：
```
主机记录: api.police.message
记录类型: A
记录值: <你的服务器公网IP>
```

---

## 二、上传项目到服务器

### 方式一：Git 克隆（推荐）

```bash
# 登录服务器
ssh root@<服务器IP>

# 创建项目目录
mkdir -p /opt/apps
cd /opt/apps

# 克隆项目（如果有Git仓库）
git clone <你的仓库地址> police-send-message
cd police-send-message
```

### 方式二：SCP 上传

```bash
# 在本地执行，上传项目文件
scp -r ./police-send-message root@<服务器IP>:/opt/apps/
```

---

## 三、配置生产环境

### 3.1 创建生产环境配置文件

```bash
cd /opt/apps/police-send-message

# 创建生产环境 .env 文件
cat > .env << 'EOF'
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=db
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=Police_Msg_Secure_Pwd_2024!
DB_DATABASE=police_message

# JWT配置（请修改为随机字符串）
JWT_SECRET=your_production_jwt_secret_key_change_this_to_random_string
JWT_EXPIRES_IN=7d

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
EOF
```

### 3.2 修改 docker-compose.yml（生产环境）

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    container_name: police-message-app
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=Police_Msg_Secure_Pwd_2024!
      - DB_DATABASE=police_message
      - JWT_SECRET=your_production_jwt_secret_key_change_this_to_random_string
      - JWT_EXPIRES_IN=7d
      - UPLOAD_DIR=./uploads
      - MAX_FILE_SIZE=10485760
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: always
    networks:
      - police-message-network

  db:
    image: mysql:8.0
    container_name: police-message-db
    environment:
      - MYSQL_ROOT_PASSWORD=Police_Msg_Secure_Pwd_2024!
      - MYSQL_DATABASE=police_message
      - MYSQL_CHARSET=utf8mb4
      - MYSQL_COLLATION=utf8mb4_unicode_ci
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - police-message-network

networks:
  police-message-network:
    driver: bridge

volumes:
  mysql_data:
EOF
```

---

## 四、安装 Nginx

```bash
# 更新包管理器
apt update

# 安装 Nginx
apt install -y nginx

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx
```

---

## 五、配置 Nginx 反向代理

### 5.1 创建 Nginx 配置文件

```bash
cat > /etc/nginx/sites-available/police-message << 'EOF'
server {
    listen 80;
    server_name api.police.message.creteper.xyz;

    # 日志
    access_log /var/log/nginx/police-message.access.log;
    error_log /var/log/nginx/police-message.error.log;

    # 文件上传大小限制
    client_max_body_size 20M;

    # API 反向代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # 静态文件（上传的图片）
    location /uploads {
        alias /opt/apps/police-send-message/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 5.2 启用站点配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/police-message /etc/nginx/sites-enabled/

# 删除默认配置（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重新加载 Nginx
systemctl reload nginx
```

---

## 六、配置 HTTPS（推荐）

### 6.1 安装 Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 申请 SSL 证书

```bash
certbot --nginx -d api.police.message.creteper.xyz
```

按提示操作：
1. 输入邮箱地址
2. 同意服务条款
3. 选择是否重定向 HTTP 到 HTTPS（推荐选择 2，自动重定向）

### 6.3 设置证书自动续期

```bash
# 测试续期
certbot renew --dry-run

# Certbot 会自动添加定时任务，无需手动配置
```

---

## 七、启动服务

### 7.1 构建并启动 Docker 容器

```bash
cd /opt/apps/police-send-message

# 构建镜像并启动
docker-compose up -d --build

# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 7.2 验证服务

```bash
# 检查容器是否运行
docker ps

# 测试 API 健康检查
curl http://127.0.0.1:3000/api/health

# 通过域名测试
curl https://api.police.message.creteper.xyz/api/health
```

---

## 八、常用运维命令

### 8.1 容器管理

```bash
# 进入项目目录
cd /opt/apps/police-send-message

# 查看日志
docker-compose logs -f

# 仅查看应用日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 8.2 数据库管理

```bash
# 进入数据库容器
docker exec -it police-message-db mysql -uroot -p

# 备份数据库
docker exec police-message-db mysqldump -uroot -pPolice_Msg_Secure_Pwd_2024! police_message > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i police-message-db mysql -uroot -pPolice_Msg_Secure_Pwd_2024! police_message < backup.sql
```

### 8.3 更新部署

```bash
cd /opt/apps/police-send-message

# 拉取最新代码（如果使用Git）
git pull

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

---

## 九、初始数据

服务首次启动时会自动创建：

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 警察 | police001 | 123456 |
| 村长 | chief001 ~ chief010 | 123456 |

### 生成测试数据

```bash
# 生成 Mock 违章数据
curl -X POST https://api.police.message.creteper.xyz/api/mock/violations/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

---

## 十、故障排查

### 10.1 查看容器状态

```bash
docker-compose ps
docker-compose logs app
```

### 10.2 检查端口占用

```bash
netstat -tlnp | grep 3000
netstat -tlnp | grep 80
```

### 10.3 检查 Nginx 状态

```bash
systemctl status nginx
nginx -t
```

### 10.4 数据库连接问题

```bash
# 检查数据库容器日志
docker-compose logs db

# 确认数据库容器健康状态
docker inspect police-message-db | grep Health
```

### 10.5 清理重建

```bash
cd /opt/apps/police-send-message

# 停止并删除容器、网络
docker-compose down

# 删除数据卷（警告：会删除所有数据）
docker-compose down -v

# 重新构建
docker-compose up -d --build
```

---

## 十一、安全建议

1. **修改默认密码**: 部署后立即修改数据库密码和 JWT_SECRET
2. **定期备份**: 设置定时任务备份数据库
3. **限制访问**: 通过安全组只开放必要端口
4. **监控日志**: 定期检查 Nginx 和应用日志
5. **更新系统**: 定期更新 Ubuntu 和 Docker

### 设置自动备份

```bash
# 创建备份脚本
cat > /opt/apps/police-send-message/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/police-message"
mkdir -p $BACKUP_DIR
docker exec police-message-db mysqldump -uroot -pPolice_Msg_Secure_Pwd_2024! police_message | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz
# 保留最近7天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/apps/police-send-message/backup.sh

# 添加定时任务（每天凌晨3点备份）
echo "0 3 * * * /opt/apps/police-send-message/backup.sh" | crontab -
```

---

## API 地址

部署完成后，API 地址为：

```
https://api.police.message.creteper.xyz/api
```

健康检查：
```
https://api.police.message.creteper.xyz/api/health
```
