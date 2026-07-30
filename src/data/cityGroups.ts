/**
 * 城市分组数据 — 热门城市 + A-Z 分组
 */
import CITIES from './cities';

export interface CityItem {
  name: string;
  lat: number;
  lng: number;
}

/** 热门城市 */
export const HOT_CITIES: string[] = [
  '北京', '上海', '广州', '深圳', '杭州',
  '成都', '武汉', '南京', '重庆', '西安',
  '长沙', '苏州', '天津', '郑州', '青岛',
];

/** 按首字母分组 */
export interface CityGroup {
  letter: string;
  cities: CityItem[];
}

export function getCityGroups(): CityGroup[] {
  const map = new Map<string, CityItem[]>();

  CITIES.forEach((c) => {
    const letter = getFirstLetter(c.n);
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push({ name: c.n, lat: c.l[0], lng: c.l[1] });
  });

  const keys = Array.from(map.keys()).sort();
  return keys.map((k) => ({
    letter: k,
    cities: map.get(k)!.sort((a, b) => a.name.localeCompare(b.name, 'zh')),
  }));
}

/** 获取中文首字母（简单拼音映射，覆盖常用城市） */
function getFirstLetter(name: string): string {
  const first = name.charAt(0);
  // 大部分城市首字的首字母映射
  const map: Record<string, string> = {
    阿: 'A', 鞍: 'A', 安: 'A', 澳: 'A',
    巴: 'B', 白: 'B', 百: 'B', 蚌: 'B', 包: 'B', 宝: 'B', 保: 'B', 北: 'B', 本: 'B', 毕: 'B', 滨: 'B', 亳: 'B', 博: 'B',
    沧: 'C', 昌: 'C', 长: 'C', 常: 'C', 巢: 'C', 朝: 'C', 潮: 'C', 郴: 'C', 成: 'C', 承: 'C', 重: 'C', 赤: 'C', 滁: 'C', 楚: 'C', 崇: 'C',
    大: 'D', 丹: 'D', 德: 'D', 迪: 'D', 定: 'D', 东: 'D',
    鄂: 'E', 恩: 'E',
    防: 'F', 佛: 'F', 福: 'F', 抚: 'F', 阜: 'F',
    甘: 'G', 赣: 'G', 固: 'G', 广: 'G', 贵: 'G', 桂: 'G',
    哈: 'H', 海: 'H', 邯: 'H', 汉: 'H', 杭: 'H', 合: 'H', 鹤: 'H', 河: 'H', 菏: 'H', 贺: 'H', 黑: 'H', 衡: 'H', 红: 'H', 呼: 'H', 湖: 'H', 葫: 'H', 怀: 'H', 淮: 'H', 黄: 'H', 惠: 'H',
    鸡: 'J', 吉: 'J', 济: 'J', 佳: 'J', 嘉: 'J', 江: 'J', 焦: 'J', 揭: 'J', 金: 'J', 锦: 'J', 晋: 'J', 荆: 'J', 景: 'J', 九: 'J', 酒: 'J',
    开: 'K', 喀: 'K', 克: 'K', 昆: 'K',
    拉: 'L', 来: 'L', 莱: 'L', 兰: 'L', 廊: 'L', 乐: 'L', 丽: 'L', 连: 'L', 凉: 'L', 聊: 'L', 临: 'L', 柳: 'L', 六: 'L', 龙: 'L', 陇: 'L', 娄: 'L', 泸: 'L', 洛: 'L', 漯: 'L', 吕: 'L',
    马: 'M', 茂: 'M', 眉: 'M', 梅: 'M', 绵: 'M', 牡: 'M',
    那: 'N', 南: 'N', 内: 'N', 宁: 'N', 怒: 'N',
    攀: 'P', 盘: 'P', 平: 'P', 萍: 'P', 莆: 'P', 濮: 'P', 普: 'P',
    七: 'Q', 齐: 'Q', 千: 'Q', 黔: 'Q', 钦: 'Q', 秦: 'Q', 青: 'Q', 清: 'Q', 庆: 'Q', 曲: 'Q', 衢: 'Q', 泉: 'Q',
    日: 'R',
    三: 'S', 厦: 'X', 汕: 'S', 商: 'S', 上: 'S', 韶: 'S', 邵: 'S', 绍: 'S', 深: 'S', 沈: 'S', 十: 'S', 石: 'S', 双: 'S', 朔: 'S', 四: 'S', 松: 'S', 苏: 'S', 宿: 'S', 绥: 'S', 随: 'S', 遂: 'S',
    塔: 'T', 台: 'T', 太: 'T', 泰: 'T', 唐: 'T', 天: 'T', 铁: 'T', 通: 'T', 铜: 'T',
    威: 'W', 潍: 'W', 渭: 'W', 温: 'W', 文: 'W', 乌: 'W', 无: 'W', 吴: 'W', 芜: 'W', 梧: 'W', 武: 'W',
    西: 'X', 锡: 'X', 咸: 'X', 湘: 'X', 襄: 'X', 孝: 'X', 忻: 'X', 新: 'X', 信: 'X', 邢: 'X', 徐: 'X', 许: 'X', 宣: 'X',
    雅: 'Y', 烟: 'Y', 延: 'Y', 盐: 'Y', 扬: 'Y', 阳: 'Y', 伊: 'Y', 宜: 'Y', 益: 'Y', 银: 'Y', 营: 'Y', 鹰: 'Y', 永: 'Y', 榆: 'Y', 玉: 'Y', 岳: 'Y', 云: 'Y', 运: 'Y',
    枣: 'Z', 湛: 'Z', 张: 'Z', 漳: 'Z', 肇: 'Z', 镇: 'Z', 郑: 'Z', 中: 'Z', 舟: 'Z', 周: 'Z', 株: 'Z', 珠: 'Z', 驻: 'Z', 资: 'Z', 淄: 'Z', 自: 'Z', 遵: 'Z',
  };
  return map[first] || first;
}

/** 根据城市名查找坐标 */
export function findCity(name: string): CityItem | undefined {
  const c = CITIES.find((x) => x.n === name);
  return c ? { name: c.n, lat: c.l[0], lng: c.l[1] } : undefined;
}

/** 根据坐标计算直线距离（公里） */
export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
}
