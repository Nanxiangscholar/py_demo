# 阿里云服务器部署指南

本指南介绍如何将设施管理系统部署到阿里云 CentOS 服务器上。

---

## 一、服务器准备

### 1. 购买阿里云服务器
- 推荐配置：2核4GB及以上
- 操作系统：CentOS 7.x 或 8.x
- 确保安全组开放以下端口：
  - **80** (HTTP)
  - **443** (HTTPS，可选)
  - **22** (SSH)

### 2. 连接到服务器
```bash
ssh root@your_server_ip
```

---

## 二、安装 Docker 和 Docker Compose

### 1. 安装 Docker
```bash
# 卸载旧版本
sudo yum remove docker docker-common docker-selinux docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 阿里云镜像源（国内加速）
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

### 2. 配置 Docker 镜像加速器（可选，国内推荐）
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 3. 安装 Docker Compose
```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker compose

# 创建软链接
sudo ln -s /usr/local/bin/docker compose /usr/bin/docker compose

# 验证安装
docker compose --version
```

---

## 三、部署应用

### 1. 上传项目文件
在本地执行，将项目上传到服务器：
```bash
# 方式一：使用 scp
scp -r /Users/nanxiangscholar/Desktop/py_demo root@your_server_ip:/root/

# 方式二：使用 rsync
rsync -avz --exclude='__pycache__' --exclude='*.pyc' --exclude='.git' \
  /Users/nanxiangscholar/Desktop/py_demo/ root@your_server_ip:/root/py_demo/
```

### 2. 在服务器上配置项目
```bash
# 进入项目目录
cd /root/py_demo

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，修改数据库密码（可选）
vim .env
```

### 3. 启动服务
```bash
# 构建并启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看应用日志
docker compose logs -f app
```

---

## 四、验证部署

### 1. 检查服务状态
```bash
# 查看所有容器
docker compose ps

# 应该看到三个服务都在运行：
# - facilities_mysql (mysql)
# - facilities_app (app)
# - facilities_nginx (nginx)
```

### 2. 访问应用
在浏览器中访问：
- **前端页面**: `http://your_server_ip/`
- **API 文档**: `http://your_server_ip/docs`
- **健康检查**: `http://your_server_ip/health`

---

## 五、常用管理命令

```bash
# 启动服务
docker compose start

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f app
docker compose logs -f mysql

# 进入容器
docker compose exec app bash
docker compose exec mysql mysql -uroot -p

# 更新应用（修改代码后）
docker compose up -d --build

# 清理所有数据（危险操作！）
docker compose down -v
```

---

## 六、配置域名和 HTTPS（可选）

### 1. 配置域名
在域名服务商处添加 A 记录：
```
A记录: your-domain.com -> your_server_ip
```

### 2. 使用 Let's Encrypt 获取免费 SSL 证书
```bash
# 安装 Certbot
sudo yum install -y epel-release
sudo yum install -y certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 3. 修改 Nginx 配置
创建 `nginx/ssl` 目录并复制证书：
```bash
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

编辑 `nginx.conf`，取消 HTTPS 配置的注释并修改域名。

---

## 七、数据库备份

### 备份数据库
```bash
# 备份
docker compose exec mysql mysqldump -uroot -pzsl123456 facilities_db > backup_$(date +%Y%m%d).sql

# 从容器复制到主机
docker cp facilities_mysql:/backup.sql ./backup.sql
```

### 恢复数据库
```bash
# 复制备份文件到容器
docker cp ./backup.sql facilities_mysql:/backup.sql

# 恢复
docker compose exec mysql mysql -uroot -pzsl123456 facilities_db < /backup.sql
```

---

## 八、故障排查

### 1. 容器无法启动
```bash
# 查看详细日志
docker compose logs app
docker compose logs mysql

# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :3306
netstat -tlnp | grep :8008
```

### 2. 数据库连接失败
```bash
# 检查 MySQL 是否就绪
docker compose exec mysql mysqladmin ping -h localhost -uroot -pzsl123456

# 查看数据库日志
docker compose logs mysql
```

### 3. 防火墙问题
```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 或者临时关闭防火墙（不推荐）
sudo systemctl stop firewalld
```

---

## 九、安全建议

1. **修改默认密码**: 修改 `.env` 中的数据库密码
2. **限制 SSH 访问**: 禁用密码登录，仅使用密钥
3. **配置防火墙**: 只开放必要的端口
4. **定期更新**: `yum update` 保持系统最新
5. **监控日志**: 定期检查应用和系统日志

---

## 十、项目结构

```
py_demo/
├── Dockerfile              # Docker 镜像构建文件
├── docker compose.yml      # Docker Compose 编排文件
├── .dockerignore          # Docker 忽略文件
├── nginx.conf             # Nginx 配置文件
├── .env.example           # 环境变量模板
├── requirements.txt       # Python 依赖
├── main.py               # FastAPI 入口
├── api.py                # API 路由
├── models.py             # 数据模型
├── service.py            # 业务逻辑
├── database.py           # 数据库操作
└── dist/                 # 前端静态文件
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 联系支持

如有问题，请检查：
1. Docker 日志: `docker compose logs`
2. Nginx 日志: `/var/log/nginx/`
3. 应用健康状态: `http://your_server_ip/health`
