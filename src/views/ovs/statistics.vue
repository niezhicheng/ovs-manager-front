<template>
  <a-card title="OVS统计信息">
    <a-space direction="vertical" style="width: 100%">
      <!-- 选择网桥 -->
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchStatistics"
        >
          <a-option v-for="bridge in bridgeList" :key="bridge.name" :value="bridge.name">
            {{ bridge.name }}
          </a-option>
        </a-select>
        <a-button @click="fetchStatistics" :disabled="!selectedBridge">刷新统计</a-button>
        <a-button @click="startMonitoring" :disabled="!selectedBridge || isMonitoring">开始监控</a-button>
        <a-button @click="stopMonitoring" :disabled="!isMonitoring">停止监控</a-button>
      </a-space>

      <!-- 总体统计 -->
      <a-card title="总体统计" size="small">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic title="总端口数" :value="overallStats.totalPorts" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="活跃端口" :value="overallStats.activePorts" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="流表规则数" :value="overallStats.totalFlows" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="总流量" :value="overallStats.totalTraffic" suffix="MB/s" />
          </a-col>
        </a-row>
      </a-card>

      <!-- 端口统计 -->
      <a-card title="端口统计" size="small">
        <a-table :columns="portColumns" :data="portStats" row-key="name" :pagination="false">
          <template #status="{ record }">
            <a-tag :color="record.status === 'up' ? 'green' : 'red'">
              {{ record.status }}
            </a-tag>
          </template>
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="viewPortDetails(record)">详情</a-button>
              <a-button size="mini" @click="resetPortStats(record)">重置统计</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 流表统计 -->
      <a-card title="流表统计" size="small">
        <a-table :columns="flowColumns" :data="flowStats" row-key="id" :pagination="false">
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="viewFlowDetails(record)">详情</a-button>
              <a-button size="mini" @click="resetFlowStats(record)">重置统计</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 性能监控图表 -->
      <a-card title="性能监控" size="small">
        <a-row :gutter="16">
          <a-col :span="12">
            <div ref="trafficChart" style="height: 300px;"></div>
          </a-col>
          <a-col :span="12">
            <div ref="packetChart" style="height: 300px;"></div>
          </a-col>
        </a-row>
      </a-card>

      <!-- 队列统计 -->
      <a-card title="队列统计" size="small">
        <a-table :columns="queueColumns" :data="queueStats" row-key="id" :pagination="false">
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="viewQueueDetails(record)">详情</a-button>
              <a-button size="mini" @click="resetQueueStats(record)">重置统计</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>
    </a-space>

    <!-- 端口详情弹窗 -->
    <a-modal v-model:visible="showPortModal" :title="`端口详情 - ${currentPort}`" width="800px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="端口名称">{{ portDetails.name }}</a-descriptions-item>
        <a-descriptions-item label="端口类型">{{ portDetails.type }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ portDetails.status }}</a-descriptions-item>
        <a-descriptions-item label="MAC地址">{{ portDetails.mac }}</a-descriptions-item>
        <a-descriptions-item label="接收包数">{{ portDetails.rxPackets }}</a-descriptions-item>
        <a-descriptions-item label="发送包数">{{ portDetails.txPackets }}</a-descriptions-item>
        <a-descriptions-item label="接收字节">{{ portDetails.rxBytes }}</a-descriptions-item>
        <a-descriptions-item label="发送字节">{{ portDetails.txBytes }}</a-descriptions-item>
        <a-descriptions-item label="接收错误">{{ portDetails.rxErrors }}</a-descriptions-item>
        <a-descriptions-item label="发送错误">{{ portDetails.txErrors }}</a-descriptions-item>
        <a-descriptions-item label="接收丢包">{{ portDetails.rxDropped }}</a-descriptions-item>
        <a-descriptions-item label="发送丢包">{{ portDetails.txDropped }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <!-- 流表详情弹窗 -->
    <a-modal v-model:visible="showFlowModal" :title="`流表详情 - ${currentFlow}`" width="900px" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="流表规则">{{ flowDetails.rule }}</a-descriptions-item>
        <a-descriptions-item label="优先级">{{ flowDetails.priority }}</a-descriptions-item>
        <a-descriptions-item label="匹配包数">{{ flowDetails.packets }}</a-descriptions-item>
        <a-descriptions-item label="匹配字节">{{ flowDetails.bytes }}</a-descriptions-item>
        <a-descriptions-item label="持续时间">{{ flowDetails.duration }}</a-descriptions-item>
        <a-descriptions-item label="空闲超时">{{ flowDetails.idleTimeout }}</a-descriptions-item>
        <a-descriptions-item label="硬超时">{{ flowDetails.hardTimeout }}</a-descriptions-item>
        <a-descriptions-item label="动作">{{ flowDetails.actions }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'

// 选择网桥
const selectedBridge = ref('')
const bridgeList = ref([
  { name: 'br0' },
  { name: 'br1' },
  { name: 'br2' }
])

// 监控状态
const isMonitoring = ref(false)
let monitoringInterval = null

// 总体统计
const overallStats = ref({
  totalPorts: 0,
  activePorts: 0,
  totalFlows: 0,
  totalTraffic: 0
})

// 端口统计
const portStats = ref([])
const portColumns = [
  { title: '端口名称', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '状态', slotName: 'status' },
  { title: '接收包数', dataIndex: 'rxPackets' },
  { title: '发送包数', dataIndex: 'txPackets' },
  { title: '接收字节', dataIndex: 'rxBytes' },
  { title: '发送字节', dataIndex: 'txBytes' },
  { title: '操作', slotName: 'actions', width: 150 }
]

// 流表统计
const flowStats = ref([])
const flowColumns = [
  { title: '流表规则', dataIndex: 'rule', width: '40%' },
  { title: '优先级', dataIndex: 'priority' },
  { title: '匹配包数', dataIndex: 'packets' },
  { title: '匹配字节', dataIndex: 'bytes' },
  { title: '持续时间', dataIndex: 'duration' },
  { title: '操作', slotName: 'actions', width: 150 }
]

// 队列统计
const queueStats = ref([])
const queueColumns = [
  { title: '队列ID', dataIndex: 'id' },
  { title: '队列类型', dataIndex: 'type' },
  { title: '传输包数', dataIndex: 'txPackets' },
  { title: '传输字节', dataIndex: 'txBytes' },
  { title: '丢弃包数', dataIndex: 'dropped' },
  { title: '操作', slotName: 'actions', width: 150 }
]

// 弹窗状态
const showPortModal = ref(false)
const showFlowModal = ref(false)
const currentPort = ref('')
const currentFlow = ref('')
const portDetails = ref({})
const flowDetails = ref({})

// 图表引用
const trafficChart = ref(null)
const packetChart = ref(null)

// 获取统计信息
const fetchStatistics = async () => {
  if (!selectedBridge.value) return
  
  try {
    // 模拟数据
    overallStats.value = {
      totalPorts: 5,
      activePorts: 4,
      totalFlows: 25,
      totalTraffic: 150
    }

    portStats.value = [
      {
        name: 'eth0',
        type: 'system',
        status: 'up',
        rxPackets: 1000000,
        txPackets: 950000,
        rxBytes: 500000000,
        txBytes: 480000000
      },
      {
        name: 'vxlan0',
        type: 'vxlan',
        status: 'up',
        rxPackets: 500000,
        txPackets: 480000,
        rxBytes: 250000000,
        txBytes: 240000000
      }
    ]

    flowStats.value = [
      {
        id: 1,
        rule: 'table=0, priority=100, ip, actions=NORMAL',
        priority: 100,
        packets: 500000,
        bytes: 250000000,
        duration: '00:05:30'
      },
      {
        id: 2,
        rule: 'table=0, priority=200, arp, actions=NORMAL',
        priority: 200,
        packets: 10000,
        bytes: 5000000,
        duration: '00:02:15'
      }
    ]

    queueStats.value = [
      {
        id: 1,
        type: 'linux-htb',
        txPackets: 100000,
        txBytes: 50000000,
        dropped: 100
      }
    ]

    Message.success('统计信息已更新')
  } catch (error) {
    Message.error('获取统计信息失败')
  }
}

// 开始监控
const startMonitoring = () => {
  isMonitoring.value = true
  monitoringInterval = setInterval(() => {
    fetchStatistics()
  }, 5000) // 每5秒更新一次
  Message.success('开始实时监控')
}

// 停止监控
const stopMonitoring = () => {
  isMonitoring.value = false
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
  Message.success('停止监控')
}

// 查看端口详情
const viewPortDetails = (record) => {
  currentPort.value = record.name
  portDetails.value = {
    name: record.name,
    type: record.type,
    status: record.status,
    mac: '00:15:5d:01:ca:05',
    rxPackets: record.rxPackets,
    txPackets: record.txPackets,
    rxBytes: record.rxBytes,
    txBytes: record.txBytes,
    rxErrors: 0,
    txErrors: 0,
    rxDropped: 0,
    txDropped: 0
  }
  showPortModal.value = true
}

// 重置端口统计
const resetPortStats = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success(`端口 ${record.name} 统计已重置`)
    fetchStatistics()
  } catch (error) {
    Message.error('重置统计失败')
  }
}

// 查看流表详情
const viewFlowDetails = (record) => {
  currentFlow.value = record.rule
  flowDetails.value = {
    rule: record.rule,
    priority: record.priority,
    packets: record.packets,
    bytes: record.bytes,
    duration: record.duration,
    idleTimeout: 0,
    hardTimeout: 0,
    actions: 'NORMAL'
  }
  showFlowModal.value = true
}

// 重置流表统计
const resetFlowStats = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success('流表统计已重置')
    fetchStatistics()
  } catch (error) {
    Message.error('重置统计失败')
  }
}

// 查看队列详情
const viewQueueDetails = (record) => {
  // 实现队列详情查看
  Message.info('队列详情功能开发中')
}

// 重置队列统计
const resetQueueStats = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success(`队列 ${record.id} 统计已重置`)
    fetchStatistics()
  } catch (error) {
    Message.error('重置统计失败')
  }
}

onMounted(() => {
  if (bridgeList.value.length > 0) {
    selectedBridge.value = bridgeList.value[0].name
    fetchStatistics()
  }
})

onUnmounted(() => {
  stopMonitoring()
})
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}
</style> 