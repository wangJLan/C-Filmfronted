/**
 * 电子票页 — 使用真实订单数据
 */
import React from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, SafeArea, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getOrderDetail, type OrderVO } from '@/services/api/order';
import styles from './index.module.less';

const FakeQR: React.FC<{ code: string }> = ({ code }) => {
  const total = 21; const hash = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rects: { x: number; y: number }[] = [];
  for (let r = 0; r < total; r++) for (let c = 0; c < total; c++) {
    const isCorner = (r < 7 && c < 7) || (r < 7 && c >= total - 7) || (r >= total - 7 && c < 7);
    let on: boolean;
    if (isCorner) {
      on = (r % 7 === 0 || r % 7 === 6 || c % 7 === 0 || c % 7 === 6 || r === 3 || r === 4 || c === 3 || c === 4) && !(r >= 2 && r <= 4 && c >= 2 && c <= 4);
    } else {
      on = ((hash * (r + 7) * (c + 13) + r * 31 + c * 17) % 100) > 45;
    }
    if (on) rects.push({ x: c, y: r });
  }
  return <svg viewBox="0 0 21 21" width="140" height="140">{rects.map((p, i) => <rect key={i} x={p.x} y={p.y} width="1" height="1" fill="#1a1a1a" rx="0.15" />)}</svg>;
};

const TicketPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = Number(orderId);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', oid],
    queryFn: () => getOrderDetail(oid) as Promise<OrderVO>,
    enabled: !!oid,
  });

  if (isLoading) return <div className={styles.page}><NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
    <div style={{ textAlign:'center',padding:80 }}><SpinLoading color="primary" /></div></div>;
  if (!order || order.status !== 'paid') return <div className={styles.page}><NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
    <div className={styles.empty}>{order?.status === 'pending' ? '请先完成支付' : '订单不存在'}</div></div>;

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
