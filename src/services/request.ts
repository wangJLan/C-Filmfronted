/**
 * Axios 实例 — 对接后端 Spring Boot 8123 端口
 *
 * 后端响应格式 BaseResponse<T>:
 *   { code: 0, data: T, message: "ok" }
 *   code === 0 → 成功，其他值均为错误
 */
import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
  // 自定义 JSON 序列化：BigInt → 原始数字字面量，保留 19位雪花ID 精度
  transformRequest: [
    (data, headers) => {
      if (headers?.['Content-Type']?.includes('application/json') && data && typeof data === 'object') {
        return safeStringify(data);
      }
      return JSON.stringify(data);
    },
  ],
});

/** JSON.stringify 但 BigInt 直接写入数字（不截断），如 {"id":1842234567890123456} */
function safeStringify(obj: any): string {
  const marked = JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? `__BIGINT_${v.toString()}__` : v,
  );
  return marked.replace(/"__BIGINT_(\d+)__"/g, '$1');
}

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
