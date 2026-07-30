import React from 'react';
import { useNavigate } from 'umi';
import { SearchBar } from 'antd-mobile';
import { EnvironmentOutline } from 'antd-mobile-icons';
import { useLocationStore } from '@/stores/useLocationStore';
import { MOCK_CINEMAS, type Cinema } from '@/mock/home';
import styles from './index.module.less';

const CinemaPage: React.FC = () => {
  const city = useLocationStore((s) => s.city);
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <span className={styles.location}>
          <EnvironmentOutline fontSize={14} color="#FF5A00" />
          {city}
        </span>
        <div className={styles.searchWrap}>
          <SearchBar placeholder="搜影院" className={styles.search} />
        </div>
      </div>
      <div className={styles.list}>
        {MOCK_CINEMAS.map((cinema: Cinema) => (
          <div
            key={cinema.id}
            className={styles.card}
            onClick={() => navigate(`/showtime/cinema/${cinema.id}`)}
          >
            <div className={styles.cardBody}>
              <div className={styles.name}>{cinema.name}</div>
              <div className={styles.address}>
                <EnvironmentOutline fontSize={12} />
                {cinema.address}
              </div>
              <div className={styles.tags}>
                <span className={styles.distance}>{cinema.distance}</span>
                {cinema.tags.map((tag, idx) => (
                  <span key={idx} className={styles.featureTag}>{tag}</span>
                ))}
              </div>
            </div>
            <div className={styles.arrow}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CinemaPage;
