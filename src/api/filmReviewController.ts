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

/** GET /filmReview/comment/count/{reviewId} */
export async function getCommentCount(
  reviewId: number,
  options?: { [key: string]: any },
) {
  return request<number>(`/filmReview/comment/count/${reviewId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** GET /filmReview/count/{filmId} */
export async function getReviewCount(
  filmId: number,
  options?: { [key: string]: any },
) {
  return request<number>(`/filmReview/count/${filmId}`, {
    method: 'GET',
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

/** POST /filmReview/comment */
export async function createComment(
  body: { reviewId: number; content: string; parentId?: number },
  options?: { [key: string]: any },
) {
  return request<any>('/filmReview/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** GET /filmReview/comment/list/{reviewId} */
export async function listComments(
  reviewId: number,
  params?: { pageNum?: number; pageSize?: number },
  options?: { [key: string]: any },
) {
  return request<any>(`/filmReview/comment/list/${reviewId}`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** DELETE /filmReview/comment/{commentId} */
export async function deleteComment(
  commentId: number,
  options?: { [key: string]: any },
) {
  return request<any>(`/filmReview/comment/${commentId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** POST /filmReview/comment/helpful/{commentId} */
export async function markCommentHelpful(
  commentId: number,
  options?: { [key: string]: any },
) {
  return request<any>(`/filmReview/comment/helpful/${commentId}`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** DELETE /filmReview/{reviewId} */
export async function deleteMyReview(
  reviewId: number,
  options?: { [key: string]: any },
) {
  return request<any>(`/filmReview/${reviewId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
