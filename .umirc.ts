import { defineConfig } from 'umi';

export default defineConfig({
  // ================= 路由 =================
  routes: [
    {
      path: '/',
      component: '@/layouts/BasicLayout',
      routes: [
        { path: '/', component: '@/pages/home/index' },
        { path: '/detail/:id', component: '@/pages/detail/index' },
        { path: '/user', component: '@/pages/user/index' },
      ],
    },
  ],

  // ================= 构建配置 =================
  // Umi 4 默认 JS 压缩器: esbuild (快) / terser (压缩率高)
  jsMinifier: 'terser',
  // CSS 压缩
  cssMinifier: 'cssnano',

  // ================= 代理 =================
  // 后端: Spring Boot, port 8123, context-path /api
  // 前端 /api/* → http://localhost:8123/api/*（不 strip 前缀）
  proxy: {
    '/api': {
      target: 'http://localhost:8123',
      changeOrigin: true,
    },
  },

  // ================= 移动端 H5 适配 =================
  // viewport rem 基准: 375 设计稿 → 1rem = 100px (方便换算)
  extraPostCSSPlugins: [
    require('postcss-pxtorem')({
      rootValue: 37.5,         // 375 设计稿: 37.5px = 1rem
      propList: ['*'],
      selectorBlackList: ['.norem'],
      minPixelValue: 2,
    }),
  ],

  // ================= Less / CSS Modules =================
  // Umi 4 默认: src/**/*.less → CSS Modules; src/**/*.css → 全局
  // global.less 自动全局生效

  // ================= 其他 =================
  title: '妙语购票',
  favicons: ['/favicon.ico'],

  // 兼容性
  targets: {
    ios: 12,
    android: 6,
    chrome: 80,
  },

  // 开发服务器
  devtool: process.env.NODE_ENV === 'development' ? 'eval-cheap-module-source-map' : false,

  // 死代码剔除
  deadCode: {},

  // Moment → Dayjs (Umi 4 内置 antd-mobile 使用 dayjs 已无需此配置，提前声明以防万一)
  // Umi 4 已默认使用 dayjs 替代 moment

  // Code splitting
  codeSplitting: {
    jsStrategy: 'granularChunks',
  },

  // 按需加载 (Umi 4 antd-mobile 已自动按需)
  // 无需额外配置 babel-plugin-import
});
