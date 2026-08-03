import React from 'react';
import { useNavigate } from 'umi';
import { NavBar } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const CinemaFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>给影院提建议</NavBar>
      <div className={styles.content}>
        <div className={styles.placeholder}>页面内容开发中…</div>
      </div>
    </div>
  );
};

export default CinemaFeedbackPage;
