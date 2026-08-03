import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, TextArea, Toast, SpinLoading, SafeArea } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { MOCK_HOT_FILMS, MOCK_UPCOMING_FILMS, MOCK_CINEMAS } from '@/mock/home';
import { useAiStore } from '@/stores/useAiStore';
import { doChat1 } from '@/api/aiController';
import styles from './index.module.less';

// ================= 给 AI 的系统上下文 =================
function buildSystemPrompt(): string {
  const films = MOCK_HOT_FILMS.map((f, i) => `${i + 1}. 《${f.title}》 ${f.genre} ${f.duration}分钟 评分${f.rating} ${f.wantCount}`).join('\n');
  const upcoming = MOCK_UPCOMING_FILMS.map((f, i) => `${i + 1}. 《${f.title}》 ${f.genre} ${f.releaseDate} ${f.wantCount}`).join('\n');
  const cinemas = MOCK_CINEMAS.map((c, i) => `${i + 1}. ${c.name} ${c.address} ${c.distance} ${c.tags.join('、')}`).join('\n');
  return `你是"妙语购票"的智能助手，叫"妙语小助手"。你可以帮助用户购票、推荐电影、查找影院。当前平台数据：\n\n【正在热映】\n${films}\n\n【即将上映】\n${upcoming}\n\n【附近影院】\n${cinemas}\n\n请用友好、简洁的中文回答。如果用户想购票，请推荐电影并引导他们去详情页点击"选座购票"。`;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

// SSE 流式聊天 — 必须用原生 fetch，axios 不支持 ReadableStream
async function chatStream(
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

// conversationId 持久化保持上下文连续
let globalConvId = localStorage.getItem('ai_conv_id') || `conv_${Date.now()}`;
function saveConvId() { localStorage.setItem('ai_conv_id', globalConvId); }

const AiChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: '你好！我是妙语小助手 🎬\n\n我可以帮你：\n• 推荐热映电影\n• 查找附近影院\n• 解答购票疑问\n\n你想看什么电影呢？' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(1);

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  useEffect(() => { if (open) scrollBottom(); }, [open, messages]);

  const pendingTriggerRef = useRef<string | null>(null);
  useEffect(() => {
    const unsub = useAiStore.subscribe((state) => {
      if (state.pendingMessage) {
        pendingTriggerRef.current = state.pendingMessage;
        useAiStore.getState().consumeMessage();
        setOpen(true);
      }
    });
    return unsub;
  }, []);

  const send = useCallback(async (text: string) => {
    const userMsg: Message = { id: ++msgId.current, role: 'user', content: text };
    const aiMsg: Message = { id: ++msgId.current, role: 'assistant', content: '', loading: true };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setSending(true);
    scrollBottom();

    const fullMessage = `${buildSystemPrompt()}\n\n用户：${text}`;

    let streamDone = false;
    await chatStream(
      fullMessage,
      globalConvId,
      (chunk) => {
        if (!streamDone) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last.role === 'assistant') {
              copy[copy.length - 1] = { ...last, content: last.content + chunk, loading: false };
            }
            return copy;
          });
          scrollBottom();
        }
      },
      () => {
        streamDone = true;
        saveConvId();
        setSending(false);
      },
      async () => {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: '正在思考…', loading: true };
          }
          return copy;
        });
        try {
          const reply = await doChat1({ message: fullMessage, conversationId: globalConvId });
          saveConvId();
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last.role === 'assistant') {
              copy[copy.length - 1] = { ...last, content: reply, loading: false };
            }
            return copy;
          });
        } catch {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last.role === 'assistant') {
              copy[copy.length - 1] = { ...last, content: '抱歉，AI 服务暂时不可用，请稍后再试。', loading: false };
            }
            return copy;
          });
        }
        setSending(false);
        saveConvId();
      },
    );
  }, [scrollBottom]);

  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    if (open && pendingTriggerRef.current) {
      const msg = pendingTriggerRef.current;
      pendingTriggerRef.current = null;
      setTimeout(() => sendRef.current?.(msg), 300);
    }
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    send(text);
  };

  const quickReply = (text: string) => send(text);

  return (
    <>
      <div
        className={`${styles.floatBtn} ${open ? styles.floatBtnHidden : ''}`}
        onClick={() => setOpen(true)}
      >
        <div className={styles.floatIcon}>🤖</div>
        <div className={styles.floatPulse} />
      </div>

      {open && (
        <div className={styles.panel}>
          <div className={styles.topBar}>
            <div className={styles.topLeft}>
              <span className={styles.topIcon}>🤖</span>
              <div>
                <div className={styles.topTitle}>妙语小助手</div>
                <div className={styles.topStatus}>在线</div>
              </div>
            </div>
            <div className={styles.topClose} onClick={() => setOpen(false)}>
              <CloseOutline fontSize={20} />
            </div>
          </div>

          <div className={styles.messages} ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${msg.role === 'user' ? styles.msgUser : styles.msgAi}`}
              >
                {msg.role === 'assistant' && (
                  <div className={styles.msgAvatar}>🤖</div>
                )}
                <div className={`${styles.msgBubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi}`}>
                  {msg.loading ? (
                    <span className={styles.typing}>
                      <span /><span /><span />
                    </span>
                  ) : (
                    <span className={styles.msgText}>{msg.content}</span>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className={styles.msgAvatar}>👤</div>
                )}
              </div>
            ))}

            {messages.length <= 1 && (
              <div className={styles.quickReplies}>
                <span className={styles.quickLabel}>试试问我：</span>
                <div className={styles.quickBtns}>
                  <span className={styles.quickBtn} onClick={() => quickReply('推荐好看的电影')}>推荐好看的电影</span>
                  <span className={styles.quickBtn} onClick={() => quickReply('附近有哪些影院')}>附近有哪些影院</span>
                  <span className={styles.quickBtn} onClick={() => quickReply('如何购票')}>如何购票</span>
                  <span className={styles.quickBtn} onClick={() => quickReply('最近上映的新片')}>最近上映的新片</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.inputBar}>
            <SafeArea position="bottom" />
            <div className={styles.inputRow}>
              <TextArea
                className={styles.textarea}
                value={input}
                onChange={(val) => setInput(val)}
                placeholder="输入你想问的…"
                rows={1}
                autoSize={{ minRows: 1, maxRows: 3 }}
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!input.trim() || sending}
                loading={sending}
              >
                发送
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChat;