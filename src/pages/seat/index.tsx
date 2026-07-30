/**
 * 统一选座页 — 真实座位数据 + 锁座 + 创建订单
 */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, Toast, SafeArea, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getSeatMap, lockSeats, type SeatItem } from '@/services/api/seat';
import { createOrder } from '@/services/api/order';
import { useGuard } from '@/hooks/useGuard';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const SeatPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const sid = Number(showtimeId);

  // 页面守卫
  React.useEffect(() => { if (!isLoggedIn) guard(() => {}); }, []);

  const { data: seatMap, isLoading } = useQuery({
    queryKey: ['seatMap', sid],
    queryFn: () => getSeatMap(sid),
    enabled: !!sid && isLoggedIn,
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [locking, setLocking] = useState(false);
  const maxSelect = 4;

  const { rows, cols, seats, price } = useMemo(() => {
    if (!seatMap) return { rows: 0, cols: 0, seats: [], price: 0 };
    return {
      rows: seatMap.rowCount,
      cols: seatMap.colCount,
      seats: seatMap.seats,
      price: seatMap.price || 0,
    };
  }, [seatMap]);

  // 按行列索引的座位映射
  const seatGrid = useMemo(() => {
    const grid = new Map<string, SeatItem>();
    seats.forEach(s => grid.set(`${s.rowNum}-${s.colNum}`, s));
    return grid;
  }, [seats]);

  const toggle = (row: number, col: number) => {
    const seat = seatGrid.get(`${row}-${col}`);
    if (!seat || seat.status !== 'available') return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(seat.id)) { next.delete(seat.id); return next; }
      if (next.size >= maxSelect) { Toast.show({ content: `最多选${maxSelect}座` }); return prev; }
      next.add(seat.id);
      return next;
    });
  };

  const totalPrice = selectedIds.size * price;

  const handleConfirm = async () => {
    if (selectedIds.size === 0) { Toast.show({ content: '请先选择座位' }); return; }
    setLocking(true);
    try {
      // 1. 锁座
      await lockSeats(sid, Array.from(selectedIds));
      // 2. 创建订单
      const order = await createOrder(sid, Array.from(selectedIds));
      Toast.show({ icon: 'success', content: '下单成功！' });
      navigate(`/order-confirm/${order.id}`, { replace: true });
    } catch (e: any) {
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

      <div className={styles.infoBar}>
        <div className={styles.meta}>
          {seatMap.hallName} · {seatMap.hallType} · ¥{price}/座
        </div>
      </div>

      <div className={styles.screenArea}>
        <div className={styles.screen}>
          <div className={styles.screenCurve} />
          <span className={styles.screenText}>银 幕</span>
        </div>
      </div>

      <div className={styles.seatWrap}>
        <div className={styles.seatGrid}>
          {Array.from({ length: rows }, (_, rowIdx) => {
            const rowNum = rowIdx + 1;
            return (
              <div key={rowNum} className={styles.seatRow}>
                <span className={styles.rowLabel}>{ROW_LABELS[rowIdx]}</span>
                <div className={styles.seatCells}>
                  {Array.from({ length: cols }, (_, colIdx) => {
                    const colNum = colIdx + 1;
                    const seat = seatGrid.get(`${rowNum}-${colNum}`);
                    if (!seat) return <span key={colNum} className={styles.aisle} />;
                    const isSold = seat.status === 'sold' || seat.status === 'locked';
                    const isSel = selectedIds.has(seat.id);
                    const isVip = seat.zone === 'vip';
                    let cls = styles.seat;
                    if (isSold) cls += ` ${styles.seatSold}`;
                    else if (isSel) cls += ` ${styles.seatSelected}`;
                    else if (isVip) cls += ` ${styles.seatCouple}`;
                    else cls += ` ${styles.seatAvail}`;
                    return <div key={colNum} className={cls} onClick={() => toggle(rowNum, colNum)} />;
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

      <div className={styles.bottomBar}>
        <SafeArea position="bottom" />
        <div className={styles.bottomInner}>
          <div className={styles.bottomLeft}>
            {selectedIds.size > 0 ? (
              <>
                <span className={styles.bottomSeats}>
                  {Array.from(selectedIds).slice(0,3).map(id => {
                    const s = seats.find(x => x.id === id);
                    return s ? s.seatLabel : '';
                  }).join('、')}
                  {selectedIds.size > 3 ? ` 等${selectedIds.size}座` : ''}
                </span>
                <span className={styles.bottomPrice}>¥<strong>{totalPrice}</strong></span>
              </>
            ) : <span className={styles.bottomHint}>请选择座位</span>}
          </div>
          <Button className={styles.confirmBtn} onClick={handleConfirm} loading={locking} disabled={selectedIds.size === 0}>
            确认选座
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeatPage;
