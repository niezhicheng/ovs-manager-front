<template>
  <a-card title="Bond 管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增 Bond 端口</a-button>
        <a-button @click="fetchBonds">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="bondList" row-key="name">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteBond(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增 Bond 端口" @ok="addBond">
      <a-form :model="addForm">
        <a-form-item label="名称" field="name">
          <a-input v-model="addForm.name" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listBonds, addBond as apiAddBond, deleteBond as apiDeleteBond } from '@/api/ovs/bond'

const bondList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '操作', slotName: 'actions' }
]

const fetchBonds = async () => {
  const res = await listBonds()
  bondList.value = res.data?.bonds || []
}

const addBond = async () => {
  await apiAddBond(addForm.value)
  showAddModal.value = false
  addForm.value = { name: '' }
  fetchBonds()
}

const deleteBond = async (record) => {
  await apiDeleteBond({ name: record.name })
  fetchBonds()
}

onMounted(fetchBonds)
</script> 