import React from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar } from 'antd-mobile';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const MOCK_CINEMA = {
  name: 'UME影城（安贞DTSX店）',
  address: '东城区北三环东路36号环球贸易中心E座B1/F3',
  phone: '18010485259',
};

const MOCK_SERVICES = [
  { tag: '改签', type: 'change', desc: '未取票用户支持开场前3小时改签，改签费5.0元/张', hasDetail: true },
  { tag: '儿童须知', type: 'child', desc: '18岁以下未成年人凭有效身份证件或学生证可于线下购买优惠票', note: '*儿童购票问题建议咨询影城' },
  { tag: '观影小食', type: 'snack', desc: '该影院支持线上购买小食' },
  { tag: '3D眼镜免费', type: 'glasses', desc: '影院可提供免押金3D眼镜。持私人专属3D眼镜观影更健康，线上购票后，选择一款心爱的3D眼镜吧！' },
  { tag: '4DX厅', type: '4dx', desc: '4DX' },
  { tag: 'realD厅', type: 'reald', desc: '10厅（激光厅），221个座位；11厅（激光厅），156个座位；2号厅，140个座位；3号厅，140个座位；5号厅，70个座位；6号厅，145个座位；7号厅，140个座位；9号厅，251个座位' },
  { tag: 'VIP厅', type: 'vip', desc: '8号厅' },
];

const MOCK_NEARBY = '商场内有超市、餐饮、零售等多种业态';
const MOCK_TRANSIT = '乘坐地铁2号线至建国门站，B出口步行约5分钟；公交1路、4路、52路至建国门南站下车';

const CinemaDetailPage: React.FC = () => {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        影院详情
      </NavBar>

      {/* ===== 影院信息（深色渐变背景） ===== */}
      <div className={styles.header}>
        <div className={styles.headerName}>{MOCK_CINEMA.name}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAddr}>{MOCK_CINEMA.address}</div>
            <div className={styles.headerPhone}>{MOCK_CINEMA.phone}</div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.actionBtn}>
              <div className={styles.actionIcon}>📍</div>
              <div className={styles.actionLabel}>地图</div>
            </div>
            <div className={styles.actionBtn}>
              <div className={styles.actionIcon}>📞</div>
              <div className={styles.actionLabel}>电话</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 影院服务 ===== */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>影院服务</div>
        <div className={styles.serviceList}>
          {MOCK_SERVICES.map((item, idx) => (
            <div
              key={idx}
              className={styles.serviceItem}
              onClick={() => item.type && navigate(`/cinema-service-detail/${item.type}`)}
            >
              <div className={styles.serviceHeader}>
                <span className={styles.serviceTag}>{item.tag}</span>
                {item.hasDetail && <span className={styles.serviceDetail}>详情 ›</span>}
                {item.note && <span className={styles.serviceNote}>{item.note}</span>}
              </div>
              <div className={styles.serviceDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 周边设施 ===== */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>周边设施</div>
        <div className={styles.desc}>{MOCK_NEARBY}</div>
      </div>

      {/* ===== 公交信息 ===== */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>公交信息</div>
        <div className={styles.desc}>{MOCK_TRANSIT}</div>
      </div>

      {/* ===== 营业资质 ===== */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>营业资质</div>
        <div className={styles.certHint}>以下信息来源于商家自行申报，具体信息以资质主管部门登记为准</div>
        <div className={styles.certList}>
          <div className={styles.certPlaceholder} />
          <div className={styles.certPlaceholder} />
        </div>
      </div>

      {/* ===== 底部链接 ===== */}
      <div className={styles.bottomLinks}>
        <div className={styles.linkRow} onClick={() => navigate('/cinema-feedback')}>
          <span>给影院提建议</span>
          <RightOutline fontSize={14} color="#ccc" />
        </div>
        <div className={styles.linkRow} onClick={() => navigate('/cinema-price-info')}>
          <span>划线价格说明</span>
          <RightOutline fontSize={14} color="#ccc" />
        </div>
      </div>
    </div>
  );
};

export default CinemaDetailPage;
