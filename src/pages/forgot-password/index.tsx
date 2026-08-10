/**
 * 找回密码页 — 邮箱 + 验证码 + 新密码，一步提交
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Input, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendMailCode, resetPassword, loading } = useUserStore();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' });
      return;
    }
    if (countdown > 0) return;
    try {
      await sendMailCode(email);
      Toast.show({ icon: 'success', content: '验证码已发送' });
      startCountdown();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '发送失败' });
    }
  };

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' });
      return;
    }
    if (!code || code.length !== 6) {
      Toast.show({ icon: 'fail', content: '请输入6位验证码' });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      Toast.show({ icon: 'fail', content: '密码至少 8 位' });
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      Toast.show({ icon: 'fail', content: '密码必须包含字母和数字' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ icon: 'fail', content: '两次密码不一致' });
      return;
    }
    try {
      await resetPassword(email, code, newPassword, confirmPassword);
      Toast.show({ icon: 'success', content: '密码重置成功，请重新登录' });
      navigate('/user', { replace: true });
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '重置失败' });
    }
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)}>
        找回密码
      </NavBar>

      <div className={styles.card} style={{ marginTop: 20 }}>
        <div className={styles.cardTitle}>找回密码</div>
        <div className={styles.cardDesc}>请输入注册时使用的邮箱，我们将发送验证码</div>
        <div className={styles.cardDesc} style={{ color: '#faad14', fontSize: 12, marginTop: 4 }}>
          提示：如为微信注册用户，请扫码登录
        </div>

        <div className={styles.field}>
          <Input
            placeholder="请输入邮箱地址"
            value={email}
            onChange={(v) => setEmail(v)}
            clearable
          />
        </div>

        <div className={styles.codeRow}>
          <Input
            className={styles.codeField}
            placeholder="请输入验证码"
            value={code}
            onChange={(v) => setCode(v)}
            maxLength={6}
            type="number"
          />
          <Button
            className={styles.codeBtn}
            size="small"
            fill="none"
            loading={loading}
            disabled={countdown > 0}
            onClick={handleSendCode}
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </Button>
        </div>

        <div className={styles.field}>
          <Input
            placeholder="新密码（8位以上）"
            value={newPassword}
            onChange={(v) => setNewPassword(v)}
            type="password"
            clearable
          />
        </div>

        <div className={styles.field}>
          <Input
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(v) => setConfirmPassword(v)}
            type="password"
            clearable
          />
        </div>
        <div className={styles.passwordHint}>
          密码需包含字母和数字，长度不少于 8 位
        </div>

        <Button
          block
          color="primary"
          size="large"
          loading={loading}
          className={styles.submitBtn}
          onClick={handleSubmit}
        >
          重置密码
        </Button>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default ForgotPasswordPage;
