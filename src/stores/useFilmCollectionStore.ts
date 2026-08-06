/**
 * 影片收藏状态 — 想看的电影 / 看过的电影
 * Zustand + 后端 API 持久化
 */
import { create } from 'zustand';
import {
  toggleWantToSee,
  getMyWantToSee,
  removeWantToSee,
} from '@/api/userWantFilmController';
import {
  markWatched,
  getMyWatched,
} from '@/api/userWatchedFilmController';

const COUPON_KEY = 'coupon-store';

export interface FilmItem {
  id: number;
  name: string;
  posterUrl?: string;
  rating?: number;
  duration?: number;
  type?: string;
  releaseDate?: string;
  director?: string;
  actors?: string;
  description?: string;
  status?: string;
}

export interface CouponItem {
  id: string;
  title: string;
  amount: number;
  condition: string;
  expireDate: string;
  used: boolean;
}

interface FilmCollectionState {
  wantToSee: FilmItem[];
  watched: FilmItem[];
  wantToSeeLoading: boolean;
  watchedLoading: boolean;
  coupons: CouponItem[];
  balance: number;
  points: number;

  fetchWantToSee: () => Promise<void>;
  fetchWatched: () => Promise<void>;
  toggleWantToSee: (filmId: number) => Promise<boolean>;
  isWanted: (filmId: number) => boolean;
  removeWantToSeeApi: (filmId: number) => Promise<void>;
  markAsWatched: (filmId: number) => Promise<void>;
  isWatched: (filmId: number) => boolean;
  useCoupon: (id: string) => void;
  addCoupon: (c: CouponItem) => void;
  addBalance: (amount: number) => void;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

export const useFilmCollectionStore = create<FilmCollectionState>()((set, get) => ({
  wantToSee: [],
  watched: [],
  wantToSeeLoading: false,
  watchedLoading: false,
  coupons: load<CouponItem[]>(COUPON_KEY, [
    { id: 'c1', title: '新人专享券', amount: 15, condition: '满30元可用', expireDate: '2026-09-30', used: false },
    { id: 'c2', title: '观影立减券', amount: 10, condition: '满40元可用', expireDate: '2026-08-15', used: false },
    { id: 'c3', title: 'IMAX专属券', amount: 20, condition: 'IMAX厅满60元可用', expireDate: '2026-12-31', used: false },
    { id: 'c4', title: '好友助力券', amount: 8, condition: '无门槛', expireDate: '2026-08-10', used: false },
  ]),
  balance: Number(localStorage.getItem('film-collection-balance') || 128.5),
  points: Number(localStorage.getItem('film-collection-points') || 2360),

  fetchWantToSee: async () => {
    set({ wantToSeeLoading: true });
    try {
      const res: any = await getMyWantToSee();
      // 兼容解包：request 拦截器返回 {code,data,message}，取 data 数组；直接数组也兼容
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      set({ wantToSee: Array.isArray(list) ? list : [], wantToSeeLoading: false });
    } catch {
      set({ wantToSeeLoading: false });
    }
  },

  fetchWatched: async () => {
    set({ watchedLoading: true });
    try {
      const res: any = await getMyWatched();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      set({ watched: Array.isArray(list) ? list : [], watchedLoading: false });
    } catch {
      set({ watchedLoading: false });
    }
  },

  toggleWantToSee: async (filmId) => {
    const res: any = await toggleWantToSee(filmId);
    const wanted = res?.wanted === true;
    await get().fetchWantToSee();
    return wanted;
  },

  isWanted: (filmId) => Array.isArray(get().wantToSee) && get().wantToSee.some((f) => f.id === filmId),

  removeWantToSeeApi: async (filmId) => {
    await removeWantToSee(filmId);
    await get().fetchWantToSee();
  },

  markAsWatched: async (filmId) => {
    await markWatched(filmId);
    await get().fetchWatched();
  },

  isWatched: (filmId) => Array.isArray(get().watched) && get().watched.some((f) => f.id === filmId),

  useCoupon: (id) => {
    set((s) => {
      const updated = s.coupons.map((c) => (c.id === id ? { ...c, used: true } : c));
      save(COUPON_KEY, updated);
      return { coupons: updated };
    });
  },

  addCoupon: (c) => {
    set((s) => {
      const updated = [c, ...s.coupons];
      save(COUPON_KEY, updated);
      return { coupons: updated };
    });
  },

  addBalance: (amount) => {
    set((s) => {
      const next = +(s.balance + amount).toFixed(2);
      localStorage.setItem('film-collection-balance', String(next));
      return { balance: next };
    });
  },
}));
