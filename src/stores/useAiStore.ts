/**
 * AI 助手全局触发 Store
 *
 * 任意页面可通过 setPendingMessage() 设置待发送消息，
 * AiChat 组件监听后自动打开面板并发送。
 */
import { create } from 'zustand';

interface AiState {
  /** 待发送的消息，设置后 AiChat 自动打开并发送 */
  pendingMessage: string | null;
  /** 设置待发送消息 */
  triggerAi: (message: string) => void;
  /** 消费掉 pending 消息 */
  consumeMessage: () => string | null;
}

export const useAiStore = create<AiState>()((set, get) => ({
  pendingMessage: null,

  triggerAi: (message: string) => {
    set({ pendingMessage: message });
  },

  consumeMessage: () => {
    const msg = get().pendingMessage;
    if (msg) set({ pendingMessage: null });
    return msg;
  },
}));
