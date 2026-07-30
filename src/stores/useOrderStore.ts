/**
 * 订单状态管理 — Zustand + localStorage
 *
 * 订单生命周期：pending(锁座待支付) → paid(已支付) → completed(已完成) / cancelled(已取消)
 */
import { create } from 'zustand';

const STORAGE_KEY = 'order-store';

export interface OrderItem {
  id: string;
  filmId: number;
  filmTitle: string;
  poster: string;
  cinema: string;
  hall: string;
  date: string;
  time: string;
  seats: string[];         // e.g. ["5排3座", "5排4座"]
  totalPrice: number;      // 单位：元
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  /** 锁座时间 — 用于计算支付倒计时 */
  lockedAt: string | null;
  /** 支付时间 */
  paidAt: string | null;
  /** 取票码（支付成功后生成） */
  ticketCode: string | null;
  createdAt: string;
}

interface OrderState {
  orders: OrderItem[];

  /** 锁座 → 创建 pending 订单，返回订单 ID */
  createPendingOrder: (data: {
    filmId: number; filmTitle: string; poster: string;
    cinema: string; hall: string; date: string; time: string;
    seats: string[]; totalPrice: number;
  }) => string;

  /** 支付订单 */
  payOrder: (id: string) => void;

  /** 取消订单（释放座位） */
  cancelOrder: (id: string) => void;

  /** 查询单个订单 */
  getOrder: (id: string) => OrderItem | undefined;

  /** 获取最新一笔待支付订单 */
  getLatestPending: () => OrderItem | undefined;

  /** 清空所有 */
  clearAll: () => void;
}

/** 生成 6 位取票码 */
function genTicketCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function load(): OrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(orders: OrderItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* ignore */
  }
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: load(),

  createPendingOrder: (data) => {
    const id = `ORD${Date.now()}`;
    const order: OrderItem = {
      id,
      ...data,
      status: 'pending',
      lockedAt: new Date().toISOString(),
      paidAt: null,
      ticketCode: null,
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const updated = [order, ...s.orders];
      save(updated);
      return { orders: updated };
    });
    return id;
  },

  payOrder: (id) => {
    set((s) => {
      const updated = s.orders.map((o) =>
        o.id === id
          ? { ...o, status: 'paid' as const, paidAt: new Date().toISOString(), ticketCode: genTicketCode() }
          : o,
      );
      save(updated);
      return { orders: updated };
    });
  },

  cancelOrder: (id) => {
    set((s) => {
      const updated = s.orders.map((o) =>
        o.id === id ? { ...o, status: 'cancelled' as const } : o,
      );
      save(updated);
      return { orders: updated };
    });
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  getLatestPending: () => get().orders.find((o) => o.status === 'pending'),

  clearAll: () => {
    set({ orders: [] });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  },
}));
