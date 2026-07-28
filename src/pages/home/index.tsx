import React, { useRef } from 'react';
import { useNavigate } from 'umi';
import { Button } from 'antd-mobile';
import {
  MOCK_HOT_FILMS,
  MOCK_UPCOMING_FILMS,
  MOCK_BENEFITS,
  type HotFilm,
  type UpcomingFilm,
  type BenefitItem,
} from '@/mock/home';
import styles from './index.module.less';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const hotScrollRef = useRef<HTMLDivElement>(null);
  const upcomingScrollRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.page}>
      {/* 顶部礼包区域 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.brand}>妙语购票</span>
          <span className={styles.divider}>|</span>
          <span className={styles.subBrand}>妙语购票</span>
          <div className={styles.headerIcons}>
            <span className={styles.iconBtn}>···</span>
            <span className={styles.iconBtn}>○</span>
          </div>
        </div>

        <div className={styles.giftSection}>
          <h2 className={styles.giftTitle}>专属电影礼包</h2>
          <div className={styles.giftIllustration}>
            <div className={styles.giftBox}>
              <div className={styles.giftRibbonLeft}></div>
              <div className={styles.giftRibbonRight}></div>
              <div className={styles.giftDollar}>¥</div>
              <div className={styles.giftCoin}></div>
              <div className={styles.giftCoin2}></div>
            </div>
            <div className={styles.mascot}>
              <div className={styles.mascotBody}>
                <div className={styles.mascotEye}></div>
                <div className={styles.mascotEyeRight}></div>
                <div className={styles.mascotSmile}></div>
              </div>
              <div className={styles.mascotEar}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 功能入口卡片 */}
      <div className={styles.benefits}>
        {MOCK_BENEFITS.map((item: BenefitItem) => (
          <div key={item.id} className={styles.benefitCard}>
            <div className={styles.benefitIcon}>
              {item.icon === 'party' ? (
                <div className={styles.iconParty}>🎉</div>
              ) : (
                <div className={styles.iconCoupon}>🎟️</div>
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
          onClick={() => navigate('/detail/1')}
        >
          🧧 立即使用红包下单 🧧
        </Button>
      </div>

      {/* 热映影片 */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>热映影片</span>
          <span className={styles.sectionMore}>全部 ›</span>
        </div>

        <div className={styles.hotScrollContainer}>
          <div ref={hotScrollRef} className={styles.hotScroll}>
            {MOCK_HOT_FILMS.map((film: HotFilm) => (
              <div
                key={film.id}
                className={styles.filmCard}
                onClick={() => navigate(`/detail/${film.id}`)}
              >
                <div className={styles.posterPlaceholder}>
                  <span className={styles.posterEmoji}>🎬</span>
                  {film.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <div className={styles.filmInfo}>
                  <div className={styles.filmName}>{film.title}</div>
                  {film.rating > 0 && (
                    <div className={styles.rating}>
                      <span className={styles.ratingLabel}>评分</span>
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
          <span className={styles.sectionMore}>全部 ›</span>
        </div>

        <div className={styles.hotScrollContainer}>
          <div ref={upcomingScrollRef} className={styles.hotScroll}>
            {MOCK_UPCOMING_FILMS.map((film: UpcomingFilm) => (
              <div
                key={film.id}
                className={styles.filmCard}
                onClick={() => navigate(`/detail/${film.id}`)}
              >
                <div className={styles.posterPlaceholder}>
                  <span className={styles.posterEmoji}>🎬</span>
                  {film.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <div className={styles.filmInfo}>
                  <div className={styles.filmName}>{film.title}</div>
                  {film.rating && film.rating > 0 && (
                    <div className={styles.rating}>
                      <span className={styles.ratingLabel}>评分</span>
                      <span className={styles.ratingValue}>{film.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className={styles.wantCount}>
                    {film.wantCount || film.releaseDate}
                  </div>
                  <div className={styles.releaseDate}>{film.releaseDate}</div>
                </div>
                <Button
                  color={film.isReleased ? 'primary' : 'default'}
                  size="mini"
                  className={styles.buyButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/detail/${film.id}`);
                  }}
                >
                  {film.isReleased ? '购票' : '想看'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部去首页按钮 */}
      <div className={styles.bottomAction}>
        <div className={styles.homeButton} onClick={() => navigate('/')}>
          <span>🏠</span>
          <span>去首页</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
