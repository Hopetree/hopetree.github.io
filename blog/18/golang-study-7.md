# Go 学习笔记（7）：学习成果之写一个 API 调用的 sdk

Go 的学习也进行了两周，已经学完了基本语法、控制流、函数、方法，其实已经可以写一些简单的逻辑了。然后按照我的学习方法是带着目的的去学，我第一阶段的目标就是写一个 API 调用的 sdk，现在交作业。

## 需求

我的需求很简单，就是先写一个简单的爬虫或者 API 调用即可，当然，最好是能把当前学习到的东西都运用起来。

于是我先写了一个 Python 版本的代码：

```python
import json
import requests


class PrivateAPI:
    def __init__(self, host, org, header_host):
        self.host = host
        self.org = org
        self.header_host = header_host

    def search_instances(self, object_id, data):
        api = f"/object/{object_id}/instance/_search"
        url = f"{self.host}{api}"

        # 将字典转成 JSON
        json_data = json.dumps(data)

        headers = {
            "user": "defaultUser",
            "org": self.org,
            "Host": self.header_host
        }

        # 发起 HTTP 请求
        response = requests.post(url, data=json_data, headers=headers)

        if response.status_code != 200:
            raise Exception("Status is not 200")

        # 解析 JSON 响应
        result = response.json()

        return result


def main():
    # 创建 PrivateAPI 实例
    api = PrivateAPI("http://127.0.0.1", "777777", "uat.api.com")

    # 调用 search_instances 方法发起查询请求
    try:
        ret = api.search_instances("HOST", {})
        print(ret)
    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    main()

```

这个代码定义了一个 `PrivateAPI` 类，并且类里面定义了一个函数 `search_instances`，这个函数就是一个接口的封装，其他接口都可以按照这个格式去定义。于是这样可以实现了一个简单的接口调用的 sdk，其他地方就可以使用了。

这里有几个关键点：

- 不同环境的参数不同，所以类的初始化需要暴露环境参数
- 接口的请求参数格式不统一，但是固定是 json 格式的
- 需要设置请求头
- 每个接口返回应该转换成字典（map）以便后续进行处理

在 Python 里面实现这样一个 sdk 非常的简单。

## Go 的实现

直接看我写的代码：

```go
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// PrivateAPI 定义API的，暴露环境参数
type PrivateAPI struct {
	host       string
	org        string
	headerHost string
}

// newPrivateAPI 是构造函数，用于实例化 PrivateAPI 结构体
func newPrivateAPI(host string, org string, headerHost string) *PrivateAPI {
	return &PrivateAPI{
		host:       host,
		org:        org,
		headerHost: headerHost,
	}
}

// searchInstances 是 PrivateAPI 结构体的方法，用于向私有API发起查询实例的请求
// objectId 表示对象ID，data 是查询参数的map
// 返回值是查询结果的map和可能的错误信息
func (pa *PrivateAPI) searchInstances(objectId string, data map[string]interface{}) (map[string]interface{}, error) {
	// 构造 API 请求的路径
	api := fmt.Sprintf("/object/%s/instance/_search", objectId)
	// 构造完整的请求 URL
	url := fmt.Sprintf("%s%s", pa.host, api)

	// 将查询参数 map 转成 JSON 格式
	bytesData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("map to json error: %s", err)
	}

	// 创建 HTTP 请求对象
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bytesData))
	if err != nil {
		return nil, fmt.Errorf("http req error: %s", err)
	}

	// 设置请求头信息
	req.Header.Set("user", "defaultUser")
	req.Header.Set("org", pa.org)

	req.Host = pa.headerHost

	// 创建 HTTP 客户端并发送请求
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http get resp error: %s", err)
	}

	// 断开连接
	defer resp.Body.Close()

	// 检查响应状态码是否为 200
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status is not 200")
	}

	// 读取响应体的内容
	bytesResponse, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read resp error: %s", err)
	}

	// 将响应体内容解析为 map
	var result map[string]interface{}
	nok := json.Unmarshal(bytesResponse, &result)
	if nok != nil {
		return nil, fmt.Errorf("json to map error: %s", nok)
	}

	return result, nil
}

func main() {
	// 创建 PrivateAPI 实例
	api := newPrivateAPI("http://127.0.0.1", "777777", "uat.api.com")

	// 调用 searchInstances 方法发起查询请求
	ret, err := api.searchInstances("HOST", map[string]interface{}{})
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	// 打印查询结果
	fmt.Println(ret)
}

```

这里的思路和逻辑跟 Python 的版本是一样的，但是 Go 的这个异常判断的是真的写到吐。

## 踩过的坑

### 设置请求头 Host

我调用的接口里面是需要校验请求头的 Host 字段，最开始我使用 Python 的设置请求头的方式，将 Host 字段像其他请求头一样使用 Set 进行设置，然后接口怎么也调不通，直接把我搞得怀疑人生，后来经过调试才发现请求头设置没成功，于是去查了才知道不能使用 Set 这种方式。

```go
// 错误的设置方式，不会生效
req.Header.Set("Host", "xxx")

// 正确方式
req.Host = "xxx"
```

### 关闭请求

虽然从我一开始学习 http 这个库的时候就知道在每次请求后需要关闭请求，但是在实际的使用的时候还是经常会忘记。

```go
defer resp.Body.Close()
```

这个也顺便学习到了 `defer` 这个函数的作用。

## 总结

其实学习一个新的编程语言或者说是一个新的技能，学习的过程是很枯燥的，很多时候耐心不够或者信心不足就会半途而废。但是我一般会给自己设定一些小的阶段性的目标，带着目标去学习，这样不仅仅可以在学习过程中用实际场景去考虑知识点从而更快的抓住重点，更重要的是一个阶段的学习成果的输出可以给自己增长一些继续学习的信心和动力。