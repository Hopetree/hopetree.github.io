# 服务器监控应用（3）：监控告警通知开发

开发完监控服务端和客户端之后，就已经想好了后续有必要的话把监控告警通知也提上日程，当时差不多已经想好了要做的需求，现在已经把告警通知功能实现了，也已经上线使用，现在分享一下。

这个功能其实很简单，就依赖两个功能点：

- Django 自带的邮件通知能力
- 定时任务能力

## 需求分析

我在 [服务器监控应用（1）：服务端开发](https://tendcode.com/subject/article/server-status-1/#下一步 "服务器监控应用（1）：服务端开发") 的结尾其实也大致描述了一下对于监控告警通知的需求点，现在根据上线的情况大致描述一下：

1. 告警通知的目标主机应该有过滤条件，具体条件就是该主机在激活状态，且上报过信息，说白了就是只对这种持续上报，然后突然中断的主机进行告警通知
2. 使用定时任务检查主机上报的时间，通过最后一次上报时间来判断主机是否掉线，并且掉线多久
3. 需要设置通知的频率，不能无脑告警，每个离线的主机只在指定的时间点上报，比如掉线1分钟、10分钟、60分钟、4小时和1整体这几个递增的时间点
4. 通知方式为邮件通知，使用Django自带的通知功能


## 功能开发

### 编写定时任务函数

先写一个逻辑处理函数，函数的作用就是找出离线的主机，并发送邮件通知，直接看代码吧：

```python
import json
from datetime import datetime


def action_check_host_status(recipient_list=None, times=None):
    from django.conf import settings
    from django.core.mail import send_mail
    from .models import MonitorServer

    # 可以通过参数传递通知的频率
    times = times or [1, 10, 60, 60 * 4, 60 * 24]

    if not recipient_list:
        return 'No recipient_list, please set it.'

    if hasattr(settings, 'DEFAULT_FROM_EMAIL') and settings.DEFAULT_FROM_EMAIL:
        from_email = settings.DEFAULT_FROM_EMAIL
    else:
        # 如果未设置发件人邮箱，设置为空，直接退出
        return 'Email configuration not set'

    current_date = datetime.now()
    alarm_list = []
    hosts = MonitorServer.objects.filter(
        secret_key__isnull=False,
        secret_value__isnull=False,
        data__isnull=False,
        active=True
    )
    for host in hosts:
        # 转换成分钟
        m = int((current_date - host.update_date).total_seconds() / 60)
        # 多个时间点发送
        if m in times:
            msg = f'警告：节点 {host.name} 离线 {m} 分钟'
            alarm_list.append(msg)
        else:
            continue
    if all([alarm_list, from_email, recipient_list]):
        subject = f'⚠️服务监控告警 {current_date.strftime("%Y-%m-%d %H:%M:%S")}'
        message = '\n'.join(alarm_list)
        ok_num = send_mail(subject, message, from_email, recipient_list)
        return f"Send email ok: {ok_num}"

    return "Not alarm !!!"

```

这个函数接受两个参数：

- recipient_list：list，邮件接受方，支持多个邮箱地址
- times：list，通知频率，也就是在离线的多个时间点发通知

然后在 tasks.py 中设置成定时任务函数：

```python
@shared_task
def check_host_status(recipient_list=None, times=None):
    """
    定时检查服务监控的节点状态
    定时任务需要设置1分钟执行一次
    @param times: 通知频率，默认[1, 10, 60, 60 * 4, 60 * 24]
    @param recipient_list: 收件人的邮件地址，必填，否则不检查
    @return:
    """
    response = TaskResponse()
    msg = action_check_host_status(recipient_list=recipient_list, times=times)
    response.data = {'msg': msg}
    return response.as_dict()
```

这两个参数都可以通过定时任务的参数传递给函数。

### 邮箱配置

这里需要提到的是，由于使用了 Django 自带的邮件通知能力，所以需要先在项目的配置文件中配置好邮件服务器的信息，这个在我的项目里面是可以使用环境变量文件来配置的，具体的配置项见项目 settings.py 文件：

```python
# ****************************************** 邮箱配置开始 ****************************************
# 配置管理邮箱，服务出现故障会收到到邮件，环境变量值的格式：name|test@test.com 多组用户用英文逗号隔开
ADMINS = []
admin_email_user = os.getenv('IZONE_ADMIN_EMAIL_USER')
if admin_email_user:
    for each in admin_email_user.split(','):
        a_user, a_email = each.split('|')
        ADMINS.append((a_user, a_email))

# 邮箱配置
EMAIL_HOST = os.getenv('IZONE_EMAIL_HOST', 'smtp.163.com')
EMAIL_HOST_USER = os.getenv('IZONE_EMAIL_HOST_USER', 'your-email-address')
EMAIL_HOST_PASSWORD = os.getenv('IZONE_EMAIL_HOST_PASSWORD',
                                'your-email-password')  # 这个不是邮箱密码，而是授权码
EMAIL_PORT = os.getenv('IZONE_EMAIL_PORT', 465)  # 由于阿里云的25端口打不开，所以必须使用SSL然后改用465端口
EMAIL_TIMEOUT = 5
# 是否使用了SSL 或者TLS，为了用465端口，要使用这个
EMAIL_USE_SSL = os.getenv('IZONE_EMAIL_USE_SSL', 'True').upper() == 'TRUE'
# 默认发件人，不设置的话django默认使用的webmaster@localhost，所以要设置成自己可用的邮箱
DEFAULT_FROM_EMAIL = os.getenv('IZONE_DEFAULT_FROM_EMAIL', 'TendCode博客 <your-email-address>')
# *************************************** 邮箱配置结束 *******************************************
```

这些配置本身是作为用户注册的邮箱认证，还有服务异常给管理员通知用的，但是也是 Django 自带的通知功能，所以可以主动调用。

### 设置定时任务

添加定时任务，并设置执行频率为1分钟一次：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404241137930.png)

并添加定时任务参数 `recipient_list ` 和 `times`，前者为邮件接收方，必须有值，后者为频率，可以不填直接使用默认值。

## 验证效果

手动停掉一个主机的监控通知服务，用来模拟主机挂了，然后等待1分钟，就可以收到通知，并且10分钟后可以收到第二次通知。

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404241142845.png)

## 优化

由于家用宽带每48小时就要更新一次IP，这个过程中会导致断网一段时间，因此为了保证这种有规律的离线不触发告警，因此我在代码中加了一个参数用来过滤掉一些时间段。

下面这个是过滤前的告警，每48小时必定触发告警：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202405060949517.png)

我添加的过滤参数：

```python
def action_check_host_status(recipient_list=None, times=None, ignore_hours=None):
    from django.conf import settings
    from django.core.mail import send_mail
    from .models import MonitorServer

    current_date = datetime.now()

    # 忽略的检查时段，这些时段不检查状态
    # 这个忽略的意义是因为运营商会定期断网更新IP，导致上报失败触发告警，比如电信是4点多断网一段时间
    ignore_hours = ignore_hours or []

    if current_date.hour in ignore_hours:
        return f'Ignore period for {ignore_hours}, do not check.'
```

::: tip

🎉 **题外话**

有定时任务和没有定时任务的平台真的是两个平台，在定时任务能力的支持下，平台可以做很多“异步”的事情，也可以在后台做很多比较耗时的事情，简直不要太爽！
:::