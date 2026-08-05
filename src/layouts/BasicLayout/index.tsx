import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'umi';
import { TabBar, SpinLoading } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, ContentOutline, CompassOutline, UserOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import AiChat from '@/components/AiChat';
import LoginModal from '@/components/LoginModal';
import styles from './index.module.less';

const tabs = [
  { key: '/', title: '电影', icon: <AppOutline /> },
  { key: '/film', title: '热映', icon: <UnorderedListOutline /> },
  { key: '/cinema', title: '影院', icon: <ContentOutline /> },
  { key: '/discover', title: '发现', icon: <CompassOutline /> },
  { key: '/user', title: '我的', icon: <UserOutline /> },
];

const BasicLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialized = useUserStore((s) => s.initialized);
  const init = useUserStore((s) => s.init);

  // 全局初始化：页面刷新后检查 Session 登录状态
  useEffect(() => { init(); }, []);

  // 鉴权检查未完成前不渲染子页面，避免"未登录→已登录"闪烁
  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <SpinLoading color="primary" />
      </div>
    );
  }

  // 子页面不显示 TabBar
  const hideRoutes = ['/detail', '/orders', '/wallet', '/coupons', '/want-to-see', '/watched', '/settings', '/showtime', '/seat', '/order-confirm', '/payment', '/ticket', '/profile-edit', '/forgot-password', '/city-picker', '/cinema-detail', '/cinema-service-detail', '/cinema-feedback', '/cinema-price-info', '/payment-success', '/refund-apply', '/refund-progress', '/refund-detail', '/ai'];
  const hideTabBar = hideRoutes.some((r) => location.pathname.startsWith(r));
  // AI 页面有自己完整的聊天面板，不需要悬浮按钮
  const isAiPage = location.pathname === '/ai';

  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        <Outlet />
      </div>
      {!hideTabBar && (
        <div className={styles.tabbar}>
          <TabBar
            activeKey={location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`}
            onChange={(key) => navigate(key)}
            safeArea
          >
            {tabs.map((tab) => (
              <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
            ))}
          </TabBar>
        </div>
      )}
      {/* AI 悬浮按钮（/ai 页面自带面板，不重复渲染） */}
      {!isAiPage && <AiChat mode="overlay" />}
      {/* 全局登录弹窗 */}
      <LoginModal />
    </div>
  );
};

export default BasicLayout;
