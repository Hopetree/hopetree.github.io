# HTTP QUERY 方法来了：RFC 10008 解读与实战

2026 年 6 月，IETF 发布了 RFC 10008，正式定义了 HTTP QUERY 方法。这是自 2010 年 PATCH 方法（RFC 5789）以来，HTTP 协议时隔 16 年迎来的首个新请求方法。它要解决的是一个困扰了 API 设计师很久的问题：想发一个带请求体的只读查询，到底该用 GET 还是 POST？


## 1. 问题的原点：GET 和 POST 都不完美

先看一个典型场景。你的前端页面需要查询一批数据，过滤条件复杂，可能包含多个 ID、时间范围、排序参数。用 GET 的话，参数挤在 URL 里：

```text
GET /api/products?ids=1,2,3,4,5,6,7,8,9,10&sort=price&filter=active&page=1&page_size=50

```

这还算好的。如果查询条件是一个 JSON 结构，或者是一段 GraphQL 查询，URL 根本塞不下。而且 URL 有长度限制——不同浏览器和服务器限制不同，一般在 2KB 到 8KB 之间。

所以很多人转向 POST：

```text
POST /api/products
Content-Type: application/json

{
  "ids": [1,2,3,4,5,6,7,8,9,10],
  "sort": "price",
  "filter": {"status": "active"},
  "page": 1,
  "page_size": 50
}

```

这解决了请求体大小的问题，但引入了严重的语义与架构问题：

> **补充概念：HTTP 属性解析**

> * **安全性（Safe）：** 指请求**不修改服务器上的资源状态**，仅用于获取数据。中间件和网络组件可以安全地自动重试。

> * **幂等性（Idempotent）：** 指**发起 1 次和发起 N 次请求的效果完全一样**。

> * **可缓存性（Cacheable）：** 响应结果能否被客户端、代理服务器或 CDN 缓存。
>
>

POST 在 HTTP 规范中既**不安全**也**不幂等**。中间件、CDN、反向代理看到 POST 请求，默认认为它可能会产生写操作或副作用（Side Effects），因此**默认拒绝缓存响应，也不敢在网络波动时自动重试**。

这就是问题的核心——**GET 有正确的语义但缺乏表达力，POST 有表达力但破坏了 HTTP 的基础设施协同**。

---

## 2. QUERY 方法：完美的折中

RFC 10008 定义的 QUERY 方法，同时具备了 GET 和 POST 的优点：

| 特性 | GET | POST | QUERY |
| --- | --- | --- | --- |
| **携带请求体** | ❌ (规范不建议/实现差异大) | ✅ | ✅ |
| **安全（Safe）** | ✅ | ❌ | ✅ |
| **幂等（Idempotent）** | ✅ | ❌ | ✅ |
| **可缓存（Cacheable）** | ✅ | 条件性 (实践中几乎不存) | ✅ |

QUERY 请求体用来描述查询条件，不限制格式——可以是 JSON、GraphQL、SQL，甚至纯文本。关键的是，**这个请求体作为资源查询的逻辑判定条件，能够作为缓存 Key 的一部分参与匹配**。

---

## 3. 一个实际的例子与 `Content-Location` 深度解析

假设你有一个商品搜索 API，用 QUERY 方法实现：

```text
QUERY /api/products
Content-Type: application/json
Accept: application/json

{
  "query": {
    "category": "electronics",
    "price_min": 100,
    "price_max": 1000,
    "in_stock": true
  },
  "sort": "-rating",
  "page": 1,
  "page_size": 20
}

```

服务器返回：

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Location: /api/products?query_id=abc123

{
  "total": 42,
  "results": [...]
}

```


很多人容易将 `Content-Location` 和 `Location` 混淆，它们在 HTTP 中有着完全不同的功能：

* **`Location`（重定向/新建）：** 告诉客户端“去另一个地方”。配合 `3xx` 触发重定向，或配合 `201 Created` 指向新生成的资源 URI。响应体通常为空。
* **`Content-Location`（资源映射）：** 告知客户端“**当前响应体中的数据，也可以通过这个具体的 GET URI 独立获取**”。它**不会**触发自动重定向。

在 `QUERY` 场景中，`Content-Location` 是连接复杂查询与传统 HTTP 缓存的桥梁：

1. **服务端接收 `QUERY**`：将复杂的 JSON 请求体计算生成一个唯一的 `query_id`（例如 Hash 或存入 Redis 的键），并直接返回查询结果。
2. **附带 GET 别名**：通过 `Content-Location` 告知客户端该结果映射到了 `/api/products?query_id=abc123`。
3. **传统客户端降级与复用**：前端后续可以将该 URI 保存为书签/分享链接，或者让只支持 GET 的传统浏览器/代理直接通过 `GET` 该 URL 拿取相同的结果。

---

## 4. 缓存机制是怎么工作的？

传统的 HTTP 缓存机制（如 CDN、Nginx）构建 Cache Key 时仅依赖 **`HTTP Method + URI + Host`**。由于 `GET` 没有请求体，这种机制运作顺畅。

而对于 `QUERY` 方法，规范要求缓存层必须将请求体纳入计算，缓存 Key 演变为：

$$\text{Cache Key} = \text{Method} + \text{URI} + \text{Hash}(\text{Request Body})$$

```text
QUERY /api/products  Body: {"category": "books"}       ───> 算得 KeyA ───> 缓存命中
QUERY /api/products  Body: {"category": "electronics"} ───> 算得 KeyB ───> 缓存未命中（不同的请求体）

```

这种设计使得同一 Endpoint 下，不同的查询请求体不会互相污染缓存。网关与 CDN 只需在对 Body 进行 Standard/Canonical Hash（规范化哈希处理，如消除空格差异）后即可完成精确缓存。

---

## 5. GraphQL 的救星

GraphQL 长期以来一直面临缓存痛点。由于所有的 GraphQL 查询默认都用 `POST /graphql` 发送，即使它只是一个只读的 `query`，中间件和 CDN 也会视其为不安全请求而拒绝缓存。

```http
QUERY /graphql
Content-Type: application/json

{
  "query": "query { products(category: \"electronics\") { name price } }"
}

```

通过引入 `QUERY` 方法，GraphQL 的只读查询立刻拥有了正统的 HTTP 安全/幂等语义，无需依靠 Persisted Queries 等复杂规避方案，即可天然享受 CDN 和浏览器原生 HTTP 缓存带来的性能红利。

---

## 6. 安全与网络层注意事项

1. **CORS 预检请求（Preflight）：**
`QUERY` 方法不属于 CORS 安全方法（Non-safelisted Method）。在浏览器环境中通过 Fetch/Axios 发起跨域 `QUERY` 请求时，浏览器会先发送一个 `OPTIONS` 预检请求，因此跨域场景下会多一次 RTT 往返。
2. **防火墙与网关拦截（WAF）：**
若现有的 WAF、API 网关或微服务路由白名单中限定了 `GET/POST/PUT/DELETE/PATCH`，当遇到非识别的 `QUERY` 请求时，可能会返回 `405 Method Not Allowed` 或直接拦截，上线前需提前适配。

---

## 7. 服务端与前端如何改造实现？

`QUERY` 的落地重头戏主要集中在**服务端与网关层**：

### 服务端/网关改造（核心）

1. **路由与解析**：解封 `QUERY` 方法，允许只读路由接收并解析 Request Body。
2. **缓存与 Hash 计算**：中间件对 Body 进行哈希（如 SHA-256），并将该 Hash 结合 URI 设为缓存键。
3. **映射 `Content-Location**`：针对复杂查询计算生成的 `query_id`，建立 Redis 映射并暴露对应的 `GET` 兜底接口。

### 客户端改造（轻量）

1. 将原来违心使用的 `POST` 查询重构为 `QUERY` 请求。
2. （可选）解析响应中的 `Content-Location` 头部，将生成的 GET URL 用于后续的快捷访问或缓存刷新。

---

## 8. 生态支持现状（2026）

RFC 10008 正式发布后，主流 Web 基础设施正在快速跟进：

* **Nginx**：即将推出的 1.28 版本将原生支持 `QUERY` 的请求体解析与 Cache Key 计算。
* **Apache HTTP Server**：已支持自定义 Method 配置。
* **Node.js / Express**：Express 5.x 正式加入了对 `app.query()` 路由句柄的支持。
* **Python 生态**：FastAPI 及 Django 社区正在积极推进中间件方案。

---

## 9. 小结

HTTP QUERY 方法不是革命性的创新，但它是协议层面一次恰如其分的补全。它优雅地解决了 API 设计中长久以来的尴尬局面——开发者不再需要在“用 GET 挤爆 URL”和“用 POST 牺牲缓存与语义”之间二选一。

随着网关和 Web 框架的跟进，将复杂的只读查询迁移至 `QUERY`，不仅能带来更规范的 API 设计，更能直接释放 HTTP 缓存机制的巨大潜能。