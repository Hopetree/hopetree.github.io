# Linux 系统 OOM 排查指南

## OOM 介绍

**OOM（Out of Memory，内存不足）** 是指 Linux 系统中可用内存资源耗尽的情况。当系统中的进程占用的内存总量超过了系统可用的物理内存和交换空间时，就会触发 OOM。这种情况通常发生在以下场景：

- 系统负载过高，大量进程同时运行并占用大量内存。
- 某些进程存在内存泄漏问题，不断消耗内存资源。
- 系统配置的内存资源不足，无法满足当前运行的应用程序需求。

当 OOM 发生时，内核会触发 **OOM Killer** 机制，自动选择并杀掉某些进程以释放内存资源，从而避免系统完全崩溃。然而，被杀掉的进程可能包括关键服务，这会导致服务中断、数据丢失或系统性能严重下降。

## 一、查看系统日志

### 1.1 dmesg 命令

```bash
dmesg | grep -i "killed process"
```

或

```bash
dmesg | grep -i "out of memory"
```

**输出示例：**

```
[12345.678901] Out of memory: Kill process 1234 (java) score 987 or sacrifice child
[12345.678902] Killed process 1234 (java) total-vm:204800kB, anon-rss:102400kB, file-rss:512kB
```

说明系统确实触发了 OOM，并显示被 kill 的进程信息。

### 1.2 查看日志文件

```bash
grep -i 'killed process' /var/log/messages
```

或

```bash
grep -i 'oom' /var/log/syslog
```

**不同系统日志文件：**

- RHEL/CentOS：`/var/log/messages`  
- Debian/Ubuntu：`/var/log/syslog`

## 二、使用 journalctl（适用于 systemd 系统）

```bash
journalctl -k | grep -i 'killed process'
```

结合时间范围查询最近记录：

```bash
journalctl -k --since "1 hour ago" | grep -i 'oom'
```

## 三、排查内存使用情况

### 3.1 查看内存使用历史（搭配监控工具）

如果部署了监控平台（如 Prometheus + Grafana、Zabbix、Nagios），可查看以下指标趋势图：

- Memory usage  
- Cache  
- Swap usage  
- OOM Kill 指标

重点关注是否有突发性内存飙升。

### 3.2 查看进程内存使用情况（实时 / 手动）

```bash
top
```

或

```bash
htop
```

或

```bash
ps aux --sort=-%mem | head -n 10
```

## 四、查看 OOM 统计信息

### 4.1 查看进程 OOM 评分

查看某个进程触发 OOM 的可能性评分（数值越高，被杀概率越大）：

```bash
cat /proc/<pid>/oom_score
```

## 五、其他建议

- 启用 `vm.panic_on_oom=1` 可在发生 OOM 时触发内核 panic（仅限高可靠系统，慎用）。  
- 启用 cgroups 限制内存使用的容器或服务，避免影响整个系统。  
- 在被 OOM 的服务中设置日志，间接确认异常退出原因。

## 总结

方法| 说明
---|---
dmesg / journalctl| 快速查看内核日志中是否有 OOM Kill
/var/log/messages / syslog| 系统级日志查看历史 OOM 信息
oom_score| 检查进程被 OOM Kill 的风险
监控系统| 排查内存异常变化的时段和趋势