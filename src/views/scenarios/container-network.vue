<template>
  <a-card title="容器网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="容器网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>容器网络配置为容器化应用提供网络虚拟化能力，通过不同的网络模式实现容器间通信和外部网络访问。支持桥接、主机、覆盖网络等多种模式。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>桥接模式</strong>：容器通过虚拟网桥与外部网络通信</li>
          <li><strong>主机模式</strong>：容器直接使用主机网络栈</li>
          <li><strong>覆盖网络</strong>：跨主机的容器网络通信</li>
          <li><strong>网络命名空间</strong>：容器网络隔离机制</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建容器网络</h4>
          <pre class="command"># 创建桥接网络
docker network create --driver bridge my-bridge

# 创建覆盖网络
docker network create --driver overlay my-overlay

# 创建自定义网络
docker network create --driver bridge --subnet=172.18.0.0/16 my-custom</pre>

          <h4>2. 配置容器网络</h4>
          <pre class="command"># 运行容器并指定网络
docker run --network my-bridge nginx

# 连接容器到网络
docker network connect my-bridge container1

# 断开容器网络
docker network disconnect my-bridge container1</pre>

          <h4>3. 配置网络策略</h4>
          <pre class="command"># 设置容器IP地址
docker run --network my-custom --ip 172.18.0.10 nginx

# 设置端口映射
docker run -p 8080:80 nginx

# 设置网络别名
docker run --network my-bridge --network-alias web nginx</pre>

          <h4>4. 监控容器网络</h4>
          <pre class="command"># 查看网络列表
docker network ls

# 查看网络详情
docker network inspect my-bridge

# 查看容器网络配置
docker inspect container1</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>选择网络模式</strong>：根据需求选择合适的网络模式</li>
          <li><strong>配置网络参数</strong>：设置IP地址、子网等参数</li>
          <li><strong>配置网络策略</strong>：设置访问控制和端口映射</li>
          <li><strong>测试验证</strong>：验证容器网络连通性</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>网络模式要符合应用需求</li>
          <li>IP地址要避免冲突</li>
          <li>端口映射要合理配置</li>
          <li>要监控网络性能</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>微服务架构</strong>：支持服务间通信</li>
          <li><strong>开发环境</strong>：提供隔离的开发环境</li>
          <li><strong>生产部署</strong>：支持高可用部署</li>
          <li><strong>CI/CD流水线</strong>：支持自动化部署</li>
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
const networkForm = reactive({ mode: 'bridge', platform: 'docker', name: 'container-net' })
const configForm = reactive({ subnet: '172.18.0.0/16', gateway: '172.18.0.1', dns: '8.8.8.8,8.8.4.4', mtu: 1500, ipv6: false })
const serviceForm = reactive({ discovery: 'dns', loadBalancer: 'round-robin', healthCheck: true, checkInterval: 30 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('容器网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
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
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 