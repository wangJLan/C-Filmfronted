/**
 * 模拟收银台 — 使用真实订单接口
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea, SpinLoading } from 'antd-mobile';
import { LeftOutline, CheckCircleOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getOrderDetail, payOrder, type OrderVO } from '@/services/api/order';
import styles from './index.module.less';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = Number(orderId);
  const [paying, setPaying] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', oid],
    queryFn: () => getOrderDetail(oid) as Promise<OrderVO>,
    enabled: !!oid,
  });

  const handlePay = async (success: boolean) => {
    setPaying(true);
    try {
      if (success) {
        await payOrder(oid);
        Toast.show({ icon: 'success', content: '支付成功！🎉' });
        navigate(`/ticket/${oid}`, { replace: true });
      } else {
        Toast.show({ icon: 'fail', content: '支付失败，请重试' });
      }
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '支付失败' });
    } finally { setPaying(false); }
  };

  if (isLoading) return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
    <div style={{ textAlign:'center',padding:80 }}><SpinLoading color="primary" /></div></div>;

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
