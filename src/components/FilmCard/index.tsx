/**
 * 影片横向卡片组件（左海报 + 右信息）
 * 数据库字段直接展示，缺失字段用 Mock 补充
 */
import React from 'react';
import { useNavigate } from 'umi';
import { StarFill, EyeOutline, HeartFill, HeartOutline, UpOutline } from 'antd-mobile-icons';
import { enrichFilm, type EnrichedFilm } from '@/mock/home';
import { useGuard } from '@/hooks/useGuard';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import { Toast } from 'antd-mobile';
import styles from './index.module.less';

interface FilmCardProps {
  film: {
    id: string | number;
    name: string;
    posterUrl: string;
    rating?: number;
    duration?: number;
    type?: string;
    releaseDate?: string;
    director?: string;
    actors?: string;
  };
  variant?: 'list' | 'hero' | 'vertical';
  /** 竖排卡片模式: 'hot'=热映(购票) | 'upcoming'=即将上映(想看) */
  mode?: 'hot' | 'upcoming';
  onSelect?: (id: string) => void;
}

/**
 * 根据标签内容返回颜色样式类名
 */
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

const FilmCard: React.FC<FilmCardProps> = ({ film, variant = 'list', onSelect }) => {
  const navigate = useNavigate();
  const guard = useGuard();
  const enriched = enrichFilm(film);

  const collectionStore = useFilmCollectionStore();
  const isWanted = collectionStore.isWanted(enriched.id);
  const isWatched = collectionStore.isWatched(enriched.id);

  const handleToggleWant = (e: React.MouseEvent) => {
    e.stopPropagation();
    guard(async () => {
      const wanted = await collectionStore.toggleWantToSee(enriched.id);
      Toast.show({ content: wanted ? '已标记想看' : '已取消想看' });
    });
  };

  const handleToggleWatched = (e: React.MouseEvent) => {
    e.stopPropagation();
    guard(async () => {
      await collectionStore.markAsWatched(enriched.id);
      Toast.show({ content: '已标记看过' });
    });
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(enriched.id);
    } else {
      navigate(`/detail/${enriched.id}`);
    }
  };

  if (variant === 'hero') {
    return (
      <div className={styles.cardHero} onClick={handleClick}>
        <div className={styles.heroPoster}>
          <img src={enriched.posterUrl} alt={enriched.name} />
        </div>
        <div className={styles.heroInfo}>
          <h2 className={styles.heroTitle}>{enriched.name}</h2>
          <div className={styles.heroEnTitle}>{enriched.englishTitle}</div>
          {enriched.ranking && (
            <div className={styles.heroRanking}>
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
            {enriched.releaseDate} {enriched.duration}分钟 ›
          </div>
          <div className={styles.heroActions}>
            <div className={styles.heroBtn} onClick={handleToggleWant}>
              {isWanted ? <HeartFill fontSize={16} color="#FF5A00" /> : <HeartOutline fontSize={16} color="#999" />}
              <span>想看</span>
            </div>
            <div className={styles.heroBtn} onClick={handleToggleWatched}>
              <UpOutline fontSize={14} color={isWatched ? '#FFB800' : '#999'} />
              <span>看过</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // vertical 模式：淘票票风格竖排卡片（首页用）
  if (variant === 'vertical') {
    const isUpcoming = onSelect === undefined ? (enriched.rating <= 0) : false;
    // 顶部标签
    const topTags: string[] = [];
    if (isWanted) topTags.push('已想看');
    const formatTags = enriched.formatTags.length > 0 ? enriched.formatTags : (enriched.type ? [enriched.type] : []);
    if (formatTags.length > 0) topTags.push(formatTags[0]);

    return (
      <div className={styles.cardVertical} onClick={handleClick}>
        <div className={styles.verticalPoster}>
          {topTags.length > 0 && (
            <div className={styles.verticalTagList}>
              {topTags.map(tag => (
                <span key={tag} className={`${styles.verticalTagItem} ${styles[getTagColor(tag)]}`}>{tag}</span>
              ))}
            </div>
          )}
          <img src={enriched.posterUrl} alt={enriched.name} />
          <div className={styles.verticalScore}>
            {enriched.rating > 0 ? (
              <>
                <span className={styles.verticalScoreLabel}>评分</span>
                <span className={styles.verticalScoreNum}>{enriched.rating.toFixed(1)}</span>
              </>
            ) : (
              <>
                <span className={styles.verticalScoreNum}>--</span>
                <span className={styles.verticalScoreLabel}>人想看</span>
              </>
            )}
          </div>
        </div>
        <span className={styles.verticalTitle}>{enriched.name}</span>
        {enriched.rating <= 0 && <span className={styles.verticalDate}>{enriched.releaseDate}上映</span>}
        <div
          className={`${styles.verticalBtn} ${enriched.rating > 0 ? styles.verticalBtnBuy : styles.verticalBtnWant}`}
          onClick={(e) => { e.stopPropagation(); guard(() => navigate(`/detail/${enriched.id}`)); }}
        >
          <span>{enriched.rating > 0 ? '购票' : '想看'}</span>
        </div>
      </div>
    );
  }

  // list 模式：淘票票风格宽卡片（左海报 + 右完整信息）
  const formatTag = enriched.formatTags.length > 0 ? enriched.formatTags[0] : '';
  return (
    <div className={styles.cardList} onClick={handleClick}>
      <div className={styles.listPoster}>
        {formatTag && (
          <div className={styles.listPosterTag}>{formatTag}</div>
        )}
        <img src={enriched.posterUrl} alt={enriched.name} />
      </div>
      <div className={styles.listInfo}>
        <h3 className={styles.listTitle}>{enriched.name}</h3>
        <div className={styles.listDesc}>
          {enriched.rating > 0 ? (
            <>
              <span className={styles.listDescLabel}>评分</span>
              <span className={styles.listDescHighlight}>{enriched.rating.toFixed(1)}</span>
            </>
          ) : (
            <>
              <span className={styles.listDescHighlight}>暂无评分</span>
            </>
          )}
          {enriched.duration > 0 && (
            <>
              <span className={styles.listDescSplit}>|</span>
              <span className={styles.listDescNormal}>{enriched.duration}分钟</span>
            </>
          )}
        </div>
        {film.director && (
          <div className={styles.listDirector}>导演：{film.director}</div>
        )}
        {film.actors && (
          <div className={styles.listActors}>演员：{film.actors.split(',').slice(0, 4).join(', ')}</div>
        )}
        <div className={styles.listBottom}>
          <div className={styles.listTags}>
            {sortTags([...enriched.formatTags.slice(0, 2)]).map(tag => (
              <span key={tag} className={`${styles.listTag} ${styles[getTagColor(tag)]}`}>{tag}</span>
            ))}
          </div>
          <div
            className={styles.listBuyBtn}
            onClick={(e) => {
              e.stopPropagation();
              guard(() => navigate(`/showtime/film/${enriched.id}`));
            }}
          >
            购票
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmCard;
