/**
 * 订单确认页 — 完全使用 sessionStorage，不依赖 API
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea, Mask } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail, type OrderVO } from '@/services/api/order';
import styles from './index.module.less';

const LOCK_DURATION = 15 * 60;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60); const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const OrderConfirmPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;  // 雪花ID: 19位超大数字,不能用Number()会截断

  // sessionStorage 读取（createOrder 时写入的）
  const [order, setOrder] = useState<OrderVO | null>(() => {
    try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  const [showCancel, setShowCancel] = useState(false);
  const [expired, setExpired] = useState(false);
  const [remainSec, setRemainSec] = useState(LOCK_DURATION);

  // 后台用 API 刷新最新状态（静默，失败不影响）
  useEffect(() => {
    if (!oid) return;
    getOrderDetail(oid).then((o) => {
      setOrder(o);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(o));
    }).catch(() => {});
  }, [oid]);

  // 倒计时：用缓存里的 createTime 或当前时间
  useEffect(() => {
    const created = order?.createTime ? new Date(order.createTime).getTime() : Date.now();
    const remaining = Math.max(0, LOCK_DURATION - Math.floor((Date.now() - created) / 1000));
    setRemainSec(remaining);
    if (remaining <= 0) { setExpired(true); return; }
    const timer = setInterval(() => {
      setRemainSec(prev => { if (prev <= 1) { clearInterval(timer); setExpired(true); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.createTime]);

  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>订单确认</NavBar>
      <div className={styles.empty}>订单数据丢失，请返回重新选座</div></div>;
  }

  if (expired || order.status === 'cancelled') {
    return <div className={styles.page}><NavBar onBack={() => navigate('/')} back={<LeftOutline />}>订单确认</NavBar>
      <div className={styles.expiredContainer}><div className={styles.expiredIcon}>⏰</div>
        <div className={styles.expiredTitle}>订单已超时</div>
        <div className={styles.expiredDesc}>支付时间超过 15 分钟，座位已自动释放。<br />喜欢的话可以重新下单哦～</div>
        <Button block color="primary" className={styles.retryBtn} onClick={() => navigate(-2)}>重新选座</Button>
      </div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>订单确认</NavBar>
      <div className={`${styles.countdownBar} ${remainSec <= 120 ? styles.countdownWarn : ''}`}>
        <span className={styles.countdownIcon}>⏱</span>
        <span className={styles.countdownLabel}>请在 {formatCountdown(remainSec)} 内完成支付，超时座位将释放</span>
      </div>
      <div className={styles.card}>
        <div className={styles.detailList}>
          <div className={styles.detailRow}><span className={styles.detailLabel}>影片</span><span className={styles.detailVal}>{order.filmName}</span></div>
          <div className={styles.detailRow}><span className={styles.detailLabel}>影院</span><span className={styles.detailVal}>{order.cinemaName}</span></div>
          <div className={styles.detailRow}><span className={styles.detailLabel}>场次</span><span className={styles.detailVal}>{order.scheduleTime}</span></div>
          <div className={styles.detailRow}><span className={styles.detailLabel}>影厅</span><span className={styles.detailVal}>{order.hallName}</span></div>
          <div className={styles.detailRow}><span className={styles.detailLabel}>座位</span><span className={styles.detailValSeats}>{order.seatLabels?.join('、')}</span></div>
          <div className={styles.detailRow}><span className={styles.detailLabel}>数量</span><span className={styles.detailVal}>{order.count} 张</span></div>
        </div>
      </div>
      <div className={styles.priceCard}>
        <div className={styles.priceRow}><span>票价</span><span>¥{order.totalPrice}</span></div>
        <div className={`${styles.priceRow} ${styles.priceTotal}`}><span>实付金额</span><span className={styles.totalNum}>¥{order.totalPrice}</span></div>
      </div>
      <div className={styles.bottomBar}><SafeArea position="bottom" />
        <div className={styles.bottomInner}>
          <Button className={styles.cancelBtn} fill="none" onClick={() => setShowCancel(true)}>取消订单</Button>
          <Button className={styles.payBtn} color="primary" onClick={() => {
            sessionStorage.setItem(`order_${oid}`, JSON.stringify(order));
            navigate(`/payment/${oid}`);
          }}>去支付 ¥{order.totalPrice}</Button>
        </div>
      </div>
      <Mask visible={showCancel} onMaskClick={() => setShowCancel(false)} opacity={0.5} />
      {showCancel && (
        <div className={styles.modalWrap}><div className={styles.modal}>
          <div className={styles.modalTitle}>确认取消？</div>
          <div className={styles.modalDesc}>取消后座位将立即释放</div>
          <div className={styles.modalActions}>
            <Button fill="none" onClick={() => setShowCancel(false)}>再想想</Button>
            <Button fill="none" className={styles.modalConfirm} onClick={() => { navigate(-1); }}>确认取消</Button>
          </div>
        </div></div>
      )}
    </div>
  );
};

export default OrderConfirmPage;
