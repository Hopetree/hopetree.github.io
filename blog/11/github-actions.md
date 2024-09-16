# 分享一些 GitHub Actions 的实用技巧

GitHub Actions 是 GitHub 的持续集成服务，该功能非常类似于 Jenkins Pipeline 的能力，相当于 GitHub 为每个用户提供了一个 Jenkins 平台，可供大家跑一些简单（其实也可以很复杂）的自动化任务。

我的好几个项目已经使用到了 GitHub Actions 的能力，以下是我总结的可以用 GitHub Actions 来构建的一些场景：

1. 代码提交或者请求合入的时候跑代码检查脚本，用来检查提交的代码是否合规
2. 代码提交到主分支后，进行 docker 镜像构建，并推送到
远程镜像仓库，比如我的 izone 项目就会进行镜像构建操作
3. 项目创建 tag 的时候，将项目打包推送到 pypi ，比如我的 py2curl 还有 django-tip 项目都会进行这个操作
4. 项目代码更新，将代码同步到自己的服务器，更新网站，还可以对 gitbook 实时更新

GitHub Actions 的具体用法我这里就不做介绍了，官网的 wiki 写的比较清楚，我这里只分享一些官网有写到，但是不容易在实际操作中想到怎么用的操作技巧。

## 触发工作流的事件

[触发工作流的事件](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows) 也就是 `on` 这个关键字的使用，之所有首先提到这个关键字的使用倒不是因为对这个关键字有什么特别的理解，而是想要强调关键字的重要性，毕竟你可以创建多个工作流，所以也可以按照不同的触发事件来选择需要执行的工作流。

举个栗子：

```yaml
on:
  pull_request:
    branches: [ master ]
```

上面的触发条件是当有合入请求到 master 分支的时候，比较适合的场景是对提交的代码进行检查，只有当检查通过的时候才合入代码，一般可以执行门禁任务。

```yaml
on:
  release:
    types: [created]
```

这个的触发条件是当有 tag 创建的时候，比较适合进行归档操作，比如镜像打包，项目打包推送到 pypi 等。

## 使用 Secrets

[Secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#using-encrypted-secrets-in-a-workflow) 是每个项目可以配置的加密信息，信息可以以全程加密的形式传递给 Actions 使用，这个既保证了信息的有效性，又防止信息泄露，非常适合一些跟密码相关的信息。

首先到项目的 Secrets 中添加自己想要添加的信息，然后就可以按照如下使用方式：

```yaml
- name: Build and publish
  env:
    TWINE_USERNAME: ${{ secrets.PYPI_USERNAME }}
    TWINE_PASSWORD: ${{ secrets.PYPI_PASSWORD }}
```

上面这个例子是我将自己 pypi 的账号和密码设置成了 Secrets，然后将信息添加到环境变量。

## 使用 github 上下文信息

何为 [github 上下文信息](https://docs.github.com/en/free-pro-team@latest/actions/reference/context-and-expression-syntax-for-github-actions)？ 也就是 github 的工作流中可以直接读取的关于项目本身、关于job、事件等的一些信息，这些信息都可以在任务执行过程中读取使用。

具体有多少信息可以使用呢？官方给了一个例子，可以放到你的项目中，去打印出来可以使用的信息：

```yaml
on: push

jobs:
  one:
    runs-on: ubuntu-latest
    steps:
      - name: Dump GitHub context
        env:
          GITHUB_CONTEXT: ${{ toJson(github) }}
        run: echo "$GITHUB_CONTEXT"
      - name: Dump job context
        env:
          JOB_CONTEXT: ${{ toJson(job) }}
        run: echo "$JOB_CONTEXT"
      - name: Dump steps context
        env:
          STEPS_CONTEXT: ${{ toJson(steps) }}
        run: echo "$STEPS_CONTEXT"
      - name: Dump runner context
        env:
          RUNNER_CONTEXT: ${{ toJson(runner) }}
        run: echo "$RUNNER_CONTEXT"
      - name: Dump strategy context
        env:
          STRATEGY_CONTEXT: ${{ toJson(strategy) }}
        run: echo "$STRATEGY_CONTEXT"
      - name: Dump matrix context
        env:
          MATRIX_CONTEXT: ${{ toJson(matrix) }}
        run: echo "$MATRIX_CONTEXT"
```

比如，在我的项目中，我要根据当前的 tag 版本号去推送到 pypi 中，我是这样写的：

```yaml
- name: Build and publish
  env:
    TWINE_USERNAME: ${{ secrets.PYPI_USERNAME }}
    TWINE_PASSWORD: ${{ secrets.PYPI_PASSWORD }}
    TAG_REF: ${{ github.ref }}
  run: |
    tag=`echo ${TAG_REF}|awk -F/ '{print $3}'`
    sed -i "/VERSION =/c VERSION = '${tag}'" setup.py
    python setup.py sdist bdist_wheel
    twine upload --skip-existing dist/*
```

```markdown
我这里的做法是，首先通过上下文拿到 `${{ github.ref }}` 这个信息就是当前的 tag，然后提取版本号，进而修改打包文件中版本号进行推送。
```

## 条件判断及函数用法

Actions 内置了一些常规的[函数](https://docs.github.com/en/free-pro-team@latest/actions/reference/context-and-expression-syntax-for-github-actions#functions)，可以非常方便的处理一些参数，然后也支持一些常规判断逻辑，将这两个内置支持联系起来，就可以形成一个非常方便的事件触发选择器。

直接来看两个例子：

```yaml
jobs:
  format:
    runs-on: ubuntu-latest
    if: "! contains(github.event.head_commit.message, 'wip')"
```

上面这个任务在执行前会判断，当提交的 commit 信息中包含 wip 则任务不会执行，只有不包含 wip 的提交才会触发任务，这个用法就很实用了，因为 wip 的意思本身就表示了当前的提交不是最终确认的提交，所以不执行任务是正确的。

```yaml
jobs:
  format:
    runs-on: ubuntu-latest
    if: "contains(github.event.head_commit.message, '[build]')"
```

以上两个例子，可以让我们在写工作流的时候有更多的选择，完全可以通过判断 commit 关键词来选择性触发任务，这就可以把多个任务写到一个 action 中，然后通过 commit 提交的信息来选择性触发任务。

参考：[Running GitHub Actions for Certain Commit Messages](https://ryangjchandler.co.uk/articles/running-github-actions-for-certain-commit-messages)