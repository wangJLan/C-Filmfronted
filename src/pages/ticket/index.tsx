/**
 * 电子票页 — sessionStorage 主数据 + API 后台刷新
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail, type OrderVO } from '@/services/api/order';
import styles from './index.module.less';

function loadFromCache(oid: number): OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const FakeQR: React.FC<{ code: string }> = ({ code }) => {
  const total = 21; const hash = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rects: { x: number; y: number }[] = [];
  for (let r = 0; r < total; r++) for (let c = 0; c < total; c++) {
    const isCorner = (r < 7 && c < 7) || (r < 7 && c >= total - 7) || (r >= total - 7 && c < 7);
    let on: boolean;
    if (isCorner) on = (r % 7 === 0 || r % 7 === 6 || c % 7 === 0 || c % 7 === 6 || r === 3 || r === 4 || c === 3 || c === 4) && !(r >= 2 && r <= 4 && c >= 2 && c <= 4);
    else on = ((hash * (r + 7) * (c + 13) + r * 31 + c * 17) % 100) > 45;
    if (on) rects.push({ x: c, y: r });
  }
  return <svg viewBox="0 0 21 21" width="140" height="140">{rects.map((p, i) => <rect key={i} x={p.x} y={p.y} width="1" height="1" fill="#1a1a1a" rx="0.15" />)}</svg>;
};

const TicketPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = Number(orderId);
  const [order, setOrder] = useState<OrderVO | null>(() => loadFromCache(oid));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!oid) return;
    getOrderDetail(oid).then((o) => {
      setOrder(o);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(o));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [oid]);

  if (loading) return <div className={styles.page}><NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
    <div style={{ textAlign:'center', padding:80, color:'#999' }}>加载中…</div></div>;

  if (!order) return <div className={styles.page}><NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
    <div className={styles.empty}>订单不存在</div></div>;

  if (order.status !== 'paid') {
    return <div className={styles.page}><NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
      <div className={styles.empty} style={{ paddingTop: 80 }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>{order.status === 'pending' ? '订单尚未支付' : '订单状态异常'}</div>
        {order.status === 'pending' && <Button color="primary" size="small" onClick={() => navigate(`/payment/${oid}`)}>去支付</Button>}
      </div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
      <div className={styles.successBanner}><div className={styles.successIcon}>🎉</div><div className={styles.successTitle}>购票成功！</div></div>
      <div className={styles.ticketCard}>
        <div className={styles.qrSection}><FakeQR code={order.orderNo || '000000'} /></div>
        <div className={styles.codeSection}><div className={styles.codeLabel}>取票码</div>
          <div className={styles.codeNum}>{order.orderNo?.slice(-6) || '000000'}</div>
          <div className={styles.codeHint}>请在影院取票机输入此码</div>
        </div>
      </div>
      <div className={styles.detailCard}>
        <div className={styles.detailTitle}>订单详情</div>
        <div className={styles.detailRow}><span className={styles.dLabel}>影片</span><span className={styles.dVal}>{order.filmName}</span></div>
        <div className={styles.detailRow}><span className={styles.dLabel}>影院</span><span className={styles.dVal}>{order.cinemaName}</span></div>
        <div className={styles.detailRow}><span className={styles.dLabel}>场次</span><span className={styles.dVal}>{order.scheduleTime}</span></div>
        <div className={styles.detailRow}><span className={styles.dLabel}>影厅</span><span className={styles.dVal}>{order.hallName}</span></div>
        <div className={styles.detailRow}><span className={styles.dLabel}>座位</span><span className={styles.dValSeats}>{order.seatLabels?.join('、')}</span></div>
        <div className={styles.detailRow}><span className={styles.dLabel}>金额</span><span className={styles.dValPrice}>¥{order.totalPrice}</span></div>
        <div className={styles.detailRow}><span className={styles.dLabel}>订单号</span><span className={styles.dValSmall}>{order.orderNo}</span></div>
      </div>
      <div className={styles.actions}>
        <Button block color="primary" onClick={() => navigate('/orders')}>查看全部订单</Button>
        <Button block fill="none" className={styles.backBtn} onClick={() => navigate('/')}>返回首页</Button>
      </div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default TicketPage;
