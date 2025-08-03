<template>
  <a-card title="端口镜像配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择网桥" description="选择要配置镜像的网桥" />
      <a-step title="配置镜像规则" description="设置镜像源和目标" />
      <a-step title="配置过滤条件" description="设置镜像过滤规则" />
      <a-step title="测试镜像" description="测试镜像功能" />
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
          <a-form-item label="镜像名称">
            <a-input v-model="bridgeForm.mirrorName" placeholder="例如: mirror1" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="mirrorForm" layout="vertical">
          <a-form-item label="镜像类型">
            <a-select v-model="mirrorForm.type" placeholder="选择镜像类型">
              <a-option value="ingress">入站镜像 (Ingress)</a-option>
              <a-option value="egress">出站镜像 (Egress)</a-option>
              <a-option value="both">双向镜像 (Both)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="源端口">
            <a-select v-model="mirrorForm.srcPorts" placeholder="选择源端口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="目标端口">
            <a-input v-model="mirrorForm.dstPort" placeholder="例如: eth4" />
          </a-form-item>
          <a-form-item label="镜像所有端口">
            <a-switch v-model="mirrorForm.selectAll" />
            <span style="margin-left: 8px;">镜像网桥上的所有端口</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="filterForm" layout="vertical">
          <a-form-item label="VLAN过滤">
            <a-input-number v-model="filterForm.vlan" :min="1" :max="4094" placeholder="指定VLAN ID，留空表示不过滤" />
          </a-form-item>
          <a-form-item label="源MAC地址">
            <a-input v-model="filterForm.srcMac" placeholder="例如: 00:11:22:33:44:55" />
          </a-form-item>
          <a-form-item label="目标MAC地址">
            <a-input v-model="filterForm.dstMac" placeholder="例如: 00:aa:bb:cc:dd:ee" />
          </a-form-item>
          <a-form-item label="协议过滤">
            <a-select v-model="filterForm.protocol" placeholder="选择协议" allow-clear>
              <a-option value="tcp">TCP</a-option>
              <a-option value="udp">UDP</a-option>
              <a-option value="icmp">ICMP</a-option>
              <a-option value="arp">ARP</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口过滤">
            <a-input v-model="filterForm.port" placeholder="例如: 80,443,8080" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createMirror">创建镜像</a-button>
          <a-button @click="testMirror">测试镜像功能</a-button>
          <a-button @click="showMirrorStatus">显示镜像状态</a-button>
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
      title="端口镜像配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>端口镜像将指定端口的流量复制到监控端口，用于网络监控、流量分析和安全审计。通过镜像功能可以实时监控网络流量而不影响正常业务。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>源端口</strong>：被监控的端口</li>
          <li><strong>目标端口</strong>：接收镜像流量的端口</li>
          <li><strong>镜像方向</strong>：入站、出站或双向镜像</li>
          <li><strong>镜像模式</strong>：连续镜像或采样镜像</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建镜像端口</h4>
          <pre class="command"># 创建镜像端口
ovs-vsctl add-port br0 mirror-port -- set interface mirror-port type=internal

# 配置镜像端口IP
ip addr add 192.168.1.100/24 dev mirror-port

# 启用镜像端口
ip link set mirror-port up</pre>

          <h4>2. 配置端口镜像</h4>
          <pre class="command"># 配置单向镜像
ovs-vsctl set port eth0 mirror=@m
ovs-vsctl -- --id=@m create mirror name=m0 select_all=true output_port=@mirror-port

# 配置双向镜像
ovs-vsctl set port eth0 mirror=@m
ovs-vsctl -- --id=@m create mirror name=m0 select_all=true output_port=@mirror-port

# 配置选择性镜像
ovs-vsctl set port eth0 mirror=@m
ovs-vsctl -- --id=@m create mirror name=m0 select_dst_port=eth0 output_port=@mirror-port</pre>

          <h4>3. 配置镜像规则</h4>
          <pre class="command"># 配置基于流的镜像
ovs-ofctl add-flow br0 "table=0, priority=100, in_port=1, actions=output:2,output:mirror-port"

# 配置基于IP的镜像
ovs-ofctl add-flow br0 "table=0, priority=100, ip, nw_src=192.168.1.0/24, actions=output:2,output:mirror-port"

# 配置基于端口的镜像
ovs-ofctl add-flow br0 "table=0, priority=100, tcp, tp_dst=80, actions=output:2,output:mirror-port"</pre>

          <h4>4. 监控镜像流量</h4>
          <pre class="command"># 查看镜像配置
ovs-vsctl list mirror

# 查看镜像端口状态
ovs-vsctl list interface mirror-port

# 查看镜像流量统计
ovs-ofctl dump-ports br0 mirror-port

# 抓取镜像流量
tcpdump -i mirror-port -w mirror.pcap</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择网桥</strong>：选择要配置镜像的网桥</li>
          <li><strong>配置镜像</strong>：设置源端口和目标端口</li>
          <li><strong>配置规则</strong>：设置镜像规则和过滤条件</li>
          <li><strong>测试验证</strong>：验证镜像功能效果</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>镜像端口要有足够带宽</li>
          <li>要避免镜像环路</li>
          <li>要监控镜像性能</li>
          <li>要定期清理镜像配置</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>网络监控</strong>：实时监控网络流量</li>
          <li><strong>安全审计</strong>：记录和分析网络行为</li>
          <li><strong>故障排查</strong>：分析网络问题</li>
          <li><strong>性能分析</strong>：评估网络性能</li>
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
const bridgeForm = reactive({ name: '', mirrorName: 'mirror1' })
const mirrorForm = reactive({ type: 'both', srcPorts: [], dstPort: 'eth4', selectAll: false })
const filterForm = reactive({ vlan: null, srcMac: '', dstMac: '', protocol: '', port: '' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('端口镜像配置已应用') }
const showHelp = () => { helpVisible.value = true }
const createMirror = () => { testResults.value = '镜像创建结果:\n镜像名称: mirror1\n网桥: br0\n类型: 双向镜像\n源端口: eth0, eth1\n目标端口: eth4\n状态: 已创建' }
const testMirror = () => { testResults.value = '镜像功能测试:\n测试包数量: 1000\n镜像包数量: 1000\n镜像率: 100%\n延迟: 0.1ms\n状态: 正常' }
const showMirrorStatus = () => { testResults.value = '镜像状态信息:\n镜像名称: mirror1\n状态: active\n类型: both\n源端口: 2个\n目标端口: eth4\n统计信息: 正常收集' }
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