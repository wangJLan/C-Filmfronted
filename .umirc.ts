import { defineConfig } from 'umi';

export default defineConfig({
  // ================= 路由 =================
  routes: [
    {
      path: '/',
      component: '@/layouts/BasicLayout',
      routes: [
        { path: '/', component: '@/pages/home/index', title: '电影' },
        { path: '/film', component: '@/pages/film/index', title: '热映' },
        { path: '/cinema', component: '@/pages/cinema/index', title: '影院' },
        { path: '/discover', component: '@/pages/discover/index', title: '发现' },
        { path: '/detail/:id', component: '@/pages/detail/index', title: '影片详情' },
        { path: '/news/:id', component: '@/pages/news/index', title: '影片动态' },
        { path: '/user', component: '@/pages/user/index', title: '我的' },
        { path: '/orders', component: '@/pages/orders/index', title: '我的订单' },
        { path: '/my-reviews', component: '@/pages/my-reviews/index', title: '我的影评' },
        { path: '/want-to-see', component: '@/pages/want-to-see/index', title: '想看的电影' },
        { path: '/watched', component: '@/pages/watched/index', title: '看过的电影' },
        { path: '/settings', component: '@/pages/settings/index', title: '设置' },
        { path: '/showtime/:filmId/:cinemaId', component: '@/pages/showtime/index', title: '影院场次' },
        { path: '/showtime/cinema/:cinemaId', component: '@/pages/showtime/index', title: '影院场次' },
        { path: '/showtime/film/:filmId', component: '@/pages/showtime/index', title: '影院场次' },
        { path: '/seat/:showtimeId', component: '@/pages/seat/index', title: '选座' },
        { path: '/order-confirm/:orderId', component: '@/pages/order-confirm/index', title: '订单确认' },
        { path: '/payment/:orderId', component: '@/pages/payment/index', title: '收银台' },
        { path: '/ticket/:orderId', component: '@/pages/ticket/index', title: '电子票' },
        { path: '/refund-apply/:orderId', component: '@/pages/refund-apply/index', title: '退票' },
        { path: '/refund-progress/:orderId', component: '@/pages/refund-progress/index', title: '退款进度' },
        { path: '/refund-detail/:orderId', component: '@/pages/refund-detail/index', title: '退款详情' },
        { path: '/payment-success/:orderId', component: '@/pages/payment-success/index', title: '支付成功' },
        { path: '/profile-edit', component: '@/pages/profile-edit/index', title: '编辑资料' },
        { path: '/forgot-password', component: '@/pages/forgot-password/index', title: '设置密码' },
        { path: '/cinema-detail/:cinemaId', component: '@/pages/cinema-detail/index', title: '影院详情' },
        { path: '/cinema-service-detail/:serviceType', component: '@/pages/cinema-service-detail/index', title: '服务详情' },
        { path: '/cinema-feedback', component: '@/pages/cinema-feedback/index', title: '给影院提建议' },
        { path: '/cinema-price-info', component: '@/pages/cinema-price-info/index', title: '划线价格说明' },
        { path: '/ai', component: '@/pages/ai/index', title: 'AI 助手' },
        { path: '/search', component: '@/pages/search/index', title: '搜索影片' },
        { path: '/city-picker', component: '@/pages/city-picker/index', title: '选择城市' },
        { path: '/privacy', component: '@/pages/privacy/index', title: '隐私政策' },
        { path: '/agreement', component: '@/pages/agreement/index', title: '用户协议' },
      ],
    },
  ],

  // ================= 构建配置 =================
  jsMinifier: 'terser',
  cssMinifier: 'cssnano',

  // ================= 代理 =================
  proxy: {
    '/api': {
      target: 'http://localhost:8123',
      changeOrigin: true,
      xfwd: true,
    },
    '/uploads': {
      target: 'http://localhost:8123/api',
      changeOrigin: true,
    },
  },

  // ================= 移动端 H5 适配 =================
  extraPostCSSPlugins: [
    require('postcss-pxtorem')({
      rootValue: 37.5,
      propList: ['*'],
      selectorBlackList: ['.norem'],
      minPixelValue: 2,
    }),
  ],

  // ================= 其他 =================
  title: '妙语购票',
  favicons: ['/favicon.ico'],

  targets: {
    ios: 12,
    android: 6,
    chrome: 80,
  },

  devtool: process.env.NODE_ENV === 'development' ? 'eval-cheap-module-source-map' : false,
  deadCode: {},
  codeSplitting: { jsStrategy: 'granularChunks' },
});
