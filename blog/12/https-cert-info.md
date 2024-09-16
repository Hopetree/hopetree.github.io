# HTTPS证书过期时间获取

## 脚本内容

创建脚本 cert_check.sh，内容如下：

```bash
#!/bin/bash

# 填写需要监控的域名和端口号
domain="${1:-www.baidu.com}"
port="${2:-443}"

# 获取证书信息
cert_info=$(echo | openssl s_client -servername $domain -connect $domain:$port 2>/dev/null | openssl x509 -noout -dates)

# 提取证书有效期的起止日期
start_date=$(echo "$cert_info" | grep -i "notBefore" | awk -F '=' '{print $2}')
end_date=$(echo "$cert_info" | grep -i "notAfter" | awk -F '=' '{print $2}')

# 将日期转换为时间戳
start_timestamp=$(date -d "$start_date" +%s)
end_timestamp=$(date -d "$end_date" +%s)
current_timestamp=$(date +%s)

# 计算剩余天数
remaining_days=$(( ($end_timestamp - $current_timestamp) / 86400 ))

# 打印证书有效期信息
echo "域名: $domain"
echo "起始日期: $start_date"
echo "结束日期: $end_date"
echo "剩余天数: $remaining_days"
```

## 使用效果

执行脚本，并输入域名和端口参数：

```bash
[root@zero-1 tmp]# sh cert_check.sh tendcode.com 443
域名: tendcode.com
起始日期: Jun  8 00:00:00 2023 GMT
结束日期: Jun  7 23:59:59 2024 GMT
剩余天数: 193
```