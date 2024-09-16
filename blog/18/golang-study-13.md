# Go 学习笔记（13）：开发一个简单的端口转发程序

由于内外网限制问题，我经常需要使用 Nginx 配置一些反向代理来保证内网请求正常转发，但是 Nginx 的配置有时候由于缺乏关键配置导致代理无效，于是我会使用 nc 命令来进行端口转发，但是这种方式比较混乱，不方便管理，因此，我打算使用 go 开发一个简单的端口转发程序完成此需求，以下是开发过程。

## 我的需求

需求用一句就能说清楚：就是实现本地端口转发到远程端口，并且支持多组端口同时监听，也就是将本地当做一个代理服务器使用。

其实这个需求我之前有一篇文章有解决方案，使用的是 Linux 的一些命令行工具实现的，具体可以查看文章[《Linux 端口转发的几种方法》](https://tendcode.com/subject/article/linux-port-to-port/ "《Linux 端口转发的几种方法》")

但是如果要转发的端口比较多，使用命令行一个一个的转发就比较乱，不便于管理，于是才考虑使用 go 实现。

## 程序开发和使用

### 项目介绍

项目名称为 [go-port-forward](https://github.com/Hopetree/go-port-forward "go-port-forward") 先看一下项目结构：

```text
go-port-forward
├── LICENSE
├── README.md
├── config-simple.yaml
├── config.yaml
├── go.mod
├── go.sum
├── main.go
├── .github
│   └── workflows
│       └── go-releaser.yml
├── .gitignore
├── .goreleaser.yml
└── monitor.sh
```

主要文件和目录作用：

- `main.go`：程序的入口，实现整个程序的全部功能
- `monitor.sh`：一个 shell 脚本，用来管理进程，实现了进程的启动、停止、重启和状态检查。
- `config-simple.yaml`：端口转发规则的模板，可以将此文件拷贝成 `config.yaml` 来使用，真正起作用的配置是 `config.yaml`文件
- `.goreleaser.yml`：go 的编译配置文件，用来编译项目形成二进制可执行文件
- `go-releaser.yml`：GitHub 的编排文件，用来触发 GitHub Actions 任务自动编译出包

### 关键代码解析

直接看完整的 `main.go` 代码吧，内容并不多，后续可能随着功能的增加进行优化，这里贴第一版也可以：

```go
package main

import (
	"context"
	"fmt"
	"gopkg.in/yaml.v2"
	"io"
	"log"
	"net"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
)

// Config 结构定义了配置文件的结构
type Config struct {
	PortForwards []PortForward `yaml:"port_forwards"`
}

// PortForward 结构定义了单个端口转发的配置
type PortForward struct {
	LocalPort    int    `yaml:"local_port"`
	RemoteAddr   string `yaml:"remote_addr"`
	RemotePort   int    `yaml:"remote_port"`
	ProtocolType string `yaml:"protocol_type"`
}

func main() {
	// 读取配置文件
	config, err := readConfig("config.yaml")
	if err != nil {
		log.Fatalf("Failed to read config file: %v", err)
	}

	// 创建上下文
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 启动端口转发服务
	var wg sync.WaitGroup
	for _, pf := range config.PortForwards {
		wg.Add(1)
		go func(pf PortForward) {
			defer wg.Done()
			startPortForward(ctx, cancel, pf)
		}(pf)
	}
	wg.Wait()
}

// readConfig 从配置文件中读取配置信息
func readConfig(filename string) (*Config, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %v", err)
	}

	var config Config
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %v", err)
	}

	return &config, nil
}

// startPortForward 启动端口转发服务
func startPortForward(ctx context.Context, cancel context.CancelFunc, pf PortForward) {
	sourcePort := fmt.Sprintf(":%v", pf.LocalPort)
	destinationAddress := fmt.Sprintf("%s:%v", pf.RemoteAddr, pf.RemotePort)

	listener, err := net.Listen("tcp", sourcePort)
	if err != nil {
		log.Fatalf("Failed to listen on %s: %v", sourcePort, err)
	}
	defer func(listener net.Listener) {
		_ = listener.Close()
	}(listener)
	log.Printf("PID %d: Listening on %s and forwarding to %s", os.Getpid(), sourcePort, destinationAddress)

	// 监听系统信号
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		log.Printf("PID %d: Received signal: %s. Shutting down.", os.Getpid(), sig)
		cancel() // 取消上下文，停止新的连接接受
		_ = listener.Close()
	}()

	for {
		select {
		case <-ctx.Done():
			log.Printf("PID %d: Context cancelled, shutting down listener on %s", os.Getpid(), sourcePort)
			return
		default:
			clientConn, err := listener.Accept()
			if err != nil {
				if strings.Contains(err.Error(), net.ErrClosed.Error()) {
					log.Printf("PID %d: Temporary accept error: %v", os.Getpid(), err)
					return // 退出循环，避免持续打印错误日志
				}
				log.Printf("PID %d: Failed to accept connection: %v", os.Getpid(), err)
				break
			}
			log.Printf("PID %d: Accepted connection from %s", os.Getpid(), clientConn.RemoteAddr())
			go handleConnection(ctx, clientConn, destinationAddress)
		}
	}
}

// handleConnection 处理连接
func handleConnection(ctx context.Context, clientConn net.Conn, destinationAddress string) {
	defer func(clientConn net.Conn) {
		_ = clientConn.Close()
	}(clientConn)
	log.Printf("PID %d: Handling connection to %s", os.Getpid(), destinationAddress)

	serverConn, err := net.Dial("tcp", destinationAddress)
	if err != nil {
		log.Printf("PID %d: Failed to connect to destination %s: %v", os.Getpid(), destinationAddress, err)
		return
	}
	defer func(serverConn net.Conn) {
		_ = serverConn.Close()
	}(serverConn)

	doneChan := make(chan struct{})

	go copyData(ctx, clientConn, serverConn, doneChan)
	go copyData(ctx, serverConn, clientConn, doneChan)

	select {
	case <-ctx.Done():
		log.Printf("PID %d: Context cancelled, closing connections", os.Getpid())
	case <-doneChan:
		log.Printf("PID %d: Data transfer completed, closing connections", os.Getpid())
	}
}

// copyData 复制数据
func copyData(ctx context.Context, dst net.Conn, src net.Conn, doneChan chan struct{}) {
	log.Printf("PID %d: Starting data copy from %s to %s", os.Getpid(), src.RemoteAddr(), dst.RemoteAddr())
	_, err := io.Copy(dst, src)
	if err != nil {
		select {
		case <-ctx.Done():
			log.Printf("PID %d: Context cancelled, stopping data copy from %s to %s", os.Getpid(), src.RemoteAddr(), dst.RemoteAddr())
			return
		default:
			if strings.Contains(err.Error(), "use of closed network connection") {
				log.Printf("PID %d: Connection closed during data copy from %s to %s", os.Getpid(), src.RemoteAddr(), dst.RemoteAddr())
			} else {
				log.Printf("PID %d: Error copying data from %s to %s: %v", os.Getpid(), src.RemoteAddr(), dst.RemoteAddr(), err)
			}
		}
	}
	log.Printf("PID %d: Completed data copy from %s to %s", os.Getpid(), src.RemoteAddr(), dst.RemoteAddr())
	doneChan <- struct{}{}
}
```

这里主要实现了几个函数和功能：

- `copyData`：实现了本地和远程的请求内容的互相传递，当客户端向本地发起请求时，将客户端的请求内容转给远程，反之亦然，所谓的端口转发也就是复制请求和返回的内容。
- `handleConnection`：实现每个请求连接的处理逻辑
- `startPortForward`：实现每个端口的转发功能，监听本地端口，并且将请求转发给远程
- `readConfig`：读取配置文件内容转化成结构体
- `main`：程序运行函数，实现从配置读取端口转发规则并监听多个端口的能力，并且在运行初期创建上下文，以便于各个 goroutine 之间传递程序运行状态。

### 使用效果

自己编译打包的话，执行命令：

```bash
go mod tidy
go build
```

打包之后会在项目目录下形成一个二进制可执行文件 `go-port-forward`。

然后编辑配置文件，内容格式如下（目前只实现和验证了 tcp 请求，udp 暂时没有实现）：

```yaml
port_forwards:
  - local_port: 8080
    remote_addr: "192.168.0.100"
    remote_port: 8080
    protocol_type: "tcp"
  - local_port: 7001
    remote_addr: "192.168.0.100"
    remote_port: 7001
    protocol_type: "tcp"
```

启动的话执行脚本命令：

```bash
sh monitor.sh start
```

此时可以查看日志 `go-port-forward.log`：

```log
2024/06/11 09:56:35 PID 25332: Listening on :7001 and forwarding to 192.168.0.212:7001
2024/06/11 09:56:35 PID 25332: Listening on :8080 and forwarding to 192.168.0.212:8080
2024/06/11 09:56:59 PID 25332: Accepted connection from 100.92.152.121:63707
2024/06/11 09:56:59 PID 25332: Handling connection to 192.168.0.212:8080
2024/06/11 09:56:59 PID 25332: Starting data copy from 100.92.152.121:63707 to 192.168.0.212:8080
2024/06/11 09:56:59 PID 25332: Starting data copy from 192.168.0.212:8080 to 100.92.152.121:63707
2024/06/11 09:57:01 PID 25332: Completed data copy from 100.92.152.121:63707 to 192.168.0.212:8080
2024/06/11 09:57:01 PID 25332: Data transfer completed, closing connections
2024/06/11 09:57:01 PID 25332: Connection closed during data copy from 192.168.0.212:8080 to 100.92.152.121:63707
2024/06/11 09:57:01 PID 25332: Completed data copy from 192.168.0.212:8080 to 100.92.152.121:63707
```

## 新知识点整理

### context 上下文的使用

Go 语言中的 `context` 包提供了上下文管理的功能，主要用于在 API 边界上传递请求范围内的变量、取消信号、超时和截止日期等信息。`context` 在并发编程中非常有用，尤其是在处理超时和取消操作时。下面将介绍一些常见的使用场景，并通过示例代码进行说明。

#### 1. 基本使用

`context` 包提供了两个主要的上下文类型：

- `context.Background()`：返回一个空的上下文，通常用于主函数、初始化和测试。
- `context.TODO()`：返回一个空的上下文，表示还不知道具体的上下文信息。

示例代码：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    ctx := context.Background()
    fmt.Println(ctx)
    
    todoCtx := context.TODO()
    fmt.Println(todoCtx)
}
```

#### 2. 传递取消信号

使用 `context.WithCancel` 创建一个可取消的上下文，并在需要时调用取消函数。

示例代码：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    go func() {
        // 模拟工作
        time.Sleep(2 * time.Second)
        cancel()  // 取消上下文
    }()

    select {
    case <-ctx.Done():
        fmt.Println("工作取消:", ctx.Err())
    }
}
```

#### 3. 超时控制

使用 `context.WithTimeout` 创建一个带有超时的上下文。

示例代码：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()

    select {
    case <-time.After(5 * time.Second):
        fmt.Println("操作完成")
    case <-ctx.Done():
        fmt.Println("操作超时:", ctx.Err())
    }
}
```

#### 4. 设置截止日期

使用 `context.WithDeadline` 创建一个带有截止日期的上下文。

示例代码：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    deadline := time.Now().Add(3 * time.Second)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    select {
    case <-time.After(5 * time.Second):
        fmt.Println("操作完成")
    case <-ctx.Done():
        fmt.Println("达到截止日期:", ctx.Err())
    }
}
```

#### 5. 在并发任务中传递上下文

在多个 Goroutine 之间传递上下文，以便于协调工作取消或超时。

示例代码：

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("工人 %d: 接收到取消信号\n", id)
            return
        default:
            fmt.Printf("工人 %d: 正在工作\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    for i := 1; i <= 3; i++ {
        go worker(ctx, i)
    }

    // 等待所有工作完成或超时
    <-ctx.Done()
    fmt.Println("主程序: 取消所有工人")
}
```

#### 6. 在 HTTP 服务器中使用上下文

在处理 HTTP 请求时，可以通过上下文传递请求范围内的变量和控制取消操作。

示例代码：

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    fmt.Println("处理请求")
    select {
    case <-time.After(5 * time.Second):
        fmt.Fprintln(w, "请求处理完成")
    case <-ctx.Done():
        fmt.Println("请求取消:", ctx.Err())
        http.Error(w, "请求取消", http.StatusRequestTimeout)
    }
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}
```

### signal 系统信号的使用

Go语言中，系统信号处理是通过标准库`os/signal`来实现的。Go语言提供了一个简洁且强大的机制来处理操作系统信号，这在编写需要响应外部事件的服务器或其他长期运行的进程时特别有用。以下是对Go语言中系统信号处理的详细介绍：

#### 1. 信号包 (`os/signal`)

`os/signal`包提供了一个信号通知机制，通过它可以接收和处理系统信号。

主要函数：

- `signal.Notify(c chan<- os.Signal, sig ...os.Signal)`: 注册通道`c`以接收特定的信号`sig`。
- `signal.Stop(c chan<- os.Signal)`: 停止通道`c`接收信号。

信号通常由常量表示，例如：

- `syscall.SIGINT`：终止程序（通常由Ctrl+C触发）。
- `syscall.SIGTERM`：请求程序终止。
- `syscall.SIGHUP`：挂起进程。

#### 2. 示例代码

以下是一个简单的示例，演示如何在Go程序中捕获和处理系统信号：

```go
package main

import (
    "fmt"
    "os"
    "os/signal"
    "syscall"
)

func main() {
    // 创建一个通道用于接收信号
    sigs := make(chan os.Signal, 1)
    // 注册信号
    signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

    // 使用一个goroutine等待信号
    go func() {
        sig := <-sigs
        fmt.Println("收到信号:", sig)
        // 在这里可以处理信号，例如进行清理操作
        os.Exit(0)
    }()

    // 模拟程序运行
    fmt.Println("程序运行中，按Ctrl+C终止")
    select {}
}
```

#### 3. 深入理解

**通道缓冲**：在`signal.Notify`中创建一个缓冲通道是推荐的做法，因为这样可以避免信号丢失。缓冲区大小可以根据需要调整：

```go
sigs := make(chan os.Signal, 1)
```

**多个信号处理**：可以在`signal.Notify`中注册多个信号，当任一信号到来时，通道都会收到通知：

```go
signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)
```

**停止接收信号**：调用`signal.Stop(c)`可以停止特定通道接收信号：

```go
signal.Stop(sigs)
```