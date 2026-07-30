/**
 * 电子票页 — 支付成功后展示取票码 + 二维码 + 订单详情
 *
 * 可在「我的订单」中重复查看
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Button, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useOrderStore } from '@/stores/useOrderStore';
import { MOCK_HOT_FILMS, MOCK_CINEMAS } from '@/mock/home';
import styles from './index.module.less';

/** 简易 SVG 二维码生成（用 Canvas 图案模拟） */
function FakeQR({ code }: { code: string }) {
  // 生成一个模拟 QR 码的格子图案
  const size = 5; // 5x5 定位块
  const total = 21; // 21x21 伪 QR
  const cells: boolean[][] = [];

  const hash = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const pseudoRand = (r: number, c: number) => {
    return ((hash * (r + 7) * (c + 13) + r * 31 + c * 17) % 100) > 45;
  };

  for (let r = 0; r < total; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < total; c++) {
      // 三个角定位图案
      const isCorner = (r < 7 && c < 7) || (r < 7 && c >= total - 7) || (r >= total - 7 && c < 7);
      if (isCorner) {
        const inner = (r % 7 === 0 || r % 7 === 6 || c % 7 === 0 || c % 7 === 6 || r === 3 || r === 4 || c === 3 || c === 4) && !(r >= 2 && r <= 4 && c >= 2 && c <= 4);
        row.push(inner);
      } else {
        row.push(pseudoRand(r, c));
      }
    }
    cells.push(row);
  }

  const rects: { x: number; y: number }[] = [];
  cells.forEach((row, r) => {
    row.forEach((on, c) => {
      if (on) rects.push({ x: c, y: r });
    });
  });

  return (
    <svg viewBox="0 0 21 21" width="140" height="140">
      {rects.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width="1" height="1" fill="#1a1a1a" rx="0.15" />
      ))}
    </svg>
  );
}

const TicketPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrder } = useOrderStore();

  const order = useMemo(() => getOrder(orderId!), [orderId]);
  const poster = MOCK_HOT_FILMS.find((f) => f.id === order?.filmId)?.poster;

  if (!order || order.status !== 'paid') {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>
        <div className={styles.empty}>
          {order?.status === 'pending' ? '请先完成支付' : '订单不存在'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate('/orders')} back={<LeftOutline />}>电子票</NavBar>

      {/* 顶部成功动效区 */}
      <div className={styles.successBanner}>
        <div className={styles.successIcon}>🎉</div>
        <div className={styles.successTitle}>购票成功！</div>
        <div className={styles.successDesc}>请在影院自助取票机扫码取票</div>
      </div>

      {/* 取票码 + 二维码 */}
      <div className={styles.ticketCard}>
        <div className={styles.qrSection}>
          <FakeQR code={order.ticketCode || '000000'} />
        </div>
        <div className={styles.codeSection}>
          <div className={styles.codeLabel}>取票码</div>
          <div className={styles.codeNum}>{order.ticketCode}</div>
          <div className={styles.codeHint}>请在影院取票机输入此码</div>
        </div>
      </div>

      {/* 订单详情 */}
      <div className={styles.detailCard}>
        <div className={styles.detailTitle}>订单详情</div>

        <div className={styles.detailRow}>
          <span className={styles.dLabel}>影片</span>
          <span className={styles.dVal}>{order.filmTitle}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>影院</span>
          <span className={styles.dVal}>{order.cinema}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>场次</span>
          <span className={styles.dVal}>{order.date} · {order.time}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>影厅</span>
          <span className={styles.dVal}>{order.hall}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>座位</span>
          <span className={styles.dValSeats}>{order.seats.join('、')}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>数量</span>
          <span className={styles.dVal}>{order.seats.length} 张</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>实付</span>
          <span className={styles.dValPrice}>¥{order.totalPrice}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>订单号</span>
          <span className={styles.dValSmall}>{order.id}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.dLabel}>支付时间</span>
          <span className={styles.dValSmall}>
            {order.paidAt ? new Date(order.paidAt).toLocaleString('zh-CN') : '—'}
          </span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <Button block color="primary" onClick={() => navigate('/orders')}>
          查看全部订单
        </Button>
        <Button block fill="none" className={styles.backBtn} onClick={() => navigate('/')}>
          返回首页
        </Button>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default TicketPage;
