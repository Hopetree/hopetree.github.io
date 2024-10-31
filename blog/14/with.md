# Python 上下文管理及 with 语句的实用技巧

Python 有很多魔法方法，本文记录一下可以自定义 with 语句的上下文管理器所使用到的两个魔法方法，也就是 `__enter__` 和 `__exit__` 方法的实用性。

## 自定义上下文管理类

最常见的 with 语句就是 open 函数了，这里不做解释，直接来看一个自定义类的例子。

```python
class TestHandler():
    def __init__(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print('exc_type:', exc_type)
        print('exc_val:', exc_val)
        print('exc_tb:', exc_tb)

    def func(self):
        print(1 + 1)

    def bad_func(self):
        print('a' + 1)
```

上面定义了一个类，这个类定义了两个打印值的方法，其中一个方法会报错，同时该类使用到了两个魔法方法，有了这两个方法，这个类就可以使用 with 语句来进行调用，来看看调用正常函数的结果：

```python
with TestHandler() as t:
    t.func()
```

结果如下：
```bash
2
exc_type: None
exc_val: None
exc_tb: None
```

再来看看调用报错函数的结果
```python
with TestHandler() as t:
    t.bad_func()
```

```bash
exc_type: <class 'TypeError'>
exc_val: Can't convert 'int' object to str implicitly
exc_tb: <traceback object at 0x0000021CEB484B08>
Traceback (most recent call last):
  File "D:/Mycode/TestCase/mark.py", line 23, in <module>
    t.bad_func()
  File "D:/Mycode/TestCase/mark.py", line 17, in bad_func
    print('a' + 1)
TypeError: Can't convert 'int' object to str implicitly
```

从上面两次调用，可以看到，`__exit__` 函数里面的三个参数（定义函数的时候默认会要求加入）分别代表了报错类型、报错原因、报错追溯，只有当 with 语句调用报错时候，这三个参数才有值，否则就是 None，看到这里，你是否能够想到什么？可以利用这三个参数进行异常判断和处理。

## 上下文管理实用性

已经知道如何定义 with 语句了，也知道遇到异常会出现什么，那么现在来看看自定义 with 语句的使用场景有哪些。

### 数据库连接操作

with 语句比较适合的场景是打开->操作->关闭，在我们常用的除了文件操作外，还有数据库操作、SSH 操作会涉及这个过程，所以，直接看看这两个操作的例子。

```python
import sqlite3

class DBHandler():

    def __init__(self, database):
        self.database = database
        self.conn = sqlite3.connect(self.database)
        self.cursor = self.conn.cursor()

    def __enter__(self):
        return self.cursor

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.conn.commit()
        self.conn.close()
```

上面这个关于数据操作的例子就很典型，它包括了数据库连接、数据库操作（with 语句之后）、异常处理、数据库关闭连接等操作。

看一下 with 语句的使用：

```python
with DBHandler(database) as db:
    db.executescript(create_sql)
```

是不是非常的方便，当然，如果再结合 try 语句来进行连接操作，就更安全可靠。


### SSH 连接操作

再来看看 SSH 的操作例子

```python
import paramiko

class SSHClient:
    def __init__(self, hostname, username, password, port=22):
        self.hostname = hostname
        self.username = username
        self.password = password
        self.port = port
        self.client = None

    def connect(self):
        if self.client is None:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(self.hostname, port=self.port, username=self.username, password=self.password)
    
    def execute_command(self, command):
        if self.client is None:
            raise Exception("SSH client is not connected")
        stdin, stdout, stderr = self.client.exec_command(command)
        return stdout.read().decode('utf-8'), stderr.read().decode('utf-8')

    def close(self):
        if self.client:
            self.client.close()
            self.client = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()
        if exc_type:
            print(f"An exception occurred: {exc_value}")
        return False  # 不处理异常，异常会被重新抛出

# 使用示例

# 使用 with 语句
with SSHClient('hostname', 'username', 'password') as ssh:
    stdout, stderr = ssh.execute_command('ls -l')
    print("STDOUT:", stdout)
    print("STDERR:", stderr)

# 交互式执行命令
with SSHClient('hostname', 'username', 'password') as ssh:
    shell = ssh.client.invoke_shell()
    shell.send('ifconfig\n')
    time.sleep(1)
    output = shell.recv(1024).decode()
    print(output)
	
# 直接连接
ssh = SSHClient('hostname', 'username', 'password')
ssh.connect()
stdout, stderr = ssh.execute_command('ls -l')
print("STDOUT:", stdout)
print("STDERR:", stderr)
ssh.close()

```

很明显，上面的自定义类 with 语句返回的是一个 SSHClient 对象，所以使用时直接按照这个对象的方法调用即可，调用结束会自动断开连接。

### Telnet 连接操作

下面是封装的一个Telnet客户端类，以实现与Telnet协议的连接、执行命令和安全关闭连接的功能

```python
import telnetlib
import time

class TelnetClient:
    def __init__(self, hostname, username, password, port=23):
        self.hostname = hostname
        self.username = username
        self.password = password
        self.port = port
        self.client = None

    def connect(self):
        if self.client is None:
            self.client = telnetlib.Telnet(self.hostname, self.port, timeout=10)
            self._login()

    def _login(self):
        self.client.read_until(b'Username: ')
        self.client.write(self.username.encode('ascii') + b'\n')
        self.client.read_until(b'Password: ')
        self.client.write(self.password.encode('ascii') + b'\n')
        time.sleep(1)  # 等待登录完成

    def execute_command(self, command):
        if self.client is None:
            raise Exception("Telnet client is not connected")
        self.client.write(command.encode('ascii') + b'\n')
        time.sleep(1)  # 等待命令执行
        return self.client.read_very_eager().decode('ascii')

    def close(self):
        if self.client:
            self.client.write(b'exit\n')
            self.client.close()
            self.client = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()
        if exc_type:
            print(f"An exception occurred: {exc_value}")
        return False  # 不处理异常，异常会被重新抛出

# 使用示例
if __name__ == "__main__":
    with TelnetClient('192.168.1.1', 'admin', 'password') as telnet:
        output = telnet.execute_command('show ip interface brief')
        print("Command Output:\n", output)

    # 交互式执行命令
    with TelnetClient('192.168.1.1', 'admin', 'password') as telnet:
        shell = telnet.client  # 获取Telnet客户端
        shell.write(b'ifconfig\n')  # 执行命令
        time.sleep(1)
        output = shell.read_very_eager().decode('ascii')  # 读取输出
        print("Interactive Command Output:\n", output)

    # 直接连接
    telnet = TelnetClient('192.168.1.1', 'admin', 'password')
    telnet.connect()
    output = telnet.execute_command('show version')
    print("Command Output:\n", output)
    telnet.close()
```

总结：自定义 with 语句简单理解就是非常适合一些“有始有终”的场景，通过自定义上下文管理器，可以把一些需要重复执行的固定操作简化，只需要关注特定的操作本身。