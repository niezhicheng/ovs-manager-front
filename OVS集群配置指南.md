# OVS集群配置指南

## 🎯 集群架构概述

OVS集群主要通过以下几种方式实现：

### 1. 控制器集群模式
- **主备控制器**: 一个主控制器，多个备用控制器
- **负载均衡控制器**: 多个控制器分担负载
- **分布式控制器**: 控制器间数据同步

### 2. 数据库集群模式
- **主从复制**: OVSDB主从复制
- **分布式数据库**: 使用分布式数据库存储配置

### 3. 网桥集群模式
- **网桥聚合**: 多个网桥组成逻辑集群
- **跨网桥通信**: 网桥间通过隧道或直连通信

## 🔧 详细配置方案

### 方案一：控制器集群 (推荐)

#### 1.1 主备控制器配置

```bash
# 主控制器配置
ovs-vsctl set-controller br0 tcp:192.168.1.100:6633
ovs-vsctl set-controller br0 tcp:192.168.1.101:6633

# 设置控制器优先级
ovs-vsctl set-controller br0 tcp:192.168.1.100:6633 tcp:192.168.1.101:6633

# 查看控制器状态
ovs-vsctl show
```

#### 1.2 负载均衡控制器配置

```bash
# 配置多个控制器实现负载均衡
ovs-vsctl set-controller br0 tcp:192.168.1.100:6633 tcp:192.168.1.101:6633 tcp:192.168.1.102:6633

# 设置控制器连接模式
ovs-vsctl set bridge br0 controller-mode=in-band
ovs-vsctl set bridge br0 fail-mode=standalone
```

#### 1.3 控制器高可用配置

```bash
# 配置控制器故障转移
ovs-vsctl set-controller br0 tcp:192.168.1.100:6633 tcp:192.168.1.101:6633
ovs-vsctl set bridge br0 fail-mode=standalone

# 设置重连参数
ovs-vsctl set bridge br0 other-config:controller-max-backoff=8000
ovs-vsctl set bridge br0 other-config:controller-inactivity-probe=10000
```

### 方案二：数据库集群

#### 2.1 OVSDB主从复制

```bash
# 主数据库配置
ovsdb-server --remote=punix:/var/run/openvswitch/db.sock \
             --remote=db:Open_vSwitch,Open_vSwitch,manager_options \
             --private-key=db:Open_vSwitch,SSL,private_key \
             --certificate=db:Open_vSwitch,SSL,certificate \
             --bootstrap-ca-cert=db:Open_vSwitch,SSL,ca_cert \
             --log-file=/var/log/openvswitch/ovsdb-server.log

# 从数据库配置
ovsdb-server --remote=punix:/var/run/openvswitch/db.sock \
             --remote=db:Open_vSwitch,Open_vSwitch,manager_options \
             --private-key=db:Open_vSwitch,SSL,private_key \
             --certificate=db:Open_vSwitch,SSL,certificate \
             --bootstrap-ca-cert=db:Open_vSwitch,SSL,ca_cert \
             --log-file=/var/log/openvswitch/ovsdb-server.log \
             --sync-from=tcp:192.168.1.100:6640
```

#### 2.2 数据库备份和恢复

```bash
# 备份数据库
ovsdb-tool backup /var/lib/openvswitch/ovs.db /backup/ovs.db.backup

# 恢复数据库
ovsdb-tool restore /var/lib/openvswitch/ovs.db /backup/ovs.db.backup

# 数据库一致性检查
ovsdb-tool check /var/lib/openvswitch/ovs.db
```

### 方案三：网桥集群

#### 3.1 网桥聚合配置

```bash
# 创建聚合网桥
ovs-vsctl add-br cluster-br0
ovs-vsctl add-br cluster-br1

# 配置网桥间连接
ovs-vsctl add-port cluster-br0 patch0 -- set interface patch0 type=patch options:peer=patch1
ovs-vsctl add-port cluster-br1 patch1 -- set interface patch1 type=patch options:peer=patch0

# 配置网桥协议
ovs-vsctl set bridge cluster-br0 protocols=OpenFlow13
ovs-vsctl set bridge cluster-br1 protocols=OpenFlow13
```

#### 3.2 跨网桥通信配置

```bash
# 配置VXLAN隧道连接
ovs-vsctl add-port cluster-br0 vxlan0 -- set interface vxlan0 type=vxlan options:remote_ip=192.168.1.101 options:key=100

# 配置GRE隧道连接
ovs-vsctl add-port cluster-br0 gre0 -- set interface gre0 type=gre options:remote_ip=192.168.1.101 options:key=100
```

## 🚀 高可用配置

### 1. 故障检测和恢复

```bash
# 配置故障检测
ovs-vsctl set bridge br0 other-config:controller-max-backoff=8000
ovs-vsctl set bridge br0 other-config:controller-inactivity-probe=10000

# 配置自动重连
ovs-vsctl set bridge br0 fail-mode=standalone
ovs-vsctl set bridge br0 other-config:disable-in-band=true
```

### 2. 负载均衡配置

```bash
# 配置负载均衡
ovs-vsctl set port bond0 bond_mode=balance-slb
ovs-vsctl set port bond0 lacp=active

# 配置LACP参数
ovs-vsctl set port bond0 other-config:lacp-priority=32768
ovs-vsctl set port bond0 other-config:lacp-time=fast
```

### 3. 监控和告警

```bash
# 配置监控脚本
#!/bin/bash
# 检查控制器连接状态
controller_status=$(ovs-vsctl show | grep -c "is_connected: true")
if [ $controller_status -eq 0 ]; then
    echo "Controller disconnected at $(date)" >> /var/log/ovs-cluster.log
    # 发送告警
    curl -X POST http://alert-server/api/alert -d "OVS controller disconnected"
fi
```

## 📊 集群监控

### 1. 状态监控

```bash
# 监控控制器状态
ovs-vsctl show | grep -A 5 "Controller"

# 监控网桥状态
ovs-vsctl show | grep -A 10 "Bridge"

# 监控端口状态
ovs-ofctl show br0 | grep -E "(port|state)"
```

### 2. 性能监控

```bash
# 监控流表统计
ovs-ofctl dump-flows br0 | wc -l

# 监控端口统计
ovs-ofctl dump-ports br0

# 监控队列统计
ovs-vsctl list queue
```

## 🔒 安全配置

### 1. 控制器认证

```bash
# 配置SSL证书
ovs-vsctl set-ssl /path/to/private.key /path/to/certificate.crt /path/to/ca.crt

# 配置控制器认证
ovs-vsctl set-controller br0 ssl:192.168.1.100:6633
```

### 2. 访问控制

```bash
# 配置访问控制列表
ovs-vsctl set bridge br0 other-config:disable-in-band=true

# 配置防火墙规则
iptables -A INPUT -p tcp --dport 6633 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 6640 -s 192.168.1.0/24 -j ACCEPT
```

## 🎯 最佳实践

### 1. 网络设计

- 使用专用网络连接控制器和交换机
- 配置冗余链路和路径
- 实现网络分段和隔离

### 2. 性能优化

- 合理配置流表大小
- 优化控制器连接参数
- 监控系统资源使用

### 3. 运维管理

- 定期备份配置
- 监控系统状态
- 制定故障恢复预案

## ⚠️ 注意事项

1. **协议版本兼容性**: 确保控制器和交换机使用兼容的OpenFlow版本
2. **网络稳定性**: 控制器间通信网络要稳定可靠
3. **资源规划**: 合理规划系统资源，避免性能瓶颈
4. **安全考虑**: 实施适当的安全措施，保护集群安全
5. **监控告警**: 建立完善的监控和告警机制

## 🔗 相关资源

- [OVS官方文档](https://docs.openvswitch.org/)
- [OpenFlow协议规范](https://opennetworking.org/sdn-resources/technical-library/specifications/)
- [SDN控制器对比](https://www.sdxcentral.com/sdn/controllers/) 