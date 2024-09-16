# VMware虚拟机桥接网络设置固定静态IP

平时使用虚拟机的时候都是使用的桥接网络，这样比较方便虚拟机之间，以及虚拟机和主机、外部网络的联通。但是默认的桥接网络是动态设置IP地址的，这样就导致虚拟机重启之后可能会变化IP，对于ssh操作非常不便。本篇文章分享一下如何将虚拟机的IP设置成固定IP。

本文使用的VMware® Workstation 16 Pro版本为16.2.5 build-20904516

> 顺便说一下，之前使用过17的版本，然后出现过一个非常离谱的问题，就是设置虚拟机桥接网络的时候虚拟机无法获取到IP，导致无法联网，查了好久最后发现网上说到了是bug所以换到了16的版本。

## 设置桥接网络

首先说一下设置桥接网络的方式

### 设置虚拟网络编辑器

设置虚拟网络编辑器是全局网络设置，⚠️这个必须使用管理员修改，不然改不了

下面这个是不使用管理员运行VMware® Workstation的时候的设置效果，可以看到提示是要管理员才可以修改的

![虚拟网络编辑器](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/vmware-net-1.png "虚拟网络编辑器")

使用管理员运行VMware® Workstation之后再来设置桥接网络，模式选择桥接模式，网卡选择宿主机的网卡

![虚拟网络编辑器](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/vmware-net-2.png "虚拟网络编辑器")

### 设置虚拟机的网络适配器

全局设置好VMware® Workstation的虚拟网络编辑器后需要给虚拟机设置网络模式，点击虚拟机的设置-网络适配器进行设置，网络链接选择桥接模式

![虚拟机的网络适配器](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/article/2307/vmware-host-net.png "虚拟机的网络适配器")

如果是虚拟机复制，网络这里还应该进入高级里重新生成一个MAC信息，避免重复的MAC

## CentOS 设置静态IP

网络模式设置完成之后可以登录虚拟机，可以查看到虚拟机被分配了一个跟宿主机同网段的IP地址，但是这个IP会变的，所以为了方便使用可以设置成静态固定的IP。

查询虚拟机的IP地址可以看到网卡相关信息，这里有个ens33，也可以看到动态生成的IP地址为192.168.0.101

```shell
[root@centos-1 ~]# ifconfig
ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.0.101  netmask 255.255.255.0  broadcast 192.168.0.255
        inet6 fe80::fcae:6ea9:801a:940d  prefixlen 64  scopeid 0x20<link>
        ether 00:50:56:2f:0b:0d  txqueuelen 1000  (Ethernet)
        RX packets 661  bytes 69125 (67.5 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 217  bytes 27435 (26.7 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

修改IP信息文件`/etc/sysconfig/network-scripts/ifcfg-ens33`如下，主要看注释的几行

```bash
TYPE="Ethernet"
PROXY_METHOD="none"
BROWSER_ONLY="no"
BOOTPROTO="static"                  # 默认为dhcp
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
IPV6INIT="yes"
IPV6_AUTOCONF="yes"
IPV6_DEFROUTE="yes"
IPV6_FAILURE_FATAL="no"
IPV6_ADDR_GEN_MODE="stable-privacy"
NAME="ens33"
UUID="23ff1668-9fca-49c4-8437-3bdd6a17f27f"
DEVICE="ens33"
ONBOOT="yes"
IPADDR="192.168.0.201"              # 设置固定静态IP信息
GATEWAY="192.168.0.1"               # 设置网关，跟宿主机一致
DNS1="233.5.5.5"              # 阿里DNS
DNS2="233.6.6.6"             # 阿里DNS
DNS3="119.29.29.29"                      # DNSPOD DNS
```

修改完配置文件之后需要重启虚拟机，可以执行`reboot`命令，重启之后就可以使用设置的静态IP地址来登录虚拟机了。

## Ubuntu 设置静态 IP

参考文章：[Ubuntu23.04静态ip地址设置](https://blog.csdn.net/ethnicitybeta/article/details/131636666)