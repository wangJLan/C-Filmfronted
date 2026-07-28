import React from 'react';
import { Button, SpinLoading } from 'antd-mobile';
import { useLocationStore } from '@/stores/useLocationStore';
import styles from './index.module.less';

/**
 * 定位授权门控 — 首次打开时展示
 * 模拟小程序的地理位置授权流程
 */
const LocationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showGate = useLocationStore((s) => s.showGate);
  const loading = useLocationStore((s) => s.loading);
  const grant = useLocationStore((s) => s.grant);
  const deny = useLocationStore((s) => s.deny);

  // 不需要弹窗 → 直接渲染子组件
  if (!showGate) {
    return <>{children}</>;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* 定位图标 */}
        <div className={styles.iconWrap}>
          <div className={styles.pin}>
            <div className={styles.pinHead} />
            <div className={styles.pinBody} />
            <div className={styles.pinShadow} />
          </div>
          <div className={styles.ripple} />
          <div className={styles.ripple2} />
        </div>

        {/* 文案 */}
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

        {/* 按钮 */}
        <div className={styles.actions}>
          <Button
            block
            className={styles.agreeBtn}
            loading={loading}
            loadingIcon={<SpinLoading style={{ '--size': '16px' }} color="white" />}
            onClick={grant}
          >
            同意授权
          </Button>
          <Button
            block
            fill="none"
            className={styles.denyBtn}
            onClick={deny}
            disabled={loading}
          >
            暂不使用
          </Button>
        </div>
      </div>

      {/* 底部品牌 */}
      <div className={styles.brand}>妙语购票</div>
    </div>
  );
};

export default LocationGate;
