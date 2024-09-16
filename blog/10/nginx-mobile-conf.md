# Nginx配置移动端访问自动重定向到指定请求

之前有个项目有个需求是同一个地址PC端访问的时候直接返回当前网页，而如果是移动端访问，则需要重定向到移动端的另一个地址，当时想到的方案就是通过nginx来做，然后网上找了一些相关资料，最后配置达到了要求，现在分享一下这个配置方式。

## 需求

先看一下这个具体的需求的复现场景，我这里用flask写了两个简单的接口，第一个借口web的请求格式为`/web/12`这种，第二个接口为`/mobile/12`这种，这里的需求就是当使用PC端访问`/web/12`直接正常返回，而当使用移动端访问`/web/12`的时候转发到`/mobile/12`请求。

```python
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/web/<int:num>/', methods=['GET'])
def web(num):
    # 获取当前访问的完整地址
    current_url = request.url

    # 构建响应数据
    response_data = {
        "current_url": current_url,
        "args": request.args.to_dict()
    }

    # 返回响应数据作为 JSON 响应
    return jsonify(response_data)


@app.route('/mobile/<int:num>/', methods=['GET'])
def mobile(num):
    # 获取当前访问的完整地址
    current_url = request.url

    # 构建响应数据
    response_data = {
        "current_url": current_url,
        "args": request.args.to_dict()
    }

    # 返回响应数据作为 JSON 响应
    return jsonify(response_data)


if __name__ == '__main__':
    app.run(debug=True)

```

## nginx配置实现

看看我这个配置

```nginx
server {
    listen 8050;
    server_name flask.local;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    set $flag 0;
    if ($http_user_agent ~* (mobile|iphone|ipad|android)){
        set $flag "${flag}1";
    }
    if ($request_uri ~* /web/(.*?)$){
        set $flag "${flag}1";
    }
    if ($flag = "011"){
        rewrite ^/web/(.*)$ /mobile/$1 last;
    }
}
```

这个配置实现这个需求的方式就是设置了3个判断条件，第一个判断条件判断请求头是否匹配到移动端，当然这里的匹配写的比较随意，实际的移动端可能比这个复杂，第二个判断条件是匹配地址，也就是需要进行规则转发的规则，第三个判断条件才是真正的判断，就是前面两个条件同时满足的时候才触发重定向。

为什么使用这种方式而不是直接同时判断请求地址和请求头？实际上我最开始也是这样想的，但是一旦使用这个方式就需要考虑else的条件应该这么写，不然会导致本身的PC端访问直接报错，我没有想到怎么写，并且在ChatGPT提问也给出的都是错误的方案，所以只能用上面这个方案实现。