# 容器化部署OpenLDAP并使用Python查询LDAP数据

## 前言

写这篇文章的初衷：公司的平台可以配置 LDAP 登录，在客户项目中这是一个最常见的功能，对接 LDAP 主要分成两个部分，第一个配置对接，这个有标准流程，直接配置就行；第二部分是用户数据同步，这个需要根据客户现场组织架构调整同步逻辑。

我发现公司其他人写的用户同步脚本乱七八糟的，虽然每个客户的现场数据不同，但是按理只是查询条件不同而已，不应该代码那么不统一，于是本着“知其然而知其所以然”的原则，我直接来亲自部署一个 LDAP 然后自己写一个通用的用户同步脚本，以便后续使用的时候只需要稍微改一下代码就能直接复用。

## LDAP 介绍

LDAP（Lightweight Directory Access Protocol）是一种用于访问和管理分布式目录服务的开放性协议。目录服务是用于存储、组织和访问网络资源信息的系统，比如用户、组、设备、文件等。LDAP被广泛用于网络管理中，尤其是在企业环境中，用于用户认证和授权。

### LDAP的主要用途

1. **用户认证和授权**：LDAP最常见的用途是集中管理用户认证信息。它允许在一个中心位置存储用户的登录信息，并通过统一的身份验证机制管理访问权限。常见的应用场景包括单点登录（SSO）和身份验证服务。

2. **目录服务**：LDAP用于提供目录服务，即对网络资源的组织、查找和管理。这包括用户信息、设备列表、权限设置等。它通常与其他服务（如电子邮件服务器）集成，以提供用户查找和通讯录功能。

3. **配置管理**：一些应用程序使用LDAP作为配置数据库，以便集中管理和访问配置文件和设置。

### 为什么要使用LDAP

1. **集中管理**：LDAP提供了一种集中管理用户和资源的方式。这使得管理员能够从一个位置控制整个组织的用户访问权限，简化了管理流程。

2. **跨平台兼容性**：LDAP是一个开放标准协议，可以在不同操作系统和应用程序之间互操作。这使得它在多样化的IT环境中非常有用。

3. **扩展性**：LDAP设计之初就考虑到了大规模部署的需求，因此它能有效处理大量的用户和查询。它的层次结构和索引机制可以快速查找和检索信息，即使在大型目录中也是如此。

4. **安全性**：LDAP支持多种安全功能，包括基于SSL/TLS的加密和通过SASL进行的强身份验证，这些功能确保了数据的安全性。

5. **灵活性**：LDAP具有高度的灵活性，能够适应各种类型的组织结构和数据模型。它支持层次化的数据存储，这意味着可以根据企业的需求组织用户和资源信息。

### LDAP的优势

1. **开放性和标准化**：LDAP是一个开放标准协议，这意味着它可以在不同供应商的产品之间互操作，不受制于特定厂商。这使得它在异构环境中尤其有用。

2. **高效性**：LDAP采用了高效的查询和数据检索机制，特别适合处理读密集型的操作。与关系数据库相比，LDAP在处理大量读操作时通常更高效。

3. **灵活的结构**：LDAP使用树状的目录结构，允许管理员灵活地组织和管理数据。这种结构还支持多层次的查询和数据管理，适应复杂的组织结构。

4. **广泛支持**：由于LDAP的广泛使用，几乎所有现代的操作系统、应用服务器和许多应用程序都原生支持LDAP，使得其集成和部署相对简单。

### LDAP的基本概念

1. **目录服务**：
	- 目录服务是一种专门的数据库系统，用于存储、组织和管理网络中用户、设备、资源和其他对象的相关信息。它以层次结构的方式存储数据，类似于文件系统中的目录树结构。
	- 目录服务中的数据通常是只读的，适合于频繁读取和查询，而不是频繁修改。LDAP协议用来查询和搜索这些数据，而不是用于处理复杂的事务或数据修改。

2. **条目（Entry）**：
	- 目录中的每一个对象都称为“条目”。每个条目由一组属性（Attribute）组成，每个属性都有一个名称和一个或多个值。条目通常表示一个网络资源，如用户、组、计算机、打印机等。
	- 每个条目都有一个唯一的标识符，称为“区分名称”（DN，Distinguished Name），它是该条目的唯一地址。

3. **属性（Attribute）**：
	- 属性是与条目关联的名称/值对。例如，一个用户条目可能有 `cn`（common name，通用名）、`mail`（电子邮件地址）、`uid`（用户ID）等属性。
	- 属性类型定义了属性的名称、可能的值类型（如字符串、整数等）以及该属性是否可以多值。

4. **对象类（ObjectClass）**：
	- 对象类是LDAP中的一种结构，定义了条目可以具有的属性。每个条目都由一个或多个对象类实例化，而对象类决定了该条目必须具有哪些属性以及可以选择性具有哪些属性。
	- 例如，`inetOrgPerson` 是一个常见的对象类，用于表示互联网用户信息，它包含属性如 `cn`（通用名）、`sn`（姓氏）、`mail`（电子邮件地址）等。

5. **层次结构（Hierarchical Structure）**：
	- LDAP使用层次结构组织数据，这种结构类似于目录树。树的顶端是根目录（Base DN），每个条目都位于该树的某个分支上。层次结构允许条目按组织单位、地理位置或其他标准进行分类。
	- 例如，在一个公司的LDAP目录中，树的顶端可能是公司名称，下面的分支可能是各个部门，部门下再细分为用户和设备。

6. **协议操作**：
	- LDAP协议支持多种操作，包括：
		- **绑定（Bind）**：用于客户端认证，确定用户身份。
		- **搜索（Search）**：在目录中查找满足条件的条目。
		- **比较（Compare）**：检查某个条目是否包含特定的属性值。
		- **添加（Add）、删除（Delete）、修改（Modify）**：对目录中的条目进行管理操作。

### 常用属性

以下是按重要性排序的LDAP关键字（属性类型），包括其英文全称和描述：

| **关键字**         | **英文全称**           | **描述**                                                                                                                                   |
|--------------------|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| **dn**            | Distinguished Name               | 一条记录的位置信息，全局唯一。例如`uid=xiaoqiang,ou=develop,ou=wuhan,dc=tendcode,dc=com`
| **uid**            | User ID                | 用户标识符，通常表示用户的唯一登录名。例如：“jdoe”。                                                                                       |
| **cn**             | Common Name            | 通用名，通常用于表示一个对象的名称。对于用户条目，`cn` 通常是用户的全名，例如：“John Doe”。                                                  |
| **sn**             | Surname                | 姓氏，表示用户的姓。例如：“Doe”。                                                                                                          |
| **mail**           | Email Address          | 电子邮件地址，表示用户的邮箱地址。例如：“johndoe@example.com”。                                                                             |
| **ou**             | Organizational Unit    | 组织单位，表示条目所属的组织单元或部门。例如：“Sales Department”。                                                                          |
| **dc**             | Domain Component       | 域组件，用于表示域名的一部分，通常与其他 `dc` 属性一起使用，表示域名的不同部分。例如，对于域名 "example.com"，`dc=example` 和 `dc=com`。      |
| **o**              | Organization           | 组织，表示条目所属的组织或公司。例如：“Example Corporation”。                                                                              |
| **c**              | Country                | 国家，用于表示条目所属国家的国家代码。例如：“US”代表美国，“CN”代表中国。                                                                    |
| **l**              | Locality Name          | 地理位置名，表示条目所在的城市或地区。例如：“New York”。                                                                                    |
| **st**             | State or Province      | 州或省，表示条目所在的州或省。例如：“California”。                                                                                           |
| **member**         | Member                 | 成员，用于表示一个组中的成员，通常指向其他条目。例如，可以用来列出属于某个组的所有用户。                                                     |
| **uidNumber**      | User ID Number         | 用户ID号码，表示用户的唯一数字标识符，通常与Unix/Linux系统上的用户ID对应。                                                                   |
| **gidNumber**      | Group ID Number        | 组ID号码，表示用户所属组的唯一数字标识符，通常与Unix/Linux系统上的组ID对应。                                                                 |
| **homeDirectory**  | Home Directory         | 主目录，表示用户的主目录路径，通常用于定义用户登录时的默认文件夹。例如：“/home/jdoe”。                                                      |
| **telephoneNumber**| Telephone Number       | 电话号码，表示用户或组织的电话号码。例如：“+1 800 555 1234”。                                                                               |
| **description**    | Description            | 描述，提供关于条目的附加信息，通常是自由文本。例如：“John Doe's primary account”。                                                          |


## 部署 openldap 和 phpldapadmin

这里需要启动两个容器：

- openldap 是一个开源的 LDAP（轻量级目录访问协议）服务器。
- phpldapadmin 是一个基于 Web 的 LDAP 管理工具，提供了图形化界面，方便管理员通过浏览器管理 OpenLDAP 服务器中的目录数据。它允许用户轻松地添加、修改、删除条目，查询目录树，并执行其他管理操作。

直接使用容器化部署，docker-compose.yml 文件内容如下：

```yaml
version: '3'

services:
  ldap:
    image: osixia/openldap:1.5.0
    container_name: openldap
    environment:
      LDAP_ORGANISATION: "tendcode"
      LDAP_DOMAIN: "tendcode.com"
      LDAP_ADMIN_PASSWORD: "admin@123"
    ports:
      - "389:389"
      - "636:636"
    volumes:
      - ./ldap/data:/var/lib/ldap
      - ./ldap/config:/etc/ldap/slapd.d
    restart: unless-stopped

  phpldapadmin:
    image: osixia/phpldapadmin:0.9.0
    container_name: phpldapadmin
    environment:
      PHPLDAPADMIN_LDAP_HOSTS: ldap
      PHPLDAPADMIN_HTTPS: "false"  # 如果需要HTTPS, 可以设置为"true"
    ports:
      - "8081:80"
    restart: unless-stopped
    depends_on:
      - ldap
```

相关环境变量的解释：

- `LDAP_ORGANISATION`: 设置 LDAP 组织名称。
- `LDAP_DOMAIN`: 设置 LDAP 域名。
- `LDAP_ADMIN_PASSWORD`: 设置管理员密码。

暴露的端口：

- 389：LDAP 后端端口，可以供其他平台对接
- 736：LDAP 后端端口 HTTPS，可以供其他平台对接
- 8081：phpldapadmin 前端页面端口

直接运行容器：

```bash
docker-compose up -d
```

然后就可以访问页面，比如我的是 http://100.88.88.203:8081


## LDAP 基本操作

### 登录

管理用户的用户名为 `CN=admin,DC=tendcode,DC=com` 密码为 `admin@123`，具体要看上面设置的环境变量，用户名里面CN是默认的admin，DC就是域名。

![openldap](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161120111.png)

### 创建 ou

上面的属性有介绍，`ou` 是组织部门的概念，可以表示公司-部门-组等层级，创建一个组织部门如下：

![ldap-create-ou](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161127129.png)

![ldap-create-ou](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161128461.png)

然后输入组织名称，后面还要提交一下就可以了。组织部门可以创建很多层级，按照组织架构创建即可。

### 创建用户

创建用户这里使用 import 方式导入，文本内容如下（注意用户的 `dn` 里面应该包含用户所在组织结构）：

```text
dn: uid=xiaohong,ou=product,ou=shanghai,dc=tendcode,dc=com
uid: xiaohong
sn: 小红
cn: xiaohong
givenName: xiaohong
displayName: xiaohong
mail: xiaohong@163.com
objectClass: person
objectClass: organizationalPerson
objectClass: inetOrgPerson
userpassword: npc@123
```

直接提交后就可以创建用户

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161317094.png)

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161320030.png)

### 查询数据

这里可以根据条件查询数据，组织和用户都是数据，可以根据不同条件查询，比如我这里查询所有用户，可以设置调试为 `objectClass=person`：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161323474.png)

也可以按照具体的 Base DN 查询，获取某个组织下面所有数据（包括组织和用户），比如这里查询 `ou=wuhan,dc=tendcode,dc=com` 下面所有数据：

![](https://cdn.jsdelivr.net/gh/Hopetree/blog-img@main/2024/04/202408161325366.png)

**真实需求**：获取某个子公司下面所有部门，然后获取每个部门下所有用户。


## 使用 Python 库 ldap3 查询数据

下面是一个简单的 demo 可以查询 LDAP 的用户信息，可以用来进行用户同步。

```python
from ldap3 import Server, Connection, ALL, SUBTREE

class LDAPQuery:
    def __init__(self, ldap_server, ldap_user, ldap_password, base_dn, port=389):
        self.ldap_server = ldap_server
        self.ldap_user = ldap_user
        self.ldap_password = ldap_password
        self.base_dn = base_dn
		self.port = port
        self.conn = None

    def __enter__(self):
        """进入上下文管理器时，自动连接LDAP服务器"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        """退出上下文管理器时，自动关闭LDAP连接"""
        self.close()

    def connect(self):
        """连接到LDAP服务器"""
        server = Server(self.ldap_server, self.port, get_info=ALL)
        self.conn = Connection(server, self.ldap_user, self.ldap_password)
        if not self.conn.bind():
            raise Exception("Failed to bind to server: {}".format(self.conn.result['description']))

    def search(self, search_base=None, search_filter='(objectClass=*)', search_scope=SUBTREE,
               attributes=None):
        """
        通用LDAP查询函数
        :param search_filter: 查询筛选条件，默认返回所有对象
        :param search_base: 查询起始的基准DN，默认为初始化时的base_dn
        :param search_scope: 查询范围，可以是SUBTREE（默认）、LEVEL或BASE
        :param attributes: 要返回的属性列表，默认返回所有属性
        :return: 查询结果列表
        """
        if self.conn is None or not self.conn.bound:
            raise Exception("Not connected or bound to LDAP server")

        # 使用默认的 base_dn 作为 search_base，如果未指定
        search_base = search_base or self.base_dn

        # 执行查询
        self.conn.search(search_base=search_base,
                         search_filter=search_filter,
                         search_scope=search_scope,
                         attributes=attributes)

        return self.conn.entries

    def close(self):
        """关闭LDAP连接"""
        if self.conn:
            self.conn.unbind()
            self.conn = None


def main():
    with LDAPQuery(LDAP_SERVER, LDAP_USER, LDAP_PASSWORD, BASE_DN) as ldap_query:
        users = ldap_query.search(search_base='dc=tendcode,dc=com',
                                  search_filter='(objectClass=person)',
                                  attributes=['cn', 'sn', 'mail'])
        for user in users:
            print(user.entry_dn)
            print(json.dumps(user.entry_attributes_as_dict))


if __name__ == "__main__":
    LDAP_SERVER = 'ldap://100.88.88.203:389'
    LDAP_USER = 'CN=admin,DC=tendcode,DC=com'
    LDAP_PASSWORD = 'admin@123'
    BASE_DN = 'dc=tendcode,dc=com'

    main()

```

`entry_dn` 可以得到数据的 DN，`entry_attributes_as_dict` 可以将查询的属性转成字典格式。打印输出如下：

```text
uid=xiaoming,ou=beijing,dc=tendcode,dc=com
{"mail": ["xiaoming@abc.com"], "sn": ["\u5c0f\u660e"], "cn": ["xiaoming"]}
uid=xiaoqiang,ou=develop,ou=wuhan,dc=tendcode,dc=com
{"mail": ["xiaoqiang@163.com"], "sn": ["\u5c0f\u5f3a"], "cn": ["xiaoqiang"]}
uid=xiaohong,ou=product,ou=shanghai,dc=tendcode,dc=com
{"mail": ["xiaohong@163.com"], "sn": ["\u5c0f\u7ea2"], "cn": ["xiaohong"]}
```

## 参考文章

- [LDAP简单介绍及使用](https://www.cnblogs.com/strongmore/p/18113978 "LDAP简单介绍及使用")