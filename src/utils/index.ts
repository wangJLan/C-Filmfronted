/**
 * 通用工具函数
 */
import dayjs from 'dayjs';

/** 格式化日期 */
export function formatDate(date: string | number | Date, template = 'YYYY-MM-DD') {
  return dayjs(date).format(template);
}

/** 格式化金额 (分 → 元) */
export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

/** 防抖 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** 节流 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn(...args);
    }
  };
}

/** 获取 URL 参数 */
export function getQueryParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/** 存储封装 */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const val = localStorage.getItem(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string): void {
    localStorage.removeItem(key);
  },
};
