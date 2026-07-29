import React from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Empty } from 'antd-mobile';
import { LeftOutline, StarFill } from 'antd-mobile-icons';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import { MOCK_HOT_FILMS, MOCK_UPCOMING_FILMS } from '@/mock/home';
import styles from './index.module.less';

const ALL_FILMS = [...MOCK_HOT_FILMS, ...MOCK_UPCOMING_FILMS];

const WatchedPage: React.FC = () => {
  const navigate = useNavigate();
  const { watched } = useFilmCollectionStore();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>看过的电影</NavBar>

      <div className={styles.list}>
        {watched.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description="还没有记录" />
            <Button color="primary" size="small" onClick={() => navigate('/film')} style={{ marginTop: 12, borderRadius: 16 }}>
              去看看
            </Button>
          </div>
        ) : (
          watched.map((film) => (
            <div key={film.filmId} className={styles.card} onClick={() => navigate(`/detail/${film.filmId}`)}>
              <div className={styles.poster}>
                <img src={film.poster} alt={film.title} />
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{film.title}</div>
                <div className={styles.rating}>
                  <StarFill color="#FFB800" fontSize={12} />
                  <span className={styles.ratingNum}>{film.rating.toFixed(1)}</span>
                </div>
                <div className={styles.date}>观看于 {new Date(film.addedAt).toLocaleDateString()}</div>
              </div>
              <Button
                size="mini"
                color="primary"
                className={styles.rebuyBtn}
                onClick={(e) => { e.stopPropagation(); navigate(`/detail/${film.filmId}`); }}
              >
                再看一次
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WatchedPage;
