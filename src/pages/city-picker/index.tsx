/**
 * 城市选择器 — 当前定位 + 热门城市 + A-Z 索引
 */
import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'umi';
import { NavBar, SafeArea } from 'antd-mobile';
import { LeftOutline, CheckOutline } from 'antd-mobile-icons';
import { useLocationStore, type CityInfo } from '@/stores/useLocationStore';
import { HOT_CITIES, getCityGroups, type CityGroup } from '@/data/cityGroups';
import styles from './index.module.less';

const CityPickerPage: React.FC = () => {
  const navigate = useNavigate();
  const { city: currentCity, lat, lng, located, selectCity, relocate, loading } = useLocationStore();
  const groups = useMemo(() => getCityGroups(), []);
  const [activeLetter, setActiveLetter] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleSelect = (c: CityInfo) => {
    selectCity(c);
    navigate(-1);
  };

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const el = letterRefs.current.get(letter);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => setActiveLetter(''), 1000);
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        选择城市
      </NavBar>

      {/* 当前定位 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>当前定位</div>
        <div className={styles.locateRow}>
          <div className={styles.locateInfo}>
            <span className={styles.locateIcon}>📍</span>
            <span className={styles.locateName}>
              {located ? currentCity : '未获取到位置'}
            </span>
          </div>
          <span
            className={styles.relocateBtn}
            onClick={() => relocate()}
          >
            {loading ? '定位中...' : '重新定位'}
          </span>
        </div>
      </div>

      {/* 热门城市 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>热门城市</div>
        <div className={styles.hotGrid}>
          {HOT_CITIES.map((name) => (
            <span
              key={name}
              className={`${styles.hotItem} ${name === currentCity ? styles.hotActive : ''}`}
              onClick={() => {
                const c = groups.flatMap((g) => g.cities).find((x) => x.name === name);
                if (c) handleSelect(c);
              }}
            >
              {name}
              {name === currentCity && <CheckOutline className={styles.hotCheck} />}
            </span>
          ))}
        </div>
      </div>

      {/* 全部城市 — A-Z 分组 */}
      <div className={styles.listWrap}>
        <div className={styles.listBox} ref={listRef}>
          {groups.map((g) => (
            <div
              key={g.letter}
              ref={(el) => { if (el) letterRefs.current.set(g.letter, el); }}
            >
              <div className={styles.letterTitle}>{g.letter}</div>
              {g.cities.map((c) => (
                <div
                  key={c.name}
                  className={`${styles.cityItem} ${c.name === currentCity ? styles.cityActive : ''}`}
                  onClick={() => handleSelect(c)}
                >
                  <span>{c.name}</span>
                  {c.name === currentCity && <CheckOutline color="#FF5A00" fontSize={16} />}
                </div>
              ))}
            </div>
          ))}
          <div style={{ height: 60 }} />
        </div>
      </div>

      {/* 右侧字母索引 */}
      <div className={styles.indexBar}>
        {groups.map((g) => (
          <span
            key={g.letter}
            className={`${styles.indexItem} ${activeLetter === g.letter ? styles.indexActive : ''}`}
            onClick={() => scrollToLetter(g.letter)}
          >
            {g.letter}
          </span>
        ))}
      </div>

      <SafeArea position="bottom" />
    </div>
  );
};

export default CityPickerPage;
