/**
 * 影院场次页
 *
 * 三种入口：
 *   1. /showtime/:filmId/:cinemaId — 影片+影院均已选定 → 直接展示场次
 *   2. /showtime/cinema/:cinemaId  — 只选了影院 → 先选影片再展示场次
 *   3. /showtime/film/:filmId     — 只选了影片 → 先选影院再展示场次
 *
 * 功能：
 *   1. 横向切换未来 7 天放映日期，无排片展示空状态
 *   2. 场次卡片展示开场时间、影厅、票价、剩余座位；售罄场次提供相似推荐
 *   3. 页面顶部支持一键转交 AI，继承当前影片、影院、日期条件
 */
import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'umi';
import { NavBar, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { MOCK_HOT_FILMS, MOCK_CINEMAS, getShowtimes, getAllShowtimes, type ShowtimeItem } from '@/mock/home';
import { useAiStore } from '@/stores/useAiStore';
import { useGuard } from '@/hooks/useGuard';
import dayjs from 'dayjs';
import styles from './index.module.less';

// ================= 日期工具 =================

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  if (index === 2) return '后天';
  return WEEKDAY_CN[new Date(dateStr).getDay()];
}

function buildDates(): string[] {
  const result: string[] = [];
  for (let i = 0; i < 7; i++) {
    result.push(dayjs().add(i, 'day').format('YYYY-MM-DD'));
  }
  return result;
}

// ================= 卡片色块 =================

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

// ================= 组件 =================

const ShowtimePage: React.FC = () => {
  const params = useParams<{ filmId?: string; cinemaId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const guard = useGuard();
  const triggerAi = useAiStore((s) => s.triggerAi);

  // 推断当前模式
  const isCinemaOnly = location.pathname.includes('/showtime/cinema/');
  const isFilmOnly = location.pathname.includes('/showtime/film/');
  const isDirect = !isCinemaOnly && !isFilmOnly; // 两者都有

  const directFilmId = isDirect ? Number(params.filmId) : undefined;
  const directCinemaId = isDirect ? Number(params.cinemaId) : undefined;

  // 初始选中态
  const [selectedFilmId, setSelectedFilmId] = useState<number | null>(
    isFilmOnly ? Number(params.filmId) : isDirect ? directFilmId! : null,
  );
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(
    isCinemaOnly ? Number(params.cinemaId) : isDirect ? directCinemaId! : null,
  );

  const effectiveFilmId = selectedFilmId;
  const effectiveCinemaId = selectedCinemaId;
  const film = MOCK_HOT_FILMS.find((f) => f.id === effectiveFilmId);
  const cinema = MOCK_CINEMAS.find((c) => c.id === effectiveCinemaId);

  // === 可选影片列表（cinemaOnly 模式）===
  const filmsAtCinema = useMemo(() => {
    if (!effectiveCinemaId) return [];
    const all = getAllShowtimes().filter((s) => s.cinemaId === effectiveCinemaId);
    const ids = [...new Set(all.map((s) => s.filmId))];
    return MOCK_HOT_FILMS.filter((f) => ids.includes(f.id));
  }, [effectiveCinemaId]);

  // === 可选影院列表（filmOnly 模式） + 每个影院的场次数量 ===
  interface CinemaWithCount { id: number; name: string; address: string; distance: string; tags: string[]; showtimeCount: number; }
  const cinemasForFilm: CinemaWithCount[] = useMemo(() => {
    if (!effectiveFilmId) return [];
    const all = getAllShowtimes().filter((s) => s.filmId === effectiveFilmId);
    return MOCK_CINEMAS
      .filter((c) => [...new Set(all.map((s) => s.cinemaId))].includes(c.id))
      .map((c) => ({
        ...c,
        showtimeCount: all.filter((s) => s.cinemaId === c.id).length,
      }));
  }, [effectiveFilmId]);

  // === 日期 ===
  const dates = useMemo(() => buildDates(), []);
  const [activeDateIdx, setActiveDateIdx] = useState(0);

  // === 场次（两者都选定后才查询）===
  const showtimes = useMemo(() => {
    if (!effectiveFilmId || !effectiveCinemaId) return [];
    return getShowtimes(effectiveFilmId, effectiveCinemaId, dates[activeDateIdx]);
  }, [effectiveFilmId, effectiveCinemaId, dates, activeDateIdx]);

  const dateCounts = useMemo(() => {
    if (!effectiveFilmId || !effectiveCinemaId) return dates.map(() => 0);
    return dates.map((d) => getShowtimes(effectiveFilmId, effectiveCinemaId, d).length);
  }, [dates, effectiveFilmId, effectiveCinemaId]);

  const hasAnyShowtime = dateCounts.some((c) => c > 0);

  // ==================== 交互处理 ====================

  const handleAiHelp = () => {
    const parts: string[] = [];
    if (film) parts.push(`《${film.title}》`);
    if (cinema) parts.push(cinema.name);
    parts.push(dayjs(dates[activeDateIdx]).format('M月D日'));
    const context = `我在看${parts.join(' ')}，帮我推荐合适场次`;
    triggerAi(context);
    Toast.show({ content: '已转交 AI 助手 🤖' });
  };

  const handleSelectShowtime = (item: ShowtimeItem) => {
    const remaining = item.totalSeats - item.soldSeats;
    if (remaining <= 0) {
      const alternatives = showtimes.filter(
        (s) => s.id !== item.id && s.totalSeats - s.soldSeats > 0,
      ).slice(0, 3);
      if (alternatives.length === 0) {
        Toast.show({ content: '该日所有场次已售罄，试试切换日期或让 AI 帮你查其他影院' });
        return;
      }
      const tips = alternatives.map((s) => `${s.time} ${s.hall} ¥${s.price}`).join(' | ');
      Toast.show({ content: `已售罄 😅 推荐：${tips}`, duration: 4000 });
      return;
    }
    guard(() => navigate(`/seat/${item.id}`));
  };

  // ==================== 渲染：选影院模式（filmOnly） ====================
  if (isFilmOnly && !selectedCinemaId) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选择影院</NavBar>
        <div className={styles.infoHead}>
          <div className={styles.filmTitle}>{film?.title}</div>
        </div>
        {cinemasForFilm.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>暂无影院排片</div>
            <div className={styles.emptyHint}>试试让 AI 帮你搜附近影院</div>
          </div>
        ) : (
          <div className={styles.cinemaList}>
            <div className={styles.filmGridTitle}>有排场的影院（{cinemasForFilm.length}家）</div>
            {cinemasForFilm.map((c) => (
              <div
                key={c.id}
                className={styles.cinemaCard}
                onClick={() => {
                  setSelectedCinemaId(c.id);
                }}
              >
                <div className={styles.cinemaCardHead}>
                  <span className={styles.cinemaCardName}>{c.name}</span>
                  <span className={styles.cinemaCardDist}>{c.distance}</span>
                </div>
                <div className={styles.cinemaCardAddr}>{c.address}</div>
                <div className={styles.cinemaCardTags}>
                  {c.tags.map((t) => (
                    <span key={t} className={styles.cinemaCardTag}>{t}</span>
                  ))}
                  <span className={styles.cinemaCardShowtimeCount}>
                    未来7天共 {c.showtimeCount} 场
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <SafeArea position="bottom" />
      </div>
    );
  }

  // ==================== 渲染：选影片模式（cinemaOnly） ====================
  if (isCinemaOnly && !selectedFilmId) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选择影片</NavBar>
        <div className={styles.infoHead}>
          <div className={styles.cinemaName}>{cinema?.name}</div>
        </div>
        {filmsAtCinema.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>该影院暂无排片</div>
            <div className={styles.emptyHint}>试试其他影院，或让 AI 帮你推荐</div>
          </div>
        ) : (
          <div className={styles.filmGrid}>
            <div className={styles.filmGridTitle}>正在上映（{filmsAtCinema.length}部）</div>
            {filmsAtCinema.map((f, idx) => (
              <div
                key={f.id}
                className={styles.filmCard}
                onClick={() => setSelectedFilmId(f.id)}
              >
                <div
                  className={styles.filmCardPoster}
                  style={{ background: FILM_COLORS[idx % FILM_COLORS.length] }}
                >
                  <img src={f.poster} alt={f.title} />
                  {f.tags.length > 0 && (
                    <span className={styles.filmCardTag}>{f.tags[0]}</span>
                  )}
                </div>
                <div className={styles.filmCardInfo}>
                  <div className={styles.filmCardTitle}>{f.title}</div>
                  <div className={styles.filmCardMeta}>
                    ⭐ {f.rating.toFixed(1)} · {f.genre} · {f.duration}分钟
                  </div>
                  <div className={styles.filmCardPick}>选场次 ›</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <SafeArea position="bottom" />
      </div>
    );
  }

  // ==================== 渲染：场次展示（两者都已选定） ====================
  return (
    <div className={styles.page}>
      <NavBar
        onBack={() => navigate(-1)}
        back={<LeftOutline />}
        right={
          <span className={styles.aiBtn} onClick={handleAiHelp}>
            🤖 转交AI
          </span>
        }
      >
        选场次
      </NavBar>

      {/* 影片+影院信息头部 */}
      <div className={styles.infoHead}>
        <div className={styles.filmTitle}>{film?.title || '选影片'}</div>
        <div className={styles.cinemaName}>{cinema?.name || '选影院'}</div>

        {/* cinema-only：可切换影片 */}
        {isCinemaOnly && filmsAtCinema.length > 1 && (
          <div className={styles.filmSwitch}>
            {filmsAtCinema.map((f) => (
              <span
                key={f.id}
                className={`${styles.filmSwitchChip} ${f.id === selectedFilmId ? styles.filmSwitchChipActive : ''}`}
                onClick={() => setSelectedFilmId(f.id)}
              >
                {f.title}
              </span>
            ))}
          </div>
        )}

        {/* film-only：可切换影院 */}
        {isFilmOnly && cinemasForFilm.length > 1 && (
          <div className={styles.filmSwitch}>
            {cinemasForFilm.map((c) => (
              <span
                key={c.id}
                className={`${styles.filmSwitchChip} ${c.id === selectedCinemaId ? styles.filmSwitchChipActive : ''}`}
                onClick={() => setSelectedCinemaId(c.id)}
              >
                {c.name.split('(')[0]}{' '}
                <span style={{ fontSize: 10, opacity: 0.7 }}>{c.distance}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 日期横向切换 */}
      <div className={styles.dateBar}>
        <div className={styles.dateScroll}>
          {dates.map((date, idx) => {
            const label = getDayLabel(date, idx);
            const count = dateCounts[idx];
            return (
              <div
                key={date}
                className={`${styles.dateItem} ${activeDateIdx === idx ? styles.dateItemActive : ''} ${count === 0 ? styles.dateItemEmpty : ''}`}
                onClick={() => setActiveDateIdx(idx)}
              >
                <span className={styles.dateLabel}>{label}</span>
                <span className={styles.dateNum}>{dayjs(date).format('MM/DD')}</span>
                {count > 0 && <span className={styles.dateCount}>{count}场</span>}
                {count === 0 && <span className={styles.dateNoData}>无排片</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 场次列表 */}
      <div className={styles.list}>
        {!hasAnyShowtime ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <div className={styles.emptyText}>
              {film && cinema ? `${cinema.name}暂无《${film.title}》排片` : '暂无排片'}
            </div>
            <div className={styles.emptyHint}>
              试试切换日期，或让 AI 帮你搜其他影院
            </div>
            <span className={styles.emptyAiBtn} onClick={handleAiHelp}>
              🤖 让 AI 帮我找
            </span>
          </div>
        ) : showtimes.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <div className={styles.emptyText}>该日期暂无排片</div>
            <div className={styles.emptyHint}>请切换其他日期查看</div>
          </div>
        ) : (
          <>
            <div className={styles.listHeader}>
              共 <strong>{showtimes.length}</strong> 个场次 · {dates[activeDateIdx]}
            </div>
            {showtimes.map((item) => {
              const remaining = item.totalSeats - item.soldSeats;
              const isSoldOut = remaining <= 0;
              const isAlmostFull = remaining > 0 && remaining <= 10;
              return (
                <div
                  key={item.id}
                  className={`${styles.card} ${isSoldOut ? styles.cardSoldOut : ''}`}
                  onClick={() => handleSelectShowtime(item)}
                >
                  <div className={styles.cardLeft}>
                    <div className={styles.cardTime}>
                      {item.time}
                      {isSoldOut && <span className={styles.soldTag}>售罄</span>}
                      {isAlmostFull && <span className={styles.hurryTag}>仅剩{remaining}座</span>}
                    </div>
                    <div className={styles.cardHall}>{item.hall}</div>
                  </div>
                  <div className={styles.cardRight}>
                    <div className={styles.cardPrice}>
                      <span className={styles.priceNum}>¥{item.price}</span>
                      {item.discountPrice && (
                        <span className={styles.priceDiscount}>¥{item.discountPrice}</span>
                      )}
                    </div>
                    <div className={`${styles.cardSeats} ${isSoldOut ? styles.seatsZero : ''} ${isAlmostFull ? styles.seatsHurry : ''}`}>
                      {isSoldOut ? '已售罄' : `${remaining}/${item.totalSeats} 座`}
                    </div>
                    {isSoldOut && (
                      <div
                        className={styles.similarBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectShowtime(item);
                        }}
                      >
                        相似场次 ›
                      </div>
                    )}
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

export default ShowtimePage;
