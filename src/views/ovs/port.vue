<template>
  <a-card title="端口管理">
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-select
          v-model="selectedBridge"
          placeholder="选择网桥"
          style="width: 200px"
          @change="fetchPorts"
        >
          <a-option v-for="(item,index) in bridgeList" :key="index" :value="item.name">
            {{ item.name }}
          </a-option>
        </a-select>
        <a-button type="primary" @click="showAddModal = true" :disabled="!selectedBridge">新增端口</a-button>
        <a-button @click="fetchPorts" :disabled="!selectedBridge">刷新</a-button>
    </a-space>

      <a-table :columns="columns" :data="portList" row-key="name" :loading="loading">
        <template #type="{ record }">
          <a-tag :color="getPortTypeColor(record.type)">{{ record.type || 'normal' }}</a-tag>
        </template>
      <template #actions="{ record }">
        <a-space>
            <a-button size="mini" status="danger" @click="deletePort(record)">删除</a-button>
            <a-button size="mini" @click="showPortInfo(record)">详情</a-button>
        </a-space>
      </template>
    </a-table>
    </a-space>

    <!-- 新增端口模态框 -->
    <a-modal v-model:visible="showAddModal" title="新增端口" @ok="addPort" @cancel="resetForm">
      <a-form :model="addForm" :rules="rules" ref="formRef">
        <a-form-item label="网桥" field="bridge">
          <a-input v-model="addForm.bridge" disabled />
        </a-form-item>
        <a-form-item label="端口名称" field="portName" required>
          <a-input v-model="addForm.portName" placeholder="请输入端口名称" />
        </a-form-item>
        <a-form-item label="端口类型" field="type" required>
          <a-select v-model="addForm.type" placeholder="请选择端口类型" @change="onTypeChange">
            <a-option value="normal">普通端口 (Normal)</a-option>
            <a-option value="internal">内部端口 (Internal)</a-option>
            <a-option value="patch">补丁端口 (Patch)</a-option>
            <a-option value="vxlan">VXLAN隧道 (VXLAN)</a-option>
            <a-option value="gre">GRE隧道 (GRE)</a-option>
            <a-option value="tap">TAP接口 (TAP)</a-option>
            <a-option value="tun">TUN接口 (TUN)</a-option>
            <a-option value="bond">绑定端口 (Bond)</a-option>
          </a-select>
        </a-form-item>

        <!-- VXLAN配置 -->
        <template v-if="addForm.type === 'vxlan'">
          <a-form-item label="远程IP" field="remoteIP" required>
            <a-input v-model="addForm.remoteIP" placeholder="请输入远程IP地址" />
          </a-form-item>
          <a-form-item label="VNI" field="vni" required>
            <a-input-number v-model="addForm.vni" placeholder="请输入VNI值" :min="1" :max="16777215" />
          </a-form-item>
          <a-form-item label="Key" field="key">
            <a-input v-model="addForm.key" placeholder="可选：输入key值" />
          </a-form-item>
          <a-form-item label="本地IP" field="localIP">
            <a-input v-model="addForm.localIP" placeholder="可选：输入本地IP地址" />
        </a-form-item>
        </template>

        <!-- Patch端口配置 -->
        <template v-if="addForm.type === 'patch'">
          <a-form-item label="对端端口" field="peer">
            <a-input v-model="addForm.peer" placeholder="可选：输入对端端口名称，留空则不设置对端" />
            <div style="color: #666; font-size: 12px; margin-top: 4px;">
              提示：可以创建时不设置对端，后续通过"设置对端"功能配置
            </div>
        </a-form-item>
        </template>

        <!-- Bond端口配置 -->
        <template v-if="addForm.type === 'bond'">
          <a-form-item label="成员端口" field="members" required>
            <a-input v-model="addForm.members" placeholder="请输入成员端口，用逗号分隔" />
        </a-form-item>
          <a-form-item label="绑定模式" field="mode" required>
            <a-select v-model="addForm.mode" placeholder="请选择绑定模式">
              <a-option value="active-backup">主备模式 (active-backup)</a-option>
              <a-option value="balance-slb">负载均衡 (balance-slb)</a-option>
              <a-option value="balance-tcp">TCP负载均衡 (balance-tcp)</a-option>
          </a-select>
        </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <!-- 端口详情模态框 -->
    <a-modal v-model:visible="showInfoModal" title="端口详情" :footer="false">
      <a-descriptions :data="portInfoData" layout="vertical" bordered />
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  addPort as apiAddPort,
  addNormalPort as apiAddNormalPort,
  addInternalPort as apiAddInternalPort,
  addGrePort as apiAddGrePort,
  addVxlanPort as apiAddVxlanPort,
  addBondPort as apiAddBondPort,
  deletePort as apiDeletePort,
  listPorts
} from '@/api/ovs/port'
import { listBridges } from '@/api/ovs/bridge'
import { addVxlan as apiAddVxlan } from '@/api/ovs/vxlan'
import { addPatchPort, addPatchPortWithoutPeer, setPatchPortPeer } from '@/api/ovs/port'
import { addBond } from '@/api/ovs/bond'
import { Message } from '@arco-design/web-vue'

const portList = ref([])
const bridgeList = ref([])
const selectedBridge = ref('')
const showAddModal = ref(false)
const showInfoModal = ref(false)
const loading = ref(false)
const formRef = ref()

const addForm = ref({
  bridge: '',
  portName: '',
  type: 'normal',
  // VXLAN配置
  remoteIP: '',
  vni: null,
  key: '',
  localIP: '',
  // Patch配置
  peer: '',
  // Bond配置
  members: '',
  mode: 'active-backup'
})

const rules = {
  portName: [
    { required: true, message: '请输入端口名称' }
  ],
  type: [
    { required: true, message: '请选择端口类型' }
  ]
}

const columns = [
  { title: '端口名称', dataIndex: 'name', width: '25%' },
  { title: '类型', dataIndex: 'type', slotName: 'type', width: '15%' },
  { title: '状态', dataIndex: 'status', width: '15%' },
  { title: '操作', slotName: 'actions', width: '20%' }
]

const portInfoData = ref([])

// 获取网桥列表
const fetchBridges = async () => {
  try {
    const res = await listBridges()
    if (res.data && res.data.bridges) {
      bridgeList.value = res.data.bridges
    } else {
      bridgeList.value = []
    }
  } catch (error) {
    Message.error('获取网桥列表失败：' + error.message)
    bridgeList.value = []
  }
}

const fetchPorts = async () => {
  if (!selectedBridge.value) return

  loading.value = true
  try {
    const res = await listPorts({ bridge: selectedBridge.value })
    if (res.data && res.data.ports) {
      portList.value = res.data.ports
    } else {
      portList.value = []
    }
  } catch (error) {
    Message.error('获取端口列表失败：' + error.message)
    portList.value = []
  } finally {
    loading.value = false
  }
  addForm.value.bridge = selectedBridge.value
}

const addPort = async () => {
  try {
    await formRef.value.validate()

    if (addForm.value.type === 'vxlan') {
      // 使用VXLAN专用API（基础版本）
      await apiAddVxlanPort({
        bridge: addForm.value.bridge,
        portName: addForm.value.portName
      })
      // 注意：如果需要配置VXLAN参数，建议使用专门的VXLAN管理页面
    } else if (addForm.value.type === 'patch') {
      // 使用Patch专用API
      if (addForm.value.peer && addForm.value.peer.trim()) {
        // 如果提供了对端，使用带对端的API
        await addPatchPort({
          bridge: addForm.value.bridge,
          portName: addForm.value.portName,
          peer: addForm.value.peer.trim()
        })
      } else {
        // 如果没有提供对端，使用不带对端的API
        await addPatchPortWithoutPeer({
          bridge: addForm.value.bridge,
          portName: addForm.value.portName
        })
      }
    } else if (addForm.value.type === 'bond') {
      // 使用Bond专用API（基础版本）
      await apiAddBondPort({
        bridge: addForm.value.bridge,
        portName: addForm.value.portName
      })
      // 注意：如果需要配置bond成员，建议使用专门的bond管理页面
    } else if (addForm.value.type === 'normal') {
      // 使用普通端口专用API
      await apiAddNormalPort({
        bridge: addForm.value.bridge,
        portName: addForm.value.portName
      })
    } else if (addForm.value.type === 'internal') {
      // 使用内部端口专用API
      await apiAddInternalPort({
        bridge: addForm.value.bridge,
        portName: addForm.value.portName
      })
    } else if (addForm.value.type === 'gre') {
      // 使用GRE端口专用API
      await apiAddGrePort({
        bridge: addForm.value.bridge,
        portName: addForm.value.portName
      })
    } else {
      // 使用通用端口API（兼容其他类型）
      await apiAddPort(addForm.value)
    }

    Message.success('添加端口成功')
    showAddModal.value = false
    resetForm()
    fetchPorts()
  } catch (error) {
    Message.error('添加端口失败：' + error.message)
  }
}

const deletePort = async (record) => {
  try {
    await apiDeletePort({
      bridge: selectedBridge.value,
      portName: record.name
    })
    Message.success('删除端口成功')
    fetchPorts()
  } catch (error) {
    Message.error('删除端口失败：' + error.message)
  }
}

const showPortInfo = (record) => {
  portInfoData.value = [
    { label: '端口名称', value: record.name },
    { label: '端口类型', value: record.type || 'normal' },
    { label: '所属网桥', value: selectedBridge.value },
    { label: '端口状态', value: record.status || 'unknown' }
  ]
  showInfoModal.value = true
}

const resetForm = () => {
  addForm.value = {
    bridge: selectedBridge.value,
    portName: '',
    type: 'normal',
    remoteIP: '',
    vni: null,
    key: '',
    localIP: '',
    peer: '',
    members: '',
    mode: 'active-backup'
  }
  formRef.value?.resetFields()
}

const onTypeChange = () => {
  // 根据类型重置相关字段
  if (addForm.value.type !== 'vxlan') {
    addForm.value.remoteIP = ''
    addForm.value.vni = null
    addForm.value.key = ''
    addForm.value.localIP = ''
  }
  if (addForm.value.type !== 'patch') {
    addForm.value.peer = ''
  }
  if (addForm.value.type !== 'bond') {
    addForm.value.members = ''
    addForm.value.mode = 'active-backup'
  }
}

const getPortTypeColor = (type) => {
  const colorMap = {
    'normal': 'blue',
    'internal': 'green',
    'patch': 'orange',
    'vxlan': 'purple',
    'gre': 'cyan',
    'tap': 'magenta',
    'tun': 'pink',
    'bond': 'red'
  }
  return colorMap[type] || 'pinkpurple'
}

onMounted(() => {
  fetchBridges()
})
</script>
