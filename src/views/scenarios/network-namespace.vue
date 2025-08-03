<template>
  <a-card title="网络命名空间配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建命名空间" description="创建网络命名空间" />
      <a-step title="配置虚拟接口" description="为命名空间配置虚拟接口" />
      <a-step title="设置路由" description="配置命名空间路由" />
      <a-step title="测试隔离" description="测试网络隔离效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="namespaceForm" layout="vertical">
          <a-form-item label="命名空间名称">
            <a-input v-model="namespaceForm.name" placeholder="例如: ns1" />
          </a-form-item>
          <a-form-item label="命名空间描述">
            <a-input v-model="namespaceForm.description" placeholder="例如: 测试环境隔离" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="interfaceForm" layout="vertical">
          <a-form-item label="虚拟接口名称">
            <a-input v-model="interfaceForm.name" placeholder="例如: veth0" />
          </a-form-item>
          <a-form-item label="对端接口名称">
            <a-input v-model="interfaceForm.peer" placeholder="例如: veth1" />
          </a-form-item>
          <a-form-item label="IP地址">
            <a-input v-model="interfaceForm.ip" placeholder="例如: 192.168.100.1/24" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="routeForm" layout="vertical">
          <a-form-item label="默认网关">
            <a-input v-model="routeForm.gateway" placeholder="例如: 192.168.100.1" />
          </a-form-item>
          <a-form-item label="DNS服务器">
            <a-input v-model="routeForm.dns" placeholder="例如: 8.8.8.8" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testIsolation">测试网络隔离</a-button>
          <a-button @click="showNamespaceStatus">显示命名空间状态</a-button>
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
      title="网络命名空间配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>网络命名空间用于在同一主机上隔离不同的网络环境，实现多租户、测试环境等场景下的网络隔离和资源独立。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>命名空间</strong>：独立的网络栈环境</li>
          <li><strong>虚拟以太网对</strong>：连接不同命名空间的虚拟接口</li>
          <li><strong>路由隔离</strong>：命名空间间的路由独立</li>
          <li><strong>资源独立</strong>：每个命名空间有独立的IP、路由、规则</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建命名空间</h4>
          <pre class="command"># 创建命名空间
ip netns add ns1
ip netns add ns2</pre>

          <h4>2. 创建虚拟以太网对</h4>
          <pre class="command"># 创建veth对
ip link add veth-ns1 type veth peer name veth-ns2

# 将veth接口分配到命名空间
ip link set veth-ns1 netns ns1
ip link set veth-ns2 netns ns2</pre>

          <h4>3. 配置网络参数</h4>
          <pre class="command"># 配置IP地址
ip netns exec ns1 ip addr add 10.0.1.1/24 dev veth-ns1
ip netns exec ns2 ip addr add 10.0.2.1/24 dev veth-ns2

# 启动接口
ip netns exec ns1 ip link set veth-ns1 up
ip netns exec ns2 ip link set veth-ns2 up</pre>

          <h4>4. 测试命名空间隔离</h4>
          <pre class="command"># 测试连通性
ip netns exec ns1 ping 10.0.2.1

# 查看路由表
ip netns exec ns1 ip route
ip netns exec ns2 ip route</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>创建命名空间</strong>：为每个环境创建独立命名空间</li>
          <li><strong>创建veth对</strong>：连接不同命名空间</li>
          <li><strong>配置网络</strong>：设置IP、路由等参数</li>
          <li><strong>测试验证</strong>：验证隔离和连通性</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>命名空间名称要唯一</li>
          <li>veth对要正确分配</li>
          <li>IP地址要避免冲突</li>
          <li>要测试隔离效果</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>多租户环境</strong>：为不同租户提供独立网络</li>
          <li><strong>测试环境</strong>：隔离测试与生产网络</li>
          <li><strong>安全沙箱</strong>：提供安全隔离环境</li>
          <li><strong>容器网络</strong>：实现容器间网络隔离</li>
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
const namespaceForm = reactive({ name: 'ns1', description: '测试环境隔离' })
const interfaceForm = reactive({ name: 'veth0', peer: 'veth1', ip: '192.168.100.1/24' })
const routeForm = reactive({ gateway: '192.168.100.1', dns: '8.8.8.8' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('网络命名空间配置已应用') }
const showHelp = () => { helpVisible.value = true }
const testIsolation = () => { testResults.value = '网络隔离测试结果:\n命名空间: ns1\n状态: 已隔离\n虚拟接口: veth0\nIP地址: 192.168.100.1\n隔离效果: 正常' }
const showNamespaceStatus = () => { testResults.value = '命名空间状态:\n名称: ns1\n状态: active\n接口数量: 1\n路由表: 已配置\nDNS: 8.8.8.8' }
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