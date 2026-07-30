import React, { useEffect } from 'react';
import { Button, SpinLoading } from 'antd-mobile';
import { useLocationStore } from '@/stores/useLocationStore';
import styles from './index.module.less';

const GATE_KEY = 'location_gate_passed';

/**
 * 定位授权门控 — 首次打开时展示，后续跳过
 */
const LocationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loading = useLocationStore((s) => s.loading);
  const init = useLocationStore((s) => s.init);

  const [show, setShow] = React.useState(() => !localStorage.getItem(GATE_KEY));

  useEffect(() => {
    // 如果之前已授权过，直接静默初始化 GPS
    if (!show) {
      init();
    }
  }, []);

  const handleGrant = async () => {
    localStorage.setItem(GATE_KEY, '1');
    setShow(false);
    await init();
  };

  const handleDeny = () => {
    localStorage.setItem(GATE_KEY, '1');
    setShow(false);
    // 不调 GPS，直接用缓存或默认值
    init();
  };

  if (!show) {
    return <>{children}</>;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <div className={styles.pin}>
            <div className={styles.pinHead} />
            <div className={styles.pinBody} />
            <div className={styles.pinShadow} />
          </div>
          <div className={styles.ripple} />
          <div className={styles.ripple2} />
        </div>

        <h2 className={styles.title}>需要获取你的地理位置</h2>
        <p className={styles.desc}>
          妙语购票需要获取你的位置信息，用于展示附近的影院排片、推荐本地热门电影，并提供更精准的观影服务。
        </p>
        <div className={styles.bullets}>
          <div className={styles.bullet}>
            <span className={styles.dot} />
            <span>展示附近影院排片</span>
          </div>
          <div className={styles.bullet}>
            <span className={styles.dot} />
            <span>推荐本地热门电影</span>
          </div>
          <div className={styles.bullet}>
            <span className={styles.dot} />
            <span>你随时可以在设置中关闭</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            block
            className={styles.agreeBtn}
            loading={loading}
            loadingIcon={<SpinLoading style={{ '--size': '16px' }} color="white" />}
            onClick={handleGrant}
          >
            同意授权
          </Button>
          <Button
            block
            fill="none"
            className={styles.denyBtn}
            onClick={handleDeny}
            disabled={loading}
          >
            暂不使用
          </Button>
        </div>
      </div>

      <div className={styles.brand}>妙语购票</div>
    </div>
  );
};

export default LocationGate;
