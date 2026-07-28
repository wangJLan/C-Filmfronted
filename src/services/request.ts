/**
 * Axios 实例 — 对接后端 Spring Boot 8123 端口
 *
 * 后端响应格式 BaseResponse<T>:
 *   { code: 0, data: T, message: "ok" }
 *   code === 0 → 成功，其他值均为错误
 */
import axios from 'axios';

const http = axios.create({
  baseURL: '/api',        // 经 Umi proxy → http://localhost:8123/api
  timeout: 10000,
  withCredentials: true,  // Session 认证需要携带 Cookie
  headers: { 'Content-Type': 'application/json' },
  // 所有响应都走 then 分支，在拦截器里判断业务 code
  validateStatus: () => true,
});

// ================= 响应拦截器：统一解包 BaseResponse =================
http.interceptors.response.use(
  (response) => {
    const body = response.data;

    // 后端返回 BaseResponse 格式
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        // 成功 → 只返回 data 字段，调用方无需再 .data
        return body.data;
      }
      // 业务错误
      return Promise.reject(new Error(body.message || `请求失败 (code=${body.code})`));
    }

    // 非标准响应（如 HTML 404），原样返回
    return body;
  },
  (error) => {
    // 网络错误
    if (!error.response) {
      console.warn('[Network Error]', error.message);
      return Promise.reject(error);
    }
    if (error.response.status === 401) {
      // 未登录，清除本地状态
      import('@/stores/useUserStore').then(({ useUserStore }) => {
        useUserStore.getState().logout();
      });
    }
    return Promise.reject(error);
  },
);

export default http;
