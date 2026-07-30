/**
 * 影片 API — 对接后端 FilmController
 *
 * 后端返回字段映射（Film 实体 → 前端 FilmItem）:
 *   name       → title
 *   type       → genre
 *   posterUrl  → poster
 *   releaseDate → 用于计算 year
 */
import http from '../request';

// ================= 前端统一类型 =================

export interface FilmItem {
  id: number;
  title: string;
  poster: string;
  genre: string;
  duration: number;
  rating: number;
  year: number;
  director: string;
  actors: string[];
  description: string;
  /** 想看人数（后端暂无此字段，前端默认 0） */
  wantCount: number;
  /** 状态: upcoming/hot/offline */
  status: string;
  /** 上映日期 */
  releaseDate: string;
}

// ================= 后端原始类型 =================

interface RawFilm {
  id: number;
  name: string;
  type: string;
  rating: number;
  duration: number;
  posterUrl: string;
  releaseDate: string;
  director: string;
  actors: string;
  description: string;
  status: string;
}

interface PageResponse<T> {
  records: T[];
  totalRow: number;
  pageNumber: number;
  pageSize: number;
}

// ================= 字段映射 =================

function mapFilm(raw: RawFilm): FilmItem {
  const year = raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : 2026;
  const actors = raw.actors ? raw.actors.split(',') : [];
  return {
    id: raw.id,
    title: raw.name,
    poster: raw.posterUrl || '',
    genre: raw.type || '',
    duration: raw.duration || 0,
    rating: raw.rating || 0,
    year,
    director: raw.director || '',
    actors,
    description: raw.description || '',
    wantCount: 0,
    status: raw.status,
    releaseDate: raw.releaseDate || '',
  };
}

// ================= API =================

/** 影片列表（分页 + 筛选） */
export async function getFilmList(params?: {
  status?: string;      // hot / upcoming
  type?: string;        // 类型筛选
  keyword?: string;     // 搜索
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
}): Promise<{ list: FilmItem[]; total: number }> {
  const resp = await http.get('/film/list', { params });
  // 后端返回 Page<Film> 被 BaseResponse 解包
  const page: PageResponse<RawFilm> = resp as any;
  return {
    list: (page.records || []).map(mapFilm),
    total: page.totalRow || 0,
  };
}

/** 影片详情 */
export async function getFilmDetail(id: number): Promise<FilmItem> {
  const raw: RawFilm = await http.get(`/film/${id}`);
  return mapFilm(raw);
}
