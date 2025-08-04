<template>
  <a-card title="组表管理">
    <a-space direction="vertical" style="width: 100%">
      <!-- 选择网桥 -->
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchGroups"
        >
          <a-option v-for="bridge in bridgeList" :key="bridge.name" :value="bridge.name">
            {{ bridge.name }}
          </a-option>
        </a-select>
        <a-button type="primary" @click="showAddModal = true" :disabled="!selectedBridge">新增组</a-button>
        <a-button @click="fetchGroups" :disabled="!selectedBridge">刷新</a-button>
      </a-space>

      <!-- 组表列表 -->
      <a-card title="组表配置" size="small">
        <a-table :columns="groupColumns" :data="groupList" row-key="id" :pagination="false">
          <template #type="{ record }">
            <a-tag :color="getGroupTypeColor(record.type)">{{ record.type }}</a-tag>
          </template>
          <template #status="{ record }">
            <a-tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status }}
            </a-tag>
          </template>
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="editGroup(record)">编辑</a-button>
              <a-button size="mini" @click="viewGroupDetails(record)">详情</a-button>
              <a-button size="mini" @click="toggleGroup(record)">
                {{ record.status === 'active' ? '停用' : '启用' }}
              </a-button>
              <a-button size="mini" status="danger" @click="deleteGroup(record)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 组表统计 -->
      <a-card title="组表统计" size="small">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic title="总组数" :value="groupStats.total" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="活跃组" :value="groupStats.active" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="负载均衡组" :value="groupStats.loadBalance" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="故障转移组" :value="groupStats.failover" />
          </a-col>
        </a-row>
      </a-card>
    </a-space>

    <!-- 新增/编辑组弹窗 -->
    <a-modal v-model:visible="showAddModal" :title="isEdit ? '编辑组' : '新增组'" @ok="saveGroup">
      <a-form :model="groupForm" layout="vertical">
        <a-form-item label="网桥">
          <a-input v-model="groupForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="组ID" required>
          <a-input-number v-model="groupForm.id" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="组类型" required>
          <a-select v-model="groupForm.type" placeholder="选择组类型">
            <a-option value="all">All (所有端口)</a-option>
            <a-option value="select">Select (选择端口)</a-option>
            <a-option value="indirect">Indirect (间接端口)</a-option>
            <a-option value="ff">Fast Failover (快速故障转移)</a-option>
          </a-select>
        </a-form-item>
        
        <!-- 选择组配置 -->
        <template v-if="groupForm.type === 'select'">
          <a-form-item label="选择算法">
            <a-select v-model="groupForm.algorithm" placeholder="选择算法">
              <a-option value="hash">Hash (哈希)</a-option>
              <a-option value="round_robin">Round Robin (轮询)</a-option>
              <a-option value="random">Random (随机)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="选择字段">
            <a-select v-model="groupForm.fields" placeholder="选择字段" mode="multiple">
              <a-option value="in_port">入端口</a-option>
              <a-option value="dl_src">源MAC</a-option>
              <a-option value="dl_dst">目标MAC</a-option>
              <a-option value="nw_src">源IP</a-option>
              <a-option value="nw_dst">目标IP</a-option>
              <a-option value="tp_src">源端口</a-option>
              <a-option value="tp_dst">目标端口</a-option>
            </a-select>
          </a-form-item>
        </template>
        
        <!-- 快速故障转移配置 -->
        <template v-if="groupForm.type === 'ff'">
          <a-form-item label="监控端口">
            <a-select v-model="groupForm.watchPort" placeholder="选择监控端口">
              <a-option v-for="port in portList" :key="port.name" :value="port.name">
                {{ port.name }}
              </a-option>
            </a-select>
          </a-form-item>
        </template>
        
        <a-form-item label="组描述">
          <a-input v-model="groupForm.description" placeholder="请输入组描述" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 组详情弹窗 -->
    <a-modal v-model:visible="showDetailsModal" title="组详情" width="900px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="组ID">{{ groupDetails.id }}</a-descriptions-item>
        <a-descriptions-item label="组类型">{{ groupDetails.type }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ groupDetails.status }}</a-descriptions-item>
        <a-descriptions-item label="描述">{{ groupDetails.description }}</a-descriptions-item>
        <a-descriptions-item label="桶数量">{{ groupDetails.bucketCount }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ groupDetails.createTime }}</a-descriptions-item>
      </a-descriptions>
      
      <!-- 桶列表 -->
      <a-card title="桶配置" size="small" style="margin-top: 16px">
        <a-table :columns="bucketColumns" :data="bucketList" row-key="id" :pagination="false">
          <template #status="{ record }">
            <a-tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status }}
            </a-tag>
          </template>
        </a-table>
      </a-card>
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

// 组表列表
const groupList = ref([])
const groupColumns = [
  { title: '组ID', dataIndex: 'id' },
  { title: '组类型', slotName: 'type' },
  { title: '描述', dataIndex: 'description' },
  { title: '桶数量', dataIndex: 'bucketCount' },
  { title: '状态', slotName: 'status' },
  { title: '操作', slotName: 'actions', width: 250 }
]

// 桶列表
const bucketList = ref([])
const bucketColumns = [
  { title: '桶ID', dataIndex: 'id' },
  { title: '动作', dataIndex: 'actions' },
  { title: '权重', dataIndex: 'weight' },
  { title: '状态', slotName: 'status' }
]

// 组表统计
const groupStats = ref({
  total: 5,
  active: 4,
  loadBalance: 2,
  failover: 1
})

// 弹窗状态
const showAddModal = ref(false)
const showDetailsModal = ref(false)
const isEdit = ref(false)

// 表单数据
const groupForm = ref({
  bridge: '',
  id: 1,
  type: 'all',
  algorithm: 'hash',
  fields: [],
  watchPort: '',
  description: ''
})

const groupDetails = ref({})

// 获取组表配置
const fetchGroups = async () => {
  if (!selectedBridge.value) return
  
  try {
    // 模拟数据
    groupList.value = [
      {
        id: 1,
        type: 'all',
        description: '所有端口组',
        bucketCount: 1,
        status: 'active'
      },
      {
        id: 2,
        type: 'select',
        description: '负载均衡组',
        bucketCount: 3,
        status: 'active'
      },
      {
        id: 3,
        type: 'ff',
        description: '故障转移组',
        bucketCount: 2,
        status: 'active'
      },
      {
        id: 4,
        type: 'indirect',
        description: '间接端口组',
        bucketCount: 1,
        status: 'inactive'
      }
    ]

    Message.success('组表配置已加载')
  } catch (error) {
    Message.error('加载组表配置失败')
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
      { name: 'patch0' }
    ]
  } catch (error) {
    Message.error('加载端口列表失败')
  }
}

// 获取组类型颜色
const getGroupTypeColor = (type) => {
  const colors = {
    'all': 'blue',
    'select': 'green',
    'indirect': 'orange',
    'ff': 'red'
  }
  return colors[type] || 'default'
}

// 新增组
const addGroup = () => {
  isEdit.value = false
  groupForm.value = {
    bridge: selectedBridge.value,
    id: 1,
    type: 'all',
    algorithm: 'hash',
    fields: [],
    watchPort: '',
    description: ''
  }
  showAddModal.value = true
}

// 编辑组
const editGroup = (record) => {
  isEdit.value = true
  groupForm.value = { ...record }
  showAddModal.value = true
}

// 保存组
const saveGroup = async () => {
  try {
    // 这里应该调用实际的API
    if (isEdit.value) {
      Message.success('组配置已更新')
    } else {
      Message.success('组配置已创建')
    }
    showAddModal.value = false
    fetchGroups()
  } catch (error) {
    Message.error('保存组配置失败')
  }
}

// 删除组
const deleteGroup = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success('组配置已删除')
    fetchGroups()
  } catch (error) {
    Message.error('删除组配置失败')
  }
}

// 切换组状态
const toggleGroup = async (record) => {
  try {
    // 这里应该调用实际的API
    const newStatus = record.status === 'active' ? 'inactive' : 'active'
    Message.success(`组已${newStatus === 'active' ? '启用' : '停用'}`)
    fetchGroups()
  } catch (error) {
    Message.error('切换组状态失败')
  }
}

// 查看组详情
const viewGroupDetails = (record) => {
  groupDetails.value = {
    ...record,
    createTime: '2024-01-01 10:00:00'
  }
  
  // 模拟桶数据
  bucketList.value = [
    {
      id: 0,
      actions: 'output:1',
      weight: 100,
      status: 'active'
    },
    {
      id: 1,
      actions: 'output:2',
      weight: 100,
      status: 'active'
    }
  ]
  
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