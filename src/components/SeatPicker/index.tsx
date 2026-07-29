import React, { useState, useMemo } from 'react';
import { Button, Toast, SafeArea } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

interface SeatPickerProps {
  filmTitle: string;
  filmId: number;
  poster: string;
  onClose: () => void;
  onConfirm: (info: { filmId: number; filmTitle: string; cinema: string; hall: string; date: string; time: string; seats: string[]; totalPrice: number }) => void;
}

// 影厅座位布局: 8行 × 12列
const ROWS = 8;
const COLS = 12;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PRICE = 42; // 每张票价格

// 模拟已售座位（随机固定几个）
const SOLD_SEATS = new Set([
  '3-5', '3-6', '4-5', '4-6', '4-7',
  '2-3', '2-4', '6-1', '6-2', '7-10',
  '5-7', '5-8', '1-10', '1-11', '7-12',
]);

const DATES = ['今天 7月29日', '明天 7月30日', '后天 7月31日'];
const TIMES = ['10:30', '13:45', '16:20', '19:00', '21:30'];
const HALLS = ['1号IMAX厅', '2号杜比全景声厅', '3号激光厅'];
const CINEMAS = ['万达影城(朝阳大悦城店)', 'CGV影城(国贸店)', '卢米埃影城(蓝色港湾店)'];

function seatLabel(row: number, col: number) {
  return `${row + 1}排${col + 1}座`;
}

const SeatPicker: React.FC<SeatPickerProps> = ({ filmTitle, filmId, poster, onClose, onConfirm }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dateIdx, setDateIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(2);
  const [hallIdx, setHallIdx] = useState(0);
  const [cinemaIdx, setCinemaIdx] = useState(0);

  const toggle = (row: number, col: number) => {
    const key = `${row}-${col}`;
    if (SOLD_SEATS.has(key)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (next.size >= 4) {
          Toast.show({ content: '最多选4个座位' });
          return prev;
        }
        next.add(key);
      }
      return next;
    });
  };

  const totalPrice = useMemo(() => selected.size * PRICE, [selected]);

  const handleConfirm = () => {
    if (selected.size === 0) {
      Toast.show({ content: '请先选择座位' });
      return;
    }
    const seatList = Array.from(selected).map((k) => {
      const [r, c] = k.split('-').map(Number);
      return seatLabel(r, c);
    });
    onConfirm({
      filmId,
      filmTitle,
      cinema: CINEMAS[cinemaIdx],
      hall: HALLS[hallIdx],
      date: DATES[dateIdx],
      time: TIMES[timeIdx],
      seats: seatList,
      totalPrice,
    });
  };

  return (
    <div className={styles.overlay}>
      {/* 顶部 */}
      <div className={styles.topBar}>
        <div className={styles.topClose} onClick={onClose}>
          <CloseOutline fontSize={22} />
        </div>
        <div className={styles.topInfo}>
          <div className={styles.topFilm}>{filmTitle}</div>
          <div className={styles.topMeta}>
            {CINEMAS[cinemaIdx]} · {HALLS[hallIdx]}
          </div>
        </div>
        <div className={styles.topSpacer} />
      </div>

      {/* 场次选择 */}
      <div className={styles.selectors}>
        <div className={styles.selectorRow}>
          <span className={styles.selLabel}>影院</span>
          <div className={styles.selChips}>
            {CINEMAS.map((c, i) => (
              <span
                key={i}
                className={`${styles.selChip} ${cinemaIdx === i ? styles.selChipActive : ''}`}
                onClick={() => setCinemaIdx(i)}
              >
                {c.split('(')[0]}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.selectorRow}>
          <span className={styles.selLabel}>日期</span>
          <div className={styles.selChips}>
            {DATES.map((d, i) => (
              <span
                key={i}
                className={`${styles.selChip} ${dateIdx === i ? styles.selChipActive : ''}`}
                onClick={() => setDateIdx(i)}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.selectorRow}>
          <span className={styles.selLabel}>场次</span>
          <div className={styles.selChips}>
            {TIMES.map((t, i) => (
              <span
                key={i}
                className={`${styles.selChip} ${timeIdx === i ? styles.selChipActive : ''}`}
                onClick={() => setTimeIdx(i)}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 银幕 */}
      <div className={styles.screenArea}>
        <div className={styles.screen}>
          <div className={styles.screenCurve} />
          <span className={styles.screenText}>银 幕</span>
        </div>
      </div>

      {/* 座位图 */}
      <div className={styles.seatContainer}>
        <div className={styles.seatGrid}>
          {/* 列号 */}
          <div className={styles.colLabels}>
            <span className={styles.emptyCell} />
            {Array.from({ length: COLS }, (_, i) => (
              <span key={i} className={styles.colNum}>{i + 1}</span>
            ))}
            <span className={styles.emptyCell} />
            {Array.from({ length: COLS }, (_, i) => (
              <span key={i + COLS} className={styles.colNum}>{i + 1}</span>
            ))}
          </div>

          {/* 行 */}
          {Array.from({ length: ROWS }, (_, row) => (
            <div key={row} className={styles.seatRow}>
              <span className={styles.rowLabel}>{ROW_LABELS[row]}</span>
              {/* 左区 1-6 */}
              {Array.from({ length: COLS / 2 }, (_, col) => {
                const key = `${row}-${col}`;
                const isSold = SOLD_SEATS.has(key);
                const isSel = selected.has(key);
                return (
                  <div
                    key={col}
                    className={`${styles.seat} ${isSold ? styles.seatSold : ''} ${isSel ? styles.seatSelected : ''}`}
                    onClick={() => toggle(row, col)}
                  />
                );
              })}
              {/* 走道 */}
              <span className={styles.aisle} />
              {/* 右区 7-12 */}
              {Array.from({ length: COLS / 2 }, (_, col) => {
                const realCol = col + COLS / 2;
                const key = `${row}-${realCol}`;
                const isSold = SOLD_SEATS.has(key);
                const isSel = selected.has(key);
                return (
                  <div
                    key={realCol}
                    className={`${styles.seat} ${isSold ? styles.seatSold : ''} ${isSel ? styles.seatSelected : ''}`}
                    onClick={() => toggle(row, realCol)}
                  />
                );
              })}
              <span className={styles.rowLabel}>{ROW_LABELS[row]}</span>
            </div>
          ))}
        </div>

        {/* 图例 */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendAvail}`} />
            <span>可选</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendSelDot}`} />
            <span>已选</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.legendSold}`} />
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
              <span className={styles.bottomSeats}>
                {Array.from(selected).slice(0, 3).map((k) => {
                  const [r, c] = k.split('-').map(Number);
                  return seatLabel(r, c);
                }).join('、')}
                {selected.size > 3 ? ` 等${selected.size}座` : ` ${selected.size}座`}
              </span>
            ) : (
              <span className={styles.bottomHint}>请选座</span>
            )}
            <span className={styles.bottomPrice}>
              <span className={styles.priceNum}>{totalPrice}</span> 元
            </span>
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

export default SeatPicker;
