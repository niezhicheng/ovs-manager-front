<template>
  <a-card title="Patch Port 管理">
    <a-space style="margin-bottom: 16px;">
      <a-button type="primary" @click="showPatchPairModal = true">成对创建 Patch Port</a-button>
      <a-button @click="fetchPatchPorts">刷新</a-button>
    </a-space>
    <a-table :columns="columns" :data="patchPortList" row-key="rowKey">
      <template #actions="{ record }">
        <a-popconfirm content="确定要删除该 Patch Port 吗？" @ok="() => deletePatchPort(record)">
          <a-button size="mini" status="danger">删除</a-button>
        </a-popconfirm>
      </template>
    </a-table>
    <a-modal v-model:visible="showPatchPairModal" title="成对创建 Patch Port" @ok="addPatchPair">
      <a-form :model="patchPairForm" ref="patchPairFormRef">
        <a-form-item label="BridgeA" field="bridgeA" :rules="[{ required: true, message: '请选择 BridgeA' }]">
          <a-select v-model="patchPairForm.bridgeA" placeholder="请选择 BridgeA" @change="onBridgeAChange">
            <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="PortA" field="portA" :rules="[{ required: true, message: '请输入 PortA' }, { validator: validatePortA }]">
          <a-input v-model="patchPairForm.portA" placeholder="请输入新建端口名" @input="onPortAInput" />
          <div v-if="portAExists" style="color: #f53f3f; font-size: 12px;">端口名已存在，请换一个</div>
        </a-form-item>
        <a-form-item label="BridgeB" field="bridgeB" :rules="[{ required: true, message: '请选择 BridgeB' }]">
          <a-select v-model="patchPairForm.bridgeB" placeholder="请选择 BridgeB" @change="onBridgeBChange">
            <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="PortB" field="portB" :rules="[{ required: true, message: '请输入 PortB' }, { validator: validatePortB }]">
          <a-input v-model="patchPairForm.portB" placeholder="请输入新建端口名" @input="onPortBInput" />
          <div v-if="portBExists" style="color: #f53f3f; font-size: 12px;">端口名已存在，请换一个</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref } from 'vue'
import { addPatchPortPair } from '@/api/ovs/port'
import request from '@/utils/request'

const showPatchPairModal = ref(false)
const patchPairForm = ref({ bridgeA: '', portA: '', bridgeB: '', portB: '' })
const patchPairFormRef = ref()

const bridgeList = ref([])
const portAList = ref([])
const portBList = ref([])
const portAExists = ref(false)
const portBExists = ref(false)

const patchPortList = ref([])
const columns = [
  { title: 'Bridge', dataIndex: 'bridge' },
  { title: '端口名', dataIndex: 'name' },
  { title: 'Peer', dataIndex: 'peer' },
  { title: '操作', slotName: 'actions' }
]

const rowKey = (record) => `${record.bridge}-${record.name}`

const fetchBridgeList = async () => {
  const bridgesRes = await request.post('/api/ovs/bridge/list')
  bridgeList.value = bridgesRes.data?.bridges?.map(b => (typeof b === 'string' ? { name: b } : b)) || []
}
const fetchPortAList = async () => {
  if (!patchPairForm.value.bridgeA) { portAList.value = []; return }
  const portsRes = await request.post('/api/ovs/port/list', { bridge: patchPairForm.value.bridgeA })
  portAList.value = (portsRes.data?.ports || []).map(p => p.name)
}
const fetchPortBList = async () => {
  if (!patchPairForm.value.bridgeB) { portBList.value = []; return }
  const portsRes = await request.post('/api/ovs/port/list', { bridge: patchPairForm.value.bridgeB })
  portBList.value = (portsRes.data?.ports || []).map(p => p.name)
}
const onBridgeAChange = () => {
  patchPairForm.value.portA = ''
  fetchPortAList()
  portAExists.value = false
}
const onBridgeBChange = () => {
  patchPairForm.value.portB = ''
  fetchPortBList()
  portBExists.value = false
}
const onPortAInput = () => {
  portAExists.value = portAList.value.includes(patchPairForm.value.portA)
}
const onPortBInput = () => {
  portBExists.value = portBList.value.includes(patchPairForm.value.portB)
}
const validatePortA = async (value) => {
  if (portAExists.value) {
    return Promise.reject(new Error('端口名已存在，请换一个'))
  }
  return Promise.resolve()
}
const validatePortB = async (value) => {
  if (portBExists.value) {
    return Promise.reject(new Error('端口名已存在，请换一个'))
  }
  return Promise.resolve()
}

const fetchPatchPorts = async () => {
  const bridgesRes = await request.post('/api/ovs/bridge/list')
  const bridges = bridgesRes.data?.bridges?.map(b => (typeof b === 'string' ? { name: b } : b)) || []
  const all = []
  for (const bridgeObj of bridges) {
    const bridge = bridgeObj.name
    const portsRes = await request.post('/api/ovs/port/list', { bridge })
    const ports = portsRes.data?.ports || []
    ports.forEach(p => {
      if (p.type === 'patch') {
        all.push({ bridge, name: p.name, peer: p.options?.peer || '' })
      }
    })
  }
  patchPortList.value = all
}

const addPatchPair = async () => {
  await patchPairFormRef.value?.validate()
  if (portAExists.value || portBExists.value) return
  await addPatchPortPair(patchPairForm.value)
  showPatchPairModal.value = false
  patchPairForm.value = { bridgeA: '', portA: '', bridgeB: '', portB: '' }
  fetchPatchPorts()
}

const deletePatchPort = async (record) => {
  await request.post('/api/ovs/port/delete', { bridge: record.bridge, portName: record.name })
  fetchPatchPorts()
}

showPatchPairModal.value = false
fetchBridgeList()
fetchPatchPorts()
</script>
