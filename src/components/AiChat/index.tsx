import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, TextArea, Toast, SafeArea, SpinLoading, Input } from 'antd-mobile';
import { CloseOutline, LeftOutline, MessageOutline, AddOutline } from 'antd-mobile-icons';
import { useAiStore } from '@/stores/useAiStore';
import { useUserStore } from '@/stores/useUserStore';
import request from '@/libs/request';
import dayjs from 'dayjs';
import styles from './index.module.less';

// ==================== 类型 ====================
interface ChatSessionItem {
  id: number;
  sessionName: string;
  userId: number;
  editTime: string;
  createTime: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  /** 当前正在执行的工具列表（展示在气泡内） */
  activeTools: string[];
  /** 是否正在流式输出（展示 ▍ 光标） */
  streaming: boolean;
  /** card 类型数据（type=card 时） */
  cardData?: SSECardData;
  loading?: boolean;
}

/** card 事件的 data 结构 */
interface SSECardData {
  cardType: string;
  data: any;
}

interface SSEPayload {
  d?: string;
  type?: string;
  toolName?: string;
  cardType?: string;
  data?: any;
}

// ==================== API 封装 ====================
async function getOrCreateSession(userId: number): Promise<ChatSessionItem> {
  return request<ChatSessionItem>(`/chatSession/current?userId=${userId}`, { method: 'GET' });
}

async function createNewSession(userId: number): Promise<ChatSessionItem> {
  return request<ChatSessionItem>(`/chatSession/create?userId=${userId}`, { method: 'POST' });
}

async function fetchSessions(userId: number): Promise<ChatSessionItem[]> {
  return request<ChatSessionItem[]>(`/chatSession/listByUser?userId=${userId}`, { method: 'GET' });
}

async function fetchChatHistory(sessionId: number): Promise<{ message: string; messageType: string }[]> {
  return request<{ message: string; messageType: string }[]>(
    `/chatHistory/listBySession/${sessionId}`,
    { method: 'GET' },
  );
}

async function renameSessionApi(id: number, name: string): Promise<boolean> {
  return request<boolean>(`/chatSession/rename?id=${id}&name=${encodeURIComponent(name)}`, { method: 'PUT' });
}

async function deleteSessionApi(id: number): Promise<boolean> {
  return request<boolean>(`/chatSession/remove/${id}`, { method: 'DELETE' });
}

// ==================== 格式化时间 ====================
function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  const d = dayjs(timeStr);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now, 'year')) return d.format('MM-DD');
  return d.format('YYYY-MM-DD');
}

// ==================== 推荐卡片 ====================
const RecommendationCard: React.FC<{ data: any }> = ({ data }) => {
  const alternatives: any[] = data?.alternatives || [];
  if (alternatives.length === 0) return null;
  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>{data?.reason || '为您找到以下备选方案：'}</div>
      {alternatives.map((item: any, idx: number) => (
        <div key={idx} className={styles.cardItem}>
          <div className={styles.cardHeader}>
            <span className={styles.cardFilmName}>{item.filmName}</span>
            <span className={styles.cardRating}>⭐{item.rating}</span>
          </div>
          <div className={styles.cardMeta}>
            {item.cinemaName} · {item.date} {item.time}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardHall}>{item.hall}</span>
            <span className={styles.cardPrice}>¥{item.price}</span>
            <span className={styles.cardSeats}>余{item.availableSeats}座</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== 组件 ====================
const AiChat: React.FC = () => {
  // —— 面板 & 视图 ——
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');

  // —— 会话 ——
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // —— 消息 ——
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const handleOpenRef = useRef<() => void>(() => {});

  // —— 悬浮按钮拖拽 ——
  const [floatPos, setFloatPos] = useState({ x: window.innerWidth - 68, y: window.innerHeight - 210 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const hasDragged = useRef(false);

  const onDragStart = useCallback((clientX: number, clientY: number) => {
    dragState.current.dragging = true;
    dragState.current.startX = clientX;
    dragState.current.startY = clientY;
    dragState.current.startLeft = floatPos.x;
    dragState.current.startTop = floatPos.y;
    hasDragged.current = false;
  }, [floatPos]);

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.current.dragging) return;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const newX = Math.min(Math.max(dragState.current.startLeft + dx, 0), w - 52);
    const newY = Math.min(Math.max(dragState.current.startTop + dy, 0), h - 52);
    setFloatPos({ x: newX, y: newY });
  }, []);

  const onDragEnd = useCallback(() => {
    dragState.current.dragging = false;
    if (!hasDragged.current) {
      // 没有拖拽，是点击 → 打开面板
      handleOpenRef.current();
    } else {
      const w = window.innerWidth;
      const mid = w / 2;
      setFloatPos((prev) => ({
        x: prev.x < mid ? 0 : w - 52,
        y: prev.y,
      }));
    }
  }, []);

  // —— Refs ——
  const listRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(1);
  const abortRef = useRef<AbortController | null>(null);

  // —— Store ——
  const userId = useUserStore((s) => s.user?.id);

  // ==================== 滚动 ====================
  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 80);
  }, []);

  useEffect(() => { if (open && view === 'chat') scrollBottom(); }, [open, view, messages]);

  // ==================== 加载会话历史 ====================
  const loadMessages = useCallback(async (sid: number) => {
    setLoadingHistory(true);
    setMessages([]);
    try {
      const history = await fetchChatHistory(sid);
      if (history && history.length > 0) {
        const msgs: Message[] = history.map((h, i) => ({
          id: i + 1,
          role: h.messageType === 'user' ? 'user' : 'assistant',
          content: h.message || '',
          activeTools: [],
          streaming: false,
        }));
        setMessages(msgs);
      } else {
        setMessages([{
          id: 0,
          role: 'assistant',
          content: '你好！我是小影 🎬\n\n我可以帮你：\n• 推荐热映电影\n• 查找附近影院\n• 选座购票\n• 解答观影疑问',
          activeTools: [],
          streaming: false,
        }]);
      }
    } catch {
      setMessages([{ id: 0, role: 'assistant', content: '你好！我是小影 🎬\n有什么可以帮你的？', activeTools: [], streaming: false }]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ==================== 刷新会话列表 ====================
  const refreshSessions = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await fetchSessions(userId);
      setSessions(list);
    } catch { /* ignore */ }
  }, [userId]);

  // ==================== 初始化 — 打开面板 ====================
  const handleOpen = useCallback(async () => {
    setOpen(true);
    setView('chat');
    if (!userId) return;

    setSessionsLoading(true);
    try {
      // 并行：拉会话列表 + 获取/创建当前会话
      const [list, session] = await Promise.all([
        fetchSessions(userId),
        getOrCreateSession(userId),
      ]);
      setSessions(list);
      setSessionId(session.id);
      await loadMessages(session.id);
    } catch {
      // 降级：只用当前会话
      try {
        const session = await getOrCreateSession(userId);
        setSessionId(session.id);
      } catch { /* 未登录静默失败 */ }
    } finally {
      setSessionsLoading(false);
    }
  }, [userId, loadMessages]);

  // ==================== 切换会话 ====================
  const switchSession = useCallback(async (sid: number) => {
    if (sid === sessionId) { setView('chat'); return; }
    // 关闭旧 SSE
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setSessionId(sid);
    setSending(false);
    setView('chat');
    await loadMessages(sid);
  }, [sessionId, loadMessages]);

  // ==================== 新建会话 ====================
  const newSession = useCallback(async () => {
    console.log('[AiChat] newSession called, userId=', userId);
    if (!userId) {
      Toast.show({ icon: 'fail', content: '请先登录' });
      return;
    }
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setSending(false);
    try {
      const session = await createNewSession(userId);
      console.log('[AiChat] newSession created:', session);
      setSessionId(session.id);
      setMessages([{ id: 0, role: 'assistant', content: '你好！我是小影 🎬\n有什么可以帮你的？', activeTools: [], streaming: false }]);
      setView('chat');
      await refreshSessions();
    } catch (e: any) {
      console.error('[AiChat] newSession failed:', e);
      Toast.show({ icon: 'fail', content: e?.message || '创建会话失败' });
    }
  }, [userId, refreshSessions]);

  // ==================== 重命名会话 ====================
  const startRename = useCallback((sid: number, name: string) => {
    setRenamingId(sid);
    setRenameValue(name || '新对话');
  }, []);
  const submitRename = useCallback(async (sid: number) => {
    const newName = renameValue.trim();
    setRenamingId(null);
    if (!newName) return;
    try {
      await renameSessionApi(sid, newName);
      await refreshSessions();
    } catch {
      Toast.show({ icon: 'fail', content: '重命名失败' });
    }
  }, [renameValue, refreshSessions]);

  // ==================== 删除会话 ====================
  const deleteSession = useCallback(async (sid: number) => {
    try {
      await deleteSessionApi(sid);
      await refreshSessions();
      if (sid === sessionId) {
        // 当前会话被删 → 切到最新会话或新建
        const list = await fetchSessions(userId!);
        if (list.length > 0) {
          switchSession(list[0].id);
        } else {
          newSession();
        }
      }
    } catch {
      Toast.show({ icon: 'fail', content: '删除失败' });
    }
  }, [sessionId, userId, refreshSessions, switchSession, newSession]);

  // ==================== 发送消息 — SSE (fetch + ReadableStream) ====================
  const send = useCallback(async (text: string) => {
    if (!sessionId || sending || !userId) return;

    const userMsg: Message = { id: ++msgId.current, role: 'user', content: text, activeTools: [], streaming: false };
    const aiMsg: Message = { id: ++msgId.current, role: 'assistant', content: '', loading: true, activeTools: [], streaming: false };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setSending(true);
    scrollBottom();

    const params = new URLSearchParams({ message: text, conversationId: String(sessionId), userId: String(userId) });
    const url = `http://localhost:8123/api/movie-agent/smart-stream?${params.toString()}`;

    let fullText = '';
    let activeToolList: string[] = [];
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(url, {
        credentials: 'include',
        signal: controller.signal,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('不支持流式读取');

      const decoder = new TextDecoder();
      let buf = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          // SSE event type
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            continue;
          }
          // SSE data
          if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            if (!raw) continue;

            if (currentEvent === 'done') {
              currentEvent = '';
              controller.abort();
              setSending(false);
              setMessages((prev) => {
                const copy = [...prev];
                for (let i = copy.length - 1; i >= 0; i--) {
                  if (copy[i].role === 'assistant') {
                    copy[i] = { ...copy[i], streaming: false };
                    break;
                  }
                }
                return copy;
              });
              refreshSessions();
              return;
            }

            try {
              const payload: SSEPayload = JSON.parse(raw);

              // —— 工具调用 ——
              if (payload.type === 'tool_start') {
                const toolLabel = payload.d || payload.toolName || '处理中';
                activeToolList = [...activeToolList, toolLabel];
                updateAssistant({ activeTools: activeToolList, loading: false, streaming: false });
                continue;
              }

              // —— 卡片 ——
              if (payload.type === 'card') {
                activeToolList = [];
                updateAssistant({
                  cardData: { cardType: payload.cardType || 'unknown', data: payload.data },
                  loading: false, streaming: false, activeTools: [],
                });
                continue;
              }

              // —— 文本块 ——
              if (activeToolList.length > 0) activeToolList = [];
              fullText += payload.d || '';
              updateAssistant({ content: fullText, activeTools: [], loading: false, streaming: true, cardData: undefined });
            } catch { /* JSON parse error */ }
          }
        }

        if (currentEvent === 'done') { currentEvent = ''; break; }
      }

      // 自然结束（无 done 事件时）
      setSending(false);
      updateAssistant({ streaming: false });
      refreshSessions();
    } catch (err: any) {
      if (err.name === 'AbortError') return; // 正常中断
      console.error('[AiChat] SSE fetch 失败:', err);
      setSending(false);
      if (!fullText) {
        updateAssistant({ content: '抱歉，出了一点小问题，请稍后再试～', loading: false, activeTools: [], streaming: false });
      } else {
        updateAssistant({ streaming: false });
      }
      Toast.show({ icon: 'fail', content: '连接中断' });
    }

    /** 原地更新最后一条 assistant 消息 */
    function updateAssistant(patch: Partial<Message>) {
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant') {
            copy[i] = { ...copy[i], ...patch };
            break;
          }
        }
        return copy;
      });
      scrollBottom();
    }
  }, [sessionId, sending, userId, scrollBottom, refreshSessions]);

  // ==================== 外部触发 ====================
  const sendRef = useRef(send);
  sendRef.current = send;
  handleOpenRef.current = handleOpen;

  const pendingTriggerRef = useRef<string | null>(null);
  useEffect(() => {
    const unsub = useAiStore.subscribe((state) => {
      if (state.pendingMessage) {
        pendingTriggerRef.current = state.pendingMessage;
        useAiStore.getState().consumeMessage();
        handleOpenRef.current();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (open && pendingTriggerRef.current) {
      const msg = pendingTriggerRef.current;
      pendingTriggerRef.current = null;
      // 等会话加载完再发送
      const check = setInterval(() => {
        if (sessionId && !loadingHistory) {
          clearInterval(check);
          setTimeout(() => sendRef.current?.(msg), 300);
        }
      }, 200);
      return () => clearInterval(check);
    }
  }, [open, sessionId, loadingHistory]);

  // ==================== 快捷发送 ====================
  const handleSend = () => {
    const text = input.trim();
    if (!text || sending || !sessionId) return;
    setInput('');
    send(text);
  };

  const quickReply = (text: string) => send(text);

  // ==================== 关闭面板 ====================
  const handleClose = () => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setOpen(false);
    setView('chat');
  };

  // ==================== 渲染：消息气泡 ====================
  const renderBubble = (msg: Message) => {
    // —— 欢迎语 ——
    if (msg.role === 'assistant' && msg.id === 0 && !msg.loading) {
      return (
        <div className={styles.msgRow} key={msg.id}>
          <div className={styles.avatar}>🤖</div>
          <div className={`${styles.bubble} ${styles.bubbleAi}`}>
            <div className={styles.bubbleText}>{msg.content}</div>
          </div>
        </div>
      );
    }

    // —— 用户消息 ——
    if (msg.role === 'user') {
      return (
        <div className={`${styles.msgRow} ${styles.msgUserRow}`} key={msg.id}>
          <div className={`${styles.bubble} ${styles.bubbleUser}`}>
            <div className={styles.bubbleText}>{msg.content}</div>
          </div>
        </div>
      );
    }

    // —— AI 消息 ——
    if (msg.role === 'assistant') {
      const hasTools = msg.activeTools.length > 0;
      const hasText = !!msg.content;
      const showLoading = msg.loading && !hasText && !hasTools;
      return (
        <div className={styles.msgRow} key={msg.id}>
          <div className={styles.avatar}>🤖</div>
          <div className={`${styles.bubble} ${styles.bubbleAi}`}>
            {/* 初始 loading：三个点 */}
            {showLoading && (
              <span className={styles.typingDots}><i /><i /><i /></span>
            )}

            {/* 工具调用提示（参照 movie-chat-test.html 的 ⏳） */}
            {hasTools && msg.activeTools.map((toolLabel, idx) => (
              <div key={idx} className={styles.toolHint}>
                <span className={styles.toolSpinner} />
                <span>⏳ {toolLabel}</span>
              </div>
            ))}

            {/* 流式文本 + 闪烁光标 */}
            {hasText && (
              <div className={styles.bubbleText}>
                {msg.content}
                {msg.streaming && <span className={styles.streamCursor}>▍</span>}
              </div>
            )}

            {/* 推荐卡片 */}
            {msg.cardData?.cardType === 'recommendation' && (
              <RecommendationCard data={msg.cardData.data} />
            )}

            {/* 空状态兜底 */}
            {!showLoading && !hasTools && !hasText && (
              <span className={styles.typingDots}><i /><i /><i /></span>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // ==================== 渲染：历史面板 ====================
  const renderHistoryPanel = () => (
    <div className={styles.historyPanel}>
      <div className={styles.historyHeader}>
        <div className={styles.historyBack} onClick={() => setView('chat')}>
          <LeftOutline fontSize={18} />
        </div>
        <div className={styles.historyTitle}>对话历史</div>
        <div className={styles.historyNew} onClick={newSession}>
          <AddOutline fontSize={20} />
        </div>
      </div>

      <div className={styles.historyList}>
        {/* 新建对话 */}
        <div className={styles.historyItem} onClick={newSession}>
          <div className={styles.historyItemIcon}>💬</div>
          <div className={styles.historyItemContent}>
            <div className={styles.historyItemName}>+ 新建对话</div>
          </div>
        </div>

        {sessions.map((s) => (
          <div
            key={s.id}
            className={`${styles.historyItem} ${s.id === sessionId ? styles.historyItemActive : ''}`}
            onClick={() => switchSession(s.id)}
          >
            <div className={styles.historyItemIcon}>💬</div>
            <div className={styles.historyItemContent}>
              {renamingId === s.id ? (
                <Input
                  className={styles.renameInput}
                  value={renameValue}
                  onChange={setRenameValue}
                  onBlur={() => submitRename(s.id)}
                  onEnterPress={() => submitRename(s.id)}
                  autoFocus
                />
              ) : (
                <div className={styles.historyItemName}>{s.sessionName || '新对话'}</div>
              )}
              <div className={styles.historyItemTime}>{formatTime(s.editTime || s.createTime)}</div>
            </div>
            <div className={styles.historyItemActions}>
              <div
                className={styles.historyItemBtn}
                onClick={(e) => { e.stopPropagation(); startRename(s.id, s.sessionName || '新对话'); }}
              >
                ✏️
              </div>
              <div
                className={styles.historyItemBtn}
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
              >
                🗑
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && !sessionsLoading && (
          <div className={styles.historyEmpty}>暂无对话记录</div>
        )}

        {sessionsLoading && (
          <div className={styles.historyLoading}><SpinLoading color="primary" /></div>
        )}
      </div>
    </div>
  );

  // ==================== 主渲染 ====================
  return (
    <>
      {/* ===== 可拖拽悬浮按钮 ===== */}
      <div
        className={`${styles.floatBtn} ${open ? styles.floatBtnHidden : ''}`}
        style={{ left: floatPos.x, top: floatPos.y }}
        onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }}
        onMouseMove={(e) => { if (dragState.current.dragging) { e.preventDefault(); onDragMove(e.clientX, e.clientY); } }}
        onMouseUp={onDragEnd}
        onMouseLeave={() => { if (dragState.current.dragging) onDragEnd(); }}
        onTouchStart={(e) => { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); }}
        onTouchMove={(e) => { if (dragState.current.dragging) { const t = e.touches[0]; onDragMove(t.clientX, t.clientY); } }}
        onTouchEnd={onDragEnd}
      >
        <div className={styles.floatIcon}>🤖</div>
        <div className={styles.floatPulse} />
      </div>

      {/* ===== 面板 ===== */}
      {open && (
        <div className={styles.panel}>
          {/* ===== 历史视图 ===== */}
          {view === 'history' && renderHistoryPanel()}

          {/* ===== 对话视图 ===== */}
          {view === 'chat' && (
            <>
              {/* 顶栏 */}
              <div className={styles.topBar}>
                <div className={styles.topLeft}>
                  <div className={styles.topMenuBtn} onClick={() => setView('history')}>
                    <MessageOutline fontSize={20} />
                  </div>
                  <div className={styles.topTitle}>小影 · AI 助手</div>
                </div>
                <div className={styles.topRight}>
                  <div className={styles.topNewBtn} onClick={newSession}>
                    <AddOutline fontSize={20} />
                  </div>
                  <div className={styles.topClose} onClick={handleClose}>
                    <CloseOutline fontSize={20} />
                  </div>
                </div>
              </div>

              {/* 消息列表 */}
              <div className={styles.messages} ref={listRef}>
                {loadingHistory ? (
                  <div className={styles.loadingWrap}>
                    <SpinLoading color="primary" style={{ '--size': '24px' }} />
                    <span className={styles.loadingText}>加载中...</span>
                  </div>
                ) : (
                  messages.map(renderBubble)
                )}

                {messages.length <= 1 && !loadingHistory && (
                  <div className={styles.quickReplies}>
                    <span className={styles.quickLabel}>试试问我：</span>
                    <div className={styles.quickBtns}>
                      <span className={styles.quickBtn} onClick={() => quickReply('推荐好看的电影')}>推荐好看的电影</span>
                      <span className={styles.quickBtn} onClick={() => quickReply('附近有哪些影院')}>附近有哪些影院</span>
                      <span className={styles.quickBtn} onClick={() => quickReply('最近有什么新片')}>最近有什么新片</span>
                      <span className={styles.quickBtn} onClick={() => quickReply('我想看IMAX')}>我想看IMAX</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入栏 */}
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
                    disabled={!input.trim() || sending || !sessionId}
                    loading={sending}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AiChat;
