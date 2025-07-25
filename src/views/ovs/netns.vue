<template>
  <a-card title="网络命名空间管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新建命名空间</a-button>
        <a-button @click="fetchNetns">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="netnsList" row-key="name">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteNetns(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新建命名空间" @ok="addNetns">
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
import { listNetns, addNetns as apiAddNetns, deleteNetns as apiDeleteNetns } from '@/api/ovs/netns'

const netnsList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '操作', slotName: 'actions' }
]

const fetchNetns = async () => {
  const res = await listNetns()
  netnsList.value = res.data?.netns || []
}

const addNetns = async () => {
  await apiAddNetns(addForm.value)
  showAddModal.value = false
  addForm.value = { name: '' }
  fetchNetns()
}

const deleteNetns = async (record) => {
  await apiDeleteNetns({ name: record.name })
  fetchNetns()
}

onMounted(fetchNetns)
</script> 