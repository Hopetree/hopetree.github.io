# 服务器监控应用（2）：使用 Golang 开发客户端

对于数据采集和数据上报这种事情我再熟悉不过了，因为 CMDB 就是我们公司的产品之一，数据采集就是 CMDB 里面最基础的一环。

我们公司的产品都是使用 Python 脚本进行数据采集，因为开发速度快，调试方便，变更也很方便，但是需要一个执行环境，一般这种都是依靠一个安装在主机上面的 agent 提供的。而这次之所以采用 Go 来开发客户端就是考虑到用 Go 开发的客户端可以不需要依赖环境，只需要把代码兼容性做好，就可以直接运行在各种系统上。

## 1. 客户端开发

客户端要做的事情其实就是三件：数据采集、密钥解析、数据上报，所以从设计上我把这三个事情是分开成独立的事情来做，最终在生成的命令行工具里面也是提供了三个命令。

### 1.1 数据采集

数据采集主要依赖的是 Go 的第三方库 `github.com/shirou/gopsutil` 这个库是对标 Python 里面的 `psutil` 库的，主要用来获取一些系统相关的数据，比如内存、CPU、硬盘、系统，进程等等。

比如以下是一些采集的属性：

:::: code-group

::: code-item CPU型号

```go
func getCPUModelName() (string, error) {
	cpuInfo, err := cpu.Info()
	if err != nil {
		return "", err
	}

	var cpuModel string

	for _, info := range cpuInfo {
		cpuModel = info.ModelName
		break
	}
	return cpuModel, nil
}
```
:::

::: code-item 负载

```go
func getLoad() (string, string, string, error) {
	loadAvg, err := load.Avg()
	if err != nil {
		return "", "", "", err
	}

	load1 := fmt.Sprintf("%.2f", loadAvg.Load1)
	load5 := fmt.Sprintf("%.2f", loadAvg.Load5)
	load15 := fmt.Sprintf("%.2f", loadAvg.Load15)

	return load1, load5, load15, nil
}
```
:::

::: code-item 内存和缓存

```go
func getMemoryInfo() (uint64, uint64, error) {
	memory, err := mem.VirtualMemory()
	if err != nil {
		return 0, 0, err
	}

	memoryTotal := memory.Total
	memoryUsed := memory.Used

	return memoryTotal, memoryUsed, nil
}

```
:::

::: code-item 硬盘

```go
func getDiskUsage() (uint64, uint64, error) {
	partitions, err := disk.Partitions(false)
	if err != nil {
		return 0, 0, err
	}

	var total, used uint64

	switch runtime.GOOS {
	case "darwin":
		for _, partition := range partitions {
			if partition.Mountpoint == "/" {
				usageStat, err := disk.Usage(partition.Mountpoint)
				if err != nil {
					continue
				}
				total += usageStat.Total
				used += usageStat.Used
			}
		}
	default:
		for _, partition := range partitions {
			usageStat, err := disk.Usage(partition.Mountpoint)
			if err != nil {
				continue
			}
			total += usageStat.Total
			used += usageStat.Used
		}

	}

	DiskTotal := total
	DiskUsed := used

	return DiskTotal, DiskUsed, nil
}

```
:::

::::

数据采集这里也是要注意一些坑的，有的命令在不同系统中可能不一样，比如获取磁盘的数据，在 IOS 系统里面跟 Linux 里面是不同的，苹果系统只需要统计 `/` 路径的容量就够了。

然后还可以使用 `shell`命令来提取信息，比如网络数据：

```go
func getConnections() (int, int, error) {
	var tcp, udp int
	cmd := exec.Command("sh", "-c", "expr $(ss -t | wc -l) - 1")

	// 获取命令输出
	tcpString, err := cmd.Output()
	if err == nil {
		tcpNum, err := strconv.Atoi(strings.TrimSpace(string(tcpString)))
		if err == nil {
			tcp = tcpNum
			if tcp < 0 {
				tcp = 0
			}
		}
	}

	cmd = exec.Command("sh", "-c", "expr $(ss -u | wc -l) - 1")

	// 获取命令输出
	udpString, err := cmd.Output()
	if err == nil {
		udpNum, err := strconv.Atoi(strings.TrimSpace(string(udpString)))
		if err == nil {
			udp = udpNum
			if udp < 0 {
				udp = 0
			}
		}
	}

	return tcp, udp, nil
}

```

这种直接执行命令的方式可能更灵活，但是兼容性就不太行了，所以使用的时候需要充分考虑不同平台的不同命令。

### 1.2 密钥解析

客户端需要实现一个跟服务端一样的加解密工具，只要能使用给定的密钥对解析出原始的字符即可。

以下分别是Python和go的版本：

:::: code-group

::: code-item Python

```python
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

class AESCipher:
    def __init__(self, _key):
        self.key = _key

    def encrypt(self, _plaintext):
        _cipher = AES.new(self.key.encode(), AES.MODE_CBC)
        _plaintext = pad(_plaintext.encode(), AES.block_size)
        _encrypted_text = _cipher.iv + _cipher.encrypt(_plaintext)
        return base64.b64encode(_encrypted_text).decode()[:128]

    def decrypt(self, ciphertext):
        ciphertext = base64.b64decode(ciphertext)
        iv = ciphertext[:AES.block_size]
        _cipher = AES.new(self.key.encode(), AES.MODE_CBC, iv)
        _decrypted_text = unpad(_cipher.decrypt(ciphertext[AES.block_size:]), AES.block_size)
        return _decrypted_text.decode()
```
:::

::: code-item Go

```go
package tool

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"
)

type AESCipher struct {
	key []byte
}

func NewAESCipher(key string) *AESCipher {
	byteKey := []byte(key)
	return &AESCipher{byteKey}
}

func (c *AESCipher) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", err
	}

	plaintextBytes := []byte(plaintext)
	plaintextBytes = pkcs7Pad(plaintextBytes, aes.BlockSize)

	ciphertext := make([]byte, aes.BlockSize+len(plaintextBytes))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", err
	}

	mode := cipher.NewCBCEncrypter(block, iv)
	mode.CryptBlocks(ciphertext[aes.BlockSize:], plaintextBytes)

	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	if len(encoded) > 128 {
		return "", err
	}

	return encoded, nil
}

func (c *AESCipher) Decrypt(ciphertext string) (string, error) {
	ciphertextBytes, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", err
	}

	if len(ciphertextBytes) < aes.BlockSize {
		panic("ciphertext too short")
	}
	iv := ciphertextBytes[:aes.BlockSize]
	ciphertextBytes = ciphertextBytes[aes.BlockSize:]

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(ciphertextBytes, ciphertextBytes)

	return string(pkcs7Unpad(ciphertextBytes)), nil
}

func pkcs7Pad(src []byte, blockSize int) []byte {
	padding := blockSize - len(src)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(src, padText...)
}

func pkcs7Unpad(src []byte) []byte {
	length := len(src)
	unpadding := int(src[length-1])
	return src[:(length - unpadding)]
}

```
:::
::::

### 1.3 数据上报

数据上报就是按照服务端定义的的接口进行请求即可，接口定义如下：

- 请求地址：/monitor/server/push，解析密钥后得到
- 请求方法：POST
- 请求头：
	- Content-Type：application/json
	- Push-Username：用户名，解析密钥后得到
	- Push-Password：密码，解析密钥后得到
	- Push-Key：密钥Key
	- Push-Value：密钥值
- 请求体：JSON格式，需要提供数据采集的所有字段，并且格式满足规范，否则上报失败


### 1.4 编译成命令行工具

本地编译直接执行 `go build` 就行了，如果要发布版本，则需要创建一个 tag 利用 GitHub Actions 来打包成多个平台的软件包。

具体的打包过程可查看我的博文：[Go 学习笔记（11）：利用 GitHub Actions 进行多平台打包](https://tendcode.com/subject/article/go-releaser/ "Go 学习笔记（11）：利用 GitHub Actions 进行多平台打包")

## 2. 客户端使用

客户端版本下载地址：[https://github.com/Hopetree/GoMonitor/releases](https://github.com/Hopetree/GoMonitor/releases "https://github.com/Hopetree/GoMonitor/releases")

### 2.1 下载安装包

到客户端版本中选择最新的版本，下载跟当前系统匹配的安装包：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202404022216040.png)

下载后解压软件包：

```shell
tar -zxvf GoMonitor_0.1.1_linux_x86_64.tar.gz
```

这也就可以得到一个 `GoMonitor_0.1.1_linux_x86_64` 目录，客户端 `GoMonitor` 就在这个目录里面。

### 2.2 本地调试

#### 2.2.1 调试数据采集

首先可以执行仅采集数据的命令：

```shell
./GoMonitor collect
```

输出：

```shell
version cmd: echo ''
{"interval":6,"uptime":190047,"system":"darwin-23.1.0-arm64-darwin-14.1.2","cpu_cores":8,"cpu_model":"","cpu":44.98714652940142,"load_1":"5.45","load_5":"4.57","load_15":"3.85","memory_total":17179869184,"memory_used":13741309952,"swap_total":8589934592,"swap_used":7241531392,"hdd_total":494384795648,"hdd_used":213326909440,"network_in":"562.81K","network_out":"1.11M","process":566,"thread":4009,"tcp":0,"udp":0,"version":"","client_version":"0.1.1"}

```

第一条输出是默认的采集服务版本的命令，默认就是输出空字符串。第二条输出是一个 json 数据，也就是上报的数据结构，可以检查一下有没有什么数据采集失败或者数据不对的。

#### 2.2.2 调试密钥解析

然后可以调试一下解析密钥，比如下面这对密钥是我本地调试的密钥：

```shell
./GoMonitor decrypt -k df2433290c3245a59a15c5b5715bd910 -s JdjfCErtHYhcSFLl6efQDgZo4pepf/cbwjSAKd9jCCtNijL7Q+f1fr3mlZe64qVN+1cYQo+fJRARn905UgEUOuVnttobTmnH2pQRuvophvI=  
```

输出：

```shell
macbook::2242400032::http://127.0.0.1:8090/monitor/server/push
```

这个信息包括3个部分：用户名、密码、上报地址，这三个信息就是客户端向服务器上报的时候请求的信息。

#### 2.2.3 调试数据上报

如果数据采集和密钥解析都没有问题，那么此时可以调试一下数据上报，也就是给服务器上报一条数据，并得到返回信息。

```shell
./GoMonitor report -k df2433290c3245a59a15c5b5715bd910 -s JdjfCErtHYhcSFLl6efQDgZo4pepf/cbwjSAKd9jCCtNijL7Q+f1fr3mlZe64qVN+1cYQo+fJRARn905UgEUOuVnttobTmnH2pQRuvophvI= --debug

```

如果 `report` 命令中带有 `--debug` 参数则表示是调试模型，此时就会输出上报的数据和解析数据，然后输出服务器的接口返回，数据如下：

```shell
version cmd: echo ''
{"interval":6,"uptime":190673,"system":"darwin-23.1.0-arm64-darwin-14.1.2","cpu_cores":8,"cpu_model":"","cpu":21.910828025186774,"load_1":"3.22","load_5":"3.14","load_15":"3.37","memory_total":17179869184,"memory_used":13876232192,"swap_total":8589934592,"swap_used":7491878912,"hdd_total":494384795648,"hdd_used":213313060864,"network_in":"81.20K","network_out":"51.97K","process":570,"thread":3959,"tcp":0,"udp":0,"version":"","client_version":"0.1.1"}
macbook::2242400032::http://127.0.0.1:8090/monitor/server/push
{"code": 0, "error": "", "message": "", "data": {"interval": 6, "uptime": "2 \u5929", "system": "darwin-23.1.0-arm64-darwin-14.1.2", "cpu_cores": 8, "cpu_model": "", "cpu": 21.9, "load_1": "3.22", "load_5": "3.14", "load_15": "3.37", "memory_total": "16.0G", "memory_used": "12.92G", "swap_total": "8.0G", "swap_used": "6.98G", "hdd_total": "460.43G", "hdd_used": "198.66G", "network_in": "81.20K", "network_out": "51.97K", "process": 570, "thread": 3959, "tcp": 0, "udp": 0, "version": "", "client_version": "0.1.1", "memory": 80.8, "hdd": 43.1}}

```

这里有4条数据，第一条依然是采集服务版本的默认命令，第二条是上报的数据体，第三条是解析的服务器接口信息，第四条就是服务器返回的数据，如果 `code` 是0就表示上报成功，此时也可以在服务器上面看到新上报的数据。

更多命令和参数的含义可以查看工具帮助：

```shell
./GoMonitor --help
```

输出：

```shell
NAME:
   GoMonitor - 一个简单的agent客户端，用于采集主机信息并上报到服务端

USAGE:
   GoMonitor [global options] command [command options] 

VERSION:
   0.1.1

COMMANDS:
   collect  采集主机信息
   decrypt  解密密钥，并显示原文
   report   采集主机信息，并解析密钥，将信息上报到服务端，非调试模式不输出任何信息
   help, h  Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --help, -h     show help
   --version, -v  print the version
```

### 2.2 Linux 设置成系统服务

如果本地调试数据采集和上报都没问题，则可以将客服端设置成系统服务来运行，这样可以保证客户端随系统自启动。

操作步骤：

step1：将命令移动到指定目录：

```shell
cp GoMonitor /usr/local/bin/
chmod 755 /usr/local/bin/GoMonitor
```

step2：创建服务配置文件

```shell
vi /etc/systemd/system/gomonitor.service
```

内容如下：

```shell
[Unit]
Description = go monitor agent
After = network.target syslog.target
Wants = network.target

[Service]
Type = simple
ExecStart = /usr/local/bin/GoMonitor report -i 5 -k df2433290c3245a59a15c5b5715bd910 -s JdjfCErtHYhcSFLl6efQDgZo4pepf/cbwjSAKd9jCCtNijL7Q+f1fr3mlZe64qVN+1cYQo+fJRARn905UgEUOuVnttobTmnH2pQRuvophvI=

[Install]
WantedBy = multi-user.target
```

step3：加载配置，启动服务并设置成开机自启动

```shell
systemctl daemon-reload
systemctl start gomonitor
systemctl enable gomonitor
systemctl status gomonitor
```

::: info 提示

客户端在 Windows 上面也是可以运行的，数据采集已经得到验证，关于如何在 Windows 上面将程序设置成系统服务，可以查看我的博文: [《Windows 系统将 .exe 程序设置为系统服务的方案》](https://tendcode.com/subject/article/windows-system-service/ "Windows 系统将 .exe 程序设置为系统服务的方案")
:::

### 2.3 更新客户端

如果要更新客户端的版本，可以直接重新下载客户端的软件包，更新二进制文件，然后重新启动服务，比如我进行的操作：

```shell
tmp_dirname=/tmp/gomonitor
tag_name=0.2.2
systemctl stop gomonitor
mkdir ${tmp_dirname} && cd ${tmp_dirname}

wget https://github.com/Hopetree/GoMonitor/releases/download/v${tag_name}/GoMonitor_${tag_name}_linux_x86_64.tar.gz --no-check-certificate
tar -zxvf GoMonitor_${tag_name}_linux_x86_64.tar.gz
cd GoMonitor_${tag_name}_linux_x86_64
\cp GoMonitor /usr/local/bin/
chmod 755 /usr/local/bin/GoMonitor

systemctl daemon-reload
systemctl restart gomonitor
systemctl status gomonitor

rm -rf ${tmp_dirname}

```

## 客户端兼容性

目前已经验证过的系统如下：

| 内核  | 系统  |  验证 | 备注  |
| ------------ | ------------ | ------------ | ------------ |
| darwin  | macOS  |  OK | 磁盘信息单独处理 |
| linux  |  CentOS |  OK |   |
|  linux | Debian  |  OK |   |
|  linux | Ubuntu  |  OK |   |
|  linux | Redhat  |  OK |   |
|  linux | 群晖  |  OK | 系统版本单独获取  |
|  linux | PVE  |  OK |   |
| windows  |  Windows 11 | OK  | |

结论就是三大系统都是兼容的，只是个别采集指标（主要是TCP和UDP数据）无法兼容到。