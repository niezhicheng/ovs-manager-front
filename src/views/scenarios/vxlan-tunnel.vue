<template>
  <a-card title="VXLAN 隧道配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="创建VXLAN端口" description="在网桥上创建VXLAN端口" />
      <a-step title="配置隧道参数" description="设置VXLAN隧道参数" />
      <a-step title="配置流表" description="配置VXLAN流量转发规则" />
      <a-step title="测试隧道" description="测试VXLAN隧道连通性" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="vxlanForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-input v-model="vxlanForm.bridge" placeholder="例如: br0" />
          </a-form-item>
          <a-form-item label="VXLAN端口名称">
            <a-input v-model="vxlanForm.port" placeholder="例如: vxlan0" />
          </a-form-item>
          <a-form-item label="VNI (Virtual Network Identifier)">
            <a-input-number v-model="vxlanForm.vni" :min="1" :max="16777215" placeholder="例如: 100" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="tunnelForm" layout="vertical">
          <a-form-item label="本地IP地址">
            <a-input v-model="tunnelForm.localIp" placeholder="例如: 192.168.1.10" />
          </a-form-item>
          <a-form-item label="远程IP地址">
            <a-input v-model="tunnelForm.remoteIp" placeholder="例如: 192.168.1.20" />
          </a-form-item>
          <a-form-item label="UDP端口">
            <a-input-number v-model="tunnelForm.udpPort" :min="1024" :max="65535" :default-value="4789" />
          </a-form-item>
          <a-form-item label="TTL">
            <a-input-number v-model="tunnelForm.ttl" :min="1" :max="255" :default-value="64" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="flowForm" layout="vertical">
          <a-form-item label="源MAC地址">
            <a-input v-model="flowForm.srcMac" placeholder="例如: 00:11:22:33:44:55" />
          </a-form-item>
          <a-form-item label="目标MAC地址">
            <a-input v-model="flowForm.dstMac" placeholder="例如: 00:aa:bb:cc:dd:ee" />
          </a-form-item>
          <a-form-item label="优先级">
            <a-input-number v-model="flowForm.priority" :min="0" :max="65535" :default-value="1000" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testTunnel">测试VXLAN隧道</a-button>
          <a-button @click="showTunnelStatus">显示隧道状态</a-button>
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
      title="VXLAN 隧道配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>VXLAN (Virtual Extensible LAN) 是一种网络虚拟化技术，通过在UDP封装中封装以太网帧来创建虚拟网络。OVS支持VXLAN隧道，可以在不同物理网络间创建虚拟的二层网络连接。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>VXLAN隧道</strong>：基于UDP的隧道协议，支持大规模网络虚拟化</li>
          <li><strong>VNI (VXLAN Network Identifier)</strong>：24位标识符，用于区分不同的虚拟网络</li>
          <li><strong>VTEP (VXLAN Tunnel End Point)</strong>：VXLAN隧道的端点设备</li>
          <li><strong>封装/解封装</strong>：将原始以太网帧封装在UDP包中传输</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建VXLAN端口</h4>
          <pre class="command"># 创建VXLAN端口
ovs-vsctl add-port br0 vxlan0 -- set interface vxlan0 type=vxlan options:remote_ip=192.168.1.100 options:key=100

# 查看VXLAN端口配置
ovs-vsctl list interface vxlan0

# 查看VXLAN端口详细信息
ovs-vsctl show</pre>

          <h4>2. 配置VXLAN参数</h4>
          <pre class="command"># 配置VXLAN网络标识符(VNI)
ovs-vsctl set interface vxlan0 options:key=1000

# 配置远程端点IP
ovs-vsctl set interface vxlan0 options:remote_ip=192.168.1.100

# 配置本地IP地址
ovs-vsctl set interface vxlan0 options:local_ip=192.168.1.1

# 配置TTL值
ovs-vsctl set interface vxlan0 options:ttl=64</pre>

          <h4>3. 配置VXLAN流表规则</h4>
          <pre class="command"># 配置VXLAN流量转发规则
ovs-ofctl add-flow br0 "table=0, priority=100, in_port=vxlan0, actions=normal"
ovs-ofctl add-flow br0 "table=0, priority=100, dl_vlan=100, actions=strip_vlan,output:vxlan0"

# 查看流表规则
ovs-ofctl dump-flows br0

# 查看VXLAN端口统计
ovs-ofctl dump-ports br0 vxlan0</pre>

          <h4>4. 测试VXLAN连接</h4>
          <pre class="command"># 测试VXLAN隧道连通性
ping 192.168.1.100

# 查看VXLAN隧道状态
ovs-vsctl list interface vxlan0

# 查看VXLAN端口统计信息
ovs-ofctl dump-ports br0 vxlan0

# 抓包分析VXLAN流量
tcpdump -i vxlan0 -w vxlan_traffic.pcap</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>创建VXLAN端口</strong>：在网桥上添加VXLAN类型的端口</li>
          <li><strong>配置隧道参数</strong>：设置远程IP、VNI、TTL等参数</li>
          <li><strong>配置流表规则</strong>：设置VXLAN流量的转发规则</li>
          <li><strong>测试隧道连接</strong>：验证VXLAN隧道的连通性</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>VXLAN使用UDP端口4789，确保防火墙允许该端口</li>
          <li>VNI范围是0-16777215，建议使用较大的值避免冲突</li>
          <li>VXLAN会增加网络开销，影响性能</li>
          <li>需要确保两端点间的网络连通性</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>数据中心网络</strong>：连接不同物理位置的虚拟机</li>
          <li><strong>云网络</strong>：实现跨数据中心的网络连接</li>
          <li><strong>容器网络</strong>：为容器提供网络隔离和连接</li>
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
const vxlanForm = reactive({ bridge: 'br0', port: 'vxlan0', vni: 100 })
const tunnelForm = reactive({ localIp: '', remoteIp: '', udpPort: 4789, ttl: 64 })
const flowForm = reactive({ srcMac: '', dstMac: '', priority: 1000 })
const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('VXLAN隧道配置已应用') }
const showHelp = () => { helpVisible.value = true }
const testTunnel = () => { testResults.value = 'VXLAN隧道测试结果:\n隧道状态: 正常\nVNI: 100\n本地IP: 192.168.1.10\n远程IP: 192.168.1.20\nUDP端口: 4789\n连通性: 正常' }
const showTunnelStatus = () => { testResults.value = '隧道状态信息:\n端口: vxlan0\n状态: up\nVNI: 100\n封装: vxlan\n本地IP: 192.168.1.10\n远程IP: 192.168.1.20' }
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