/**
 * 影院场次页 — 保留数据库真实数据 + 新增筛选 UI
 *
 * 数据来源：
 *   - 场次列表：GET /schedule/list?filmId=  （真实数据）
 *   - 影院详情：GET /cinema/getInfo/{id}    （真实数据）
 *   - 影厅类型/品牌/服务标签：Mock           （数据库无此字段）
 */
import React, { useState, useMemo } from 'react';
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
import { listSchedule } from '@/api/scheduleController';
import http from '@/services/request';
import { useAiStore } from '@/stores/useAiStore';
import { useGuard } from '@/hooks/useGuard';
import { useLocationStore } from '@/stores/useLocationStore';
import {
  MOCK_SCREEN_TYPES,
  MOCK_BRANDS,
  MOCK_REGIONS,
} from '@/mock/home';
import dayjs from 'dayjs';
import styles from './index.module.less';

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
    services: ['退票', '改签', '观影小食', ...(id % 3 === 0 ? ['影城卡'] : []), ...(id % 4 === 0 ? ['券包·4.5折起'] : [])],
    halls: showtimes.length > 0
      ? [...new Set(showtimes.map(s => s.hallType || ''))].filter(Boolean)
      : ['可停车'],
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
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['schedule', selectedFilmId],
    queryFn: () => selectedFilmId ? listSchedule({ filmId: selectedFilmId }) : Promise.resolve([]),
    enabled: !!selectedFilmId,
  });

  const cinemaIds = useMemo(() => [...new Set((scheduleData || []).map(s => s.cinemaId))].filter(Boolean) as number[], [scheduleData]);

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
      return { id: c.id, name: c.name, address: c.address || '', tags: (c.tags || '').split(',').filter(Boolean) };
    },
    enabled: !!selectedCinemaId && !isFilmOnly,
  });

  const dates = useMemo(() => buildDates(), []);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

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
    if (!cityFilteredCinemas || !scheduleData) return [];
    return cityFilteredCinemas.map(c => {
      const cShowtimes = scheduleData.filter(s => String(s.cinemaId) === String(c.id));
      return enrichCinema(c.id, c.name, c.address, c.tags, cShowtimes);
    });
  }, [cityFilteredCinemas, scheduleData]);

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

        {/* 影厅快捷标签 */}
        <div className={styles.hallBar}>
          {['特殊场', ...MOCK_SCREEN_TYPES.slice(0, 5)].map(type => (
            <span
              key={type}
              className={`${styles.hallTag} ${screenFilter.includes(type) ? styles.hallTagActive : ''}`}
              onClick={() => toggleArrayItem(screenFilter, setScreenFilter, type)}
            >
              {type}
            </span>
          ))}
        </div>

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
                      新人<span className={styles.priceSymbol}>¥</span>
                      <span className={styles.priceValue}>{c.minPrice}</span>
                      <span className={styles.priceSuffix}>起</span>
                    </div>
                  </div>
                  <div className={styles.cinemaAddr}>{c.address}</div>
                  <div className={styles.cinemaInfoRow}>
                    <span className={styles.cinemaDistance}>{c.distance}</span>
                    <div className={styles.cinemaServices}>
                      {c.services.slice(0, 4).map(svc => (
                        <span key={svc} className={styles.serviceTag}>{svc}</span>
                      ))}
                      {c.showtimeCount > 0 && <span className={styles.serviceTag}>共 {c.showtimeCount} 场</span>}
                    </div>
                  </div>
                  {c.halls.length > 0 && (
                    <div className={styles.cinemaHalls}>
                      {c.halls.map(h => (
                        <span key={h} className={styles.hallBadge}>{h}</span>
                      ))}
                    </div>
                  )}
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
    const filmIds = [...new Set((scheduleData || []).map(s => s.filmId))].filter(Boolean) as number[];
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选择影片</NavBar>
        <div className={styles.infoHead}>
          <div className={styles.cinemaNameText}>{cinema?.name}</div>
        </div>
        {!scheduleData ? (
          <div style={{ textAlign: 'center', padding: 40 }}><SpinLoading color="primary" /></div>
        ) : filmIds.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>该影院暂无排片</div>
          </div>
        ) : (
          <div className={styles.filmList}>
            {filmIds.map(fid => {
              const sch = scheduleData!.find(s => s.filmId === fid)!;
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

  // ===== 两者已选定：展示场次 =====
  return (
    <div className={styles.page}>
      <NavBar
        onBack={() => navigate(-1)}
        back={<LeftOutline />}
        right={<span className={styles.aiBtn} onClick={handleAiHelp}>AI 推荐</span>}
      >
        选场次
      </NavBar>

      <div className={styles.infoHead}>
        <div className={styles.filmTitle}>{film?.name || '选影片'}</div>
        <div className={styles.cinemaNameText}>{cinema?.name || '选影院'}</div>
        {isCinemaOnly && (
          <div className={styles.filmSwitch}>
            {(scheduleData || []).map(s => (
              <span
                key={s.filmId}
                className={`${styles.filmSwitchChip} ${s.filmId === selectedFilmId ? styles.filmSwitchChipActive : ''}`}
                onClick={() => { setSelectedFilmId(s.filmId!); setActiveDateIdx(0); }}
              >
                {s.filmName}
              </span>
            ))}
          </div>
        )}
        {isFilmOnly && enrichedCinemas.length > 0 && (
          <div className={styles.filmSwitch}>
            {enrichedCinemas.map(c => (
              <span
                key={c.id}
                className={`${styles.filmSwitchChip} ${c.id === selectedCinemaId ? styles.filmSwitchChipActive : ''}`}
                onClick={() => { setSelectedCinemaId(c.id); setActiveDateIdx(0); }}
              >
                {c.name.split('(')[0]}
              </span>
            ))}
          </div>
        )}
      </div>

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

      {/* 场次列表 */}
      <div className={styles.showtimeListSection}>
        {!scheduleData ? (
          <div style={{ textAlign: 'center', padding: 60 }}><SpinLoading color="primary" /></div>
        ) : showtimes.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyText}>该日期暂无排片</div>
          </div>
        ) : (
          <>
            <div className={styles.listHeader}>共 <strong>{showtimes.length}</strong> 个场次 · {dayjs(dates[activeDateIdx]).format('M月D日')}</div>
            {showtimes.map(item => {
              const isSoldOut = item.status === 'soldOut';
              return (
                <div
                  key={item.id}
                  className={`${styles.showtimeCard} ${isSoldOut ? styles.showtimeSoldOut : ''}`}
                  onClick={() => { if (!isSoldOut) guard(() => navigate(`/seat/${item.id}`)); }}
                >
                  <div className={styles.showtimeLeft}>
                    <div className={styles.showtimeTime}>
                      {String(item.startTime).substring(0, 5)}
                      {isSoldOut && <span className={styles.soldTag}>售罄</span>}
                    </div>
                    <div className={styles.showtimeHall}>{item.hallName} · {item.hallType}</div>
                    <div className={styles.showtimeEnd}>散场 {String(item.endTime).substring(0, 5)}</div>
                  </div>
                  <div className={styles.showtimeRight}>
                    <div className={styles.showtimePrice}>
                      <span className={styles.priceSymbol}>¥</span>
                      <span className={styles.priceValue}>{item.price}</span>
                    </div>
                    <div className={`${styles.showtimeSeats} ${isSoldOut ? styles.seatsZero : ''}`}>
                      {isSoldOut ? '已售罄' : `${item.hallRowCount}×${item.hallColCount}座`}
                    </div>
                    <div className={styles.showtimeBuyBtn}>购票</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

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
}> = ({ visible, onClose, screenFilter, setScreenFilter, priceRange, setPriceRange, onClear }) => {
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
            {MOCK_SCREEN_TYPES.map(screen => (
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