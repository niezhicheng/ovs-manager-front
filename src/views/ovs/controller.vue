<template>
  <a-card title="OVS控制器管理">
    <a-space direction="vertical" style="width: 100%">
      <!-- 控制器状态 -->
      <a-card title="控制器状态" size="small">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic 
              title="控制器状态" 
              :value="controllerStatus.status" 
              :value-style="{ color: controllerStatus.status === 'connected' ? '#52c41a' : '#ff4d4f' }" 
            />
          </a-col>
          <a-col :span="6">
            <a-statistic title="协议版本" :value="controllerStatus.protocol" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="连接数" :value="controllerStatus.connections" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="最后连接" :value="controllerStatus.lastSeen" />
          </a-col>
        </a-row>
        <a-space style="margin-top: 16px">
          <a-button @click="refreshStatus">刷新状态</a-button>
          <a-button @click="disconnectController">断开连接</a-button>
          <a-button @click="reconnectController">重新连接</a-button>
        </a-space>
      </a-card>

      <!-- 控制器配置 -->
      <a-card title="控制器配置" size="small">
        <a-form :model="controllerConfig" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="控制器地址">
                <a-input v-model="controllerConfig.address" placeholder="例如: tcp:192.168.1.100:6633" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="协议版本">
                <a-select v-model="controllerConfig.protocol" placeholder="选择协议版本">
                  <a-option value="OpenFlow10">OpenFlow 1.0</a-option>
                  <a-option value="OpenFlow11">OpenFlow 1.1</a-option>
                  <a-option value="OpenFlow12">OpenFlow 1.2</a-option>
                  <a-option value="OpenFlow13">OpenFlow 1.3</a-option>
                  <a-option value="OpenFlow14">OpenFlow 1.4</a-option>
                  <a-option value="OpenFlow15">OpenFlow 1.5</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="连接模式">
                <a-select v-model="controllerConfig.mode" placeholder="选择连接模式">
                  <a-option value="standalone">独立模式</a-option>
                  <a-option value="in-band">带内模式</a-option>
                  <a-option value="out-of-band">带外模式</a-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="重连间隔 (秒)">
                <a-input-number v-model="controllerConfig.reconnectInterval" :min="1" :max="300" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="最大重连次数">
                <a-input-number v-model="controllerConfig.maxReconnects" :min="0" :max="100" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="心跳间隔 (秒)">
                <a-input-number v-model="controllerConfig.heartbeatInterval" :min="1" :max="60" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-space>
            <a-button type="primary" @click="applyConfig">应用配置</a-button>
            <a-button @click="resetConfig">重置配置</a-button>
            <a-button @click="testConnection">测试连接</a-button>
          </a-space>
        </a-form>
      </a-card>

      <!-- 网桥控制器配置 -->
      <a-card title="网桥控制器配置" size="small">
        <a-space direction="vertical" style="width: 100%">
          <a-space>
            <a-select v-model="selectedBridge" placeholder="选择网桥" style="width: 200px">
              <a-option v-for="bridge in bridgeList" :key="bridge.name" :value="bridge.name">
                {{ bridge.name }}
              </a-option>
            </a-select>
            <a-button @click="fetchBridgeControllers" :disabled="!selectedBridge">查看配置</a-button>
          </a-space>
          
          <a-table :columns="bridgeControllerColumns" :data="bridgeControllers" row-key="id" :pagination="false">
            <template #status="{ record }">
              <a-tag :color="record.status === 'connected' ? 'green' : 'red'">
                {{ record.status }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-space>
                <a-button size="mini" @click="editBridgeController(record)">编辑</a-button>
                <a-button size="mini" status="danger" @click="removeBridgeController(record)">移除</a-button>
              </a-space>
            </template>
          </a-table>
        </a-space>
      </a-card>

      <!-- 控制器事件日志 -->
      <a-card title="控制器事件日志" size="small">
        <a-space direction="vertical" style="width: 100%">
          <a-space>
            <a-button @click="clearLogs">清空日志</a-button>
            <a-button @click="exportLogs">导出日志</a-button>
            <a-switch v-model="autoScroll" /> 自动滚动
          </a-space>
          <a-textarea 
            v-model="eventLogs" 
            :rows="10" 
            placeholder="控制器事件日志" 
            readonly 
            ref="logTextarea"
          />
        </a-space>
      </a-card>

      <!-- 控制器功能测试 -->
      <a-card title="控制器功能测试" size="small">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-card title="流表操作" size="small">
              <a-space direction="vertical" style="width: 100%">
                <a-button @click="testAddFlow">测试添加流表</a-button>
                <a-button @click="testDeleteFlow">测试删除流表</a-button>
                <a-button @click="testModifyFlow">测试修改流表</a-button>
              </a-space>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card title="端口操作" size="small">
              <a-space direction="vertical" style="width: 100%">
                <a-button @click="testPortUp">测试端口启用</a-button>
                <a-button @click="testPortDown">测试端口禁用</a-button>
                <a-button @click="testPortConfig">测试端口配置</a-button>
              </a-space>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card title="统计查询" size="small">
              <a-space direction="vertical" style="width: 100%">
                <a-button @click="testFlowStats">测试流表统计</a-button>
                <a-button @click="testPortStats">测试端口统计</a-button>
                <a-button @click="testGroupStats">测试组统计</a-button>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </a-card>
    </a-space>

    <!-- 编辑网桥控制器弹窗 -->
    <a-modal v-model:visible="showEditModal" title="编辑网桥控制器" @ok="saveBridgeController">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="网桥名称">
          <a-input v-model="editForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="控制器地址" required>
          <a-input v-model="editForm.controller" placeholder="例如: tcp:192.168.1.100:6633" />
        </a-form-item>
        <a-form-item label="协议版本">
          <a-select v-model="editForm.protocol" placeholder="选择协议版本">
            <a-option value="OpenFlow13">OpenFlow 1.3</a-option>
            <a-option value="OpenFlow14">OpenFlow 1.4</a-option>
            <a-option value="OpenFlow15">OpenFlow 1.5</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="连接模式">
          <a-select v-model="editForm.mode" placeholder="选择连接模式">
            <a-option value="standalone">独立模式</a-option>
            <a-option value="in-band">带内模式</a-option>
            <a-option value="out-of-band">带外模式</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Message } from '@arco-design/web-vue'

// 控制器状态
const controllerStatus = ref({
  status: 'connected',
  protocol: 'OpenFlow13',
  connections: 2,
  lastSeen: '2024-01-01 10:30:00'
})

// 控制器配置
const controllerConfig = ref({
  address: 'tcp:192.168.1.100:6633',
  protocol: 'OpenFlow13',
  mode: 'standalone',
  reconnectInterval: 30,
  maxReconnects: 10,
  heartbeatInterval: 15
})

// 网桥列表
const selectedBridge = ref('')
const bridgeList = ref([
  { name: 'br0' },
  { name: 'br1' },
  { name: 'br2' }
])

// 网桥控制器配置
const bridgeControllers = ref([])
const bridgeControllerColumns = [
  { title: '网桥', dataIndex: 'bridge' },
  { title: '控制器地址', dataIndex: 'controller' },
  { title: '协议版本', dataIndex: 'protocol' },
  { title: '连接模式', dataIndex: 'mode' },
  { title: '状态', slotName: 'status' },
  { title: '操作', slotName: 'actions', width: 150 }
]

// 事件日志
const eventLogs = ref('')
const autoScroll = ref(true)
const logTextarea = ref(null)

// 编辑弹窗
const showEditModal = ref(false)
const editForm = ref({
  bridge: '',
  controller: '',
  protocol: 'OpenFlow13',
  mode: 'standalone'
})

// 刷新状态
const refreshStatus = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('状态已刷新')
  } catch (error) {
    Message.error('刷新状态失败')
  }
}

// 断开连接
const disconnectController = async () => {
  try {
    // 这里应该调用实际的API
    controllerStatus.value.status = 'disconnected'
    Message.success('控制器已断开')
    addLog('控制器连接已断开')
  } catch (error) {
    Message.error('断开连接失败')
  }
}

// 重新连接
const reconnectController = async () => {
  try {
    // 这里应该调用实际的API
    controllerStatus.value.status = 'connected'
    Message.success('控制器已重新连接')
    addLog('控制器重新连接成功')
  } catch (error) {
    Message.error('重新连接失败')
  }
}

// 应用配置
const applyConfig = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('控制器配置已应用')
    addLog(`控制器配置已更新: ${controllerConfig.value.address}`)
  } catch (error) {
    Message.error('应用配置失败')
  }
}

// 重置配置
const resetConfig = () => {
  controllerConfig.value = {
    address: 'tcp:192.168.1.100:6633',
    protocol: 'OpenFlow13',
    mode: 'standalone',
    reconnectInterval: 30,
    maxReconnects: 10,
    heartbeatInterval: 15
  }
  Message.success('配置已重置')
}

// 测试连接
const testConnection = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('连接测试成功')
    addLog('控制器连接测试成功')
  } catch (error) {
    Message.error('连接测试失败')
  }
}

// 获取网桥控制器配置
const fetchBridgeControllers = async () => {
  if (!selectedBridge.value) return
  
  try {
    // 模拟数据
    bridgeControllers.value = [
      {
        id: 1,
        bridge: selectedBridge.value,
        controller: 'tcp:192.168.1.100:6633',
        protocol: 'OpenFlow13',
        mode: 'standalone',
        status: 'connected'
      },
      {
        id: 2,
        bridge: selectedBridge.value,
        controller: 'tcp:192.168.1.101:6633',
        protocol: 'OpenFlow13',
        mode: 'in-band',
        status: 'disconnected'
      }
    ]
    Message.success('网桥控制器配置已加载')
  } catch (error) {
    Message.error('加载配置失败')
  }
}

// 编辑网桥控制器
const editBridgeController = (record) => {
  editForm.value = { ...record }
  showEditModal.value = true
}

// 保存网桥控制器
const saveBridgeController = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('网桥控制器配置已保存')
    addLog(`网桥 ${editForm.value.bridge} 控制器配置已更新`)
    showEditModal.value = false
    fetchBridgeControllers()
  } catch (error) {
    Message.error('保存配置失败')
  }
}

// 移除网桥控制器
const removeBridgeController = async (record) => {
  try {
    // 这里应该调用实际的API
    Message.success('网桥控制器已移除')
    addLog(`网桥 ${record.bridge} 控制器已移除`)
    fetchBridgeControllers()
  } catch (error) {
    Message.error('移除失败')
  }
}

// 清空日志
const clearLogs = () => {
  eventLogs.value = ''
  Message.success('日志已清空')
}

// 导出日志
const exportLogs = () => {
  const blob = new Blob([eventLogs.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'controller-logs.txt'
  a.click()
  URL.revokeObjectURL(url)
  Message.success('日志已导出')
}

// 添加日志
const addLog = (message) => {
  const timestamp = new Date().toLocaleString()
  eventLogs.value += `[${timestamp}] ${message}\n`
  
  if (autoScroll.value) {
    nextTick(() => {
      if (logTextarea.value) {
        logTextarea.value.$el.scrollTop = logTextarea.value.$el.scrollHeight
      }
    })
  }
}

// 测试功能
const testAddFlow = () => {
  addLog('测试添加流表操作')
  Message.info('流表添加测试完成')
}

const testDeleteFlow = () => {
  addLog('测试删除流表操作')
  Message.info('流表删除测试完成')
}

const testModifyFlow = () => {
  addLog('测试修改流表操作')
  Message.info('流表修改测试完成')
}

const testPortUp = () => {
  addLog('测试端口启用操作')
  Message.info('端口启用测试完成')
}

const testPortDown = () => {
  addLog('测试端口禁用操作')
  Message.info('端口禁用测试完成')
}

const testPortConfig = () => {
  addLog('测试端口配置操作')
  Message.info('端口配置测试完成')
}

const testFlowStats = () => {
  addLog('测试流表统计查询')
  Message.info('流表统计查询测试完成')
}

const testPortStats = () => {
  addLog('测试端口统计查询')
  Message.info('端口统计查询测试完成')
}

const testGroupStats = () => {
  addLog('测试组统计查询')
  Message.info('组统计查询测试完成')
}

onMounted(() => {
  if (bridgeList.value.length > 0) {
    selectedBridge.value = bridgeList.value[0].name
    fetchBridgeControllers()
  }
  
  // 添加初始日志
  addLog('控制器管理页面已加载')
})
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}
</style> 