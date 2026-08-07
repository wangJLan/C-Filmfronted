import React from 'react';
import { useNavigate } from 'umi';
import { NavBar, Toast } from 'antd-mobile';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>设置</NavBar>

      {/* 账号安全 */}
      <div className={styles.group}>
        <div className={styles.title}>账号安全</div>
        <div className={styles.itemLink} onClick={() => navigate('/forgot-password')}>
          <span>设置密码</span>
          <RightOutline fontSize={14} color="#ccc" />
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.title}>关于</div>
        <div className={styles.itemLink} onClick={() => Toast.show({ content: '《妙语购票用户协议》' })}>
          <span>用户协议</span>
          <RightOutline fontSize={14} color="#ccc" />
        </div>
        <div className={styles.itemLink} onClick={() => Toast.show({ content: '《妙语购票隐私政策》' })}>
          <span>隐私政策</span>
          <RightOutline fontSize={14} color="#ccc" />
        </div>
        <div className={styles.itemLink}>
          <span>关于妙语购票</span>
          <span className={styles.right}>
            <span className={styles.hint}>v1.0.0</span>
            <RightOutline fontSize={14} color="#ccc" />
          </span>
        </div>
      </div>

      <div style={{ padding: '24px 16px' }}>
        <span className={styles.logoutBtn} onClick={() => { navigate('/user'); }}>
          返回个人中心
        </span>
      </div>
    </div>
  );
};

export default SettingsPage;
