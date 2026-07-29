import React from 'react';
import { useNavigate } from 'umi';
import { NavBar, Switch, Toast } from 'antd-mobile';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>设置</NavBar>

      <div className={styles.group}>
        <div className={styles.title}>通知设置</div>
        <div className={styles.item}>
          <span>新片提醒</span>
          <Switch defaultChecked onChange={(v) => Toast.show({ content: v ? '已开启新片提醒' : '已关闭' })} />
        </div>
        <div className={styles.item}>
          <span>影票到期提醒</span>
          <Switch defaultChecked />
        </div>
        <div className={styles.item}>
          <span>优惠活动推送</span>
          <Switch />
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.title}>通用</div>
        <div className={styles.itemLink} onClick={() => Toast.show({ content: '已清除缓存' })}>
          <span>清除缓存</span>
          <span className={styles.right}>
            <span className={styles.hint}>12.3 MB</span>
            <RightOutline fontSize={14} color="#ccc" />
          </span>
        </div>
        <div className={styles.itemLink}>
          <span>检查更新</span>
          <span className={styles.right}>
            <span className={styles.hint}>v1.0.0</span>
            <RightOutline fontSize={14} color="#ccc" />
          </span>
        </div>
        <div className={styles.itemLink}>
          <span>语言</span>
          <span className={styles.right}>
            <span className={styles.hint}>简体中文</span>
            <RightOutline fontSize={14} color="#ccc" />
          </span>
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
