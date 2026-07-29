/**
 * 影片收藏状态 — 想看的电影 / 看过的电影
 * Zustand + localStorage 持久化
 */
import { create } from 'zustand';

const STORAGE_KEY = 'film-collection';
const COUPON_KEY = 'coupon-store';

export interface CollectedFilm {
  filmId: number;
  title: string;
  poster: string;
  rating: number;
  wantCount: string;
  addedAt: string;
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
  wantToSee: CollectedFilm[];
  watched: CollectedFilm[];
  coupons: CouponItem[];
  balance: number;
  points: number;

  toggleWantToSee: (film: CollectedFilm) => void;
  isWanted: (filmId: number) => boolean;
  markAsWatched: (film: CollectedFilm) => void;
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
  wantToSee: load<CollectedFilm[]>(STORAGE_KEY + '-want', []),
  watched: load<CollectedFilm[]>(STORAGE_KEY + '-watched', []),
  coupons: load<CouponItem[]>(COUPON_KEY, [
    { id: 'c1', title: '新人专享券', amount: 15, condition: '满30元可用', expireDate: '2026-09-30', used: false },
    { id: 'c2', title: '观影立减券', amount: 10, condition: '满40元可用', expireDate: '2026-08-15', used: false },
    { id: 'c3', title: 'IMAX专属券', amount: 20, condition: 'IMAX厅满60元可用', expireDate: '2026-12-31', used: false },
    { id: 'c4', title: '好友助力券', amount: 8, condition: '无门槛', expireDate: '2026-08-10', used: false },
  ]),
  balance: Number(localStorage.getItem(STORAGE_KEY + '-balance') || 128.5),
  points: Number(localStorage.getItem(STORAGE_KEY + '-points') || 2360),

  toggleWantToSee: (film) => {
    set((s) => {
      const exists = s.wantToSee.find((f) => f.filmId === film.filmId);
      const updated = exists
        ? s.wantToSee.filter((f) => f.filmId !== film.filmId)
        : [{ ...film, addedAt: new Date().toISOString() }, ...s.wantToSee];
      save(STORAGE_KEY + '-want', updated);
      return { wantToSee: updated };
    });
  },

  isWanted: (filmId) => get().wantToSee.some((f) => f.filmId === filmId),

  markAsWatched: (film) => {
    set((s) => {
      if (s.watched.find((f) => f.filmId === film.filmId)) return s;
      const updated = [{ ...film, addedAt: new Date().toISOString() }, ...s.watched];
      save(STORAGE_KEY + '-watched', updated);
      return { watched: updated };
    });
  },

  isWatched: (filmId) => get().watched.some((f) => f.filmId === filmId),

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
      localStorage.setItem(STORAGE_KEY + '-balance', String(next));
      return { balance: next };
    });
  },
}));
