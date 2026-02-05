/**
 * 设施树形展示组件
 */
import { Tree, Tag, Space, Button, Popconfirm } from "antd";

export function FacilityTree({ facilities, onSelect, onEdit, onDelete }) {
  if (!facilities || !Array.isArray(facilities) || facilities.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#999", padding: 40 }}>
        暂无设施数据
      </div>
    );
  }

  const getFacilityTypeLabel = (type) => {
    const labels = {
      datacenter: "数据中心",
      room: "房间",
      sensor: "传感器",
    };
    return labels[type] || type;
  };

  const getFacilityTypeColor = (type) => {
    const colors = {
      datacenter: "blue",
      room: "green",
      sensor: "orange",
    };
    return colors[type] || "default";
  };

  const buildTreeData = (items) => {
    return items.map((facility) => ({
      title: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{facility.name}</span>
            <Tag color={getFacilityTypeColor(facility.facility_type)} style={{ margin: 0 }}>
              {getFacilityTypeLabel(facility.facility_type)}
            </Tag>
            {facility.description && (
              <span style={{ color: "#999", fontSize: 12 }}>{facility.description}</span>
            )}
          </div>
          <Space size="small">
            <Button
              type="text"
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(facility); }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除"
              description="确定要删除此设施吗？此操作将级联删除所有子设施和关联指标。"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete && onDelete(facility);
              }}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                danger
                onClick={(e) => e.stopPropagation()}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        </div>
      ),
      key: facility.id,
      children: facility.children && facility.children.length > 0
        ? buildTreeData(facility.children)
        : undefined,
      data: facility,
    }));
  };

  const treeData = buildTreeData(facilities);

  const handleSelect = (_selectedKeys, info) => {
    if (onSelect && info.selectedNodes.length > 0) {
      onSelect(info.selectedNodes[0].data);
    }
  };

  return (
    <Tree
      showLine={{ showLeafIcon: false }}
      defaultExpandAll
      treeData={treeData}
      onSelect={handleSelect}
      style={{ fontSize: 14 }}
    />
  );
}
