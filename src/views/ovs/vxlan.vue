<template>
  <a-card title="VXLAN 管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchVxlans"
        >
          <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">
            {{ item.name }}
          </a-option>
        </a-select>
        <a-button type="primary" @click="showAddModal = true" :disabled="!selectedBridge">新增 VXLAN 端口</a-button>
        <a-button @click="fetchVxlans" :disabled="!selectedBridge">刷新</a-button>
      </a-space>

      <a-table :columns="columns" :data="vxlanList" row-key="name" :loading="loading">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteVxlan(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>

    <a-modal v-model:visible="showAddModal" title="新增 VXLAN 端口" @ok="addVxlan" @cancel="resetForm">
      <a-form :model="addForm" :rules="rules" ref="formRef">
        <a-form-item label="网桥" field="bridge">
          <a-input v-model="addForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="端口名称" field="portName" required>
          <a-input v-model="addForm.portName" placeholder="请输入VXLAN端口名称" />
        </a-form-item>
        <a-form-item label="远程IP" field="remoteIP" required>
          <a-input v-model="addForm.remoteIP" placeholder="请输入远程IP地址" />
        </a-form-item>
        <a-form-item label="VNI" field="vni" required>
          <a-input-number v-model="addForm.vni" placeholder="请输入VNI值" :min="1" :max="16777215" />
        </a-form-item>
        <a-form-item label="Key" field="key">
          <a-input v-model="addForm.key" placeholder="可选：输入key值" />
        </a-form-item>
        <a-form-item label="本地IP" field="localIP">
          <a-input v-model="addForm.localIP" placeholder="可选：输入本地IP地址" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { addVxlan as apiAddVxlan, deleteVxlan as apiDeleteVxlan } from '@/api/ovs/vxlan'
import { listBridges } from '@/api/ovs/bridge'
import { listPorts } from '@/api/ovs/port'
import { Message } from '@arco-design/web-vue'

const vxlanList = ref([])
const bridgeList = ref([])
const selectedBridge = ref('')
const showAddModal = ref(false)
const loading = ref(false)
const formRef = ref()

const addForm = ref({
  bridge: '',
  portName: '',
  remoteIP: '',
  vni: null,
  key: '',
  localIP: ''
})

const rules = {
  portName: [
    { required: true, message: '请输入端口名称' }
  ],
  remoteIP: [
    { required: true, message: '请输入远程IP地址' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入有效的IP地址' }
  ],
  vni: [
    { required: true, message: '请输入VNI值' },
    { type: 'number', min: 1, max: 16777215, message: 'VNI值必须在1-16777215之间' }
  ]
}

const columns = [
  { title: '端口名称', dataIndex: 'name', width: '20%' },
  { title: '远程IP', dataIndex: 'remoteIP', width: '20%' },
  { title: 'VNI', dataIndex: 'vni', width: '15%' },
  { title: 'Key', dataIndex: 'key', width: '15%' },
  { title: '本地IP', dataIndex: 'localIP', width: '20%' },
  { title: '操作', slotName: 'actions', width: '10%' }
]

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

const fetchVxlans = async () => {
  if (!selectedBridge.value) return

  loading.value = true
  try {
    const res = await listPorts({ bridge: selectedBridge.value })
    if (res.data && res.data.ports) {
      // 过滤出VXLAN类型的端口
      vxlanList.value = res.data.ports
        .filter(port => port.type === 'vxlan' || port.name.includes('vxlan'))
        .map(port => ({
          name: port.name,
          type: port.type,
          // 这里可以根据实际需要添加更多字段
          remoteIP: port.options?.remote_ip || '',
          vni: port.options?.vni || '',
          key: port.options?.key || '',
          localIP: port.options?.local_ip || ''
        }))
    } else {
      vxlanList.value = []
    }
  } catch (error) {
    Message.error('获取VXLAN列表失败：' + error.message)
    vxlanList.value = []
  } finally {
    loading.value = false
  }
}

const addVxlan = async () => {
  try {
    await formRef.value.validate()
    await apiAddVxlan(addForm.value)
    Message.success('添加VXLAN端口成功')
    showAddModal.value = false
    resetForm()
    fetchVxlans()
  } catch (error) {
    Message.error('添加VXLAN端口失败：' + error.message)
  }
}

const deleteVxlan = async (record) => {
  try {
    await apiDeleteVxlan({
      bridge: selectedBridge.value,
      portName: record.name
    })
    Message.success('删除VXLAN端口成功')
    fetchVxlans()
  } catch (error) {
    Message.error('删除VXLAN端口失败：' + error.message)
  }
}

const resetForm = () => {
  addForm.value = {
    bridge: selectedBridge.value,
    portName: '',
    remoteIP: '',
    vni: null,
    key: '',
    localIP: ''
  }
  formRef.value?.resetFields()
}

// 监听选中的网桥变化
const handleBridgeChange = () => {
  addForm.value.bridge = selectedBridge.value
  fetchVxlans()
}

onMounted(() => {
  fetchBridges()
})
</script>
