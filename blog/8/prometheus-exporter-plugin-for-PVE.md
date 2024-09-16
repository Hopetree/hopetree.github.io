# 自定义Prometheus指标采集插件，采集并显示PVE系统的温度和功率

之前在搞 PVE 的时候分享过怎么采集 PVE 的温度并把温度显示到 PVE 的摘要中，但是温度都是实时的，无法记录历史数据。这次借着 Prometheus 指标采集插件的学习的机会，我用 Go 写了一个指标采集插件，把 PVE 的温度和功率采集并显示到 Grafana 看板中。

## Grafana 显示效果

先直接看 Grafana 显示效果：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406260908066.png)

这里是自定义的一个看板，只显示两个采集指标，分别是 PVE 的 CPU 温度和功率。

## 自定义采集插件

### 1. 指标采集的方式

我这里主要是采集两个指标，其他系统相关的指标就不需要自己采集了，官方的 `node_exporter` 插件采集的指标已经非常丰富。这两个指标分别为：

- `cpu_temperature_celsius`：CPU 温度
- `power_usage_watts`：功率

采集的方式之前写过的文章 [PVE系统在概要中显示CPU温度的方法](https://tendcode.com/subject/article/pve-cpu-temperature/ "PVE系统在概要中显示CPU温度的方法") 中已经提到过，就是通过安装和执行 `sensors ` 命令，然后使用正则表达式采集。

`sensors ` 命令的返回数据如下：

```bash
iwlwifi_1-virtual-0
Adapter: Virtual device
temp1:            N/A  

nvme-pci-0300
Adapter: PCI adapter
Composite:    +58.9°C  (low  = -273.1°C, high = +81.8°C)
                       (crit = +84.8°C)
Sensor 1:     +58.9°C  (low  = -273.1°C, high = +65261.8°C)
Sensor 2:     +62.9°C  (low  = -273.1°C, high = +65261.8°C)

amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:        1.39 V  
vddnb:       743.00 mV 
edge:         +58.0°C  
PPT:          16.00 W  

k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +68.2°C 
```

温度指标为 `Tctl:         +68.2°C `，需要使用正则提取 68.2；功率指标数据为 `PPT:          16.00 W`，需要使用正则提取 16.00。

### 2. 开发采集插件

采集插件可以使用多种语言，Prometheus 官方提供了好几种语言的 SDK，比如 Python 和 Go，为了保持跟官方插件的运行方式一致，我这里采用 Go 来编写采集插件。

开发文档查看：[INSTRUMENTING A GO APPLICATION FOR PROMETHEUS](https://prometheus.io/docs/guides/go-application/ "INSTRUMENTING A GO APPLICATION FOR PROMETHEUS")

直接查看代码 `main.go`：

```go
package main

import (
	"bytes"
	"fmt"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"net/http"
	"os/exec"
	"regexp"
	"strconv"
	"time"
)

// 将要注册的指标定义为全局变量
var (
	cpuTemperature = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "cpu_temperature_celsius",
		Help: "Current temperature of the CPU in degrees Celsius",
	})
	powerUsage = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "power_usage_watts",
		Help: "Current power usage in watts",
	})
)

func initCustomRegistry() *prometheus.Registry {
	// 创建一个新的注册表
	reg := prometheus.NewRegistry()
	// 注册自定义指标
	reg.MustRegister(cpuTemperature)
	reg.MustRegister(powerUsage)
	return reg
}

// executeCommand 执行给定的 shell 命令并返回执行结果
func executeCommand(cmd string) (string, error) {
	// 创建一个新的命令
	command := exec.Command("bash", "-c", cmd)

	// 捕获命令的标准输出和错误输出
	var out bytes.Buffer
	var stderr bytes.Buffer
	command.Stdout = &out
	command.Stderr = &stderr

	// 运行命令
	err := command.Run()
	if err != nil {
		return "", err
	}

	return out.String(), nil
}

// getInfoByRegexp 使用正则提取信息
func getInfoByRegexp(input, pattern string) (string, error) {
	// 定义匹配
	re := regexp.MustCompile(pattern)

	// 查找匹配项
	match := re.FindStringSubmatch(input)

	// 如果找到匹配项，返回第一个捕获组的内容
	if len(match) > 1 {
		str := match[1]
		return str, nil
	}

	// 如果没有找到匹配项，返回错误
	return "", fmt.Errorf("no info found")
}

// recordMetrics 可以每个指标一个单独的 Goroutine 来采集
func recordMetrics() {
	go func() {
		for {
			var temperature, power float64

			output, err := executeCommand("sensors")
			if err != nil {
				fmt.Println(err)
			}

			temperatureStr, err := getInfoByRegexp(output, `Tctl:\s*\+([0-9.]+)°C`)
			powerStr, err := getInfoByRegexp(output, `PPT:\s*([0-9.]+)\s*W`)

			temperature, err = strconv.ParseFloat(temperatureStr, 64)
			power, err = strconv.ParseFloat(powerStr, 64)

			cpuTemperature.Set(temperature)
			powerUsage.Set(power)

			// 休眠 10 秒
			time.Sleep(10 * time.Second)
		}
	}()
}

func main() {
	// 创建自定义注册表并注册指标
	reg := initCustomRegistry()

	// 开始记录指标
	recordMetrics()

	// 使用自定义注册表创建 HTTP 处理器
	http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))
	_ = http.ListenAndServe(":9010", nil)

}


```

关于指标数据的采集逻辑就不做过多的说明了，这里主要是说一下指标的定义、注册和值的更新：

- **指标定义**：指标的定义可以统一放到全局变量中，定义指标的 `key` 和说明，这样可以保持跟官方的指标一致
- **指标注册**：为了只显示自己定义的指标，这里使用自定义的指标注册器，而不是内置的指标注册器
- **指标采集**：每个指标可以单独定义一个函数启动一个 `goruntine` 去执行，这样可以让每个指标的采集异步执行，也可以把同类指标放到一起采集，比如我上面的温度和功率，由于都是使用正则从命令行返回中提取，所以直接放到一起反而比分开好

### 3. 运行和配置插件

#### 3.1 下载安装包

插件已经被我上传到 github 上面，可以自动编译，可以下载最新版本：[https://github.com/Hopetree/pve_exporter/releases](https://github.com/Hopetree/pve_exporter/releases "https://github.com/Hopetree/pve_exporter/releases")

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251722861.png)

下载命令：

```bash
wget https://github.com/Hopetree/pve_exporter/releases/download/v0.0.4/pve_exporter_0.0.4_linux_x86_64.tar.gz
```

#### 3.2 解压并运行插件

解压包：

```bash
tar -zxvf pve_exporter_0.0.4_linux_x86_64.tar.gz
mv pve_exporter_0.0.4_linux_x86_64 pve_exporter
```

运行插件：

```bash
nohup ./pve_exporter &
```

#### 3.3 验证指标

插件启动后，访问本地 http://localhost:9010/metrics 即可查看到指标数据，指标数据如下：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406260854013.png)

### 4. Prometheus 对接插件

首先去 Prometheus 配置文件 `prometheus/prometheus.yml ` 中添加指标采集任务 `pve_exporter`，添加后完整配置大概如下：

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  - job_name: 'node'
    static_configs:
      - targets: ['192.168.0.202:9100']
  - job_name: 'pve_exporter'
    static_configs:
    - targets: ['192.168.0.254:9010']
```

然后重启 Prometheus 服务即可。

此时在Prometheus 的 Targets 中可以查看到新增的节点信息：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251733258.png)

然后可以查询指标信息：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251735195.png)

## Grafana 配置可视化图表

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251738261.png)

添加可视化：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251738642.png)

选择数据源为 prometheus：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251739829.png)

选择指标，并命令一个图表，然后 Apply 保存图表：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251742810.png)

添加两个指标图表后，保存看板：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202406251743141.png)