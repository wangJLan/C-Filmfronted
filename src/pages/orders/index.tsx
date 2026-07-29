import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { Button, NavBar, Tabs, Toast, Empty } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useOrderStore, type OrderItem } from '@/stores/useOrderStore';
import styles from './index.module.less';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: '已支付', color: '#FF5A00' },
  completed: { label: '已完成', color: '#00b578' },
  cancelled: { label: '已取消', color: '#ccc' },
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, cancelOrder } = useOrderStore();
  const [tab, setTab] = useState<'all' | 'paid' | 'completed'>('all');

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true;
    return o.status === tab;
  });

  const handleCancel = (id: string) => {
    cancelOrder(id);
    Toast.show({ icon: 'success', content: '已取消' });
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav}>
        我的订单
      </NavBar>

      <div className={styles.tabBar}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k as typeof tab)} className={styles.tabs}>
          <Tabs.Tab title="全部" key="all" />
          <Tabs.Tab title="已支付" key="paid" />
          <Tabs.Tab title="已完成" key="completed" />
        </Tabs>
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.emptyWrap}>
            <Empty description="暂无订单" />
            <Button color="primary" size="small" onClick={() => navigate('/film')} style={{ marginTop: 12, borderRadius: 16 }}>
              去逛逛
            </Button>
          </div>
        ) : (
          filtered.map((order: OrderItem) => {
            const st = STATUS_MAP[order.status];
            return (
              <div key={order.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cinemaName}>{order.cinema}</span>
                  <span className={styles.statusTag} style={{ color: st.color }}>{st.label}</span>
                </div>
                <div className={styles.cardBody} onClick={() => navigate(`/detail/${order.filmId}`)}>
                  <div className={styles.poster}>
                    <img src={order.poster} alt={order.filmTitle} />
                  </div>
                  <div className={styles.info}>
                    <div className={styles.filmName}>{order.filmTitle}</div>
                    <div className={styles.meta}>
                      <span>{order.date}</span>
                      <span className={styles.dot}>·</span>
                      <span>{order.time}</span>
                      <span className={styles.dot}>·</span>
                      <span>{order.hall}</span>
                    </div>
                    <div className={styles.seats}>
                      {order.seats.join('、')}
                    </div>
                    <div className={styles.price}>
                      <span className={styles.priceNum}>¥{order.totalPrice}</span>
                    </div>
                  </div>
                </div>
                {order.status === 'paid' && (
                  <div className={styles.cardFoot}>
                    <Button size="mini" fill="none" className={styles.cancelBtn} onClick={() => handleCancel(order.id)}>
                      取消订单
                    </Button>
                    <Button size="mini" color="primary" className={styles.payBtn} onClick={() => Toast.show({ content: '请联系影院取票' })}>
                      查看取票码
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
