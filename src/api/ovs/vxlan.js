import request from '@/utils/request'

export function listVxlans(data = {}) {
  // 假设有 VXLAN 列表接口，如无可后续补充
  return request.post('/api/ovs/vxlan/list', data)
}

export function addVxlan(data) {
  return request.post('/api/ovs/vxlan/add', data)
}

export function deleteVxlan(data) {
  return request.post('/api/ovs/vxlan/delete', data)
} 