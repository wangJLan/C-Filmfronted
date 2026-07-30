/**
 * 编辑个人资料页 — 昵称 / 头像 / 简介
 */
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Form, Input, TextArea, Toast, SafeArea, Avatar } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import { updateMyProfile } from '@/services/api/user';
import styles from './index.module.less';

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const [saving, setSaving] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(user?.userAvatar || '');

  if (!user) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>编辑资料</NavBar>
        <div className={styles.empty}>请先登录</div>
      </div>
    );
  }

  const handleSubmit = async (values: {
    nickname: string;
    avatar: string;
    bio: string;
  }) => {
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        userName: values.nickname || undefined,
        userAvatar: values.avatar || undefined,
        userProfile: values.bio || undefined,
      });
      setUser(updated);
      Toast.show({ icon: 'success', content: '保存成功' });
      navigate(-1);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        编辑资料
      </NavBar>

      {/* 头像预览 */}
      <div className={styles.avatarSection}>
        <Avatar
          src={previewAvatar || ''}
          style={{
            '--size': '80px',
            '--border-radius': '50%',
            border: '3px solid #f0f0f0',
          }}
        />
        <div className={styles.avatarHint}>
          {previewAvatar ? '点击上方头像可预览' : '设置头像链接后可预览'}
        </div>
      </div>

      {/* 表单 */}
      <div className={styles.formCard}>
        <Form
          onFinish={handleSubmit}
          initialValues={{
            nickname: user.userName || '',
            avatar: user.userAvatar || '',
            bio: user.userProfile || '',
          }}
          layout="horizontal"
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={saving}
              className={styles.submitBtn}
            >
              保存
            </Button>
          }
        >
          <Form.Header>基本信息</Form.Header>

          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ max: 20, message: '最多20个字符' }]}
          >
            <Input
              placeholder="给自己取个名字吧"
              maxLength={20}
              clearable
            />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="头像"
            rules={[
              { max: 500, message: '链接过长' },
            ]}
            extra={
              <span className={styles.fieldExtra}>
                填写图片 URL 作为头像（暂不支持上传）
              </span>
            }
          >
            <Input
              placeholder="https://example.com/avatar.jpg"
              maxLength={500}
              clearable
              onChange={(val) => setPreviewAvatar(val)}
            />
          </Form.Item>

          <Form.Item
            name="bio"
            label="简介"
            rules={[{ max: 100, message: '最多100个字符' }]}
          >
            <TextArea
              placeholder="写一句话介绍自己…"
              rows={3}
              maxLength={100}
              showCount
            />
          </Form.Item>
        </Form>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default ProfileEditPage;
