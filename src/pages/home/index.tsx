import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'umi';
import { SearchBar, SpinLoading } from 'antd-mobile';
import { EnvironmentOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/stores/useLocationStore';
import { useUserStore } from '@/stores/useUserStore';
import { listFilm } from '@/api/filmController';
import FilmCard from '@/components/FilmCard/index';
import styles from './index.module.less';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const city = useLocationStore((s) => s.city);
  const { isLoggedIn } = useUserStore();

  const { data: hotData, isLoading: hotLoading } = useQuery({
    queryKey: ['filmList', 'hot'],
    queryFn: () => listFilm({ filmQueryRequest: { status: 'hot', pageSize: 20 } }),
    staleTime: 60000,
  });
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['filmList', 'upcoming'],
    queryFn: () => listFilm({ filmQueryRequest: { status: 'upcoming', pageSize: 20 } }),
    staleTime: 60000,
  });

  const hotFilms = hotData?.records || [];
  const upcomingFilms = upcomingData?.records || [];

  // 高分热映影片（评分 >= 8.0）
  const topFilms = useMemo(
    () => hotFilms.filter(f => (f.rating ?? 0) >= 8.0),
    [hotFilms],
  );

  // 海报横向自动滚动
  const posterStripRef = useRef<HTMLDivElement>(null);
  const userInteracting = useRef(false);

  const startAutoScroll = useCallback(() => {
    const interval = 3000; // 每3秒翻一张
    let timer: ReturnType<typeof setInterval>;
    timer = setInterval(() => {
      const el = posterStripRef.current;
      if (!el || userInteracting.current) return;
      const itemWidth = el.clientWidth; // 每个海报宽度 ≈ 容器宽度
      const next = el.scrollLeft + itemWidth;
      // 超过一半内容时回到开头（因为复制了一份）
      if (next >= el.scrollWidth / 2) {
        el.scrollTo({ left: 0, behavior: 'instant' });
      } else {
        el.scrollTo({ left: next, behavior: 'smooth' });
      }
    }, interval);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (topFilms.length === 0) return;
    const cleanup = startAutoScroll();
    return cleanup;
  }, [topFilms, startAutoScroll]);

  const handlePointerDown = () => { userInteracting.current = true; };
  const handlePointerUp = () => { userInteracting.current = false; };

  return (
    <div className={styles.page}>
      {/* 搜索栏 + 城市定位 */}
      <div className={styles.searchRow}>
        <div className={styles.cityTag} onClick={() => navigate('/city-picker')}>
          <EnvironmentOutline fontSize={14} color="#FF5A00" />
          <span>{city}</span>
          <span className={styles.cityArrow}>▾</span>
        </div>
        <div className={styles.searchWrap}>
          <SearchBar placeholder="搜电影、搜影院" onSearch={(val) => navigate(`/search?keyword=${encodeURIComponent(val.trim())}`)}
            className={styles.searchBar} />
        </div>
      </div>

      {/* 顶部品牌区 + 海报滚动（共用橙色背景） */}
      <div className={styles.heroWrap}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.brand}>妙语购票</span>
            <span className={styles.divider}>|</span>
            <span className={styles.subBrand}>妙语购票</span>
            <div className={styles.headerIcons}>
              <span className={styles.iconBtn} onClick={() => navigate('/user')}>{isLoggedIn ? '👤' : '👤'}</span>
            </div>
          </div>
        </div>

        {/* 高分热映海报滚动 */}
        {topFilms.length > 0 && (
          <div
            ref={posterStripRef}
            className={styles.posterStrip}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
          >
            {[...topFilms, ...topFilms].map((film, idx) => (
              <div
                key={`${film.id}-${idx}`}
                className={styles.posterStripItem}
                onClick={() => navigate(`/detail/${film.id}`)}
              >
                <img src={film.posterUrl} alt={film.name} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 热映影片 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>正在热映（{hotFilms.length}部）</span>
          <span className={styles.sectionMore} onClick={() => navigate('/film')}>全部 ›</span>
        </div>
        <div className={styles.filmCardList}>
          {hotLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
          ) : hotFilms.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>暂无热映影片</div>
          ) : (
            <div className={styles.filmCardScroll}>
              {hotFilms.map((film) => (
                <FilmCard key={film.id} film={film} variant="vertical" />
              ))}
              <div className={styles.moreCard} onClick={() => navigate('/film')}>
                <div className={styles.moreCardTitle}>更多</div>
                <div className={styles.moreCardSub}>热映影片</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 即将上映 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>即将上映</span>
          <span className={styles.sectionMore} onClick={() => navigate('/film')}>全部 ›</span>
        </div>
        <div className={styles.filmCardList}>
          {upcomingLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
          ) : upcomingFilms.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>暂无即将上映影片</div>
          ) : (
            <div className={styles.filmCardScroll}>
              {upcomingFilms.map((film) => (
                <FilmCard key={film.id} film={film} variant="vertical" />
              ))}
              <div className={styles.moreCard} onClick={() => navigate('/film')}>
                <div className={styles.moreCardTitle}>更多</div>
                <div className={styles.moreCardSub}>即将上映</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部 */}
      <div className={styles.bottomAction}>
        <div className={styles.homeButton} onClick={() => navigate('/film')}>
          <span>🎬</span>
          <span>全部影片</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
