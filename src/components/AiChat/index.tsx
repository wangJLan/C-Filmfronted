import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, TextArea, Toast, SafeArea, SpinLoading, Input } from 'antd-mobile';
import {
  AddOutline,
  CalendarOutline,
  CheckCircleFill,
  ClockCircleOutline,
  CloseOutline,
  LeftOutline,
  LocationOutline,
  MessageOutline,
  MovieOutline,
  ReceiptOutline,
  RightOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'umi';
import { useAiStore } from '@/stores/useAiStore';
import { useUserStore } from '@/stores/useUserStore';
import request from '@/libs/request';
import { getOrderDetail } from '@/api/orderController';
import dayjs from 'dayjs';
import styles from './index.module.less';

// ==================== 类型 ====================
interface ChatSessionItem {
  id: string;
  sessionName: string;
  userId: string;
  editTime: string;
  createTime: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  /** 当前正在执行的工具列表（展示在气泡内） */
  activeTools: { key: string; label: string }[];
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

interface OrderConfirmCardData {
  success?: boolean;
  error?: string;
  message?: string;
  orderId?: string | number;
  orderNo?: string;
  filmId?: string | number;
  cinemaId?: string | number;
  scheduleId?: string | number;
  filmName?: string;
  cinemaName?: string;
  hallName?: string;
  showTime?: string;
  scheduleTime?: string;
  seatLabels?: string[];
  count?: number;
  totalPrice?: number | string;
  expireInMinutes?: number;
  remainingMinutes?: number;
  expireAt?: string;
  status?: string;
  createTime?: string;
}

// ==================== API 封装 ====================
async function getOrCreateSession(userId: string): Promise<ChatSessionItem> {
  return request<ChatSessionItem>(`/chatSession/current?userId=${userId}`, { method: 'GET' });
}

async function createNewSession(userId: string): Promise<ChatSessionItem> {
  return request<ChatSessionItem>(`/chatSession/create?userId=${userId}`, { method: 'POST' });
}

async function fetchSessions(userId: string): Promise<ChatSessionItem[]> {
  return request<ChatSessionItem[]>(`/chatSession/listByUser?userId=${userId}`, { method: 'GET' });
}

async function fetchChatHistory(sessionId: string): Promise<{ message: string; messageType: string }[]> {
  return request<{ message: string; messageType: string }[]>(
    `/chatHistory/listBySession/${sessionId}`,
    { method: 'GET' },
  );
}

async function renameSessionApi(id: string, name: string): Promise<boolean> {
  return request<boolean>(`/chatSession/rename?id=${id}&name=${encodeURIComponent(name)}`, { method: 'PUT' });
}

async function deleteSessionApi(id: string): Promise<boolean> {
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

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCardEnvelope(value: unknown): SSECardData | null {
  if (!isRecord(value) || value.type !== 'card' || typeof value.cardType !== 'string') return null;
  return { cardType: value.cardType, data: value.data };
}

function tryParseCardJson(raw: string): SSECardData | null {
  try {
    return parseCardEnvelope(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** 兼容旧回复：模型可能把卡片协议放进 JSON 代码块并作为普通文本输出。 */
function extractCardFromText(content: string): { card: SSECardData; text: string } | null {
  const fencePattern = /`{2,3}(?:json)?\s*([\s\S]*?)\s*`{2,3}/gi;
  let match: RegExpExecArray | null;

  while ((match = fencePattern.exec(content)) !== null) {
    const card = tryParseCardJson(match[1].trim());
    if (card) {
      const text = `${content.slice(0, match.index)}${content.slice(match.index + match[0].length)}`.trim();
      return { card, text };
    }
  }

  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^`{2,3}(?:json)?\s*/i, '')
    .replace(/\s*`{2,3}$/i, '')
    .trim();
  const wholeCard = tryParseCardJson(unfenced);
  if (wholeCard) return { card: wholeCard, text: '' };

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const embeddedCard = tryParseCardJson(content.slice(firstBrace, lastBrace + 1));
    if (embeddedCard) {
      return {
        card: embeddedCard,
        text: `${content.slice(0, firstBrace)}${content.slice(lastBrace + 1)}`.trim(),
      };
    }
  }

  return null;
}

function isPendingCardText(content: string): boolean {
  const trimmed = content.trimStart();
  const fenceMatch = trimmed.match(/^`{2,3}(?:json)?\s*/i);
  if (fenceMatch) {
    const body = trimmed.slice(fenceMatch[0].length);
    return body.length < 80 || /"type"\s*:\s*"card"/i.test(body);
  }
  return /^\{\s*"type"\s*:\s*"card"/i.test(trimmed);
}

function formatOrderTime(value?: string): { date: string; time: string } {
  if (!value) return { date: '场次时间待确认', time: '' };
  const parsed = dayjs(value);
  if (!parsed.isValid()) return { date: value, time: '' };
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return { date: `${parsed.format('M月D日')} ${weekdays[parsed.day()]}`, time: parsed.format('HH:mm') };
}

function formatPrice(value?: number | string): string {
  const price = Number(value);
  if (!Number.isFinite(price)) return '--';
  return price.toFixed(2);
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`;
}

// ==================== 卡片组件 ====================

type CardNavigate = (path: string) => void;

function routeId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const id = String(value).trim();
  return id ? encodeURIComponent(id) : null;
}

function getItemRoute(item: any): string | undefined {
  const scheduleId = routeId(item?.scheduleId ?? item?.showtimeId);
  if (scheduleId) return `/seat/${scheduleId}`;
  const filmId = routeId(item?.filmId);
  if (filmId) return `/detail/${filmId}`;
  const cinemaId = routeId(item?.cinemaId);
  if (cinemaId) return `/showtime/cinema/${cinemaId}`;
  return undefined;
}

function getScheduleSelectionRoute(item: any): string | undefined {
  const filmId = routeId(item?.filmId);
  const cinemaId = routeId(item?.cinemaId);
  if (filmId && cinemaId) return `/showtime/${filmId}/${cinemaId}`;
  if (filmId) return `/showtime/film/${filmId}`;
  if (cinemaId) return `/showtime/cinema/${cinemaId}`;
  return undefined;
}

const CardSurface: React.FC<{
  children: React.ReactNode;
  path?: string;
  ariaLabel: string;
  onNavigate?: CardNavigate;
  className?: string;
}> = ({ children, path, ariaLabel, onNavigate, className = '' }) => {
  const classes = `${styles.cardItem} ${path && onNavigate ? styles.cardItemButton : ''} ${className}`.trim();
  if (!path || !onNavigate) return <div className={classes}>{children}</div>;

  return (
    // 用可点击 div 而非 button：卡片内部还有操作按钮（选座购票等），button 不能嵌套 button
    <div
      role="button"
      tabIndex={0}
      className={classes}
      aria-label={ariaLabel}
      onClick={() => onNavigate(path)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(path); }
      }}
    >
      {children}
      <RightOutline className={styles.cardChevron} aria-hidden="true" />
    </div>
  );
};

const FilmPoster: React.FC<{ src?: string; filmName?: string }> = ({ src, filmName }) => {
  const [failed, setFailed] = useState(!src);

  useEffect(() => setFailed(!src), [src]);

  const alt = `${filmName || '影片'}海报`;
  if (failed) {
    return (
      <span className={styles.filmPosterFallback} role="img" aria-label={`${alt}暂不可用`}>
        <MovieOutline />
      </span>
    );
  }

  return (
    <span className={styles.filmPoster}>
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
};

/** 推荐卡片（兼容旧格式） */
const RecommendationCard: React.FC<{ data: any; onNavigate?: CardNavigate }> = ({ data, onNavigate }) => {
  const alternatives: any[] = data?.alternatives || [];
  if (alternatives.length === 0) return null;
  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>{data?.reason || '为您找到以下备选方案：'}</div>
      {alternatives.map((item: any, idx: number) => {
        const path = getItemRoute(item);
        const hasSchedule = !!(item.scheduleId || item.showtimeId);
        return (
        <CardSurface
          key={item.scheduleId ?? item.filmId ?? item.cinemaId ?? idx}
          path={path}
          ariaLabel={`打开${item.filmName || item.cinemaName || '推荐内容'}`}
          onNavigate={onNavigate}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardFilmName}>{item.filmName}</span>
            {item.rating != null && <span className={styles.cardRating}>{item.rating} 分</span>}
          </div>
          <div className={styles.cardMeta}>{item.cinemaName} · {item.date} {item.time}</div>
          <div className={styles.cardFooter}>
            <span className={styles.cardHall}>{item.hall}</span>
            <span className={styles.cardPrice}>¥{item.price}</span>
            <span className={styles.cardSeats}>余{item.availableSeats}座</span>
          </div>
          {path && onNavigate && (
            <div className={styles.cardActionRow}>
              <button
                type="button"
                className={styles.cardActionBtn}
                onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
              >
                {hasSchedule ? '选座购票' : '查看详情'}
              </button>
            </div>
          )}
        </CardSurface>
        );
      })}
    </div>
  );
};

/** 影片列表卡片 */
const FilmListCard: React.FC<{ data: any; onNavigate?: CardNavigate }> = ({ data, onNavigate }) => {
  const films: any[] = data?.films || [];
  if (films.length === 0) return <div className={styles.cardWrap}><div className={styles.cardReason}>暂无影片</div></div>;
  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>为您找到 {films.length} 部影片</div>
      {films.map((f: any, i: number) => {
        const path = getItemRoute(f);
        return (
        <CardSurface
          key={f.filmId ?? i}
          path={path}
          ariaLabel={`查看影片${f.name || ''}详情`}
          onNavigate={onNavigate}
          className={styles.filmCardItem}
        >
          <FilmPoster src={f.posterUrl} filmName={f.name} />
          <div className={styles.filmCardContent}>
            <div className={styles.cardHeader}>
              <span className={styles.cardFilmName}>{f.name}</span>
              {f.rating != null && <span className={styles.cardRating}>{f.rating} 分</span>}
            </div>
            <div className={styles.cardMeta}>{[f.type, f.duration ? `${f.duration}分钟` : ''].filter(Boolean).join(' · ')}</div>
            <div className={styles.cardFooter}>
              {f.director && <span className={styles.cardHall}>{f.director}</span>}
              {f.releaseDate && <span className={styles.cardSeats}>上映 {f.releaseDate}</span>}
            </div>
            {path && onNavigate && (
              <div className={styles.cardActionRow}>
                <button
                  type="button"
                  className={styles.cardActionBtn}
                  onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
                >
                  查看详情
                </button>
              </div>
            )}
          </div>
        </CardSurface>
        );
      })}
    </div>
  );
};

/** 影院列表卡片 */
const CinemaListCard: React.FC<{ data: any; onNavigate?: CardNavigate }> = ({ data, onNavigate }) => {
  const cinemas: any[] = data?.cinemas || [];
  if (cinemas.length === 0) return <div className={styles.cardWrap}><div className={styles.cardReason}>暂无影院</div></div>;
  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>为您找到 {cinemas.length} 家影院</div>
      {cinemas.map((c: any, i: number) => {
        const path = getItemRoute(c);
        // ★ 兼容 name / cinemaName / amapName 三种字段名
        const displayName = c.name || c.cinemaName || c.amapName || '未知影院';
        // 距离 + 地址
        const metaParts = [c.distanceText, c.address].filter(Boolean);
        return (
        <CardSurface
          key={c.cinemaId ?? i}
          path={path}
          ariaLabel={`查看影院${displayName}场次`}
          onNavigate={onNavigate}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardFilmName}>{displayName}</span>
            {c.basePrice != null && <span className={styles.cardPrice}>¥{c.basePrice}起</span>}
          </div>
          <div className={styles.cardMeta}>{metaParts.join(' · ')}</div>
          {path && onNavigate && (
            <div className={styles.cardActionRow}>
              <button
                type="button"
                className={styles.cardActionBtn}
                onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
              >
                查看场次
              </button>
            </div>
          )}
        </CardSurface>
        );
      })}
    </div>
  );
};

/** 场次列表卡片（按影院分组展示，默认每影院最多显示 3 场，可展开全部） */
const ScheduleListCard: React.FC<{ data: any; onNavigate?: CardNavigate }> = ({ data, onNavigate }) => {
  const schedules: any[] = data?.schedules || data?.sessions || [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  if (schedules.length === 0) {
    return <div className={styles.cardWrap}><div className={styles.cardReason}>暂无场次</div></div>;
  }
  // 按影院分组：无影院名的场次归入"其他影院"，保证跨影院结果能看清归属
  const groups = new Map<string, any[]>();
  schedules.forEach((s: any) => {
    const key = s.cinemaName || '其他影院';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  });
  // 每影院默认只显示最接近目标时间的前 3 场（工具已按接近度排序），避免一次列出全部
  const MAX_SHOW = 3;
  const fmtTime = (t?: any) => (t ? String(t).slice(0, 5) : '');
  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>可选场次（按影院分组）</div>
      {Array.from(groups.entries()).map(([cinemaName, list]) => {
        const isExpanded = !!expanded[cinemaName];
        const visible = isExpanded ? list : list.slice(0, MAX_SHOW);
        return (
        <div key={cinemaName} className={styles.cinemaGroup}>
          <div className={styles.cinemaGroupName}>{cinemaName}</div>
          {visible.map((s: any, i: number) => {
            const path = getItemRoute(s);
            return (
            <CardSurface
              key={s.scheduleId ?? i}
              path={path}
              ariaLabel={`选择${s.cinemaName || ''} ${s.showDate || ''} ${s.startTime || ''}场次`}
              onNavigate={onNavigate}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardFilmName}>{fmtTime(s.startTime)}</span>
                <span className={styles.cardPrice}>¥{s.price}</span>
              </div>
              <div className={styles.cardMeta}>{s.showDate} · {s.hallName}{(s.version || s.hallType) ? ` · ${s.version || s.hallType}` : ''}</div>
              <div className={styles.cardFooter}>
                {s.availableSeats != null && <span className={styles.cardSeats}>余{s.availableSeats}座</span>}
              </div>
              {path && onNavigate && (
                <div className={styles.cardActionRow}>
                  <button
                    type="button"
                    className={styles.cardActionBtn}
                    onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
                  >
                    选座购票
                  </button>
                </div>
              )}
            </CardSurface>
            );
          })}
          {list.length > MAX_SHOW && (
            <button
              type="button"
              className={styles.cardExpandBtn}
              onClick={() => setExpanded((prev) => ({ ...prev, [cinemaName]: !prev[cinemaName] }))}
            >
              {isExpanded ? '收起' : `展开全部 ${list.length} 场`}
            </button>
          )}
        </div>
        );
      })}
    </div>
  );
};

function normalizeSeatRows(data: any): any[][] {
  if (Array.isArray(data?.seatGrid)) {
    return data.seatGrid
      .filter(Array.isArray)
      .map((row: any[]) => row.filter(isRecord))
      .filter((row: any[]) => row.length > 0);
  }

  const legacySeats: any[] = Array.isArray(data?.seats) ? data.seats.filter(isRecord) : [];
  const rows = new Map<string, any[]>();
  legacySeats.forEach((seat) => {
    const row = String(seat.rowNum ?? seat.row ?? '?');
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(seat);
  });
  return Array.from(rows.values()).map((row) => row.sort(
    (a, b) => Number(a.colNum ?? a.col ?? 0) - Number(b.colNum ?? b.col ?? 0),
  ));
}

/** 座位图卡片 */
const SeatMapCard: React.FC<{ data: any; onNavigate?: CardNavigate }> = ({ data, onNavigate }) => {
  const rows = normalizeSeatRows(data);
  if (rows.length === 0) {
    return <div className={styles.cardWrap}><div className={styles.cardReason}>暂无座位信息</div></div>;
  }

  const scheduleId = routeId(data?.scheduleId ?? data?.showtimeId);
  const path = scheduleId ? `/seat/${scheduleId}` : getScheduleSelectionRoute(data);

  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>{data?.hallName ? `${data.hallName}座位图` : '座位图'} · 绿色可选</div>
      <CardSurface path={path} ariaLabel="打开选座页面" onNavigate={onNavigate} className={styles.seatMapSurface}>
        <div className={styles.seatMapSummary}>
          <span>{data?.availableCount != null ? `可选 ${data.availableCount} 座` : '查看实时座位'}</span>
        </div>
        <div className={styles.seatGridViewport}>
          <div className={styles.seatGrid}>
            {rows.map((rowSeats, rowIndex) => {
              const rowNumber = rowSeats.find((seat) => seat?.rowNum != null || seat?.row != null)?.rowNum
                ?? rowSeats.find((seat) => seat?.rowNum != null || seat?.row != null)?.row
                ?? rowIndex + 1;
              return (
              <div key={String(rowNumber)} className={styles.seatRow}>
                <span className={styles.seatRowLabel}>{rowNumber}排</span>
                {rowSeats.map((s: any, i: number) => {
                  const status = s.status || 'sold';
                  const seatClass = status === 'aisle'
                    ? styles.seatAisle
                    : status === 'available'
                      ? styles.seatFree
                      : status === 'locked'
                        ? styles.seatLocked
                        : styles.seatSold;
                  return (
                    <span
                      key={s.seatId ?? `${rowNumber}-${s.colNum ?? s.col ?? i}`}
                      className={`${styles.seat} ${seatClass}`}
                      aria-hidden="true"
                    >
                      {status === 'aisle' ? '' : s.colNum ?? s.col ?? i + 1}
                    </span>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>
        {path && onNavigate && (
          <div className={styles.cardActionRow}>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
            >
              去选座
            </button>
          </div>
        )}
      </CardSurface>
    </div>
  );
};

/** 订单确认卡片（兼容 order_confirm 与旧 order_detail） */
const OrderConfirmCard: React.FC<{
  data: OrderConfirmCardData;
  onOpenOrder?: (data: OrderConfirmCardData) => void;
  onNavigate?: CardNavigate;
}> = ({ data, onOpenOrder, onNavigate }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  // ★ 订单实际状态：卡片数据为下单时快照（pending），支付后异步查后端刷新为 paid
  const [orderStatus, setOrderStatus] = useState<string | undefined>(data?.status);

  // 倒计时：基于 expireAt 绝对时间，刷新/重置不会从头计时
  useEffect(() => {
    const orderId = data?.orderId;
    if (!orderId) return;
    let alive = true;
    let timer: number | undefined;
    // ★ 轮询订单状态：下单时查到 pending，支付完成后刷新为 paid（卡片不重新渲染也能更新）
    const check = () => {
      getOrderDetail({ id: orderId as any })
        .then((o: any) => {
          const vo = o?.data ?? o;
          if (alive && vo?.status) {
            setOrderStatus(vo.status);
            if (vo.status !== 'pending' && timer) window.clearInterval(timer);
          }
        })
        .catch(() => { /* 忽略，保留快照状态 */ });
    };
    timer = window.setInterval(check, 8000);
    check();
    return () => { alive = false; if (timer) window.clearInterval(timer); };
  }, [data?.orderId]);

  const isPaid = orderStatus === 'paid' || orderStatus === 'completed';

  useEffect(() => {
    const tick = () => {
      if (data?.expireAt) {
        const expireMs = new Date(data.expireAt).getTime();
        if (!Number.isNaN(expireMs)) {
          const remaining = Math.max(0, Math.floor((expireMs - Date.now()) / 1000));
          setRemainingSeconds(remaining);
          return remaining > 0;
        }
      }
      // 兜底：相对时长（无 expireAt 时）
      const expiryMinutes = Math.max(0, Number(data?.expireInMinutes ?? data?.remainingMinutes ?? 15) || 15);
      setRemainingSeconds(Math.round(expiryMinutes * 60));
      return false;
    };

    if (!tick()) return;
    const timer = window.setInterval(() => {
      if (!tick()) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [data?.orderId, data?.expireAt]);

  if (data?.success === false) {
    const errorMsg = data?.error || data?.message || '订单创建失败，请重新选择座位';
    const filmId = routeId(data?.filmId as any);
    const cinemaId = routeId(data?.cinemaId as any);
    const scheduleId = routeId(data?.scheduleId as any);
    // 根据错误类型和已有信息生成跳转路径，兜底也有按钮
    let actionPath: string;
    let actionLabel: string;
    if (errorMsg.includes('场次')) {
      if (filmId && cinemaId) { actionPath = `/showtime/${filmId}/${cinemaId}`; actionLabel = '去选场次'; }
      else if (filmId) { actionPath = `/showtime/film/${filmId}`; actionLabel = '去选场次'; }
      else { actionPath = '/'; actionLabel = '去选电影'; }
    } else if (errorMsg.includes('座位')) {
      if (scheduleId) { actionPath = `/seat/${scheduleId}`; actionLabel = '去选座位'; }
      else { actionPath = '/'; actionLabel = '去选场次'; }
    } else {
      actionPath = '/'; actionLabel = '重新开始';
    }
    return (
      <div className={styles.cardError} role="alert">
        <div className={styles.cardErrorText}>{errorMsg}</div>
        <div className={styles.cardErrorActions}>
          <button className={styles.cardActionBtn} onClick={() => onNavigate?.(actionPath)}>
            {actionLabel}
          </button>
          <button className={styles.cardActionBtnSecondary} onClick={() => {
            const input = document.querySelector('textarea') as HTMLTextAreaElement;
            if (input) { input.focus(); }
          }}>
            在对话中描述需求
          </button>
        </div>
      </div>
    );
  }

  const showTime = formatOrderTime(data?.showTime || data?.scheduleTime);
  const seats = Array.isArray(data?.seatLabels) ? data.seatLabels : [];
  const ticketCount = data?.count ?? seats.length;
  const expired = remainingSeconds <= 0;

  return (
    <section className={styles.orderCard} aria-label={`${data?.filmName || '电影票'}订单确认`}>
      <header className={styles.orderCardHeader}>
        <div className={styles.orderStatus}>
          <span className={styles.orderStatusIcon}><CheckCircleFill /></span>
          <div>
            <div className={styles.orderStatusTitle}>订单已生成</div>
            {data?.orderNo && <div className={styles.orderNo}>订单号 {data.orderNo}</div>}
          </div>
        </div>
        <span className={isPaid ? styles.orderPaid : orderStatus === 'cancelled' ? styles.orderCancelled : orderStatus === 'refunded' ? styles.orderRefunded : styles.orderPending}>
          {isPaid ? '已支付' : orderStatus === 'cancelled' ? '已取消' : orderStatus === 'refunded' ? '已退款' : '待支付'}
        </span>
      </header>

      <div className={styles.orderCardBody}>
        <div className={styles.orderFilmRow}>
          <span className={styles.orderFilmIcon}><MovieOutline /></span>
          <div className={styles.orderFilmInfo}>
            <h3>{data?.filmName || '电影票订单'}</h3>
            <p>{data?.cinemaName || '影院信息待确认'}</p>
          </div>
          <div className={styles.orderPrice}><span>¥</span>{formatPrice(data?.totalPrice)}</div>
        </div>

        <div className={styles.orderDivider} />

        <div className={styles.orderDetails}>
          <div className={styles.orderDetailRow}>
            <CalendarOutline />
            <span>{showTime.date}</span>
            {showTime.time && <strong>{showTime.time}</strong>}
          </div>
          <div className={styles.orderDetailRow}>
            <LocationOutline />
            <span>{data?.hallName || '影厅待确认'}</span>
          </div>
        </div>

        {seats.length > 0 && (
          <div className={styles.orderSeats}>
            <span className={styles.orderSeatsLabel}>座位</span>
            <div className={styles.orderSeatList}>
              {seats.map((seat) => <span key={seat} className={styles.orderSeat}>{seat}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className={`${styles.orderCountdown} ${expired ? styles.orderCountdownExpired : ''}`}>
        <ClockCircleOutline />
        {isPaid ? (
          <span>订单已支付，请查看订单</span>
        ) : expired ? (
          <span>订单已超时，座位将自动释放</span>
        ) : (
          <>
            <span>请在倒计时内完成支付</span>
            <strong aria-label={`剩余 ${formatCountdown(remainingSeconds)}`}>{formatCountdown(remainingSeconds)}</strong>
          </>
        )}
      </div>

      <footer className={styles.orderCardFooter}>
        <div className={styles.orderSummary}>
          <span>共 {ticketCount} 张</span>
          <strong>合计 ¥{formatPrice(data?.totalPrice)}</strong>
        </div>
        {data?.orderId && (
          <button
            type="button"
            className={styles.orderAction}
            onClick={() => onOpenOrder?.(data)}
            disabled={expired}
          >
            <ReceiptOutline />
            <span>查看订单</span>
            <RightOutline />
          </button>
        )}
      </footer>
    </section>
  );
};

/** 支付卡片 */
const PaymentCard: React.FC<{ data: any; onNavigate?: CardNavigate }> = ({ data, onNavigate }) => {
  if (!data?.success) {
    return <div className={styles.cardError}>{data?.message || '支付异常'}</div>;
  }

  const orderId = data.orderId;
  const disabled = !orderId;

  const handlePay = () => {
    if (orderId) {
      onNavigate?.(`/payment/${encodeURIComponent(String(orderId))}`);
    }
  };

  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>确认支付</div>
      <div className={styles.cardItem}>
        <div className={styles.cardHeader}><span className={styles.cardFilmName}>{data.filmName}</span><span className={styles.cardPrice}>¥{data.totalPrice}</span></div>
        <div className={styles.cardMeta}>{data.cinemaName} · {data.scheduleTime}</div>
        <div className={styles.cardFooter}><span className={styles.cardSeats}>{data.seatLabels?.join('、')}</span></div>

        <div className={styles.payActionWrap}>
          <button type="button" className={styles.payBtn} onClick={handlePay} disabled={disabled}>
            立即支付 ¥{data.totalPrice}
          </button>
        </div>
      </div>
    </div>
  );
};

/** 座位替代方案卡片 —— 锁座失败时展示可选替代座位 */
const SeatAlternativesCard: React.FC<{ data: any }> = ({ data }) => {
  const conflictSeats: any[] = data?.conflictSeats || [];
  const alternatives: any[] = data?.alternatives || [];
  const conflictLabels = conflictSeats.map((s: any) => s.seatLabel).filter(Boolean).join('、');

  // 按排分组
  const grouped: Record<string, any[]> = {};
  alternatives.forEach((s: any) => {
    const row = String(s.seatLabel || '').match(/(\d+)排/)?.[1] || '?';
    if (!grouped[row]) grouped[row] = [];
    grouped[row].push(s);
  });

  const handleSelect = (seatLabel: string, seatId: number) => {
    const triggerMsg = `选 ${seatLabel}`;
    useAiStore.getState().triggerAi(triggerMsg);
  };

  if (alternatives.length === 0) {
    return (
      <div className={styles.cardWrap}>
        <div className={styles.cardReason}>{data?.message || '座位已被占用'}</div>
        {conflictLabels && (
          <div className={styles.cardMeta}>冲突座位：{conflictLabels}</div>
        )}
        <div className={styles.cardMeta}>该场次暂无可用替代座位，建议更换场次</div>
      </div>
    );
  }

  return (
    <div className={styles.cardWrap}>
      <div className={styles.cardReason}>
        {data?.message || `${conflictLabels || '所选座位'} 已被占用，为您推荐替代方案：`}
      </div>
      <div className={styles.altList}>
        {Object.entries(grouped).map(([row, rowSeats], gi) => {
          // 每排取连续2个座位作为方案
          const plans: { label: string; seats: any[] }[] = [];
          for (let i = 0; i < rowSeats.length - 1; i++) {
            plans.push({
              label: `${String.fromCharCode(65 + plans.length)}`,
              seats: [rowSeats[i], rowSeats[i + 1]],
            });
            if (plans.length >= 3) break; // 最多3个方案
          }
          if (plans.length === 0 && rowSeats.length === 1) {
            plans.push({ label: `${String.fromCharCode(65)}`, seats: [rowSeats[0]] });
          }

          return (
            <div key={row} className={styles.altGroup}>
              <div className={styles.altGroupTitle}>{row}排可选方案</div>
              {plans.map((plan) => (
                <button
                  key={plan.label}
                  type="button"
                  className={styles.altPlanCard}
                  onClick={() => {
                    const labels = plan.seats.map((s: any) => s.seatLabel).join(' + ');
                    const ids = plan.seats.map((s: any) => s.seatId);
                    useAiStore.getState().triggerAi(`帮我选 ${labels}`);
                  }}
                >
                  <span className={styles.altPlanBadge}>方案{plan.label}</span>
                  <span className={styles.altPlanSeats}>
                    {plan.seats.map((s: any) => s.seatLabel).join(' + ')}
                  </span>
                  <span className={styles.altPlanZone}>
                    {plan.seats[0]?.zone === 'vip' ? 'VIP区' : '普通区'}
                  </span>
                  <RightOutline className={styles.altPlanArrow} />
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className={styles.cardMeta} style={{ marginTop: 8 }}>点击方案即可快速选择，也可以告诉我其他偏好～</div>
    </div>
  );
};

/** 座位锁定确认卡片 */
const SeatsConfirmedCard: React.FC<{ data: any }> = ({ data }) => {
  const lockedSeats: string[] = data?.lockedSeats || [];
  const totalPrice = data?.totalPrice;
  const count = data?.count || lockedSeats.length;

  return (
    <section className={styles.seatsConfirmedCard}>
      <div className={styles.seatsConfirmedHeader}>
        <CheckCircleFill className={styles.seatsConfirmedIcon} />
        <span>座位已锁定</span>
      </div>
      <div className={styles.seatsConfirmedBody}>
        <div className={styles.seatsConfirmedRow}>
          <span className={styles.seatsConfirmedLabel}>座位</span>
          <div className={styles.orderSeatList}>
            {lockedSeats.map((s) => (
              <span key={s} className={styles.orderSeat}>{s}</span>
            ))}
          </div>
        </div>
        <div className={styles.seatsConfirmedRow}>
          <span className={styles.seatsConfirmedLabel}>数量</span>
          <span>{count} 张</span>
        </div>
        {totalPrice != null && (
          <div className={styles.seatsConfirmedRow}>
            <span className={styles.seatsConfirmedLabel}>票价</span>
            <strong>¥{formatPrice(totalPrice)}</strong>
          </div>
        )}
      </div>
    </section>
  );
};

/** 卡片路由 */
const ToolResultCard: React.FC<{
  cardType: string;
  data: any;
  onOpenOrder?: (data: OrderConfirmCardData) => void;
  onNavigate?: CardNavigate;
}> = ({ cardType, data, onOpenOrder, onNavigate }) => {
  switch (cardType) {
    case 'film_list':         return <FilmListCard data={data} onNavigate={onNavigate} />;
    case 'cinema_list':       return <CinemaListCard data={data} onNavigate={onNavigate} />;
    case 'schedule_list':     return <ScheduleListCard data={data} onNavigate={onNavigate} />;
    case 'seat_map':          return <SeatMapCard data={data} onNavigate={onNavigate} />;
    case 'seat_alternatives': return <SeatAlternativesCard data={data} />;
    case 'seats_confirmed':   return <SeatsConfirmedCard data={data} />;
    case 'order_confirm':
    case 'order_detail':      return <OrderConfirmCard data={data} onOpenOrder={onOpenOrder} onNavigate={onNavigate} />;
    case 'payment_form':      return <PaymentCard data={data} onNavigate={onNavigate} />;
    case 'recommendation':    return <RecommendationCard data={data} onNavigate={onNavigate} />;
    default:                  return null;
  }
};

// ==================== 组件 ====================
const AiChat: React.FC = () => {
  const navigate = useNavigate();
  // —— 面板 & 视图 ——
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');

  // —— 会话 ——
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
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

  // —— 视口变化适配：初始位置按挂载时视口计算，切窄屏/手机宽度后 clamp 回视口内，避免按钮跑到屏幕外 ——
  useEffect(() => {
    const onResize = () => {
      setFloatPos((prev) => ({
        x: Math.min(prev.x, Math.max(window.innerWidth - 52, 0)),
        y: Math.min(prev.y, Math.max(window.innerHeight - 52, 0)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
  const loadMessages = useCallback(async (sid: string) => {
    setLoadingHistory(true);
    setMessages([]);
    try {
      const history = await fetchChatHistory(sid);
      if (history && history.length > 0) {
        // 后端存储顺序：user → card → ai（三条独立记录）
        // 需要将 card 消息合并到紧随其后的 ai 消息中，
        // 使卡片出现在 AI 文本下方，与实时对话渲染一致
        const msgs: Message[] = [];
        let pendingCard: SSECardData | null = null;
        let idCounter = 0;

        for (const h of history) {
          const mtype = h.messageType || '';
          if (mtype === 'user') {
            // 先落盘之前挂起的 card（如果有未匹配的 card 挂在用户消息前）
            if (pendingCard) {
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.cardData = pendingCard;
              }
              pendingCard = null;
            }
            msgs.push({
              id: ++idCounter,
              role: 'user',
              content: h.message || '',
              activeTools: [],
              streaming: false,
            });
          } else if (mtype === 'card') {
            // 挂起 card，等待紧随其后的 ai 消息
            const card = tryParseCardJson(h.message || '');
            if (card) {
              pendingCard = card;
            }
          } else {
            // ai 消息：将挂起的 card 合并到当前消息
            const parsedCard = extractCardFromText(h.message || '');
            msgs.push({
              id: ++idCounter,
              role: 'assistant',
              content: parsedCard?.text ?? h.message ?? '',
              activeTools: [],
              streaming: false,
              cardData: pendingCard || parsedCard?.card || undefined,
            });
            pendingCard = null;
          }
        }

        // 兜底：末尾还有未匹配的 card
        if (pendingCard) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.cardData = pendingCard;
          }
        }

        setMessages(msgs.length > 0 ? msgs : [{
          id: 0,
          role: 'assistant',
          content: '你好！我是小影 🎬\n\n我可以帮你：\n• 推荐热映电影\n• 查找附近影院\n• 选座购票\n• 解答观影疑问',
          activeTools: [],
          streaming: false,
        }]);
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
  const switchSession = useCallback(async (sid: string) => {
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
  const startRename = useCallback((sid: string, name: string) => {
    setRenamingId(sid);
    setRenameValue(name || '新对话');
  }, []);
  const submitRename = useCallback(async (sid: string) => {
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
  const deleteSession = useCallback(async (sid: string) => {
    try {
      await deleteSessionApi(sid);
      await refreshSessions();
      if (sid === sessionId) {
        // 当前会话被删 → 新建会话替代，保证始终有活跃会话；失败则清空状态
        if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
        setSending(false);
        try {
          const session = await createNewSession(userId!);
          setSessionId(session.id);
          setMessages([{ id: 0, role: 'assistant', content: '你好！我是小影 🎬\n有什么可以帮你的？', activeTools: [], streaming: false }]);
          await refreshSessions();
        } catch {
          setSessionId(null);
          setMessages([{ id: 0, role: 'assistant', content: '你好！我是小影 🎬\n有什么可以帮你的？', activeTools: [], streaming: false }]);
        }
      }
    } catch {
      Toast.show({ icon: 'fail', content: '删除失败' });
    }
  }, [sessionId, userId, refreshSessions]);

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
    let activeToolList: { key: string; label: string }[] = [];
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

      for (;;) {
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

              // —— 工具调用（按 toolName 去重，避免同一工具重复显示） ——
              if (payload.type === 'tool_start') {
                const toolLabel = payload.d || payload.toolName || '处理中';
                const toolKey = payload.toolName || toolLabel;
                // 只保留不重复的工具名，同一个工具只显示一次
                if (!activeToolList.find(t => t.key === toolKey)) {
                  activeToolList = [...activeToolList, { key: toolKey, label: toolLabel }];
                }
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
              const parsedCard = extractCardFromText(fullText);
              if (parsedCard) {
                fullText = parsedCard.text;
                updateAssistant({
                  content: parsedCard.text,
                  cardData: parsedCard.card,
                  activeTools: [],
                  loading: false,
                  streaming: true,
                });
              } else {
                updateAssistant({
                  content: isPendingCardText(fullText) ? '' : fullText,
                  activeTools: [],
                  loading: false,
                  streaming: true,
                });
              }
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

  // Refs to track current state for the subscription callback (which runs in a stale closure)
  const openRef = useRef(open);
  openRef.current = open;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const loadingHistoryRef = useRef(loadingHistory);
  loadingHistoryRef.current = loadingHistory;

  const pendingTriggerRef = useRef<string | null>(null);
  useEffect(() => {
    const unsub = useAiStore.subscribe((state) => {
      if (state.pendingMessage) {
        const msg = state.pendingMessage;
        useAiStore.getState().consumeMessage();
        // 如果面板已打开且会话就绪 → 直接发送
        if (openRef.current && sessionIdRef.current && !loadingHistoryRef.current) {
          setTimeout(() => sendRef.current?.(msg), 300);
        } else {
          // 面板未打开 → 先打开面板
          pendingTriggerRef.current = msg;
          handleOpenRef.current();
        }
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

  // ==================== 停止生成 ====================
  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === 'assistant') {
          copy[i] = { ...copy[i], streaming: false, loading: false };
          break;
        }
      }
      return copy;
    });
  };

  const handleOpenOrder = useCallback((data: OrderConfirmCardData) => {
    const orderId = String(data?.orderId ?? '').trim();
    if (!orderId) {
      Toast.show({ icon: 'fail', content: '订单编号缺失，暂时无法打开' });
      return;
    }

    // 从 expireAt 反推 createTime
    let createTime: string | undefined = data.createTime;
    if (!createTime && data.expireAt) {
      const expireDate = dayjs(data.expireAt);
      if (expireDate.isValid()) {
        createTime = expireDate.subtract(data.expireInMinutes ?? data.remainingMinutes ?? 15, 'minute').format('YYYY-MM-DD HH:mm:ss');
      }
    }
    if (!createTime) {
      createTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    }

    // 构建 OrderVO 兼容结构（字段名和类型与后端 OrderVO 对齐）
    const cachedOrder = {
      id: orderId,
      orderNo: data.orderNo || '',
      filmName: data.filmName || '',
      cinemaName: data.cinemaName || '',
      hallName: data.hallName || '',
      scheduleTime: data.scheduleTime || data.showTime || '',
      seatLabels: Array.isArray(data.seatLabels) ? data.seatLabels : [],
      count: Number(data.count) || 0,
      totalPrice: Number(data.totalPrice) || 0,
      expireAt: data.expireAt || '',
      createTime,
      status: 'pending',
    };

    try {
      sessionStorage.setItem(`order_${orderId}`, JSON.stringify(cachedOrder));
    } catch {
      // sessionStorage 不可用时仍允许订单页通过接口加载
    }
    setOpen(false);
    navigate(`/ticket/${encodeURIComponent(orderId)}`);
  }, [navigate]);

  const handleCardNavigate = useCallback((path: string) => {
    setOpen(false);
    // 场次卡片跳选座页前，先把选中场次写回 AI 会话状态，打通"选场次→AI 知道"的闭环
    const seatMatch = path.match(/^\/seat\/(.+)$/);
    if (seatMatch && userId && sessionId) {
      const scheduleId = decodeURIComponent(seatMatch[1]);
      fetch(`/api/movie-agent/sync-state?userId=${userId}&scheduleId=${scheduleId}&conversationId=${sessionId}`, {
        method: 'POST',
      }).catch(() => {
        // 同步失败不阻塞跳转
      });
    }
    navigate(path);
  }, [navigate, userId, sessionId]);

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
      const hasCard = !!msg.cardData?.cardType;
      const showLoading = msg.loading && !hasText && !hasTools && !hasCard;
      return (
        <div className={styles.msgRow} key={msg.id}>
          <div className={styles.avatar}>🤖</div>
          <div className={`${styles.bubble} ${styles.bubbleAi} ${hasCard ? styles.bubbleWithCard : ''}`}>
            {/* 初始 loading：三个点 */}
            {showLoading && (
              <span className={styles.typingDots}><i /><i /><i /></span>
            )}

            {/* 工具调用提示（参照 movie-chat-test.html 的 ⏳） */}
            {hasTools && msg.activeTools.map((tool) => (
              <div key={tool.key} className={styles.toolHint}>
                <span className={styles.toolSpinner} />
                <span>⏳ {tool.label}</span>
              </div>
            ))}

            {/* 流式文本 + 闪烁光标 */}
            {hasText && (
              <div className={styles.bubbleText}>
                {msg.content}
                {msg.streaming && <span className={styles.streamCursor}>▍</span>}
              </div>
            )}

            {/* 工具结果卡片 */}
            {msg.cardData?.cardType && (
              <ToolResultCard
                cardType={msg.cardData.cardType}
                data={msg.cardData.data}
                onOpenOrder={handleOpenOrder}
                onNavigate={handleCardNavigate}
              />
            )}

            {/* 空状态兜底 */}
            {!showLoading && !hasTools && !hasText && !hasCard && (
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
                  {sending ? (
                    <Button className={styles.stopBtn} onClick={handleStop}>
                      停止
                    </Button>
                  ) : (
                    <Button
                      className={styles.sendBtn}
                      onClick={handleSend}
                      disabled={!input.trim() || !sessionId}
                    >
                      发送
                    </Button>
                  )}
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
