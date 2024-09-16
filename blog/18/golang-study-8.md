# Go 学习笔记（8）：生产者消费者模型

## 单生产者多消费者

当场景为单生产者多消费者的时候，生产者执行结束就可以直接关闭通道，此时消费者自动从通道中拿数据，直到通道为空就退出，不会形成阻塞。

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	// 定义共享数据的通道
	itemCh = make(chan int, 20)
	cwg    sync.WaitGroup
)

func producter(ch chan int) {
	for i := 0; i < 10; i++ {
		time.Sleep(time.Second) // 模拟真实场景的处理时间
		ch <- i
		fmt.Printf("set num %d to ch\n", i)
	}
	close(ch)
}

func consumer(ch chan int, name string) {
	defer cwg.Done()
	for n := range ch {
		time.Sleep(time.Second * 2) // 模拟真实场景的处理时间
		fmt.Printf("%s:get num %d from ch\n", name, n)
	}
}

func main() {
	go producter(itemCh)

	// 启动多个消费者
	for i := 0; i < 5; i++ {
		go consumer(itemCh, fmt.Sprintf("c-%d", i))
		cwg.Add(1)
	}

	cwg.Wait()

	fmt.Println("main done!")
}

```

## 多生产者多消费者

下面是一个多生产者和多消费者的场景例子，生产者数量和消费者数量都是不定的，此时需要考虑何时关闭通道，比较好的时机是利用计数器，当生产者的计数器清理则表示所有生产者都执行结束，此时就可以安全的关闭通道。这个例子可以作为多线程爬虫的标准写法参考：

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	// 定义共享数据的通道
	itemCh = make(chan int, 20)
	// 分别定义生产者和消费者的计数器
	pwg sync.WaitGroup
	cwg sync.WaitGroup
)

func producter(num int, ch chan int, name string) {
	defer pwg.Done()
	time.Sleep(time.Second) // 模拟真实场景的处理时间
	ch <- num
	fmt.Printf("%s:set num %d to ch\n", name, num)
}

func consumer(ch chan int, name string) {
	defer cwg.Done()
	for n := range ch {
		time.Sleep(time.Second * 2) // 模拟真实场景的处理时间
		fmt.Printf("%s:get num %d from ch\n", name, n)
	}
}

func main() {
	// 启动多个生产者
	for i := 0; i < 10; i++ {
		go producter(i, itemCh, fmt.Sprintf("p-%d", i))
		pwg.Add(1)
	}

	// 启动多个消费者
	for i := 0; i < 5; i++ {
		go consumer(itemCh, fmt.Sprintf("c-%d", i))
		cwg.Add(1)
	}

	// 等待生产者执行结束前必须让消费者和生产者都运行起来
	pwg.Wait()
	close(itemCh) // 等所有生产者执行结束就关闭通道

	cwg.Wait()

	fmt.Println("main done!")
}

```

::: warning 注意

在多生产者模型中，如果不及时关闭通道，会导致消费者一直从通道中拿数据，进而导致通道不会被自动回收，消费者会一直阻塞。
:::

## 参考文档

- [go channel 关闭的那些事儿](https://juejin.cn/post/7033671944587182087 "go channel 关闭的那些事儿")