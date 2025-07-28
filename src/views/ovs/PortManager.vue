<template>
  <div>
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增端口</a-button>
        <a-button @click="fetchPorts">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="portList" row-key="portName">
        <template #status="{ record }">
          <a-switch
            :model-value="record.up"
            @change="(checked) => togglePortStatus(record, checked)"
            checked-children="Up"
            unchecked-children="Down"
            :loading="record.statusLoading"
          />
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" @click="openConfigModal(record)">配置</a-button>
            <a-button size="mini" @click="openAliasModal(record)">设置别名</a-button>
            <a-button size="mini" status="danger" @click="deletePort(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增端口" @ok="addPort">
      <a-form :model="addForm" ref="addFormRef">
        <a-form-item label="类型" field="type">
          <a-select v-model="addForm.type" placeholder="请选择端口类型" allow-clear>
            <a-option value="normal">normal</a-option>
            <a-option value="internal">internal</a-option>
            <a-option value="gre">gre</a-option>
            <a-option value="vxlan">vxlan</a-option>
            <a-option value="geneve">geneve</a-option>
            <a-option value="tap">tap</a-option>
            <a-option value="tun">tun</a-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="addForm.type === 'normal'" label="端口名称" field="portName" :rules="[{ required: true, message: '请输入端口名称' }]">
          <a-input v-model="addForm.portName" placeholder="如 port-eth0、br-eth1 等" />
          <div style="color: #888; font-size: 12px;">这是OVS网桥中的端口名称</div>
        </a-form-item>
        <a-form-item v-if="addForm.type === 'normal'" label="网卡名称" field="nicName" :rules="[{ required: true, message: '请输入要绑定的网卡名称' }]">
          <a-input v-model="addForm.nicName" placeholder="如 eth0、eth1、veth0 等" />
          <div style="color: #888; font-size: 12px;">请确保该网卡已存在于主机上</div>
        </a-form-item>
        <a-form-item v-if="addForm.type && addForm.type !== 'normal' && addForm.type !== ''" label="端口名" field="portName" :rules="[{ required: true, message: '请输入端口名' }]">
          <a-input v-model="addForm.portName" placeholder="请输入端口名" />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:visible="showConfigModal" :title="`端口配置 - ${currentPort?.name || ''}`" @ok="saveConfig" @cancel="closeConfigModal">
      <a-form :model="configForm">
        <template v-if="showIpVlanConfig">
          <a-form-item label="当前IP地址列表">
            <div v-if="currentPortIps.length > 0" style="margin-bottom: 10px;">
              <a-tag
                v-for="ip in currentPortIps"
                :key="ip"
                closable
                @close="deleteIp(ip)"
                style="margin: 2px;"
              >
                {{ ip }}
              </a-tag>
            </div>
            <div v-else style="color: #888; font-size: 12px;">暂无IP地址</div>
          </a-form-item>
          <a-form-item label="添加IP地址" field="ip">
            <a-input v-model="configForm.ip" placeholder="如 192.168.1.10/24" />
            <div style="color: #888; font-size: 12px;">格式：IP/子网掩码，如 192.168.1.10/24</div>
          </a-form-item>
          <a-form-item label="VLAN" field="vlan">
            <a-input-number v-model="configForm.vlan" :min="1" :max="4094" placeholder="可选" style="width: 100%" />
            <div style="color: #888; font-size: 12px;">设置VLAN标签（可选）</div>
          </a-form-item>
          
          <!-- 路由管理（仅对internal类型） -->
          <template v-if="currentPort?.type === 'internal'">
            <a-form-item label="当前路由列表">
              <div v-if="currentPortRoutes.length > 0" style="margin-bottom: 10px;">
                <a-tag
                  v-for="route in currentPortRoutes"
                  :key="route"
                  closable
                  @close="deleteRoute(route)"
                  style="margin: 2px;"
                >
                  {{ route }}
                </a-tag>
              </div>
              <div v-else style="color: #888; font-size: 12px;">暂无路由</div>
            </a-form-item>
            <a-form-item label="目标网络" field="destination">
              <a-input v-model="routeForm.destination" placeholder="如 192.168.2.0/24" />
            </a-form-item>
            <a-form-item label="网关" field="gateway">
              <a-input v-model="routeForm.gateway" placeholder="如 192.168.1.1" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="addRoute">添加路由</a-button>
            </a-form-item>
          </template>
        </template>
        <template v-else-if="['gre','vxlan','geneve'].includes(currentPort?.type)">
          <a-form-item label="远端IP (remote_ip)" field="remote_ip" :rules="[{ required: true, message: '请输入远端IP' }]">
            <a-input v-model="configForm.remote_ip" placeholder="如 10.0.0.2" />
          </a-form-item>
          <a-form-item v-if="['vxlan','geneve'].includes(currentPort?.type)" label="VNI" field="vni">
            <a-input v-model="configForm.vni" placeholder="可选 VNI (VXLAN/Geneve)" />
          </a-form-item>
          <a-form-item label="Key" field="key">
            <a-input v-model="configForm.key" placeholder="可选 key" />
          </a-form-item>
          <a-form-item label="Up/Down" field="up">
            <a-switch v-model="configForm.up" checked-children="Up" unchecked-children="Down" />
          </a-form-item>
        </template>
        <template v-else-if="currentPort?.type === 'patch'">
          <a-form-item label="Peer端口名" field="peer" :rules="[{ required: true, message: '请输入Peer端口名' }]">
            <a-input v-model="configForm.peer" placeholder="如 patch-peer" />
          </a-form-item>
          <a-form-item label="Up/Down" field="up">
            <a-switch v-model="configForm.up" checked-children="Up" unchecked-children="Down" />
          </a-form-item>
        </template>
        <template v-else-if="currentPort?.type === 'bond'">
          <a-form-item label="成员端口" field="members" :rules="[{ required: true, message: '请选择成员端口' }]">
            <a-select v-model="configForm.members" mode="multiple" placeholder="请选择成员端口">
              <a-option v-for="item in portList" :key="item.name" :value="item.name">{{ item.name }}</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="模式" field="mode" :rules="[{ required: true, message: '请选择模式' }]">
            <a-select v-model="configForm.mode" placeholder="请选择Bond模式">
              <a-option value="balance-slb">balance-slb</a-option>
              <a-option value="active-backup">active-backup</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Up/Down" field="up">
            <a-switch v-model="configForm.up" checked-children="Up" unchecked-children="Down" />
          </a-form-item>
        </template>
        <template v-else-if="currentPort?.type === 'tap' || currentPort?.type === 'tun'">
          <a-form-item label="IP 地址" field="ip">
            <a-input v-model="configForm.ip" placeholder="如 192.168.1.10/24" />
          </a-form-item>
          <a-form-item label="VLAN" field="vlan">
            <a-input-number v-model="configForm.vlan" :min="1" :max="4094" placeholder="可选" style="width: 100%" />
          </a-form-item>
          <a-form-item label="Up/Down" field="up">
            <a-switch v-model="configForm.up" checked-children="Up" unchecked-children="Down" />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item label="Up/Down" field="up">
            <a-switch v-model="configForm.up" checked-children="Up" unchecked-children="Down" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
    <a-modal v-model:visible="showPatchPairModal" title="成对创建 Patch Port" @ok="addPatchPair">
      <a-form :model="patchPairForm" ref="patchPairFormRef">
        <a-form-item label="BridgeA" field="bridgeA" :rules="[{ required: true, message: '请输入 BridgeA' }]">
          <a-input v-model="patchPairForm.bridgeA" />
        </a-form-item>
        <a-form-item label="PortA" field="portA" :rules="[{ required: true, message: '请输入 PortA' }]">
          <a-input v-model="patchPairForm.portA" />
        </a-form-item>
        <a-form-item label="BridgeB" field="bridgeB" :rules="[{ required: true, message: '请输入 BridgeB' }]">
          <a-input v-model="patchPairForm.bridgeB" />
        </a-form-item>
        <a-form-item label="PortB" field="portB" :rules="[{ required: true, message: '请输入 PortB' }]">
          <a-input v-model="patchPairForm.portB" />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:visible="showAliasModal" title="设置端口别名" @ok="setAlias" @cancel="showAliasModal = false">
      <a-form :model="aliasForm" ref="aliasFormRef">
        <a-form-item label="端口名" field="portName">
          <a-input v-model="aliasForm.portName" disabled />
        </a-form-item>
        <a-form-item label="别名" field="alias" :rules="[{ required: true, message: '请输入别名' }]">
          <a-input v-model="aliasForm.alias" placeholder="请输入别名" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { listPorts, addPort as apiAddPort, deletePort as apiDeletePort, setPortUpDown as apiSetPortUpDown, setPortAddr as apiSetPortAddr, getPortAddrs as apiGetPortAddrs, deletePortAddr as apiDeletePortAddr, setPortVlanTag as apiSetPortVlan, addTunnelPort as apiAddTunnelPort, addPatchPort as apiAddPatchPort, addBondPort as apiAddBondPort, addTapPort as apiAddTapPort, addTunPort as apiAddTunPort, addPatchPortPair, setPortAlias as apiSetPortAlias, setPortRoute as apiSetPortRoute, deletePortRoute as apiDeletePortRoute, getPortRoutes as apiGetPortRoutes } from '@/api/ovs/port'
import { Message } from '@arco-design/web-vue'
const props = defineProps({ bridge: String })

const portList = ref([])
const showAddModal = ref(false)
const addForm = ref({ portName: '', type: '', autoCreateNic: false, nicName: '' })
const addFormRef = ref()

const showConfigModal = ref(false)
const currentPort = ref(null)
const currentPortIps = ref([])
const configForm = ref({ ip: '', up: true, vlan: null, remote_ip: '', key: '', vni: '', peer: '', members: [], mode: '' })

const showPatchPairModal = ref(false)
const patchPairForm = ref({ bridgeA: '', portA: '', bridgeB: '', portB: '' })
const patchPairFormRef = ref()

const showAliasModal = ref(false)
const aliasForm = ref({ portName: '', alias: '' })
const aliasFormRef = ref()

const currentPortRoutes = ref([])
const routeForm = ref({ destination: '', gateway: '' })
const routeFormRef = ref()

const columns = [
  { title: '端口名', dataIndex: 'name' },
  { title: '别名', dataIndex: 'alias' },
  { title: '类型', dataIndex: 'type' },
  { title: '状态', slotName: 'status' },
  { title: '操作', slotName: 'actions' }
]

const showIpVlanConfig = computed(() => {
  return ['', 'normal', 'internal'].includes(currentPort.value?.type || '')
})

const fetchPorts = async () => {
  if (!props.bridge) return
  try {
  const res = await listPorts({ bridge: props.bridge })
    // 为每个端口添加状态加载属性
    portList.value = (res.data?.ports || []).map(port => ({
      ...port,
      statusLoading: false
    }))
  } catch (error) {
    Message.error('获取端口列表失败：' + error.message)
  }
}

const addPort = async () => {
  await addFormRef.value?.validate()
  if (addForm.value.type === 'tap') {
    await apiAddTapPort({ bridge: props.bridge, portName: addForm.value.portName })
  } else if (addForm.value.type === 'tun') {
    await apiAddTunPort({ bridge: props.bridge, portName: addForm.value.portName })
  } else if (addForm.value.type === 'normal') {
    // 对于normal类型，使用端口名称作为OVS端口名，网卡名称作为实际桥接的网卡
    await apiAddPort({ bridge: props.bridge, portName: addForm.value.portName, type: addForm.value.type, nicName: addForm.value.nicName })
  } else {
    await apiAddPort({ bridge: props.bridge, portName: addForm.value.portName, type: addForm.value.type, autoCreateNic: addForm.value.autoCreateNic })
  }
  showAddModal.value = false
  addForm.value = { portName: '', type: '', autoCreateNic: false, nicName: '' }
  fetchPorts()
}

const deletePort = async (record) => {
  await apiDeletePort({ bridge: props.bridge, portName: record.name })
  fetchPorts()
}

const togglePortStatus = async (record, checked) => {
  // 设置加载状态
  record.statusLoading = true
  try {
    await apiSetPortUpDown({ netns: '1', portName: record.name, up: checked })
    // 更新本地状态
    record.up = checked
    Message.success(`端口 ${record.name} 状态已${checked ? '启用' : '禁用'}`)
  } catch (error) {
    Message.error(`切换端口状态失败：${error.message}`)
    // 恢复原状态
    record.up = !checked
  } finally {
    // 清除加载状态
    record.statusLoading = false
  }
}

const openConfigModal = async (record) => {
  currentPort.value = record
  showConfigModal.value = true
  configForm.value = { ip: '', up: true, vlan: null, remote_ip: '', key: '', vni: '', peer: '', members: [], mode: '' }
  
  // 获取当前端口的IP地址列表
  if (showIpVlanConfig.value) {
    try {
      const res = await apiGetPortAddrs({ portName: record.name })
      currentPortIps.value = res.data?.ips || []
    } catch (error) {
      console.error('获取IP地址列表失败:', error)
      currentPortIps.value = []
    }
  }
  
  // 获取当前端口的路由列表（仅对internal类型）
  if (record.type === 'internal') {
    try {
      const res = await apiGetPortRoutes({ portName: record.name })
      currentPortRoutes.value = res.data?.routes || []
    } catch (error) {
      console.error('获取路由列表失败:', error)
      currentPortRoutes.value = []
    }
  }
}

const deleteIp = async (ip) => {
  try {
    await apiDeletePortAddr({ portName: currentPort.value.name, ip })
    Message.success(`删除IP地址 ${ip} 成功`)
    // 重新获取IP地址列表
    const res = await apiGetPortAddrs({ portName: currentPort.value.name })
    currentPortIps.value = res.data?.ips || []
  } catch (error) {
    Message.error(`删除IP地址失败：${error.message}`)
  }
}

const deleteRoute = async (route) => {
  try {
    // 解析路由字符串，格式如: "192.168.1.0/24 via 192.168.1.1 dev int0"
    const parts = route.split(' ')
    const destination = parts[0]
    const gateway = parts[2]
    
    await apiDeletePortRoute({ 
      portName: currentPort.value.name, 
      destination: destination, 
      gateway: gateway 
    })
    Message.success('删除路由成功')
    // 重新获取路由列表
    const res = await apiGetPortRoutes({ portName: currentPort.value.name })
    currentPortRoutes.value = res.data?.routes || []
  } catch (error) {
    Message.error('删除路由失败：' + error.message)
  }
}

const addRoute = async () => {
  try {
    await routeFormRef.value?.validate()
    await apiSetPortRoute({ 
      portName: currentPort.value.name, 
      destination: routeForm.value.destination, 
      gateway: routeForm.value.gateway 
    })
    Message.success('添加路由成功')
    // 重新获取路由列表
    const res = await apiGetPortRoutes({ portName: currentPort.value.name })
    currentPortRoutes.value = res.data?.routes || []
    // 清空表单
    routeForm.value = { destination: '', gateway: '' }
  } catch (error) {
    Message.error('添加路由失败：' + error.message)
  }
}

const closeConfigModal = () => {
  showConfigModal.value = false
  currentPort.value = null
  currentPortIps.value = []
}
const saveConfig = async () => {
  try {
  if (showIpVlanConfig.value) {
      // 对于支持IP配置的端口类型（normal, internal, tap, tun）
    if (configForm.value.ip) {
        await apiSetPortAddr({ portName: currentPort.value.name, ip: configForm.value.ip })
        Message.success(`端口 ${currentPort.value.name} IP地址添加成功`)
        // 重新获取IP地址列表
        const res = await apiGetPortAddrs({ portName: currentPort.value.name })
        currentPortIps.value = res.data?.ips || []
        // 清空输入框
        configForm.value.ip = ''
    }
    if (configForm.value.vlan) {
      await apiSetPortVlan({ portName: currentPort.value.name, tag: configForm.value.vlan })
        Message.success(`端口 ${currentPort.value.name} VLAN标签配置成功`)
    }
  } else if (["gre","vxlan","geneve"].includes(currentPort.value?.type)) {
      // 隧道端口配置
    const options = { remote_ip: configForm.value.remote_ip }
    if (configForm.value.key) options.key = configForm.value.key
    if (["vxlan","geneve"].includes(currentPort.value.type) && configForm.value.vni) options.vni = configForm.value.vni
    await apiAddTunnelPort({ bridge: props.bridge, portName: currentPort.value.name, type: currentPort.value.type, options })
      Message.success(`隧道端口 ${currentPort.value.name} 配置成功`)
  } else if (currentPort.value?.type === 'patch') {
      // Patch端口配置
    await apiAddPatchPort({ bridge: props.bridge, portName: currentPort.value.name, peer: configForm.value.peer })
      Message.success(`Patch端口 ${currentPort.value.name} 配置成功`)
  } else if (currentPort.value?.type === 'bond') {
      // Bond端口配置
    await apiAddBondPort({ bridge: props.bridge, portName: currentPort.value.name, members: configForm.value.members, mode: configForm.value.mode })
      Message.success(`Bond端口 ${currentPort.value.name} 配置成功`)
    }

    // 只有在没有IP地址添加时才关闭模态框
    if (!showIpVlanConfig.value || !configForm.value.ip) {
      showConfigModal.value = false
      currentPort.value = null
      currentPortIps.value = []
      fetchPorts()
    }
  } catch (error) {
    Message.error(`配置失败：${error.message}`)
  }
}

const addPatchPair = async () => {
  await patchPairFormRef.value?.validate()
  await addPatchPortPair(patchPairForm.value)
  showPatchPairModal.value = false
  patchPairForm.value = { bridgeA: '', portA: '', bridgeB: '', portB: '' }
  fetchPorts()
}

const openAliasModal = (record) => {
  aliasForm.value = { portName: record.name, alias: record.alias || '' }
  showAliasModal.value = true
}

const setAlias = async () => {
  try {
    await aliasFormRef.value?.validate()
    await apiSetPortAlias({ portName: aliasForm.value.portName, alias: aliasForm.value.alias })
    Message.success('设置别名成功')
    showAliasModal.value = false
    fetchPorts()
  } catch (error) {
    Message.error('设置别名失败：' + error.message)
  }
}

watch(() => props.bridge, () => {
  fetchPorts()
})

onMounted(fetchPorts)
</script>
