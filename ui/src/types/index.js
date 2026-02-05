/**
 * 类型定义 - 已改为 JS
 * 与后端 API models 对应
 */

// 设施类型
export const FacilityType = {
  DATACENTER: "datacenter",
  ROOM: "room",
  SENSOR: "sensor",
};

// 数据类型选项
export const DataTypeOptions = [
  { value: "float", label: "浮点数" },
  { value: "int", label: "整数" },
  { value: "string", label: "字符串" },
  { value: "bool", label: "布尔值" },
];

// 设施类型选项
export const FacilityTypeOptions = [
  { value: FacilityType.DATACENTER, label: "数据中心" },
  { value: FacilityType.ROOM, label: "房间" },
  { value: FacilityType.SENSOR, label: "传感器" },
];
