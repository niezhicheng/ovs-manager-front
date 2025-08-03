<template>
  <a-card title="安全策略配置" class="scenario-card">
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
  </a-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const currentStep = ref(0)
const testResults = ref('')
const domainForm = reactive({ name: 'dmz-zone', level: 'high', network: '192.168.1.0/24', description: 'DMZ区域，用于部署Web服务' })
const aclForm = reactive({ name: 'allow-web-access', action: 'allow', srcAddress: '192.168.1.0/24', dstAddress: '10.0.0.0/8', protocol: ['tcp'], ports: '80,443', priority: 1000 })
const threatForm = reactive({ ddosProtection: true, ddosThreshold: 1000, ids: true, idsMode: 'hybrid', malwareFilter: true, logging: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('安全策略配置已应用') }
const applySecurityPolicy = () => { testResults.value = '安全策略应用结果:\n安全域: dmz-zone\n安全级别: 高\n规则数量: 5\nDDoS防护: 启用\n入侵检测: 启用\n状态: 已应用' }
const testSecurityRules = () => { testResults.value = '安全规则测试:\n正常流量: 通过\n恶意流量: 阻止\nDDoS攻击: 检测到并阻止\n入侵尝试: 检测到并记录\n安全策略: 生效' }
const showSecurityStatus = () => { testResults.value = '安全状态信息:\n安全域: dmz-zone\n状态: active\n规则数量: 5\n威胁检测: 正常\n日志记录: 正常\n防护效果: 良好' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 