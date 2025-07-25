import request from '@/utils/request'

export function listMirrors(data = {}) {
  return request.post('/api/ovs/mirror/list', data)
}

export function addMirror(data) {
  return request.post('/api/ovs/mirror/add', data)
}

export function deleteMirror(data) {
  return request.post('/api/ovs/mirror/delete', data)
} 