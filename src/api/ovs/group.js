import request from '@/utils/request'

// 获取组表列表
export function getGroupList(bridge) {
  return request({
    url: '/ovs/group',
    method: 'get',
    params: { bridge }
  })
}

// 创建组表
export function createGroup(data) {
  return request({
    url: '/ovs/group',
    method: 'post',
    data
  })
}

// 更新组表
export function updateGroup(id, data) {
  return request({
    url: `/ovs/group/${id}`,
    method: 'put',
    data
  })
}

// 删除组表
export function deleteGroup(id) {
  return request({
    url: `/ovs/group/${id}`,
    method: 'delete'
  })
}

// 启用组表
export function enableGroup(id) {
  return request({
    url: `/ovs/group/${id}/enable`,
    method: 'post'
  })
}

// 停用组表
export function disableGroup(id) {
  return request({
    url: `/ovs/group/${id}/disable`,
    method: 'post'
  })
}

// 获取组表统计
export function getGroupStats(bridge) {
  return request({
    url: '/ovs/group/stats',
    method: 'get',
    params: { bridge }
  })
}

// 获取组表详情
export function getGroupDetails(id) {
  return request({
    url: `/ovs/group/${id}/details`,
    method: 'get'
  })
}

// 获取桶列表
export function getBucketList(groupId) {
  return request({
    url: `/ovs/group/${groupId}/buckets`,
    method: 'get'
  })
}

// 创建桶
export function createBucket(groupId, data) {
  return request({
    url: `/ovs/group/${groupId}/buckets`,
    method: 'post',
    data
  })
}

// 更新桶
export function updateBucket(groupId, bucketId, data) {
  return request({
    url: `/ovs/group/${groupId}/buckets/${bucketId}`,
    method: 'put',
    data
  })
}

// 删除桶
export function deleteBucket(groupId, bucketId) {
  return request({
    url: `/ovs/group/${groupId}/buckets/${bucketId}`,
    method: 'delete'
  })
} 