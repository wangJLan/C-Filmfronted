/**
 * 用户状态管理 — Zustand + 后端 Session 认证
 *
 * 登录流程: 调用 /api/user/login → 后端写入 Session → Cookie 自动携带
 * 初始化: 调用 /api/user/get/login 从 Session 恢复登录态
 */
import { create } from 'zustand';
import { login as loginApi, register as registerApi, getCurrentUser } from '@/services/api/user';
import type { LoginUserVO, UserRegisterParams } from '@/services/api/user';

interface UserState {
  user: LoginUserVO | null;
  isLoggedIn: boolean;
  loading: boolean;

  /** 初始化 — 页面加载时从 Session 恢复用户 */
  init: () => Promise<void>;

  /** 注册 */
  register: (params: UserRegisterParams) => Promise<void>;

  /** 登录 */
  login: (params: UserRegisterParams) => Promise<void>;

  /** 登出 — 清除本地状态（后端 /user/logout 暂未暴露，仅清前端） */
  logout: () => void;

  /** 直接设置用户（无需调后端） */
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
    } catch {
      set({ user: null, isLoggedIn: false, loading: false });
    }
  },

  register: async (params) => {
    await registerApi(params);
    // 注册成功后自动登录
    const user = await loginApi(params);
    set({ user, isLoggedIn: true });
  },

  login: async (params) => {
    const user = await loginApi(params);
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    set({ user: null, isLoggedIn: false });
  },

  setUser: (user) => {
    set({ user, isLoggedIn: true });
  },
}));
