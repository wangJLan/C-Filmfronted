import React, { useState, useMemo } from 'react';
import { useNavigate } from 'umi';
import { SpinLoading } from 'antd-mobile';
import { useQuery } from '@tanstack/react-query';
import { useLocationStore } from '@/stores/useLocationStore';
import { list4 as listCinemas, filterCinemas } from '@/api/cinemaController';
import { MOCK_BRANDS, MOCK_REGIONS } from '@/mock/home';
import styles from './index.module.less';

function getTagColor(tag: string): string {
  const t = tag.toLowerCase();
  if (/特权|专属|vip|影城卡|券|新人|限时|折扣|优惠/.test(tag)) return 'tagRed';
  if (/退票|改签/.test(tag)) return 'tagBlue';
  if (/停车/.test(tag)) return 'tagGreen';
  return 'tagGray';
}

function sortTags(tags: string[]): string[] {
  const priority: Record<string, number> = {
    tagRed: 0, tagBlue: 1, tagGray: 2, tagOrange: 3, tagGreen: 4,
  };
  return [...tags].sort((a, b) => priority[getTagColor(a)] - priority[getTagColor(b)]);
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

type SortType = 'composite' | 'nearest' | 'price';
type PanelType = 'area' | 'filter' | 'brand' | 'sort' | null;

const SORT_LABELS: Record<SortType, string> = {
  composite: '综合排序',
  nearest: '距离最近',
  price: '价格最低',
};

const SERVICE_TYPES = ['退票', '改签', '3D眼镜收费', '观影小食', '可停车', '全真皮沙发座椅', '轮椅友好影院'];

function matchDistrict(address: string): string | null {
  if (!address) return null;
  for (const r of MOCK_REGIONS) {
    if (address.includes(r.name)) return r.name;
  }
  return null;
}

function transformCinema(c: any, userLat: number, userLng: number) {
  // 雪花 ID 超出 JS Number 精度，必须保持字符串（导航/跳转用精确 ID）
  const id = String(c.id);
  const tags: string[] = c.tags ? c.tags.split(',').filter(Boolean) : [];
  const minPrice = c.basePrice ?? (30 + ((Number(c.id) || 0) % 20));
  // 优先使用后端通过高德API返回的距离（米），与AI选影院结果一致
  const backendDist = c.distance != null ? Number(c.distance) : null;
  const dist = backendDist != null
    ? backendDist / 1000 // 米转千米用于 distNum 排序
    : (c.longitude != null && c.latitude != null)
      ? calcDistance(userLat, userLng, c.latitude, c.longitude)
      : null;
  const distance = backendDist != null
    ? backendDist < 1000 ? `${backendDist}m` : `${(backendDist / 1000).toFixed(1)}km`
    : dist != null
      ? dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
      : null;
  const distNum = dist ?? 999;
  const district = matchDistrict(c.address || '');
  return { id, name: c.name || '', address: c.address || '', city: c.city || '未知', tags, distance, distNum, minPrice, district };
}

const CinemaPage: React.FC = () => {
  const { city, lat: userLat, lng: userLng } = useLocationStore();
  const navigate = useNavigate();

  const [sortType, setSortType] = useState<SortType>('composite');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // 全量影院（仅用于区域计数，缓存 5 分钟）
  const { data: allCinemas } = useQuery({
    queryKey: ['cinemaAll'],
    queryFn: async () => {
      const raw: any = await listCinemas();
      return (raw?.data ?? raw ?? []) as any[];
    },
    staleTime: 300000,
  });

  // 后端筛选
  const activeBrand = brandFilter.length > 0 ? brandFilter.join(',') : undefined;
  const { data: cinemas, isLoading } = useQuery({
    queryKey: ['cinemaFilter', submittedKeyword, activeBrand, activeDistrict, serviceFilter.join(','), sortType],
    queryFn: async () => {
      const raw: any = await filterCinemas({
        keyword: submittedKeyword || undefined,
        brand: activeBrand,
        district: activeDistrict ?? undefined,
        services: serviceFilter.length > 0 ? serviceFilter : undefined,
        sortType,
        userLat: userLat || undefined,
        userLng: userLng || undefined,
      });
      const list: any[] = raw?.data ?? raw ?? [];
      return list.map((c: any) => transformCinema(c, userLat, userLng));
    },
    staleTime: 30000,
  });

  const districtCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (allCinemas ?? []).forEach((c: any) => {
      const d = matchDistrict(c.address || '');
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [allCinemas]);

  const totalCount = (allCinemas ?? []).length;

  const togglePanel = (panel: PanelType) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const toggleArray = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const hasFilterActive = serviceFilter.length > 0;
  const hasBrandActive = brandFilter.length > 0;

  return (
    <div className={styles.page}>
      {/* 顶部筛选栏 — sticky */}
      <div className={styles.topbar}>
        {/* 搜索模式 */}
        {searchMode ? (
          <div className={styles.searchBar}>
            <svg className={styles.iconSearch} viewBox="0 0 96 96"><path d="M46.3 8c21.2 0 38.3 17.1 38.3 38.3 0 9.7-3.6 18.5-9.5 25.2l12.1 12.1c1 1 1 2.6 0 3.6s-2.6 1-3.6 0l-12-12.1C64.8 81 56 84.6 46.3 84.6 25.1 84.6 8 67.5 8 46.3S25.1 8 46.3 8zm0 6C28.5 14 14 28.5 14 46.3s14.4 32.3 32.3 32.3 32.3-14.4 32.3-32.3S64.1 14 46.3 14z" /></svg>
            <input
              ref={searchInputRef}
              className={styles.searchInput}
              placeholder="搜索影院名称"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSubmittedKeyword(e.currentTarget.value); e.currentTarget.blur(); } }}
            />
            <span
              className={styles.searchCancel}
              onClick={() => { setSearchMode(false); setSearchKeyword(''); setSubmittedKeyword(''); }}
            >
              取消
            </span>
          </div>
        ) : (
        <>
        <div className={styles.topbarContainer}>
          <div
            className={`${styles.topbarSelector} ${activeDistrict ? styles.topbarSelectorActive : ''}`}
            onClick={() => togglePanel('area')}
          >
            <span className={styles.selectorValue}>{activeDistrict ? `${city}·${activeDistrict}` : `${city}全城`}</span>
            <svg className={styles.arrowDown} viewBox="0 0 96 96"><path d="M50 58.1c-.1.2-.3.3-.5.5-1.1.8-2.6.6-3.4-.5L32.5 40.8c-.3-.4-.5-.9-.5-1.4 0-1.3 1.1-2.4 2.5-2.4h27.1c.5 0 1.1.2 1.5.5 1.1.8 1.3 2.3.5 3.3L50 58.1z" /></svg>
          </div>
          <div
            className={`${styles.topbarSelector} ${hasFilterActive ? styles.topbarSelectorActive : ''}`}
            onClick={() => togglePanel('filter')}
          >
            <span className={styles.selectorValue}>筛选</span>
            <svg className={styles.arrowDown} viewBox="0 0 96 96"><path d="M50 58.1c-.1.2-.3.3-.5.5-1.1.8-2.6.6-3.4-.5L32.5 40.8c-.3-.4-.5-.9-.5-1.4 0-1.3 1.1-2.4 2.5-2.4h27.1c.5 0 1.1.2 1.5.5 1.1.8 1.3 2.3.5 3.3L50 58.1z" /></svg>
          </div>
          <div
            className={`${styles.topbarSelector} ${hasBrandActive ? styles.topbarSelectorActive : ''}`}
            onClick={() => togglePanel('brand')}
          >
            <span className={styles.selectorValue}>品牌</span>
            <svg className={styles.arrowDown} viewBox="0 0 96 96"><path d="M50 58.1c-.1.2-.3.3-.5.5-1.1.8-2.6.6-3.4-.5L32.5 40.8c-.3-.4-.5-.9-.5-1.4 0-1.3 1.1-2.4 2.5-2.4h27.1c.5 0 1.1.2 1.5.5 1.1.8 1.3 2.3.5 3.3L50 58.1z" /></svg>
          </div>
          <div className={styles.topbarRight}>
            <div
              className={`${styles.topbarSelector} ${sortType !== 'composite' ? styles.topbarSelectorActive : ''}`}
              onClick={() => togglePanel('sort')}
            >
              <span className={styles.selectorValue}>{SORT_LABELS[sortType]}</span>
              <svg className={styles.arrowDown} viewBox="0 0 96 96"><path d="M50 58.1c-.1.2-.3.3-.5.5-1.1.8-2.6.6-3.4-.5L32.5 40.8c-.3-.4-.5-.9-.5-1.4 0-1.3 1.1-2.4 2.5-2.4h27.1c.5 0 1.1.2 1.5.5 1.1.8 1.3 2.3.5 3.3L50 58.1z" /></svg>
            </div>
            <div className={styles.topbarSelector} onClick={() => { setSearchMode(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}>
              <svg className={styles.iconSearch} viewBox="0 0 96 96"><path d="M46.3 8c21.2 0 38.3 17.1 38.3 38.3 0 9.7-3.6 18.5-9.5 25.2l12.1 12.1c1 1 1 2.6 0 3.6s-2.6 1-3.6 0l-12-12.1C64.8 81 56 84.6 46.3 84.6 25.1 84.6 8 67.5 8 46.3S25.1 8 46.3 8zm0 6C28.5 14 14 28.5 14 46.3s14.4 32.3 32.3 32.3 32.3-14.4 32.3-32.3S64.1 14 46.3 14z" /></svg>
            </div>
          </div>
        </div>

        {/* 区域选择面板 — 自然流，撑开内容 */}
        {activePanel === 'area' && (
          <div className={styles.areaPanel}>
            <div className={styles.citySwitcher}>
              <span className={styles.cityLeft}>当前城市：{city}</span>
              <span className={styles.cityRight} onClick={() => navigate('/city-picker')}>
                切换城市<svg className={styles.cityArrowIcon} viewBox="0 0 96 96"><path d="M55.1 48 32.3 26.9c-1.6-1.5-1.7-4-.2-5.7 1.5-1.6 4-1.7 5.7-.2l26 24c1.7 1.6 1.7 4.3 0 5.9l-26 24c-1.6 1.5-4.2 1.4-5.7-.2-1.5-1.6-1.4-4.2.2-5.7l22.8-21z" /></svg>
              </span>
            </div>
            <div className={styles.districtList}>
              <div
                className={`${styles.filterItem} ${activeDistrict === null ? styles.filterItemActive : ''}`}
                onClick={() => { setActiveDistrict(null); setActivePanel(null); }}
              >
                <span className={styles.filterItemName}>全部</span>
                <span className={styles.filterItemCount}>{totalCount}</span>
              </div>
              {MOCK_REGIONS.filter(r => districtCounts[r.name] > 0).map(r => (
                <div
                  key={r.name}
                  className={`${styles.filterItem} ${activeDistrict === r.name ? styles.filterItemActive : ''}`}
                  onClick={() => { setActiveDistrict(r.name); setActivePanel(null); }}
                >
                  <span className={styles.filterItemName}>{r.name}</span>
                  <span className={styles.filterItemCount}>{districtCounts[r.name]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 筛选/品牌/排序面板 — 浮动下拉 */}
        {(activePanel === 'filter' || activePanel === 'brand' || activePanel === 'sort') && (
          <div className={styles.panelDropdown}>
            {activePanel === 'filter' && (
              <div className={styles.panelContent}>
                <div className={styles.filterSection}>
                  <div className={styles.filterSectionTitle}>影院服务</div>
                  <div className={styles.filterGrid}>
                    {SERVICE_TYPES.map(s => (
                      <span
                        key={s}
                        className={`${styles.filterChip} ${serviceFilter.includes(s) ? styles.filterChipActive : ''}`}
                        onClick={() => toggleArray(serviceFilter, setServiceFilter, s)}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={styles.filterActions}>
                  <button className={styles.filterClear} onClick={() => { setServiceFilter([]); }}>清空</button>
                  <button className={styles.filterConfirm} onClick={() => setActivePanel(null)}>完成</button>
                </div>
              </div>
            )}

            {activePanel === 'brand' && (
              <div className={styles.panelContent}>
                <div className={styles.filterGrid}>
                  {MOCK_BRANDS.map(b => (
                    <span
                      key={b}
                      className={`${styles.filterChip} ${brandFilter.includes(b) ? styles.filterChipActive : ''}`}
                      onClick={() => toggleArray(brandFilter, setBrandFilter, b)}
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

            {activePanel === 'sort' && (
              <div className={styles.panelContent}>
                {(Object.entries(SORT_LABELS) as [SortType, string][]).map(([key, label]) => (
                  <div
                    key={key}
                    className={`${styles.sortItem} ${sortType === key ? styles.sortItemActive : ''}`}
                    onClick={() => { setSortType(key); setActivePanel(null); }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>

      {/* 遮罩层 */}
      {activePanel && <div className={styles.overlay} onClick={() => setActivePanel(null)} />}

      {/* 影院列表 */}
      <div className={styles.list}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><SpinLoading color="primary" /></div>
        ) : (cinemas ?? []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 14 }}>
            暂无符合条件的影院
          </div>
        ) : (
          (cinemas ?? []).map((cinema: any) => (
            <div
              key={cinema.id}
              className={styles.cinemaCard}
              onClick={() => navigate(`/showtime/cinema/${cinema.id}`)}
            >
              <div className={styles.cinemaHeader}>
                <div className={styles.cinemaTitle}>{cinema.name}</div>
                <div className={styles.cinemaPrice}>
                  <span className={styles.priceSymbol}>¥</span>
                  <span className={styles.priceValue}>{cinema.minPrice}</span>
                  <span className={styles.priceSuffix}>起</span>
                </div>
              </div>
              <div className={styles.cinemaAddrRow}>
                <div className={styles.cinemaAddr}>{cinema.address}</div>
                {cinema.distance && <span className={styles.cinemaDistance}>{cinema.distance}</span>}
              </div>
              {cinema.tags.length > 0 && (
                <div className={styles.cinemaInfoRow}>
                  {sortTags(cinema.tags).map((tag: string, idx: number) => (
                    <span key={`tag-${idx}`} className={`${styles.serviceTag} ${styles[getTagColor(tag)]}`}>{tag}</span>
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

export default CinemaPage;
