"""
数据模型层
定义设施管理系统的数据模型
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class FacilityType(str, Enum):
    """设施类型枚举"""
    DATACENTER = "datacenter"  # 数据中心
    ROOM = "room"  # 房间
    SENSOR = "sensor"  # 传感器


class FacilityBase(BaseModel):
    """设施基础模型"""
    name: str = Field(..., description="设施名称")
    facility_type: FacilityType = Field(..., description="设施类型")
    parent_id: Optional[uuid.UUID] = Field(None, description="父设施ID")
    description: Optional[str] = Field(None, description="设施描述")


class FacilityCreate(FacilityBase):
    """创建设施的请求模型"""
    pass


class FacilityUpdate(BaseModel):
    """更新设施的请求模型"""
    name: Optional[str] = None
    description: Optional[str] = None


class FacilityResponse(FacilityBase):
    """设施响应模型"""
    id: uuid.UUID = Field(..., description="设施ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    path: Optional[str] = Field(None, description="设施路径（如：数据中心A/房间1/传感器X）")

    class Config:
        from_attributes = True


class FacilityTreeResponse(FacilityResponse):
    """设施树形结构响应模型"""
    children: List["FacilityTreeResponse"] = Field(default_factory=list, description="子设施列表")
    metrics: List["MetricResponse"] = Field(default_factory=list, description="关联的指标列表")

    class Config:
        from_attributes = True


class MetricBase(BaseModel):
    """指标基础模型"""
    name: str = Field(..., description="指标名称")
    unit: Optional[str] = Field(None, description="指标单位")
    data_type: str = Field(default="float", description="数据类型：float, int, string, bool")
    description: Optional[str] = Field(None, description="指标描述")


class MetricCreate(MetricBase):
    """创建指标的请求模型"""
    facility_id: uuid.UUID = Field(..., description="关联的设施ID")


class MetricUpdate(BaseModel):
    """更新指标的请求模型"""
    name: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None


class MetricResponse(MetricBase):
    """指标响应模型"""
    id: uuid.UUID = Field(..., description="指标ID（唯一标识）")
    facility_id: uuid.UUID = Field(..., description="关联的设施ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class MetricValueCreate(BaseModel):
    """创建指标值的请求模型"""
    metric_id: uuid.UUID = Field(..., description="指标ID")
    value: str = Field(..., description="指标值")
    timestamp: Optional[datetime] = Field(None, description="时间戳，默认为当前时间")


class MetricValueResponse(BaseModel):
    """指标值响应模型"""
    id: uuid.UUID = Field(..., description="记录ID")
    metric_id: uuid.UUID = Field(..., description="指标ID")
    value: str = Field(..., description="指标值")
    timestamp: datetime = Field(..., description="记录时间")

    class Config:
        from_attributes = True


class TreeQueryParams(BaseModel):
    """树形查询参数"""
    root_id: Optional[uuid.UUID] = Field(None, description="根节点ID，为空则查询所有")
    facility_type: Optional[FacilityType] = Field(None, description="过滤设施类型")
    include_metrics: bool = Field(True, description="是否包含指标信息")
    max_depth: Optional[int] = Field(None, description="最大深度限制")

# 更新前向引用
FacilityTreeResponse.model_rebuild()
