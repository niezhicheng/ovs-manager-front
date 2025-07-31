<template>
  <a-card title="Bond 管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增 Bond 端口</a-button>
        <a-button @click="fetchBonds">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="bondList" row-key="name">
        <template #members="{ record }">
          <span>{{ Array.isArray(record.members) ? record.members.join(', ') : record.members }}</span>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" @click="openEditModal(record)">编辑</a-button>
            <a-button size="mini" status="danger" @click="deleteBond(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增 Bond 端口" @ok="addBond">
      <a-form :model="addForm">
        <a-form-item label="网桥" field="bridge" required>
          <a-input v-model="addForm.bridge" placeholder="请输入网桥名称" />
        </a-form-item>
        <a-form-item label="名称" field="name" required>
          <a-input v-model="addForm.name" />
        </a-form-item>
        <a-form-item label="成员端口" field="members" required>
          <a-input v-model="addForm.members" placeholder="多个端口用逗号分隔，如 eth1,eth2" />
        </a-form-item>
        <a-form-item label="模式" field="mode" required>
          <a-select v-model="addForm.mode" placeholder="请选择Bond模式">
            <a-option value="active-backup">主备模式 (active-backup)</a-option>
            <a-option value="balance-slb">负载均衡 (balance-slb)</a-option>
            <a-option value="balance-tcp">TCP负载均衡 (balance-tcp)</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:visible="showEditModal" title="编辑 Bond 端口" @ok="saveEditBond" @cancel="showEditModal = false">
      <a-form :model="editForm">
        <a-form-item label="名称" field="name" required>
          <a-input v-model="editForm.name" />
        </a-form-item>
        <a-form-item label="成员端口" field="members" required>
          <a-input v-model="editForm.members" placeholder="多个端口用逗号分隔，如 eth1,eth2" />
        </a-form-item>
        <a-form-item label="模式" field="mode" required>
          <a-select v-model="editForm.mode" placeholder="请选择Bond模式">
            <a-option value="active-backup">主备模式 (active-backup)</a-option>
            <a-option value="balance-slb">负载均衡 (balance-slb)</a-option>
            <a-option value="balance-tcp">TCP负载均衡 (balance-tcp)</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import {
  listBonds,
  addBond as apiAddBond,
  deleteBond as apiDeleteBond,
  updateBond as apiUpdateBond,
  listBondsshowall
} from '@/api/ovs/bond'

const bondList = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const addForm = reactive({
  bridge: '',
  name: '',
  members: '',
  mode: 'active-backup'
})
const editForm = ref({ name: '', members: '', mode: 'active-backup' })
let editingBondName = ''

const columns = [
  { title: 'Bond名称', dataIndex: 'name', width: '20%' },
  { title: '所属网桥', dataIndex: 'bridge', width: '20%' },
  { title: '成员端口', dataIndex: 'members', width: '30%' },
  { title: '模式', dataIndex: 'mode', width: '15%' },
  { title: '操作', slotName: 'actions', width: '15%' }
]

const fetchBonds = async () => {
  const res = await listBondsshowall()
  bondList.value = res.data?.bonds || []
}

const addBond = async () => {
  const data = {
    bridge: addForm.bridge,
    name: addForm.name,
    members: addForm.members.split(',').map(s => s.trim()).filter(Boolean),
    mode: addForm.mode
  }
  await apiAddBond(data)
  showAddModal.value = false
  Object.assign(addForm, { bridge: '', name: '', members: '', mode: 'active-backup' })
  fetchBonds()
}

const openEditModal = (record) => {
  editingBondName = record.name
  editForm.value = {
    name: record.name,
    members: Array.isArray(record.members) ? record.members.join(',') : record.members,
    mode: record.mode
  }
  showEditModal.value = true
}

const saveEditBond = async () => {
  const data = {
    oldName: editingBondName,
    name: editForm.value.name,
    members: editForm.value.members.split(',').map(s => s.trim()).filter(Boolean),
    mode: editForm.value.mode
  }
  await apiUpdateBond(data)
  showEditModal.value = false
  fetchBonds()
}

const deleteBond = async (record) => {
  await apiDeleteBond({ name: record.name })
  fetchBonds()
}

onMounted(fetchBonds)
</script>
