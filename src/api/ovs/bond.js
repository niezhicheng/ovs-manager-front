import request from '@/utils/request'

export function listBonds(data = {}) {
  // 假设有 Bond 列表接口，如无可后续补充
  return request.post('/api/ovs/bond/show', data)
}

export function addBond(data) {
  return request.post('/api/ovs/bond/add', {
    bridge: data.bridge,
    bondName: data.name,
    slaves: data.members,
    bondMode: data.mode
  })
}

export function deleteBond(data) {
  return request.post('/api/ovs/bond/delete', data)
}

export function updateBond(data) {
  return request.post('/api/ovs/bond/update', data)
}

export function listBondsshowall(data = {}) {
  // 假设有 Bond 列表接口，如无可后续补充
  return request.post('/api/ovs/bond/showall', data)
}
