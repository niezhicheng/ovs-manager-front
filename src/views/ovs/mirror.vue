<template>
  <a-card title="镜像管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-select v-model="currentBridge" placeholder="请选择交换机" style="width: 200px" @change="fetchMirrors">
          <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">{{ item.name }}</a-option>
        </a-select>
        <a-button type="primary" @click="showAddModal = true" :disabled="!currentBridge">新增镜像</a-button>
        <a-button @click="fetchMirrors" :disabled="!currentBridge">刷新</a-button>
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
        <a-form-item label="名称" field="name" required>
          <a-input v-model="addForm.name" />
        </a-form-item>
        <a-form-item label="源端口" field="selectSrcPorts">
          <a-input v-model="addForm.selectSrcPorts" placeholder="多个用逗号分隔" />
        </a-form-item>
        <a-form-item label="目的端口" field="selectDstPorts">
          <a-input v-model="addForm.selectDstPorts" placeholder="多个用逗号分隔" />
        </a-form-item>
        <a-form-item label="VLAN" field="selectVlan">
          <a-input-number v-model="addForm.selectVlan" :min="1" :max="4094" style="width: 100%" />
        </a-form-item>
        <a-form-item label="输出端口" field="outputPort">
          <a-input v-model="addForm.outputPort" />
        </a-form-item>
        <a-form-item label="输出VLAN" field="outputVlan">
          <a-input-number v-model="addForm.outputVlan" :min="1" :max="4094" style="width: 100%" />
        </a-form-item>
        <a-form-item label="全选" field="selectAll">
          <a-switch v-model="addForm.selectAll" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { listMirrors, addMirror as apiAddMirror, deleteMirror as apiDeleteMirror } from '@/api/ovs/mirror'
import { listBridges } from '@/api/ovs/bridge'

const bridgeList = ref([])
const currentBridge = ref('')
const mirrorList = ref([])
const showAddModal = ref(false)
const addForm = ref({
  name: '',
  selectSrcPorts: '',
  selectDstPorts: '',
  selectVlan: undefined,
  outputPort: '',
  outputVlan: undefined,
  selectAll: false
})

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '源端口', dataIndex: 'selectSrcPorts' },
  { title: '目的端口', dataIndex: 'selectDstPorts' },
  { title: 'VLAN', dataIndex: 'selectVlan' },
  { title: '输出端口', dataIndex: 'outputPort' },
  { title: '输出VLAN', dataIndex: 'outputVlan' },
  { title: '全选', dataIndex: 'selectAll', render: val => val ? '是' : '否' },
  { title: '操作', slotName: 'actions' }
]

const fetchBridgeList = async () => {
  const res = await listBridges()
  bridgeList.value = res.data?.bridges?.map(b => (typeof b === 'string' ? { name: b } : b)) || []
  if (bridgeList.value.length > 0) {
    currentBridge.value = bridgeList.value[0].name
  } else {
    currentBridge.value = ''
  }
}

function parseMirrorOutput(output) {
  // 解析 ovs-vsctl list Mirror 的原始字符串为对象数组
  if (!output) return []
  const mirrors = []
  const blocks = output.split(/\n(?=name)/).filter(Boolean)
  for (const block of blocks) {
    const obj = {}
    block.split('\n').forEach(line => {
      const [k, ...rest] = line.split(':')
      if (!k || rest.length === 0) return
      const key = k.trim()
      const value = rest.join(':').trim()
      obj[key] = value
    })
    // 兼容表格字段
    obj.name = obj['name'] || ''
    obj.selectSrcPorts = obj['select_src_port'] || ''
    obj.selectDstPorts = obj['select_dst_port'] || ''
    obj.selectVlan = obj['select_vlan'] || ''
    obj.outputPort = obj['output_port'] || ''
    obj.outputVlan = obj['output_vlan'] || ''
    obj.selectAll = obj['select_all'] === 'true'
    mirrors.push(obj)
  }
  return mirrors
}

const fetchMirrors = async () => {
  if (!currentBridge.value) return
  const res = await listMirrors({ bridge: currentBridge.value })
  mirrorList.value = parseMirrorOutput(res.data?.output)
}

const addMirror = async () => {
  const data = {
    bridge: currentBridge.value,
    name: addForm.value.name,
    selectSrcPorts: addForm.value.selectSrcPorts ? addForm.value.selectSrcPorts.split(',').map(s => s.trim()).filter(Boolean) : [],
    selectDstPorts: addForm.value.selectDstPorts ? addForm.value.selectDstPorts.split(',').map(s => s.trim()).filter(Boolean) : [],
    selectVlan: addForm.value.selectVlan,
    outputPort: addForm.value.outputPort,
    outputVlan: addForm.value.outputVlan,
    selectAll: addForm.value.selectAll
  }
  await apiAddMirror(data)
  showAddModal.value = false
  addForm.value = { name: '', selectSrcPorts: '', selectDstPorts: '', selectVlan: undefined, outputPort: '', outputVlan: undefined, selectAll: false }
  fetchMirrors()
}

const deleteMirror = async (record) => {
  await apiDeleteMirror({ bridge: currentBridge.value, name: record.name })
  fetchMirrors()
}

watch(bridgeList, (newList) => {
  if (newList.length > 0 && !currentBridge.value) {
    currentBridge.value = newList[0].name
    fetchMirrors()
  }
})

onMounted(() => {
  fetchBridgeList().then(fetchMirrors)
})
</script>
