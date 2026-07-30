import React, { useRef } from 'react';
import { useNavigate } from 'umi';
import { Button, Toast, SearchBar, SpinLoading } from 'antd-mobile';
import { StarFill, EnvironmentOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/stores/useLocationStore';
import { useUserStore } from '@/stores/useUserStore';
import { getFilmList, type FilmItem } from '@/services/api/film';
import { MOCK_BENEFITS, type BenefitItem } from '@/mock/home';
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

const FilmCardRow: React.FC<{ film: FilmItem; idx: number; onClick: () => void; onBuy: () => void; isHot: boolean }> =
  ({ film, idx, onClick, onBuy, isHot }) => (
    <div className={styles.filmCard} onClick={onClick}>
      <div className={styles.posterPlaceholder} style={{ background: FILM_COLORS[idx % FILM_COLORS.length] }}>
        <img src={film.poster} alt={film.title} className={styles.poster} loading="lazy" />
      </div>
      <div className={styles.filmInfo}>
        <div className={styles.filmName}>{film.title}</div>
        {film.rating > 0 && (
          <div className={styles.rating}>
            <StarFill className={styles.starIcon} />
            <span className={styles.ratingValue}>{film.rating.toFixed(1)}</span>
          </div>
        )}
        <div className={styles.wantCount}>
          {isHot ? formatWanted(film.wantCount) : film.releaseDate}
        </div>
      </div>
      <Button color={isHot ? 'primary' : 'default'} size="mini" className={styles.buyButton}
        onClick={(e) => { e.stopPropagation(); onBuy(); }}>
        {isHot ? '购票' : '想看'}
      </Button>
    </div>
  );

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const city = useLocationStore((s) => s.city);
  const { isLoggedIn } = useUserStore();
  const hotScrollRef = useRef<HTMLDivElement>(null);
  const upcomingScrollRef = useRef<HTMLDivElement>(null);

  const { data: hotData, isLoading: hotLoading } = useQuery({
    queryKey: ['filmList', 'hot'],
    queryFn: () => getFilmList({ status: 'hot', pageSize: 20 }),
    staleTime: 60000,
  });
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['filmList', 'upcoming'],
    queryFn: () => getFilmList({ status: 'upcoming', pageSize: 20 }),
    staleTime: 60000,
  });

  const hotFilms = hotData?.list || [];
  const upcomingFilms = upcomingData?.list || [];

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
          <SearchBar placeholder="搜电影、搜影院" onSearch={() => Toast.show({ content: '搜索功能开发中' })}
            className={styles.searchBar} />
        </div>
      </div>

      {/* 顶部礼包区域 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.brand}>妙语购票</span>
          <span className={styles.divider}>|</span>
          <span className={styles.subBrand}>妙语购票</span>
          <div className={styles.headerIcons}>
            <span className={styles.iconBtn} onClick={() => navigate('/discover')}>📢</span>
            <span className={styles.iconBtn} onClick={() => navigate('/user')}>{isLoggedIn ? '👤' : '👤'}</span>
          </div>
        </div>
        <div className={styles.giftSection}>
          <h2 className={styles.giftTitle}>专属电影礼包</h2>
          <div className={styles.giftIllustration}>
            <div className={styles.giftBox}>
              <div className={styles.giftRibbonLeft} />
              <div className={styles.giftRibbonRight} />
              <div className={styles.giftDollar}>¥</div>
              <div className={styles.giftCoin} />
              <div className={styles.giftCoin2} />
            </div>
          </div>
        </div>
      </div>

      {/* 功能入口卡片 */}
      <div className={styles.benefits}>
        {MOCK_BENEFITS.map((item: BenefitItem) => (
          <div key={item.id} className={styles.benefitCard} onClick={() => Toast.show({ content: `${item.title} — 功能开发中` })}>
            <div className={styles.benefitIcon}>
              {item.icon === 'party' ? <span className={styles.iconParty}>🎉</span> : <span className={styles.iconCoupon}>🎟️</span>}
            </div>
            <div className={styles.benefitInfo}>
              <div className={styles.benefitTitle}>{item.title}</div>
              <div className={styles.benefitSubtitle}>{item.subtitle}</div>
            </div>
            <div className={styles.benefitButton}>{item.buttonText} ›</div>
          </div>
        ))}
      </div>

      {/* 立即使用红包下单 */}
      <div className={styles.actionSection}>
        <Button block className={styles.actionButton} onClick={() => navigate('/detail/3')}>
          🧧 立即使用红包下单 🧧
        </Button>
      </div>

      {/* 热映影片 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>正在热映（{hotFilms.length}部）</span>
          <span className={styles.sectionMore} onClick={() => navigate('/film')}>全部 ›</span>
        </div>
        <div className={styles.hotScrollContainer}>
          <div ref={hotScrollRef} className={styles.hotScroll}>
            {hotLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
            ) : hotFilms.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>暂无热映影片</div>
            ) : (
              hotFilms.map((film, i) => (
                <FilmCardRow key={film.id} film={film} idx={i} isHot
                  onClick={() => navigate(`/detail/${film.id}`)}
                  onBuy={() => navigate(`/detail/${film.id}`)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 即将上映 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>即将上映</span>
          <span className={styles.sectionMore} onClick={() => navigate('/film')}>全部 ›</span>
        </div>
        <div className={styles.hotScrollContainer}>
          <div ref={upcomingScrollRef} className={styles.hotScroll}>
            {upcomingLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
            ) : upcomingFilms.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>暂无即将上映影片</div>
            ) : (
              upcomingFilms.map((film, i) => (
                <FilmCardRow key={film.id} film={film} idx={i} isHot={false}
                  onClick={() => navigate(`/detail/${film.id}`)}
                  onBuy={() => navigate(`/detail/${film.id}`)} />
              ))
            )}
          </div>
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
