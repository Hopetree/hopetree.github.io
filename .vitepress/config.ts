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
    // update date:2026-03-08 02:30:17
    sidebar: {
  "/blog/1/": [
    {
      "text": "安装指导",
      "collapsed": false,
      "items": [
        {
          "text": "izone 博客容器化部署、升级及迁移步骤最新版（随项目更新）",
          "link": "/blog/1/izone-install-docs"
        }
      ]
    },
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "在 Linux 服务器上使用 Nginx + Gunicorn 部署 Django 项目的正确姿势",
          "link": "/blog/1/set-up-django-with-nginx-and-gunicorn"
        },
        {
          "text": "使用 Supervisor 部署 Django 应用程序",
          "link": "/blog/1/Supervisor_gunicorn_django"
        },
        {
          "text": "博客将 Django 1.11+ 升级到 Django 2.2+ 遇到的问题及规避方法",
          "link": "/blog/1/django2"
        },
        {
          "text": "关于本博客项目的一些版本及对应分支的调整并解答一些问题",
          "link": "/blog/1/blog-update"
        },
        {
          "text": "一次完整的 Django 项目的迁移，有关 MySQL 数据库的导出与导入",
          "link": "/blog/1/django-mysql"
        }
      ]
    },
    {
      "text": "配置管理",
      "collapsed": false,
      "items": []
    },
    {
      "text": "后台管理",
      "collapsed": false,
      "items": [
        {
          "text": "使用 Django 的 admin 定制后台，丰富自己网站的后台管理系统",
          "link": "/blog/1/django-admin"
        },
        {
          "text": "Django 中 locale 的用法：自定义翻译",
          "link": "/blog/1/django-locale"
        },
        {
          "text": "Django管理后台技巧分享之实例关系的搜索，autocomplete_fields字段使用",
          "link": "/blog/1/django-admin-autocomplete_fields"
        }
      ]
    },
    {
      "text": "功能开发",
      "collapsed": false,
      "items": [
        {
          "text": "服务器监控应用（1）：服务端开发",
          "link": "/blog/1/server-status-1"
        },
        {
          "text": "服务器监控应用（2）：使用 Golang 开发客户端",
          "link": "/blog/1/server-status-2"
        },
        {
          "text": "服务器监控应用（3）：监控告警通知开发",
          "link": "/blog/1/server-status-3"
        },
        {
          "text": "Django博客评论区显示用户操作系统与浏览器信息",
          "link": "/blog/1/show-user-agent"
        },
        {
          "text": "Django分页功能改造，一比一还原百度搜索的分页效果",
          "link": "/blog/1/django-paginator"
        },
        {
          "text": "添加文章编辑页面，支持 markdown 编辑器实时预览编辑",
          "link": "/blog/1/blog-edit-page"
        },
        {
          "text": "在Django中使MySQL支持存储Emoji表情🚀",
          "link": "/blog/1/mysql-character-set-server"
        },
        {
          "text": "一个提供公告和打赏功能的 django 应用插件 django-tctip",
          "link": "/blog/1/django-tctip"
        },
        {
          "text": "博客添加 markdown 在线编辑器工具",
          "link": "/blog/1/markdown-editor"
        },
        {
          "text": "博客添加暗色主题切换功能，从主题切换聊聊前后端cookies的使用",
          "link": "/blog/1/theme-change"
        },
        {
          "text": "Django 中使用 ajax 请求的正确姿势",
          "link": "/blog/1/django-ajax"
        },
        {
          "text": "[博客搭建]  通过用户邮箱认证来介绍 django-allauth 的使用思路",
          "link": "/blog/1/user-verified"
        }
      ]
    },
    {
      "text": "缓存",
      "collapsed": false,
      "items": [
        {
          "text": "Django 使用 django-redis 作为缓存的正确用法，别忽略缓存的使用原则",
          "link": "/blog/1/django-redis-for-cache"
        }
      ]
    },
    {
      "text": "定时任务",
      "collapsed": false,
      "items": [
        {
          "text": "Django使用Celery实现异步和定时任务功能",
          "link": "/blog/1/django-celery"
        },
        {
          "text": "让定时任务支持执行自定义脚本",
          "link": "/blog/1/task-for-script"
        },
        {
          "text": "把 Celery 定时任务变成实时触发的任务",
          "link": "/blog/1/run-celery-task-now"
        },
        {
          "text": "使用 Python 的异步模块 asyncio 改造 I/O 密集型定时任务",
          "link": "/blog/1/asyncio-task"
        },
        {
          "text": "Django博客网站可以用定时任务做些什么事？",
          "link": "/blog/1/django-celery-tasks"
        }
      ]
    },
    {
      "text": "数据清理",
      "collapsed": false,
      "items": [
        {
          "text": "给Django网站来一个大扫除——清理过期Session",
          "link": "/blog/1/django-web-clear"
        }
      ]
    },
    {
      "text": "可视化",
      "collapsed": false,
      "items": [
        {
          "text": "Django网站单页面流量统计通用方式分享",
          "link": "/blog/1/django-views"
        },
        {
          "text": "用 ECharts 做网站数据统计报表，告别第三方流量统计平台",
          "link": "/blog/1/ECharts-for-web"
        }
      ]
    },
    {
      "text": "灾备方案",
      "collapsed": false,
      "items": [
        {
          "text": "博客灾备方案（2）：博客文章同步到VitePress静态站",
          "link": "/blog/1/blog-sync-to-vitepress"
        },
        {
          "text": "博客灾备方案（1）：七牛云图床增量同步到GitHub",
          "link": "/blog/1/qiniu-sync-to-github"
        }
      ]
    },
    {
      "text": "拓展",
      "collapsed": false,
      "items": [
        {
          "text": "markdown 支持 Mermaid 流程图的方案",
          "link": "/blog/1/markdown-use-Mermaid"
        },
        {
          "text": "Python-Markdown 自定义拓展",
          "link": "/blog/1/python-markdown-extensions"
        }
      ]
    }
  ],
  "/blog/5/": [
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "容器化部署博客（1）—— 安装 docker 和 docker-compose",
          "link": "/blog/5/install-docker"
        },
        {
          "text": "使用 Ansible 工具批量操作虚拟机集群，自动化安装 Docker",
          "link": "/blog/5/ansible-and-docker"
        }
      ]
    },
    {
      "text": "镜像操作",
      "collapsed": false,
      "items": [
        {
          "text": "分享一个给 Django 镜像瘦身 50% 的经验",
          "link": "/blog/5/docker-image-for-django"
        },
        {
          "text": "Dockerfile 中的 multi-stage 特性，Vue 项目多阶段构建实战",
          "link": "/blog/5/dockerfile-multi-stage"
        }
      ]
    },
    {
      "text": "容器操作",
      "collapsed": false,
      "items": [
        {
          "text": "Docker volume 挂载时文件或文件夹不存在【转】",
          "link": "/blog/5/docker-volume"
        }
      ]
    },
    {
      "text": "docker-compose",
      "collapsed": false,
      "items": [
        {
          "text": "容器化部署博客（2）—— docker-compose 部署 izone 博客",
          "link": "/blog/5/izone-docker"
        },
        {
          "text": "关于 docker compose 的安装和升级问题",
          "link": "/blog/5/update-for-docker-compose"
        },
        {
          "text": "容器化部署博客（3）—— 更换服务器，5分钟完成项目迁移",
          "link": "/blog/5/docker-rebuild"
        }
      ]
    }
  ],
  "/blog/14/": [
    {
      "text": "实战经验",
      "collapsed": false,
      "items": [
        {
          "text": "解决 Python 找不到 libpython3.x.so.1.0 问题的几种方案",
          "link": "/blog/14/python-not-find-libpython"
        },
        {
          "text": "处理 Python 读取 CSV 时多出 \\ufeff 的问题",
          "link": "/blog/14/python-read-csv"
        },
        {
          "text": "ITSM 流程中自动化对接 JumpServer 的实战经验",
          "link": "/blog/14/JumpServer-for-ITSM"
        },
        {
          "text": "如何在 Python 2.7 中获取未调用函数的局部变量",
          "link": "/blog/14/get-function-args-python2"
        },
        {
          "text": "企业微信 SSO 单点登录——使用 Python 调用企业微信接口",
          "link": "/blog/14/weixin-sso-by-python"
        },
        {
          "text": "容器化部署OpenLDAP并使用Python查询LDAP数据",
          "link": "/blog/14/install-openldap-and-query-by-python"
        },
        {
          "text": "使用Python SDK操作VMware进行虚拟机创建和配置变更",
          "link": "/blog/14/python-sdk-for-vmware"
        },
        {
          "text": "Python 调用接口进行文件上传的踩坑记录",
          "link": "/blog/14/python-api-upload-files"
        },
        {
          "text": "解决 pyyaml 修改 yaml 文件之后无法保留原文件格式和顺序的问题",
          "link": "/blog/14/yaml_order"
        },
        {
          "text": "Python 模板渲染库 yaml 和 jinja2 的实战经验分享",
          "link": "/blog/14/yaml_and_jinja2"
        },
        {
          "text": "Python 进行 SSH 操作，实现本地与服务器的链接，进行文件的上传和下载",
          "link": "/blog/14/python-ssh"
        },
        {
          "text": "Python 虚拟环境 Virtualenv 分别在 Windows 和 Linux 上的安装和使用",
          "link": "/blog/14/virtualenv-for-python"
        }
      ]
    },
    {
      "text": "包管理",
      "collapsed": false,
      "items": [
        {
          "text": "使用pip下载python依赖包whl文件并进行离线安装",
          "link": "/blog/14/pip-offline-download"
        },
        {
          "text": "CentOS下使用pip安装python依赖报错的解决思路",
          "link": "/blog/14/pip-upgrade"
        },
        {
          "text": "使用 python-build-standalone 创建 Python3 可移植运行环境",
          "link": "/blog/14/python-build-standalone-portable-python3-env"
        },
        {
          "text": "使用 setup.py 将 Python 库打包分发到 PyPI 踩坑指南",
          "link": "/blog/14/setup-to-pypy"
        }
      ]
    },
    {
      "text": "爬虫",
      "collapsed": false,
      "items": [
        {
          "text": "Python 有道翻译爬虫，破解 sign 参数加密反爬机制，解决{\"errorCode\":50}错误",
          "link": "/blog/14/youdao-spider"
        },
        {
          "text": "[Python 爬虫]煎蛋网 OOXX 妹子图爬虫（1）——解密图片地址",
          "link": "/blog/14/jiandan-meizi-spider"
        },
        {
          "text": "[Python 爬虫]煎蛋网 OOXX 妹子图爬虫（2）——多线程+多进程下载图片",
          "link": "/blog/14/jiandan-meizi-spider-2"
        },
        {
          "text": "使用 selenium 爬取新浪微盘，免费下载周杰伦的歌曲",
          "link": "/blog/14/python-spider-sina-weipan"
        },
        {
          "text": "分析新浪微盘接口，调用接口爬取周杰伦歌曲",
          "link": "/blog/14/python-spider-sina-weipan-2"
        },
        {
          "text": "双11当晚写的天猫爬虫，爬虫神器 scrapy 大法好！！！",
          "link": "/blog/14/tmall-scrapy-spider"
        },
        {
          "text": "安装 Scrapy 失败的正确解决方法及运行中报错的解决思路",
          "link": "/blog/14/install-scrapy"
        },
        {
          "text": ".app 域名发布了，我们可以使用 Python 做点什么？",
          "link": "/blog/14/spider-for-domain"
        },
        {
          "text": "使用 selenium 写的多进程全网页截图工具，发现了 PhantomJS 截图的 bug",
          "link": "/blog/14/PhantomJS-screenshot"
        }
      ]
    },
    {
      "text": "命令行",
      "collapsed": false,
      "items": [
        {
          "text": "使用 python 执行 shell 命令的几种常用方式",
          "link": "/blog/14/python-shell-cmd"
        },
        {
          "text": "Python 命令行参数的3种传入方式",
          "link": "/blog/14/python-shell"
        }
      ]
    },
    {
      "text": "技巧分享",
      "collapsed": false,
      "items": [
        {
          "text": "Python 日志中 exc_info 和 stacklevel 参数的使用场景",
          "link": "/blog/14/python-logging-traceback"
        },
        {
          "text": "Python 脚本中日志级别控制示例",
          "link": "/blog/14/python-logging-level"
        },
        {
          "text": "分享一种使用 Python 调用接口“失败”后重试的通用方案",
          "link": "/blog/14/python-loop-retry"
        },
        {
          "text": "Python 上下文管理及 with 语句的实用技巧",
          "link": "/blog/14/with"
        },
        {
          "text": "python2 和 python3 常见差异及兼容方式梳理",
          "link": "/blog/14/py2_and_py3"
        },
        {
          "text": "分享一个简单的 Python 脚本库：将 requests 代码转换成 curl 命令",
          "link": "/blog/14/python-to-curl"
        }
      ]
    },
    {
      "text": "Web 开发",
      "collapsed": false,
      "items": [
        {
          "text": "Python2.7 环境中 Tornado 实现异步接口请求的两种方式",
          "link": "/blog/14/tornado-async-for-python2"
        },
        {
          "text": "Flask、Tornado、FastAPI、Sanic 以及 Gin 框架性能对比",
          "link": "/blog/14/Flask-Tornado-FastAPI-Sanic-Gin"
        }
      ]
    },
    {
      "text": "自动化测试",
      "collapsed": false,
      "items": [
        {
          "text": "【Appium 自动化测试】搭建 Appium 环境踩坑记录",
          "link": "/blog/14/appium-env"
        }
      ]
    }
  ],
  "/blog/4/": [
    {
      "text": "安装升级",
      "collapsed": false,
      "items": [
        {
          "text": "VMware虚拟机桥接网络设置固定静态IP",
          "link": "/blog/4/vmware-bridged-network"
        },
        {
          "text": "VirtualBox 安装 CentOS 7 系统并通过主机 ssh 连接虚拟机",
          "link": "/blog/4/virtualbox-install-centos7"
        }
      ]
    },
    {
      "text": "学习笔记",
      "collapsed": false,
      "items": [
        {
          "text": "Linux 系统 OOM 排查指南",
          "link": "/blog/4/linux-oom"
        },
        {
          "text": "记录一些在持续部署中可复用的shell命令和函数",
          "link": "/blog/4/shell-functions-and-commands"
        },
        {
          "text": "Linux系统中负载过高问题的排查思路与解决方案",
          "link": "/blog/4/Linux-Load-Average"
        },
        {
          "text": "检查服务器端口连通性的几种方法",
          "link": "/blog/4/port-check"
        },
        {
          "text": "Linux 三剑客（grep awk sed）常用操作笔记",
          "link": "/blog/4/grep-awk-sed"
        },
        {
          "text": "Linux 学习笔记 ——第（1）期",
          "link": "/blog/4/study-linux-01"
        }
      ]
    },
    {
      "text": "案例分享",
      "collapsed": false,
      "items": [
        {
          "text": "iptables 规则导致的容器监听端口无法被外部访问问题记录",
          "link": "/blog/4/iptables-rule-docker-forward"
        },
        {
          "text": "使用curl命令获取请求接口每个阶段的耗时",
          "link": "/blog/4/curl-time"
        },
        {
          "text": "rsync 实时同步方案",
          "link": "/blog/4/rsync"
        },
        {
          "text": "Linux 设置 SSH 密钥登陆及更换登录端口",
          "link": "/blog/4/ssh-id_rsa"
        },
        {
          "text": "Linux 上使用 crontab 设置定时任务及运行 Python 代码不执行的解决方案",
          "link": "/blog/4/hello-crontab"
        }
      ]
    },
    {
      "text": "代理",
      "collapsed": false,
      "items": []
    },
    {
      "text": "资源分享",
      "collapsed": false,
      "items": [
        {
          "text": "分享一些常用的更换各种“源”的经验",
          "link": "/blog/4/sources-conf"
        }
      ]
    }
  ],
  "/blog/18/": [
    {
      "text": "开发环境",
      "collapsed": false,
      "items": [
        {
          "text": "JetBrains 全家桶免费使用的方法",
          "link": "/blog/18/JetBrains-IDE"
        },
        {
          "text": "Go 学习笔记（1）：GoLand 安装并通过插件重置试用到期时间",
          "link": "/blog/18/GoLand-install"
        }
      ]
    },
    {
      "text": "基础语法",
      "collapsed": false,
      "items": [
        {
          "text": "Go 学习笔记（2）：变量和常量",
          "link": "/blog/18/golang-study-2"
        },
        {
          "text": "Go 学习笔记（3）：基本类型",
          "link": "/blog/18/golang-study-3"
        },
        {
          "text": "Go 学习笔记（4）：数组和切片",
          "link": "/blog/18/golang-study-4"
        },
        {
          "text": "Go 学习笔记（5）：指针、Map 和 结构体",
          "link": "/blog/18/golang-study-5"
        }
      ]
    },
    {
      "text": "控制流",
      "collapsed": false,
      "items": [
        {
          "text": "Go 学习笔记（6）：循环和判断",
          "link": "/blog/18/golang-study-6"
        }
      ]
    },
    {
      "text": "函数",
      "collapsed": false,
      "items": []
    },
    {
      "text": "面向对象",
      "collapsed": false,
      "items": []
    },
    {
      "text": "并发编程",
      "collapsed": false,
      "items": [
        {
          "text": "Go 学习笔记（8）：生产者消费者模型",
          "link": "/blog/18/golang-study-8"
        }
      ]
    },
    {
      "text": "标准库",
      "collapsed": false,
      "items": []
    },
    {
      "text": "开源库",
      "collapsed": false,
      "items": [
        {
          "text": "Go 学习笔记（12）：使用Viper读取配置文件",
          "link": "/blog/18/golang-study-12"
        },
        {
          "text": "Go 学习笔记（10）：cli 命令行的使用",
          "link": "/blog/18/golang-study-10"
        }
      ]
    },
    {
      "text": "编译及发布",
      "collapsed": false,
      "items": [
        {
          "text": "Go 学习笔记（11）：利用 GitHub Actions 进行多平台打包",
          "link": "/blog/18/go-releaser"
        }
      ]
    },
    {
      "text": "学习成果",
      "collapsed": false,
      "items": [
        {
          "text": "Go 学习笔记（7）：学习成果之写一个 API 调用的 sdk",
          "link": "/blog/18/golang-study-7"
        },
        {
          "text": "Go 学习笔记（9）：多并发爬虫下载图片",
          "link": "/blog/18/golang-study-9"
        },
        {
          "text": "Go 学习笔记（13）：开发一个简单的端口转发程序",
          "link": "/blog/18/golang-study-13"
        }
      ]
    }
  ],
  "/blog/3/": [
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "使用 Docker 运行 Jenkins 容器",
          "link": "/blog/3/Jenkins-install"
        }
      ]
    },
    {
      "text": "使用技巧",
      "collapsed": false,
      "items": []
    },
    {
      "text": "实战案例",
      "collapsed": false,
      "items": [
        {
          "text": "【Jenkins 插件】Jenkins Pipeline 流水线插件的使用，Vue 项目自动化构建和部署实战",
          "link": "/blog/3/Jenkins-Pipeline"
        },
        {
          "text": "【Jenkins 插件】使用 Publish Over SSH 远程传输文件和自动部署",
          "link": "/blog/3/Publish-Over-SSH"
        },
        {
          "text": "Jenkins 构建 vue 项目镜像并推送到阿里云镜像仓库",
          "link": "/blog/3/docker-and-vue"
        },
        {
          "text": "【Jenkins 插件】使用 SSH Slaves 创建从节点执行任务",
          "link": "/blog/3/jenkins-slave"
        },
        {
          "text": "【Jenkins 插件】使用 github 插件从 GitHub 上拉取项目代码",
          "link": "/blog/3/jenkins_link_github"
        }
      ]
    }
  ],
  "/blog/2/": [
    {
      "text": "ChatGPT",
      "collapsed": false,
      "items": [
        {
          "text": "ChatGPT提问的艺术",
          "link": "/blog/2/chatgpt-prompts"
        },
        {
          "text": "浏览器插件开发：一个简单的站外搜索插件",
          "link": "/blog/2/browser-plugin-site-search"
        },
        {
          "text": "依靠 ChatGPT 开发一个完整功能的浏览器插件",
          "link": "/blog/2/develop-browser-plugin-with-chatgpt"
        },
        {
          "text": "[ChatGPT解决方案]获取 nginx 日志中请求 IP 统计数，设置 IP 流量限制",
          "link": "/blog/2/ChatGPT-nginx-ip-limit"
        },
        {
          "text": "[ChatGPT解决方案]🤖️ChatGPT协助我完成博客代码块添加复制代码和显示代码语言功能",
          "link": "/blog/2/ChatGPT-blog-req"
        },
        {
          "text": "[ChatGPT解决方案]Nginx配置实现请求失败图片的统一转发",
          "link": "/blog/2/ChatGPT-nginx-error"
        },
        {
          "text": "[ChatGPT解决方案]生成 nginx 自签名证书",
          "link": "/blog/2/ChatGPT-nginx-sert"
        }
      ]
    },
    {
      "text": "Trae",
      "collapsed": false,
      "items": [
        {
          "text": "再一次被 AI 的编程能力折服！！！",
          "link": "/blog/2/amazing-ai"
        }
      ]
    }
  ],
  "/blog/6/": [
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "MongoDB单实例部署",
          "link": "/blog/6/mongodb-install-standalone"
        },
        {
          "text": "MongoDB集群部署——（Replica Set）副本集模式",
          "link": "/blog/6/mongodb-install-Replica-Set"
        }
      ]
    },
    {
      "text": "数据迁移",
      "collapsed": false,
      "items": [
        {
          "text": "记一次因MongoDB数据迁移的失误导致的灾备环境事故",
          "link": "/blog/6/mongodb-restore"
        }
      ]
    },
    {
      "text": "配置变更",
      "collapsed": false,
      "items": [
        {
          "text": "MongoDB 集群主机 IP 变更后恢复集群状态的方案",
          "link": "/blog/6/mongodb-change-host-ip"
        }
      ]
    }
  ],
  "/blog/7/": [
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "CentOS 系统搭建 k8s 环境v1.16.0",
          "link": "/blog/7/k8s_install-k8s"
        },
        {
          "text": "使用 ansible-playbook 搭建 k8s 环境v1.16.0",
          "link": "/blog/7/k8s_install-k8s-by-ansible"
        }
      ]
    }
  ],
  "/blog/8/": [
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "安装部署Prometheus和Grafana，并配置主机监控面板",
          "link": "/blog/8/install-prometheus-and-grafana"
        }
      ]
    },
    {
      "text": "采集插件",
      "collapsed": false,
      "items": [
        {
          "text": "给 Node Exporter 添加自定义指标 —— 以温度监控为例",
          "link": "/blog/8/node_exporter-Textfile-Collector"
        },
        {
          "text": "自定义Prometheus指标采集插件，采集并显示PVE系统的温度和功率",
          "link": "/blog/8/prometheus-exporter-plugin-for-PVE"
        }
      ]
    },
    {
      "text": "Grafana",
      "collapsed": false,
      "items": [
        {
          "text": "在 Grafana 中通过 Infinity 数据源可视化接口数据",
          "link": "/blog/8/Grafana-Infinity"
        }
      ]
    }
  ],
  "/blog/10/": [
    {
      "text": "Nginx配置学习",
      "collapsed": false,
      "items": [
        {
          "text": "Nginx配置中server模块的加载顺序和规则",
          "link": "/blog/10/nginx-server"
        },
        {
          "text": "终于理解了Nginx配置中location规则的优先级问题",
          "link": "/blog/10/nginx-location"
        }
      ]
    },
    {
      "text": "Nginx配置实战",
      "collapsed": false,
      "items": [
        {
          "text": "被国产某SSL续签工具背刺",
          "link": "/blog/10/fuck-httpsok"
        },
        {
          "text": "来自网信办的安全巡检报告：SSL弱密码整改",
          "link": "/blog/10/ssl-ciphers"
        },
        {
          "text": "Nginx 应对网站扫描工具的方案",
          "link": "/blog/10/web-scan"
        },
        {
          "text": "Nginx配置gzip压缩的重要性",
          "link": "/blog/10/nginx-gzip"
        },
        {
          "text": "Nginx配置移动端访问自动重定向到指定请求",
          "link": "/blog/10/nginx-mobile-conf"
        },
        {
          "text": "Nginx使用resolver配置解决域名解析成ipv6的问题",
          "link": "/blog/10/nginx-resolver"
        }
      ]
    }
  ],
  "/blog/11/": [
    {
      "text": "Git操作",
      "collapsed": false,
      "items": [
        {
          "text": "Git 提交信息规范与最佳实践",
          "link": "/blog/11/git-commit"
        },
        {
          "text": "Git 常用及特殊命令笔记",
          "link": "/blog/11/git-note"
        }
      ]
    },
    {
      "text": "Github相关",
      "collapsed": false,
      "items": [
        {
          "text": "分享一些 GitHub Actions 的实用技巧",
          "link": "/blog/11/github-actions"
        }
      ]
    },
    {
      "text": "Gitea",
      "collapsed": false,
      "items": [
        {
          "text": "使用 Docker 搭建个人私有化 Git 服务：Gitea + SSH 配置实践",
          "link": "/blog/11/install-gitea"
        }
      ]
    }
  ],
  "/blog/12/": [
    {
      "text": "HTTPS证书",
      "collapsed": false,
      "items": [
        {
          "text": "HTTPS证书过期时间获取",
          "link": "/blog/12/https-cert-info"
        }
      ]
    }
  ],
  "/blog/13/": [
    {
      "text": "达梦数据库",
      "collapsed": false,
      "items": [
        {
          "text": "Linux安装DM（达梦）数据库",
          "link": "/blog/13/dm-install"
        }
      ]
    }
  ],
  "/blog/15/": [
    {
      "text": "烂笔头周刊",
      "collapsed": false,
      "items": [
        {
          "text": "烂笔头周刊（第4期）：保持学习",
          "link": "/blog/15/notes-weekly-4"
        },
        {
          "text": "烂笔头周刊（第3期）：笔头没烂，周刊倒是几乎烂尾",
          "link": "/blog/15/notes-weekly-3"
        },
        {
          "text": "烂笔头周刊（第2期）：职业发展的最好方法是换公司？！",
          "link": "/blog/15/notes-weekly-2"
        },
        {
          "text": "烂笔头周刊（第1期）：好记性不如烂笔头",
          "link": "/blog/15/notes-weekly-1"
        }
      ]
    },
    {
      "text": "经验分享",
      "collapsed": false,
      "items": [
        {
          "text": "解决 Web Crypto API 加密报错及 HTTPS 证书信任问题",
          "link": "/blog/15/web-crypto-api-https-cert-issues"
        },
        {
          "text": "🚀 告别自动登出：浏览器控制台心跳保持会话指南",
          "link": "/blog/15/keep-page-Session"
        },
        {
          "text": "Redis “Cannot assign requested address” 故障排查实录",
          "link": "/blog/15/redis-Cannot-assign-requested-address"
        },
        {
          "text": "慢跑助力健康减肥：我的10斤减脂之路",
          "link": "/blog/15/Jogging-and-weight-loss"
        },
        {
          "text": "Windows 系统将 .exe 程序设置为系统服务的方案",
          "link": "/blog/15/windows-system-service"
        },
        {
          "text": "Mac同时使用无线wifi和有线上网，解决内网外网一起访问的问题",
          "link": "/blog/15/mac-network-set"
        }
      ]
    },
    {
      "text": "杂谈",
      "collapsed": false,
      "items": []
    },
    {
      "text": "工具分享",
      "collapsed": false,
      "items": [
        {
          "text": "Nginx Proxy Manager：Docker环境下反向代理的绝佳选择",
          "link": "/blog/15/Nginx-Proxy-Manager"
        },
        {
          "text": "VitePress 网站配置 Algolia 搜索",
          "link": "/blog/15/vitepress-search-by-algolia"
        },
        {
          "text": "记录一些使用 lodash.js 处理 Dashboard 数据的案例",
          "link": "/blog/15/deal-with-data-by-lodash"
        },
        {
          "text": "使用 PicGo 配置 GitHub 图床",
          "link": "/blog/15/picgo-for-github"
        },
        {
          "text": "一场由“备案注销”带来的网站危机",
          "link": "/blog/15/website-crisis-caused-by-registration-cancellation"
        },
        {
          "text": "Mac 使用图床神器 PicGo 的踩坑指南",
          "link": "/blog/15/PicGo-for-mac"
        }
      ]
    },
    {
      "text": "年终总结",
      "collapsed": false,
      "items": [
        {
          "text": "2024 年终总结",
          "link": "/blog/15/2024-year-end-review"
        },
        {
          "text": "2023 年终总结",
          "link": "/blog/15/2023-year-end-review"
        }
      ]
    }
  ],
  "/blog/16/": [
    {
      "text": "内网穿透",
      "collapsed": false,
      "items": [
        {
          "text": "使用 frp 进行内网穿透的基本操作",
          "link": "/blog/16/frp"
        }
      ]
    },
    {
      "text": "异地组网",
      "collapsed": false,
      "items": [
        {
          "text": "快速组网工具Zerotier的使用笔记",
          "link": "/blog/16/Zerotier"
        },
        {
          "text": "快速组网工具TailScale的使用，可以平替Zerotier",
          "link": "/blog/16/TailScale"
        }
      ]
    },
    {
      "text": "Cloudflare",
      "collapsed": false,
      "items": [
        {
          "text": "使用 Cloudflare 搭建自己的 Docker Hub 镜像代理",
          "link": "/blog/16/docker-hub-on-cloudflare"
        }
      ]
    },
    {
      "text": "PVE",
      "collapsed": false,
      "items": [
        {
          "text": "PVE 系统最佳实践",
          "link": "/blog/16/pve-used"
        },
        {
          "text": "Proxmox VE 8 换源【转】",
          "link": "/blog/16/pve8-change-sourceslist"
        },
        {
          "text": "PVE系统在概要中显示CPU温度的方法",
          "link": "/blog/16/pve-cpu-temperature"
        }
      ]
    },
    {
      "text": "DDNS",
      "collapsed": false,
      "items": [
        {
          "text": "ddns-go 的使用，实现公网 IPv6 下动态域名解析",
          "link": "/blog/16/ddns-go"
        }
      ]
    },
    {
      "text": "端口映射",
      "collapsed": false,
      "items": [
        {
          "text": "Linux 端口转发的几种方法",
          "link": "/blog/16/linux-port-to-port"
        }
      ]
    }
  ],
  "/blog/17/": [
    {
      "text": "安装部署",
      "collapsed": false,
      "items": [
        {
          "text": "Redis哨兵模式部署",
          "link": "/blog/17/redis-install-sentinel"
        },
        {
          "text": "Redis单机部署",
          "link": "/blog/17/redis-install"
        }
      ]
    }
  ],
  "/blog/19/": [
    {
      "text": "Kafka",
      "collapsed": false,
      "items": [
        {
          "text": "初学 Kafka：Python 接入 Kafka 的基本操作与实战",
          "link": "/blog/19/beginner-kafka-python-connection"
        }
      ]
    },
    {
      "text": "Tomcat",
      "collapsed": false,
      "items": [
        {
          "text": "Tomcat 9 安装部署",
          "link": "/blog/19/install-tomcat9"
        }
      ]
    },
    {
      "text": "WebLogic",
      "collapsed": false,
      "items": [
        {
          "text": "WebLogic 安装部署",
          "link": "/blog/19/weblogic-install"
        },
        {
          "text": "Weblogic 命令行操作，进行应用的停止、启动和更新",
          "link": "/blog/19/weblogic-command"
        }
      ]
    }
  ],
  "/blog/20/": [
    {
      "text": "流程规范",
      "collapsed": false,
      "items": [
        {
          "text": "ITSM事件管理流程规范",
          "link": "/blog/20/itsm-incident-management-process"
        },
        {
          "text": "ITSM问题管理流程规范",
          "link": "/blog/20/itsm-problem-management-process"
        },
        {
          "text": "ITSM变更管理流程规范",
          "link": "/blog/20/itsm-change-management-process"
        },
        {
          "text": "ITSM服务请求流程规范",
          "link": "/blog/20/itsm-service-request-process-guide"
        }
      ]
    }
  ],
  "/blog/21/": [
    {
      "text": "硬件基础",
      "collapsed": false,
      "items": [
        {
          "text": "装机硬件解析系列（一）：CPU 选购指南",
          "link": "/blog/21/diy-cpu"
        },
        {
          "text": "装机硬件解析系列（二）：显卡选购指南",
          "link": "/blog/21/diy-xianka"
        }
      ]
    }
  ],
  "/blog/22/": [
    {
      "text": "影音娱乐",
      "collapsed": false,
      "items": [
        {
          "text": "NAS 媒体文件命名规范",
          "link": "/blog/22/nas-media-name-rule"
        },
        {
          "text": "飞牛 NAS 安装 MoonTV",
          "link": "/blog/22/fnos-install-moonTV"
        }
      ]
    }
  ],
  "/blog/free/": [
    {
      "text": "无分类文章",
      "collapsed": false,
      "items": []
    }
  ]
},
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Hopetree/hopetree.github.io' }
    ]
  }
})

