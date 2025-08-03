<template>
  <a-card title="SDN控制器配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="SDN控制器配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>SDN控制器是软件定义网络的核心组件，通过OpenFlow协议控制网络设备，实现网络的可编程化和集中化管理。控制器负责网络拓扑发现、流表下发、应用管理和网络策略执行。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>SDN控制器</strong>：网络控制平面，负责网络决策</li>
          <li><strong>OpenFlow协议</strong>：控制器与交换机间的通信协议</li>
          <li><strong>流表</strong>：交换机中的数据包转发规则</li>
          <li><strong>SDN应用</strong>：运行在控制器上的网络应用</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 启动SDN控制器</h4>
          <pre class="command"># 启动Ryu控制器
ryu-manager --verbose --log-level=INFO ryu.app.simple_switch_13

# 启动Floodlight控制器
java -jar floodlight.jar

# 启动ONOS控制器
./bin/onos-service server

# 启动OpenDaylight控制器
./bin/karaf</pre>

          <h4>2. 配置Open vSwitch</h4>
          <pre class="command"># 启动Open vSwitch
systemctl start openvswitch
systemctl enable openvswitch

# 创建网桥并连接控制器
ovs-vsctl add-br br0
ovs-vsctl set-controller br0 tcp:192.168.1.100:6633
ovs-vsctl set bridge br0 protocols=OpenFlow13

# 查看控制器连接状态
ovs-vsctl show</pre>

          <h4>3. 配置流表规则</h4>
          <pre class="command"># 添加流表规则
ovs-ofctl add-flow br0 "table=0, priority=100, in_port=1, actions=output:2"

# 查看流表规则
ovs-ofctl dump-flows br0

# 删除流表规则
ovs-ofctl del-flows br0 "table=0, in_port=1"

# 清空流表
ovs-ofctl del-flows br0</pre>

          <h4>4. 测试控制器连接</h4>
          <pre class="command"># 测试控制器连接
ovs-vsctl show

# 查看端口状态
ovs-ofctl show br0

# 查看流表统计
ovs-ofctl dump-flows br0

# 查看端口统计
ovs-ofctl dump-ports br0</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>配置控制器</strong>：设置控制器类型、地址和协议版本</li>
          <li><strong>配置交换机</strong>：设置交换机连接和流表容量</li>
          <li><strong>部署应用</strong>：配置SDN应用和优先级</li>
          <li><strong>测试连接</strong>：验证控制器和交换机连接</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>控制器和交换机协议版本要匹配</li>
          <li>网络连接要稳定可靠</li>
          <li>流表容量要考虑交换机性能</li>
          <li>应用优先级要合理设置</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>网络虚拟化</strong>：实现多租户网络隔离</li>
          <li><strong>流量工程</strong>：优化网络路径和负载均衡</li>
          <li><strong>安全策略</strong>：实现细粒度访问控制</li>
          <li><strong>网络监控</strong>：实时监控网络状态和性能</li>
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
const controllerForm = reactive({ type: 'ryu', address: '192.168.1.100', port: 6633, protocol: '1.3', auth: 'none' })
const switchForm = reactive({ name: 'switch1', type: 'ovs', mode: 'active', portCount: 8, flowTableSize: 1000 })
const appForm = reactive({ name: 'learning-switch', type: 'learning', priority: 50, autoStart: true, parameters: '--verbose --log-level=INFO' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('SDN控制器配置已应用') }
const showHelp = () => { helpVisible.value = true }
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
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 