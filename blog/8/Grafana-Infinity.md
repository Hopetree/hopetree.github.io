# 在 Grafana 中通过 Infinity 数据源可视化接口数据

Grafana Infinity 是一个 Grafana 插件，用于从几乎任何 REST API 获取数据，并将其展示在 Grafana 的仪表盘中。它允许用户将外部数据源（如 JSON、CSV、XML 等）直接集成到 Grafana 中，增强了 Grafana 的数据展示和分析能力。本文分享一下利用 Grafana Infinity 插件将 API 数据可视化的实战经验。

官方文档：[https://grafana.com/docs/plugins/yesoreyeram-infinity-datasource/latest/](https://grafana.com/docs/plugins/yesoreyeram-infinity-datasource/latest/ "https://grafana.com/docs/plugins/yesoreyeram-infinity-datasource/latest/")

## 安装 Infinity

在 Grafana 的数据源中添加新的数据源，然后搜索 `Infinity` 关键字，查询到插件进行安装即可。

![](https://tendcode.com/cdn/2024/04/202406271518557.png)

新数据源添加之后：

![](https://tendcode.com/cdn/2024/04/202406271521043.png)

## Infinity 数据源的使用案例


## 表格数据

在使用 Infinity 数据源的时候，默认会提供一个 github 的接口当做示例展示，这个接口地址为：[https://github.com/grafana/grafana-infinity-datasource/blob/main/testdata/users.json](https://github.com/grafana/grafana-infinity-datasource/blob/main/testdata/users.json "https://github.com/grafana/grafana-infinity-datasource/blob/main/testdata/users.json")

可以自行查看数据格式，其实就是一个用户数组，在展示的时候使用 Table 就是将数据显示成表格：

```json
[
  {
    "name": "Leanne Graham",
    "age": 38,
    "country": "USA",
    "occupation": "Devops Engineer",
    "salary": 3000
  },
  {
    "name": "Ervin Howell",
    "age": 27,
    "country": "USA",
    "occupation": "Software Engineer",
    "salary": 2300
  },
  {
    "name": "Clementine Bauch",
    "age": 17,
    "country": "Canada",
    "occupation": "Student",
    "salary": null
  },
  {
    "name": "Patricia Lebsack",
    "age": 42,
    "country": "UK",
    "occupation": "Software Engineer",
    "salary": 2800
  },
  {
    "name": "Leanne Bell",
    "age": 38,
    "country": "USA",
    "occupation": "Senior Software Engineer",
    "salary": 4000
  },
  {
    "name": "Chelsey Dietrich",
    "age": 32,
    "country": "USA",
    "occupation": "Software Engineer",
    "salary": 3500
  }
]
```

![](https://tendcode.com/cdn/2024/04/202406271527775.png)

### 统计数据

我这里提供一个接口，可以查询 CMDB 平台的一些资源实例数量，接口使用 POST 请求，并且需要设置请求头信息，具体的设置如下：

#### 1. 添加接口

设置数据源为 Infinity 数据源，然后根据接口的返回数据类型选择 `Type` 字段，比如常用的是 JSON 格式。然后添加接口请求地址和请求方式，比如我这里是 POST 请求，`Format` 就保持默认的 Table 就行，这个是用来调试查看返回数据的。

![](https://tendcode.com/cdn/2024/04/202406271533611.png)

#### 2. 添加请求体和请求头

添加请求体和请求头，这里有点类似于 Postman 的方式：

![](https://tendcode.com/cdn/2024/04/202406271534967.png)

#### 3. 提取响应体中数据

配置好上面的请求信息后就可以调试接口了，此时可以选择 Table 报表来查看数据，也可以主动调试，点击数据源右边的 `Query inspector` 就可以调试：

![](https://tendcode.com/cdn/2024/04/202406271542946.png)

弹窗后点击查询就可以请求数据，此时在“数据”里面就可以看到表格的数据显示。

![](https://tendcode.com/cdn/2024/04/202406271542622.png)

大部分情况，接口返回的数据是有多层次的，此时需要从数据中提取到自己想要的数据，比如我这个接口返回的数据格式为：

```json
{
  "data": {
    "objectInfo": {
      "count": 4,
      "objectId": "HOST"
    }
  }
}
```

我要展示的数据是这里的 `count` 字段，因此我使用 `data.objectInfo.count` 作为根数据的提取方式

![](https://tendcode.com/cdn/2024/04/202406271551431.png)


使用 `Stat` 报表，我添加了更多的可视化图：

![](https://tendcode.com/cdn/2024/04/202406271552423.png)

### 时序图数据

时序图数据至少要两个字段，其中一个字段是时间，另一个字段是数据。

我这里的接口还是一个 POST 接口，返回体格式中有个字段是 `time`，另一个字段为数据，格式大概如下：

```json
{
  "code": 0,
  "codeExplain": "",
  "error": "",
  "data": {
    "total": 60,
    "list": [
      {
        "_object_id": "HOST",
        "instanceId": "618eedaa48215",
        "objectId": "HOST",
        "system_load_norm_15": 0.0825,
        "time": 1719475260
      },
      {
        "_object_id": "HOST",
        "instanceId": "618eedaa48215",
        "objectId": "HOST",
        "system_load_norm_15": 0.0825,
        "time": 1719475320
      },
      {
        "_object_id": "HOST",
        "instanceId": "618eedaa48215",
        "objectId": "HOST",
        "system_load_norm_15": 0.0833,
        "time": 1719475380
      },
      {
        "_object_id": "HOST",
        "instanceId": "618eedaa48215",
        "objectId": "HOST",
        "system_load_norm_15": 0.0817,
        "time": 1719475440
      }
    ],
    "from": 1719471900,
    "to": 1719475500,
    "step": 60,
    "alert_thresholds": [],
    "displayNameList": []
  }
}
```

这个里面 `list` 里面就是时序数据，我摘取了几条，实际有几百条。这里需要提取两个字段，其中 `system_load_norm_15` 为要展示的数据，表示服务器的15分钟负载，时间字段为 `time`。

所以在返回体的数据提取中，需要使用 `data.list` 获取到所有数据，然后需要添加字段映射，比如这里从 `list` 中提取 `system_load_norm_15` 作为显示的数据，格式 `Number`，`time` 的格式为 `Time(UNIX s)`：

![](https://tendcode.com/cdn/2024/04/202406271608151.png)

设置之后，时序图效果：

![](https://tendcode.com/cdn/2024/04/202406271610310.png)

## 仪表盘变量的使用

仪表盘可以设置变量，变量可以在可视化中使用，这个有点类似于 Postman 的环境变量，仪表盘的变量的有效域就是整个仪表盘，并且变量支持多种格式，比如可以设置成静态固定值，也可以使用命令生成，还可以使用数据源返回。

下面我直接分享使用接口返回数据当做变量的方式：

首先添加一个类型为 `Query` 的变量，选择数据源为 Infinity，这样就可以通过接口拿到备选数据，接口配置跟之前的配置方式一样。

![](https://tendcode.com/cdn/2024/04/202406271619129.png)

然后需要将接口返回的数据提取出来，比如我这里提取到一个列表，列表中展示两个字段，第一个是主机的IP，第二个是主机的实例 ID，这样，变量其实就是一个结构体数据，变量会展示第一个字段，也就是ip字段。

![](https://tendcode.com/cdn/2024/04/202406271620838.png)

返回数据查询效果：

![](https://tendcode.com/cdn/2024/04/202406271628601.png)

在可视化中使用数据：

比如我要使用主机的实例 ID，则使用 `${host.instanceID}`，比如在请求体中传递主机的实例 ID 则可以查询对应的主机数据。

![](https://tendcode.com/cdn/2024/04/202406271632315.png)

于是就可以看到看板中的效果如下（此时可以通过选择不同的主机查询不同的主机的负载均衡信息）：

![](https://tendcode.com/cdn/2024/04/202406271630966.png)

**总结**：利用 Grafana Infinity 的灵活性，可以使用 Grafana 对接任意的监控平台，将监控平台数据使用接口调用的形式返回到 Grafana 中进行可视化。