/**
 * 订单确认页 — 汇总信息 + 15 分钟支付倒计时
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea, Mask } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useOrderStore } from '@/stores/useOrderStore';
import { MOCK_HOT_FILMS } from '@/mock/home';
import styles from './index.module.less';

const LOCK_DURATION = 15 * 60; // 15 分钟 = 900 秒

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const OrderConfirmPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder, cancelOrder } = useOrderStore();

  const order = useMemo(() => getOrder(orderId!), [orderId]);
  const poster = MOCK_HOT_FILMS.find((f) => f.id === order?.filmId)?.poster;

  // 倒计时
  const [remainSec, setRemainSec] = useState(() => {
    if (!order?.lockedAt) return 0;
    const elapsed = (Date.now() - new Date(order.lockedAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(LOCK_DURATION - elapsed));
  });

  const [isExpired, setIsExpired] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (remainSec <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setRemainSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainSec]);

  // 超时自动取消
  useEffect(() => {
    if (isExpired && orderId) {
      cancelOrder(orderId);
    }
  }, [isExpired, orderId]);

  const handleCancel = () => {
    if (!orderId) return;
    cancelOrder(orderId);
    Toast.show({ content: '已取消，座位已释放' });
    navigate(-1);
  };

  const handlePay = () => {
    if (!orderId) return;
    navigate(`/payment/${orderId}`, { replace: true });
  };

  if (!order) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>订单确认</NavBar>
        <div className={styles.empty}>订单不存在或已失效</div>
      </div>
    );
  }

  if (isExpired || order.status === 'cancelled') {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate('/')} back={<LeftOutline />}>订单确认</NavBar>
        <div className={styles.expiredContainer}>
          <div className={styles.expiredIcon}>⏰</div>
          <div className={styles.expiredTitle}>订单已超时</div>
          <div className={styles.expiredDesc}>
            支付时间超过 15 分钟，座位已自动释放。
            <br />喜欢的话可以重新下单哦～
          </div>
          <Button
            block
            color="primary"
            className={styles.retryBtn}
            onClick={() => navigate(-2)}
          >
            重新选座
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>订单确认</NavBar>

      {/* 倒计时横幅 */}
      <div className={`${styles.countdownBar} ${remainSec <= 120 ? styles.countdownWarn : ''}`}>
        <span className={styles.countdownIcon}>⏱</span>
        <span className={styles.countdownLabel}>请在 {formatCountdown(remainSec)} 内完成支付，超时座位将释放</span>
      </div>

      {/* 影片信息卡片 */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.poster}>
            <img src={poster} alt={order.filmTitle} />
          </div>
          <div className={styles.headInfo}>
            <div className={styles.filmTitle}>{order.filmTitle}</div>
            <div className={styles.filmMeta}>{order.cinema}</div>
          </div>
        </div>

        <div className={styles.detailList}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>影院</span>
            <span className={styles.detailVal}>{order.cinema}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>场次</span>
            <span className={styles.detailVal}>{order.date} · {order.time}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>影厅</span>
            <span className={styles.detailVal}>{order.hall}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>座位</span>
            <span className={styles.detailValSeats}>{order.seats.join('、')}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>数量</span>
            <span className={styles.detailVal}>{order.seats.length} 张</span>
          </div>
        </div>
      </div>

      {/* 价格汇总 */}
      <div className={styles.priceCard}>
        <div className={styles.priceRow}>
          <span>票价（{order.seats.length}张 × ¥{(order.totalPrice / order.seats.length).toFixed(0)}）</span>
          <span>¥{order.totalPrice}</span>
        </div>
        <div className={styles.priceRow}>
          <span>优惠券</span>
          <span className={styles.noCoupon}>暂无可用</span>
        </div>
        <div className={`${styles.priceRow} ${styles.priceTotal}`}>
          <span>实付金额</span>
          <span className={styles.totalNum}>¥{order.totalPrice}</span>
        </div>
      </div>

      {/* 底部操作 */}
      <div className={styles.bottomBar}>
        <SafeArea position="bottom" />
        <div className={styles.bottomInner}>
          <Button className={styles.cancelBtn} fill="none" onClick={() => setShowCancelModal(true)}>
            取消订单
          </Button>
          <Button className={styles.payBtn} color="primary" onClick={handlePay}>
            去支付 ¥{order.totalPrice}
          </Button>
        </div>
      </div>

      {/* 取消确认弹窗 */}
      <Mask visible={showCancelModal} onMaskClick={() => setShowCancelModal(false)} opacity={0.5} />
      {showCancelModal && (
        <div className={styles.modalWrap}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>确认取消？</div>
            <div className={styles.modalDesc}>取消后座位将立即释放，可能需要重新选择</div>
            <div className={styles.modalActions}>
              <Button fill="none" onClick={() => setShowCancelModal(false)}>再想想</Button>
              <Button fill="none" className={styles.modalConfirm} onClick={handleCancel}>
                确认取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmPage;
