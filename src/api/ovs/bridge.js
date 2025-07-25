import request from '@/utils/request'

export function listBridges(data = {}) {
  return request.post('/api/ovs/bridge/list', data)
}

export function addBridge(data) {
  return request.post('/api/ovs/bridge/add', data)
}

export function deleteBridge(data) {
  return request.post('/api/ovs/bridge/delete', data)
}

// 其他配置相关接口可后续补充
