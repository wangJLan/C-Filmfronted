/**
 * 影片详情页 — 查看影片信息 + 评分 + 影评 + 动态 + 推荐 + 选座购票
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, NavBar, Skeleton, Toast, Tabs, TextArea } from 'antd-mobile';
import { LeftOutline, StarFill, StarOutline, UpOutline, EyeOutline, HeartFill, HeartOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getFilm, recommended } from '@/api/filmController';
import { listReviews, getReviewCount, getCommentCount, markHelpful as markHelpfulApi, createComment, listComments, deleteComment, markCommentHelpful as markCommentHelpfulApi } from '@/api/filmReviewController';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import { useGuard } from '@/hooks/useGuard';
import ReviewForm from '@/components/ReviewForm';
import FilmCard from '../../components/FilmCard/index';
import { enrichFilm } from '@/mock/home';
import styles from './index.module.less';

type TabKey = 'intro' | 'reviews' | 'recommend';

interface ReviewItem {
  id: number;
  userId: number;
  filmId: number;
  orderId: number;
  rating: number;
  content: string;
  tags: string | string[];
  helpfulCount: number;
  commentCount: number;
  createTime: string;
  userName: string;
  userAvatar: string;
  isPurchased: boolean;
  isHelpful: boolean;
}

interface CommentItem {
  id: number;
  reviewId: number;
  userId: number;
  parentId: number | null;
  content: string;
  helpfulCount: number;
  createTime: string;
  userName: string;
  userAvatar: string;
  replyToUserName?: string;
  isHelpful: boolean;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  const now = dayjs();
  const diffMin = now.diff(d, 'minute');
  const diffHour = now.diff(d, 'hour');
  const diffDay = now.diff(d, 'day');
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  return d.format('YYYY-MM-DD');
}

function parseTags(tags: string | string[]): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return tags.split(',').filter(Boolean);
}

function getTagColor(tag: string): string {
  const t = tag.toLowerCase();
  // 红色：优惠/特权（放最前面）
  if (/特权|专属|vip|影城卡|券|新人|限时|折扣|优惠/.test(tag)) return 'tagRed';
  // 蓝色：退票改签（放红色后面）
  if (/退票|改签/.test(tag)) return 'tagBlue';
  // 灰色：影厅格式 + 其余（放最后）
  return 'tagGray';
}

// 按颜色优先级排序：红色 > 蓝色 > 灰色
function sortTags(tags: string[]): string[] {
  const priority: Record<string, number> = {
    tagRed: 0,
    tagBlue: 1,
    tagGray: 2,
    tagOrange: 3,
    tagGreen: 4,
  };
  return [...tags].sort((a, b) => priority[getTagColor(a)] - priority[getTagColor(b)]);
}

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const guard = useGuard();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('intro');
  const { toggleWantToSee, isWanted, markAsWatched, isWatched, fetchWantToSee, fetchWatched } = useFilmCollectionStore();

  // 影评相关状态
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reviewSort, setReviewSort] = useState<string | undefined>(undefined);
  const [reviewFilter, setReviewFilter] = useState<string | undefined>(undefined);

  const fetchReviews = useCallback(async (pageNum = 1, sortBy?: string, filterBy?: string) => {
    try {
      const res: any = await listReviews(Number(id), { pageNum, pageSize: 10, sortBy, filterBy });
      const records = (res?.records || []).map((r: any) => ({
        ...r,
        tags: parseTags(r.tags),
        createTime: r.createTime || '',
      }));
      if (pageNum === 1) {
        setReviews(records);
      } else {
        setReviews((prev) => [...prev, ...records]);
      }
      setReviewCount(res?.totalRow ?? 0);
      setReviewPage(pageNum);
    } catch {
      // ignore
    }
  }, [id]);

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    await fetchReviews(reviewPage + 1, reviewSort, reviewFilter);
    setLoadingMore(false);
  };

  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentData, setCommentData] = useState<Map<number, CommentItem[]>>(new Map());
  const [replyTarget, setReplyTarget] = useState<{ reviewId: number; parentId?: number } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleMarkHelpful = async (reviewId: number) => {
    try {
      const res: any = await markHelpfulApi(reviewId);
      const helpful = res ?? true;
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewId) return r;
          return {
            ...r,
            isHelpful: helpful,
            helpfulCount: helpful ? r.helpfulCount + 1 : Math.max(0, r.helpfulCount - 1),
          };
        }),
      );
      Toast.show({ content: helpful ? '已标记有用' : '已取消有用' });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  const handleMarkCommentHelpful = async (reviewId: number, commentId: number) => {
    try {
      const res: any = await markCommentHelpfulApi(commentId);
      const helpful = res ?? true;
      setCommentData((prev) => {
        const list = (prev.get(reviewId) || []).map((c) => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            isHelpful: helpful,
            helpfulCount: helpful ? c.helpfulCount + 1 : Math.max(0, c.helpfulCount - 1),
          };
        });
        return new Map(prev).set(reviewId, list);
      });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  const refreshCommentCount = async (reviewId: number) => {
    try {
      const count: number = await getCommentCount(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, commentCount: count } : r)),
      );
    } catch { /* ignore */ }
  };

  const toggleCommentSection = async (reviewId: number) => {
    if (expandedComments.has(reviewId)) {
      setExpandedComments((prev) => { const next = new Set(prev); next.delete(reviewId); return next; });
      return;
    }
    setExpandedComments((prev) => new Set(prev).add(reviewId));
    try {
      const res: any = await listComments(reviewId, { pageNum: 1, pageSize: 50 });
      setCommentData((prev) => new Map(prev).set(reviewId, res?.records || []));
      refreshCommentCount(reviewId);
    } catch { /* ignore */ }
  };

  const showReplyInput = (reviewId: number, parentId?: number) => {
    setReplyTarget({ reviewId, parentId });
    setReplyText('');
  };

  const handleSubmitComment = async () => {
    if (!replyTarget) return;
    const { reviewId, parentId } = replyTarget;
    const text = replyText.trim();
    if (!text) { Toast.show({ icon: 'fail', content: '请输入内容' }); return; }
    setSubmittingComment(true);
    try {
      const res: any = await createComment({ reviewId, content: text, parentId });
      const newComment: CommentItem = {
        id: res?.id, reviewId, userId: res?.userId,
        parentId: parentId ?? null,
        content: text, helpfulCount: 0,
        createTime: res?.createTime || '',
        userName: res?.userName || '我', userAvatar: res?.userAvatar || '',
        replyToUserName: res?.replyToUserName, isHelpful: false,
      };
      setCommentData((prev) => {
        const list = [...(prev.get(reviewId) || []), newComment];
        return new Map(prev).set(reviewId, list);
      });
      setReplyTarget(null);
      setReplyText('');
      refreshCommentCount(reviewId);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (reviewId: number, commentId: number) => {
    try {
      await deleteComment(commentId);
      setCommentData((prev) => {
        const list = (prev.get(reviewId) || []).filter((c) => c.id !== commentId);
        return new Map(prev).set(reviewId, list);
      });
      refreshCommentCount(reviewId);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  const { data: detail, isLoading } = useQuery({
    queryKey: ['filmDetail', id],
    queryFn: () => getFilm({ id: Number(id) }),
    enabled: !!id,
  });

  const { data: recommendedFilms = [] } = useQuery({
    queryKey: ['recommendedFilms', id],
    queryFn: () => recommended({ limit: 20, minRating: 8.0, excludeFilmId: Number(id) }),
    staleTime: 300000,
  });

  // 切换影片时回到简介 tab，避免看起来循环跳转
  useEffect(() => {
    setActiveTab('intro');
    setExpanded(false);
  }, [id]);

  // onMount / 切换影片时同步状态
  useEffect(() => {
    fetchWantToSee();
    fetchWatched();
    getReviewCount(Number(id)).then(setReviewCount).catch(() => {});
    setReviewCount(0);
    setReviews([]);
  }, [id]);

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
            {sortTags(enriched.formatTags).map(tag => (
              <span key={tag} className={`${styles.heroTag} ${styles[getTagColor(tag)]}`}>{tag}</span>
            ))}
          </div>
          <div className={styles.heroMeta}>
            {detail.releaseDate ? detail.releaseDate.replace(/-/g, '.') : ''} 中国大陆上映 {detail.duration}分钟 ›
          </div>
          <div className={styles.heroActions}>
            <div
              className={styles.heroBtn}
              onClick={() => guard(async () => {
                const wanted = await toggleWantToSee(detail.id!);
                Toast.show({ content: wanted ? '已标记想看' : '已取消想看' });
              })}
            >
              {isWanted(detail.id!) ? <HeartFill fontSize={16} color="#FF5A00" /> : <HeartOutline fontSize={16} color="#999" />}
              <span>想看</span>
            </div>
            <div className={styles.heroBtn} onClick={() => guard(async () => {
              if (isWatched(detail.id!)) return;
              await markAsWatched(detail.id!);
              Toast.show({ content: '已标记看过' });
            })}>
              {isWatched(detail.id!) ? <StarFill fontSize={14} color="#FFB800" /> : <StarOutline fontSize={14} color="#999" />}
              <span style={{ color: isWatched(detail.id!) ? '#FFB800' : '#999' }}>看过</span>
            </div>
          </div>
        </div>
      </div>

      {/* 购票评分卡片 — 即将上映时隐藏 */}
      {detail.status !== 'upcoming' && (
        <div className={styles.quickBuy} onClick={() => guard(() => navigate(`/showtime/film/${id}`))}>
          <span>选座购票</span>
          <span className={styles.quickBuyArrow}>›</span>
        </div>
      )}

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
        onChange={(key) => {
          setActiveTab(key as TabKey);
          if (key === 'reviews') fetchReviews(1, reviewSort, reviewFilter);
        }}
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

        <Tabs.Tab title={`影评(${reviewCount})`} key="reviews">
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <div className={styles.filterRow}>
                <span
                  className={`${styles.filterTag} ${!reviewSort && !reviewFilter ? styles.filterActive : ''}`}
                  onClick={() => { setReviewSort(undefined); setReviewFilter(undefined); fetchReviews(1, undefined, undefined); }}
                >全部</span>
                <span
                  className={`${styles.filterTag} ${reviewSort === 'latest' ? styles.filterActive : ''}`}
                  onClick={() => { setReviewSort('latest'); setReviewFilter(undefined); fetchReviews(1, 'latest', undefined); }}
                >最新</span>
                <span
                  className={`${styles.filterTag} ${reviewFilter === 'purchasedGood' ? styles.filterActive : ''}`}
                  onClick={() => { setReviewSort(undefined); setReviewFilter('purchasedGood'); fetchReviews(1, undefined, 'purchasedGood'); }}
                >购票好评</span>
              </div>

              <div
                className={styles.writeReviewBtn}
                onClick={() => guard(() => setReviewFormVisible(true))}
              >
                写影评
              </div>

              {reviews.length === 0 ? (
                <div className={styles.noReview}>暂无影评，快来写第一条吧</div>
              ) : (
                <div className={styles.reviewList}>
                  {reviews.map(review => (
                    <div key={review.id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewAvatar}>
                          {review.userAvatar ? (
                            <img src={review.userAvatar} alt="" className={styles.reviewAvatarImg} />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div className={styles.reviewMeta}>
                          <span className={styles.reviewName}>{review.userName}</span>
                          {review.isPurchased && <span className={styles.reviewPurchased}>已购票</span>}
                        </div>
                        <span className={styles.reviewLocation}>{formatRelativeTime(review.createTime)}</span>
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
                      {review.tags.length > 0 && (
                        <div className={styles.reviewTags}>
                          {(review.tags as string[]).map(tag => (
                            <span key={tag} className={styles.reviewTag}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className={styles.reviewActions}>
                        <span
                          className={`${styles.reviewAction} ${review.isHelpful ? styles.reviewActionActive : ''}`}
                          onClick={() => guard(() => handleMarkHelpful(review.id))}
                        >
                          👍 有用({review.helpfulCount})
                        </span>
                        <span
                          className={`${styles.reviewAction} ${expandedComments.has(review.id) ? styles.reviewActionActive : ''}`}
                          onClick={() => toggleCommentSection(review.id)}
                        >
                          💬 评论({review.commentCount})
                        </span>
                      </div>

                      {expandedComments.has(review.id) && (
                        <div className={styles.commentSection}>
                          {(commentData.get(review.id) || []).map((c) => (
                            <div key={c.id} className={styles.commentItem}>
                              <div className={styles.commentAvatar}>
                                {c.userAvatar ? (
                                  <img src={c.userAvatar} alt="" className={styles.commentAvatarImg} />
                                ) : '👤'}
                              </div>
                              <div className={styles.commentBody}>
                                <div className={styles.commentHeader}>
                                  <span className={styles.commentName}>
                                    {c.userName}
                                    {c.replyToUserName && (
                                      <span className={styles.commentReplyLabel}> 回复 {c.replyToUserName}</span>
                                    )}
                                  </span>
                                  <span className={styles.commentTime}>{formatRelativeTime(c.createTime)}</span>
                                </div>
                                <p className={styles.commentContent}>{c.content}</p>
                                <div className={styles.commentMiniActions}>
                                  <span
                                    className={`${styles.commentMiniAction} ${c.isHelpful ? styles.reviewActionActive : ''}`}
                                    onClick={() => guard(() => handleMarkCommentHelpful(review.id, c.id))}
                                  >
                                    👍 {c.helpfulCount > 0 ? c.helpfulCount : '有用'}
                                  </span>
                                  <span
                                    className={styles.commentMiniAction}
                                    onClick={() => guard(() => showReplyInput(review.id, c.id))}
                                  >
                                    💬 回复
                                  </span>
                                  <span
                                    className={styles.commentMiniAction}
                                    onClick={() => guard(() => handleDeleteComment(review.id, c.id))}
                                  >
                                    删除
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {replyTarget && replyTarget.reviewId === review.id ? (
                            <div className={styles.commentInputRow}>
                              <TextArea
                                className={styles.commentTextarea}
                                placeholder={
                                  replyTarget.parentId
                                    ? '写下你的回复…'
                                    : '写下你的评论…'
                                }
                                rows={2}
                                value={replyText}
                                onChange={(v) => setReplyText(v)}
                                maxLength={200}
                              />
                              <Button
                                size="small"
                                color="primary"
                                loading={submittingComment}
                                onClick={() => guard(() => handleSubmitComment())}
                              >
                                发送
                              </Button>
                            </div>
                          ) : (
                            <div
                              className={styles.replyBtn}
                              onClick={() => guard(() => showReplyInput(review.id))}
                            >
                              回复
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {reviewCount > reviews.length && (
                <div className={styles.loadMore} onClick={handleLoadMore}>
                  <span>{loadingMore ? '加载中...' : '查看更多影评'}</span>
                </div>
              )}
            </div>
            <div className={styles.bottomSpace} />
          </div>
        </Tabs.Tab>

        <Tabs.Tab title="推荐" key="recommend">
          <div className={styles.tabContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>为您推荐妙语优质影片</h3>
              {(recommendedFilms as any[]).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 14 }}>暂无推荐</div>
              ) : (
                (recommendedFilms as any[]).map((f: any) => (
                  <FilmCard key={f.id} film={f} variant="list" />
                ))
              )}
            </div>
            <div className={styles.bottomSpace} />
          </div>
        </Tabs.Tab>
      </Tabs>

      {/* 悬浮回顶按钮 */}
      <div className={styles.backToTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <UpOutline fontSize={18} />
      </div>

      {/* 写影评弹窗 */}
      <ReviewForm
        visible={reviewFormVisible}
        filmId={Number(id)}
        onClose={() => setReviewFormVisible(false)}
        onSuccess={() => fetchReviews(1, reviewSort, reviewFilter)}
      />
    </div>
  );
};

export default DetailPage;
