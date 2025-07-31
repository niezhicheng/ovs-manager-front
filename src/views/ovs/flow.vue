<template>
  <a-card title="流表规则管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchFlows"
        >
          <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">
            {{ item.name }}
          </a-option>
        </a-select>
        <a-button type="primary" @click="openAddModal" :disabled="!selectedBridge">新增规则</a-button>
        <a-button @click="fetchFlows" :disabled="!selectedBridge">刷新</a-button>
      </a-space>

      <a-table :columns="columns" :data="flowList" row-key="id" :loading="loading">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteFlow(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>

    <a-modal v-model:visible="showAddModal" title="新增流表规则" @ok="addFlow" @cancel="resetForm">
      <a-form :model="addForm" :rules="rules" ref="formRef">
        <a-form-item label="网桥" field="bridge">
          <a-input v-model="addForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="流表表达式" field="flow" required>
          <a-textarea
            v-model="addForm.flow"
            placeholder="请输入完整的流表表达式，例如：table=0,priority=100,ip,nw_src=192.168.1.0/24,actions=output:2"
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="常用模板">
          <a-space wrap>
            <a-button v-for="tpl in flowTemplates" :key="tpl.label" size="mini" @click="applyTemplate(tpl.value)">{{ tpl.label }}</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listFlows, addFlow as apiAddFlow, deleteFlow as apiDeleteFlow } from '@/api/ovs/flow'
import { listBridges } from '@/api/ovs/bridge'
import { Message, Modal } from '@arco-design/web-vue'

const flowList = ref([])
const bridgeList = ref([])
const selectedBridge = ref('')
const showAddModal = ref(false)
const loading = ref(false)
const formRef = ref()

const addForm = ref({
  bridge: '',
  flow: ''
})

const rules = {
  flow: [
    { required: true, message: '请输入流表表达式' }
  ]
}

const columns = [
  { title: '流表规则', dataIndex: 'flow', width: '80%' },
  { title: '操作', slotName: 'actions', width: '20%' }
]

const flowTemplates = [
  { label: '允许所有流量', value: 'priority=0,actions=NORMAL' },
  { label: '丢弃所有流量', value: 'priority=0,actions=drop' },
  { label: '指定IP转发', value: 'priority=100,ip,nw_src=192.168.1.100,actions=output:2' },
  { label: '指定端口转发', value: 'priority=100,in_port=1,actions=output:2' },
  { label: 'ARP转发', value: 'priority=200,arp,actions=NORMAL' },
  { label: 'VLAN打标签', value: 'priority=100,in_port=1,actions=mod_vlan_vid:10,output:2' },
  { label: 'VLAN去标签', value: 'priority=100,dl_vlan=10,actions=strip_vlan,output:2' },
]
function applyTemplate(tpl) {
  addForm.value.flow = tpl
}

function openAddModal() {
  addForm.value.bridge = selectedBridge.value
  showAddModal.value = true
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

const fetchFlows = async () => {
  if (!selectedBridge.value) return

  loading.value = true
  try {
    const res = await listFlows({ bridge: selectedBridge.value })
    if (res.data && res.data.output) {
      // 只保留真正的流表条目
      const flows = res.data.output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes('cookie=') && line.includes('actions='))
      flowList.value = flows.map((flow, index) => ({
        id: index,
        flow
      }))
    } else {
      flowList.value = []
    }
  } catch (error) {
    Message.error('获取流表规则失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const addFlow = async () => {
  try {
    await formRef.value.validate()
    // 检查是否有完全一样的流表
    const exists = flowList.value.some(item => item.flow.replace(/\s+/g, '') === addForm.value.flow.replace(/\s+/g, ''))
    if (exists) {
      Modal.confirm({
        title: '规则已存在',
        content: '该流表规则已存在，继续添加会覆盖原有规则，是否继续？',
        onOk: async () => {
          await doAddFlow()
        }
      })
    } else {
      await doAddFlow()
    }
  } catch (error) {
    Message.error('添加流表规则失败：' + error.message)
  }
}

async function doAddFlow() {
  await apiAddFlow(addForm.value)
  Message.success('添加流表规则成功')
  showAddModal.value = false
  resetForm()
  fetchFlows()
}

const deleteFlow = async (record) => {
  try {
    await apiDeleteFlow({
      bridge: selectedBridge.value,
      match: record.flow
    })
    Message.success('删除流表规则成功')
    fetchFlows()
  } catch (error) {
    Message.error('删除流表规则失败：' + error.message)
  }
}

const resetForm = () => {
  addForm.value = {
    bridge: selectedBridge.value,
    flow: ''
  }
  formRef.value?.resetFields()
}

// 监听选中的网桥变化
const handleBridgeChange = () => {
  addForm.value.bridge = selectedBridge.value
  fetchFlows()
}

onMounted(() => {
  fetchBridges()
})
</script>
