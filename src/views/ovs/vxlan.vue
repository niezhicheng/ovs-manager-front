<template>
  <a-card title="VXLAN 管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增 VXLAN 端口</a-button>
        <a-button @click="fetchVxlans">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="vxlanList" row-key="name">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteVxlan(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增 VXLAN 端口" @ok="addVxlan">
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
import { listVxlans, addVxlan as apiAddVxlan, deleteVxlan as apiDeleteVxlan } from '@/api/ovs/vxlan'

const vxlanList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '操作', slotName: 'actions' }
]

const fetchVxlans = async () => {
  const res = await listVxlans()
  vxlanList.value = res.data?.vxlans || []
}

const addVxlan = async () => {
  await apiAddVxlan(addForm.value)
  showAddModal.value = false
  addForm.value = { name: '' }
  fetchVxlans()
}

const deleteVxlan = async (record) => {
  await apiDeleteVxlan({ name: record.name })
  fetchVxlans()
}

onMounted(fetchVxlans)
</script> 