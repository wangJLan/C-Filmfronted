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
        { path: '/user', component: '@/pages/user/index', title: '我的' },
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
