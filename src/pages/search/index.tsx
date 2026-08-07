import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'umi';
import { NavBar, SearchBar, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { search } from '@/api/filmController';
import { filterCinemas } from '@/api/cinemaController';
import { useLocationStore } from '@/stores/useLocationStore';
import FilmCard from '@/components/FilmCard/index';
import styles from './index.module.less';

function getTagColor(tag: string): string {
  const t = tag.toLowerCase();
  if (/特权|专属|vip|影城卡|券|新人|限时|折扣|优惠/.test(tag)) return 'tagRed';
  if (/退票|改签/.test(tag)) return 'tagBlue';
  if (/停车/.test(tag)) return 'tagGreen';
  return 'tagGray';
}

function sortTags(tags: string[]): string[] {
  const priority: Record<string, number> = { tagRed: 0, tagBlue: 1, tagGray: 2, tagOrange: 3, tagGreen: 4 };
  return [...tags].sort((a, b) => (priority[getTagColor(a)] ?? 2) - (priority[getTagColor(b)] ?? 2));
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get('keyword') || '';
  const [keyword, setKeyword] = useState(initialKeyword);
  const { lat: userLat, lng: userLng } = useLocationStore();

  const { data: filmData, isLoading: filmLoading } = useQuery({
    queryKey: ['filmSearch', keyword],
    queryFn: () => search({ keyword, pageSize: 50 }),
    staleTime: 30000,
    enabled: keyword.length > 0,
  });

  const { data: cinemaList, isLoading: cinemaLoading } = useQuery({
    queryKey: ['cinemaSearch', keyword],
    queryFn: async () => {
      const raw: any = await filterCinemas({
        keyword: keyword || undefined,
        userLat: userLat || undefined,
        userLng: userLng || undefined,
      });
      const list: any[] = raw?.data ?? raw ?? [];
      return list.map((c: any) => {
        const tags: string[] = c.tags ? c.tags.split(',').filter(Boolean) : [];
        const minPrice = c.basePrice ?? (30 + ((Number(c.id) || 0) % 20));
        const dist = c.distance != null ? Number(c.distance) : null;
        const distance = dist != null
          ? dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`
          : null;
        return { id: String(c.id), name: c.name || '', address: c.address || '', tags, minPrice, distance };
      });
    },
    staleTime: 30000,
    enabled: keyword.length > 0,
  });

  const films = filmData?.records || [];
  const cinemas = cinemaList || [];
  const isLoading = filmLoading || cinemaLoading;
  const hasResults = films.length > 0 || cinemas.length > 0;

  const handleSearch = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      setKeyword(trimmed);
      setSearchParams(trimmed ? { keyword: trimmed } : {});
    },
    [setSearchParams],
  );

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>搜索</NavBar>

      <div className={styles.searchRow}>
        <SearchBar
          placeholder="搜电影、搜影院"
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
        />
      </div>

      <div className={styles.results}>
        {keyword.length === 0 ? (
          <div className={styles.hint}>输入关键词搜索影片和影院</div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <SpinLoading color="primary" />
          </div>
        ) : !hasResults ? (
          <div className={styles.empty}>未找到相关内容</div>
        ) : (
          <>
            {/* 影片结果 */}
            {films.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>影片（{films.length}）</div>
                {films.map((f) => (
                  <FilmCard key={f.id} film={f} variant="list" />
                ))}
              </div>
            )}

            {/* 影院结果 */}
            {cinemas.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>影院（{cinemas.length}）</div>
                {cinemas.map((cinema: any) => (
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
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
