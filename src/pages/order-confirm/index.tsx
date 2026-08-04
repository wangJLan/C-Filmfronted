/**
 * 订单确认页 — 淘票票风格
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail } from '@/api/orderController';
import styles from './index.module.less';

const LOCK_DURATION = 15 * 60;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function loadFromCache(oid: string): API.OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const OrderConfirmPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;

  const [order, setOrder] = useState<API.OrderVO | null>(() => loadFromCache(oid));
  const [remainSec, setRemainSec] = useState(LOCK_DURATION);

  useEffect(() => {
    if (!oid) return;
    getOrderDetail({ id: oid }).then((o: any) => {
      const vo = o?.data ?? o;
      setOrder(vo);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo));
    }).catch(() => {});
  }, [oid]);

  useEffect(() => {
    const created = order?.createTime ? new Date(order.createTime).getTime() : Date.now();
    const remaining = Math.max(0, LOCK_DURATION - Math.floor((Date.now() - created) / 1000));
    setRemainSec(remaining);
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemainSec(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.createTime]);

  const scheduleTime = useMemo(() => {
    if (!order) return '';
    const time = order.scheduleTime || '';
    return time;
  }, [order]);

  if (!order) {
    return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />} /><div className={styles.empty}>订单数据丢失</div></div>;
  }

  if (remainSec <= 0 || order.status === 'cancelled') {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate('/')} back={<LeftOutline />} />
        <div className={styles.expiredContainer}>
          <div className={styles.expiredIcon}>⏰</div>
          <div className={styles.expiredTitle}>订单已超时</div>
          <div className={styles.expiredDesc}>座位已自动释放，喜欢的话可以重新下单哦～</div>
          <div className={styles.retryBtn} onClick={() => navigate(-2)}>重新选座</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav} />

      {/* ===== 票务信息头部 ===== */}
      <div className={styles.header}>
        <div className={styles.countdownRow}>
          <img className={styles.clockIcon} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='27' fill='none' stroke='%23f8289c' stroke-width='3'/%3E%3Ccircle cx='30' cy='30' r='27' fill='none' stroke='%23f8289c' stroke-width='3' stroke-dasharray='170' stroke-dashoffset='0' transform='rotate(-90 30 30)'/%3E%3Ctext x='30' y='36' text-anchor='middle' font-size='14' font-weight='700' fill='%23f8289c'%3E⏱%3C/text%3E%3C/svg%3E" alt="" />
          <span className={styles.countdown}>{formatCountdown(remainSec)}</span>
        </div>

        <div className={styles.ticketInfo}>
          <div className={styles.posterCol}>
{order.posterUrl ? (
                <img className={styles.poster} src={order.posterUrl} alt="" />
              ) : (
                <div className={styles.posterPlaceholder} />
              )}
          </div>
          <div className={styles.infoCol}>
            <div className={styles.movieName}>{order.filmName || '影片名称'}</div>
            <div className={styles.infoLine}>{scheduleTime}</div>
            <div className={styles.infoLine}>{order.hallName || ''} {order.seatLabels?.join(' ')}</div>
            <div className={styles.infoLine}>{order.cinemaName || ''}</div>
            <div className={styles.infoLine}>共{order.count || 0}张 原价 ¥{order.totalPrice || 0}</div>
          </div>
        </div>

        <div className={styles.refundRow}>
          <div className={styles.refundItem}>
            <svg className={styles.checkIcon} viewBox="0 0 96 96"><path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm20.5 26.3c-1.9-1.8-5-1.7-6.9.1l-20 20-7.2-7.2c-1.9-1.9-5-1.9-6.9-.1s-2 4.8-.1 6.7l10.7 10.7c1.9 1.9 5.1 1.9 7 0L68.6 41c1.9-1.9 1.8-4.9-.1-6.7z" fill="#00b578"/></svg>
            <span>限时退票</span>
          </div>
          <div className={styles.refundItem}>
            <svg className={styles.checkIcon} viewBox="0 0 96 96"><path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm20.5 26.3c-1.9-1.8-5-1.7-6.9.1l-20 20-7.2-7.2c-1.9-1.9-5-1.9-6.9-.1s-2 4.8-.1 6.7l10.7 10.7c1.9 1.9 5.1 1.9 7 0L68.6 41c1.9-1.9 1.8-4.9-.1-6.7z" fill="#00b578"/></svg>
            <span>限时改签</span>
          </div>
          <div className={styles.refundNotice}>
            <span>退改签须知</span>
            <svg className={styles.arrowIcon} viewBox="0 0 96 96" fill="#959AA5"><path d="M55.1 48 32.3 26.9c-1.6-1.5-1.7-4-.2-5.7 1.5-1.6 4-1.7 5.7-.2l26 24c1.7 1.6 1.7 4.3 0 5.9l-26 24c-1.6 1.5-4.2 1.4-5.7-.2-1.5-1.6-1.4-4.2.2-5.7l22.8-21z"/></svg>
          </div>
        </div>
      </div>

      {/* ===== 优惠券区 ===== */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>本单可享优惠</div>
        <div className={styles.couponRow}>
          <span className={styles.couponLabel}>优惠券&活动</span>
          <span className={styles.couponNone}>暂无可用</span>
        </div>
      </div>

      {/* ===== 小食区 ===== */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>观影伴侣·美味小食</span>
          <span className={styles.cardMore}>全部小食 ›</span>
        </div>
        <div className={styles.snackItem}>
          <div className={styles.snackTag}>热销</div>
          <div className={styles.snackInner}>
            <div className={styles.snackPoster} />
            <div className={styles.snackInfo}>
              <div className={styles.snackName}>双人餐·46oz爆米花1桶+16oz可口可乐2杯</div>
              <div className={styles.snackPriceRow}>
                <span className={styles.snackPrice}><span className={styles.yen}>¥</span>29<span className={styles.yenSmall}>.5</span></span>
                <span className={styles.snackOrig}>原价：¥41</span>
              </div>
            </div>
            <div className={styles.addBtn}>+</div>
          </div>
        </div>
        <div className={styles.snackItem}>
          <div className={styles.snackTag} />
          <div className={styles.snackInner}>
            <div className={styles.snackPoster} />
            <div className={styles.snackInfo}>
              <div className={styles.snackName}>单人餐·3D眼镜（框架式）1副</div>
              <div className={styles.snackPriceRow}>
                <span className={styles.snackPrice}><span className={styles.yen}>¥</span>2</span>
                <span className={styles.snackOrig}>原价：¥10</span>
              </div>
            </div>
            <div className={styles.addBtn}>+</div>
          </div>
        </div>
        <div className={styles.snackTotal}>
          <span>小食总计：</span>
          <span className={styles.snackTotalPrice}><span className={styles.yen}>¥</span>0</span>
        </div>
      </div>

      {/* ===== 手机号区 ===== */}
      <div className={styles.card}>
        <div className={styles.phoneRow}>
          <div className={styles.phoneIcon}>
            <svg viewBox="0 0 96 96" fill="#fff" width="20" height="20"><path d="M70 8c6.1 0 11 4.9 11 11v58c0 6.1-4.9 11-11 11H26c-6.1 0-11-4.9-11-11V19c0-6.1 4.9-11 11-11h44zM56 73H40c-1.7 0-3 1.3-3 3s1.3 3 3 3h16c1.7 0 3-1.3 3-3s-1.3-3-3-3zm14-59H26c-2.8 0-5 2.2-5 5v45h54V19c0-2.8-2.2-5-5-5z"/></svg>
          </div>
          <div className={styles.phoneInfo}>
            <div className={styles.phoneNum}>134****1989</div>
            <div className={styles.phoneHint}>手机号仅用于生成订单</div>
          </div>
          <svg className={styles.arrowIcon} viewBox="0 0 96 96" fill="#959AA5"><path d="M55.1 48 32.3 26.9c-1.6-1.5-1.7-4-.2-5.7 1.5-1.6 4-1.7 5.7-.2l26 24c1.7 1.6 1.7 4.3 0 5.9l-26 24c-1.6 1.5-4.2 1.4-5.7-.2-1.5-1.6-1.4-4.2.2-5.7l22.8-21z"/></svg>
        </div>
      </div>

      {/* ===== 购票须知 ===== */}
      <div className={styles.card}>
        <div className={styles.noticeTitle}>购票须知</div>
        <div className={styles.noticeDesc}>
          1.由于设备故障等不可抗力因素，存在少量场次取消的情况，会进行退票退款<br />
          2.由于影院系统不稳定等因素，存在出票失败的情况，会进行退款<br />
          3.取票码可以在"我的-电影票"中查看
        </div>
      </div>

      <div className={styles.bottomSpacer} />

      {/* ===== 底部付款栏 ===== */}
      <div className={styles.footerBar}>
        <SafeArea position="bottom" />
        <div className={styles.footerInner}>
          <div className={styles.priceCol}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>合计：</span>
              <span className={styles.totalPrice}><span className={styles.yen}>¥</span>{order.totalPrice || 0}</span>
            </div>
            <div className={styles.detailBtn}>
              <span>查看明细</span>
              <svg viewBox="0 0 96 96" fill="#f8289c" width="12" height="12"><path d="M50 37.9c-.1-.2-.3-.3-.5-.5-1.1-.8-2.6-.6-3.4.5L32.5 55.2c-.3.4-.5.9-.5 1.4 0 1.3 1.1 2.4 2.5 2.4h27.1c.5 0 1.1-.2 1.5-.5 1.1-.8 1.3-2.3.5-3.3L50 37.9z"/></svg>
            </div>
          </div>
          <div
            className={styles.payBtn}
            onClick={() => {
              sessionStorage.setItem(`order_${oid}`, JSON.stringify(order));
              navigate(`/payment/${oid}`);
            }}
          >
            立即付款
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmPage;
