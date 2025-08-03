<template>
  <a-card title="基础网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建网桥" description="创建Open vSwitch网桥" />
      <a-step title="添加端口" description="添加网络端口到网桥" />
      <a-step title="配置IP" description="配置网桥IP地址" />
      <a-step title="测试连接" description="测试网络连通性" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="bridgeForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-input v-model="bridgeForm.name" placeholder="例如: br0" />
          </a-form-item>
          <a-form-item label="网桥描述">
            <a-input v-model="bridgeForm.description" placeholder="例如: 主网桥" />
          </a-form-item>
          <a-form-item label="网桥类型">
            <a-select v-model="bridgeForm.type" placeholder="选择网桥类型">
              <a-option value="normal">普通网桥</a-option>
              <a-option value="internal">内部网桥</a-option>
              <a-option value="system">系统网桥</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="portForm" layout="vertical">
          <a-form-item label="端口名称">
            <a-input v-model="portForm.name" placeholder="例如: eth0" />
          </a-form-item>
          <a-form-item label="端口类型">
            <a-select v-model="portForm.type" placeholder="选择端口类型">
              <a-option value="system">系统端口</a-option>
              <a-option value="internal">内部端口</a-option>
              <a-option value="patch">Patch端口</a-option>
              <a-option value="tunnel">隧道端口</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口配置">
            <a-textarea v-model="portForm.config" placeholder="例如: options:peer=patch1" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="ipForm" layout="vertical">
          <a-form-item label="IP地址">
            <a-input v-model="ipForm.address" placeholder="例如: 192.168.1.1/24" />
          </a-form-item>
          <a-form-item label="网关地址">
            <a-input v-model="ipForm.gateway" placeholder="例如: 192.168.1.1" />
          </a-form-item>
          <a-form-item label="DNS服务器">
            <a-input v-model="ipForm.dns" placeholder="例如: 8.8.8.8, 114.114.114.114" />
          </a-form-item>
          <a-form-item label="MTU大小">
            <a-input-number v-model="ipForm.mtu" :min="68" :max="9000" :default-value="1500" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createBridge">创建网桥</a-button>
          <a-button @click="addPort">添加端口</a-button>
          <a-button @click="configureIP">配置IP</a-button>
          <a-button @click="testConnection">测试连接</a-button>
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
      title="基础网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>基础网络配置是Open vSwitch的核心功能，通过创建虚拟网桥来连接不同的网络接口，实现网络虚拟化。网桥类似于物理交换机，可以连接多个端口并转发数据包。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>网桥(Bridge)</strong>：虚拟交换机，连接多个端口</li>
          <li><strong>端口(Port)</strong>：网桥上的接口，可以是物理网卡或虚拟接口</li>
          <li><strong>流表(Flow Table)</strong>：控制数据包转发的规则表</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建网桥</h4>
          <pre class="command"># 创建网桥
ovs-vsctl add-br br0

# 查看网桥列表
ovs-vsctl list-br

# 查看网桥详细信息
ovs-vsctl show</pre>

          <h4>2. 添加端口</h4>
          <pre class="command"># 添加物理端口
ovs-vsctl add-port br0 eth0

# 添加内部端口
ovs-vsctl add-port br0 port1 -- set interface port1 type=internal

# 查看端口列表
ovs-vsctl list-ports br0</pre>

          <h4>3. 配置IP地址</h4>
          <pre class="command"># 配置网桥IP
ip addr add 192.168.1.1/24 dev br0

# 启用网桥
ip link set br0 up

# 查看IP配置
ip addr show br0</pre>

          <h4>4. 测试连接</h4>
          <pre class="command"># 测试网桥连通性
ping 192.168.1.1

# 查看网桥状态
ovs-vsctl show

# 查看端口状态
ovs-vsctl list interface</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>创建网桥</strong>：使用ovs-vsctl add-br命令创建虚拟网桥</li>
          <li><strong>添加端口</strong>：将物理网卡或虚拟接口添加到网桥</li>
          <li><strong>配置网络</strong>：为网桥配置IP地址、网关等网络参数</li>
          <li><strong>测试验证</strong>：测试网络连通性和端口状态</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>添加物理端口前需要先停止网络服务</li>
          <li>内部端口会自动创建对应的网络接口</li>
          <li>网桥IP配置后需要启用网桥接口</li>
          <li>确保防火墙规则允许相关流量</li>
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
const bridgeForm = reactive({ name: 'br0', description: '主网桥', type: 'normal' })
const portForm = reactive({ name: 'eth0', type: 'system', config: '' })
const ipForm = reactive({ address: '192.168.1.1/24', gateway: '192.168.1.1', dns: '8.8.8.8, 114.114.114.114', mtu: 1500 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('基础网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
const createBridge = () => { testResults.value = '网桥创建结果:\n网桥名称: br0\n描述: 主网桥\n类型: 普通网桥\n状态: 创建成功\n\n命令执行:\novs-vsctl add-br br0\novs-vsctl set bridge br0 other-config:description="主网桥"' }
const addPort = () => { testResults.value = '端口添加结果:\n端口名称: eth0\n端口类型: 系统端口\n网桥: br0\n状态: 添加成功\n\n命令执行:\novs-vsctl add-port br0 eth0\novs-vsctl set interface eth0 type=system' }
const configureIP = () => { testResults.value = 'IP配置结果:\nIP地址: 192.168.1.1/24\n网关: 192.168.1.1\nDNS: 8.8.8.8, 114.114.114.114\nMTU: 1500\n状态: 配置成功\n\n命令执行:\nip addr add 192.168.1.1/24 dev br0\nip link set br0 up' }
const testConnection = () => { testResults.value = '连接测试结果:\n网桥状态: 正常\n端口状态: 正常\nIP配置: 正确\n网络连通性: 正常\n\n测试命令:\nping 192.168.1.1\novs-vsctl show\nip addr show br0' }
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