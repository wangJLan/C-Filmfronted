/**
 * 设置/修改密码页
 *
 * 两种模式由后端 needSetPassword 决定：
 *   needSetPassword=true  → 设置登录密码（无需旧密码）
 *   needSetPassword=false → 修改密码（需验证旧密码）
 */
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Input, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import styles from './index.module.less';

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setPassword, changePassword, loading } = useUserStore();

  const needSet = user?.needSetPassword !== false; // 默认 true（安全侧）
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
          {needSet ? '设置密码' : '修改密码'}
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
      if (needSet) {
        await setPassword(newPassword, confirmPassword);
        Toast.show({ icon: 'success', content: '密码设置成功' });
      } else {
        if (!oldPassword) {
          Toast.show({ icon: 'fail', content: '请输入旧密码' });
          return;
        }
        await changePassword(oldPassword, newPassword, confirmPassword);
        Toast.show({ icon: 'success', content: '密码修改成功' });
      }
      navigate(-1);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        {needSet ? '设置密码' : '修改密码'}
      </NavBar>

      <div className={styles.card}>
        <div className={styles.hint}>
          {needSet
            ? '您还未设置登录密码。设置后可使用邮箱+密码登录。'
            : `正在为 ${user.userAccount} 修改密码`}
        </div>

        {!needSet && (
          <div className={styles.field}>
            <Input
              placeholder="请输入旧密码"
              value={oldPassword}
              onChange={(v) => setOldPassword(v)}
              type="password"
              clearable
            />
          </div>
        )}

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
          {needSet ? '设置密码' : '修改密码'}
        </Button>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default SetPasswordPage;
