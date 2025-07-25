import request from '@/utils/request'

export function applyScenario(data = {}) {
  return request.post('/api/ovs/scenario/apply', data)
} 