/**
 * 影院服务详情页 — 改签规则 / 其他服务说明
 */
import React from 'react';
import { useParams, useNavigate } from 'umi';
import { NavBar, SafeArea } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import styles from './index.module.less';

const titles: Record<string, string> = {
  change: '改签规则',
  child: '儿童须知',
  snack: '观影小食',
  glasses: '3D眼镜',
  '4dx': '4DX厅',
  reald: 'realD厅',
  vip: 'VIP厅',
};

/** 改签规则 */
const CHANGE_RULES = [
  {
    title: '一、影院规则',
    items: [
      '未取票开场前3小时以上，免费改签。',
      '未取票开场前1小时至3小时，改签服务费2.0元/张。',
      '未取票开场前10分钟至1小时，改签服务费3.0元/张。',
      '未取票开场前10分钟内不允许改签。',
    ],
  },
  {
    title: '二、淘票票规则',
    items: [
      '仅标有"改签"标识的影院支持改签，其中个别特殊场次根据影院要求可能不支持改签，使用电影兑换券的订单不支持改签。',
      '每笔订单只可改签1次，确认改签后不可再次改签或退票。',
      '电影开场前一定时间内且用户未取票的情况下可支持改签，改签限同一影院，不限影片、日期和场次。改签将可能产生额外服务费。如扣除改签服务费后，改签后订单金额高于原订单实付金额，需支付差额部分票款。',
      '目前仅支持整笔订单改签，不支持单个座位改签。',
      '用户确认改签后将以改签订单为准执行，不再享受原订单的相关优惠。如原订单享受淘票票某项特惠活动，则改签后不再享有原优惠活动资格。',
      '原订单如使用了代金券，改签后原代金券自动失效且不支持退回。',
      '原订单中如有赠送的小食，改签后小食将被收回，不再赠送；原订单中如购买了小食，则改签订单中小食仍将保留，但不支持更换。',
      '如发现作弊行为，淘票票有权取消您的改签资格。',
      '上海电影节影片场次均不支持改签。',
    ],
  },
  {
    title: '三、会员改签权益说明',
    items: [
      '普通用户：每月可享2次快速自助改签服务',
      '大麦VIP会员：每月可享5次快速自助改签服务',
      '黑钻会员：每月享无限次快速自助改签服务，且每月可积分兑换免改签费权益2次，每次兑换需支付128积分（如积分不够仍可进行付费改签）',
      '注：退改签特权需在影院支持退改签的基础上使用；同一账号视为同一用户，会员等级可在"淘票票客户端"查看',
    ],
  },
];

/** 改签流程步骤 */
const CHANGE_STEPS = [
  {
    num: 1,
    desc: '在"我的-电影票"中找到尚未取票，需要自助改签的电影票',
    img: '//gw.alicdn.com/tfs/TB1_Uw8PVXXXXaBaFXXXXXXXXXX-633-296.png',
  },
  {
    num: 2,
    desc: '进入电影票详情，点击底部的申请"改签"按钮',
    img: '//gw.alicdn.com/tfs/TB1ze4LQXXXXXbDXpXXXXXXXXXX-634-295.png',
  },
  {
    num: 3,
    desc: '进入同一家影院的场次页选择影片及场次',
    img: '//gw.alicdn.com/tfs/TB155xRQXXXXXXWXpXXXXXXXXXX-634-713.png',
  },
  {
    num: 4,
    desc: '选择座位，改签的座位数不可少于原订单',
    img: '//gw.alicdn.com/tfs/TB1cCVrQXXXXXbWXVXXXXXXXXXX-634-692.png',
  },
  {
    num: 5,
    desc: '当新订单价格>原订单，你需要支付差价。当新订单价格<原订单，差价将在X个工作日内按照原路径回退。当新订单价格=原订单，无需支付差价。',
    img: '//gw.alicdn.com/tfs/TB1f4k_PVXXXXc0apXXXXXXXXXX-634-306.png',
  },
  {
    num: 6,
    desc: '改签成功后，可以在"我的-我的电影票"中看到新改签的订单',
    img: '//gw.alicdn.com/tfs/TB1UX8iQXXXXXbJaXXXXXXXXXXX-635-297.png',
  },
];

const CinemaServiceDetailPage: React.FC = () => {
  const { serviceType } = useParams<{ serviceType: string }>();
  const navigate = useNavigate();
  const type = serviceType || '';
  const title = titles[type] || '服务详情';

  return (
    <div className={styles.page}>
      <NavBar onBack={() => navigate(-1)} back={<LeftOutline />}>
        {title}
      </NavBar>

      {type === 'change' ? (
        <>
          {/* ===== 规则内容 ===== */}
          <div className={styles.rules}>
            {CHANGE_RULES.map((section, si) => (
              <div key={si} className={styles.ruleSection}>
                <div className={styles.ruleTitle}>{section.title}</div>
                {section.items.map((item, ii) => (
                  <div key={ii} className={styles.ruleItem}>{item}</div>
                ))}
              </div>
            ))}
          </div>

          {/* ===== 改签流程 ===== */}
          <div className={styles.flowSection}>
            <div className={styles.flowTitle}>改签流程</div>
            {CHANGE_STEPS.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepTxt}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <span className={styles.stepDesc}>{step.desc}</span>
                </div>
                <div className={styles.stepImg}>
                  <img src={step.img} alt={`步骤${step.num}`} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyText}>{title}详情</div>
          <div className={styles.emptyHint}>页面内容完善中…</div>
        </div>
      )}

      <SafeArea position="bottom" />
    </div>
  );
};

export default CinemaServiceDetailPage;
