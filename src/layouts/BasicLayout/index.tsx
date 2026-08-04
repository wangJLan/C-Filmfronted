import React from 'react';
import { Outlet, useLocation, useNavigate } from 'umi';
import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, ContentOutline, CompassOutline, UserOutline } from 'antd-mobile-icons';
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

  // 子页面不显示 TabBar
  const hideRoutes = ['/detail', '/orders', '/wallet', '/coupons', '/want-to-see', '/watched', '/settings', '/showtime', '/seat', '/order-confirm', '/payment', '/ticket', '/profile-edit', '/forgot-password', '/city-picker', '/cinema-detail', '/cinema-service-detail', '/cinema-feedback', '/cinema-price-info', '/payment-success', '/refund-apply', '/refund-progress', '/refund-detail'];
  const hideTabBar = hideRoutes.some((r) => location.pathname.startsWith(r));

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
      {/* AI 悬浮助手 */}
      <AiChat />
      {/* 全局登录弹窗 */}
      <LoginModal />
    </div>
  );
};

export default BasicLayout;
