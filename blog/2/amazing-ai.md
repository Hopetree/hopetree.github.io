# 再一次被 AI 的编程能力折服！！！

前段时间我利用字节的 AI 编辑器（跟 Cursor 一样） Trae 创建了一个纯前端项目 [FlowDesigner](https://github.com/Hopetree/FlowDesigner "FlowDesigner")，与其说这是一个前端项目不如说是一个纯前端实现的几个页面吧。当时实现的过程就非常舒服，最终的效果也相当满意，而今天我借助 Trea 将这个项目移植到我的博客中，AI 的表现更是让我感到惊讶。

## 纯前端实现

先提供一下项目的访问地址（集成到我博客）：[https://tendcode.com/flow/](https://tendcode.com/flow/ "https://tendcode.com/flow/")

这个项目的创建思路来自于我的工作，我们公司有个产品是 ITSM，也就是流程管理平台，经常会给客户创建一些流程，由于很多环境是内部环境，不方便进行流程的导入导出和创建，于是我找到了一个前端流程图设计的库 [bpmn.js ](https://bpmn.io/ "bpmn.js ") 这个库是一个非常通用的前端流程图设计项目，经过验证我们公司的流程图设计前端跟这个库是完全兼容的。

于是我的想法就是创建一个个人项目，用来管理流程图，这也就是 FlowDesigner 项目的由来。

这个项目完全由我提需求，Trae 实现，主要的几个页面效果如下：

### 1. 流程列表页面

流程列表页也就是项目的主页，主题是显示流程清单和其他页面的入口，数据存储在用户的本地，也就是 localStorage 中。

当然，数据存储在 localStorage 中有好处也有坏处，好处就是数据不会经过服务器，直接存储在用户本地，是比较安全的，坏处就是数据很容易就被本地清理掉了，不过我的初衷就是提供一个用户可以临时创建流程的平台，如果真要持久化，其实可以导出流程。


![流程列表页面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202502221925872.png)

### 2. 流程创建页面

下面是创建流程的页面，直接就是 bpmn.js 提供的编辑视图，该页面提供了导入、导出xml，导出svg、保存等功能。

![流程创建页面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202502221933320.png)


### 3. 流程编辑页面

然后是流程编辑页面，可以修改流程，跟创建页面的效果一样

![流程编辑页面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202502221934357.png)

### 4. 流程查看页面

最后是流程查看页面

![流程查看页面](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2025/202502221935546.png)


## 移植到 Django 博客

讲真，这个项目是我前两周突发奇想创建的，当时是零代码实现，这个项目的代码都是依靠 Trae 输出的，而且整个的输出和调试过程相当舒服，虽然并不是一次性就满足我的需求，中间也有一些 Bug 产生，但是整体的体验是很舒服的，整个项目的最终版确定下来也才不到两个小时。

而今天，我同样使用 Trae，将这个纯前端的项目植入了我的 Django 博客中，并且实现了数据入库。

### 我的需求

下面是我给 Trae 的初始需求描述：

```markdown
当前目录是我的一个Django博客项目，apps目录是应用目录，其中flow项目是一个纯前端实现的流程图管理页面，目前这个应用的数据都存在前端，我现在有需求请你来实现：

1. 我希望这个应用的页面效果保持现状，但是需要按照不同的角色区别对待页面的加载方式，只需要考虑两种角色就行，第一个角色是管理员访问，则单独添加一套js代码，管理员访问的时候使用数据库来管理数据，而非管理员访问就用目前的前端存储数据

2. 非管理员访问的时候，保持目前的页面和数据加载、js代码等，管理员访问的时候，加载新的js代码，并在新js代码中实现数据从数据库获取和更新的逻辑

3. 数据库访问数据其实就是使用模型，此时你可以创建一些必要的接口来进行数据请求

4. 以上需求你需要先结合目前的项目代码来分析，然后先不要急着给代码，先给我方案，比如你会创建和修改哪些文件，创建和修改的目的是什么，先告诉我，我来评审方案，我们需要先把方案确认清楚之后才开始改代码
```

从这个需求可以看到，我有个想法，就是如何区分管理员用户和非管理员用户的实现方式，我希望 Trae 按照我的想法，先判断用户是不是管理员，然后去加载不同的 js 文件，这样就可以实现不同的用户使用不同的逻辑来加载数据。

但是经过一些讨论，我发现 Trae 并没有被我的需求限制住，它给我提供了更优雅的实现方式，同样可以达到我的需求，那就是将数据的操作抽象出来形成两个不同的对象，然后判断当前用户是不是管理员，如果是的就使用数据库操作的对象，如果不是，就使用 localStorage 对象，所以只需要这两个对象实现相同的增删改查方法即可。

下面是 Trae 写的关于数据操作的的代码，思路真的相当清晰，我这样一个非前端程序员也一下子就能理解它的这个做法。

```js
// 管理员数据存储接口
const adminStorage = {
    async getProcessList() {
        const result = await api.getProcessList();
        return result.processes;
    },

    async getProcess(processId) {
        return await api.getProcess(processId);
    },

    async saveProcess(processData) {
        return await api.createProcess(processData);
    },

    async updateProcess(processId, processData) {
        return await api.updateProcess(processId, processData);
    },

    async deleteProcess(processId) {
        return await api.deleteProcess(processId);
    }
};

// localStorage 存储接口
const localStorageImpl = {
    getProcessList() {
        const processes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('bpmn_')) {
                try {
                    const processData = JSON.parse(localStorage.getItem(key));
                    processes.push({
                        id: key,
                        ...processData
                    });
                } catch (err) {
                    console.error('加载流程数据失败:', err);
                }
            }
        }
        return processes;
    },

    getProcess(processId) {
        return JSON.parse(localStorage.getItem(processId));
    },

    saveProcess(processData) {
        const processId = 'bpmn_' + Date.now();
        localStorage.setItem(processId, JSON.stringify(processData));
        return { id: processId, ...processData };
    },

    updateProcess(processId, processData) {
        localStorage.setItem(processId, JSON.stringify(processData));
        return { id: processId, ...processData };
    },

    deleteProcess(processId) {
        localStorage.removeItem(processId);
    }
};

// 根据角色选择存储实现
window.storage = window.isAdmin ? adminStorage : localStorageImpl;
```

### 最终效果

经过一番讨论和修改，不到一个小时的时间，Trea 就完全实现了我的需求，现在管理员访问页面的时候所有的数据都是读取的数据库的数据，所以作为管理员的我，创建的流程是存放到服务器上面的，而普通用户创建的流程就是在用户本地，这样这个流程管理平台既可以作普通用户的临时流程编辑也可以作为我管理一些个人流程的平台。

## 结语

算上这个项目，我已经使用 AI 创建过三个小项目了，而且结果都相当满意，经过这几次的项目经验，我越发感觉程序员特别是前端程序员应该好好利用上 AI 的编程能力去提高自己的工作效率。

当然，一个好的程序员也应该形成一个好的产品思维，要清晰的描述自己的需求，让 AI 能够明确自己要干什么。