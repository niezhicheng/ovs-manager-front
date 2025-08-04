<template>
  <a-card title="OVS数据库管理">
    <a-space direction="vertical" style="width: 100%">
      <!-- 数据库状态 -->
      <a-card title="数据库状态" size="small">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic title="ovsdb-server状态" :value="dbStatus.server" :value-style="{ color: dbStatus.server === 'running' ? '#52c41a' : '#ff4d4f' }" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="数据库连接数" :value="dbStatus.connections" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="数据库大小" :value="dbStatus.size" suffix="KB" />
          </a-col>
        </a-row>
        <a-space style="margin-top: 16px">
          <a-button @click="refreshStatus">刷新状态</a-button>
          <a-button @click="restartServer">重启服务</a-button>
        </a-space>
      </a-card>

      <!-- 数据库操作 -->
      <a-card title="数据库操作" size="small">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-card title="备份与恢复" size="small">
              <a-space direction="vertical" style="width: 100%">
                <a-input v-model="backupPath" placeholder="备份文件路径" />
                <a-space>
                  <a-button type="primary" @click="backupDatabase">备份数据库</a-button>
                  <a-button @click="restoreDatabase">恢复数据库</a-button>
                </a-space>
              </a-space>
            </a-card>
          </a-col>
          <a-col :span="12">
            <a-card title="配置导入导出" size="small">
              <a-space direction="vertical" style="width: 100%">
                <a-upload
                  v-model:file-list="importFiles"
                  :custom-request="handleImport"
                  :show-file-list="false"
                  accept=".json,.xml"
                >
                  <a-button>选择配置文件</a-button>
                </a-upload>
                <a-space>
                  <a-button @click="exportConfig">导出配置</a-button>
                  <a-button @click="importConfig">导入配置</a-button>
                </a-space>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </a-card>

      <!-- 数据库表管理 -->
      <a-card title="数据库表管理" size="small">
        <a-table :columns="tableColumns" :data="dbTables" row-key="name" :pagination="false">
          <template #actions="{ record }">
            <a-space>
              <a-button size="mini" @click="viewTableData(record)">查看数据</a-button>
              <a-button size="mini" @click="exportTable(record)">导出表</a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 日志管理 -->
      <a-card title="日志管理" size="small">
        <a-space direction="vertical" style="width: 100%">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="日志级别">
                <a-select v-model="logLevel" @change="setLogLevel">
                  <a-option value="emer">Emergency</a-option>
                  <a-option value="err">Error</a-option>
                  <a-option value="warn">Warning</a-option>
                  <a-option value="info">Info</a-option>
                  <a-option value="dbg">Debug</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="日志文件">
                <a-input v-model="logFile" placeholder="日志文件路径" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-button @click="viewLogs">查看日志</a-button>
            </a-col>
          </a-row>
          <a-textarea v-model="logContent" :rows="10" placeholder="日志内容" readonly />
        </a-space>
      </a-card>
    </a-space>

    <!-- 查看表数据弹窗 -->
    <a-modal v-model:visible="showTableModal" :title="`表数据 - ${currentTable}`" width="900px" :footer="null">
      <a-table :columns="dataColumns" :data="tableData" row-key="id" :pagination="{ pageSize: 10 }" />
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'

// 数据库状态
const dbStatus = ref({
  server: 'running',
  connections: 5,
  size: 1024
})

// 备份路径
const backupPath = ref('/var/lib/openvswitch/ovs.db.backup')

// 导入文件
const importFiles = ref([])

// 日志配置
const logLevel = ref('info')
const logFile = ref('/var/log/openvswitch/ovs-vswitchd.log')
const logContent = ref('')

// 数据库表
const dbTables = ref([
  { name: 'Open_vSwitch', description: 'OVS系统配置表', records: 10 },
  { name: 'Bridge', description: '网桥配置表', records: 5 },
  { name: 'Port', description: '端口配置表', records: 20 },
  { name: 'Interface', description: '接口配置表', records: 25 },
  { name: 'Flow_Table', description: '流表配置表', records: 100 },
  { name: 'QoS', description: 'QoS配置表', records: 8 },
  { name: 'Queue', description: '队列配置表', records: 15 },
  { name: 'Mirror', description: '镜像配置表', records: 3 }
])

// 表格列定义
const tableColumns = [
  { title: '表名', dataIndex: 'name' },
  { title: '描述', dataIndex: 'description' },
  { title: '记录数', dataIndex: 'records' },
  { title: '操作', slotName: 'actions', width: 200 }
]

// 表数据弹窗
const showTableModal = ref(false)
const currentTable = ref('')
const tableData = ref([])
const dataColumns = ref([])

// 刷新状态
const refreshStatus = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('状态已刷新')
  } catch (error) {
    Message.error('刷新状态失败')
  }
}

// 重启服务
const restartServer = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('服务重启成功')
  } catch (error) {
    Message.error('服务重启失败')
  }
}

// 备份数据库
const backupDatabase = async () => {
  try {
    // 这里应该调用实际的API
    Message.success(`数据库已备份到: ${backupPath.value}`)
  } catch (error) {
    Message.error('备份失败')
  }
}

// 恢复数据库
const restoreDatabase = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('数据库恢复成功')
  } catch (error) {
    Message.error('恢复失败')
  }
}

// 处理导入
const handleImport = (options) => {
  const { file } = options
  console.log('导入文件:', file)
  Message.success('文件上传成功')
}

// 导出配置
const exportConfig = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('配置导出成功')
  } catch (error) {
    Message.error('导出失败')
  }
}

// 导入配置
const importConfig = async () => {
  try {
    // 这里应该调用实际的API
    Message.success('配置导入成功')
  } catch (error) {
    Message.error('导入失败')
  }
}

// 设置日志级别
const setLogLevel = async (level) => {
  try {
    // 这里应该调用实际的API
    Message.success(`日志级别已设置为: ${level}`)
  } catch (error) {
    Message.error('设置日志级别失败')
  }
}

// 查看日志
const viewLogs = async () => {
  try {
    // 这里应该调用实际的API
    logContent.value = `[INFO] 2024-01-01 10:00:00 ovs-vswitchd: 数据库连接正常\n[INFO] 2024-01-01 10:00:01 ovs-vswitchd: 网桥br0创建成功\n[INFO] 2024-01-01 10:00:02 ovs-vswitchd: 端口eth0添加到网桥br0`
    Message.success('日志加载成功')
  } catch (error) {
    Message.error('加载日志失败')
  }
}

// 查看表数据
const viewTableData = (record) => {
  currentTable.value = record.name
  showTableModal.value = true
  
  // 根据表名生成不同的列和数据
  if (record.name === 'Bridge') {
    dataColumns.value = [
      { title: '名称', dataIndex: 'name' },
      { title: '协议', dataIndex: 'protocols' },
      { title: '状态', dataIndex: 'status' },
      { title: '端口数', dataIndex: 'portCount' }
    ]
    tableData.value = [
      { id: 1, name: 'br0', protocols: 'OpenFlow13', status: 'up', portCount: 3 },
      { id: 2, name: 'br1', protocols: 'OpenFlow13', status: 'up', portCount: 2 }
    ]
  } else if (record.name === 'Port') {
    dataColumns.value = [
      { title: '名称', dataIndex: 'name' },
      { title: '类型', dataIndex: 'type' },
      { title: '状态', dataIndex: 'status' },
      { title: '所属网桥', dataIndex: 'bridge' }
    ]
    tableData.value = [
      { id: 1, name: 'eth0', type: 'system', status: 'up', bridge: 'br0' },
      { id: 2, name: 'vxlan0', type: 'vxlan', status: 'up', bridge: 'br0' }
    ]
  }
}

// 导出表
const exportTable = (record) => {
  try {
    // 这里应该调用实际的API
    Message.success(`表 ${record.name} 导出成功`)
  } catch (error) {
    Message.error('导出失败')
  }
}

onMounted(() => {
  refreshStatus()
})
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
}
</style> 