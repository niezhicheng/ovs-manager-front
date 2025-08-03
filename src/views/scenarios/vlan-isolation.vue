<template>
  <a-card title="VLAN隔离配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建VLAN" description="创建VLAN隔离网络" />
      <a-step title="配置端口" description="将端口分配到VLAN" />
      <a-step title="配置路由" description="设置VLAN间路由" />
      <a-step title="测试隔离" description="测试VLAN隔离效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="vlanForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-select v-model="vlanForm.bridge" placeholder="选择网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="VLAN ID">
            <a-input-number v-model="vlanForm.vlanId" :min="1" :max="4094" placeholder="例如: 10" />
          </a-form-item>
          <a-form-item label="VLAN名称">
            <a-input v-model="vlanForm.name" placeholder="例如: vlan10" />
          </a-form-item>
          <a-form-item label="VLAN描述">
            <a-input v-model="vlanForm.description" placeholder="例如: 办公网络" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="portForm" layout="vertical">
          <a-form-item label="访问端口">
            <a-select v-model="portForm.accessPorts" placeholder="选择访问端口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="中继端口">
            <a-select v-model="portForm.trunkPorts" placeholder="选择中继端口" multiple>
              <a-option value="eth4">eth4</a-option>
              <a-option value="eth5">eth5</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口模式">
            <a-select v-model="portForm.mode" placeholder="选择端口模式">
              <a-option value="access">Access模式 (访问模式)</a-option>
              <a-option value="trunk">Trunk模式 (中继模式)</a-option>
              <a-option value="hybrid">Hybrid模式 (混合模式)</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="routeForm" layout="vertical">
          <a-form-item label="VLAN网关">
            <a-input v-model="routeForm.gateway" placeholder="例如: 192.168.10.1" />
          </a-form-item>
          <a-form-item label="子网掩码">
            <a-input v-model="routeForm.netmask" placeholder="例如: 255.255.255.0" />
          </a-form-item>
          <a-form-item label="DHCP服务器">
            <a-switch v-model="routeForm.dhcp" />
            <span style="margin-left: 8px;">启用DHCP服务</span>
          </a-form-item>
          <a-form-item v-if="routeForm.dhcp" label="DHCP地址池">
            <a-input v-model="routeForm.dhcpPool" placeholder="例如: 192.168.10.100-192.168.10.200" />
          </a-form-item>
          <a-form-item label="VLAN间路由">
            <a-switch v-model="routeForm.interVlanRouting" />
            <span style="margin-left: 8px;">允许VLAN间通信</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createVLAN">创建VLAN</a-button>
          <a-button @click="testIsolation">测试VLAN隔离</a-button>
          <a-button @click="showVLANStatus">显示VLAN状态</a-button>
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
      title="VLAN隔离配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>VLAN隔离通过虚拟局域网技术将物理网络分割成多个逻辑网络，实现不同VLAN间的网络隔离。通过VLAN标签和交换机配置实现二层网络隔离。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>VLAN标签</strong>：用于标识不同VLAN的标签</li>
          <li><strong>Trunk端口</strong>：支持多个VLAN的端口</li>
          <li><strong>Access端口</strong>：只支持单个VLAN的端口</li>
          <li><strong>VLAN隔离</strong>：不同VLAN间无法直接通信</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建VLAN</h4>
          <pre class="command"># 创建VLAN接口
ovs-vsctl add-port br0 vlan100 -- set interface vlan100 type=internal
ovs-vsctl set port vlan100 tag=100

# 创建VLAN网桥
ovs-vsctl add-br vlan100-br
ovs-vsctl set bridge vlan100-br protocols=OpenFlow13</pre>

          <h4>2. 配置VLAN端口</h4>
          <pre class="command"># 配置Access端口
ovs-vsctl add-port br0 eth1
ovs-vsctl set port eth1 tag=100

# 配置Trunk端口
ovs-vsctl add-port br0 eth2
ovs-vsctl set port eth2 trunks=100,200,300

# 配置VLAN接口
ovs-vsctl add-port br0 vlan100 -- set interface vlan100 type=internal
ovs-vsctl set port vlan100 tag=100</pre>

          <h4>3. 配置VLAN路由</h4>
          <pre class="command"># 配置VLAN IP地址
ip addr add 192.168.100.1/24 dev vlan100

# 配置VLAN网关
ip route add 192.168.100.0/24 dev vlan100

# 配置VLAN间路由
ip route add 192.168.200.0/24 via 192.168.100.254</pre>

          <h4>4. 测试VLAN隔离</h4>
          <pre class="command"># 查看VLAN配置
ovs-vsctl show

# 查看端口VLAN配置
ovs-vsctl list port

# 测试VLAN连通性
ping -I vlan100 192.168.100.2

# 查看VLAN统计
ovs-ofctl dump-ports br0</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>创建VLAN</strong>：定义VLAN ID和网络配置</li>
          <li><strong>配置端口</strong>：设置Access和Trunk端口</li>
          <li><strong>配置路由</strong>：设置VLAN间路由</li>
          <li><strong>测试验证</strong>：验证VLAN隔离效果</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>VLAN ID要避免冲突</li>
          <li>Trunk端口要正确配置</li>
          <li>路由要正确设置</li>
          <li>要测试隔离效果</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>企业网络</strong>：隔离不同部门网络</li>
          <li><strong>数据中心</strong>：隔离不同业务网络</li>
          <li><strong>校园网络</strong>：隔离不同学院网络</li>
          <li><strong>酒店网络</strong>：隔离不同楼层网络</li>
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
const vlanForm = reactive({ id: 100, name: 'vlan100', description: 'VLAN 100网络', network: '192.168.100.0/24' })
const portForm = reactive({ accessPorts: [], trunkPorts: [], nativeVlan: 1, allowedVlans: '100,200,300' })
const routeForm = reactive({ gateway: '192.168.100.1', dns: '8.8.8.8', dhcp: true, interVlanRouting: false })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('VLAN隔离配置已应用') }
const showHelp = () => { helpVisible.value = true }
const createVlan = () => { testResults.value = 'VLAN创建结果:\nVLAN ID: 100\nVLAN名称: vlan100\n网络段: 192.168.100.0/24\n网关: 192.168.100.1\n状态: 已创建' }
const testIsolation = () => { testResults.value = 'VLAN隔离测试:\nVLAN间通信: 已隔离\n端口隔离: 正常\n路由隔离: 正常\nDHCP服务: 正常\n隔离效果: 符合预期' }
const showVlanStatus = () => { testResults.value = 'VLAN状态信息:\nVLAN ID: 100\n状态: active\n端口数量: 5个\n活跃用户: 12个\n网络性能: 良好\n隔离状态: 正常' }
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