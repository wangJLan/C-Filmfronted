import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { Button, Tabs, Toast } from 'antd-mobile';
import { StarFill } from 'antd-mobile-icons';
import { MOCK_HOT_FILMS, MOCK_UPCOMING_FILMS, type HotFilm, type UpcomingFilm } from '@/mock/home';
import styles from './index.module.less';

const FILM_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

const FilmPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'hot' | 'upcoming'>('hot');

  const renderCard = (film: HotFilm | UpcomingFilm, idx: number) => (
    <div key={film.id} className={styles.card} onClick={() => navigate(`/detail/${film.id}`)}>
      <div className={styles.posterWrap} style={{ background: FILM_COLORS[idx % FILM_COLORS.length] }}>
        <img src={film.poster} alt={film.title} className={styles.poster} loading="lazy" />
        {film.tags.length > 0 && film.tags.map((tag, ti) => (
          <span key={ti} className={styles.tag}>{tag}</span>
        ))}
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{film.title}</div>
        {'rating' in film && film.rating && film.rating > 0 ? (
          <div className={styles.rating}>
            <StarFill className={styles.star} />
            <span className={styles.score}>{(film as HotFilm).rating.toFixed(1)}</span>
          </div>
        ) : null}
        <div className={styles.meta}>
          {film.wantCount}
          {'releaseDate' in film && <span className={styles.release}>{film.releaseDate}</span>}
        </div>
        <Button
          color={'rating' in film && (film as HotFilm).rating > 0 ? 'primary' : 'default'}
          size="mini"
          className={styles.buyBtn}
          onClick={(e) => { e.stopPropagation(); navigate(`/detail/${film.id}`); }}
        >
          {'rating' in film ? '购票' : '想看'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.tabBar}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k as 'hot' | 'upcoming')} className={styles.tabs}>
          <Tabs.Tab title={`正在热映(${MOCK_HOT_FILMS.length})`} key="hot" />
          <Tabs.Tab title={`即将上映(${MOCK_UPCOMING_FILMS.length})`} key="upcoming" />
        </Tabs>
      </div>
      <div className={styles.list}>
        {tab === 'hot'
          ? MOCK_HOT_FILMS.map((f, i) => renderCard(f, i))
          : MOCK_UPCOMING_FILMS.map((f, i) => renderCard(f, i))
        }
      </div>
      <div className={styles.bottom}>
        <Button block color="primary" size="large" onClick={() => Toast.show({ content: '更多影片加载中' })} style={{ borderRadius: 22 }}>
          加载更多
        </Button>
      </div>
    </div>
  );
};

export default FilmPage;
