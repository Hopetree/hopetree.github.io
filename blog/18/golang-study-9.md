# Go 学习笔记（9）：多并发爬虫下载图片

我是带着目的学习 Go 的，第一阶段的学习目的是能够写 API 调用，第二阶段就是可以写多并发的爬虫，毕竟 Go 是以搞并发闻名的，我倒要看看怎么个“高并发”。于是随便找了个图片网站实现了一个高并发的图片下载爬虫，速度那是真快！


## 技能要求

- 掌握 for 循环的使用
- 掌握函数调用
- 掌握 http 请求
- 掌握文件创建和写入
- 掌握并发编程中通道、`sync.WaitGroup`

以上“掌握”仅表示“会用”就行，并非完全掌握。

## 目标网站

网站地址：[https://www.dbbqb.com/](https://www.dbbqb.com/ "逗比拯救世界--专业的表情包搜索网站")

### 网站结构

**请求数据：**

请求地址：https://www.dbbqb.com/api/group?size=10&start=58

其中 `size` 表示每个请求返回的图片数量，`start` 表示起始位置，所以只需要每个请求变动 `start` 参数就可以实现翻页请求。

**返回数据：**

每个请求的返回数据都是一个标准的 json 格式，里面包含了一个列表，记录的是每个图片的路径和名称以及大小，格式非常简单。

![表情图片网站接口](https://tendcode.com/cdn/2024/02/pic000%20%281%29.png "表情图片网站接口")

### 爬虫思路

1. 利用多生产者多消费者模型，每个生产者解析一个请求地址，并将解析到的图片信息塞入通道中
2. 消费者从通道中拿到图片信息，并进行下载，启动多个消费者
3. 全部生产者执行结束的时候关闭通道，然后等待消费者全部结束，主进程就结束

## 爬虫源码解析

先看一下源码：

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
)

var (
	imagePath = "../spider/images/"
	pwg       sync.WaitGroup // 用来对生产者计数
	cwg       sync.WaitGroup // 用来对消费者计数
)

// 图片信息结构体
type imageUrl struct {
	url    string
	name   string
	result string
}

// 定义一个接口返回的结构体，用来将json转化成结构体进行数据解析
type pageResult []struct {
	TypeCn  string `json:"typeCn"`
	Details []struct {
		Path   string `json:"path"`
		Width  int    `json:"width"`
		HashID string `json:"hashId"`
		Height int    `json:"height"`
		Desc   string `json:"desc"`
	} `json:"details"`
	ID    int    `json:"id"`
	Title string `json:"title"`
}

// 生产者，每个处理一个地址，并将解析到的图片信息存入通道
func producer(ch chan *imageUrl, url string, cname string) {
	defer pwg.Done()
	pageResultList, err := getPageImageUrls(url)
	if err != nil {
		fmt.Printf("%s:get url error:%s", cname, err)
		return
	}
	fmt.Printf("%s:get page %s urls ok.\n", cname, url)

	for _, result := range pageResultList {
		for _, detail := range result.Details {
			tmp := &imageUrl{
				url:  "https://image.dbbqb.com/" + detail.Path,
				name: detail.Desc,
			}
			ch <- tmp
		}
	}
}

// 消费者，每个处理一张图片信息，下载图片
func consumer(ch chan *imageUrl, cname string) {
	defer cwg.Done()
	for item := range ch {
		err := downloadImage(item.url, item.name)
		if err != nil {
			fmt.Printf("%s download image %s error:%s\n", cname, item.url, err)
		}
		fmt.Printf("%s download image %s, %s ok\n", cname, item.url, item.name)
	}
}

// 从一个页面地址中提取所有图片地址
func getPageImageUrls(pageUrl string) (pageResult, error) {
	resp, err := http.Get(pageUrl)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var ret pageResult

	err = json.Unmarshal(content, &ret)
	if err != nil {
		return nil, err
	}

	return ret, nil
}

func downloadImage(url, fileName string) error {
	// 发起 GET 请求获取图片数据
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// 创建保存图片的文件
	savePath := imagePath + fileName
	file, err := os.Create(savePath)
	if err != nil {
		return err
	}
	defer file.Close()

	// 将响应体的数据写入文件
	_, err = io.Copy(file, resp.Body)
	return err
}

func main() {
	// 创建一个通道，存储图片下载地址，容量给够
	itemCh := make(chan *imageUrl, 2000)

	// 创建多个生产者，每个地址生成一个，用来解析链接得到图片地址
	for start, i := 8, 0; i < 10; i++ {
		url := fmt.Sprintf("https://www.dbbqb.com/api/group?size=10&start=%d", start)
		start += 10
		go producer(itemCh, url, fmt.Sprintf("p-%d", i))
		pwg.Add(1)
	}

	// 创建多个消费者，数量自定义，用来下载图片
	num := 20
	for i := 0; i < num; i++ {
		go consumer(itemCh, fmt.Sprintf("c-%d", i))
		cwg.Add(1)
	}

	// 必须让生产者和消费都启动后才能等待生产者结束
	pwg.Wait()
	// 必须等生产者全部结束后关闭通道
	close(itemCh)
	cwg.Wait()
	fmt.Println("main done")
}

```

### 构建 API 返回结构体

在 Go 里面解析 json 没有 Python 方便，此时就可以利用我博客的[在线工具](https://tendcode.com/tool/json2go/ "在线工具")，将一个 json 结构转化成 Go 的结构体，这样在进行 json 反序列化的时候就很容易。

![json-to-go](https://tendcode.com/cdn/2024/02/go-json%20%281%29.png "json-to-go")

这样就可以得到一个接口返回的数据的结构体，方便后续对结构体的数据进行取值：

```go
type pageResult []struct {
	TypeCn  string `json:"typeCn"`
	Details []struct {
		Path   string `json:"path"`
		Width  int    `json:"width"`
		HashID string `json:"hashId"`
		Height int    `json:"height"`
		Desc   string `json:"desc"`
	} `json:"details"`
	ID    int    `json:"id"`
	Title string `json:"title"`
}
```

### 创建逻辑处理函数

逻辑处理函数主要就是 API 接口的调用和图片下载，每个函数处理一个 URL 即可。`getPageImageUrls` 函数用来解析每个接口，然后返回一个结构体的数据，也就是上面定义好的结构体，这样方便后续从结构体中获取图片地址。`downloadImage` 函数直接下载一个图片，并返回下载的状态。

### 多生产者

由于解析每个接口也是需要时间的，为了提交效率，我这里把每个请求地址都分配给一个消费者，这样就可以并发的解析。

这里我让每个生产者都解析一个页面，然后将一个页面解析到的图片信息存入到通道中，并且使用 `sync.WaitGroup` 计数器来获取所有生产者的状态，当 `pwg.Wait()` 的时候说明所有生产者都执行结束，此时就可以关闭通道。

### 多消费者

生产者和消费者通信的通道里面是所有图片的信息，可以起任意数量的消费者去拿数据下载图片。消费者会将通道中所有数据消费完之后退出。

## 一个疑惑的解答

之前写 [Python 版本的多生产者多消费者模型的爬虫](https://tendcode.com/subject/article/spider-for-domain/#%E7%94%9F%E4%BA%A7%E8%80%85%E6%B6%88%E8%B4%B9%E8%80%85%E6%A8%A1%E5%9E%8B "Python 版本的多生产者多消费者模型的爬虫")的时候，由于生产者和消费者都是异步在执行，所以生产者执行结束必须告知消费者该停止了，使用的是一种“投毒”的方式来告知消费者可以退出线程。但是 Go 里面使用通道就没有做这个机制，所以我一直比较疑惑的是消费者是如何知道自己可以退出的？又是怎么保证通道里面的数据都消费完的？

带着这个疑惑，我也查了一些资料，然后自己有了一个理解：

1. 首先，我们在关闭通道的时候是所有生产者都已经执行完成才做的，那么此时通道里面的数据是一定是完整的。
2. 基于第1点，通道关闭的时候数据是完整的，那么消费者只要拿到空值，就说明通道里面已经没有数据了，这个说法就是正确的，也就是使用 `range`可以百分百保证通道的数据能够被拿完。
3. 消费者如何知道知道可以退出了？是基于通道被关闭这个条件，如果通道不关闭，消费者就会一直去拿值，一直阻塞。
4. 消费者怎么保证拿完所有的值？基于第2点说到的，通道关闭的时候里面已经把所有数据存入通道了，所以只要消费者没有拿到有效值，就说明通道的数据已经消费完了，所以消费者退出的时候也是通道为空的时候。

## 总结

看看爬虫的效果，900多张图片，十几秒就下载完成了，速度很快。

![图片爬虫](https://tendcode.com/cdn/2024/02/pic-download%20%281%29.png "图片爬虫")

Go 不愧是高并发闻名的语言，使用 gorountine 写并发爬虫真的是很简单高效。