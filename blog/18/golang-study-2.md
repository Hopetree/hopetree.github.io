# Go 学习笔记（2）：变量和常量

## 字符串格式化

Python 可以使用三种方式进行字符串的格式化，而 Go 好像只有一种方式，就是使用`fmt.Sprintf`函数来格式化字符串，类似于 Python 中使用`%`格式化的方法。

:::: code-group

::: code-item Go

```go
package main

import "fmt"

func main() {
    a := fmt.Sprintf("%s is %d", "Jack", 17)
    b := fmt.Sprintf("%s is %d", "Jack", 17)

    name, age := "Jack", 17
    c := fmt.Sprintf("%s is %d", name, age)

    fmt.Println(a)
    fmt.Println(b)
    fmt.Println(c)
}

```
:::

::: code-item Python

```python
a = "{} is {}".format("Jack", 17)
b = "%s is %d" % ("Jack", 17)

name, age = "Jack", 17
c = f"{name} is {age}"

print(a)
print(b)
print(c)
```
:::
::::

## 变量

### 标准声明

变量声明以关键字 var 开头，变量类型放在变量名的后面，行尾无需分号。

```go
// var 变量名 变量类型
var a string
var b int
var c bool
```

### 批量声明

每声明一个变量就需要写 var 关键字会比较繁琐，go 语言中还支持批量变量声明：

```go
var (
	a string
	b int
	c bool
	d float32
)
```

### 变量初始化

Go 语言在声明变量的时候，会自动对变量对应的内存区域进行初始化操作。每个变量会被初始化成其类型的默认值，例如： 整型和浮点型变量的默认值为0。 字符串变量的默认值为空字符串。 布尔型变量默认为 false。 切片、函数、指针变量的默认为 nil。

当然我们也可在声明变量的时候为其指定初始值。变量初始化的标准格式如下：

```go
// var 变量名 类型 = 表达式
var name string = "pprof.cn"
var sex int = 1
```

### 类型推导

有时候我们会将变量的类型省略，这个时候编译器会根据等号右边的值来推导变量的类型完成初始化。

```go
var name = "pprof.cn"
var sex = 1

// 一次初始化多个变量
var name, sex = "pprof.cn", 1
```

### 短变量声明

在函数内部，可以使用更简略的 := 方式声明并初始化变量。

```go
package main

import (
	"fmt"
)

// 全局变量m
var x = 1

func main() {
	// 此处声明局部变量m
	y := 2
	fmt.Println(x, y)
}
```

### 匿名变量

在使用多重赋值时，如果想要忽略某个值，可以使用匿名变量（anonymous variable）。 匿名变量用一个下划线`_`表示，例如：

```go
func foo() (int, string) {
	return 10, "apple"
}

func main() {
	x, _ := foo()
	_, y := foo()
	fmt.Println("x=", x)
	fmt.Println("y=", y)
}
```

在 Python 中也有使用`_`来赋值一些不需要使用的变量的用法，但是在 Python 中`_`是有效的变量，可以被使用，但是在 Go 里面是不能被使用的。

## 常量

相对于变量，常量是恒定不变的值，多用于定义程序运行期间不会改变的那些值。 常量的声明和变量声明非常类似，只是把 var 换成了 const，常量在定义的时候必须赋值。

```go
const pi = 3.1415

// 多个常量也可以一起声明
const (
	pi = 3.1415
	e  = 2.7182
)

// 同时声明多个常量时，如果省略了值则表示和上面一行的值相同
const (
	n1 = 100
	n2
	n3
)
```

## 命名规范

在Go语言中，采用不同的命名风格主要涉及到变量的可见性（作用域）和其在包外是否可导出的问题。以下是常见的几种命名方式和它们的区别：

1. **小写字母开头：**
	- 例如：`myVariable`
	- 这种命名方式表示变量只在当前包内可见，是包内私有的。
	- 在Go中，小写字母开头的变量只能在声明它们的包中访问。

2. **大写字母开头：**
	- 例如：`MyVariable`
	- 这种命名方式表示变量在包外可见，是包外可导出的。
	- 在Go中，大写字母开头的变量是公共的，其他包可以访问这些变量。

3. **全大写字母（常量）：**
	- 例如：`MAX_SIZE`
	- 在Go中，全大写字母的变量一般用于表示常量。
	- 常量在包内外均可见。

4. **下划线 `_`：**
	- 例如：`_unusedVariable`
	- 下划线开头的变量通常用于占位或临时变量，表示它们的值不会被使用或者不关心。
	- 在Go中，下划线开头的变量在声明它们的包中可见，但是不能被外部引用。

示例：

```go
package main

import (
	"fmt"
	"mypackage"
)

func main() {
	// 包内私有变量
	var myVar = mypackage.GetPrivateVariable()
	fmt.Println(myVar) // 合法

	// 包外可导出变量
	var MyVar = mypackage.GetPublicVariable()
	fmt.Println(MyVar) // 合法

	// 常量
	const MaxSize = 100
	fmt.Println(MaxSize) // 合法

	// 下划线开头的变量
	_unusedVar := mypackage.GetUnusedVariable()
	// fmt.Println(_unusedVar) // 不合法，不能被外部引用
}
```

这些命名规则有助于维护代码的结构，同时提供了一种方式来控制变量的可见性，从而防止意外的修改和访问。


## 知识点汇总

1. Go 语言中的每一个变量都有自己的类型，并且变量必须经过声明才能开始使用。
2. Go 语言中的变量需要声明后才能使用，同一作用域内不支持重复声明。
3. Go 语言的变量声明后必须使用，否则会导致编译报错。
4. 短变量声明的方式仅可在函数内部使用。
5. 常量的值在编译时确定，无法修改。
6. Go 的变量和函数一般采用驼峰命名法，首字母是否大写决定了变量是否在包外可导出。

**学习参考资料**

- [变量和常量](https://www.topgoer.cn/docs/golang/chapter03-7)
- [Go fmt.Sprintf 格式化字符串](https://www.runoob.com/go/go-fmt-sprintf.html)