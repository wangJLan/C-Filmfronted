/**
 * 退票确认弹窗
 */
import React from 'react';
import { Button, Popup, SafeArea } from 'antd-mobile';
import styles from './index.module.less';

interface RefundModalProps {
  visible: boolean;
  order: API.OrderVO;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const RefundModal: React.FC<RefundModalProps> = ({ visible, order, onClose, onConfirm, loading }) => {
  const count = order.count || 1;
  const totalPrice = order.totalPrice || 0;

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
        <div className={styles.titleRow}>
          <span className={styles.title}>确认退票</span>
          <span className={styles.closeBtn} onClick={onClose}>✕</span>
        </div>

        <div className={styles.rules}>
          <div className={styles.ruleNote}>
            1. 仅标有"退票"标识的影院支持退票<br />
            2. 目前仅支持整笔订单退票，不支持单个座位退票<br />
            3. 退票不收取服务费，全额原路退回
          </div>
        </div>

        <div className={styles.feeDetail}>
          <div className={styles.feeRow}>
            <span>退票张数</span>
            <span>{count}张</span>
          </div>
          <div className={styles.feeRow}>
            <span>原票价</span>
            <span>¥{totalPrice.toFixed(2)}</span>
          </div>
          <div className={`${styles.feeRow} ${styles.feeTotal}`}>
            <span>预计退款</span>
            <span className={styles.feeRefund}>¥{totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button block fill="none" className={styles.actionCancel} onClick={onClose}>
            再想想
          </Button>
          <Button
            block
            className={styles.actionConfirm}
            onClick={onConfirm}
            loading={loading}
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
