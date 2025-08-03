<template>
  <a-card title="AI网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="AI网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>AI网络配置专门为人工智能和机器学习工作负载优化，通过RDMA网络、高带宽连接和智能负载均衡来支持大规模AI训练和推理任务。AI网络需要处理大量数据传输、GPU间通信和模型服务部署。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>RDMA网络</strong>：远程直接内存访问，绕过操作系统内核，实现低延迟数据传输</li>
          <li><strong>AI集群</strong>：专门用于AI训练和推理的GPU/CPU节点集合</li>
          <li><strong>数据管道</strong>：用于AI模型训练和推理的数据流处理系统</li>
          <li><strong>模型服务</strong>：部署和运行AI模型的推理服务</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 配置RDMA网络</h4>
          <pre class="command"># 启用RDMA功能
modprobe rdma_ucm
modprobe ib_uverbs

# 配置RoCE网络
ip link set dev eth0 type ethernet speed 100000 duplex full
ethtool -G eth0 rx 4096 tx 4096

# 配置RDMA子网管理器
systemctl start opensm
systemctl enable opensm</pre>

          <h4>2. 创建AI集群网络</h4>
          <pre class="command"># 创建AI专用网桥
ovs-vsctl add-br ai-bridge
ovs-vsctl set bridge ai-bridge protocols=OpenFlow13

# 配置GPU节点网络
ovs-vsctl add-port ai-bridge gpu-node1 -- set interface gpu-node1 type=internal
ip addr add 10.0.1.1/24 dev gpu-node1

# 配置CPU节点网络
ovs-vsctl add-port ai-bridge cpu-node1 -- set interface cpu-node1 type=internal
ip addr add 10.0.2.1/24 dev cpu-node1</pre>

          <h4>3. 配置数据管道</h4>
          <pre class="command"># 配置数据存储网络
ovs-vsctl add-port ai-bridge data-storage -- set interface data-storage type=internal
ip addr add 10.0.3.1/24 dev data-storage

# 配置数据传输QoS
ovs-vsctl set port data-storage qos=@qos1
ovs-vsctl -- --id=@qos1 create qos type=linux-htb queues=0=@q0
ovs-vsctl -- --id=@q0 create queue other-config:max-rate=10000000000</pre>

          <h4>4. 部署模型服务</h4>
          <pre class="command"># 创建模型服务网络
ovs-vsctl add-port ai-bridge model-service -- set interface model-service type=internal
ip addr add 10.0.4.1/24 dev model-service

# 配置负载均衡
ovs-vsctl add-port ai-bridge lb-vip -- set interface lb-vip type=internal
ip addr add 10.0.5.1/24 dev lb-vip

# 配置服务发现
ovs-vsctl set controller ai-bridge connection-mode=out-of-band</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>配置AI集群</strong>：设置GPU/CPU节点网络拓扑和RDMA连接</li>
          <li><strong>建立数据管道</strong>：配置高带宽数据传输和缓存策略</li>
          <li><strong>部署模型服务</strong>：设置推理服务和负载均衡</li>
          <li><strong>性能优化</strong>：调优网络参数和资源分配</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>RDMA网络需要特定的硬件支持和驱动</li>
          <li>AI集群网络需要高带宽和低延迟</li>
          <li>数据管道要考虑数据压缩和缓存策略</li>
          <li>模型服务需要负载均衡和自动扩缩容</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>深度学习训练</strong>：支持大规模分布式训练</li>
          <li><strong>模型推理服务</strong>：提供高并发推理能力</li>
          <li><strong>数据预处理</strong>：高效处理大规模数据集</li>
          <li><strong>模型版本管理</strong>：支持模型部署和回滚</li>
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
const clusterForm = reactive({ name: 'ai-training-cluster', type: 'training', gpuNodes: 8, cpuNodes: 16, topology: 'mesh', rdma: true, rdmaType: 'roce' })
const pipelineForm = reactive({ name: 'data-pipeline-01', dataSource: ['storage', 'database'], protocol: 'rdma', bandwidth: 10000, compression: true, cacheStrategy: 'lru' })
const serviceForm = reactive({ name: 'model-inference-service', type: 'grpc', loadBalancing: true, lbAlgorithm: 'least-connections', autoScaling: true, scalingPolicy: 'cpu', versionManagement: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('AI网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
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
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 