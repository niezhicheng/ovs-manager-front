<template>
  <a-card title="补丁端口配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择网桥" description="选择要连接的网桥" />
      <a-step title="创建Patch端口" description="创建Patch端口对" />
      <a-step title="配置连接" description="配置端口连接参数" />
      <a-step title="测试连接" description="测试Patch端口连通性" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="bridgeForm" layout="vertical">
          <a-form-item label="源网桥">
            <a-select v-model="bridgeForm.source" placeholder="选择源网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="目标网桥">
            <a-select v-model="bridgeForm.target" placeholder="选择目标网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="patchForm" layout="vertical">
          <a-form-item label="源端口名称">
            <a-input v-model="patchForm.sourcePort" placeholder="例如: patch0" />
          </a-form-item>
          <a-form-item label="目标端口名称">
            <a-input v-model="patchForm.targetPort" placeholder="例如: patch1" />
          </a-form-item>
          <a-form-item label="端口类型">
            <a-select v-model="patchForm.type" placeholder="选择端口类型">
              <a-option value="patch">Patch端口</a-option>
              <a-option value="internal">内部端口</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="configForm" layout="vertical">
          <a-form-item label="MTU大小">
            <a-input-number v-model="configForm.mtu" :min="68" :max="9000" :default-value="1500" />
          </a-form-item>
          <a-form-item label="VLAN标签">
            <a-input-number v-model="configForm.vlan" :min="0" :max="4095" placeholder="可选，0表示无标签" />
          </a-form-item>
          <a-form-item label="QoS策略">
            <a-select v-model="configForm.qos" placeholder="选择QoS策略" allow-clear>
              <a-option value="priority">优先级队列</a-option>
              <a-option value="bandwidth">带宽限制</a-option>
              <a-option value="latency">延迟优化</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testPatchConnection">测试Patch连接</a-button>
          <a-button @click="showPatchStatus">显示Patch状态</a-button>
          <a-button @click="testTraffic">测试流量传输</a-button>
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
const bridgeForm = reactive({ source: '', target: '' })
const patchForm = reactive({ sourcePort: 'patch0', targetPort: 'patch1', type: 'patch' })
const configForm = reactive({ mtu: 1500, vlan: null, qos: '' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('Patch端口连接配置已应用') }
const testPatchConnection = () => { testResults.value = 'Patch连接测试结果:\n源网桥: br0\n目标网桥: br1\n源端口: patch0\n目标端口: patch1\n状态: 连接正常\nMTU: 1500' }
const showPatchStatus = () => { testResults.value = 'Patch端口状态:\n端口对: patch0 <-> patch1\n状态: up\n类型: patch\nMTU: 1500\nVLAN: 无标签\nQoS: 未配置' }
const testTraffic = () => { testResults.value = '流量传输测试:\n测试包大小: 64字节\n传输速率: 1Gbps\n延迟: 0.1ms\n丢包率: 0%\n状态: 正常' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 