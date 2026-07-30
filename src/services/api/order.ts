/**
 * 订单 API — 对接 OrderController
 */
import http from '../request';

export interface OrderVO {
  /** 雪花ID, 19位, JS Number装不下 → 用string */
  id: string;
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
  const raw = await http.post('/order/create', { scheduleId, seatIds }) as any;
  return { ...raw, id: String(raw.id) };
}

/** 支付订单 */
export async function payOrder(orderId: string): Promise<{ payForm: string; orderNo: string }> {
  // BigInt → safeStringify 保留 19位精度写入 JSON body
  return http.post('/order/pay', { orderId: BigInt(orderId) });
}

/** 订单详情 */
export async function getOrderDetail(orderId: string): Promise<OrderVO> {
  // ID 走 URL 路径传字符串，Spring 会自动解析 Long
  const raw = await http.get(`/order/${orderId}`) as any;
  return { ...raw, id: String(raw.id) };
}

/** 订单列表 */
export async function getOrderList(params: {
  pageNum?: number;
  pageSize?: number;
}): Promise<{ records: OrderVO[]; totalRow: number }> {
  const raw = await http.get('/order/list', { params }) as any;
  return { records: (raw.records || []).map((r: any) => ({ ...r, id: String(r.id) })), totalRow: raw.totalRow };
}
