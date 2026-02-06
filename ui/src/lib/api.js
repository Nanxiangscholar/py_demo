/**
 * API 客户端配置 - 已改为 JS
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = "请求失败";

    // 优先使用后台返回的错误信息
    if (error?.response?.data?.detail) {
      const detail = error.response.data.detail;
      // detail 可能是字符串（HTTPException）或数组（验证错误）
      if (Array.isArray(detail)) {
        // 验证错误：提取第一条错误信息
        const firstError = detail[0];
        if (firstError) {
          // 尝试使用 loc 字段构建更友好的错误信息
          const field = firstError.loc?.join(".");
          errorMessage = firstError.msg;
          if (field) {
            errorMessage = `${field}: ${errorMessage}`;
          }
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (typeof detail === "string") {
        errorMessage = detail;
      } else {
        errorMessage = JSON.stringify(detail);
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);
