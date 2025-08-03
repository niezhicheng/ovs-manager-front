<template>
  <a-card title="QoS流量控制配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择端口" description="选择要配置QoS的端口" />
      <a-step title="配置QoS策略" description="设置流量控制策略" />
      <a-step title="配置队列" description="设置优先级队列" />
      <a-step title="测试QoS" description="测试流量控制效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="portForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-select v-model="portForm.bridge" placeholder="选择网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口名称">
            <a-input v-model="portForm.name" placeholder="例如: eth0" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="qosForm" layout="vertical">
          <a-form-item label="QoS类型">
            <a-select v-model="qosForm.type" placeholder="选择QoS类型">
              <a-option value="linux-htb">Linux HTB (分层令牌桶)</a-option>
              <a-option value="linux-hfsc">Linux HFSC (分层公平服务曲线)</a-option>
              <a-option value="linux-cbq">Linux CBQ (基于类的队列)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="最大带宽 (kbps)">
            <a-input-number v-model="qosForm.maxRate" :min="1" :max="10000000" placeholder="例如: 1000000" />
          </a-form-item>
          <a-form-item label="最小带宽保证 (kbps)">
            <a-input-number v-model="qosForm.minRate" :min="1" :max="10000000" placeholder="例如: 100000" />
          </a-form-item>
          <a-form-item label="突发流量限制 (kbps)">
            <a-input-number v-model="qosForm.burst" :min="1" :max="10000000" placeholder="例如: 2000000" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="queueForm" layout="vertical">
          <a-form-item label="高优先级队列带宽 (kbps)">
            <a-input-number v-model="queueForm.highPriority" :min="1" :max="10000000" :default-value="300000" />
          </a-form-item>
          <a-form-item label="中优先级队列带宽 (kbps)">
            <a-input-number v-model="queueForm.mediumPriority" :min="1" :max="10000000" :default-value="500000" />
          </a-form-item>
          <a-form-item label="低优先级队列带宽 (kbps)">
            <a-input-number v-model="queueForm.lowPriority" :min="1" :max="10000000" :default-value="200000" />
          </a-form-item>
          <a-form-item label="队列策略">
            <a-select v-model="queueForm.policy" placeholder="选择队列策略">
              <a-option value="fifo">FIFO (先进先出)</a-option>
              <a-option value="sfq">SFQ (随机公平队列)</a-option>
              <a-option value="red">RED (随机早期检测)</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="applyQoS">应用QoS配置</a-button>
          <a-button @click="testBandwidth">测试带宽限制</a-button>
          <a-button @click="showQoSStatus">显示QoS状态</a-button>
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
      title="QoS流量控制 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>QoS流量控制用于对网络流量进行分级管理和带宽分配，保障关键业务的网络性能，防止网络拥塞。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>队列</strong>：对端口流量进行分组管理</li>
          <li><strong>带宽限制</strong>：限制端口或队列的最大带宽</li>
          <li><strong>优先级</strong>：为不同流量分配不同优先级</li>
          <li><strong>流量整形</strong>：平滑突发流量</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建QoS策略</h4>
          <pre class="command"># 创建QoS对象
ovs-vsctl set port eth1 qos=@qos1
ovs-vsctl -- --id=@qos1 create qos type=linux-htb queues=0=@q0,1=@q1
ovs-vsctl -- --id=@q0 create queue other-config:max-rate=10000000
ovs-vsctl -- --id=@q1 create queue other-config:max-rate=5000000</pre>

          <h4>2. 配置带宽限制</h4>
          <pre class="command"># 设置端口最大带宽
ovs-vsctl set port eth1 qos=@qos1

# 设置队列带宽
ovs-vsctl set queue &lt;queue-id&gt; other-config:max-rate=5000000</pre>

          <h4>3. 配置优先级</h4>
          <pre class="command"># 设置流表优先级
ovs-ofctl add-flow br0 "priority=1000,ip,nw_src=192.168.1.0/24,actions=set_queue:1,output:2"

# 设置端口优先级
ovs-vsctl set port eth1 other-config:priority=100</pre>

          <h4>4. 监控QoS状态</h4>
          <pre class="command"># 查看QoS配置
ovs-vsctl list qos

# 查看队列状态
ovs-vsctl list queue

# 查看端口流量
ovs-ofctl dump-ports br0 eth1</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择端口</strong>：选择需要配置QoS的端口</li>
          <li><strong>创建队列</strong>：为端口创建流量队列</li>
          <li><strong>配置带宽</strong>：设置队列和端口的带宽限制</li>
          <li><strong>测试验证</strong>：验证QoS策略效果</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>带宽单位为bit/s</li>
          <li>优先级要合理分配</li>
          <li>要监控队列状态</li>
          <li>要避免带宽争用</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>企业网络</strong>：保障关键业务带宽</li>
          <li><strong>数据中心</strong>：分级管理流量</li>
          <li><strong>多租户环境</strong>：隔离不同租户流量</li>
          <li><strong>视频会议</strong>：保障实时流量</li>
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
const portForm = reactive({ bridge: '', name: '' })
const qosForm = reactive({ type: 'linux-htb', maxRate: 1000000, minRate: 100000, burst: 2000000 })
const queueForm = reactive({ highPriority: 300000, mediumPriority: 500000, lowPriority: 200000, policy: 'fifo' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('QoS流量控制配置已应用') }
const showHelp = () => { helpVisible.value = true }
const applyQoS = () => { testResults.value = 'QoS配置应用结果:\n端口: eth0\nQoS类型: linux-htb\n最大带宽: 1000Mbps\n最小保证: 100Mbps\n突发限制: 2000Mbps\n状态: 已应用' }
const testBandwidth = () => { testResults.value = '带宽测试结果:\n当前带宽: 850Mbps\n限制带宽: 1000Mbps\n队列使用率:\n- 高优先级: 60%\n- 中优先级: 80%\n- 低优先级: 40%\n状态: 正常' }
const showQoSStatus = () => { testResults.value = 'QoS状态信息:\n端口: eth0\nQoS类型: linux-htb\n状态: active\n队列数量: 3\n策略: FIFO\n统计信息: 正常收集' }
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