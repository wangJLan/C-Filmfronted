import React from 'react';
import { useParams, useNavigate } from 'umi';
import { Button, NavBar, Skeleton } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { useQuery } from '@tanstack/react-query';
import { getFilmDetail } from '@/services/api/film';
import styles from './index.module.less';

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: detail, isLoading } = useQuery({
    queryKey: ['filmDetail', id],
    queryFn: () => getFilmDetail(Number(id)),
    enabled: !!id,
  });

  return (
    <div className={styles.page}>
      <NavBar
        onBack={() => navigate(-1)}
        back={<LeftOutline />}
        className={styles.navbar}
      >
        影片详情
      </NavBar>

      {isLoading ? (
        <div className={styles.skeleton}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={5} animated />
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.posterWrap}>
            <img
              src={detail?.poster}
              alt={detail?.title}
              className={styles.poster}
            />
          </div>
          <h2 className={styles.filmTitle}>{detail?.title}</h2>
          <p className={styles.info}>
            {detail?.year} · {detail?.genre} · {detail?.duration}分钟
          </p>
          <p className={styles.desc}>{detail?.description}</p>

          <Button
            block
            color="primary"
            size="large"
            style={{ marginTop: 32 }}
          >
            立即购票
          </Button>
        </div>
      )}
    </div>
  );
};

export default DetailPage;
