# MongoDB 集群主机 IP 变更后恢复集群状态的方案

## 背景

最近有个环境做信创改造，使用的改造方案是新旧两套环境互换 IP，从而可以避免新环境重新开各种网络策略的问题。

由于新环境已经下线 MongoDB 改用公司自研数据库，而迁移数据后有个事情需要从原 MongoDB 中割接数据，因此需要重新启动老环境的 MongoDB。

但是老环境和新环境已经互换了 IP，因此 MongoDB 集群是无法正常运行的，需要做些处理。本篇博客记录一下在集群主机 IP 变更之后如何恢复 MongoDB 的集群状态和数据。

## 解决方案 

由于公司的产品之前使用的 MongoDB 版本是 3.x，后面才升级到 4.x 的，而关于变更 IP 后恢复集群状态在这两个版本中的操作是有区别的，本次操作的集群 MongoDB 版本是 3.x，但是方案还是提前准备到了两个版本的不同操作方案。

::: tip 前文回顾

在执行方案前我们可以回顾一下配置 MongoDB 的集群的时候，哪些步骤涉及到了 IP 的设置？从理论上来说，只需要将设置过 IP 的地方修改成新的 IP 应该就行了。可以查看我博客之前的文章：[《MongoDB集群部署——（Replica Set）副本集模式》](https://tendcode.com/subject/article/mongodb-install-Replica-Set/#%E6%B3%A8%E5%86%8C%E4%B8%BB%E5%A4%87%E5%92%8C%E4%BB%B2%E8%A3%81%E4%BF%A1%E6%81%AF "《MongoDB集群部署——（Replica Set）副本集模式》")
:::

执行集群恢复操作前需要知道的事情：

1. 虽然主机 IP 修改了，但是每个节点还是可以正常登录 MongoDB
2. 由于主机 IP 变更，集群状态是异常的，也就是没有主从状态，因此无法执行一些查询操作更不用说写入操作
3. MongoDB 集群状态异常，也就无法被其他服务调用

### MongoDB 3.x 操作步骤

#### 1. root 用户登录主库

使用 root 用户登录集群的主库节点，并且直接切换到 admin 库：

```bash
cd /usr/local/mongodb && ./bin/mongo -uroot -p${pwd} --authenticationDatabase admin
```

#### 2. 更新集群配置

在集群创建的时候，集群 IP 是以注册的形式初始化的，因此只需要更新这种注册信息即可。

先执行 `rs.conf()` 命令查看一下当前的集群配置信息，可以看到类似的信息：

```bash
{
        "_id" : "mymongo",
        "members" : [
                {
                        "_id" : 0,
                        "host" : "192.168.110.216:27017",
                        "priority" : 2
                },
                {
                        "_id" : 1,
                        "host" : "192.168.110.217:27017",
                        "priority" : 1
                },
                {
                        "_id" : 2,
                        "host" : "192.168.110.218:27017",
                        "arbiterOnly" : true
                }
        ]
}
```

此时执行命令来更新 `members` 中的每个 `host` 字段即可：

```bash
cfg = rs.conf()
cfg.members[0].host = "xx.xx.xx.166:27017"
cfg.members[1].host = "xx.xx.xx.167:27017"
cfg.members[2].host = "xx.xx.xx.168:27017"
rs.reconfig(cfg)
```

修改前后的 IP 和节点的角色要对应上，执行完成后可以执行 `rs.status()` 查看集群状态，状态正常就操作完成了，其他节点不需要进行操作。


### MongoDB 4.x 操作步骤

MongoDB 4.x 版本直接登录主库去修改配置是不生效的，需要删除 `local` 库重新注册集群。

#### 1. 停止所有节点，并注释相关配置

首先，停掉集群的所有节点的 MongoDB 服务，包括仲裁节点。

然后，修改 MongoDB 的配置文件 `conf/mongodb.yaml` ，开启免密认证和非复制模式启动（经过验证不开免密认证会进不去local库），具体操作就是在配置文件中的 security 部分和 replication 部分加上注释，如下：

```yaml
# systemLog 部分定义了 MongoDB 的日志设置
systemLog:
    destination: file
    path: "/var/log/mongodb/mongod.log"
    logAppend: true

# processManagement 部分定义了 MongoDB 进程管理设置
processManagement:
    fork: true

# net 部分定义了 MongoDB 的网络设置
net:
    port: 27017
    bindIp: "0.0.0.0"
    unixDomainSocket:
       enabled: true
       pathPrefix: "/usr/local/mongodb4/"

# storage 部分定义了 MongoDB 存储引擎和数据存储设置
storage:
   dbPath: "/data/mongodb/data"
   journal:
       enabled: true
   engine: "wiredTiger"
   wiredTiger:
       engineConfig:
           cacheSizeGB: 1

# security 部分定义了 MongoDB 的安全设置
#security:
#    authorization: "enabled"
#    keyFile: "/usr/local/mongodb4/conf/replset.key"

# replication 部分定义了 MongoDB 副本集的配置
#replication:
#    replSetName: "mymongo"

```

#### 2. 启动所有节点，删除 local 库 

启动所有节点（此时相当于每个节点独立启动，非复制集模式），包括仲裁，使用 root 用户登录：

```bash
cd /usr/local/mongodb && ./bin/mongo -uroot -p${pwd} --authenticationDatabase admin
```

等了后进入 local 库，并删除整个库：

```bash
use local
db.dropDatabase()
```

#### 3. 还原配置，重启所有节点

首先还原之前注释的 `conf/mongodb.yaml` 中的内容：

```yaml
# security 部分定义了 MongoDB 的安全设置
security:
    authorization: "enabled"
    keyFile: "/usr/local/mongodb4/conf/replset.key"

# replication 部分定义了 MongoDB 副本集的配置
replication:
    replSetName: "mymongo"
```

然后重启每个节点，包括仲裁，此时节点相当于又以集群模式在运行，只不过目前还没有进行集群信息注册。

#### 4. 重新注册集群信息，初始化复制集

登录到主库节点执行以下命令。

（1）初始化配置，并添加主库节点 IP 信息：

```bash
rs.initiate()
conf=rs.conf()
conf.members[0].host='xx.xx.xx.166:27017'
rs.reconfig(conf)
```

（2）添加从节点信息：

```bash
rs.add({_id:1,host:'xx.xx.xx.167:27017',priority:1})
```

（3）添加仲裁节点：

```bash
rs.addArb("xx.xx.xx.168:27017")
```

执行完成后可以执行 `rs.status()` 查看集群状态，状态正常就操作完成了。

## 总结

当 MongoDB 的集群主机 IP 发生变换，要恢复集群状态，在 MongoDB 3.x 和 4.x 版本要执行的操作是不同的，但是本质是一样的，就是变更注册的集群信息。3.x 中可以直接登录主节点进行配置的变更，而 4.x 中需要先删除之前注册的信息然后重新注册集群信息。