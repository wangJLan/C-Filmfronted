import React from 'react';
import { Outlet, useLocation, useNavigate } from 'umi';
import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, ContentOutline, CompassOutline, UserOutline } from 'antd-mobile-icons';
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

  // 详情页不显示 TabBar
  const hideTabBar = location.pathname.startsWith('/detail');

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
    </div>
  );
};

export default BasicLayout;
