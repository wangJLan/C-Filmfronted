import React from 'react';
import { useNavigate } from 'umi';
import { NavBar } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import styles from './index.module.less';

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { balance, points } = useFilmCollectionStore();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>我的钱包</NavBar>

      <div className={styles.header}>
        <div className={styles.balanceCard}>
          <p className={styles.balanceLabel}>账户余额（元）</p>
          <h2 className={styles.balanceNum}>{balance.toFixed(2)}</h2>
          <div className={styles.balanceBtns}>
            <span className={styles.btn}>充值</span>
            <span className={styles.btnOutline}>提现</span>
          </div>
        </div>
        <div className={styles.pointsCard}>
          <p className={styles.balanceLabel}>妙语积分</p>
          <h2 className={styles.pointsNum}>{points.toLocaleString()}</h2>
          <p className={styles.pointsHint}>100积分 = 1元抵扣</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>交易记录</h3>
        <div className={styles.txList}>
          <div className={styles.txItem}>
            <div className={styles.txLeft}>
              <span className={styles.txIcon}>🎬</span>
              <div>
                <div className={styles.txName}>《蜘蛛侠：纵横宇宙》IMAX</div>
                <div className={styles.txTime}>2026-07-28 19:00</div>
              </div>
            </div>
            <span className={styles.txAmount}>-¥84.00</span>
          </div>
          <div className={styles.txItem}>
            <div className={styles.txLeft}>
              <span className={styles.txIcon}>💳</span>
              <div>
                <div className={styles.txName}>余额充值</div>
                <div className={styles.txTime}>2026-07-25 14:30</div>
              </div>
            </div>
            <span className={styles.txAmountIn}>+¥200.00</span>
          </div>
          <div className={styles.txItem}>
            <div className={styles.txLeft}>
              <span className={styles.txIcon}>🎟️</span>
              <div>
                <div className={styles.txName}>优惠券抵扣</div>
                <div className={styles.txTime}>2026-07-28 19:00</div>
              </div>
            </div>
            <span className={styles.txAmountIn}>+¥15.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
