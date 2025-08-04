import request from '@/utils/request'

// 获取QoS配置列表
export function getQoSList(bridge, port) {
  return request({
    url: '/ovs/qos',
    method: 'get',
    params: { bridge, port }
  })
}

// 创建QoS配置
export function createQoS(data) {
  return request({
    url: '/ovs/qos',
    method: 'post',
    data
  })
}

// 更新QoS配置
export function updateQoS(id, data) {
  return request({
    url: `/ovs/qos/${id}`,
    method: 'put',
    data
  })
}

// 删除QoS配置
export function deleteQoS(id) {
  return request({
    url: `/ovs/qos/${id}`,
    method: 'delete'
  })
}

// 获取队列列表
export function getQueueList(bridge, port) {
  return request({
    url: '/ovs/qos/queues',
    method: 'get',
    params: { bridge, port }
  })
}

// 创建队列
export function createQueue(data) {
  return request({
    url: '/ovs/qos/queues',
    method: 'post',
    data
  })
}

// 更新队列
export function updateQueue(id, data) {
  return request({
    url: `/ovs/qos/queues/${id}`,
    method: 'put',
    data
  })
}

// 删除队列
export function deleteQueue(id) {
  return request({
    url: `/ovs/qos/queues/${id}`,
    method: 'delete'
  })
}

// 获取流量统计
export function getTrafficStats(bridge, port) {
  return request({
    url: '/ovs/qos/traffic-stats',
    method: 'get',
    params: { bridge, port }
  })
}

// 重置QoS统计
export function resetQoSStats(port) {
  return request({
    url: '/ovs/qos/reset-stats',
    method: 'post',
    data: { port }
  })
}

// 获取QoS详情
export function getQoSDetails(id) {
  return request({
    url: `/ovs/qos/${id}/details`,
    method: 'get'
  })
}

// 获取队列详情
export function getQueueDetails(id) {
  return request({
    url: `/ovs/qos/queues/${id}/details`,
    method: 'get'
  })
} 