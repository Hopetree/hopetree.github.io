# Go 学习笔记（11）：利用 GitHub Actions 进行多平台打包

最近在为网站开发一个服务器监控的功能，功能已经全部开发完成并上线了。其中客户端使用的是 Golang 开发的，在开发完成后需要将项目打包成二进制文件供服务器下载使用，因此就顺便学习了一下 Go 项目如何打包成不同的平台中可执行文件。

## Go 打包的一些知识点

### Go 编译

首先，使用 Go 做项目的都知道，Go 是可以把一个项目代码编译成一个可执行的二进制文件，但是由于系统的差别，同一套代码在不同平台生成的二进制是不同的，并且大概率在一个平台上编译出来的产物也不能在另一个平台执行。

正是由于这个特性，所以如果想自己的项目能在各个平台上都能使用，就必须在不同的平台上都去编译一次，显然，这种需求是通用的，因此解决方案也是通用的，那就是可以利用 Github Actions 进行多平台编译。

### Github Actions 的作用

关于 Github Actions 的作用这里就不做解释了，我之前有文章也进行过分享：[ 分享一些 GitHub Actions 的实用技巧](https://tendcode.com/subject/article/github-actions/ " 分享一些 GitHub Actions 的实用技巧")

反正如果你看到在 Github 的项目的版本管理里面可供下载的软件包，大概率就是利用 Github Actions 打包出来的 ，这个说法针对各种语言都通用。

比如看到如下一个项目的包：

![pkg](https://tendcode.com/cdn/2024/03/202404021656846.png)

一般软件包都是会提供各种平台的版本，显然这不是靠作者自己去每个平台打包出来的，这种基本都是依靠 Github Actions 实现的。

## Go 打包实战

### 1. 创建 .goreleaser.yml 文件

首先，利用 Github Actions 编译 Go 项目需要在项目的根目录中创建一个 `.goreleaser.yml` 文件，用来定义一些包信息。

这个文件的可以定义的内容很多，但是对于只需要编译二进制文件的项目，就只需要定义 `project_name`，`before`，`builds`，`archives` 即可。

具体的参数作用可以查看文档：[https://llever.com/goreleaser-zh/customization/](https://llever.com/goreleaser-zh/customization/ "https://llever.com/goreleaser-zh/customization/")


#### 1.1 编译前

在编译前当然是要下载依赖文件，这是最常用的：

```yaml
before:
  hooks:
    - go mod tidy
```

#### 1.2 编译

可以通过多种方式自定义构建.您可以指定哪个 GOOS,GOARCH 和 GOARM 构建二进制文件(goreleaser将生成所有组合的矩阵)，您可以更改二进制文件的名称,命令参数,环境变量,钩子等.

这是一个builds注释，指定了所有字段部分:

```yaml
# .goreleaser.yml
builds:
  # 你能用 多个 构建 定义，yaml格式
  -
    #  main.go 文件或者主包的路径 .
    # 默认 `.`.
    main: ./cmd/main.go

    # 命名 最终二进制文件的模版.
    # 默认是 项目目录的名称.
    binary: program

    # 设置 命令参数到自定义的 build tags.
    # 默认是 空.
    flags:
      - -tags=dev

    # Custom asmflags templates.
    # 默认是 空.
    asmflags:
      - -D mysymbol
      - all=-trimpath={{.Env.GOPATH}}

    # Custom gcflags templates.
    # 默认是 空.
    gcflags:
      - all=-trimpath={{.Env.GOPATH}}
      - ./dontoptimizeme=-N

    # Custom ldflags templates.
    # 默认是 `-s -w -X main.version={{.Version}} -X main.commit={{.Commit}} -X main.date={{.Date}}`.
    ldflags:
     - -s -w -X main.build={{.Version}}
     - ./usemsan=-msan

    # 运行构建期间的环境变量.
    # 默认是 空.
    env:
      - CGO_ENABLED=0

    # GOOS 构建列表r.
    # 更多内容，请参考: https://golang.org/doc/install/source#environment
    # 默认为 darwin 和 linux.
    goos:
      - freebsd
      - windows

    # GOARCH 构建系结构.
    # 更多内容，请参考: https://golang.org/doc/install/source#environment
    # 默认为 386 和 amd64.
    goarch:
      - amd64
      - arm
      - arm64

    # GOARM 要构建的 ， 若GOARCH 是 arm时.
    # 更多内容，请参考: https://golang.org/doc/install/source#environment
    # 默认是 只有 6.
    goarm:
      - 6
      - 7

    #  GOOS + GOARCH + GOARM 组合忽略列表.
    # 默认是 空.
    ignore:
      - goos: darwin
        goarch: 386
      - goos: linux
        goarch: arm
        goarm: 7

    # Hooks 可用于 自定义最终二进制文件,
    # 例如, 运行 generators.
    # 默认 都为 空.
    hooks:
      pre: rice embed-go
      post: ./script.sh
```

#### 1.3 存档文件

可以把构建的二进制文件与README和LICENSE文件一起存档到tar.gz文件。在archive里面您可以自定义存档名称,其他文件和格式.

这是一个archive，指定了所有字段部分的注释:

```yaml
# .goreleaser.yml
archive:
  # 存档 命名 模版.
  # 默认:
  # - if 格式为 `tar.gz` 或者 `zip`:
  #   - `{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}{{ if .Arm }}v{{ .Arm }}{{ end }}`
  # - if 格式为 是 `binary`:
  #   - `{{ .Binary }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}{{ if .Arm }}v{{ .Arm }}{{ end }}`
  name_template: "{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}"

  # 替换 存档名称中的 GOOS 和 GOARCH.
  # Keys 应为合法 GOOSs 或 GOARCHs.
  # Values 应为 恰当的替代名称.
  # 默认是 空.
  replacements:
    amd64: 64-bit
    386: 32-bit
    darwin: macOS
    linux: Tux

  # 设为 true, 如果你想 所有 文件都包裹进存档文件.
  # 若设为 true 和 你 解压'goreleaser_Linux_arm64.tar.gz',
  # 你会得到 'goreleaser_Linux_arm64' 文件夹.
  # If 设为 false, 所有文件都分离开来.
  # 默认是 false.
  wrap_in_directory: true

  # Archive 格式. 合法选项 `tar.gz`, `zip` and `binary`.
  # 若 `binary`, 压缩文件不创建，且 binaries 代之直接上传.
  # 与 name_template 合作 和 下面 files字段中会被忽略.
  # 默认是 `tar.gz`.
  format: zip

  # 可根据 GOOSs，指定 格式.
  # 常见情况是，window下为zip格式.
  # 默认是 空.
  format_overrides:
    - goos: windows
      format: zip

  # 你想加入到 archive，匹配的 files/globs，.
  # 默认为匹配 `LICENCE*`, `LICENSE*` ,
  # `README*` 和 `CHANGELOG*` (大小写略) 的文件.
  files:
    - LICENSE.txt
    - README.md
    - CHANGELOG.md
    - docs/*
    - design/*.png
    - templates/**/*
```

#### 1.4 我的项目定义的：

```yaml
project_name: GoMonitor

before:
  hooks:
    - go mod tidy

builds:
  - binary: GoMonitor
    main: .
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - windows
    goarch:
      - amd64
      - arm
      - arm64
    ignore:
      - goos: windows
        goarch: arm
      - goos: windows
        goarch: arm64

checksum:
  name_template: "checksums.txt"

archives:
  - name_template: >-
      {{ .ProjectName }}_
      {{- .Version }}_
      {{- if eq .Os "darwin" }}macos_
      {{- else }}{{ .Os }}_{{ end }}
      {{- if eq .Arch "amd64" }}x86_64
      {{- else if eq .Arch "386" }}i386
      {{- else if eq .Arch "arm64" }}aarch64
      {{- else if eq .Arch "arm" }}armv{{ .Arm }}
      {{- else }}{{ .Arch }}{{ end }}
    wrap_in_directory: true
    format_overrides:
      - goos: windows
        format: zip
    builds_info:
      group: root
      owner: root
    files:
      - README.md
      - LICENSE
```

我这里只需要打包 `linux` 系统和 Windows系统的包，然后最后把除了二进制文件以外的 `README.md` 和 `LICENSE` 一起打包。

::: info 我的建议

我强烈建议可以自己创建一个单独的项目，专门用来验证 Go 的编译，并且去参考一些开源的项目的 .goreleaser.yml 内容，甚至很多项目的文件你可以直接复制过来稍加改动即可。
:::

### 2. 创建 Github Actions 编排

创建了 .goreleaser.yml 文件只是定义了你要怎么编译代码以及在哪些平台上进行编译。

而真正执行编译的操作是由 Github Actions 进行的，那就要定义一个编排规则。

你需要在项目中创建一个文件 `.github/workflows/go-releaser.yml`，文件的内容如下：

```yaml
name: go-releaser

permissions:
  contents: write
  id-token: write
  packages: write

on:
  push:
    tags: [ 'v*' ]

jobs:
  goreleaser:
    runs-on: ubuntu-latest
    env:
      flags: ''
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Set up Go
        uses: actions/setup-go@v3
        with:
          go-version: 1.21
          cache: true
      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          distribution: goreleaser
          version: latest
          args: release --clean ${{ env.flags }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


这个编排的触发方式是创建一个 `tag` 并且以v开头命名的时候，比如 `v1.0.0` 

然后会依次执行代码拉取、Go 编译、打包三个步骤。

### 3. 创建并添加 Github token

由于编译后要将包上传到你的项目中，因此编排里面使用到了一个环境变量 `GITHUB_TOKEN ` ，这个环境变量读取的是你项目中添加的 `secrets `。

首先去你的 Github 的个人设置中创建一个 Token: [https://github.com/settings/tokens](https://github.com/settings/tokens "https://github.com/settings/tokens")  创建的时候选择权限我猜测应该勾选上 packages

![](https://tendcode.com/cdn/2024/03/202404021726452.png)

然后进入项目的配置，在项目中添加 token：

![](https://tendcode.com/cdn/2024/03/202404021728895.png)

### 4. 创建并推送 tag

创建一个tag，并以v 开头命令，比如 `v1.0.0`，然后推送到 Github 中，此时就会触发 Github Actions 进行打包，完成后就可以看到上传的tag里面有了编译好的包。

下面是我的项目打包出来的：

![](https://tendcode.com/cdn/2024/03/202404021744972.png)

## 相关文档

- [.goreleaser.yml文件 解析](https://llever.com/goreleaser-zh/customization/ ".goreleaser.yml文件 解析")