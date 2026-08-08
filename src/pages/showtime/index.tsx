/**
 * 影院场次页 — 保留数据库真实数据 + 新增筛选 UI
 *
 * 数据来源：
 *   - 场次列表：GET /schedule/list?filmId=  （真实数据）
 *   - 影院详情：GET /cinema/getInfo/{id}    （真实数据）
 *   - 影厅类型/品牌/服务标签：Mock           （数据库无此字段）
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'umi';
import { NavBar, Popup, SpinLoading, SafeArea, Toast } from 'antd-mobile';
import {
  LeftOutline,
  SearchOutline,
  DownOutline,
  FilterOutline,
} from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getFilm } from '@/api/filmController';
import { listSchedule, listAll1 } from '@/api/scheduleController';
import http from '@/services/request';
import { useAiStore } from '@/stores/useAiStore';
import { useGuard } from '@/hooks/useGuard';
import { useLocationStore } from '@/stores/useLocationStore';
import { MOCK_BRANDS } from '@/mock/home';
import dayjs from 'dayjs';
import styles from './index.module.less';

function getTagColor(tag: string): string {
  const t = tag.toLowerCase();
  // 红色：优惠/特权（放最前面）
  if (/特权|专属|vip|影城卡|券|新人|限时|折扣|优惠/.test(tag)) return 'tagRed';
  // 蓝色：退票改签（放红色后面）
  if (/退票|改签/.test(tag)) return 'tagBlue';
  // 绿色：停车
  if (/停车/.test(tag)) return 'tagGreen';
  // 灰色：影厅格式 + 其余（放最后）
  return 'tagGray';
}

/** 品牌 → 影院名称精确匹配（品牌全名，防止 "万达" 误匹配非万达影院） */
function matchBrand(cinemaName: string, brand: string): boolean {
  if (!cinemaName || !brand) return false;
  const name = cinemaName.trim();
  const BRAND_KEYWORDS: Record<string, string> = {
    '万达影城': '万达影城',
    '奥斯卡影城': '奥斯卡影城',
    '横店影城': '横店影城',
    '卢米埃影城': '卢米埃影城',
    '沃美影城': '沃美影城',
    '新华国际影城': '新华国际影城',
    '耀莱影城': '耀莱影城',
  };
  const keyword = BRAND_KEYWORDS[brand.trim()];
  return keyword ? name.includes(keyword) : false;
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  if (index === 2) return '后天';
  return WEEKDAY_CN[dayjs(dateStr).day()];
}

function buildDates(): string[] {
  const r: string[] = [];
  for (let i = 0; i < 7; i++) {
    r.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
  }
  return r;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface EnrichedCinema {
  id: string;
  name: string;
  address: string;
  distance: string;
  distNum: number;
  minPrice: number;
  tags: string[];
  halls: string[];
  showtimeCount: number;
  showtimes: API.ScheduleVO[];
}

function enrichCinema(c: any, showtimes: API.ScheduleVO[], userLat: number, userLng: number): EnrichedCinema {
  // 雪花 ID 超出 JS Number 精度，必须保持字符串（同选座页修复）
  const id = String(c.id);
  const minPrice = showtimes.length > 0
    ? Math.min(...showtimes.map(s => Number(s.price)))
    : (c.basePrice ?? 30);

  // 优先使用后端通过高德API返回的距离（米），与AI选影院结果一致；无则回退到Haversine
  const backendDist = c.distance != null ? Number(c.distance) : null;
  const dist = backendDist != null
    ? backendDist / 1000
    : (c.longitude != null && c.latitude != null && userLat && userLng)
      ? calcDistance(userLat, userLng, Number(c.latitude), Number(c.longitude))
      : null;
  const distance = backendDist != null
    ? backendDist < 1000 ? `${backendDist}m` : `${(backendDist / 1000).toFixed(1)}km`
    : dist != null
      ? dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
      : '';
  const distNum = dist ?? 999;

  const tags: string[] = c.tags ? c.tags.split(',').filter(Boolean) : [];
  const halls = showtimes.length > 0
    ? [...new Set(showtimes.map(s => s.hallType || ''))].filter(Boolean)
    : [];

  return {
    id,
    name: c.name || '',
    address: c.address || '',
    distance,
    distNum,
    minPrice,
    tags,
    halls,
    showtimeCount: showtimes.length,
    showtimes,
  };
}

type SortType = 'composite' | 'nearest' | 'price';

const ShowtimePage: React.FC = () => {
  const params = useParams<{ filmId?: string; cinemaId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const guard = useGuard();
  const triggerAi = useAiStore((s) => s.triggerAi);
  const locationStore = useLocationStore();
  const cityName = locationStore.city || '全城';
  const userLat = locationStore.lat;
  const userLng = locationStore.lng;

  const isCinemaOnly = location.pathname.includes('/showtime/cinema/');
  const isFilmOnly = location.pathname.includes('/showtime/film/');
  const isDirect = !isCinemaOnly && !isFilmOnly;

  // 雪花 ID 全程用字符串，避免 Number() 精度丢失
  const directFilmId = isDirect ? params.filmId : undefined;
  const directCinemaId = isDirect ? params.cinemaId : undefined;

  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(
    isFilmOnly ? params.filmId ?? null : isDirect ? directFilmId ?? null : null,
  );
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(
    isCinemaOnly ? params.cinemaId! : isDirect ? directCinemaId! : null,
  );

  // 影片详情
  const { data: film } = useQuery({
    queryKey: ['filmDetail', selectedFilmId],
    queryFn: () => selectedFilmId ? getFilm({ id: selectedFilmId }) : null,
    enabled: !!selectedFilmId,
  });

  // 场次列表（真实数据）
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', selectedFilmId, selectedCinemaId],
    queryFn: () => (selectedFilmId || selectedCinemaId)
      ? listSchedule({
          filmId: selectedFilmId || undefined,
          cinemaId: (selectedCinemaId as any) || undefined,
        }).then((res: any) => res?.data ?? res ?? [])
      : Promise.resolve([]),
    enabled: !!selectedFilmId || !!selectedCinemaId,
  });

  // 全部影厅类型（真实数据 + 补充常见类型，缓存 5 分钟）
  const { data: allHallTypes } = useQuery({
    queryKey: ['allHallTypes'],
    queryFn: async () => {
      const raw: any = await listAll1();
      const list = raw?.data ?? raw ?? [];
      const dbTypes = [...new Set(list.map((s: any) => s.hallType || '').filter(Boolean))];
      const extraTypes = ['巨幕', 'ScreenX', 'VIP厅', '普通', '杜比'];
      return [...new Set([...dbTypes, ...extraTypes])] as string[];
    },
    staleTime: 300000,
  });

  const cinemaIds = useMemo(() => [...new Set((scheduleData || []).map(s => s.cinemaId))].filter(Boolean) as string[], [scheduleData]);

  // 影院详情（真实数据，按当前城市过滤）
  const { data: cinemasRaw, isLoading: cinemasLoading } = useQuery({
    queryKey: ['cinemas', cinemaIds, cityName, userLat, userLng],
    queryFn: async () => {
      const results: { id: string; name: string; address: string; tags: string; city: string; latitude: number; longitude: number; basePrice: number; distance: number }[] = [];
      const locParam = userLat && userLng ? `?userLat=${userLat}&userLng=${userLng}` : '';
      for (const cId of cinemaIds.slice(0, 20)) {
        try {
          const c = await http.get(`/cinema/getInfo/${cId}${locParam}`) as any;
          results.push({
            id: String(c.id),
            name: c.name || '',
            address: c.address || '',
            tags: c.tags || '',
            city: c.city || '未知',
            latitude: c.latitude,
            longitude: c.longitude,
            basePrice: c.basePrice,
            distance: c.distance,
          });
        } catch { /* skip */ }
      }
      return results;
    },
    enabled: cinemaIds.length > 0,
  });

  // 按当前城市筛选影院
  const cityFilteredCinemas = useMemo(() => {
    if (!cinemasRaw) return [];
    const cn = cityName || '';
    if (!cn || cn === '全城' || cn === '北京') return cinemasRaw;
    return cinemasRaw.filter(c => {
      try { return cn.includes(c.city || '') || (c.city || '').includes(cn); }
      catch { return true; } // 防崩溃兜底
    });
  }, [cinemasRaw, cityName]);

  const cinemasReady = !scheduleLoading && (cinemaIds.length === 0 || cinemasRaw !== undefined);

  // 当前选中影院
  const { data: cinema } = useQuery({
    queryKey: ['cinema', selectedCinemaId],
    queryFn: async () => {
      const c = await http.get(`/cinema/getInfo/${selectedCinemaId}`) as any;
      const id = String(c.id);
      const dist = (c.longitude != null && c.latitude != null && userLat && userLng)
        ? calcDistance(userLat, userLng, Number(c.latitude), Number(c.longitude))
        : null;
      const distance = dist != null
        ? dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
        : '';
      return {
        id,
        name: c.name || '',
        address: c.address || '',
        city: c.city || '',
        distance,
        tags: (c.tags || '').split(',').filter(Boolean),
      };
    },
    enabled: !!selectedCinemaId,
  });

  // 影院当前热映影片（后端新接口 GET /api/schedule/cinema-films）
  const { data: cinemaFilms, isFetched: cinemaFilmsReady } = useQuery({
    queryKey: ['cinemaFilms', selectedCinemaId],
    queryFn: async () => {
      const resp: any = await http.get(`/schedule/cinema-films?cinemaId=${selectedCinemaId}`);
      const arr = Array.isArray(resp) ? resp : (resp?.data ?? []);
      return arr.map((f: any) => ({
        id: f.id,
        name: f.name || '',
        posterUrl: f.posterUrl || '',
        rating: f.rating ? Number(f.rating) : undefined,
        type: f.type || '',
        duration: f.duration,
        actors: f.actors || '',
        director: f.director || '',
      }));
    },
    enabled: !!selectedCinemaId && (isFilmOnly || isCinemaOnly),
  });

  const dates = useMemo(() => buildDates(), []);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  // 横向影片列表
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeStripFilmId, setActiveStripFilmId] = useState<string | null>(selectedFilmId);

  // 切换影片（点击影片海报后自动滚动到中间）
  const handleStripFilmClick = (fid: string) => {
    setActiveStripFilmId(fid);
    if (isFilmOnly || isCinemaOnly) {
      setSelectedFilmId(fid);
    }
    // 滚动到中间
    setTimeout(() => {
      const container = stripRef.current;
      if (!container) return;
      const item = container.querySelector(`[data-film-id="${fid}"]`) as HTMLElement;
      if (!item) return;
      const targetLeft = item.offsetLeft + item.offsetWidth / 2 - container.clientWidth / 2;
      container.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }, 50);
  };

  // 影院正在热映的影片（全从 schedule 表真实数据聚合）
  const displayFilms = useMemo(() => {
    return cinemaFilms && cinemaFilms.length > 0 ? cinemaFilms : [];
  }, [cinemaFilms]);

  // 初始化影片列表：第一个影片居中
  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollLeft = 0;
    }
  }, [displayFilms.length]);

  // 筛选状态
  const [screenFilter, setScreenFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [activePanel, setActivePanel] = useState<'filter' | 'brand' | 'sort' | null>(null);
  const [sortPanelVisible, setSortPanelVisible] = useState(false);
  const [sortType, setSortType] = useState<SortType>('composite');
  const [currentSort, setCurrentSort] = useState('综合排序');
  const [searchMode, setSearchMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [nearbyCinemas, setNearbyCinemas] = useState<{ id: string; name: string; address: string; distance: string }[]>([]);
  const [otherFilmCinemas, setOtherFilmCinemas] = useState<{ cinemaId: string; cinemaName: string; address: string; films: { id: string; name: string; posterUrl: string }[] }[]>([]);

  const isPast = (showDate: string, startTime: string) => {
    const dt = `${showDate}T${startTime}`;
    return new Date(dt).getTime() < Date.now();
  };

  // 合并真实场次 + 数据库字段的影院列表（按选中日期过滤）
  const enrichedCinemas = useMemo(() => {
    if (!cityFilteredCinemas || !scheduleData) return [];
    const selectedDate = dates[activeDateIdx];
    return cityFilteredCinemas
      .map(c => {
        const cShowtimes = scheduleData.filter(s => String(s.cinemaId) === String(c.id) && s.showDate === selectedDate);
        return enrichCinema(c, cShowtimes, userLat, userLng);
      })
      .filter(c => c.showtimeCount > 0);
  }, [cityFilteredCinemas, scheduleData, userLat, userLng, dates, activeDateIdx]);

  // 筛选后的影院列表
  const filteredCinemas = useMemo(() => {
    let list = [...enrichedCinemas];

    if (screenFilter.length > 0) {
      list = list.filter(c =>
        screenFilter.some(s => c.halls.includes(s) || c.tags.some(tag => tag.includes(s)))
      );
    }

    if (brandFilter.length > 0) {
      list = list.filter(c => brandFilter.some(b => matchBrand(c.name, b)));
    }

    if (submittedKeyword) {
      list = list.filter(c => c.name.includes(submittedKeyword));
    }

    list = list.filter(c => c.minPrice >= priceRange[0] && c.minPrice <= priceRange[1]);

    if (sortType === 'price') {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortType === 'nearest') {
      list.sort((a, b) => a.distNum - b.distNum);
    }

    return list;
  }, [enrichedCinemas, screenFilter, brandFilter, priceRange, sortType, submittedKeyword]);

  // 当前日期+影院的场次
  const showtimes = useMemo(() => {
    if (!scheduleData) return [];
    const cid = selectedCinemaId;
    if (!cid) return [];
    return scheduleData.filter(s =>
      String(s.cinemaId) === String(cid) &&
      s.showDate === dates[activeDateIdx] &&
      !isPast(s.showDate!, s.startTime!)
    );
  }, [scheduleData, selectedCinemaId, dates, activeDateIdx]);

  const dateCounts = useMemo(() => {
    if (!scheduleData) return dates.map(() => 0);
    const cid = selectedCinemaId;
    if (!cid) return dates.map(() => 0);
    return dates.map(d => scheduleData.filter(s =>
      String(s.cinemaId) === String(cid) && s.showDate === d && !isPast(s.showDate!, s.startTime!)
    ).length);
  }, [scheduleData, selectedCinemaId, dates]);

  const toggleArrayItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const hasActiveFilters = screenFilter.length > 0 || brandFilter.length > 0 || priceRange[0] > 0 || priceRange[1] < 200;

  const handleAiHelp = () => {
    const parts: string[] = [];
    if (film) parts.push(`《${film.name}》`);
    if (cinema) parts.push(cinema.name);
    parts.push(dayjs(dates[activeDateIdx]).format('M月D日'));
    triggerAi(`我在看${parts.join(' ')}，帮我推荐合适场次`);
    Toast.show({ content: '已转交 AI 助手' });
  };

  // ===== 无排片时推荐其他影片或附近影院 =====
  useEffect(() => {
    if (!cinemasReady || enrichedCinemas.length > 0) {
      setNearbyCinemas([]);
      setOtherFilmCinemas([]);
      return;
    }
    const date = dates[activeDateIdx];
    // 有选中影片时，优先推荐同日期其他有场次的影片
    if (selectedFilmId) {
      http.get('/schedule/other-films', { params: { showDate: date, excludeFilmId: selectedFilmId } }).then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        if (list.length > 0) {
          setOtherFilmCinemas(list);
          setNearbyCinemas([]);
        } else {
          setOtherFilmCinemas([]);
          // 无其他影片 → 推荐附近影院
          if (userLat && userLng) {
            http.get('/cinema/nearby', { params: { userLat, userLng, limit: 3 } }).then((r: any) => {
              const arr = Array.isArray(r) ? r : (r?.data ?? []);
              setNearbyCinemas(arr.map((c: any) => ({
                id: String(c.id), name: c.name || '', address: c.address || '', distance: c.distance || '',
              })));
            }).catch(() => {});
          }
        }
      }).catch(() => {
        setOtherFilmCinemas([]);
        if (userLat && userLng) {
          http.get('/cinema/nearby', { params: { userLat, userLng, limit: 3 } }).then((r: any) => {
            const arr = Array.isArray(r) ? r : (r?.data ?? []);
            setNearbyCinemas(arr.map((c: any) => ({
              id: String(c.id), name: c.name || '', address: c.address || '', distance: c.distance || '',
            })));
          }).catch(() => {});
        }
      });
    } else if (userLat && userLng) {
      // 无选中影片（影院模式），直接推荐附近影院
      http.get('/cinema/nearby', { params: { userLat, userLng, limit: 3 } }).then((res: any) => {
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        setNearbyCinemas(arr.map((c: any) => ({
          id: String(c.id), name: c.name || '', address: c.address || '', distance: c.distance || '',
        })));
      }).catch(() => {});
    }
  }, [cinemasReady, enrichedCinemas.length, userLat, userLng, dates, activeDateIdx, selectedFilmId]);

  // ===== 影院无排片时推荐附近影院 =====
  useEffect(() => {
    if (!isCinemaOnly || !cinemaFilmsReady || !cinemaFilms || cinemaFilms.length > 0 || !userLat || !userLng) {
      return;
    }
    http.get('/cinema/nearby', { params: { userLat, userLng, excludeId: selectedCinemaId, limit: 3 } }).then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      const result = list.map((c: any) => ({
        id: String(c.id), name: c.name || '', address: c.address || '', distance: c.distance || '',
      }));
      setNearbyCinemas(result);
    }).catch(() => {});
  }, [isCinemaOnly, cinemaFilmsReady, cinemaFilms, userLat, userLng, selectedCinemaId]);

  // ===== 同步 URL 参数变化（同路由跳转时组件不卸载，需手动同步） =====
  useEffect(() => {
    if (isCinemaOnly && params.cinemaId && params.cinemaId !== selectedCinemaId) {
      setSelectedCinemaId(params.cinemaId);
      setSelectedFilmId(null);
      setNearbyCinemas([]);
    }
  }, [isCinemaOnly, params.cinemaId]);

  // ===== cinemaOnly：自动选中第一部影片，跳过选片页 =====
  useEffect(() => {
    if (isCinemaOnly && cinemaFilms && cinemaFilms.length > 0 && !selectedFilmId) {
      setSelectedFilmId(cinemaFilms[0].id);
    }
  }, [cinemaFilms, isCinemaOnly, selectedFilmId]);

  // ===== filmOnly 模式：先选影院 =====
  if (isFilmOnly && !selectedCinemaId) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>{film?.name || '选择影院'}</NavBar>

        {/* 日期选择条 */}
        <div className={styles.dateBar}>
          <div className={styles.dateScroll}>
            {dates.map((date, idx) => (
              <div
                key={date}
                className={`${styles.dateItem} ${activeDateIdx === idx ? styles.dateItemActive : ''}`}
                onClick={() => setActiveDateIdx(idx)}
              >
                <span className={styles.dateLabel}>{getDayLabel(date, idx)}</span>
                <span className={styles.dateNum}>{dayjs(date).format('MM/DD')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 筛选条 / 搜索栏 */}
        {searchMode ? (
          <div className={styles.filterBar}>
            <input
              ref={searchInputRef}
              className={styles.searchInput}
              placeholder="搜索影院名称"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setSubmittedKeyword(e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
            />
            <span
              className={styles.searchCancel}
              onClick={() => { setSearchMode(false); setSearchKeyword(''); setSubmittedKeyword(''); }}
            >
              取消
            </span>
          </div>
        ) : (
        <div className={styles.filterBar}>
          <div className={styles.filterItem} onClick={() => navigate('/city-picker')}>
            <span className={styles.filterText}>{cityName}</span>
            <DownOutline fontSize={10} />
          </div>
          <div
            className={`${styles.filterItem} ${hasActiveFilters ? styles.filterActive : ''}`}
            onClick={() => setActivePanel(prev => prev === 'filter' ? null : 'filter')}
          >
            <FilterOutline fontSize={12} />
            <span className={styles.filterText}>筛选</span>
          </div>
          <div
            className={`${styles.filterItem} ${brandFilter.length > 0 ? styles.filterActive : ''}`}
            onClick={() => setActivePanel(prev => prev === 'brand' ? null : 'brand')}
          >
            <span className={styles.filterText}>品牌</span>
          </div>
          <div className={styles.filterItem} onClick={() => setSortPanelVisible(true)}>
            <span className={styles.filterText}>{currentSort}</span>
            <DownOutline fontSize={10} />
          </div>
          <div className={styles.filterItem} onClick={() => { setSearchMode(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}>
            <SearchOutline fontSize={14} />
          </div>
        </div>
        )}

        {/* 筛选/品牌下拉面板 */}
        {activePanel && (
          <div className={styles.panelDropdown}>
            {activePanel === 'filter' && (
              <div className={styles.panelContent}>
                <div className={styles.filterSection}>
                  <div className={styles.filterSectionTitle}>放映影厅</div>
                  <div className={styles.screenGrid}>
                    {(allHallTypes || []).map(h => (
                        <span
                          key={h}
                          className={`${styles.screenItem} ${screenFilter.includes(h) ? styles.screenItemActive : ''}`}
                          onClick={() => toggleArrayItem(screenFilter, setScreenFilter, h)}
                        >
                          {h}
                        </span>
                      ))}
                  </div>
                </div>
                <div className={styles.filterSection}>
                  <div className={styles.filterSectionTitle}>影院服务</div>
                  <div className={styles.screenGrid}>
                    {['可停车', '退票', '改签', '观影小食'].map(svc => {
                      const isActive = screenFilter.includes(svc);
                      return (
                        <span
                          key={svc}
                          className={`${styles.screenItem} ${isActive ? styles.screenItemActive : ''}`}
                          onClick={() => toggleArrayItem(screenFilter, setScreenFilter, svc)}
                        >
                          {svc}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.filterActions}>
                  <button className={styles.filterClear} onClick={() => { setScreenFilter([]); setPriceRange([0, 200]); }}>清空</button>
                  <button className={styles.filterConfirm} onClick={() => setActivePanel(null)}>完成</button>
                </div>
              </div>
            )}
            {activePanel === 'brand' && (
              <div className={styles.panelContent}>
                <div className={styles.screenGrid}>
                  {MOCK_BRANDS.map(b => (
                    <span
                      key={b}
                      className={`${styles.screenItem} ${brandFilter.includes(b) ? styles.screenItemActive : ''}`}
                      onClick={() => toggleArrayItem(brandFilter, setBrandFilter, b)}
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <div className={styles.filterActions}>
                  <button className={styles.filterClear} onClick={() => setBrandFilter([])}>清空</button>
                  <button className={styles.filterConfirm} onClick={() => setActivePanel(null)}>完成</button>
                </div>
              </div>
            )}
          </div>
        )}
        {activePanel && <div className={styles.overlay} onClick={() => setActivePanel(null)} />}

        {/* 影厅快捷标签 — 真实排片类型 + 补充常见类型 */}
        {(() => {
          const dbTypes = [...new Set((scheduleData || []).map(s => s.hallType || '').filter(Boolean))];
          const extraTypes = ['巨幕', 'ScreenX', 'VIP厅', '普通', '杜比'];
          const hallTypes = [...new Set([...dbTypes, ...extraTypes])];
          if (hallTypes.length === 0) return null;
          return (
            <div className={styles.hallBar}>
              {hallTypes.map(type => (
                <span
                  key={type}
                  className={`${styles.hallTag} ${screenFilter.includes(type) ? styles.hallTagActive : ''}`}
                  onClick={() => toggleArrayItem(screenFilter, setScreenFilter, type)}
                >
                  {type}
                </span>
              ))}
            </div>
          );
        })()}

        {/* 影院列表 */}
        <div className={styles.cinemaList}>
          {!cinemasReady ? (
            <div style={{ textAlign: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
          ) : filteredCinemas.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🎬</div>
              {otherFilmCinemas.length > 0 ? (
                <>
                  <div className={styles.emptyText}>该影片在所选日期暂无排片</div>
                  <div className={styles.recommendSection}>
                    <div className={styles.recommendHint}>不过同日期这些影院有其他好片在映哦 👇</div>
                    <div className={styles.recommendList}>
                      {otherFilmCinemas.map((cinema) => (
                        <div
                          key={cinema.cinemaId}
                          className={styles.otherFilmCard}
                          onClick={() => navigate(`/showtime/cinema/${cinema.cinemaId}`)}
                        >
                          <div className={styles.otherFilmCardHead}>
                            <span className={styles.otherFilmCinemaName}>{cinema.cinemaName}</span>
                            <span className={styles.recommendArrow}>&rsaquo;</span>
                          </div>
                          <div className={styles.otherFilmCardAddr}>{cinema.address}</div>
                          <div className={styles.otherFilmStrip}>
                            {cinema.films.map((f) => (
                              <div key={f.id} className={styles.otherFilmItem}>
                                {f.posterUrl ? (
                                  <img src={f.posterUrl} alt={f.name} className={styles.otherFilmPoster} />
                                ) : (
                                  <div className={styles.otherFilmPosterPlaceholder}>🎬</div>
                                )}
                                <span className={styles.otherFilmName}>{f.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : nearbyCinemas.length > 0 ? (
                <>
                  <div className={styles.emptyText}>这个日期附近还没有排片呢～</div>
                  <div className={styles.recommendSection}>
                    <div className={styles.recommendHint}>要不要看看这些离你最近的影院？说不定有合适的场次哦 👇</div>
                    <div className={styles.recommendList}>
                      {nearbyCinemas.map((c, idx) => (
                        <div
                          key={c.id}
                          className={styles.recommendCard}
                          onClick={() => navigate(`/showtime/cinema/${c.id}`)}
                        >
                          <div className={styles.recommendCardLeft}>
                            <div className={styles.recommendCardTitle}>
                              <span className={styles.recommendRank}>{['🥇', '🥈', '🥉'][idx]}</span>
                              <span>{c.name}</span>
                            </div>
                            <div className={styles.recommendCardAddr}>{c.address}</div>
                          </div>
                          <div className={styles.recommendCardRight}>
                            <span className={styles.recommendDist}>{c.distance}</span>
                            <span className={styles.recommendArrow}>&rsaquo;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyText}>暂无符合条件的影院</div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.listCount}>共 {filteredCinemas.length} 家影院</div>
              {filteredCinemas.map(c => (
                <div key={c.id} className={styles.cinemaCard} onClick={() => setSelectedCinemaId(c.id)}>
                  <div className={styles.cinemaHeader}>
                    <div className={styles.cinemaTitle}>{c.name}</div>
                    <div className={styles.cinemaPrice}>
                      <span className={styles.priceSymbol}>¥</span>
                      <span className={styles.priceValue}>{c.minPrice}</span>
                      <span className={styles.priceSuffix}>起</span>
                    </div>
                  </div>
                  <div className={styles.cinemaAddrRow}>
                    <div className={styles.cinemaAddr}>{c.address}</div>
                    <span className={styles.cinemaDistance}>{c.distance}</span>
                  </div>
                  <div className={styles.cinemaInfoRow}>
                    {c.tags.map(tag => (
                      <span key={tag} className={`${styles.serviceTag} ${styles[getTagColor(tag)]}`}>{tag}</span>
                    ))}
                    {c.halls.filter(h => !c.tags.includes(h)).map(h => (
                      <span key={h} className={`${styles.hallBadge} ${styles[getTagColor(h)]}`}>{h}</span>
                    ))}
                    {c.showtimeCount > 0 && <span className={`${styles.serviceTag} ${styles.tagGray}`}>共 {c.showtimeCount} 场</span>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <SortPopup
          visible={sortPanelVisible}
          onClose={() => setSortPanelVisible(false)}
          currentSort={currentSort}
          setCurrentSort={setCurrentSort}
          setSortType={setSortType}
          onClosePopup={() => setSortPanelVisible(false)}
        />
        <SafeArea position="bottom" />
      </div>
    );
  }

  // cinemaOnly 模式下没影片或还在加载
  if (isCinemaOnly && !selectedFilmId) {
    // 影院没有热映影片 → 维护中，推荐附近影院
    if (cinemaFilmsReady && (!cinemaFilms || cinemaFilms.length === 0)) {
      return (
        <div className={styles.page}>
          <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>{cinema?.name || '影院'}</NavBar>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏗️</div>
            <div className={styles.emptyText}>该影院维护中，暂不开放</div>
            <div className={styles.emptyDesc}>我们正在努力准备更好的观影体验，敬请期待～</div>
            {nearbyCinemas.length > 0 && (
              <div className={styles.recommendSection}>
                <div className={styles.recommendHint}>要不先看看附近这几家？同样精彩 👇</div>
                <div className={styles.recommendList}>
                  {nearbyCinemas.map((c, idx) => (
                    <div key={c.id} className={styles.recommendCard} onClick={() => navigate(`/showtime/cinema/${c.id}`)}>
                      <div className={styles.recommendCardLeft}>
                        <div className={styles.recommendCardTitle}>
                          <span className={styles.recommendRank}>{['🥇', '🥈', '🥉'][idx]}</span>
                          <span>{c.name}</span>
                        </div>
                        <div className={styles.recommendCardAddr}>{c.address}</div>
                      </div>
                      <div className={styles.recommendCardRight}>
                        <span className={styles.recommendDist}>{c.distance}</span>
                        <span className={styles.recommendArrow}>&rsaquo;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <SafeArea position="bottom" />
        </div>
      );
    }
    // 还在加载...
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>{cinema?.name || '影院'}</NavBar>
        <div style={{ textAlign: 'center', padding: 80 }}><SpinLoading color="primary" /></div>
        <SafeArea position="bottom" />
      </div>
    );
  }

  // ===== 两者已选定：新版影院详情页 =====
  return (
    <div className={styles.page}>
      {/* NavBar：影院名 */}
      <NavBar
        onBack={() => navigate(-1)}
        back={<LeftOutline />}
        right={<span className={styles.aiBtn} onClick={handleAiHelp}>🤖</span>}
      >
        <span>{cinema?.name || '选影院'}</span>
      </NavBar>

      {/* 影院详情头部 */}
      <div className={styles.cinemaDetailHeader}>
        <div className={styles.cinemaHeaderTitle}>{cinema?.name || '影院详情'}</div>
        <div className={styles.cinemaHeaderAddr}>
          <span className={styles.addrText}>{cinema?.address || '暂无地址'}</span>
          <span className={styles.addrDistance}>{cinema?.distance || '--km'}</span>
        </div>
        <div className={styles.cinemaHeaderTags}>
          {(cinema?.tags || []).map((tag: string, idx: number) => (
            <span key={idx} className={`${styles.cHeaderTag} ${getTagColor(tag) === 'tagRed' ? styles.cHeaderTagRed : styles.cHeaderTagGray}`}>{tag}</span>
          ))}
        </div>
      </div>

      {/* 选场次 */}
      <div className={styles.tabSwitch}>
        <div className={`${styles.tabItem} ${styles.tabItemActive}`}>选场次</div>
      </div>

      {/* 影片横向滚动列表（展示影院所有热映影片） */}
      {(isFilmOnly || isCinemaOnly) && displayFilms.length > 0 && (
        <div className={styles.filmStripWrap}>
          <div ref={stripRef} className={styles.filmStrip}>
            {displayFilms.map(f => {
              const isActive = f.id === (activeStripFilmId ?? selectedFilmId);
              return (
                <div
                  key={f.id}
                  data-film-id={f.id}
                  className={`${styles.filmStripItem} ${isActive ? styles.filmStripItemActive : ''}`}
                  onClick={() => handleStripFilmClick(f.id)}
                >
                  {f.posterUrl ? (
                    <img
                      src={f.posterUrl}
                      alt={f.name}
                      className={`${styles.filmStripPoster} ${isActive ? styles.filmStripPosterActive : ''}`}
                    />
                  ) : (
                    <div
                      className={`${styles.filmStripPoster} ${isActive ? styles.filmStripPosterActive : ''}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}
                    >🎬</div>
                  )}
                </div>
              );
            })}
          </div>
          {/* 选中影片的文字信息（跟随选中影片变化） */}
          {(() => {
            const currentId = activeStripFilmId ?? selectedFilmId;
            const current = displayFilms.find(f => f.id === currentId);
            if (!current) return null;
            return (
              <div className={styles.filmStripInfo}>
                <div className={styles.filmStripInfoLine1}>
                  <span className={styles.filmStripInfoName}>{current.name}</span>
                  <span className={styles.filmStripInfoRating}>⭐ {current.rating?.toFixed(1) || '--'}</span>
                </div>
                <div className={styles.filmStripInfoLine2}>
                  <span className={styles.filmStripInfoDur}>{current.duration || '--'}分钟</span>
                  <span className={styles.filmStripInfoSep}>|</span>
                  <span className={styles.filmStripInfoType}>{current.type || ''}</span>
                  {current.actors && (
                    <>
                      <span className={styles.filmStripInfoSep}>|</span>
                      <span className={styles.filmStripInfoActors}>{current.actors}</span>
                    </>
                  )}
                  <span className={styles.filmStripInfoArrow}>&rsaquo;</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 日期选择条 */}
      <div className={styles.dateBar}>
        <div className={styles.dateScroll}>
          {dates.map((date, idx) => {
            const count = dateCounts[idx];
            return (
              <div
                key={date}
                className={`${styles.dateItem} ${activeDateIdx === idx ? styles.dateItemActive : ''} ${count === 0 ? styles.dateItemEmpty : ''}`}
                onClick={() => setActiveDateIdx(idx)}
              >
                <span className={styles.dateLabel}>{getDayLabel(date, idx)}</span>
                <span className={styles.dateNum}>{dayjs(date).format('MM/DD')}</span>
                {count > 0 && <span className={styles.dateCount}>{count}场</span>}
                {count === 0 && <span className={styles.dateNoData}>无排片</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 场次列表 - 新版 */}
      <div className={styles.showtimeNewList}>
        {!scheduleData ? (
          <div style={{ textAlign: 'center', padding: 60 }}><SpinLoading color="primary" /></div>
        ) : showtimes.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyText}>该日期暂无排片</div>
          </div>
        ) : (
          showtimes.map(item => {
            const isSoldOut = item.status === 'soldOut';
            const realPrice = Number(item.price);
            const endTime = String(item.endTime || '').substring(0, 5);
            const hallType = item.hallType || '2D';
            return (
              <div
                key={item.id}
                className={`${styles.showtimeNewCard} ${isSoldOut ? styles.showtimeSoldOut : ''}`}
                onClick={() => { if (!isSoldOut) guard(() => {
                  const params = new URLSearchParams({
                    filmName: film?.name || '',
                    filmDuration: String(film?.duration || ''),
                    filmType: film?.type || '',
                    startTime: String(item.startTime || ''),
                    endTime: String(item.endTime || ''),
                    hallType: item.hallType || '',
                    hallName: item.hallName || '',
                    date: dates[activeDateIdx],
                    filmId: String(selectedFilmId || ''),
                  });
                  // 把当前影院+日期的场次列表写入 sessionStorage，供选座页底部卡片展示
                  sessionStorage.setItem('seat_schedules', JSON.stringify(showtimes));
                  // 把影院 tags 带上，供退改签判断
                  if (cinema?.tags) sessionStorage.setItem('seat_cinemaTags', JSON.stringify(cinema.tags));
                  navigate(`/seat/${item.id}?${params.toString()}`);
                }); }}
              >
                <div className={styles.showtimeNewLeft}>
                  <div className={styles.showtimeNewTime}>
                    {String(item.startTime).substring(0, 5)}
                    {isSoldOut && <span className={styles.soldTag}>售罄</span>}
                  </div>
                  <div className={styles.showtimeNewHallRow}>
                    <span className={styles.hallTypeTag}>{hallType}</span>
                    <span className={styles.hallTypeText}>{item.hallName || ''}</span>
                  </div>
                  <div className={styles.showtimeNewEnd}>散场 {endTime}</div>
                </div>
                <div className={styles.showtimeNewRight}>
                  {!isSoldOut ? (
                    <>
                      <div className={styles.newPriceRow}>
                        <span className={styles.newPriceValue}>¥{realPrice}</span>
                      </div>
                      <div className={styles.buyNewBtn}>购票</div>
                    </>
                  ) : (
                    <div className={styles.showtimeSeats}>已售罄</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

// ========== 排序弹窗 ==========
const SortPopup: React.FC<{
  visible: boolean;
  onClose: () => void;
  currentSort: string;
  setCurrentSort: (v: string) => void;
  setSortType: (v: SortType) => void;
  onClosePopup: () => void;
}> = ({ visible, onClose, currentSort, setCurrentSort, setSortType, onClosePopup }) => {
  const handleSelect = (label: string, type: SortType) => {
    setCurrentSort(label);
    setSortType(type);
    onClosePopup();
  };

  return (
    <Popup visible={visible} onMaskClick={onClose} position="bottom">
      <div className={styles.sortPanel}>
        <div
          className={`${styles.sortItem} ${currentSort === '综合排序' ? styles.sortItemActive : ''}`}
          onClick={() => handleSelect('综合排序', 'composite')}
        >
          综合排序
        </div>
        <div
          className={`${styles.sortItem} ${currentSort === '离我最近' ? styles.sortItemActive : ''}`}
          onClick={() => handleSelect('离我最近', 'nearest')}
        >
          离我最近
        </div>
        <div
          className={`${styles.sortItem} ${currentSort === '价格最低' ? styles.sortItemActive : ''}`}
          onClick={() => handleSelect('价格最低', 'price')}
        >
          价格最低
        </div>
      </div>
    </Popup>
  );
};

export default ShowtimePage;
