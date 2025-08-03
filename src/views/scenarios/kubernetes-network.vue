<template>
  <a-card title="Kubernetes网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="Kubernetes网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>Kubernetes网络配置为容器编排平台提供网络虚拟化能力，通过CNI插件实现Pod间通信、服务发现和网络策略。Kubernetes网络需要解决容器网络、服务网络和外部网络之间的连通性问题。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>CNI插件</strong>：容器网络接口，实现Pod网络配置</li>
          <li><strong>网络策略</strong>：控制Pod间通信的安全策略</li>
          <li><strong>服务网格</strong>：提供微服务间的通信、安全和可观测性</li>
          <li><strong>Pod网络</strong>：容器间的网络通信环境</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 部署网络插件</h4>
          <pre class="command"># 部署Calico网络插件
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# 部署Flannel网络插件
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

# 部署Cilium网络插件
helm repo add cilium https://helm.cilium.io/
helm install cilium cilium/cilium --namespace kube-system</pre>

          <h4>2. 配置网络策略</h4>
          <pre class="command"># 创建默认拒绝策略
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: default
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

# 创建允许特定端口的策略
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-http
spec:
  podSelector:
    matchLabels:
      app: nginx
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80</pre>

          <h4>3. 配置服务网格</h4>
          <pre class="command"># 安装Istio
istioctl install --set profile=demo

# 启用自动注入
kubectl label namespace default istio-injection=enabled

# 配置mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT</pre>

          <h4>4. 测试网络连通性</h4>
          <pre class="command"># 测试Pod间通信
kubectl exec -it nginx-1 -- ping nginx-2

# 测试服务发现
kubectl exec -it nginx-1 -- nslookup nginx-service

# 查看网络策略
kubectl get networkpolicies

# 查看服务端点
kubectl get endpoints</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择网络插件</strong>：根据需求选择合适的CNI插件</li>
          <li><strong>配置网络策略</strong>：设置Pod间通信的安全策略</li>
          <li><strong>部署服务网格</strong>：配置微服务通信和治理</li>
          <li><strong>测试验证</strong>：验证网络连通性和策略效果</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>网络插件要与Kubernetes版本兼容</li>
          <li>网络策略要考虑业务需求和安全要求</li>
          <li>服务网格会增加网络复杂度</li>
          <li>Pod网络要考虑性能和可扩展性</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>微服务架构</strong>：支持服务间通信和负载均衡</li>
          <li><strong>多租户环境</strong>：通过网络策略实现租户隔离</li>
          <li><strong>安全合规</strong>：通过服务网格实现零信任安全</li>
          <li><strong>可观测性</strong>：通过服务网格提供详细的网络监控</li>
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
const pluginForm = reactive({ type: 'calico', mode: 'overlay', podCIDR: '10.244.0.0/16', serviceCIDR: '10.96.0.0/12', mtu: 1450, enableIPAM: true })
const policyForm = reactive({ name: 'default-deny', type: 'both', namespace: 'default', allowedPorts: '80,443,8080', allowedProtocols: ['tcp'], allowedSources: '10.0.0.0/8, 172.16.0.0/12' })
const meshForm = reactive({ type: 'istio', istioVersion: '1.20', autoInjection: true, mtls: true, trafficManagement: true, observability: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('Kubernetes网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
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
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 