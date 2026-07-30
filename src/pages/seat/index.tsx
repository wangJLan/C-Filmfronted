/**
 * 统一选座页 — 可视化座位图 + 批量选座 + 锁座
 *
 * 双模式：manual（手动） / ai（AI 推荐后接入）
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import {
  MOCK_HOT_FILMS, MOCK_CINEMAS, getAllShowtimes,
  getSeatLayout, lockSeats, type ShowtimeItem,
} from '@/mock/home';
import { useOrderStore } from '@/stores/useOrderStore';
import { useGuard } from '@/hooks/useGuard';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function seatLabel(rowIdx: number, colIdx: number): string {
  return `${rowIdx + 1}排${colIdx + 1}座`;
}

const SeatPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const createPendingOrder = useOrderStore((s) => s.createPendingOrder);

  // 页面级守卫：未登录弹窗，登录成功后回到本页
  useEffect(() => {
    if (!isLoggedIn) {
      guard(() => {});
    }
  }, []);

  const sid = Number(showtimeId);
  const showtime: ShowtimeItem | undefined = useMemo(
    () => getAllShowtimes().find((s) => s.id === sid),
    [sid],
  );
  const film = MOCK_HOT_FILMS.find((f) => f.id === showtime?.filmId);
  const cinema = MOCK_CINEMAS.find((c) => c.id === showtime?.cinemaId);

  const [layout] = useState(() => getSeatLayout(sid));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const remaining = showtime ? showtime.totalSeats - showtime.soldSeats : 0;
  const maxSelect = Math.min(4, remaining);

  const toggle = useCallback((key: string) => {
    if (layout.soldSeats.has(key)) return;

    // 情侣座：找到该座位所属的 pair
    const couplePair = layout.couplePairs.find(([a, b]) => a === key || b === key);

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // 取消选中：成对取消
        next.delete(key);
        if (couplePair) {
          next.delete(couplePair[0]);
          next.delete(couplePair[1]);
        }
      } else {
        if (couplePair) {
          // 情侣座必须成对选
          const [a, b] = couplePair;
          if (layout.soldSeats.has(a) || layout.soldSeats.has(b)) return prev;
          if (next.size + 2 > maxSelect) {
            Toast.show({ content: `最多选${maxSelect}座` });
            return prev;
          }
          next.add(a);
          next.add(b);
        } else {
          if (next.size >= maxSelect) {
            Toast.show({ content: `最多选${maxSelect}座` });
            return prev;
          }
          next.add(key);
        }
      }
      return next;
    });
  }, [layout, maxSelect]);

  const totalPrice = selected.size * (showtime?.price || 0);

  const handleConfirm = () => {
    if (selected.size === 0) {
      Toast.show({ content: '请先选择座位' });
      return;
    }
    if (!showtime || !film || !cinema) return;

    const keys = Array.from(selected);
    const ok = lockSeats(sid, keys);
    if (!ok) {
      Toast.show({ content: '部分座位已被抢走，请重新选择 😅' });
      // 清空 locked 缓存并重新加载 layout
      window.location.reload();
      return;
    }

    const seats = keys.map((k) => {
      const [r, c] = k.split('-').map(Number);
      return seatLabel(r, c);
    });

    const orderId = createPendingOrder({
      filmId: film.id,
      filmTitle: film.title,
      poster: film.poster,
      cinema: cinema.name,
      hall: showtime.hall,
      date: showtime.date,
      time: showtime.time,
      seats,
      totalPrice,
    });

    Toast.show({ icon: 'success', content: '锁座成功！' });
    navigate(`/order-confirm/${orderId}`, { replace: true });
  };

  if (!showtime || !film || !cinema) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选座</NavBar>
        <div className={styles.empty}>场次不存在或已失效</div>
      </div>
    );
  }

  const { rows, cols, soldSeats, couplePairs, aisleCols } = layout;
  const coupleSet = new Set(couplePairs.flat());

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选座</NavBar>

      {/* 影片+影院信息 */}
      <div className={styles.infoBar}>
        <div className={styles.filmName}>{film.title}</div>
        <div className={styles.meta}>
          {cinema.name.split('(')[0]} · {showtime.hall} · {showtime.date} · {showtime.time}
        </div>
        <div className={styles.priceTag}>¥{showtime.price}/座</div>
      </div>

      {/* 银幕 */}
      <div className={styles.screenArea}>
        <div className={styles.screen}>
          <div className={styles.screenCurve} />
          <span className={styles.screenText}>银 幕</span>
        </div>
      </div>

      {/* 座位图 */}
      <div className={styles.seatWrap}>
        <div className={styles.seatGrid}>
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className={styles.seatRow}>
              <span className={styles.rowLabel}>{ROW_LABELS[row]}</span>
              <div className={styles.seatCells}>
                {Array.from({ length: cols }, (_, col) => {
                  const key = `${row}-${col}`;
                  const isSold = soldSeats.has(key);
                  const isSel = selected.has(key);
                  const isCouple = coupleSet.has(key);
                  const isAisle = aisleCols.includes(col);

                  if (isAisle) {
                    return <span key={col} className={styles.aisle} />;
                  }

                  let cls = styles.seat;
                  if (isSold) cls += ` ${styles.seatSold}`;
                  else if (isSel) cls += ` ${styles.seatSelected}`;
                  else if (isCouple) cls += ` ${styles.seatCouple}`;
                  else cls += ` ${styles.seatAvail}`;

                  return (
                    <div
                      key={col}
                      className={cls}
                      onClick={() => toggle(key)}
                    />
                  );
                })}
              </div>
              <span className={styles.rowLabel}>{ROW_LABELS[row]}</span>
            </div>
          ))}
        </div>

        {/* 图例 */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendAvail}`} />
            <span>可选</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendCouple}`} />
            <span>情侣座</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendSel}`} />
            <span>已选</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendSold}`} />
            <span>已售</span>
          </div>
        </div>
      </div>

      {/* 底部确认栏 */}
      <div className={styles.bottomBar}>
        <SafeArea position="bottom" />
        <div className={styles.bottomInner}>
          <div className={styles.bottomLeft}>
            {selected.size > 0 ? (
              <>
                <span className={styles.bottomSeats}>
                  {Array.from(selected).slice(0, 3).map((k) => {
                    const [r, c] = k.split('-').map(Number);
                    return seatLabel(r, c);
                  }).join('、')}
                  {selected.size > 3 ? ` 等${selected.size}座` : ''}
                </span>
                <span className={styles.bottomPrice}>
                  ¥<strong>{totalPrice}</strong>
                </span>
              </>
            ) : (
              <span className={styles.bottomHint}>请选择座位（可选{remaining}座）</span>
            )}
          </div>
          <Button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            确认选座
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeatPage;
