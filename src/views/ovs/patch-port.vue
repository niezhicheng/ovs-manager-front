<template>
  <a-card title="Patch Port 管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showPatchPairModal = true">成对创建 Patch Port</a-button>
        <a-button @click="fetchPatchPorts">刷新</a-button>
      </a-space>
      
      <a-table :columns="columns" :data="patchPortList" row-key="rowKey" :loading="loading">
        <template #actions="{ record }">
          <a-space>
            <a-popconfirm content="确定要删除该 Patch Port 吗？" @ok="() => deletePatchPort(record)">
              <a-button size="mini" status="danger">删除</a-button>
            </a-popconfirm>
            <a-button size="mini" @click="openSetPeerModal(record)">设置对端</a-button>
            <a-button size="mini" @click="openConvertPatchModal(record)">改为 Patch Port</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    
    <!-- 成对创建Patch端口模态框 -->
    <a-modal v-model:visible="showPatchPairModal" title="成对创建 Patch Port" @ok="addPatchPair" @cancel="resetPatchPairForm">
      <a-form :model="patchPairForm" ref="patchPairFormRef" :rules="patchPairRules">
        <a-form-item label="BridgeA" field="bridgeA" required>
          <a-select v-model="patchPairForm.bridgeA" placeholder="请选择 BridgeA" @change="onBridgeAChange">
            <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="PortA" field="portA" required>
          <a-input v-model="patchPairForm.portA" placeholder="请输入新建端口名" @input="onPortAInput" />
          <div v-if="portAExists" style="color: #f53f3f; font-size: 12px;">端口名已存在，请换一个</div>
        </a-form-item>
        <a-form-item label="BridgeB" field="bridgeB" required>
          <a-select v-model="patchPairForm.bridgeB" placeholder="请选择 BridgeB" @change="onBridgeBChange">
            <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="PortB" field="portB" required>
          <a-input v-model="patchPairForm.portB" placeholder="请输入新建端口名" @input="onPortBInput" />
          <div v-if="portBExists" style="color: #f53f3f; font-size: 12px;">端口名已存在，请换一个</div>
        </a-form-item>
      </a-form>
    </a-modal>
    
    <!-- 设置对端模态框 -->
    <a-modal v-model:visible="showSetPeerModal" title="设置 Patch Port 对端" @ok="setPeer" @cancel="resetSetPeerForm">
      <a-form :model="setPeerForm" ref="setPeerFormRef" :rules="setPeerRules">
        <a-form-item label="当前端口名" field="portName">
          <a-input v-model="setPeerForm.portName" disabled />
        </a-form-item>
        <a-form-item label="对端端口名" field="peer" required>
          <a-input v-model="setPeerForm.peer" placeholder="请输入对端端口名称" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 转换为Patch端口模态框 -->
    <a-modal v-model:visible="showConvertPatchModal" title="改为 Patch Port" @ok="convertToPatchPort" @cancel="resetConvertForm">
      <a-form :model="convertPatchForm" ref="convertPatchFormRef" :rules="convertRules">
        <a-form-item label="当前 Bridge" field="bridge">
          <a-input v-model="convertPatchForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="当前端口名" field="name">
          <a-input v-model="convertPatchForm.name" disabled />
        </a-form-item>
        <a-form-item label="对端 Bridge" field="peerBridge" required>
          <a-select v-model="convertPatchForm.peerBridge" placeholder="请选择对端 Bridge">
            <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="对端端口名" field="peerName" required>
          <a-input v-model="convertPatchForm.peerName" placeholder="请输入对端端口名" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { addPatchPortPair, setPortTypePeer, listAllPatchPorts, deletePort as apiDeletePort, setPatchPortPeer } from '@/api/ovs/port'
import { listBridges } from '@/api/ovs/bridge'
import { Message } from '@arco-design/web-vue'

const showPatchPairModal = ref(false)
const patchPairForm = ref({ bridgeA: '', portA: '', bridgeB: '', portB: '' })
const patchPairFormRef = ref()

const showSetPeerModal = ref(false)
const setPeerForm = ref({ portName: '', peer: '' })
const setPeerFormRef = ref()

const showConvertPatchModal = ref(false)
const convertPatchForm = ref({ bridge: '', name: '', peerBridge: '', peerName: '' })
const convertPatchFormRef = ref()

const bridgeList = ref([])
const portAList = ref([])
const portBList = ref([])
const portAExists = ref(false)
const portBExists = ref(false)
const loading = ref(false)

const patchPortList = ref([])
const columns = [
  { title: 'Bridge', dataIndex: 'bridge' },
  { title: '端口名', dataIndex: 'name' },
  { title: 'Peer', dataIndex: 'peer' },
  { title: '操作', slotName: 'actions' }
]

const patchPairRules = {
  bridgeA: [{ required: true, message: '请选择 BridgeA' }],
  portA: [{ required: true, message: '请输入 PortA' }],
  bridgeB: [{ required: true, message: '请选择 BridgeB' }],
  portB: [{ required: true, message: '请输入 PortB' }]
}

const setPeerRules = {
  peer: [{ required: true, message: '请输入对端端口名' }]
}

const convertRules = {
  peerBridge: [{ required: true, message: '请选择对端 Bridge' }],
  peerName: [{ required: true, message: '请输入对端端口名' }]
}

// 获取网桥列表
const fetchBridges = async () => {
  try {
    const res = await listBridges()
    if (res.data && res.data.bridges) {
      bridgeList.value = res.data.bridges
    } else {
      bridgeList.value = []
    }
  } catch (error) {
    Message.error('获取网桥列表失败：' + error.message)
    bridgeList.value = []
  }
}

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

const fetchPatchPorts = async () => {
  loading.value = true
  try {
    const res = await listAllPatchPorts()
    patchPortList.value = res.data?.patchPorts || []
  } catch (error) {
    Message.error('获取Patch端口列表失败：' + error.message)
    patchPortList.value = []
  } finally {
    loading.value = false
  }
}

const addPatchPair = async () => {
  try {
    await patchPairFormRef.value?.validate()
    if (portAExists.value || portBExists.value) {
      Message.error('端口名已存在，请换一个')
      return
    }
    await addPatchPortPair(patchPairForm.value)
    Message.success('创建Patch端口对成功')
    showPatchPairModal.value = false
    resetPatchPairForm()
    fetchPatchPorts()
  } catch (error) {
    Message.error('创建Patch端口对失败：' + error.message)
  }
}

const deletePatchPort = async (record) => {
  try {
    await apiDeletePort({ bridge: record.bridge, portName: record.name })
    Message.success('删除Patch端口成功')
    fetchPatchPorts()
  } catch (error) {
    Message.error('删除Patch端口失败：' + error.message)
  }
}

const openSetPeerModal = (record) => {
  setPeerForm.value = {
    portName: record.name,
    peer: ''
  }
  showSetPeerModal.value = true
}

const setPeer = async () => {
  try {
    await setPeerFormRef.value?.validate()
    await setPatchPortPeer(setPeerForm.value)
    Message.success('设置对端成功')
    showSetPeerModal.value = false
    resetSetPeerForm()
    fetchPatchPorts()
  } catch (error) {
    Message.error('设置对端失败：' + error.message)
  }
}

const resetSetPeerForm = () => {
  setPeerForm.value = { portName: '', peer: '' }
  setPeerFormRef.value?.resetFields()
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
  try {
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
    Message.success('转换为Patch端口成功')
    showConvertPatchModal.value = false
    resetConvertForm()
    fetchPatchPorts()
  } catch (error) {
    Message.error('转换为Patch端口失败：' + error.message)
  }
}

const resetPatchPairForm = () => {
  patchPairForm.value = { bridgeA: '', portA: '', bridgeB: '', portB: '' }
  patchPairFormRef.value?.resetFields()
}

const resetConvertForm = () => {
  convertPatchForm.value = { bridge: '', name: '', peerBridge: '', peerName: '' }
  convertPatchFormRef.value?.resetFields()
}

onMounted(() => {
  fetchBridges()
  fetchPatchPorts()
})
</script> 