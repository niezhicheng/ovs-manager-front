import request from '@/utils/request'

// 获取控制器状态
export function getControllerStatus() {
  return request({
    url: '/ovs/controller/status',
    method: 'get'
  })
}

// 断开控制器连接
export function disconnectController() {
  return request({
    url: '/ovs/controller/disconnect',
    method: 'post'
  })
}

// 重新连接控制器
export function reconnectController() {
  return request({
    url: '/ovs/controller/reconnect',
    method: 'post'
  })
}

// 应用控制器配置
export function applyControllerConfig(data) {
  return request({
    url: '/ovs/controller/config',
    method: 'post',
    data
  })
}

// 测试控制器连接
export function testControllerConnection(data) {
  return request({
    url: '/ovs/controller/test',
    method: 'post',
    data
  })
}

// 获取网桥控制器配置
export function getBridgeControllers(bridge) {
  return request({
    url: '/ovs/controller/bridge',
    method: 'get',
    params: { bridge }
  })
}

// 添加网桥控制器
export function addBridgeController(data) {
  return request({
    url: '/ovs/controller/bridge',
    method: 'post',
    data
  })
}

// 更新网桥控制器
export function updateBridgeController(data) {
  return request({
    url: '/ovs/controller/bridge',
    method: 'put',
    data
  })
}

// 删除网桥控制器
export function deleteBridgeController(bridge, controller) {
  return request({
    url: '/ovs/controller/bridge',
    method: 'delete',
    params: { bridge, controller }
  })
}

// 获取控制器事件日志
export function getControllerLogs(params) {
  return request({
    url: '/ovs/controller/logs',
    method: 'get',
    params
  })
}

// 清空控制器日志
export function clearControllerLogs() {
  return request({
    url: '/ovs/controller/logs',
    method: 'delete'
  })
}

// 测试流表操作
export function testFlowOperation(operation, data) {
  return request({
    url: `/ovs/controller/test/flow/${operation}`,
    method: 'post',
    data
  })
}

// 测试端口操作
export function testPortOperation(operation, data) {
  return request({
    url: `/ovs/controller/test/port/${operation}`,
    method: 'post',
    data
  })
}

// 测试统计查询
export function testStatisticsQuery(type, data) {
  return request({
    url: `/ovs/controller/test/statistics/${type}`,
    method: 'post',
    data
  })
}

// 获取控制器支持的协议版本
export function getSupportedProtocols() {
  return request({
    url: '/ovs/controller/protocols',
    method: 'get'
  })
}

// 获取控制器连接模式
export function getConnectionModes() {
  return request({
    url: '/ovs/controller/modes',
    method: 'get'
  })
} 