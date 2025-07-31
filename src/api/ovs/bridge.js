import request from '@/utils/request'

export function listBridges(data = {}) {
  return request.post('/api/ovs/bridge/list', data)
}

export function addBridge(data) {
  return request.post('/api/ovs/bridge/add', data)
}

export function deleteBridge(data) {
  return request.post('/api/ovs/bridge/delete', data)
}

// NetFlow 配置
export function setNetFlow(data) {
  return request.post('/api/ovs/set-netflow', data)
}

export function getNetFlow(bridgeName) {
  return request.post('/api/ovs/get-netflow', { bridge_name: bridgeName })
}

// sFlow 配置
export function setSFlow(data) {
  return request.post('/api/ovs/set-sflow', data)
}

export function getSFlow(bridgeName) {
  return request.post('/api/ovs/get-sflow', { bridge_name: bridgeName })
}

// STP 配置
export function setStp(data) {
  return request.post('/api/ovs/set-stp', data)
}

export function getStp(bridgeName) {
  return request.post('/api/ovs/get-stp', { bridge_name: bridgeName })
}

// RSTP 配置
export function setRstp(data) {
  return request.post('/api/ovs/set-rstp', data)
}

export function getRstp(bridgeName) {
  return request.post('/api/ovs/get-rstp', { bridge_name: bridgeName })
}

// IPFIX 配置
export function setIpfix(data) {
  return request.post('/api/ovs/set-ipfix', data)
}

export function getIpfix(bridgeName) {
  return request.post('/api/ovs/get-ipfix', { bridge_name: bridgeName })
}

// QoS 配置
export function setQos(data) {
  return request.post('/api/ovs/port/set-qos', data)
}

export function getQos(bridgeName, portName) {
  return request.post('/api/ovs/get-qos', { bridge_name: bridgeName, port_name: portName })
}

// 查询流缓存
export function dumpFlows(data) {
  return request.post('/api/ovs/dump-flows', data)
}
