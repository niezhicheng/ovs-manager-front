<template>
  <a-card title="端口镜像管理">
    <a-space direction="vertical" style="width: 100%">
      <!-- 选择网桥 -->
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchMirrors"
        >
          <a-option v-for="bridge in bridgeList" :key="bridge.name" :value="bridge.name">
            {{ bridge.name }}
          </a-option>
        </a-select>
        <a-button type="primary" @click="showAddModal = true" :disabled="!selectedBridge">新增镜像</a-button>
        <a-button @click="fetchMirrors" :disabled="!selectedBridge">刷新</a-button>
      </a-space>

      <!-- 镜像配置列表 -->
      <a-card title="镜像配置" size="small">
        <a-table :columns="mirrorColumns" :data="mirrorList" row-key="id" :pagination="false">
          <template #status="{ record }">
            <a-tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status }}
            </a-tag>
          </template>
          <template #type="{ record }">
            <a-tag :color="getMirrorTypeColor(record.type)">{{ record.type }}</a-tag>
          </template>
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="editMirror(record)">编辑</a-button>
              <a-button size="mini" @click="viewMirrorDetails(record)">详情</a-button>
              <a-button size="mini" @click="toggleMirror(record)">
                {{ record.status === 'active' ? '停用' : '启用' }}
              </a-button>
              <a-button size="mini" status="danger" @click="deleteMirror(record)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 镜像统计 -->
      <a-card title="镜像统计" size="small">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic title="活跃镜像" :value="mirrorStats.active" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="总镜像流量" :value="mirrorStats.totalTraffic" suffix="MB" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="镜像端口数" :value="mirrorStats.portCount" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="平均延迟" :value="mirrorStats.avgLatency" suffix="ms" />
          </a-col>
        </a-row>
      </a-card>
    </a-space>

    <!-- 新增/编辑镜像弹窗 -->
    <a-modal v-model:visible="showAddModal" :title="isEdit ? '编辑镜像' : '新增镜像'" @ok="saveMirror">
      <a-form :model="mirrorForm" layout="vertical">
        <a-form-item label="网桥">
          <a-input v-model="mirrorForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="镜像名称" required>
          <a-input v-model="mirrorForm.name" placeholder="请输入镜像名称" />
        </a-form-item>
        <a-form-item label="镜像类型" required>
          <a-select v-model="mirrorForm.type" placeholder="选择镜像类型">
            <a-option value="select_all">镜像所有流量</a-option>
            <a-option value="select_src_port">镜像源端口流量</a-option>
            <a-option value="select_dst_port">镜像目标端口流量</a-option>
            <a-option value="select_vlan">镜像指定VLAN流量</a-option>
          </a-select>
        </a-form-item>
        
        <!-- 源端口选择 -->
        <a-form-item label="源端口" v-if="mirrorForm.type === 'select_src_port'">
          <a-select v-model="mirrorForm.srcPort" placeholder="选择源端口" mode="multiple">
            <a-option v-for="port in portList" :key="port.name" :value="port.name">
              {{ port.name }}
            </a-option>
          </a-select>
        </a-form-item>
        
        <!-- 目标端口选择 -->
        <a-form-item label="目标端口" v-if="mirrorForm.type === 'select_dst_port'">
          <a-select v-model="mirrorForm.dstPort" placeholder="选择目标端口" mode="multiple">
            <a-option v-for="port in portList" :key="port.name" :value="port.name">
              {{ port.name }}
            </a-option>
          </a-select>
        </a-form-item>
        
        <!-- VLAN选择 -->
        <a-form-item label="VLAN ID" v-if="mirrorForm.type === 'select_vlan'">
          <a-input-number v-model="mirrorForm.vlanId" :min="1" :max="4094" style="width: 100%" />
        </a-form-item>
        
        <a-form-item label="输出端口" required>
          <a-select v-model="mirrorForm.outputPort" placeholder="选择输出端口">
            <a-option v-for="port in portList" :key="port.name" :value="port.name">
              {{ port.name }}
            </a-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="采样率">
          <a-input-number v-model="mirrorForm.sampling" :min="1" :max="100" style="width: 100%" />
          <div style="color: #666; font-size: 12px; margin-top: 4px;">
            1表示镜像所有流量，2表示镜像50%流量，以此类推
          </div>
        </a-form-item>
        
        <a-form-item label="最大队列长度">
          <a-input-number v-model="mirrorForm.maxLength" :min="1" :max="10000" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 镜像详情弹窗 -->
    <a-modal v-model:visible="showDetailsModal" title="镜像详情" width="800px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="镜像名称">{{ mirrorDetails.name }}</a-descriptions-item>
        <a-descriptions-item label="网桥">{{ mirrorDetails.bridge }}</a-descriptions-item>
        <a-descriptions-item label="镜像类型">{{ mirrorDetails.type }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ mirrorDetails.status }}</a-descriptions-item>
        <a-descriptions-item label="输出端口">{{ mirrorDetails.outputPort }}</a-descriptions-item>
        <a-descriptions-item label="采样率">{{ mirrorDetails.sampling }}</a-descriptions-item>
        <a-descriptions-item label="最大队列长度">{{ mirrorDetails.maxLength }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ mirrorDetails.createTime }}</a-descriptions-item>
        <a-descriptions-item label="镜像流量">{{ mirrorDetails.mirroredTraffic }} MB</a-descriptions-item>
        <a-descriptions-item label="镜像包数">{{ mirrorDetails.mirroredPackets }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'

// 选择网桥
const selectedBridge = ref('')
const bridgeList = ref([
  { name: 'br0' },
  { name: 'br1' },
  { name: 'br2' }
])
const portList = ref([])

// 镜像配置列表
const mirrorList = ref([])
const mirrorColumns = [
  { title: '镜像名称', dataIndex: 'name' },
  { title: '镜像类型', slotName: 'type' },
  { title: '输出端口', dataIndex: 'outputPort' },
  { title: '采样率', dataIndex: 'sampling' },
  { title: '状态', slotName: 'status' },
  { title: '镜像流量', dataIndex: 'mirroredTraffic', render: ({ record }) => `${record.mirroredTraffic} MB` },
  { title: '操作', slotName: 'actions', width: 250 }
]

// 镜像统计
const mirrorStats = ref({
  active: 3,
  totalTraffic: 1024,
  portCount: 5,
  avgLatency: 2.5
})

// 弹窗状态
const showAddModal = ref(false)
const showDetailsModal = ref(false)
const isEdit = ref(false)

// 表单数据
const mirrorForm = ref({
  bridge: '',
  name: '',
  type: 'select_all',
  srcPort: [],
  dstPort: [],
  vlanId: 100,
  outputPort: '',
  sampling: 1,
  maxLength: 1000
})

const mirrorDetails = ref({})

// 获取镜像配置
const fetchMirrors = async () => {
  if (!selectedBridge.value) return
  
  try {
    // 模拟数据
    mirrorList.value = [
      {
        id: 1,
        name: 'mirror_all',
        type: 'select_all',
        outputPort: 'mirror_port',
        sampling: 1,
        status: 'active',
        mirroredTraffic: 512
      },
      {
        id: 2,
        name: 'mirror_eth0',
        type: 'select_src_port',
        outputPort: 'monitor_port',
        sampling: 2,
        status: 'active',
        mirroredTraffic: 256
      },
      {
        id: 3,
        name: 'mirror_vlan100',
        type: 'select_vlan',
        outputPort: 'vlan_monitor',
        sampling: 1,
        status: 'inactive',
        mirroredTraffic: 128
      }
    ]

    Message.success('镜像配置已加载')
  } catch (error) {
    Message.error('加载镜像配置失败')
  }
}

// 获取端口列表
const fetchPorts = async () => {
  if (!selectedBridge.value) return
  
  try {
    portList.value = [
      { name: 'eth0' },
      { name: 'eth1' },
      { name: 'vxlan0' },
      { name: 'patch0' },
      { name: 'mirror_port' },
      { name: 'monitor_port' },
      { name: 'vlan_monitor' }
    ]
  } catch (error) {
    Message.error('加载端口列表失败')
  }
}

// 获取镜像类型颜色
const getMirrorTypeColor = (type) => {
  const colors = {
    'select_all': 'blue',
    'select_src_port': 'green',
    'select_dst_port': 'orange',
    'select_vlan': 'purple'
  }
  return colors[type] || 'default'
}

// 新增镜像
const addMirror = () => {
  isEdit.value = false
  mirrorForm.value = {
    bridge: selectedBridge.value,
    name: '',
    type: 'select_all',
    srcPort: [],
    dstPort: [],
    vlanId: 100,
    outputPort: '',
    sampling: 1,
    maxLength: 1000
  }
  showAddModal.value = true
}

// 编辑镜像
const editMirror = (record) => {
  isEdit.value = true
  mirrorForm.value = { ...record }
  showAddModal.value = true
}

// 保存镜像
const saveMirror = async () => {
  try {
    // 这里应该调用实际的API
    if (isEdit.value) {
      Message.success('镜像配置已更新')
    } else {
      Message.success('镜像配置已创建')
    }
    showAddModal.value = false
    fetchMirrors()
  } catch (error) {
    Message.error('保存镜像配置失败')
  }
}

// 删除镜像
const deleteMirror = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success('镜像配置已删除')
    fetchMirrors()
  } catch (error) {
    Message.error('删除镜像配置失败')
  }
}

// 切换镜像状态
const toggleMirror = async (record) => {
  try {
    // 这里应该调用实际的API
    const newStatus = record.status === 'active' ? 'inactive' : 'active'
    Message.success(`镜像已${newStatus === 'active' ? '启用' : '停用'}`)
    fetchMirrors()
  } catch (error) {
    Message.error('切换镜像状态失败')
  }
}

// 查看镜像详情
const viewMirrorDetails = (record) => {
  mirrorDetails.value = {
    ...record,
    createTime: '2024-01-01 10:00:00',
    mirroredPackets: 1000000
  }
  showDetailsModal.value = true
}

onMounted(() => {
  if (bridgeList.value.length > 0) {
    selectedBridge.value = bridgeList.value[0].name
    fetchPorts()
  }
})
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}
</style> 