<template>
  <a-card title="网络切片配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建网络切片" description="创建5G网络切片" />
      <a-step title="配置切片资源" description="配置切片网络资源" />
      <a-step title="配置切片策略" description="配置切片QoS策略" />
      <a-step title="测试切片" description="测试网络切片功能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="sliceForm" layout="vertical">
          <a-form-item label="切片名称">
            <a-input v-model="sliceForm.name" placeholder="例如: eMBB-slice" />
          </a-form-item>
          <a-form-item label="切片类型">
            <a-select v-model="sliceForm.type" placeholder="选择切片类型">
              <a-option value="embb">eMBB (增强移动宽带)</a-option>
              <a-option value="urllc">URLLC (超可靠低延迟通信)</a-option>
              <a-option value="mmtc">mMTC (海量机器类通信)</a-option>
              <a-option value="custom">自定义切片</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="切片描述">
            <a-textarea v-model="sliceForm.description" placeholder="例如: 用于高清视频流和AR/VR应用" :rows="3" />
          </a-form-item>
          <a-form-item label="切片优先级">
            <a-input-number v-model="sliceForm.priority" :min="1" :max="10" :default-value="5" />
          </a-form-item>
          <a-form-item label="切片状态">
            <a-select v-model="sliceForm.status" placeholder="选择切片状态">
              <a-option value="active">激活</a-option>
              <a-option value="inactive">非激活</a-option>
              <a-option value="maintenance">维护</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="生命周期管理">
            <a-switch v-model="sliceForm.lifecycleManagement" />
            <span style="margin-left: 8px;">启用自动生命周期管理</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="resourceForm" layout="vertical">
          <a-form-item label="网络资源分配">
            <a-input-number v-model="resourceForm.bandwidth" :min="1" :max="10000" :default-value="1000" />
            <span style="margin-left: 8px;">Mbps带宽</span>
          </a-form-item>
          <a-form-item label="计算资源分配">
            <a-input-number v-model="resourceForm.cpu" :min="1" :max="100" :default-value="20" />
            <span style="margin-left: 8px;">% CPU资源</span>
          </a-form-item>
          <a-form-item label="存储资源分配">
            <a-input-number v-model="resourceForm.storage" :min="1" :max="1000" :default-value="100" />
            <span style="margin-left: 8px;">GB存储资源</span>
          </a-form-item>
          <a-form-item label="网络接口">
            <a-select v-model="resourceForm.interfaces" placeholder="选择网络接口" multiple>
              <a-option value="core">核心网络接口</a-option>
              <a-option value="access">接入网络接口</a-option>
              <a-option value="transport">传输网络接口</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="虚拟网络">
            <a-input v-model="resourceForm.virtualNetwork" placeholder="例如: vnet-slice-001" />
          </a-form-item>
          <a-form-item label="子网配置">
            <a-input v-model="resourceForm.subnet" placeholder="例如: 10.1.1.0/24" />
          </a-form-item>
          <a-form-item label="网关地址">
            <a-input v-model="resourceForm.gateway" placeholder="例如: 10.1.1.1" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="policyForm" layout="vertical">
          <a-form-item label="QoS策略">
            <a-select v-model="policyForm.qosPolicy" placeholder="选择QoS策略">
              <a-option value="guaranteed">保证带宽</a-option>
              <a-option value="best-effort">尽力而为</a-option>
              <a-option value="priority">优先级</a-option>
              <a-option value="custom">自定义</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="延迟要求">
            <a-input-number v-model="policyForm.latency" :min="1" :max="1000" :default-value="10" />
            <span style="margin-left: 8px;">ms最大延迟</span>
          </a-form-item>
          <a-form-item label="可靠性要求">
            <a-input-number v-model="policyForm.reliability" :min="90" :max="99.999" :default-value="99.9" />
            <span style="margin-left: 8px;">%可靠性</span>
          </a-form-item>
          <a-form-item label="丢包率要求">
            <a-input-number v-model="policyForm.packetLoss" :min="0.001" :max="10" :default-value="0.1" />
            <span style="margin-left: 8px;">%最大丢包率</span>
          </a-form-item>
          <a-form-item label="安全策略">
            <a-select v-model="policyForm.securityPolicy" placeholder="选择安全策略">
              <a-option value="high">高安全级别</a-option>
              <a-option value="medium">中安全级别</a-option>
              <a-option value="low">低安全级别</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="加密要求">
            <a-switch v-model="policyForm.encryption" />
            <span style="margin-left: 8px;">启用端到端加密</span>
          </a-form-item>
          <a-form-item label="访问控制">
            <a-switch v-model="policyForm.accessControl" />
            <span style="margin-left: 8px;">启用访问控制</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createSlice">创建网络切片</a-button>
          <a-button @click="testSlicePerformance">测试切片性能</a-button>
          <a-button @click="testSliceIsolation">测试切片隔离</a-button>
          <a-button @click="showSliceStatus">显示切片状态</a-button>
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
const sliceForm = reactive({ name: 'eMBB-slice', type: 'embb', description: '用于高清视频流和AR/VR应用', priority: 5, status: 'active', lifecycleManagement: true })
const resourceForm = reactive({ bandwidth: 1000, cpu: 20, storage: 100, interfaces: ['core', 'access'], virtualNetwork: 'vnet-slice-001', subnet: '10.1.1.0/24', gateway: '10.1.1.1' })
const policyForm = reactive({ qosPolicy: 'guaranteed', latency: 10, reliability: 99.9, packetLoss: 0.1, securityPolicy: 'high', encryption: true, accessControl: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络切片配置已应用') }
const createSlice = () => { testResults.value = '网络切片创建结果:\n切片名称: eMBB-slice\n切片类型: eMBB (增强移动宽带)\n优先级: 5\n状态: 激活\n\n资源分配:\n- 带宽: 1000Mbps\n- CPU: 20%\n- 存储: 100GB\n- 虚拟网络: vnet-slice-001\n\nQoS策略:\n- 延迟要求: 10ms\n- 可靠性: 99.9%\n- 丢包率: 0.1%\n- 安全级别: 高' }
const testSlicePerformance = () => { testResults.value = '切片性能测试:\n带宽测试:\n- 实际带宽: 985Mbps\n- 带宽利用率: 98.5%\n- 带宽稳定性: 优秀\n\n延迟测试:\n- 平均延迟: 8.5ms\n- 最大延迟: 12ms\n- 延迟抖动: 2ms\n\n可靠性测试:\n- 可用性: 99.95%\n- 丢包率: 0.05%\n- 连接稳定性: 优秀' }
const testSliceIsolation = () => { testResults.value = '切片隔离测试:\n网络隔离:\n- 切片间隔离: 完全隔离\n- 资源隔离: 完全隔离\n- 流量隔离: 完全隔离\n\n安全隔离:\n- 访问控制: 正常\n- 加密传输: 正常\n- 安全策略: 生效\n\n性能隔离:\n- 带宽隔离: 正常\n- CPU隔离: 正常\n- 存储隔离: 正常' }
const showSliceStatus = () => { testResults.value = '网络切片状态:\n切片名称: eMBB-slice\n运行状态: 正常\n运行时间: 48小时\n用户数量: 1250个\n\n资源使用情况:\n- 带宽使用率: 75%\n- CPU使用率: 65%\n- 存储使用率: 45%\n\n性能指标:\n- 平均延迟: 8.5ms\n- 平均带宽: 750Mbps\n- 可用性: 99.95%\n\n告警信息:\n- 无告警\n- 系统运行正常' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 