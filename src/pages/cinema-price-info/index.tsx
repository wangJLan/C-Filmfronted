/**
 * 划线价格说明
 */
import React from 'react';
import { useNavigate } from 'umi';
import { NavBar, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const RULES = [
  {
    title: '一、什么是划线价',
    desc: '划线价指商品或服务的展示价格，并非原价。该价格可能是柜台售价、厂商指导价、建议零售价，或该商品或服务在实体店曾经展示过的挂牌价，也可能是在平台上曾经展示过的销售价。划线价仅供参考，不作为实际交易的价格依据。',
  },
  {
    title: '二、划线价的来源',
    desc: '划线价由商家根据相关法律法规及市场行情自主制定，可能因地区、时间、促销活动等因素有所差异。具体以商品或服务页面展示的划线价为准。',
  },
  {
    title: '三、价格说明',
    desc: '因商品或服务的价格可能存在变动，具体成交价格以您下单时页面展示的价格为准。如您对划线价有任何疑问，可在支付前联系商家或平台客服进行确认。',
  },
  {
    title: '四、折扣说明',
    desc: '页面展示的折扣信息（如"X折起"），为划线价与当前售价的比值，具体以页面实际标注为准。不同商品或服务的折扣计算方式可能存在差异。',
  },
  {
    title: '五、价格举报',
    desc: '如您发现划线价存在异常或不实情况，可通过"客服中心"或"给影院提建议"渠道向我们反馈，我们将及时核实处理。',
  },
];

const CinemaPriceInfoPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>划线价格说明</NavBar>
      <div className={styles.content}>
        {RULES.map((r, i) => (
          <div key={i} className={styles.section}>
            <div className={styles.title}>{r.title}</div>
            <div className={styles.desc}>{r.desc}</div>
          </div>
        ))}
      </div>
      <SafeArea position="bottom" />
    </div>
  );
};

export default CinemaPriceInfoPage;
