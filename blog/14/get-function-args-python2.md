# 如何在 Python 2.7 中获取未调用函数的局部变量

## 背景

我们公司平台的开发环境中使用的是 Python 2.7 版本，最近工作中，我遇到这样一个需求：我需要在一个方法中访问另一个函数内部定义的变量。这些变量包括字符串和数字类型，来源于一个预定义的固定函数。

这个固定函数会在执行文件前由平台自动注入，且**不能被修改**，并且函数中包含的一些变量是动态的，只能注入之后才能知道具体是什么。本质就是这个函数本身的逻辑无法满足我的需求，我需要重写该函数，并且需要保留函数中的一些变量的值。我的目标是，在不执行这个固定函数的前提下，获取到其中局部定义的字符串和数字变量。

例如，固定函数如下：

```python
def private_func(*args, **kwargs):
    client_cer = "xxxx cer xxxx"
    client_key = 'xxxx key xxxx'

    other_arg = client_key + client_cer
```

在这个函数中，`client_cer` 和 `client_key` 是我要提取的变量，而像 `other_arg` 这种复杂计算结果的变量则可以忽略。

通过调研和实践，我找到了一种基于 **静态分析** 的优雅方法，借助 Python 的 `inspect` 和 `ast` 模块完成这一任务。


## 解决方案

### 思路

1. **获取函数源码**：使用 `inspect` 模块提取函数源码。
2. **解析源码为 AST（抽象语法树）**：通过 `ast` 模块读取函数的语法结构。
3. **遍历 AST，提取赋值变量**：定位赋值语句，提取变量名和值，只保留字符串和数字类型的变量。

### 代码实现

以下是完整的代码实现，支持 Python 2.7 环境（Python 3 当然也是兼容的）：

```python
import inspect
import ast

def analyze_variables_from_source(func):
    # 获取函数源码
    source = inspect.getsource(func)
    tree = ast.parse(source)  # 解析为 AST（抽象语法树）

    # 提取赋值语句中的变量和值
    variables = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):  # 如果是赋值语句
            for target in node.targets:
                if isinstance(target, ast.Name):  # 确保是变量名
                    if isinstance(node.value, ast.Str):  # 字符串值
                        variables[target.id] = node.value.s
                    elif isinstance(node.value, ast.Num):  # 数字值
                        variables[target.id] = node.value.n
    return variables
```


### 使用示例

假设我们要提取 `private_func` 中的字符串和数字变量：

```python
def private_func(*args, **kwargs):
    client_cer = "xxxx cer xxxx"
    client_key = 'xxxx key xxxx'

    other_arg = client_key + client_cer  # 忽略这类逻辑
```

调用代码：

```python
result = analyze_variables_from_source(private_func)
print(result)
# 输出: {'client_cer': 'xxxx cer xxxx', 'client_key': 'xxxx key xxxx'}
```


## 支持更多数据类型的扩展

除了字符串和数字，我们还可以扩展代码以支持 **列表、字典等数据类型** 的提取。以下是改进版代码：

```python
import inspect
import ast

def analyze_variables_from_source_extended(func):
    source = inspect.getsource(func)
    tree = ast.parse(source)

    variables = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):  # 跳过非赋值语句
            continue
        for target in node.targets:
            if not isinstance(target, ast.Name):  # 跳过非变量名的目标
                continue

            value = node.value
            if isinstance(value, ast.Str):  # 字符串
                variables[target.id] = value.s
            elif isinstance(value, ast.Num):  # 数字
                variables[target.id] = value.n
            elif isinstance(value, ast.List):  # 列表
                variables[target.id] = [
                    elt.s if isinstance(elt, ast.Str) else
                    elt.n if isinstance(elt, ast.Num) else None
                    for elt in value.elts
                ]
            elif isinstance(value, ast.Dict):  # 字典
                keys = [
                    key.s if isinstance(key, ast.Str) else
                    key.n if isinstance(key, ast.Num) else None
                    for key in value.keys
                ]
                values = [
                    val.s if isinstance(val, ast.Str) else
                    val.n if isinstance(val, ast.Num) else None
                    for val in value.values
                ]
                variables[target.id] = dict(zip(keys, values))
    return variables


```

假设 `private_func` 的变量变得更加多样化：

```python
def private_func(*args, **kwargs):
    client_cer = "xxxx cer xxxx"
    client_key = 'xxxx key xxxx'
    numbers = [1, 2, 3, 4]
    config = {"host": "localhost", "port": 8080}
```

调用扩展版代码：

```python
result = analyze_variables_from_source_extended(private_func)
print(result)
# 输出: 
# {
#     'client_cer': 'xxxx cer xxxx',
#     'client_key': 'xxxx key xxxx',
#     'numbers': [1, 2, 3, 4],
#     'config': {'host': 'localhost', 'port': 8080}
# }
```


## 优缺点分析

**优点：**

1. **安全性**：不会执行目标函数代码，完全基于静态分析，避免副作用。
2. **灵活性**：支持多种数据类型的提取，包括字符串、数字、列表和字典。
3. **适用性广**：适合在调试、代码检查器、静态分析器等场景中使用。

**局限性：**

1. **无法处理动态计算**：例如通过外部调用、运行时计算得到的变量值（如 `other_arg`）无法直接解析。
2. **复杂函数支持有限**：如果函数包含嵌套定义或条件语句，需额外逻辑支持。


## 总结
在 Python 2.7 环境中，通过 `inspect` 和 `ast` 模块，我们能够优雅地提取未调用函数的局部变量，且完全避免执行代码的风险。此方法对简单的固定函数非常高效，适用于遗留系统和静态分析工具。