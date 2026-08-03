/**
 * 给影院提建议
 */
import React, { useState } from 'react';
import { useNavigate } from 'umi';
import { NavBar, Button, TextArea, Toast, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const FEEDBACK_TYPES = ['价格问题', '服务问题', '设施问题', '环境问题', '其他'];

const CinemaFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) {
      Toast.show({ icon: 'fail', content: '请输入建议内容' });
      return;
    }
    Toast.show({ icon: 'success', content: '感谢您的反馈，我们会尽快处理' });
    setTimeout(() => navigate(-1), 1000);
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>给影院提建议</NavBar>

      <div className={styles.card}>
        <div className={styles.label}>问题类型</div>
        <div className={styles.typeRow}>
          {FEEDBACK_TYPES.map((t) => (
            <span
              key={t}
              className={`${styles.typeTag} ${type === t ? styles.typeTagActive : ''}`}
              onClick={() => setType(t)}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>详细描述</div>
        <TextArea
          placeholder="请详细描述您遇到的问题或建议…"
          rows={5}
          value={content}
          onChange={(v) => setContent(v)}
          maxLength={500}
        />
        <div className={styles.charCount}>{content.length}/500</div>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>联系方式（选填）</div>
        <input
          className={styles.input}
          placeholder="手机号或微信号，方便我们联系您"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>

      <div className={styles.btnWrap}>
        <Button block color="primary" size="large" className={styles.submitBtn} onClick={handleSubmit}>
          提交
        </Button>
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default CinemaFeedbackPage;
