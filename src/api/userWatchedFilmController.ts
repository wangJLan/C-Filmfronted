// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** POST /userWatchedFilm/mark/{filmId} */
export async function markWatched(
  filmId: number,
  options?: { [key: string]: any },
) {
  return request<any>(`/userWatchedFilm/mark/${filmId}`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** GET /userWatchedFilm/isWatched/{filmId} */
export async function isWatched(
  filmId: number,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringObject>(`/userWatchedFilm/isWatched/${filmId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** GET /userWatchedFilm/my */
export async function getMyWatched(options?: { [key: string]: any }) {
  return request<API.BaseResponseListFilm>('/userWatchedFilm/my', {
    method: 'GET',
    ...(options || {}),
  });
}

/** GET /userWatchedFilm/count */
export async function getWatchedCount(options?: { [key: string]: any }) {
  return request<API.BaseResponseMapStringObject>('/userWatchedFilm/count', {
    method: 'GET',
    ...(options || {}),
  });
}
