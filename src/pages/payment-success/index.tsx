/**
 * 支付成功页 — 淘票票风格
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { SafeArea } from 'antd-mobile';
import { getOrderDetail } from '@/api/orderController';
import styles from './index.module.less';

function loadFromCache(oid: string): API.OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const PaymentSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;

  const [order, setOrder] = useState<API.OrderVO | null>(() => loadFromCache(oid));

  useEffect(() => {
    if (!oid) return;
    getOrderDetail({ id: oid }).then((o: any) => {
      const vo = o?.data ?? o;
      setOrder(vo);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo));
    }).catch(() => {});
  }, [oid]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <svg className={styles.checkIcon} viewBox="0 0 96 96">
            <path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm20.5 26.3c-1.9-1.8-5-1.7-6.9.1l-20 20-7.2-7.2c-1.9-1.9-5-1.9-6.9-.1s-2 4.8-.1 6.7l10.7 10.7c1.9 1.9 5.1 1.9 7 0L68.6 41c1.9-1.9 1.8-4.9-.1-6.7z" fill="#00b578"/>
          </svg>
        </div>
        <div className={styles.title}>购票成功</div>
        <div className={styles.filmName}>
          {order?.filmName || '影片'}（{order?.count || 0}张）
        </div>
        <div className={styles.actions}>
          <button className={styles.btnOutline} onClick={() => navigate('/', { replace: true })}>
            返回首页
          </button>
          <button className={styles.btnPrimary} onClick={() => navigate(`/ticket/${oid}`, { replace: true })}>
            查看电影票
          </button>
        </div>
      </div>

      <div className={styles.footerLogo}>
        <span className={styles.logoText}>妙语购票</span>
      </div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default PaymentSuccessPage;
