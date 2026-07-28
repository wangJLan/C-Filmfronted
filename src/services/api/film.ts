/**
 * 影片相关 API（后端暂无此模块，当前返回 mock 数据）
 */
import http from '../request';

export interface FilmItem {
  id: number;
  title: string;
  poster: string;
  year: number;
  genre: string;
  duration: number;
  description: string;
  rating: number;
}

const MOCK_FILMS: FilmItem[] = [
  {
    id: 1, title: '流浪地球3', poster: 'https://picsum.photos/seed/film1/300/400',
    year: 2026, genre: '科幻', duration: 150, rating: 8.5,
    description: '太阳即将毁灭，人类在地球表面建造出巨大的推进器，开启了一场长达2500年的星际流浪之旅。',
  },
  {
    id: 2, title: '封神第二部', poster: 'https://picsum.photos/seed/film2/300/400',
    year: 2026, genre: '奇幻', duration: 140, rating: 8.2,
    description: '殷商末年，纣王暴虐，姜子牙携封神榜下山，辅佐武王伐纣。',
  },
  {
    id: 3, title: '哪吒之魔童闹海', poster: 'https://picsum.photos/seed/film3/300/400',
    year: 2025, genre: '动画', duration: 120, rating: 8.8,
    description: '哪吒和敖丙在封神大战后，为守护陈塘关的百姓，与海底妖兽展开了一场惊心动魄的战斗。',
  },
];

/** 获取影片列表（后端暂无，直接返回 mock） */
export async function getFilmList(): Promise<FilmItem[]> {
  // TODO: 后端影片接口就绪后改为 http.get('/films')
  return MOCK_FILMS;
}

/** 获取影片详情（后端暂无，直接返回 mock） */
export async function getFilmDetail(id: number): Promise<FilmItem> {
  // TODO: 后端影片接口就绪后改为 http.get(`/films/${id}`)
  return MOCK_FILMS.find((f) => f.id === id) ?? MOCK_FILMS[0];
}
