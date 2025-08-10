<template>
  <a-card title="交换机管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增交换机</a-button>
        <a-button @click="fetchBridges">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="bridgeList" row-key="name">
        <template #status="{ record }">
          <a-tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </a-tag>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" @click="openPortModal(record)">配置端口</a-button>
            <a-button size="mini" @click="openConfigModal(record)">高级配置</a-button>
            <a-button size="mini" @click="dumpFlows(record)">查看流表</a-button>
            <a-button size="mini" @click="openMirrorModal(record)">镜像</a-button>
            <a-button size="mini" status="danger" @click="deleteBridge(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>

    <!-- 新增交换机弹窗 -->
    <a-modal v-model:visible="showAddModal" title="新增交换机" @ok="addBridge">
      <a-form :model="addForm">
        <a-form-item label="名称" field="name">
          <a-input v-model="addForm.name" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 端口管理弹窗 -->
    <a-modal v-model:visible="showPortModal" :title="`端口管理 - ${currentBridge || ''}`" width="800px" footer={null} @cancel="closePortModal">
      <PortManager v-if="showPortModal" :bridge="currentBridge" />
    </a-modal>

    <!-- 高级配置弹窗 -->
    <a-modal v-model:visible="showConfigModal" :title="`高级配置 - ${currentBridge || ''}`" width="900px" @ok="saveConfig">
      <a-tabs>
        <!-- NetFlow 配置 -->
        <a-tab-pane key="netflow" title="NetFlow">
          <a-form :model="netflowForm" layout="vertical">
            <a-form-item label="交换机">
              <a-input v-model="netflowForm.bridge" disabled />
            </a-form-item>
            <a-form-item label="目标服务器" field="target">
              <a-input v-model="netflowForm.target" placeholder="例如: 192.168.1.100:9995" />
            </a-form-item>
            <a-form-item label="引擎ID" field="engineID">
              <a-input-number v-model="netflowForm.engineID" placeholder="引擎ID" />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- sFlow 配置 -->
        <a-tab-pane key="sflow" title="sFlow">
          <a-form :model="sflowForm" layout="vertical">
            <a-form-item label="交换机">
              <a-input v-model="sflowForm.bridge" disabled />
            </a-form-item>
            <a-form-item label="目标服务器" field="targets">
              <a-textarea v-model="sflowForm.targets" placeholder="每行一个服务器，例如:&#10;192.168.1.100:6343&#10;192.168.1.101:6343" :rows="3" />
            </a-form-item>
            <a-form-item label="采样率" field="sampling">
              <a-input-number v-model="sflowForm.sampling" placeholder="采样率" />
            </a-form-item>
            <a-form-item label="头部长度" field="header">
              <a-input-number v-model="sflowForm.header" placeholder="头部长度" />
            </a-form-item>
            <a-form-item label="轮询间隔" field="polling">
              <a-input-number v-model="sflowForm.polling" placeholder="轮询间隔(秒)" />
            </a-form-item>
            <a-form-item label="代理地址" field="agent">
              <a-input v-model="sflowForm.agent" placeholder="代理地址" />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- STP/RSTP 配置 -->
        <a-tab-pane key="stp" title="STP/RSTP">
          <a-form :model="stpForm" layout="vertical">
            <a-form-item label="交换机">
              <a-input v-model="stpForm.bridge" disabled />
            </a-form-item>
            <a-form-item label="启用STP" field="stpEnable">
              <a-switch v-model="stpForm.stpEnable" />
            </a-form-item>
            <a-form-item label="启用RSTP" field="rstpEnable">
              <a-switch v-model="stpForm.rstpEnable" />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- IPFIX 配置 -->
        <a-tab-pane key="ipfix" title="IPFIX">
          <a-form :model="ipfixForm" layout="vertical">
            <a-form-item label="交换机">
              <a-input v-model="ipfixForm.bridge" disabled />
            </a-form-item>
            <a-form-item label="目标服务器" field="targets">
              <a-textarea v-model="ipfixForm.targets" placeholder="每行一个服务器，例如:&#10;192.168.1.100:4739&#10;192.168.1.101:4739" :rows="3" />
            </a-form-item>
            <a-form-item label="采样率" field="sampling">
              <a-input-number v-model="ipfixForm.sampling" placeholder="采样率" />
            </a-form-item>
            <a-form-item label="观察域ID" field="obsDomainID">
              <a-input-number v-model="ipfixForm.obsDomainID" placeholder="观察域ID" />
            </a-form-item>
            <a-form-item label="观察点ID" field="obsPointID">
              <a-input-number v-model="ipfixForm.obsPointID" placeholder="观察点ID" />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- QoS 配置 -->
        <a-tab-pane key="qos" title="QoS">
          <a-form :model="qosForm" layout="vertical">
            <a-form-item label="端口名称" field="portName">
              <a-space>
                <a-input v-model="qosForm.portName" placeholder="端口名称" style="flex: 1;" />
                <a-button size="mini" @click="loadQosConfig" :disabled="!qosForm.portName">获取配置</a-button>
              </a-space>
            </a-form-item>
            <a-form-item label="QoS类型" field="type">
              <a-select v-model="qosForm.type" placeholder="选择QoS类型">
                <a-option value="linux-htb">Linux HTB</a-option>
                <a-option value="linux-hfsc">Linux HFSC</a-option>
                <a-option value="linux-cbq">Linux CBQ</a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="最大速率" field="maxRate">
              <a-input v-model="qosForm.maxRate" placeholder="例如: 1000000 (1Mbps)" />
            </a-form-item>
            <a-form-item label="队列配置" field="queues">
              <a-textarea v-model="qosForm.queues" placeholder="队列配置，JSON格式" :rows="4" />
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <!-- 流表查看弹窗 -->
    <a-modal v-model:visible="showFlowsModal" :title="`流表查看 - ${currentBridge || ''}`" width="1400px" :footer="false" :mask-closable="false">
      <a-spin :loading="flowsLoading">
        <div style="max-height: 70vh; overflow: hidden;">
          <a-card>
            <template #title>
              <a-space>
                <span>流表内容</span>
                <a-button size="mini" @click="refreshFlows">刷新</a-button>
                <a-button size="mini" @click="copyFlowsContent">复制格式化</a-button>
                <a-button size="mini" @click="copyRawFlowsContent">复制原始</a-button>
              </a-space>
            </template>
            <div style="display: flex; gap: 16px; max-height: 60vh;">
              <!-- 格式化视图 -->
              <div style="flex: 1; min-width: 0; border: 1px solid #d9d9d9; border-radius: 6px; padding: 8px; background-color: #fafafa; overflow: auto;">
                <div style="font-weight: bold; margin-bottom: 8px;">格式化视图</div>
                <pre style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #333; background: transparent;">{{ flowsContent || '正在加载流表内容...' }}</pre>
              </div>
                        <!-- 原始视图 -->
          <div style="flex: 1; min-width: 0; border: 1px solid #d9d9d9; border-radius: 6px; padding: 8px; background-color: #f5f5f5; overflow: auto;">
            <div style="font-weight: bold; margin-bottom: 8px;">原始视图</div>
            <pre style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; margin: 0; white-space: pre; word-wrap: normal; color: #333; background: transparent; min-width: max-content;">{{ flowsRawContent || '正在加载流表内容...' }}</pre>
          </div>
            </div>
          </a-card>
        </div>
      </a-spin>
    </a-modal>

    <!-- 镜像配置弹窗 -->
    <a-modal v-model:visible="showMirrorModal" title="镜像配置" @ok="saveMirrorConfig">
      <a-form :model="mirrorForm">
        <a-form-item label="名称" field="name" required>
          <a-input v-model="mirrorForm.name" />
        </a-form-item>
        <a-form-item label="源端口" field="selectSrcPorts">
          <a-input v-model="mirrorForm.selectSrcPorts" placeholder="多个用逗号分隔" />
        </a-form-item>
        <a-form-item label="目的端口" field="selectDstPorts">
          <a-input v-model="mirrorForm.selectDstPorts" placeholder="多个用逗号分隔" />
        </a-form-item>
        <a-form-item label="VLAN" field="selectVlan">
          <a-input-number v-model="mirrorForm.selectVlan" :min="1" :max="4094" style="width: 100%" />
        </a-form-item>
        <a-form-item label="输出端口" field="outputPort">
          <a-input v-model="mirrorForm.outputPort" />
        </a-form-item>
        <a-form-item label="输出VLAN" field="outputVlan">
          <a-input-number v-model="mirrorForm.outputVlan" :min="1" :max="4094" style="width: 100%" />
        </a-form-item>
        <a-form-item label="全选" field="selectAll">
          <a-switch v-model="mirrorForm.selectAll" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  listBridges,
  addBridge as apiAddBridge,
  deleteBridge as apiDeleteBridge,
  setNetFlow,
  getNetFlow,
  setSFlow,
  getSFlow,
  setStp,
  getStp,
  setRstp,
  getRstp,
  setIpfix,
  getIpfix,
  setQos,
  getQos,
  dumpFlows as apiDumpFlows
} from '@/api/ovs/bridge'
import { Message } from '@arco-design/web-vue'
import PortManager from './PortManager.vue'
import { getMirrorList as listMirrors, createMirror as apiAddMirror } from '@/api/ovs/mirror'

const bridgeList = ref([])
const showAddModal = ref(false)
const addForm = ref({ name: '' })

const showPortModal = ref(false)
const currentBridge = ref('')

const showConfigModal = ref(false)
const showFlowsModal = ref(false)
const flowsLoading = ref(false)
const flowsContent = ref('')
const flowsRawContent = ref('')
const flowsViewMode = ref('formatted') // 'formatted' or 'raw'

// 配置表单
const netflowForm = ref({
  bridge: '',
  target: '',
  engineID: 1
})

const sflowForm = ref({
  bridge: '',
  targets: '',
  sampling: 1000,
  header: 128,
  polling: 30,
  agent: ''
})

const stpForm = ref({
  bridge: '',
  stpEnable: false,
  rstpEnable: false
})

const ipfixForm = ref({
  bridge: '',
  targets: '',
  sampling: 1000,
  obsDomainID: 1,
  obsPointID: 1
})

const qosForm = ref({
  portName: '',
  type: 'linux-htb',
  maxRate: '',
  queues: ''
})

const showMirrorModal = ref(false)
const mirrorForm = ref({
  name: '',
  selectSrcPorts: '',
  selectDstPorts: '',
  selectVlan: undefined,
  outputPort: '',
  outputVlan: undefined,
  selectAll: false
})
let currentMirrorBridge = ''

const columns = [
  { title: '名称', dataIndex: 'name' },
  { title: '状态', slotName: 'status' },
  { title: '端口数', dataIndex: 'portCount' },
  { title: '操作', slotName: 'actions' }
]

const fetchBridges = async () => {
  try {
    const res = await listBridges()
    bridgeList.value = res.data?.bridges || []
    if (bridgeList.value.length === 0) {
      Message.info('暂无交换机数据')
    }
  } catch (error) {
    console.error('获取交换机列表失败:', error)
    Message.error(`获取交换机列表失败: ${error.message || '网络连接异常'}`)
    // 可以添加重试机制
    setTimeout(() => {
      fetchBridges()
    }, 3000)
  }
}

const addBridge = async () => {
  try {
    await apiAddBridge(addForm.value)
    showAddModal.value = false
    addForm.value = { name: '' }
    fetchBridges()
    Message.success('新增交换机成功')
  } catch (error) {
    Message.error('新增交换机失败')
  }
}

const deleteBridge = async (record) => {
  try {
    await apiDeleteBridge({ name: record.name })
    fetchBridges()
    Message.success('删除交换机成功')
  } catch (error) {
    Message.error('删除交换机失败')
  }
}

const openPortModal = (record) => {
  currentBridge.value = record.name
  showPortModal.value = true
}

const closePortModal = () => {
  showPortModal.value = false
  currentBridge.value = ''
}

const openConfigModal = async (record) => {
  currentBridge.value = record.name
  showConfigModal.value = true

  try {
    // 初始化配置表单
    netflowForm.value.bridge = record.name
    sflowForm.value.bridge = record.name
    stpForm.value.bridge = record.name
    ipfixForm.value.bridge = record.name

    // 获取当前配置
    const configPromises = [
      loadNetFlowConfig(record.name),
      loadSFlowConfig(record.name),
      loadStpConfig(record.name),
      loadRstpConfig(record.name),
      loadIpfixConfig(record.name)
    ]

    await Promise.allSettled(configPromises)
    
    // 检查哪些配置加载失败
    const results = await Promise.allSettled(configPromises)
    const failedConfigs = results
      .map((result, index) => result.status === 'rejected' ? ['NetFlow', 'sFlow', 'STP', 'RSTP', 'IPFIX'][index] : null)
      .filter(Boolean)
    
    if (failedConfigs.length > 0) {
      Message.warning(`以下配置获取失败，将使用默认值: ${failedConfigs.join(', ')}`)
    }
  } catch (error) {
    console.error('配置加载失败:', error)
    Message.warning('部分配置获取失败，将使用默认值')
  }
}

// 加载NetFlow配置
const loadNetFlowConfig = async (bridgeName) => {
  try {
    const res = await getNetFlow(bridgeName)
    if (res.data && res.data.config) {
      const config = res.data.config
      netflowForm.value.target = config.target || ''
      netflowForm.value.engineID = config.engineID || 1
    }
  } catch (error) {
    console.log('NetFlow配置获取失败，使用默认值')
  }
}

// 加载sFlow配置
const loadSFlowConfig = async (bridgeName) => {
  try {
    const res = await getSFlow(bridgeName)
    if (res.data && res.data.config) {
      const config = res.data.config
      sflowForm.value.targets = config.targets ? config.targets.join('\n') : ''
      sflowForm.value.sampling = config.sampling || 1000
      sflowForm.value.header = config.header || 128
      sflowForm.value.polling = config.polling || 30
      sflowForm.value.agent = config.agent || ''
    }
  } catch (error) {
    console.log('sFlow配置获取失败，使用默认值')
  }
}

// 加载STP配置
const loadStpConfig = async (bridgeName) => {
  try {
    const res = await getStp(bridgeName)
    if (res.data && res.data.config) {
      const config = res.data.config
      stpForm.value.stpEnable = config.enable || false
    }
  } catch (error) {
    console.log('STP配置获取失败，使用默认值')
  }
}

// 加载RSTP配置
const loadRstpConfig = async (bridgeName) => {
  try {
    const res = await getRstp(bridgeName)
    if (res.data && res.data.config) {
      const config = res.data.config
      stpForm.value.rstpEnable = config.enable || false
    }
  } catch (error) {
    console.log('RSTP配置获取失败，使用默认值')
  }
}

// 加载IPFIX配置
const loadIpfixConfig = async (bridgeName) => {
  try {
    const res = await getIpfix(bridgeName)
    if (res.data && res.data.config) {
      const config = res.data.config
      ipfixForm.value.targets = config.targets ? config.targets.join('\n') : ''
      ipfixForm.value.sampling = config.sampling || 1000
      ipfixForm.value.obsDomainID = config.obsDomainID || 1
      ipfixForm.value.obsPointID = config.obsPointID || 1
    }
  } catch (error) {
    console.log('IPFIX配置获取失败，使用默认值')
  }
}

// 加载QoS配置
const loadQosConfig = async () => {
  if (!qosForm.value.portName) {
    Message.warning('请先输入端口名称')
    return
  }

  try {
    const res = await getQos(currentBridge.value, qosForm.value.portName)
    if (res.data && res.data.config) {
      const config = res.data.config
      qosForm.value.type = config.type || 'linux-htb'
      qosForm.value.maxRate = config.maxRate || ''
      qosForm.value.queues = config.queues ? JSON.stringify(config.queues, null, 2) : ''
      Message.success('QoS配置获取成功')
    } else {
      Message.info('该端口暂无QoS配置')
    }
  } catch (error) {
    Message.error('QoS配置获取失败: ' + error.message)
  }
}

const saveConfig = async () => {
  try {
    // 保存NetFlow配置
    if (netflowForm.value.target) {
      await setNetFlow({
        bridge: netflowForm.value.bridge,
        target: netflowForm.value.target,
        engineID: netflowForm.value.engineID
      })
    }

    // 保存sFlow配置
    if (sflowForm.value.targets) {
      const targets = sflowForm.value.targets.split('\n').filter(t => t.trim())
      await setSFlow({
        bridge: sflowForm.value.bridge,
        targets: targets,
        sampling: sflowForm.value.sampling,
        header: sflowForm.value.header,
        polling: sflowForm.value.polling,
        agent: sflowForm.value.agent
      })
    }

    // 保存STP配置
    await setStp({
      bridge: stpForm.value.bridge,
      enable: stpForm.value.stpEnable
    })

    // 保存RSTP配置
    await setRstp({
      bridge: stpForm.value.bridge,
      enable: stpForm.value.rstpEnable
    })

    // 保存IPFIX配置
    if (ipfixForm.value.targets) {
      const targets = ipfixForm.value.targets.split('\n').filter(t => t.trim())
      await setIpfix({
        bridge: ipfixForm.value.bridge,
        targets: targets,
        sampling: ipfixForm.value.sampling,
        obsDomainID: ipfixForm.value.obsDomainID,
        obsPointID: ipfixForm.value.obsPointID
      })
    }

    // 保存QoS配置
    if (qosForm.value.portName && qosForm.value.type) {
      let queues = {}
      if (qosForm.value.queues) {
        try {
          queues = JSON.parse(qosForm.value.queues)
        } catch (e) {
          Message.warning('队列配置JSON格式错误')
        }
      }
      await setQos({
        portName: qosForm.value.portName,
        type: qosForm.value.type,
        maxRate: qosForm.value.maxRate,
        queues: queues
      })
    }

    showConfigModal.value = false
    Message.success('配置保存成功')
  } catch (error) {
    Message.error('配置保存失败: ' + error.message)
  }
}

const dumpFlows = async (record) => {
  try {
    flowsLoading.value = true
    currentBridge.value = record.name
    showFlowsModal.value = true
    flowsViewMode.value = 'formatted'
    const res = await apiDumpFlows({ bridge: record.name })
    const rawContent = res.data.output || '无流表数据'
    flowsRawContent.value = rawContent
    flowsContent.value = formatFlowTable(rawContent)
  } catch (error) {
    Message.error('获取流表失败')
    flowsContent.value = '获取流表失败: ' + error.message
    flowsRawContent.value = flowsContent.value
  } finally {
    flowsLoading.value = false
  }
}

const formatFlowTable = (rawContent) => {
  if (!rawContent || rawContent === '无流表数据') {
    return rawContent
  }

  const lines = rawContent.split('\n')
  let formattedContent = ''
  let flowCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line.startsWith('NXST_FLOW reply')) {
      // 跳过响应头
      continue
    }

    if (line.includes('cookie=') && line.includes('actions=')) {
      // 这是一个流表条目
      flowCount++
      formattedContent += `\n📋 流表条目 #${flowCount}\n`
      formattedContent += '═'.repeat(50) + '\n'

      // 解析流表条目
      const parsed = parseFlowEntry(line)
      formattedContent += parsed

      formattedContent += '\n' + '─'.repeat(50) + '\n'
    } else if (line) {
      // 其他内容
      formattedContent += line + '\n'
    }
  }

  if (flowCount === 0) {
    formattedContent = '📭 未找到流表条目\n' + '═'.repeat(50) + '\n' + rawContent
  }

  return formattedContent
}

const parseFlowEntry = (line) => {
  let result = ''

  // 解析各个字段
  const fields = line.split(', ')

  for (const field of fields) {
    if (field.includes('=')) {
      const [key, value] = field.split('=', 2)
      const formattedKey = formatFieldName(key)
      const formattedValue = formatFieldValue(key, value)
      result += `  ${formattedKey}: ${formattedValue}\n`
    }
  }

  return result
}

const formatFieldName = (key) => {
  const nameMap = {
    'cookie': '🍪 Cookie',
    'duration': '⏱️  持续时间',
    'table': '📊 流表',
    'n_packets': '📦 数据包数',
    'n_bytes': '💾 字节数',
    'idle_age': '😴 空闲时间',
    'priority': '⭐ 优先级',
    'actions': '⚡ 动作'
  }
  return nameMap[key] || key
}

const formatFieldValue = (key, value) => {
  switch (key) {
    case 'duration':
      const seconds = parseFloat(value.replace('s', ''))
      if (seconds > 3600) {
        return `${(seconds / 3600).toFixed(1)}小时`
      } else if (seconds > 60) {
        return `${(seconds / 60).toFixed(1)}分钟`
      } else {
        return `${seconds.toFixed(1)}秒`
      }

    case 'idle_age':
      const idleSeconds = parseInt(value)
      if (idleSeconds > 3600) {
        return `${(idleSeconds / 3600).toFixed(1)}小时`
      } else if (idleSeconds > 60) {
        return `${(idleSeconds / 60).toFixed(1)}分钟`
      } else {
        return `${idleSeconds}秒`
      }

    case 'n_bytes':
      const bytes = parseInt(value)
      if (bytes > 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      } else if (bytes > 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`
      } else {
        return `${bytes} 字节`
      }

    case 'priority':
      const priority = parseInt(value)
      if (priority === 0) {
        return `${priority} (最低)`
      } else if (priority > 1000) {
        return `${priority} (高)`
      } else {
        return `${priority} (普通)`
      }

    case 'actions':
      if (value === 'NORMAL') {
        return `${value} (正常转发)`
      } else if (value.includes('drop')) {
        return `${value} (丢弃)`
      } else if (value.includes('output')) {
        return `${value} (输出到端口)`
      } else {
        return value
      }

    default:
      return value
  }
}

const refreshFlows = async () => {
  if (currentBridge.value) {
    try {
      flowsLoading.value = true
      const res = await apiDumpFlows({ bridge: currentBridge.value })
      const rawContent = res.data.output || '无流表数据'
      flowsRawContent.value = rawContent
      flowsContent.value = formatFlowTable(rawContent)
    } catch (error) {
      Message.error('刷新流表失败')
      flowsContent.value = '刷新流表失败: ' + error.message
      flowsRawContent.value = flowsContent.value
    } finally {
      flowsLoading.value = false
    }
  }
}

const copyFlowsContent = async () => {
  try {
    if (flowsContent.value) {
      await navigator.clipboard.writeText(flowsContent.value)
      Message.success('流表内容已复制到剪贴板')
    } else {
      Message.warning('没有可复制的内容')
    }
  } catch (error) {
    // 如果clipboard API不可用，使用传统方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = flowsContent.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      Message.success('流表内容已复制到剪贴板')
    } catch (fallbackError) {
      Message.error('复制失败，请手动选择文本复制')
    }
  }
}

const copyRawFlowsContent = async () => {
  try {
    if (flowsRawContent.value) {
      await navigator.clipboard.writeText(flowsRawContent.value)
      Message.success('原始流表内容已复制到剪贴板')
    } else {
      Message.warning('没有可复制的内容')
    }
  } catch (error) {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = flowsRawContent.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      Message.success('原始流表内容已复制到剪贴板')
    } catch (fallbackError) {
      Message.error('复制失败，请手动选择文本复制')
    }
  }
}

const openMirrorModal = async (record) => {
  currentMirrorBridge = record.name
  console.log("这是",currentMirrorBridge)
  try {
    // 获取当前bridge的镜像配置
    const res = await listMirrors(currentMirrorBridge)
    const mirrors = parseMirrorOutput(res.data?.output)
    if (mirrors.length > 0) {
      Object.assign(mirrorForm.value, mirrors[0])
    } else {
      Object.assign(mirrorForm.value, {
        name: '', selectSrcPorts: '', selectDstPorts: '', selectVlan: undefined, outputPort: '', outputVlan: undefined, selectAll: false
      })
    }
    showMirrorModal.value = true
  } catch (error) {
    console.error('获取镜像配置失败:', error)
    Message.error('获取镜像配置失败')
    // 设置默认值
    Object.assign(mirrorForm.value, {
      name: '', selectSrcPorts: '', selectDstPorts: '', selectVlan: undefined, outputPort: '', outputVlan: undefined, selectAll: false
    })
    showMirrorModal.value = true
  }
}

const saveMirrorConfig = async () => {
  const data = {
    bridge: currentMirrorBridge,
    name: mirrorForm.value.name,
    selectSrcPorts: mirrorForm.value.selectSrcPorts ? mirrorForm.value.selectSrcPorts.split(',').map(s => s.trim()).filter(Boolean) : [],
    selectDstPorts: mirrorForm.value.selectDstPorts ? mirrorForm.value.selectDstPorts.split(',').map(s => s.trim()).filter(Boolean) : [],
    selectVlan: mirrorForm.value.selectVlan,
    outputPort: mirrorForm.value.outputPort,
    outputVlan: mirrorForm.value.outputVlan,
    selectAll: mirrorForm.value.selectAll
  }
  await apiAddMirror(data)
  showMirrorModal.value = false
}

function parseMirrorOutput(output) {
  if (!output) return [];
  let blocks;
  if (/^name\s*:/.test(output.trim())) {
    blocks = output.split(/\n(?=name\s*:)/).filter(Boolean);
  } else {
    blocks = [output];
  }
  const mirrors = [];
  for (const block of blocks) {
    const obj = {};
    block.split('\n').forEach(line => {
      const [k, ...rest] = line.split(':');
      if (!k || rest.length === 0) return;
      const key = k.trim();
      const value = rest.join(':').trim();
      obj[key] = value;
    });
    obj.name = obj['name'] || '';
    obj.selectSrcPorts = obj['select_src_port'] || '';
    obj.selectDstPorts = obj['select_dst_port'] || '';
    obj.selectVlan = obj['select_vlan'] || '';
    obj.outputPort = obj['output_port'] || '';
    obj.outputVlan = obj['output_vlan'] || '';
    obj.selectAll = obj['select_all'] === 'true' || obj['select_all'] === true;
    mirrors.push(obj);
  }
  return mirrors;
}

// 获取状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'up': 'green',
    'down': 'red',
    'empty': 'orange',
    'unknown': 'gray'
  }
  return colorMap[status] || 'gray'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    'up': '运行中',
    'down': '已停止',
    'empty': '无端口',
    'unknown': '未知'
  }
  return textMap[status] || '未知'
}

onMounted(fetchBridges)
</script>

<style scoped>
.arco-tabs-content {
  padding: 16px 0;
}
</style>
