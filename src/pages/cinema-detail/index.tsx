/**
 * 影院详情页 — 参考淘票票布局: 影院信息 + 影片排片 + 设施服务
 */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, SafeArea, SpinLoading, Toast } from 'antd-mobile';
import { LeftOutline, EnvironmentOutline, PhoneOutline, ClockOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getInfo7 } from '@/api/cinemaController';
import { listSchedule } from '@/api/scheduleController';
import { getFilm } from '@/api/filmController';
import { useGuard } from '@/hooks/useGuard';
import dayjs from 'dayjs';
import styles from './index.module.less';

function buildDates(): string[] {
  const r: string[] = [];
  for (let i = 0; i < 5; i++) r.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
  return r;
}

const WEEKDAY_CN = ['周日','周一','周二','周三','周四','周五','周六'];

function getDayLabel(d: string, i: number): string {
  if (i === 0) return '今天';
  if (i === 1) return '明天';
  if (i === 2) return '后天';
  return WEEKDAY_CN[dayjs(d).day()];
}

const CinemaDetailPage: React.FC = () => {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const guard = useGuard();
  const cid = Number(cinemaId);
  const dates = useMemo(() => buildDates(), []);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  // 影院信息
  const { data: cinema, isLoading: cinemaLoading } = useQuery({
    queryKey: ['cinemaDetail', cid],
    queryFn: async () => {
      const raw: any = await getInfo7({ id: cid });
      const c = raw?.data ?? raw;
      return {
        id: Number(c.id), name: c.name || '', address: c.address || '',
        phone: c.phone || '', businessHours: c.businessHours || '',
        tags: c.tags ? c.tags.split(',').filter(Boolean) : [],
        longitude: c.longitude, latitude: c.latitude,
        basePrice: c.basePrice,
      };
    },
    enabled: !!cid,
  });

  // 该影院所有排片
  const { data: allSchedules } = useQuery({
    queryKey: ['schedule', 'cinema', cid],
    queryFn: async () => {
      const raw: any = await listSchedule({});
      const list: any[] = raw?.data?.data ?? raw?.data ?? raw ?? [];
      return list.filter((s: any) => String(s.cinemaId) === String(cid));
    },
    enabled: !!cid,
  });

  // 按日期+影片分组排片
  const dateFilmGroups = useMemo(() => {
    if (!allSchedules) return [];
    const targetDate = dates[activeDateIdx];
    const daySchedules = allSchedules.filter((s: any) => s.showDate === targetDate);
    const filmMap = new Map<number, any>();
    daySchedules.forEach((s: any) => {
      if (!filmMap.has(s.filmId)) {
        filmMap.set(s.filmId, {
          filmId: s.filmId,
          filmName: s.filmName,
          filmPoster: s.filmPoster,
          filmRating: s.filmRating,
          filmType: s.filmType,
          filmDuration: s.filmDuration,
          showtimes: [],
        });
      }
      filmMap.get(s.filmId).showtimes.push(s);
    });
    return Array.from(filmMap.values()).map(f => ({
      ...f,
      showtimes: f.showtimes.sort((a: any, b: any) => a.startTime?.localeCompare(b.startTime || '') || 0),
    }));
  }, [allSchedules, dates, activeDateIdx]);

  const dateCounts = useMemo(() => {
    if (!allSchedules) return dates.map(() => 0);
    return dates.map(d => allSchedules.filter((s: any) => s.showDate === d).length);
  }, [allSchedules, dates]);

  const [expanded, setExpanded] = useState(false);

  if (cinemaLoading) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影院详情</NavBar>
      <div style={{ textAlign:'center',padding:80 }}><SpinLoading color="primary" /></div></div>;
  }
  if (!cinema) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影院详情</NavBar>
      <div style={{ textAlign:'center',padding:80,color:'#999' }}>影院不存在</div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>{cinema.name}</NavBar>

      {/* 影院头部 */}
      <div className={styles.header}>
        <div className={styles.cinemaName}>{cinema.name}</div>
        <div className={styles.addressRow}>
          <EnvironmentOutline fontSize={14} color="#999" />
          <span className={styles.address}>{cinema.address}</span>
          <span className={styles.mapLink}>地图 ›</span>
        </div>
        {cinema.phone && (
          <div className={styles.contactRow}>
            <PhoneOutline fontSize={14} color="#999" />
            <span className={styles.phone}>{cinema.phone}</span>
          </div>
        )}
        {cinema.businessHours && (
          <div className={styles.contactRow}>
            <ClockOutline fontSize={14} color="#999" />
            <span className={styles.hours}>{cinema.businessHours}</span>
          </div>
        )}
        {cinema.tags.length > 0 && (
          <div className={styles.tagRow}>
            {cinema.tags.map((t: string) => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        )}
      </div>

      {/* 日期切换 */}
      <div className={styles.dateBar}>
        {dates.map((d, i) => (
          <div key={d} className={`${styles.dateItem} ${activeDateIdx===i ? styles.dateItemActive : ''}`} onClick={() => setActiveDateIdx(i)}>
            <span className={styles.dateLabel}>{getDayLabel(d, i)}</span>
            <span className={styles.dateNum}>{dayjs(d).format('MM/DD')}</span>
            <span className={styles.dateHint}>{dateCounts[i] > 0 ? dateCounts[i]+'场' : '无'}</span>
          </div>
        ))}
      </div>

      {/* 影片+场次列表 */}
      <div className={styles.filmList}>
        {dateFilmGroups.length === 0 ? (
          <div className={styles.empty}>该日期暂无排片</div>
        ) : (
          dateFilmGroups.map(group => (
            <div key={group.filmId} className={styles.filmBlock}>
              <div className={styles.filmRow} onClick={() => navigate(`/detail/${group.filmId}`)}>
                {group.filmPoster ? (
                  <img src={group.filmPoster} alt={group.filmName} className={styles.poster} />
                ) : (
                  <div className={styles.posterPlaceholder}>🎬</div>
                )}
                <div className={styles.filmInfo}>
                  <div className={styles.filmTitle}>{group.filmName}</div>
                  <div className={styles.filmMeta}>
                    {group.filmRating && Number(group.filmRating) > 0 && (
                      <span className={styles.rating}>⭐ {Number(group.filmRating).toFixed(1)}</span>
                    )}
                    <span>{group.filmType || ''}</span>
                    <span className={styles.dot}>|</span>
                    <span>{group.filmDuration || '--'}分钟</span>
                  </div>
                </div>
                <span className={styles.arrow}>›</span>
              </div>
              <div className={styles.timeGrid}>
                {group.showtimes.map((s: any) => {
                  const startH = s.startTime?.substring(0, 5) || '';
                  const endH = s.endTime?.substring(0, 5) || '';
                  return (
                    <div key={s.id} className={styles.timeCard} onClick={() => guard(() => navigate(`/seat/${s.id}`))}>
                      <div className={styles.timeStart}>{startH}</div>
                      <div className={styles.timeEnd}>{endH ? endH+'散' : ''}</div>
                      <div className={styles.timeHall}>{s.hallName}</div>
                      <div className={styles.timePrice}>
                        <span className={styles.priceNum}>¥{s.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 影院详情（可展开） */}
      <div className={styles.detailSection}>
        <div className={styles.sectionTitle}>影院详情</div>
        <div className={`${styles.detailContent} ${!expanded ? styles.detailContentClamp : ''}`}>
          <div className={styles.detailRow}><span className={styles.dLabel}>影院地址</span><span className={styles.dVal}>{cinema.address}</span></div>
          {cinema.phone && <div className={styles.detailRow}><span className={styles.dLabel}>联系电话</span><span className={styles.dVal}>{cinema.phone}</span></div>}
          {cinema.businessHours && <div className={styles.detailRow}><span className={styles.dLabel}>营业时间</span><span className={styles.dVal}>{cinema.businessHours}</span></div>}
          <div className={styles.detailRow}><span className={styles.dLabel}>服务设施</span><span className={styles.dVal}>{cinema.tags.join('、') || '暂无'}</span></div>
          <div className={styles.detailRow}><span className={styles.dLabel}>参考票价</span><span className={styles.dValPrice}>¥{cinema.basePrice || '--'}</span></div>
        </div>
        <span className={styles.expandBtn} onClick={() => setExpanded(!expanded)}>{expanded ? '收起' : '展开更多'}</span>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default CinemaDetailPage;
