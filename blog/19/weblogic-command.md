# Weblogic 命令行操作，进行应用的停止、启动和更新

本篇文章收集一些在自动化部署中关于 Weblogic 的一些命令行操作，旨在仅通过命令和脚本对 Weblogic 服务以及 Weblogic 应用进行一些常规的部署、停止、启动、重部署等操作。同时记录一些在自动化部署中遇到的问题和解决方案。

## weblogic.Deployer 命令

这个命令可以用来对 weblogic 上的应用进行一些启停和更新操作，使用该命令前需要先加载一下环境变量（根据安装路径找到 setWLSEnv.sh 文件即可）：

```bash
source /home/weblogic/Oracle/Middleware/wlserver/server/bin/setWLSEnv.sh
```

然后可以执行帮助命令 `java weblogic.Deployer --help` 查看可以进行的操作：

```text
weblogic@weblogic:~/scripts$ java weblogic.Deployer --help
Usage: java weblogic.Deployer [options] [action] [Deployment units(s)]

where options include:
    -help             Print the standard usage message.            
    -version          Print version information.                   
    -adminurl <<protocol>://<server>:<port>> [option] Administration     
                      server URL: default t3://localhost:7001      
    -username <username> [option] user name                           
    -password <password> [option] password for the user               
    -idd <identity domain> [option] Identity Domain for the user        
    -userconfigfile <userconfigfile> [option] The user config file       
                      contains the user security credentials; it   
                      is administered by the WLST tool.            
    -userkeyfile <keyConfigFile> [option] The users key file; it is      
                      administered by the WLST tool.               
    -distribute       [action] Distribute application to the       
                      targets.                                     
    -start            [action] Makes an already distributed        
                      application available on a target.           
    -stop             [action] Makes an application unavailable on 
                      targets.                                     
    -redeploy         [action] Replace a running application       
                      partially or entirely.                       
    -undeploy         [action] Take an application out of service. 
    -deploy           [action] Make an application available for   
                      service.                                     
    -update           [action] Update an application configuration 
                      in place.                                    
    -extendloader     [action] Distribute code source jar to       
                      targets and use it to extend the WebLogic    
                      Extension Loader.                            
    -examples         [option] Displays example usage of this tool.
    -name <application name> [option] Defaults to the basename of the    
                      deployment file or directory.                
    -targets <<target(s)>> [option] A comma separated list of targets   
                      for the current operation. If not specified, 
                      all configured targets are used. For a new   
                      application, the default target is the       
                      administration server.                       
    -plan <Deployment plan path> [option] Specifies location of          
                      deployment plan                              
    -library          [option] Indicates that the unit being       
                      deployed is a library. This option is        
                      required when the application is a library.  
    -advanced         Print advanced usage options.                

The optional trailing arguments are deployment units and may 
represent the archive being deployed, the name of a previously 
deployed application or a list of files for a partial redeploy operation.
Unrecognized option or flag, --help
```

还可以使用 `java weblogic.Deployer -examples` 命令查看具体的操作例子。

### 部署应用

```bash
java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -source /data/app/cmis -deploy
```

正常的输出会包含关键信息 `deploy completed`：

```text
weblogic@weblogic:~/scripts$ java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -source /data/app/cmis -deploy
weblogic.Deployer invoked with options:  -adminurl t3://192.168.0.212:7001 -username weblogic -name cmis -source /data/app/cmis -deploy
<2024-6-4 下午03时22分32秒 CST> <Info> <J2EE Deployment SPI> <BEA-260121> <Initiating deploy operation for application, cmis [archive: /data/app/cmis], to configured targets.> 
Task 16 initiated: [Deployer:149026]deploy application cmis on AdminServer.
Task 16 completed: [Deployer:149026]deploy application cmis on AdminServer.
Target state: deploy completed on Server AdminServer
```

部署应用的时候需要使用 `-source` 参数指定应用部署的包，可以是目录也可以是 war 包，部署完成后，应用的状态为“活动”。

### 停止应用

```bash
java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -stop
```

正常的输出会包含关键信息 `stop completed`：

```text
weblogic@weblogic:~/scripts$ java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -stop
weblogic.Deployer invoked with options:  -adminurl t3://192.168.0.212:7001 -username weblogic -name cmis -stop
<2024-6-4 下午03时10分54秒 CST> <Info> <J2EE Deployment SPI> <BEA-260121> <Initiating stop operation for application, cmis [archive: null], to configured targets.> 
Task 13 initiated: [Deployer:149026]stop application cmis on AdminServer.
Task 13 completed: [Deployer:149026]stop application cmis on AdminServer.
Target state: stop completed on Server AdminServer
```

此时应用状态会变成 “准备就绪”。

![](https://tendcode.com/cdn/2024/04/202406041511314.png)

### 启动应用

```bash
java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -start
```

正常的输出包含关键信息 `start completed`：

```text
weblogic@weblogic:~/scripts$ java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -start
weblogic.Deployer invoked with options:  -adminurl t3://192.168.0.212:7001 -username weblogic -name cmis -start
<2024-6-4 下午03时15分48秒 CST> <Info> <J2EE Deployment SPI> <BEA-260121> <Initiating start operation for application, cmis [archive: null], to configured targets.> 
Task 14 initiated: [Deployer:149026]start application cmis on AdminServer.
Task 14 completed: [Deployer:149026]start application cmis on AdminServer.
Target state: start completed on Server AdminServer
```

此时应用状态为“活动”。

### 重新部署应用

重新部署应用跟 `deploy` 类似，也是需要指定 `-source` 的路径：

```bash
java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -source /data/app/cmis -redeploy
```

正常输出：

```text
weblogic@weblogic:~/scripts$ java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -source /data/app/cmis -redeploy
weblogic.Deployer invoked with options:  -adminurl t3://192.168.0.212:7001 -username weblogic -name cmis -source /data/app/cmis -redeploy
<2024-6-4 下午03时25分21秒 CST> <Info> <J2EE Deployment SPI> <BEA-260121> <Initiating redeploy operation for application, cmis [archive: /data/app/cmis], to configured targets.> 
Task 17 initiated: [Deployer:149026]deploy application cmis on AdminServer.
Task 17 completed: [Deployer:149026]deploy application cmis on AdminServer.
Target state: redeploy completed on Server AdminServer
```

如果重新部署失败，报错信息有如下信息，则需要先进行释放配置锁的操作（其他操作遇到这种报错也是要释放配置锁）：

```text
weblogic@weblogic:~/scripts$ java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -source /data/app/cmis -redeploy
weblogic.Deployer invoked with options:  -adminurl t3://192.168.0.212:7001 -username weblogic -name cmis -source /data/app/cmis -redeploy
<2024-6-4 下午03时28分08秒 CST> <Info> <J2EE Deployment SPI> <BEA-260121> <Initiating redeploy operation for application, cmis [archive: /data/app/cmis], to configured targets.> 
[Deployer:149163]The domain edit lock is owned by another session in non-exclusive mode. This deployment operation requires exclusive access to the edit lock and therefore cannot proceed. If using "Automatically Aquire Lock and Activate Changes" in the Administration Console, then the lock will expire shortly, so retry this operation.
```

具体被锁的地方见下图：

![](https://tendcode.com/cdn/2024/04/202406041531282.png)

### 卸载应用

```bash
java weblogic.Deployer -adminurl t3://192.168.0.212:7001 -username weblogic -password weblogic123 -name cmis -undeploy
```

## wlst.sh 命令

配置的释放和锁定可以在控制台操作，当然，自动化肯定需要使用命令操作，使用的是 weblogic 提供的 `wlst.sh` 脚本，这个脚本支持的 `Jython` 语法。

因为 wlst.sh 是命令行工具，支持将标准输入传入，所以可以利用 `EOF` 关键字将标准输入传到工具命令行中依次执行。

### 释放配置

释放配置的操作可以进入 wlst 的命令行操作，也可以写到脚本：

```bash
#!/bin/bash

release_weblogic_lock() {
    local wlserver_path=$1
    local admin_username=$2
    local admin_password=$3
    local admin_url=$4

    echo "开始释放weblogic配置"
    ${wlserver_path}/common/bin/wlst.sh <<EOF
connect("${admin_username}","${admin_password}","t3://${admin_url}")
edit()
startEdit()
save()
activate()
disconnect()
exit('n')
EOF
}

release_weblogic_lock "/home/weblogic/Oracle/Middleware/wlserver" "weblogic" "weblogic123" "192.168.0.212:7001"
if [ $? -ne 0 ]; then
    echo "释放配置失败"
fi
```

执行成功后，配置状态变成如下，且此时再执行应用的重部署就可以成功了：

![](https://tendcode.com/cdn/2024/04/202406041537015.png)

### 锁定配置

锁定的操作脚本如下：

```bash
#!/bin/bash

weblogic_lock() {
    local wlserver_path=$1
    local admin_username=$2
    local admin_password=$3
    local admin_url=$4

    echo "开始锁定weblogic配置"
    ${wlserver_path}/common/bin/wlst.sh <<EOF
connect("${admin_username}","${admin_password}","t3://${admin_url}")
edit()
startEdit()
save()
disconnect()
exit('n')
EOF
}


weblogic_lock "/home/weblogic/Oracle/Middleware/wlserver" "weblogic" "weblogic123" "192.168.0.212:7001"
if [ $? -ne 0 ]; then
    echo "锁定配置失败"
fi
```

## 遇到的问题和解决方案

### 内存溢出

问题描述：有个系统在使用命令行对应用进行重部署的时候报错，直接导致 weblogic 异常停止，大概意思是内存溢出了，部分报错信息如下：

![](https://tendcode.com/cdn/2024/04/202406041647933.png)

问题分析：从系统层面排查问题肯定不现实，直接猜测是 weblogic 分配的内存不够用。

解决方案：调整 weblogic 启动时 jvm 分配的内存，重启 weblogic 服务。

先看一下调整之前的默认内存分配，实在是太小了，最小内存是 256m，最大也才 512m。

![](https://tendcode.com/cdn/2024/04/202406041651707.png)

直接在启动脚本的同目录中找到 setDomainEnv.sh 脚本，并在最后追加一行：

```bash
MEM_ARGS="-Xms256m -Xmx2048m"
```

参数解释：

- **初始堆大小（Xms）**：使用-Xms参数指定JVM的初始堆大小。例如，-Xms512m表示将初始堆大小设置为512MB。
- **最大堆大小（Xmx）**：使用-Xmx参数指定JVM的最大堆大小。建议根据服务器的物理内存和应用程序的需求来设置此值。例如，-Xmx1024m表示将最大堆大小设置为1024MB。

修改完成后，重启 weblogic 服务，再次查看内存规划：

![](https://tendcode.com/cdn/2024/04/202406041656117.png)