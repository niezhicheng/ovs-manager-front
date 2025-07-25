<template>
  <div>
    <a-space direction="vertical" style="width: 100%">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">新增端口</a-button>
        <a-button @click="fetchPorts">刷新</a-button>
      </a-space>
      <a-table :columns="columns" :data="portList" row-key="portName">
        <template #actions="{ record }">
          <a-space>
            <a-button size="mini" @click="openConfigModal(record)">配置</a-button>
            <a-button size="mini" status="danger" @click="deletePort(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>
    </a-space>
    <a-modal v-model:visible="showAddModal" title="新增端口" @ok="addPort">
      <a-form :model="addForm" ref="addFormRef">
        <a-form-item label="类型" field="type">
          <a-select v-model="addForm.type" placeholder="请选择端口类型" allow-clear>
            <a-option value="">默认</a-option>
            <a-option value="normal">normal</a-option>
            <a-option value="internal">internal</a-option>
            <a-option value="gre">gre</a-option>
            <a-option value="vxlan">vxlan</a-option>
            <a-option value="geneve">geneve</a-option>
            <a-option value="tap">tap</a-option>
            <a-option value="tun">tun</a-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="addForm.type === '' || addForm.type === 'normal'" label="网卡名称" field="portName" :rules="[{ required: true, message: '请输入要绑定的网卡名称' }]">
          <a-input v-model="addForm.portName" placeholder="如 eth1、veth0 等" />
          <div style="color: #888; font-size: 12px;">请确保该网卡已存在于主机上</div>
        </a-form-item>
        <a-form-item v-if="addForm.type === '' || addForm.type === 'normal'" label="创建网卡" field="autoCreateNic">
          <a-switch v-model="addForm.autoCreateNic" />
          <span style="margin-left: 8px; color: #888; font-size: 12px;">如选择，系统会尝试自动创建您输入的虚拟网卡</span>
        </a-form-item>
        <a-form-item v-else label="端口名" field="portName" :rules="[{ required: true, message: '请输入端口名' }]">
          <a-input v-model="addForm.portName" placeholder="请输入端口名" />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:visible="showConfigModal" :title="`端口配置 - ${currentPort?.name || ''}`" @ok="saveConfig" @cancel="closeConfigModal">
      <a-form :model="configForm">
        <template v-if="showIpVlanConfig">
          <a-form-item label="IP 地址" field="ip">
            <a-input v-model="configForm.ip" placeholder="如 192.168.1.10/24" />
          </a-form-item>
          <a-form-item label="Up/Down" field="up">
            <a-switch v-model="configForm.up" checked-children="Up" unchecked-children="Down" />
          </a-form-item>
          <a-form-item label="VLAN" field="vlan">
            <a-input-number v-model="configForm.vlan" :min="1" :max="4094" placeholder="可选" style="width: 100%" />
          </a-form-item>
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { listPorts, addPort as apiAddPort, deletePort as apiDeletePort, setPortUpDown as apiSetPortUpDown, setPortAddr as apiSetPortAddr, setPortVlanTag as apiSetPortVlan, addTunnelPort as apiAddTunnelPort, addPatchPort as apiAddPatchPort, addBondPort as apiAddBondPort, addTapPort as apiAddTapPort, addTunPort as apiAddTunPort, addPatchPortPair } from '@/api/ovs/port'
const props = defineProps({ bridge: String })

const portList = ref([])
const showAddModal = ref(false)
const addForm = ref({ portName: '', type: '', autoCreateNic: false })
const addFormRef = ref()

const showConfigModal = ref(false)
const currentPort = ref(null)
const configForm = ref({ ip: '', up: true, vlan: null, remote_ip: '', key: '', vni: '', peer: '', members: [], mode: '' })

const showPatchPairModal = ref(false)
const patchPairForm = ref({ bridgeA: '', portA: '', bridgeB: '', portB: '' })
const patchPairFormRef = ref()

const columns = [
  { title: '端口名', dataIndex: 'name' },
  { title: '类型', dataIndex: 'type' },
  { title: '操作', slotName: 'actions' }
]

const showIpVlanConfig = computed(() => {
  return ['', 'normal', 'internal'].includes(currentPort.value?.type || '')
})

const fetchPorts = async () => {
  if (!props.bridge) return
  const res = await listPorts({ bridge: props.bridge })
  portList.value = res.data?.ports || []
}

const addPort = async () => {
  await addFormRef.value?.validate()
  if (addForm.value.type === 'tap') {
    await apiAddTapPort({ bridge: props.bridge, portName: addForm.value.portName })
  } else if (addForm.value.type === 'tun') {
    await apiAddTunPort({ bridge: props.bridge, portName: addForm.value.portName })
  } else {
    await apiAddPort({ bridge: props.bridge, portName: addForm.value.portName, type: addForm.value.type, autoCreateNic: addForm.value.autoCreateNic })
  }
  showAddModal.value = false
  addForm.value = { portName: '', type: '', autoCreateNic: false }
  fetchPorts()
}

const deletePort = async (record) => {
  await apiDeletePort({ bridge: props.bridge, portName: record.name })
  fetchPorts()
}

const openConfigModal = (record) => {
  currentPort.value = record
  showConfigModal.value = true
  configForm.value = { ip: '', up: true, vlan: null, remote_ip: '', key: '', vni: '', peer: '', members: [], mode: '' }
}
const closeConfigModal = () => {
  showConfigModal.value = false
  currentPort.value = null
}
const saveConfig = async () => {
  if (showIpVlanConfig.value) {
    await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: configForm.value.up })
    if (configForm.value.ip) {
      await apiSetPortAddr({ netns: '1', portName: currentPort.value.name, ip: configForm.value.ip })
    }
    if (configForm.value.vlan) {
      await apiSetPortVlan({ portName: currentPort.value.name, tag: configForm.value.vlan })
    }
  } else if (["gre","vxlan","geneve"].includes(currentPort.value?.type)) {
    const options = { remote_ip: configForm.value.remote_ip }
    if (configForm.value.key) options.key = configForm.value.key
    if (["vxlan","geneve"].includes(currentPort.value.type) && configForm.value.vni) options.vni = configForm.value.vni
    await apiAddTunnelPort({ bridge: props.bridge, portName: currentPort.value.name, type: currentPort.value.type, options })
    await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: configForm.value.up })
  } else if (currentPort.value?.type === 'patch') {
    await apiAddPatchPort({ bridge: props.bridge, portName: currentPort.value.name, peer: configForm.value.peer })
    await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: configForm.value.up })
  } else if (currentPort.value?.type === 'bond') {
    await apiAddBondPort({ bridge: props.bridge, portName: currentPort.value.name, members: configForm.value.members, mode: configForm.value.mode })
    await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: configForm.value.up })
  } else if (currentPort.value?.type === 'tap' || currentPort.value?.type === 'tun') {
    await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: configForm.value.up })
    if (configForm.value.ip) {
      await apiSetPortAddr({ netns: '1', portName: currentPort.value.name, ip: configForm.value.ip })
    }
    if (configForm.value.vlan) {
      await apiSetPortVlan({ portName: currentPort.value.name, tag: configForm.value.vlan })
    }
  } else {
    await apiSetPortUpDown({ netns: '1', portName: currentPort.value.name, up: configForm.value.up })
  }
  showConfigModal.value = false
  currentPort.value = null
  fetchPorts()
}

const addPatchPair = async () => {
  await patchPairFormRef.value?.validate()
  await addPatchPortPair(patchPairForm.value)
  showPatchPairModal.value = false
  patchPairForm.value = { bridgeA: '', portA: '', bridgeB: '', portB: '' }
  fetchPorts()
}

watch(() => props.bridge, () => {
  fetchPorts()
})

onMounted(fetchPorts)
</script>
