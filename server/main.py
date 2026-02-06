"""
主应用入口
FastAPI 应用初始化和配置
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from api import facilities_router, metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("Starting Facility Management System API...")
    yield
    # 关闭时执行
    print("Shutting down Facility Management System API...")


# 创建 FastAPI 应用
app = FastAPI(
    title="设施管理系统 API",
    description="提供树状层次的设施管理和指标查询功能",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应设置具体的允许域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(facilities_router)
app.include_router(metrics_router)

# 挂载静态文件目录
static_dir = os.path.join(os.path.dirname(__file__), "A_web")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
else:
    static_dir = None


@app.get("/", tags=["根路径"])
async def root():
    """根路径，返回前端页面"""
    if static_dir:
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    return {
        "message": "Facility Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "frontend": "/static"
    }


@app.get("/health", tags=["健康检查"])
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8008,
        reload=True
    )
