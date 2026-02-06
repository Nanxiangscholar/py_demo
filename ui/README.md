# 前端 UI

基于 React + Vite + Ant Design 的设施管理系统前端。

## 技术栈

- **React 19** - UI 框架
- **Vite** - 构建工具
- **Ant Design** - UI 组件库
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **Day.js** - 日期处理

## 目录结构

```
ui/
├── src/
│   ├── components/    # 公共组件
│   ├── pages/         # 页面组件
│   ├── services/      # API 服务
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   ├── App.jsx        # 根组件
│   └── main.jsx       # 入口文件
├── public/            # 静态资源
├── dist/              # 构建输出（自动生成）
├── index.html         # HTML 模板
├── vite.config.js     # Vite 配置
├── eslint.config.js   # ESLint 配置
└── package.json       # 项目配置

## 开发指南

### 1. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 2. 启动开发服务器

```bash
npm run dev 
```
or
```bash
yarn dev 
```

访问 http://localhost:5173 || 端口号由 Vite 输出决定。

### 3. 构建生产版本

```bash
npm run build
```
or
```bash
yarn build
```

构建产物将输出到 `dist/` 目录，用于部署到服务器。


## 部署流程

1. **构建前端**
   ```bash
   npm run build
   ```

2. **复制到 server 目录**
   ```bash
   cp -r dist/* ../server/dist/
   ```

3. **部署到服务器**
   ```bash
   scp -r ../server user@server:/path/to/deploy
   ```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
