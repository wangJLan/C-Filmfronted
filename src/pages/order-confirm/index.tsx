/**
 * 订单确认页 — 淘票票风格
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, SafeArea, Toast } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail, cancelOrder } from '@/api/orderController';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPrice(value?: number | string): string {
  const price = Number(value);
  if (!Number.isFinite(price)) return '--';
  return price.toFixed(2);
}

function loadFromCache(oid: string): API.OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const OrderConfirmPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;
  const userId = useUserStore((s) => s.user?.id);

  const [order, setOrder] = useState<API.OrderVO | null>(() => loadFromCache(oid));
  const [loading, setLoading] = useState(!order);
  const [remainSec, setRemainSec] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [sseTerminated, setSseTerminated] = useState(false); // SSE 通知已超时
  const [serverStatus, setServerStatus] = useState<string | null>(null); // 轮询回来的服务端状态

  // ======================== SSE 订阅订单状态变更 ========================
  useEffect(() => {
    if (!userId || !oid) return;
    const es = new EventSource(`/api/sse/order/${userId}`);
    es.addEventListener('order_cancelled', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (String(payload.orderId) === String(oid)) {
          setSseTerminated(true);
          setRemainSec(0);
        }
      } catch {}
    });
    es.addEventListener('order_paid', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (String(payload.orderId) === String(oid)) {
          Toast.show({ icon: 'success', content: '支付成功！' });
          navigate(`/payment-success/${oid}`, { replace: true });
        }
      } catch {}
    });
    es.onerror = () => { /* 连接断开后自动重连，无需处理 */ };
    return () => { es.close(); };
  }, [userId, oid, navigate]);

  // 拉取订单详情（首次 + 轮询复用）
  const fetchOrder = React.useCallback(async () => {
    if (!oid) return;
    try {
      const o: any = await getOrderDetail({ id: oid });
      const vo = o?.data ?? o;
      if (vo) {
        setOrder(vo);
        setServerStatus(vo.status ?? null);
        try { sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo)); } catch {}
      }
    } catch (err: any) {
      console.error('[OrderConfirm] 加载订单失败:', err);
    }
  }, [oid]);

  useEffect(() => {
    if (!oid) return;
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  // 轮询：每 10 秒同步一次后端状态，弥补 SSE 不可靠
  useEffect(() => {
    if (!oid || remainSec <= 0) return;
    const pollTimer = setInterval(() => {
      fetchOrder();
    }, 10_000);
    return () => clearInterval(pollTimer);
  }, [oid, remainSec > 0, fetchOrder]);

  // 倒计时：基于服务端 expireAt 的绝对时间，免疫客户端时钟漂移和刷新重置
  useEffect(() => {
    if (!order?.expireAt) return;
    const expireMs = new Date(order.expireAt).getTime();
    if (Number.isNaN(expireMs)) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expireMs - Date.now()) / 1000));
      setRemainSec(remaining);
      if (remaining <= 0) return; // 停止 tick
      return true; // 继续
    };

    if (!tick()) return;

    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.expireAt]);

  // 轮询到已支付 → 跳转成功页（SSE 兜底）
  useEffect(() => {
    if (serverStatus === 'paid') {
      Toast.show({ icon: 'success', content: '支付成功！' });
      navigate(`/payment-success/${oid}`, { replace: true });
    }
  }, [serverStatus]);

  const scheduleTime = useMemo(() => {
    if (!order) return '';
    return order.scheduleTime || '';
  }, [order]);

  const handlePay = () => {
    sessionStorage.setItem(`order_${oid}`, JSON.stringify(order));
    navigate(`/payment/${oid}`);
  };

  const handleCancelOrder = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await cancelOrder({ id: oid });
      Toast.show({ icon: 'success', content: '订单已取消' });
      sessionStorage.removeItem(`order_${oid}`);
      navigate('/', { replace: true });
    } catch (err: any) {
      Toast.show({ icon: 'fail', content: err?.message || '取消订单失败' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>订单详情</NavBar>
        <div className={styles.empty}>加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>订单确认</NavBar>
        <div className={styles.empty}>订单数据丢失</div>
      </div>
    );
  }

  const isExpired = remainSec <= 0
    || order.status === 'cancelled'
    || serverStatus === 'cancelled'
    || serverStatus === 'refunded';
  if (isExpired) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate('/')} back={<LeftOutline />}>订单确认</NavBar>
        <div className={styles.expiredContainer}>
          <div className={styles.expiredIcon}>⏰</div>
          <div className={styles.expiredTitle}>订单已超时</div>
          <div className={styles.expiredDesc}>
            {sseTerminated
              ? '订单已超时自动取消，座位已释放，喜欢的话可以重新下单哦～'
              : '订单支付超时，座位已自动释放，喜欢的话可以重新下单哦～'}
          </div>
          <div className={styles.retryBtn} onClick={() => navigate(-2)}>重新选座</div>
        </div>
      </div>
    );
  }

  const totalPrice = order.totalPrice;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>订单确认</NavBar>

      {/* ===== 票务信息头部 ===== */}
      <div className={styles.header}>
        <div className={styles.countdownRow}>
          <img className={styles.clockIcon} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='27' fill='none' stroke='%23f8289c' stroke-width='3'/%3E%3Ccircle cx='30' cy='30' r='27' fill='none' stroke='%23f8289c' stroke-width='3' stroke-dasharray='170' stroke-dashoffset='0' transform='rotate(-90 30 30)'/%3E%3Ctext x='30' y='36' text-anchor='middle' font-size='14' font-weight='700' fill='%23f8289c'%3E⏱%3C/text%3E%3C/svg%3E" alt="" />
          <span className={styles.countdown}>{formatCountdown(remainSec)}</span>
        </div>

        <div className={styles.ticketInfo}>
          <div className={styles.posterCol}>
{order.posterUrl ? (
                <img className={styles.poster} src={order.posterUrl} alt="" />
              ) : (
                <div className={styles.posterPlaceholder} />
              )}
          </div>
          <div className={styles.infoCol}>
            <div className={styles.movieName}>{order.filmName || '影片名称'}</div>
            <div className={styles.infoLine}>{scheduleTime}</div>
            <div className={styles.infoLine}>{order.hallName || ''} {order.seatLabels?.join(' ')}</div>
            <div className={styles.infoLine}>{order.cinemaName || ''}</div>
            <div className={styles.infoLine}>共{order.count || 0}张 原价 ¥{formatPrice(totalPrice)}</div>
          </div>
        </div>

      </div>

      {/* ===== 优惠券区 ===== */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>本单可享优惠</div>
        <div className={styles.couponRow}>
          <span className={styles.couponLabel}>优惠券&活动</span>
          <span className={styles.couponNone}>暂无可用</span>
        </div>
      </div>

      {/* ===== 购票须知 ===== */}
      <div className={styles.card}>
        <div className={styles.noticeTitle}>购票须知</div>
        <div className={styles.noticeDesc}>
          1.由于设备故障等不可抗力因素，存在少量场次取消的情况，会进行退票退款<br />
          2.由于影院系统不稳定等因素，存在出票失败的情况，会进行退款<br />
          3.取票码可以在"我的-电影票"中查看
        </div>
      </div>

      {/* ===== 取消订单按钮 ===== */}
      <div className={styles.card}>
        <div
          className={styles.cancelBtn}
          onClick={handleCancelOrder}
        >
          {cancelling ? '取消中...' : '取消订单'}
        </div>
      </div>

      <div className={styles.bottomSpacer} />

      {/* ===== 底部付款栏 ===== */}
      <div className={styles.footerBar}>
        <SafeArea position="bottom" />
        <div className={styles.footerInner}>
          <div className={styles.priceCol}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>合计：</span>
              <span className={styles.totalPrice}><span className={styles.yen}>¥</span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.detailBtn}>
              <span>查看明细</span>
              <svg viewBox="0 0 96 96" fill="#f8289c" width="12" height="12"><path d="M50 37.9c-.1-.2-.3-.3-.5-.5-1.1-.8-2.6-.6-3.4.5L32.5 55.2c-.3.4-.5.9-.5 1.4 0 1.3 1.1 2.4 2.5 2.4h27.1c.5 0 1.1-.2 1.5-.5 1.1-.8 1.3-2.3.5-3.3L50 37.9z"/></svg>
            </div>
          </div>
          <div className={styles.payBtn} onClick={handlePay}>
            立即付款
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmPage;
