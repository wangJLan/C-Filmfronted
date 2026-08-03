import React, { useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, Tabs } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { MOCK_NEWS, FilmNews } from '@/mock/home';
import styles from './index.module.less';

type TabKey = 'all' | 'schedule' | 'material' | 'updates';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'schedule', label: '档期信息' },
  { key: 'material', label: '物料发布' },
  { key: 'updates', label: '剧组动态' },
];

const NewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const filteredNews = activeTab === 'all'
    ? MOCK_NEWS
    : MOCK_NEWS.filter(n => n.sourceType === activeTab);

  return (
    <div className={styles.page}>
      <NavBar
        onBack={() => navigate(-1)}
        back={<LeftOutline />}
        className={styles.navBar}
      >
        影片动态
      </NavBar>

      {/* 介绍气泡 */}
      <div className={styles.intro}>
        <div className={styles.introIcon}>🎬</div>
        <div className={styles.introText}>
          在这里可以了解影片所有时间流的信息，更可以了解主创们幕后的更多有趣、有意义的故事
        </div>
      </div>

      {/* Tab 分类 */}
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as TabKey)}
        className={styles.newsTabs}
      >
        {TABS.map(tab => (
          <Tabs.Tab title={tab.label} key={tab.key}>
            <div className={styles.tabContent}>
              <div className={styles.newsCount}>全部 {filteredNews.length} 条</div>
              <div className={styles.newsList}>
                {filteredNews.map(news => (
                  <NewsCard key={news.id} news={news} />
                ))}
              </div>
              {filteredNews.length === 0 && (
                <div className={styles.empty}>暂无动态</div>
              )}
            </div>
          </Tabs.Tab>
        ))}
      </Tabs>

      <div className={styles.bottomSpace} />
    </div>
  );
};

const NewsCard: React.FC<{ news: FilmNews }> = ({ news }) => {
  return (
    <div className={styles.newsCard}>
      <div className={styles.newsContent}>
        <div className={styles.newsHeader}>
          <span className={`${styles.sourceTag} ${styles[`source_${news.sourceType}`]}`}>
            {news.source}
          </span>
        </div>
        <div className={styles.newsTitle}>{news.title}</div>
        <div className={styles.newsSummary}>{news.summary}</div>
        <div className={styles.newsTime}>{news.time}</div>
      </div>
      {news.image && (
        <img src={news.image} alt={news.title} className={styles.newsImage} />
      )}
    </div>
  );
};

export default NewsPage;
