import React, { useEffect } from 'react';
import { Button, SpinLoading } from 'antd-mobile';
import { useLocationStore } from '@/stores/useLocationStore';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const GATE_KEY = 'location_gate_v2';

/**
 * 定位授权门控
 *
 * 逻辑:
 *   · 已有缓存 → 跳过弹窗，静默 GPS→IP 定位
 *   · 无缓存 → 弹窗说明用途
 *     - 同意 → GPS→IP 定位
 *     - 暂不使用 → GPS 快速失败 → IP 定位兜底（保证至少拿到 IP 城市）
 */
const LocationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loading = useLocationStore((s) => s.loading);
  const init = useLocationStore((s) => s.init);
  const hasCache = !!localStorage.getItem('app_city');

  // 如果有缓存城市，直接静默初始化
  const [show, setShow] = React.useState(() => !hasCache && !localStorage.getItem(GATE_KEY));

  useEffect(() => {
    localStorage.removeItem('location_gate_passed');

    // 全局初始化用户信息（任何页面打开都会触发，不依赖进入"我的"页面）
    useUserStore.getState().init();

    if (hasCache) {
      init(); // 有缓存 → GPS → IP 静默定位
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
    init(); // GPS 会因权限失败自动降级到 IP 定位
  };

  return (
    <>
      {show && (
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
      )}
      {/* 页面主体始终渲染（AiChat 悬浮窗在定位弹窗之上可见） */}
      {children}
    </>
  );
};

export default LocationGate;
