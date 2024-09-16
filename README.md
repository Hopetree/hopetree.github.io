# 个人文档项目

个人文档网站，使用 github 的 page 能力部署，访问 https://hopetree.github.io

## 本地调试

本地运行

```bash
npm run docs:dev  
```

本地打包

```bash
npm run docs:build
```

## 网站内容自动同步

使用定时任务定时同步博客文章到项目中，规则如下：

1. 博文全部放到 blog 目录下，并按照专题分类存放
2. 根据模板 index.tml 自动生成主页 index.md 文件，动态生成专题列表
3. 根据模板 .vitepress/config.tpl 自动生成 .vitepress/config.ts 文件，动态生成左侧导航