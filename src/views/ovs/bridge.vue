<template>
  <a-card title="交换机管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增交换机</a-button>
        <a-button @click="fetchBridges">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="bridgeList" row-key="name">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" @click="openPortModal(record)">配置端口</a-button>
            <a-button size="mini" status="danger" @click="deleteBridge(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增交换机" @ok="addBridge">
      <a-form :model="addForm">
        <a-form-item label="名称" field="name">
          <a-input v-model="addForm.name" />
        </a-form-item>
      </a-form>
    </a-modal>
    <!-- 端口管理弹窗 -->
    <a-modal v-model:visible="showPortModal" :title="`端口管理 - ${currentBridge || ''}`" width="800px" footer={null} @cancel="closePortModal">
      <PortManager v-if="showPortModal" :bridge="currentBridge" />
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listBridges, addBridge as apiAddBridge, deleteBridge as apiDeleteBridge } from '@/api/ovs/bridge'
import PortManager from './PortManager.vue'

const bridgeList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const showPortModal = ref(false)
const currentBridge = ref('')

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '操作', slotName: 'actions' }
]

const fetchBridges = async () => {
  const res = await listBridges()
  bridgeList.value = res.data.bridges || []
}

const addBridge = async () => {
  await apiAddBridge(addForm.value)
  showAddModal.value = false
  addForm.value = { name: '' }
  fetchBridges()
}

const deleteBridge = async (record) => {
  await apiDeleteBridge({ name: record.name })
  fetchBridges()
}

const openPortModal = (record) => {
  currentBridge.value = record.name
  showPortModal.value = true
}
const closePortModal = () => {
  showPortModal.value = false
  currentBridge.value = ''
}

onMounted(fetchBridges)
</script>
