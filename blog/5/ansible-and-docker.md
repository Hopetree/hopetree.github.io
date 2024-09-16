# 使用 Ansible 工具批量操作虚拟机集群，自动化安装 Docker

ansible 是一个 Python 写的自动化工具，这个工具可以实现集群自动化管理，然后进行一些常用的运维操作。现在的公司很多都是使用的集群部署服务，少则几台虚拟机，多则几百上千台虚拟机，有的时候需要对一个集群或者多个集群集中进行运维操作，那么这个时候，ansible 就可以实现批量操作了。

我在公司主要负责的任务就是关于服务的自动化部署和运维，公司本身就属于云服务，而且非常多，所以部署的方式也有很多种版本，我接触到的自动化平台主要包括一下几种：

1. 以 ansible 脚本为主导而搭建的自动化部署升级平台
2. 以类似 Jenkins 流水线而搭建的自动化构建和部署平台
3. 以 SDK 包为基础，以 Python 脚本执行主导的运维平台
4. docker 容器+编排

这篇文章分享一下使用 ansible 自动化安装 docker 和 docker-compose 的经验。

## 安装ansible

ansible 的管理机必须安装 python2，但是有个非常重要的点，那就是 Windows 不可以当做管理机，主机系统可以是 Red Hat, Debian, CentOS, OS X, BSD 的各种版本。

### 使用pip安装

由于 ansible 是一个 python 写的包，所以可以直接当做一个普通的第三方库来安装，直接运行命令安装即可:

```bash
sudo pip install ansible
```

### 使用yum或者apt-get安装

ansible 也可以直接使用系统的包管理工具来安装，比如 CentOS 的 yum 命令：

```bash
sudo yum install ansible
```

Ubuntu 系统的 apt-get 命令：

```bash
sudo apt-get install software-properties-common
sudo apt-add-repository ppa:ansible/ansible
sudo apt-get update
sudo apt-get install ansible
```

## ansible基本用法

### 使用 ansible-playbook

ansible-playbook 也称之为剧本，是 ansible 把一系列自动化操作按照一定的执行顺序和执行逻辑进行组合起来的模块，使用这个模块可以更加方便地管理 ansible 任务。

ansible-playbook 命令可以作为运行一个 ansible 任务的开始，具体如何使用，可以查看帮助，下面这条是一般启动命令：

```bash
ansible-playbook docker.yml -i hosts -u alex -k -K
```

这个命令可以指定一个操作的用户，后续需要输入用户的密码和sudo命令。

由于 ansible 有很多非常有用的模块和命令可以使用，但是没有人能够全部记住每个模块命令，但是 ansible 有一个非常有用的命令使用查询文档，直接使用命令就可以查看某个模块的用法，还有例子：

```bash
# 列出所有模块
ansible-doc -l

# 列出yum模块的使用方式
ansible-doc yum
```

### ansible-playbook 目录结构

下面是一个 ansible-playbook 项目的基本目录结构，具体的目录和文件作用已经注释出来：

```markdown
├── group_vars           <- 所有主机的公共变量存放位置
│   └── all
├── hosts                <- 需要管理的主机的列表信息
├── roles              <- roles 存放模块, 当前有 etcd, initial, loop 三个模块
│   ├── etcd
│   │   ├── files                    <- 需要直接复制到 client 的文件存放位置
│   │   │   └── etcd-proxy.service            <--即每个主机配置一样
│   │   ├── handlers                     <- 用于服务管理用的控制文件
│   │   │   └── main.yml
│   │   ├── tasks                        <- ansible 任务文件
│   │   │   ├── config.yml
│   │   │   ├── main.yml
│   │   │   ├── package.yml
│   │   │   └── service.yml
│   │   └── templates                <- 需要复制到 client 中的模板文件, 会配合变量进行配置变换
│   │       └── etcd-proxy.conf       <-- 即每个主机配置可能不一样
│   ├── initial
│   │   ├── files
│   │   │   ├── hosts
│   │   │   ├── resolv.conf
│   │   │   └── updatedb.conf
│   │   ├── handlers
│   │   ├── tasks
│   │   │   ├── main.yml
│   │   │   ├── mlocate.yml
│   │   │   ├── package.yml
│   │   │   ├── sysctl.yml
│   │   │   └── yumrepo.yml
│   │   └── templates
│   │       ├── centos7.repo
│   │       └── docker.repo
│   └── loop
│       ├── files
│       ├── handlers
│       ├── tasks
│       │   ├── main.yml
│       │   └── t1.yml
│       └── templates
└── site.yml                           <- 主控制入口文件
```

## ansible 安装 docker

我写了一个使用 ansible 自动化安装 docker 的剧本（项目地址：<https://github.com/Hopetree/ansible-demos/tree/master/install_docker>），适合于在 CentOS 系统上面执行 docker 的安装。这个剧本做的事情包括判断 docker 是否可以用，然后包括安装 docker，添加用户到 docker 组，安装pip 和 docker-compose 等。剧本目录如下：

```markdown
+----docker.yml
+----group_vars
|    +----all.yml
+----hosts
+----roles
|    +----docker
|    |    +----tasks
|    |    |    +----install.yml
|    |    |    +----main.yml
|    |    +----templates
|    |    |    +----daemon.json.j2
|    +----docker-compose
|    |    +----tasks
|    |    |    +----install_pip.yml
|    |    |    +----main.yml
```

### 尽量使用内置模块

所谓尽量使用内置模块的意思是当可以使用 shell 模块执行命令也可以使用内置的模块执行命令的时候应该尽量使用内置模块，比如下面这种，前面一种是使用命令行来安装包，后面一种是直接使用 yum 模块：

```yaml
# 使用shell 命令行安装
- name: install yum-utils
  shell: yum install yum-utils

# 使用yum 模块安装
- name: install yum-utils
  yum:
    name: yum-utils
    state: present
```

还有下面这种直接使用pip模块的：

```yaml
- name: install docker-compose
  pip:
    name: docker-compose
    extra_args: "-i {{ pip.index_url }} --trusted-host {{ pip.trusted_host }}"
```

### register+when的使用

register 可以用来把一个步骤的执行结果赋值到一个变量中，而 when 就可以用来判断一个变量的结果，所以通常可以把这两个模块结合起来使用。比如下面这段，第一个步骤是使用 `docker -v` 命令查询 docker 版本，然后第二个步骤判断当 docker 不可用的时候就执行 docker 安装。

```yaml
- name: check docker
  shell: docker -v
  register: result
  ignore_errors: True

- name: include tasks yaml if not docker
  include_tasks: install.yml
  when: result is failed
```

### 执行结果

![执行结果](https://tendcode.com/cdn/article/190913/tendcode_2019-09-13_22-36-51.png)

![执行结果](https://tendcode.com/cdn/article/190913/tendcode_2019-09-13_22-37-16.png)