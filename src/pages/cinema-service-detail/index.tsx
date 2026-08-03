import React from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const titles: Record<string, string> = {
  change: '改签规则',
  child: '儿童须知',
  snack: '观影小食',
  glasses: '3D眼镜',
  imax: 'IMAX厅',
  dolby: '杜比全景声',
  vip: 'VIP厅',
  couple: '情侣座',
  rest: '休息区',
  food: '餐饮',
};

const CinemaServiceDetailPage: React.FC = () => {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        {titles[serviceType || ''] || '服务详情'}
      </NavBar>
      <div className={styles.content}>
        <div className={styles.placeholder}>页面内容开发中…</div>
      </div>
    </div>
  );
};

export default CinemaServiceDetailPage;
