import React, { useState } from 'react';
import { Tabs, SpinLoading } from 'antd-mobile';
import { useQuery } from '@tanstack/react-query';
import { listFilm } from '@/api/filmController';
import FilmCard from '../../components/FilmCard/index';
import styles from './index.module.less';

const FilmPage: React.FC = () => {
  const [tab, setTab] = useState<'hot' | 'upcoming'>('hot');

  const { data, isLoading } = useQuery({
    queryKey: ['filmList', tab],
    queryFn: () => listFilm({ filmQueryRequest: { status: tab, pageSize: 50 } }),
    staleTime: 60000,
  });

  const films = data?.records || [];

  return (
    <div className={styles.page}>
      <div className={styles.tabBar}>
        <Tabs activeKey={tab} onChange={(k) => setTab(k as 'hot' | 'upcoming')} className={styles.tabs}>
          <Tabs.Tab title={`正在热映(${tab === 'hot' ? films.length : '...'})`} key="hot" />
          <Tabs.Tab title={`即将上映(${tab === 'upcoming' ? films.length : '...'})`} key="upcoming" />
        </Tabs>
      </div>
      <div className={styles.list}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <SpinLoading color="primary" />
          </div>
        ) : films.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999', fontSize: 14 }}>
            暂无影片
          </div>
        ) : (
          films.map((f) => <FilmCard key={f.id} film={f} variant="list" />)
        )}
      </div>
    </div>
  );
};

export default FilmPage;
