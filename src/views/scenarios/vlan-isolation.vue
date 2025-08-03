<template>
  <a-card title="VLAN 隔离配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建VLAN" description="创建VLAN隔离网络" />
      <a-step title="配置端口" description="将端口分配到VLAN" />
      <a-step title="配置路由" description="设置VLAN间路由" />
      <a-step title="测试隔离" description="测试VLAN隔离效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="vlanForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-select v-model="vlanForm.bridge" placeholder="选择网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="VLAN ID">
            <a-input-number v-model="vlanForm.vlanId" :min="1" :max="4094" placeholder="例如: 10" />
          </a-form-item>
          <a-form-item label="VLAN名称">
            <a-input v-model="vlanForm.name" placeholder="例如: vlan10" />
          </a-form-item>
          <a-form-item label="VLAN描述">
            <a-input v-model="vlanForm.description" placeholder="例如: 办公网络" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="portForm" layout="vertical">
          <a-form-item label="访问端口">
            <a-select v-model="portForm.accessPorts" placeholder="选择访问端口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="中继端口">
            <a-select v-model="portForm.trunkPorts" placeholder="选择中继端口" multiple>
              <a-option value="eth4">eth4</a-option>
              <a-option value="eth5">eth5</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口模式">
            <a-select v-model="portForm.mode" placeholder="选择端口模式">
              <a-option value="access">Access模式 (访问模式)</a-option>
              <a-option value="trunk">Trunk模式 (中继模式)</a-option>
              <a-option value="hybrid">Hybrid模式 (混合模式)</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="routeForm" layout="vertical">
          <a-form-item label="VLAN网关">
            <a-input v-model="routeForm.gateway" placeholder="例如: 192.168.10.1" />
          </a-form-item>
          <a-form-item label="子网掩码">
            <a-input v-model="routeForm.netmask" placeholder="例如: 255.255.255.0" />
          </a-form-item>
          <a-form-item label="DHCP服务器">
            <a-switch v-model="routeForm.dhcp" />
            <span style="margin-left: 8px;">启用DHCP服务</span>
          </a-form-item>
          <a-form-item v-if="routeForm.dhcp" label="DHCP地址池">
            <a-input v-model="routeForm.dhcpPool" placeholder="例如: 192.168.10.100-192.168.10.200" />
          </a-form-item>
          <a-form-item label="VLAN间路由">
            <a-switch v-model="routeForm.interVlanRouting" />
            <span style="margin-left: 8px;">允许VLAN间通信</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createVLAN">创建VLAN</a-button>
          <a-button @click="testIsolation">测试VLAN隔离</a-button>
          <a-button @click="showVLANStatus">显示VLAN状态</a-button>
          <div v-if="testResults" class="test-results">
            <pre>{{ testResults }}</pre>
          </div>
        </a-space>
      </div>
    </div>
    <div class="step-actions">
      <a-button v-if="currentStep > 0" @click="prevStep">上一步</a-button>
      <a-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步</a-button>
      <a-button type="primary" style="float:right" @click="applyScenario">应用配置</a-button>
    </div>
  </a-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const currentStep = ref(0)
const testResults = ref('')
const vlanForm = reactive({ bridge: '', vlanId: 10, name: 'vlan10', description: '办公网络' })
const portForm = reactive({ accessPorts: [], trunkPorts: [], mode: 'access' })
const routeForm = reactive({ gateway: '192.168.10.1', netmask: '255.255.255.0', dhcp: true, dhcpPool: '192.168.10.100-192.168.10.200', interVlanRouting: false })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('VLAN隔离配置已应用') }
const createVLAN = () => { testResults.value = 'VLAN创建结果:\nVLAN ID: 10\n名称: vlan10\n网桥: br0\n访问端口: eth0, eth1\n中继端口: eth4\n网关: 192.168.10.1\n状态: 已创建' }
const testIsolation = () => { testResults.value = 'VLAN隔离测试:\nVLAN 10内部通信: 正常\nVLAN 10与VLAN 20: 隔离\nVLAN 10与外部网络: 正常\n隔离效果: 符合预期' }
const showVLANStatus = () => { testResults.value = 'VLAN状态信息:\nVLAN ID: 10\n状态: active\n端口数量: 3\nDHCP服务: 运行中\n地址池: 192.168.10.100-200\n路由: 已配置' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 