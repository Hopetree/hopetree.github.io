import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "我的文档",
  description: "A VitePress Site",
  head: [
    ['link', { rel: 'icon', href: '/img/favicon.png' }]
  ],
  themeConfig: {
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

