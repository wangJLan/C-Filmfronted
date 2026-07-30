import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { Button, Tabs, SpinLoading } from 'antd-mobile';
import { StarFill } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getFilmList, type FilmItem } from '@/services/api/film';
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

function formatWanted(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(0)}万人想看`;
  return `${n}人想看`;
}

const FilmCard: React.FC<{ film: FilmItem; idx: number; navigate: ReturnType<typeof useNavigate> }> = ({ film, idx, navigate }) => (
  <div key={film.id} className={styles.card} onClick={() => navigate(`/detail/${film.id}`)}>
    <div className={styles.posterWrap} style={{ background: FILM_COLORS[idx % FILM_COLORS.length] }}>
      <img src={film.poster} alt={film.title} className={styles.poster} loading="lazy" />
    </div>
    <div className={styles.info}>
      <div className={styles.title}>{film.title}</div>
      {film.rating > 0 && (
        <div className={styles.rating}>
          <StarFill className={styles.star} />
          <span className={styles.score}>{film.rating.toFixed(1)}</span>
        </div>
      )}
      <div className={styles.meta}>
        {film.wantCount > 0 ? formatWanted(film.wantCount) : ''}
        {film.releaseDate && <> · {film.releaseDate}</>}
      </div>
      <Button
        color={film.rating > 0 ? 'primary' : 'default'}
        size="mini"
        className={styles.buyBtn}
        onClick={(e) => { e.stopPropagation(); navigate(`/detail/${film.id}`); }}
      >
        {film.rating > 0 ? '购票' : '想看'}
      </Button>
    </div>
  </div>
);

const FilmPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'hot' | 'upcoming'>('hot');

  const { data, isLoading } = useQuery({
    queryKey: ['filmList', tab],
    queryFn: () => getFilmList({ status: tab, pageSize: 50 }),
    staleTime: 60000,
  });

  const films = data?.list || [];

  return (
    <div className={styles.page}>
      <div className={styles.tabBar}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k as 'hot' | 'upcoming')} className={styles.tabs}>
          <Tabs.Tab title={`正在热映(${tab === 'hot' ? films.length : '...'})`} key="hot" />
          <Tabs.Tab title={`即将上映(${tab === 'upcoming' ? films.length : '...'})`} key="upcoming" />
        </Tabs>
      </div>
      <div className={styles.list}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <SpinLoading color="primary" />
          </div>
        ) : films.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 14 }}>
            暂无影片
          </div>
        ) : (
          films.map((f, i) => <FilmCard key={f.id} film={f} idx={i} navigate={navigate} />)
        )}
      </div>
    </div>
  );
};

export default FilmPage;
