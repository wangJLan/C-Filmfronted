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
import { NavBar, Popup, Slider, SpinLoading, SafeArea, Toast } from 'antd-mobile';
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
import {
  MOCK_BRANDS,
  MOCK_REGIONS,
} from '@/mock/home';
import dayjs from 'dayjs';
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

// Mock 小食数据
const MOCK_SNACKS = [
  { id: 1, emoji: '🍿', name: '64oz爆米花1桶+东方树叶1瓶/可口可乐1杯(2选1)', desc: '', price: 26, tag: '单人餐' },
  { id: 2, emoji: '🍟', name: '85oz爆米花桶+茶派2瓶/可口可乐2杯(2选1)', desc: '', price: 35, tag: '双人餐' },
  { id: 3, emoji: '🌭', name: '85oz抱抱爆米花+22oz可口可乐3瓶/500ml茶派3瓶(3选1)', desc: '', price: 39, tag: '多人餐' },
];

// 新人价 / 原价 辅助函数

// 为数据库影院补充的 Mock 字段
interface EnrichedCinema {
  id: number;
  name: string;
  address: string;
  distance: string;
  minPrice: number;
  tags: string[];
  services: string[];
  halls: string[];
  region: string;
  showtimeCount: number;
  showtimes: API.ScheduleVO[];
}

// 根据 cinemaId 生成稳定的 Mock 补充数据
function enrichCinema(id: number, name: string, address: string, tags: string, showtimes: API.ScheduleVO[]): EnrichedCinema {
  const minPrice = showtimes.length > 0
    ? Math.min(...showtimes.map(s => Number(s.price)))
    : 30 + (id % 20);

  const brandMatch = MOCK_BRANDS.find(b => name.includes(b.replace('影城', '')));
  const regionMatch = MOCK_REGIONS[id % MOCK_REGIONS.length];

  return {
    id,
    name,
    address,
    distance: `${(1.5 + (id % 10) * 0.8).toFixed(1)}km`,
    minPrice,
    tags: tags ? tags.split(',').filter(Boolean) : [],
    services: sortTags(['退票', '改签', '观影小食', ...(id % 3 === 0 ? ['影城卡'] : []), ...(id % 4 === 0 ? ['券包·4.5折起'] : [])]),
    halls: sortTags(showtimes.length > 0
      ? [...new Set(showtimes.map(s => s.hallType || ''))].filter(Boolean)
      : ['可停车']),
    region: regionMatch?.name || '未知',
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

  const isCinemaOnly = location.pathname.includes('/showtime/cinema/');
  const isFilmOnly = location.pathname.includes('/showtime/film/');
  const isDirect = !isCinemaOnly && !isFilmOnly;

  const directFilmId = isDirect ? Number(params.filmId) : undefined;
  const directCinemaId = isDirect ? Number(params.cinemaId) : undefined;

  const [selectedFilmId, setSelectedFilmId] = useState<number | null>(
    isFilmOnly ? Number(params.filmId) : isDirect ? directFilmId! : null,
  );
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(
    isCinemaOnly ? Number(params.cinemaId) : isDirect ? directCinemaId! : null,
  );

  // 影片详情
  const { data: film } = useQuery({
    queryKey: ['filmDetail', selectedFilmId],
    queryFn: () => selectedFilmId ? getFilm({ id: selectedFilmId }) : null,
    enabled: !!selectedFilmId,
  });

  // 场次列表（真实数据）
  const { data: scheduleRaw, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', selectedFilmId],
    queryFn: () => selectedFilmId ? listSchedule({ filmId: selectedFilmId }) : Promise.resolve([]),
    enabled: !!selectedFilmId,
  });

  // scheduleRaw 可能被包裹为 {data: [...]}, 统一转数组
  const scheduleList = useMemo(
    () => (Array.isArray(scheduleRaw) ? scheduleRaw : []) as any[],
    [scheduleRaw],
  );

  const cinemaIds = useMemo(() => [...new Set(scheduleList.map(s => s.cinemaId))], [scheduleList]);

  // 影院详情（真实数据，按当前城市过滤）
  const { data: cinemasRaw, isLoading: cinemasLoading } = useQuery({
    queryKey: ['cinemas', cinemaIds, cityName],
    queryFn: async () => {
      const results: { id: number; name: string; address: string; tags: string; city: string }[] = [];
      for (const cId of cinemaIds.slice(0, 20)) {
        try {
          const c = await http.get(`/cinema/getInfo/${cId}`) as any;
          results.push({
            id: Number(c.id),
            name: c.name || '',
            address: c.address || '',
            tags: c.tags || '',
            city: c.city || '未知',
          });
        } catch { /* skip */ }
      }
      return results;
    },
    enabled: cinemaIds.length > 0,
  });

  // 电影院列表 — 全部展示，不过滤城市
  const cityFilteredCinemas = cinemasRaw;

  const cinemasReady = !scheduleLoading && (cinemaIds.length === 0 || cinemasRaw !== undefined);

  // 当前选中影院（扩展 Mock 字段）
  const { data: cinema } = useQuery({
    queryKey: ['cinema', selectedCinemaId],
    queryFn: async () => {
      const c = await http.get(`/cinema/getInfo/${selectedCinemaId}`) as any;
      const id = Number(c.id);
      return {
        id,
        name: c.name || '',
        address: c.address || '',
        city: c.city || '',
        distance: `${(1.5 + (id % 10) * 0.8).toFixed(1)}km`,
        tags: (c.tags || '').split(',').filter(Boolean),
        services: sortTags(['退票', '改签', '观影小食', ...(id % 3 === 0 ? ['影城卡'] : []), ...(id % 4 === 0 ? ['券包·4.5折起'] : [])]),
        halls: ['可停车', ...(id % 2 === 0 ? ['充电'] : [])],
      };
    },
    enabled: !!selectedCinemaId,
  });

  // 影院全部排片（用于展示影院所有影片）
  const { data: cinemaFilms } = useQuery({
    queryKey: ['cinemaFilms', selectedCinemaId],
    queryFn: async () => {
      // 1. 从 schedule 表取该影院的所有排片 filmId
      const all: any[] = await listAll1();
      const cinemaSchedules = all.filter(s => String(s.cinemaId) === String(selectedCinemaId));
      if (cinemaSchedules.length === 0) return [];
      const scheduleFilmIds = new Set(cinemaSchedules.map(s => Number(s.filmId)).filter(Boolean));

      // 2. 从 film 表取所有 status=hot 的影片
      const hotRes: any = await listFilm({ filmQueryRequest: { status: 'hot', pageSize: 200 } });
      const hotFilms = (hotRes?.records || []).filter((f: any) => scheduleFilmIds.has(Number(f.id)));

      return hotFilms.map((f: any) => ({
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
  const [tabActive, setTabActive] = useState<'showtime' | 'snack'>('showtime');

  // 横向影片列表
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeStripFilmId, setActiveStripFilmId] = useState<number | null>(selectedFilmId);

  // 切换影片（点击影片海报后自动滚动到中间）
  const handleStripFilmClick = (fid: number) => {
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
  const [screenPanelVisible, setScreenPanelVisible] = useState(false);
  const [brandPanelVisible, setBrandPanelVisible] = useState(false);
  const [sortPanelVisible, setSortPanelVisible] = useState(false);
  const [sortType, setSortType] = useState<SortType>('composite');
  const [currentSort, setCurrentSort] = useState('综合排序');

  const cityName = locationStore.city || '全城';

  const isPast = (showDate: string, startTime: string) => {
    const dt = `${showDate}T${startTime}`;
    return new Date(dt).getTime() < Date.now();
  };

  // 合并真实场次 + Mock 补充字段的影院列表
  const enrichedCinemas = useMemo(() => {
    if (!cityFilteredCinemas || !scheduleList) return [];
    return cityFilteredCinemas.map(c => {
      const cShowtimes = scheduleList.filter(s => String(s.cinemaId) === String(c.id));
      return enrichCinema(c.id, c.name, c.address, c.tags, cShowtimes);
    });
  }, [cityFilteredCinemas, scheduleList]);

  // 筛选后的影院列表
  const filteredCinemas = useMemo(() => {
    let list = [...enrichedCinemas];

    if (screenFilter.length > 0) {
      list = list.filter(c =>
        screenFilter.some(s => c.halls.includes(s) || c.services.some(svc => svc.includes(s)))
      );
    }

    if (brandFilter.length > 0) {
      list = list.filter(c => brandFilter.some(b => c.name.includes(b.replace('影城', ''))));
    }

    list = list.filter(c => c.minPrice >= priceRange[0] && c.minPrice <= priceRange[1]);

    if (sortType === 'price') {
      list.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortType === 'nearest') {
      list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }

    return list;
  }, [enrichedCinemas, screenFilter, brandFilter, priceRange, sortType]);

  // 当前日期+影院的场次
  const showtimes = useMemo(() => {
    if (!scheduleList) return [];
    const cid = selectedCinemaId;
    if (!cid) return [];
    return scheduleList.filter(s =>
      String(s.cinemaId) === String(cid) &&
      s.showDate === dates[activeDateIdx] &&
      !isPast(s.showDate!, s.startTime!)
    );
  }, [scheduleList, selectedCinemaId, dates, activeDateIdx]);

  const dateCounts = useMemo(() => {
    if (!scheduleList) return dates.map(() => 0);
    const cid = selectedCinemaId;
    if (!cid) return dates.map(() => 0);
    return dates.map(d => scheduleList.filter(s =>
      String(s.cinemaId) === String(cid) && s.showDate === d && !isPast(s.showDate!, s.startTime!)
    ).length);
  }, [scheduleList, selectedCinemaId, dates]);

  const toggleArrayItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const clearFilters = () => {
    setScreenFilter([]);
    setBrandFilter([]);
    setPriceRange([0, 200]);
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

        {/* 筛选条 */}
        <div className={styles.filterBar}>
          <div className={styles.filterItem} onClick={() => navigate('/city-picker')}>
            <span className={styles.filterText}>{cityName}</span>
            <DownOutline fontSize={10} />
          </div>
          <div
            className={`${styles.filterItem} ${hasActiveFilters ? styles.filterActive : ''}`}
            onClick={() => setScreenPanelVisible(true)}
          >
            <FilterOutline fontSize={12} />
            <span className={styles.filterText}>筛选</span>
          </div>
          <div
            className={`${styles.filterItem} ${brandFilter.length > 0 ? styles.filterActive : ''}`}
            onClick={() => setBrandPanelVisible(true)}
          >
            <span className={styles.filterText}>品牌</span>
          </div>
          <div className={styles.filterItem} onClick={() => setSortPanelVisible(true)}>
            <span className={styles.filterText}>{currentSort}</span>
            <DownOutline fontSize={10} />
          </div>
          <div className={styles.filterItem} onClick={() => navigate('/search')}>
            <SearchOutline fontSize={14} />
          </div>
        </div>

        {/* 影厅快捷标签 — 从真实排片中提取 */}
        {(() => {
          const hallTypes = [...new Set((scheduleList || []).map(s => s.hallType || '').filter(Boolean))];
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
              <div className={styles.emptyText}>暂无符合条件的影院</div>
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
                    {c.services.map(svc => (
                      <span key={svc} className={`${styles.serviceTag} ${styles[getTagColor(svc)]}`}>{svc}</span>
                    ))}
                    {c.halls.map(h => (
                      <span key={h} className={`${styles.hallBadge} ${styles[getTagColor(h)]}`}>{h}</span>
                    ))}
                    {c.showtimeCount > 0 && <span className={`${styles.serviceTag} ${styles.tagGray}`}>共 {c.showtimeCount} 场</span>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 筛选 Popup */}
        <FilterPopup
          visible={screenPanelVisible}
          onClose={() => setScreenPanelVisible(false)}
          screenFilter={screenFilter}
          setScreenFilter={setScreenFilter}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          onClear={clearFilters}
          hallTypes={[...new Set((scheduleList || []).map(s => s.hallType || '').filter(Boolean))]}
        />
        <BrandPopup
          visible={brandPanelVisible}
          onClose={() => setBrandPanelVisible(false)}
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
        />
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

  // ===== cinemaOnly 模式：先选影片 =====
  if (isCinemaOnly && !selectedFilmId) {
    const filmIds = [...new Set((scheduleList || []).map(s => s.filmId))].filter(Boolean) as number[];
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选择影片</NavBar>
        <div className={styles.infoHead}>
          <div className={styles.cinemaNameText}>{cinema?.name}</div>
        </div>
        {!scheduleList ? (
          <div style={{ textAlign: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
        ) : filmIds.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>该影院暂无排片</div>
          </div>
        ) : (
          <div className={styles.filmList}>
            {filmIds.map(fid => {
              const sch = scheduleList!.find(s => s.filmId === fid)!;
              return (
                <div key={fid} className={styles.filmCardRow} onClick={() => { setSelectedFilmId(fid); setActiveDateIdx(0); }}>
                  <img src={sch.filmPoster} alt={sch.filmName} className={styles.filmCardPoster} />
                  <div className={styles.filmCardInfo}>
                    <div className={styles.filmCardTitle}>{sch.filmName}</div>
                    <div className={styles.filmCardMeta}>⭐ {sch.filmRating} · {sch.filmType}</div>
                    <div className={styles.filmCardPick}>选场次 ›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        <span onClick={() => selectedCinemaId && navigate(`/cinema-detail/${selectedCinemaId}`)} style={{ cursor: 'pointer' }}>{cinema?.name || '选影院'}</span>
      </NavBar>

      {/* 影院详情头部 */}
      <div className={styles.cinemaDetailHeader}>
        <div className={styles.cinemaHeaderTitle} onClick={() => selectedCinemaId && navigate(`/cinema-detail/${selectedCinemaId}`)} style={{ cursor: 'pointer' }}>{cinema?.name || '影院详情'}</div>
        <div className={styles.cinemaHeaderAddr}>
          <span className={styles.addrText}>{cinema?.address || '暂无地址'}</span>
          <span className={styles.addrDistance}>{cinema?.distance || '--km'}</span>
        </div>
        <div className={styles.cinemaHeaderTags}>
          {(cinema?.services || []).map((svc: string, idx: number) => (
            <span key={idx} className={`${styles.cHeaderTag} ${getTagColor(svc) === 'tagRed' ? styles.cHeaderTagRed : styles.cHeaderTagGray}`} onClick={() => selectedCinemaId && navigate(`/cinema-detail/${selectedCinemaId}`)}>{svc}</span>
          ))}
          {(cinema?.halls || []).map((h: string, idx: number) => (
            <span key={`h-${idx}`} className={`${styles.cHeaderTag} ${styles.cHeaderTagGray}`} onClick={() => selectedCinemaId && navigate(`/cinema-detail/${selectedCinemaId}`)}>{h}</span>
          ))}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className={styles.tabSwitch}>
        <div
          className={`${styles.tabItem} ${tabActive === 'showtime' ? styles.tabItemActive : ''}`}
          onClick={() => setTabActive('showtime')}
        >
          选场次
        </div>
        <div
          className={`${styles.tabItem} ${tabActive === 'snack' ? styles.tabItemActive : ''}`}
          onClick={() => setTabActive('snack')}
        >
          买小食
        </div>
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

      {tabActive === 'showtime' ? (
        <>
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
            {!scheduleList ? (
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
                      });
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
        </>
      ) : (
        /* 小食区 */
        <div className={styles.snackSection}>
          <div className={styles.snackTitle}>美味小食等你哦</div>
          {MOCK_SNACKS.map(snack => (
            <div key={snack.id} className={styles.snackItem}>
              <div className={styles.snackItemPoster}>{snack.emoji}</div>
              <div className={styles.snackItemInfo}>
                <div className={styles.snackItemName}>{snack.tag}</div>
                <div className={styles.snackItemDesc}>{snack.name}</div>
                <div className={styles.snackItemBottom}>
                  <span className={styles.snackItemPrice}>¥{snack.price}</span>
                  <span className={styles.snackItemBuy}>购买</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SafeArea position="bottom" />
    </div>
  );
};

// ========== 筛选弹窗 ==========
const FilterPopup: React.FC<{
  visible: boolean;
  onClose: () => void;
  screenFilter: string[];
  setScreenFilter: (v: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  onClear: () => void;
  hallTypes: string[];
}> = ({ visible, onClose, screenFilter, setScreenFilter, priceRange, setPriceRange, onClear, hallTypes }) => {
  const toggle = (item: string) => {
    if (screenFilter.includes(item)) {
      setScreenFilter(screenFilter.filter(i => i !== item));
    } else {
      setScreenFilter([...screenFilter, item]);
    }
  };

  return (
    <Popup visible={visible} onMaskClick={onClose} position="bottom" bodyStyle={{ maxHeight: '80vh' }}>
      <div className={styles.filterPanel}>
        <div className={styles.filterPanelTitle}>
          <span>筛选</span>
          <span className={styles.filterClose} onClick={onClose}>✕</span>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterSectionTitle}>价格区间</div>
          <div className={styles.timeRange}>
            <span>¥{priceRange[0]}</span>
            <Slider
              value={priceRange}
              onChange={(v) => setPriceRange(v as [number, number])}
              min={0}
              max={200}
            />
            <span>¥{priceRange[1]}</span>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterSectionTitle}>放映影厅</div>
          <div className={styles.screenGrid}>
            {hallTypes.map(screen => (
              <span
                key={screen}
                className={`${styles.screenItem} ${screenFilter.includes(screen) ? styles.screenItemActive : ''}`}
                onClick={() => toggle(screen)}
              >
                {screen}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterSectionTitle}>影院服务</div>
          <div className={styles.screenGrid}>
            {['可停车', '退票', '改签', '观影小食', 'VIP厅', '艺术影厅'].map(svc => (
              <span key={svc} className={styles.screenItem}>{svc}</span>
            ))}
          </div>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.filterClear} onClick={onClear}>清空</button>
          <button className={styles.filterConfirm} onClick={onClose}>完成</button>
        </div>
      </div>
    </Popup>
  );
};

// ========== 品牌弹窗 ==========
const BrandPopup: React.FC<{
  visible: boolean;
  onClose: () => void;
  brandFilter: string[];
  setBrandFilter: (v: string[]) => void;
}> = ({ visible, onClose, brandFilter, setBrandFilter }) => {
  const toggle = (item: string) => {
    if (brandFilter.includes(item)) {
      setBrandFilter(brandFilter.filter(i => i !== item));
    } else {
      setBrandFilter([...brandFilter, item]);
    }
  };

  return (
    <Popup visible={visible} onMaskClick={onClose} position="bottom" bodyStyle={{ maxHeight: '70vh' }}>
      <div className={styles.filterPanel}>
        <div className={styles.filterPanelTitle}>
          <span>品牌</span>
          <span className={styles.filterClose} onClick={onClose}>✕</span>
        </div>
        <div className={styles.screenGrid}>
          {MOCK_BRANDS.map(brand => (
            <span
              key={brand}
              className={`${styles.screenItem} ${brandFilter.includes(brand) ? styles.screenItemActive : ''}`}
              onClick={() => toggle(brand)}
            >
              {brand}
            </span>
          ))}
        </div>
        <div className={styles.filterActions}>
          <button className={styles.filterClear} onClick={() => setBrandFilter([])}>清空</button>
          <button className={styles.filterConfirm} onClick={onClose}>完成</button>
        </div>
      </div>
    </Popup>
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