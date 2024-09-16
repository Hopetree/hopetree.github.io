# 使用 ansible-playbook 搭建 k8s 环境v1.16.0

上一篇博客记录了一下在 CentOS 下搭建 k8s 环境的方式，主要是使用的 shell 脚本执行安装部署命令。但是执行脚本终究只能人工执行，而且无法大批量安装，而本篇博客就使用批量执行工具 ansible 来自动化安装 k8s 环境。

## 步骤梳理

首先在介绍 ansible 编排之前，先梳理一下搭建 k8s 环境的步骤（之前的 shell 脚本部署方式有详细步骤注释）。

1. 所有节点安装 docker-ce
2. 所有节点配置 k8s 环境
3. master 节点安装 k8s，并启动 flannel 服务
4. node 节点安装 k8s，并执行 join 到主节点的命令

我将整个安装步骤分为这4个步骤，于是我的 ansible-playbook 里面的 roles 也是分成4个 role 来执行任务。

## 代码结构

代码结构基本是按照 ansible-playbook 的结构来的，上面安装的四个步骤对应的就是 roles 下面的四个目录：docker、k8s_env、k8s_master、k8s_node，具体的文件作用可以看注释。

项目代码已经提交到 GitHub 仓库，地址为：<https://github.com/Hopetree/k8s>

```text
+----deploy
|    +----ansible.cfg
|    +----group_vars
|    |    +----all.yml                         # 部署所需参数
|    +----hosts                                # 节点信息
|    +----k8s_install.yml                      # 执行文件
|    +----roles
|    |    +----docker                          # 安装docker
|    |    |    +----tasks
|    |    |    |    +----main.yml
|    |    |    +----templates
|    |    |    |    +----daemon.json.j2
|    |    +----k8s_env                         # 配置k8s环境
|    |    |    +----tasks
|    |    |    |    +----main.yml
|    |    |    +----templates
|    |    |    |    +----k8s.conf.j2
|    |    +----k8s_master                      # 主节点安装k8s
|    |    |    +----files
|    |    |    |    +----kube-flannel.yml
|    |    |    +----tasks
|    |    |    |    +----main.yml
|    |    |    +----templates
|    |    |    |    +----kubernetes.repo.j2
|    |    +----k8s_node                        # node节点安装k8s
|    |    |    +----tasks
|    |    |    |    +----main.yml
|    |    |    +----templates
|    |    |    |    +----kubernetes.repo.j2
```

然后看一下执行文件 k8s_install.yml 中是如何对每个步骤执行机进行划分的：

```yaml
---
- hosts: k8s
  roles:
    - role: docker
      become: yes
    - role: k8s_env
      become: yes

- hosts: master
  roles:
    - role: k8s_master
      become: yes

- hosts: node
  roles:
    - role: k8s_node
      become: yes
```

其实划分执行机很简单，我在 hosts 里面配置了执行机分类，k8s 就是所有节点，master 就是主节点，node 就是 node 节点，所有使用 hosts 来控制每个步骤的执行机。

## 安装流程

### 安装 docker(所有节点)

安装 docker 的步骤跟之前 shell 脚本的流程一样，只不过把原理的命令行形式改成 ansible 的模块来编排即可，代码如下：

```yaml
---
- name: uninstall docker
  yum: name={{ docker.remove_list }} state=absent

- name: rm docker dir
  file: path={{ item }} state=absent
  with_items:
    - /var/lib/docker
    - /var/run/docker

- name: install yum-utils
  yum: name=yum-utils state=present

- name: add docker repo
  shell: yum-config-manager --add-repo {{ docker.repo }}

- name: install docker-ce
  yum: name={{ docker.version }} state=present update_cache=True

- name: set docker registry mirrors
  template: src=daemon.json.j2 dest=/etc/docker/daemon.json

- name: start docker service
  systemd: name=docker enabled=yes daemon_reload=yes state=started

```

可以把这个 yaml 文件里面的编排步骤跟之前的 shell 脚本作对比，可以发现基本是每个 shell 命令的操作对应了一个 ansible 步骤。

### 配置 k8s 环境信息（所有节点）

配置 k8s 环境信息的任务是 k8s_env，具体编排如下：

```yaml
---
- name: stop firewalld
  systemd: name=firewalld state=stopped enabled=no

- name: disabled selinux
  shell: "setenforce 0 && sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/sysconfig/selinux;sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config"

- name: swap off
  shell: "swapoff -a && sed -i 's/.*swap.*/#&/' /etc/fstab"

- name: set k8s conf
  template: src=k8s.conf.j2 dest=/etc/sysctl.d/k8s.conf

- name: sysctl --system
  shell: sysctl --system
```

其实这里的 sed 命令可以使用 replace 模块来编排，我这里保留了 shell 命令行。

### 主节点安装 k8s

执行编排如下：

```yaml
---
- name: copy flannel file
  copy: src=kube-flannel.yml dest={{ k8s.flannel.path }}

- name: change image url for flannel file
  replace: path={{ k8s.flannel.path }} regexp="quay\.io" replace={{ k8s.flannel.image_url }}

- name: set k8s repo
  template: src=kubernetes.repo.j2 dest=/etc/yum.repos.d/kubernetes.repo

- name: uninstall kubectl kubeadm kubelet
  yum: name=kubectl,kubeadm,kubelet state=absent

- name: install kubectl
  yum: name={{ k8s.kubectl }} state=present

- name: install kubelet
  yum: name={{ k8s.kubelet }} state=present

- name: install kubeadm
  yum: name={{ k8s.kubeadm }} state=present

- name: set systemd for kubelet
  systemd: name=kubelet enabled=yes daemon_reload=yes state=started

- name: init kubeadm
  shell: "kubeadm init --image-repository {{ k8s.image_repository }} --kubernetes-version {{ k8s.version }} --apiserver-advertise-address {{ ansible_ssh_host }} --pod-network-cidr={{ k8s.pod_netword }}/16 --token-ttl 0"

- name: copy kube config
  shell: "mkdir -p $HOME/.kube && sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config && sudo chown $(id -u):$(id -g) $HOME/.kube/config"

- name: apply flannel
  shell: "kubectl apply -f {{ k8s.flannel.path }}"

```

在安装 kubelet 和 kubeadm 的时候，我遇到了问题，就是我之前是先安装的 kubeadm 后安装的 kubelet，然后一直导致 kubelet 的安装版本跟我设置的版本不一样，导致最终 k8s 初始化失败。

后来我查看代码执行输出才发现问题，原因是 kubeadm 的安装依赖于 kubelet，所以如果先安装 kubeadm，那么程序会自动安装一个版本（目测是最新的）的 kubelet，于是后面执行 kubelet 安装的时候因为前面自动安装了，所有会忽略掉，这就是最终导致安装的版本跟自己设置的版本不一样的原因。这也给我一个意识，就是如果要安装多个软件，如果软件之前有依赖关系，应该先安装被依赖的软件。

### node 节点安装 k8s

看过之前手动部署 k8s 的文章应该记得一个步骤：当 node 节点安装完 k8s 之后需要执行 join 主机点集群的命令，而这个命令需要去主节点查询得到，所有当时是手动查询然后执行的。所以 ansible 如何做到在当前执行机操作步骤的时候到另外的执行机执行步骤，我当时查到了一种方案就是使用 `delegate_to` 参数，在模块中添加这个参数，就可以将该步骤到这个参数指向的 IP 主机上面执行步骤。我这做的就是去主节点查询命令，然后注册成一个键值对给后面的步骤使用。

```yaml
---
- name: set k8s repo
  template: src=kubernetes.repo.j2 dest=/etc/yum.repos.d/kubernetes.repo

- name: uninstall kubectl kubeadm kubelet
  yum: name=kubeadm,kubelet state=absent

- name: install kubelet
  yum: name={{ k8s.kubelet }} state=present

- name: install kubeadm
  yum: name={{ k8s.kubeadm }} state=present

- name: set systemd for kubelet
  systemd: name=kubelet enabled=yes daemon_reload=yes state=started

- name: query kubeadm join command
  shell: kubeadm token create --print-join-command
  register: kubeadm_join_cmd
  delegate_to: "{{ k8s.master_ip }}"        # 在主节点上面执行这个任务

- name: print cmd
  debug:
    var: kubeadm_join_cmd.stdout

- name: join k8s
  shell: "{{ kubeadm_join_cmd.stdout }}"

```

整个任务运行的命令是：

```shell
ansible-playbook k8s_install.yml -i hosts -u alex -k -K -v
```

执行结果如下：

```text
PLAY RECAP ************************************************************************************************************
k8s-master     : ok=25   changed=20   unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
k8s-node01     : ok=22   changed=17   unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
k8s-node02     : ok=22   changed=17   unreachable=0    failed=0    skipped=0    rescued=0    ignored=0

```

所有步骤都没有报错之后可以查询 k8s 集群状态，最开始可能会发现只有主节点是 Ready，node 节点还是 NotReady 状态，这是正常的，因为之前的文章说过，node 节点需要拉取 flannel 镜像启动容器，比较慢，所有需要等一段时间。

过一段时间再查询状态可以看到所有节点都是准备好了：

```text
[root@k8s-master alex]# kubectl get pods -o wide -n kube-system
NAME                                 READY   STATUS    RESTARTS   AGE     IP               NODE         NOMINATED NODE   READINESS GATES
coredns-58cc8c89f4-jsgjh             1/1     Running   0          4h56m   10.244.2.3       k8s-node02   <none>           <none>
coredns-58cc8c89f4-z4zhn             1/1     Running   0          4h56m   10.244.2.2       k8s-node02   <none>           <none>
etcd-k8s-master                      1/1     Running   0          4h55m   192.168.31.76    k8s-master   <none>           <none>
kube-apiserver-k8s-master            1/1     Running   0          4h55m   192.168.31.76    k8s-master   <none>           <none>
kube-controller-manager-k8s-master   1/1     Running   0          4h56m   192.168.31.76    k8s-master   <none>           <none>
kube-flannel-ds-amd64-2sg2q          1/1     Running   0          4h56m   192.168.31.76    k8s-master   <none>           <none>
kube-flannel-ds-amd64-fwtvr          1/1     Running   0          4h55m   192.168.31.133   k8s-node01   <none>           <none>
kube-flannel-ds-amd64-sph6k          1/1     Running   0          4h55m   192.168.31.178   k8s-node02   <none>           <none>
kube-proxy-b9tp5                     1/1     Running   0          4h55m   192.168.31.178   k8s-node02   <none>           <none>
kube-proxy-tnfpq                     1/1     Running   0          4h55m   192.168.31.133   k8s-node01   <none>           <none>
kube-proxy-znf9h                     1/1     Running   0          4h56m   192.168.31.76    k8s-master   <none>           <none>
kube-scheduler-k8s-master            1/1     Running   0          4h55m   192.168.31.76    k8s-master   <none>           <none>
[root@k8s-master alex]# kubectl get nodes
NAME         STATUS   ROLES    AGE     VERSION
k8s-master   Ready    master   4h57m   v1.16.0
k8s-node01   Ready    <none>   4h55m   v1.16.0
k8s-node02   Ready    <none>   4h55m   v1.16.0
```

## 问题记录

### flannel插件找不到

如果k8s安装之后出现master节点和node节点状态都是NotReady，可以用命令 `journalctl -u kubelet -f` 查看日志，如果能看到如下日志：

```bash
Aug 18 16:35:24 k8s-master-225 kubelet[4714]: E0818 16:35:24.870757    4714 kubelet.go:2187] Container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized
Aug 18 16:35:29 k8s-master-225 kubelet[4714]: W0818 16:35:29.255219    4714 cni.go:202] Error validating CNI config &{cbr0 0.3.1 false [0xc000829ee0 0xc000829fc0] [123 10 32 32 34 110 97 109 101 34 58 32 34 99 98 114 48 34 44 10 32 32 34 99 110 105 86 101 114 115 105 111 110 34 58 32 34 48 46 51 46 49 34 44 10 32 32 34 112 108 117 103 105 110 115 34 58 32 91 10 32 32 32 32 123 10 32 32 32 32 32 32 34 116 121 112 101 34 58 32 34 102 108 97 110 110 101 108 34 44 10 32 32 32 32 32 32 34 100 101 108 101 103 97 116 101 34 58 32 123 10 32 32 32 32 32 32 32 32 34 104 97 105 114 112 105 110 77 111 100 101 34 58 32 116 114 117 101 44 10 32 32 32 32 32 32 32 32 34 105 115 68 101 102 97 117 108 116 71 97 116 101 119 97 121 34 58 32 116 114 117 101 10 32 32 32 32 32 32 125 10 32 32 32 32 125 44 10 32 32 32 32 123 10 32 32 32 32 32 32 34 116 121 112 101 34 58 32 34 112 111 114 116 109 97 112 34 44 10 32 32 32 32 32 32 34 99 97 112 97 98 105 108 105 116 105 101 115 34 58 32 123 10 32 32 32 32 32 32 32 32 34 112 111 114 116 77 97 112 112 105 110 103 115 34 58 32 116 114 117 101 10 32 32 32 32 32 32 125 10 32 32 32 32 125 10 32 32 93 10 125 10]}: [failed to find plugin "flannel" in path [/opt/cni/bin]]
Aug 18 16:35:29 k8s-master-225 kubelet[4714]: W0818 16:35:29.255307    4714 cni.go:237] Unable to update cni config: no valid networks found in /etc/cni/net.d
Aug 18 16:35:29 k8s-master-225 kubelet[4714]: E0818 16:35:29.872927    4714 kubelet.go:2187] Container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized
```

其中的关键报错信息是“failed to find plugin "flannel" in path [/opt/cni/bin]”，可以拿着这个信息去网上搜，能搜到解决方案，比如这篇 [failed to find plugin “flannel” in path [/opt/cni/bin]，k8sNotReady解决方案](https://blog.csdn.net/qq_29385297/article/details/127682552) 可以解决这个问题

总结：使用 ansible 工具不仅可以将手动操作自动化，从而减少手动操作中漏掉或者重复执行步骤的问题，更重要的是可以批量执行任务，当 k8s 集群规模比较大的时候，手动部署肯定是不可行的，此时 ansible 就能发挥它批量部署的能力。

## 参考文章

- [failed to find plugin “flannel” in path [/opt/cni/bin]，k8sNotReady解决方案](https://blog.csdn.net/qq_29385297/article/details/127682552)