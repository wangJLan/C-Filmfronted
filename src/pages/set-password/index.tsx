/**
 * 设置密码页 — 输入两次新密码
 */
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Input, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setPassword, loading } = useUserStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)}>
          设置密码
        </NavBar>
        <div className={styles.empty}>请先登录</div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      Toast.show({ icon: 'fail', content: '新密码至少 8 位' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ icon: 'fail', content: '两次密码不一致' });
      return;
    }
    try {
      await setPassword(newPassword, confirmPassword);
      Toast.show({ icon: 'success', content: '密码设置成功' });
      navigate(-1);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)}>
        设置密码
      </NavBar>

      <div className={styles.card}>
        <div className={styles.hint}>请输入新密码</div>

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

        <div className={styles.rule}>密码至少 8 位，建议包含字母和数字</div>

        <Button
          block
          color="primary"
          size="large"
          loading={loading}
          className={styles.submitBtn}
          onClick={handleSubmit}
        >
          设置密码
        </Button>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default SetPasswordPage;
