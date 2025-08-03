<template>
  <a-card title="流表规则配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择网桥" description="选择要配置的网桥" />
      <a-step title="配置匹配条件" description="设置流表匹配规则" />
      <a-step title="配置动作" description="设置流表动作" />
      <a-step title="测试规则" description="测试流表规则效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="bridgeForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-select v-model="bridgeForm.name" placeholder="选择网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="协议版本">
            <a-select v-model="bridgeForm.protocol" placeholder="选择OpenFlow协议版本">
              <a-option value="OpenFlow13">OpenFlow 1.3</a-option>
              <a-option value="OpenFlow14">OpenFlow 1.4</a-option>
              <a-option value="OpenFlow15">OpenFlow 1.5</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="matchForm" layout="vertical">
          <a-form-item label="优先级">
            <a-input-number v-model="matchForm.priority" :min="0" :max="65535" :default-value="1000" />
          </a-form-item>
          <a-form-item label="入端口">
            <a-input v-model="matchForm.inPort" placeholder="例如: 1, 2, 3" />
          </a-form-item>
          <a-form-item label="源MAC地址">
            <a-input v-model="matchForm.srcMac" placeholder="例如: 00:11:22:33:44:55" />
          </a-form-item>
          <a-form-item label="目标MAC地址">
            <a-input v-model="matchForm.dstMac" placeholder="例如: 00:aa:bb:cc:dd:ee" />
          </a-form-item>
          <a-form-item label="源IP地址">
            <a-input v-model="matchForm.srcIp" placeholder="例如: 192.168.1.0/24" />
          </a-form-item>
          <a-form-item label="目标IP地址">
            <a-input v-model="matchForm.dstIp" placeholder="例如: 192.168.2.0/24" />
          </a-form-item>
          <a-form-item label="协议">
            <a-select v-model="matchForm.protocol" placeholder="选择协议" allow-clear>
              <a-option value="tcp">TCP</a-option>
              <a-option value="udp">UDP</a-option>
              <a-option value="icmp">ICMP</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="matchForm.protocol === 'tcp' || matchForm.protocol === 'udp'" label="源端口">
            <a-input-number v-model="matchForm.srcPort" :min="1" :max="65535" placeholder="例如: 80" />
          </a-form-item>
          <a-form-item v-if="matchForm.protocol === 'tcp' || matchForm.protocol === 'udp'" label="目标端口">
            <a-input-number v-model="matchForm.dstPort" :min="1" :max="65535" placeholder="例如: 443" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="actionForm" layout="vertical">
          <a-form-item label="动作类型">
            <a-select v-model="actionForm.type" placeholder="选择动作类型">
              <a-option value="output">输出到端口</a-option>
              <a-option value="drop">丢弃</a-option>
              <a-option value="modify">修改字段</a-option>
              <a-option value="goto">跳转到表</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="actionForm.type === 'output'" label="输出端口">
            <a-input v-model="actionForm.outputPort" placeholder="例如: 2, 3" />
          </a-form-item>
          <a-form-item v-if="actionForm.type === 'modify'" label="修改字段">
            <a-select v-model="actionForm.modifyField" placeholder="选择要修改的字段" multiple>
              <a-option value="src_mac">源MAC地址</a-option>
              <a-option value="dst_mac">目标MAC地址</a-option>
              <a-option value="src_ip">源IP地址</a-option>
              <a-option value="dst_ip">目标IP地址</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="actionForm.type === 'goto'" label="目标表">
            <a-input-number v-model="actionForm.gotoTable" :min="0" :max="255" placeholder="例如: 1" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="addFlowRule">添加流表规则</a-button>
          <a-button @click="showFlowRules">显示流表规则</a-button>
          <a-button @click="testFlowRule">测试规则匹配</a-button>
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
      title="流表规则配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>OpenFlow流表规则是OVS的核心功能，通过定义匹配条件和动作来控制数据包的转发行为。流表规则可以实现复杂的网络策略，包括流量控制、安全策略、负载均衡等功能。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>流表(Flow Table)</strong>：存储流规则的表，包含匹配字段和动作</li>
          <li><strong>匹配字段(Match Fields)</strong>：用于匹配数据包的字段，如源IP、目标IP、端口等</li>
          <li><strong>动作(Actions)</strong>：对匹配的数据包执行的操作，如转发、丢弃、修改等</li>
          <li><strong>优先级(Priority)</strong>：决定规则匹配顺序的数值，数值越高优先级越高</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 查看流表规则</h4>
          <pre class="command"># 查看网桥的流表规则
ovs-ofctl dump-flows br0

# 查看特定端口的流表规则
ovs-ofctl dump-flows br0 in_port=1

# 查看流表统计信息
ovs-ofctl dump-flows br0 -O OpenFlow13</pre>

          <h4>2. 添加流表规则</h4>
          <pre class="command"># 添加基本的转发规则
ovs-ofctl add-flow br0 "table=0, priority=100, in_port=1, actions=output:2"

# 添加基于IP地址的规则
ovs-ofctl add-flow br0 "table=0, priority=200, ip, nw_src=192.168.1.0/24, actions=output:3"

# 添加基于端口的规则
ovs-ofctl add-flow br0 "table=0, priority=300, tcp, tp_dst=80, actions=output:4"

# 添加丢弃规则
ovs-ofctl add-flow br0 "table=0, priority=400, ip, nw_src=192.168.1.100, actions=drop"</pre>

          <h4>3. 修改流表规则</h4>
          <pre class="command"># 修改现有规则的动作
ovs-ofctl mod-flows br0 "table=0, priority=100, in_port=1, actions=output:2,output:3"

# 修改规则的优先级
ovs-ofctl mod-flows br0 "table=0, priority=500, in_port=1, actions=output:2"

# 删除特定规则
ovs-ofctl del-flows br0 "table=0, in_port=1"

# 删除所有规则
ovs-ofctl del-flows br0</pre>

          <h4>4. 高级流表规则</h4>
          <pre class="command"># 添加VLAN标签规则
ovs-ofctl add-flow br0 "table=0, priority=100, dl_vlan=100, actions=strip_vlan,output:2"

# 添加修改字段的规则
ovs-ofctl add-flow br0 "table=0, priority=100, ip, actions=mod_nw_src:192.168.1.1,output:2"

# 添加多表规则
ovs-ofctl add-flow br0 "table=0, priority=100, in_port=1, actions=goto_table:1"
ovs-ofctl add-flow br0 "table=1, priority=100, actions=output:2"

# 添加计量规则
ovs-ofctl add-meter br0 meter=1,kbps,band=type=drop,rate=1000
ovs-ofctl add-flow br0 "table=0, priority=100, in_port=1, actions=meter:1,output:2"</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择网桥</strong>：确定要配置流表规则的网桥</li>
          <li><strong>定义匹配条件</strong>：设置数据包的匹配字段</li>
          <li><strong>配置动作</strong>：定义匹配数据包的处理动作</li>
          <li><strong>设置优先级</strong>：确定规则的匹配顺序</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>流表规则按优先级顺序匹配，高优先级规则先匹配</li>
          <li>删除规则时要小心，避免影响正常网络流量</li>
          <li>复杂的规则可能影响性能，需要合理设计</li>
          <li>建议在测试环境中验证规则效果后再应用到生产环境</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>流量控制</strong>：限制特定流量的带宽和优先级</li>
          <li><strong>安全策略</strong>：阻止恶意流量和未授权访问</li>
          <li><strong>负载均衡</strong>：将流量分发到多个目标端口</li>
          <li><strong>网络监控</strong>：将特定流量镜像到监控端口</li>
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
const bridgeForm = reactive({ name: '', protocol: 'OpenFlow13' })
const matchForm = reactive({ priority: 1000, inPort: '', srcMac: '', dstMac: '', srcIp: '', dstIp: '', protocol: '', srcPort: null, dstPort: null })
const actionForm = reactive({ type: 'output', outputPort: '', modifyField: [], gotoTable: null })
const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('流表规则配置已应用') }
const showHelp = () => { helpVisible.value = true }
const addFlowRule = () => { testResults.value = '流表规则添加成功:\n优先级: 1000\n匹配条件: in_port=1, ip_src=192.168.1.0/24\n动作: output:2\n规则ID: 1' }
const showFlowRules = () => { testResults.value = '当前流表规则:\n1. 优先级: 1000, 匹配: in_port=1, 动作: output:2\n2. 优先级: 500, 匹配: ip_dst=192.168.2.0/24, 动作: drop\n3. 优先级: 2000, 匹配: tcp_dst=80, 动作: output:3' }
const testFlowRule = () => { testResults.value = '规则匹配测试:\n测试包: src_ip=192.168.1.100, dst_ip=192.168.2.100\n匹配规则: 优先级 1000\n执行动作: output:2\n结果: 成功转发到端口2' }
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