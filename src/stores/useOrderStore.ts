/**
 * 订单状态管理 — Zustand + localStorage
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
  status: 'paid' | 'completed' | 'cancelled';
  createdAt: string;
}

interface OrderState {
  orders: OrderItem[];
  addOrder: (order: OrderItem) => void;
  cancelOrder: (id: string) => void;
  getOrderCount: () => number;
}

function load(): OrderItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(orders: OrderItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { /* ignore */ }
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: load(),

  addOrder: (order) => {
    set((s) => {
      const updated = [order, ...s.orders];
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

  getOrderCount: () => get().orders.filter((o) => o.status !== 'cancelled').length,
}));
