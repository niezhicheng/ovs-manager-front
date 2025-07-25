import request from '@/utils/request'

export function listNetns(data = {}) {
  return request.post('/api/netns/list', data)
}

export function addNetns(data) {
  return request.post('/api/netns/create', data)
}

export function deleteNetns(data) {
  return request.post('/api/netns/delete', data)
} 