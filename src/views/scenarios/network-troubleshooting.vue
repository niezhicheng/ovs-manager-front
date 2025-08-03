<template>
  <a-card title="网络故障诊断" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择诊断类型" description="选择故障诊断类型" />
      <a-step title="配置诊断参数" description="设置诊断参数" />
      <a-step title="执行诊断" description="执行故障诊断" />
      <a-step title="分析结果" description="分析诊断结果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="diagnosisForm" layout="vertical">
          <a-form-item label="诊断类型">
            <a-select v-model="diagnosisForm.type" placeholder="选择诊断类型">
              <a-option value="connectivity">连通性诊断</a-option>
              <a-option value="performance">性能诊断</a-option>
              <a-option value="security">安全诊断</a-option>
              <a-option value="configuration">配置诊断</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="目标网桥">
            <a-select v-model="diagnosisForm.bridge" placeholder="选择目标网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="诊断范围">
            <a-select v-model="diagnosisForm.scope" placeholder="选择诊断范围">
              <a-option value="all">全部组件</a-option>
              <a-option value="ports">端口诊断</a-option>
              <a-option value="flows">流表诊断</a-option>
              <a-option value="qos">QoS诊断</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="paramForm" layout="vertical">
          <a-form-item label="诊断深度">
            <a-select v-model="paramForm.depth" placeholder="选择诊断深度">
              <a-option value="basic">基础诊断</a-option>
              <a-option value="detailed">详细诊断</a-option>
              <a-option value="comprehensive">全面诊断</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="超时时间(秒)">
            <a-input-number v-model="paramForm.timeout" :min="5" :max="300" :default-value="30" />
          </a-form-item>
          <a-form-item label="重试次数">
            <a-input-number v-model="paramForm.retries" :min="1" :max="10" :default-value="3" />
          </a-form-item>
          <a-form-item label="目标地址">
            <a-input v-model="paramForm.target" placeholder="例如: 192.168.1.1" />
          </a-form-item>
          <a-form-item label="端口范围">
            <a-input v-model="paramForm.portRange" placeholder="例如: 1-10" />
          </a-form-item>
          <a-form-item label="生成报告">
            <a-switch v-model="paramForm.generateReport" />
            <span style="margin-left: 8px;">生成详细诊断报告</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-space direction="vertical" style="width: 100%">
          <a-button type="primary" @click="startDiagnosis" :loading="diagnosisLoading">开始诊断</a-button>
          <a-button @click="stopDiagnosis">停止诊断</a-button>
          <div v-if="diagnosisProgress" class="diagnosis-progress">
            <a-progress :percent="diagnosisProgress" status="active" />
            <p>正在执行诊断... {{ diagnosisProgress }}%</p>
          </div>
          <div v-if="diagnosisResults" class="diagnosis-results">
            <pre>{{ diagnosisResults }}</pre>
          </div>
        </a-space>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="analyzeResults">分析结果</a-button>
          <a-button @click="generateReport">生成报告</a-button>
          <a-button @click="suggestSolutions">建议解决方案</a-button>
          <div v-if="analysisResults" class="analysis-results">
            <h4>诊断分析结果:</h4>
            <pre>{{ analysisResults }}</pre>
          </div>
          <div v-if="solutions" class="solutions">
            <h4>建议解决方案:</h4>
            <pre>{{ solutions }}</pre>
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
const diagnosisLoading = ref(false)
const diagnosisProgress = ref(0)
const diagnosisResults = ref('')
const analysisResults = ref('')
const solutions = ref('')

const diagnosisForm = reactive({ type: 'connectivity', bridge: '', scope: 'all' })
const paramForm = reactive({ depth: 'detailed', timeout: 30, retries: 3, target: '192.168.1.1', portRange: '1-10', generateReport: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络故障诊断配置已应用') }

const startDiagnosis = async () => {
  diagnosisLoading.value = true
  diagnosisProgress.value = 0
  
  // 模拟诊断过程
  const interval = setInterval(() => {
    diagnosisProgress.value += 10
    if (diagnosisProgress.value >= 100) {
      clearInterval(interval)
      diagnosisLoading.value = false
      diagnosisResults.value = '诊断完成!\n\n连通性测试:\n- 端口1: 正常\n- 端口2: 正常\n- 端口3: 异常 (无响应)\n\n流表检查:\n- 流表规则: 正常\n- 匹配统计: 正常\n\nQoS检查:\n- QoS策略: 正常\n- 队列状态: 正常\n\n发现的问题:\n1. 端口3连接异常\n2. 建议检查物理连接'
    }
  }, 500)
}

const stopDiagnosis = () => {
  diagnosisLoading.value = false
  diagnosisProgress.value = 0
  Message.info('诊断已停止')
}

const analyzeResults = () => {
  analysisResults.value = '诊断分析:\n\n问题分类:\n1. 连通性问题: 端口3无响应\n2. 配置问题: 无\n3. 性能问题: 无\n\n影响范围:\n- 影响程度: 中等\n- 影响范围: 局部\n- 业务影响: 部分服务中断\n\n根本原因:\n- 物理连接故障\n- 端口配置错误'
}

const generateReport = () => {
  Message.success('诊断报告已生成')
}

const suggestSolutions = () => {
  solutions.value = '建议解决方案:\n\n1. 立即措施:\n   - 检查端口3物理连接\n   - 重启端口3\n   - 验证端口配置\n\n2. 短期措施:\n   - 更换网线\n   - 检查交换机端口状态\n   - 更新端口配置\n\n3. 长期措施:\n   - 实施端口监控\n   - 建立故障预警机制\n   - 完善网络文档'
}
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.diagnosis-progress { margin: 20px 0; }
.diagnosis-results, .analysis-results, .solutions { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.diagnosis-results pre, .analysis-results pre, .solutions pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 