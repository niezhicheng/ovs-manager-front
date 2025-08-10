import Layout from '@/layout/content'
import { createRouter, createWebHashHistory } from "vue-router"

export const routes = [
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    meta: { title: 'OVS 管理', icon: 'icon-apps' },
    children: [
      {
        name: 'ovs-bridge',
        path: 'bridge',
        component: () => import('@/views/ovs/bridge.vue'),
        meta: { title: '交换机管理' }
      },
      {
        name: 'ovs-port',
        path: 'port',
        component: () => import('@/views/ovs/port.vue'),
        meta: { title: '端口管理' }
      },
      {
        name: 'ovs-patch-port',
        path: 'patch-port',
        component: () => import('@/views/ovs/patch-port.vue'),
        meta: { title: 'Patch端口管理' }
      },
      {
        name: 'ovs-flow',
        path: 'flow',
        component: () => import('@/views/ovs/flow.vue'),
        meta: { title: '流表规则' }
      },
      {
        name: 'ovs-vxlan',
        path: 'vxlan',
        component: () => import('@/views/ovs/vxlan.vue'),
        meta: { title: 'VXLAN 管理' }
      },
      {
        name: 'ovs-bond',
        path: 'bond',
        component: () => import('@/views/ovs/bond.vue'),
        meta: { title: 'Bond 管理' }
      },
      {
        name: 'ovs-scenario',
        path: 'scenario',
        component: () => import('@/views/ovs/scenario.vue'),
        meta: { title: '场景引导' }
      },
      {
        name: 'ovs-netns',
        path: 'netns',
        component: () => import('@/views/ovs/netns.vue'),
        meta: { title: '网络命名空间' }
      },
      {
        name: 'ovs-database',
        path: 'database',
        component: () => import('@/views/ovs/database.vue'),
        meta: { title: '数据库管理' }
      },
      {
        name: 'ovs-statistics',
        path: 'statistics',
        component: () => import('@/views/ovs/statistics.vue'),
        meta: { title: '统计信息' }
      },
      {
        name: 'ovs-controller',
        path: 'controller',
        component: () => import('@/views/ovs/controller.vue'),
        meta: { title: '控制器管理' }
      },
      {
        name: 'ovs-qos',
        path: 'qos',
        component: () => import('@/views/ovs/qos.vue'),
        meta: { title: 'QoS管理' }
      },
      {
        name: 'ovs-mirror',
        path: 'mirror',
        component: () => import('@/views/ovs/mirror.vue'),
        meta: { title: '镜像管理' }
      },
      {
        name: 'ovs-group',
        path: 'group',
        component: () => import('@/views/ovs/group.vue'),
        meta: { title: '组表管理' }
      }
    ]
  },
  {
    path: '/scenario',
    component: Layout,
    meta: { title: '场景配置', icon: 'icon-apps' },
    children: [
      {
        name: 'scenario-basic-network',
        path: 'basic-network',
        component: () => import('@/views/scenarios/basic-network.vue'),
        meta: { title: '基础网络配置' }
      },
      {
        name: 'scenario-vxlan-tunnel',
        path: 'vxlan-tunnel',
        component: () => import('@/views/scenarios/vxlan-tunnel.vue'),
        meta: { title: 'VXLAN 隧道配置' }
      },
      {
        name: 'scenario-load-balance',
        path: 'load-balance',
        component: () => import('@/views/scenarios/load-balance.vue'),
        meta: { title: '负载均衡配置' }
      },
      {
        name: 'scenario-flow-rules',
        path: 'flow-rules',
        component: () => import('@/views/scenarios/flow-rules.vue'),
        meta: { title: '流表规则配置' }
      },
      {
        name: 'scenario-network-namespace',
        path: 'network-namespace',
        component: () => import('@/views/scenarios/network-namespace.vue'),
        meta: { title: '网络命名空间隔离' }
      },
      {
        name: 'scenario-livekit-proctor',
        path: 'livekit-proctor',
        component: () => import('@/views/scenarios/livekit-proctor.vue'),
        meta: { title: 'LiveKit 监考系统' }
      },
      {
        name: 'scenario-patch-port',
        path: 'patch-port',
        component: () => import('@/views/scenarios/patch-port.vue'),
        meta: { title: 'Patch 端口连接' }
      },
      {
        name: 'scenario-qos-traffic-control',
        path: 'qos-traffic-control',
        component: () => import('@/views/scenarios/qos-traffic-control.vue'),
        meta: { title: 'QoS 流量控制' }
      },
      {
        name: 'scenario-port-mirroring',
        path: 'port-mirroring',
        component: () => import('@/views/scenarios/port-mirroring.vue'),
        meta: { title: '端口镜像配置' }
      },
      {
        name: 'scenario-vlan-isolation',
        path: 'vlan-isolation',
        component: () => import('@/views/scenarios/vlan-isolation.vue'),
        meta: { title: 'VLAN 隔离配置' }
      },
      {
        name: 'scenario-container-network',
        path: 'container-network',
        component: () => import('@/views/scenarios/container-network.vue'),
        meta: { title: '容器网络配置' }
      },
      {
        name: 'scenario-security-policy',
        path: 'security-policy',
        component: () => import('@/views/scenarios/security-policy.vue'),
        meta: { title: '安全策略配置' }
      },
      {
        name: 'scenario-network-monitoring',
        path: 'network-monitoring',
        component: () => import('@/views/scenarios/network-monitoring.vue'),
        meta: { title: '网络监控配置' }
      },
      {
        name: 'scenario-link-aggregation',
        path: 'link-aggregation',
        component: () => import('@/views/scenarios/link-aggregation.vue'),
        meta: { title: '链路聚合配置' }
      },
      {
        name: 'scenario-multi-tenant-network',
        path: 'multi-tenant-network',
        component: () => import('@/views/scenarios/multi-tenant-network.vue'),
        meta: { title: '多租户网络配置' }
      },
      {
        name: 'scenario-network-troubleshooting',
        path: 'network-troubleshooting',
        component: () => import('@/views/scenarios/network-troubleshooting.vue'),
        meta: { title: '网络故障诊断' }
      },
      {
        name: 'scenario-sdn-controller',
        path: 'sdn-controller',
        component: () => import('@/views/scenarios/sdn-controller.vue'),
        meta: { title: 'SDN控制器配置' }
      },
      {
        name: 'scenario-network-automation',
        path: 'network-automation',
        component: () => import('@/views/scenarios/network-automation.vue'),
        meta: { title: '网络自动化配置' }
      },
      {
        name: 'scenario-kubernetes-network',
        path: 'kubernetes-network',
        component: () => import('@/views/scenarios/kubernetes-network.vue'),
        meta: { title: 'Kubernetes网络配置' }
      },
      {
        name: 'scenario-edge-computing',
        path: 'edge-computing',
        component: () => import('@/views/scenarios/edge-computing.vue'),
        meta: { title: '边缘计算网络配置' }
      },
      {
        name: 'scenario-network-slicing',
        path: 'network-slicing',
        component: () => import('@/views/scenarios/network-slicing.vue'),
        meta: { title: '网络切片配置' }
      },
      {
        name: 'scenario-ai-network',
        path: 'ai-network',
        component: () => import('@/views/scenarios/ai-network.vue'),
        meta: { title: 'AI网络配置' }
      },
      {
        name: 'scenario-blockchain-network',
        path: 'blockchain-network',
        component: () => import('@/views/scenarios/blockchain-network.vue'),
        meta: { title: '区块链网络配置' }
      },
      {
        name: 'scenario-iot-network',
        path: 'iot-network',
        component: () => import('@/views/scenarios/iot-network.vue'),
        meta: { title: '物联网网络配置' }
      }
      ]
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/404',
    hidden: true
  }
]

const buildRouter = () => createRouter({
  history: createWebHashHistory(),
  routes
})

const router = buildRouter()

export default router
