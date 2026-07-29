/**
 * AI 对话 API — 对接后端 AiController
 * 后端路径: /api/ai/chat (非流式)  /api/ai/chat-stream (SSE 流式)
 */
import http from '../request';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** SSE 流式聊天 — 逐字返回 */
export async function chatStream(
  message: string,
  conversationId: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const url = `/api/ai/chat-stream?message=${encodeURIComponent(message)}&conversationId=${encodeURIComponent(conversationId)}`;
    const resp = await fetch(url, { credentials: 'include' });

    if (!resp.ok) {
      throw new Error(`AI 服务响应异常 (${resp.status})`);
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      throw new Error('浏览器不支持流式读取');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // SSE 格式: "data: xxx\n\n"
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const text = line.slice(5).trim();
          if (text && text !== '[DONE]') {
            onChunk(text);
          }
        }
      }
    }

    onDone();
  } catch (err: any) {
    onError(err);
  }
}

/** 非流式聊天 — 一次性返回（流式不可用时的降级方案） */
export async function chat(
  message: string,
  conversationId: string,
): Promise<string> {
  const resp = await fetch(
    `/api/ai/chat?message=${encodeURIComponent(message)}&conversationId=${encodeURIComponent(conversationId)}`,
    { credentials: 'include' },
  );
  if (!resp.ok) throw new Error(`AI 服务响应异常 (${resp.status})`);
  const text = await resp.text();
  return text;
}
