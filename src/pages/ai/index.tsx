/**
 * AI 助手独立页面 — /ai 路由
 */
import React from 'react';
import AiChat from '@/components/AiChat';
import styles from './index.module.less';

const AiPage: React.FC = () => {
  return (
    <div className={styles.wrap}>
      <AiChat mode="page" />
    </div>
  );
};

export default AiPage;
