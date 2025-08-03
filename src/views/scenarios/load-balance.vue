<template>
  <a-card title="负载均衡配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建Bond接口" description="创建链路聚合接口" />
      <a-step title="添加物理端口" description="将物理端口添加到Bond" />
      <a-step title="配置负载模式" description="选择负载均衡算法" />
      <a-step title="测试负载均衡" description="测试负载均衡效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="bondForm" layout="vertical">
          <a-form-item label="Bond接口名称">
            <a-input v-model="bondForm.name" placeholder="例如: bond0" />
          </a-form-item>
          <a-form-item label="网桥名称">
            <a-input v-model="bondForm.bridge" placeholder="例如: br0" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="portForm" layout="vertical">
          <a-form-item label="物理端口">
            <a-select v-model="portForm.interfaces" placeholder="选择物理接口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="modeForm" layout="vertical">
          <a-form-item label="负载均衡模式">
            <a-select v-model="modeForm.balanceMode" placeholder="选择负载均衡模式">
              <a-option value="active-backup">active-backup (主备模式)</a-option>
              <a-option value="balance-slb">balance-slb (源负载均衡)</a-option>
              <a-option value="balance-tcp">balance-tcp (TCP负载均衡)</a-option>
              <a-option value="balance-rr">balance-rr (轮询模式)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="上行链路监控">
            <a-switch v-model="modeForm.updelay" />
            <span style="margin-left: 8px;">启用上行链路监控</span>
          </a-form-item>
          <a-form-item v-if="modeForm.updelay" label="监控间隔(毫秒)">
            <a-input-number v-model="modeForm.updelayMs" :min="0" :max="10000" :default-value="1000" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testLoadBalance">测试负载均衡</a-button>
          <a-button @click="showBondStatus">显示Bond状态</a-button>
          <a-button @click="showTrafficStats">显示流量统计</a-button>
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
      title="负载均衡配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>负载均衡通过OVS的Bond功能实现，将多个物理网卡绑定成一个逻辑接口，提供高可用性和带宽聚合。支持多种负载均衡算法，可以根据不同的网络需求选择最适合的模式。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>Bond接口</strong>：将多个物理接口绑定成一个逻辑接口</li>
          <li><strong>负载均衡算法</strong>：决定流量如何在多个接口间分配</li>
          <li><strong>故障切换</strong>：当某个接口故障时自动切换到其他接口</li>
          <li><strong>链路监控</strong>：监控接口状态，确保高可用性</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建Bond接口</h4>
          <pre class="command"># 创建Bond接口
ovs-vsctl add-bond br0 bond0 eth0 eth1

# 查看Bond接口配置
ovs-vsctl list port bond0

# 查看Bond接口详细信息
ovs-vsctl show</pre>

          <h4>2. 配置负载均衡模式</h4>
          <pre class="command"># 配置负载均衡模式
ovs-vsctl set port bond0 bond_mode=balance-slb

# 配置LACP模式
ovs-vsctl set port bond0 lacp=active

# 配置其他负载均衡模式
ovs-vsctl set port bond0 bond_mode=balance-tcp

# 查看Bond模式
ovs-vsctl get port bond0 bond_mode</pre>

          <h4>3. 配置接口参数</h4>
          <pre class="command"># 配置接口优先级
ovs-vsctl set interface eth0 other_config:priority=1
ovs-vsctl set interface eth1 other_config:priority=2

# 配置接口权重
ovs-vsctl set interface eth0 other_config:bond-detect-mode=miimon
ovs-vsctl set interface eth1 other_config:bond-detect-mode=miimon

# 配置监控间隔
ovs-vsctl set interface eth0 other_config:bond-miimon-interval=100
ovs-vsctl set interface eth1 other_config:bond-miimon-interval=100</pre>

          <h4>4. 配置流表规则</h4>
          <pre class="command"># 配置基于源MAC的负载均衡
ovs-ofctl add-flow br0 "table=0, priority=100, dl_src=00:11:22:33:44:55, actions=output:bond0"

# 配置基于源IP的负载均衡
ovs-ofctl add-flow br0 "table=0, priority=100, ip, nw_src=192.168.1.0/24, actions=output:bond0"

# 查看流表规则
ovs-ofctl dump-flows br0

# 查看Bond接口统计
ovs-ofctl dump-ports br0 bond0</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>创建Bond接口</strong>：将多个物理接口绑定成逻辑接口</li>
          <li><strong>配置负载均衡模式</strong>：选择合适的负载均衡算法</li>
          <li><strong>配置接口参数</strong>：设置优先级、权重等参数</li>
          <li><strong>配置流表规则</strong>：设置流量转发规则</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>Bond接口的所有成员接口必须连接到同一个网桥</li>
          <li>不同负载均衡模式适用于不同的网络环境</li>
          <li>LACP模式需要交换机支持LACP协议</li>
          <li>故障切换时间取决于监控间隔设置</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>服务器网络</strong>：提供高可用性和带宽聚合</li>
          <li><strong>数据中心</strong>：实现网络冗余和负载分担</li>
          <li><strong>云环境</strong>：为虚拟机提供高可用网络连接</li>
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
const bondForm = reactive({ name: 'bond0', bridge: 'br0' })
const portForm = reactive({ interfaces: [] })
const modeForm = reactive({ balanceMode: 'balance-slb', updelay: true, updelayMs: 1000 })
const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('负载均衡配置已应用') }
const showHelp = () => { helpVisible.value = true }
const testLoadBalance = () => { testResults.value = '负载均衡测试结果:\nBond接口: bond0\n模式: balance-slb\n状态: 正常\n端口1: eth0 (活跃)\n端口2: eth1 (活跃)\n流量分布: 50% / 50%' }
const showBondStatus = () => { testResults.value = 'Bond状态信息:\n接口: bond0\n状态: up\n模式: balance-slb\n端口数量: 2\n活跃端口: 2\n监控状态: 正常' }
const showTrafficStats = () => { testResults.value = '流量统计:\neth0: 接收 1.2GB, 发送 800MB\neth1: 接收 1.1GB, 发送 750MB\n总计: 接收 2.3GB, 发送 1.55GB\n负载分布: 52% / 48%' }
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