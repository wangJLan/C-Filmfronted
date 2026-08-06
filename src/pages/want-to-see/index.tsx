import React, { useEffect } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Empty } from 'antd-mobile';
import { LeftOutline, CloseOutline } from 'antd-mobile-icons';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import { useUserStore } from '@/stores/useUserStore';
import { useGuard } from '@/hooks/useGuard';
import styles from './index.module.less';

const WantToSeePage: React.FC = () => {
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const { wantToSee, fetchWantToSee, removeWantToSeeApi } = useFilmCollectionStore();

  useEffect(() => {
    if (isLoggedIn) fetchWantToSee();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate('/user')} back={<LeftOutline />}>想看的电影</NavBar>
        <Empty description="登录后可查看想看的电影" style={{ paddingTop: 80 }} />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button color="primary" size="small" onClick={() => guard(() => {})}>去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate('/user')} back={<LeftOutline />}>想看的电影</NavBar>

      <div className={styles.list}>
        {wantToSee.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description="还没有想看" />
            <Button color="primary" size="small" onClick={() => navigate('/film')} style={{ marginTop: 12, borderRadius: 16 }}>
              去发现好片
            </Button>
          </div>
        ) : (
          wantToSee.map((film) => (
            <div key={film.id} className={styles.card} onClick={() => navigate(`/detail/${film.id}`)}>
              <div className={styles.poster}>
                <img src={film.posterUrl} alt={film.name} />
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{film.name}</div>
                <div className={styles.meta}>评分 {(film.rating ?? 0).toFixed(1)}</div>
              </div>
              <div
                className={styles.remove}
                onClick={(e) => { e.stopPropagation(); removeWantToSeeApi(film.id); }}
              >
                <CloseOutline fontSize={16} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WantToSeePage;
