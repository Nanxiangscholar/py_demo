/**
 * 指标管理 API 服务 - 已改为 JS
 */
import { api } from "../lib/api";

export const metricService = {
  /**
   * 获取所有指标
   */
  async getAll() {
    const response = await api.get("/api/metrics");
    return response.data;
  },

  /**
   * 获取设施的指标
   */
  async getByFacility(facilityId) {
    const response = await api.get(`/api/metrics/facility/${facilityId}`);
    return response.data;
  },

  /**
   * 获取单个指标
   */
  async getById(id) {
    const response = await api.get(`/api/metrics/${id}`);
    return response.data;
  },

  /**
   * 创建指标
   */
  async create(data) {
    const response = await api.post("/api/metrics", data);
    return response.data;
  },

  /**
   * 更新指标
   */
  async update(id, data) {
    const response = await api.patch(`/api/metrics/${id}`, data);
    return response.data;
  },

  /**
   * 删除指标
   */
  async delete(id) {
    await api.delete(`/api/metrics/${id}`);
  },

  /**
   * 记录指标值
   */
  async createValue(data) {
    const response = await api.post("/api/metrics/values", data);
    return response.data;
  },

  /**
   * 获取指标历史值
   */
  async getValues(metricId, limit = 100, offset = 0) {
    const response = await api.get(`/api/metrics/${metricId}/values`, {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * 获取指标最新值
   */
  async getLatestValue(metricId) {
    const response = await api.get(`/api/metrics/${metricId}/values/latest`);
    return response.data;
  },
};
