# 在Django中使MySQL支持存储Emoji表情🚀

当我们在Django应用程序中使用MySQL数据库时，可能会遇到无法存储包含Emoji表情的数据的问题。这是因为MySQL默认字符集和校对规则只支持存储基本的Unicode字符集，无法支持Emoji表情字符。在这篇博客中，我将为您介绍如何在Django中使MySQL支持存储Emoji表情。

## 问题描述

默认情况下，Django使用的MySQL数据库的字符集和校对规则只支持存储基本的Unicode字符集，无法支持Emoji表情字符。因此，当我们尝试将包含Emoji表情的数据存储到MySQL数据库时，Django会报错并拒绝存储。

## 问题分析

### 什么是Emoji表情

Emoji表情是一种图形符号，通常用于在电子邮件、短信和社交媒体等应用程序中表示情感、状态和对象。Emoji表情最初是在日本开发的，并在2009年被Unicode标准化。随着移动设备和社交媒体的普及，Emoji表情已经成为我们日常通讯的重要组成部分。

### MySQL不支持Emoji表情的原因

MySQL默认字符集和校对规则只支持存储基本的Unicode字符集，无法支持Emoji表情字符。在MySQL的默认字符集utf8中，只支持3个字节的Unicode字符，而Emoji表情字符通常需要4个字节。因此，如果我们尝试将包含Emoji表情字符的数据存储到MySQL数据库中，将会失败并返回错误。

## 解决方案

我们解决这个问题的关键就是修改MySQL的字符集，使得MySQL可以支持Emoji表情字符的存储，同时也要修改Django相关配置。

### 修改MySQL配置文件

修改MySQL配置文件my.cnf或my.ini（Windows系统）中的字符集设置，将字符集设置为utf8mb4。

```bash
[mysqld]
explicit_defaults_for_timestamp=true
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
init_connect='SET NAMES utf8mb4;'
```

修改完配置文件需要重启一下数据库服务。

### 修改数据库字符集

修改配置文件主要是可以让数据库默认就支持utf8mb4字符，但是仅仅针对的是新创建的库，所以如果要修改已经创建过的数据库的字符集还需要单独进行修改。

登录数据库，执行如下命令，修改数据库或者表的字符集：

```sql
ALTER DATABASE your_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE your_table CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

这些命令将分别修改您的数据库、表和列的字符集为utf8mb4。

请注意，在使用utf8mb4字符集时，每个字符最大占用4个字节，而不是默认的3个字节。这意味着，如果您的现有表中有包含较长文本的列，您可能需要对其进行修改，以便它们不会超过MySQL的最大列长度限制。

### 修改Django配置

在Django的settings.py文件中，我们需要进行以下设置（主要是charset的配置项）：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'your_database',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'your_host',
        'PORT': 'your_port',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'use_unicode': True,
        },
    }
}
```

## 结论

使MySQL支持存储Emoji表情需要我们进行多个步骤，包括修改MySQL的字符集和校对规则、Django的设置以及模型定义。但是，一旦完成这些步骤，我们就可以愉快地存储和使用包含Emoji表情的数据了。