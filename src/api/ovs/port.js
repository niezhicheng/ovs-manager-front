import request from '@/utils/request'

export function listPorts(data = {}) {
  return request.post('/api/ovs/port/list', data)
}

export function addPort(data) {
  return request.post('/api/ovs/port/add', data)
}

export function deletePort(data) {
  return request.post('/api/ovs/port/delete', data)
}

export function setPortUpDown(data) {
  return request.post('/api/ovs/port/updown', data)
}

export function setPortAddr(data) {
  return request.post('/api/ovs/port/addr', data)
}

export function setPortVlanTag(data) {
  return request.post('/api/ovs/port/set-vlan', data)
}

export function setPortTypePeer(data) {
  return request.post('/api/ovs/port/set-type-peer', data)
}

export function addTunnelPort(data) {
  return request.post('/api/ovs/tunnel/add', data)
}

export function addPatchPort(data) {
  return request.post('/api/ovs/patch/add', data)
}

export function addPatchPortPair(data) {
  return request.post('/api/ovs/patch/add-pair', data)
}

export function addBondPort(data) {
  return request.post('/api/ovs/bond/add', data)
}

export function addTapPort(data) {
  return request.post('/api/ovs/tap/add', data)
}

export function addTunPort(data) {
  return request.post('/api/ovs/tun/add', data)
}

export function listAllPatchPorts(data = {}) {
  return request.post('/api/ovs/port/patch-list', data)
}

// 其他端口相关接口可后续补充
