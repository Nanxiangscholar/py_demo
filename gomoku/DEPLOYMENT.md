# 五子棋在线对战 - 部署文档

## 项目结构

```
gomoku/
├── backend/          # Python Flask + SocketIO 后端
│   └── app.py        # 后端服务代码
└── ui/               # React 前端
    ├── src/
    │   └── App.jsx   # 前端主组件
    ├── dist/         # 构建产物
    └── .env.example  # 环境变量模板
```

---

## 一、环境要求

### 后端
- Python 3.6+
- 依赖包：`flask`, `flask-socketio`, `flask-cors`, `eventlet`

### 前端
- Node.js 16+
- npm 或 yarn

---

## 二、本地开发

### 1. 安装后端依赖

```bash
cd backend
pip3 install flask flask-socketio flask-cors eventlet
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

### 4. 配置环境变量（可选）

```bash
# 复制模板
cp .env.example .env

# .env 文件内容（开发环境）
VITE_API_URL=http://localhost:8001
```

### 5. 启动前端开发服务器

```bash
npm run dev
# 前端运行在 http://localhost:5173
```

---

## 三、服务器部署（阿里云 ECS）

### 1. 上传代码到服务器

```bash
# 方式一：使用 scp
scp -r gomoku root@你的服务器IP:/opt/web/

# 方式二：使用 git
git clone 你的仓库地址 /opt/web/gomoku
```

### 2. 安装后端依赖

```bash
ssh root@你的服务器IP
cd /opt/web/gomoku/backend
pip3 install flask flask-socketio flask-cors eventlet
```

### 3. 构建前端（在本地执行）

```bash
# 本地构建，指定服务器地址
cd ui
VITE_API_URL=http://你的服务器IP:8001 npm run build

# 上传 dist 到服务器
scp -r dist/* root@你的服务器IP:/opt/web/gomoku/frontend/dist/
```

### 4. 启动后端服务

```bash
cd /opt/web/gomoku/backend
python3 app.py &
```

验证后端启动：
```bash
netstat -tlnp | grep 8001
# 应该看到 8001 端口在监听
```

### 5. 启动前端服务

```bash
cd /opt/web/gomoku/frontend
serve -s dist -l 8081 &
```

### 6. 配置阿里云安全组

登录阿里云控制台 → ECS 实例 → 安全组 → 添加规则：

| 端口范围 | 授权对象 | 协议 |
|----------|----------|------|
| 8001/8001 | 0.0.0.0/0 | TCP |
| 8081/8081 | 0.0.0.0/0 | TCP |

### 7. 配置系统防火墙（如果启用）

```bash
systemctl status firewalld

# 如果 firewalld 正在运行
firewall-cmd --zone=public --add-port=8001/tcp --permanent
firewall-cmd --zone=public --add-port=8081/tcp --permanent
firewall-cmd --reload
```

---

## 四、访问地址

- 前端：`http://你的服务器IP:8081`
- 后端：`http://你的服务器IP:8001`

---

## 五、常用命令

### 查看后端日志
```bash
# 如果使用 nohup 启动
tail -f nohup.out

# 如果直接运行，查看前台输出
```

### 停止服务
```bash
# 停止后端
pkill -f "python3 app.py"

# 停止前端
pkill serve
```

### 查看端口占用
```bash
netstat -tlnp | grep 8001
lsof -i:8001
```

### 重启服务
```bash
# 后端
pkill -f "python3 app.py"
cd /opt/web/gomoku/backend
python3 app.py &

# 前端
pkill serve
cd /opt/web/gomoku/frontend
serve -s dist -l 8081 &
```

---

## 六、常见问题

### 1. 前端无法连接后端

**检查清单：**
- [ ] 后端是否启动：`netstat -tlnp | grep 8001`
- [ ] 阿里云安全组是否开放 8001 端口
- [ ] 系统防火墙是否开放端口
- [ ] 前端 API_URL 配置是否正确

### 2. serve 显示文件列表而非页面

**原因：** 缺少 `-s` 参数

**解决：**
```bash
serve -s dist -l 8081
```

### 3. 后端启动报错 `allow_unsafe_werkzeug`

**原因：** Werkzeug 版本过旧

**解决：** 修改 `app.py` 最后一行
```python
# 原代码
socketio.run(app, host='0.0.0.0', port=8001, debug=False, allow_unsafe_werkzeug=True)

# 修改为
socketio.run(app, host='0.0.0.0', port=8001, debug=False)
```

### 4. 端口被占用

**查找并停止占用进程：**
```bash
lsof -i:8001
kill <PID>
```

---

## 七、生产环境建议

### 使用进程管理器（PM2 或 Supervisor）

**PM2 管理后端：**
```bash
npm install -g pm2
pm2 start backend/app.py --name gomoku-backend --interpreter python3
pm2 save
pm2 startup
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /opt/web/gomoku/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 使用 HTTPS

推荐使用 Let's Encrypt 免费证书：
```bash
# 安装 certbot
yum install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com
```

---

## 八、端口说明

| 端口 | 用途 |
|------|------|
| 8001 | 后端 WebSocket 服务 |
| 8081 | 前端静态页面服务 |
| 5173 | 前端开发服务器（仅本地开发） |
