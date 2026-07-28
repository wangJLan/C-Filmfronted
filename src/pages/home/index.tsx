import React, { useRef } from 'react';
import { useNavigate } from 'umi';
import { Button, Toast, SearchBar } from 'antd-mobile';
import { StarFill, EnvironmentOutline } from 'antd-mobile-icons';
import { useLocationStore } from '@/stores/useLocationStore';
import {
  MOCK_HOT_FILMS,
  MOCK_UPCOMING_FILMS,
  MOCK_BENEFITS,
  type HotFilm,
  type UpcomingFilm,
  type BenefitItem,
} from '@/mock/home';
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const city = useLocationStore((s) => s.city);
  const hotScrollRef = useRef<HTMLDivElement>(null);
  const upcomingScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.page}>
      {/* 搜索栏 + 城市定位 */}
      <div className={styles.searchRow}>
        <div className={styles.cityTag}>
          <EnvironmentOutline fontSize={14} color="#FF5A00" />
          <span>{city}</span>
        </div>
        <div className={styles.searchWrap}>
          <SearchBar
            placeholder="搜电影、搜影院"
            onSearch={() => Toast.show({ content: '搜索功能开发中' })}
            className={styles.searchBar}
          />
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
            <span className={styles.iconBtn} onClick={() => navigate('/user')}>👤</span>
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
              {item.icon === 'party' ? (
                <span className={styles.iconParty}>🎉</span>
              ) : (
                <span className={styles.iconCoupon}>🎟️</span>
              )}
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
        <Button
          block
          className={styles.actionButton}
          onClick={() => navigate('/detail/3')}
        >
          🧧 立即使用红包下单 🧧
        </Button>
      </div>

      {/* 热映影片 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>正在热映（{MOCK_HOT_FILMS.length}部）</span>
          <span className={styles.sectionMore} onClick={() => navigate('/film')}>全部 ›</span>
        </div>
        <div className={styles.hotScrollContainer}>
          <div ref={hotScrollRef} className={styles.hotScroll}>
            {MOCK_HOT_FILMS.map((film: HotFilm, idx: number) => (
              <div
                key={film.id}
                className={styles.filmCard}
                onClick={() => navigate(`/detail/${film.id}`)}
              >
                <div className={styles.posterPlaceholder} style={{ background: FILM_COLORS[idx % FILM_COLORS.length] }}>
                  <img src={film.poster} alt={film.title} className={styles.poster} loading="lazy" />
                  {film.tags.length > 0 && film.tags.map((tag, ti) => (
                    <span key={ti} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <div className={styles.filmInfo}>
                  <div className={styles.filmName}>{film.title}</div>
                  {film.rating > 0 && (
                    <div className={styles.rating}>
                      <StarFill className={styles.starIcon} />
                      <span className={styles.ratingValue}>{film.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className={styles.wantCount}>{film.wantCount}</div>
                </div>
                <Button
                  color="primary"
                  size="mini"
                  className={styles.buyButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/detail/${film.id}`);
                  }}
                >
                  购票
                </Button>
              </div>
            ))}
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
            {MOCK_UPCOMING_FILMS.map((film: UpcomingFilm, idx: number) => (
              <div
                key={film.id}
                className={styles.filmCard}
                onClick={() => navigate(`/detail/${film.id}`)}
              >
                <div className={styles.posterPlaceholder} style={{ background: FILM_COLORS[(idx + 2) % FILM_COLORS.length] }}>
                  <img src={film.poster} alt={film.title} className={styles.poster} loading="lazy" />
                  {film.tags.length > 0 && film.tags.map((tag, ti) => (
                    <span key={ti} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <div className={styles.filmInfo}>
                  <div className={styles.filmName}>{film.title}</div>
                  <div className={styles.wantCount}>{film.wantCount}</div>
                  <div className={styles.releaseDate}>{film.releaseDate}</div>
                </div>
                <Button
                  color="default"
                  size="mini"
                  className={styles.buyButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/detail/${film.id}`);
                  }}
                >
                  想看
                </Button>
              </div>
            ))}
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
