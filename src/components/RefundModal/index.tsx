/**
 * 退票确认弹窗 — 按规则计算服务费
 *
 * 规则：
 *   开场前 ≥24小时 → 服务费 8 元/张
 *   开场前 4~24小时 → 服务费 10 元/张
 *   开场前 1~4小时 → 服务费 12 元/张
 *   开场前 1分钟~1小时 → 服务费 14 元/张
 *   开场前 <1分钟 → 不可退票
 */
import React, { useMemo } from 'react';
import { Button, Popup, SafeArea } from 'antd-mobile';
import { useNavigate } from 'umi';
import styles from './index.module.less';

interface RefundModalProps {
  visible: boolean;
  order: API.OrderVO;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

/** 从 scheduleTime 解析开场时间 */
function parseShowTime(scheduleTime?: string): Date | null {
  if (!scheduleTime) return null;
  try { return new Date(scheduleTime); } catch { return null; }
}

/** 计算分钟差 (now → showTime) */
function diffMinutes(showTime: Date | null): number {
  if (!showTime) return Infinity;
  return Math.round((showTime.getTime() - Date.now()) / 60_000);
}

export function calcRefund(minutes: number, count: number) {
  if (minutes < 1) {
    return { allowed: false, feePer: 0, totalFee: 0, refundAmount: 0, stage: '<1' };
  }
  if (minutes < 60) {
    const feePer = 14;
    return { allowed: true, feePer, totalFee: feePer * count, stage: '1m-1h', label: '1分钟至1小时' };
  }
  if (minutes < 240) {
    const feePer = 12;
    return { allowed: true, feePer, totalFee: feePer * count, stage: '1h-4h', label: '1小时至4小时' };
  }
  if (minutes < 1440) {
    const feePer = 10;
    return { allowed: true, feePer, totalFee: feePer * count, stage: '4h-24h', label: '4小时至24小时' };
  }
  const feePer = 8;
  return { allowed: true, feePer, totalFee: feePer * count, stage: '>=24h', label: '24小时以上' };
}

const RefundModal: React.FC<RefundModalProps> = ({ visible, order, onClose, onConfirm, loading }) => {
  const showTime = useMemo(() => parseShowTime(order.scheduleTime), [order.scheduleTime]);
  const minutes = useMemo(() => diffMinutes(showTime), [showTime]);
  const count = order.count || 1;
  const totalPrice = order.totalPrice || 0;
  const refund = useMemo(() => calcRefund(minutes, count), [minutes, count]);

  const formatMinutes = (m: number) => {
    if (m <= 0) return '已开场';
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const r = m % 60;
      return r > 0 ? `${h}小时${r}分钟` : `${h}小时`;
    }
    return `${m}分钟`;
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '80vh',
      }}
    >
      <div className={styles.panel}>
        {/* 标题 */}
        <div className={styles.titleRow}>
          <span className={styles.title}>确认退票</span>
          <span className={styles.closeBtn} onClick={onClose}>✕</span>
        </div>

        {/* 退票规则提示 */}
        <div className={styles.rules}>
          <div className={styles.ruleTitle}>退票规则</div>
          <div className={`${styles.ruleItem} ${refund.stage === '>=24h' ? styles.ruleActive : ''}`}>
            <span className={styles.ruleDot} />
            <span>未取票开场前24小时以上，退票服务费 <strong>8.0元/张</strong></span>
          </div>
          <div className={`${styles.ruleItem} ${refund.stage === '4h-24h' ? styles.ruleActive : ''}`}>
            <span className={styles.ruleDot} />
            <span>未取票开场前4小时至24小时，退票服务费 <strong>10.0元/张</strong></span>
          </div>
          <div className={`${styles.ruleItem} ${refund.stage === '1h-4h' ? styles.ruleActive : ''}`}>
            <span className={styles.ruleDot} />
            <span>未取票开场前1小时至4小时，退票服务费 <strong>12.0元/张</strong></span>
          </div>
          <div className={`${styles.ruleItem} ${refund.stage === '1m-1h' ? styles.ruleActive : ''}`}>
            <span className={styles.ruleDot} />
            <span>未取票开场前1分钟至1小时，退票服务费 <strong>14.0元/张</strong></span>
          </div>
          <div className={`${styles.ruleItem} ${!refund.allowed ? styles.ruleDisabled : ''}`}>
            <span className={styles.ruleDot} />
            <span>未取票开场前1分钟内<strong>不允许退票</strong></span>
          </div>
          <div className={styles.ruleNote}>
            1. 仅标有"退票"标识的影院支持退票<br />
            2. 目前仅支持整笔订单退票，不支持单个座位退票
          </div>
        </div>

        {/* 当前状态 */}
        <div className={styles.statusRow}>
          <span className={styles.statusLabel}>距开场</span>
          <span className={`${styles.statusVal} ${!refund.allowed ? styles.statusDanger : ''}`}>
            {formatMinutes(minutes)}
          </span>
        </div>

        {/* 费用明细 */}
        {refund.allowed ? (
          <div className={styles.feeDetail}>
            <div className={styles.feeRow}>
              <span>原票价</span>
              <span>¥{totalPrice.toFixed(2)}</span>
            </div>
            <div className={styles.feeRow}>
              <span>退票服务费（{refund.feePer}元 × {count}张）</span>
              <span className={styles.feeDeduct}>-¥{refund.totalFee.toFixed(2)}</span>
            </div>
            <div className={`${styles.feeRow} ${styles.feeTotal}`}>
              <span>预计退款</span>
              <span className={styles.feeRefund}>¥{(totalPrice - refund.totalFee).toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className={styles.cantRefund}>
            ⚠️ 距离开场不足1分钟，暂不支持退票
          </div>
        )}

        {/* 按钮 */}
        <div className={styles.actions}>
          <Button block fill="none" className={styles.actionCancel} onClick={onClose}>
            再想想
          </Button>
          <Button
            block
            className={styles.actionConfirm}
            onClick={onConfirm}
            loading={loading}
            disabled={!refund.allowed}
          >
            确认退票
          </Button>
        </div>
        <SafeArea position="bottom" />
      </div>
    </Popup>
  );
};

export default RefundModal;
