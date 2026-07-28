// ================= 类型定义 =================

export interface HotFilm {
  id: number;
  title: string;
  poster: string;
  tags: string[];
  rating: number;
  wantCount: string;
  genre: string;
  duration: number;
  year: number;
  description: string;
  director: string;
  actors: string[];
}

export interface UpcomingFilm {
  id: number;
  title: string;
  poster: string;
  tags: string[];
  wantCount: string;
  releaseDate: string;
  genre: string;
  director: string;
}

export interface BenefitItem {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  icon: string;
}

export interface Cinema {
  id: number;
  name: string;
  address: string;
  distance: string;
  tags: string[];
}

export interface DiscoverCard {
  id: number;
  title: string;
  image: string;
  tag: string;
  description: string;
}

// ================= Mock 数据 =================

export const MOCK_HOT_FILMS: HotFilm[] = [
  {
    id: 1, title: '蜘蛛侠：纵横宇宙', poster: 'https://picsum.photos/seed/film1/300/400',
    tags: ['IMAX 2D'], rating: 9.6, wantCount: '49万人想看',
    genre: '动作/科幻', duration: 140, year: 2026,
    description: '蜘蛛侠迈尔斯再次穿越多元宇宙，与新老盟友并肩作战，对抗前所未有的危机。视觉风格炸裂，被评为年度最佳动画。',
    director: '乔伊姆·多斯·桑托斯',
    actors: ['沙梅克·摩尔', '海莉·斯坦菲尔德', '奥斯卡·伊萨克'],
  },
  {
    id: 2, title: '功夫女足', poster: 'https://picsum.photos/seed/film2/300/400',
    tags: ['IMAX 2D'], rating: 9.1, wantCount: '48万人想看',
    genre: '喜剧/运动', duration: 120, year: 2026,
    description: '周星驰执导，讲述一群身怀绝技的女孩组成女足队，用功夫与足球结合的方式冲击世界杯。搞笑与热血并存。',
    director: '周星驰',
    actors: ['张雨绮', '沈腾', '艾伦'],
  },
  {
    id: 3, title: '痴迷', poster: 'https://picsum.photos/seed/film3/300/400',
    tags: ['杜比视界 2D'], rating: 8.7, wantCount: '58万人想看',
    genre: '悬疑/犯罪', duration: 132, year: 2026,
    description: '一位心理医生遇到一名声称能看到未来的病人。随着治疗的深入，医患关系逐渐模糊，真相令人窒息。',
    director: '陈正道',
    actors: ['黄渤', '周冬雨', '王传君'],
  },
  {
    id: 4, title: '流浪地球3', poster: 'https://picsum.photos/seed/film4/300/400',
    tags: ['中国巨幕 2D'], rating: 8.5, wantCount: '102万人想看',
    genre: '科幻/冒险', duration: 150, year: 2026,
    description: '人类星际流浪计划的终极篇章。面对未知的宇宙，人类文明将如何抉择？宏大视效震撼人心。',
    director: '郭帆',
    actors: ['吴京', '刘德华', '李雪健'],
  },
  {
    id: 5, title: '长安三万里2', poster: 'https://picsum.photos/seed/film5/300/400',
    tags: ['IMAX 2D'], rating: 8.9, wantCount: '36万人想看',
    genre: '动画/历史', duration: 168, year: 2026,
    description: '继前作之后，再次走进大唐诗人的世界。李白、杜甫、王维的故事继续在盛世长安上演。',
    director: '追光动画',
    actors: ['杨天翔', '季冠霖', '姜广涛'],
  },
  {
    id: 6, title: '封神第三部', poster: 'https://picsum.photos/seed/film6/300/400',
    tags: ['IMAX 3D'], rating: 8.3, wantCount: '87万人想看',
    genre: '奇幻/史诗', duration: 155, year: 2026,
    description: '封神系列的终章。姬发率八百诸侯会师孟津，与纣王展开最终决战。封神榜的秘密即将揭晓。',
    director: '乌尔善',
    actors: ['费翔', '李雪健', '黄渤'],
  },
  {
    id: 7, title: '神探大战2', poster: 'https://picsum.photos/seed/film7/300/400',
    tags: ['杜比全景声 2D'], rating: 8.6, wantCount: '23万人想看',
    genre: '动作/犯罪', duration: 128, year: 2026,
    description: '神探李俊再次出击，面对一个连环杀手留下的谜题。每个案发现场都是一场心理战。',
    director: '韦家辉',
    actors: ['刘青云', '蔡卓妍', '林峯'],
  },
  {
    id: 8, title: '哪吒之魔童闹海', poster: 'https://picsum.photos/seed/film8/300/400',
    tags: ['IMAX 3D'], rating: 9.3, wantCount: '156万人想看',
    genre: '动画/奇幻', duration: 135, year: 2025,
    description: '哪吒和敖丙联手对抗海底妖兽军团。天劫之后的陈塘关面临更大危机，少年英雄必须做出选择。',
    director: '饺子',
    actors: ['吕艳婷', '陈浩', '绿绮'],
  },
];

export const MOCK_UPCOMING_FILMS: UpcomingFilm[] = [
  {
    id: 9, title: '群星闪耀时', poster: 'https://picsum.photos/seed/film9/300/400',
    tags: ['CINITY 2D'], wantCount: '5.8万人想看',
    releaseDate: '8月15日', genre: '剧情/历史', director: '章子怡',
  },
  {
    id: 10, title: '消失的她2', poster: 'https://picsum.photos/seed/film10/300/400',
    tags: ['IMAX 2D'], wantCount: '32万人想看',
    releaseDate: '9月28日', genre: '悬疑/犯罪', director: '陈思诚',
  },
  {
    id: 11, title: '英雄联盟', poster: 'https://picsum.photos/seed/film11/300/400',
    tags: ['IMAX 3D'], wantCount: '67万人想看',
    releaseDate: '10月1日', genre: '动作/奇幻', director: '克里斯托弗·诺兰',
  },
  {
    id: 12, title: '偷偷藏不住', poster: 'https://picsum.photos/seed/film12/300/400',
    tags: [], wantCount: '19万人想看',
    releaseDate: '8月19日', genre: '爱情', director: '张一白',
  },
  {
    id: 13, title: '澎湖海战', poster: 'https://picsum.photos/seed/film13/300/400',
    tags: [], wantCount: '2.9万人想看',
    releaseDate: '11月', genre: '历史/战争', director: '管虎',
  },
  {
    id: 14, title: '恩宅惊魂', poster: 'https://picsum.photos/seed/film14/300/400',
    tags: ['杜比全景声 2D'], wantCount: '1.8万人想看',
    releaseDate: '7月30日', genre: '恐怖/惊悚', director: '温子仁',
  },
];

export const MOCK_BENEFITS: BenefitItem[] = [
  { id: 1, title: '新人礼包', subtitle: '首单立减15元', buttonText: '领取', icon: 'party' },
  { id: 2, title: '超值券包', subtitle: '一单回本超前省钱', buttonText: '享福利', icon: 'coupon' },
];

export const MOCK_CINEMAS: Cinema[] = [
  { id: 1, name: '万达影城(朝阳大悦城店)', address: '朝阳区朝阳北路101号朝阳大悦城F5', distance: '1.2km', tags: ['IMAX', '杜比', '4K'] },
  { id: 2, name: 'CGV影城(国贸店)', address: '朝阳区建国路93号万达广场B1', distance: '2.5km', tags: ['IMAX', '4DX', 'ScreenX'] },
  { id: 3, name: '博纳国际影城(华贸店)', address: '朝阳区建国路89号华贸购物中心F3', distance: '3.0km', tags: ['杜比', 'VIP'] },
  { id: 4, name: '卢米埃影城(蓝色港湾店)', address: '朝阳区朝阳公园路6号蓝色港湾国际商区', distance: '4.1km', tags: ['LD厅', 'RealD'] },
  { id: 5, name: '中影国际影城(三里屯店)', address: '朝阳区工体北路甲2号', distance: '3.8km', tags: ['CINITY', 'IMAX'] },
  { id: 6, name: '英皇电影城(西单店)', address: '西城区西单北大街131号', distance: '5.6km', tags: ['IMAX', 'VIP', '4D'] },
  { id: 7, name: '金逸影城(世纪金源店)', address: '海淀区远大路1号世纪金源购物中心F4', distance: '6.2km', tags: ['杜比', 'IMAX'] },
  { id: 8, name: '大地影院(望京店)', address: '朝阳区广顺北大街17号', distance: '3.5km', tags: ['激光', 'VIP'] },
];

export const MOCK_DISCOVERS: DiscoverCard[] = [
  { id: 1, title: '暑期档观影指南', image: 'https://picsum.photos/seed/discover1/400/200', tag: '资讯', description: '2026暑期档强片云集，多部大片定档' },
  { id: 2, title: 'IMAX vs 杜比影院怎么选', image: 'https://picsum.photos/seed/discover2/400/200', tag: '攻略', description: '一文看懂不同特效厅的区别' },
  { id: 3, title: '蜘蛛侠幕后制作特辑', image: 'https://picsum.photos/seed/discover3/400/200', tag: '幕后', description: '揭秘蜘蛛侠动画的视觉革命' },
  { id: 4, title: '导演圆桌：中国科幻电影之路', image: 'https://picsum.photos/seed/discover4/400/200', tag: '访谈', description: '郭帆等导演谈中国科幻电影的未来' },
  { id: 5, title: '《功夫女足》笑点合集', image: 'https://picsum.photos/seed/discover5/400/200', tag: '花絮', description: '周星驰式笑点如何炼成' },
  { id: 6, title: '本周观影福利汇总', image: 'https://picsum.photos/seed/discover6/400/200', tag: '福利', description: '各大影院优惠活动一键查看' },
];
