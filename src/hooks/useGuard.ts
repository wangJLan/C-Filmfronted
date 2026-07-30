/**
 * 登录守卫 Hook
 *
 * const guard = useGuard();
 * guard(() => doSomethingSecure());
 */
import { useUserStore } from '@/stores/useUserStore';
import { useLoginGuardStore } from '@/stores/useLoginGuard';

export function useGuard() {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const openGuard = useLoginGuardStore((s) => s.guard);

  return (action: () => void) => {
    if (isLoggedIn) {
      action();
    } else {
      openGuard(action);
    }
  };
}
