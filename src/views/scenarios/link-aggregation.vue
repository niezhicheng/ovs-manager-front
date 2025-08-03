<template>
  <a-card title="链路聚合配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择聚合模式" description="选择链路聚合模式" />
      <a-step title="配置物理链路" description="配置物理链路参数" />
      <a-step title="配置LACP协议" description="设置LACP协议参数" />
      <a-step title="测试聚合链路" description="测试链路聚合效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="modeForm" layout="vertical">
          <a-form-item label="聚合模式">
            <a-select v-model="modeForm.type" placeholder="选择聚合模式">
              <a-option value="static">静态聚合 (Static)</a-option>
              <a-option value="lacp">动态聚合 (LACP)</a-option>
              <a-option value="balance">负载均衡聚合</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="聚合组名称">
            <a-input v-model="modeForm.name" placeholder="例如: lag0" />
          </a-form-item>
          <a-form-item label="聚合组描述">
            <a-input v-model="modeForm.description" placeholder="例如: 核心交换机上行链路聚合" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="linkForm" layout="vertical">
          <a-form-item label="物理接口">
            <a-select v-model="linkForm.interfaces" placeholder="选择物理接口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="接口速率">
            <a-select v-model="linkForm.speed" placeholder="选择接口速率">
              <a-option value="100">100Mbps</a-option>
              <a-option value="1000">1Gbps</a-option>
              <a-option value="10000">10Gbps</a-option>
              <a-option value="40000">40Gbps</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="双工模式">
            <a-select v-model="linkForm.duplex" placeholder="选择双工模式">
              <a-option value="full">全双工</a-option>
              <a-option value="half">半双工</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="MTU大小">
            <a-input-number v-model="linkForm.mtu" :min="68" :max="9000" :default-value="1500" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="lacpForm" layout="vertical">
          <a-form-item label="LACP模式">
            <a-select v-model="lacpForm.mode" placeholder="选择LACP模式">
              <a-option value="active">主动模式 (Active)</a-option>
              <a-option value="passive">被动模式 (Passive)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="LACP超时">
            <a-select v-model="lacpForm.timeout" placeholder="选择LACP超时">
              <a-option value="short">短超时 (1秒)</a-option>
              <a-option value="long">长超时 (30秒)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="系统优先级">
            <a-input-number v-model="lacpForm.systemPriority" :min="1" :max="65535" :default-value="32768" />
          </a-form-item>
          <a-form-item label="端口优先级">
            <a-input-number v-model="lacpForm.portPriority" :min="1" :max="65535" :default-value="32768" />
          </a-form-item>
          <a-form-item label="负载均衡算法">
            <a-select v-model="lacpForm.loadBalance" placeholder="选择负载均衡算法">
              <a-option value="src-mac">源MAC地址</a-option>
              <a-option value="dst-mac">目标MAC地址</a-option>
              <a-option value="src-dst-mac">源目标MAC地址</a-option>
              <a-option value="src-ip">源IP地址</a-option>
              <a-option value="dst-ip">目标IP地址</a-option>
              <a-option value="src-dst-ip">源目标IP地址</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createAggregation">创建链路聚合</a-button>
          <a-button @click="testAggregation">测试链路聚合</a-button>
          <a-button @click="showAggregationStatus">显示聚合状态</a-button>
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
      title="链路聚合配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>链路聚合将多个物理网络接口绑定成一个逻辑接口，提供更高的带宽、冗余和负载均衡能力。通过LACP协议实现动态链路聚合，提高网络可靠性和性能。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>链路聚合</strong>：将多个物理链路绑定为逻辑链路</li>
          <li><strong>LACP协议</strong>：链路聚合控制协议</li>
          <li><strong>负载均衡</strong>：在多个链路上分发流量</li>
          <li><strong>故障切换</strong>：链路故障时的自动切换</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建链路聚合</h4>
          <pre class="command"># 创建链路聚合接口
ovs-vsctl add-bond br0 bond0 eth0 eth1

# 配置LACP模式
ovs-vsctl set port bond0 lacp=active

# 配置负载均衡模式
ovs-vsctl set port bond0 bond_mode=balance-slb</pre>

          <h4>2. 配置LACP参数</h4>
          <pre class="command"># 设置LACP优先级
ovs-vsctl set port bond0 other-config:lacp-priority=32768

# 设置LACP超时时间
ovs-vsctl set port bond0 other-config:lacp-time=fast

# 设置LACP系统优先级
ovs-vsctl set port bond0 other-config:lacp-system-priority=32768</pre>

          <h4>3. 配置负载均衡</h4>
          <pre class="command"># 配置源MAC负载均衡
ovs-vsctl set port bond0 bond_mode=balance-slb

# 配置源IP负载均衡
ovs-vsctl set port bond0 bond_mode=balance-tcp

# 配置L4负载均衡
ovs-vsctl set port bond0 bond_mode=balance-slb</pre>

          <h4>4. 监控链路状态</h4>
          <pre class="command"># 查看链路聚合状态
ovs-vsctl show

# 查看LACP状态
ovs-appctl bond/show

# 查看链路统计
ovs-ofctl dump-ports br0

# 查看链路详细信息
ovs-vsctl list interface</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择聚合模式</strong>：根据需求选择合适的聚合模式</li>
          <li><strong>配置LACP参数</strong>：设置LACP协议参数</li>
          <li><strong>配置负载均衡</strong>：设置流量分发策略</li>
          <li><strong>测试验证</strong>：验证聚合效果和故障切换</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>对端设备需要支持相同的聚合模式</li>
          <li>LACP参数要与对端设备匹配</li>
          <li>负载均衡模式要考虑流量特征</li>
          <li>要定期监控链路状态</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>数据中心</strong>：提供高带宽和冗余连接</li>
          <li><strong>企业网络</strong>：提高网络可靠性</li>
          <li><strong>服务器连接</strong>：提供高可用性</li>
          <li><strong>存储网络</strong>：提供高带宽存储连接</li>
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
const modeForm = reactive({ type: 'lacp', name: 'lag0', description: '核心交换机上行链路聚合' })
const linkForm = reactive({ interfaces: [], speed: 1000, duplex: 'full', mtu: 1500 })
const lacpForm = reactive({ mode: 'active', timeout: 'short', systemPriority: 32768, portPriority: 32768, loadBalance: 'src-dst-ip' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('链路聚合配置已应用') }
const showHelp = () => { helpVisible.value = true }
const createAggregation = () => { testResults.value = '链路聚合创建结果:\n聚合组: lag0\n模式: LACP动态聚合\n物理接口: eth0, eth1, eth2\n速率: 1Gbps\nLACP模式: 主动模式\n状态: 已创建' }
const testAggregation = () => { testResults.value = '链路聚合测试:\n聚合链路: 正常\n负载均衡: 工作正常\n故障切换: 测试通过\n带宽利用率: 85%\n延迟: 0.5ms\n状态: 正常' }
const showAggregationStatus = () => { testResults.value = '聚合状态信息:\n聚合组: lag0\n状态: active\n成员接口: 3个\n活跃接口: 3个\n总带宽: 3Gbps\nLACP状态: 协商成功' }
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