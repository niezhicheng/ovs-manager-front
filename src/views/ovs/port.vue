<template>
  <a-card title="Patch Port 管理">
    <a-space style="margin-bottom: 16px;">
      <a-button type="primary" @click="showPatchPairModal = true">成对创建 Patch Port</a-button>
      <a-button @click="fetchPatchPorts">刷新</a-button>
    </a-space>
    <a-table :columns="columns" :data="patchPortList" row-key="rowKey">
      <template #actions="{ record }">
        <a-space>
          <a-popconfirm content="确定要删除该 Patch Port 吗？" @ok="() => deletePatchPort(record)">
            <a-button size="mini" status="danger">删除</a-button>
          </a-popconfirm>
          <a-button size="mini" @click="openConvertPatchModal(record)">改为 Patch Port</a-button>
        </a-space>
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
    <a-modal v-model:visible="showConvertPatchModal" title="改为 Patch Port" @ok="convertToPatchPort">
      <a-form :model="convertPatchForm" ref="convertPatchFormRef">
        <a-form-item label="当前 Bridge" field="bridge">
          <a-input v-model="convertPatchForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="当前端口名" field="name">
          <a-input v-model="convertPatchForm.name" disabled />
        </a-form-item>
        <a-form-item label="对端 Bridge" field="peerBridge" :rules="[{ required: true, message: '请选择对端 Bridge' }]">
          <a-select v-model="convertPatchForm.peerBridge" placeholder="请选择对端 Bridge">
            <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="对端端口名" field="peerName" :rules="[{ required: true, message: '请输入对端端口名' }]">
          <a-input v-model="convertPatchForm.peerName" placeholder="请输入对端端口名" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref } from 'vue'
import { addPatchPortPair, setPortTypePeer, listAllPatchPorts } from '@/api/ovs/port'

const showPatchPairModal = ref(false)
const patchPairForm = ref({ bridgeA: '', portA: '', bridgeB: '', portB: '' })
const patchPairFormRef = ref()

const showConvertPatchModal = ref(false)
const convertPatchForm = ref({ bridge: '', name: '', peerBridge: '', peerName: '' })
const convertPatchFormRef = ref()

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

const onBridgeAChange = () => {
  patchPairForm.value.portA = ''
  portAExists.value = false
}
const onBridgeBChange = () => {
  patchPairForm.value.portB = ''
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
  const res = await listAllPatchPorts()
  patchPortList.value = res.data?.patchPorts || []
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

const openConvertPatchModal = (record) => {
  convertPatchForm.value = {
    bridge: record.bridge,
    name: record.name,
    peerBridge: '',
    peerName: ''
  }
  showConvertPatchModal.value = true
}

const convertToPatchPort = async () => {
  await convertPatchFormRef.value?.validate()
  // 设置当前端口为 patch 类型并指定 peer
  await setPortTypePeer({
    bridge: convertPatchForm.value.bridge,
    portName: convertPatchForm.value.name,
    type: 'patch',
    peer: convertPatchForm.value.peerName
  })
  // 设置对端端口为 patch 类型并指定 peer
  await setPortTypePeer({
    bridge: convertPatchForm.value.peerBridge,
    portName: convertPatchForm.value.peerName,
    type: 'patch',
    peer: convertPatchForm.value.name
  })
  showConvertPatchModal.value = false
  fetchPatchPorts()
}

showPatchPairModal.value = false
showConvertPatchModal.value = false
fetchPatchPorts()
</script>
