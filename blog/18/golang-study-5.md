# Go 学习笔记（5）：指针、Map 和 结构体

## 指针

### 可变和不可变数据

Python 里面是没有指针的概念的，所以学习到 Go 的指针这个章节的时候我一直都是一知半解的，虽然看了不少资料也问了 ChatGPT 很多次，但是到现在也还没完全弄清楚到底什么时候应该用指针什么时候不能使用指针。

Go 有四类数据类型：

- 基本类型：数字、字符串和布尔值
- 聚合类型：数组和结构
- 引用类型：指针、切片、映射、函数和通道
- 接口类型：接口

在 Python 里面对数据类型也有一个划分，就是可变类型和不可变类型，这个可变和不可变其实跟 Go 的指针有关，就是说当你把一个变量当做参数传入一个函数的时候，在函数里面是否能修改这个变量本身，如果可以，那就是可变。

比如 Python 里面的不可变类型：数字、字符串、元组、布尔值等，可变类型有：列表、字典、集合等。

### 哪些场景应该用指针

我自己的总结两种常见的场景（实际当然不止，后面慢慢体会吧）：

1. 传递的参数不可修改，此时使用指针就可以修改参数本身的值
2. 传递的参数是大数据，此时使用指针传递减少值拷贝的开销

场景1的例子很容易理解：

```go
func modifyValue(value int) {
    // 修改不会影响原始值
    value = 100
}

func modifyWithPointer(ptr *int) {
    // 修改会影响原始值
    *ptr = 100
}

func main() {
    x := 42
    modifyValue(x)
    fmt.Println(x) // 输出: 42

    y := 42
    modifyWithPointer(&y)
    fmt.Println(y) // 输出: 100
}
```

整数本身是一种不可变类型，但是通过指针，就是在函数中修改这个变量本身，这个在 Python 里面是无法做到的，这也是很典型的一个指针使用场景。

场景2的例子：

```go
package main

import "fmt"

func modifyLargeData(data *[]int) {
    // 在函数内部修改大型切片
    for i := range *data {
        (*data)[i] *= 2
    }
}

func main() {
    // 创建一个大型切片
    largeData := make([]int, 1000000)
    for i := range largeData {
        largeData[i] = i + 1
    }

    // 通过指针传递大型切片
    modifyLargeData(&largeData)

    // 打印修改后的切片部分内容
    fmt.Println(largeData[:10]) // 输出: [2 4 6 8 10 12 14 16 18 20]
}
```

在这个例子中，modifyLargeData 函数接收一个指向大型切片的指针，并在函数内部修改了切片的值。通过传递指针而不是切片本身，避免了将整个大型切片复制到函数内部的开销，提高了程序的性能。

需要注意的是，这样的优化一般在处理大型数据时才会显著体现。在处理小型数据或者基本类型时，Go 的值传递通常也足够高效。

### 哪些场景可以不用指针

**1、只使用参数的值**

很多时候函数只需要使用参数的值，而不需要修改参数本身，此时可以不用指针。

**2、传递可修改的类型**

切片、映射、结构体、通道： 这些引用类型本身已经具有引用传递的特性，传递它们时无需使用指针。函数内对切片、映射或通道的修改会影响原始数据。

```go
func modifySlice(slice []int) {
    // 修改会影响原始切片
    slice[0] = 100
}

func main() {
    data := []int{1, 2, 3}
    modifySlice(data)
    fmt.Println(data) // 输出: [100 2 3]
}

```

这其实跟 Python 一样，这种可变类型被当做参数传递到函数里面，在函数内部修改参数会导致参数本身被修改。


## Map

Map 就等于 Python 里面的字典，只是由于 Go 语言对于类型的要求，必须在定义的时候定义好 Map 的键值对的类型，这个不如 Python 灵活（当然，我后面学习到空接口就知道了 Go 也有比较灵活的类型）。

如下就是一个值可以是任意类型的 map 的例子：

```go
package main

import "fmt"

func main() {
	m1 := map[string]interface{}{}
	fmt.Println(m1)

	m2 := make(map[string]interface{})
	fmt.Println(m2)
}

```

Map 也是无序的，这个跟 Python 一样。

## 结构体

结构体就是 Python 里面类的概念。构造函数要自己实现，构造函数可以返回类的实例的指针，也可以直接返回类的实例。

Python 里面类的函数在 Go 里面使用方法实现，方法的接受者就是类的指针，可以理解为 Python 里面的 `self` 的作用。

将 Go 的代码跟 Python 代码对照着看就会很清晰：

:::: code-group

::: code-item Go

```go
package main

import "fmt"

// Animal 类型
type Animal struct {
	Name string
}

// NewAnimal 初始化方法，返回指针
func NewAnimal(name string) *Animal {
	return &Animal{Name: name}
}

// makeSound 方法，用于发出声音
func (a *Animal) makeSound() {
	fmt.Printf("%s makes some generic animal sound\n", a.Name)
}

// Dog 类型，继承自 Animal
type Dog struct {
	*Animal
	Speed int
}

// NewDog 初始化方法，返回指针
func NewDog(name string, speed int) *Dog {
	return &Dog{Animal: NewAnimal(name), Speed: speed}
}

// makeSound 方法的重写，对于 Dog 类型
func (d *Dog) makeSound() {
	fmt.Printf("%s says Woof! Woof!\n", d.Name)
}

// run 方法，用于表示狗狗跑的行为
func (d *Dog) run() {
	fmt.Printf("%s is running at speed %d km/h\n", d.Name, d.Speed)
}

func main() {
	// 使用例子
	animal := NewAnimal("Generic Animal")
	animal.makeSound() // 输出: Generic Animal makes some generic animal sound

	dog := NewDog("Buddy", 20)
	dog.makeSound() // 输出: Buddy says Woof! Woof!
	dog.run()       // 输出: Buddy is running at speed 20 km/h
}

```
:::

::: code-item Python

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def make_sound(self):
        print(f"{self.name} makes some generic animal sound")

class Dog(Animal):
    def __init__(self, name, speed):
        super().__init__(name)
        self.speed = speed

    def make_sound(self):
        print(f"{self.name} says Woof! Woof!")

    def run(self):
        print(f"{self.name} is running at speed {self.speed} km/h")

# 使用例子
animal = Animal("Generic Animal")
animal.make_sound()  # 输出: Generic Animal makes some generic animal sound

dog = Dog("Buddy", 20)
dog.make_sound()     # 输出: Buddy says Woof! Woof!
dog.run()            # 输出: Buddy is running at speed 20 km/h

```
:::
::::