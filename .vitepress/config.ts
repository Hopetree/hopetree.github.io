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

    sidebar: {
      '/blog/': [
        {
          text: 'blog',
          items: [
            { text: 'mk', link: '/blog/mk' },
          ]
        }
      ],
      '/ai/': [
        {
          text: 'ChatGPT 中文调教指南'
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Hopetree/hopetree.github.io' }
    ]
  }
})

