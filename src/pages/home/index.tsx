import React from 'react';
import { useNavigate } from 'umi';
import { Button, Toast, SearchBar, SpinLoading } from 'antd-mobile';
import { EnvironmentOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/stores/useLocationStore';
import { useUserStore } from '@/stores/useUserStore';
import { listFilm } from '@/api/filmController';
import { MOCK_BENEFITS, type BenefitItem } from '@/mock/home';
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
        <div className={styles.filmCardList}>
          {hotLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
          ) : hotFilms.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#999', fontSize: 13 }}>暂无热映影片</div>
          ) : (
            <>
              {hotFilms.map((film) => (
                <FilmCard key={film.id} film={film} variant="vertical" />
              ))}
              <div className={styles.moreCard} onClick={() => navigate('/film')}>
                <div className={styles.moreCardTitle}>更多</div>
                <div className={styles.moreCardSub}>热映影片</div>
              </div>
            </>
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
            <>
              {upcomingFilms.map((film) => (
                <FilmCard key={film.id} film={film} variant="vertical" />
              ))}
              <div className={styles.moreCard} onClick={() => navigate('/film')}>
                <div className={styles.moreCardTitle}>更多</div>
                <div className={styles.moreCardSub}>即将上映</div>
              </div>
            </>
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
