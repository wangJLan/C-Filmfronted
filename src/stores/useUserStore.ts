/**
 * 用户状态管理 — Zustand + 后端 Session 认证
 *
 * 三种登录通道:
 *   邮箱验证码登录: sendMailCode → loginByMail → 自动注册
 *   账号密码登录:   login           → Session 写入 Cookie
 *   账号密码注册:   register        → login → Session
 *
 * Cookie 自动携带，前端不存 Token。
 */
import { create } from 'zustand';
import {
  sendMailCode as sendMailCodeApi,
  mailLogin as mailLoginApi,
  resetPassword as resetPasswordApi,
  setPassword as setPasswordApi,
  changePassword as changePasswordApi,
  userLogin as userLoginApi,
  userRegister as userRegisterApi,
  weixinLogin as weixinLoginApi,
  getLoginUser,
  userLogout as userLogoutApi,
} from '@/api/userController';

interface UserState {
  user: API.LoginUserVO | null;
  isLoggedIn: boolean;
  initialized: boolean;
  loading: boolean;
  lastError: string | null;

  // ===== 生命周期 =====
  init: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: API.LoginUserVO) => void;
  clearError: () => void;

  // ===== 邮箱验证码通道 =====
  sendMailCode: (email: string) => Promise<void>;
  loginByMail: (email: string, code: string) => Promise<void>;

  // ===== 微信扫码通道 =====
  loginByWechat: (openid: string) => Promise<void>;

  // ===== 账号密码通道 =====
  login: (params: API.UserRegisterRequest) => Promise<void>;
  register: (params: API.UserRegisterRequest) => Promise<void>;

  // ===== 找回密码 =====
  resetPassword: (email: string, code: string, newPassword: string, checkPassword: string) => Promise<void>;

  // ===== 密码管理 =====
  setPassword: (newPassword: string, checkPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string, checkPassword: string) => Promise<void>;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  isLoggedIn: false,
  initialized: false,
  loading: false,
  lastError: null,

  // ==================== 生命周期 ====================

  init: async () => {
    if (get().initialized) return;
    set({ loading: true, lastError: null });
    try {
      const user = await getLoginUser();
      set({ user, isLoggedIn: true, initialized: true, loading: false });
    } catch {
      set({ user: null, isLoggedIn: false, initialized: true, loading: false });
    }
  },

  logout: async () => {
    try { await userLogoutApi(); } catch { /* ignore */ }
    set({ user: null, isLoggedIn: false, lastError: null });
  },

  setUser: (user) => set({ user, isLoggedIn: true, lastError: null }),

  clearError: () => set({ lastError: null }),

  // ==================== 邮箱验证码通道 ====================

  sendMailCode: async (email) => {
    set({ loading: true, lastError: null });
    try {
      await sendMailCodeApi({ email, captcha: '' });
    } catch (e: any) {
      set({ lastError: e?.message || '发送失败' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  loginByMail: async (email, code) => {
    set({ loading: true, lastError: null });
    try {
      const user = await mailLoginApi({ email, code });
      set({ user, isLoggedIn: true, loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '登录失败' });
      throw e;
    }
  },

  // ==================== 微信扫码通道 ====================

  loginByWechat: async (openid) => {
    set({ loading: true, lastError: null });
    try {
      const user = await weixinLoginApi({ openid });
      set({ user, isLoggedIn: true, loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '微信登录失败' });
      throw e;
    }
  },

  // ==================== 账号密码通道 ====================

  login: async (params) => {
    set({ loading: true, lastError: null });
    try {
      const user = await userLoginApi(params);
      set({ user, isLoggedIn: true, loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '登录失败' });
      throw e;
    }
  },

  register: async (params) => {
    set({ loading: true, lastError: null });
    try {
      await userRegisterApi(params);
      const user = await userLoginApi(params);
      set({ user, isLoggedIn: true, loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '注册失败' });
      throw e;
    }
  },

  // ==================== 找回密码 ====================

  resetPassword: async (email, code, newPassword, checkPassword) => {
    set({ loading: true, lastError: null });
    try {
      await resetPasswordApi({ email, code, newPassword, checkPassword });
      set({ loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '重置失败' });
      throw e;
    }
  },

  // ==================== 密码管理 ====================

  setPassword: async (newPassword, checkPassword) => {
    set({ loading: true, lastError: null });
    try {
      await setPasswordApi({ newPassword, checkPassword });
      // 刷新用户信息
      const user = await getLoginUser();
      set({ user, loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '设置失败' });
      throw e;
    }
  },

  changePassword: async (oldPassword, newPassword, checkPassword) => {
    set({ loading: true, lastError: null });
    try {
      await changePasswordApi({ oldPassword, newPassword, checkPassword });
      set({ loading: false });
    } catch (e: any) {
      set({ loading: false, lastError: e?.message || '修改失败' });
      throw e;
    }
  },
}));
