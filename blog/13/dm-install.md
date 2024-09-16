# Linux安装DM（达梦）数据库

本文演示环境如下：

| 项目  |  值 |
| ------------ | ------------ |
| 操作系统  |CentOS7    |
| CPU   |  x86_64 架构 |
|  安装包 |  [dm8_20230418_x86_rh6_64.iso](https://eco.dameng.com/download/?_blank "dm8_20230418_x86_rh6_64.iso") |
|  DM安装路径 | /usr/local/dm8  |
|数据文件路径|/data/dm8|

信创环境安装部署也可以参考此篇文章，但需注意根据 CPU 和操作系统调整对应的 DM 数据库版本。

## 安装前准备

### 新建 dmdba 用户

::: warning 注意

安装前必须创建 dmdba 用户，禁止使用 root 用户安装数据库。
:::

创建用户组和用户，命令如下：

```bash
groupadd dinstall
useradd -g dinstall -m -d /home/dmdba -s /bin/bash dmdba
```

### 挂载镜像

切换到 root 用户，将 DM 数据库的 iso 安装包保存在任意位置，例如 /tmp 目录下，执行如下命令挂载镜像：

```bash
mount -o loop /tmp/dm8_20230418_x86_rh6_64.iso /mnt
```

### 新建安装目录并设置权限

创建安装目录和数据目录，并给dmdba添加权限。命令如下：

```bash
mkdir -p /usr/local/dm8 /data/dm8
chown dmdba:dinstall -R /usr/local/dm8 /data/dm8
chmod -R 755 /usr/local/dm8 /data/dm8
```

## 数据库安装

### 命令行安装

切换至 dmdba 用户下，在 /mnt 目录下使用命令行安装数据库程序，依次执行以下命令安装 DM 数据库。

```bash
su - dmdba
cd /mnt/
./DMInstall.bin -i
```

按需求选择安装语言，默认为中文。本地安装选择【不输入 Key 文件】，选择【默认时区 21】。

选择【1-典型安装】，按已规划的安装目录 /usr/local/dm8 完成数据库软件安装，不建议使用默认安装目录。

数据库安装完成后，需要切换至 root 用户执行命令 /usr/local/dm8/script/root/root_installer.sh 创建 DmAPService，否则会影响数据库备份。

```bash
sh /usr/local/dm8/script/root/root_installer.sh
```

### 配置环境变量

进入/home/dmdba/并编辑.bash_profile文件追加如下配置：

```bash
echo 'export PATH=$PATH:$DM_HOME/bin:$DM_HOME/tool' >> /home/dmdba/.bash_profile
```

切换至 dmdba 用户下，执行以下命令，使环境变量生效。

```bash
su - dmdba
source ~/.bash_profile
```

## 配置实例

使用 dmdba 用户配置实例，进入到 DM 数据库安装目录下的 bin 目录中，使用 dminit 命令初始化实例。

dminit 命令可设置多种参数，可执行如下命令查看可配置参数。

```bash
/usr/local/dm8/bin/dminit path=/data/dm8 PAGE_SIZE=32 EXTENT_SIZE=32 CASE_SENSITIVE=y CHARSET=1 DB_NAME=DAMENG INSTANCE_NAME=DBSERVER PORT_NUM=5236
```

## 注册服务

注册服务需使用 root 用户进行注册。使用 root 用户进入数据库安装目录的 /script/root 下，如下所示：

```bash
cd /usr/local/dm8/script/root
```

注册服务，如下所示：

```bash
./dm_service_installer.sh -t dmserver -dm_ini /data/dm8/DAMENG/dm.ini -p DMSERVER
```

## 启动、停止数据库

服务注册成功后，启动数据库，如下所示：

```bash
systemctl start DmServiceDMSERVER.service
```

停止数据库，如下所示：

```bash
systemctl stop DmServiceDMSERVER.service
```

重启数据库，如下所示：

```bash
systemctl restart DmServiceDMSERVER.service
```

## 一键安装脚本

DM还可以使用XML文件进行安装，首先需要创建一个XML文件`/tmp/dminstall.xml` ：

```xml
<?xml version="1.0"?>
<DATABASE>
    <!--安装数据库的语言配置，安装中文版配置 ZH，英文版配置 EN，不区分大小写。不允许为空。-->
    <LANGUAGE>EN</LANGUAGE>
    <!--安装程序的时区配置，默认值为+08:00，范围：-12:59 ~ +14:00 -->
    <TIME_ZONE>+08:00</TIME_ZONE>
    <!-- key 文件路径 -->
    <KEY/>
    <!--安装程序组件类型，取值 0、1、2，0 表示安装全部，1 表示安装服务器，2 表示安装客户端。默认为 0。 -->
    <INSTALL_TYPE>0</INSTALL_TYPE>
    <!--安装路径，不允许为空。 -->
    <INSTALL_PATH>/usr/local/dm8</INSTALL_PATH>
    <!--是否初始化库，取值 Y/N、y/n，不允许为空。 -->
    <INIT_DB>Y</INIT_DB>
    <!--数据库实例参数 -->
    <DB_PARAMS>
        <!--初始数据库存放的路径，不允许为空 -->
        <PATH>/data/dm8</PATH>
        <!--初始化数据库名字，默认是 DAMENG，不超过 128 个字符 -->
        <DB_NAME>DAMENG</DB_NAME>
        <!--初始化数据库实例名字，默认是 DMSERVER，不超过 128 个字符 -->
        <INSTANCE_NAME>DMSERVER</INSTANCE_NAME>
        <!--初始化时设置 dm.ini 中的 PORT_NUM，默认 5236，取值范围：1024~65534 -->
        <PORT_NUM>5236</PORT_NUM>
        <!--初始数据库控制文件的路径，文件路径长度最大为 256 -->
        <CTL_PATH/>
        <!--初始数据库日志文件的路径，文件路径长度最大为 256 -->
        <LOG_PATHS>
            <LOG_PATH/>
        </LOG_PATHS>
        <!--数据文件使用的簇大小，只能是 16 页或 32 页之一，缺省使用 16 页 -->
        <EXTENT_SIZE>16</EXTENT_SIZE>
        <!--数据文件使用的页大小，缺省使用 8K，只能是 4K、8K、16K 或 32K 之一 -->
        <PAGE_SIZE>8</PAGE_SIZE>
        <!--日志文件使用的簇大小，默认是 256，取值范围 64 和 2048 之间的整数 -->
        <LOG_SIZE>256</LOG_SIZE>
        <!--标识符大小写敏感，默认值为 Y。只能是’Y’, ’y’, ’N’, ’n’, ’1’, ’0’之一 -->
        <CASE_SENSITIVE>Y</CASE_SENSITIVE>
        <!--字符集选项，默认值为 0。0 代表 GB18030,1 代表 UTF-8,2 代表韩文字符集 EUC-KR-->
        <CHARSET>1</CHARSET>
        <!--设置为 1 时，所有 VARCHAR 类型对象的长度以字符为单位，否则以字节为单位。默认值为 0。 -->
        <LENGTH_IN_CHAR>0</LENGTH_IN_CHAR>
        <!--字符类型在计算 HASH 值时所采用的 HASH 算法类别。0：原始 HASH 算法；1：改进的HASH 算法。默认值为 1。 -->
        <USE_NEW_HASH>1</USE_NEW_HASH>
        <!--初始化时设置 SYSDBA 的密码，默认为 SYSDBA，长度在 9 到 48 个字符之间 -->
        <SYSDBA_PWD/>
        <!--初始化时设置 SYSAUDITOR 的密码，默认为 SYSAUDITOR，长度在 9 到 48 个字符之间 -->
        <SYSAUDITOR_PWD/>
        <!--初始化时设置 SYSSSO 的密码，默认为 SYSSSO，长度在 9 到 48 个字符之间，仅在安全版本下可见和可设置 -->
        <SYSSSO_PWD/>
        <!--初始化时设置 SYSDBO 的密码，默认为 SYSDBO，长度在 9 到 48 个字符之间，仅在安全版本下可见和可设置 -->
        <SYSDBO_PWD/>
        <!--初始化时区，默认是东八区。格式为：正负号小时：分钟，范围：-12:59 ~ +14:00-->
        <TIME_ZONE>+08:00</TIME_ZONE>
        <!--是否启用页面内容校验，0：不启用；1：简单校验；2：严格校验(使用 CRC16 算法生成校验码)。默认 0 -->
        <PAGE_CHECK>0</PAGE_CHECK>
        <!--设置默认加密算法，不超过 128 个字符 -->
        <EXTERNAL_CIPHER_NAME/>
        <!--设置默认 HASH 算法，不超过 128 个字符 -->
        <EXTERNAL_HASH_NAME/>
        <!--设置根密钥加密引擎，不超过 128 个字符 -->
        <EXTERNAL_CRYPTO_NAME/>
        <!--全库加密密钥使用的算法名。算法可以是 DM 内部支持的加密算法，或者是第三方的加密算法。默认使用"AES256_ECB"算法加密，最长为 128 个字节 -->
        <ENCRYPT_NAME/>
        <!--指定日志文件是否加密。默认值 N。取值 Y/N，y/n，1/0 -->
        <RLOG_ENC_FLAG>N</RLOG_ENC_FLAG>
        <!--用于加密服务器根密钥，最长为 48 个字节 -->
        <USBKEY_PIN/>
        <!--设置空格填充模式，取值 0 或 1，默认为 0 -->
        <BLANK_PAD_MODE>0</BLANK_PAD_MODE>
        <!--指定 system.dbf 文件的镜像路径，默认为空 -->
        <SYSTEM_MIRROR_PATH/>
        <!--指定 main.dbf 文件的镜像路径，默认为空 -->
        <MAIN_MIRROR_PATH/>
        <!--指定 roll.dbf 文件的镜像路径，默认为空 -->
        <ROLL_MIRROR_PATH/>
        <!--是否是四权分立，默认值为 0(不使用)。仅在安全版本下可见和可设置。只能是 0 或 1-->
        <PRIV_FLAG>0</PRIV_FLAG>
        <!--指定初始化过程中生成的日志文件所在路径。合法的路径，文件路径长度最大为 257(含结束符)，不包括文件名-->
        <ELOG_PATH/>
    </DB_PARAMS>
    <!--是否创建数据库实例的服务，值 Y/N y/n，不允许为空，不初始化数据库将忽略此节点。非 root 用户不能创建数据库服务。 -->
    <CREATE_DB_SERVICE>N</CREATE_DB_SERVICE>
    <!--是否启动数据库，值 Y/N y/n，不允许为空，不创建数据库服务将忽略此节点。 -->
    <STARTUP_DB_SERVICE>N</STARTUP_DB_SERVICE>
</DATABASE>
```

准备好安装包`/tmp/dm8_20230418_x86_rh6_64.iso`和XML文件之后，创建安装脚本`/tmp/dminstall.sh`：

```bash
#!/bin/bash
# *********************** Script Config *************************
ISO_PATH=/tmp/dm8_20230418_x86_rh6_64.iso
INSTALL_XML=/tmp/dminstall.xml
INSTALL_PATH=/usr/local/dm8
DM_DATA_PATH=/data/dm8
# ************************ Script Body **************************

echo ">>> step1：安装前准备"

# 挂载DM8安装ISO
mount -o loop ${ISO_PATH} /mnt

# 创建用户所在的组及用户
# 检查用户是否存在
if id "dmdba" &>/dev/null; then
    echo "用户 'dmdba' 已经存在。"
else
    # 创建用户
    echo "创建用户 'dmdba'"
    groupadd dinstall
    useradd -g dinstall -m -d /home/dmdba -s /bin/bash dmdba
fi


# 创建安装目录
mkdir -p ${INSTALL_PATH} ${DM_DATA_PATH}
chown dmdba:dinstall -R ${INSTALL_PATH} ${DM_DATA_PATH}
chmod -R 755 ${INSTALL_PATH} ${DM_DATA_PATH}

# DM8安装
echo ">>> step2：XML文件DM8安装"
chmod 755 ${INSTALL_XML}
su - dmdba -c "cd /mnt && ./DMInstall.bin -q ${INSTALL_XML}"

# 创建 DmAPService
echo ">>> step2：创建并启动服务"
sh ${INSTALL_PATH}/script/root/root_installer.sh

# 配置环境变量
echo 'export PATH=$PATH:$DM_HOME/bin:$DM_HOME/tool' >> /home/dmdba/.bash_profile
su - dmdba -c "cd /home/dmdba && source .bash_profile"

# 启动DM8服务
cd ${INSTALL_PATH}/script/root || exit
./dm_service_installer.sh -t dmserver -dm_ini ${DM_DATA_PATH}/DAMENG/dm.ini -p DMSERVER
systemctl enable DmServiceDMSERVER.service
systemctl start DmServiceDMSERVER.service
systemctl status DmServiceDMSERVER.service
```

准备好安装包和XML文件之后执行安装脚本即可：

```bash
sh -x /tmp/dminstall.sh
```

## 登录数据库

进入DM安装目录执行命令登录然后输入账号密码（默认为SYSDBA/SYSDBA，如果XML里面单独配置了则使用配置的账号密码）就可以登录数据库：

```bash
[root@host-ip-203 tmp]# cd /usr/local/dm8/bin
[root@host-ip-203 bin]# ./disql
disql V8
username:SYSDBA
password:

Server[LOCALHOST:5236]:mode is normal, state is open
login used time : 13.310(ms)
SQL> 
```