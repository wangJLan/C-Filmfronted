/**
 * 退票申请页
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Toast, SafeArea, Popup } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail } from '@/api/orderController';
import http from '@/services/request';
import styles from './index.module.less';

const REASONS = [
  '买错时间了',
  '买错影院了',
  '买错影片了',
  '临时有事去不了',
  '想换别的场次',
  '其他原因',
];

function parseShowTime(scheduleTime?: string): Date | null {
  if (!scheduleTime) return null;
  try { return new Date(scheduleTime); } catch { return null; }
}

function diffMinutes(showTime: Date | null): number {
  if (!showTime) return Infinity;
  return Math.floor((showTime.getTime() - Date.now()) / 60_000);
}

const RefundApplyPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasons, setShowReasons] = useState(false);
  const [score, setScore] = useState(0);
  const [advice, setAdvice] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [order, setOrder] = useState<API.OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getOrderDetail({ id: oid }).then((o: any) => {
      const vo = o?.data ?? o;
      setOrder(vo);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [oid]);

  const count = order?.count || 1;
  const totalPrice = order?.totalPrice || 0;

  const showTime = useMemo(() => parseShowTime(order?.scheduleTime), [order?.scheduleTime]);
  const minutes = useMemo(() => diffMinutes(showTime), [showTime]);

  const cantRefundReason = useMemo(() => {
    if (!order) return null;
    if (order.status === 'expired') return '电影已结束，无法退票';
    if (order.status === 'refunded') return '订单已退款';
    if (order.status !== 'paid') return '订单状态不支持退票';
    if (minutes <= 0) return '电影已开场，无法退票';
    if (minutes < 1) return '距开场不足1分钟，不支持退票';
    return null;
  }, [order, minutes]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      sessionStorage.setItem(`order_${oid}_refundAmount`, String(totalPrice));
      sessionStorage.setItem(`order_${oid}_refundFee`, '0');
      await http.post(`/order/refund/${oid}`);
      Toast.show({ icon: 'success', content: '退票申请已提交' });
      navigate(`/ticket/${oid}`, { replace: true });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '退票失败' });
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>退票</NavBar>
      <div className={styles.empty}>加载中…</div></div>;
  }

  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>退票</NavBar>
      <div className={styles.empty}>订单数据丢失</div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>退票</NavBar>

      {cantRefundReason && (
        <div style={{
          margin: '12px 16px',
          padding: '12px 16px',
          borderRadius: 8,
          background: '#FFF3E0',
          color: '#E65100',
          fontSize: 14,
          textAlign: 'center',
        }}>
          {cantRefundReason}
        </div>
      )}

      {/* ===== 退款金额 ===== */}
      <div className={styles.refundCard}>
        <div className={styles.refundTitle}>
          <span className={styles.refundLabel}>退款金额</span>
          <span className={styles.refundMoney}>
            <span className={styles.yen}>¥</span>
            {totalPrice.toFixed(2)}
          </span>
        </div>
        <div className={styles.refundMsg}>
          全额退款，不收取服务费
        </div>
        <div className={styles.refundMsg}>预计3个工作日内原路退回。</div>
      </div>

      {/* ===== 退款原因 ===== */}
      <div className={styles.reasonCard}>
        <div className={styles.sectionTitle}>退款原因小调研</div>
        <div className={styles.sectionSubtitle}>本次退款原因（必填）</div>
        <div className={styles.reasonSelect} onClick={() => setShowReasons(!showReasons)}>
          <span className={reason ? styles.reasonVal : styles.reasonPlaceholder}>
            {reason || '请放心选择，不影响退款申请哦'}
          </span>
          <span className={styles.arrow}>›</span>
        </div>
        {showReasons && (
          <div className={styles.reasonList}>
            {REASONS.map((r) => (
              <div
                key={r}
                className={`${styles.reasonItem} ${reason === r ? styles.reasonItemActive : ''}`}
                onClick={() => { setReason(r); setShowReasons(false); }}
              >
                {r}
              </div>
            ))}
          </div>
        )}

        {/* ===== 满意度 ===== */}
        <div className={styles.satisfyLabel}>退票体验满意度打分</div>
        <div className={styles.scoreRow}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div
              key={n}
              className={`${styles.scoreItem} ${score === n ? styles.scoreActive : ''}`}
              onClick={() => setScore(n)}
            >
              {n}
            </div>
          ))}
        </div>
        <div className={styles.scoreRange}>
          <span>不满意</span>
          <span>满意</span>
        </div>

        {/* ===== 其他建议 ===== */}
        <div className={styles.adviceSection}>
          <div className={styles.adviceTitle}>其他建议</div>
          <textarea
            className={styles.adviceTextarea}
            rows={3}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="您的意见很重要，写写其他建议"
          />
        </div>
      </div>

      {/* ===== 底部确认 ===== */}
      <div className={styles.bottomBar}>
        <div
          className={`${styles.confirmBtn} ${(!reason || cantRefundReason) ? styles.confirmDisabled : ''}`}
          onClick={(reason && !cantRefundReason) ? () => setShowConfirm(true) : undefined}
        >
          {cantRefundReason ? cantRefundReason : (reason ? '确认退票' : '选择退款原因进入下一步')}
        </div>
        {!cantRefundReason && (
          <div className={styles.confirmHint}>
            发起退票后不可撤销
          </div>
        )}
        <SafeArea position="bottom" />
      </div>

      {/* ===== 确认退票弹窗 ===== */}
      <Popup
        visible={showConfirm}
        onMaskClick={() => setShowConfirm(false)}
        bodyStyle={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh',
        }}
      >
        <div className={styles.confirmPanel}>
          <div className={styles.confirmHeader}>
            <span className={styles.confirmTitle}>正在退订{count}张电影票</span>
            <span className={styles.confirmClose} onClick={() => setShowConfirm(false)}>
              <svg viewBox="0 0 96 96" fill="#c8c8c8" width="24" height="24">
                <path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm-8.1 27.8c-1.1-1.1-2.9-1.1-4.1 0s-1.1 2.9 0 4.1l8.1 8.1-8.1 8.1c-1.1 1.1-1.1 2.9 0 4.1s2.9 1.1 4.1 0l8.1-8.1 8.1 8.1c1.1 1.1 2.9 1.1 4.1 0s1.1-2.9 0-4.1L52.1 48l8.1-8.1c1.1-1.1 1.1-2.9 0-4.1s-2.9-1.1-4.1 0L48 43.9l-8.1-8.1z"/>
              </svg>
            </span>
          </div>

          <div className={styles.confirmTimes}>
            <span>退票不收取服务费，全额原路退回</span>
          </div>

          <div className={styles.confirmRules}>
            <div className={styles.confirmRulesTitle}>退款明细</div>
            <div className={styles.confirmRulesContent}>
              退款金额：<b>¥{totalPrice.toFixed(2)}</b>（{count}张 × ¥{(totalPrice / count).toFixed(2)}）<br />
              退款方式：原路退回<br />
              预计到账：3个工作日内
            </div>
          </div>

          <div className={styles.confirmFooter}>
            <button
              className={styles.confirmPayBtn}
              onClick={() => { setShowConfirm(false); handleSubmit(); }}
              disabled={submitting}
            >
              {submitting ? '提交中…' : '确认退票'}
            </button>
          </div>
          <SafeArea position="bottom" />
        </div>
      </Popup>
    </div>
  );
};

export default RefundApplyPage;
