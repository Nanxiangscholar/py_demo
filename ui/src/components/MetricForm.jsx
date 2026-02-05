/**
 * 指标表单组件 - 已改为 JSX
 */
import { useState, useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";
import { metricService } from "../services/metricService";
import { facilityService } from "../services/facilityService";
import { useMessage } from "../contexts/MessageContext";

const { TextArea } = Input;

export function MetricForm({ metric, facilityId, open, onSuccess, onCancel }) {
  const { message } = useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);

  const isEdit = !!metric;

  useEffect(() => {
    if (open) {
      loadFacilities();
      if (metric) {
        form.setFieldsValue({
          name: metric.name,
          unit: metric.unit || "",
          data_type: metric.data_type,
          facility_id: metric.facility_id,
          description: metric.description || "",
        });
      } else {
        form.resetFields();
        if (facilityId) {
          form.setFieldsValue({ facility_id: facilityId });
        }
      }
    }
  }, [open, metric, facilityId, form]);

  const loadFacilities = async () => {
    try {
      const data = await facilityService.getAll();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        name: values.name,
        unit: values.unit || null,
        data_type: values.data_type,
        facility_id: values.facility_id,
        description: values.description || null,
      };

      if (isEdit) {
        await metricService.update(metric.id, {
          name: values.name,
          unit: values.unit || null,
          description: values.description || null,
        });
        message.success("指标更新成功");
      } else {
        await metricService.create(data);
        message.success("指标创建成功");
      }

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
      title={isEdit ? "编辑指标" : "新增指标"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          data_type: "float",
        }}
      >
        <Form.Item
          label="指标名称"
          name="name"
          rules={[{ required: true, message: "请输入指标名称" }]}
        >
          <Input placeholder="请输入指标名称" />
        </Form.Item>

        <Form.Item label="单位" name="unit">
          <Input placeholder="如: °C, %, V, A" />
        </Form.Item>

        <Form.Item
          label="数据类型"
          name="data_type"
          rules={[{ required: true, message: "请选择数据类型" }]}
        >
          <Select
            disabled={isEdit}
            options={[
              { label: "浮点数", value: "float" },
              { label: "整数", value: "int" },
              { label: "字符串", value: "string" },
              { label: "布尔值", value: "bool" },
            ]}
          />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            label="关联设施"
            name="facility_id"
            rules={[{ required: true, message: "请选择关联设施" }]}
          >
            <Select
              placeholder="请选择设施"
              options={facilities.map((f) => ({
                label: f.path || f.name,
                value: f.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item label="描述" name="description">
          <TextArea rows={3} placeholder="请输入描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
