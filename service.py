"""
业务逻辑层
处理设施和指标的业务逻辑，包括树形结构构建
"""
from typing import List, Optional
from datetime import datetime
import uuid

from models import (
    FacilityCreate, FacilityUpdate, FacilityResponse, FacilityTreeResponse,
    MetricCreate, MetricUpdate, MetricResponse, MetricValueCreate, MetricValueResponse,
    FacilityType, TreeQueryParams
)
from database import Database


class FacilityService:
    """设施业务逻辑类"""

    def __init__(self, db: Database):
        self.db = db

    def create_facility(self, facility_data: FacilityCreate) -> FacilityResponse:
        """创建设施"""
        facility_type = FacilityType(facility_data.facility_type)

        # 严格层级校验：数据中心必须是顶级
        if facility_type == FacilityType.DATACENTER:
            if facility_data.parent_id:
                raise ValueError("数据中心必须是顶级设施，不能设置父设施")

        # 验证父设施是否存在
        if facility_data.parent_id:
            parent = self.db.get_facility(str(facility_data.parent_id))
            if not parent:
                raise ValueError(f"父设施不存在：ID 为 {facility_data.parent_id} 的设施未找到")

            parent_type = FacilityType(parent["facility_type"])

            # 严格层级校验：房间只能属于数据中心
            if facility_type == FacilityType.ROOM:
                if parent_type != FacilityType.DATACENTER:
                    raise ValueError(f"层级错误：房间只能作为数据中心的子设施，当前父设施类型为 {self._get_type_name(parent_type.value)}")

            # 严格层级校验：传感器只能属于房间
            elif facility_type == FacilityType.SENSOR:
                if parent_type != FacilityType.ROOM:
                    raise ValueError(f"层级错误：传感器只能作为房间的子设施，当前父设施类型为 {self._get_type_name(parent_type.value)}")

        # 检查同名设施
        existing = self.db.get_facility_by_name(facility_data.name)
        if existing:
            raise ValueError(f"设施名称重复：名为 '{facility_data.name}' 的设施已存在")

        # 创建设施
        result = self.db.create_facility(
            name=facility_data.name,
            facility_type=facility_data.facility_type.value,
            parent_id=str(facility_data.parent_id) if facility_data.parent_id else None,
            description=facility_data.description
        )

        # 构建路径
        path = self.db.build_facility_path(result["id"])
        result["path"] = path

        return FacilityResponse(**result)

    def get_facility(self, facility_id: uuid.UUID) -> Optional[FacilityResponse]:
        """获取单个设施"""
        facility = self.db.get_facility(str(facility_id))
        if not facility:
            return None

        facility["path"] = self.db.build_facility_path(str(facility_id))
        return FacilityResponse(**facility)

    def get_all_facilities(
        self,
        facility_type: Optional[FacilityType] = None
    ) -> List[FacilityResponse]:
        """获取所有设施列表"""
        type_str = facility_type.value if facility_type else None
        facilities = self.db.get_all_facilities(type_str)

        result = []
        for facility in facilities:
            facility["path"] = self.db.build_facility_path(facility["id"])
            result.append(FacilityResponse(**facility))

        return result

    def update_facility(
        self,
        facility_id: uuid.UUID,
        facility_data: FacilityUpdate
    ) -> Optional[FacilityResponse]:
        """更新设施"""
        update_data = facility_data.model_dump(exclude_unset=True)
        if not update_data:
            return self.get_facility(facility_id)

        success = self.db.update_facility(
            str(facility_id),
            name=update_data.get("name"),
            description=update_data.get("description")
        )

        if not success:
            return None

        return self.get_facility(facility_id)

    def delete_facility(self, facility_id: uuid.UUID) -> bool:
        """删除设施（级联删除子设施和指标）"""
        return self.db.delete_facility(str(facility_id))

    def get_facility_tree(
        self,
        params: TreeQueryParams
    ) -> List[FacilityTreeResponse]:
        """获取设施树形结构"""
        root_id = str(params.root_id) if params.root_id else None

        # 获取根节点
        if root_id:
            root_facilities = [self.db.get_facility(root_id)]
        else:
            root_facilities = self.db.get_root_facilities()

        # 过滤类型
        if params.facility_type:
            root_facilities = [
                f for f in root_facilities
                if f and f["facility_type"] == params.facility_type.value
            ]

        # 构建树形结构
        result = []
        for facility in root_facilities:
            if facility:
                tree_node = self._build_tree_node(
                    facility,
                    params.include_metrics,
                    params.max_depth,
                    0
                )
                if tree_node:
                    result.append(tree_node)

        return result

    def _build_tree_node(
        self,
        facility: dict,
        include_metrics: bool,
        max_depth: Optional[int],
        current_depth: int
    ) -> Optional[FacilityTreeResponse]:
        """递归构建树节点"""
        if not facility:
            return None

        # 构建路径
        facility["path"] = self.db.build_facility_path(facility["id"])

        # 获取子设施
        children = self.db.get_children(facility["id"])

        # 递归构建子节点
        child_nodes = []
        if max_depth is None or current_depth < max_depth:
            for child in children:
                child_node = self._build_tree_node(
                    child,
                    include_metrics,
                    max_depth,
                    current_depth + 1
                )
                if child_node:
                    child_nodes.append(child_node)

        # 获取指标
        metrics = []
        if include_metrics:
            metrics_data = self.db.get_metrics_by_facility(facility["id"])
            metrics = [MetricResponse(**m) for m in metrics_data]

        # 构建响应
        return FacilityTreeResponse(
            **facility,
            children=child_nodes,
            metrics=metrics
        )

    def get_facility_children(self, facility_id: uuid.UUID) -> List[FacilityResponse]:
        """获取设施的直接子设施"""
        children = self.db.get_children(str(facility_id))
        result = []
        for child in children:
            child["path"] = self.db.build_facility_path(child["id"])
            result.append(FacilityResponse(**child))
        return result

    def _get_type_name(self, type_value: str) -> str:
        """获取设施类型的中文名称"""
        type_names = {
            "datacenter": "数据中心",
            "room": "房间",
            "sensor": "传感器"
        }
        return type_names.get(type_value, type_value)


class MetricService:
    """指标业务逻辑类"""

    def __init__(self, db: Database):
        self.db = db

    def create_metric(self, metric_data: MetricCreate) -> MetricResponse:
        """创建指标"""
        # 验证设施是否存在
        facility = self.db.get_facility(str(metric_data.facility_id))
        if not facility:
            raise ValueError(f"关联的设施不存在：ID 为 {metric_data.facility_id} 的设施未找到")

        # 创建指标
        result = self.db.create_metric(
            name=metric_data.name,
            facility_id=str(metric_data.facility_id),
            unit=metric_data.unit,
            data_type=metric_data.data_type,
            description=metric_data.description
        )

        return MetricResponse(**result)

    def get_metric(self, metric_id: uuid.UUID) -> Optional[MetricResponse]:
        """获取单个指标"""
        metric = self.db.get_metric(str(metric_id))
        if not metric:
            return None
        return MetricResponse(**metric)

    def get_metrics_by_facility(self, facility_id: uuid.UUID) -> List[MetricResponse]:
        """获取设施的所有指标"""
        # 验证设施是否存在
        facility = self.db.get_facility(str(facility_id))
        if not facility:
            raise ValueError(f"设施不存在：ID 为 {facility_id} 的设施未找到")

        metrics = self.db.get_metrics_by_facility(str(facility_id))
        return [MetricResponse(**m) for m in metrics]

    def get_all_metrics(self) -> List[MetricResponse]:
        """获取所有指标"""
        metrics = self.db.get_all_metrics()
        return [MetricResponse(**m) for m in metrics]

    def update_metric(
        self,
        metric_id: uuid.UUID,
        metric_data: MetricUpdate
    ) -> Optional[MetricResponse]:
        """更新指标"""
        update_data = metric_data.model_dump(exclude_unset=True)
        if not update_data:
            return self.get_metric(metric_id)

        success = self.db.update_metric(
            str(metric_id),
            name=update_data.get("name"),
            unit=update_data.get("unit"),
            description=update_data.get("description")
        )

        if not success:
            return None

        return self.get_metric(metric_id)

    def delete_metric(self, metric_id: uuid.UUID) -> bool:
        """删除指标"""
        return self.db.delete_metric(str(metric_id))

    def create_metric_value(self, value_data: MetricValueCreate) -> MetricValueResponse:
        """创建指标值记录"""
        # 验证指标是否存在
        metric = self.db.get_metric(str(value_data.metric_id))
        if not metric:
            raise ValueError(f"指标不存在：ID 为 {value_data.metric_id} 的指标未找到")

        timestamp = value_data.timestamp.isoformat() if value_data.timestamp else None
        result = self.db.create_metric_value(
            metric_id=str(value_data.metric_id),
            value=str(value_data.value),
            timestamp=timestamp
        )

        return MetricValueResponse(**result)

    def get_metric_values(
        self,
        metric_id: uuid.UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[MetricValueResponse]:
        """获取指标的历史值"""
        # 验证指标是否存在
        metric = self.db.get_metric(str(metric_id))
        if not metric:
            raise ValueError(f"指标不存在：ID 为 {metric_id} 的指标未找到")

        values = self.db.get_metric_values(str(metric_id), limit, offset)
        return [MetricValueResponse(**v) for v in values]

    def get_latest_metric_value(self, metric_id: uuid.UUID) -> Optional[MetricValueResponse]:
        """获取指标的最新值"""
        value = self.db.get_latest_metric_value(str(metric_id))
        if not value:
            return None
        return MetricValueResponse(**value)
