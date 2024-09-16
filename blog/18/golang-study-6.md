# Go 学习笔记（6）：循环和判断

## if 条件判断

Go 的 if 条件判断在使用上跟 Python 基本没啥大的区别，语法稍微有一点点差异，Go 在判断前还可以有一个初始化的语句，可以用来定义局部变量。

## switch 条件判断

switch 判断是用来简化 if 判断的，在 Python 里面没有这个关键字。

只需要记住 switch 的条件和判断的类型保持一致就行，至于条件是什么，怎么写，都可以，比如条件如果为空，其实表示的是条件为 true，例如：

```go
switch {
case false:
	fmt.Println("false")
case true:
	fmt.Println("true") // 打印true
}
```

获取斐波那契数列：

```go
func getNum(inNum int) int {
	switch inNum {
	case 1:
		return 1
	case 2:
		return 1
	default:
		return getNum(inNum-1) + getNum(inNum-2)
	}
}
```

## for 循环

我还是比较喜欢 Go 这种写法的 for 循环，好像是除了 Python 以外大部分语言都是这种三段式的写法吧。

```go
for init; condition; post { }
for condition { }
for { }
```

三段的含义：

- init：初始化条件，比如 `n := 0`
- condition：判断条件，比如 `n < 10`
- post：每次循环后进行的操作，比如 `n++` 和 `n += 3`

其中 for {} 这种写法其实就是 for true {} 的意思，所以并不是没有条件，只是条件为真，就相当于 Python 里面 while 语句。

## range 迭代

Go 的 range 类似 Python 的迭代器操作，返回 一个可迭代对象的(索引, 值) 或 (键, 值)。

常用的迭代对象和返回值如下：

- 对于数组和切片，range 返回当前元素的索引和元素值。
- 对于字符串，range 返回当前字符的索引和 Unicode 字符的整数值。
- 对于映射（map），range 返回键（key）和对应的值（value）。
- 对于通道，range 会迭代通道中的元素值。

## 标签 label

一般来说，在 Go 语言中使用 `goto` 和标签（label）的场景相对较少，而且 Go 的设计哲学鼓励使用结构化的控制流，避免过度使用 `goto`。

`goto` 和标签的存在是为了提供一种跳转控制流的手段，但过度使用它们可能导致代码可读性和可维护性的降低。在实际开发中，通常可以通过结构化的 `if`、`for`、`switch` 语句以及函数来实现更清晰和易懂的代码逻辑。


### break 跳出多层循环

标签的主要用途是在函数内部进行跳转，例如使用 `break` 跳出多层循环：

```go
package main

import "fmt"

func main() {
OuterLoop:
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			fmt.Printf("(%d, %d) ", i, j)
			if i == 1 && j == 1 {
				// 使用标签和 break 跳出两层循环
				break OuterLoop
			}
		}
		fmt.Println()
	}
}

```

在这个例子中，我们定义了一个名为 OuterLoop 的标签，并在外层循环的 break 语句中使用了这个标签。当内层循环中的条件满足时，执行 break OuterLoop，就会跳出两层循环。

### goto 跳到指定的外层循环

然后利用 `goto` 和 `lable` 来从内层循环直接跳到外层循环：

```go
package main

import "fmt"

func main() {
	i := 0

OuterLoop:
	for i < 3 {
		fmt.Printf("(%d) ", i)
		i++

	InnerLoop:
		for j := 0; j < 3; j++ {
			fmt.Printf("[%d] ", j)
			if j == 1 {
				// 使用 goto 跳到 OuterLoop 的标签处
				goto OuterLoop
			}
		}
		fmt.Println()
	}
}

```

在这个例子中，我们使用了 goto 语句来跳到 OuterLoop 标签处，从而跳出内层循环并继续执行外层循环。goto 语句可以用于直接跳转到指定标签处，但在实际编程中，它的使用应该非常谨慎，以避免使代码难以理解和维护。


### continue 跳过内层循环

在Go语言中，`continue` 语句通常用于跳过当前循环中的剩余代码，并进入下一次迭代。结合标签（label），你可以在嵌套循环中使用 `continue` 来指定要跳过的循环。以下是一个例子：

```go
package main

import "fmt"

func main() {
	// 定义一个标签
OuterLoop:
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if i == 1 && j == 1 {
				// 使用标签和 continue 跳过指定的循环
				fmt.Println("Skipping i =", i, "j =", j)
				continue OuterLoop
			}
			fmt.Println("i =", i, "j =", j)
		}
	}
}
```

在上面的例子中，我们使用了一个标签 `OuterLoop`，然后在内层循环中，当 `i` 等于 1 且 `j` 等于 1 时，我们使用 `continue OuterLoop` 来跳过整个外层循环的当前迭代。这样，当条件满足时，内层循环就会被跳过，直接进入下一次外层循环。

这种使用标签配合 `continue` 的方式通常在需要在嵌套循环中跳出或跳过多层循环时很有用。然而，过度使用标签和 `continue` 可能会使代码难以理解，因此应该谨慎使用，并确保代码保持清晰和可读。

### 标签的小结

Go 的标签 `label` 在多层循环的时候可以结合 `break`，`goto`，`continue` 使用能够做到一些 Python 无法做到的事情，但是可能导致代码的可读性和稳健性降低，因此要谨慎使用。

## select （暂时不学习）

select 的控制流我理解是应用在并发的场景的一个关键字，现在还没有学习到并发所以暂时放着不用管。