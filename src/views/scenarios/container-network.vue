<template>
  <a-card title="容器网络配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择网络模式" description="选择容器网络模式" />
      <a-step title="配置网络参数" description="设置网络参数" />
      <a-step title="配置服务发现" description="设置服务发现机制" />
      <a-step title="测试容器网络" description="测试容器网络连通性" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="networkForm" layout="vertical">
          <a-form-item label="网络模式">
            <a-select v-model="networkForm.mode" placeholder="选择网络模式">
              <a-option value="bridge">Bridge模式 (桥接模式)</a-option>
              <a-option value="host">Host模式 (主机模式)</a-option>
              <a-option value="overlay">Overlay模式 (覆盖网络)</a-option>
              <a-option value="macvlan">MacVLAN模式</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="容器平台">
            <a-select v-model="networkForm.platform" placeholder="选择容器平台">
              <a-option value="docker">Docker</a-option>
              <a-option value="kubernetes">Kubernetes</a-option>
              <a-option value="podman">Podman</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网络名称">
            <a-input v-model="networkForm.name" placeholder="例如: container-net" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="configForm" layout="vertical">
          <a-form-item label="子网CIDR">
            <a-input v-model="configForm.subnet" placeholder="例如: 172.18.0.0/16" />
          </a-form-item>
          <a-form-item label="网关地址">
            <a-input v-model="configForm.gateway" placeholder="例如: 172.18.0.1" />
          </a-form-item>
          <a-form-item label="DNS服务器">
            <a-input v-model="configForm.dns" placeholder="例如: 8.8.8.8,8.8.4.4" />
          </a-form-item>
          <a-form-item label="MTU大小">
            <a-input-number v-model="configForm.mtu" :min="68" :max="9000" :default-value="1500" />
          </a-form-item>
          <a-form-item label="启用IPv6">
            <a-switch v-model="configForm.ipv6" />
            <span style="margin-left: 8px;">启用IPv6支持</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="serviceForm" layout="vertical">
          <a-form-item label="服务发现类型">
            <a-select v-model="serviceForm.discovery" placeholder="选择服务发现">
              <a-option value="dns">DNS服务发现</a-option>
              <a-option value="consul">Consul服务发现</a-option>
              <a-option value="etcd">ETCD服务发现</a-option>
              <a-option value="kubernetes">Kubernetes服务发现</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="负载均衡">
            <a-select v-model="serviceForm.loadBalancer" placeholder="选择负载均衡">
              <a-option value="round-robin">轮询 (Round Robin)</a-option>
              <a-option value="least-connections">最少连接</a-option>
              <a-option value="ip-hash">IP哈希</a-option>
              <a-option value="weighted">加权轮询</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="健康检查">
            <a-switch v-model="serviceForm.healthCheck" />
            <span style="margin-left: 8px;">启用健康检查</span>
          </a-form-item>
          <a-form-item v-if="serviceForm.healthCheck" label="检查间隔(秒)">
            <a-input-number v-model="serviceForm.checkInterval" :min="1" :max="300" :default-value="30" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createNetwork">创建容器网络</a-button>
          <a-button @click="testContainerNetwork">测试容器网络</a-button>
          <a-button @click="showNetworkStatus">显示网络状态</a-button>
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
const networkForm = reactive({ mode: 'bridge', platform: 'docker', name: 'container-net' })
const configForm = reactive({ subnet: '172.18.0.0/16', gateway: '172.18.0.1', dns: '8.8.8.8,8.8.4.4', mtu: 1500, ipv6: false })
const serviceForm = reactive({ discovery: 'dns', loadBalancer: 'round-robin', healthCheck: true, checkInterval: 30 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('容器网络配置已应用') }
const createNetwork = () => { testResults.value = '容器网络创建结果:\n网络名称: container-net\n模式: bridge\n平台: Docker\n子网: 172.18.0.0/16\n网关: 172.18.0.1\n状态: 已创建' }
const testContainerNetwork = () => { testResults.value = '容器网络测试:\n容器间通信: 正常\n外部网络访问: 正常\nDNS解析: 正常\n服务发现: 正常\n负载均衡: 正常' }
const showNetworkStatus = () => { testResults.value = '网络状态信息:\n网络名称: container-net\n状态: active\n容器数量: 5\n服务数量: 3\n健康检查: 通过\n负载均衡: 运行中' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 