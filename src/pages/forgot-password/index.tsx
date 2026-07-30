/**
 * 找回密码页 — 邮箱 → 验证码 → 设置新密码
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Input, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline, CheckCircleOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendMailCode, resetPassword, loading } = useUserStore();

  // Step 1: 邮箱 + 验证码
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Step 2: 新密码
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      Toast.show({ icon: 'fail', content: '请输入6位验证码' });
      return;
    }
    // 验证码暂不在此提交，进下一步再提交
    setStep(2);
  };

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      Toast.show({ icon: 'fail', content: '新密码至少 8 位' });
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
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        找回密码
      </NavBar>

      {/* 进度指示 */}
      <div className={styles.steps}>
        <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>
          <span className={styles.stepNum}>1</span>
          <span className={styles.stepLabel}>验证身份</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>
          <span className={styles.stepNum}>2</span>
          <span className={styles.stepLabel}>设置新密码</span>
        </div>
      </div>

      {step === 1 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>验证您的邮箱</div>
          <div className={styles.cardDesc}>请输入注册时使用的邮箱，我们将发送验证码</div>

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

          <Button
            block
            color="primary"
            size="large"
            className={styles.submitBtn}
            onClick={handleVerifyCode}
            disabled={!email || !code}
          >
            下一步
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>设置新密码</div>
          <div className={styles.cardDesc}>
            为 <strong>{email}</strong> 设置新密码
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
            onClick={handleReset}
          >
            重置密码
          </Button>

          <Button
            block
            fill="none"
            size="small"
            onClick={() => setStep(1)}
            style={{ marginTop: 12, color: '#999' }}
          >
            ← 返回上一步
          </Button>
        </div>
      )}

      <SafeArea position="bottom" />
    </div>
  );
};

export default ForgotPasswordPage;
