import React from 'react';
import { Toast } from 'antd-mobile';
import { MOCK_DISCOVERS, type DiscoverCard } from '@/mock/home';
import styles from './index.module.less';

const DiscoverPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>发现</h2>
        <p className={styles.pageSubtitle}>影讯 · 攻略 · 福利</p>
      </div>
      <div className={styles.grid}>
        {MOCK_DISCOVERS.map((item: DiscoverCard) => (
          <div
            key={item.id}
            className={styles.card}
            onClick={() => Toast.show({ content: `${item.title} — 详情开发中` })}
          >
            <div className={styles.coverWrap}>
              <img src={item.image} alt={item.title} className={styles.cover} loading="lazy" />
              <span className={styles.typeTag}>{item.tag}</span>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardDesc}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoverPage;
