/**
 * 场次 API — 对接 ScheduleController
 * GET /api/schedule/list?filmId=&cinemaId=&showDate=
 */
import http from '../request';

export interface ScheduleItem {
  id: number;
  filmId: number;
  cinemaId: number;
  hallId: number;
  showDate: string;
  startTime: string;
  endTime: string;
  price: number;
  vipPrice: number | null;
  status: string;
  // 关联字段
  filmName: string;
  filmPoster: string;
  filmDuration: number;
  filmRating: string;
  filmType: string;
  cinemaName: string;
  cinemaAddress: string;
  hallName: string;
  hallType: string;
  hallRowCount: number;
  hallColCount: number;
}

export async function getScheduleList(params: {
  filmId: number;
  cinemaId?: number;
  showDate?: string;
}): Promise<ScheduleItem[]> {
  return http.get('/schedule/list', { params });
}
