<template>
  <div>
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增端口</a-button>
        <a-button @click="fetchPorts">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="portList" row-key="portName">
        <template #type="{ record }">
          <a-tag :color="getPortTypeColor(record.type)">
            {{ record.type || 'normal' }}
          </a-tag>
        </template>
        <template #status="{ record }">
          <a-switch
            :model-value="record.up"
            @change="(checked) => togglePortStatus(record, checked)"
            checked-children="Up"
            unchecked-children="Down"
            :loading="record.statusLoading"
            :disabled="!canTogglePortStatus(record)"
          />
          <div v-if="(record.type === 'geneve' || record.type === 'vxlan') && !record.up" style="font-size: 12px; color: #ff4d4f; margin-top: 4px;">
            {{ getTunnelStatusTip(record) || '需要先配置远端IP' }}
          </div>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" type="primary" @click="openConfigModal(record)">配置</a-button>
            <a-button size="mini" @click="openAliasModal(record)">别名</a-button>
            <a-button size="mini" status="danger" @click="deletePort(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增端口" @ok="addPort">
      <a-form :model="addForm" ref="addFormRef">
        <a-form-item label="类型" field="type">
          <a-select v-model="addForm.type" placeholder="请选择端口类型" allow-clear>
            <a-option value="normal">normal - 普通端口（最常用）</a-option>
            <a-option value="internal">internal - 内部端口</a-option>
            <a-option value="vxlan">vxlan - VXLAN隧道</a-option>
            <a-option value="gre">gre - GRE隧道</a-option>
            <a-option value="geneve">geneve - Geneve隧道</a-option>
            <a-option value="tap">tap - TAP设备</a-option>
            <a-option value="tun">tun - TUN设备</a-option>
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
  { title: '类型', slotName: 'type' },
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
  const originalStatus = record.up
  
  try {
    // 对于隧道端口类型，需要特殊处理
    if (record.type === 'geneve' || record.type === 'vxlan') {
      // 检查隧道端口是否配置了必要的参数
      if (!record.remote_ip && checked) {
        const portType = record.type === 'geneve' ? 'Geneve' : 'VXLAN'
        Message.warning(`${portType}端口需要先配置远端IP才能启用`)
        record.up = originalStatus
        return
      }
      
      // 对于VXLAN端口，还需要检查VNI配置
      if (record.type === 'vxlan' && !record.vni && checked) {
        Message.warning('VXLAN端口需要先配置VNI才能启用')
        record.up = originalStatus
        return
      }
      
      console.log(`OVS 2.5.0支持${record.type}端口类型，检查配置...`)
    }
    
    await apiSetPortUpDown({ netns: '1', portName: record.name, up: checked })
    // 更新本地状态
    record.up = checked
    Message.success(`端口 ${record.name} 状态已${checked ? '启用' : '禁用'}`)
  } catch (error) {
    console.error('切换端口状态失败:', error)
    
    // 针对隧道端口的特殊错误处理
    if (record.type === 'geneve' || record.type === 'vxlan') {
      const portType = record.type === 'geneve' ? 'Geneve' : 'VXLAN'
      if (error.message.includes('not supported') || error.message.includes('unsupported')) {
        Message.error(`当前OVS版本不支持${portType}端口类型的开关操作`)
      } else if (error.message.includes('remote_ip') || error.message.includes('remote ip')) {
        Message.error(`${portType}端口需要先配置远端IP才能启用`)
      } else if (error.message.includes('vni') || error.message.includes('VNI')) {
        Message.error(`${portType}端口需要先配置VNI才能启用`)
      } else if (error.message.includes('tunnel') || error.message.includes('tunnel')) {
        Message.error(`${portType}隧道配置错误，请检查remote_ip和VNI配置`)
      } else {
        Message.error(`${portType}端口状态切换失败：${error.message || '操作失败'}`)
      }
    } else {
      Message.error(`切换端口状态失败：${error.message || '操作失败'}`)
    }
    
    // 恢复原状态
    record.up = originalStatus
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
      
      // 对于隧道端口，确保配置完整
      if (currentPort.value.type === 'geneve' && !configForm.value.remote_ip) {
        Message.error('Geneve端口必须配置远端IP')
        return
      }
      if (currentPort.value.type === 'vxlan' && !configForm.value.remote_ip) {
        Message.error('VXLAN端口必须配置远端IP')
        return
      }
      if (currentPort.value.type === 'vxlan' && !configForm.value.vni) {
        Message.error('VXLAN端口必须配置VNI')
        return
      }
      
      await apiAddTunnelPort({ bridge: props.bridge, portName: currentPort.value.name, type: currentPort.value.type, options })
      Message.success(`隧道端口 ${currentPort.value.name} 配置成功`)
      
      // 如果配置了up状态，尝试启用端口
      if (configForm.value.up) {
        try {
          await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: true })
          Message.success(`端口 ${currentPort.value.name} 已启用`)
        } catch (error) {
          console.error('启用端口失败:', error)
          Message.warning(`端口配置成功，但启用失败：${error.message}`)
        }
      }
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
    console.error('配置保存失败:', error)
    Message.error(`配置失败：${error.message || '保存失败'}`)
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

// 获取端口类型颜色
const getPortTypeColor = (type) => {
  const colorMap = {
    'normal': 'blue',
    'internal': 'green',
    'patch': 'orange',
    'vxlan': 'purple',
    'gre': 'cyan',
    'geneve': 'magenta',
    'tap': 'pink',
    'tun': 'red',
    'bond': 'volcano'
  }
  return colorMap[type] || 'default'
}

// 检查OVS版本和geneve支持
const checkOvsSupport = async () => {
  try {
    // 这里可以调用后端API检查OVS版本和geneve支持
    // 暂时返回true，实际应该调用后端检查
    return true
  } catch (error) {
    console.error('OVS支持检查失败:', error)
    return false
  }
}

// 检查端口是否可以切换状态
const canTogglePortStatus = (record) => {
  // 隧道端口需要先配置必要参数才能启用
  if (record.type === 'geneve' || record.type === 'vxlan') {
    if (!record.remote_ip && record.up === false) {
      return false
    }
    // 对于VXLAN端口，还需要检查VNI配置
    if (record.type === 'vxlan' && !record.vni && record.up === false) {
      return false
    }
    // 检查隧道端口的其他必要配置
    if (record.up === false && (!record.remote_ip || record.remote_ip === '')) {
      return false
    }
  }
  return true
}

// 获取隧道端口的配置状态提示
const getTunnelStatusTip = (record) => {
  if (record.type === 'geneve' || record.type === 'vxlan') {
    const portType = record.type === 'geneve' ? 'Geneve' : 'VXLAN'
    if (!record.remote_ip || record.remote_ip === '') {
      return `需要先配置远端IP`
    }
    if (record.type === 'vxlan' && (!record.vni && record.vni !== 0)) {
      return `建议配置VNI`
    }
    if (record.type === 'geneve' && (!record.vni && record.vni !== 0)) {
      return `建议配置VNI`
    }
  }
  return ''
}

watch(() => props.bridge, () => {
  fetchPorts()
})

onMounted(fetchPorts)
</script>
