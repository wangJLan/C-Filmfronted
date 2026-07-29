import React, { useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, NavBar, Skeleton, Toast } from 'antd-mobile';
import { LeftOutline, StarFill, StarOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getFilmDetail } from '@/services/api/film';
import SeatPicker from '@/components/SeatPicker';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import styles from './index.module.less';

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showSeat, setShowSeat] = useState(false);
  const addOrder = useOrderStore((s) => s.addOrder);
  const { toggleWantToSee, isWanted, markAsWatched } = useFilmCollectionStore();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['filmDetail', id],
    queryFn: () => getFilmDetail(Number(id)),
    enabled: !!id,
  });

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

  return (
    <div className={styles.page}>
      {/* 顶部海报 */}
      <div className={styles.hero}>
        <img src={detail.poster} alt={detail.title} className={styles.heroImg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroBack} onClick={() => navigate(-1)}>
          <LeftOutline fontSize={20} color="#fff" />
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>{detail.title}</h1>
          <div className={styles.heroRating}>
            <StarFill className={styles.heroStar} />
            <span className={styles.heroScore}>{detail.rating?.toFixed(1)}</span>
          </div>
          <div className={styles.heroMeta}>
            {detail.year} · {detail.genre} · {detail.duration}分钟
          </div>
          <div className={styles.heroWant}>{detail.wantCount}</div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className={styles.actions}>
        <div className={styles.likeBtn} onClick={() => {
          if (!detail) return;
          toggleWantToSee({
            filmId: detail.id,
            title: detail.title,
            poster: detail.poster,
            rating: detail.rating,
            wantCount: detail.wantCount ?? '',
            addedAt: new Date().toISOString(),
          });
          Toast.show({ content: isWanted(detail.id) ? '已取消想看' : '已标记想看' });
        }}>
          {isWanted(detail.id) ? <StarFill color="#FFB800" fontSize={20} /> : <StarOutline fontSize={20} />}
          <span>{isWanted(detail.id) ? '已想看' : '想看'}</span>
        </div>
        <Button color="primary" className={styles.buyBtn} onClick={() => setShowSeat(true)}>
          选座购票
        </Button>
      </div>

      {/* 简介 */}
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

      {/* 演职员 */}
      {detail.director && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>演职员</h3>
          <div className={styles.castRow}>
            <div className={styles.castItem}>
              <div className={styles.castAvatar}>🎬</div>
              <span className={styles.castName}>{detail.director}</span>
              <span className={styles.castRole}>导演</span>
            </div>
            {detail.actors?.map((actor: string, idx: number) => (
              <div key={idx} className={styles.castItem}>
                <div className={styles.castAvatar}>👤</div>
                <span className={styles.castName}>{actor}</span>
                <span className={styles.castRole}>演员</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 标签 */}
      {detail.tags && detail.tags.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>影厅</h3>
          <div className={styles.tags}>
            {detail.tags.map((tag: string, idx: number) => (
              <span key={idx} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* 底部占位 */}
      <div className={styles.bottomSpace} />

      {/* 选座面板 */}
      {showSeat && detail && (
        <SeatPicker
          filmTitle={detail.title}
          filmId={detail.id}
          poster={detail.poster}
          onClose={() => setShowSeat(false)}
          onConfirm={(info) => {
            addOrder({
              id: `ORD${Date.now()}`,
              filmId: info.filmId,
              filmTitle: info.filmTitle,
              poster: detail.poster,
              cinema: info.cinema,
              hall: info.hall,
              date: info.date,
              time: info.time,
              seats: info.seats,
              totalPrice: info.totalPrice,
              status: 'paid',
              createdAt: new Date().toISOString(),
            });
            setShowSeat(false);
            Toast.show({ icon: 'success', content: `购票成功！${info.seats.length}张票 ¥${info.totalPrice}` });
          }}
        />
      )}
    </div>
  );
};

export default DetailPage;
