<template>
  <a-card title="网络自动化配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置模板" description="创建配置模板" />
      <a-step title="配置策略" description="设置自动化策略" />
      <a-step title="配置调度" description="设置执行调度" />
      <a-step title="执行自动化" description="执行自动化配置" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="templateForm" layout="vertical">
          <a-form-item label="模板名称">
            <a-input v-model="templateForm.name" placeholder="例如: standard-network" />
          </a-form-item>
          <a-form-item label="模板类型">
            <a-select v-model="templateForm.type" placeholder="选择模板类型">
              <a-option value="bridge">网桥配置模板</a-option>
              <a-option value="vlan">VLAN配置模板</a-option>
              <a-option value="qos">QoS配置模板</a-option>
              <a-option value="security">安全配置模板</a-option>
              <a-option value="monitoring">监控配置模板</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="配置脚本">
            <a-textarea v-model="templateForm.script" placeholder="输入配置脚本..." :rows="8" />
          </a-form-item>
          <a-form-item label="变量定义">
            <a-textarea v-model="templateForm.variables" placeholder="例如: BRIDGE_NAME=br0, VLAN_ID=100" :rows="3" />
          </a-form-item>
          <a-form-item label="验证规则">
            <a-textarea v-model="templateForm.validation" placeholder="例如: 检查端口状态, 验证流表规则" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="policyForm" layout="vertical">
          <a-form-item label="策略名称">
            <a-input v-model="policyForm.name" placeholder="例如: auto-deploy-policy" />
          </a-form-item>
          <a-form-item label="触发条件">
            <a-select v-model="policyForm.trigger" placeholder="选择触发条件">
              <a-option value="manual">手动触发</a-option>
              <a-option value="schedule">定时触发</a-option>
              <a-option value="event">事件触发</a-option>
              <a-option value="condition">条件触发</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="执行模式">
            <a-select v-model="policyForm.mode" placeholder="选择执行模式">
              <a-option value="dry-run">试运行模式</a-option>
              <a-option value="execute">执行模式</a-option>
              <a-option value="rollback">回滚模式</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="错误处理">
            <a-select v-model="policyForm.errorHandling" placeholder="选择错误处理策略">
              <a-option value="stop">停止执行</a-option>
              <a-option value="continue">继续执行</a-option>
              <a-option value="retry">重试执行</a-option>
              <a-option value="rollback">自动回滚</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="通知设置">
            <a-switch v-model="policyForm.notification" />
            <span style="margin-left: 8px;">启用执行结果通知</span>
          </a-form-item>
          <a-form-item v-if="policyForm.notification" label="通知方式">
            <a-select v-model="policyForm.notifyMethod" placeholder="选择通知方式" multiple>
              <a-option value="email">邮件通知</a-option>
              <a-option value="sms">短信通知</a-option>
              <a-option value="webhook">Webhook通知</a-option>
              <a-option value="slack">Slack通知</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="scheduleForm" layout="vertical">
          <a-form-item label="调度名称">
            <a-input v-model="scheduleForm.name" placeholder="例如: daily-maintenance" />
          </a-form-item>
          <a-form-item label="执行频率">
            <a-select v-model="scheduleForm.frequency" placeholder="选择执行频率">
              <a-option value="once">执行一次</a-option>
              <a-option value="daily">每日执行</a-option>
              <a-option value="weekly">每周执行</a-option>
              <a-option value="monthly">每月执行</a-option>
              <a-option value="cron">自定义Cron表达式</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="scheduleForm.frequency === 'cron'" label="Cron表达式">
            <a-input v-model="scheduleForm.cronExpression" placeholder="例如: 0 2 * * *" />
          </a-form-item>
          <a-form-item label="执行时间">
            <a-time-picker v-model="scheduleForm.executionTime" format="HH:mm" />
          </a-form-item>
          <a-form-item label="时区">
            <a-select v-model="scheduleForm.timezone" placeholder="选择时区">
              <a-option value="Asia/Shanghai">Asia/Shanghai</a-option>
              <a-option value="UTC">UTC</a-option>
              <a-option value="America/New_York">America/New_York</a-option>
              <a-option value="Europe/London">Europe/London</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="启用调度">
            <a-switch v-model="scheduleForm.enabled" />
            <span style="margin-left: 8px;">立即启用此调度</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button type="primary" @click="executeAutomation">执行自动化配置</a-button>
          <a-button @click="dryRunAutomation">试运行配置</a-button>
          <a-button @click="showAutomationStatus">显示执行状态</a-button>
          <div v-if="executionResults" class="execution-results">
            <pre>{{ executionResults }}</pre>
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
const executionResults = ref('')
const templateForm = reactive({ 
  name: 'standard-network', 
  type: 'bridge', 
  script: 'ovs-vsctl add-br ${BRIDGE_NAME}\novs-vsctl add-port ${BRIDGE_NAME} ${PORT_NAME}', 
  variables: 'BRIDGE_NAME=br0, PORT_NAME=eth0', 
  validation: '检查网桥状态, 验证端口连接' 
})
const policyForm = reactive({ 
  name: 'auto-deploy-policy', 
  trigger: 'manual', 
  mode: 'execute', 
  errorHandling: 'rollback', 
  notification: true, 
  notifyMethod: ['email'] 
})
const scheduleForm = reactive({ 
  name: 'daily-maintenance', 
  frequency: 'daily', 
  cronExpression: '', 
  executionTime: '02:00', 
  timezone: 'Asia/Shanghai', 
  enabled: true 
})

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络自动化配置已应用') }
const executeAutomation = () => { executionResults.value = '自动化执行结果:\n模板: standard-network\n策略: auto-deploy-policy\n执行时间: 2024-01-15 10:30:00\n状态: 成功\n\n执行步骤:\n1. 创建网桥 br0: 成功\n2. 添加端口 eth0: 成功\n3. 配置VLAN: 成功\n4. 验证配置: 成功\n\n影响范围:\n- 网桥: 1个\n- 端口: 1个\n- 流表规则: 5条' }
const dryRunAutomation = () => { executionResults.value = '试运行结果:\n模板: standard-network\n策略: auto-deploy-policy\n模式: 试运行\n\n模拟执行步骤:\n1. 创建网桥 br0: 将执行\n2. 添加端口 eth0: 将执行\n3. 配置VLAN: 将执行\n4. 验证配置: 将执行\n\n预计影响:\n- 网桥: 1个\n- 端口: 1个\n- 流表规则: 5条\n\n状态: 可以安全执行' }
const showAutomationStatus = () => { executionResults.value = '自动化状态信息:\n调度名称: daily-maintenance\n频率: 每日执行\n执行时间: 02:00\n时区: Asia/Shanghai\n状态: 已启用\n\n最近执行:\n- 2024-01-15 02:00:00: 成功\n- 2024-01-14 02:00:00: 成功\n- 2024-01-13 02:00:00: 成功\n\n下次执行: 2024-01-16 02:00:00' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.execution-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.execution-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 