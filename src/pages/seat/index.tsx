/**
 * 统一选座页 — 真实座位数据 + 锁座 + 创建订单
 */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'umi';
import { NavBar, Toast, SafeArea, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getSeatMap } from '@/api/seatController';
import { createOrder } from '@/api/orderController';
import { useGuard } from '@/hooks/useGuard';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDayLabel(dateStr: string): string {
  if (!dateStr) return '';
  const today = new Date();
  const target = new Date(dateStr);
  const diffDays = Math.round((target.getTime() - today.setHours(0,0,0,0)) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  return WEEKDAY_CN[target.getDay()];
}

const SeatPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const sid = Number(showtimeId);

  const { filmName, filmDuration, filmType, startTime, endTime, hallType, hallName, date } = 
    (location.state as any) || {};
  // 从 URL 查询参数获取（如果 state 为空）
  const queryParams = new URLSearchParams(location.search);
  const filmNameVal = filmName || queryParams.get('filmName') || '';
  const filmDurationVal = filmDuration || queryParams.get('filmDuration') || '';
  const filmTypeVal = filmType || queryParams.get('filmType') || '';
  const startTimeVal = startTime || queryParams.get('startTime') || '';
  const endTimeVal = endTime || queryParams.get('endTime') || '';
  const hallTypeVal = hallType || queryParams.get('hallType') || '';
  const hallNameVal = hallName || queryParams.get('hallName') || '';
  const dateVal = date || queryParams.get('date') || '';

  // 页面守卫
  React.useEffect(() => { if (!isLoggedIn) guard(() => {}); }, []);

  const { data: seatMap, isLoading } = useQuery({
    queryKey: ['seatMap', sid],
    queryFn: () => getSeatMap({ scheduleId: sid }),
    enabled: !!sid && isLoggedIn,
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [locking, setLocking] = useState(false);
  const maxSelect = 4;

  const { rows, cols, seats, price } = useMemo(() => {
    if (!seatMap) return { rows: 0, cols: 0, seats: [] as API.Seat[], price: 0 };
    return {
      rows: seatMap.rowCount || 0,
      cols: seatMap.colCount || 0,
      seats: seatMap.seats || [],
      price: seatMap.price || 0,
    };
  }, [seatMap]);

  // 按行列索引的座位映射
  const seatGrid = useMemo(() => {
    const grid = new Map<string, API.Seat>();
    seats.forEach(s => grid.set(`${s.rowNum}-${s.colNum}`, s));
    return grid;
  }, [seats]);

  const toggle = (row: number, col: number) => {
    const seat = seatGrid.get(`${row}-${col}`);
    if (!seat || seat.status !== 'available') return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(seat.id!)) { next.delete(seat.id!); return next; }
      if (next.size >= maxSelect) { Toast.show({ content: `最多选${maxSelect}座` }); return prev; }
      next.add(seat.id!);
      return next;
    });
  };

  const totalPrice = selectedIds.size * price;

  const handleConfirm = async () => {
    if (selectedIds.size === 0) { Toast.show({ content: '请先选择座位' }); return; }
    setLocking(true);
    try {
      const order = await createOrder({ scheduleId: sid, seatIds: Array.from(selectedIds) });
      // 暂存到 sessionStorage，防止跳页后 getOrderDetail 偶发失败
      sessionStorage.setItem(`order_${order.id}`, JSON.stringify(order));
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
                    const isSel = selectedIds.has(seat.id!);
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
        <div className={styles.bottomCard}>
          {/* 电影信息行 */}
          <div className={styles.cardHeader}>
            <div className={styles.cardFilmName}>{filmNameVal || '电影名称'}</div>
            <div className={styles.cardSwitch} onClick={() => navigate(-1)}>切换场次</div>
          </div>
          <div className={styles.cardShowtime}>
            {dateVal && <span className={styles.showtimeDay}>{formatDayLabel(dateVal)}</span>}
            {startTimeVal && <span>{startTimeVal.substring(0,5)}-{endTimeVal?.substring(0,5)}</span>}
            {filmDurationVal && <span>{filmDurationVal}分钟</span>}
            {filmTypeVal && <span>{filmTypeVal}</span>}
            {hallTypeVal && <span>{hallTypeVal}</span>}
          </div>

          {/* 已选座位 */}
          {selectedIds.size > 0 && (
            <div className={styles.cardSeats}>
              {Array.from(selectedIds).map(id => {
                const s = seats.find(x => x.id === id);
                return s ? (
                  <div key={id} className={styles.seatTag}>
                    <span>{s.seatLabel}</span>
                    <span className={styles.seatTagClose} onClick={() => toggle(s.rowNum, s.colNum)}>×</span>
                  </div>
                ) : null;
              })}
              <span className={styles.seatTagPrice}>¥{totalPrice}</span>
            </div>
          )}

          {/* 确认按钮 */}
          <button
            className={`${styles.confirmBtn} ${selectedIds.size === 0 ? styles.confirmBtnDisabled : ''}`}
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || locking}
          >
            {selectedIds.size > 0 ? `${totalPrice}元 确认选座` : '请选择座位'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatPage;