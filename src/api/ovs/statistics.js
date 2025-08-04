import request from '@/utils/request'

// 获取总体统计信息
export function getOverallStatistics(bridge) {
  return request({
    url: '/ovs/statistics/overall',
    method: 'get',
    params: { bridge }
  })
}

// 获取端口统计信息
export function getPortStatistics(bridge) {
  return request({
    url: '/ovs/statistics/ports',
    method: 'get',
    params: { bridge }
  })
}

// 获取流表统计信息
export function getFlowStatistics(bridge) {
  return request({
    url: '/ovs/statistics/flows',
    method: 'get',
    params: { bridge }
  })
}

// 获取队列统计信息
export function getQueueStatistics(bridge) {
  return request({
    url: '/ovs/statistics/queues',
    method: 'get',
    params: { bridge }
  })
}

// 重置端口统计
export function resetPortStatistics(port) {
  return request({
    url: '/ovs/statistics/ports/reset',
    method: 'post',
    data: { port }
  })
}

// 重置流表统计
export function resetFlowStatistics(flow) {
  return request({
    url: '/ovs/statistics/flows/reset',
    method: 'post',
    data: { flow }
  })
}

// 重置队列统计
export function resetQueueStatistics(queue) {
  return request({
    url: '/ovs/statistics/queues/reset',
    method: 'post',
    data: { queue }
  })
}

// 获取端口详情
export function getPortDetails(port) {
  return request({
    url: '/ovs/statistics/ports/details',
    method: 'get',
    params: { port }
  })
}

// 获取流表详情
export function getFlowDetails(flow) {
  return request({
    url: '/ovs/statistics/flows/details',
    method: 'get',
    params: { flow }
  })
}

// 获取队列详情
export function getQueueDetails(queue) {
  return request({
    url: '/ovs/statistics/queues/details',
    method: 'get',
    params: { queue }
  })
}

// 开始实时监控
export function startMonitoring(bridge) {
  return request({
    url: '/ovs/statistics/monitoring/start',
    method: 'post',
    data: { bridge }
  })
}

// 停止实时监控
export function stopMonitoring() {
  return request({
    url: '/ovs/statistics/monitoring/stop',
    method: 'post'
  })
}

// 获取性能监控数据
export function getPerformanceData(bridge, type) {
  return request({
    url: '/ovs/statistics/performance',
    method: 'get',
    params: { bridge, type }
  })
} 