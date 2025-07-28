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

// 端口类型专用API
export function addNormalPort(data) {
  return request.post('/api/ovs/port/add-normal', data)
}

export function addInternalPort(data) {
  return request.post('/api/ovs/port/add-internal', data)
}

export function addGrePort(data) {
  return request.post('/api/ovs/port/add-gre', data)
}

export function addVxlanPort(data) {
  return request.post('/api/ovs/port/add-vxlan', data)
}

export function addBondPort(data) {
  return request.post('/api/ovs/port/add-bond', data)
}

export function setPortUpDown(data) {
  return request.post('/api/ovs/port/updown', data)
}

export function setPortAddr(data) {
  return request.post('/api/ovs/port/addr', data)
}

export function getPortAddrs(data) {
  return request.post('/api/ovs/port/get-addrs', data)
}

export function deletePortAddr(data) {
  return request.post('/api/ovs/port/delete-addr', data)
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

export function addPatchPortWithoutPeer(data) {
  return request.post('/api/ovs/patch/add-without-peer', data)
}

export function setPatchPortPeer(data) {
  return request.post('/api/ovs/patch/set-peer', data)
}

export function addPatchPortPair(data) {
  return request.post('/api/ovs/patch/add-pair', data)
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

export function setPortAlias(data) {
  return request.post('/api/ovs/port/set-alias', data)
}

export function setPortRoute(data) {
  return request.post('/api/ovs/port/set-route', data)
}

export function deletePortRoute(data) {
  return request.post('/api/ovs/port/delete-route', data)
}

export function getPortRoutes(data) {
  return request.post('/api/ovs/port/get-routes', data)
}
