import { createQrCode, checkLogin } from '@/api/weixinPortalController';
import { useUserStore } from '@/stores/useUserStore';
import { SpinLoading } from 'antd-mobile';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.module.less';

interface WechatLoginProps {
  onSuccess: () => void;
}

/**
 * 微信扫码登录组件（移动端 H5）
 * - 展示公众号二维码
 * - 轮询扫码状态
 * - 扫码后自动登录
 */
const WechatLogin: React.FC<WechatLoginProps> = ({ onSuccess }) => {
  const { loginByWechat } = useUserStore();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [ticket, setTicket] = useState('');
  const [status, setStatus] = useState<'loading' | 'waiting' | 'scanned' | 'expired' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loginCalledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // 生成二维码
  const fetchQrCode = useCallback(async () => {
    try {
      setStatus('loading');
      setErrorMsg('');
      stopPolling();
      loginCalledRef.current = false;

      const data = await createQrCode();
      // 响应拦截器已解包 BaseResponse，data 直接是 { ticket, qrCodeUrl }
      if (data?.ticket && data?.qrCodeUrl) {
        setTicket(data.ticket);
        // URL 编码 ticket 防特殊字符
        const encodedUrl = (data.qrCodeUrl as string).replace(
          /ticket=([^&]+)/,
          (_, t) => 'ticket=' + encodeURIComponent(t),
        );
        setQrCodeUrl(encodedUrl);
        setStatus('waiting');
      } else {
        setStatus('error');
        setErrorMsg('获取二维码失败');
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message || '网络异常，请稍后重试');
    }
  }, [stopPolling]);

  // 开始轮询
  const startPolling = useCallback(
    (t: string) => {
      stopPolling();
      timerRef.current = setInterval(async () => {
        if (loginCalledRef.current) return;
        try {
          const data = await checkLogin({ ticket: t });
          // 响应已解包：{ scanned, openid }
          if (data?.scanned && data?.openid) {
            loginCalledRef.current = true;
            stopPolling();
            setStatus('scanned');

            try {
              await loginByWechat(data.openid as string);
              // ★ Toast 由父组件统一处理，避免重复弹
              onSuccess();
            } catch (loginErr: any) {
              setStatus('error');
              setErrorMsg(loginErr?.message || '登录校验失败');
              loginCalledRef.current = false;
            }
          }
        } catch {
          // 轮询网络错误不中断
        }
      }, 2000);
    },
    [stopPolling, loginByWechat, onSuccess],
  );

  // ticket 就绪后开始轮询
  useEffect(() => {
    if (ticket && status === 'waiting') startPolling(ticket);
  }, [ticket, status, startPolling]);

  useEffect(() => {
    fetchQrCode();
  }, [fetchQrCode]);

  return (
    <div className={styles.wechatWrap}>
      <div className={styles.qrBox}>
        {status === 'loading' && (
          <div className={styles.qrPlaceholder}>
            <div className={styles.qrLoadingPulse}>
              <SpinLoading color="primary" style={{ '--size': '32px' }} />
            </div>
            <span className={styles.qrHint}>正在生成二维码...</span>
            <span className={styles.qrSubHint}>请稍候，正在连接微信服务器</span>
          </div>
        )}

        {status === 'waiting' && qrCodeUrl && (
          <>
            <img className={styles.qrImg} src={qrCodeUrl} alt="微信扫码登录" />
            <div className={styles.qrTip}>
              <span className={styles.wechatIcon}>💚</span>
              请使用微信扫一扫登录
            </div>
          </>
        )}

        {status === 'scanned' && (
          <div className={styles.qrPlaceholder}>
            <span className={styles.scanOk}>✅</span>
            <span className={styles.qrHint}>扫码成功，正在登录...</span>
          </div>
        )}

        {(status === 'expired' || status === 'error') && (
          <div className={styles.qrPlaceholder}>
            <span className={styles.errorIcon}>⏰</span>
            <span className={styles.qrHint}>{errorMsg || '二维码已过期'}</span>
            <button className={styles.refreshBtn} onClick={fetchQrCode}>
              刷新二维码
            </button>
          </div>
        )}
      </div>

      {status === 'waiting' && (
        <div className={styles.refreshLink} onClick={fetchQrCode}>
          点击刷新二维码
        </div>
      )}

      <div className={styles.wechatNote}>
        关注公众号后扫码登录，新用户自动注册
      </div>
    </div>
  );
};

export default WechatLogin;
