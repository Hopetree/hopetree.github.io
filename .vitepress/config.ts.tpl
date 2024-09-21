import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ignoreDeadLinks: true,
  lang: 'zh-CN',
  title: "我的文档",
  description: "A VitePress Site",
  head: [
    ['link', { rel: 'icon', href: '/img/favicon.png' }]
  ],
  themeConfig: {
    // 这里设置显示的大纲层级
    outline: {
      level: [2, 4] // 显示 h2 到 h4 的标题
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '个人博客', link: 'https://tendcode.com' }
    ],
    // update date:{{date}}
    sidebar: {{sidebar}},
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Hopetree/hopetree.github.io' }
    ]
  }
})

