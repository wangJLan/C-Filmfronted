/**
 * 影院场次页 — 使用真实 Schedule/Seat 数据
 */
import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'umi';
import { NavBar, Toast, SafeArea, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getFilmList, type FilmItem } from '@/services/api/film';
import { getScheduleList, type ScheduleItem } from '@/services/api/schedule';
import http from '@/services/request';
import { useAiStore } from '@/stores/useAiStore';
import { useGuard } from '@/hooks/useGuard';
import { HOT_CITIES } from '@/data/cityGroups';
import dayjs from 'dayjs';
import styles from './index.module.less';

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return '今天'; if (index === 1) return '明天'; if (index === 2) return '后天';
  return WEEKDAY_CN[new Date(dateStr).getDay()];
}
function buildDates(): string[] {
  const r: string[] = []; for (let i = 0; i < 7; i++) r.push(dayjs().add(i, 'day').format('YYYY-MM-DD')); return r;
}

const FILM_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

interface CinemaItem { id: number; name: string; address: string; distance: string; tags: string[]; showtimeCount: number; }

const ShowtimePage: React.FC = () => {
  const params = useParams<{ filmId?: string; cinemaId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const guard = useGuard();
  const triggerAi = useAiStore((s) => s.triggerAi);

  const isCinemaOnly = location.pathname.includes('/showtime/cinema/');
  const isFilmOnly = location.pathname.includes('/showtime/film/');
  const isDirect = !isCinemaOnly && !isFilmOnly;

  const directFilmId = isDirect ? Number(params.filmId) : undefined;
  const directCinemaId = isDirect ? Number(params.cinemaId) : undefined;

  // 初始选中态
  const [selectedFilmId, setSelectedFilmId] = useState<number | null>(
    isFilmOnly ? Number(params.filmId) : isDirect ? directFilmId! : null,
  );
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(
    isCinemaOnly ? Number(params.cinemaId) : isDirect ? directCinemaId! : null,
  );

  // 电影详情
  const { data: film } = useQuery({
    queryKey: ['filmDetail', selectedFilmId],
    queryFn: () => selectedFilmId ? getFilmList({}).then(r => r.list.find(f => f.id === selectedFilmId) || null) : null,
    enabled: !!selectedFilmId,
  });

  // 影院列表（按影片筛选）
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', selectedFilmId],
    queryFn: () => selectedFilmId ? getScheduleList({ filmId: selectedFilmId }) : Promise.resolve([]),
    enabled: !!selectedFilmId,
  });

  const cinemaIds = useMemo(() => [...new Set((scheduleData || []).map(s => s.cinemaId))], [scheduleData]);

  // 影院详情（scheduleData 为空时显示空状态，不卡转圈）
  const { data: cinemasRaw, isLoading: cinemasLoading } = useQuery({
    queryKey: ['cinemas', cinemaIds],
    queryFn: async () => {
      const all: CinemaItem[] = [];
      for (const cId of cinemaIds.slice(0, 10)) {
        try { const c = await http.get(`/cinema/getInfo/${cId}`) as any;
        const count = (scheduleData || []).filter(s => s.cinemaId === cId).length;
        all.push({ id: c.id, name: c.name, address: c.address || '', distance: '',
          tags: (c.tags || '').split(',').filter(Boolean), showtimeCount: count }); } catch { /* skip */ }
      }
      return all.sort((a,b) => a.showtimeCount - b.showtimeCount).reverse();
    },
    enabled: cinemaIds.length > 0,
  });
  const cinemasReady = !scheduleLoading && (cinemaIds.length === 0 || cinemasRaw !== undefined);

  // 当前选中影院
  const { data: cinema } = useQuery({
    queryKey: ['cinema', selectedCinemaId],
    queryFn: async () => { const c = await http.get(`/cinema/getInfo/${selectedCinemaId}`) as any;
      return { id: c.id, name: c.name, address: c.address || '', tags: (c.tags||'').split(',').filter(Boolean) }; },
    enabled: !!selectedCinemaId && !isFilmOnly,
  });

  const dates = useMemo(() => buildDates(), []);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  // 判断场次是否已过期（开场时间 < 当前时间）
  const isPast = (showDate: string, startTime: string) => {
    const dt = `${showDate}T${startTime}`;
    return new Date(dt).getTime() < Date.now();
  };

  // 场次（自动过滤已开场的）
  const showtimes = useMemo(() => {
    if (!scheduleData) return [];
    return scheduleData.filter(s => s.cinemaId === selectedCinemaId && s.showDate === dates[activeDateIdx]
      && !isPast(s.showDate, s.startTime));
  }, [scheduleData, selectedCinemaId, dates, activeDateIdx]);

  const dateCounts = useMemo(() => {
    if (!scheduleData || !selectedCinemaId) return dates.map(() => 0);
    return dates.map(d => scheduleData.filter(s => s.cinemaId === selectedCinemaId && s.showDate === d
      && !isPast(s.showDate, s.startTime)).length);
  }, [scheduleData, selectedCinemaId, dates]);

  const handleAiHelp = () => {
    const parts: string[] = [];
    if (film) parts.push(`《${film.title}》`);
    if (cinema) parts.push(cinema.name);
    parts.push(dayjs(dates[activeDateIdx]).format('M月D日'));
    triggerAi(`我在看${parts.join(' ')}，帮我推荐合适场次`);
    Toast.show({ content: '已转交 AI 助手 🤖' });
  };

  // ===== filmOnly 模式：先选影院 =====
  if (isFilmOnly && !selectedCinemaId) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选择影院</NavBar>
        <div className={styles.infoHead}><div className={styles.filmTitle}>{film?.title}</div></div>
        {!cinemasReady ? <div style={{ textAlign:'center',padding:40 }}><SpinLoading color="primary" /></div>
        : !cinemasRaw || cinemasRaw.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}>📭</div><div className={styles.emptyText}>暂无影院排片</div></div>
        : <div className={styles.cinemaList}>
          <div className={styles.filmGridTitle}>有排场的影院（{cinemasRaw.length}家）</div>
          {cinemasRaw.map(c => (
            <div key={c.id} className={styles.cinemaCard} onClick={() => setSelectedCinemaId(c.id)}>
              <div className={styles.cinemaCardHead}><span className={styles.cinemaCardName}>{c.name}</span></div>
              <div className={styles.cinemaCardAddr}>{c.address}</div>
              <div className={styles.cinemaCardTags}>
                {c.tags.map(t => <span key={t} className={styles.cinemaCardTag}>{t}</span>)}
                <span className={styles.cinemaCardShowtimeCount}>共 {c.showtimeCount} 场</span>
              </div>
            </div>
          ))}
        </div>}
        <SafeArea position="bottom" />
      </div>
    );
  }

  // ===== cinemaOnly 模式：先选影片 =====
  if (isCinemaOnly && !selectedFilmId) {
    const filmIds = [...new Set((scheduleData || []).map(s => s.filmId))];
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选择影片</NavBar>
        <div className={styles.infoHead}><div className={styles.cinemaName}>{cinema?.name}</div></div>
        {!scheduleData ? <div style={{ textAlign:'center',padding:40 }}><SpinLoading color="primary" /></div>
        : filmIds.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}>📭</div><div className={styles.emptyText}>该影院暂无排片</div></div>
        : <div className={styles.filmGrid}>
          <div className={styles.filmGridTitle}>正在上映（{filmIds.length}部）</div>
          {filmIds.map(fid => { const sch = scheduleData!.find(s => s.filmId === fid)!;
            return (
              <div key={fid} className={styles.filmCard} onClick={() => setSelectedFilmId(fid)}>
                <div className={styles.filmCardPoster} style={{ background: FILM_COLORS[fid % FILM_COLORS.length] }}>
                  {sch.filmPoster && <img src={sch.filmPoster} alt={sch.filmName} />}
                </div>
                <div className={styles.filmCardInfo}>
                  <div className={styles.filmCardTitle}>{sch.filmName}</div>
                  <div className={styles.filmCardMeta}>⭐ {sch.filmRating} · {sch.filmType}</div>
                  <div className={styles.filmCardPick}>选场次 ›</div>
                </div>
              </div>
            );
          })}
        </div>}
        <SafeArea position="bottom" />
      </div>
    );
  }

  // ===== 两者都已选定：展示场次 =====
  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} right={<span className={styles.aiBtn} onClick={handleAiHelp}>🤖 转交AI</span>}>选场次</NavBar>
      <div className={styles.infoHead}>
        <div className={styles.filmTitle}>{film?.title || '选影片'}</div>
        <div className={styles.cinemaName}>{cinema?.name || '选影院'}</div>
        {isCinemaOnly && <div className={styles.filmSwitch}>{(scheduleData || []).map(s => (
          <span key={s.filmId} className={`${styles.filmSwitchChip} ${s.filmId===selectedFilmId ? styles.filmSwitchChipActive : ''}`} onClick={() => { setSelectedFilmId(s.filmId); setActiveDateIdx(0); }}>{s.filmName}</span>
        ))}</div>}
        {isFilmOnly && cinemasRaw && <div className={styles.filmSwitch}>{cinemasRaw.map(c => (
          <span key={c.id} className={`${styles.filmSwitchChip} ${c.id===selectedCinemaId ? styles.filmSwitchChipActive : ''}`} onClick={() => { setSelectedCinemaId(c.id); setActiveDateIdx(0); }}>{c.name.split('(')[0]}</span>
        ))}</div>}
      </div>

      <div className={styles.dateBar}>
        <div className={styles.dateScroll}>
          {dates.map((date, idx) => {
            const count = dateCounts[idx];
            return (
              <div key={date} className={`${styles.dateItem} ${activeDateIdx===idx ? styles.dateItemActive : ''} ${count===0 ? styles.dateItemEmpty : ''}`} onClick={()=>setActiveDateIdx(idx)}>
                <span className={styles.dateLabel}>{getDayLabel(date, idx)}</span>
                <span className={styles.dateNum}>{dayjs(date).format('MM/DD')}</span>
                {count > 0 && <span className={styles.dateCount}>{count}场</span>}
                {count === 0 && <span className={styles.dateNoData}>无排片</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.list}>
        {!scheduleData ? <div style={{ textAlign:'center',padding:60 }}><SpinLoading color="primary" /></div>
        : showtimes.length === 0 ? <div className={styles.empty}><div className={styles.emptyIcon}>📅</div><div className={styles.emptyText}>该日期暂无排片</div></div>
        : <>
          <div className={styles.listHeader}>共 <strong>{showtimes.length}</strong> 个场次 · {dates[activeDateIdx]}</div>
          {showtimes.map(item => {
            const isSoldOut = item.status === 'soldOut';
            return (
              <div key={item.id} className={`${styles.card} ${isSoldOut ? styles.cardSoldOut : ''}`} onClick={() => { if (!isSoldOut) guard(() => navigate(`/seat/${item.id}`)); }}>
                <div className={styles.cardLeft}>
                  <div className={styles.cardTime}>{item.startTime?.substring(0, 5)}
                    {isSoldOut && <span className={styles.soldTag}>售罄</span>}
                  </div>
                  <div className={styles.cardHall}>{item.hallName} · {item.hallType}</div>
                </div>
                <div className={styles.cardRight}>
                  <div className={styles.cardPrice}><span className={styles.priceNum}>¥{item.price}</span></div>
                  <div className={`${styles.cardSeats} ${isSoldOut ? styles.seatsZero : ''}`}>{isSoldOut ? '已售罄' : `${item.hallRowCount}×${item.hallColCount}座`}</div>
                </div>
              </div>
            );
          })}
        </>}
      </div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default ShowtimePage;
