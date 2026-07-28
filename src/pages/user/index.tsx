import React, { useState, useEffect } from 'react';
import { Button, Avatar, Form, Input, Toast, Tabs } from 'antd-mobile';
import { useUserStore } from '@/stores/useUserStore';
import {
  BillOutline, CheckCircleOutline, StarOutline, ExclamationCircleOutline,
  SetOutline, GiftOutline, RightOutline, HistogramOutline,
} from 'antd-mobile-icons';
import styles from './index.module.less';

const orderGrid = [
  { icon: <BillOutline fontSize={24} />, label: '待付款' },
  { icon: <CheckCircleOutline fontSize={24} />, label: '已完成' },
  { icon: <StarOutline fontSize={24} />, label: '待评价' },
  { icon: <ExclamationCircleOutline fontSize={24} />, label: '退改' },
];

const functionList = [
  { icon: <GiftOutline fontSize={20} />, label: '我的钱包' },
  { icon: <GiftOutline fontSize={20} />, label: '优惠券' },
  { icon: <StarOutline fontSize={20} />, label: '想看的电影' },
  { icon: <HistogramOutline fontSize={20} />, label: '看过的电影' },
];

const UserPage: React.FC = () => {
  const { user, isLoggedIn, loading, init, login, register, logout } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  useEffect(() => { init(); }, []);

  const handleSubmit = async (values: { account: string; password: string; confirm?: string }) => {
    try {
      const params = { userAccount: values.account, userPassword: values.password, checkPassword: values.confirm || values.password };
      if (activeTab === 'register') {
        if (values.password !== values.confirm) { Toast.show({ icon: 'fail', content: '两次密码不一致' }); return; }
        await register(params);
        Toast.show({ icon: 'success', content: '注册成功' });
      } else {
        await login(params);
        Toast.show({ icon: 'success', content: '登录成功' });
      }
      setShowForm(false);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  // ========== 已登录 ==========
  if (isLoggedIn && user) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Avatar src={user.userAvatar || ''} style={{ '--size': '68px', border: '3px solid rgba(255,255,255,0.5)' }} />
          <h2 className={styles.nickname}>{user.userName || user.userAccount}</h2>
          <p className={styles.desc}>{user.userProfile || '欢迎来到妙语购票'}</p>
        </div>

        {/* VIP 会员卡 */}
        <div className={styles.vipCard} onClick={() => Toast.show({ content: '会员功能开发中' })}>
          <div className={styles.vipLeft}>
            <span className={styles.vipCrown}>👑</span>
            <div>
              <div className={styles.vipTitle}>妙语会员</div>
              <div className={styles.vipSubtitle}>开通享观影特惠 · 每月省更多</div>
            </div>
          </div>
          <div className={styles.vipBtn}>立即开通 ›</div>
        </div>

        {/* 订单入口 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>我的订单</span>
            <span className={styles.cardMore} onClick={() => Toast.show({ content: '查看全部订单' })}>全部 ›</span>
          </div>
          <div className={styles.orderGrid}>
            {orderGrid.map((item, idx) => (
              <div key={idx} className={styles.orderItem} onClick={() => Toast.show({ content: `${item.label} — 功能开发中` })}>
                <span className={styles.orderIcon}>{item.icon}</span>
                <span className={styles.orderLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 功能列表 */}
        <div className={styles.card} style={{ marginTop: 10 }}>
          {functionList.map((item, idx) => (
            <div key={idx} className={styles.funcItem} onClick={() => Toast.show({ content: `${item.label} — 功能开发中` })}>
              <span className={styles.funcIcon}>{item.icon}</span>
              <span className={styles.funcLabel}>{item.label}</span>
              <RightOutline fontSize={14} color="#ccc" />
            </div>
          ))}
        </div>

        {/* 设置 */}
        <div className={styles.card} style={{ marginTop: 10 }}>
          <div className={styles.funcItem} onClick={() => Toast.show({ content: '设置 — 功能开发中' })}>
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
          <Button block color="primary" size="large" loading={loading} onClick={() => setShowForm(true)}>
            登录 / 注册
          </Button>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'login' | 'register')} style={{ marginBottom: 16 }}>
            <Tabs.Tab title="登录" key="login" />
            <Tabs.Tab title="注册" key="register" />
          </Tabs>
          <Form
            onFinish={handleSubmit}
            footer={
              <Button block type="submit" color="primary" size="large" loading={loading}>
                {activeTab === 'login' ? '登录' : '注册'}
              </Button>
            }
          >
            <Form.Item name="account" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
              <Input placeholder="请输入账号" clearable />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input placeholder="请输入密码" type="password" clearable />
            </Form.Item>
            {activeTab === 'register' && (
              <Form.Item name="confirm" label="确认密码" rules={[{ required: true, message: '请再次输入密码' }]}>
                <Input placeholder="请确认密码" type="password" clearable />
              </Form.Item>
            )}
          </Form>
          <Button block fill="none" size="small" onClick={() => setShowForm(false)} style={{ marginTop: 12 }}>返回</Button>
        </div>
      )}
    </div>
  );
};

export default UserPage;
