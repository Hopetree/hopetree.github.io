# Git 常用及特殊命令笔记

Git 作为个人和公司代码管理的最佳选择方案，熟悉各种常用的 git 命令操作显得尤为重要，这篇博文就作为自己的一个关于 git 常用和不常用命令的笔记，整理走一波！

## 远程到本地

### 克隆分支

- 克隆远程项目到本地  
  常规克隆（默认克隆主分支），不指定目录名称则使用项目名称：  

```shell
# git clone <repo> [dirname=repo_name]
git clone https://github.com/Hopetree/izone.git
```  

 - 克隆指定分支到本地：    

```shell
# git clone -b <branch> <repo> [dirname=repo_name]
git clone -b dev https://github.com/Hopetree/izone.git
```
- 克隆指定的深度（就是提交的历史）

指定深度可以减少克隆的时候下载文件的大小，如果只需要克隆最后一次提交，可以设置 `--depth=1` 这样可以有效减少历史提交的二进制文件的大小，使得克隆代码更小，花费的时间也会更短

```shell
git clone --depth=1 https://github.com/Hopetree/izone.git
```

## 本地到远程

### tag 操作
- 推送本地 tag 到远程  
```shell
git push origin --tags
```

## 本地操作

### 文件改动的增加和清除
- 添加改动文件  
  添加所有改动文件（不包括 .gitignore 忽略的文件）：
```shell
git add *
```
  添加 .gitignore 中忽略的文件：
```shell
git add -f .env
```

- 删除所有未添加文件的改动（使 git status 恢复到 clean 状态）  
```shell
git checkout .
```

- 删除某个文件的当前修改（未提交）
```shell
# git checkout -- <filename>
git checkout -- readme.md
```

- 删除某个文件的当前修改（已提交）
```shell
# 首先要取消文件的暂存状态，执行取消暂存命令，然后执行删除修改的命令
# git reset HEAD -- <filename>
git reset HEAD -- readme.md
git checkout -- readme.md
```

### 分支的操作
- 本地已存在分支之间的切换  
```shell
# git checkout <branch>
git checkout dev
```

- 本地从远程分支拉取新建分支并切换到新分支  
```shell
git checkout -b dev origin/dev
```

- 删除本地分支  
```shell
# git branch -d <branch>
git branch -d dev
# 当分支上面还有未完成的提交时，需要强制删除
git branch -D dev
```

## 远程操作

### 查询
- 查询远程分支  
```shell
git branch -r
```

- 更新远程分支列表（当远程添加了新分支，但是本地没有查询到的时候）  
```shell
git remote update origin -p
git branch -r
```

### 远程分支的增删
- 删除远程分支  
```shell
# git push origin --delete <branch>
git push origin --delete dev
```

### 一个提交合入到多个分支

要将A分支的一个commit合并到B分支，可以进行如下操作

1. 切换到A分支：git checkout A
2. 找到A分支提交的 commitID，如46d64dfr
3. 切换到分支B：git checkout B
4. 执行合入 git cherry-pick 46d64dfr，A 提交的 commit就会合入B分支

## Tag 操作
### 创建 tag 

- 本地创建 tag

```
# git tag -a <tag_name> -m 'tag 注释'
git tag -a v1-1.0 -m 'tag 注释'
```

- 推送本地 tag 到远程仓库

```
# 推送本地所有tag
git push origin --tags

# 推送单个tag
git push origin <tagname>
```

### 删除 tag
- 删除本地 tag
```
# git tag -d <tag_name>
git tag -d v1-1.0
```

- 删除远程 tag
```
# git push origin --delete tag <tag_name>
git push origin --delete tag v1.0
```


## 回退
- 回退到某个历史提交  
```shell
# git reset --hard <commit SHA>
git reset --hard 7ad2e20d94ebfae5391bee38628ecfccf15982ac
```

- 回退之后强制提交  
```shell
# git push -f origin <branch>
git push -f origin dev
```

## 常见报错及处理方式
- **clone和push报错**

报错内容包含如下信息
```
fatal: Authentication failed for 'http://xxx'
```
这种错误一般都是跟用户账号有关，如果是clone的话，可以在clone命令中显式添加账号信息然后clone，命令如下：
```bash
git clone http://username:password@github.xxx.git
```

## 冷知识

- .gitattributes 文件的使用

在github上，如果未指定语言，Linguist来自动识别你的代码应该归为哪一类，它是根据某种语言的代码量来决定是哪种语言的项目。如果识别有误，可以新建.gitattributes文件来进行设置。格式如下：

```bash
*.js linguist-language=python
*.css linguist-language=python
*.html linguist-language=python
```
- Git 飞行规则: <https://github.com/k88hudson/git-flight-rules/blob/master/README_zh-CN.md>

- Git 代码统计命令

统计某段时间内某个人代码提交量

```bash
git log --author="$(git config --get user.name)" --pretty=tformat: --numstat --since ==2019-8-1 --until=2019-9-1| gawk '{ add += $1 ; subs += $2 ; loc += $1 - $2 } END { printf "added lines: %s removed lines : %s total lines: %s\n",add,subs,loc }' - 
```

参考：<https://blog.csdn.net/yjaspire/article/details/80921000>

阮一峰博客：<http://www.ruanyifeng.com/blog/2019/12/git-undo.html>