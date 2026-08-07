// @ts-ignore
/* eslint-disable */
import request from '@/libs/request';

/** POST /filmReview/create */
export async function createReview(
  body: { filmId: string; rating: number; content: string; tags?: string },
  options?: { [key: string]: any },
) {
  return request<any>('/filmReview/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** GET /filmReview/list/{filmId} */
export async function listReviews(
  filmId: string,
  params?: { pageNum?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<any>(`/filmReview/list/${filmId}`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** POST /filmReview/helpful/{reviewId} */
export async function markHelpful(
  reviewId: string,
  options?: { [key: string]: any },
) {
  return request<any>(`/filmReview/helpful/${reviewId}`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** GET /filmReview/my */
export async function getMyReviews(
  params?: { pageNum?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<any>('/filmReview/my', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}
