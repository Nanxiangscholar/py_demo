import { useState, useEffect, useCallback } from "react";
import { Button, Table, Select, Space, Popconfirm, Tag, Alert } from "antd";
import { metricService } from "../services/metricService";
import { facilityService } from "../services/facilityService";
import { MetricForm } from "../components/MetricForm";
import { useMessage } from "../contexts/MessageContext";

export function MetricsPage() {
  const { message } = useMessage();
  const [metrics, setMetrics] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState(undefined);
  const [deletingId, setDeletingId] = useState(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let data;
      if (selectedFacilityId) {
        data = await metricService.getByFacility(selectedFacilityId);
      } else {
        data = await metricService.getAll();
      }
      setMetrics(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFacilityId]);

  const loadFacilities = async () => {
    try {
      const data = await facilityService.getAll();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setFacilities([]);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadFacilities();
  }, [loadMetrics]);

  const handleAdd = () => {
    setEditingMetric(undefined);
    setShowForm(true);
  };

  const handleEdit = (metric) => {
    setEditingMetric(metric);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await metricService.delete(id);
      message.success("删除成功");
      loadMetrics();
    } catch (err) {
      message.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMetric(undefined);
    loadMetrics();
  };

  const getFacilityName = (facilityId) => {
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.path || facility?.name || facilityId;
  };

  const getDataTypeLabel = (type) => {
    const labels = {
      float: "浮点数",
      int: "整数",
      string: "字符串",
      bool: "布尔值",
    };
    return labels[type] || type;
  };

  const getDataTypeColor = (type) => {
    const colors = {
      float: "cyan",
      int: "lime",
      string: "orange",
      bool: "magenta",
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
      title: "单位",
      dataIndex: "unit",
      key: "unit",
      render: (unit) => unit || "-",
    },
    {
      title: "数据类型",
      dataIndex: "data_type",
      key: "data_type",
      render: (type) => <Tag color={getDataTypeColor(type)}>{getDataTypeLabel(type)}</Tag>,
    },
    {
      title: "关联设施",
      dataIndex: "facility_id",
      key: "facility_id",
      render: (facilityId) => getFacilityName(facilityId),
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
            description="确定要删除此指标吗？此操作将删除该指标的所有历史数据。"
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
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "#f3f4f6" }}>指标管理</h1>
          <Space>
            <Button onClick={loadMetrics}>刷新</Button>
            <Button type="primary" onClick={handleAdd}>新增指标</Button>
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
      </div>

      <Select
        style={{ width: 200, marginBottom: 16 }}
        value={selectedFacilityId}
        onChange={setSelectedFacilityId}
        placeholder="请选择"
        allowClear
        options={facilities.map((f) => ({
          label: f.path || f.name,
          value: f.id,
        }))}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>加载中...</div>
      ) : metrics.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>暂无数据</div>
      ) : (
        <Table
          columns={columns}
          dataSource={metrics}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <MetricForm
        metric={editingMetric}
        facilityId={selectedFacilityId}
        open={showForm}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingMetric(undefined);
        }}
      />
    </div>
  );
}
