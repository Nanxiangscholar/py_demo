# Server 部署目录

此目录包含部署到服务器所需的所有文件。

## 目录结构

```
server/
├── main.py            # FastAPI 主入口
├── api.py             # API 路由定义
├── models.py          # 数据模型
├── service.py         # 业务逻辑服务
├── database.py        # 数据库操作
├── requirements.txt   # Python 依赖
├── Dockerfile         # Docker 镜像构建配置
├── docker compose.yml # Docker 编排配置
├── nginx.conf         # Nginx 反向代理配置
├── .env.example       # 环境变量模板
├── dist/              # 前端构建产物（静态文件）
├── ssl/               # SSL 证书目录（需自行放置）
└── README.md          # 本说明文件
```

## 部署步骤

### 方式一：Docker 部署（推荐）

1. **上传整个 `server/` 目录到服务器**

2. **配置环境变量**
   ```bash
   cd server
   cp .env.example .env
   vi .env  # 修改数据库密码
   ```

3. **启动服务**
   ```bash
   docker compose up -d
   ```

4. **查看日志**
   ```bash
   docker compose logs -f
   ```

5. **停止服务**
   ```bash
   docker compose down
   ```

### 方式二：直接运行

1. **安装 Python 依赖**
   ```bash
   pip install -r requirements.txt
   ```

2. **启动服务**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8008
   ```

## 服务端口

- **80**: Nginx（HTTP）
- **443**: Nginx（HTTPS，需配置SSL证书）
- **8008**: FastAPI 应用（容器内部）
- **3306**: MySQL（容器内部）

## 注意事项

- 部署前请确保已在本地完成前端构建：`cd ui && npm run build`
- `dist/` 目录是前端构建后的静态文件，不是源代码
- SSL 证书需自行放置到 `ssl/` 目录
- 如需 HTTPS，请修改 `nginx.conf` 取消注释 HTTPS 配置
