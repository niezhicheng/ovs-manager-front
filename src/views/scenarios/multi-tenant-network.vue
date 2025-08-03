<template>
  <a-card title="多租户网络配置" class="scenario-card">
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
  </a-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const currentStep = ref(0)
const testResults = ref('')
const tenantForm = reactive({ name: 'tenant1', type: 'enterprise', network: '192.168.10.0/24', description: '企业A的网络环境', resourceQuota: 10 })
const isolationForm = reactive({ level: 'strict', vlanIsolation: true, vlanRange: '100-200', routeIsolation: true, firewallPolicy: true, allowedRules: 'tenant1:tenant2:80,443' })
const resourceForm = reactive({ sharedType: ['internet'], bandwidthPolicy: 'fair', storagePolicy: 'dedicated', qosGuarantee: true, minBandwidth: 100 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('多租户网络配置已应用') }
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
</style> 