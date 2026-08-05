import React, { useState, useEffect, useRef } from 'react';
import { Button, Avatar, Form, Input, Toast, Tabs, Modal } from 'antd-mobile';
import { useNavigate } from 'umi';
import { useUserStore } from '@/stores/useUserStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useFilmCollectionStore } from '@/stores/useFilmCollectionStore';
import {
  BillOutline, CheckCircleOutline, StarOutline, ExclamationCircleOutline,
  SetOutline, GiftOutline, RightOutline, HistogramOutline,
} from 'antd-mobile-icons';
import styles from './index.module.less';

const orderGrid = [
  { icon: <BillOutline fontSize={24} />, label: '待付款', tab: 'pending' },
  { icon: <CheckCircleOutline fontSize={24} />, label: '已完成', tab: 'completed' },
  { icon: <StarOutline fontSize={24} />, label: '待评价', tab: 'completed' },
  { icon: <ExclamationCircleOutline fontSize={24} />, label: '退改', tab: 'cancelled' },
];

const functionList = [
  { icon: <GiftOutline fontSize={20} />, label: '我的钱包', path: '/wallet' },
  { icon: <GiftOutline fontSize={20} />, label: '优惠券', path: '/coupons' },
  { icon: <StarOutline fontSize={20} />, label: '想看的电影', path: '/want-to-see' },
  { icon: <HistogramOutline fontSize={20} />, label: '看过的电影', path: '/watched' },
];

// ==================== 工具函数 ====================

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** 校验邮箱格式 */
function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

// ==================== 邮箱验证码登录 Tab ====================

const EmailLoginForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { sendMailCode, loginByMail, loading } = useUserStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
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
    if (!isValidEmail(email)) {
      Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' });
      return;
    }
    if (countdown > 0) return;
    try {
      await sendMailCode(email);
      Toast.show({ icon: 'success', content: '验证码已发送，请查收邮件' });
      startCountdown();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '发送失败' });
    }
  };

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' });
      return;
    }
    if (!code || code.length !== 6) {
      Toast.show({ icon: 'fail', content: '请输入6位验证码' });
      return;
    }
    try {
      await loginByMail(email, code);
      onSuccess();

      // 新用户弹窗提醒设置密码
      const user = useUserStore.getState().user;
      if (user?.needSetPassword) {
        Modal.confirm({
          title: '设置登录密码',
          content: '检测到您还未设置密码。\n建议设置密码，方便下次使用邮箱+密码登录。',
          confirmText: '去设置',
          cancelText: '暂跳过',
          onConfirm: () => navigate('/forgot-password'),
        });
      }
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '登录失败' });
    }
  };

  return (
    <div className={styles.loginPanel}>
      <div className={styles.loginTip}>未注册手机号验证后自动创建账号</div>

      <div className={styles.inputGroup}>
        <Input
          className={styles.loginInput}
          placeholder="请输入邮箱地址"
          value={email}
          onChange={(v) => setEmail(v)}
          clearable
        />
      </div>

      <div className={styles.codeRow}>
        <Input
          className={styles.codeInput}
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
        loading={loading}
        className={styles.submitBtn}
        onClick={handleSubmit}
      >
        登录
      </Button>
    </div>
  );
};

// ==================== 账号密码登录 Tab ====================

const PasswordLoginForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { login, loading } = useUserStore();
  const navigate = useNavigate();

  const handleSubmit = async (values: { account: string; password: string }) => {
    if (!isValidEmail(values.account)) {
      Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' });
      return;
    }
    if (!values.password) {
      Toast.show({ icon: 'fail', content: '请输入密码' });
      return;
    }
    try {
      await login({
        userAccount: values.account,
        userPassword: values.password,
        checkPassword: values.password,
      });
      Toast.show({ icon: 'success', content: '登录成功' });
      onSuccess();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '登录失败' });
    }
  };

  return (
    <div className={styles.loginPanel}>
      <Form
        onFinish={handleSubmit}
        layout="horizontal"
        footer={
          <Button
            block
            type="submit"
            color="primary"
            size="large"
            loading={loading}
            className={styles.submitBtn}
          >
            登录
          </Button>
        }
      >
        <Form.Item
          name="account"
          rules={[{ required: true, message: '请输入邮箱' }]}
        >
          <Input
            className={styles.loginInput}
            placeholder="请输入邮箱"
            clearable
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input
            className={styles.loginInput}
            placeholder="请输入密码（8位以上）"
            type="password"
            clearable
          />
        </Form.Item>
      </Form>

      <div className={styles.forgotRow}>
        <span className={styles.forgotLink} onClick={() => navigate('/forgot-password')}>
          忘记密码？
        </span>
      </div>
    </div>
  );
};

// ==================== 账号密码注册 Tab ====================

const RegisterForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { register, loading } = useUserStore();

  const handleSubmit = async (values: { account: string; password: string; confirm: string }) => {
    if (!isValidEmail(values.account)) {
      Toast.show({ icon: 'fail', content: '请输入正确的邮箱地址' });
      return;
    }
    if (!values.password || values.password.length < 8) {
      Toast.show({ icon: 'fail', content: '密码至少 8 位' });
      return;
    }
    if (!/[a-zA-Z]/.test(values.password) || !/[0-9]/.test(values.password)) {
      Toast.show({ icon: 'fail', content: '密码必须包含字母和数字' });
      return;
    }
    if (values.password !== values.confirm) {
      Toast.show({ icon: 'fail', content: '两次密码不一致' });
      return;
    }
    try {
      await register({
        userAccount: values.account,
        userPassword: values.password,
        checkPassword: values.confirm,
      });
      Toast.show({ icon: 'success', content: '注册成功，已自动登录' });
      onSuccess();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '注册失败' });
    }
  };

  return (
    <div className={styles.loginPanel}>
      <Form
        onFinish={handleSubmit}
        layout="horizontal"
        footer={
          <Button
            block
            type="submit"
            color="primary"
            size="large"
            loading={loading}
            className={styles.submitBtn}
          >
            注册
          </Button>
        }
      >
        <Form.Item
          name="account"
          rules={[{ required: true, message: '请输入邮箱作为账号' }]}
        >
          <Input
            className={styles.loginInput}
            placeholder="请输入邮箱作为登录账号"
            clearable
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '密码至少8位' }]}
        >
          <Input
            className={styles.loginInput}
            placeholder="请设置密码（8位以上）"
            type="password"
            clearable
          />
        </Form.Item>

        <Form.Item
          name="confirm"
          rules={[{ required: true, message: '请再次输入密码' }]}
        >
          <Input
            className={styles.loginInput}
            placeholder="确认密码"
            type="password"
            clearable
          />
        </Form.Item>
      </Form>
    </div>
  );
};

// ==================== 用户页面 ====================

const UserPage: React.FC = () => {
  const { user, isLoggedIn, loading, logout } = useUserStore();
  const orderCount = useOrderStore((s) => s.orders.filter((o) => o.status !== 'cancelled').length);
  const wantCount = useFilmCollectionStore((s) => s.wantToSee.length);
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loginTab, setLoginTab] = useState<'email' | 'password' | 'register'>('email');

  const handleLoginSuccess = () => setShowForm(false);

  // ========== 已登录 ==========
  if (isLoggedIn && user) {
    return (
      <div className={styles.page}>
        <div className={styles.header} onClick={() => navigate('/profile-edit')}>
          <Avatar src={user.userAvatar || ''} style={{ '--size': '68px', border: '3px solid rgba(255,255,255,0.5)' }} />
          <h2 className={styles.nickname}>{user.userName || user.userAccount}</h2>
          <p className={styles.desc}>{user.userProfile || '欢迎来到妙语购票'}</p>
          <span className={styles.editHint}>点击编辑资料 ›</span>
        </div>

        <div className={styles.vipCard} onClick={() => navigate('/wallet')}>
          <div className={styles.vipLeft}>
            <span className={styles.vipCrown}>👑</span>
            <div>
              <div className={styles.vipTitle}>妙语会员</div>
              <div className={styles.vipSubtitle}>开通享观影特惠 · 每月省更多</div>
            </div>
          </div>
          <div className={styles.vipBtn}>立即开通 ›</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>我的订单</span>
            <span className={styles.cardMore} onClick={() => navigate('/orders')}>
              全部 {orderCount > 0 ? `(${orderCount})` : ''} ›
            </span>
          </div>
          <div className={styles.orderGrid}>
            {orderGrid.map((item, idx) => (
              <div key={idx} className={styles.orderItem} onClick={() => navigate(`/orders?tab=${item.tab}`)}>
                <span className={styles.orderIcon}>{item.icon}</span>
                <span className={styles.orderLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card} style={{ marginTop: 10 }}>
          {functionList.map((item, idx) => (
            <div key={idx} className={styles.funcItem} onClick={() => navigate(item.path)}>
              <span className={styles.funcIcon}>{item.icon}</span>
              <span className={styles.funcLabel}>{item.label}</span>
              <span className={styles.funcBadge}>
                {item.path === '/want-to-see' && wantCount > 0 ? wantCount : ''}
              </span>
              <RightOutline fontSize={14} color="#ccc" />
            </div>
          ))}
        </div>

        <div className={styles.card} style={{ marginTop: 10 }}>
          <div className={styles.funcItem} onClick={() => navigate('/settings')}>
            <span className={styles.funcIcon}><SetOutline fontSize={20} /></span>
            <span className={styles.funcLabel}>设置</span>
            <RightOutline fontSize={14} color="#ccc" />
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          <Button block color="danger" size="large" onClick={logout}>退出登录</Button>
        </div>
      </div>
    );
  }

  // ========== 未登录 ==========
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Avatar src="" style={{ '--size': '68px', border: '3px solid rgba(255,255,255,0.5)' }} />
        <h2 className={styles.nickname}>未登录</h2>
        <p className={styles.desc}>登录后享受更多权益</p>
      </div>

      {!showForm ? (
        <div style={{ padding: '16px' }}>
          <Button block size="large" loading={loading} className={styles.entryBtn} onClick={() => setShowForm(true)}>
            登录 / 注册
          </Button>
        </div>
      ) : (
        <div className={styles.formWrap}>
          <Tabs
            activeKey={loginTab}
            onChange={(key) => setLoginTab(key as typeof loginTab)}
            className={styles.loginTabs}
          >
            <Tabs.Tab title="验证码登录" key="email" />
            <Tabs.Tab title="密码登录" key="password" />
            <Tabs.Tab title="注册" key="register" />
          </Tabs>

          {loginTab === 'email' && <EmailLoginForm onSuccess={handleLoginSuccess} />}
          {loginTab === 'password' && <PasswordLoginForm onSuccess={handleLoginSuccess} />}
          {loginTab === 'register' && <RegisterForm onSuccess={handleLoginSuccess} />}

          <Button block fill="none" size="small" onClick={() => setShowForm(false)} style={{ marginTop: 8 }}>
            返回
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserPage;
