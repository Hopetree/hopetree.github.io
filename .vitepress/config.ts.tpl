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
    // 搜索
    search: {
      provider: 'algolia',
      options: {
        appId: 'G6QEK9X4WI',
        apiKey: '3be5076322e981f21c813f400e7c8ffd',
        indexName: 'hopetreeio',
        locales: {
          zh: {
            placeholder: '搜索文档',
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                searchBox: {
                  resetButtonTitle: '清除查询条件',
                  resetButtonAriaLabel: '清除查询条件',
                  cancelButtonText: '取消',
                  cancelButtonAriaLabel: '取消'
                },
                startScreen: {
                  recentSearchesTitle: '搜索历史',
                  noRecentSearchesText: '没有搜索历史',
                  saveRecentSearchButtonTitle: '保存至搜索历史',
                  removeRecentSearchButtonTitle: '从搜索历史中移除',
                  favoriteSearchesTitle: '收藏',
                  removeFavoriteSearchButtonTitle: '从收藏中移除'
                },
                errorScreen: {
                  titleText: '无法获取结果',
                  helpText: '你可能需要检查你的网络连接'
                },
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                  searchByText: '搜索提供者'
                },
                noResultsScreen: {
                  noResultsText: '无法找到相关结果',
                  suggestedQueryText: '你可以尝试查询',
                  reportMissingResultsText: '你认为该查询应该有结果？',
                  reportMissingResultsLinkText: '点击反馈'
                }
              }
            }
          }
        }
      }
    },
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

