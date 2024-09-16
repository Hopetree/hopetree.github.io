# 记录一些在持续部署中可复用的shell命令和函数

最近在做持续部署，很多系统和中间件的发布过程中都涉及到对进程和端口的一些检查，确保该启动的进程和端口启动了，该停掉的进程和端口也停掉了，于是有很多地方要复用代码，以下是记录的一些可复用的代码片段。

## 进程检查

### 检查进程是否存在

参考代码：

```bash
keyword="SimpleHTTPServer"

# 获取进程ID
pid=$(ps -ef | grep -v grep | grep "$keyword" | awk '{print $2}')

if [[ -z "$pid" ]]; then
    echo "进程 '$keyword' 未启动。"
else
    echo "进程 '$keyword' 已启动，进程ID：$pid"
fi
```

::: tip 注意事项

这里的进程关键词应用避免出现使用 `-` 开头的形式，比如关键词为 `-sh-exec` 这种，因为这种格式会被当做是一个 grep 的参数传入，导致查找失败，当然，你可以使用 `grep -- "$keyword"` 来规避掉这种写法的错误，但是，保险起见应该避免这种关键词。
:::

具体可以看这个效果：

```bash
[root@home-202 ~]# ps -ef|grep "-sh-exec"
grep: invalid option -- '-'
Usage: grep [OPTION]... PATTERN [FILE]...
Try 'grep --help' for more information.
[root@home-202 ~]# ps -ef|grep "sh-exec"
root      3073     1  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root      3769  3073  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root      3979  3073  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root      6733  3073  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root     29356 26786  0 09:02 pts/0    00:00:00 grep --color=auto sh-exec
[root@home-202 ~]# ps -ef|grep -- "-sh-exec"
root      3073     1  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root      3769  3073  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root      3979  3073  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root      6733  3073  0 May29 ?        00:00:00 nc --sh-exec nc 192.168.0.212 7001 -l 7001 --keep-open
root     29448 26786  0 09:03 pts/0    00:00:00 grep --color=auto -- -sh-exec
```

### 循环检查进程是否存在

参考代码：

```bash
#!/bin/bash

# 函数：check_process_started
# 参数：
#   $1 - 要查找的进程关键词
#   $2 - 最长等待时间（单位：秒）
#   $3 - 每次检查的间隔时间（单位：秒）

check_process_started() {
    local keyword=$1       # 要查找的进程关键词
    local max_wait_time=$2 # 最长等待时间（单位：秒）
    local interval_time=$3 # 每次检查的间隔时间（单位：秒）
    local elapsed_time=0   # 已用时间初始化为0

	echo "目的：检查包含关键词 ${keyword} 的进程是否正常启动"
    while [[ $elapsed_time -lt $max_wait_time ]]; do
        echo "当前已检查时间：$elapsed_time 秒"

        # 使用 ps -ef | grep -v grep | grep 查找包含关键词的进程
        process_info=$(ps -ef | grep -v grep | grep "$keyword")

        if [[ -n "$process_info" ]]; then
            # 如果找到匹配的进程，输出进程信息并返回0
            echo "找到包含关键词 '$keyword' 的进程"
            echo "$process_info"
            return 0
        fi

        # 如果未找到进程，程序将休眠指定的间隔时间，并增加已用时间
        sleep $interval_time
        elapsed_time=$((elapsed_time + interval_time))
    done

    # 如果总已用时间超过最大等待时间，则输出提示并返回1
    echo "在 $max_wait_time 秒内未找到包含关键词 '$keyword' 的进程。"
    return 1
}

# 调用示例：
check_process_started "my_keyword" 10 1

if [[ $? -ne 0 ]]; then
    echo "进程未启动，请检查。"
    exit 1
fi

```

### 循环检查进程是否不存在

参考代码：

```bash
#!/bin/bash

# 函数：check_process_stopped
# 参数：
#   $1 - 不包含的进程关键词
#   $2 - 最长等待时间（单位：秒）
#   $3 - 每次检查的间隔时间（单位：秒）

check_process_stopped() {
    local keyword=$1       # 不包含的进程关键词
    local max_wait_time=$2 # 最长等待时间（单位：秒）
    local interval_time=$3 # 每次检查的间隔时间（单位：秒）
    local elapsed_time=0   # 已用时间初始化为0

	echo "目的：检查包含关键词 ${keyword} 的进程是否正常停止"
    while [[ $elapsed_time -lt $max_wait_time ]]; do
        echo "当前已检查时间：$elapsed_time 秒"
        
        process_info=$(ps -ef | grep -v grep | grep "$keyword")

        if [[ -z "$process_info" ]]; then
            # 如果未找到包含指定关键词的进程，返回0
            echo "进程不包含关键词 '$keyword'，已停止。"
            return 0
        fi

        # 如果找到了包含指定关键词的进程，休眠指定的间隔时间并增加已用时间
        sleep $interval_time
        elapsed_time=$((elapsed_time + interval_time))
    done

    # 如果总已用时间超过最大等待时间，则输出提示并返回1
    echo "在 $max_wait_time 秒内仍然存在包含关键词 '$keyword' 的进程。"
    return 1
}

# 调用示例：
check_process_stopped "my_keyword" 10 1

if [[ $? -ne 0 ]]; then
    echo "进程未停止，请检查。"
    exit 1
fi

```

## 端口检查

### 检查端口是否存在

参考代码：

```bash
port=8080

# 检查端口是否被监听
netstat -nplt | grep  ":$port"

if [[ $? -ne 0 ]]; then
    echo "端口 $port 未被监听。"
    exit 1
else
    echo "端口 $port 已被监听。"
fi
```

::: tip 提示

1. `netstat` 命令不是系统自带的，写入脚本之前应该先检查系统是否可执行该命令，如果不行，可以换其他检查方式，比如 `ss` 或者 `lsof`
2. 这里只检查 tcp 的监听，如果要包含 udp 则可使用 `netstat -npltu`
:::

### 循环检查端口是否存在

参考代码：

```bash
#!/bin/bash

# 函数：check_port_listening
# 参数：
#   $1 - 要检查的端口号
#   $2 - 最长等待时间（单位：秒）
#   $3 - 每次检查的间隔时间（单位：秒）

check_port_listening() {
    local port=$1          # 要检查的端口号
    local max_wait_time=$2 # 最长等待时间（单位：秒）
    local interval_time=$3 # 每次检查的间隔时间（单位：秒）
    local elapsed_time=0   # 已用时间初始化为0

	echo "目的：检查tcp端口 ${keyword} 是否正常被监听"
    while [[ $elapsed_time -lt $max_wait_time ]]; do
        echo "当前已检查时间：$elapsed_time 秒"

        # 检查TCP端口是否处于监听状态
        netstat -nplt | grep  ":$port"

        if [[ $? -eq 0 ]]; then
            # 如果端口处于监听状态，返回0
            echo "端口 $port 存在，处于监听状态。"
            return 0
        fi

        # 如果端口不存在，休眠指定的间隔时间并增加已用时间
        sleep $interval_time
        elapsed_time=$((elapsed_time + interval_time))
    done

    # 如果总已用时间超过最大等待时间，则输出提示并返回1
    echo "在 $max_wait_time 秒内未找到端口 $port。"
    return 1
}

# 调用示例：
check_port_listening 8080 10 1

if [[ $? -ne 0 ]]; then
    echo "端口未监听，请检查。"
    exit 1
fi

```

### 循环检查端口是否不存在

参考代码：

```bash
#!/bin/bash

# 函数：check_port_not_listening
# 参数：
#   $1 - 要检查的端口号
#   $2 - 最长等待时间（单位：秒）
#   $3 - 每次检查的间隔时间（单位：秒）

check_port_not_listening() {
    local port=$1          # 要检查的端口号
    local max_wait_time=$2 # 最长等待时间（单位：秒）
    local interval_time=$3 # 每次检查的间隔时间（单位：秒）
    local elapsed_time=0   # 已用时间初始化为0

	echo "目的：检查tcp端口 ${keyword} 是否没有被监听"
    while [[ $elapsed_time -lt $max_wait_time ]]; do
        echo "当前已检查时间：$elapsed_time 秒"
        # 检查TCP端口是否处于监听状态
        netstat -nplt | grep  ":$port"

        if [[ $? -ne 0 ]]; then
            # 如果端口未处于监听状态，返回0
            echo "端口 $port 未被监听。"
            return 0
        fi

        # 如果端口处于监听状态，休眠指定的间隔时间并增加已用时间
        sleep $interval_time
        elapsed_time=$((elapsed_time + interval_time))
    done

    # 如果总已用时间超过最大等待时间，则输出提示并返回1
    echo "在 $max_wait_time 秒内仍然存在端口 $port 处于监听状态。"
    return 1
}

# 调用示例：
check_port_not_listening 8080 10 1

if [[ $? -ne 0 ]]; then
    echo "端口仍在监听中，请检查。"
    exit 1
fi


```

## 备份清理

目标：清理一年前的备份文件

方案：按照一定规则搜索出符合条件的备份文件，然后提取备份文件中日期部分，将日期跟一年前的日期对比，小于一年前的日期的文件就删除，并且最少保留一定数量的备份

```bash
#!/bin/bash

# 函数：查找超过一年的备份文件，进行清理，但是最少保留一定数量的备份
clear_old_backups() {
    local backup_dir=$1       #备份文件所在目录，如/home/weblogic/scripts/backup
    local file_pattern=$2     #备份文件的格式，如cmis*.war
    local min_backup_count=$3 #最小保留备份数，如10

    # 检查备份目录是否存在
    if [ ! -d "$backup_dir" ]; then
        echo "错误：备份目录 '$backup_dir' 不存在。"
        exit 1
    fi

    # 如果备份文件数量小于最小保留数量，则不执行清理操作
    backup_file_count=$(find "$backup_dir" -maxdepth 1 -type f -name "$file_pattern" | wc -l)
    if [ "$backup_file_count" -lt "$min_backup_count" ]; then
        echo "备份文件数量小于最小保留数量 ${min_backup_count}，不执行清理操作。"
        exit 0
    fi

    # 获取一年前的日期，格式为 YYYYMMDD
    one_year_ago=$(date -d "1 year ago" +"%Y%m%d")

    # 遍历指定目录中匹配模式的备份文件
    for backup_file in ${backup_dir}/${file_pattern}; do
        # 检查文件是否存在，以避免没有匹配文件时出现问题
        if [ -e "$backup_file" ]; then
            # 从文件名中提取日期部分（假设格式为 cmisYYYYmmddHHMM.tar.gz）
            file_date=$(basename "$backup_file" | grep -oP '\d{8}')

            # 比较文件日期和一年前的日期，删除一年前的备份文件
            if [ "$file_date" -lt "$one_year_ago" ]; then
                echo "remove file $backup_file"
                #rm -f $backup_file
            fi
        fi
    done
}

# 示例
clear_old_backups "/home/weblogic/scripts/backup" "cmis20*.war" 5

```

这里一年前可以按需改成指定的日期前，按照年、月、周、天都可以，在 Linux 中基本都支持的：

```bash
weblogic@weblogic:~/scripts$ date -d "1 year ago" +'%Y%m%d'
20230531
weblogic@weblogic:~/scripts$ date -d "1 month ago" +'%Y%m%d'
20240501
weblogic@weblogic:~/scripts$ date -d "1 week ago" +'%Y%m%d'
20240524
weblogic@weblogic:~/scripts$ date -d "3 days ago" +'%Y%m%d'
20240528
```

## 命令返回值检查

### 检查上一条命令的返回

```bash
#!/bin/bash

# 定义关键词变量
check_key="restart OK"

# 执行命令并获取输出
output=$(your_command_here)

# 打印输出（用于调试）
echo "Command output: $output"

# 检查输出中是否包含关键词
if echo "$output" | grep -v grep | grep -q "$check_key"; then
    echo "Output contains $check_key"
else
    echo "Output does not contain $check_key"
fi

```