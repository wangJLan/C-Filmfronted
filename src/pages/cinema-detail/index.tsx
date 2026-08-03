/**
 * 影院详情页
 */
import React from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, SpinLoading } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getInfo7 } from '@/api/cinemaController';
import styles from './index.module.less';

const CinemaDetailPage: React.FC = () => {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();

  const { data: cinema, isLoading } = useQuery({
    queryKey: ['cinemaDetail', cinemaId],
    queryFn: async () => {
      const raw: any = await getInfo7({ id: Number(cinemaId) });
      const c = raw?.data ?? raw;
      if (!c) throw new Error('影院不存在');
      return { id: Number(c.id), name: c.name || '', address: c.address || '', phone: c.phone || '', businessHours: c.businessHours || '', tags: c.tags ? c.tags.split(',').filter(Boolean) : [] };
    },
    enabled: !!cinemaId,
  });

  if (isLoading) return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影院详情</NavBar><div style={{ textAlign:'center',padding:80 }}><SpinLoading color="primary" /></div></div>;
  if (!cinema) return <div className={styles.page}><NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>影院详情</NavBar><div style={{ textAlign:'center',padding:80,color:'#999' }}>影院不存在</div></div>;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>{cinema.name}</NavBar>
      <div className={styles.card}>
        <div className={styles.name}>{cinema.name}</div>
        <div className={styles.addr}>{cinema.address}</div>
        {cinema.phone && <div className={styles.phone}>&#x1F4DE; {cinema.phone}</div>}
        {cinema.businessHours && <div className={styles.hours}>&#x1F550; {cinema.businessHours}</div>}
        {cinema.tags.length > 0 && <div className={styles.tags}>{cinema.tags.map((t: string) => <span key={t} className={styles.tag}>{t}</span>)}</div>}
      </div>
    </div>
  );
};

export default CinemaDetailPage;
