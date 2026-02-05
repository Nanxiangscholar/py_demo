/**
 * 指标值表单组件 - 已改为 JSX
 */
import { useState } from "react";
import { Modal, Form, Input, DatePicker, Select } from "antd";
import { metricService } from "../services/metricService";
import { useMessage } from "../contexts/MessageContext";
import dayjs from "dayjs";

export function MetricValueForm({
  metricId,
  metricName,
  dataType,
  open,
  onSuccess,
  onCancel,
}) {
  const { message } = useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const renderValueInput = () => {
    if (dataType === "bool") {
      return (
        <Form.Item
          label="值"
          name="value"
          rules={[{ required: true, message: "请选择值" }]}
        >
          <Select
            placeholder="请选择"
            options={[
              { label: "true", value: "true" },
              { label: "false", value: "false" },
            ]}
          />
        </Form.Item>
      );
    }

    const inputType = dataType === "int" || dataType === "float" ? "number" : "text";

    return (
      <Form.Item
        label="值"
        name="value"
        rules={[{ required: true, message: "请输入值" }]}
      >
        <Input
          type={inputType}
          placeholder="请输入值"
          step={dataType === "float" ? "any" : "1"}
        />
      </Form.Item>
    );
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        metric_id: metricId,
        value: values.value,
        timestamp: values.timestamp ? values.timestamp.toISOString() : undefined,
      };

      await metricService.createValue(data);
      message.success("记录成功");
      form.resetFields();
      onSuccess();
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="记录指标值"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={500}
      okText="保存"
      cancelText="取消"
    >
      <p style={{ marginBottom: 16, color: "#666" }}>指标: {metricName}</p>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          timestamp: dayjs(),
        }}
      >
        {renderValueInput()}

        <Form.Item label="时间" name="timestamp">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
