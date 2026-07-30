/**
 * 全局登录守卫
 *
 * 用法:
 *   const guard = useLoginGuard((s) => s.guard);
 *   const handleClick = () => guard(() => navigate('/some-protected-page'));
 *
 * 已登录 → 立即执行回调
 * 未登录 → 弹出全局登录面板，成功后自动执行回调
 */
import { create } from 'zustand';

interface LoginGuardState {
  open: boolean;
  pendingAction: (() => void) | null;
  /** 打开登录弹窗并暂存回调 */
  guard: (action: () => void) => void;
  /** 登录成功 → 执行积压回调 + 关闭 */
  onLoginSuccess: () => void;
  /** 关闭弹窗（用户主动关闭，丢弃回调） */
  closePanel: () => void;
}

export const useLoginGuardStore = create<LoginGuardState>()((set, get) => ({
  open: false,
  pendingAction: null,

  guard: (action) => {
    set({ open: true, pendingAction: action });
  },

  onLoginSuccess: () => {
    const action = get().pendingAction;
    set({ open: false, pendingAction: null });
    if (action) setTimeout(() => action(), 200);
  },

  closePanel: () => {
    set({ open: false, pendingAction: null });
  },
}));
