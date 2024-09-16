# Linux 学习笔记 ——第（1）期

这周是9月第2周，在接手同事的容器化代码和自动部署代码之后发现了自己很大的问题，那就是对 Linux 的脚本和一些常用的命令还不是很熟悉，经常要去查命令的用法，于是决定还是开个分类每周一篇文章来记录一下每天用到或者见到的命令，算是一种笔记吧！

## Linux 命令
### alias 命令
alias 命令的作用是给指令设置一个别名，使用方法是使用引号输出一个指令并且赋值给一个变量名称即可。

看一些系统已经定义过的例子：
```bash
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'
alias grep='grep --color=auto'
alias l='ls -CF'
alias la='ls -A'
alias ll='ls -alF'
alias ls='ls --color=auto'
```

### ${:-} 等命令
这是一类命令的用法，使用场景一般是需要判断某个变量是否被设置了值，然后根据设置的值的类型（未设置、空值、非空值）来重新取值。

看例子：
```bash
#!/bin/bash

bash_var='test'

var1='abcd'
var1=${var1:-$bash_var}
echo $var1

var2=
var2=${var2:-$bash_var}
echo $var2
```
上面代码执行的结构是：
```
abcd
test
```
这种格式的用法就是，当变量var设置了值且不为空的时候，var重新设置后的值就是var第一次的值，当var为空或者没设置的时候，var重新取的值就是bash_var的值。

这种用法的更多类似的用法：

```bash
bash_var='abcd'
var=''
var=${var-$bash_var} #若 $var 没有设定，则使用 $bash_var 作传回值。(空值及非空值时不作处理)
var=${var:-$bash_var} #若 $var 没有设定或为空值，则使用 $bash_var 作传回值。 (非空值时不作处理)
var=${var+$bash_var} #若 $var 设为空值或非空值，均使用 $bash_var 作传回值。(没设定时不作处理)
var=${var:+$bash_var} #若 $var 为非空值，则使用 $bash_var 作传回值。 (没设定及空值时不作处理)
var=${var=$bash_var} #若 $var 没设定，则使用 $bash_var 作传回值，同时将 $var 赋值为 $bash_var 。 (空值及非空值时不作处理)
var=${var:=$bash_var} #若 $var 没设定或为空值，则使用 $bash_var 作传回值，同时将 $var 赋值为 $bash_var 。 (非空值时不作处理)
var=${var?$bash_var} #若 $var 没设定，则使用 $bash_var 作传回值。 (空值及非空值时不作处理)
var=${var:?$bash_var} #若 $var 没设定或为空值，则使用 $bash_var 作传回值。 (非空值时不作处理)
```

## Linux 脚本
### 自定义日志
在写 shell 脚本的时候，很多时候我们都需要把一些关键的步骤执行的结果记录到日志中，这样在出现问题的时候比较方便定位问题，下面是我最近使用的比较多的一个日志函数

```bash
##################### LOGGER FUNCTION #########################
LOG_FILE=./init.log

logger()
{
    echo "[$(date +'%F %T')] $*" >> ${LOG_FILE}
}

alias LOG_INFO='logger [INFO] [$$] [${BASH_SOURCE}:${LINENO}]'
alias LOG_WARN='logger [WARN] [$$] [${BASH_SOURCE}:${LINENO}]'
alias LOG_ERROR='logger [ERROR] [$$] [${BASH_SOURCE}:${LINENO}]'

#eg: LOG_INFO "install DB successfully !"
######################## END FUNCTION #########################
```
**函数解读**：首先这个函数需要指定一个日志保存的文件，当然，这个文件具有读写权限是前提；然后我们定义了一个基础的日志函数 logger()，这个函数做的事情比较简单，就是将输入的信息写到日志文件，在每条日志前面写了时间信息；最后就是使用 alias 命令来自定义几个日志命令，并且在日志中显示进程、执行的脚本名称、命令执行的行号等信息。


## Linux 相同与差异

### 单引号和双引号
在写 Python 代码的时候，我习惯上是能写单引号的就不会使用双引号，这个习惯在写 shell 脚步的时候经常出现问题，其实这个问题我早就知道了，但是为了让自己加深印象，所以还是记录一下。

1. 单引号属于强引用，它会忽略所有被引起来的字符的特殊处理，被引用起来的字符会被原封不动的使用
2. 双引号属于弱引用，可以实现变量的替换和命令的替换

直接看代码：

```bash
#!/bin/bash

bash_var="abcd"

var1='$bash_var is a str'
echo $var1

var2="$bash_var is a var"
echo $var2

var3="`date +'%F %T'` is today"
echo $var3
```
输出结果：
```
$bash_var is a str
abcd is a var
2018-09-22 12:05:50 is today
```

总结：在需要强制表示字符串的时候使用单引号比较好，在有变量或者命令需要引号和执行的时候应该选用双引号。

### 反引号和 $()
反引号和 $() 都可以表示命令的执行结果，它们之间的不同点在于：

1. $() 并不是在每一种 shell 中都可以使用，在 bash 版本中肯定可以使用，但是反引号对每一个版本都支持
2. 反引号和 $() 的不同点主要在对转义字符反斜杠`\`的解释上，具体不同点可以看代码：

```bash
#!/bin/bash

var='python'
var1=`echo \$var`
echo $var1
var2=$(echo \$var)
echo $var2
var11=`echo \\$var`
echo $var11
var22=$(echo \\$var)
echo $var22
```
输出结果：

```
python
$var
$var
\python
```

结论：$() 中每一个转义字符就是转义字符的含义，反引号中转义字符为一个时无意义，两个连续的转义字符可以起到一个转义字符的意义。


## 工具推荐
### SwitchHosts
- 工具介绍：这是一个用于快速切换 hosts 文件的小程序，基于 Electron 开发，同时使用了 React、Ant Design 以及 CodeMirror 等框架/库。
- 推荐理由：工作中经常涉及到切换不同的环境 VPN，于是经常需要变更 hosts 配置文件，这个工具实现了一键切换配置，非常方便。
- Github 地址：[https://github.com/oldj/SwitchHosts](https://github.com/oldj/SwitchHosts)
- 工具界面：

![image](https://tendcode.com/cdn/article/180913/capture.png)