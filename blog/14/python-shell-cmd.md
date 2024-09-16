# 使用 python 执行 shell 命令的几种常用方式

在使用 Python 编写自动化脚本的时候，难免会需要执行一些基本的 shell 命令，而 Python 执行 shell 命令的方式有好几种，如果根据需要选择最适合的方式显得非常重要，这篇文章就来总结和对比一下几种常见的 Python 运行 shell 命令的方式。

## 方法一：os.system()

`os.system()` 可以说是最为基本的运行 shell 命令的方式了，这个方法的特点就是直接运行命令，并将运行之后的状态值返回码返回，所以结果是一个 int 类型，这个方式比较常见是运用在只需要执行 shell 命令而不需要得到命令的返回结果的场景。

比如执行一个创建目录的操作就可以执行实用这个方法：

```bash
>>> import os
>>> cmd = "mkdir /tmp/tt"
>>> res = os.system(cmd)
>>> print(res)
0
>>> res = os.system(cmd)
mkdir: cannot create directory ‘/tmp/tt’: File exists
>>> print(res)
256
>>>
```

这个例子可以看到，当命令执行成功的时候可以返回0，而执行失败则返回的是256，所以可以根据返回码来判断命令是否执行成功。

## 方法二：os.popen()

`os.popen()` 方法执行命令之后会把成功执行的命令的结果以文件的形式返回，所以可以通过 read() 方法获取执行的结果，而如果执行失败，则文件为空，所以这个方法的适用场景是命令返回的结果比较多，需要进行提取结果的场景。

```bash
>>> import os
>>> cmd = "mkdir /tmp/tt2 && ls /tmp"
>>> res = os.popen(cmd)
>>> print(type(res))
<type 'file'>
>>> print(res.read())
tt
tt2
>>>
```

## 方法三：commands 模块

commands 模块主要常用的是下面两个方法：

- commands.getstatusoutput(cmd)         返回(状态码, 输出结果)
- commands.getoutput(cmd)               只返回输出结果

这个模块看起来就比较完善了，可以同时得到执行的状态码和输出结果，可以说是同时具备了 os.system() 和 os.popen() 的功能，实用性更强一些。

```bash
>>> import commands
>>> cmd = "cd /tmp && mkdir tt3 && ls"
>>> res = commands.getstatusoutput(cmd)
>>> print(res)
(0, 'tt\ntt2\ntt3')
>>> res = commands.getstatusoutput(cmd)
>>> print(res)
(256, 'mkdir: cannot create directory \xe2\x80\x98tt3\xe2\x80\x99: File exists')
>>>
```

上面的执行例子可以看到，commands.getstatusoutput(cmd) 方法的执行结果是一个元组，第一个结果是状态码，第二个是输出结果的字符串格式，所以如果想要在提取执行结果的同时获取到执行的成功与否，则可以直接使用这个方法。

## 方法四：subprocess 模块

subprocess 模块是官方比较推荐的模块，基本可以取代上面的三种方法，功能也更加强大，可以满足大部分的场景。

subprocess.call() 相当于 os.system() 命令的用法，它执行命令并将执行结果状态码返回。

直接看下面例子：

```bash
>>> import subprocess
>>> cmd = "cd /tmp && mkdir tt4 && ls"
>>> res = subprocess.call(cmd, shell=True)
tt   tt2  tt3  tt4  
>>> print(res)
0
>>>
```
subprocess 模块里面的方法执行 shell 命令的时候如果传入的命令是字符串的形式，那必须将参数 shell 设置为 True，不然默认就是使用的列表作为命令的传入参数，比如看下面这种不设置 shell=True 和设置的对比：

```bash
>>> res1 = subprocess.call(['ls', '-l'])
total 1
-rw-------. 1 root root 1579 May 31 12:08 anaconda-ks.cfg
>>> res1 = subprocess.call('ls -l', shell=True)
total 1
-rw-------. 1 root root 1579 May 31 12:08 anaconda-ks.cfg
>>>
```

可以看到，当不设置 shell=True 的时候，必须将命令分解成列表传入才能执行，这个据说是为了安全起见所以默认是关闭字符串执行的，不过在工作中使用的时候当然都是用字符串的方式执行了。

subprocess.Popen() 方法是我们项目代码中使用的，这个方法同样是可以输出执行的状态码和输出结果，但是参数比 commands 需要的多。

```bash
>>> cmd = "cd /tmp && mkdir tt6 && ls"
>>> res = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
>>> print(res.communicate())
('tt\ntt2\ntt3\ntt4\ntt5\ntt6\n', '')
>>>
```

使用 communicate() 方法可以得到执行结果的成功输出和报错输出，如果没有报错则报错为空字符串。

## 总结

以上就是常见的 Python 执行 shell 命令的方法，当然，上述都是内置库，也有第三方库可以实现 shell 执行，但是并不建议使用，毕竟官方提供的内置库已经可以满足大部分场景。我的建议是当执行的命令比较简单而且也不是经常调用的时候，可以直接使用 os.system()，而如果是需要把执行命令的方法写到函数中经常性的调用，则应该使用 subprocess.Popen() 这种更加高级的方法。