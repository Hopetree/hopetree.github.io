# 【Jenkins 插件】Jenkins Pipeline 流水线插件的使用，Vue 项目自动化构建和部署实战

最近一直在研究 Jenkins 的流水线插件 Pipeline，既然是研究，自然就不是为了掌握基本用法了，而是高级用法。目前研究的成果还是挺不错的，有很多想要实现的功能都已经通过插件自带的语法完成，后续会单独开一个系列来分享更多高级语法的使用，而这篇文章就来分享一下我的流水线实战——Vue 项目自动化构建和部署。

## 使用 Pipeline

### 插件介绍

Jenkins Pipeline 其实并不能算是一个插件，而是一套插件，简单来说就是利用一套插件来实现持续集成和交付。

怎么理解“流水线”？

所谓流水线，就是当你想要把一个项目从代码提交到最终的部署上线所包含的一系列阶段和步骤全部组装到一起，这个过程一般可能涉及源代码拉取、项目构建（打包）、构建镜像、安装部署、测试等步骤，而通过流水线插件，就可以把这些所有的步骤统一管理起来，方便维护和操作。

### 插件安装

安装 Pipeline 插件就不用多说了，直接在插件管理中搜索 Pipeline 并进行安装就行了，由于这是个流水线插件，依赖的插件比较多，需要多一点时间而已，没什么需要注意的地方。

### 插件使用

Pipeline 插件安装完成之后，可以在新建任务中看到多了“流水线”任务的选项，这个就是创建流水线。

在 Pipeline 中最关键的步骤就是 Pipeline script，也即是流水线的语法，一般可以写在代码仓库的 Jenkinsfile 文件中。

## Jenkins Pipeline 语法

### Pipeline script 选择

Pipeline script 支持两种配置形式，也支持两种语法。

首先，可以直接在 Jenkins 任务中写入 Pipeline script 的语法，这种方式的好处是可以更方便的修改任务的脚本，方便调试，劣势就是不方便管理脚本；另一种方式是直接使用代码管理平台远程拉取脚本，比如把脚本放到 GitHub 上面，运行直接先从代码仓库拉取脚本，然后执行，这种方式是比较好的。不过我的建议是可以先使用第一种方法进行调试，然后把脚本调试好之后再放到代码仓库，之后就可以使用第二种方式执行脚本。

下图可以看一下使用拉取 GitHub 代码仓库中脚本的方式：

![Pipeline script](https://tendcode.com/cdn/article/190901/tendcode_2019-09-01_17-21-21.png)

Pipeline script 支持两种语法，具体可以看看语法介绍，这里我比较推荐的是使用声明性 Pipeline 语法。

### 语法步骤生成

Pipeline 的语法很多，想要快速掌握并不容易，不过这不是问题，因为 Pipeline 给我们提供了一些常用语法的步骤生成，简单来说就是你可以通过配置来自动生成脚本语法。

比如下面截图是生成 git 拉取代码的语法：

![语法](https://tendcode.com/cdn/article/190901/tendcode_2019-09-01_17-16-38.png)

可以看到，代码拉取的步骤其实跟之前操作步骤插件的时候一样，非常方便，最后可以生成一条流水线步骤的语法，这个语法可以直接用到脚本中，自己可以根据需要进行一些修改。

### 实战脚本

我最近写了一个 Vue 的项目，所以就以这个项目的持续构建和部署来分享一下我的脚本。项目代码可以查看 <https://github.com/Hopetree/hao>

我把脚本分成了两个文件，这样看起来更清晰，主脚本如下：

```groovy
pipeline {
    agent {
        label 'docker'
    }
    options {
        // 添加日志打印时间
        timestamps()
        // 设置全局超时
        timeout(time: 10, unit: 'MINUTES')
    }
    parameters {
        choice(name: 'GITHUB_BRANCH', choices: ['master', 'develop'], description: 'checkout github branch')
    }
    environment {
        GITHUB_USER_ID = '2b98d5a0-65f8-4961-958d-ad3620541256'
        ALIYUN_USER_ID = '06989ce7-86fb-43ca-aec0-313d260af382'
        IMAGE_NAME = 'hao:test'
        REMOTE_IMAGE_NAME = 'registry.cn-shenzhen.aliyuncs.com/tendcode/hao:lts'
        IMAGE_TAR = 'hao.tar'
        SSH_NAME = 'CentOS-3-root'
        SSH_DIR = '/opt/cloud/hao'
    }
    stages {
        stage('checkout') {
            options {
                timeout(time: 2, unit: 'MINUTES')
            }
            steps {
                git (credentialsId: "${GITHUB_USER_ID}", url: 'https://github.com/Hopetree/hao.git', branch: "${GITHUB_BRANCH}")
            }
        }
        stage('docker build') {
            steps {
                script {
                    sh "docker build -t ${IMAGE_NAME} ."
                    sh "docker save ${IMAGE_NAME} > ${IMAGE_TAR}"
                    sh "pwd && ls -l"
                }
            }
        }
        stage('docker push') {
            when {
                expression {
                    "${params.GITHUB_BRANCH}" == "master"
                }
            }
            steps {
                script {
                    withDockerRegistry(credentialsId: "${ALIYUN_USER_ID}", url: 'http://registry.cn-shenzhen.aliyuncs.com') {
                        sh "docker tag ${IMAGE_NAME} ${REMOTE_IMAGE_NAME}"
                        sh "docker push ${REMOTE_IMAGE_NAME}"
                    }
                }
            }
        }
        stage("deploy") {
            when {
                expression {
                    "${params.GITHUB_BRANCH}" == "develop"
                }
            }
            steps {
                script {
                    def rootDir = pwd()
                    step_deploy = load "${rootDir}/deploy.groovy"
                    step_deploy.deploy("${SSH_NAME}", "${IMAGE_TAR}", "${SSH_DIR}", "${IMAGE_NAME}")
                }
            }
        }
    }
    post {
        always {
            // 清理临时容器和镜像
            sh "docker ps -a|grep Exited|awk '{print \$1}'|xargs -I {} docker rm {}"
            sh "docker images|grep '<none>'|awk '{print \$3}'|xargs -I {} docker image rm {} > /dev/null 2>&1 || true"
            cleanWs()
        }
    }
}
```

这里我并不打算详细介绍脚本的语法，因为后续会更新系列文章来研究语法。

这个流水线的操作流程可以用一个简单的流程图来看看具体在执行什么步骤：

![step](https://tendcode.com/cdn/article/190901/tendcode_2019-09-01_18-29-37.png)

我把项目分成了两个分支，master 分支是上线用的，develop 分支是开发用的，这里在拉取分支的时候可以选择分支，然后根据分支判断去执行对应的操作，比如如果判断是 master 分支则会把镜像构建出来后推送到阿里云的仓库中，而如果是 develop 分支，则会把镜像打包然后传送到测试环境的虚拟机上面，然后在测试环境镜像部署，这样就能在测试环境进行测试了。

## 运行结果

当任务运行完成，可以看到每个步骤的运行情况，包括运行时间和日志等：

![result](https://tendcode.com/cdn/article/190901/tendcode_2019-09-01_17-07-56.png)

上面的截图可以看到这里有三个不同的结果，前面两个都是运行成功的结果显示，可以看看由于选择了不同的分支，所以执行的过程中会把判断不执行的步骤跳过，而如果有步骤执行失败，也会显示失败结果，非常方便。

## 使用 Blue Ocean

Blue Ocean 被誉为下一代 Jenkins 界面，其实我在使用了这个插件之后发现更多的是可以显示一个比较好看的主题吧，具体的界面可以看看下面截图：

![step](https://tendcode.com/cdn/article/190901/tendcode_2019-09-01_17-09-59.png)

![blue ocean](https://tendcode.com/cdn/article/190901/tendcode_2019-09-01_17-10-17.png)