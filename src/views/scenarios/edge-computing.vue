<template>
  <a-card title="边缘计算网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置边缘节点" description="配置边缘计算节点" />
      <a-step title="配置网络连接" description="配置边缘到云端连接" />
      <a-step title="配置本地网络" description="配置边缘本地网络" />
      <a-step title="测试边缘网络" description="测试边缘网络连通性" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="edgeForm" layout="vertical">
          <a-form-item label="边缘节点名称">
            <a-input v-model="edgeForm.name" placeholder="例如: edge-node-01" />
          </a-form-item>
          <a-form-item label="节点类型">
            <a-select v-model="edgeForm.type" placeholder="选择节点类型">
              <a-option value="gateway">边缘网关</a-option>
              <a-option value="compute">边缘计算节点</a-option>
              <a-option value="storage">边缘存储节点</a-option>
              <a-option value="sensor">传感器节点</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="地理位置">
            <a-input v-model="edgeForm.location" placeholder="例如: 北京市朝阳区" />
          </a-form-item>
          <a-form-item label="计算资源">
            <a-input-number v-model="edgeForm.cpu" :min="1" :max="64" :default-value="4" />
            <span style="margin-left: 8px;">CPU核心</span>
          </a-form-item>
          <a-form-item label="内存资源">
            <a-input-number v-model="edgeForm.memory" :min="1" :max="256" :default-value="8" />
            <span style="margin-left: 8px;">GB内存</span>
          </a-form-item>
          <a-form-item label="存储资源">
            <a-input-number v-model="edgeForm.storage" :min="10" :max="10000" :default-value="100" />
            <span style="margin-left: 8px;">GB存储</span>
          </a-form-item>
          <a-form-item label="网络接口">
            <a-select v-model="edgeForm.interfaces" placeholder="选择网络接口" multiple>
              <a-option value="eth0">eth0 (WAN)</a-option>
              <a-option value="eth1">eth1 (LAN)</a-option>
              <a-option value="wlan0">wlan0 (WiFi)</a-option>
              <a-option value="cellular">cellular (4G/5G)</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="connectionForm" layout="vertical">
          <a-form-item label="云端连接类型">
            <a-select v-model="connectionForm.type" placeholder="选择连接类型">
              <a-option value="vpn">VPN隧道</a-option>
              <a-option value="ipsec">IPSec隧道</a-option>
              <a-option value="gre">GRE隧道</a-option>
              <a-option value="vxlan">VXLAN隧道</a-option>
              <a-option value="direct">直连</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="云端地址">
            <a-input v-model="connectionForm.cloudAddress" placeholder="例如: 192.168.1.100" />
          </a-form-item>
          <a-form-item label="边缘地址">
            <a-input v-model="connectionForm.edgeAddress" placeholder="例如: 10.0.0.100" />
          </a-form-item>
          <a-form-item label="隧道密钥">
            <a-input v-model="connectionForm.tunnelKey" placeholder="例如: edge-tunnel-key-123" />
          </a-form-item>
          <a-form-item label="带宽限制">
            <a-input-number v-model="connectionForm.bandwidth" :min="1" :max="1000" :default-value="100" />
            <span style="margin-left: 8px;">Mbps</span>
          </a-form-item>
          <a-form-item label="启用加密">
            <a-switch v-model="connectionForm.encryption" />
            <span style="margin-left: 8px;">启用数据传输加密</span>
          </a-form-item>
          <a-form-item label="启用压缩">
            <a-switch v-model="connectionForm.compression" />
            <span style="margin-left: 8px;">启用数据压缩</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="localForm" layout="vertical">
          <a-form-item label="本地网络模式">
            <a-select v-model="localForm.mode" placeholder="选择网络模式">
              <a-option value="bridge">网桥模式</a-option>
              <a-option value="nat">NAT模式</a-option>
              <a-option value="routing">路由模式</a-option>
              <a-option value="isolated">隔离模式</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="本地网段">
            <a-input v-model="localForm.network" placeholder="例如: 192.168.100.0/24" />
          </a-form-item>
          <a-form-item label="DHCP服务">
            <a-switch v-model="localForm.dhcp" />
            <span style="margin-left: 8px;">启用DHCP服务</span>
          </a-form-item>
          <a-form-item v-if="localForm.dhcp" label="DHCP地址池">
            <a-input v-model="localForm.dhcpPool" placeholder="例如: 192.168.100.100-192.168.100.200" />
          </a-form-item>
          <a-form-item label="DNS服务">
            <a-switch v-model="localForm.dns" />
            <span style="margin-left: 8px;">启用本地DNS服务</span>
          </a-form-item>
          <a-form-item v-if="localForm.dns" label="DNS服务器">
            <a-input v-model="localForm.dnsServers" placeholder="例如: 8.8.8.8, 114.114.114.114" />
          </a-form-item>
          <a-form-item label="本地防火墙">
            <a-switch v-model="localForm.firewall" />
            <span style="margin-left: 8px;">启用本地防火墙</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="deployEdgeNode">部署边缘节点</a-button>
          <a-button @click="testCloudConnection">测试云端连接</a-button>
          <a-button @click="testLocalNetwork">测试本地网络</a-button>
          <a-button @click="showEdgeStatus">显示边缘状态</a-button>
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
      title="边缘计算网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>边缘计算网络将计算和存储资源部署在网络边缘，靠近数据源和用户，减少延迟并提高响应速度。边缘节点可以独立处理本地数据，同时与云端保持连接进行数据同步和协作。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>边缘节点</strong>：部署在网络边缘的计算设备</li>
          <li><strong>边缘网关</strong>：连接本地网络和云端网络的网关设备</li>
          <li><strong>边缘计算</strong>：在边缘节点进行数据处理和计算</li>
          <li><strong>本地网络</strong>：边缘节点管理的本地网络环境</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 配置边缘节点</h4>
          <pre class="command"># 创建边缘网桥
ovs-vsctl add-br edge-bridge
ovs-vsctl set bridge edge-bridge protocols=OpenFlow13

# 配置边缘节点网络
ovs-vsctl add-port edge-bridge edge-eth0 -- set interface edge-eth0 type=system
ovs-vsctl add-port edge-bridge edge-eth1 -- set interface edge-eth1 type=system

# 配置边缘节点IP
ip addr add 10.0.0.100/24 dev edge-eth0
ip addr add 192.168.100.1/24 dev edge-eth1</pre>

          <h4>2. 配置云端连接</h4>
          <pre class="command"># 创建VPN隧道
ovs-vsctl add-port edge-bridge vpn-tunnel -- set interface vpn-tunnel type=gre
ovs-vsctl set interface vpn-tunnel options:remote_ip=192.168.1.100
ovs-vsctl set interface vpn-tunnel options:key=123

# 配置IPSec隧道
ovs-vsctl add-port edge-bridge ipsec-tunnel -- set interface ipsec-tunnel type=gre
ovs-vsctl set interface ipsec-tunnel options:remote_ip=192.168.1.100
ovs-vsctl set interface ipsec-tunnel options:key=456</pre>

          <h4>3. 配置本地网络</h4>
          <pre class="command"># 配置本地网桥
ovs-vsctl add-br local-bridge
ovs-vsctl add-port local-bridge local-eth1 -- set interface local-eth1 type=system

# 配置DHCP服务
ovs-vsctl set bridge local-bridge other-config:dhcp-server=enabled
ovs-vsctl set bridge local-bridge other-config:dhcp-pool=192.168.100.100-192.168.100.200

# 配置DNS服务
ovs-vsctl set bridge local-bridge other-config:dns-server=enabled
ovs-vsctl set bridge local-bridge other-config:dns-servers=8.8.8.8,114.114.114.114</pre>

          <h4>4. 配置防火墙</h4>
          <pre class="command"># 配置边缘防火墙
ovs-vsctl set bridge edge-bridge other-config:firewall=enabled

# 配置访问控制规则
ovs-vsctl set port edge-eth0 other-config:access-control=enabled
ovs-vsctl set port edge-eth1 other-config:access-control=enabled

# 配置流量过滤
ovs-vsctl set port vpn-tunnel other-config:traffic-filter=enabled</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>配置边缘节点</strong>：设置边缘计算节点的硬件和网络配置</li>
          <li><strong>建立云端连接</strong>：配置边缘节点与云端的通信隧道</li>
          <li><strong>配置本地网络</strong>：设置边缘节点的本地网络环境</li>
          <li><strong>测试验证</strong>：验证边缘网络的连通性和性能</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>边缘节点需要稳定的网络连接</li>
          <li>本地网络要考虑安全性和隔离性</li>
          <li>云端连接要考虑带宽和延迟</li>
          <li>边缘计算要考虑资源限制</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>智能城市</strong>：部署在城市的边缘节点处理传感器数据</li>
          <li><strong>工业物联网</strong>：在工厂边缘处理设备监控数据</li>
          <li><strong>自动驾驶</strong>：在车辆边缘处理实时感知数据</li>
          <li><strong>视频监控</strong>：在监控点边缘处理视频流数据</li>
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
const edgeForm = reactive({ name: 'edge-node-01', type: 'gateway', location: '北京市朝阳区', cpu: 4, memory: 8, storage: 100, interfaces: ['eth0', 'eth1'] })
const connectionForm = reactive({ type: 'vpn', cloudAddress: '192.168.1.100', edgeAddress: '10.0.0.100', tunnelKey: 'edge-tunnel-key-123', bandwidth: 100, encryption: true, compression: true })
const localForm = reactive({ mode: 'bridge', network: '192.168.100.0/24', dhcp: true, dhcpPool: '192.168.100.100-192.168.100.200', dns: true, dnsServers: '8.8.8.8, 114.114.114.114', firewall: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('边缘计算网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
const deployEdgeNode = () => { testResults.value = '边缘节点部署结果:\n节点名称: edge-node-01\n节点类型: 边缘网关\n地理位置: 北京市朝阳区\n资源分配: 4CPU, 8GB内存, 100GB存储\n状态: 部署成功\n\n网络接口:\n- eth0 (WAN): 已配置\n- eth1 (LAN): 已配置\n- 网络模式: 网桥模式' }
const testCloudConnection = () => { testResults.value = '云端连接测试:\n连接类型: VPN隧道\n云端地址: 192.168.1.100\n边缘地址: 10.0.0.100\n连接状态: 已建立\n\n性能指标:\n- 延迟: 15ms\n- 带宽: 95Mbps\n- 丢包率: 0.1%\n- 加密状态: 已启用\n- 压缩状态: 已启用' }
const testLocalNetwork = () => { testResults.value = '本地网络测试:\n网络模式: 网桥模式\n本地网段: 192.168.100.0/24\nDHCP服务: 运行中\nDNS服务: 运行中\n防火墙: 已启用\n\n连接设备:\n- 设备1: 192.168.100.101 (在线)\n- 设备2: 192.168.100.102 (在线)\n- 设备3: 192.168.100.103 (离线)\n\n网络性能:\n- 平均延迟: 2ms\n- 平均带宽: 950Mbps' }
const showEdgeStatus = () => { testResults.value = '边缘节点状态:\n节点名称: edge-node-01\n运行状态: 正常\n运行时间: 72小时\nCPU使用率: 35%\n内存使用率: 60%\n存储使用率: 45%\n\n网络状态:\n- 云端连接: 正常\n- 本地网络: 正常\n- 设备连接: 15个\n\n服务状态:\n- DHCP服务: 正常\n- DNS服务: 正常\n- 防火墙: 正常\n- VPN服务: 正常' }
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