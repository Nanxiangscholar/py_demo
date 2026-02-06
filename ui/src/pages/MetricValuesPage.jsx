import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Table, Alert } from "antd";
import { metricService } from "../services/metricService";
import { MetricValueForm } from "../components/MetricValueForm";
import dayjs from "dayjs";

export function MetricValuesPage() {
  const { metricId } = useParams();
  const navigate = useNavigate();
  const [metric, setMetric] = useState(null);
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!metricId) return;

    setLoading(true);
    setError("");
    try {
      const [metricData, valuesData] = await Promise.all([
        metricService.getById(metricId),
        metricService.getValues(metricId, 100),
      ]);
      setMetric(metricData);
      setValues(Array.isArray(valuesData) ? valuesData : []);
    } catch (err) {
      setError(err.message);
      setValues([]);
    } finally {
      setLoading(false);
    }
  }, [metricId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSuccess = () => {
    setShowForm(false);
    loadData();
  };

  const columns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp) => <span style={{ color: "#9ca3af" }}>{dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss")}</span>,
    },
    {
      title: "值",
      dataIndex: "value",
      key: "value",
      render: (value) => <span style={{ fontWeight: 500, color: "#e4e4e7" }}>{value}</span>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <Button
              type="text"
              onClick={() => navigate(-1)}
              style={{ color: "#9ca3af", marginBottom: 8, paddingLeft: 0 }}
            >
              ← 返回
            </Button>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "#f3f4f6" }}>
              指标历史数据
            </h1>
            {metric && (
              <p style={{ color: "#9ca3af", marginTop: 4, fontSize: 14 }}>
                {metric.name}
                {metric.unit && ` (${metric.unit})`}
              </p>
            )}
          </div>
          <Button
            type="primary"
            onClick={() => setShowForm(true)}
          >
            记录新值
          </Button>
        </div>

        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            closable
          />
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>加载中...</div>
      ) : values.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>暂无数据</div>
      ) : (
        <Table
          columns={columns}
          dataSource={values}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      )}

      {metric && (
        <MetricValueForm
          metricId={metric.id}
          metricName={metric.name}
          dataType={metric.data_type}
          open={showForm}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
