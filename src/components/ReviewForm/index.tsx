import React, { useState } from 'react';
import { Popup, Button, TextArea, Toast, SafeArea } from 'antd-mobile';
import { StarFill, StarOutline } from 'antd-mobile-icons';
import { createReview } from '@/api/filmReviewController';
import styles from './index.module.less';

const PRESET_TAGS = ['特效炸裂', '剧情精彩', '演技在线', '值得二刷', '笑点密集', '泪点满满', '节奏紧凑', '配乐出色'];

interface ReviewFormProps {
  visible: boolean;
  filmId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ visible, filmId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) { Toast.show({ icon: 'fail', content: '请选择评分' }); return; }
    if (!content.trim()) { Toast.show({ icon: 'fail', content: '请输入影评内容' }); return; }
    setSubmitting(true);
    try {
      await createReview({
        filmId,
        rating,
        content: content.trim(),
        tags: selectedTags.join(','),
      });
      Toast.show({ icon: 'success', content: '影评发布成功' });
      onSuccess();
      handleClose();
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message || '发布失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setContent('');
    setSelectedTags([]);
    onClose();
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={handleClose}
      onClose={handleClose}
      bodyStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: '50vh' }}
    >
      <div className={styles.wrap}>
        <div className={styles.header}>
          <span className={styles.title}>写影评</span>
          <span className={styles.close} onClick={handleClose}>✕</span>
        </div>

        <div className={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={styles.star} onClick={() => setRating(star)}>
              {star <= rating ? (
                <StarFill fontSize={32} color="#FFB800" />
              ) : (
                <StarOutline fontSize={32} color="#ddd" />
              )}
            </span>
          ))}
        </div>

        <TextArea
          className={styles.textarea}
          placeholder="写下你的观影感受吧…（不少于10个字）"
          rows={5}
          value={content}
          onChange={(v) => setContent(v)}
          maxLength={500}
          showCount
        />

        <div className={styles.tagsWrap}>
          <div className={styles.tagsLabel}>添加标签（选填）</div>
          <div className={styles.tags}>
            {PRESET_TAGS.map((tag) => (
              <span
                key={tag}
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Button
          block
          color="primary"
          size="large"
          loading={submitting}
          className={styles.submitBtn}
          onClick={handleSubmit}
        >
          发布影评
        </Button>

        <SafeArea position="bottom" />
      </div>
    </Popup>
  );
};

export default ReviewForm;
