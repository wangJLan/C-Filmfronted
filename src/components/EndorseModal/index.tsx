/**
 * 改签弹窗 — 展示规则，点击"前往改签"进入实际流程
 *
 * 规则：
 *   开场前 ≥60分钟 → 服务费 4元/张
 *   开场前 1分钟~1小时 → 服务费 6元/张
 *   开场前 <1分钟 → 不可改签
 */
import React, { useMemo } from 'react';
import { Popup, SafeArea } from 'antd-mobile';
import styles from './index.module.less';

interface EndorseModalProps {
  visible: boolean;
  scheduleTime?: string;
  count?: number;
  onClose: () => void;
  onConfirm: () => void;
}

function parseShowTime(scheduleTime?: string): Date | null {
  if (!scheduleTime) return null;
  try { return new Date(scheduleTime); } catch { return null; }
}

function diffMinutes(showTime: Date | null): number {
  if (!showTime) return Infinity;
  return Math.round((showTime.getTime() - Date.now()) / 60_000);
}

const EndorseModal: React.FC<EndorseModalProps> = ({
  visible, scheduleTime, count = 1, onClose, onConfirm,
}) => {
  const showTime = useMemo(() => parseShowTime(scheduleTime), [scheduleTime]);
  const minutes = useMemo(() => diffMinutes(showTime), [showTime]);

  const allowed = minutes >= 1;
  const feePer = minutes >= 60 ? 4 : minutes >= 1 ? 6 : 0;

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
        {/* 标题行 */}
        <div className={styles.header}>
          <span className={styles.title}>申请改签</span>
          <span className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 96 96" fill="#959AA5" width="22" height="22">
              <path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm-8.1 27.8c-1.1-1.1-2.9-1.1-4.1 0s-1.1 2.9 0 4.1l8.1 8.1-8.1 8.1c-1.1 1.1-1.1 2.9 0 4.1s2.9 1.1 4.1 0l8.1-8.1 8.1 8.1c1.1 1.1 2.9 1.1 4.1 0s1.1-2.9 0-4.1L52.1 48l8.1-8.1c1.1-1.1 1.1-2.9 0-4.1s-2.9-1.1-4.1 0L48 43.9l-8.1-8.1z"/>
            </svg>
          </span>
        </div>

        {/* 可用次数 */}
        <div className={styles.timesRow}>
          <span className={styles.timesIcon}>↻</span>
          <span>你本月还可快速自助改签<b>2</b>次</span>
        </div>

        {/* 重要规则 */}
        <div className={styles.rulesCard}>
          <div className={styles.ruleTitle}>重要规则</div>
          <div className={styles.ruleContent}>
            本次改签后，不支持继续改签或退票<br />
            改签限同影院，不限影片（电影节影片除外）、不限日期、场次
          </div>
        </div>

        {/* 改签费 */}
        <div className={styles.feeCard}>
          <div className={styles.feeTitle}>改签费</div>
          <div className={styles.feeDesc}>
            未取票开场前1小时以上，改签服务费<b>4.0元/张</b>；<br />
            未取票开场前1分钟至1小时，改签服务费<b>6.0元/张</b>；<br />
            未取票开场前1分钟内<b>不允许改签</b>
          </div>
        </div>

        {/* 当前费用 */}
        <div className={styles.currentFee}>
          <div className={styles.currentLabel}>当前改签费</div>
          <div className={styles.currentInfo}>
            {allowed ? (
              <span className={styles.currentAmount}>
                {feePer}元/张 × {count}张 = {feePer * count}元，距开场{minutes >= 60 ? `${Math.floor(minutes / 60)}小时` : ''}{minutes >= 60 && minutes % 60 > 0 ? minutes % 60 + '分钟' : ''}{minutes < 60 ? `${minutes}分钟` : ''}
              </span>
            ) : (
              <span className={styles.currentForbid}>距开场不足1分钟，不可改签</span>
            )}
          </div>
        </div>

        {/* 按钮 */}
        <div className={styles.bottomBtn}>
          <button
            className={`${styles.confirmBtn} ${!allowed ? styles.confirmDisabled : ''}`}
            onClick={allowed ? onConfirm : undefined}
            disabled={!allowed}
          >
            前往改签
          </button>
        </div>
        <SafeArea position="bottom" />
      </div>
    </Popup>
  );
};

export default EndorseModal;
