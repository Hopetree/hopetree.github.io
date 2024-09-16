# 【Appium 自动化测试】搭建 Appium 环境踩坑记录

Python 在自动化测试方面也是非常好用的语言，平时我的工作中也会使用 Python 进行自动化测试的工作，包括接口测试，直接使用 requests 库调用接口就行，跟写爬虫一样；还有云服务的 UI 测试，也就是页面的测试，可以使用 selenium 进行，我经常使用 selenium 写爬虫，所以使用起来也是非常顺手；而进行手机 app 的测试，也有相关工具，现在最流行的就是 appium 了，结合 Python 的连接库，就可以进行手机 app 的自动化测试了。

今天这篇文章主要记录一下我在搭建 appium 自动化测试环境中踩过的坑。

## 工具介绍

首先，搭建环境之前，我先来使用一个我随便画的一个不标准的流程图来说明一下我所理解的环境中各个工具的作用，这样可以避免去搭建多余的环境，也不会造成环境很乱。

![appium环境搭建](https://tendcode.com/cdn/article/20200705python-appium.jpg "appium环境搭建")

结合流程图，我来说明一下搭建环境必要的一些工具及每个工具的作用：

1. Appium-Python-Client：是 Python 连接 appium 的第三方库，可以理解为手机端的 selenium
2. Appium：一个服务端，提供本地服务，用来连接手机（我的理解是实际上它是调用了 Android-SDK 的命令行去连接的）
3. Android-SDK：连接手机或者模拟器的工具，这个工具实际上包括两个部分（我的理解），其一是提供 ADB 工具，也就是用来连接手机的桥梁，其二是可以充当模拟器（所以，第二部分的功能其实可以用其他模拟器工具代替）
4. 模拟器或者真机

按照上面我提到的4个部分，现在来安装各个工具，安装工具的顺序建议按照我下面的顺序，因为工具之间有依赖关系，如果不按照顺序去安装会无法保证工具的运行。

## 安装 Android-SDK 

由于 Android-SDK 是依赖 Java 环境的工具，所以在安装 Android-SDK 之前，需要先安装 Java 环境，这个不在本篇文章的说明范围内，如果不会安装的人可以参考我之前的文章 [https://tendcode.com/article/jenkins-slave/](https://tendcode.com/article/jenkins-slave/) 虽然这篇文章讲的是 linux 下面的环境搭建，但是跟 Windows 只是下载的包不同，配置环境变量的方式不同而已，所以可以参考这个文章也可以自行搜索文章配置 Java 环境。检验 Java 环境安装好可以使用命令 `java -version` 有如下输出就是安装和配置好了。

```bash
G:\Mycodes>java -version
java version "1.8.0_144"
Java(TM) SE Runtime Environment (build 1.8.0_144-b01)
Java HotSpot(TM) Client VM (build 25.144-b01, mixed mode)
```

Java 环境搭建好之后就可以下载 Android-SDK 包，参考下载地址(网站中的 SDK Tools) [https://www.androiddevtools.cn/#](https://www.androiddevtools.cn/#) 下载之后放到本地任意目录（不要有中文名，防止未知错误）然后解压即可。解压之后，需要点击 SDK Manager.exe 运行，会得到一个安装各种工具的界面，这个时候就到了选择工具的关键时刻了。这个里面必须安装的工具有两项，看截图

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705tendcode_2020-07-05_19-10-50.png "Android-SDK-tool")

这两个工具是必须安装的，因为里面会包含之前那个流程图里面提到的 ADB 工具，这个工具是最关键的工具绝对不能缺少。如果你要使用 Android-SDK 的模拟器功能，那么你除了安装上述两个工具外，还需要安装至少一个版本的镜像，然后把最后那个工具目录里面的工具全部选取，由于我试过 Android-SDK 自带的模拟器，简直卡的怀疑人生，所以我果断放弃，直接使用其他模拟器，所以这里我只安装了我提到的必装两项。

工具安装完成之后，可以看到 Android-SDK 的目录中多了两个目录，其中包括 platform-tools 目录。现在开始配置环境变量。

首先添加一个新的环境变量 ANDROID_HOME，值就是自己的 Android-SDK 目录，如下

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_19-25-28.png)

然后在环境变量 Path 中添加两个目录路径，如下

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_19-28-36.png)

添加完环境变量之后，可以来验证 Android-SDK 工具是否搭建好，直接在任意目录使用命令行执行 adb 即可，可以看到如下输入即可

```bash
G:\Mycodes>adb
Android Debug Bridge version 1.0.41
Version 29.0.6-6198805
Installed as D:\Program Files (x86)\android-sdk_r24.4.1-windows\android-sdk-windows\platform-tools\adb.exe
```

## 安装模拟器

由于我本身使用的是苹果手机，所以没有真实的 Android 手机来进行测试，但是这不妨碍我做 Android APP 的测试，因为现在有非常多的桌面模拟器可以替代真实手机，而且模拟器其实更适合进行自动化测试，所以使用模拟器才是真正推荐的方式。

模拟器我试用过好几种，包括雷电模拟器、MuMu模拟器，还有蓝叠，最终选择了蓝叠，原因是另外两个模拟器不支持 ARM 的应用，但是大部分 Android APP是只支持 ARM 的，所以这会导致他们虽然可以安装应用，但是会闪退，当然，蓝叠也不是都能支持，只是支持的好像更多。

模拟器的安装就不用多说了，无脑下一步即可，然后创建一个手机出来，这个时候有个关键步骤不能少，那就是开启 ADB 链接，如果不开启，那 ADB 会链接不上的。

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_19-44-10.png)

当你运行一个模拟器之后，可以使用 adb 的命令查看是否连接上了当前模拟器，命令为 `adb devices` ，输出应该是如下

```bash
G:\Mycodes>adb devices
List of devices attached
emulator-5554   device
```

其中 emulator-5554 就是当前检测到的手机，状态必须是 device 才是正常链接，如果是 offline 说明没有启动，这个名称后面需要用到。

## 安装 Appium

appium 工具是一个安装包，建议使用 GitHub 地址下载安装，地址为 [https://github.com/appium/appium-desktop/releases](https://github.com/appium/appium-desktop/releases)

直接按照提示按照完成即可，安装完成之后桌面会多一个紫色的启动图标，可以启动服务，界面如下

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_19-35-30.png)

启动服务没有问题即可。

## 验证环境

上面的工具安装完成之后，其实已经搭建好了 appium 的环境（当然，这时候还没有安装 Python 连接库，还不能使用 Python 进行自动化），我们可以来连接一下手机。

启动 Appium 服务，然后创建一个连接，如图

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_19-53-48.png)

然后添加三个参数，platformName 为 Android 是固定的，因为我们这是 Android 自动化测试，platformVersion 参数可以通过命令查询得到，如下：

```bash
PS C:\Users\HP> adb shell getprop ro.build.version.release
7.1.2
```

deviceName 就是用 adb devices 命令查出来的那个名称(emulator-5554)：

```bash
PS C:\Users\HP> adb devices
List of devices attached
emulator-5554   device
```

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_19-57-24.png)

填完之后，可以启动链接，如果没有报错的话，就可以得到一个调试界面了，这个界面就是可以用来定位 APP 中元素的，类似于浏览器的 F12 功能。

![Android-SDK-tool](https://tendcode.com/cdn/article/20200705/tendcode_2020-07-05_20-01-03.png)

看到没有，这个会映射当前的手机的界面，这样就可以进行调试了，其实到这里，我们的 appium 环境基本就算完成了，剩余的就是跟自己使用的编程语言进行连接的事情了。

## 安装 Appium-Python-Client

Appium-Python-Client 是一个第三方库，类似于 selenium ，同理我们可以把 appium 理解为浏览器的驱动。安装使用 pip 命令即可，这里需要注意一点，如你的 Python 版本是低于 3.6 那你安装这个库只能选择 0.52 的版本而不是最新版本，不然你使用会报错。

```bash
pip install Appium-Python-Client==0.52 
```

然后我们就可以像使用 selenium 一样来使用 appium 了，看一下我下面的简单的代码：

```python
# -*- coding:utf-8 -*-
# Author: https://github.com/Hopetree
# Date: 2020/6/26
from appium import webdriver


caps = {
    "platformName": "Android",
    "platformVersion": "7.1.2",
    "deviceName": "emulator-5554",
    "appPackage": "com.eastmoney.android.fund",
    "appActivity": ".activity.FundSplashActivity",
    "noReset": True
}

driver = webdriver.Remote('http://localhost:4723/wd/hub', caps)
driver.implicitly_wait(10)

driver.find_element_by_id('com.eastmoney.android.fund:id/btn_tab_bottom_3').click()
driver.find_element_by_id('com.eastmoney.android.fund:id/query').click()
driver.find_element_by_id('com.eastmoney.android.fund:id/i_search').click()
driver.find_element_by_xpath('/hierarchy/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.LinearLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.RelativeLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout/android.widget.FrameLayout[1]/android.widget.FrameLayout/android.widget.EditText').send_keys('005585')
```

上面的代码是打开了一个要测试的 APP （天天基金），然后点击到了搜索界面，输入了要搜索的关键词，没有报错的话，你可以看到你的模拟器被控制了，自己打开了 APP 并进行了搜索。

获取 appPackage 和 appActivity 的方法：

1. 首先在虚拟机中运行对应的软件
2. 执行 adb 命令查询当前运行软件的信息

下面这个是获取抖音APP 的信息：

```bash
PS C:\Users\HP> adb shell "dumpsys activity|grep mFocusedActivity"
  mFocusedActivity: ActivityRecord{e83a678 u0 com.ss.android.ugc.aweme/.splash.SplashActivity t4}
```

对应的抖音连接信息如下：

```python
caps = {
    "platformName": "Android",
    "platformVersion": "7.1.2",
    "deviceName": "emulator-5554",
    "appPackage": "com.ss.android.ugc.aweme",
    "appActivity": ".splash.SplashActivity",
    "noReset": True
}
```


总结：到这里，本篇文章的内容就结束了，本篇主要记录 appium 环境的搭建，不详细介绍如何进行自动化测试。之所以网上有很多相关的文章我还要自己记录一篇是因为我发现很多文章都写了要安装一些工具，但是不写为什么要安装这个，而且文章写得安装的工具不同，这就导致很多人分不清应该按照哪个来，所以我主要写明了每个工具的作用，所以有的工具是可以被其他工具取代的，有的却不能被取代。以后会找时间更新文章来分享详细的自动化测试的经验。