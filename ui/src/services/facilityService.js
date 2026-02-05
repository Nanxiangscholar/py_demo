/**
 * 设施管理 API 服务 - 已改为 JS
 */
import { api } from "../lib/api";

export const facilityService = {
  /**
   * 获取所有设施
   */
  async getAll(facilityType) {
    const params = facilityType ? { facility_type: facilityType } : {};
    const response = await api.get("/api/facilities", { params });
    return response.data;
  },

  /**
   * 获取设施树
   */
  async getTree(params) {
    const response = await api.get("/api/facilities/tree", { params });
    return response.data;
  },

  /**
   * 获取单个设施
   */
  async getById(id) {
    const response = await api.get(`/api/facilities/${id}`);
    return response.data;
  },

  /**
   * 获取子设施
   */
  async getChildren(id) {
    const response = await api.get(`/api/facilities/${id}/children`);
    return response.data;
  },

  /**
   * 创建设施
   */
  async create(data) {
    const response = await api.post("/api/facilities", data);
    return response.data;
  },

  /**
   * 更新设施
   */
  async update(id, data) {
    const response = await api.patch(`/api/facilities/${id}`, data);
    return response.data;
  },

  /**
   * 删除设施
   */
  async delete(id) {
    const response = await api.delete(`/api/facilities/${id}`);
    return response.data;
  },
};
