# Tomcat 9 安装部署

最近在搞持续部署，涉及到的系统大部分都是 Java 项目，但是使用的应用服务器中间件不尽相同，主要分为以下几种：weblogic、Tomcat、东方通TongWeb、宝兰德BES，本篇文章记录一下安装 Tomcat 9 的操作，并解决安装过程中遇到的一些问题。

## 选择 Tomcat 版本

选择 Tomcat 版本是一个很重要的操作，因为 Tomcat 的不同版本对环境有不同的要求，特别是对 Java 版本的要求，具体可以看官网给出的[版本要求](https://tomcat.apache.org/whichversion.html "版本要求")

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061735590.png)

基于我的 Java 版本是 1.8.0_411，所以我可以选择的 Tomcat 版本就是9。

其实最开始我没有看版本要求的时候是安装过10的版本，后来启动的时候报错，具体错误信息如下：

```text
Unrecognized option: --add-opens=java.base/java.lang=ALL-UNNAMED
Error: Could not create the Java Virtual Machine.
Error: A fatal exception has occurred. Program will exit.
```

通过搜索发现是 Java 版本不支持的特性参数导致的，因此我才将版本切换成 Tomcat 9。

## 安装 Tomcat

### 1. 配置 Java 环境

安装和配置 Java 环境的操作博客有，不再重复说明，检查方式就是：

```bash
java -version
```

### 2. 下载 Tomcat

直接到官网下载指定版本就行，下载 tar.gz 的包。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061742874.png)

执行下载命令：

```bash
wget https://dlcdn.apache.org/tomcat/tomcat-9/v9.0.89/bin/apache-tomcat-9.0.89.tar.gz
```

### 3. 解压并安装 Tomcat

将 Tomcat 包解压到指定目录，比如 /opt下面:

```bash
tar -zxvf apache-tomcat-9.0.89.tar.gz -C /opt/
```

然后重命名解压后的目录名称：

```bash
mv apache-tomcat-9.0.89/ tomcat
```

### 4. 创建 tomcat 用户

创建 tomcat 用户的操作不是必须的，如果可以，使用 root 用户运行也是没问题的。

```bash
sudo groupadd tomcat
sudo useradd -g tomcat -s /bin/bash -m tomcat
sudo passwd tomcat

```

给予 tomcat 用户目录权限：

```bash
chown -R tomcat:tomcat /opt/tomcat
```

### 5. 启动 Tomcat

切换到 tomcat 用户:

```bash
su tomcat
```

然后启动服务：

```bash
sh /opt/tomcat/bin/startup.sh
```

可以看到如下输出：

```text
tomcat@weblogic:/opt/tomcat/bin$ sh /opt/tomcat/bin/startup.sh 
Using CATALINA_BASE:   /opt/tomcat
Using CATALINA_HOME:   /opt/tomcat
Using CATALINA_TMPDIR: /opt/tomcat/temp
Using JRE_HOME:        /usr/jvm/jdk1.8.0_411/jre
Using CLASSPATH:       /opt/tomcat/bin/bootstrap.jar:/opt/tomcat/bin/tomcat-juli.jar
Using CATALINA_OPTS:   
Tomcat started.
```

但是这种输出不一定表示正常，此时应该检查一下 8080 端口是否正常监听，只有端口正常监听才算正常启动，如果没有监听端口，可以去查看日志，日志文件为 /opt/tomcat/logs/catalina.out

## 安装后操作

### 登录 Tomcat

启动完成之后可以访问默认的 8080 端口，进入 Tomcat 页面：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061755463.png)

此时点击“Manager App”可以进入管理页面，但是会提示如下内容：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061800663.png)

这里我是有两个问题：

1. 当前IP不是本地IP，因此不允许访问管理页面（因为我不是在本地访问，而是进行了端口转发访问）
2. 没有设置用户信息，需要配置用户信息

先解决第二个问题，因为第二个问题是刚部署都会遇到的问题，需要创建用户信息，方案里面也说到了，就是去编辑 conf/tomcat-users.xml 文件，添加一个管理用户就行，比如我这里创建的角色和用户：

```xml
<role rolename="manager-gui"/>
<user username="tomcat" password="tomcat@123" roles="manager-gui"/>
```

此时如果你是本地访问，那么重启 Tomcat 之后在次进入管理页面，就会让你输入账号密码，此时就可以正常登录。

如果你不是本地访问，那么此处还是会报错，意思是你的IP不是本地的，没有权限访问管理页面，此时需要修改文件为 webapps/manager/META-INF/context.xml，在里面加入可访问IP的匹配模式.

只需要改下面这个字段，这是改之前的内容：

```xml
<Valve className="org.apache.catalina.valves.RemoteAddrValve"
         allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1" />
```

这是改之后的，就是添加规则：

```xml
<Valve className="org.apache.catalina.valves.RemoteAddrValve"
         allow="127\.\d+\.\d+\.\d+|::1|0:0:0:0:0:0:0:1|192\.\d+\.\d+\.\d+|100\.\d+\.\d+\.\d+" />
```

我这里加了192开头和100开头的IP地址，此时再次重启服务，就可以登录管理页面了。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061809316.png)

::: tip

📘 **提示**

这种访问没有权限的错误提醒不仅仅是管理页面会遇到，其他的应用也会遇到，都是使用相同的方式，去每个应用下面的 context.xml 文件中添加可访问的IP规则。

:::

### 设置成系统服务

手动启动没有问题之后，可以将 Tomcat 设置成系统服务，方便管理。

使用 root 创建系统服务文件:

```bash
vi /etc/systemd/system/tomcat.service
```

内容如下（这里需要根据实际修改JAVA_HOME路径）：

```bash
[Unit]
Description=Apache Tomcat Web Application Container
After=network.target

[Service]
Type=forking

User=tomcat
Group=tomcat

Environment="JAVA_HOME=/usr/jvm/jdk1.8.0_411"
Environment="CATALINA_PID=/opt/tomcat/temp/tomcat.pid"
Environment="CATALINA_HOME=/opt/tomcat"
Environment="CATALINA_BASE=/opt/tomcat"
Environment="CATALINA_OPTS=-Xms512M -Xmx1024M -server -XX:+UseParallelGC"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom"

ExecStart=/opt/tomcat/bin/startup.sh
ExecStop=/opt/tomcat/bin/shutdown.sh

[Install]
WantedBy=multi-user.target
```

然后启动服务：

```bash
systemctl daemon-reload
systemctl start tomcat
systemctl status tomcat

#设置成自启动
systemctl enable tomcat
```

## 部署应用

### 上传 war 包部署

直接登录管理页面操作，上面war包就行

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061824202.png)

部署完成就可以看到应用状态

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061825631.png)

war 包的名称就是应用的前缀，此时可以通过前缀和应用本身的路由访问应用，比如我的应用的 web.xml 内容是：

```xml
<!DOCTYPE web-app PUBLIC "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN" "http://java.sun.com/dtd/web-app_2_3.dtd">
<web-app>
  <servlet>
    <servlet-name>HelloServlet</servlet-name>
    <servlet-class>com.example.HelloServlet</servlet-class>
  </servlet>
  <servlet-mapping>
    <servlet-name>HelloServlet</servlet-name>
    <url-pattern>/hello-world</url-pattern>
  </servlet-mapping>
</web-app>
```

此时访问应用前缀加上路由就可以访问应用：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061828376.png)

### 使用服务器上目录或 war 包部署

除了手动上传 war 包部署，还可以直接使用服务器上面的 war 包或者目录进行部署，并且可以指定 context，也就是前缀，使用前面上传的 war 包再部署一个应用也是可以的。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406061831022.png)