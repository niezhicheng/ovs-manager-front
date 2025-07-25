import request from '@/utils/request'

export function listFlows(data = {}) {
  return request.post('/api/ovs/flow/list-v2', data)
}

export function addFlow(data) {
  return request.post('/api/ovs/flow/add-v2', data)
}

export function deleteFlow(data) {
  return request.post('/api/ovs/flow/delete-v2', data)
} 