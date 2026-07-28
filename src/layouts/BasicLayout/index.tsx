import React, { useState } from 'react';
import { Outlet, useLocation } from 'umi';
import { TabBar } from 'antd-mobile';
import {
  AppOutline,
  UnorderedListOutline,
  UserOutline,
} from 'antd-mobile-icons';
import styles from './index.module.less';

const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/films', title: '影片', icon: <UnorderedListOutline /> },
  { key: '/user', title: '我的', icon: <UserOutline /> },
];

const BasicLayout: React.FC = () => {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState(location.pathname);

  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        <Outlet />
      </div>
      <div className={styles.tabbar}>
        <TabBar
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
            window.location.hash = `#${key}`;
          }}
          safeArea
        >
          {tabs.map((tab) => (
            <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default BasicLayout;
