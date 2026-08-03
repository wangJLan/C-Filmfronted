/**
 * 收银台 — 真实支付宝沙箱支付
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail, payOrder } from '@/api/orderController';
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
  const [polling, setPolling] = useState(false);

  // 页面加载 → 获取订单详情 + 自动触发支付
  useEffect(() => {
    if (!oid) return;
    getOrderDetail({ id: oid }).then((o: any) => {
      const vo: API.OrderVO = o?.data ?? o;
      setOrder(vo);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [oid]);

  /** 调后端拿支付表单 → 打开支付宝沙箱 */
  const handleAlipay = useCallback(async () => {
    if (paying) return;
    setPaying(true);
    try {
      const raw = await payOrder({ orderId: oid } as any) as any;
      const result = raw?.data ?? raw;
      const payForm = result?.payForm;
      if (!payForm) throw new Error('未获取到支付表单');
      const w = window.open('about:blank', '_blank');
      if (w) {
        w.document.write(payForm);
        w.document.close();
      } else {
        Toast.show({ content: '弹窗被拦截，请允许本站弹窗后重试' });
      }
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '生成支付页面失败' });
    } finally { setPaying(false); }
  }, [oid, paying]);

  /** 轮询订单状态 */
  const checkPayStatus = useCallback(async () => {
    setPolling(true);
    try {
      const raw = await getOrderDetail({ id: oid }) as any;
      const latest = raw?.data ?? raw;
      setOrder(latest);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(latest));
      if (latest?.status === 'paid') {
        Toast.show({ icon: 'success', content: '支付成功！🎉' });
        navigate(`/ticket/${oid}`, { replace: true });
        return;
      }
      Toast.show({ content: '订单尚未支付，请在支付宝窗口完成支付后重试' });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '查询失败' });
    } finally { setPolling(false); }
  }, [oid]);

  // 未支付 → 自动触发支付宝
  useEffect(() => {
    if (order && order.status === 'pending' && !loading) {
      handleAlipay();
    }
  }, [order?.status, loading]);

  // 已支付 → 直跳电子票
  useEffect(() => {
    if (order && order.status === 'paid') {
      Toast.show({ icon: 'success', content: '订单已支付' });
      navigate(`/ticket/${oid}`, { replace: true });
    }
  }, [order?.status]);

  if (loading) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
      <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>加载中…</div></div>;
  }
  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
      <div className={styles.empty}>订单状态异常</div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
      <div className={styles.noticeBar}>
        <span className={styles.noticeIcon}>⚠️</span>
        <span className={styles.noticeText}>此为<strong>支付宝沙箱环境</strong>，不会产生真实扣款</span>
      </div>
      <div className={styles.amountCard}><div className={styles.amountLabel}>应付金额</div>
        <div className={styles.amountNum}><span className={styles.amountSymbol}>¥</span>{order.totalPrice}</div>
      </div>
      <div className={styles.methodCard}>
        <div className={styles.methodTitle}>支付方式</div>
        <div className={`${styles.methodItem} ${styles.methodActive}`}>
          <span className={styles.methodIcon}>💳</span>
          <div className={styles.methodInfo}>
            <div className={styles.methodName}>支付宝（沙箱）</div>
            <div className={styles.methodDesc}>将跳转支付宝沙箱收银台完成支付</div>
          </div>
        </div>
      </div>
      <div className={styles.payActions}>
        <Button block className={styles.paySuccessBtn} loading={paying} onClick={handleAlipay}>
          {paying ? '正在生成支付页面…' : '前往支付宝支付'}
        </Button>
        <Button block className={styles.checkPayBtn} loading={polling} onClick={checkPayStatus}>
          {polling ? '查询中…' : '已完成支付'}
        </Button>
        <Button block fill="none" onClick={() => navigate(`/order-confirm/${oid}`)} style={{ marginTop: 8 }}>返回订单确认</Button>
      </div>
      <div className={styles.footerHint}>支付完成后点击「已完成支付」验证，自动跳转电子票</div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default PaymentPage;
