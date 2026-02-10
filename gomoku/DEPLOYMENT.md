# 五子棋在线对战 - 部署文档

## 项目结构

```
gomoku/
├── backend/          # Python Flask + SocketIO 后端
│   ├── app.py        # 后端服务代码
│   ├── Dockerfile    # 后端 Docker 镜像
│   └── requirements.txt
├── ui/               # React 前端
│   ├── src/
│   │   └── App.jsx   # 前端主组件
│   ├── dist/         # 构建产物
│   └── .env.example  # 环境变量模板
├── nginx.conf        # Nginx 配置（支持 WebSocket）
└── docker-compose.yml # Docker Compose 配置
```

---

## 一、环境要求

### Docker 部署（推荐）
- Docker 20.10+
- Docker Compose 2.0+

### 本地开发
- 后端：Python 3.6+
- 前端：Node.js 16+

---

## 二、本地开发

### 1. 安装后端依赖

```bash
cd backend
pip3 install -r requirements.txt
```

### 2. 启动后端

```bash
python3 app.py
# 后端运行在 http://localhost:8001
```

### 3. 安装前端依赖

```bash
cd ui
npm install
```

### 4. 启动前端开发服务器

```bash
npm run dev
# 前端运行在 http://localhost:5173
```

---

## 三、生产环境部署（Docker + Nginx）

### 1. 构建前端

```bash
cd ui
# 构建时指定 API 地址（通过 nginx 代理，使用相对路径即可）
npm run build
```

### 2. 启动服务

```bash
cd gomoku
docker-compose up -d
```

### 3. 查看服务状态

```bash
docker-compose ps
docker-compose logs -f
```

### 4. 访问应用

- 前端：`http://你的服务器IP:8000`
- 后端健康检查：`http://你的服务器IP:8000/health`

### 5. 配置防火墙

```bash
# 开放 8000 端口
firewall-cmd --zone=public --add-port=8000/tcp --permanent
firewall-cmd --reload
```

### 6. 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f backend
docker-compose logs -f nginx

# 重新构建并启动
docker-compose up -d --build
```

---

## 四、端口说明

| 端口 | 用途 |
|------|------|
| 8000 | Nginx 入口（前端 + WebSocket） |
| 8001 | 后端服务（容器内部，不对外暴露） |

---

## 五、WebSocket 配置说明

Nginx 已配置支持 Socket.IO 的 WebSocket 连接：

- WebSocket 路径：`/socket.io/`
- 自动升级 HTTP 连接到 WebSocket
- 超时设置：1小时（适合长时间对局）

---

## 六、常见问题

### 1. WebSocket 连接失败

**检查清单：**
- [ ] Docker 容器是否正常运行：`docker-compose ps`
- [ ] 防火墙是否开放 8000 端口
- [ ] Nginx 配置是否正确加载

### 2. 前端页面 404

**原因：** 前端未构建或构建产物路径错误

**解决：**
```bash
cd ui
npm run build
# 确保 dist 目录在 ui/ 下
ls -la ui/dist/
```

### 3. 服务频繁重启

**查看日志：**
```bash
docker-compose logs backend
```

---

## 七、生产环境建议

### 使用 HTTPS

修改 `nginx.conf`，添加 HTTPS 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # ... 其他配置同上
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### 使用域名

建议配置域名和 SSL 证书，使用 Let's Encrypt：

```bash
# 安装 certbot
yum install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com
```

### 使用进程管理

Docker 会自动管理进程重启，无需额外配置。

---

## 八、迁移说明

### 从旧部署迁移

1. 停止旧服务：
```bash
pkill -f "python3 app.py"
pkill serve
```

2. 备份数据（如有）：
```bash
# 当前版本无持久化数据，跳过
```

3. 启动新服务：
```bash
cd gomoku
docker-compose up -d
```

4. 更新前端 API 地址：
- 构建时使用相对路径，无需修改
- 如使用绝对路径，改为 `http://你的服务器IP:8000`
