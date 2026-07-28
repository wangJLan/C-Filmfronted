export interface HotFilm {
  id: number;
  title: string;
  tags: string[];
  rating: number;
  wantCount: string;
  genre?: string;
}

export interface UpcomingFilm {
  id: number;
  title: string;
  tags: string[];
  rating?: number;
  wantCount: string;
  releaseDate: string;
  isReleased?: boolean;
}

export interface BenefitItem {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  icon: string;
}

export const MOCK_HOT_FILMS: HotFilm[] = [
  {
    id: 1,
    title: '蜘蛛侠3',
    tags: ['IMAX 2D'],
    rating: 9.6,
    wantCount: '4.9万人想看',
  },
  {
    id: 2,
    title: '功夫女足',
    tags: ['IMAX 2D'],
    rating: 9.1,
    wantCount: '48万人想看',
  },
  {
    id: 3,
    title: '痴迷',
    tags: ['杜比视界2D'],
    rating: 0,
    wantCount: '58.5万人想看',
  },
  {
    id: 4,
    title: '蜘蛛侠：...',
    tags: ['中国巨幕2D'],
    rating: 0,
    wantCount: '1.2万人想看',
  },
];

export const MOCK_UPCOMING_FILMS: UpcomingFilm[] = [
  {
    id: 5,
    title: '群星闪耀时',
    tags: ['CINITY 2D'],
    rating: 9.7,
    wantCount: '5.8万人想看',
    releaseDate: '2026年上映',
    isReleased: false,
  },
  {
    id: 6,
    title: '偷偷藏不住',
    tags: [],
    rating: 0,
    wantCount: '19.0万人想看',
    releaseDate: '8月19日上映',
    isReleased: false,
  },
  {
    id: 7,
    title: '澎湖海战',
    tags: [],
    rating: 0,
    wantCount: '1.9万人想看',
    releaseDate: '2026年上映',
    isReleased: false,
  },
  {
    id: 8,
    title: '恩宅惊魂',
    tags: [],
    rating: 0,
    wantCount: '',
    releaseDate: '7月30日上映',
    isReleased: false,
  },
];

export const MOCK_BENEFITS: BenefitItem[] = [
  {
    id: 1,
    title: '福利派对',
    subtitle: '最高享0元观影',
    buttonText: '去集币',
    icon: 'party',
  },
  {
    id: 2,
    title: '券包立减',
    subtitle: '一单回本超前省钱',
    buttonText: '享福利',
    icon: 'coupon',
  },
];
