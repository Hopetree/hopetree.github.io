# MongoDB集群部署——（Replica Set）副本集模式

MongoDB的集群部署方式主要是三种，分别是主从备份（Master - Slave）模式，或者叫主从复制模式、副本集（Replica Set）模式和分片（Sharding）模式，其中主从模式已经被弃用。这篇文章来记录一下副本集（Replica Set）模式集群的搭建步骤。

## 副本集模式介绍

副本集（Replica Set）模式，简单来说就是集群当中包含了多份数据，保证主节点挂掉了，备节点能继续提供数据服务，提供的前提就是数据需要和主节点一致。如下图：

![mongodb副本集（Replica Set）模式](https://tendcode.com/cdn/2023/10/mongo-replica-set.png)

Mongodb(M)表示主节点，Mongodb(S)表示备节点，Mongodb(A)表示仲裁节点。主备节点存储数据，仲裁节点不存储数据。客户端同时连接主节点与备节点，不连接仲裁节点。

默认设置下，主节点提供所有增删查改服务，备节点不提供任何服务。但是可以通过设置使备节点提供查询服务，这样就可以减少主节点的压力，当客户端进行数据查询时，请求自动转到备节点上，这个设置叫做Read Preference Modes。

仲裁节点是一种特殊的节点，它本身并不存储数据，主要的作用是决定哪一个备节点在主节点挂掉之后提升为主节点，所以客户端不需要连接此节点。这里虽然只有一个备节点，但是仍然需要一个仲裁节点来提升备节点级别。我开始也不相信必须要有仲裁节点，但是自己也试过没仲裁节点的话，主节点挂了备节点还是备节点，所以咱们还是需要它的。

MongoDB的副本集（Replica Set）是一种高可用性和数据冗余的数据库架构，通常由多个MongoDB服务器组成。以下是MongoDB副本集的关键特点和工作原理：

1. **数据冗余和高可用性**：副本集通过在多个服务器上保存相同的数据来提供数据冗余。这意味着如果其中一个服务器出现故障，系统可以自动切换到另一个服务器，从而实现高可用性。这有助于减少因硬件故障、网络问题或其他不可预测的事件而导致的数据丢失和系统中断。

2. **主节点和副本节点**：MongoDB副本集包括一个主节点（Primary）和多个副本节点（Secondary）。主节点用于处理所有的写操作，而副本节点用于复制主节点的数据，并可以处理读操作。这种分工使得主节点可以专注于写入操作，而副本节点可以提供读取操作的负载均衡，从而提高了性能。

3. **自动故障转移**：如果主节点发生故障，副本集可以自动选择一个副本节点作为新的主节点，从而继续提供服务。这个过程称为自动故障转移，它确保了系统的连续性，即使主节点发生故障也不会导致停机时间。

4. **投票和选举**：副本集中的每个成员都有一个投票权，用于选举主节点。当主节点无法正常工作时，副本集会自动进行选举，选择一个新的主节点。选举的过程依赖于大多数成员的投票来达成共识。

5. **数据同步**：MongoDB副本集使用复制（Replication）来保持数据同步。当数据在主节点上发生变化时，这些变化会被异步或同步地复制到副本节点，从而保持数据的一致性。这确保了数据在所有节点之间的同步，并防止数据丢失。

6. **读写偏好设置**：可以通过配置读写偏好来控制客户端的读写操作路由。例如，你可以将所有读操作路由到主节点，或者将读操作分发到副本节点，以减轻主节点的负载。

7. **监控和管理工具**：MongoDB提供了监控和管理工具，以便查看副本集的状态、性能和健康状况。这些工具可用于监视和维护副本集的运行。

MongoDB副本集是构建高可用性和容错性系统的重要工具。它可以在多种应用场景下使用，包括网站、应用程序、日志存储和分布式系统。通过使用副本集，可以确保数据的可用性和持久性，同时提供了更好的性能和扩展性选项。


## 准备环境

集群主机信息：

|  IP | 作用  | 系统  | 配置|
| :------------: | :------------: | :------------: |:------------: |
|  192.168.110.216 |  mongdb主节点 | CentOS7.9  |2C2G|
| 192.168.110.217  |  mongdb从节点 | CentOS7.9  |2C2G|
|  192.168.110.218 |  mongdb仲裁节点 | CentOS7.9  |2C2G|

目录结构：

| 目录或文件  |  作用 | 备注  |
| :------------: | :------------: | :------------: |
| /data/mongodb/data  | 数据存放目录  | 需要提前创建  |
| /var/log/mongodb  |  日志存放目录 |  需要提前创建 |
| /usr/local/mongodb4  | 安装目录  |   |


## 安装MongoDB

需要到三个节点都执行MongoDB的安装操作。

### 安装依赖

```bash
sudo yum install libcurl openssl
```

### 下载安装包

前往官网下载对应平台的安装包即可，地址：<https://www.mongodb.com/try/download/community>

根据自己的需要选择要下载的版本、平台，然后选择下载为tgz格式并复制下载链接

![](https://tendcode.com/cdn/2023/10/mongo-pkg%20%281%29.png)

然后登录到服务器下载安装包

```bash
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-4.4.25.tgz
```

下载完成之后将安装包解压并移动到指定目录

```bash
tar -zxvf mongodb-linux-x86_64-rhel70-4.4.25.tgz
mv mongodb-linux-x86_64-rhel70-4.4.25 /usr/local/mongodb4
```

### 创建相关目录

首先需要创建MongoDB的数据存放目录和日志目录

```bash
mkdir -p /data/mongodb/data /var/log/mongodb
```

### 创建密钥文件

集群之前通信需要进行加密，这里是使用的密钥文件来做的，在主节点(192.168.110.216)上面生成一个密钥文件并设置文件的权限，然后需要拷贝到另外两个节点同样的位置(先创建conf目录)，也要设置文件权限为600

```bash
mkdir -p /usr/local/mongodb4/conf
openssl rand -base64 756 > /usr/local/mongodb4/conf/replset.key
chmod 600 /usr/local/mongodb4/conf/replset.key
```

### 创建配置文件

在mongodb的安装目录中创建配置文件mongodb.yaml，放到安装目录的conf目录下面：

```bash
vi /usr/local/mongodb4/conf/mongodb.yaml
```

文件内容如下

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
security:
    authorization: "enabled"
    keyFile: "/usr/local/mongodb4/conf/replset.key"

# replication 部分定义了 MongoDB 副本集的配置
replication:
    replSetName: "mymongo"
```

配置文件的解释：



### 启动MongoDB

配置完成之后接着就可以依次启动3个节点的服务

```bash
cd /usr/local/mongodb4 && ./bin/mongod -f /usr/local/mongodb4/conf/mongodb.yaml
```

此时可以查看日志，可以看到服务已经启动并运行在后台



### 注册主、备和仲裁信息

在主节点(192.168.110.216)直接使用登录命令登录到mongodb的shell

```bash
cd /usr/local/mongodb4/bin
./mongo
```

进入shell中后执行初始化集群信息

```bash
[root@zero-1 bin]# cd /usr/local/mongodb4/bin
[root@zero-1 bin]# ./mongo
MongoDB shell version v4.4.25
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("dcb88c52-cae8-4152-ad25-bb2b26885562") }
MongoDB server version: 4.4.25
> use admin
switched to db admin
> cfg={ _id:"mymongo", members:[ {_id:0,host:'192.168.110.216:27017',priority:2}, {_id:1,host:'192.168.110.217:27017',priority:1},
... {_id:2,host:'192.168.110.218:27017',arbiterOnly:true}] };
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
> rs.initiate(cfg)
{ "ok" : 1 }
mymongo:SECONDARY> 
```

这个里面的关键注册信息就是cfg的内容，这个内容单独来看是这样的:

```bash
{ _id:"mymongo", members:[ {_id:0,host:'192.168.110.216:27017',priority:2}, {_id:1,host:'192.168.110.217:27017',priority:1},{_id:2,host:'192.168.110.218:27017',arbiterOnly:true}]}
```

cfg是可以任意的名字，当然最好不要是mongodb的关键字，conf，config都可以。最外层的_id表示replica set的名字，members里包含的是所有节点的地址以及优先级。优先级最高的即成为主节点，即这里的10.10.148.130:27017。特别注意的是，对于仲裁节点，需要有个特别的配置——arbiterOnly:true。这个千万不能少了，不然主备模式就不能生效。

配置的生效时间根据不同的机器配置会有长有短，配置不错的话基本上十几秒内就能生效，有的配置需要一两分钟。如果生效了，执行rs.status()命令会看到如下信息：

```bash
{
        "set" : "mymongo",
        "date" : ISODate("2023-10-26T07:48:27.545Z"),
        "myState" : 1,
        "term" : NumberLong(1),
        "syncSourceHost" : "",
        "syncSourceId" : -1,
        "heartbeatIntervalMillis" : NumberLong(2000),
        "majorityVoteCount" : 2,
        "writeMajorityCount" : 2,
        "votingMembersCount" : 3,
        "writableVotingMembersCount" : 2,
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1698306504, 1),
                        "t" : NumberLong(1)
                },
                "lastCommittedWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                "readConcernMajorityOpTime" : {
                        "ts" : Timestamp(1698306504, 1),
                        "t" : NumberLong(1)
                },
                "readConcernMajorityWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                "appliedOpTime" : {
                        "ts" : Timestamp(1698306504, 1),
                        "t" : NumberLong(1)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1698306504, 1),
                        "t" : NumberLong(1)
                },
                "lastAppliedWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                "lastDurableWallTime" : ISODate("2023-10-26T07:48:24.063Z")
        },
        "lastStableRecoveryTimestamp" : Timestamp(1698306504, 1),
        "electionCandidateMetrics" : {
                "lastElectionReason" : "electionTimeout",
                "lastElectionDate" : ISODate("2023-10-26T07:42:23.912Z"),
                "electionTerm" : NumberLong(1),
                "lastCommittedOpTimeAtElection" : {
                        "ts" : Timestamp(0, 0),
                        "t" : NumberLong(-1)
                },
                "lastSeenOpTimeAtElection" : {
                        "ts" : Timestamp(1698306132, 1),
                        "t" : NumberLong(-1)
                },
                "numVotesNeeded" : 2,
                "priorityAtElection" : 2,
                "electionTimeoutMillis" : NumberLong(10000),
                "numCatchUpOps" : NumberLong(0),
                "newTermStartDate" : ISODate("2023-10-26T07:42:23.944Z"),
                "wMajorityWriteAvailabilityDate" : ISODate("2023-10-26T07:42:24.868Z")
        },
        "members" : [
                {
                        "_id" : 0,
                        "name" : "192.168.110.216:27017",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 859,
                        "optime" : {
                                "ts" : Timestamp(1698306504, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2023-10-26T07:48:24Z"),
                        "lastAppliedWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                        "lastDurableWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                        "syncSourceHost" : "",
                        "syncSourceId" : -1,
                        "infoMessage" : "",
                        "electionTime" : Timestamp(1698306143, 1),
                        "electionDate" : ISODate("2023-10-26T07:42:23Z"),
                        "configVersion" : 1,
                        "configTerm" : 1,
                        "self" : true,
                        "lastHeartbeatMessage" : ""
                },
                {
                        "_id" : 1,
                        "name" : "192.168.110.217:27017",
                        "health" : 1,
                        "state" : 2,
                        "stateStr" : "SECONDARY",
                        "uptime" : 374,
                        "optime" : {
                                "ts" : Timestamp(1698306504, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDurable" : {
                                "ts" : Timestamp(1698306504, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2023-10-26T07:48:24Z"),
                        "optimeDurableDate" : ISODate("2023-10-26T07:48:24Z"),
                        "lastAppliedWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                        "lastDurableWallTime" : ISODate("2023-10-26T07:48:24.063Z"),
                        "lastHeartbeat" : ISODate("2023-10-26T07:48:26.215Z"),
                        "lastHeartbeatRecv" : ISODate("2023-10-26T07:48:27.224Z"),
                        "pingMs" : NumberLong(0),
                        "lastHeartbeatMessage" : "",
                        "syncSourceHost" : "192.168.110.216:27017",
                        "syncSourceId" : 0,
                        "infoMessage" : "",
                        "configVersion" : 1,
                        "configTerm" : 1
                },
                {
                        "_id" : 2,
                        "name" : "192.168.110.218:27017",
                        "health" : 1,
                        "state" : 7,
                        "stateStr" : "ARBITER",
                        "uptime" : 374,
                        "lastHeartbeat" : ISODate("2023-10-26T07:48:26.214Z"),
                        "lastHeartbeatRecv" : ISODate("2023-10-26T07:48:26.213Z"),
                        "pingMs" : NumberLong(0),
                        "lastHeartbeatMessage" : "",
                        "syncSourceHost" : "",
                        "syncSourceId" : -1,
                        "infoMessage" : "",
                        "configVersion" : 1,
                        "configTerm" : 1
                }
        ],
        "ok" : 1,
        "$clusterTime" : {
                "clusterTime" : Timestamp(1698306504, 1),
                "signature" : {
                        "hash" : BinData(0,"Ap7uzbDWjhpTRx5ysv5Wo2jJUvw="),
                        "keyId" : NumberLong("7294169342780899332")
                }
        },
        "operationTime" : Timestamp(1698306504, 1)
}
```

这个返回就能看到整个集群已经生效了，可以开始愉快的玩耍了！！！

### 创建用户

集群搭建完成可以创建管理用户并设置权限，在主节点登录到mongodb的shell之后执行，参考命令：

```bash
# 创建root账号并添加权限
use admin
db.createUser({user:'root',pwd:'root#1234',roles:[{role: 'root', db: 'admin'},{ role: "__system", db: "admin" }]})
db.auth('root','root#1234')
db.createUser({user:'user',pwd:'user#1234',roles:[{role: 'readWriteAnyDatabase', db: 'admin'}]})
```

执行过程和返回如下

```bash
mymongo:PRIMARY> use admin
switched to db admin
mymongo:PRIMARY> db.createUser({user:'root',pwd:'root#1234',roles:[{role: 'root', db: 'admin'},{ role: "__system", db: "admin" }]})
Successfully added user: {
        "user" : "root",
        "roles" : [
                {
                        "role" : "root",
                        "db" : "admin"
                },
                {
                        "role" : "__system",
                        "db" : "admin"
                }
        ]
}
mymongo:PRIMARY> db.auth('root','root#1234')
1
mymongo:PRIMARY> db.createUser({user:'user',pwd:'user#1234',roles:[{role: 'readWriteAnyDatabase', db: 'admin'}]})
Successfully added user: {
        "user" : "user",
        "roles" : [
                {
                        "role" : "readWriteAnyDatabase",
                        "db" : "admin"
                }
        ]
}
mymongo:PRIMARY> exit
```

设置之后再退出来重新登陆

```bash
cd /usr/local/mongodb4/bin
./mongo --username root --password root#1234 --authenticationDatabase admin
```

## 高可用场景假设

现在假设有一个3节点的MongoDB副本集集群，这里提供一些场景假设，我们看看集群会发生什么（这里的场景由我提问，回答是由ChatGPT提供）。

### 主节点异常

如果一个MongoDB副本集的主节点（Primary）出现了异常，会发生以下情况：

1. **自动故障转移**：MongoDB副本集会自动检测到主节点的异常，然后触发自动故障转移（Automatic Failover）。这是副本集的一个关键特性，用于确保系统的高可用性。自动故障转移的主要步骤如下：

	a. 副本集中的其他节点（即副本节点）开始进行选举以选择一个新的主节点。每个节点有一个投票权，通常需要大多数节点的投票来选举主节点。

	b. 一旦新的主节点选举成功，副本集的成员将切换到新主节点，新主节点将接管写操作。

2. **数据同步**：一旦新主节点选举成功，副本集会确保所有的数据在新主节点上是最新的。这通常需要一些时间，因为数据需要从主节点同步到新主节点。在这个过程中，副本节点将等待数据同步完成，然后才能提供读操作。

3. **应用程序访问**：应用程序通常会受到影响，因为在主节点切换期间可能会有一小段时间的停机。应用程序可能需要重新连接到新的主节点，以确保它们的写操作被路由到新的主节点。

总之，如果MongoDB副本集的主节点发生异常，系统会经历一次自动故障转移，以确保高可用性。在此过程中，数据的一致性和数据完整性是首要考虑的因素，系统会确保在新主节点上的数据是最新的，并且能够继续提供服务。然而，应用程序可能会在切换期间受到一些影响，需要考虑适当的容错和重连机制。

### 备节点异常

如果MongoDB副本集的备节点（Secondary）出现异常，通常不会对整个系统的可用性产生太大影响。以下是当备节点出现异常时可能发生的情况：

1. **故障节点隔离**：当备节点出现异常时，副本集会将其隔离，不再用于数据同步。这不会影响主节点的正常操作。

2. **数据同步延迟**：备节点通常会与主节点保持数据同步。当备节点出现异常时，数据同步会中断，这可能导致备节点上的数据不再是最新的。这种延迟通常可以在备节点重新启动并与主节点重新建立连接后追赶上。

3. **读操作继续**：虽然备节点上的数据可能不是最新的，但主节点仍然可以继续处理读操作。应用程序可以将读操作路由到主节点，以确保获得最新的数据。

4. **写操作不受影响**：主节点仍然可以处理所有写操作，因为备节点的异常不会影响主节点的功能。

5. **自动恢复**：通常情况下，备节点的异常是临时的，可以通过重新启动备节点来解决。一旦备节点恢复并与主节点重新建立连接，数据同步将继续。

总之，当备节点出现异常时，主节点和其他备节点仍然可以继续工作。数据同步可能会受到影响，但这通常是可恢复的。备节点的异常通常不会导致整个系统的停机，因为主节点可以继续提供读写操作。重要的是监视系统以及备节点的健康状况，以及及时采取必要的维护措施来处理备节点的异常。

### 仲裁节点异常

在MongoDB的副本集中，仲裁节点（Arbiter）不存储数据，它的主要作用是参与选举过程，以帮助副本集达成共识。因此，当仲裁节点出现异常时，通常不会对整个系统的可用性产生显著影响。以下是当仲裁节点出现异常时可能发生的情况：

1. **仲裁节点不存储数据**：仲裁节点不参与数据同步，因此不会有数据在仲裁节点上受到影响。

2. **选举过程继续**：即使仲裁节点出现异常，选举过程仍然可以继续。其他正常运行的节点（主节点和副本节点）将参与选举，以选择新的主节点。

3. **仲裁节点不影响数据一致性**：仲裁节点的主要作用是帮助解决选举时可能出现的投票平局问题，而不是对数据进行复制或存储。它的异常不会影响数据的一致性。

4. **系统可用性不受威胁**：即使仲裁节点发生故障，主节点和副本节点仍然可以提供数据的读写操作，因为它们是存储和复制数据的关键节点。

总之，仲裁节点的异常通常不会对整个副本集的数据完整性和可用性产生重大影响。它们的主要作用是帮助副本集达成共识，而不存储数据。当出现仲裁节点的异常时，你可以考虑修复或替换仲裁节点，但这不会导致数据丢失或系统停机。仲裁节点的主要作用是提高选举的效率和准确性，而不是提供数据冗余或高可用性。

### 两个节点异常

当MongoDB副本集中的3个节点中有2个节点同时发生异常时，会出现以下不同的场景和后果：

1. **主节点和备节点同时异常**：
	- 主节点和备节点都不可用，写操作和数据同步都停止。
	- 副本集无法进行自动故障转移，因为没有备节点可以接管主节点的角色。
	- 读操作仍然可以从仲裁节点或者其他数据库实例进行，但数据可能不是最新的。
	- 必须手动修复至少一个节点，然后重新启动数据同步。

2. **主节点和仲裁节点同时异常**：
	- 主节点和仲裁节点都不可用，写操作和选举都无法执行。
	- 备节点可以继续处理读操作，但数据可能不是最新的。
	- 副本集无法进行自动故障转移，因为仲裁节点无法参与选举。
	- 必须手动修复主节点或仲裁节点，然后重新启动数据同步。

3. **备节点和仲裁节点同时异常**：
	- 主节点仍然可用并处理写操作，但数据不会被复制到备节点或仲裁节点。
	- 读操作仍然可以从主节点进行，但数据可能不会同步到备节点或仲裁节点。
	- 副本集无法进行自动故障转移，因为只有一个正常运行的节点。
	- 数据冗余性丧失，因为没有备节点可以维护冗余数据。
	- 必须手动修复备节点或仲裁节点，然后重新启动数据同步。

在所有这些情况下，系统的可用性和数据完整性受到影响，需要通过手动干预来修复问题。最好的做法是在生产环境中使用多个节点，以确保即使多个节点出现异常，仍然可以维持高可用性和数据冗余。如果节点异常成为频繁发生的问题，那么可能需要审查硬件、网络配置和部署策略，以提高系统的稳定性。

## 参考文档

- [【博客园】Mongodb集群搭建的三种方式](https://www.cnblogs.com/fanblogs/p/13183424.html)
- [【掘金】手把手教你搭建MongoDB集群](https://juejin.cn/post/7120119206615941151)