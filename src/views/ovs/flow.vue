<template>
  <a-card title="流表规则管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增规则</a-button>
        <a-button @click="fetchFlows">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="flowList" row-key="id">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteFlow(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增规则" @ok="addFlow">
      <a-form :model="addForm">
        <a-form-item label="规则名" field="name">
          <a-input v-model="addForm.name" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listFlows, addFlow as apiAddFlow, deleteFlow as apiDeleteFlow } from '@/api/ovs/flow'

const flowList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const columns = [
  { title: '规则名', dataIndex: 'name' },
  { title: '操作', slotName: 'actions' }
]

const fetchFlows = async () => {
  const res = await listFlows()
  flowList.value = res.data?.flows || []
}

const addFlow = async () => {
  await apiAddFlow(addForm.value)
  showAddModal.value = false
  addForm.value = { name: '' }
  fetchFlows()
}

const deleteFlow = async (record) => {
  await apiDeleteFlow({ id: record.id })
  fetchFlows()
}

onMounted(fetchFlows)
</script> 