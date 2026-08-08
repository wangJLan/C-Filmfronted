/**
 * 退款进度页 — 淘票票风格
 */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Toast } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';
import { copyToClipboard } from '@/utils/copy';

const RefundProgressPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;

  const order: API.OrderVO | null = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(`order_${oid}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [oid]);

  const handleCopy = async (text?: string) => {
    if (!text) return;
    try {
      await copyToClipboard(text);
      Toast.show({ content: '已复制' });
    } catch { /* ignore */ }
  };

  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>退款进度</NavBar>
      <div className={styles.empty}>订单数据丢失</div></div>;
  }

  const count = order.count || 1;
  const totalPrice = order.totalPrice || 0;
  const refundAmount = order.refundAmount || totalPrice;
  const refundTime = order.refundTime ? new Date(order.refundTime) : new Date();
  const createdTime = order.createTime ? new Date(order.createTime) : refundTime;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>退款进度</NavBar>

      <div className={styles.steps}>
        {/* 步骤1：提交申请 */}
        <div className={styles.step}>
          <div className={styles.stepLine}>
            <div className={styles.stepDotActive} />
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepTitleActive}>提交申请</div>
            <div className={styles.stepTime}>{createdTime.toLocaleString()}</div>
            <div className={styles.stepCard}>
              <div className={styles.cardRow}>
                <span className={styles.cardKey}>退票电影</span>
                <span className={styles.cardVal}>{order.filmName}({count}张)</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardKey}>退款金额</span>
                <span className={styles.cardValPrimary}>{refundAmount}元</span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardKey}>订单编号</span>
                <span className={styles.cardVal}>{order.orderNo || '—'}</span>
                <span className={styles.cardCopy} onClick={() => handleCopy(order.orderNo)}>复制</span>
              </div>
            </div>
          </div>
        </div>

        {/* 步骤2：处理申请 */}
        <div className={styles.step}>
          <div className={styles.stepLine}>
            <div className={styles.stepDotActive} />
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepTitleActive}>处理申请</div>
            <div className={styles.stepTime}>{createdTime.toLocaleString()}</div>
            <div className={styles.stepCard}>
              <div className={styles.processingText}>已受理退款</div>
            </div>
          </div>
        </div>

        {/* 步骤3：退款成功 */}
        <div className={styles.step}>
          <div className={styles.stepLine}>
            <div className={styles.stepDotFinish}>
              <svg viewBox="0 0 96 96" fill="#f8289c" width="28" height="28">
                <path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm17.1 27.9c-1.2-1.2-3.1-1.2-4.2 0L43 53.8l-7.9-7.9c-1.2-1.2-3.1-1.2-4.2 0s-1.2 3.1 0 4.2l10 10c1.2 1.2 3.1 1.2 4.2 0l20-20c1.2-1.2 1.2-3.1 0-4.2z"/>
              </svg>
            </div>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepTitleFinish}>退款成功</div>
            <div className={styles.stepTime}>{refundTime.toLocaleString()}</div>
            <div className={styles.stepCard}>
              <div className={styles.finishText}>
                {refundAmount}元退款已原路退回至你的付款账户，如有疑问请联系在线客服
              </div>
              <div className={styles.finishOrderNo}>
                订单号：{order.orderNo || '—'}
                <span className={styles.cardCopy} onClick={() => handleCopy(order.orderNo)}>复制</span>
              </div>
              <div className={styles.finishThanks}>本次退款流程结束，感谢你对妙语购票的支持😊</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundProgressPage;
