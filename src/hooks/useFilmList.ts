/**
 * 影片列表 — Tanstack Query Hook
 * 当前后端暂无影片接口，直接使用 mock；后端就绪后去掉 getFilmList 调用即可
 */
import { useQuery } from '@tanstack/react-query';
import { getFilmList } from '@/services/api/film';

export function useFilmList() {
  return useQuery({
    queryKey: ['filmList'],
    queryFn: () => getFilmList(),
    staleTime: 3 * 60 * 1000,
  });
}
