/**
 * 收银台 — 支付宝沙箱支付
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail } from '@/api/orderController';
import http from '@/services/request';
import styles from './index.module.less';

function loadFromCache(oid: string): API.OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;
  const [order, setOrder] = useState<API.OrderVO | null>(() => loadFromCache(oid));
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const handleCancel = useCallback(() => navigate(`/ticket/${oid}`, { replace: true }), [oid, navigate]);

  useEffect(() => {
    if (!oid) return;
    getOrderDetail({ id: oid }).then((o: any) => {
      const vo = o?.data ?? o;
      setOrder(vo);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [oid]);

  /** 模拟支付 — 跳过支付宝沙箱，直接标记已支付 */
  const handleMockPay = useCallback(async () => {
    if (paying) return;
    setPaying(true);
    try {
      await http.post('/order/mock-pay', { orderId: oid });
      Toast.show({ icon: 'success', content: '支付成功！' });
      navigate(`/payment-success/${oid}`, { replace: true });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '支付失败' });
    } finally { setPaying(false); }
  }, [oid, paying]);

  if (loading) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
      <div className={styles.loading}>加载中…</div></div>;
  }
  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
      <div className={styles.empty}>订单状态异常</div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(`/ticket/${oid}`)} back={<LeftOutline />} className={styles.nav}>收银台</NavBar>

      {/* ===== 金额卡片 ===== */}
      <div className={styles.amountCard}>
        <div className={styles.amountLabel}>应付金额</div>
        <div className={styles.amountNum}><span className={styles.amountSymbol}>¥</span>{order.totalPrice || 0}</div>
        <div className={styles.orderBrief}>
          <span>{order.filmName}</span>
          <span className={styles.dot}>·</span>
          <span>{order.count}张</span>
          <span className={styles.dot}>·</span>
          <span>{order.seatLabels?.join('、')}</span>
        </div>
        <div className={styles.cinemaRow}>
          <svg className={styles.cIcon} viewBox="0 0 96 96" fill="#959AA5" width="14" height="14"><path d="M48 91C42.6 91 9 65.1 9 43.7S26.5 5 48 5s39 17.3 39 38.7S53.4 91 48 91zm0-35c6.6 0 12-5.4 12-12s-5.4-12-12-12-12 5.4-12 12 5.4 12 12 12z"/></svg>
          <span>{order.cinemaName}</span>
        </div>
      </div>

      {/* ===== 支付方式 ===== */}
      <div className={styles.methodCard}>
        <div className={styles.methodTitle}>选择支付方式</div>

        <div className={styles.methodList}>
          <div className={`${styles.methodItem} ${styles.methodActive}`}>
            <div className={styles.methodLeft}>
              <div className={styles.alipayLogo}>支</div>
              <div className={styles.methodInfo}>
                <div className={styles.methodName}>支付宝</div>
                <div className={styles.methodDesc}>推荐安装支付宝的用户使用</div>
              </div>
            </div>
            <div className={styles.radioOn}>
              <div className={styles.radioDot} />
            </div>
          </div>

        </div>
      </div>

      {/* ===== 底部按钮 ===== */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <div className={styles.bottomLeft} onClick={handleCancel}>
            <span className={styles.cancelLabel}>取消订单</span>
          </div>
          <button className={styles.payBtn} onClick={handleMockPay} disabled={paying}>
            {paying ? '请稍候…' : `确认支付 ¥${order.totalPrice || 0}`}
          </button>
        </div>
        <SafeArea position="bottom" />
      </div>
    </div>
  );
};

export default PaymentPage;
