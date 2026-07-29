import React from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Empty } from 'antd-mobile';
import { LeftOutline, CloseOutline } from 'antd-mobile-icons';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import styles from './index.module.less';

const WantToSeePage: React.FC = () => {
  const navigate = useNavigate();
  const { wantToSee, toggleWantToSee } = useFilmCollectionStore();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>想看的电影</NavBar>

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
            <div key={film.filmId} className={styles.card} onClick={() => navigate(`/detail/${film.filmId}`)}>
              <div className={styles.poster}>
                <img src={film.poster} alt={film.title} />
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{film.title}</div>
                <div className={styles.meta}>评分 {film.rating.toFixed(1)} · {film.wantCount}</div>
                <div className={styles.date}>添加于 {new Date(film.addedAt).toLocaleDateString()}</div>
              </div>
              <div
                className={styles.remove}
                onClick={(e) => { e.stopPropagation(); toggleWantToSee(film); }}
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
