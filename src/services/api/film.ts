/**
 * 影片相关 API（后端暂无此模块，当前返回 mock 数据）
 */
import { MOCK_HOT_FILMS } from '@/mock/home';

export interface FilmItem {
  id: number;
  title: string;
  poster: string;
  year: number;
  genre: string;
  duration: number;
  description: string;
  rating: number;
  director?: string;
  actors?: string[];
  tags?: string[];
  wantCount?: string;
}

/** 所有 Mock 影片（热映 + 即将上映 合并 id→detail 查询） */
const ALL_MOCK: Record<number, FilmItem> = {};
MOCK_HOT_FILMS.forEach((f) => {
  ALL_MOCK[f.id] = {
    ...f,
    year: (f as any).year ?? 2026,
    description: (f as any).description ?? '暂无简介',
  };
});

/** 获取影片列表 */
export async function getFilmList(): Promise<FilmItem[]> {
  return Object.values(ALL_MOCK);
}

/** 获取影片详情 */
export async function getFilmDetail(id: number): Promise<FilmItem> {
  return ALL_MOCK[id] ?? ALL_MOCK[1];
}
