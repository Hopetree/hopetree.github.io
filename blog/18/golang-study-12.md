# Go 学习笔记（12）：使用Viper读取配置文件

最近在学习和试用一些开源的项目，主要是一些用来快速开发 Web 服务的脚手架之类的项目，一方面是为了能够了解 Go 开发项目的一般思路，另一方面是为了从这些开源框架中找到共同点，从而积累一些比较通用的用法。这篇主要是学习到了比较通用的配置文件读取的方法。

每个项目肯定有读取配置文件的模块，现在主流的配置文件应该就是 `yaml` 配置了，这也是我最喜欢的配置文件格式。经过比较，我发现 Go 里面主流的配置文件读取使用的是第三方库 `Viper`，当然，这个库支持各种配置文件格式，并不限于 `yaml`。

## 命令行读取配置文件路径

一般项目运行的时候可以使用命令行参数来指定配置文件路径，这是很多命令行工具都具备的能力，比如下面这种：

```bash
./server -c ./conf/conf.yaml
```

关于如何定义命令行参数并从参数中获取值，之前我记录过一个开源的命令行库 `cli`，但是其实那个库比较适合命令比较多的命令行工具，而如果是命令需要读取的参数很少的时候，用 `cli` 感觉大材小用了。

当然，你也可以不用任何库来读取命令行参数，直接使用 `args` 也是可以的，但是我还是喜欢可以自己定义参数，这样不仅灵活，而且可以有一个帮助信息让用户知道有什么命令参数。

我发现了一个标准库可以做这种简单的命令行参数定义，就是 `flag`库，直接来一个例子：

```go
package main

import (
	"flag"
	"fmt"
)

func main() {
	// 定义命令行参数
	var (
		envConf  = flag.String("conf", "config/local.yml", "config path, eg: -conf=./config/local.yml")
		logLevel = flag.String("loglevel", "info", "log level, eg: -loglevel=debug")
		port     = flag.Int("port", 8080, "server port, eg: -port=8080")
	)

	// 解析命令行参数
	flag.Parse()

	// 打印解析结果
	fmt.Println("Config File Path:", *envConf)
	fmt.Println("Log Level:", *logLevel)
	fmt.Println("Server Port:", *port)
}

```

正如例子的注释，定义一个参数就很简单的一行命令，然后你可以定义多个参数，最后解析一下命令行就可以了。

相较于 `cli` 库，这个 `flag` 是一个标准库，而且具备的命令行功能也挺够用的，特别是对于一些非命令行工具的项目，又要使用到一些命令行的参数，那这个 `flag` 库肯定是首选。

## Viper 的使用

直接看代码：

```go
package main

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

func NewConfig(p string) *viper.Viper {
	// 这里是先读取环境变量的配置地址，环境变量的配置路径优先级更高
	envConf := os.Getenv("APP_CONF")
	if envConf == "" {
		envConf = p
	}
	fmt.Println("load conf file:", envConf)
	return getConfig(envConf)
}

func getConfig(path string) *viper.Viper {
	conf := viper.New()
	conf.SetConfigFile(path)
	err := conf.ReadInConfig()
	if err != nil {
		panic(err)
	}
	return conf
}

func main() {
	envConf := "config/local.yml"

	conf := NewConfig(envConf)

	version := conf.GetString("app.version")

	// 设置一个默认值，如果没有读取到配置文件的内容就使用默认值
	conf.SetDefault("app.key", "abc")
	key := conf.GetString("app.key")

	fmt.Println(version)
	fmt.Println(key)

}
```


我对这个库的几个认知（使用技巧）：

- 可以结合命令行工具使用，用命令行传入配置文件路径，也可以直接读取环境变量的配置文件路径
- 读取配置项的时候如果没有读取到，则会得到一个该类型的默认值，所以有必要的时候，可以自行设置一个默认值，优先级为：配置值 > 默认值 > 类型默认值

## 总结

在项目里，如果对命令行参数有一定要求但是不需要复杂的子命令行，则可以使用标准库的 `flag` 来读取命令行参数；对于项目的配置文件的解析，可以使用 `viper` 库，支持各种常用的配置文件的解析。