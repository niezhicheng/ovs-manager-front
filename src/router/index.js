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
        name: 'ovs-mirror',
        path: 'mirror',
        component: () => import('@/views/ovs/mirror.vue'),
        meta: { title: '镜像管理' }
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
