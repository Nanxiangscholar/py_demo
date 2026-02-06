import { useState, useEffect, useCallback } from "react";
import { Button, Table, Select, Space, Popconfirm, Tag, Segmented, Alert } from "antd";
import { facilityService } from "../services/facilityService";
import { FacilityForm } from "../components/FacilityForm";
import { FacilityTree } from "../components/FacilityTree";
import { useMessage } from "../contexts/MessageContext";

export function FacilitiesPage() {
  const { message } = useMessage();
  const [facilities, setFacilities] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState("tree");

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await facilityService.getAll(filterType);
      setFacilities(Array.isArray(data) ? data : []);
      const tree = await facilityService.getTree({
        facility_type: filterType || undefined,
        include_metrics: true,
      });
      setTreeData(Array.isArray(tree) ? tree : []);
    } catch (err) {
      setError(err.message);
      setFacilities([]);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const handleAdd = () => {
    setEditingFacility(undefined);
    setShowForm(true);
  };

  const handleEdit = (facility) => {
    setEditingFacility(facility);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await facilityService.delete(id);
      message.success("删除成功");
      loadFacilities();
    } catch (err) {
      message.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingFacility(undefined);
    loadFacilities();
  };

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
      datacenter: "purple",
      room: "cyan",
      sensor: "magenta",
    };
    return colors[type] || "default";
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text) => <span style={{ fontWeight: 500, color: "#e4e4e7" }}>{text}</span>,
    },
    {
      title: "类型",
      dataIndex: "facility_type",
      key: "facility_type",
      render: (type) => <Tag color={getFacilityTypeColor(type)}>{getFacilityTypeLabel(type)}</Tag>,
    },
    {
      title: "路径",
      dataIndex: "path",
      key: "path",
      render: (path) => path || "-",
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      render: (desc) => desc || "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            style={{ color: "#a78bfa" }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除此设施吗？此操作将级联删除所有子设施和关联指标。"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              loading={deletingId === record.id}
              style={{ color: "#f87171" }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "#f3f4f6" }}>设施管理</h1>
          <Space>
            <Button onClick={loadFacilities}>刷新</Button>
            <Button type="primary" onClick={handleAdd}>新增设施</Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ marginRight: 16 }}>
          <Select
            style={{ width: 150 }}
            value={filterType}
            onChange={setFilterType}
            placeholder="全部类型"
            allowClear
            options={[
              { label: "全部类型", value: "" },
              { label: "数据中心", value: "datacenter" },
              { label: "房间", value: "room" },
              { label: "传感器", value: "sensor" },
            ]}
          />

          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            options={[
              { label: "树形视图", value: "tree" },
              { label: "列表视图", value: "table" },
            ]}
          />
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>加载中...</div>
      ) : facilities.length === 0 && treeData.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>暂无数据</div>
      ) : viewMode === "tree" ? (
        <FacilityTree
          facilities={treeData}
          onEdit={handleEdit}
          onDelete={(f) => handleDelete(f.id)}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={facilities}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <FacilityForm
        facility={editingFacility}
        open={showForm}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingFacility(undefined);
        }}
      />
    </div>
  );
}
