import React from 'react';
import { useNavigate } from 'umi';
import { NavBar, Toast, Button, Empty } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import { useUserStore } from '@/stores/useUserStore';
import { useGuard } from '@/hooks/useGuard';
import styles from './index.module.less';

const CouponsPage: React.FC = () => {
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const { coupons, useCoupon } = useFilmCollectionStore();

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>我的优惠券</NavBar>
        <Empty description="登录后可查看优惠券" style={{ paddingTop: 80 }} />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button color="primary" size="small" onClick={() => guard(() => {})}>去登录</Button>
        </div>
      </div>
    );
  }
  const available = coupons.filter((c) => !c.used);
  const used = coupons.filter((c) => c.used);

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>我的优惠券</NavBar>

      <div className={styles.summary}>
        <span className={styles.sumNum}>{available.length}</span>
        <span className={styles.sumLabel}>张可用</span>
      </div>

      <div className={styles.list}>
        {available.length === 0 && <p className={styles.empty}>暂无可用优惠券</p>}
        {available.map((c) => (
          <div key={c.id} className={`${styles.card} ${styles.cardAvail}`}>
            <div className={styles.cardLeft}>
              <div className={styles.amount}>
                <span className={styles.amountNum}>{c.amount}</span>
                <span className={styles.amountUnit}>元</span>
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{c.title}</div>
                <div className={styles.cardCond}>{c.condition}</div>
              </div>
            </div>
            <div className={styles.cardRight}>
              <span className={styles.expire}>有效期至<br/>{c.expireDate}</span>
              <span className={styles.useBtn} onClick={() => { useCoupon(c.id); Toast.show({ icon: 'success', content: '已使用' }); }}>
                去使用
              </span>
            </div>
          </div>
        ))}
      </div>

      {used.length > 0 && (
        <div className={styles.usedSection}>
          <h3 className={styles.usedTitle}>已使用/已过期</h3>
          {used.map((c) => (
            <div key={c.id} className={`${styles.card} ${styles.cardUsed}`}>
              <div className={styles.cardLeft}>
                <div className={styles.amount}>
                  <span className={styles.amountNum}>{c.amount}</span>
                  <span className={styles.amountUnit}>元</span>
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTitle}>{c.title}</div>
                  <div className={styles.cardCond}>{c.condition}</div>
                </div>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.usedTag}>已使用</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
