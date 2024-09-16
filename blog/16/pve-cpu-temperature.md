# PVE系统在概要中显示CPU温度的方法

最近我的PVE上的虚拟机频繁重启，甚至PVE自身也会重启或者死机。经过一番排除法的验证，我发现是由于小主机的CPU温度过高，导致服务器触发自我保护，所以重启了系统。于是我决定让PVE显示CPU温度信息。


## 我的需求

首先需要说明的是，PVE系统自身是不会收集硬件温度信息的，所以也就不会显示这些信息，而我要做的就是让它收集并显示出来，配置之后的效果如下：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404061630210.png)

需要注意的是，由于每个人的硬件不同，所以收集到的信息也不同，那么显示的方式和效果也不同，我这里就是要说清楚这三个问题。

针对这个需求，首先我找了一篇参考文档：[让PVE显示CPU温度](https://zhuanlan.zhihu.com/p/427593880 "让PVE显示CPU温度")，这个文档很有用，但是并不能照搬，因为这个文档没有讲清楚配置的原理，所以拿着文档硬抄的大概率就是不行的。

## 配置步骤

### 安装sensors

sensors是一个用来显示Linux硬件温度的软件，执行安装命令：

```shell
apt install lm-sensors -y
```

如果没有安装到，可能是要配置源，或者更新源，网上随便一搜就知道

### 执行sensors

安装完成后，执行命令探测（所有的选择都输入y，最后一个enter）：

```shell
sensors-detect
```

然后执行 `sensors ` 命令就可以显示硬件温度信息：

```shell
root@pve:~# sensors
iwlwifi_1-virtual-0
Adapter: Virtual device
temp1:            N/A  

nvme-pci-0300
Adapter: PCI adapter
Composite:    +57.9°C  (low  = -273.1°C, high = +81.8°C)
                       (crit = +84.8°C)
Sensor 1:     +57.9°C  (low  = -273.1°C, high = +65261.8°C)
Sensor 2:     +60.9°C  (low  = -273.1°C, high = +65261.8°C)

amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:        1.36 V  
vddnb:       731.00 mV 
edge:         +57.0°C  
PPT:          17.00 W  

k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +66.8°C  
```

但是重点来了，由于个人的硬件不同，这里显示的内容其实是不尽相同的，就比如我看到的文章都是有显示CPU的每个核心的温度，但是我这里并没有显示。


### 采集温度信息

能查询到温度信息后，现在需要修改文件 /usr/share/perl5/PVE/API2/Nodes.pm 来收集 `sensors` 命令的返回信息。直接打开文件，然后搜索 `shared => $meminfo->{memshared}` 找到如下位置，并在下面插入一行（注意里面不要有注释）：

```js
$res->{ksm} = {
    shared => $meminfo->{memshared},
};
$res->{sensinfo} = `sensors`;
```

这个文件的作用就是使用命令 `sensors` 去采集硬件信息，然后传递给变量 `sensinfo`，也就是说现在 `sensinfo` 的内容其实就是我们查询到的信息，这个变量后续会用到。

### 提取温度信息

由于我们执行 `sensors` 命令显示的信息很多，而且每个人的电脑上面看到的结果也大概率不同，但是我们大概能判断哪些是温度信息，并且可以自己查一下分别是什么硬件的温度。

此时我们就需要把温度信息提取出来了。这里可以分享一下我自己的方法（独家方法，完全是自己临时想的，而且很有效）：因为后续我们要展示信息的时候是使用的js文件，也就是js语法，所以可以直接在浏览器的控制台去调试，提取自己想要的温度信息。

首先，打开任意页面的控制台，然后把使用命令 `sensors`查询的所有信息复制出来，放到控制台并赋值给变量 `value`，就像这样（注意使用代码符号括起来）：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404061652533.png)

然后我们使用js语法来分别把不同的温度赋值给一个变量，就比如cpu的温度：

```js
const ssd = value.match(/Composite:.*?\+([\d\.]+)?/)[1];
const ssd1 = value.match(/Sensor 1:.*?\+([\d\.]+)?/)[1];
const ssd2 = value.match(/Sensor 2:.*?\+([\d\.]+)?/)[1];
const gpu = value.match(/edge:.*?\+([\d\.]+)?/)[1];
const cpu = value.match(/Tctl:.*?\+([\d\.]+)?/)[1];
```

继续在控制台输入上面的语法，上面就是js使用正则去提取信息的方式，所以需要根据自己查询的信息，去调整这里的正则和变量。你完全可以在控制台中去调试每个你想要拿到的温度信息，就像我这样：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404061656846.png)

当你调试OK，拿到你想要的所有信息之后，再继续下一步。

### 显示温度信息

上面提取温度信息完成后，开始编辑文件 /usr/share/pve-manager/js/pvemanagerlib.js 来将提取的方式和要显示的格式配置到这个js文件中。

首先找到添加的位置，使用搜索关键词 `textField: 'pveversion'` 定位到如下位置，然后添加如下代码：

```js
{
	    itemId: 'version',
	    colspan: 2,
	    printBar: false,
	    title: gettext('PVE Manager Version'),
	    textField: 'pveversion',
	    value: ''
	},  // 下面一块是新增的，这里的逗号不要漏掉
{
    itemId: 'sensinfo',
    colspan: 2,
    printBar: false,
    title: gettext('CPU温度'),
    textField: 'sensinfo',
    renderer:function(value){
        const ssd = value.match(/Composite:.*?\+([\d\.]+)?/)[1];
        const ssd1 = value.match(/Sensor 1:.*?\+([\d\.]+)?/)[1];
        const ssd2 = value.match(/Sensor 2:.*?\+([\d\.]+)?/)[1];
        const gpu = value.match(/edge:.*?\+([\d\.]+)?/)[1];
        const cpu = value.match(/Tctl:.*?\+([\d\.]+)?/)[1];
        return `CPU: ${cpu}°C | GPU: ${gpu}°C | SSD: ${ssd}°C [SSD1: ${ssd1}°C | SSD2: ${ssd1}°C]`
    	}, //注意这里的逗号
	}, //结尾的逗号
```

我们来注释并分析一下这个新增的代码是在干嘛：

```js
{
    itemId: 'sensinfo',  //不用动，这是之前修改的那个文档中添加的采集变量
    colspan: 2, //不用动
    printBar: false, //不用动
    title: gettext('CPU温度'),//不用动，显示标题，可以按需改
    textField: 'sensinfo',//不用动
    renderer:function(value){
        const ssd = value.match(/Composite:.*?\+([\d\.]+)?/)[1];
        const ssd1 = value.match(/Sensor 1:.*?\+([\d\.]+)?/)[1];
        const ssd2 = value.match(/Sensor 2:.*?\+([\d\.]+)?/)[1];
        const gpu = value.match(/edge:.*?\+([\d\.]+)?/)[1];
        const gpu_ppt = value.match(/PPT:\s*([\d.]+)/)[1];
        const cpu = value.match(/Tctl:.*?\+([\d\.]+)?/)[1];
        return `CPU: ${cpu}°C | GPU: ${gpu}°C ${gpu_ppt}W | SSD: ${ssd}°C [Sensor1: ${ssd1}°C | Sensor2: ${ssd1}°C]`
    },
},
```

这里的关键就是这个 `renderer` 函数返回的内容，也就是最后显示的内容，看这个js的内容，`value` 这个参数就是我们使用 `sensors` 命令获取到的所有信息，而下面各种 match 就是去提取信息，所以为什么前面我让在浏览器中调试这些信息的提前，就是为了调试好每个输出的信息。

最后返回了一个字符串，这个里面类似 `${cpu}` 就是js语法，使用前面定义的变量去替换里面的内容。

::: info 提示

所以，编写这个文件的内容的时候千万不要无脑复制粘贴，要结合自己查询的信息去调试提取（无非就是改一下正则而已），然后把自己想要显示的内容显示出来。
:::

文件修改后重启服务：

```shell
systemctl restart pveproxy
```

刷新pve的概要页面，如果正常就能显示出温度信息，如果没有显示，一直在加载，那说明你的语法有错误，可以检查一下前后逗号是否漏了，其他语法可以在控制台或者你自己的node环境调试。

## 总结

通过这个让 PVE 显示温度的过程，可以非常清晰的了解 PVE 显示额外信息的原理，主要就是两个地方的操作：

1. 修改 `/usr/share/perl5/PVE/API2/Nodes.pm` 文件，添加要执行的采集命令（我甚至觉得这里可以执行脚本来进行更复杂的采集操作，待求证）
2. 修改 `/usr/share/pve-manager/js/pvemanagerlib.js` 文件来从采集命令的输出中提取要显示的信息，然后显示出来，这里是完全的 `js` 语法，所以可以在本地进行调试。
3. 修改完上述两个文件后，重启服务即可 `systemctl restart pveproxy`

## 拓展配置

### 将 PVE 温度显示到 Grafana 面板

我使用 Go 编写了一个 Prometheus 的采集插件，可以将 PVE 的温度和功率等信息采集成指标数据，然后配置到 Grafana 面板中可视化展示。

具体可以见博文：[自定义Prometheus指标采集插件，采集并显示PVE系统的温度和功率](https://tendcode.com/subject/article/prometheus-exporter-plugin-for-PVE/ "自定义Prometheus指标采集插件，采集并显示PVE系统的温度和功率")
