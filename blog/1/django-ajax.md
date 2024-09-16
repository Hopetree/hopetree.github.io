# Django 中使用 ajax 请求的正确姿势

我的博客在导航栏中有一个在线工具跳转，博客中提供了一些比较实用的在线工具，最近两天又添加了一个在线工具，作用是可以查询 docker 官方镜像仓库中指定镜像的版本信息，虽然之前写在线工具的时候就已经掌握了 django + jQuery ajax 的用法，但经过这次的工具更新，我对 ajax 的用法又有了更深层次的理解，所以分享一下我的使用经验。

首先，在使用 ajax 之前需要说一下这个前端库的定义，以下描述是我觉得比较简单明了的解释（本文提到的 ajax 仅指 jQuery AJAX）：

> AJAX 是一种与服务器交换数据的技术，可以在不重新载入整个页面的情况下更新网页的一部分。

## 思路整理

在 django 中使用 ajax 其实就是在前端代码中（一般是 js 中）使用 ajax 调用 django 的接口，然后去更新指定的页面部分。有了这个基本关系理解，我们再来把两者结合的过程分解到代码中，我每次写在线工具的思路大致如下：

1. 在 html 中写好表单以及调用到 ajax 请求的动作，比如按钮点击
2. 既然要引用 ajax 发请求，那么可以把 ajax 的请求过程以及请求前后要做的事件都写到函数中，然后单独放到 js 文件中
3. ajax 发请求的本质就是调用 django 的接口，所以 django 的 URL 中需要提供接口
4. django URL 中的接口是调用 views 中的函数，所以需要提供接口的函数，进行逻辑及数据处理，这个处理结果就是 ajax 获取到的

以上4个关键的代码部分就构成了最基本的 django + ajax 的结合思路，思路理清之后，写代码就可以保证一个比较统一的风格了。接下来就结合我最近的在线工具的实际运用来详细介绍一下各个步骤上面需要做的事情吧！

## django + ajax 实战

在整理思路的时候我们按照上面的顺序来模拟的是用户的行为，而写代码的时候我们是作为服务端的，所以应该把步骤反过来写，也即是先写一个提供接口的函数。

### 提供接口函数

直接来看我写的函数部分的代码

```python
# izone/apps/tool/views.py

# docker镜像查询
def docker_search_view(request):
    if request.is_ajax() and request.method == "POST":
        data = request.POST
        name = data.get('name')
        if name:
            ds = DockerSearch(name)
            res = ds.main()
            return JsonResponse(res, status=res['status'])
    return render(request, 'tool/docker_search.html')
```

可以看到这个函数有两种请求结果，当请求是 ajax 请求并且提供了所需的参数 name 的时候，函数返回的是一个 json 格式的结果，并且会返回指定的 status code，这个可以自行查看 `JsonResponse()` 函数的用法，需要关注是 status 参数，这个参数也是我这一次写接口的时候才重视起来的，因为 ajax 就应该去判断接口的返回码，然后根据返回码做出相应的操作。第二种请求结果就是返回一个 html 页面，其实也就是提供表单的那个页面，所以这个函数可以做到一个函数提供了 GET 和 POST 两种返回。

上面的函数并不能理解，函数中得到结果的过程是下面两句：

```python
ds = DockerSearch(name)
res = ds.main()
```

这两句的作用其实就是得到一个字典，这个字典就是需要返回到 ajax 的结果中的，一般来说，字典中最好带上返回码，而且需要把各种情况考虑周全，比如我这个函数可以返回的结果如下几种：

```python
# izone/apps/tool/apis/docker_search.py

def main(self):
    '''
    总共三种状态，有查询结果返回200，无结果 >（超时返回500，其他都返回404）
    :return:
    '''
    self.get_items(self.url)
    if not self.results:
        if self.code == self.STATUS_500:
            return {
                'status': self.code,
                'error': '哎呀！！！网络拥堵...查询官方接口超时，请稍后重试'
            }
        else:
            return {
                'status': self.code,
                'error': '镜像仓库没有查询到与 {} 相关的镜像信息，请检查镜像名称后重试！'.format(self.name)
            }
    return {
        'status': 200,
        'results': self.results,
        'next_url': self.next_url,
        'total': len(self.results)
    }
```

可以去查看我博客的完整代码，结果会返回 404、500、200 三种不同的结果，这三种结果最后都会经过 ajax 去判断，然后做出相对操作。

### 提供 URL 映射

接口函数已经提供了，自然是需要提供接口地址的映射关系了，这个不用过多解释，会 django 的一眼就能看懂：

```python
# izone/apps/tool/urls.py

url(r'^docker-search/$', docker_search_view, name='docker_search'),  #docker镜像查询
```

### ajax 函数使用

django 后端接口已经提供了，现在开始在前端代码中实现接口调用的方法，这里我比较喜欢在 js 文件中写 JavaScript 而不是直接写在 html 中，这样显得比较整洁，也容易统一管理。

看一下关于这个接口我写的 js 代码：

```javascript
//docker search
function docker_search(CSRF, URL) {
    var name = $.trim($('#image-name').val());
    if (name.length == 0) {
        alert('待查询的镜像名称不能为空！');
        return false
    };
    $.ajaxSetup({
        data: {
            csrfmiddlewaretoken: CSRF
        }
    });
    $('.push-result').html('<i class="fa fa-spinner fa-pulse fa-3x my-3"></i>');
    $.ajax({
        type: 'post',
        url: URL,
        data: {
            'name': name,
        },
        dataType: 'json',
        success: function(ret) {
            var newhtml = '<table class="table table-bordered my-0"><thead class="thead-light"><tr><th scope="col">镜像版本</th>' +
            '<th scope="col">镜像大小</th><th scope="col">更新时间</th></tr></thead><tbody>';
            for (var i=0;i < ret.results.length; i++) {
                var item = ret.results[i]
                newhtml += '<tr><th scope="row">' + item.name + '</th><td>' + item.full_size + '</td><td>' + item.last_updated + '</td></tr>'
            }
            newhtml += '</tbody></table>'
            $('.push-result').html(newhtml);
        },
        error: function(XMLHttpRequest) {
            var _code = XMLHttpRequest.status;
            if (_code == 404) {
                var error_text = '镜像仓库没有查询到相关信息，请检查镜像名称后重试！';
            } else if (_code == 500) {
                var error_text = '请求超时，请稍后重试！'
            } else {
                var error_text = '未知错误...'
            }
            var newhtml = '<div class="my-2">' + error_text + '</div>';
            $('.push-result').html(newhtml);
        }
    })
}
```

其实我感觉写 js 代码也不需要对 js 有很深入的理解，无非就是一些条件判断，循环等操作，跟 python 这是语法稍微不同，逻辑思路都是一样的。

先看这个函数，需要传递两个参数，可以看一下我写的其他函数，都是传递两个参数的，其中 CSRF 是 django 需要的认证参数（关于这个参数，需要自行搜索 csrfmiddlewaretoken 的相关信息了解），而 URL 就是接口地址，这个比较好理解。

函数的开始部分是从 html 中拿表单里面的输入信息，这个不解释，可以使用 jQuery 的 `$.trim()` 方法来处理空格问题。直接来看下面这段：

```javascript
$.ajaxSetup({
    data: {
        csrfmiddlewaretoken: CSRF
    }
});
```

`$.ajaxSetup()` 方法可以给 ajax 设置一些默认的参数，简单理解就是在这个里面设置的参数，之后使用 ajax 的时候都会自动添加到请求中，比如可以设置请求头、传入参数等，而我这里是固定设置一个 csrfmiddlewaretoken 参数，这个参数是 django 需要的认证参数。

接着来看 `$.ajax()` 的具体参数内容，先看着几个：

```javascript
type: 'post',
url: URL,
data: {
    'name': name,
},
dataType: 'json',
```

type 表示请求的协议，可以是 get 或者 post，url 当然就是接口地址了，这个是函数传入的参数，直接引用，data 就是要传入到后端的信息，这个就要看后端需要什么参数了，当然，这个地方虽然只设置了一个 name，但是实际上还有一个之前设置过的 csrfmiddlewaretoken 也会被传递到后端，dataType 就是解析后端返回的信息的方式，这里当然是用 json 了。

然后可以看一下事件处理部分，这里既是关键了，ajax 中有两个函数类型的参数可以设置，其中 success 函数表示的是请求成功（返回码是2xx之类的）后可以做的事情，其实的参数就是后端返回过来的信息，所以这里可以解析一下信息，然后对 HTML 进行渲染，具体渲染内容不作解释。error 函数表示的是请求失败（返回码不是2xx）需要做的事情，这个函数其实有几个参数，但是我一般只需要用到第一个，因为这个参数可以拿到返回码，我需要通过返回码来做相对于的操作，可以看到我代码里面就是拿到返回码，然后进行判断，最后也是渲染 HTML 页面。

小结：我对于使用 ajax 函数的理解思路比较简单，第一步是提取表单或者页面的标签中参数，然后处理和判断参数，当参数合法的时候开始执行请求，请求之前可以设置一下 csrfmiddlewaretoken 参数，接着填写接口的参数，最后判断接口返回的状态码，并根据状态码做 HTML 渲染。

### 页面触发 ajax 请求

js 文件中写好了 ajax 请求的方法之后，就需要到页面中给 action 绑定事件了，一般都是给按钮绑定触发，可以查看我的代码中的写法：

```html
<script>
$('#start-push').click(function() {
    docker_search("{{ csrf_token }}", "{% url 'tool:docker_search' %}");
})
</script>
```

从这里看代码就能理解为什么我要在 js 的函数中让 function 使用参数传入的形式传入 CSRF 参数和 URL 参数了，因为这样可以不用在 js 中写死，当然，js 中也可以使用从 html 标签中提取的方式获取这两个参数。

上面这个按钮触发的事件就不用过多解释了，就是点击按钮触发函数调用 ajax 请求。

### 利用缓存

由于我的在线工具大多数都是使用的爬虫技术，而爬虫都是调用的其他网站的接口，特别是刚添加的这个官方镜像仓库的查询接口属于外网，即使使用阿里云的服务器，调用接口的时候也比较慢，而且经常出现连接超时的现象。

鉴于请求官方接口比较耗时而且容易超时这一点，我给这个工具添加了缓存功能，简单来讲就是对于一些查询得比较频繁的镜像，会把查询结果保存到缓存中，具体代码更新如下：

```python
# docker镜像查询
def docker_search_view(request):
    if request.is_ajax():
        data = request.POST
        name = data.get('name')
        if name:
            # 只有名称在常用镜像列表中的搜索才使用缓存，可以避免对名称的过滤
            if name in IMAGE_LIST:
                cache_key = 'tool_docker_search_' + name
                cache_value = cache.get(cache_key)
                if cache_value:
                    res = cache_value
                else:
                    ds = DockerSearch(name)
                    res = ds.main()
                    total = res.get('total')
                    if total and total >= 20:
                        # 将查询到超过20条镜像信息的资源缓存一天
                        cache.set(cache_key, res, 60*60*24)
            else:
                ds = DockerSearch(name)
                res = ds.main()
            return JsonResponse(res, status=res['status'])
    return render(request, 'tool/docker_search.html')
```

可以对比看一下这个函数相对于使用缓存之前的改动，主要就是我对 name 是否属于 IMAGE_LIST 列表进行了一下特殊处理，这个列表就是我想保存缓存的查询结果，只有满足在这些查询中才缓存，缓存的过程无非就是先从缓存中拿数据，如果没有拿到就调用接口拿，然后存入数据中，如果对 Django 的缓存不了解的可以查看我博客中关于缓存的文章。

添加了缓存之后，在同一段时间内重复查询相同的镜像，会发现结果可以秒刷，再也不用等待了，用户体验也变得非常好。

## 总结

1. django 结合 jQuery 的 AJAX 可以做到前后端数据传递，利用 ajax 的特性可以在不更新当前 URL 的基础上面做到数据库传递，从而到达只更新部分 HTML 的效果。
2. 在 Django 提供接口给 ajax 的时候最好做到严格按照不同的返回码返回不同的信息
3. ajax 在请求接口完成之后，可以根据返回码的判断来执行不同的事件
4. 比较耗时的请求可以使用缓存