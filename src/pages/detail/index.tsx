/**
 * 影片详情页 — 查看影片信息 + 评分 + 影评 + 动态 + 推荐 + 选座购票
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, NavBar, Skeleton, Toast, Tabs } from 'antd-mobile';
import { LeftOutline, StarFill, StarOutline, EyeOutline, HeartFill, HeartOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getFilm } from '@/api/filmController';
import { useFilmCollectionStore, type CollectedFilm } from '@/stores/useFilmCollectionStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useGuard } from '@/hooks/useGuard';
import {
  MOCK_REVIEWS,
  MOCK_NEWS,
  MOCK_BOX_OFFICE,
  MOCK_FILM_INFO,
  MOCK_RECOMMENDS,
  MOCK_DYNAMIC_RECOMMENDS,
} from '@/mock/home';
import FilmCard from '../../components/FilmCard/index';
import { enrichFilm } from '@/mock/home';
import styles from './index.module.less';

type TabKey = 'intro' | 'reviews' | 'news' | 'recommend';

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const guard = useGuard();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('intro');
  const { toggleWantToSee, isWanted, markAsWatched, isWatched } = useFilmCollectionStore();
  const orderStore = useOrderStore();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['filmDetail', id],
    queryFn: () => getFilm({ id: Number(id) }),
    enabled: !!id,
  });

  // 用户已购票 → 自动标记看过
  useEffect(() => {
    if (!detail?.id) return;
    const hasOrdered = orderStore.orders.some(
      (o) => o.filmId === Number(id) && (o.status === 'paid' || o.status === 'completed'),
    );
    if (hasOrdered && !isWatched(Number(id))) {
      markAsWatched({
        filmId: detail.id!,
        title: detail.name || '',
        poster: detail.posterUrl || '',
        rating: detail.rating || 0,
        wantCount: '',
        addedAt: new Date().toISOString(),
      });
    }
  }, [detail?.id, orderStore.orders.length]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影片详情</NavBar>
        <div className={styles.skeleton}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={8} animated />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影片详情</NavBar>
        <div className={styles.empty}>影片不存在</div>
      </div>
    );
  }

  const rating = detail.rating ?? 9.2;
  const ratingCount = '6.1万人评分';
  const wantCountDisplay = '61.7万想看';
  const watchedCountDisplay = '206.5万看过';

  const enriched = enrichFilm({
    id: detail.id!,
    name: detail.name!,
    posterUrl: detail.posterUrl || '',
    rating: detail.rating,
    duration: detail.duration,
    type: detail.type,
    releaseDate: detail.releaseDate,
  });

  const ratingDist = [
    { stars: 5, percent: 72 },
    { stars: 4, percent: 20 },
    { stars: 3, percent: 6 },
    { stars: 2, percent: 1.5 },
    { stars: 1, percent: 0.5 },
  ];

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影片详情</NavBar>

      {/* Hero 卡片：左海报 + 右信息 */}
      <div className={styles.heroCard}>
        <div className={styles.heroPoster}>
          <img src={detail.posterUrl} alt={detail.name} />
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>{detail.name}</h1>
          <div className={styles.heroEnTitle}>{enriched.englishTitle}</div>
          {enriched.ranking && (
            <div className={styles.heroRanking} onClick={() => navigate(`/news/${id}`)}>
              <EyeOutline fontSize={12} />
              <span>{enriched.ranking}</span>
              <span className={styles.heroRankingArrow}>›</span>
            </div>
          )}
          <div className={styles.heroTags}>
            {enriched.formatTags.map(tag => (
              <span key={tag} className={styles.heroTag}>{tag}</span>
            ))}
          </div>
          <div className={styles.heroMeta}>
            {detail.releaseDate ? detail.releaseDate.replace(/-/g, '.') : ''} 中国大陆上映 {detail.duration}分钟 ›
          </div>
          <div className={styles.heroActions}>
            <div
              className={styles.heroBtn}
              onClick={() => guard(() => {
                const wasWanted = isWanted(detail.id!);
                toggleWantToSee({
                  filmId: detail.id!,
                  title: detail.name!,
                  poster: detail.posterUrl || '',
                  rating: detail.rating || 0,
                  wantCount: '',
                  addedAt: new Date().toISOString(),
                });
                Toast.show({ content: wasWanted ? '已取消想看' : '已标记想看' });
              })}
            >
              {isWanted(detail.id!) ? <HeartFill fontSize={16} color="#FF5A00" /> : <HeartOutline fontSize={16} color="#999" />}
              <span>想看</span>
            </div>
            <div className={styles.heroBtn} onClick={() => guard(() => {
              const wasWatched = isWatched(detail.id!);
              if (wasWatched) return; // 看过的不能取消
              markAsWatched({
                filmId: detail.id!,
                title: detail.name!,
                poster: detail.posterUrl || '',
                rating: detail.rating || 0,
                wantCount: '',
                addedAt: new Date().toISOString(),
              });
              Toast.show({ content: '已标记看过' });
            })}>
              {isWatched(detail.id!) ? <StarFill fontSize={14} color="#FFB800" /> : <StarOutline fontSize={14} color="#999" />}
              <span style={{ color: isWatched(detail.id!) ? '#FFB800' : '#999' }}>看过</span>
            </div>
          </div>
        </div>
      </div>

      {/* 购票评分卡片 */}
      <div className={styles.quickBuy} onClick={() => guard(() => navigate(`/showtime/film/${id}`))}>
        <span>选座购票</span>
        <span className={styles.quickBuyArrow}>›</span>
      </div>

      {/* 购票评分 */}
      <div className={styles.ratingSection}>
        <div className={styles.ratingHeader}>
          <span className={styles.ratingTitle}>购票评分</span>
          <span className={styles.ratingSubtitle}>{ratingCount}</span>
        </div>
        <div className={styles.ratingMain}>
          <div className={styles.ratingScore}>
            <StarFill className={styles.ratingStar} />
            <span className={styles.ratingScoreValue}>{rating.toFixed(1)}</span>
          </div>
          <div className={styles.ratingDist}>
            {ratingDist.map(d => (
              <div key={d.stars} className={styles.distRow}>
                <span className={styles.distStars}>{d.stars}星</span>
                <div className={styles.distBar}>
                  <div className={styles.distFill} style={{ width: `${d.percent}%` }} />
                </div>
                <span className={styles.distPercent}>{d.percent}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.ratingStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{wantCountDisplay}</span>
            <span className={styles.statLabel}>想看</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{watchedCountDisplay}</span>
            <span className={styles.statLabel}>看过</span>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        className={styles.detailTabs}
      >
        <Tabs.Tab title="简介" key="intro">
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>剧情简介</h3>
              <p className={`${styles.desc} ${!expanded ? styles.descClamp : ''}`}>
                {detail.description}
              </p>
              {detail.description && detail.description.length > 80 && (
                <span className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
                  {expanded ? '收起' : '展开'}
                </span>
              )}
            </div>

            {detail.director && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>演职员</h3>
                <div className={styles.castRow}>
                  <div className={styles.castItem}>
                    <div className={styles.castAvatar}>🎬</div>
                    <span className={styles.castName}>{detail.director}</span>
                    <span className={styles.castRole}>导演</span>
                  </div>
                  {detail.actors?.split(',').filter(Boolean).map((actor: string, idx: number) => (
                    <div key={idx} className={styles.castItem}>
                      <div className={styles.castAvatar}>👤</div>
                      <span className={styles.castName}>{actor}</span>
                      <span className={styles.castRole}>演员</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>影片信息</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>类型</span>
                  <span className={styles.infoValue}>{detail.type}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>时长</span>
                  <span className={styles.infoValue}>{detail.duration} 分钟</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>年份</span>
                  <span className={styles.infoValue}>{detail.releaseDate ? new Date(detail.releaseDate).getFullYear() : ''}</span>
                </div>
              </div>
            </div>

            <div className={styles.bottomSpace} />
          </div>
        </Tabs.Tab>

        <Tabs.Tab title={`影评(${MOCK_REVIEWS.length})`} key="reviews">
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <div className={styles.filterRow}>
                {['全部', '最新', '购票好评', '购票差评', '有图', '购票'].map((tag, i) => (
                  <span key={tag} className={`${styles.filterTag} ${i === 0 ? styles.filterActive : ''}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.reviewList}>
                {MOCK_REVIEWS.map(review => (
                  <div key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewAvatar}>{review.userAvatar}</div>
                      <div className={styles.reviewMeta}>
                        <span className={styles.reviewName}>{review.userName}</span>
                        {review.isPurchased && <span className={styles.reviewPurchased}>已购票</span>}
                      </div>
                      <span className={styles.reviewLocation}>{review.location} | {review.date}</span>
                    </div>
                    <div className={styles.reviewRating}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarFill
                          key={i}
                          className={styles.reviewStar}
                          style={{ color: i < review.rating ? '#FFB800' : '#ddd' }}
                        />
                      ))}
                    </div>
                    <p className={styles.reviewContent}>{review.content}</p>
                    <div className={styles.reviewTags}>
                      {review.tags.map(tag => (
                        <span key={tag} className={styles.reviewTag}>{tag}</span>
                      ))}
                    </div>
                    <div className={styles.reviewActions}>
                      <span className={styles.reviewAction}>👍 有用({review.helpfulCount})</span>
                      <span className={styles.reviewAction}>💬 评论({review.commentCount})</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.loadMore}>
                <span>查看更多影评</span>
              </div>
            </div>
            <div className={styles.bottomSpace} />
          </div>
        </Tabs.Tab>

        <Tabs.Tab title="动态" key="news">
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>票房</h3>
              <div className={styles.boxOffice}>
                <div className={styles.boxItem}>
                  <span className={styles.boxValue}>{MOCK_BOX_OFFICE.realtime}</span>
                  <span className={styles.boxLabel}>实时票房(万)</span>
                </div>
                <div className={styles.boxItem}>
                  <span className={styles.boxValue}>{MOCK_BOX_OFFICE.cumulative}</span>
                  <span className={styles.boxLabel}>累计票房(万)</span>
                </div>
                <div className={styles.boxItem}>
                  <span className={styles.boxValue}>{MOCK_BOX_OFFICE.rank}</span>
                  <span className={styles.boxLabel}>今日票房排名</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                影片动态
                <span
                  className={styles.sectionMore}
                  onClick={() => navigate(`/news/${id}`)}
                >
                  {MOCK_NEWS.length}条 ›
                </span>
              </h3>
              <div className={styles.newsList}>
                {MOCK_NEWS.map(news => (
                  <div key={news.id} className={styles.newsItem}>
                    <div className={styles.newsSource}>
                      <span className={styles.newsSourceTag}>{news.source}</span>
                    </div>
                    <div className={styles.newsTitle}>{news.title}</div>
                    <div className={styles.newsSummary}>{news.summary}</div>
                    <div className={styles.newsTime}>{news.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>电影资料</h3>
              {MOCK_FILM_INFO.map(group => (
                <div key={group.title} className={styles.filmInfoGroup}>
                  <h4 className={styles.filmInfoTitle}>{group.title}</h4>
                  <div className={styles.filmInfoItems}>
                    {group.items.map((item, i) => (
                      <div key={i} className={styles.filmInfoRow}>
                        <span className={styles.filmInfoLabel}>{item.label}</span>
                        <span className={styles.filmInfoValue}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>相关影片</h3>
              <div className={styles.recommendList}>
                {MOCK_DYNAMIC_RECOMMENDS.map(film => (
                  <div
                    key={film.id}
                    className={styles.recommendItem}
                    onClick={() => navigate(`/detail/${film.id}`)}
                  >
                    <img src={film.poster} alt={film.title} className={styles.recommendPoster} />
                    <div className={styles.recommendInfo}>
                      <span className={styles.recommendName}>{film.title}</span>
                      <div className={styles.recommendRating}>
                        <StarFill className={styles.recommendStar} />
                        <span className={styles.recommendScore}>{film.rating}</span>
                      </div>
                      <span className={styles.recommendGenre}>{film.genre}</span>
                      <span className={styles.recommendReason}>{film.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.bottomSpace} />
          </div>
        </Tabs.Tab>

        <Tabs.Tab title="推荐" key="recommend">
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>为你推荐</h3>
              <div className={styles.recommendGrid}>
                {MOCK_RECOMMENDS.map(film => (
                  <div
                    key={film.id}
                    className={styles.recommendCard}
                    onClick={() => navigate(`/detail/${film.id}`)}
                  >
                    <div className={styles.recommendCardPoster}>
                      <img src={film.poster} alt={film.title} className={styles.recommendCardImg} />
                      <div className={styles.recommendCardRating}>
                        <StarFill className={styles.recommendCardStar} />
                        <span>{film.rating}</span>
                      </div>
                    </div>
                    <div className={styles.recommendCardInfo}>
                      <span className={styles.recommendCardName}>{film.title}</span>
                      <div className={styles.recommendCardMeta}>
                        {film.genre} · {film.duration}分钟
                      </div>
                      <div className={styles.recommendCardReason}>{film.reason}</div>
                      <div className={styles.recommendCardCast}>
                        {film.director} / {film.actors.slice(0, 2).join('、')}
                      </div>
                    </div>
                    <Button
                      color="primary"
                      size="mini"
                      className={styles.recommendCardBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        guard(() => navigate(`/showtime/film/${film.id}`));
                      }}
                    >
                      购票
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.bottomSpace} />
          </div>
        </Tabs.Tab>
      </Tabs>

      {/* 悬浮回顶按钮 */}
      <div className={styles.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <UpOutline fontSize={18} />
      </div>
    </div>
  );
};

export default DetailPage;
