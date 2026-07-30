/**
 * 订单 API — 对接 OrderController
 */
import http from '../request';

export interface OrderVO {
  id: number;
  orderNo: string;
  userId: number;
  scheduleId: number;
  filmName: string;
  cinemaName: string;
  scheduleTime: string;
  hallName: string;
  totalPrice: number;
  count: number;
  status: string; // pending / paid / cancelled / completed
  cancelReason: string | null;
  paidAt: string | null;
  expireAt: string | null;
  createTime: string;
  seatLabels: string[];
}

/** 创建订单 */
export async function createOrder(scheduleId: number, seatIds: number[]): Promise<OrderVO> {
  return http.post('/order/create', { scheduleId, seatIds });
}

/** 支付订单 */
export async function payOrder(orderId: number): Promise<{ payForm: string; orderNo: string }> {
  return http.post('/order/pay', { orderId });
}

/** 订单详情 */
export async function getOrderDetail(orderId: number): Promise<OrderVO> {
  return http.get(`/order/${orderId}`);
}

/** 订单列表 */
export async function getOrderList(params: {
  pageNum?: number;
  pageSize?: number;
}): Promise<{ records: OrderVO[]; totalRow: number }> {
  return http.get('/order/list', { params });
}
