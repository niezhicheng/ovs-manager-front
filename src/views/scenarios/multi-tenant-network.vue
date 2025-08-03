<template>
  <a-card title="多租户网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建租户" description="创建多租户环境" />
      <a-step title="配置网络隔离" description="配置租户间网络隔离" />
      <a-step title="配置资源共享" description="配置共享资源策略" />
      <a-step title="测试多租户" description="测试多租户隔离效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="tenantForm" layout="vertical">
          <a-form-item label="租户名称">
            <a-input v-model="tenantForm.name" placeholder="例如: tenant1" />
          </a-form-item>
          <a-form-item label="租户类型">
            <a-select v-model="tenantForm.type" placeholder="选择租户类型">
              <a-option value="enterprise">企业租户</a-option>
              <a-option value="individual">个人租户</a-option>
              <a-option value="developer">开发者租户</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网络地址段">
            <a-input v-model="tenantForm.network" placeholder="例如: 192.168.10.0/24" />
          </a-form-item>
          <a-form-item label="租户描述">
            <a-textarea v-model="tenantForm.description" placeholder="例如: 企业A的网络环境" :rows="3" />
          </a-form-item>
          <a-form-item label="资源配额">
            <a-input-number v-model="tenantForm.resourceQuota" :min="1" :max="100" :default-value="10" />
            <span style="margin-left: 8px;">个虚拟网络</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="isolationForm" layout="vertical">
          <a-form-item label="隔离级别">
            <a-select v-model="isolationForm.level" placeholder="选择隔离级别">
              <a-option value="strict">严格隔离 (完全隔离)</a-option>
              <a-option value="moderate">中等隔离 (允许有限通信)</a-option>
              <a-option value="loose">宽松隔离 (允许共享资源)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="VLAN隔离">
            <a-switch v-model="isolationForm.vlanIsolation" />
            <span style="margin-left: 8px;">启用VLAN隔离</span>
          </a-form-item>
          <a-form-item v-if="isolationForm.vlanIsolation" label="VLAN范围">
            <a-input v-model="isolationForm.vlanRange" placeholder="例如: 100-200" />
          </a-form-item>
          <a-form-item label="路由隔离">
            <a-switch v-model="isolationForm.routeIsolation" />
            <span style="margin-left: 8px;">启用路由隔离</span>
          </a-form-item>
          <a-form-item label="防火墙策略">
            <a-switch v-model="isolationForm.firewallPolicy" />
            <span style="margin-left: 8px;">启用防火墙策略</span>
          </a-form-item>
          <a-form-item label="允许的通信规则">
            <a-textarea v-model="isolationForm.allowedRules" placeholder="例如: tenant1:tenant2:80,443" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="resourceForm" layout="vertical">
          <a-form-item label="共享资源类型">
            <a-select v-model="resourceForm.sharedType" placeholder="选择共享资源" multiple>
              <a-option value="internet">互联网访问</a-option>
              <a-option value="storage">存储服务</a-option>
              <a-option value="database">数据库服务</a-option>
              <a-option value="loadbalancer">负载均衡器</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="带宽共享策略">
            <a-select v-model="resourceForm.bandwidthPolicy" placeholder="选择带宽策略">
              <a-option value="fair">公平分配</a-option>
              <a-option value="weighted">加权分配</a-option>
              <a-option value="priority">优先级分配</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="存储共享策略">
            <a-select v-model="resourceForm.storagePolicy" placeholder="选择存储策略">
              <a-option value="dedicated">专用存储</a-option>
              <a-option value="shared">共享存储</a-option>
              <a-option value="hybrid">混合存储</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="服务质量保证">
            <a-switch v-model="resourceForm.qosGuarantee" />
            <span style="margin-left: 8px;">启用QoS保证</span>
          </a-form-item>
          <a-form-item v-if="resourceForm.qosGuarantee" label="最小带宽保证">
            <a-input-number v-model="resourceForm.minBandwidth" :min="1" :max="10000" :default-value="100" />
            <span style="margin-left: 8px;">Mbps</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createTenant">创建租户</a-button>
          <a-button @click="testIsolation">测试租户隔离</a-button>
          <a-button @click="showTenantStatus">显示租户状态</a-button>
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
      title="多租户网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>多租户网络配置通过虚拟化技术为不同租户提供独立的网络环境，实现租户间的网络隔离和资源共享。通过VLAN、路由隔离、防火墙策略等技术确保租户数据安全和网络性能。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>租户隔离</strong>：不同租户间的网络完全隔离</li>
          <li><strong>VLAN隔离</strong>：通过VLAN标签实现二层隔离</li>
          <li><strong>路由隔离</strong>：通过路由表实现三层隔离</li>
          <li><strong>资源共享</strong>：在隔离基础上共享公共资源</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建租户网络</h4>
          <pre class="command"># 为租户创建专用网桥
ovs-vsctl add-br tenant1-br
ovs-vsctl set bridge tenant1-br protocols=OpenFlow13

# 配置租户VLAN
ovs-vsctl add-port tenant1-br tenant1-vlan100 -- set interface tenant1-vlan100 type=internal
ovs-vsctl set port tenant1-vlan100 tag=100

# 配置租户IP地址
ip addr add 192.168.10.1/24 dev tenant1-vlan100</pre>

          <h4>2. 配置租户隔离</h4>
          <pre class="command"># 配置VLAN隔离
ovs-vsctl set port tenant1-vlan100 tag=100
ovs-vsctl set port tenant2-vlan200 tag=200

# 配置路由隔离
ip route add 192.168.10.0/24 dev tenant1-vlan100 table 100
ip route add 192.168.20.0/24 dev tenant2-vlan200 table 200

# 配置防火墙策略
iptables -A FORWARD -i tenant1-vlan100 -o tenant2-vlan200 -j DROP
iptables -A FORWARD -i tenant2-vlan200 -o tenant1-vlan100 -j DROP</pre>

          <h4>3. 配置资源共享</h4>
          <pre class="command"># 配置共享网关
ovs-vsctl add-port shared-br shared-gateway -- set interface shared-gateway type=internal
ip addr add 10.0.0.1/24 dev shared-gateway

# 配置共享负载均衡器
ovs-vsctl add-port shared-br shared-lb -- set interface shared-lb type=internal
ip addr add 10.0.1.1/24 dev shared-lb

# 配置QoS策略
ovs-vsctl set port tenant1-vlan100 qos=@qos1
ovs-vsctl -- --id=@qos1 create qos type=linux-htb queues=0=@q0
ovs-vsctl -- --id=@q0 create queue other-config:max-rate=100000000</pre>

          <h4>4. 测试租户隔离</h4>
          <pre class="command"># 测试VLAN隔离
ovs-vsctl show

# 测试路由隔离
ip route show table 100
ip route show table 200

# 测试防火墙策略
iptables -L FORWARD

# 测试租户连通性
ping -I tenant1-vlan100 192.168.10.2
ping -I tenant2-vlan200 192.168.20.2</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>创建租户</strong>：定义租户信息和网络配置</li>
          <li><strong>配置隔离</strong>：设置VLAN、路由和防火墙隔离</li>
          <li><strong>配置资源</strong>：设置共享资源和访问策略</li>
          <li><strong>测试验证</strong>：验证隔离效果和资源共享</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>VLAN ID要避免冲突</li>
          <li>路由表要正确配置</li>
          <li>防火墙规则要严格</li>
          <li>共享资源要合理分配</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>云服务提供商</strong>：为不同客户提供隔离网络</li>
          <li><strong>企业内网</strong>：为不同部门提供独立网络</li>
          <li><strong>数据中心</strong>：实现多租户资源隔离</li>
          <li><strong>教育机构</strong>：为不同学院提供网络服务</li>
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
const helpVisible = ref(false)
const testResults = ref('')
const tenantForm = reactive({ name: 'tenant1', type: 'enterprise', network: '192.168.10.0/24', description: '企业A的网络环境', resourceQuota: 10 })
const isolationForm = reactive({ level: 'strict', vlanIsolation: true, vlanRange: '100-200', routeIsolation: true, firewallPolicy: true, allowedRules: 'tenant1:tenant2:80,443' })
const resourceForm = reactive({ sharedType: ['internet'], bandwidthPolicy: 'fair', storagePolicy: 'dedicated', qosGuarantee: true, minBandwidth: 100 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('多租户网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
const createTenant = () => { testResults.value = '租户创建结果:\n租户名称: tenant1\n类型: 企业租户\n网络段: 192.168.10.0/24\n隔离级别: 严格隔离\nVLAN范围: 100-200\n状态: 已创建' }
const testIsolation = () => { testResults.value = '租户隔离测试:\n租户间通信: 已隔离\nVLAN隔离: 正常\n路由隔离: 正常\n防火墙策略: 生效\n共享资源访问: 正常\n隔离效果: 符合预期' }
const showTenantStatus = () => { testResults.value = '租户状态信息:\n租户名称: tenant1\n状态: active\n虚拟网络: 3个\n活跃用户: 25个\n资源使用率: 65%\n隔离状态: 正常\n共享资源: 可访问' }
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