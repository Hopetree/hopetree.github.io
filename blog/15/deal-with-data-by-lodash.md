# 记录一些使用 lodash.js 处理 Dashboard 数据的案例

## 前言

最近在搞 Dashboard 的看板，不同平台的 Dashboard 实现方式不同，但是基本都是向 Grafana 那一套看齐就行。我们公司的这套 Dashboard 也差不多，但是引入了 lodash.js 和 Moment.js 来进行数据处理，这篇文章记录一些在实际场景中用到的数据处理案例，方便后续查询参考。

lodash.js 的数据处理能力太强了，可以说是无所不能，具体可以看 [Lodash中文文档](https://www.lodashjs.com/ "Lodash中文文档")

我主要是记录一下使用 lodash.js 处理数据的一些常见场景（我用到的），方便后续查阅参考。

## 场景案例

### 1. 按不同日期分组

**需求**：原始数据中有一个字段是日期或者时间，需要按照这个字段进行分组统计数据，比如按天统计、按月统计、按年统计

**处理思路**：将时间字段使用 split 拆分形成分组 `key` 进行统计

调试代码：

```js
// npm i --save lodash
var _ = require('lodash');

// 搜索CMDB实例的返回体，所有接口返回体统一给变量DATA
const DATA = {
    "list": [
      {
        "_object_id": "_ITSC_PROCESS_INSTANCE",
        "ctime": "2024-03-04 16:55:00",
        "instanceId": "612e5ff4f9979"
      },
      {
        "_object_id": "_ITSC_PROCESS_INSTANCE",
        "ctime": "2024-03-05 17:17:35",
        "instanceId": "612e6501acea5"
      },
      {
        "_object_id": "_ITSC_PROCESS_INSTANCE",
        "ctime": "2024-03-05 17:22:51",
        "instanceId": "612e662e52391"
      },
      {
        "_object_id": "_ITSC_PROCESS_INSTANCE",
        "ctime": "2024-03-06 17:25:47",
        "instanceId": "612e66d64c079"
      },
      {
        "_object_id": "_ITSC_PROCESS_INSTANCE",
        "ctime": "2024-03-06 17:36:31",
        "instanceId": "612e693c2800d"
      }
    ],
    "total": 55,
    "page": 1,
    "page_size": 5
  }
  
// 预期格式:[{ date: '2024-03-04', value: 1 },{ date: '2024-03-05', value: 2 },{ date: '2024-03-06', value: 2 }]
var data = _.chain(DATA.list)
    .groupBy(item => item.ctime.split(' ')[0]) // 按日期分组
    .map((value, key) => ({ date: key, value: value.length })) // 转换为预期格式
    .orderBy(["day"], ["asc"]) // 按照日期升序
    .value();

// 输出统计结果
console.log(data);
  
```

实际输出：

```js
[
  { date: '2024-03-04', value: 1 },
  { date: '2024-03-05', value: 2 },
  { date: '2024-03-06', value: 2 }
]
```

dashboard 展示效果：

![按不同日期分组](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191043753.png)

### 2. 多字段（维度）分组

**需求**: 将原始数据按照两个或两个以上字段进行多维度分组统计，比如统计每天不同工单的提交数量

**处理思路**：先将多个字段拼接成一个字段进行分组，然后拆开成多个字段来统计，比如下面这里使用 `####` 来进行的拼接，之后再使用 `split` 拆分成多个字段来显示


调试代码：

```js
var _ = require('lodash');

const DATA = {
    "list": [{
        "name": "调试-任务工具执行历史记录",
        "ctime": "2024-08-08 16:57:40",
        "orderNum": 1
    }, {
        "name": "调试-任务工具执行历史记录",
        "ctime": "2024-07-09 17:42:36",
        "orderNum": 1
    }, {
        "name": "数据同步",
        "ctime": "2024-07-08 15:53:27",
        "orderNum": 1
    }, {
        "name": "调试-任务工具执行历史记录",
        "ctime": "2024-08-08 09:23:29",
        "orderNum": 1
    }, {
        "name": "调试-任务工具执行历史记录",
        "ctime": "2024-07-09 17:41:53",
        "orderNum": 1
    }, {
        "name": "调试-任务工具执行历史记录",
        "ctime": "2024-07-09 17:35:57",
        "orderNum": 1
    }]
}

var data = _.chain(DATA.list)
    .groupBy(item => `${item.ctime.split(" ")[0]}####${item.name}`) 
    .map((value, key) => ({date: key.split("####")[0],name: key.split("####")[1],total: value.length})) 
    .orderBy(["date"], ["asc"]) 
    .value();

// 输出统计结果
console.log(data);

```

实际输出：

```js
[
  { date: '2024-07-08', name: '数据同步', total: 1 },
  { date: '2024-07-09', name: '调试-任务工具执行历史记录', total: 3 },
  { date: '2024-08-08', name: '调试-任务工具执行历史记录', total: 2 }
]
```

dashboard 展示效果：

![多字段分组1](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191046867.png)

![多字段分组2](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191045259.png)

### 3. 将 key 转成字符串

**需求**：有的 key 是布尔值或者数字等不同的格式，还有空值，导致 key 数据类型不统一，排序的时候无法控制，所以需要先转成统一的格式字符串后再排序

**处理思路**：直接利用 `String` 方法将值转成字符串后统计

调试代码：

```js
var _ = require('lodash');

const DATA = {
    "list": [{
            "eventScore": "1",
            "工单数": 2
        },
        {
            "eventScore": "3",
            "工单数": 1
        },
        {
            "eventScore": "4",
            "工单数": 5
        },
        {
            "eventScore": "5",
            "工单数": 4
        },
        {
            "eventScore": "null",
            "工单数": 1
        }
    ]
}

var data = _.chain(DATA.list)
    .map(item => ({
        ...item,
        eventScore: String(item.eventScore)
    }))
    .orderBy(["eventScore"], ["asc"])
    .value()


// 输出统计结果
console.log(data);
```

实际输出：

```js
[
  { eventScore: '1', '工单数': 2 },
  { eventScore: '3', '工单数': 1 },
  { eventScore: '4', '工单数': 5 },
  { eventScore: '5', '工单数': 4 },
  { eventScore: 'null', '工单数': 1 }
]
```

dashboard 展示效果：

![将 key 转成字符串](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191106041.png)

### 4. 按照指定的顺序排序

**需求**：统计数字在排序的时候既不是升序也不是降序，而是需要按照给定的顺序（一个顺序数组）排序

**处理思路**：见代码

调试代码：

```js
var _ = require('lodash');

const DATA = {
    "list": [{
            "isLevelAccurate": true,
            "num": 1
        },
        {
            "isLevelAccurate": false,
            "num": 2
        },
        {
            "isLevelAccurate": null,
            "num": 2
        }
    ]
}

var data = _.chain(DATA.list)
    .map(item => ({
        ...item,
        isLevelAccurate: String(item.isLevelAccurate)
    }))
    .sortBy(item =>
        // 使用 _.indexOf 获取 isLevelAccurate 在 predefinedOrder 中的索引
        _.indexOf(["true", "false", "null"], item.isLevelAccurate) === -1
        // 如果值不在预定义列表中，则返回 Infinity（排在最后）
        ?
        Infinity :
        _.indexOf(["true", "false", "null"], item.isLevelAccurate)
    )
    .value();

// 输出统计结果
console.log(data);
```

实际输出：

```js
[
  { isLevelAccurate: 'true', num: 1 },
  { isLevelAccurate: 'false', num: 2 },
  { isLevelAccurate: 'null', num: 2 }
]
```

dashboard 展示效果：

![按照指定的顺序排序](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191056060.png)

### 5. 将值显示成映射值

**需求**：有时候数据返回的值可读性比较差，因此在展示的时候需要换成其他值来显示

**处理思路**：统计的时候替换值为要显示的值后统计

调试代码：

```js
var _ = require('lodash');

const DATA = {
    "list": [{
            "isLevelAccurate": true,
            "num": 1
        },
        {
            "isLevelAccurate": false,
            "num": 2
        },
        {
            "isLevelAccurate": null,
            "num": 2
        }
    ]
}

var data = _.chain(DATA.list)
    .map(item => ({
        ...item,
        // 将 true/false/null 转换为 "是"/"否"/"无"
        isLevelAccurate: item.isLevelAccurate === true ? "是" :
                         item.isLevelAccurate === false ? "否" :
                         item.isLevelAccurate === null ? "无" : String(item.isLevelAccurate)
    }))
    .sortBy(item =>
        // 使用 _.indexOf 获取 isLevelAccurate 在 predefinedOrder 中的索引
        _.indexOf(["是", "否", "无"], item.isLevelAccurate) === -1
        // 如果值不在预定义列表中，则返回 Infinity（排在最后）
        ?
        Infinity :
        _.indexOf(["是", "否", "无"], item.isLevelAccurate)
    )
    .value();

// 输出统计结果
console.log(data);

```

实际输出：

```js
[
  { isLevelAccurate: '是', num: 1 },
  { isLevelAccurate: '否', num: 2 },
  { isLevelAccurate: '无', num: 2 }
]
```

dashboard 展示效果：

![将值显示成映射值](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191117014.png)


### 6. 按照指定的key排序并补充空值

**需求**：首先需要按照指定的key显示，然后如果某些key没有值则显示为0或者固定的值

调试代码：

```js
const _ = require('lodash');

const DATA = {
    "list": [{
            "status": "完成",
            "工单数": 1
        },
        {
            "status": "待评估",
            "工单数": 2
        },
        {
            "status": "拒绝",
            "工单数": 2
        }
    ]
};

const result = _.chain(DATA.list)
    // 按 status 字段分组，并统计每个组的 num 总和
    .groupBy("status")
    .mapValues(items => _.sumBy(items, "工单数")) // 按 num 汇总
    // 根据指定的 key 补全缺失的键并保证顺序
    .thru(data => _.map(
        ["待评估", "计划制定中", "需求澄清中", "需求开发中", "需求实施中", "完成", "拒绝"],
        key => ({
            status: key,
            count: data[key] || 0
        })
    ))
    .value();

console.log(result);
```

输出效果：

```js
[
  { status: '待评估', count: 2 },
  { status: '计划制定中', count: 0 },
  { status: '需求澄清中', count: 0 },
  { status: '需求开发中', count: 0 },
  { status: '需求实施中', count: 0 },
  { status: '完成', count: 1 },
  { status: '拒绝', count: 2 }
]
```

dashboard 展示效果：

![按照指定的key排序并补充空值](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409191654905.png)


### 7. 统计数据增加百分比字段

**需求**：为了在饼图中显示百分比数据（有的饼图自身可以计算有的不行），可以显示的给数据增加一个百分比的字段

**处理思路**：这里先利用 `sumBy` 方法统计数据中指定字段的和，然后再计算出百分比赋值给字段 percent 即可，这里还可以利用 `toFixed` 进行小数点保留几位数的设置

调试代码：

```js
var _ = require('lodash');

const DATA = {
    "list": [{
            "isLevelAccurate": true,
            "num": 1
        },
        {
            "isLevelAccurate": false,
            "num": 2
        },
        {
            "isLevelAccurate": null,
            "num": 3
        }
    ]
}

var data = _.chain(DATA.list)
    .map(item => ({
        ...item,
        // 将 true/false/null 转换为 "是"/"否"/"无"
        isLevelAccurate: item.isLevelAccurate === true ? "是" :
                         item.isLevelAccurate === false ? "否" :
                         item.isLevelAccurate === null ? "无" : String(item.isLevelAccurate)
    }))
    .sortBy(item =>
        // 使用 _.indexOf 获取 isLevelAccurate 在 predefinedOrder 中的索引
        _.indexOf(["是", "否", "无"], item.isLevelAccurate) === -1
        // 如果值不在预定义列表中，则返回 Infinity（排在最后）
        ?
        Infinity :
        _.indexOf(["是", "否", "无"], item.isLevelAccurate)
    )
    .map(item => ({...item, percent: (item.num / _.sumBy(DATA.list, "num")).toFixed(3)}))
    .value();

// 输出统计结果
console.log(data);

```

输出效果：

```js
[
  { isLevelAccurate: '是', num: 1, percent: '0.167' },
  { isLevelAccurate: '否', num: 2, percent: '0.333' },
  { isLevelAccurate: '无', num: 3, percent: '0.500' }
]
```

图标效果：

![统计数据增加百分比字段](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409231023449.png)