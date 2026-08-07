import React, { useEffect, useState } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Empty, Toast, Modal, Avatar } from 'antd-mobile';
import { LeftOutline, StarFill } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import { useGuard } from '@/hooks/useGuard';
import { getMyReviews, deleteMyReview } from '@/api/filmReviewController';
import dayjs from 'dayjs';
import styles from './index.module.less';

interface UserBrief {
  userId: number;
  userName: string;
  userAvatar: string;
}

interface CommentBrief {
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  createTime: string;
}

interface MyReviewItem {
  id: number;
  userId: number;
  filmId: number;
  orderId: number;
  rating: number;
  content: string;
  tags: string;
  helpfulCount: number;
  commentCount: number;
  createTime: string;
  filmName: string;
  filmPosterUrl: string;
  isPurchased: boolean;
  helpfulUsers: UserBrief[];
  comments: CommentBrief[];
}

function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags.split(',').filter(Boolean);
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = dayjs(dateStr);
  const now = dayjs();
  const diffDay = now.diff(d, 'day');
  if (diffDay < 1) return '今天';
  if (diffDay < 7) return `${diffDay}天前`;
  return d.format('YYYY-MM-DD');
}

const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [reviews, setReviews] = useState<MyReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const res: any = await getMyReviews({ pageNum: 1, pageSize: 50 });
      setReviews(res?.records || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchMyReviews();
  }, [isLoggedIn]);

  const handleDelete = (review: MyReviewItem) => {
    const preview = (review.content || '').slice(0, 20);
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除影评「${preview}...」吗？该影评下的所有评论也会一并删除。`,
      confirmText: '确认删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await deleteMyReview(review.id);
          Toast.show({ icon: 'success', content: '已删除' });
          setReviews((prev) => prev.filter((r) => r.id !== review.id));
        } catch (e: any) {
          Toast.show({ icon: 'fail', content: e.message || '删除失败' });
        }
      },
    });
  };

  const safeArr = (arr: any): any[] => (Array.isArray(arr) ? arr : []);

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate('/user')} back={<LeftOutline />}>我的影评</NavBar>
        <Empty description="登录后可查看我的影评" style={{ paddingTop: 80 }} />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button color="primary" size="small" onClick={() => guard(() => {})}>去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate('/user')} back={<LeftOutline />}>我的影评</NavBar>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description="还没有发布过影评" />
            <Button color="primary" size="small" onClick={() => navigate('/')} style={{ marginTop: 12, borderRadius: 16 }}>
              去发现好片
            </Button>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={styles.card}>
              {/* 影片信息 */}
              <div className={styles.filmRow} onClick={() => navigate(`/detail/${review.filmId}`)}>
                <div className={styles.poster}>
                  {review.filmPosterUrl ? (
                    <img
                      src={review.filmPosterUrl}
                      alt={review.filmName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove(styles.hidden);
                      }}
                    />
                  ) : null}
                  <span className={`${styles.posterFallback} ${review.filmPosterUrl ? styles.hidden : ''}`}>🎬</span>
                </div>
                <div className={styles.filmInfo}>
                  <div className={styles.filmName}>{review.filmName}</div>
                  <div className={styles.filmMeta}>
                    {review.isPurchased && <span className={styles.purchasedBadge}>已购票</span>}
                    <span className={styles.time}>{formatTime(review.createTime)}</span>
                  </div>
                </div>
                <span className={styles.arrow}>›</span>
              </div>

              {/* 评分 */}
              <div className={styles.ratingRow}>
                {Array.from({ length: 5 }, (_, i) => (
                  <StarFill
                    key={i}
                    className={styles.star}
                    style={{ color: i < review.rating ? '#FFB800' : '#ddd', fontSize: 14 }}
                  />
                ))}
              </div>

              {/* 内容 */}
              <p className={styles.content}>{review.content}</p>

              {/* 标签 */}
              {parseTags(review.tags).length > 0 && (
                <div className={styles.tags}>
                  {parseTags(review.tags).map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}

              {/* 有用 */}
              <div className={styles.footer}>
                <div className={styles.stats}>
                  <span className={styles.statItem}>
                    👍 {review.helpfulCount ?? 0} 有用
                    {safeArr(review.helpfulUsers).length > 0 && (
                      <span className={styles.userAvatars}>
                        {safeArr(review.helpfulUsers).slice(0, 5).map((u: UserBrief) => (
                          <Avatar
                            key={u.userId}
                            src={u.userAvatar || ''}
                            className={styles.miniAvatar}
                            title={u.userName}
                          />
                        ))}
                        {safeArr(review.helpfulUsers).length > 5 && <span className={styles.moreCount}>+{safeArr(review.helpfulUsers).length - 5}</span>}
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  size="mini"
                  color="danger"
                  fill="none"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(review)}
                >
                  删除
                </Button>
              </div>

              {/* 评论列表 */}
              {safeArr(review.comments).length > 0 && (
                <div className={styles.commentBlock}>
                  <div className={styles.commentBlockTitle}>💬 {safeArr(review.comments).length} 条评论</div>
                  {safeArr(review.comments).map((c: CommentBrief) => (
                    <div key={`${c.userId}-${c.createTime}`} className={styles.commentRow}>
                      <Avatar src={c.userAvatar || ''} className={styles.commentAvatar} />
                      <div className={styles.commentBody}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentName}>{c.userName}</span>
                          <span className={styles.commentTime}>{formatTime(c.createTime)}</span>
                        </div>
                        <p className={styles.commentText}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;
