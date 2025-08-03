<template>
  <a-card title="SDN控制器配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置控制器" description="配置SDN控制器参数" />
      <a-step title="配置交换机" description="配置OpenFlow交换机" />
      <a-step title="配置应用" description="配置SDN应用" />
      <a-step title="测试连接" description="测试控制器连接" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="controllerForm" layout="vertical">
          <a-form-item label="控制器类型">
            <a-select v-model="controllerForm.type" placeholder="选择控制器类型">
              <a-option value="ryu">Ryu控制器</a-option>
              <a-option value="floodlight">Floodlight控制器</a-option>
              <a-option value="onos">ONOS控制器</a-option>
              <a-option value="opendaylight">OpenDaylight控制器</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="控制器地址">
            <a-input v-model="controllerForm.address" placeholder="例如: 192.168.1.100" />
          </a-form-item>
          <a-form-item label="控制器端口">
            <a-input-number v-model="controllerForm.port" :min="1" :max="65535" :default-value="6633" />
          </a-form-item>
          <a-form-item label="协议版本">
            <a-select v-model="controllerForm.protocol" placeholder="选择OpenFlow协议版本">
              <a-option value="1.0">OpenFlow 1.0</a-option>
              <a-option value="1.3">OpenFlow 1.3</a-option>
              <a-option value="1.4">OpenFlow 1.4</a-option>
              <a-option value="1.5">OpenFlow 1.5</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="认证方式">
            <a-select v-model="controllerForm.auth" placeholder="选择认证方式">
              <a-option value="none">无认证</a-option>
              <a-option value="tls">TLS认证</a-option>
              <a-option value="ssl">SSL认证</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="switchForm" layout="vertical">
          <a-form-item label="交换机名称">
            <a-input v-model="switchForm.name" placeholder="例如: switch1" />
          </a-form-item>
          <a-form-item label="交换机类型">
            <a-select v-model="switchForm.type" placeholder="选择交换机类型">
              <a-option value="ovs">Open vSwitch</a-option>
              <a-option value="hardware">硬件交换机</a-option>
              <a-option value="virtual">虚拟交换机</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="连接模式">
            <a-select v-model="switchForm.mode" placeholder="选择连接模式">
              <a-option value="active">主动模式</a-option>
              <a-option value="passive">被动模式</a-option>
              <a-option value="out-of-band">带外模式</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口数量">
            <a-input-number v-model="switchForm.portCount" :min="1" :max="100" :default-value="8" />
          </a-form-item>
          <a-form-item label="流表容量">
            <a-input-number v-model="switchForm.flowTableSize" :min="100" :max="100000" :default-value="1000" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="appForm" layout="vertical">
          <a-form-item label="应用名称">
            <a-input v-model="appForm.name" placeholder="例如: learning-switch" />
          </a-form-item>
          <a-form-item label="应用类型">
            <a-select v-model="appForm.type" placeholder="选择应用类型">
              <a-option value="learning">学习交换机</a-option>
              <a-option value="routing">路由应用</a-option>
              <a-option value="firewall">防火墙应用</a-option>
              <a-option value="loadbalancer">负载均衡应用</a-option>
              <a-option value="monitoring">监控应用</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="应用优先级">
            <a-input-number v-model="appForm.priority" :min="1" :max="100" :default-value="50" />
          </a-form-item>
          <a-form-item label="自动启动">
            <a-switch v-model="appForm.autoStart" />
            <span style="margin-left: 8px;">控制器启动时自动启动应用</span>
          </a-form-item>
          <a-form-item label="应用参数">
            <a-textarea v-model="appForm.parameters" placeholder="例如: --verbose --log-level=INFO" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testControllerConnection">测试控制器连接</a-button>
          <a-button @click="testSwitchConnection">测试交换机连接</a-button>
          <a-button @click="testApplication">测试应用功能</a-button>
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
const controllerForm = reactive({ type: 'ryu', address: '192.168.1.100', port: 6633, protocol: '1.3', auth: 'none' })
const switchForm = reactive({ name: 'switch1', type: 'ovs', mode: 'active', portCount: 8, flowTableSize: 1000 })
const appForm = reactive({ name: 'learning-switch', type: 'learning', priority: 50, autoStart: true, parameters: '--verbose --log-level=INFO' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('SDN控制器配置已应用') }
const testControllerConnection = () => { testResults.value = '控制器连接测试:\n控制器类型: Ryu\n地址: 192.168.1.100:6633\n协议版本: OpenFlow 1.3\n连接状态: 成功\n认证状态: 通过\n控制器状态: 运行中' }
const testSwitchConnection = () => { testResults.value = '交换机连接测试:\n交换机名称: switch1\n类型: Open vSwitch\n连接模式: 主动模式\n端口数量: 8\n流表容量: 1000\n连接状态: 已连接\n流表规则: 5条' }
const testApplication = () => { testResults.value = '应用功能测试:\n应用名称: learning-switch\n类型: 学习交换机\n优先级: 50\n状态: 运行中\n功能测试: 通过\n流量处理: 正常\nMAC学习: 正常' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 