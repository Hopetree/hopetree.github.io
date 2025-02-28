# 初学 Kafka：Python 接入 Kafka 的基本操作与实战

## 前言

最近有个运维需求，目的是对接一个第三方平台的告警事件到我们平台。对接的那个平台会把告警事件推送到他们的 Kafka，我们需要从 Kafka 中获取数据，处理后接入到我们的平台。由于我熟悉 Python，但对 Kafka 比较陌生，因此决定通过这篇文章记录一下我使用 Python 对接 Kafka 的基本操作，分享我的学习经验。

## 创建主题

在 Kafka 中，**主题**（Topic）是消息的分类方式。生产者将消息写入到主题中，消费者根据订阅的主题来消费消息。每个主题可以有多个**分区**（Partition），分区可以提供并发处理能力。每个分区中的消息都是按照严格的顺序存储的，并且每条消息都有一个唯一的偏移量（Offset）。

创建 Kafka 主题可以使用 `kafka-topics.sh` 命令，具体步骤如下：

1、 **创建主题**  

使用以下命令创建一个主题：

```bash
./kafka-topics.sh --create --topic my_json_topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

这里的 `--partitions` 参数表示分区数，`--replication-factor` 表示副本数。

2、**查看已创建的主题**  

可以通过以下命令查看所有的主题：

```bash
./kafka-topics.sh --list --bootstrap-server localhost:9092
```

## 生产者

Kafka 中的生产者（Producer）负责将消息写入到指定的主题。生产者通常是异步操作，这样可以提高吞吐量。

### 安装 `confluent-kafka`

`confluent-kafka` 是一个广泛使用的 Kafka 客户端库，但其较新版本（1.5 及以上）不再支持 Python 2。因此，如果你在 Python 2 环境中工作，必须安装版本 1.4 或以下。

要安装适用于 Python 2 的 `confluent-kafka` 版本，可以使用以下命令：

```bash
pip install "confluent-kafka<=1.4"
```

### Python 生产者示例



在 Python 中，我们可以使用 `confluent_kafka` 库来创建生产者。以下是一个简单的生产者代码示例：

```python
# -*- coding: utf-8 -*-
import json
from confluent_kafka import Producer

# Kafka 配置
conf = {
    'bootstrap.servers': 'localhost:9092'  # Kafka 服务器地址
}

# 创建 Kafka 生产者
producer = Producer(conf)

# 主题名称
topic = "my_json_topic"

# JSON 消息
messages = [
    {"id": 1, "name": "Alice", "age": 25},
    {"id": 2, "name": "Bob", "age": 30},
    {"id": 3, "name": "Charlie", "age": 22}
]

# 发送 JSON 数据
def delivery_report(err, msg):
    if err is not None:
        print('Message delivery failed: {}'.format(err))
    else:
        print('Message delivered to {} [{}]'.format(msg.topic(), msg.partition()))

for msg in messages:
    msg_json = json.dumps(msg)  # 转换为 JSON 字符串
    producer.produce(topic, msg_json.encode('utf-8'), callback=delivery_report)  # 发送数据并添加回调
    print("Sent:", msg_json)

# 刷新缓冲区，确保消息发送出去
producer.flush()

print('All messages sent.')
```

主要说明：

- **生产者配置**：我们通过设置 `bootstrap.servers` 指定 Kafka 的地址。
- **发送 JSON 数据**：使用 `json.dumps` 将字典转换为 JSON 格式的字符串，并使用 `produce` 方法发送消息。为了确保消息成功发送，我们在 `produce` 方法中使用了一个回调函数 `delivery_report`，它会在消息送达后进行确认。
- **刷新缓冲区**：`flush` 方法用于确保所有消息都被发送出去。

## 消费者

Kafka 中的消费者（Consumer）负责从 Kafka 中获取消息，通常消费者以消费组（Consumer Group）的方式进行工作。消费者组中的消费者会共享分区，确保每个分区只有一个消费者进行消费。

### Python 消费者示例

以下是一个使用 `confluent_kafka` 库编写的消费者示例：

```python
# -*- coding: utf-8 -*-
from confluent_kafka import Consumer, KafkaError
import json

# Kafka 配置
conf = {
    'bootstrap.servers': 'localhost:9092',  # Kafka 服务器地址
    'group.id': 'my_consumer_group',        # 消费者组 ID
    'auto.offset.reset': 'earliest'         # 从最早的消息开始消费
}

# 创建 Kafka 消费者
consumer = Consumer(conf)

# 订阅 Topic
topic = "my_json_topic"
consumer.subscribe([topic])

print("Listening for messages on topic:", topic)

try:
    while True:
        msg = consumer.poll(timeout=1.0)  # 轮询 Kafka，超时时间 1 秒
        if msg is None:
            continue  # 没有消息则继续轮询
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue  # 分区读取完毕，继续下一条
            else:
                print("Error:", msg.error())
                break

        # 解码 JSON 消息
        message_value = msg.value().decode('utf-8')
        try:
            message_data = json.loads(message_value)  # 解析 JSON
            print("Received JSON message:", message_data)
        except ValueError:
            print("Received non-JSON message:", message_value)

except KeyboardInterrupt:
    print("\nStopping consumer...")
finally:
    consumer.close()  # 关闭消费者
```

主要说明：

- **消费者配置**：配置项包括 `bootstrap.servers`（Kafka 地址），`group.id`（消费者组 ID），`auto.offset.reset`（设置消费者从哪里开始消费，`earliest` 表示从最早的消息开始）。
- **消息处理**：使用 `poll` 方法轮询 Kafka，`timeout` 设置了超时时间，确保消费者在没有消息时会等待一段时间。
- **异常处理**：使用 `try-except` 来捕获并处理可能发生的异常，包括解析 JSON 时可能出现的错误。

## 实战

下面是一个实际运行的服务，用于启动一个消费者将原始数据处理后推送到另一个平台。

```python
# -*- coding:utf-8 -*-
# @Author: 
# @Time  : 
# @Desc  :
# @args  :
# @name  : kafka_event_server
# @cron  :
import json
import sys
import signal
import logging

import requests
from confluent_kafka import Consumer, KafkaError

if sys.version_info[0] == 2:
    from imp import reload

    reload(sys)
    sys.setdefaultencoding('utf8')

FORMAT = '[%(asctime)s (line:%(lineno)d) %(levelname)s] %(message)s'
logging.basicConfig(level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S', format=FORMAT,
                    filename='server.log')
logger = logging.getLogger(__name__)
logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)


class KafkaConsumer:
    def __init__(self, servers, topic, push_url, group_id='omp', offset='latest'):
        self.servers = servers
        self.topic = topic
        self.push_url = push_url
        self.group_id = group_id
        self.offset = offset
        self.conf = {
            'bootstrap.servers': self.servers,
            'group.id': self.group_id,
            'auto.offset.reset': self.offset
        }

    def run(self):
        consumer = Consumer(self.conf)
        consumer.subscribe([self.topic])

        # 捕获 SIGTERM 信号并优雅退出
        def signal_handler(sig, frame):
            logger.error('Received SIGTERM, closing consumer...')
            consumer.close()  # 关闭消费者
            sys.exit(0)  # 正常退出

        # 注册信号处理函数
        signal.signal(signal.SIGTERM, signal_handler)

        try:
            while True:
                msg = consumer.poll(timeout=1.0)  # 轮询 Kafka，超时时间 1 秒
                if msg is None:
                    continue  # 没有消息则继续轮询
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue  # 分区读取完毕，继续下一条
                    else:
                        logger.error("Error: %s", msg.error())
                        break
                # 解码 JSON 消息
                message_value = msg.value().decode('utf-8')
                try:
                    message_data = json.loads(message_value)  # 解析 JSON
                    logger.info("Received JSON message: %s", message_data['df_event_id'])
                    self.monitor_to_event(message_data)
                except ValueError:
                    logger.error("Received non-JSON message: %s", message_value)

        except KeyboardInterrupt:
            logger.error("Stopping consumer...")
        finally:
            consumer.close()  # 关闭消费者

    @staticmethod
    def check_fields(data):
        """
        检查字段是否合法
        :param data: 需要检查的字典
        :return: 合法返回 True，不合法返回 False
        """
        # 必须包含的字段列表
        required_fields = ["df_event_id", "df_source", "df_title", "df_message", "date",
                           "df_status", "df_workspace_name"]

        # 检查 data 是否是字典类型
        if not isinstance(data, dict):
            return False

        # 检查必填字段是否有值（值不能为空或 None）
        for field in required_fields:
            if not data.get(field):
                return False

        # 检查 df_source 字段的值是否为 "monitor"
        if data.get("df_source") != "monitor":
            return False

        return True

    @staticmethod
    def clean_data(data):
        """
        清洗数据，数据转换
        :param data:
        :return:
        """
        # 维度合并
        """
        df_workspace_name：系统简称
        service: 服务
        host：主机名
        host_ip:主机IP
        instance_name: 实例名称
        cluster_name_k8s：k8s集群名称
        container_host/pod_name：pod名称
        """
        alert_dims = {'df_workspace_name': data['df_workspace_name']}
        tags = {}
        if data.get('df_dimension_tags'):
            try:
                tags = json.loads(data['df_dimension_tags'])
            except Exception:
                tags = {}
        alert_dims.update(tags)

        # 状态，判断是否恢复
        if data['df_status'] == 'ok':
            event_status = True
        else:
            event_status = False

        clean_data = {
            "alertId": data['df_event_id'],
            "alertDims": alert_dims,
            "metricName": "",
            "value": "",
            "metricUnit": "",
            "subject": data['df_title'],
            "content": data['df_message'],
            "time": int(data['date'] / 1000),
            "isRecover": event_status,
            "extInfo": {"df_status": data['df_status']},
            "originInfo": {},
            "source": "guance"
        }

        return clean_data

    def push_event(self, data):
        logger.debug(data)
        resp = requests.post(self.push_url, json=data)
        if resp.status_code == 200 and resp.json()['code'] == 0:
            logger.info('推送事件成功：%s', data['alertId'])
        elif resp.status_code == 400 and 'not match any cmdb instance' in resp.json()['error']:
            logger.warning('没有匹配到任何实例：%s', data['alertDims'])
        else:
            logger.error('推送事件失败，请求：%s，返回：%s', data, resp.text)

    def monitor_to_event(self, data):
        # 校验
        check_ok = self.check_fields(data)
        if not check_ok:
            logger.warning('数据字段校验不通过：%s', data)
            return

        # 清洗
        try:
            clean_data = self.clean_data(data)
        except Exception as e:
            logger.error('数据转换错误: %s', e)
            return

        # 推送
        try:
            self.push_event(clean_data)
        except Exception as e:
            logger.error('推送告警事件错误, 数据: %s, 错误：%s', clean_data, e)
            return


def main():
    KFK.run()


if __name__ == "__main__":
    Webhook = 'https://xx.xxx.xx'
    KFK = KafkaConsumer('xx.xx.xx.xx:9094', 'event', Webhook)

    main()

```

系统服务配置：

```ini
[Unit]
Description=Kafka Consumer Service
After=network.target

[Service]
WorkingDirectory=/opt/kafka_event
ExecStart=/xxx/bin/python /opt/kafka_event/kafka_event_server.py
Restart=on-failure
TimeoutStopSec=30s
KillSignal=SIGTERM
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target

```

重点关注：

- 异常处理，保证服务正常
- 退出的机制，保证退出前释放资源
- 服务运行方式，使用系统服务来管理

## Kafka 的基本概念

了解 Kafka 的基本概念对于高效使用 Kafka 非常重要。以下是一些常见的概念：

1. **Broker**：Kafka 集群中的每个服务器称为一个 Broker，负责管理和存储消息。
2. **Topic**：Kafka 中的主题，用于将消息进行分类，消费者根据主题来消费数据。
3. **Partition**：主题可以分为多个分区，分区是 Kafka 的基本单元，用于实现数据的并行处理。
4. **Producer**：生产者负责将消息写入 Kafka 的主题。
5. **Consumer**：消费者从 Kafka 中订阅主题并消费消息。消费者通常属于某个消费者组。
6. **Consumer Group**：多个消费者组成一个消费者组，每个消费者只消费属于它的分区。
7. **Offset**：每条消息在 Kafka 中都有一个唯一的偏移量，消费者使用偏移量来追踪已消费的消息。

## 常用操作

在使用 Kafka 时，常用的操作包括：

1、 **查看主题信息**：

```bash
./kafka-topics.sh --describe --topic my_json_topic --bootstrap-server localhost:9092
```

2、**删除主题**：

```bash
./kafka-topics.sh --delete --topic my_json_topic --bootstrap-server localhost:9092
```

3、**查看消费者组信息**：

```bash
./kafka-consumer-groups.sh --describe --group my_consumer_group --bootstrap-server localhost:9092
```

4、**查看消息内容**（用于调试）：

```bash
./kafka-console-consumer.sh --topic my_json_topic --bootstrap-server localhost:9092 --from-beginning
```

5、**配置消费者的消费模式**：

可以通过设置 `auto.offset.reset` 来指定消费模式，如从最早的消息 (`earliest`)，或者从最新的消息 (`latest`)。

更多消费模式及其适用场景：

| 消费模式         | 含义                                                         | 适用场景                                           |
|------------------|------------------------------------------------------------|--------------------------------------------------|
| **earliest**     | 从主题的 **最早消息** 开始消费，通常用于重新消费整个历史数据            | 需要消费历史消息，或者新消费者需要从头开始消费时                      |
| **latest**       | 从主题的 **最新消息** 开始消费，跳过已经消费的消息                   | 只关心实时数据流，不需要消费历史数据                         |
| **none**         | 如果没有提交过偏移量，则抛出异常，要求必须有偏移量记录                | 严格要求消费者有消费进度偏移量，确保从一个有效的偏移量开始消费       |
| **手动控制**     | 通过 `seek()` 方法手动控制从哪个偏移量开始消费，适用于精确控制消费位置 | 需要精确控制从某个特定位置开始消费，比如回溯处理，或者特定日志消费场景 |


6、**查看 Kafka 集群状态**：

```bash
./kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

## 参考文章

- [Kafka基本原理详解（超详细！）](https://blog.csdn.net/weixin_45366499/article/details/106943229 "Kafka基本原理详解（超详细！）")
- [学习 Kafka 入门知识看这一篇就够了！（万字长文）](https://cloud.tencent.com/developer/article/1547380 "学习 Kafka 入门知识看这一篇就够了！（万字长文）")