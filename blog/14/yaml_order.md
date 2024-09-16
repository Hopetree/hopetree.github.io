# 解决 pyyaml 修改 yaml 文件之后无法保留原文件格式和顺序的问题

最近工作中遇到一个需求，就是需要更新 yaml 配置文件，但是在实际读取和写入的过程中，发现 yaml 默认会按照字母顺序对数据进行排列，于是就导致了 yaml 文件无法保留原有的格式和顺序，这既不便于对比前后变化，也容易有潜在问题遗留，于是，进过一番搜索查询，我收集到了可以最接近地保留源文件格式的方案。

## 问题复盘

首先来看一下这个问题的背景，有如下一份 yaml 配置文件（如下只是示例，实际的配置大概一千多行），现在需要结合另一个配置文件，来更新此文件，这里我直接省略更新的过程，只说读取和写入遇到的问题。

源文件内容 data.yml 如下：

```yaml
cmc:
  name: "CMC"
  num: 21
  ak: 'w5jjj4f3j4f2$$@#'
buy:
- orange: 43
- apple: 32
another: false
```

现在我们使用 yaml 的 `safe_load` 和 `safe_dump` 方法读取和重新写入一次，看看结果是否跟源文件内容一致，代码如下：

```python
with open('data.yml', 'r', encoding='utf-8') as fp:
    data = fp.read()

dic1 = yaml.safe_load(data)
with open('new.yml', 'w', encoding='utf-8') as fp:
    yaml.safe_dump(dic1, fp)
```

写入后的 new.yml 结果如下：

```yaml
another: false
buy:
- {orange: 43}
- {apple: 32}
cmc: {ak: w5jjj4f3j4f2$$@#, name: CMC, num: 21}
```

这里就可以看到存在两个问题，第一是格式跟源文件的不一样，虽然这种格式也符合 yaml 的写法，但是看起来不如源文件直观，层次不明显，不便于作对比；第二就是新的内容被重新排序了，是按照字母顺序排列的，这就很尴尬了，你可以想象一下，一个一千多行的配置文件全部被打乱是什么情况。

## 规避格式问题

首先我们来解决格式跟源文件不一致的问题（其实就是 yaml 语法形式），在写入的时候，`safe_dump` 方法其实可以传入一些参数，其中有一个参数就可以决定 yaml 写入格式的风格。

加入参数 `default_flow_style=False` 再看看结果：

```python
dic1 = yaml.safe_load(data)
with open('new.yml', 'w', encoding='utf-8') as fp:
    yaml.safe_dump(dic1, fp, default_flow_style=False)
```

```yaml
another: false
buy:
- orange: 43
- apple: 32
cmc:
  ak: w5jjj4f3j4f2$$@#
  name: CMC
  num: 21
```

加入这个参数以后，重新写入后的格式跟源文件的格式就是同样的 yaml 风格了，其他参数可以自行研究，不过经过我研究，没有参数可以修改排序，除了更换类。

## 规避排序问题

虽然通过参数改变了 yaml 写入风格，格式总算和源文件一致了，但是 yaml 重新写入的是默认按照字母排序这种逻辑我反正没搞懂，为什么默认不是按照读取的文件顺序排列的？而且通过研究参数，我发现没有参数可以改变这个默认的排序，那么问题肯定是出在了方法里面加载和渲染的类里面默认进行了排序，于是只能改变类了。

当然，我没有看懂 yaml 底层逻辑，但是我找到了别人分享的方法，然后结合原有的方法进行了一些改动，代码如下：

```python
from collections import OrderedDict
import yaml

def ordered_yaml_load(stream, Loader=yaml.SafeLoader,
                      object_pairs_hook=OrderedDict):
    class OrderedLoader(Loader):
        pass

    def _construct_mapping(loader, node):
        loader.flatten_mapping(node)
        return object_pairs_hook(loader.construct_pairs(node))

    OrderedLoader.add_constructor(
        yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
        _construct_mapping)
    return yaml.load(stream, OrderedLoader)


def ordered_yaml_dump(data, stream=None, Dumper=yaml.SafeDumper,
                      object_pairs_hook=OrderedDict, **kwds):
    class OrderedDumper(Dumper):
        pass

    def _dict_representer(dumper, data):
        return dumper.represent_mapping(
            yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
            data.items())

    OrderedDumper.add_representer(object_pairs_hook, _dict_representer)
    return yaml.dump(data, stream, OrderedDumper, **kwds)
```

上面相当于重写了 yaml 的 `safe_load` 和 `safe_dump` 方法，大概就是替换了一下两个方法中的读取器和渲染器吧，加入了字典的排序方法，也就是这个方法，保留了原有的文件的顺序。

直接使用上面定义的读取和写入方法，来看看实际效果：

```python
dic2 = ordered_yaml_load(data)
new_data2 = ordered_yaml_dump(dic2, default_flow_style=False)
print(new_data2)
```

结果如下：

```yaml
cmc:
  name: CMC
  num: 21
  ak: w5jjj4f3j4f2$$@#
buy:
- orange: 43
- apple: 32
another: false
```

可以看到，结果已经和源文件的风格以及顺序一致了，问题解决。

参考：<https://www.cnblogs.com/langshiquan/p/9569898.html>