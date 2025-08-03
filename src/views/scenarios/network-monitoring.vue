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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="网络监控配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>网络监控用于实时采集、分析和展示网络流量、设备状态和性能指标，帮助运维人员及时发现和处理网络异常。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>流量采集</strong>：收集网络流量数据</li>
          <li><strong>性能监控</strong>：监控带宽、延迟、丢包等指标</li>
          <li><strong>告警机制</strong>：异常时自动告警</li>
          <li><strong>可视化</strong>：图表展示网络状态</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 采集流量数据</h4>
          <pre class="command"># 查看端口流量
ovs-ofctl dump-ports br0

# 查看流表统计
ovs-ofctl dump-flows br0

# 查看队列统计
ovs-vsctl list queue</pre>

          <h4>2. 监控设备状态</h4>
          <pre class="command"># 查看端口状态
ovs-vsctl list interface

# 查看网桥状态
ovs-vsctl show

# 查看设备日志
ovs-appctl vlog/list</pre>

          <h4>3. 配置告警</h4>
          <pre class="command"># 配置流量阈值告警
# (需配合外部监控系统)

# 配置端口状态告警
# (需配合外部监控系统)</pre>

          <h4>4. 可视化展示</h4>
          <pre class="command"># 导出流量数据
ovs-ofctl dump-ports br0 > ports.log

# 导出流表数据
ovs-ofctl dump-flows br0 > flows.log</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择监控类型</strong>：选择需要监控的对象</li>
          <li><strong>配置采集</strong>：设置流量采集和性能监控</li>
          <li><strong>配置告警</strong>：设置阈值和告警规则</li>
          <li><strong>可视化展示</strong>：展示监控数据</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>监控频率要合理设置</li>
          <li>告警规则要避免误报</li>
          <li>要定期清理监控数据</li>
          <li>要关注设备日志</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>数据中心</strong>：实时监控网络状态</li>
          <li><strong>企业网络</strong>：保障业务连续性</li>
          <li><strong>云平台</strong>：多租户网络监控</li>
          <li><strong>安全运维</strong>：发现异常流量</li>
        </ul>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconQuestionCircle } from '@arco-design/web-vue/es/icon'

const currentStep = ref(0)
const testResults = ref('')
const helpVisible = ref(false)
const monitorForm = reactive({ type: 'traffic', description: '流量监控' })
const performanceForm = reactive({ bandwidth: true, latency: true, loss: true })
const alertForm = reactive({ threshold: 80, alert: true, log: true })
const visualForm = reactive({ chart: true, export: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络监控配置已应用') }
const showHelp = () => { helpVisible.value = true }
const startMonitor = () => { testResults.value = '监控启动结果:\n类型: 流量监控\n性能监控: 启用\n告警: 启用\n可视化: 启用\n状态: 运行中' }
const testAlert = () => { testResults.value = '告警测试:\n流量阈值: 80%\n告警状态: 正常\n日志记录: 正常\n性能: 良好' }
const showMonitorStatus = () => { testResults.value = '监控状态:\n类型: 流量监控\n带宽: 950Mbps\n延迟: 1.2ms\n丢包率: 0.01%\n告警: 正常\n日志: 正常' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 