# 设施管理系统

一个基于 FastAPI + MySQL 的树状层次设施管理系统，支持数据中心、房间、传感器的层级管理，配备现代化 Web 界面。

![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-green)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-orange)

## 功能特性

### 核心功能
- **三层层级管理** - 严格遵循 数据中心 → 房间 → 传感器 的层级关系
- **设施 CRUD** - 创建、查看、更新、删除设施
- **指标管理** - 为传感器配置监测指标
- **时序数据** - 记录和查询指标的历史数值
- **树形展示** - 直观的树状结构展示设施层级
- **智能校验** - 前后端双重层级校验，防止非法层级关系

### 界面特性
- **现代化设计** - 渐变背景、卡片阴影、流畅动画
- **响应式布局** - 完美适配桌面和移动端
- **实时反馈** - 操作成功/失败的 Toast 提示
- **中文报错** - 友好的中文错误提示信息
- **智能表单** - 根据设施类型自动过滤父设施选项

## 技术栈

| 层级 | 技术栈 |
|------|--------|
| 后端框架 | FastAPI |
| 数据库 | MySQL |
| 数据库驱动 | mysql-connector-python |
| 前端 | 原生 HTML/CSS/JavaScript |
| API 文档 | Swagger UI / ReDoc |

## 项目结构

```
py_demo/
├── main.py              # 主应用入口
├── models.py            # 数据模型层（Pydantic）
├── database.py          # 数据库层（MySQL 连接池）
├── service.py           # 业务逻辑层（层级校验）
├── api.py               # API 接口层（RESTful）
├── requirements.txt     # Python 依赖
├── A_web/               # 前端静态文件
│   ├── index.html       # 主页面
│   ├── style.css        # 样式文件
│   └── app.js           # 前端逻辑
├── docs/                # 文档目录
└── 需求/                # 需求文档
```

## 环境要求

- Python 3.8+
- MySQL 5.7+ 或 MySQL 8.0+

## 安装步骤

### 1. 克隆项目

```bash
cd /path/to/py_demo
```

### 2. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

或手动安装：

```bash
pip install fastapi uvicorn mysql-connector-python python-multipart
```

### 3. 配置 MySQL 数据库

#### 方式一：使用默认配置（推荐快速启动）

项目默认配置（已在 `database.py` 中设置）：
- 主机：localhost
- 端口：3306
- 用户：root
- 密码：zsl123456
- 数据库名：facilities_db

如果与你的 MySQL 配置一致，可跳过此步骤。

#### 方式二：自定义配置

创建数据库：

```sql
CREATE DATABASE facilities_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改 `database.py` 中的连接参数：

```python
self.host = "localhost"           # 你的 MySQL 主机
self.port = 3306                   # 你的 MySQL 端口
self.user = "root"                 # 你的 MySQL 用户名
self.password = "your_password"    # 你的 MySQL 密码
self.database = "facilities_db"    # 数据库名
```

或设置环境变量：

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=facilities_db
```

## 启动项目

### 启动后端服务

```bash
python main.py
```

启动成功后会看到：

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 访问应用

| 访问内容 | 地址 |
|---------|------|
| **Web 管理界面** | http://localhost:8000/index.html |
| **API 文档 (Swagger)** | http://localhost:8000/docs |
| **API 文档 (ReDoc)** | http://localhost:8000/redoc |

## 使用指南

### 设施层级规则

系统严格遵循三层层级结构：

```
数据中心 (datacenter)  ─┐
                       ├─→ 房间 (room)  ─┐
房间 (room)           │                   ├─→ 传感器 (sensor)
                       └───────────────────┘
```

| 子设施类型 | 允许的父设施类型 | 说明 |
|-----------|---------------|------|
| 数据中心 | 无 | 必须为顶级设施 |
| 房间 | 数据中心 | 只能属于数据中心 |
| 传感器 | 房间 | 只能属于房间 |

### Web 界面操作流程

#### 1. 创建数据中心

1. 点击「新增设施」
2. 设施类型选择「数据中心」
3. 输入设施名称（如：北京数据中心）
4. 父设施自动禁用（数据中心必须为顶级）
5. 点击「保存」

#### 2. 创建房间

1. 点击「新增设施」
2. 设施类型选择「房间」
3. 输入设施名称（如：机房A）
4. 父设施只能选择数据中心
5. 点击「保存」

#### 3. 创建传感器

1. 点击「新增设施」
2. 设施类型选择「传感器」
3. 输入设施名称（如：温度传感器01）
4. 父设施只能选择房间
5. 点击「保存」

#### 4. 创建指标

1. 切换到「指标管理」标签
2. 选择一个传感器设施
3. 点击「新增指标」
4. 填写指标名称、单位、数据类型
5. 点击「保存」

#### 5. 记录指标值

1. 在指标列表中点击「查看数据」
2. 点击「记录新值」
3. 输入数值和时间
4. 点击「保存」

## API 接口文档

### 设施管理 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/facilities` | 创建设施 |
| GET | `/api/facilities` | 获取所有设施 |
| GET | `/api/facilities/tree` | 获取设施树 |
| GET | `/api/facilities/{id}` | 获取单个设施 |
| GET | `/api/facilities/{id}/children` | 获取子设施 |
| PATCH | `/api/facilities/{id}` | 更新设施 |
| DELETE | `/api/facilities/{id}` | 删除设施 |

### 指标管理 API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/metrics` | 创建指标 |
| GET | `/api/metrics` | 获取所有指标 |
| GET | `/api/metrics/facility/{id}` | 获取设施的指标 |
| GET | `/api/metrics/{id}` | 获取单个指标 |
| PATCH | `/api/metrics/{id}` | 更新指标 |
| DELETE | `/api/metrics/{id}` | 删除指标 |
| POST | `/api/metrics/values` | 记录指标值 |
| GET | `/api/metrics/{id}/values` | 获取指标历史值 |
| GET | `/api/metrics/{id}/values/latest` | 获取指标最新值 |

### 使用示例

#### 创建数据中心

```bash
curl -X POST "http://localhost:8000/api/facilities" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "北京数据中心",
    "facility_type": "datacenter",
    "description": "主数据中心"
  }'
```

#### 创建房间

```bash
curl -X POST "http://localhost:8000/api/facilities" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "机房A",
    "facility_type": "room",
    "parent_id": "<数据中心ID>",
    "description": "服务器机房"
  }'
```

#### 创建传感器

```bash
curl -X POST "http://localhost:8000/api/facilities" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "温度传感器01",
    "facility_type": "sensor",
    "parent_id": "<房间ID>",
    "description": "监控机房温度"
  }'
```

#### 创建指标

```bash
curl -X POST "http://localhost:8000/api/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "温度",
    "facility_id": "<传感器ID>",
    "unit": "°C",
    "data_type": "float"
  }'
```

#### 记录指标值

```bash
curl -X POST "http://localhost:8000/api/metrics/values" \
  -H "Content-Type: application/json" \
  -d '{
    "metric_id": "<指标ID>",
    "value": "25.5"
  }'
```

## 错误码说明

| HTTP 状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 请求参数错误（层级校验失败、名称重复等） |
| 404 | 资源不存在 |

### 常见错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| 数据中心必须是顶级设施，不能设置父设施 | 尝试给数据中心设置父设施 | 不要选择父设施 |
| 层级错误：房间只能作为数据中心的子设施 | 房间的父设施不是数据中心 | 选择数据中心作为父设施 |
| 层级错误：传感器只能作为房间的子设施 | 传感器的父设施不是房间 | 选择房间作为父设施 |
| 设施名称重复 | 同名设施已存在 | 使用不同的名称 |
| 父设施不存在 | 父设施 ID 无效 | 检查父设施 ID |

## 常见问题

### Q: 启动时提示数据库连接失败？

**A:** 检查 MySQL 服务是否启动，以及 `database.py` 中的连接配置是否正确。

```bash
# 检查 MySQL 是否运行
mysql -u root -p

# 检查数据库是否存在
SHOW DATABASES;
```

### Q: 前端页面无法访问？

**A:** 确保后端服务已正常启动，访问 http://localhost:8000/index.html

### Q: API 请求报 CORS 错误？

**A:** 本项目前后端同源部署，不应出现 CORS 问题。如果出现，检查是否通过正确端口访问。

### Q: 如何重置数据库？

**A:** 删除 `facilities.db` 文件，重启服务会自动创建新数据库。

```bash
rm facilities.db
python main.py
```

## 开发说明

### 添加新的设施类型

1. 修改 `models.py` 中的 `FacilityType` 枚举
2. 更新 `service.py` 中的层级校验逻辑
3. 更新前端 `app.js` 中的 `getAllowedParentTypes` 函数
4. 更新前端 `index.html` 中的类型选项

### 修改样式

编辑 `A_web/style.css`，所有样式变量定义在 `:root` 中：

```css
:root {
    --primary: #6366f1;
    --secondary: #8b5cf6;
    --success: #10b981;
    --danger: #ef4444;
    /* ... */
}
```

## 许可证

MIT License
