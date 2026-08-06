/**
 * 微信扫码登录组件
 * 展示公众号二维码 → 轮询扫码状态 → 完成登录
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, SpinLoading, Toast } from 'antd-mobile';
import { createQrCode, checkLogin } from '@/api/weixinPortalController';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const POLL_INTERVAL = 2000;

interface WeixinLoginProps {
  onDone: () => void;
}

type Status = 'loading' | 'ready' | 'scanned' | 'error';

const WeixinLogin: React.FC<WeixinLoginProps> = ({ onDone }) => {
  const loginByWeixin = useUserStore((s) => s.loginByWeixin);
  const [status, setStatus] = useState<Status>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [ticket, setTicket] = useState<string>('');
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  // 用 ref 保存最新的回调，避免闭包捕获旧引用
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const ticketRef = useRef(ticket);
  ticketRef.current = ticket;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchQrCode = useCallback(async () => {
    stopPolling();
    setStatus('loading');
    try {
      const data: any = await createQrCode();
      if (!mountedRef.current) return;
      const t = data?.ticket || '';
      console.log('[WeixinLogin] 获取二维码 ticket:', t);
      setQrCodeUrl(data?.qrCodeUrl || '');
      setTicket(t);
      setStatus('ready');
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.log('[WeixinLogin] 获取二维码失败:', e);
      setStatus('error');
      Toast.show({ icon: 'fail', content: '获取二维码失败' });
    }
  }, [stopPolling]);

  // 挂载后获取二维码
  useEffect(() => {
    fetchQrCode();
    return () => stopPolling();
  }, [fetchQrCode, stopPolling]);

  // 二维码就绪后轮询
  useEffect(() => {
    if (status !== 'ready' || !ticket) return;

    console.log('[WeixinLogin] 开始轮询, ticket:', ticket);
    const currentTicket = ticket; // 捕获当前 ticket

    const poll = async () => {
      try {
        const data: any = await checkLogin({ ticket: ticketRef.current || currentTicket });
        console.log('[WeixinLogin] 轮询结果:', data);
        if (!mountedRef.current) return;

        if (data?.scanned && data?.openid) {
          stopPolling();
          setStatus('scanned');
          console.log('[WeixinLogin] 检测到扫码, openid:', data.openid);
          try {
            await loginByWeixin(data.openid);
            if (!mountedRef.current) return;
            console.log('[WeixinLogin] 登录成功，触发 onDone');
            onDoneRef.current();
          } catch (e: any) {
            if (!mountedRef.current) return;
            console.log('[WeixinLogin] 登录失败:', e);
            Toast.show({ icon: 'fail', content: e.message || '登录失败' });
            // 登录失败：重新获取二维码（旧 ticket 可能已失效）
            fetchQrCode();
          }
        }
      } catch (e) {
        console.log('[WeixinLogin] 轮询请求异常:', e);
      }
    };

    timerRef.current = window.setInterval(poll, POLL_INTERVAL);
    // 立即执行一次，减少等待
    poll();

    return () => stopPolling();
  }, [status, ticket, stopPolling, fetchQrCode, loginByWeixin]);

  return (
    <div className={styles.wrap}>
      <div className={styles.qrBox}>
        {status === 'loading' && (
          <div className={styles.qrPlaceholder}>
            <SpinLoading color="primary" style={{ '--size': '36px' }} />
            <span className={styles.qrHint}>正在加载二维码…</span>
          </div>
        )}

        {status === 'ready' && qrCodeUrl && (
          <>
            <img className={styles.qrImg} src={qrCodeUrl} alt="微信扫码登录" />
            <div className={styles.qrHint}>请使用微信"扫一扫"扫描二维码</div>
          </>
        )}

        {status === 'scanned' && (
          <div className={styles.qrPlaceholder}>
            <SpinLoading color="primary" style={{ '--size': '36px' }} />
            <span className={styles.qrHint}>扫码成功，正在登录…</span>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.qrPlaceholder}>
            <span className={styles.qrHint}>加载失败</span>
            <Button size="small" color="primary" fill="none" onClick={fetchQrCode}>
              点击重试
            </Button>
          </div>
        )}
      </div>

      <div className={styles.tip}>
        <p>关注微信公众号，扫码一键登录</p>
        <p>首次扫码自动注册，无需密码</p>
      </div>

      {status === 'ready' && (
        <Button
          size="small"
          fill="none"
          className={styles.refreshBtn}
          onClick={fetchQrCode}
        >
          刷新二维码
        </Button>
      )}
    </div>
  );
};

export default WeixinLogin;
