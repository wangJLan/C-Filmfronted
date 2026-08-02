/**
 * 模拟收银台 — sessionStorage 主数据 + API 后台刷新
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline, CheckCircleOutline } from 'antd-mobile-icons';
import { getOrderDetail, type OrderVO } from '@/services/api/order';
import styles from './index.module.less';

function loadFromCache(oid: string): OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!; // 雪花ID, 不能用Number()
  const [order, setOrder] = useState<OrderVO | null>(() => loadFromCache(oid));
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!oid) return;
    getOrderDetail(oid).then((o) => {
      setOrder(o);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(o));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [oid]);

  const handlePay = (success: boolean) => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      if (success) {
        // 模拟支付：不调后端(支付宝未配会报错)，仅本地标记
        if (order) {
          const updated = { ...order, status: 'paid' };
          sessionStorage.setItem(`order_${oid}`, JSON.stringify(updated));
        }
        Toast.show({ icon: 'success', content: '支付成功！🎉' });
        navigate(`/ticket/${oid}`, { replace: true });
      } else {
        Toast.show({ icon: 'fail', content: '支付失败，请重试' });
      }
    }, 600);
  };

  if (loading) return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
    <div style={{ textAlign:'center', padding:80, color:'#999' }}>加载中…</div></div>;

  if (!order) return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
    <div className={styles.empty}>订单状态异常</div></div>;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
      <div className={styles.noticeBar}><span className={styles.noticeIcon}>⚠️</span>
        <span className={styles.noticeText}>此为模拟收银台，<strong>不会产生真实扣款</strong></span>
      </div>
      <div className={styles.amountCard}><div className={styles.amountLabel}>应付金额</div>
        <div className={styles.amountNum}><span className={styles.amountSymbol}>¥</span>{order.totalPrice}</div>
      </div>
      <div className={styles.methodCard}>
        <div className={styles.methodTitle}>选择支付方式</div>
        <div className={`${styles.methodItem} ${styles.methodActive}`}>
          <span className={styles.methodIcon}>💳</span>
          <div className={styles.methodInfo}><div className={styles.methodName}>模拟支付</div></div>
          <CheckCircleOutline className={styles.methodCheck} color="#FF5A00" />
        </div>
      </div>
      <div className={styles.payActions}>
        <Button block className={styles.paySuccessBtn} loading={paying} onClick={() => handlePay(true)}>✅ 模拟支付成功</Button>
        <Button block className={styles.payFailBtn} loading={paying} onClick={() => handlePay(false)}>❌ 模拟支付失败</Button>
      </div>
      <div className={styles.footerHint}>点击「模拟支付成功」将出票</div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default PaymentPage;
