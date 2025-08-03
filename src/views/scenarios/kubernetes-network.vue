<template>
  <a-card title="Kubernetes网络配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择网络插件" description="选择K8s网络插件" />
      <a-step title="配置网络策略" description="配置网络策略和策略" />
      <a-step title="配置服务网格" description="配置Istio服务网格" />
      <a-step title="测试网络" description="测试K8s网络连通性" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="pluginForm" layout="vertical">
          <a-form-item label="网络插件类型">
            <a-select v-model="pluginForm.type" placeholder="选择网络插件">
              <a-option value="flannel">Flannel</a-option>
              <a-option value="calico">Calico</a-option>
              <a-option value="weave">Weave Net</a-option>
              <a-option value="cilium">Cilium</a-option>
              <a-option value="ovn">OVN-Kubernetes</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网络模式">
            <a-select v-model="pluginForm.mode" placeholder="选择网络模式">
              <a-option value="overlay">Overlay网络</a-option>
              <a-option value="underlay">Underlay网络</a-option>
              <a-option value="hybrid">混合模式</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Pod网段">
            <a-input v-model="pluginForm.podCIDR" placeholder="例如: 10.244.0.0/16" />
          </a-form-item>
          <a-form-item label="Service网段">
            <a-input v-model="pluginForm.serviceCIDR" placeholder="例如: 10.96.0.0/12" />
          </a-form-item>
          <a-form-item label="MTU大小">
            <a-input-number v-model="pluginForm.mtu" :min="1280" :max="9000" :default-value="1450" />
          </a-form-item>
          <a-form-item label="启用IPAM">
            <a-switch v-model="pluginForm.enableIPAM" />
            <span style="margin-left: 8px;">启用IP地址管理</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="policyForm" layout="vertical">
          <a-form-item label="网络策略名称">
            <a-input v-model="policyForm.name" placeholder="例如: default-deny" />
          </a-form-item>
          <a-form-item label="策略类型">
            <a-select v-model="policyForm.type" placeholder="选择策略类型">
              <a-option value="ingress">入站策略</a-option>
              <a-option value="egress">出站策略</a-option>
              <a-option value="both">双向策略</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="目标命名空间">
            <a-input v-model="policyForm.namespace" placeholder="例如: default" />
          </a-form-item>
          <a-form-item label="允许的端口">
            <a-input v-model="policyForm.allowedPorts" placeholder="例如: 80,443,8080" />
          </a-form-item>
          <a-form-item label="允许的协议">
            <a-select v-model="policyForm.allowedProtocols" placeholder="选择协议" multiple>
              <a-option value="tcp">TCP</a-option>
              <a-option value="udp">UDP</a-option>
              <a-option value="icmp">ICMP</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="允许的源地址">
            <a-textarea v-model="policyForm.allowedSources" placeholder="例如: 10.0.0.0/8, 172.16.0.0/12" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="meshForm" layout="vertical">
          <a-form-item label="服务网格类型">
            <a-select v-model="meshForm.type" placeholder="选择服务网格">
              <a-option value="istio">Istio</a-option>
              <a-option value="linkerd">Linkerd</a-option>
              <a-option value="consul">Consul</a-option>
              <a-option value="none">不使用服务网格</a-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="meshForm.type === 'istio'" label="Istio版本">
            <a-select v-model="meshForm.istioVersion" placeholder="选择Istio版本">
              <a-option value="1.18">Istio 1.18</a-option>
              <a-option value="1.19">Istio 1.19</a-option>
              <a-option value="1.20">Istio 1.20</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="启用自动注入">
            <a-switch v-model="meshForm.autoInjection" />
            <span style="margin-left: 8px;">启用Sidecar自动注入</span>
          </a-form-item>
          <a-form-item label="启用mTLS">
            <a-switch v-model="meshForm.mtls" />
            <span style="margin-left: 8px;">启用双向TLS认证</span>
          </a-form-item>
          <a-form-item label="流量管理">
            <a-switch v-model="meshForm.trafficManagement" />
            <span style="margin-left: 8px;">启用流量管理功能</span>
          </a-form-item>
          <a-form-item label="可观测性">
            <a-switch v-model="meshForm.observability" />
            <span style="margin-left: 8px;">启用可观测性功能</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="deployNetworkPlugin">部署网络插件</a-button>
          <a-button @click="testPodCommunication">测试Pod通信</a-button>
          <a-button @click="testServiceDiscovery">测试服务发现</a-button>
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
const pluginForm = reactive({ type: 'calico', mode: 'overlay', podCIDR: '10.244.0.0/16', serviceCIDR: '10.96.0.0/12', mtu: 1450, enableIPAM: true })
const policyForm = reactive({ name: 'default-deny', type: 'both', namespace: 'default', allowedPorts: '80,443,8080', allowedProtocols: ['tcp'], allowedSources: '10.0.0.0/8, 172.16.0.0/12' })
const meshForm = reactive({ type: 'istio', istioVersion: '1.20', autoInjection: true, mtls: true, trafficManagement: true, observability: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('Kubernetes网络配置已应用') }
const deployNetworkPlugin = () => { testResults.value = '网络插件部署结果:\n插件类型: Calico\n网络模式: Overlay\nPod网段: 10.244.0.0/16\nService网段: 10.96.0.0/12\nMTU: 1450\n状态: 部署成功\n\n组件状态:\n- Calico Node: Running\n- Calico Controller: Running\n- IPAM: Active' }
const testPodCommunication = () => { testResults.value = 'Pod通信测试:\n测试Pod: nginx-1 -> nginx-2\n网络延迟: 0.5ms\n带宽: 1Gbps\n连通性: 正常\n\n跨节点通信:\n节点1 -> 节点2: 正常\n节点2 -> 节点3: 正常\n节点3 -> 节点1: 正常' }
const testServiceDiscovery = () => { testResults.value = '服务发现测试:\n服务名称: nginx-service\n服务类型: ClusterIP\n端点数量: 3个\n负载均衡: 正常\nDNS解析: 正常\n\n服务访问:\n- 集群内访问: 正常\n- 跨命名空间访问: 正常\n- 服务到服务通信: 正常' }
const showNetworkStatus = () => { testResults.value = '网络状态信息:\n集群节点: 3个\nPod数量: 25个\n服务数量: 8个\n网络策略: 5个\n\n插件状态:\n- Calico: Healthy\n- CoreDNS: Running\n- kube-proxy: Running\n\n网络性能:\n- 平均延迟: 0.8ms\n- 平均带宽: 950Mbps\n- 丢包率: 0.01%' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 