/**
 * 编辑个人资料页 — 昵称 / 头像(本地上传) / 简介
 *
 * 头像上传流程: 选文件 → 前端预览 → 点保存 → 上传到后端 → 拿 URL → 更新用户信息
 */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, Form, Input, TextArea, Toast, SafeArea, Avatar } from 'antd-mobile';
import { LeftOutline, CameraOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/stores/useUserStore';
import { updateMyProfile } from '@/services/api/user';
import styles from './index.module.less';

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 头像: 本地预览(dataURL) vs 已保存的 URL
  const [previewUrl, setPreviewUrl] = useState(user?.userAvatar || '');
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!user) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>编辑资料</NavBar>
        <div className={styles.empty}>请先登录</div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 前端校验
    if (file.size > 2 * 1024 * 1024) {
      Toast.show({ icon: 'fail', content: '头像不能超过 2MB' });
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      Toast.show({ icon: 'fail', content: '仅支持 jpg/png/webp/gif' });
      return;
    }
    setSelectedFile(file);
    // 本地预览
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  /** 上传头像文件到后端 */
  const uploadAvatar = async (): Promise<string> => {
    if (!selectedFile) return user.userAvatar || '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const resp = await fetch('/api/file/upload/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!resp.ok) throw new Error('上传失败');
      const body = await resp.json();
      if (body.code !== 0) throw new Error(body.message || '上传失败');
      return body.data as string; // 返回 /uploads/avatars/xxx.jpg
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values: {
    nickname: string;
    bio: string;
  }) => {
    setSaving(true);
    try {
      // 先上传头像（如果有选新文件）
      let avatarUrl = user.userAvatar || '';
      if (selectedFile) {
        avatarUrl = await uploadAvatar();
      }
      // 再更新个人信息
      const updated = await updateMyProfile({
        userName: values.nickname || undefined,
        userAvatar: avatarUrl || undefined,
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

      {/* 头像区域 — 可点击上传 */}
      <div className={styles.avatarSection} onClick={() => fileRef.current?.click()}>
        <div className={styles.avatarWrap}>
          <Avatar
            src={previewUrl || ''}
            style={{
              '--size': '88px',
              '--border-radius': '50%',
              border: '3px solid #f0f0f0',
            }}
          />
          <div className={styles.cameraIcon}>
            <CameraOutline fontSize={16} />
          </div>
        </div>
        <div className={styles.avatarHint}>
          {selectedFile ? '已选择新头像' : '点击更换头像'}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* 表单 */}
      <div className={styles.formCard}>
        <Form
          onFinish={handleSubmit}
          initialValues={{
            nickname: user.userName || '',
            bio: user.userProfile || '',
          }}
          layout="horizontal"
          footer={
            <Button
              block
              type="submit"
              color="primary"
              size="large"
              loading={saving || uploading}
              disabled={uploading}
              className={styles.submitBtn}
            >
              {uploading ? '头像上传中...' : '保存'}
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
