# 给 Node Exporter 添加自定义指标 —— 以温度监控为例

在日常服务器监控中，Prometheus + node_exporter 是最常见的组合。
node_exporter 能提供丰富的系统级指标（CPU、内存、磁盘、网络等），但如果我们希望监控 硬件温度、电源功耗或其他定制数据，就需要扩展它的采集能力。

本文将介绍一种无需额外编译或运行新插件的方案：
通过 Textfile Collector 向 node_exporter 添加自定义指标，并以 CPU 温度监控为例。


## 一、传统方案：自定义 Exporter 插件

在一些项目中，我们通常会单独编写一个 Exporter 服务，比如下面这段 Go 代码：

```goland
cpuTemperature = prometheus.NewGauge(prometheus.GaugeOpts{
    Name: "cpu_temperature_celsius",
    Help: "Current temperature of the CPU in degrees Celsius",
})
```

通过执行 sensors 命令获取温度数据，并将结果暴露在一个新的 /metrics 接口上，例如：

http://localhost:9010/metrics

这种方式功能完整、扩展性强，但也存在一些缺点：

- 需要额外运行一个守护进程；
- 要单独暴露端口、配置抓取任务；
- 与 node_exporter 指标体系分离。

对于仅需简单指标（如温度、电压、风扇转速）的场景，这种做法显得过重。


## 二、更优方案：使用 Textfile Collector

Prometheus 官方在 node_exporter 中提供了一个非常实用的扩展接口：
Textfile Collector。

它允许用户通过简单脚本将自定义指标写入一个 .prom 文件，node_exporter 会自动读取并合并到自身的 /metrics 输出中。
这种方式既能保持指标统一，也不需要额外运行任何程序。


## 三、Textfile Collector 原理

node_exporter 启动时，如果指定：

--collector.textfile.directory=/var/lib/node_exporter/textfile_collector

它会在每次采集时读取该目录下所有 .prom 文件。
这些文件的内容遵循 Prometheus 的标准文本格式：

```text
# HELP metric_name 描述信息
# TYPE metric_name gauge
metric_name{label="value"} 数值
```

node_exporter 读取这些内容后，会自动将它们包含到 /metrics 输出中。


## 四、实现步骤：采集 CPU 温度并写入 .prom 文件

### 1. 启用 Textfile Collector

编辑 node_exporter 的启动参数，例如 systemd 配置：

```bash
ExecStart=/usr/local/bin/node_exporter \
  --collector.textfile.directory=/var/lib/node_exporter/textfile_collector
```

重启服务：

```bash
sudo systemctl daemon-reload
sudo systemctl restart node_exporter
```

### 2. 编写温度采集脚本

基于你原来的 Go 采集逻辑（执行 sensors 命令 + 正则提取），我们可以改写成 Shell 版本，并直接输出 Prometheus 格式的数据。

```bash
#!/bin/bash
# /usr/local/bin/collect_temperature.sh

OUT_FILE="/var/lib/node_exporter/textfile_collector/temperature.prom"
TMP_FILE=$(mktemp)

echo "# HELP cpu_temperature_celsius Current CPU temperature in Celsius" > $TMP_FILE
echo "# TYPE cpu_temperature_celsius gauge" >> $TMP_FILE

# 提取温度值
TEMP=$(sensors | grep -E 'Tctl:' | grep -oE '[0-9.]+')
if [[ -z "$TEMP" ]]; then
  TEMP=0
fi

echo "cpu_temperature_celsius $TEMP" >> $TMP_FILE

# 原子写入
mv $TMP_FILE $OUT_FILE
```

赋予执行权限：

```bash
chmod +x /usr/local/bin/collect_temperature.sh
```



### 3. 添加定时任务

通过 crontab 定期执行该脚本：

```bash
* * * * * /usr/local/bin/collect_temperature.sh
```

这样 node_exporter 每次被 Prometheus 拉取时，就会自动包含最新的温度数据。


## 五、验证与效果

访问 node_exporter 的 /metrics：

http://your-server:9100/metrics

搜索：

cpu_temperature_celsius

输出示例：

```text
# HELP cpu_temperature_celsius Current CPU temperature in Celsius
# TYPE cpu_temperature_celsius gauge
cpu_temperature_celsius 47.8
```

Prometheus 和 Grafana 中即可直接使用该指标绘图、告警或统计。


## 六、指标文件格式说明

使用 Textfile Collector 添加自定义指标时，每个 .prom 文件必须遵循 Prometheus 的文本格式规范，以确保 node_exporter 能正确读取和上报。主要要求如下：

### 1. 文件扩展名与编码

- 文件扩展名必须为 .prom
- 文件应使用 UTF-8 编码的纯文本

### 2. 指标块结构

每个指标通常包含三部分：

```text
# HELP <metric_name> <description>
# TYPE <metric_name> <type>
<metric_name>{<labels>} <value> [timestamp]
```

格式说明：

```text
# HELP：指标说明，可选但推荐
# TYPE：指标类型，可选但推荐，常用类型：
gauge：可增可减（如温度、CPU 使用率）
counter：只增不减（如请求总数）
<metric_name>：指标名，必须符合 Prometheus 命名规范
{<labels>}：可选标签，键值对形式，多个用逗号分隔
<value>：数值，整数或浮点数
[timestamp]：可选时间戳，一般省略
```

### 3. 命名规范

- 指标名全部小写，使用下划线分隔
- 单位后缀建议规范化，如 _celsius, _bytes, _seconds
- 标签名小写，标签值用双引号包裹

### 4. 示例

```text
# HELP system_cpu_temperature_celsius CPU temperature
# TYPE system_cpu_temperature_celsius gauge
system_cpu_temperature_celsius 48.5

# HELP system_disk_temperature_celsius Disk temperature in Celsius
# TYPE system_disk_temperature_celsius gauge
system_disk_temperature_celsius{disk="sda"} 37
system_disk_temperature_celsius{disk="sdb"} 40
```

::: tip

**写入注意事项**

1. 为避免采集中读取到半成品文件，推荐先写入临时文件，再用 mv 原子替换。
2. 避免同一指标名在不同文件中类型不一致。
3. 定期清理无用 .prom 文件，防止残留指标影响监控
:::

通过遵循上述格式，node_exporter 可以安全、准确地采集自定义指标，并直接纳入 Prometheus 监控体系。


## 结语

本文演示了如何在不修改 node_exporter 代码的前提下，通过 Textfile Collector 添加自定义监控指标。以温度采集为例，我们用一个 Shell 脚本实现了与独立 Exporter 相同的监控能力，同时保持系统结构简洁稳定。