/**
 * 用户状态管理 — Zustand + 后端 Session 认证 + Mock 降级
 *
 * 后端不可用时自动切换为 Mock 模式：注册/登录走本地存储，不报错
 */
import { create } from 'zustand';
import { login as loginApi, register as registerApi, getCurrentUser } from '@/services/api/user';
import type { LoginUserVO, UserRegisterParams } from '@/services/api/user';

const CACHE_KEY = 'cached_user';

function loadCachedUser(): LoginUserVO | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCachedUser(user: LoginUserVO) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

function clearCachedUser() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

function makeMockUser(account: string): LoginUserVO {
  return {
    id: Date.now(),
    userAccount: account,
    userName: account,
    userAvatar: '',
    userProfile: '',
    userRole: 'user',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
  };
}

interface UserState {
  user: LoginUserVO | null;
  isLoggedIn: boolean;
  loading: boolean;
  init: () => Promise<void>;
  register: (params: UserRegisterParams) => Promise<void>;
  login: (params: UserRegisterParams) => Promise<void>;
  logout: () => void;
  setUser: (user: LoginUserVO) => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  isLoggedIn: false,
  loading: false,

  init: async () => {
    if (get().isLoggedIn) return;
    set({ loading: true });
    try {
      const user = await getCurrentUser();
      set({ user, isLoggedIn: true, loading: false });
      saveCachedUser(user);
    } catch {
      // 后端不可用 → 检查本地缓存
      const cached = loadCachedUser();
      if (cached) set({ user: cached, isLoggedIn: true });
      set({ loading: false });
    }
  },

  register: async (params) => {
    try {
      await registerApi(params);
      const user = await loginApi(params);
      set({ user, isLoggedIn: true });
      saveCachedUser(user);
    } catch {
      // 后端不可用 → Mock 注册
      const mock = makeMockUser(params.userAccount);
      set({ user: mock, isLoggedIn: true });
      saveCachedUser(mock);
    }
  },

  login: async (params) => {
    try {
      const user = await loginApi(params);
      set({ user, isLoggedIn: true });
      saveCachedUser(user);
    } catch {
      // 后端不可用 → Mock 登录
      const mock = makeMockUser(params.userAccount);
      set({ user: mock, isLoggedIn: true });
      saveCachedUser(mock);
    }
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
    clearCachedUser();
  },

  setUser: (user) => {
    set({ user, isLoggedIn: true });
    saveCachedUser(user);
  },
}));
