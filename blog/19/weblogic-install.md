# WebLogic 安装部署

最近在跟客户搞持续部署，客户这边很多 Java 项目使用的应用服务器都是 WebLogic，因此为了更加方便自己调试一些命令，减少对测试环境甚至生产环境的侵害，我打算自己搭建一套本地 WebLogic 环境来验证一下操作，本篇记录一下环境部署。

## 1. 安装 JDK 环境

安装 JDK 环境的步骤这里不做说明，我博客有相关操作文档。

使用 `java -version` 来验证：

```bash
root@weblogic:~# java -version
java version "1.8.0_411"
Java(TM) SE Runtime Environment (build 1.8.0_411-b09)
Java HotSpot(TM) 64-Bit Server VM (build 25.411-b09, mixed mode)
```

## 2. 创建用户和组

WebLogic 一般使用 weblogic 用户来启动，因此一般创建一个 weblogic 和同名的用户组：

```bash
sudo groupadd weblogic
sudo useradd -g weblogic -s /bin/bash -m weblogic
sudo passwd weblogic

```

## 3. 安装 WebLogic

### 3.1 下载 WebLogic 安装包

从 [Oracle 官网](https://www.oracle.com/middleware/technologies/weblogic-server-installers-downloads.html) 下载安装包，跟下载 JDK 包一样，需要注册和登录 Oracel 账号才可以下载.

下载的时候选择 `Generic` 的：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202405261605614.png)

下载后可以得到一个类似这种的压缩包：fmw_12.2.1.4.0_wls_lite_Disk1_1of1.zip

### 3.2 上传并解压安装包

将下载的安装包压缩文件上传到服务器上面任意位置，并解压文件，此时可以得到一个 jar 包，如 fmw_12.2.1.4.0_wls_lite_generic.jar

```bash
unzip fmw_12.2.1.4.0_wls_lite_Disk1_1of1.zip
```

### 3.3 使用配置文件静默安装

首先，切换到 weblogic 用户：

```bash
su weblogic
```

然后创建一个目录用来放置响应文件（静默安装的配置文件）：

```bash
mkdir -p /home/weblogic/response_files
```

在该目录下创建一个响应文件（比如wls_silent_install.rsp），内容如下：

```ini
[ENGINE]

#DO NOT CHANGE THIS.
Response File Version=1.0.0.0.0

[GENERIC]

# The oracle home location. This can be an existing Oracle Home or a new Oracle Home
ORACLE_HOME=/home/weblogic/Oracle/Middleware

# Set this variable value to the Installation Type selected. e.g. Fusion Middleware Infrastructure, Fusion Middleware Infrastructure With Examples.
INSTALL_TYPE=WebLogic Server

# Provide the My Oracle Support Username. If you wish to ignore Oracle Configuration Manager configuration provide empty string for user.
MYORACLESUPPORT_USERNAME=

# Provide the My Oracle Support Password
MYORACLESUPPORT_PASSWORD=<YOUR_PASSWORD_HERE>

# Set this to true if you wish to decline the security updates.
DECLINE_SECURITY_UPDATES=true

# Set this to true if My Oracle Support Password is specified.
SECURITY_UPDATES_VIA_MYORACLESUPPORT=false

# Provide the Proxy Host
PROXY_HOST=

# Provide the Proxy Port
PROXY_PORT=

# Provide the Proxy Username
PROXY_USER=

# Provide the Proxy Password
PROXY_PWD=

# Type String (URL format) Indicates the OCM Repeater URL to be used to upload the RDA results.
COLLECTOR_SUPPORTHUB_URL=

# The directory where the latest support library patches are stored. This directory will be searched for the patches needed for the installation.
SUPPORT_LIBRARIES_PATH=

```

备注：这里只需要关注一个配置项 `ORACLE_HOME` 就行，这个配置的注释也说明了作用，并且特意说了需要给予目录足够的权限。

再创建一个 `oraInst.loc` 配置文件，内容如下：

```bash
inventory_loc=/home/weblogic/oraInventory
inst_group=weblogic

```

备注：

- **inventory_loc**: 表示产品清单目录
- **inst_group**: 表示 weblogic 用户所在的组名

最后加载环境变量配置文件，并执行安装命令（注意三个文件的路径根据实际填写）：

```bash
source /etc/profile

java -jar /opt/software/fmw_12.2.1.4.0_wls_lite_generic.jar -silent -responseFile /home/weblogic/response_files/wls_silent_install.rsp -invPtrLoc /home/weblogic/response_files/oraInst.loc

```


看到类似如下输出就是安装成功：

```bash
...
Validations are enabled for this session.
Verifying data
Copying Files
Percent Complete : 10
Percent Complete : 20
Percent Complete : 30
Percent Complete : 40
Percent Complete : 50
Percent Complete : 60
Percent Complete : 70
Percent Complete : 80
Percent Complete : 90
Percent Complete : 100

The installation of Oracle Fusion Middleware 12c WebLogic Server and Coherence 12.2.1.4.0 completed successfully.
Logs successfully copied to /home/weblogic/oraInventory/logs.
```

## 4. 创建域

首先，创建域配置响应文件，这里可以直接复制 Weblogic 自带的模板，复制命令如下：

```bash
cp /home/weblogic/Oracle/Middleware/wlserver/common/templates/scripts/wlst/basicWLSDomain.py /home/weblogic/response_files/create_domain.py
```

然后修改一下配置中的参数即可：

```bash
#=======================================================================================
# This is an example of a simple WLST offline configuration script. The script creates 
# a simple WebLogic domain using the Basic WebLogic Server Domain template. The script 
# demonstrates how to open a domain template, create and edit configuration objects, 
# and write the domain configuration information to the specified directory.
#
# This sample uses the demo Derby Server that is installed with your product.
# Before starting the Administration Server, you should start the demo Derby server
# by issuing one of the following commands:
#
# Windows: WL_HOME\common\derby\bin\startNetworkServer.cmd
# UNIX: WL_HOME/common/derby/bin/startNetworkServer.sh
#
# (WL_HOME refers to the top-level installation directory for WebLogic Server.)
#
# The sample consists of a single server, representing a typical development environment. 
# This type of configuration is not recommended for production environments.
#
# Please note that some of the values used in this script are subject to change based on 
# your WebLogic installation and the template you are using.
#
# Usage: 
#      java weblogic.WLST <WLST_script> 
#
# Where: 
#      <WLST_script> specifies the full path to the WLST script.
#=======================================================================================

#=======================================================================================
# Open a domain template.
#=======================================================================================

readTemplate("/home/weblogic/Oracle/Middleware/wlserver/common/templates/wls/wls.jar")

#=======================================================================================
# Configure the Administration Server and SSL port.
#
# To enable access by both local and remote processes, you should not set the 
# listen address for the server instance (that is, it should be left blank or not set). 
# In this case, the server instance will determine the address of the machine and 
# listen on it. 
#=======================================================================================

cd('Servers/AdminServer')
set('ListenAddress','')
set('ListenPort', 7001)

create('AdminServer','SSL')
cd('SSL/AdminServer')
set('Enabled', 'True')
set('ListenPort', 7002)

#=======================================================================================
# Define the user password for weblogic.
#=======================================================================================

cd('/')
cd('Security/base_domain/User/weblogic')
cmo.setPassword('weblogic123')
# Please set password here before using this script, e.g. cmo.setPassword('value')

#=======================================================================================
# Create a JMS Server.
#=======================================================================================

cd('/')
create('myJMSServer', 'JMSServer')

#=======================================================================================
# Create a JMS System resource. 
#=======================================================================================

cd('/')
create('myJmsSystemResource', 'JMSSystemResource')
cd('JMSSystemResource/myJmsSystemResource/JmsResource/NO_NAME_0')

#=======================================================================================
# Create a JMS Queue and its subdeployment.
#=======================================================================================

myq=create('myQueue','Queue')
myq.setJNDIName('jms/myqueue')
myq.setSubDeploymentName('myQueueSubDeployment')

cd('/')
cd('JMSSystemResource/myJmsSystemResource')
create('myQueueSubDeployment', 'SubDeployment')

#=======================================================================================
# Create and configure a JDBC Data Source, and sets the JDBC user.
#=======================================================================================

cd('/')
create('myDataSource', 'JDBCSystemResource')
cd('JDBCSystemResource/myDataSource/JdbcResource/myDataSource')
create('myJdbcDriverParams','JDBCDriverParams')
cd('JDBCDriverParams/NO_NAME_0')
set('DriverName','org.apache.derby.jdbc.ClientDriver')
set('URL','jdbc:derby://localhost:1527/db;create=true')
set('PasswordEncrypted', 'PBPUBLIC')
set('UseXADataSourceInterface', 'false')
create('myProps','Properties')
cd('Properties/NO_NAME_0')
create('user', 'Property')
cd('Property/user')
cmo.setValue('PBPUBLIC')

cd('/JDBCSystemResource/myDataSource/JdbcResource/myDataSource')
create('myJdbcDataSourceParams','JDBCDataSourceParams')
cd('JDBCDataSourceParams/NO_NAME_0')
set('JNDIName', java.lang.String("myDataSource_jndi"))

cd('/JDBCSystemResource/myDataSource/JdbcResource/myDataSource')
create('myJdbcConnectionPoolParams','JDBCConnectionPoolParams')
cd('JDBCConnectionPoolParams/NO_NAME_0')
set('TestTableName','SYSTABLES')

#=======================================================================================
# Target resources to the servers. 
#=======================================================================================

cd('/')
assign('JMSServer', 'myJMSServer', 'Target', 'AdminServer')
assign('JMSSystemResource.SubDeployment', 'myJmsSystemResource.myQueueSubDeployment', 'Target', 'myJMSServer')
assign('JDBCSystemResource', 'myDataSource', 'Target', 'AdminServer')

#=======================================================================================
# Write the domain and close the domain template.
#=======================================================================================

setOption('OverwriteDomain', 'true')
writeDomain('/home/weblogic/Oracle/Middleware/wlserver/../user_projects/domains/basicWLSDomain')
closeTemplate()

#=======================================================================================
# Exit WLST.
#=======================================================================================

exit()
```

可以按需修改的配置：

1、修改默认端口7001：

```bash
cd('Servers/AdminServer')
set('ListenAddress','')
set('ListenPort', 7001)
```

2、设置 weblogic 控制台的登录密码：

```bash
cd('/')
cd('Security/base_domain/User/weblogic')
cmo.setPassword('weblogic123')
```

配置修改完成后，加载一下 weblogic 的环境变量文件：

```bash
source /home/weblogic/Oracle/Middleware/wlserver/server/bin/setWLSEnv.sh
```

然后执行创建命令：

```bash
/home/weblogic/Oracle/Middleware/wlserver/common/bin/wlst.sh /home/weblogic/response_files/create_domain.py
```

正常的输出如下：

```bash
weblogic@weblogic:~$ /home/weblogic/Oracle/Middleware/wlserver/common/bin/wlst.sh /home/weblogic/response_files/create_domain.py
WARNING: This is a deprecated script. Please invoke the wlst.sh script under oracle_common/common/bin.

Initializing WebLogic Scripting Tool (WLST) ...

Welcome to WebLogic Server Administration Scripting Shell

Type help() for help on available commands



Exiting WebLogic Scripting Tool.
```

## 5. 启动服务

进入启动脚本目录：

```bash
cd /home/weblogic/Oracle/Middleware/user_projects/domains/basicWLSDomain/bin
```

启动服务：

```bash
sh startWebLogic.sh
```

然后就可以访问控制台，输入地址：http://ip:7001/console 就可以登录。


![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202405261732583.png)


验证没问题后，可以在后台启动服务：

```bash
nohup sh startWebLogic.sh &
```