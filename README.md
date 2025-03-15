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
2. 按照专题-主题-文章的结构层级，形成文章TOC更新到 README.md 中
3. 根据模板 index.tpl 自动生成主页 index.md 文件，动态生成专题列表
4. 根据模板 .vitepress/config.tpl 自动生成 .vitepress/config.ts 文件，动态生成左侧导航

## 文章导航

- **Django博客开发**
	- 安装指导
		- [izone 博客容器化部署、升级及迁移步骤最新版（随项目更新）](/blog/1/izone-install-docs.md)
	- 安装部署
		- [在 Linux 服务器上使用 Nginx + Gunicorn 部署 Django 项目的正确姿势](/blog/1/set-up-django-with-nginx-and-gunicorn.md)
		- [使用 Supervisor 部署 Django 应用程序](/blog/1/Supervisor_gunicorn_django.md)
		- [博客将 Django 1.11+ 升级到 Django 2.2+ 遇到的问题及规避方法](/blog/1/django2.md)
		- [关于本博客项目的一些版本及对应分支的调整并解答一些问题](/blog/1/blog-update.md)
		- [一次完整的 Django 项目的迁移，有关 MySQL 数据库的导出与导入](/blog/1/django-mysql.md)
	- 配置管理
	- 后台管理
		- [使用 Django 的 admin 定制后台，丰富自己网站的后台管理系统](/blog/1/django-admin.md)
		- [Django管理后台技巧分享之实例关系的搜索，autocomplete_fields字段使用](/blog/1/django-admin-autocomplete_fields.md)
	- 功能开发
		- [服务器监控应用（1）：服务端开发](/blog/1/server-status-1.md)
		- [服务器监控应用（2）：使用 Golang 开发客户端](/blog/1/server-status-2.md)
		- [服务器监控应用（3）：监控告警通知开发](/blog/1/server-status-3.md)
		- [markdown 支持 Mermaid 流程图的方案](/blog/1/markdown-use-Mermaid.md)
		- [Django博客评论区显示用户操作系统与浏览器信息](/blog/1/show-user-agent.md)
		- [Django分页功能改造，一比一还原百度搜索的分页效果](/blog/1/django-paginator.md)
		- [添加文章编辑页面，支持 markdown 编辑器实时预览编辑](/blog/1/blog-edit-page.md)
		- [在Django中使MySQL支持存储Emoji表情🚀](/blog/1/mysql-character-set-server.md)
		- [一个提供公告和打赏功能的 django 应用插件 django-tctip](/blog/1/django-tctip.md)
		- [博客添加 markdown 在线编辑器工具](/blog/1/markdown-editor.md)
		- [博客添加暗色主题切换功能，从主题切换聊聊前后端cookies的使用](/blog/1/theme-change.md)
		- [Django 中使用 ajax 请求的正确姿势](/blog/1/django-ajax.md)
		- [[博客搭建]  通过用户邮箱认证来介绍 django-allauth 的使用思路](/blog/1/user-verified.md)
	- 缓存
		- [Django 使用 django-redis 作为缓存的正确用法，别忽略缓存的使用原则](/blog/1/django-redis-for-cache.md)
	- 定时任务
		- [Django使用Celery实现异步和定时任务功能](/blog/1/django-celery.md)
		- [把 Celery 定时任务变成实时触发的任务](/blog/1/run-celery-task-now.md)
		- [使用 Python 的异步模块 asyncio 改造 I/O 密集型定时任务](/blog/1/asyncio-task.md)
		- [Django博客网站可以用定时任务做些什么事？](/blog/1/django-celery-tasks.md)
	- 数据清理
		- [给Django网站来一个大扫除——清理过期Session](/blog/1/django-web-clear.md)
	- 可视化
		- [Django网站单页面流量统计通用方式分享](/blog/1/django-views.md)
		- [用 ECharts 做网站数据统计报表，告别第三方流量统计平台](/blog/1/ECharts-for-web.md)
	- 灾备方案
		- [博客灾备方案（2）：博客文章同步到VitePress静态站](/blog/1/blog-sync-to-vitepress.md)
		- [博客灾备方案（1）：七牛云图床增量同步到GitHub](/blog/1/qiniu-sync-to-github.md)
	- 拓展
		- [Python-Markdown 自定义拓展](/blog/1/python-markdown-extensions.md)
- **Docker**
	- 安装部署
		- [容器化部署博客（1）—— 安装 docker 和 docker-compose](/blog/5/install-docker.md)
		- [使用 Ansible 工具批量操作虚拟机集群，自动化安装 Docker](/blog/5/ansible-and-docker.md)
	- 镜像操作
		- [分享一个给 Django 镜像瘦身 50% 的经验](/blog/5/docker-image-for-django.md)
		- [Dockerfile 中的 multi-stage 特性，Vue 项目多阶段构建实战](/blog/5/dockerfile-multi-stage.md)
	- 容器操作
		- [Docker volume 挂载时文件或文件夹不存在【转】](/blog/5/docker-volume.md)
	- docker-compose
		- [容器化部署博客（2）—— docker-compose 部署 izone 博客](/blog/5/izone-docker.md)
		- [容器化部署博客（3）—— 更换服务器，5分钟完成项目迁移](/blog/5/docker-rebuild.md)
- **Python**
	- 实战经验
		- [处理 Python 读取 CSV 时多出 \ufeff 的问题](/blog/14/python-read-csv.md)
		- [ITSM 流程中自动化对接 JumpServer 的实战经验](/blog/14/JumpServer-for-ITSM.md)
		- [如何在 Python 2.7 中获取未调用函数的局部变量](/blog/14/get-function-args-python2.md)
		- [企业微信 SSO 单点登录——使用 Python 调用企业微信接口](/blog/14/weixin-sso-by-python.md)
		- [容器化部署OpenLDAP并使用Python查询LDAP数据](/blog/14/install-openldap-and-query-by-python.md)
		- [使用Python SDK操作VMware进行虚拟机创建和配置变更](/blog/14/python-sdk-for-vmware.md)
		- [Python 调用接口进行文件上传的踩坑记录](/blog/14/python-api-upload-files.md)
		- [解决 pyyaml 修改 yaml 文件之后无法保留原文件格式和顺序的问题](/blog/14/yaml_order.md)
		- [Python 模板渲染库 yaml 和 jinja2 的实战经验分享](/blog/14/yaml_and_jinja2.md)
		- [Python 进行 SSH 操作，实现本地与服务器的链接，进行文件的上传和下载](/blog/14/python-ssh.md)
		- [Python 虚拟环境 Virtualenv 分别在 Windows 和 Linux 上的安装和使用](/blog/14/virtualenv-for-python.md)
	- 包管理
		- [使用pip下载python依赖包whl文件并进行离线安装](/blog/14/pip-offline-download.md)
		- [CentOS下使用pip安装python依赖报错的解决思路](/blog/14/pip-upgrade.md)
		- [使用 setup.py 将 Python 库打包分发到 PyPI 踩坑指南](/blog/14/setup-to-pypy.md)
	- 爬虫
		- [Python 有道翻译爬虫，破解 sign 参数加密反爬机制，解决{"errorCode":50}错误](/blog/14/youdao-spider.md)
		- [[Python 爬虫]煎蛋网 OOXX 妹子图爬虫（1）——解密图片地址](/blog/14/jiandan-meizi-spider.md)
		- [[Python 爬虫]煎蛋网 OOXX 妹子图爬虫（2）——多线程+多进程下载图片](/blog/14/jiandan-meizi-spider-2.md)
		- [使用 selenium 爬取新浪微盘，免费下载周杰伦的歌曲](/blog/14/python-spider-sina-weipan.md)
		- [分析新浪微盘接口，调用接口爬取周杰伦歌曲](/blog/14/python-spider-sina-weipan-2.md)
		- [双11当晚写的天猫爬虫，爬虫神器 scrapy 大法好！！！](/blog/14/tmall-scrapy-spider.md)
		- [安装 Scrapy 失败的正确解决方法及运行中报错的解决思路](/blog/14/install-scrapy.md)
		- [.app 域名发布了，我们可以使用 Python 做点什么？](/blog/14/spider-for-domain.md)
		- [使用 selenium 写的多进程全网页截图工具，发现了 PhantomJS 截图的 bug](/blog/14/PhantomJS-screenshot.md)
	- 命令行
		- [使用 python 执行 shell 命令的几种常用方式](/blog/14/python-shell-cmd.md)
		- [Python 命令行参数的3种传入方式](/blog/14/python-shell.md)
	- 技巧分享
		- [Python 脚本中日志级别控制示例](/blog/14/python-logging-level.md)
		- [分享一种使用 Python 调用接口“失败”后重试的通用方案](/blog/14/python-loop-retry.md)
		- [Python 上下文管理及 with 语句的实用技巧](/blog/14/with.md)
		- [python2 和 python3 常见差异及兼容方式梳理](/blog/14/py2_and_py3.md)
		- [分享一个简单的 Python 脚本库：将 requests 代码转换成 curl 命令](/blog/14/python-to-curl.md)
	- Web 开发
		- [Python2.7 环境中 Tornado 实现异步接口请求的两种方式](/blog/14/tornado-async-for-python2.md)
		- [Flask、Tornado、FastAPI、Sanic 以及 Gin 框架性能对比](/blog/14/Flask-Tornado-FastAPI-Sanic-Gin.md)
	- 自动化测试
		- [【Appium 自动化测试】搭建 Appium 环境踩坑记录](/blog/14/appium-env.md)
- **Linux**
	- 安装升级
		- [VMware虚拟机桥接网络设置固定静态IP](/blog/4/vmware-bridged-network.md)
		- [VirtualBox 安装 CentOS 7 系统并通过主机 ssh 连接虚拟机](/blog/4/virtualbox-install-centos7.md)
	- 学习笔记
		- [记录一些在持续部署中可复用的shell命令和函数](/blog/4/shell-functions-and-commands.md)
		- [Linux系统中负载过高问题的排查思路与解决方案](/blog/4/Linux-Load-Average.md)
		- [检查服务器端口连通性的几种方法](/blog/4/port-check.md)
		- [Linux 三剑客（grep awk sed）常用操作笔记](/blog/4/grep-awk-sed.md)
		- [Linux 学习笔记 ——第（1）期](/blog/4/study-linux-01.md)
	- 案例分享
		- [使用curl命令获取请求接口每个阶段的耗时](/blog/4/curl-time.md)
		- [rsync 实时同步方案](/blog/4/rsync.md)
		- [Linux 设置 SSH 密钥登陆及更换登录端口](/blog/4/ssh-id_rsa.md)
		- [Linux 上使用 crontab 设置定时任务及运行 Python 代码不执行的解决方案](/blog/4/hello-crontab.md)
	- 代理
	- 资源分享
		- [分享一些常用的更换各种“源”的经验](/blog/4/sources-conf.md)
- **Go 学习笔记**
	- 开发环境
		- [JetBrains 全家桶免费使用的方法](/blog/18/JetBrains-IDE.md)
		- [Go 学习笔记（1）：GoLand 安装并通过插件重置试用到期时间](/blog/18/GoLand-install.md)
	- 基础语法
		- [Go 学习笔记（2）：变量和常量](/blog/18/golang-study-2.md)
		- [Go 学习笔记（3）：基本类型](/blog/18/golang-study-3.md)
		- [Go 学习笔记（4）：数组和切片](/blog/18/golang-study-4.md)
		- [Go 学习笔记（5）：指针、Map 和 结构体](/blog/18/golang-study-5.md)
	- 控制流
		- [Go 学习笔记（6）：循环和判断](/blog/18/golang-study-6.md)
	- 函数
	- 面向对象
	- 并发编程
		- [Go 学习笔记（8）：生产者消费者模型](/blog/18/golang-study-8.md)
	- 标准库
	- 开源库
		- [Go 学习笔记（12）：使用Viper读取配置文件](/blog/18/golang-study-12.md)
		- [Go 学习笔记（10）：cli 命令行的使用](/blog/18/golang-study-10.md)
	- 编译及发布
		- [Go 学习笔记（11）：利用 GitHub Actions 进行多平台打包](/blog/18/go-releaser.md)
	- 学习成果
		- [Go 学习笔记（7）：学习成果之写一个 API 调用的 sdk](/blog/18/golang-study-7.md)
		- [Go 学习笔记（9）：多并发爬虫下载图片](/blog/18/golang-study-9.md)
		- [Go 学习笔记（13）：开发一个简单的端口转发程序](/blog/18/golang-study-13.md)
- **Jenkins**
	- 安装部署
		- [使用 Docker 运行 Jenkins 容器](/blog/3/Jenkins-install.md)
	- 使用技巧
	- 实战案例
		- [【Jenkins 插件】Jenkins Pipeline 流水线插件的使用，Vue 项目自动化构建和部署实战](/blog/3/Jenkins-Pipeline.md)
		- [【Jenkins 插件】使用 Publish Over SSH 远程传输文件和自动部署](/blog/3/Publish-Over-SSH.md)
		- [Jenkins 构建 vue 项目镜像并推送到阿里云镜像仓库](/blog/3/docker-and-vue.md)
		- [【Jenkins 插件】使用 SSH Slaves 创建从节点执行任务](/blog/3/jenkins-slave.md)
		- [【Jenkins 插件】使用 github 插件从 GitHub 上拉取项目代码](/blog/3/jenkins_link_github.md)
- **AI**
	- ChatGPT
		- [ChatGPT提问的艺术](/blog/2/chatgpt-prompts.md)
		- [浏览器插件开发：一个简单的站外搜索插件](/blog/2/browser-plugin-site-search.md)
		- [依靠 ChatGPT 开发一个完整功能的浏览器插件](/blog/2/develop-browser-plugin-with-chatgpt.md)
		- [[ChatGPT解决方案]获取 nginx 日志中请求 IP 统计数，设置 IP 流量限制](/blog/2/ChatGPT-nginx-ip-limit.md)
		- [[ChatGPT解决方案]🤖️ChatGPT协助我完成博客代码块添加复制代码和显示代码语言功能](/blog/2/ChatGPT-blog-req.md)
		- [[ChatGPT解决方案]Nginx配置实现请求失败图片的统一转发](/blog/2/ChatGPT-nginx-error.md)
		- [[ChatGPT解决方案]生成 nginx 自签名证书](/blog/2/ChatGPT-nginx-sert.md)
	- Trae
		- [再一次被 AI 的编程能力折服！！！](/blog/2/amazing-ai.md)
- **MongoDB**
	- 安装部署
		- [MongoDB单实例部署](/blog/6/mongodb-install-standalone.md)
		- [MongoDB集群部署——（Replica Set）副本集模式](/blog/6/mongodb-install-Replica-Set.md)
	- 数据迁移
		- [记一次因MongoDB数据迁移的失误导致的灾备环境事故](/blog/6/mongodb-restore.md)
	- 配置变更
		- [MongoDB 集群主机 IP 变更后恢复集群状态的方案](/blog/6/mongodb-change-host-ip.md)
- **kubernetes**
	- 安装部署
		- [CentOS 系统搭建 k8s 环境v1.16.0](/blog/7/k8s_install-k8s.md)
		- [使用 ansible-playbook 搭建 k8s 环境v1.16.0](/blog/7/k8s_install-k8s-by-ansible.md)
- **Prometheus**
	- 安装部署
		- [安装部署Prometheus和Grafana，并配置主机监控面板](/blog/8/install-prometheus-and-grafana.md)
	- 采集插件
		- [自定义Prometheus指标采集插件，采集并显示PVE系统的温度和功率](/blog/8/prometheus-exporter-plugin-for-PVE.md)
	- Grafana
		- [在 Grafana 中通过 Infinity 数据源可视化接口数据](/blog/8/Grafana-Infinity.md)
- **Nginx**
	- Nginx配置学习
		- [Nginx配置中server模块的加载顺序和规则](/blog/10/nginx-server.md)
		- [终于理解了Nginx配置中location规则的优先级问题](/blog/10/nginx-location.md)
	- Nginx配置实战
		- [Nginx 应对网站扫描工具的方案](/blog/10/web-scan.md)
		- [Nginx配置gzip压缩的重要性](/blog/10/nginx-gzip.md)
		- [Nginx配置移动端访问自动重定向到指定请求](/blog/10/nginx-mobile-conf.md)
		- [Nginx使用resolver配置解决域名解析成ipv6的问题](/blog/10/nginx-resolver.md)
- **Git**
	- Git操作
		- [Git 常用及特殊命令笔记](/blog/11/git-note.md)
	- Github相关
		- [分享一些 GitHub Actions 的实用技巧](/blog/11/github-actions.md)
- **OneFile**
	- HTTPS证书
		- [HTTPS证书过期时间获取](/blog/12/https-cert-info.md)
- **信创**
	- 达梦数据库
		- [Linux安装DM（达梦）数据库](/blog/13/dm-install.md)
- **个人笔记**
	- 烂笔头周刊
		- [烂笔头周刊（第4期）：保持学习](/blog/15/notes-weekly-4.md)
		- [烂笔头周刊（第3期）：笔头没烂，周刊倒是几乎烂尾](/blog/15/notes-weekly-3.md)
		- [烂笔头周刊（第2期）：职业发展的最好方法是换公司？！](/blog/15/notes-weekly-2.md)
		- [烂笔头周刊（第1期）：好记性不如烂笔头](/blog/15/notes-weekly-1.md)
	- 经验分享
		- [慢跑助力健康减肥：我的10斤减脂之路](/blog/15/Jogging-and-weight-loss.md)
		- [Windows 系统将 .exe 程序设置为系统服务的方案](/blog/15/windows-system-service.md)
		- [Mac同时使用无线wifi和有线上网，解决内网外网一起访问的问题](/blog/15/mac-network-set.md)
	- 杂谈
	- 工具分享
		- [VitePress 网站配置 Algolia 搜索](/blog/15/vitepress-search-by-algolia.md)
		- [记录一些使用 lodash.js 处理 Dashboard 数据的案例](/blog/15/deal-with-data-by-lodash.md)
		- [使用 PicGo 配置 GitHub 图床](/blog/15/picgo-for-github.md)
		- [一场由“备案注销”带来的网站危机](/blog/15/website-crisis-caused-by-registration-cancellation.md)
		- [Mac 使用图床神器 PicGo 的踩坑指南](/blog/15/PicGo-for-mac.md)
	- 年终总结
		- [2024 年终总结](/blog/15/2024-year-end-review.md)
		- [2023 年终总结](/blog/15/2023-year-end-review.md)
- **上网**
	- 内网穿透
		- [使用 frp 进行内网穿透的基本操作](/blog/16/frp.md)
	- 异地组网
		- [快速组网工具Zerotier的使用笔记](/blog/16/Zerotier.md)
		- [快速组网工具TailScale的使用，可以平替Zerotier](/blog/16/TailScale.md)
	- Cloudflare
		- [使用 Cloudflare 搭建自己的 Docker Hub 镜像代理](/blog/16/docker-hub-on-cloudflare.md)
	- PVE
		- [PVE 系统最佳实践](/blog/16/pve-used.md)
		- [Proxmox VE 8 换源【转】](/blog/16/pve8-change-sourceslist.md)
		- [PVE系统在概要中显示CPU温度的方法](/blog/16/pve-cpu-temperature.md)
	- DDNS
		- [ddns-go 的使用，实现公网 IPv6 下动态域名解析](/blog/16/ddns-go.md)
	- 端口映射
		- [Linux 端口转发的几种方法](/blog/16/linux-port-to-port.md)
- **Redis**
	- 安装部署
		- [Redis哨兵模式部署](/blog/17/redis-install-sentinel.md)
		- [Redis单机部署](/blog/17/redis-install.md)
- **中间件**
	- Kafka
		- [初学 Kafka：Python 接入 Kafka 的基本操作与实战](/blog/19/beginner-kafka-python-connection.md)
	- Tomcat
		- [Tomcat 9 安装部署](/blog/19/install-tomcat9.md)
	- WebLogic
		- [WebLogic 安装部署](/blog/19/weblogic-install.md)
		- [Weblogic 命令行操作，进行应用的停止、启动和更新](/blog/19/weblogic-command.md)
- **ITSM**
	- 流程规范
		- [ITSM事件管理流程规范](/blog/20/itsm-incident-management-process.md)
		- [ITSM问题管理流程规范](/blog/20/itsm-problem-management-process.md)
		- [ITSM变更管理流程规范](/blog/20/itsm-change-management-process.md)
		- [ITSM服务请求流程规范](/blog/20/itsm-service-request-process-guide.md)
- **其他文章**
	- 无分类文章
