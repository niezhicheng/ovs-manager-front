import request from '@/utils/request'

// 获取镜像配置列表
export function getMirrorList(bridge) {
  return request({
    url: '/api/ovs/mirror',
    method: 'get',
    params: { bridge }
  })
}

// 创建镜像配置
export function createMirror(data) {
  return request({
    url: '/api/ovs/mirror/add',
    method: 'post',
    data
  })
}

// 更新镜像配置
export function updateMirror(id, data) {
  return request({
    url: `/api/ovs/mirror/${id}`,
    method: 'put',
    data
  })
}

// 删除镜像配置
export function deleteMirror(id) {
  return request({
    url: `/api/ovs/mirror/${id}`,
    method: 'delete'
  })
}

// 启用镜像
export function enableMirror(id) {
  return request({
    url: `/api/ovs/mirror/${id}/enable`,
    method: 'post'
  })
}

// 停用镜像
export function disableMirror(id) {
  return request({
    url: `/api/ovs/mirror/${id}/disable`,
    method: 'post'
  })
}

// 获取镜像统计
export function getMirrorStats(bridge) {
  return request({
    url: '/api/ovs/mirror/stats',
    method: 'get',
    params: { bridge }
  })
}

// 获取镜像详情
export function getMirrorDetails(id) {
  return request({
    url: `/api/ovs/mirror/${id}/details`,
    method: 'get'
  })
}

// 重置镜像统计
export function resetMirrorStats(id) {
  return request({
    url: `/api/ovs/mirror/${id}/reset-stats`,
    method: 'post'
  })
}
