/**
 * OpenAPI 生成的代码通过 @/libs/request 导入 request 实例
 * 实际调用 src/services/request.ts 中的 axios 实例
 *
 * 注意：axios 拦截器已经解包了 BaseResponse，返回的是 body.data，
 * 所以这里返回 any 类型以避免类型不匹配。
 */
import http from '@/services/request';

const request = async <T = any>(url: string, options?: any): Promise<T> => {
  return http(url, options) as T;
};

export default request;
