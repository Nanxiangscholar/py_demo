import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Table, Card, Space, message, Alert } from "antd";
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
      render: (timestamp) => dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "值",
      dataIndex: "value",
      key: "value",
      render: (value) => <span style={{ fontWeight: 500 }}>{value}</span>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Space direction="vertical" size={0}>
              <Button
                type="text"
                onClick={() => navigate(-1)}
              >
                返回
              </Button>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>指标历史数据</h1>
                {metric && (
                  <p style={{ color: "#666", marginTop: 4 }}>
                    {metric.name}
                    {metric.unit && ` (${metric.unit})`}
                  </p>
                )}
              </div>
            </Space>
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

          <Table
            columns={columns}
            dataSource={values}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Space>
      </Card>

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
