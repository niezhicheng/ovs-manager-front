<template>
  <a-card title="场景引导" class="scenario-card">
    <div class="scenario-grid">
      <a-card
        v-for="scenario in scenarios"
        :key="scenario.id"
        class="scenario-item"
        hoverable
        @click="navigateToScenario(scenario.path)"
        :title="scenario.title"
      >
        <div class="scenario-desc">{{ scenario.description }}</div>
      </a-card>
    </div>
  </a-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const scenarios = [
  {
    id: 1,
    title: '基础网络配置',
    description: '配置基本的网络连接和交换机设置',
    path: '/scenario/basic-network',
  },
  {
    id: 2,
    title: 'VXLAN 隧道配置',
    description: '设置 VXLAN 隧道进行网络隔离',
    path: '/scenario/vxlan-tunnel',
  },
  {
    id: 3,
    title: '负载均衡配置',
    description: '配置 Bond 接口实现负载均衡',
    path: '/scenario/load-balance',
  },
  {
    id: 4,
    title: '流表规则配置',
    description: '配置 OpenFlow 流表规则',
    path: '/scenario/flow-rules',
  },
  {
    id: 5,
    title: '网络命名空间隔离',
    description: '创建和管理网络命名空间进行隔离',
    path: '/scenario/network-namespace',
  },
  {
    id: 7,
    title: 'Patch 端口连接',
    description: '配置网桥间的 Patch 端口连接',
    path: '/scenario/patch-port',
  },
  {
    id: 8,
    title: 'QoS 流量控制',
    description: '配置服务质量控制和带宽管理',
    path: '/scenario/qos-traffic-control',
  },
  {
    id: 9,
    title: '端口镜像配置',
    description: '配置端口镜像进行流量监控',
    path: '/scenario/port-mirroring',
  },
  {
    id: 10,
    title: 'VLAN 隔离配置',
    description: '配置VLAN实现网络隔离',
    path: '/scenario/vlan-isolation',
  },
  {
    id: 11,
    title: '容器网络配置',
    description: '配置Docker/K8s容器网络',
    path: '/scenario/container-network',
  },
  {
    id: 12,
    title: '安全策略配置',
    description: '配置网络安全策略和访问控制',
    path: '/scenario/security-policy',
  },
  {
    id: 13,
    title: '网络监控配置',
    description: '配置NetFlow/sFlow网络监控',
    path: '/scenario/network-monitoring',
  },
  {
    id: 14,
    title: '链路聚合配置',
    description: '配置LACP链路聚合实现高可用',
    path: '/scenario/link-aggregation',
  },
  {
    id: 15,
    title: '多租户网络配置',
    description: '配置多租户网络隔离和资源共享',
    path: '/scenario/multi-tenant-network',
  },
  {
    id: 16,
    title: '网络故障诊断',
    description: '自动化网络故障排查和诊断',
    path: '/scenario/network-troubleshooting',
  },
  {
    id: 17,
    title: 'SDN控制器配置',
    description: '配置SDN控制器和OpenFlow交换机',
    path: '/scenario/sdn-controller',
  },
  {
    id: 18,
    title: '网络自动化配置',
    description: '配置网络自动化部署和管理',
    path: '/scenario/network-automation',
  },
  {
    id: 19,
    title: 'Kubernetes网络配置',
    description: '配置K8s网络插件和服务网格',
    path: '/scenario/kubernetes-network',
  },
  {
    id: 20,
    title: '边缘计算网络配置',
    description: '配置边缘计算节点和网络',
    path: '/scenario/edge-computing',
  },
  {
    id: 21,
    title: '网络切片配置',
    description: '配置5G网络切片和QoS策略',
    path: '/scenario/network-slicing',
  },
  {
    id: 22,
    title: 'AI网络配置',
    description: '配置AI训练和推理网络优化',
    path: '/scenario/ai-network',
  },
  {
    id: 23,
    title: '区块链网络配置',
    description: '配置区块链网络和智能合约',
    path: '/scenario/blockchain-network',
  },
  {
    id: 24,
    title: '物联网网络配置',
    description: '配置IoT设备和数据采集网络',
    path: '/scenario/iot-network',
  }
]
const navigateToScenario = (path) => {
  router.push(path)
}
</script>

<style scoped>
.scenario-card {
  min-height: 80vh;
}
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-top: 24px;
}
.scenario-item {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  border: 1px solid #f0f0f0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.scenario-item:hover {
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
  transform: translateY(-4px);
}
.scenario-desc {
  color: #888;
  margin-top: 8px;
  font-size: 14px;
}
</style>
