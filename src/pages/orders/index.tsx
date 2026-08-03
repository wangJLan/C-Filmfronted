/**
 * 我的订单 — 真实订单数据
 */
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { Button, NavBar, Tabs, Empty, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { listOrders } from '@/api/orderController';
import { useUserStore } from '@/stores/useUserStore';
import { useGuard } from '@/hooks/useGuard';
import styles from './index.module.less';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: '#FF5A00' },
  paid: { label: '已支付', color: '#00b578' },
  completed: { label: '已完成', color: '#00b578' },
  cancelled: { label: '已取消', color: '#ccc' },
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const guard = useGuard();
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const [tab, setTab] = useState<'all' | 'pending' | 'paid' | 'completed'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => listOrders({ pageNum: 1, pageSize: 50 }),
    enabled: isLoggedIn,
  });

  const orders = data?.records || [];
  const filtered = orders.filter(o => tab === 'all' || o.status === tab);

  if (!isLoggedIn) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>我的订单</NavBar>
      <div className={styles.emptyWrap} style={{ paddingTop: 80 }}><Empty description="登录后可查看订单" />
        <Button color="primary" size="small" onClick={() => guard(() => {})} style={{ marginTop: 12, borderRadius: 16 }}>去登录</Button>
      </div></div>;
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>我的订单</NavBar>
      <div className={styles.tabBar}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k as typeof tab)} className={styles.tabs}>
          <Tabs.Tab title="全部" key="all" />
          <Tabs.Tab title="待支付" key="pending" />
          <Tabs.Tab title="已支付" key="paid" />
          <Tabs.Tab title="已完成" key="completed" />
        </Tabs>
      </div>
      <div className={styles.list}>
        {isLoading ? <div style={{ textAlign: 'center', padding: 60 }}><SpinLoading color="primary" /></div>
        : filtered.length === 0 ? <div className={styles.emptyWrap}><Empty description={tab === 'all' ? '暂无订单' : tab === 'pending' ? '暂无待支付订单' : tab === 'paid' ? '暂无已支付订单' : '暂无已完成订单'} />
          <Button color="primary" size="small" onClick={() => navigate('/film')} style={{ marginTop: 12, borderRadius: 16 }}>去逛逛</Button></div>
        : filtered.map(order => {
          const st = STATUS_MAP[order.status || ''];
          return (
            <div key={order.id} className={styles.card}>
              <div className={styles.cardHead}><span className={styles.cinemaName}>{order.cinemaName}</span><span className={styles.statusTag} style={{ color: st?.color }}>{st?.label}</span></div>
              <div className={styles.cardBody} onClick={() => {
                if (order.status === 'paid') navigate(`/ticket/${order.id}`);
                else if (order.status === 'pending') navigate(`/order-confirm/${order.id}`);
                else navigate(`/ticket/${order.id}`);
              }}>
                <div className={styles.info}>
                  <div className={styles.filmName}>{order.filmName}</div>
                  <div className={styles.meta}><span>{order.scheduleTime}</span><span className={styles.dot}>·</span><span>{order.hallName}</span></div>
                  <div className={styles.seats}>{order.seatLabels?.join('、')}</div>
                  <div className={styles.price}><span className={styles.priceNum}>¥{order.totalPrice}</span></div>
                </div>
              </div>
              {order.status === 'pending' && <div className={styles.cardFoot}>
                <Button size="mini" fill="none" className={styles.cancelBtn} onClick={() => navigate(`/order-confirm/${order.id}`)}>去支付</Button>
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersPage;