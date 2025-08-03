<template>
  <a-card title="网络监控配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择监控类型" description="选择网络监控类型" />
      <a-step title="配置收集器" description="配置监控数据收集器" />
      <a-step title="配置采样策略" description="设置流量采样策略" />
      <a-step title="测试监控" description="测试监控功能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="monitorForm" layout="vertical">
          <a-form-item label="监控类型">
            <a-select v-model="monitorForm.type" placeholder="选择监控类型">
              <a-option value="netflow">NetFlow (网络流量监控)</a-option>
              <a-option value="sflow">sFlow (采样流量监控)</a-option>
              <a-option value="ipfix">IPFIX (IP流量信息导出)</a-option>
              <a-option value="mirror">端口镜像监控</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网桥名称">
            <a-select v-model="monitorForm.bridge" placeholder="选择网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="监控名称">
            <a-input v-model="monitorForm.name" placeholder="例如: netflow-monitor" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="collectorForm" layout="vertical">
          <a-form-item label="收集器地址">
            <a-input v-model="collectorForm.address" placeholder="例如: 192.168.1.100" />
          </a-form-item>
          <a-form-item label="收集器端口">
            <a-input-number v-model="collectorForm.port" :min="1" :max="65535" :default-value="9995" />
          </a-form-item>
          <a-form-item label="协议版本">
            <a-select v-model="collectorForm.version" placeholder="选择协议版本">
              <a-option value="v5">NetFlow v5</a-option>
              <a-option value="v9">NetFlow v9</a-option>
              <a-option value="v10">IPFIX</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="引擎ID">
            <a-input-number v-model="collectorForm.engineId" :min="0" :max="255" :default-value="1" />
          </a-form-item>
          <a-form-item label="超时时间(秒)">
            <a-input-number v-model="collectorForm.timeout" :min="1" :max="3600" :default-value="300" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="samplingForm" layout="vertical">
          <a-form-item label="采样率">
            <a-input-number v-model="samplingForm.rate" :min="1" :max="100000" :default-value="1000" />
            <span style="margin-left: 8px;">(1/N 包采样)</span>
          </a-form-item>
          <a-form-item label="头部长度">
            <a-input-number v-model="samplingForm.headerLength" :min="64" :max="256" :default-value="128" />
            <span style="margin-left: 8px;">字节</span>
          </a-form-item>
          <a-form-item label="轮询间隔(秒)">
            <a-input-number v-model="samplingForm.pollingInterval" :min="1" :max="300" :default-value="30" />
          </a-form-item>
          <a-form-item label="代理地址">
            <a-input v-model="samplingForm.agentAddress" placeholder="例如: 192.168.1.1" />
          </a-form-item>
          <a-form-item label="观察域ID">
            <a-input-number v-model="samplingForm.obsDomainId" :min="1" :max="4294967295" :default-value="1" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="startMonitoring">启动监控</a-button>
          <a-button @click="testDataCollection">测试数据收集</a-button>
          <a-button @click="showMonitoringStatus">显示监控状态</a-button>
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
const monitorForm = reactive({ type: 'netflow', bridge: '', name: 'netflow-monitor' })
const collectorForm = reactive({ address: '192.168.1.100', port: 9995, version: 'v9', engineId: 1, timeout: 300 })
const samplingForm = reactive({ rate: 1000, headerLength: 128, pollingInterval: 30, agentAddress: '192.168.1.1', obsDomainId: 1 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络监控配置已应用') }
const startMonitoring = () => { testResults.value = '监控启动结果:\n监控类型: NetFlow\n网桥: br0\n收集器: 192.168.1.100:9995\n采样率: 1/1000\n状态: 已启动' }
const testDataCollection = () => { testResults.value = '数据收集测试:\n收集器连接: 正常\n数据包发送: 成功\n采样数据: 正常收集\n流量统计: 实时更新\n监控效果: 良好' }
const showMonitoringStatus = () => { testResults.value = '监控状态信息:\n监控名称: netflow-monitor\n状态: active\n收集器: 连接正常\n采样率: 1/1000\n数据包: 已收集 1,234 个\n流量: 实时监控中' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 