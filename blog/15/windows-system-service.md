# Windows 系统将 .exe 程序设置为系统服务的方案

我开发了一个 Go 程序，编译成了 Windows 里面的 .exe 程序，然后需要在 Windows 里面启动程序，并在后台运行程序，类似于 Linux 里面 system 服务的概念。本文记录一下这个操作步骤。

## ChatGPT 的方案

关于这个需求，我问过 ChatGPT，它给了我两个方案（先说结论，我使用的方案一）：

### 方案一：使用 nssm

在 Windows 10 中，你可以使用以下步骤将一个命令行程序设置为系统服务：

step1: **创建一个批处理文件：**首先，创建一个批处理文件（.bat 文件），用于启动你的命令行程序。在批处理文件中，编写启动你的程序的命令，例如：

```bat
@echo off
cd "C:\path\to\your\program"
start your_program.exe
```

请确保将 `"C:\path\to\your\program"` 替换为你程序的实际路径，`your_program.exe` 替换为你的程序名称。

step2: **使用 NSSM 安装程序为服务：**下载并安装 NSSM（Non-Sucking Service Manager），这是一个免费的 Windows 服务管理工具。然后，打开命令提示符（以管理员身份运行），执行以下命令：

```bat
nssm install ServiceName "C:\path\to\your\batch_file.bat"
```

其中，`ServiceName` 是你想要设置的服务名称，`"C:\path\to\your\batch_file.bat"` 是你创建的批处理文件的路径。

step3: **配置服务参数：**NSSM 将会提示你配置服务的各种参数，例如启动类型、登录账户等。根据你的需要进行配置。

step4: **启动服务：**完成配置后，你可以使用以下命令启动服务：

```bat
net start ServiceName
```

其中，`ServiceName` 是你设置的服务名称。

通过以上步骤，你就可以将一个命令行程序设置为 Windows 10 的系统服务，并在系统启动时自动运行。

### 方案二：使用 sc

在 Windows 10 中，你也可以使用 `sc` 命令（Service Control Manager）来将一个命令行程序设置为系统服务。以下是使用 `sc` 命令的步骤：

step1: **创建批处理文件：**首先，创建一个批处理文件（.bat 文件），用于启动你的命令行程序。在批处理文件中，编写启动你的程序的命令，例如：

```bat
@echo off
cd "C:\path\to\your\program"
your_program.exe
```

请确保将 `"C:\path\to\your\program"` 替换为你程序的实际路径，`your_program.exe` 替换为你的程序名称。

step2: **安装服务：**打开命令提示符（以管理员身份运行），执行以下命令安装服务：

```bat
sc create ServiceName binPath= "C:\path\to\your\batch_file.bat" start= auto
```

其中，`ServiceName` 是你想要设置的服务名称，`"C:\path\to\your\batch_file.bat"` 是你创建的批处理文件的路径。

step3: **启动服务：**完成安装后，你可以使用以下命令启动服务：

```bat
net start ServiceName
```

其中，`ServiceName` 是你设置的服务名称。

通过以上步骤，你可以使用 Windows 10 自带的 `sc` 命令将一个命令行程序设置为系统服务。

## 我的操作

我首先选择的第二个方案，就是使用 `sc` 命令，因为这个是系统自带的，但是经过验证发现运行程序是没问题的，但是无法将程序启动成系统服务，会报错：

```bat
启动的时候报错：[SC] StartService 失败 1053:

服务没有及时响应启动或控制请求。
```

于是我开始使用 `nssm` 命令，并且成功运行。

### 安装 nssm 软件

官方下载地址：[https://nssm.cc/download](https://nssm.cc/download "https://nssm.cc/download")

下载后解压放到一个目录里面，然后把里面的 nssm.exe 所在目录添加到环境变量中:

![nssm](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404031632143.png)

### 创建启动程序的 bat

创建一个bat文件用来启动程序，例如 gomonitor.bat 文件，内容如下：

```bat
@echo off
cd "D:\GoMonitor_0.1.2_windows_x86_64\GoMonitor_0.1.2_windows_x86_64"
GoMonitor.exe report  -k 9086c1ac926c4f88a84679d6d9b76cb5 -s EAeaIZj6DyYdkxqe3rHDzlyJcfFEPidlUDddto5A0Q2tonH5VClCB7mA0ahHXbzqGkXAwtNjPooou3BLTunlsJS+wPMKHDyZs4rpkgOiMgjVA08jo59QkJTSTjmC6vrM -i 5

```

这个文件点击就会运行我们的程序，但是由于是前台运行，所以命令行窗口不能关闭，此时就需要设置成后台运行。

### 注册并启动系统服务

使用管理员权限新开一个 powershell 窗口，并输入命令注册服务，然后启动服务：


```powershell
PS C:\Windows\system32> nssm install GoMonitor "D:\GoMonitor_0.1.2_windows_x86_64\gomonitor.bat"
Service "GoMonitor" installed successfully!
PS C:\Windows\system32> nssm status GoMonitor
SERVICE_STOPPED
PS C:\Windows\system32> nssm start GoMonitor
GoMonitor: START: 操作成功完成。
PS C:\Windows\system32> nssm status GoMonitor
SERVICE_RUNNING
```

此时也可以查看到自己服务管理里面已经有这个服务，可以在这里进行启停操作：

![gomonitor](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404031632142.png)