/**
 * 座位 API — 对接 SeatController / OrderController
 */
import http from '../request';

export interface SeatItem {
  id: number;
  scheduleId: number;
  hallId: number;
  rowNum: number;
  colNum: number;
  seatLabel: string;
  zone: string;
  status: string; // available / locked / sold
}

export interface SeatMapVO {
  hallId: number;
  hallName: string;
  hallType: string;
  rowCount: number;
  colCount: number;
  scheduleId: number;
  price: number;
  vipPrice: number | null;
  seats: SeatItem[];
}

/** 获取场次座位图 */
export async function getSeatMap(scheduleId: number): Promise<SeatMapVO> {
  return http.get(`/seat/seatmap/${scheduleId}`);
}

/** 锁定座位 */
export async function lockSeats(scheduleId: number, seatIds: number[]): Promise<boolean> {
  return http.post('/order/lockSeat', { scheduleId, seatIds });
}
