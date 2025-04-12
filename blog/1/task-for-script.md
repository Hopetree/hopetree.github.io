# 让定时任务支持执行自定义脚本

我在项目中实现了定时任务功能，目前的任务都是执行的写到项目代码中的函数，也就是说每当我要创建一个新的执行内容都必须更新项目代码。因此，我想要实现一个新功能，就是可以将要执行的任务以脚本的形式添加到数据库中，然后定时任务可以选择这些脚本去执行。

## 我的想法

先说一下关于这个功能的想法，这就不得不提到我接触到的一些具备定时任务执行能力的平台了，下面简单说一下：

1. **Jenkins**：Jenkins 作为开源的自动化平台，定时任务功能自然是齐全的，可以执行代码仓库的脚本，也可以执行机器上面的脚本，当然也可以执行输出框中的脚本，并且，可以引用环境变量
2. **青龙面板**：青龙面板作为一个专门为定时任务而生的平台，定时任务全部都是以自定义脚本的形式执行的，并且可以引用环境变量
3. **我司产品**：我们公司的产品也具备定时任务能力，而且都是以自定义脚本的形式执行的，支持多种脚本语言，并且可以引用内部环境变量，以及自定义 lib 库和内置的函数

再说一下我的需求：

1. 可以自定义脚本，支持 Python 和 Shell 脚本
2. 可以自定义环境变量，作为全局变量使用，方便存储一些敏感信息
3. 定时任务只需要选择对应脚本即可，并且可以进一步传递参数作为环境变量给脚本使用

## 具体实现

### 定义数据库模型

这里需要创建两个表，分别是脚本和环境变量，模型定义代码如下：

```python
from django.db import models


class TaskScript(models.Model):
    SCRIPT_TYPES = [
        ("python", "Python"),
        ("shell", "Shell"),
    ]

    name = models.CharField(max_length=255, unique=True)
    script = models.TextField()  # 存储 Python/Shell 代码
    script_type = models.CharField(max_length=10, choices=SCRIPT_TYPES, default="python")  # 脚本类型
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.script_type})"

    class Meta:
        verbose_name = '脚本'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']


class EnvironmentVariable(models.Model):
    key = models.CharField(max_length=255, unique=True)  # 变量名
    value = models.TextField()  # 变量值
    description = models.TextField(blank=True, null=True)  # 变量描述，可选
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.key} = {self.value}"

    class Meta:
        verbose_name = '环境变量'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

```

### 创建任务执行函数

在任务中创建一个通用的执行函数，这个函数将脚本和环境变量当做参数传入

```python
@shared_task
def execute_task(script_name, python_path="/usr/local/bin/python3", shell_path="/usr/bin/bash", **kwargs):
    """执行数据库中的 Python/Shell 代码，并注入环境变量"""
    response = TaskResponse()
    try:
        script_obj = TaskScript.objects.get(name=script_name)
        script_code = script_obj.script
        script_type = script_obj.script_type

        # 获取所有环境变量
        env_vars = {env.key: env.value for env in EnvironmentVariable.objects.all()}

        # 更新参数中的变量
        env_vars.update({
            str(k): str(v) for k, v in kwargs.items() if
            isinstance(k, str) and isinstance(v, (str, int, float))
        })

        # 确定文件后缀
        file_suffix = ".py" if script_type == "python" else ".sh"

        with tempfile.NamedTemporaryFile(suffix=file_suffix, delete=False) as temp_script:
            temp_script.write(script_code.encode("utf-8"))
            temp_script_path = temp_script.name  # 获取文件路径

        # 设置环境变量
        process_env = os.environ.copy()
        process_env.update(env_vars)

        # 执行脚本
        if script_type == "python":
            result = subprocess.run([python_path, temp_script_path], capture_output=True, text=True, env=process_env)
        else:
            result = subprocess.run([shell_path, temp_script_path], capture_output=True, text=True, env=process_env)

        response.data = {"script_name":script_name, "temp_script_path":temp_script_path, "stdout": result.stdout, "stderr": result.stderr}

    except TaskScript.DoesNotExist:
        response.data = {"script_name":script_name, "error": "Script not found"}

    return response.as_dict()

```

### 创建脚本和变量

比如一个简单的 Python 脚本如下：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202504091104889.png)

### 创建定时任务

创建定时任务，选择统一的执行函数，然后在参数中指定要执行的脚本即可，比如

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202504091106591.png)

输出结果：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202504091107719.png)

## 总结

定时任务支持自定义脚本的执行之后，可以极大的增加任务的灵活性，也会增加任务的安全性，可以说使得定时任务功能迈上了一个新的台阶。
