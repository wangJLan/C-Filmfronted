/**
 * 统一选座页 — 真实座位数据 + 锁座 + 创建订单 + 淘票票风格底部卡片
 */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'umi';
import { NavBar, Toast, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSeatMap } from '@/api/seatController';
import { createOrder, lockSeat, unlockSeat } from '@/api/orderController';
import { listSchedule } from '@/api/scheduleController';
import { useGuard } from '@/hooks/useGuard';
import { useUserStore } from '@/stores/useUserStore';
import { useAiStore } from '@/stores/useAiStore';
import styles from './index.module.less';

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function formatDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[1]}月${parts[2]}日`;
  return dateStr;
}

function formatDayLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  const target = new Date(dateStr);
  const diffDays = Math.round((target.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  return '';
}

const SeatPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const userId = useUserStore((s) => s.user?.id);
  const sid = showtimeId; // 雪花 ID 全程用字符串，避免 Number() 精度丢失

  const queryClient = useQueryClient();

  const { filmName, filmDuration, filmType, startTime, endTime, hallType, hallName, date } =
    (location.state as any) || {};
  const queryParams = new URLSearchParams(location.search);
  const filmNameVal = filmName || queryParams.get('filmName') || '';
  const filmTypeVal = filmType || queryParams.get('filmType') || '';
  const startTimeVal = startTime || queryParams.get('startTime') || '';
  const endTimeVal = endTime || queryParams.get('endTime') || '';
  const hallTypeVal = hallType || queryParams.get('hallType') || '';
  const hallNameVal = hallName || queryParams.get('hallName') || '';
  const dateVal = date || queryParams.get('date') || '';

  React.useEffect(() => { if (!isLoggedIn) guard(() => {}); }, []);

  const { data: seatMap, isLoading } = useQuery({
    queryKey: ['seatMap', sid],
    queryFn: () => getSeatMap({ scheduleId: sid as any }),
    enabled: !!sid && isLoggedIn,
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [locking, setLocking] = useState(false);
  const maxSelect = 4;
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSelectedRef = useRef<Set<number>>(new Set());

  // 离开页面时释放所有已锁座位
  useEffect(() => {
    return () => {
      const ids = Array.from(prevSelectedRef.current);
      if (ids.length > 0 && sid) {
        unlockSeat({ scheduleId: sid as any, seatIds: ids }).catch(() => {});
      }
    };
  }, [sid]);

  // 选座变化后防抖 300ms 调锁座/解锁接口
  const syncLocks = useCallback((next: Set<number>) => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(async () => {
      const prev = prevSelectedRef.current;
      const added = Array.from(next).filter(id => !prev.has(id));
      const removed = Array.from(prev).filter(id => !next.has(id));
      prevSelectedRef.current = new Set(next);
      try {
        if (added.length > 0) await lockSeat({ scheduleId: sid as any, seatIds: added });
        if (removed.length > 0) await unlockSeat({ scheduleId: sid as any, seatIds: removed });
      } catch (e: any) {
        // 锁座冲突：回退已添加的座位，提示用户
        setSelectedIds(prev);
        prevSelectedRef.current = new Set(prev);
        const msg = e?.message || '该座位已被其他人选中';
        Toast.show({ icon: 'fail', content: msg });
      }
    }, 300);
  }, [sid]);

  const { rows, cols, seats, price, aisleRows, aisleCols, rowOverrides } = useMemo(() => {
    if (!seatMap) {
      return { rows: 0, cols: 0, seats: [] as API.Seat[], price: 0, aisleRows: [] as number[], aisleCols: [] as number[], rowOverrides: {} as Record<number, number> };
    }
    return {
      rows: seatMap.rowCount || 0,
      cols: seatMap.colCount || 0,
      seats: seatMap.seats || [],
      price: seatMap.price || 0,
      aisleRows: seatMap.aisleRows || [],
      aisleCols: seatMap.aisleCols || [],
      rowOverrides: seatMap.rowOverrides || {},
    };
  }, [seatMap]);

  const seatGrid = useMemo(() => {
    const grid = new Map<string, API.Seat>();
    seats.forEach(s => grid.set(`${s.rowNum}-${s.colNum}`, s));
    return grid;
  }, [seats]);

  // 过道/空位布局：按物理格遍历，缺口（blockedCells）自然留白、过道（aisleRows/aisleCols）加宽
  const getRowCols = useCallback(
    (rowNum: number): number => rowOverrides?.[rowNum] ?? cols,
    [rowOverrides, cols],
  );
  const aisleRowSet = useMemo(() => new Set(aisleRows), [aisleRows]);
  const aisleColSet = useMemo(() => new Set(aisleCols), [aisleCols]);

  const toggle = (row: number, col: number) => {
    const seat = seatGrid.get(`${row}-${col}`);
    if (!seat || seat.status !== 'available') return;
    setSelectedIds(prev => {
      if (prev.has(seat.id!)) {
        const next = new Set(prev);
        next.delete(seat.id!);
        syncLocks(next);
        return next;
      }
      if (prev.size >= maxSelect) { Toast.show({ content: `最多选${maxSelect}座` }); return prev; }
      const next = new Set(prev);
      next.add(seat.id!);
      syncLocks(next);
      return next;
    });
  };

  const totalPrice = selectedIds.size * price;

  // —— 场次面板（默认收起） ——
  const [skdOpen, setSkdOpen] = useState(false);
  const relatedSchedules = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('seat_schedules');
      return raw ? (JSON.parse(raw) as any[]) : [];
    } catch { return []; }
  }, []);

  // 兜底：sessionStorage 为空时从 API 拉取同一影片+日期的场次
  const filmIdFromUrl = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('filmId');
    return id ? Number(id) : undefined;
  }, [location.search]);

  const { data: apiSchedules } = useQuery({
    queryKey: ['seatSchedules', filmIdFromUrl, dateVal],
    queryFn: () => filmIdFromUrl ? listSchedule({ filmId: filmIdFromUrl, showDate: dateVal }) : Promise.resolve([]),
    enabled: !!filmIdFromUrl && relatedSchedules.length === 0,
  });

  const finalSchedules = useMemo(() => {
    if (relatedSchedules.length > 0) return relatedSchedules;
    return (Array.isArray(apiSchedules) ? apiSchedules : []) as any[];
  }, [relatedSchedules, apiSchedules]);

  const currentSkdId = showtimeId; // 与场次列表 id（字符串雪花）比较，不能用 Number

  const switchSkd = (item: any) => {
    const p = new URLSearchParams(location.search);
    p.set('startTime', item.startTime || '');
    p.set('endTime', item.endTime || '');
    p.set('hallType', item.hallType || '');
    p.set('hallName', item.hallName || '');
    navigate(`/seat/${item.id}?${p.toString()}`, { replace: true });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) { Toast.show({ content: '请先选择座位' }); return; }
    setLocking(true);
    const seatIds = Array.from(selectedIds);
    try {
      // 1. 最终锁座（防抖锁座可能尚未触发）
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      await lockSeat({ scheduleId: sid as any, seatIds });
      // 2. 创建订单（内部再次校验锁，原子落库）
      const order = await createOrder({ scheduleId: sid as any, seatIds });
      // 3. 清空本地选中状态，跳转支付页
      prevSelectedRef.current.clear();
      setSelectedIds(new Set());
      sessionStorage.setItem(`order_${order.id}`, JSON.stringify(order));
      // 同步通知 AI 面板
      const seatLabels = Array.from(seatIds).map(id => {
        const s = seats.find(x => x.id === id);
        return s?.seatLabel || '';
      }).filter(Boolean).join('、');
      try {
        await fetch(`/api/movie-agent/sync-state?userId=${userId}&scheduleId=${sid}&orderId=${order.id}&seatLabels=${encodeURIComponent(seatLabels)}`, { method: 'POST' });
      } catch { /* 非关键路径 */ }
      sessionStorage.setItem(`order_${order.id}_filmType`, filmTypeVal);
      const cinemaTags = sessionStorage.getItem('seat_cinemaTags');
      if (cinemaTags) sessionStorage.setItem(`order_${order.id}_cinemaTags`, cinemaTags);
      Toast.show({ icon: 'success', content: '下单成功！' });
      // 立即刷新订单列表缓存，确保用户进入订单页能看到新订单
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/order-confirm/${order.id}`, { replace: true });
    } catch (e: any) {
      // 锁座或下单失败 → 释放已锁座位，避免孤儿锁
      try { await unlockSeat({ scheduleId: sid as any, seatIds }); } catch {}
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    } finally { setLocking(false); }
  };

  if (isLoading) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选座</NavBar>
      <div style={{ textAlign: 'center', padding: 80 }}><SpinLoading color="primary" /></div></div>;
  }
  if (!seatMap) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选座</NavBar>
      <div className={styles.empty}>场次不存在或已失效</div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>选座</NavBar>

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
          {Array.from({ length: rows }, (_, rowIdx) => {
            const rowNum = rowIdx + 1;
            const rowCols = getRowCols(rowNum);
            return (
              <div
                key={rowNum}
                className={`${styles.seatRow} ${aisleRowSet.has(rowNum) ? styles.seatRowAisle : ''}`}
              >
                <span className={styles.rowLabel}>{ROW_LABELS[rowIdx]}</span>
                <div className={styles.seatCells}>
                  {Array.from({ length: rowCols }, (_, colIdx) => {
                    const colNum = colIdx + 1;
                    const seat = seatGrid.get(`${rowNum}-${colNum}`);
                    return (
                      <React.Fragment key={colNum}>
                        {!seat ? (
                          <span className={styles.seatGap} />
                        ) : (
                          (() => {
                            const isSold = seat.status === 'sold' || seat.status === 'locked';
                            const isSel = selectedIds.has(seat.id!);
                            const isVip = seat.zone === 'vip';
                            let cls = styles.seat;
                            if (isSold) cls += ` ${styles.seatSold}`;
                            else if (isSel) cls += ` ${styles.seatSelected}`;
                            else if (isVip) cls += ` ${styles.seatCouple}`;
                            else cls += ` ${styles.seatAvail}`;
                            return <div className={cls} onClick={() => toggle(rowNum, colNum)} />;
                          })()
                        )}
                        {aisleColSet.has(colNum) && <span className={styles.seatColAisle} />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <span className={styles.rowLabel}>{ROW_LABELS[rowIdx]}</span>
              </div>
            );
          })}
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendAvail}`} /><span>可选</span></div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendCouple}`} /><span>VIP</span></div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendSel}`} /><span>已选</span></div>
          <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendSold}`} /><span>已售</span></div>
        </div>
      </div>

      {/* 底部（淘票票结构） */}
      <div className={styles.bottomBar}>
        <div className={styles.scheduleCard}>
          <div className={styles.movieAndSchedules}>
            <div className={styles.movieRow}>
              <div className={styles.movieInfo}>
                <div className={styles.movieName}>{filmNameVal || '影片名称'}</div>
                <div className={styles.showTime}>
                  <span className={styles.showDay}>{formatDayLabel(dateVal)}</span>
                  <span>{formatDateStr(dateVal)} {startTimeVal?.substring(0, 5)}-{endTimeVal?.substring(0, 5)} {filmTypeVal || ''} {hallTypeVal || ''}</span>
                </div>
              </div>
              <span className={styles.toggleSkdBtn} onClick={() => setSkdOpen(!skdOpen)}>
                {skdOpen ? '收起场次' : '切换场次'}
              </span>
            </div>

            <div className={`${styles.schedules} ${!skdOpen ? styles.schedulesHidden : ''}`}>
              <ul className={styles.skdList}>
                {finalSchedules.map((item: any) => (
                  <li
                    key={item.id}
                    className={`${styles.skdItem} ${item.id === currentSkdId ? styles.skdItemActive : ''}`}
                    onClick={() => item.id !== currentSkdId && switchSkd(item)}
                  >
                    <div className={styles.skdItemInner}>
                      <div className={styles.skdTime}>{String(item.startTime || '').substring(0, 5)}</div>
                      <div className={styles.skdVersion}>{item.hallType || '2D'}</div>
                      <div className={styles.skdPriceWrap}>
                        <div className={styles.skdPrice}>¥{item.price || '--'}起</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className={styles.seatTags}>
              {Array.from(selectedIds).map(id => {
                const s = seats.find(x => x.id === id);
                return s ? (
                  <div key={id} className={styles.seatTag}>
                    <span>{s.seatLabel}</span>
                    <span className={styles.seatTagClose} onClick={() => toggle(s.rowNum, s.colNum)}>×</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className={styles.submitBtnWrap}>
          <button
            className={`${styles.submitBtn} ${selectedIds.size === 0 ? styles.submitBtnDisabled : styles.submitBtnActive}`}
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || locking}
          >
            {selectedIds.size > 0 ? `¥${totalPrice} 确认选座` : '请先选座'}
          </button>
        </div>
        <div className={styles.bottomSpace} />
      </div>
    </div>
  );
};

export default SeatPage;
