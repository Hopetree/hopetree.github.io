# 把 Celery 定时任务变成实时触发的任务

## 前言

你是否有这种场景，就是自己的平台定义了很多定时任务，但是有的时候需要马上执行一个定时任务，并且可能还需要在执行的时候重新配置执行参数。之前应对这种场景，我都是临时修改任务执行时间来触发任务，这篇文章来分享一下我把这种需求开发成平台功能的经验。

## 功能开发

这个功能主要涉及两个页面，一个是任务执行页面，需要自行开发，第二个是执行结果展示页面，可以直接使用原本的定时任务结果显示页面所以不用单独开发。后端开发只涉及一个接口，就是任务的执行接口，用来触发任务并返回任务执行ID给前端。

### 前端页面开发

为了跟博客本身的框架统一，前端我依然使用 Bootstrap4 作为 UI 框架，这里涉及的组件就是表单组件，使用表单组即可，具体见效果图。

#### 1. 页面需求

前端页面只需要提供一个页面即可，但是页面有三种状态：

1. 访问页面初始状态，进入任务选择页面，页面应该提供所有定时任务作为备选项
2. 定时任务选中状态，选中待执行的任务后，应该自动带出该任务的执行参数，并且可以编辑参数
3. 任务执行完成状态，此时应该显示执行后的任务ID，并且可以跳转到任务结果展示页面

::: tip 解疑

为什么我上面说只需要一个页面即可，并且只提到了任务的执行ID，没有提到任务的执行结果信息如何展示？这是因为这里只需要去触发任务的执行就行，这种执行跟定时任务到点执行效果是一样的，所以执行完成之后会自动把结果更新到后台数据中，所以不需要单独提供页面展示结果，只需要提供一个超链接跳转到后台的结果页面就行，具体操作后续再讲。
:::

#### 2. 请求页面

先看一下我的请求页面初始状态：

![请求页面初始状态](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409271456320.webp)

然后可以选择任意一个定时任务：

![任意一个定时任务](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409271456321.webp)

接着是任务选择之后自动带出任务参数，并且可以编辑参数，输入框还会随着参数的内容自动伸缩：

![自动带出任务参数](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409271456322.webp)

#### 3. 结果展示

结果首先会在提交后在当前页面显示任务的ID，并可以通过任务ID的超链接跳转到任务结果详情页面：

![显示任务ID](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409271456323.webp)

点击任务ID后跳转到任务详情页面，也就是任务后台，之后的任务详情就跟定时任务执行没啥区别，这里就不说了：

![任务后台](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/202409271508776.png)

由于任务只有在结束（状态为成功或者失败）后才会更新到后台数据中，所有对于有些耗时长的任务需要等待刷新。


#### 4. 前端开发技巧

虽然页面之后一个，但是实际上做的一些处理还是比较多的，简单分享一下需求点和实现思路：

1. 需要提供任务作为可选项，此处直接使用 Django 的标签函数返回任务列表即可
2. 选择一个任务后要带出任务的参数，这个可以使用 js 实现，把参数首先使用 Django 的标签模板存到标签的 `data` 属性中，然后根据选择的任务加载属性的值
3. 实现输入框随着参数的内容自动缩放，此处使用 js 实现，需要监听输入框内容并实时修改输入框的属性
4. 执行结果回写，js 实现，将接口返回结果显示成 html 内容即可


### 后端视图开发

#### 1. 选择任务的视图函数

由于前端需要拿到所有定时任务作为可选项，所以首先需要改造后端来返回，这里要定义一个视图函数用来显示任务执行页面，并在视图中传递任务，代码如下：

```python
import json

from celery import current_app
from django.contrib.auth.decorators import user_passes_test
from django.http import JsonResponse
from django.shortcuts import render
from django_celery_beat.models import PeriodicTask

def is_admin(user):
    return user.is_authenticated and user.is_staff  # 确保用户为管理员

@user_passes_test(is_admin)
def run_task(request):
    # tasks = PeriodicTask.objects.filter(enabled=True) # 只返回启用的任务
    tasks = PeriodicTask.objects.all()
    context = {'tasks': tasks}
    return render(request, 'blog/runTask.html', context=context)
```

定时任务是在模型 `PeriodicTask` 中的，这个是 `django_celery_beat` 这个组件定义的模型，只需要去获取即可。

#### 2. 执行任务的视图函数

这里需要提供一个执行任务的接口，供前端调用，并返回直接结果，代码如下：

```python
@user_passes_test(is_admin)
def execute_task(request):
    if request.method == 'POST':
        # 获取任务名称和参数
        task_name = request.POST.get('task_name')
        args = request.POST.get('args', '[]')  # args 应该是 JSON 格式的字符串
        kwargs = request.POST.get('kwargs', '{}')  # kwargs 应该是 JSON 格式的字符串

        if not task_name:
            return JsonResponse({'error': 'Task name is required'}, status=400)

        try:
            # 将 JSON 字符串转换为 Python 对象
            args = json.loads(args)
            kwargs = json.loads(kwargs)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format for args or kwargs'}, status=400)

        if not isinstance(args, list) or not isinstance(kwargs, dict):
            return JsonResponse({'error': 'Invalid type args or kwargs'}, status=400)

        # 使用 send_task 动态执行任务
        result = current_app.send_task(task_name, args=args, kwargs=kwargs)

        # 返回任务 ID 和状态
        return JsonResponse({
            'message': 'Task executed',
            'task_id': result.id,
            'task_status': result.status
        })

    return JsonResponse({'error': 'Invalid request method'}, status=405)

```

这个函数大部分内容都是在做数据校验，保证执行的任务参数是符合要求的，真正的关键代码只有一行，就是任务的执行：

```python
result = current_app.send_task(task_name, args=args, kwargs=kwargs)
```

这个代码太关键了，因为只有使用这种方式去执行任务，才可以保证任务的执行跟本身的定时任务执行是一个效果，进而保证了任务的结果可以正常的更新到后台中。

## 总结

显示定时任务实时执行功能后，解决了我很多常用问题，至此定时任务就不再仅仅是一个在特定时间点自动执行的任务，而是变成了一个可以随时运行的脚本。

于是，我后续可能参考这次的改造，给平台添加一个可以提交 Python 代码并直接执行代码的能力，让执行任务的灵活性进一步加强。