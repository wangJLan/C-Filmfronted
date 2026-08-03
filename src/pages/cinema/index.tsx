import React, { useMemo } from 'react';
import { useNavigate } from 'umi';
import { SearchBar, SpinLoading } from 'antd-mobile';
import { EnvironmentOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/stores/useLocationStore';
import { list4 as listCinemas } from '@/api/cinemaController';
import styles from './index.module.less';

const CinemaPage: React.FC = () => {
  const city = useLocationStore((s) => s.city);
  const navigate = useNavigate();

  const { data: cinemas, isLoading } = useQuery({
    queryKey: ['cinemaList', city],
    queryFn: async () => {
      const raw: any = await listCinemas();
      const list: any[] = raw?.data ?? raw ?? [];
      return list.map((c: any) => ({
        id: Number(c.id),
        name: c.name || '',
        address: c.address || '',
        city: c.city || '未知',
        tags: c.tags ? c.tags.split(',').filter(Boolean) : [],
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
                <div className={styles.name}>{cinema.name}</div>
                <div className={styles.address}>
                  <EnvironmentOutline fontSize={12} />
                  {cinema.address}
                </div>
                <div className={styles.tags}>
                  {cinema.tags.map((tag: string, idx: number) => (
                    <span key={idx} className={styles.featureTag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={styles.arrow}>›</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CinemaPage;
