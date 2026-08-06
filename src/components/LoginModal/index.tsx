/**
 * 全局登录弹窗 — 挂载在 BasicLayout，被 useLoginGuardStore 触发
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'umi';
import {
  Popup, Button, Tabs, Input, Toast, Modal, SafeArea,
} from 'antd-mobile';
import { useUserStore } from '@/stores/useUserStore';
import { useLoginGuardStore } from '@/stores/useLoginGuard';
import WechatLogin from '@/components/WechatLogin';
import styles from './index.module.less';

// ==================== 邮箱验证码登录子组件 ====================

const MailTab: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { sendMailCode, loginByMail, loading } = useUserStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCd = () => {
    setCountdown(60);
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSend = async () => {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) { Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' }); return; }
    if (countdown > 0) return;
    try { await sendMailCode(email); Toast.show({ icon: 'success', content: '验证码已发送' }); startCd(); } catch (e: any) { Toast.show({ icon: 'fail', content: e.message || '发送失败' }); }
  };

  const handleLogin = async () => {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) { Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' }); return; }
    if (code.length !== 6) { Toast.show({ icon: 'fail', content: '请输入6位验证码' }); return; }
    try {
      await loginByMail(email, code);
      onDone();
      const user = useUserStore.getState().user;
      if (user?.needSetPassword) {
        Modal.confirm({
          title: '设置登录密码',
          content: '检测到您还未设置密码。\n建议设置密码，方便下次使用邮箱+密码登录。',
          confirmText: '去设置',
          cancelText: '暂跳过',
          onConfirm: () => navigate('/set-password'),
        });
      }
    } catch (e: any) { Toast.show({ icon: 'fail', content: e.message || '登录失败' }); }
  };

  return (
    <div className={styles.tabBody}>
      <div className={styles.tip}>未注册邮箱验证后自动创建账号</div>
      <Input className={styles.inp} placeholder="请输入邮箱地址" value={email} onChange={(v) => setEmail(v)} clearable />
      <div className={styles.codeRow}>
        <Input className={styles.codeInp} placeholder="验证码" value={code} onChange={(v) => setCode(v)} maxLength={6} type="number" />
        <Button className={styles.codeBtn} size="small" fill="none" loading={loading} disabled={countdown > 0} onClick={handleSend}>
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </Button>
      </div>
      <Button block color="primary" size="large" loading={loading} className={styles.submitBtn} onClick={handleLogin}>登录</Button>
    </div>
  );
};

// ==================== 密码登录子组件 ====================

const PwdTab: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { login, loading } = useUserStore();
  const navigate = useNavigate();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(account.trim())) { Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' }); return; }
    if (!password) { Toast.show({ icon: 'fail', content: '请输入密码' }); return; }
    try {
      await login({ userAccount: account, userPassword: password, checkPassword: password });
      onDone();
    } catch (e: any) { Toast.show({ icon: 'fail', content: e.message || '登录失败' }); }
  };

  return (
    <div className={styles.tabBody}>
      <Input className={styles.inp} placeholder="请输入邮箱" value={account} onChange={(v) => setAccount(v)} clearable />
      <Input className={styles.inp} placeholder="请输入密码（8位以上）" type="password" value={password} onChange={(v) => setPassword(v)} clearable />
      <Button block color="primary" size="large" loading={loading} className={styles.submitBtn} onClick={handleSubmit}>登录</Button>
      <div className={styles.forgot} onClick={() => { navigate('/forgot-password'); }}>忘记密码？</div>
    </div>
  );
};

// ==================== 弹窗主组件 ====================

const LoginModal: React.FC = () => {
  const { open, closePanel, onLoginSuccess } = useLoginGuardStore();
  const [tab, setTab] = useState<'wechat' | 'mail' | 'pwd'>('wechat');
  // ★ 每次弹窗打开时生成新 key，强制 WechatLogin 重新挂载，清除上次扫码状态
  const [wechatKey, setWechatKey] = useState(0);

  useEffect(() => {
    if (open) {
      setWechatKey((k) => k + 1);
      setTab('wechat'); // 重置到微信 tab
    }
  }, [open]);

  const handleDone = () => {
    onLoginSuccess();
    Toast.show({ icon: 'success', content: '登录成功' });
  };

  return (
    <Popup
      visible={open}
      onMaskClick={closePanel}
      onClose={closePanel}
      bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: '50vh' }}
    >
      <div className={styles.header}>
        <span className={styles.title}>登录妙语购票</span>
        <span className={styles.close} onClick={closePanel}>✕</span>
      </div>

      <Tabs activeKey={tab} onChange={(k) => setTab(k as typeof tab)} className={styles.tabs}>
        <Tabs.Tab title="💚 微信" key="wechat" />
        <Tabs.Tab title="验证码" key="mail" />
        <Tabs.Tab title="密码" key="pwd" />
      </Tabs>

      {tab === 'wechat' && <WechatLogin key={wechatKey} onSuccess={handleDone} />}
      {tab === 'mail' && <MailTab onDone={handleDone} />}
      {tab === 'pwd' && <PwdTab onDone={handleDone} />}

      <SafeArea position="bottom" />
    </Popup>
  );
};

export default LoginModal;
