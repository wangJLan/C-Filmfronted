// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** POST /userWantFilm/toggle/{filmId} */
export async function toggleWantToSee(
  filmId: number,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringObject>(`/userWantFilm/toggle/${filmId}`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** GET /userWantFilm/isWanted/{filmId} */
export async function isWanted(
  filmId: number,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseMapStringObject>(`/userWantFilm/isWanted/${filmId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** GET /userWantFilm/my */
export async function getMyWantToSee(options?: { [key: string]: any }) {
  return request<API.BaseResponseListFilm>('/userWantFilm/my', {
    method: 'GET',
    ...(options || {}),
  });
}

/** DELETE /userWantFilm/remove/{filmId} */
export async function removeWantToSee(
  filmId: number,
  options?: { [key: string]: any },
) {
  return request<any>(`/userWantFilm/remove/${filmId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** GET /userWantFilm/count */
export async function getWantCount(options?: { [key: string]: any }) {
  return request<API.BaseResponseMapStringObject>('/userWantFilm/count', {
    method: 'GET',
    ...(options || {}),
  });
}
