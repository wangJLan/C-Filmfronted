/**
 * Umi 运行时配置 — 全局初始化
 * @see https://umijs.org/docs/guides/runtime-config
 *
 * 注意：rootContainer / render / onRouteChange 等是 plain umi 内置支持的运行时钩子。
 *       像 request / initialState 等需要 @umijs/max，这里不使用。
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LocationGate from '@/components/LocationGate';

// ================= React Query 全局 Provider =================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 3 * 60 * 1000, // 3 分钟
    },
  },
});

/**
 * 动态设置 rem 根字体大小
 * 基准: 375px 设计稿 → 1rem = 37.5px
 */
function setRem() {
  const designWidth = 375;
  const designRootValue = 37.5;
  const clientWidth = document.documentElement.clientWidth;
  const scale = clientWidth / designWidth;
  const fontSize = designRootValue * Math.min(scale, 2);
  document.documentElement.style.fontSize = `${fontSize}px`;
}

// 初始化 rem
if (typeof window !== 'undefined') {
  setRem();
  window.addEventListener('resize', setRem);
}

/**
 * rootContainer — 在根组件外层包裹 Provider
 * plain umi 支持，无需 @umijs/max
 */
export function rootContainer(container: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationGate>
        {container}
      </LocationGate>
    </QueryClientProvider>
  );
}
