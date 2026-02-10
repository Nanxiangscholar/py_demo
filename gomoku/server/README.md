# 五子棋 - 服务器部署文件

本目录包含部署到服务器所需的所有文件。

## 目录结构

```
server/
├── Dockerfile              # 后端 Docker 镜像
├── docker-compose.yml      # Docker Compose 配置
├── nginx.conf             # Nginx 配置
├── app.py                 # 后端应用
├── requirements.txt       # Python 依赖
├── dist/                  # 前端构建产物
│   └── index.html
└── ssl/                   # SSL 证书（可选）
```

## 部署步骤

### 1. 构建前端

在本地执行：
```bash
cd ../ui
npm run build
```

### 2. 复制文件到 server 目录

```bash
# 复制后端代码
cp ../backend/app.py .
cp ../backend/requirements.txt .

# 复制前端构建产物
cp -r ../ui/dist .
```

### 3. 上传到服务器

```bash
# 方式一：使用 scp
scp -r server/* root@your_server_ip:/root/gomoku/

# 方式二：使用 rsync
rsync -avz server/ root@your_server_ip:/root/gomoku/
```

### 4. 在服务器上启动

```bash
ssh root@your_server_ip
cd /root/gomoku
docker-compose up -d
```

## 常用命令

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新部署
docker-compose up -d --build
```

## 访问地址

- 前端：`http://your_server_ip:8000`
- 健康检查：`http://your_server_ip:8000/health`

## 端口说明

| 端口 | 用途 |
|------|------|
| 8000 | Nginx 入口 |
| 8001 | 后端服务 |
