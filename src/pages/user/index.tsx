import React, { useState, useEffect } from 'react';
import { Button, Avatar, List, Form, Input, Toast, Tabs } from 'antd-mobile';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const UserPage: React.FC = () => {
  const { user, isLoggedIn, loading, init, login, register, logout } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // 页面挂载时尝试从 Session 恢复登录态
  useEffect(() => {
    init();
  }, []);

  /** 登录/注册表单提交 */
  const handleSubmit = async (values: { account: string; password: string; confirm?: string }) => {
    try {
      const params = {
        userAccount: values.account,
        userPassword: values.password,
        checkPassword: values.confirm || values.password,
      };

      if (activeTab === 'register') {
        if (values.password !== values.confirm) {
          Toast.show({ icon: 'fail', content: '两次密码不一致' });
          return;
        }
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
          <Avatar src={user.userAvatar || ''} style={{ '--size': '64px' }} />
          <h2 className={styles.nickname}>{user.userName || user.userAccount}</h2>
          <p className={styles.desc}>{user.userProfile || '欢迎回来'}</p>
        </div>

        <List header="我的订单" style={{ marginTop: 0 }}>
          <List.Item onClick={() => {}}>全部订单</List.Item>
          <List.Item onClick={() => {}}>待支付</List.Item>
          <List.Item onClick={() => {}}>已完成</List.Item>
        </List>

        <List header="设置" style={{ marginTop: 12 }}>
          <List.Item onClick={() => {}}>个人信息</List.Item>
          <List.Item onClick={() => {}}>关于我们</List.Item>
        </List>

        <div style={{ padding: '0 16px' }}>
          <Button
            block
            color="danger"
            size="large"
            onClick={logout}
            style={{ marginTop: 32 }}
          >
            退出登录
          </Button>
        </div>
      </div>
    );
  }

  // ========== 未登录 ==========
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Avatar src="" style={{ '--size': '64px' }} />
        <h2 className={styles.nickname}>未登录</h2>
        <p className={styles.desc}>登录后享受更多权益</p>
      </div>

      {!showForm ? (
        <div style={{ padding: '16px' }}>
          <Button
            block
            color="primary"
            size="large"
            loading={loading}
            onClick={() => setShowForm(true)}
          >
            登录 / 注册
          </Button>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'login' | 'register')}
            style={{ marginBottom: 16 }}
          >
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
              <Form.Item
                name="confirm"
                label="确认密码"
                rules={[{ required: true, message: '请再次输入密码' }]}
              >
                <Input placeholder="请确认密码" type="password" clearable />
              </Form.Item>
            )}
          </Form>

          <Button
            block
            fill="none"
            size="small"
            onClick={() => setShowForm(false)}
            style={{ marginTop: 12 }}
          >
            返回
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserPage;
