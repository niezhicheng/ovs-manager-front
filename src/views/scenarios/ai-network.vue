<template>
  <a-card title="AI网络配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置AI集群" description="配置AI训练集群网络" />
      <a-step title="配置数据管道" description="配置数据流管道" />
      <a-step title="配置模型服务" description="配置模型推理服务" />
      <a-step title="测试AI网络" description="测试AI网络性能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="clusterForm" layout="vertical">
          <a-form-item label="AI集群名称">
            <a-input v-model="clusterForm.name" placeholder="例如: ai-training-cluster" />
          </a-form-item>
          <a-form-item label="集群类型">
            <a-select v-model="clusterForm.type" placeholder="选择集群类型">
              <a-option value="training">训练集群</a-option>
              <a-option value="inference">推理集群</a-option>
              <a-option value="hybrid">混合集群</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="GPU节点数量">
            <a-input-number v-model="clusterForm.gpuNodes" :min="1" :max="100" :default-value="8" />
          </a-form-item>
          <a-form-item label="CPU节点数量">
            <a-input-number v-model="clusterForm.cpuNodes" :min="1" :max="100" :default-value="16" />
          </a-form-item>
          <a-form-item label="网络拓扑">
            <a-select v-model="clusterForm.topology" placeholder="选择网络拓扑">
              <a-option value="star">星型拓扑</a-option>
              <a-option value="mesh">网状拓扑</a-option>
              <a-option value="tree">树型拓扑</a-option>
              <a-option value="ring">环形拓扑</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="RDMA网络">
            <a-switch v-model="clusterForm.rdma" />
            <span style="margin-left: 8px;">启用RDMA网络</span>
          </a-form-item>
          <a-form-item v-if="clusterForm.rdma" label="RDMA类型">
            <a-select v-model="clusterForm.rdmaType" placeholder="选择RDMA类型">
              <a-option value="roce">RoCE</a-option>
              <a-option value="iwarp">iWARP</a-option>
              <a-option value="infiniband">InfiniBand</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="pipelineForm" layout="vertical">
          <a-form-item label="数据管道名称">
            <a-input v-model="pipelineForm.name" placeholder="例如: data-pipeline-01" />
          </a-form-item>
          <a-form-item label="数据源类型">
            <a-select v-model="pipelineForm.dataSource" placeholder="选择数据源" multiple>
              <a-option value="storage">存储系统</a-option>
              <a-option value="database">数据库</a-option>
              <a-option value="streaming">流数据</a-option>
              <a-option value="external">外部API</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="数据传输协议">
            <a-select v-model="pipelineForm.protocol" placeholder="选择传输协议">
              <a-option value="tcp">TCP</a-option>
              <a-option value="udp">UDP</a-option>
              <a-option value="rdma">RDMA</a-option>
              <a-option value="nfs">NFS</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="带宽分配">
            <a-input-number v-model="pipelineForm.bandwidth" :min="100" :max="100000" :default-value="10000" />
            <span style="margin-left: 8px;">Mbps</span>
          </a-form-item>
          <a-form-item label="数据压缩">
            <a-switch v-model="pipelineForm.compression" />
            <span style="margin-left: 8px;">启用数据压缩</span>
          </a-form-item>
          <a-form-item label="缓存策略">
            <a-select v-model="pipelineForm.cacheStrategy" placeholder="选择缓存策略">
              <a-option value="lru">LRU缓存</a-option>
              <a-option value="lfu">LFU缓存</a-option>
              <a-option value="fifo">FIFO缓存</a-option>
              <a-option value="none">无缓存</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="serviceForm" layout="vertical">
          <a-form-item label="模型服务名称">
            <a-input v-model="serviceForm.name" placeholder="例如: model-inference-service" />
          </a-form-item>
          <a-form-item label="服务类型">
            <a-select v-model="serviceForm.type" placeholder="选择服务类型">
              <a-option value="rest">REST API</a-option>
              <a-option value="grpc">gRPC</a-option>
              <a-option value="websocket">WebSocket</a-option>
              <a-option value="batch">批处理</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="负载均衡">
            <a-switch v-model="serviceForm.loadBalancing" />
            <span style="margin-left: 8px;">启用负载均衡</span>
          </a-form-item>
          <a-form-item v-if="serviceForm.loadBalancing" label="负载均衡算法">
            <a-select v-model="serviceForm.lbAlgorithm" placeholder="选择负载均衡算法">
              <a-option value="round-robin">轮询</a-option>
              <a-option value="least-connections">最少连接</a-option>
              <a-option value="weighted">加权轮询</a-option>
              <a-option value="ip-hash">IP哈希</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="自动扩缩容">
            <a-switch v-model="serviceForm.autoScaling" />
            <span style="margin-left: 8px;">启用自动扩缩容</span>
          </a-form-item>
          <a-form-item v-if="serviceForm.autoScaling" label="扩缩容策略">
            <a-select v-model="serviceForm.scalingPolicy" placeholder="选择扩缩容策略">
              <a-option value="cpu">基于CPU使用率</a-option>
              <a-option value="memory">基于内存使用率</a-option>
              <a-option value="requests">基于请求数量</a-option>
              <a-option value="custom">自定义指标</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="模型版本管理">
            <a-switch v-model="serviceForm.versionManagement" />
            <span style="margin-left: 8px;">启用模型版本管理</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="deployAICluster">部署AI集群</a-button>
          <a-button @click="testDataPipeline">测试数据管道</a-button>
          <a-button @click="testModelService">测试模型服务</a-button>
          <a-button @click="showAINetworkStatus">显示AI网络状态</a-button>
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
const clusterForm = reactive({ name: 'ai-training-cluster', type: 'training', gpuNodes: 8, cpuNodes: 16, topology: 'mesh', rdma: true, rdmaType: 'roce' })
const pipelineForm = reactive({ name: 'data-pipeline-01', dataSource: ['storage', 'database'], protocol: 'rdma', bandwidth: 10000, compression: true, cacheStrategy: 'lru' })
const serviceForm = reactive({ name: 'model-inference-service', type: 'grpc', loadBalancing: true, lbAlgorithm: 'least-connections', autoScaling: true, scalingPolicy: 'cpu', versionManagement: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('AI网络配置已应用') }
const deployAICluster = () => { testResults.value = 'AI集群部署结果:\n集群名称: ai-training-cluster\n集群类型: 训练集群\nGPU节点: 8个\nCPU节点: 16个\n网络拓扑: 网状拓扑\nRDMA网络: RoCE\n状态: 部署成功\n\n网络配置:\n- 节点间通信: 正常\n- RDMA连接: 已建立\n- 带宽分配: 100Gbps\n- 延迟: 1.2μs' }
const testDataPipeline = () => { testResults.value = '数据管道测试:\n管道名称: data-pipeline-01\n数据源: 存储系统, 数据库\n传输协议: RDMA\n带宽: 10Gbps\n压缩: 已启用\n缓存: LRU策略\n\n性能指标:\n- 数据传输速率: 9.8Gbps\n- 压缩比: 65%\n- 缓存命中率: 85%\n- 延迟: 5μs\n- 吞吐量: 优秀' }
const testModelService = () => { testResults.value = '模型服务测试:\n服务名称: model-inference-service\n服务类型: gRPC\n负载均衡: 已启用\n算法: 最少连接\n自动扩缩容: 已启用\n策略: 基于CPU使用率\n\n性能指标:\n- 请求处理: 5000 QPS\n- 平均响应时间: 15ms\n- 错误率: 0.01%\n- 资源使用率: 75%\n- 服务可用性: 99.99%' }
const showAINetworkStatus = () => { testResults.value = 'AI网络状态:\n集群状态: 正常运行\n运行时间: 168小时\n活跃节点: 24个\n\n资源使用情况:\n- GPU使用率: 85%\n- CPU使用率: 65%\n- 内存使用率: 70%\n- 网络带宽: 80%\n\n训练任务:\n- 运行中任务: 12个\n- 排队任务: 5个\n- 已完成任务: 156个\n\n推理服务:\n- 活跃服务: 8个\n- 总请求数: 2.5M\n- 平均延迟: 12ms' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 