/**
 * 退款详情页 — 淘票票风格
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const RefundDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;

  const order: API.OrderVO | null = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(`order_${oid}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [oid]);

  const handleCopy = (text?: string) => {
    if (text) navigator.clipboard.writeText(text).then(() => Toast.show({ content: '已复制' })).catch(() => {});
  };

  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>退款详情</NavBar>
      <div className={styles.empty}>订单数据丢失</div></div>;
  }

  const totalPrice = order.totalPrice || 0;
  const refundAmount = order.refundAmount || 0;
  const fee = +(totalPrice - refundAmount).toFixed(2);
  const refundTime = order.refundTime ? new Date(order.refundTime) : new Date();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>退款详情</NavBar>

      {/* ===== 退款金额状态 ===== */}
      <div className={styles.statusCard}>
        <div className={styles.statusIcon}>
          <svg viewBox="0 0 96 96" fill="#00b578" width="40" height="40">
            <path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm17.1 27.9c-1.2-1.2-3.1-1.2-4.2 0L43 53.8l-7.9-7.9c-1.2-1.2-3.1-1.2-4.2 0s-1.2 3.1 0 4.2l10 10c1.2 1.2 3.1 1.2 4.2 0l20-20c1.2-1.2 1.2-3.1 0-4.2z"/>
          </svg>
        </div>
        <div className={styles.statusText}>退款成功</div>
        <div className={styles.refundAmount}>
          <span className={styles.yen}>¥</span>
          {refundAmount}
        </div>
        <div className={styles.refundHint}>已原路退回至你的付款账户</div>
      </div>

      {/* ===== 退款信息 ===== */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>退款信息</div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>退款金额</span>
          <span className={styles.infoVal}>¥{refundAmount}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>原订单金额</span>
          <span className={styles.infoVal}>¥{totalPrice}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>退票服务费</span>
          <span className={styles.infoVal}>¥{fee}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>退款方式</span>
          <span className={styles.infoVal}>原路退回</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>退款时间</span>
          <span className={styles.infoVal}>{refundTime.toLocaleString()}</span>
        </div>
      </div>

      {/* ===== 原订单信息 ===== */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>原订单信息</div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>影片</span>
          <span className={styles.infoVal}>{order.filmName || '—'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>影院</span>
          <span className={styles.infoVal}>{order.cinemaName || '—'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>场次</span>
          <span className={styles.infoVal}>{order.scheduleTime || '—'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>座位</span>
          <span className={styles.infoVal}>{order.seatLabels?.join('、') || '—'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>数量</span>
          <span className={styles.infoVal}>{order.count || 0}张</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoKey}>订单编号</span>
          <span className={styles.infoValRow}>
            {order.orderNo || '—'}
            <span className={styles.copyText} onClick={() => handleCopy(order.orderNo)}>复制</span>
          </span>
        </div>
      </div>

      {/* ===== 底部 ===== */}
      <div className={styles.bottom}>
        <button className={styles.backBtn} onClick={() => navigate('/orders')}>查看全部订单</button>
      </div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default RefundDetailPage;
