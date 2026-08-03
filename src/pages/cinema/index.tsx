import React, { useMemo } from 'react';
import { useNavigate } from 'umi';
import { SearchBar, SpinLoading } from 'antd-mobile';
import { EnvironmentOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/stores/useLocationStore';
import { list4 as listCinemas } from '@/api/cinemaController';
import styles from './index.module.less';

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

const CinemaPage: React.FC = () => {
  const city = useLocationStore((s) => s.city);
  const navigate = useNavigate();

  const { data: cinemas, isLoading } = useQuery({
    queryKey: ['cinemaList', city],
    queryFn: async () => {
      const raw: any = await listCinemas();
      const list: any[] = raw?.data ?? raw ?? [];
      return list.map((c: any, idx: number) => ({
        id: Number(c.id),
        name: c.name || '',
        address: c.address || '',
        city: c.city || '未知',
        tags: c.tags ? c.tags.split(',').filter(Boolean) : [],
        distance: `${(1.5 + (idx % 8) * 0.7).toFixed(1)}km`,
        minPrice: 33 + (idx % 5) * 2,
        isNewUser: true,
      }));
    },
    staleTime: 60000,
  });

  // 按当前城市过滤
  const filtered = useMemo(() => {
    if (!cinemas) return [];
    if (city === '北京') return cinemas; // 默认值不过滤
    return cinemas.filter((c: any) => {
      const cCity = c.city || '';
      const cn = city || '';
      if (!cn || !cCity) return true;
      try { return cn.includes(cCity) || cCity.includes(cn); }
      catch { return true; }
    });
  }, [cinemas, city]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <span className={styles.location} onClick={() => navigate('/city-picker')}>
          <EnvironmentOutline fontSize={14} color="#FF5A00" />
          {city}
        </span>
        <div className={styles.searchWrap}>
          <SearchBar placeholder="搜影院" className={styles.search} />
        </div>
      </div>
      <div className={styles.list}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><SpinLoading color="primary" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 14 }}>
            当前城市暂无影院
          </div>
        ) : (
          filtered.map((cinema: any) => (
            <div
              key={cinema.id}
              className={styles.card}
              onClick={() => navigate(`/showtime/cinema/${cinema.id}`)}
            >
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div className={styles.name}>{cinema.name}</div>
                  <div className={styles.price}>
                    {cinema.isNewUser && <span className={styles.newUserTag}>新人</span>}
                    <span className={styles.priceSymbol}>¥</span>
                    <span className={styles.priceNum}>{cinema.minPrice}</span>
                    <span className={styles.priceUnit}>起</span>
                  </div>
                </div>
                <div className={styles.addressRow}>
                  <div className={styles.address}>
                    <EnvironmentOutline fontSize={12} />
                    {cinema.address}
                  </div>
                  <div className={styles.distance}>{cinema.distance}</div>
                </div>
                <div className={styles.tags}>
                  {sortTags(cinema.tags).map((tag: string, idx: number) => (
                    <span key={idx} className={`${styles.featureTag} ${styles[getTagColor(tag)]}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CinemaPage;
