<template>
  <a-card title="QoS流量控制管理">
    <a-space direction="vertical" style="width: 100%">
      <!-- 选择网桥和端口 -->
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchQoS"
        >
          <a-option v-for="bridge in bridgeList" :key="bridge.name" :value="bridge.name">
            {{ bridge.name }}
          </a-option>
        </a-select>
        <a-select
          v-model="selectedPort"
          placeholder="选择端口"
          style="width: 200px"
          @change="fetchQoS"
        >
          <a-option v-for="port in portList" :key="port.name" :value="port.name">
            {{ port.name }}
          </a-option>
        </a-select>
        <a-button type="primary" @click="showAddModal = true" :disabled="!selectedPort">新增QoS</a-button>
        <a-button @click="fetchQoS" :disabled="!selectedPort">刷新</a-button>
      </a-space>

      <!-- QoS配置列表 -->
      <a-card title="QoS配置" size="small">
        <a-table :columns="qosColumns" :data="qosList" row-key="id" :pagination="false">
          <template #type="{ record }">
            <a-tag :color="getQoSTypeColor(record.type)">{{ record.type }}</a-tag>
          </template>
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="editQoS(record)">编辑</a-button>
              <a-button size="mini" @click="viewQoSDetails(record)">详情</a-button>
              <a-button size="mini" status="danger" @click="deleteQoS(record)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 队列管理 -->
      <a-card title="队列管理" size="small">
        <a-table :columns="queueColumns" :data="queueList" row-key="id" :pagination="false">
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="editQueue(record)">编辑</a-button>
              <a-button size="mini" status="danger" @click="deleteQueue(record)">删除</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 流量监控 -->
      <a-card title="流量监控" size="small">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic title="当前带宽" :value="trafficStats.bandwidth" suffix="Mbps" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="丢包率" :value="trafficStats.packetLoss" suffix="%" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="延迟" :value="trafficStats.latency" suffix="ms" />
          </a-col>
        </a-row>
      </a-card>
    </a-space>

    <!-- 新增/编辑QoS弹窗 -->
    <a-modal v-model:visible="showAddModal" :title="isEdit ? '编辑QoS' : '新增QoS'" @ok="saveQoS">
      <a-form :model="qosForm" layout="vertical">
        <a-form-item label="网桥">
          <a-input v-model="qosForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="端口">
          <a-input v-model="qosForm.port" disabled />
        </a-form-item>
        <a-form-item label="QoS类型" required>
          <a-select v-model="qosForm.type" placeholder="选择QoS类型">
            <a-option value="linux-htb">Linux HTB (分层令牌桶)</a-option>
            <a-option value="linux-hfsc">Linux HFSC (分层公平服务曲线)</a-option>
            <a-option value="linux-cbq">Linux CBQ (基于类的队列)</a-option>
            <a-option value="linux-sfq">Linux SFQ (随机公平队列)</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="最大带宽 (kbps)">
          <a-input-number v-model="qosForm.maxRate" :min="1" :max="10000000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="最小带宽保证 (kbps)">
          <a-input-number v-model="qosForm.minRate" :min="1" :max="10000000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="突发流量限制 (kbps)">
          <a-input-number v-model="qosForm.burst" :min="1" :max="10000000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="队列数量">
          <a-input-number v-model="qosForm.queueCount" :min="1" :max="10" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 新增/编辑队列弹窗 -->
    <a-modal v-model:visible="showQueueModal" :title="isEditQueue ? '编辑队列' : '新增队列'" @ok="saveQueue">
      <a-form :model="queueForm" layout="vertical">
        <a-form-item label="队列ID" required>
          <a-input-number v-model="queueForm.id" :min="0" :max="65535" style="width: 100%" />
        </a-form-item>
        <a-form-item label="队列类型">
          <a-select v-model="queueForm.type" placeholder="选择队列类型">
            <a-option value="linux-htb">Linux HTB</a-option>
            <a-option value="linux-sfq">Linux SFQ</a-option>
            <a-option value="linux-red">Linux RED</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="最大速率 (kbps)">
          <a-input-number v-model="queueForm.maxRate" :min="1" :max="10000000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="最小速率 (kbps)">
          <a-input-number v-model="queueForm.minRate" :min="1" :max="10000000" style="width: 100%" />
        </a-form-item>
        <a-form-item label="突发限制 (kbps)">
          <a-input-number v-model="queueForm.burst" :min="1" :max="10000000" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- QoS详情弹窗 -->
    <a-modal v-model:visible="showDetailsModal" title="QoS详情" width="800px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="网桥">{{ qosDetails.bridge }}</a-descriptions-item>
        <a-descriptions-item label="端口">{{ qosDetails.port }}</a-descriptions-item>
        <a-descriptions-item label="QoS类型">{{ qosDetails.type }}</a-descriptions-item>
        <a-descriptions-item label="最大带宽">{{ qosDetails.maxRate }} kbps</a-descriptions-item>
        <a-descriptions-item label="最小带宽">{{ qosDetails.minRate }} kbps</a-descriptions-item>
        <a-descriptions-item label="突发限制">{{ qosDetails.burst }} kbps</a-descriptions-item>
        <a-descriptions-item label="队列数量">{{ qosDetails.queueCount }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ qosDetails.createTime }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'

// 选择网桥和端口
const selectedBridge = ref('')
const selectedPort = ref('')
const bridgeList = ref([
  { name: 'br0' },
  { name: 'br1' },
  { name: 'br2' }
])
const portList = ref([])

// QoS配置列表
const qosList = ref([])
const qosColumns = [
  { title: '端口', dataIndex: 'port' },
  { title: 'QoS类型', slotName: 'type' },
  { title: '最大带宽', dataIndex: 'maxRate', render: ({ record }) => `${record.maxRate} kbps` },
  { title: '最小带宽', dataIndex: 'minRate', render: ({ record }) => `${record.minRate} kbps` },
  { title: '队列数', dataIndex: 'queueCount' },
  { title: '操作', slotName: 'actions', width: 200 }
]

// 队列列表
const queueList = ref([])
const queueColumns = [
  { title: '队列ID', dataIndex: 'id' },
  { title: '类型', dataIndex: 'type' },
  { title: '最大速率', dataIndex: 'maxRate', render: ({ record }) => `${record.maxRate} kbps` },
  { title: '最小速率', dataIndex: 'minRate', render: ({ record }) => `${record.minRate} kbps` },
  { title: '操作', slotName: 'actions', width: 150 }
]

// 流量统计
const trafficStats = ref({
  bandwidth: 150,
  packetLoss: 0.1,
  latency: 5
})

// 弹窗状态
const showAddModal = ref(false)
const showQueueModal = ref(false)
const showDetailsModal = ref(false)
const isEdit = ref(false)
const isEditQueue = ref(false)

// 表单数据
const qosForm = ref({
  bridge: '',
  port: '',
  type: 'linux-htb',
  maxRate: 1000000,
  minRate: 100000,
  burst: 2000000,
  queueCount: 1
})

const queueForm = ref({
  id: 0,
  type: 'linux-htb',
  maxRate: 500000,
  minRate: 100000,
  burst: 1000000
})

const qosDetails = ref({})

// 获取QoS配置
const fetchQoS = async () => {
  if (!selectedPort.value) return
  
  try {
    // 模拟数据
    qosList.value = [
      {
        id: 1,
        port: selectedPort.value,
        type: 'linux-htb',
        maxRate: 1000000,
        minRate: 100000,
        queueCount: 3
      }
    ]

    queueList.value = [
      {
        id: 0,
        type: 'linux-htb',
        maxRate: 500000,
        minRate: 100000
      },
      {
        id: 1,
        type: 'linux-sfq',
        maxRate: 300000,
        minRate: 50000
      }
    ]

    Message.success('QoS配置已加载')
  } catch (error) {
    Message.error('加载QoS配置失败')
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

// 获取QoS类型颜色
const getQoSTypeColor = (type) => {
  const colors = {
    'linux-htb': 'blue',
    'linux-hfsc': 'green',
    'linux-cbq': 'orange',
    'linux-sfq': 'purple'
  }
  return colors[type] || 'default'
}

// 新增QoS
const addQoS = () => {
  isEdit.value = false
  qosForm.value = {
    bridge: selectedBridge.value,
    port: selectedPort.value,
    type: 'linux-htb',
    maxRate: 1000000,
    minRate: 100000,
    burst: 2000000,
    queueCount: 1
  }
  showAddModal.value = true
}

// 编辑QoS
const editQoS = (record) => {
  isEdit.value = true
  qosForm.value = { ...record }
  showAddModal.value = true
}

// 保存QoS
const saveQoS = async () => {
  try {
    // 这里应该调用实际的API
    if (isEdit.value) {
      Message.success('QoS配置已更新')
    } else {
      Message.success('QoS配置已创建')
    }
    showAddModal.value = false
    fetchQoS()
  } catch (error) {
    Message.error('保存QoS配置失败')
  }
}

// 删除QoS
const deleteQoS = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success('QoS配置已删除')
    fetchQoS()
  } catch (error) {
    Message.error('删除QoS配置失败')
  }
}

// 查看QoS详情
const viewQoSDetails = (record) => {
  qosDetails.value = {
    ...record,
    createTime: '2024-01-01 10:00:00'
  }
  showDetailsModal.value = true
}

// 新增队列
const addQueue = () => {
  isEditQueue.value = false
  queueForm.value = {
    id: 0,
    type: 'linux-htb',
    maxRate: 500000,
    minRate: 100000,
    burst: 1000000
  }
  showQueueModal.value = true
}

// 编辑队列
const editQueue = (record) => {
  isEditQueue.value = true
  queueForm.value = { ...record }
  showQueueModal.value = true
}

// 保存队列
const saveQueue = async () => {
  try {
    // 这里应该调用实际的API
    if (isEditQueue.value) {
      Message.success('队列配置已更新')
    } else {
      Message.success('队列配置已创建')
    }
    showQueueModal.value = false
    fetchQoS()
  } catch (error) {
    Message.error('保存队列配置失败')
  }
}

// 删除队列
const deleteQueue = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success('队列配置已删除')
    fetchQoS()
  } catch (error) {
    Message.error('删除队列配置失败')
  }
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