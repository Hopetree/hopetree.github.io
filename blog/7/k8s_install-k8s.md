# CentOS 系统搭建 k8s 环境v1.16.0

最近准备系统地学习一下 k8s，所以第一件事就是搭建环境，本篇文章就来记录一下自己在 CentOS 系统上搭建 k8s 环境的经历。

## 环境准备

虚拟机信息：

- 本地系统：win10
- 虚拟机软件：VirtualBox
- Linux 系统：CentOS7
- 虚拟机节点（至少2U2G）：k8s-master(192.168.31.44)、k8s-node01、k8s-node02

k8s 相关信息：

- docker 版本：docker-ce 18.09.9
- k8s 版本：v1.16.0
- 准备国内镜像源

## 安装 docker-ce（所有机器）

给所有的虚拟机都安装 docker-ce，选择的版本为 18.09.9，这里我使用了我之前写的安装 docker 的文章里面使用的命令，直接写成了脚本 install_docker.sh，内容如下：

```shell
#/bin/bash
# 使用root用户安装docker

DOCKER_VERSION=docker-ce-18.09.9-3.el7
DOCKER_REGISTRY=https://registry.docker-cn.com
YUN_REPO=http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 卸载原有的 docker
yum remove docker \
docker-ce \
docker-client \
docker-client-latest \
docker-common \
docker-latest \
docker-latest-logrotate \
docker-logrotate \
docker-engine

# 清理残留目录
rm -rf /var/lib/docker
rm -rf /var/run/docker

# 添加阿里yum源，并更新yum索引
yum install -y yum-utils
yum-config-manager --add-repo ${YUN_REPO}
yum makecache fast

# 安装docker-ce,可以自定义版本
yum install -y ${DOCKER_VERSION}

# 设置为系统服务并启动docker
systemctl enable docker && systemctl start docker

# 设置镜像仓库源
cat <<EOF >/etc/docker/daemon.json
{
 "registry-mirrors": ["${DOCKER_REGISTRY}"],
 "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF

# 重启docker
systemctl daemon-reload
systemctl restart docker

``` 

## k8s 环境配置（所有机器）

安装 docker-ce 之后，需要给虚拟机执行一些命令准备好环境，这些步骤我写到脚本 k8s_env.sh 里面了，内容如下：

```shell
#/bin/bash

# 关闭防火墙
systemctl disable firewalld
systemctl stop firewalld

# 关闭selinux
# 临时禁用selinux
setenforce 0
# 永久关闭 修改/etc/sysconfig/selinux文件设置
sed -i 's/SELINUX=permissive/SELINUX=disabled/' /etc/sysconfig/selinux
sed -i "s/SELINUX=enforcing/SELINUX=disabled/g" /etc/selinux/config

# 禁用交换分区
swapoff -a
# 永久禁用，打开/etc/fstab注释掉swap那一行。
sed -i 's/.*swap.*/#&/' /etc/fstab

# 修改内核参数
cat <<EOF >/etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system

```

## 安装k8s v1.16.0 （master节点）

安装完 docker 并执行了 k8s 准备条件之后，需要在 k8s 主节点上面执行下面命令安装 k8s，版本为 v1.16.0，我将所有命令写到脚本 k8s_install_master.sh 里面了，这个脚本需要传入一个参数，也就是主节点的IP地址，内容如下：

```shell
#/bin/bash

# 脚本执行必须传入一个参数，就是k8s主节点IP地址
master_ip=$1
if [ "$master_ip" == "" ]; then
  echo "Error: please set master ip." &
  exit 210
else
  echo "master ip is $master_ip"
fi

K8S_BASEURL=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
K8S_GPGKEY="https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg"
POD_NETWORD=10.244.0.0

# 执行配置k8s阿里云源
cat <<EOF >/etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=${K8S_BASEURL}
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=${K8S_GPGKEY}
EOF

# 安装kubeadm、kubectl、kubelet
yum install -y kubectl-1.16.0-0 kubeadm-1.16.0-0 kubelet-1.16.0-0

# 启动kubelet服务
systemctl enable kubelet && systemctl start kubelet

# 安装初始化镜像，参数详解查看文档 https://kubernetes.io/zh/docs/reference/setup-tools/kubeadm/kubeadm-init/
kubeadm init --image-repository registry.aliyuncs.com/google_containers --kubernetes-version v1.16.0 --apiserver-advertise-address ${master_ip} --pod-network-cidr=${POD_NETWORD}/16 --token-ttl 0

# kubeadm init 执行完成之后需要执行的操作
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

```

主节点安装完成后，可以看到如下输出，最后一句就是给了一条命令，在 node 节点执行该命令就可以加入 k8s 集群中，以后也可以通过在主节点执行命令来查询 `kubeadm token create --print-join-command`。

```text
Your Kubernetes control-plane has initialized successfully!

To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.31.44:6443 --token i0nitb.9dx9gqqmjc25cl4v \
    --discovery-token-ca-cert-hash sha256:c7deb13d6544fe360e70fdc7b1c3140d2d5c1f98fc0e5d4c8deccadd91adf726
```

## 安装k8s v1.16.0 （node 节点）

node 节点安装 k8s 比主节点的内容稍微少一点，但是版本信息一样，我写成了脚本 k8s_install_node.sh，内容如下：

```shell
#/bin/bash

K8S_BASEURL=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
K8S_GPGKEY="https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg"

cat <<EOF >/etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=${K8S_BASEURL}
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=${K8S_GPGKEY}
EOF

# 安装kubeadm、kubectl、kubelet
yum install -y kubeadm-1.16.0-0 kubelet-1.16.0-0

# 启动kubelet服务
systemctl enable kubelet && systemctl start kubelet

# 加入集群，如果这里不知道加入集群的命令，可以登录master节点，使用kubeadm token create --print-join-command 来获取
#kubeadm join 192.168.31.213:6443 --token 7172cu.ouhrkxvv1wj5gdfr --discovery-token-ca-cert-hash sha256:b3613871b6812b09351f7501517149e48562927efc3a2f7b70f7bff29bfc697c

```

node 节点安装完 k8s 之后，需要在主节点上执行命令 `kubeadm token create --print-join-command` 查询出加入 k8s 集群的命令，在 node 上面执行该命令即可加入到集群中，如：

```shell
[root@k8s-master alex]# kubeadm token create --print-join-command
kubeadm join 192.168.31.44:6443 --token dbyk42.jt15226b6xd4rfvo     --discovery-token-ca-cert-hash sha256:c7deb13d6544fe360e70fdc7b1c3140d2d5c1f98fc0e5d4c8deccadd91adf726
```

到这里，主节点和 node 节点都已经安装好 k8s 了，这个时候在主节点执行命令 `kubectl get nodes` 即可查看到集群的节点信息：

```text
[root@k8s-master alex]# kubectl get nodes
NAME         STATUS     ROLES    AGE   VERSION
k8s-master   NotReady   master   13m   v1.16.0
k8s-node01   NotReady   <none>   97s   v1.16.0
k8s-node02   NotReady   <none>   7s    v1.16.0
```

这里可以看到，1个主节点，两个 node 节点，正是我这里搭建的 k8s 集群，但是这里三个节点的状态都是 NotReady，所以，很显然，环境还没有完全搭建好。

## 安装 flannel（master节点）

k8s 安装完之后状态是 NotReady 这个可以当做一个问题去网上搜索解决方案，我这里写的也只是我看到的解决方案之一，也就是通过安装 flannel 来解决。

其实就是需要一个 yaml 文件，官方地址是 <https%3A//raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml> ，官方地址国内访问不了，网上也可以搜索到这个文件，但是文件里的镜像地址有的被人改了地址（改成了国内源），我这里改回了原版地址，因为原版地址我本地可以访问。

```yaml
---
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: psp.flannel.unprivileged
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: docker/default
    seccomp.security.alpha.kubernetes.io/defaultProfileName: docker/default
    apparmor.security.beta.kubernetes.io/allowedProfileNames: runtime/default
    apparmor.security.beta.kubernetes.io/defaultProfileName: runtime/default
spec:
  privileged: false
  volumes:
    - configMap
    - secret
    - emptyDir
    - hostPath
  allowedHostPaths:
    - pathPrefix: "/etc/cni/net.d"
    - pathPrefix: "/etc/kube-flannel"
    - pathPrefix: "/run/flannel"
  readOnlyRootFilesystem: false
  # Users and groups
  runAsUser:
    rule: RunAsAny
  supplementalGroups:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
  # Privilege Escalation
  allowPrivilegeEscalation: false
  defaultAllowPrivilegeEscalation: false
  # Capabilities
  allowedCapabilities: [ 'NET_ADMIN' ]
  defaultAddCapabilities: [ ]
  requiredDropCapabilities: [ ]
  # Host namespaces
  hostPID: false
  hostIPC: false
  hostNetwork: true
  hostPorts:
    - min: 0
      max: 65535
  # SELinux
  seLinux:
    # SELinux is unused in CaaSP
    rule: 'RunAsAny'
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: flannel
rules:
  - apiGroups: [ 'extensions' ]
    resources: [ 'podsecuritypolicies' ]
    verbs: [ 'use' ]
    resourceNames: [ 'psp.flannel.unprivileged' ]
  - apiGroups:
      - ""
    resources:
      - pods
    verbs:
      - get
  - apiGroups:
      - ""
    resources:
      - nodes
    verbs:
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - nodes/status
    verbs:
      - patch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: flannel
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: flannel
subjects:
  - kind: ServiceAccount
    name: flannel
    namespace: kube-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: flannel
  namespace: kube-system
---
kind: ConfigMap
apiVersion: v1
metadata:
  name: kube-flannel-cfg
  namespace: kube-system
  labels:
    tier: node
    app: flannel
data:
  cni-conf.json: |
    {
      "name": "cbr0",
      "cniVersion": "0.3.1",
      "plugins": [
        {
          "type": "flannel",
          "delegate": {
            "hairpinMode": true,
            "isDefaultGateway": true
          }
        },
        {
          "type": "portmap",
          "capabilities": {
            "portMappings": true
          }
        }
      ]
    }
  net-conf.json: |
    {
      "Network": "10.244.0.0/16",
      "Backend": {
        "Type": "vxlan"
      }
    }
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-amd64
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: beta.kubernetes.io/os
                    operator: In
                    values:
                      - linux
                  - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - amd64
      hostNetwork: true
      tolerations:
        - operator: Exists
          effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
        - name: install-cni
          image: quay.io/coreos/flannel:v0.11.0-amd64
          command:
            - cp
          args:
            - -f
            - /etc/kube-flannel/cni-conf.json
            - /etc/cni/net.d/10-flannel.conflist
          volumeMounts:
            - name: cni
              mountPath: /etc/cni/net.d
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      containers:
        - name: kube-flannel
          image: quay.io/coreos/flannel:v0.11.0-amd64
          command:
            - /opt/bin/flanneld
          args:
            - --ip-masq
            - --kube-subnet-mgr
          resources:
            requests:
              cpu: "100m"
              memory: "50Mi"
            limits:
              cpu: "100m"
              memory: "50Mi"
          securityContext:
            privileged: false
            capabilities:
              add: [ "NET_ADMIN" ]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          volumeMounts:
            - name: run
              mountPath: /run/flannel
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-arm64
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: beta.kubernetes.io/os
                    operator: In
                    values:
                      - linux
                  - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - arm64
      hostNetwork: true
      tolerations:
        - operator: Exists
          effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
        - name: install-cni
          image: quay.io/coreos/flannel:v0.11.0-arm64
          command:
            - cp
          args:
            - -f
            - /etc/kube-flannel/cni-conf.json
            - /etc/cni/net.d/10-flannel.conflist
          volumeMounts:
            - name: cni
              mountPath: /etc/cni/net.d
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      containers:
        - name: kube-flannel
          image: quay.io/coreos/flannel:v0.11.0-arm64
          command:
            - /opt/bin/flanneld
          args:
            - --ip-masq
            - --kube-subnet-mgr
          resources:
            requests:
              cpu: "100m"
              memory: "50Mi"
            limits:
              cpu: "100m"
              memory: "50Mi"
          securityContext:
            privileged: false
            capabilities:
              add: [ "NET_ADMIN" ]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          volumeMounts:
            - name: run
              mountPath: /run/flannel
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-arm
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: beta.kubernetes.io/os
                    operator: In
                    values:
                      - linux
                  - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - arm
      hostNetwork: true
      tolerations:
        - operator: Exists
          effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
        - name: install-cni
          image: quay.io/coreos/flannel:v0.11.0-arm
          command:
            - cp
          args:
            - -f
            - /etc/kube-flannel/cni-conf.json
            - /etc/cni/net.d/10-flannel.conflist
          volumeMounts:
            - name: cni
              mountPath: /etc/cni/net.d
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      containers:
        - name: kube-flannel
          image: quay.io/coreos/flannel:v0.11.0-arm
          command:
            - /opt/bin/flanneld
          args:
            - --ip-masq
            - --kube-subnet-mgr
          resources:
            requests:
              cpu: "100m"
              memory: "50Mi"
            limits:
              cpu: "100m"
              memory: "50Mi"
          securityContext:
            privileged: false
            capabilities:
              add: [ "NET_ADMIN" ]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          volumeMounts:
            - name: run
              mountPath: /run/flannel
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-ppc64le
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: beta.kubernetes.io/os
                    operator: In
                    values:
                      - linux
                  - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - ppc64le
      hostNetwork: true
      tolerations:
        - operator: Exists
          effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
        - name: install-cni
          image: quay.io/coreos/flannel:v0.11.0-ppc64le
          command:
            - cp
          args:
            - -f
            - /etc/kube-flannel/cni-conf.json
            - /etc/cni/net.d/10-flannel.conflist
          volumeMounts:
            - name: cni
              mountPath: /etc/cni/net.d
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      containers:
        - name: kube-flannel
          image: quay.io/coreos/flannel:v0.11.0-ppc64le
          command:
            - /opt/bin/flanneld
          args:
            - --ip-masq
            - --kube-subnet-mgr
          resources:
            requests:
              cpu: "100m"
              memory: "50Mi"
            limits:
              cpu: "100m"
              memory: "50Mi"
          securityContext:
            privileged: false
            capabilities:
              add: [ "NET_ADMIN" ]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          volumeMounts:
            - name: run
              mountPath: /run/flannel
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-s390x
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  selector:
    matchLabels:
      app: flannel
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: beta.kubernetes.io/os
                    operator: In
                    values:
                      - linux
                  - key: beta.kubernetes.io/arch
                    operator: In
                    values:
                      - s390x
      hostNetwork: true
      tolerations:
        - operator: Exists
          effect: NoSchedule
      serviceAccountName: flannel
      initContainers:
        - name: install-cni
          image: quay.io/coreos/flannel:v0.11.0-s390x
          command:
            - cp
          args:
            - -f
            - /etc/kube-flannel/cni-conf.json
            - /etc/cni/net.d/10-flannel.conflist
          volumeMounts:
            - name: cni
              mountPath: /etc/cni/net.d
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      containers:
        - name: kube-flannel
          image: quay.io/coreos/flannel:v0.11.0-s390x
          command:
            - /opt/bin/flanneld
          args:
            - --ip-masq
            - --kube-subnet-mgr
          resources:
            requests:
              cpu: "100m"
              memory: "50Mi"
            limits:
              cpu: "100m"
              memory: "50Mi"
          securityContext:
            privileged: false
            capabilities:
              add: [ "NET_ADMIN" ]
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          volumeMounts:
            - name: run
              mountPath: /run/flannel
            - name: flannel-cfg
              mountPath: /etc/kube-flannel/
      volumes:
        - name: run
          hostPath:
            path: /run/flannel
        - name: cni
          hostPath:
            path: /etc/cni/net.d
        - name: flannel-cfg
          configMap:
            name: kube-flannel-cfg
```

将这个文件放到主节点任意目录，然后执行下面命令进行安装即可：

```shell
kubectl apply -f kube-flannel.yml
```

执行之后需要等待一段时间，然后再次查询 k8s 集群状态就可以看到状态都编程 Ready 了，至此，k8s 环境也就搭建完成了。

```text
[root@k8s-master alex]# kubectl get nodes
NAME         STATUS   ROLES    AGE   VERSION
k8s-master   Ready    master   32m   v1.16.0
k8s-node01   Ready    <none>   20m   v1.16.0
k8s-node02   Ready    <none>   18m   v1.16.0
```

这个时候可以启动一个简单的服务来验证一下 k8s 环境，下面是我提供的一个简单的 nginx 服务部署的编排，执行 `kubectl apply -f nginx.yml` 即可启动服务：

```yaml
---
apiVersion: apps/v1                 # 资源api接口版本
kind: Deployment                    # 资源类型
metadata: # 元数据
  name: nginx-deployment            # 资源名
spec: # 详情
  replicas: 2                       # 副本数
  selector: # 选择标签
    matchLabels: # 标签匹配
      app: nginx-server             # 定义要匹配的标签，下面pod中必须有这个标签
  template: # pod模板
    metadata: # pod详情
      labels: # 定义标签
        app: nginx-server           # pod标签
    spec: # pod详情
      containers: # 容器
        - name: nginx               # 容器名称
          image: nginx:1.7.9        # 容器镜像
          ports:
            - name: http
              containerPort: 80     # 容器暴露端口

---
apiVersion: v1
kind: Service
metadata:
  name: simple-service
spec:
  ports:
    - name: nginx-port
      port: 8080                      # 暴露给服务的端口
      protocol: TCP
      targetPort: 80              # 容器本身的端口
      nodePort: 31080               # 暴露给node的端口，也就是k8s节点
  type: NodePort
  selector:
    app: nginx-server
```

## 遇到的问题

### 安装完 flannel 之后 node 节点的状态依然是 NotReady

定位和解决方案如下:

1. 查看 node 节点日志 `cat /var/log/messages`，可以看到类似如下日志：

```text
Mar 21 14:43:01 centos-4 kubelet: W0321 14:43:01.075369    4742 cni.go:237] Unable to update cni config: no networks found in /etc/cni/net.d
Mar 21 14:43:03 centos-4 kubelet: E0321 14:43:03.523469    4742 kubelet.go:2187] Container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized
```

将该日志拿去搜索，可以得知问题的原因在于 node 节点下载 flannel 镜像失败，网上也给了定位步骤，比如主节点执行命令 'kubectl get pods -o wide -n kube-system' 查看 pod 状态

```text
[root@k8s-master alex]# kubectl get pods -o wide -n kube-system
NAME                                 READY   STATUS                  RESTARTS   AGE     IP               NODE         NOMINATED NODE   READINESS GATES
coredns-58cc8c89f4-6svdn             1/1     Running                 0          28m     10.244.2.3       k8s-node02   <none>           <none>
coredns-58cc8c89f4-gm78v             1/1     Running                 0          28m     10.244.2.2       k8s-node02   <none>           <none>
etcd-k8s-master                      1/1     Running                 0          27m     192.168.31.44    k8s-master   <none>           <none>
kube-apiserver-k8s-master            1/1     Running                 0          27m     192.168.31.44    k8s-master   <none>           <none>
kube-controller-manager-k8s-master   1/1     Running                 0          27m     192.168.31.44    k8s-master   <none>           <none>
kube-flannel-ds-amd64-7tnhr          1/1     Running                 0          3m52s   192.168.31.148   k8s-node02   <none>           <none>
kube-flannel-ds-amd64-hlqpt          0/1     Init:ImagePullBackOff   0          3m52s   192.168.31.201   k8s-node01   <none>           <none>
kube-flannel-ds-amd64-j5m5n          1/1     Running                 0          3m52s   192.168.31.44    k8s-master   <none>           <none>
kube-proxy-95jjd                     1/1     Running                 0          15m     192.168.31.148   k8s-node02   <none>           <none>
kube-proxy-ckq5c                     1/1     Running                 0          28m     192.168.31.44    k8s-master   <none>           <none>
kube-proxy-dv2fz                     1/1     Running                 0          16m     192.168.31.201   k8s-node01   <none>           <none>
kube-scheduler-k8s-master            1/1     Running                 0          27m     192.168.31.44    k8s-master   <none>           <none>
```

这里可以看到果然有个 pod 的状态是 Init:ImagePullBackOff 也就是下载镜像失败，这也即是为什么有的人把 kube-flannel.yml 文件中镜像地址改了的原因，就是为了避免镜像下载失败。

问题知道了，就可以解决，直接去失败的 node 节点上面手动拉取镜像即可（也可以再等等，因为其他节点可以下载，说明网络是通的）。

## 参考文章

- [CentOS 搭建 K8S，一次性成功，收藏了！](https://zhuanlan.zhihu.com/p/270884275)
- [network plugin is not ready: cni config uninitialized](https://blog.csdn.net/qq_23146469/article/details/102486500)