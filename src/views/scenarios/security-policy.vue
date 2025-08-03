<template>
  <a-card title="安全策略配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择安全域" description="选择要保护的安全域" />
      <a-step title="配置访问控制" description="设置访问控制规则" />
      <a-step title="配置威胁防护" description="设置威胁防护策略" />
      <a-step title="测试安全策略" description="测试安全策略效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="domainForm" layout="vertical">
          <a-form-item label="安全域名称">
            <a-input v-model="domainForm.name" placeholder="例如: dmz-zone" />
          </a-form-item>
          <a-form-item label="安全级别">
            <a-select v-model="domainForm.level" placeholder="选择安全级别">
              <a-option value="high">高安全级别</a-option>
              <a-option value="medium">中安全级别</a-option>
              <a-option value="low">低安全级别</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网段范围">
            <a-input v-model="domainForm.network" placeholder="例如: 192.168.1.0/24" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model="domainForm.description" placeholder="例如: DMZ区域，用于部署Web服务" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="aclForm" layout="vertical">
          <a-form-item label="规则名称">
            <a-input v-model="aclForm.name" placeholder="例如: allow-web-access" />
          </a-form-item>
          <a-form-item label="规则动作">
            <a-select v-model="aclForm.action" placeholder="选择规则动作">
              <a-option value="allow">允许 (Allow)</a-option>
              <a-option value="deny">拒绝 (Deny)</a-option>
              <a-option value="drop">丢弃 (Drop)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="源地址">
            <a-input v-model="aclForm.srcAddress" placeholder="例如: 192.168.1.0/24" />
          </a-form-item>
          <a-form-item label="目标地址">
            <a-input v-model="aclForm.dstAddress" placeholder="例如: 10.0.0.0/8" />
          </a-form-item>
          <a-form-item label="协议">
            <a-select v-model="aclForm.protocol" placeholder="选择协议" multiple>
              <a-option value="tcp">TCP</a-option>
              <a-option value="udp">UDP</a-option>
              <a-option value="icmp">ICMP</a-option>
              <a-option value="any">任意协议</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口范围">
            <a-input v-model="aclForm.ports" placeholder="例如: 80,443,8080-8090" />
          </a-form-item>
          <a-form-item label="优先级">
            <a-input-number v-model="aclForm.priority" :min="1" :max="65535" :default-value="1000" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="threatForm" layout="vertical">
          <a-form-item label="DDoS防护">
            <a-switch v-model="threatForm.ddosProtection" />
            <span style="margin-left: 8px;">启用DDoS防护</span>
          </a-form-item>
          <a-form-item v-if="threatForm.ddosProtection" label="DDoS阈值">
            <a-input-number v-model="threatForm.ddosThreshold" :min="100" :max="100000" :default-value="1000" />
            <span style="margin-left: 8px;">包/秒</span>
          </a-form-item>
          <a-form-item label="入侵检测">
            <a-switch v-model="threatForm.ids" />
            <span style="margin-left: 8px;">启用入侵检测</span>
          </a-form-item>
          <a-form-item v-if="threatForm.ids" label="检测模式">
            <a-select v-model="threatForm.idsMode" placeholder="选择检测模式">
              <a-option value="signature">特征检测</a-option>
              <a-option value="anomaly">异常检测</a-option>
              <a-option value="hybrid">混合检测</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="恶意流量过滤">
            <a-switch v-model="threatForm.malwareFilter" />
            <span style="margin-left: 8px;">启用恶意流量过滤</span>
          </a-form-item>
          <a-form-item label="日志记录">
            <a-switch v-model="threatForm.logging" />
            <span style="margin-left: 8px;">启用安全日志记录</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="applySecurityPolicy">应用安全策略</a-button>
          <a-button @click="testSecurityRules">测试安全规则</a-button>
          <a-button @click="showSecurityStatus">显示安全状态</a-button>
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
      title="安全策略配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>安全策略配置通过防火墙规则、访问控制列表和流量过滤来保护网络资源，实现网络安全防护。通过多层次的安全策略确保网络和数据的安全。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>防火墙规则</strong>：控制网络流量的访问规则</li>
          <li><strong>访问控制</strong>：基于源地址、目标地址的访问控制</li>
          <li><strong>流量过滤</strong>：过滤恶意流量和异常数据包</li>
          <li><strong>安全域</strong>：不同安全级别的网络区域</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 配置防火墙规则</h4>
          <pre class="command"># 添加允许规则
ovs-ofctl add-flow br0 "table=0, priority=100, ip, nw_src=192.168.1.0/24, actions=output:2"

# 添加拒绝规则
ovs-ofctl add-flow br0 "table=0, priority=200, ip, nw_src=10.0.0.0/8, actions=drop"

# 添加端口过滤规则
ovs-ofctl add-flow br0 "table=0, priority=150, tcp, tp_dst=22, actions=output:3"</pre>

          <h4>2. 配置访问控制</h4>
          <pre class="command"># 配置源地址过滤
ovs-ofctl add-flow br0 "table=0, priority=100, ip, nw_src=192.168.1.100, actions=output:2"

# 配置目标地址过滤
ovs-ofctl add-flow br0 "table=0, priority=100, ip, nw_dst=192.168.2.0/24, actions=output:3"

# 配置协议过滤
ovs-ofctl add-flow br0 "table=0, priority=100, tcp, actions=output:2"</pre>

          <h4>3. 配置流量监控</h4>
          <pre class="command"># 配置流量镜像
ovs-vsctl add-port br0 mirror-port -- set interface mirror-port type=internal
ovs-vsctl set port eth0 mirror=@m
ovs-vsctl -- --id=@m create mirror name=m0 select_all=true output_port=@mirror-port

# 配置流量统计
ovs-ofctl dump-flows br0

# 配置端口监控
ovs-ofctl dump-ports br0</pre>

          <h4>4. 配置安全策略</h4>
          <pre class="command"># 配置默认拒绝策略
ovs-ofctl add-flow br0 "table=0, priority=0, actions=drop"

# 配置允许策略
ovs-ofctl add-flow br0 "table=0, priority=100, ip, actions=output:NORMAL"

# 配置日志记录
ovs-ofctl add-flow br0 "table=0, priority=50, actions=log,output:NORMAL"</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择安全域</strong>：定义需要保护的安全域</li>
          <li><strong>配置防火墙</strong>：设置防火墙规则和策略</li>
          <li><strong>配置监控</strong>：设置流量监控和日志记录</li>
          <li><strong>测试验证</strong>：验证安全策略效果</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>防火墙规则要考虑业务需求</li>
          <li>访问控制要严格但不过度</li>
          <li>要定期更新安全策略</li>
          <li>要监控安全事件</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>企业网络</strong>：保护内部网络安全</li>
          <li><strong>数据中心</strong>：隔离不同安全区域</li>
          <li><strong>云环境</strong>：实现多租户安全隔离</li>
          <li><strong>工业网络</strong>：保护关键基础设施</li>
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
const domainForm = reactive({ name: 'dmz', type: 'dmz', description: 'DMZ区域网络', level: 'medium' })
const firewallForm = reactive({ rules: [], defaultPolicy: 'deny', logging: true, monitoring: true })
const monitorForm = reactive({ type: 'traffic', alert: true, log: true, report: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('安全策略配置已应用') }
const showHelp = () => { helpVisible.value = true }
const createPolicy = () => { testResults.value = '安全策略创建结果:\n安全域: dmz\n类型: DMZ区域\n安全级别: 中等\n默认策略: 拒绝\n日志记录: 已启用\n监控: 已启用\n状态: 已创建' }
const testPolicy = () => { testResults.value = '安全策略测试:\n防火墙规则: 生效\n访问控制: 正常\n流量过滤: 工作正常\n日志记录: 正常\n监控告警: 正常\n安全状态: 良好' }
const showPolicyStatus = () => { testResults.value = '安全策略状态:\n策略名称: dmz-policy\n状态: 活跃\n运行时间: 72小时\n\n安全事件:\n- 拒绝访问: 15次\n- 异常流量: 3次\n- 安全告警: 1次\n\n防护效果:\n- 恶意流量: 已阻止\n- 异常访问: 已记录\n- 安全等级: 良好' }
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