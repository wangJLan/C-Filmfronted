/**
 * 模拟收银台 — 标注无真实扣款，提供模拟支付成功/失败按钮
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea, Modal } from 'antd-mobile';
import { LeftOutline, CheckCircleOutline, CloseCircleOutline } from 'antd-mobile-icons';
import { useOrderStore } from '@/stores/useOrderStore';
import styles from './index.module.less';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder, payOrder } = useOrderStore();

  const order = getOrder(orderId!);
  const [paying, setPaying] = useState(false);

  if (!order || order.status !== 'pending') {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>
        <div className={styles.empty}>订单状态异常，请返回重新下单</div>
      </div>
    );
  }

  const handleMockPay = (success: boolean) => {
    setPaying(true);
    // 模拟网络延迟
    setTimeout(() => {
      setPaying(false);
      if (success) {
        payOrder(orderId!);
        Toast.show({ icon: 'success', content: '支付成功！🎉' });
        navigate(`/ticket/${orderId}`, { replace: true });
      } else {
        Toast.show({ icon: 'fail', content: '支付失败，请重试' });
      }
    }, 800);
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>收银台</NavBar>

      {/* 无真实扣款提示 */}
      <div className={styles.noticeBar}>
        <span className={styles.noticeIcon}>⚠️</span>
        <span className={styles.noticeText}>
          此为模拟收银台，<strong>不会产生真实扣款</strong>
          <br />您可选择成功或失败查看对应流程
        </span>
      </div>

      {/* 订单金额 */}
      <div className={styles.amountCard}>
        <div className={styles.amountLabel}>应付金额</div>
        <div className={styles.amountNum}>
          <span className={styles.amountSymbol}>¥</span>
          {order.totalPrice}
        </div>
      </div>

      {/* 支付方式（模拟） */}
      <div className={styles.methodCard}>
        <div className={styles.methodTitle}>选择支付方式</div>
        <div className={`${styles.methodItem} ${styles.methodActive}`}>
          <span className={styles.methodIcon}>💳</span>
          <div className={styles.methodInfo}>
            <div className={styles.methodName}>模拟支付</div>
            <div className={styles.methodDesc}>点击下方按钮模拟支付结果</div>
          </div>
          <CheckCircleOutline className={styles.methodCheck} color="#FF5A00" />
        </div>
      </div>

      {/* 模拟支付按钮 */}
      <div className={styles.payActions}>
        <Button
          block
          className={styles.paySuccessBtn}
          loading={paying}
          onClick={() => handleMockPay(true)}
        >
          ✅ 模拟支付成功
        </Button>
        <Button
          block
          className={styles.payFailBtn}
          loading={paying}
          onClick={() => handleMockPay(false)}
        >
          ❌ 模拟支付失败
        </Button>
      </div>

      <div className={styles.footerHint}>
        点击「模拟支付成功」将生成取票码并出票
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default PaymentPage;
