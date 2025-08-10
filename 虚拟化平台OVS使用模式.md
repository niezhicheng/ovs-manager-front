# 虚拟化平台中OVS的使用模式

## 🎯 概述

在虚拟化平台中，OVS主要作为**虚拟交换机**使用，为虚拟机提供网络连接。OVS本身不直接配置IP地址，而是通过其端口来提供网络服务。

## 🏗️ 典型架构

```
物理网络
    ↓
物理网卡 (eth0) - 无IP配置
    ↓
OVS网桥 (br0) - 可选IP配置
    ↓
├── 内部端口 (internal) - 有IP配置
├── 虚拟机端口 (tap) - 虚拟机内部配置IP
└── 隧道端口 (vxlan/geneve) - 配置隧道参数
```

## 📋 端口类型和IP配置

### 1. 物理端口 (Physical Ports)

**特点**:
- **类型**: `system` 或 `normal`
- **IP配置**: **通常不配置IP**
- **作用**: 数据通道，连接物理网络

**示例**:
```bash
# 添加物理网卡到OVS网桥
ovs-vsctl add-port br0 eth0

# 物理网卡不配置IP，只作为数据通道
# ip addr show eth0  # 通常显示无IP配置
```

### 2. 内部端口 (Internal Ports)

**特点**:
- **类型**: `internal`
- **IP配置**: **会配置IP地址**
- **作用**: 为网桥或服务提供网络接口

**示例**:
```bash
# 创建内部端口
ovs-vsctl add-port br0 internal0 -- set interface internal0 type=internal

# 配置IP地址
ip addr add 192.168.1.1/24 dev internal0
ip link set internal0 up
```

### 3. 虚拟机端口 (VM Ports)

**特点**:
- **类型**: `tap` 或 `veth`
- **IP配置**: **虚拟机内部配置IP**
- **作用**: 连接虚拟机到虚拟网络

**示例**:
```bash
# 创建虚拟机端口
ovs-vsctl add-port br0 vm1 -- set interface vm1 type=internal

# 虚拟机内部配置IP (在虚拟机中执行)
# ip addr add 192.168.1.10/24 dev eth0
```

### 4. 隧道端口 (Tunnel Ports)

**特点**:
- **类型**: `vxlan`, `geneve`, `gre`
- **IP配置**: 配置隧道参数，不直接配置IP
- **作用**: 跨网络连接

**示例**:
```bash
# 创建VXLAN隧道端口
ovs-vsctl add-port br0 vxlan0 -- set interface vxlan0 type=vxlan \
    options:remote_ip=192.168.1.100 options:key=1000
```

## 🎨 实际应用场景

### 场景1: 基础虚拟化网络

```bash
# 1. 创建网桥
ovs-vsctl add-br br0

# 2. 添加物理端口 (无IP)
ovs-vsctl add-port br0 eth0

# 3. 添加内部端口 (有IP)
ovs-vsctl add-port br0 internal0 -- set interface internal0 type=internal
ip addr add 192.168.1.1/24 dev internal0

# 4. 添加虚拟机端口 (虚拟机内部配置IP)
ovs-vsctl add-port br0 vm1 -- set interface vm1 type=internal
# 虚拟机内部: ip addr add 192.168.1.10/24 dev eth0
```

### 场景2: 多租户网络

```bash
# 1. 创建租户网桥
ovs-vsctl add-br tenant1-br
ovs-vsctl add-br tenant2-br

# 2. 创建租户内部端口 (有IP)
ovs-vsctl add-port tenant1-br tenant1-gw -- set interface tenant1-gw type=internal
ip addr add 192.168.10.1/24 dev tenant1-gw

ovs-vsctl add-port tenant2-br tenant2-gw -- set interface tenant2-gw type=internal
ip addr add 192.168.20.1/24 dev tenant2-gw

# 3. 添加虚拟机端口 (虚拟机内部配置IP)
ovs-vsctl add-port tenant1-br vm1 -- set interface vm1 type=internal
# 虚拟机1内部: ip addr add 192.168.10.10/24 dev eth0

ovs-vsctl add-port tenant2-br vm2 -- set interface vm2 type=internal
# 虚拟机2内部: ip addr add 192.168.20.10/24 dev eth0
```

### 场景3: 云网络

```bash
# 1. 创建云网络网桥
ovs-vsctl add-br cloud-br

# 2. 添加物理上行链路 (无IP)
ovs-vsctl add-port cloud-br eth0

# 3. 添加内部网关端口 (有IP)
ovs-vsctl add-port cloud-br gateway -- set interface gateway type=internal
ip addr add 10.0.0.1/24 dev gateway

# 4. 添加虚拟机端口 (虚拟机内部配置IP)
ovs-vsctl add-port cloud-br vm1 -- set interface vm1 type=internal
# 虚拟机内部: ip addr add 10.0.0.10/24 dev eth0

# 5. 添加隧道端口 (配置隧道参数)
ovs-vsctl add-port cloud-br vxlan0 -- set interface vxlan0 type=vxlan \
    options:remote_ip=192.168.1.100 options:key=1000
```

## 🔍 IP配置总结

| 端口类型 | 是否配置IP | 配置位置 | 用途 |
|---------|-----------|---------|------|
| 物理端口 | ❌ 否 | - | 数据通道 |
| 内部端口 | ✅ 是 | 主机 | 网关/服务 |
| 虚拟机端口 | ✅ 是 | 虚拟机内部 | 虚拟机网络 |
| 隧道端口 | ❌ 否 | 隧道参数 | 跨网络连接 |

## 🎯 关键要点

1. **OVS网桥本身**通常不配置IP，除非需要作为网关
2. **物理端口**不配置IP，只作为数据通道
3. **内部端口**会配置IP，用于网关或服务
4. **虚拟机端口**的IP在虚拟机内部配置
5. **隧道端口**配置隧道参数，不直接配置IP

## 🚀 最佳实践

1. **网络隔离**: 使用VLAN或隧道实现网络隔离
2. **网关配置**: 使用内部端口作为网关
3. **IP管理**: 统一管理虚拟机IP地址分配
4. **监控**: 监控端口状态和流量统计
5. **备份**: 定期备份OVS配置 