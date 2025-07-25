<template>
  <a-card title="镜像管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增镜像</a-button>
        <a-button @click="fetchMirrors">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="mirrorList" row-key="name">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" status="danger" @click="deleteMirror(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增镜像" @ok="addMirror">
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
import { listMirrors, addMirror as apiAddMirror, deleteMirror as apiDeleteMirror } from '@/api/ovs/mirror'

const mirrorList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '操作', slotName: 'actions' }
]

const fetchMirrors = async () => {
  const res = await listMirrors()
  mirrorList.value = res.data?.mirrors || []
}

const addMirror = async () => {
  await apiAddMirror(addForm.value)
  showAddModal.value = false
  addForm.value = { name: '' }
  fetchMirrors()
}

const deleteMirror = async (record) => {
  await apiDeleteMirror({ name: record.name })
  fetchMirrors()
}

onMounted(fetchMirrors)
</script> 