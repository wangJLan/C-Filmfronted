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

// ================= 场次类型 =================

export interface ShowtimeItem {
  id: number;
  filmId: number;
  cinemaId: number;
  hall: string;            // e.g. '1号IMAX厅'
  time: string;            // e.g. '10:30'
  price: number;           // 票价
  discountPrice?: number;  // 优惠价
  date: string;            // e.g. '2026-07-29'
  totalSeats: number;
  soldSeats: number;
}

const HALL_NAMES: Record<number, string[]> = {
  1: ['1号IMAX厅', '2号杜比全景声厅', '3号激光厅', '4号VIP厅', '5号普通厅'],
  2: ['1号IMAX厅', '2号4DX厅', '3号ScreenX厅', '4号普通厅'],
  3: ['1号杜比厅', '2号VIP厅', '3号普通厅', '4号普通厅'],
  4: ['1号LD厅', '2号RealD厅', '3号普通厅', '4号普通厅'],
  5: ['1号CINITY厅', '2号IMAX厅', '3号普通厅', '4号激光厅'],
  6: ['1号IMAX厅', '2号VIP厅', '3号4D厅', '4号普通厅'],
  7: ['1号杜比厅', '2号IMAX厅', '3号普通厅', '4号普通厅'],
  8: ['1号激光厅', '2号VIP厅', '3号普通厅'],
};

const TIME_SLOTS = ['09:30', '10:45', '12:00', '13:30', '14:45', '16:00', '17:15', '18:30', '19:15', '20:00', '21:30', '22:45'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 生成某影片在某影院未来7天的场次 */
function generateShowtimes(filmId: number, cinemaId: number): ShowtimeItem[] {
  const rand = seededRandom(filmId * 100 + cinemaId);
  const halls = HALL_NAMES[cinemaId] || ['1号普通厅', '2号普通厅'];
  const result: ShowtimeItem[] = [];
  let id = filmId * 10000 + cinemaId * 100;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // 每天 3~7 场
    const count = 3 + Math.floor(rand() * 5);
    const shuffled = [...TIME_SLOTS].sort(() => rand() - 0.5).slice(0, count).sort();

    shuffled.forEach((time) => {
      const hall = halls[Math.floor(rand() * halls.length)];
      const totalSeats = hall.includes('VIP') ? 48 : hall.includes('IMAX') ? 144 : 96;
      const basePrice = hall.includes('IMAX') ? 55 : hall.includes('VIP') ? 68 : hall.includes('杜比') || hall.includes('CINITY') ? 48 : hall.includes('LD') || hall.includes('RealD') ? 42 : 35;
      const price = basePrice + Math.floor(rand() * 15) - 5;
      const soldSeats = Math.floor(rand() * totalSeats);

      result.push({ id: ++id, filmId, cinemaId, hall, time, date: dateStr, price, totalSeats, soldSeats });
    });
  }
  return result;
}

/**
 * 每部热映影片固定选 N 家影院排片（用确定性哈希，不随机跳过）
 * 确保从详情页"选座购票"进去时至少能看到几家影院可选
 */
function pickCinemasForFilm(filmId: number): number[] {
  // 用 seed 打乱 1-8 的影院 ID 顺序，取前 5-6 家
  const rand = seededRandom(filmId * 777);
  const all = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled = all.sort(() => rand() - 0.5);
  // 不同影片分配不同数量（5-7家），确保至少 5 家
  const count = 5 + Math.floor((filmId * 3) % 3); // 5~7
  return shuffled.slice(0, count);
}

/** 所有场次 Mock 数据（按需懒生成） */
let _allShowtimes: ShowtimeItem[] | null = null;
export function getAllShowtimes(): ShowtimeItem[] {
  if (_allShowtimes) return _allShowtimes;
  const all: ShowtimeItem[] = [];
  for (let filmId = 1; filmId <= 8; filmId++) {
    const cinemaIds = pickCinemasForFilm(filmId);
    for (const cinemaId of cinemaIds) {
      all.push(...generateShowtimes(filmId, cinemaId));
    }
  }
  _allShowtimes = all;
  return _allShowtimes;
}

/** 查询：影片+影院+日期 → 场次列表 */
export function getShowtimes(filmId: number, cinemaId: number, date: string): ShowtimeItem[] {
  return getAllShowtimes().filter(
    (s) => s.filmId === filmId && s.cinemaId === cinemaId && s.date === date,
  );
}

/** 查询：影院+日期 → 所有影片场次 */
export function getShowtimesByCinemaAndDate(cinemaId: number, date: string): ShowtimeItem[] {
  return getAllShowtimes().filter((s) => s.cinemaId === cinemaId && s.date === date);
}

// ================= 座位布局 =================

export interface SeatLayout {
  rows: number;
  cols: number;
  /** 已售座位 key: "row-col" */
  soldSeats: Set<string>;
  /** 锁定中的座位 key: "row-col"（同一会话暂存） */
  lockedSeats: Set<string>;
  /** 情侣座对：每对两个相邻座位，需要成对选择 ["row-col", "row-col"] */
  couplePairs: string[][];
  /** 走道列索引 */
  aisleCols: number[];
}

/** 根据影厅生成座位布局 */
function buildSeatLayout(hall: string, seed: number): SeatLayout {
  const rand = seededRandom(seed);
  const isIMAX = hall.includes('IMAX');
  const isVIP = hall.includes('VIP');

  const totalRows = isVIP ? 6 : isIMAX ? 10 : 8;
  const totalCols = isVIP ? 8 : 12;

  // 已售座位（基于种子固定生成 30%~60% 已售）
  const soldSeats = new Set<string>();
  const soldRate = 0.3 + rand() * 0.3;
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalCols; col++) {
      if (rand() < soldRate) {
        soldSeats.add(`${row}-${col}`);
      }
    }
  }

  // 情侣座：最后 2 排靠边的双连座
  const couplePairs: string[][] = [];
  if (!isIMAX && totalRows >= 6) {
    for (let row = totalRows - 2; row < totalRows; row++) {
      for (let col = 0; col < totalCols - 1; col += 3) {
        const key1 = `${row}-${col}`;
        const key2 = `${row}-${col + 1}`;
        if (!soldSeats.has(key1) && !soldSeats.has(key2)) {
          couplePairs.push([key1, key2]);
        }
      }
    }
  }

  // 走道：IMAX 在中间，普通影厅在 1/2 处
  const aisleCols: number[] = [];
  if (isIMAX) {
    aisleCols.push(Math.floor(totalCols / 2) - 1);
    aisleCols.push(Math.floor(totalCols / 2));
  } else if (!isVIP) {
    aisleCols.push(Math.floor(totalCols / 2) - 0.5);
  }

  return { rows: totalRows, cols: totalCols, soldSeats, lockedSeats: new Set(), couplePairs, aisleCols };
}

/** seat layout 缓存 */
const _layoutCache = new Map<number, SeatLayout>();

/** 根据 showtimeId 获取座位布局（确定性，相同 id 始终相同） */
export function getSeatLayout(showtimeId: number): SeatLayout {
  if (_layoutCache.has(showtimeId)) {
    const cached = _layoutCache.get(showtimeId)!;
    // 清空 locked
    cached.lockedSeats.clear();
    return cached;
  }
  const showtime = getAllShowtimes().find((s) => s.id === showtimeId);
  const layout = buildSeatLayout(showtime?.hall || '普通厅', showtimeId);
  _layoutCache.set(showtimeId, layout);
  return layout;
}

/** 模拟锁座（加入 locked 集合） */
export function lockSeats(showtimeId: number, seatKeys: string[]): boolean {
  const layout = getSeatLayout(showtimeId);
  for (const key of seatKeys) {
    if (layout.soldSeats.has(key) || layout.lockedSeats.has(key)) return false;
  }
  for (const key of seatKeys) layout.lockedSeats.add(key);
  return true;
}

/** 释放锁定的座位 */
export function unlockSeats(showtimeId: number, seatKeys: string[]) {
  const layout = getSeatLayout(showtimeId);
  for (const key of seatKeys) layout.lockedSeats.delete(key);
}

export const MOCK_DISCOVERS: DiscoverCard[] = [
  { id: 1, title: '暑期档观影指南', image: 'https://picsum.photos/seed/discover1/400/200', tag: '资讯', description: '2026暑期档强片云集，多部大片定档' },
  { id: 2, title: 'IMAX vs 杜比影院怎么选', image: 'https://picsum.photos/seed/discover2/400/200', tag: '攻略', description: '一文看懂不同特效厅的区别' },
  { id: 3, title: '蜘蛛侠幕后制作特辑', image: 'https://picsum.photos/seed/discover3/400/200', tag: '幕后', description: '揭秘蜘蛛侠动画的视觉革命' },
  { id: 4, title: '导演圆桌：中国科幻电影之路', image: 'https://picsum.photos/seed/discover4/400/200', tag: '访谈', description: '郭帆等导演谈中国科幻电影的未来' },
  { id: 5, title: '《功夫女足》笑点合集', image: 'https://picsum.photos/seed/discover5/400/200', tag: '花絮', description: '周星驰式笑点如何炼成' },
  { id: 6, title: '本周观影福利汇总', image: 'https://picsum.photos/seed/discover6/400/200', tag: '福利', description: '各大影院优惠活动一键查看' },
];

// ================= 影评 =================

export interface FilmReview {
  id: number;
  userName: string;
  userAvatar: string;
  location: string;
  rating: number;
  content: string;
  helpfulCount: number;
  commentCount: number;
  date: string;
  isPurchased: boolean;
  tags: string[];
}

export const MOCK_REVIEWS: FilmReview[] = [
  {
    id: 1,
    userName: '青**柳',
    userAvatar: '🦸',
    location: '湖南',
    rating: 5,
    content: '依旧漫威！作为一个资深的Marvel fan，只能评论"依旧漫威"。不仅有许多的漫威角色回归，蜘蛛侠也是有了街头科学家的形象啊，还有我们的X战警中的凤凰女（新版）！Hooray Marvel!',
    helpfulCount: 82,
    commentCount: 11,
    date: '4天前',
    isPurchased: true,
    tags: ['购票好评'],
  },
  {
    id: 2,
    userName: '乔橋',
    userAvatar: '🕷️',
    location: '山东',
    rating: 5,
    content: '特别好看的一部电影，期待已久的蜘蛛侠4新之日终于看完了！这一部可以说是回归了街头英雄。而且还引进了一个非常牛逼的强大角色：格普雷，打戏的部分真的看的太爽了！尤其是康纳博士失控变成浩克和蜘蛛侠的那段，真的是打过瘾啊。影片的风格也很独特，动画的质感非常棒！',
    helpfulCount: 56,
    commentCount: 8,
    date: '4天前',
    isPurchased: true,
    tags: ['购票好评'],
  },
  {
    id: 3,
    userName: '影痴****ck',
    userAvatar: '🎬',
    location: '上海',
    rating: 4,
    content: '画面炸裂，故事线略显单薄。作为动画电影来说，这部的视觉效果确实是顶级水准，每一帧都能当壁纸。但剧情推进稍显仓促，反派的动机也不够立体。整体来说，值得IMAX票价。',
    helpfulCount: 34,
    commentCount: 5,
    date: '3天前',
    isPurchased: true,
    tags: ['有图'],
  },
  {
    id: 4,
    userName: '小李**飞刀',
    userAvatar: '🗡️',
    location: '北京',
    rating: 5,
    content: '蜘蛛侠粉必看！平行宇宙的设定玩出了新高度，动画风格在延续前作基础上又有创新。角色塑造非常饱满，尤其是彼得·帕克的内心挣扎，让人共情。配乐也是一绝，DTS音效炸裂！',
    helpfulCount: 128,
    commentCount: 23,
    date: '5天前',
    isPurchased: true,
    tags: ['购票好评', '有图'],
  },
  {
    id: 5,
    userName: '影评***人',
    userAvatar: '✍️',
    location: '广东',
    rating: 3,
    content: '可能是期待值太高了，看完觉得中规中矩。前半小时节奏太慢，后面才渐入佳境。不过最后的大战还是挺燃的，建议降低预期去看。',
    helpfulCount: 19,
    commentCount: 3,
    date: '2天前',
    isPurchased: true,
    tags: ['购票中评'],
  },
];

// ================= 影片动态 =================

export interface FilmNews {
  id: number;
  source: string;
  sourceType: 'material' | 'schedule' | 'updates';
  title: string;
  summary: string;
  time: string;
  image?: string;
}

export const MOCK_NEWS: FilmNews[] = [
  { id: 1, source: '物料发布', sourceType: 'material', title: '打戏高燃！《蜘蛛侠：崭新之日》票房破3亿', summary: '上映3天票房突破3亿，口碑持续走高', time: '2026-07-30 21:31', image: 'https://picsum.photos/seed/news1/300/200' },
  { id: 2, source: '剧组动态', sourceType: 'updates', title: '今日上映点燃暑期预售、零点场均破票房纪录', summary: '预售火爆，多部影片零点场售罄', time: '2026-07-29 19:03', image: 'https://picsum.photos/seed/news2/300/200' },
  { id: 3, source: '物料发布', sourceType: 'material', title: '胡彦斌献唱《蜘蛛侠：崭新之日》中文推广曲', summary: '金曲奖得主操刀制作，MV同步上线', time: '2026-07-27 10:02', image: 'https://picsum.photos/seed/news3/300/200' },
  { id: 4, source: '剧组动态', sourceType: 'updates', title: '"荷兰弟"赞达亚空降上海全网刷屏《蜘蛛侠》粉丝狂欢', summary: '主创团队现身亚洲首映礼', time: '2026-07-26 12:14', image: 'https://picsum.photos/seed/news4/300/200' },
  { id: 5, source: '物料发布', sourceType: 'material', title: '预售开启内外交困之下蜘蛛侠如何破局重生', summary: '《蜘蛛侠：崭新之日》预售火爆开启', time: '2026-07-21 10:00', image: 'https://picsum.photos/seed/news5/300/200' },
  { id: 6, source: '剧组动态', sourceType: 'updates', title: '主题快闪来袭 六天空间解锁蜘蛛侠双重人生', summary: '影迷互动体验活动盛大开启', time: '2026-07-17 10:00', image: 'https://picsum.photos/seed/news6/300/200' },
  { id: 7, source: '物料发布', sourceType: 'material', title: 'IMAX独家海报发布 蜘蛛侠全新造型曝光', summary: 'IMAX特制海报震撼亮相', time: '2026-07-15 14:20', image: 'https://picsum.photos/seed/news7/300/200' },
  { id: 8, source: '档期信息', sourceType: 'schedule', title: '《蜘蛛侠：崭新之日》7月29日全球同步上映', summary: '暑期档重磅大片定档', time: '2026-07-10 09:00', image: 'https://picsum.photos/seed/news8/300/200' },
  { id: 9, source: '物料发布', sourceType: 'material', title: '导演解读：蜘蛛侠平行宇宙的全新叙事', summary: '导演乔伊姆专访揭秘创作幕后', time: '2026-07-08 16:45', image: 'https://picsum.photos/seed/news9/300/200' },
  { id: 10, source: '剧组动态', sourceType: 'updates', title: '蜘蛛侠系列十周年庆典：粉丝见面会圆满举行', summary: '全球粉丝齐聚庆祝IP诞生十年', time: '2026-07-05 11:30', image: 'https://picsum.photos/seed/news10/300/200' },
  { id: 11, source: '档期信息', sourceType: 'schedule', title: '预售火爆！《蜘蛛侠》零点场全国售罄', summary: '首日预售票房破亿', time: '2026-07-03 20:00', image: 'https://picsum.photos/seed/news11/300/200' },
  { id: 12, source: '物料发布', sourceType: 'material', title: '特效解析：蜘蛛侠动画背后的视觉革命', summary: '每一帧都值得细细品味', time: '2026-07-01 15:20', image: 'https://picsum.photos/seed/news12/300/200' },
];

export interface BoxOfficeData {
  realtime: string;
  cumulative: string;
  rank: number;
}

export const MOCK_BOX_OFFICE: BoxOfficeData = {
  realtime: '15632.02',
  cumulative: '82311.28',
  rank: 1,
};

export interface FilmInfoItem {
  title: string;
  items: { label: string; value: string; link?: boolean }[];
}

export const MOCK_FILM_INFO: FilmInfoItem[] = [
  {
    title: '出品发行',
    items: [
      { label: '出品公司', value: '美国哥伦比亚影片公司' },
      { label: '发行公司', value: '索尼影视发行' },
    ],
  },
  {
    title: '发行通知',
    items: [
      { label: '发行日期', value: '2026年07月29日' },
      { label: '发行版本', value: 'IMAX/CINITY/杜比视界' },
    ],
  },
];

// ================= 推荐 =================

export interface RecommendFilm {
  id: number;
  title: string;
  poster: string;
  rating: number;
  genre: string;
  duration: number;
  reason: string;
  director: string;
  actors: string[];
}

export const MOCK_RECOMMENDS: RecommendFilm[] = [
  {
    id: 8, title: '哪吒之魔童闹海',
    poster: 'https://picsum.photos/seed/film8/200/280',
    rating: 9.3, genre: '动画/奇幻', duration: 135,
    reason: '同类型热门', director: '饺子', actors: ['吕艳婷', '陈浩', '绿绮'],
  },
  {
    id: 5, title: '长安三万里2',
    poster: 'https://picsum.photos/seed/film5/200/280',
    rating: 8.9, genre: '动画/历史', duration: 168,
    reason: '口碑佳作', director: '追光动画', actors: ['杨天翔', '季冠霖'],
  },
  {
    id: 1, title: '蜘蛛侠：纵横宇宙',
    poster: 'https://picsum.photos/seed/film1/200/280',
    rating: 9.6, genre: '动作/科幻', duration: 140,
    reason: '上一部作品', director: '乔伊姆·多斯·桑托斯', actors: ['沙梅克·摩尔', '海莉·斯坦菲尔德'],
  },
  {
    id: 4, title: '流浪地球3',
    poster: 'https://picsum.photos/seed/film4/200/280',
    rating: 8.5, genre: '科幻/冒险', duration: 150,
    reason: '同类推荐', director: '郭帆', actors: ['吴京', '刘德华', '李雪健'],
  },
  {
    id: 3, title: '痴迷',
    poster: 'https://picsum.photos/seed/film3/200/280',
    rating: 8.7, genre: '悬疑/犯罪', duration: 132,
    reason: '近期热门', director: '陈正道', actors: ['黄渤', '周冬雨'],
  },
];

// ================= 动态推荐(和推荐结构相同,但展示风格不同) =================

export const MOCK_DYNAMIC_RECOMMENDS: RecommendFilm[] = [
  {
    id: 6, title: '封神第三部',
    poster: 'https://picsum.photos/seed/film6/200/280',
    rating: 8.3, genre: '奇幻/史诗', duration: 155,
    reason: '即将上映', director: '乌尔善', actors: ['费翔', '李雪健', '黄渤'],
  },
  {
    id: 7, title: '神探大战2',
    poster: 'https://picsum.photos/seed/film7/200/280',
    rating: 8.6, genre: '动作/犯罪', duration: 128,
    reason: '热映中', director: '韦家辉', actors: ['刘青云', '蔡卓妍'],
  },
];

// ================= 影院筛选 Mock 数据 =================

export interface CinemaShowtime {
  startTime: string;
  hallType: string;
  price: number;
  isSoldOut: boolean;
}

export interface CinemaItem {
  id: number;
  name: string;
  fullName: string;
  address: string;
  distance: string;
  minPrice: number;
  tags: string[];
  services: string[];
  halls: string[];
  region: string;
  showtimes: CinemaShowtime[];
}

export const MOCK_REGIONS: { name: string; count: number }[] = [
  { name: '瀍河回族区', count: 2 },
  { name: '吉利区', count: 2 },
  { name: '老城区', count: 5 },
  { name: '栾川县', count: 3 },
  { name: '洛龙区', count: 8 },
  { name: '洛宁县', count: 2 },
  { name: '涧西区', count: 7 },
  { name: '孟津区', count: 2 },
  { name: '汝阳县', count: 2 },
  { name: '新安县', count: 3 },
  { name: '宜阳县', count: 2 },
  { name: '伊川县', count: 3 },
  { name: '偃师区', count: 3 },
];

export const MOCK_SCREEN_TYPES = [
  'IMAX厅', '4DX厅', 'DTS:X临境音', '杜比全景声厅',
  'realD厅', '巨幕厅', '4D厅', 'DTS临境音',
];

export const MOCK_BRANDS = [
  '万达影城', '奥斯卡影城', '横店影城', '卢米埃影城',
  '沃美影城', '新华国际影城', '耀莱影城', '其他',
];
