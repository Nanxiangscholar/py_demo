"""
API 接口层
定义所有 RESTful API 端点
"""
from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
import uuid

from models import (
    FacilityCreate, FacilityUpdate, FacilityResponse, FacilityTreeResponse,
    MetricCreate, MetricUpdate, MetricResponse, MetricValueCreate, MetricValueResponse,
    FacilityType, TreeQueryParams
)
from service import FacilityService, MetricService
from database import db


# 创建路由
facilities_router = APIRouter(prefix="/api/facilities", tags=["设施管理"])
metrics_router = APIRouter(prefix="/api/metrics", tags=["指标管理"])

# 创建服务实例
facility_service = FacilityService(db)
metric_service = MetricService(db)


# ==================== 设施管理 API ====================

@facilities_router.post(
    "",
    response_model=FacilityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建设施",
    description="创建新的设施，支持数据中心、房间、传感器类型"
)
async def create_facility(facility_data: FacilityCreate):
    """
    创建新的设施

    - **name**: 设施名称（必填）
    - **facility_type**: 设施类型（datacenter/room/sensor）
    - **parent_id**: 父设施ID（可选）
    - **description**: 设施描述（可选）
    """
    try:
        return facility_service.create_facility(facility_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"创建设施失败：{str(e)}"
        )


@facilities_router.get(
    "",
    response_model=List[FacilityResponse],
    summary="获取所有设施",
    description="获取所有设施列表，可按类型过滤"
)
async def get_all_facilities(
    facility_type: Optional[FacilityType] = Query(
        None,
        description="过滤设施类型"
    )
):
    """
    获取所有设施列表

    - **facility_type**: 可选，按设施类型过滤
    """
    return facility_service.get_all_facilities(facility_type)


@facilities_router.get(
    "/tree",
    response_model=List[FacilityTreeResponse],
    summary="获取设施树",
    description="获取设施的树形结构，支持深度控制和指标包含"
)
async def get_facility_tree(
    root_id: Optional[uuid.UUID] = Query(None, description="根节点ID"),
    facility_type: Optional[FacilityType] = Query(None, description="过滤设施类型"),
    include_metrics: bool = Query(True, description="是否包含指标信息"),
    max_depth: Optional[int] = Query(None, description="最大深度限制")
):
    """
    获取设施树形结构

    - **root_id**: 可选，指定根节点ID
    - **facility_type**: 可选，按设施类型过滤
    - **include_metrics**: 是否包含指标信息（默认True）
    - **max_depth**: 可选，最大深度限制
    """
    params = TreeQueryParams(
        root_id=root_id,
        facility_type=facility_type,
        include_metrics=include_metrics,
        max_depth=max_depth
    )
    return facility_service.get_facility_tree(params)


@facilities_router.get(
    "/{facility_id}",
    response_model=FacilityResponse,
    summary="获取单个设施",
    description="根据ID获取设施详情"
)
async def get_facility(facility_id: uuid.UUID):
    """
    获取单个设施详情

    - **facility_id**: 设施ID
    """
    facility = facility_service.get_facility(facility_id)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"设施不存在：ID 为 {facility_id} 的设施未找到"
        )
    return facility


@facilities_router.get(
    "/{facility_id}/children",
    response_model=List[FacilityResponse],
    summary="获取子设施",
    description="获取设施的直接子设施列表"
)
async def get_facility_children(facility_id: uuid.UUID):
    """
    获取设施的直接子设施

    - **facility_id**: 父设施ID
    """
    # 验证设施是否存在
    facility = facility_service.get_facility(facility_id)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"父设施不存在：ID 为 {facility_id} 的设施未找到"
        )

    return facility_service.get_facility_children(facility_id)


@facilities_router.patch(
    "/{facility_id}",
    response_model=FacilityResponse,
    summary="更新设施",
    description="更新设施信息"
)
async def update_facility(
    facility_id: uuid.UUID,
    facility_data: FacilityUpdate
):
    """
    更新设施信息

    - **facility_id**: 设施ID
    - **name**: 新的设施名称（可选）
    - **description**: 新的设施描述（可选）
    """
    facility = facility_service.update_facility(facility_id, facility_data)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"更新失败：设施不存在，ID 为 {facility_id}"
        )
    return facility


@facilities_router.delete(
    "/{facility_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除设施",
    description="删除设施（级联删除子设施和关联指标）"
)
async def delete_facility(facility_id: uuid.UUID):
    """
    删除设施

    - **facility_id**: 设施ID

    注意：此操作将级联删除所有子设施和关联指标
    """
    success = facility_service.delete_facility(facility_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"删除失败：设施不存在，ID 为 {facility_id}"
        )


# ==================== 指标管理 API ====================

@metrics_router.post(
    "",
    response_model=MetricResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建指标",
    description="为设施创建新的指标"
)
async def create_metric(metric_data: MetricCreate):
    """
    创建新的指标

    - **name**: 指标名称（必填）
    - **facility_id**: 关联的设施ID（必填）
    - **unit**: 指标单位（可选）
    - **data_type**: 数据类型（默认float）
    - **description**: 指标描述（可选）
    """
    try:
        return metric_service.create_metric(metric_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"创建指标失败：{str(e)}"
        )


@metrics_router.get(
    "",
    response_model=List[MetricResponse],
    summary="获取所有指标",
    description="获取所有指标列表"
)
async def get_all_metrics():
    """获取所有指标列表"""
    return metric_service.get_all_metrics()


@metrics_router.get(
    "/facility/{facility_id}",
    response_model=List[MetricResponse],
    summary="获取设施的指标",
    description="获取指定设施的所有指标"
)
async def get_facility_metrics(facility_id: uuid.UUID):
    """
    获取指定设施的所有指标

    - **facility_id**: 设施ID
    """
    try:
        return metric_service.get_metrics_by_facility(facility_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"获取设施指标失败：{str(e)}"
        )


@metrics_router.get(
    "/{metric_id}",
    response_model=MetricResponse,
    summary="获取单个指标",
    description="根据ID获取指标详情"
)
async def get_metric(metric_id: uuid.UUID):
    """
    获取单个指标详情

    - **metric_id**: 指标ID
    """
    metric = metric_service.get_metric(metric_id)
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"指标不存在：ID 为 {metric_id} 的指标未找到"
        )
    return metric


@metrics_router.patch(
    "/{metric_id}",
    response_model=MetricResponse,
    summary="更新指标",
    description="更新指标信息"
)
async def update_metric(
    metric_id: uuid.UUID,
    metric_data: MetricUpdate
):
    """
    更新指标信息

    - **metric_id**: 指标ID
    - **name**: 新的指标名称（可选）
    - **unit**: 新的指标单位（可选）
    - **description**: 新的指标描述（可选）
    """
    metric = metric_service.update_metric(metric_id, metric_data)
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"更新失败：指标不存在，ID 为 {metric_id}"
        )
    return metric


@metrics_router.delete(
    "/{metric_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="删除指标",
    description="删除指标及其历史数据"
)
async def delete_metric(metric_id: uuid.UUID):
    """
    删除指标

    - **metric_id**: 指标ID

    注意：此操作将删除该指标的所有历史数据
    """
    success = metric_service.delete_metric(metric_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"删除失败：指标不存在，ID 为 {metric_id}"
        )


# ==================== 指标值管理 API ====================

@metrics_router.post(
    "/values",
    response_model=MetricValueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="记录指标值",
    description="为指标记录新的数值"
)
async def create_metric_value(value_data: MetricValueCreate):
    """
    记录指标值

    - **metric_id**: 指标ID（必填）
    - **value**: 指标值（必填）
    - **timestamp**: 时间戳（可选，默认当前时间）
    """
    try:
        return metric_service.create_metric_value(value_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"记录指标值失败：{str(e)}"
        )


@metrics_router.get(
    "/{metric_id}/values",
    response_model=List[MetricValueResponse],
    summary="获取指标历史值",
    description="获取指标的历史数值记录"
)
async def get_metric_values(
    metric_id: uuid.UUID,
    limit: int = Query(100, ge=1, le=1000, description="返回记录数量限制"),
    offset: int = Query(0, ge=0, description="偏移量")
):
    """
    获取指标的历史数值记录

    - **metric_id**: 指标ID
    - **limit**: 返回记录数量限制（1-1000，默认100）
    - **offset**: 偏移量（默认0）
    """
    try:
        return metric_service.get_metric_values(metric_id, limit, offset)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"获取指标历史值失败：{str(e)}"
        )


@metrics_router.get(
    "/{metric_id}/values/latest",
    response_model=MetricValueResponse,
    summary="获取指标最新值",
    description="获取指标的最新数值记录"
)
async def get_latest_metric_value(metric_id: uuid.UUID):
    """
    获取指标的最新数值记录

    - **metric_id**: 指标ID
    """
    # 验证指标是否存在
    metric = metric_service.get_metric(metric_id)
    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"指标不存在：ID 为 {metric_id} 的指标未找到"
        )

    value = metric_service.get_latest_metric_value(metric_id)
    if not value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"暂无数据：指标 {metric_id} 还没有记录任何数值"
        )
    return value


# 导出所有路由
__all__ = ["facilities_router", "metrics_router"]
