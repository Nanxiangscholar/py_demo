/**
 * 设施表单组件 - 已改为 JSX
 */
import { useState, useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";
import { facilityService } from "../services/facilityService";
import { useMessage } from "../contexts/MessageContext";

const { TextArea } = Input;

export function FacilityForm({ facility, open, onSuccess, onCancel }) {
  const { message } = useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);

  const isEdit = !!facility;

  useEffect(() => {
    if (open) {
      loadFacilities();
      if (facility) {
        form.setFieldsValue({
          name: facility.name,
          facility_type: facility.facility_type,
          parent_id: facility.parent_id || undefined,
          description: facility.description || "",
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, facility, form]);

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
        facility_type: values.facility_type,
        parent_id: values.parent_id || null,
        description: values.description || null,
      };

      if (isEdit) {
        await facilityService.update(facility.id, {
          name: values.name,
          description: values.description || null,
        });
        message.success("设施更新成功");
      } else {
        await facilityService.create(data);
        message.success("设施创建成功");
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
      title={isEdit ? "编辑设施" : "新增设施"}
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
          facility_type: "datacenter",
        }}
      >
        <Form.Item
          label="设施名称"
          name="name"
          rules={[{ required: true, message: "请输入设施名称" }]}
        >
          <Input placeholder="请输入设施名称" />
        </Form.Item>

        {!isEdit && (
          <>
            <Form.Item
              label="设施类型"
              name="facility_type"
              rules={[{ required: true, message: "请选择设施类型" }]}
            >
              <Select
                placeholder="请选择设施类型"
                options={[
                  { label: "数据中心", value: "datacenter" },
                  { label: "房间", value: "room" },
                  { label: "传感器", value: "sensor" },
                ]}
              />
            </Form.Item>

            <Form.Item label="父设施" name="parent_id">
              <Select
                placeholder="无（根设施）"
                allowClear
                options={facilities.map((f) => ({
                  label: f.path || f.name,
                  value: f.id,
                }))}
              />
            </Form.Item>
          </>
        )}

        <Form.Item label="描述" name="description">
          <TextArea rows={3} placeholder="请输入描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
