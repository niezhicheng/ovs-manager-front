<template>
  <a-card title="网络命名空间隔离" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建命名空间" description="创建网络命名空间" />
      <a-step title="配置虚拟接口" description="为命名空间配置虚拟接口" />
      <a-step title="设置路由" description="配置命名空间路由" />
      <a-step title="测试隔离" description="测试网络隔离效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="namespaceForm" layout="vertical">
          <a-form-item label="命名空间名称">
            <a-input v-model="namespaceForm.name" placeholder="例如: ns1" />
          </a-form-item>
          <a-form-item label="命名空间描述">
            <a-input v-model="namespaceForm.description" placeholder="例如: 测试环境隔离" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="interfaceForm" layout="vertical">
          <a-form-item label="虚拟接口名称">
            <a-input v-model="interfaceForm.name" placeholder="例如: veth0" />
          </a-form-item>
          <a-form-item label="对端接口名称">
            <a-input v-model="interfaceForm.peer" placeholder="例如: veth1" />
          </a-form-item>
          <a-form-item label="IP地址">
            <a-input v-model="interfaceForm.ip" placeholder="例如: 192.168.100.1/24" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="routeForm" layout="vertical">
          <a-form-item label="默认网关">
            <a-input v-model="routeForm.gateway" placeholder="例如: 192.168.100.1" />
          </a-form-item>
          <a-form-item label="DNS服务器">
            <a-input v-model="routeForm.dns" placeholder="例如: 8.8.8.8" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testIsolation">测试网络隔离</a-button>
          <a-button @click="showNamespaceStatus">显示命名空间状态</a-button>
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
const namespaceForm = reactive({ name: 'ns1', description: '测试环境隔离' })
const interfaceForm = reactive({ name: 'veth0', peer: 'veth1', ip: '192.168.100.1/24' })
const routeForm = reactive({ gateway: '192.168.100.1', dns: '8.8.8.8' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络命名空间隔离配置已应用') }
const testIsolation = () => { testResults.value = '网络隔离测试结果:\n命名空间: ns1\n状态: 已隔离\n虚拟接口: veth0\nIP地址: 192.168.100.1\n隔离效果: 正常' }
const showNamespaceStatus = () => { testResults.value = '命名空间状态:\n名称: ns1\n状态: active\n接口数量: 1\n路由表: 已配置\nDNS: 8.8.8.8' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 