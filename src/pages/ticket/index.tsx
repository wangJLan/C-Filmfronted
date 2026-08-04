/**
 * 票务详情页 — 淘票票风格，支持所有订单状态
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { getOrderDetail, cancelOrder } from '@/api/orderController';
import { useUserStore } from '@/stores/useUserStore';
import http from '@/services/request';
import styles from './index.module.less';

// ==================== 模拟二维码 ====================
const FakeQR: React.FC<{ code: string }> = ({ code }) => {
  const total = 21;
  const hash = code.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const rects: { x: number; y: number }[] = [];
  for (let r = 0; r < total; r++)
    for (let c = 0; c < total; c++) {
      const isCorner = (r < 7 && c < 7) || (r < 7 && c >= total - 7) || (r >= total - 7 && c < 7);
      let on: boolean;
      if (isCorner)
        on = (r % 7 === 0 || r % 7 === 6 || c % 7 === 0 || c % 7 === 6 || r === 3 || r === 4 || c === 3 || c === 4)
          && !(r >= 2 && r <= 4 && c >= 2 && c <= 4);
      else
        on = ((hash * (r + 7) * (c + 13) + r * 31 + c * 17) % 100) > 45;
      if (on) rects.push({ x: c, y: r });
    }
  return (
    <svg viewBox="0 0 21 21" width="160" height="160">
      {rects.map((p, i) => <rect key={i} x={p.x} y={p.y} width="1" height="1" fill="#1a1a1a" rx="0.15" />)}
    </svg>
  );
};

const LOCK_DURATION = 15 * 60;

function formatShowCountdown(scheduleTime?: string): string {
  if (!scheduleTime) return '';
  const now = Date.now();
  const show = new Date(scheduleTime).getTime();
  const diff = show - now;
  if (diff <= 0) return '电影已开场';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const h = hours % 24;
    return h > 0 ? `${days}天${h}小时后开场` : `${days}天后开场`;
  }
  if (hours > 0) return mins > 0 ? `${hours}小时${mins}分钟后开场` : `${hours}小时后开场`;
  return `${mins}分钟后开场`;
}

function formatCountdown(seconds: number): { min: string; sec: string } {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return { min: String(m).padStart(2, '0'), sec: String(s).padStart(2, '0') };
}

function loadFromCache(oid: string): API.OrderVO | null {
  try { const raw = sessionStorage.getItem(`order_${oid}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

const STATUS_CONFIG: Record<string, { title: string; bg: string }> = {
  pending: { title: '待付款', bg: '#8D1B14' },
  paid: { title: '购票成功', bg: '#353d84' },
  cancelled: { title: '已取消', bg: '#5E2E2E' },
  refunded: { title: '已退款', bg: '#343b80' },
  completed: { title: '已完成', bg: '#353d84' },
};

const TicketPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const oid = orderId!;

  const user = useUserStore((s) => s.user);
  const [order, setOrder] = useState<API.OrderVO | null>(() => loadFromCache(oid));
  const [loading, setLoading] = useState(true);
  const [remainSec, setRemainSec] = useState(LOCK_DURATION);
  const [cancelling, setCancelling] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [qrTab, setQrTab] = useState<'ticket' | 'entry'>('ticket');

  const filmType = useMemo(() => {
    try { return sessionStorage.getItem(`order_${oid}_filmType`) || ''; } catch { return ''; }
  }, [oid]);

  useEffect(() => {
    if (!oid) return;
    getOrderDetail({ id: oid }).then((o: any) => {
      const vo = o?.data ?? o;
      setOrder(vo);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [oid]);

  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const created = order.createTime ? new Date(order.createTime).getTime() : Date.now();
    const remaining = Math.max(0, LOCK_DURATION - Math.floor((Date.now() - created) / 1000));
    setRemainSec(remaining);
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemainSec(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; }), 1000);
    return () => clearInterval(timer);
  }, [order?.status, order?.createTime]);

  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    const timer = setInterval(() => {
      getOrderDetail({ id: oid }).then((o: any) => {
        const vo = o?.data ?? o;
        setOrder(vo);
        sessionStorage.setItem(`order_${oid}`, JSON.stringify(vo));
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [order?.status, oid]);

  const statusCfg = STATUS_CONFIG[order?.status || ''] || STATUS_CONFIG.pending;
  const cd = formatCountdown(remainSec);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelOrder({ id: oid });
      Toast.show({ icon: 'success', content: '订单已取消' });
      const updated = { ...order, status: 'cancelled' };
      setOrder(updated as any);
      sessionStorage.setItem(`order_${oid}`, JSON.stringify(updated));
    } catch (e: any) { Toast.show({ icon: 'fail', content: e.message || '取消失败' }); }
    finally { setCancelling(false); }
  };

  const handleCopyOrderNo = () => {
    if (order?.orderNo) navigator.clipboard.writeText(order.orderNo).then(() => Toast.show({ content: '已复制' })).catch(() => {});
  };

  if (loading) return <div className={styles.page}><div style={{ textAlign: 'center', padding: 80, color: '#999' }}>加载中…</div></div>;
  if (!order) return <div className={styles.page}><div className={styles.empty}>订单不存在</div></div>;

  // ===== 已取消：简约卡片 =====
  if (order.status === 'cancelled') {
    return (
      <div className={styles.cancelledPage}>
        <div className={styles.cancelledCard}>
          <div className={styles.cancelledIconWrap}>
            <svg className={styles.cancelledIcon} viewBox="0 0 96 96">
              <path d="M48 88c22.1 0 40-17.9 40-40S70.1 8 48 8 8 25.9 8 48s17.9 40 40 40zm16.3-56.3c2 2 2 5.1 0 7.1L55.1 48l9.2 9.2c2 2 2 5.1 0 7.1s-5.1 2-7.1 0L48 55.1l-9.2 9.2c-2 2-5.1 2-7.1 0s-2-5.1 0-7.1l9.2-9.2-9.2-9.2c-2-2-2-5.1 0-7.1s5.1-2 7.1 0l9.2 9.2 9.2-9.2c1.9-1.9 5.1-1.9 7.1 0z" fill="#f8289c"/>
            </svg>
          </div>
          <div className={styles.cancelledTitle}>订单已关闭</div>
          <div className={styles.cancelledFilm}>{order.filmName || '影片'}（{order.count || 0}张）</div>
          <div className={styles.cancelledBtn} onClick={() => navigate('/', { replace: true })}>返回首页</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ '--status-bg': statusCfg.bg } as any}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />} className={styles.nav} />

      {/* ===== 状态区 ===== */}
      <div className={styles.statusSection}>
        <div className={styles.statusBody}>
          {order.status === 'pending' && (
            <>
              <div className={styles.statusTitle}>待付款</div>
              <div className={styles.statusDesc}>
                请尽快完成付款，晚了就没座位了哦，还剩
                <span className={styles.cd}>{cd.min}分{cd.sec}秒</span>
              </div>
              <div className={styles.statusActions}>
                <button className={styles.btnCancel} onClick={handleCancel} disabled={cancelling}>取消订单</button>
                <button className={styles.btnPay} onClick={() => navigate(`/payment/${oid}`)}>立即付款</button>
              </div>
            </>
          )}
          {order.status === 'paid' && (
            <>
              <div className={styles.paidCountdown}>{formatShowCountdown(order.scheduleTime)}</div>
              <div className={styles.paidHint}>凭二维码取票更方便，取票码将不再以短信形式发送</div>
            </>
          )}
          {order.status === 'refunded' && (
            <>
              <div className={styles.statusTitle}>已退款</div>
              <div className={styles.statusDesc}>
                {order.refundTime ? new Date(order.refundTime).toLocaleString() : ''} 已退款
                {order.refundAmount != null ? `，退款金额：${order.refundAmount}元` : ''}
                （实付金额{order.totalPrice || 0}元，收取{(order.totalPrice || 0) - (order.refundAmount || 0)}元 退票费）
              </div>
              <div className={styles.statusActions}>
                <button className={styles.btnOutline} onClick={() => navigate(`/refund-progress/${oid}`)}>退款进度</button>
                <button className={styles.btnOutline} onClick={() => navigate(`/refund-detail/${oid}`)}>查看退款</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== 影院信息卡 ===== */}
      <div className={styles.card}>
        <div className={styles.cinemaRow}>
          <div className={styles.cinemaName} onClick={() => navigate(`/cinema-detail/${order.scheduleId || 1}`)}>
            <div>{order.cinemaName || '影院'}</div>
            <svg className={styles.arrowSvg} viewBox="0 0 96 96" fill="#959AA5"><path d="M55.1 48 32.3 26.9c-1.6-1.5-1.7-4-.2-5.7 1.5-1.6 4-1.7 5.7-.2l26 24c1.7 1.6 1.7 4.3 0 5.9l-26 24c-1.6 1.5-4.2 1.4-5.7-.2-1.5-1.6-1.4-4.2.2-5.7l22.8-21z"/></svg>
          </div>
          <div className={styles.cinemaIcons}>
            <svg className={styles.cIcon} viewBox="0 0 96 96"><path d="M68.3 56.5c9.1 3.3 13.8 13.2 10.8 22.3l-.3.8C75.6 88.5 64.8 93 56.4 90l-4-1.5h-.1c-12.8-5.9-24.4-16.6-30-27.8-6.7-13.2-8.4-30.3-3.5-43.9C22.4 7.1 32.2 2.7 41.7 6.2c9.3 3.4 14 13.6 10.6 22.9-2.4 6.5-8.2 10.5-14.9 11 .8 3.8 2.1 7.6 3.9 11.2C43.4 55.4 46 59 49 62c4.7-5.7 12.1-8.1 19.3-5.5z"/></svg>
            <svg className={styles.cIcon} viewBox="0 0 96 96"><path d="M48 91C42.6 91 9 65.1 9 43.7S26.5 5 48 5s39 17.3 39 38.7S53.4 91 48 91zm0-35c6.6 0 12-5.4 12-12s-5.4-12-12-12-12 5.4-12 12 5.4 12 12 12z"/></svg>
          </div>
        </div>
        <div className={styles.ticketMain}>
          <div className={styles.ticketLeft}>
            <div className={styles.tktTitle}>{order.filmName || '影片名称'}</div>
            <div className={styles.tktRow}>{filmType && <span>{filmType}</span>}<span className={styles.tktCount}>{order.count || 0}张</span></div>
            <div className={styles.tktRow2}><span className={styles.tktDayLabel}>{order.scheduleTime ? formatDate(order.scheduleTime) : ''}</span><span>{order.hallName || ''}</span></div>
            <div className={styles.tktRow3}><span>{order.scheduleTime ? order.scheduleTime.slice(11, 16) : ''}</span><span className={styles.tktSeats}>{order.seatLabels?.join(' ') || ''}</span></div>
          </div>
          <div className={styles.ticketRight}>
            {order.posterUrl ? <div className={styles.posterImg} style={{ backgroundImage: `url(${order.posterUrl})` }} /> : <div className={styles.posterPlaceholder} />}
          </div>
        </div>
      </div>

      {/* ===== 取票码（已支付 / 已退款置灰） ===== */}
      {(order.status === 'paid' || order.status === 'refunded') && (
        <div className={styles.card}>
          <div className={styles.qrTabs}>
            <span className={`${styles.qrTab} ${qrTab === 'ticket' ? styles.qrTabActive : ''}`} onClick={() => setQrTab('ticket')}>取电影票</span>
            <span className={`${styles.qrTab} ${qrTab === 'entry' ? styles.qrTabActive : ''}`} onClick={() => setQrTab('entry')}>扫码入场</span>
            <span className={styles.qrHelp} onClick={() => setShowHelp(true)}>如何取票 ›</span>
          </div>
          <div className={`${styles.qrBody} ${order.status === 'refunded' ? styles.qrDisabled : ''}`}>
            <div className={styles.qrCodeBox}>
              <FakeQR code={`${qrTab === 'ticket' ? 'TK' : 'EN'}_${order.orderNo || '000000'}`} />
              {order.status === 'refunded' && (
                <div className={styles.qrStamp}>
                  <svg viewBox="0 0 200 200" fill="#f8289c" width="80" height="80">
                    <path d="M150 13.4C197.83 41 214.22 102.17 186.6 150 159 197.83 97.83 214.22 50 186.6 2.17 159-14.22 97.83 13.4 50 41 2.17 102.17-14.22 150 13.4Zm-2 3.46a96 96 0 1 0-96 166.28 96 96 0 0 0 96-166.28ZM67.9 163.84l-2.98 3.57 1.26 4.48-4.31-1.73-3.87 2.59.3-4.64-3.65-2.88 4.5-1.15 1.62-4.36 2.48 3.93 4.64.19Zm21.63 5.34L87 172.25l1.08 3.83-3.7-1.47-3.32 2.2.26-3.97-3.13-2.47 3.87-.98 1.38-3.74 2.12 3.37 3.98.16Zm-38.1-22-2.55 3.07 1.08 3.83-3.7-1.47-3.31 2.2.26-3.97-3.13-2.47 3.86-.98 1.38-3.74 2.13 3.37 3.98.16Zm-14.19-17.43-2.54 3.07 1.08 3.83-3.7-1.47-3.32 2.21.26-3.98-3.13-2.46 3.86-.99 1.38-3.73 2.13 3.37 3.98.15Zm74.48 43-2.55 3.07 1.08 3.83-3.7-1.47-3.31 2.21.26-3.98-3.13-2.46 3.86-.99 1.38-3.73 2.13 3.37 3.98.15Z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div className={`${styles.codeSection} ${order.status === 'refunded' ? styles.codeDisabled : ''}`}>
            <div className={styles.codeLabel}>{qrTab === 'ticket' ? '取票码' : '入场码'}</div>
            <div className={styles.codeNum}>{order.orderNo?.slice(-8) || '000000'}</div>
            <div className={styles.codeHint}>{order.status === 'refunded' ? '该订单已退款，二维码已失效' : qrTab === 'ticket' ? '请在影院取票机上扫码或输入此码取票' : '请在影院检票口扫码入场'}</div>
          </div>
        </div>
      )}

      {order.status === 'paid' && (
        <div className={styles.card}>
          <div className={styles.detailHeader}><span>退改签</span></div>
          <div className={styles.endorseList}>
            <div className={styles.endorseItem}>
              <div className={styles.endorseContent}>
                <div className={styles.endorseStatus}>
                  <svg className={styles.endorseCheck} viewBox="0 0 96 96"><path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm17.1 27.9c-1.2-1.2-3.1-1.2-4.2 0L43 53.8l-7.9-7.9c-1.2-1.2-3.1-1.2-4.2 0s-1.2 3.1 0 4.2l10 10c1.2 1.2 3.1 1.2 4.2 0l20-20c1.2-1.2 1.2-3.1 0-4.2z" fill="#00b578"/></svg>
                  <span className={styles.endorseTitle}>限时改签</span>
                  <svg className={styles.endorseArrow} viewBox="0 0 96 96" fill="#959AA5"><path d="M55.1 48 32.3 26.9c-1.6-1.5-1.7-4-.2-5.7 1.5-1.6 4-1.7 5.7-.2l26 24c1.7 1.6 1.7 4.3 0 5.9l-26 24c-1.6 1.5-4.2 1.4-5.7-.2-1.5-1.6-1.4-4.2.2-5.7l22.8-21z"/></svg>
                </div>
                <div className={styles.endorseSubtitle}>未取票开场前1分钟可改签，改签费规则点击查看</div>
              </div>
              <button className={styles.endorseBtn} onClick={() => setShowEndorse(true)}>改签</button>
            </div>
            <div className={styles.endorseItem}>
              <div className={styles.endorseContent}>
                <div className={styles.endorseStatus}>
                  <svg className={styles.endorseCheck} viewBox="0 0 96 96"><path d="M48 8c22.1 0 40 17.9 40 40S70.1 88 48 88 8 70.1 8 48 25.9 8 48 8zm17.1 27.9c-1.2-1.2-3.1-1.2-4.2 0L43 53.8l-7.9-7.9c-1.2-1.2-3.1-1.2-4.2 0s-1.2 3.1 0 4.2l10 10c1.2 1.2 3.1 1.2 4.2 0l20-20c1.2-1.2 1.2-3.1 0-4.2z" fill="#00b578"/></svg>
                  <span className={styles.endorseTitle}>限时退票</span>
                  <svg className={styles.endorseArrow} viewBox="0 0 96 96" fill="#959AA5"><path d="M55.1 48 32.3 26.9c-1.6-1.5-1.7-4-.2-5.7 1.5-1.6 4-1.7 5.7-.2l26 24c1.7 1.6 1.7 4.3 0 5.9l-26 24c-1.6 1.5-4.2 1.4-5.7-.2-1.5-1.6-1.4-4.2.2-5.7l22.8-21z"/></svg>
                </div>
                <div className={styles.endorseSubtitle}>未取票开场前1分钟可退票，退票费规则点击查看</div>
              </div>
              <button className={styles.endorseBtn} onClick={() => navigate(`/refund-apply/${oid}`)}>退票</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 订单详情卡 ===== */}
      <div className={styles.card}>
        <div className={styles.detailHeader}><span>订单详情</span></div>
        <div className={styles.detailItem}><span className={styles.dLabel}>实付金额：</span><span className={styles.dVal}>¥{order.totalPrice || 0}</span></div>
        <div className={styles.detailItem}><span className={styles.dLabel}>订单编号：</span><span className={styles.dValRow}>{order.orderNo || '—'} <button className={styles.copyBtn} onClick={handleCopyOrderNo}>复制</button></span></div>
        <div className={styles.detailItem}><span className={styles.dLabel}>购买时间：</span><span className={styles.dVal}>{order.createTime || '—'}</span></div>
        <div className={styles.detailItem}><span className={styles.dLabel}>手机号码：</span><span className={styles.dVal}>{user?.userName || user?.userAccount || '—'}</span></div>
        <div className={styles.detailItem}><span className={styles.dVal}>电影票由鼎新提供</span></div>
      </div>

      {/* ===== 观影须知 ===== */}
      <div className={styles.card}>
        <div className={styles.detailHeader}><span>观影须知</span></div>
        <div className={styles.noticeText}>
          1. 请提前到达影院现场，找到自助取票机，打印纸质电影票，完成取票。<br />
          2. 如现场自助取票机无法打印电影票，请联系影院工作人员处理。<br />
          3. 凭打印好的纸质电影票，检票入场观影。<br />
          4. 如果订单使用了兑换券，或购买了特殊场次，暂不支持退票和改签。<br />
          5. 如有开具所购电影票发票的需求，请保留好电影票根。<br />
          6. 改签、退票服务由影城决定，特殊场次及使用兑换券的场次不支持改签、退票。
        </div>
      </div>

      {/* ===== 删除订单（仅已退款） ===== */}
      {order.status === 'refunded' && (
        <div className={styles.deleteSection}>
          <button
            className={styles.deleteBtn}
            onClick={async () => {
              try {
                await http.post(`/order/delete/${oid}`);
                Toast.show({ icon: 'success', content: '订单已删除' });
                navigate('/', { replace: true });
              } catch (e: any) {
                Toast.show({ icon: 'fail', content: e.message || '删除失败' });
              }
            }}
          >
            删除订单
          </button>
        </div>
      )}

      <SafeArea position="bottom" />

      {/* ===== 如何取票弹窗 ===== */}
      {showHelp && (
        <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.helpModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.helpTitle}>如何取票</div>
            <div className={styles.helpDesc}>到影院后,找到取票机^_^</div>
            <div className={styles.helpImg}>
              <img src="https://gw.alicdn.com/tps/TB1EM0WJVXXXXXraXXXXXXXXXXX-840-560.png" alt="" className={styles.helpImgFull} />
            </div>
            <div className={styles.helpDesc}>将二维码对准取票机二维码窗口即可扫码取票</div>
            <div className={styles.helpImg}>
              <img src="https://gw.alicdn.com/tps/TB1jBsrMVXXXXauXXXXXXXXXXXX-970-546.png" alt="" className={styles.helpImgFull} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketPage;
