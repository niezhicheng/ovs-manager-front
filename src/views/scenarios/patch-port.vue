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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="补丁端口配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>补丁端口用于在同一台交换机的不同网桥之间建立高速直连通道，实现网桥间的数据转发和隔离。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>补丁端口</strong>：连接两个网桥的虚拟端口</li>
          <li><strong>网桥</strong>：虚拟交换机实例</li>
          <li><strong>数据隔离</strong>：不同网桥间的数据隔离</li>
          <li><strong>高性能转发</strong>：补丁端口提供低延迟转发</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建补丁端口</h4>
          <pre class="command"># 在br0和br1之间创建补丁端口
ovs-vsctl add-port br0 patch-br0-br1 -- set interface patch-br0-br1 type=patch options:peer=patch-br1-br0
ovs-vsctl add-port br1 patch-br1-br0 -- set interface patch-br1-br0 type=patch options:peer=patch-br0-br1</pre>

          <h4>2. 配置补丁端口属性</h4>
          <pre class="command"># 设置补丁端口MTU
ovs-vsctl set interface patch-br0-br1 mtu_request=9000

# 查看补丁端口状态
ovs-vsctl list interface patch-br0-br1</pre>

          <h4>3. 测试补丁端口</h4>
          <pre class="command"># 测试网桥间连通性
ping -I br0 192.168.1.2

# 查看流量统计
ovs-ofctl dump-ports br0 patch-br0-br1
ovs-ofctl dump-ports br1 patch-br1-br0</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择网桥</strong>：选择需要连接的两个网桥</li>
          <li><strong>创建补丁端口</strong>：为每个网桥添加补丁端口并互为peer</li>
          <li><strong>配置属性</strong>：设置MTU等参数</li>
          <li><strong>测试验证</strong>：验证补丁端口连通性</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>peer端口名称要正确对应</li>
          <li>MTU要与网络一致</li>
          <li>补丁端口仅限于同一主机</li>
          <li>要监控端口状态</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>多租户网络</strong>：实现租户间隔离</li>
          <li><strong>数据中心</strong>：优化网络拓扑</li>
          <li><strong>虚拟化平台</strong>：连接不同虚拟网络</li>
          <li><strong>高性能计算</strong>：提供高速数据通道</li>
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
const bridgeForm = reactive({ source: '', target: '' })
const patchForm = reactive({ sourcePort: 'patch0', targetPort: 'patch1', type: 'patch', mtu: 1500 })
const configForm = reactive({ mtu: 1500, vlan: null, qos: '' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('补丁端口配置已应用') }
const showHelp = () => { helpVisible.value = true }
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
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 