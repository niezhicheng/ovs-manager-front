<template>
  <a-card title="区块链网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置区块链网络" description="配置区块链网络架构" />
      <a-step title="配置共识机制" description="配置共识算法和节点" />
      <a-step title="配置智能合约" description="配置智能合约环境" />
      <a-step title="测试区块链" description="测试区块链网络功能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="networkForm" layout="vertical">
          <a-form-item label="区块链网络名称">
            <a-input v-model="networkForm.name" placeholder="例如: enterprise-blockchain" />
          </a-form-item>
          <a-form-item label="区块链类型">
            <a-select v-model="networkForm.type" placeholder="选择区块链类型">
              <a-option value="ethereum">以太坊</a-option>
              <a-option value="hyperledger">Hyperledger Fabric</a-option>
              <a-option value="bitcoin">比特币</a-option>
              <a-option value="custom">自定义区块链</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网络模式">
            <a-select v-model="networkForm.mode" placeholder="选择网络模式">
              <a-option value="public">公有链</a-option>
              <a-option value="private">私有链</a-option>
              <a-option value="consortium">联盟链</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="节点数量">
            <a-input-number v-model="networkForm.nodeCount" :min="1" :max="1000" :default-value="10" />
          </a-form-item>
          <a-form-item label="网络拓扑">
            <a-select v-model="networkForm.topology" placeholder="选择网络拓扑">
              <a-option value="mesh">网状拓扑</a-option>
              <a-option value="star">星型拓扑</a-option>
              <a-option value="tree">树型拓扑</a-option>
              <a-option value="ring">环形拓扑</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="P2P网络">
            <a-switch v-model="networkForm.p2p" />
            <span style="margin-left: 8px;">启用P2P网络</span>
          </a-form-item>
          <a-form-item label="网络端口">
            <a-input-number v-model="networkForm.port" :min="1024" :max="65535" :default-value="8545" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="consensusForm" layout="vertical">
          <a-form-item label="共识算法">
            <a-select v-model="consensusForm.algorithm" placeholder="选择共识算法">
              <a-option value="pow">PoW (工作量证明)</a-option>
              <a-option value="pos">PoS (权益证明)</a-option>
              <a-option value="dpos">DPoS (委托权益证明)</a-option>
              <a-option value="pbft">PBFT (实用拜占庭容错)</a-option>
              <a-option value="raft">Raft</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="区块生成时间">
            <a-input-number v-model="consensusForm.blockTime" :min="1" :max="3600" :default-value="15" />
            <span style="margin-left: 8px;">秒</span>
          </a-form-item>
          <a-form-item label="区块大小">
            <a-input-number v-model="consensusForm.blockSize" :min="1" :max="100" :default-value="2" />
            <span style="margin-left: 8px;">MB</span>
          </a-form-item>
          <a-form-item label="验证节点数量">
            <a-input-number v-model="consensusForm.validatorCount" :min="1" :max="100" :default-value="5" />
          </a-form-item>
          <a-form-item label="容错能力">
            <a-input-number v-model="consensusForm.faultTolerance" :min="1" :max="50" :default-value="33" />
            <span style="margin-left: 8px;">%</span>
          </a-form-item>
          <a-form-item label="奖励机制">
            <a-switch v-model="consensusForm.reward" />
            <span style="margin-left: 8px;">启用奖励机制</span>
          </a-form-item>
          <a-form-item v-if="consensusForm.reward" label="奖励类型">
            <a-select v-model="consensusForm.rewardType" placeholder="选择奖励类型">
              <a-option value="block">区块奖励</a-option>
              <a-option value="transaction">交易手续费</a-option>
              <a-option value="both">区块奖励+手续费</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="contractForm" layout="vertical">
          <a-form-item label="智能合约平台">
            <a-select v-model="contractForm.platform" placeholder="选择智能合约平台">
              <a-option value="solidity">Solidity (以太坊)</a-option>
              <a-option value="chaincode">Chaincode (Hyperledger)</a-option>
              <a-option value="wasm">WebAssembly</a-option>
              <a-option value="custom">自定义</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="合约执行环境">
            <a-select v-model="contractForm.environment" placeholder="选择执行环境">
              <a-option value="evm">EVM (以太坊虚拟机)</a-option>
              <a-option value="docker">Docker容器</a-option>
              <a-option value="native">原生执行</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="Gas限制">
            <a-input-number v-model="contractForm.gasLimit" :min="1000" :max="10000000" :default-value="3000000" />
          </a-form-item>
          <a-form-item label="Gas价格">
            <a-input-number v-model="contractForm.gasPrice" :min="1" :max="1000" :default-value="20" />
            <span style="margin-left: 8px;">Gwei</span>
          </a-form-item>
          <a-form-item label="合约升级">
            <a-switch v-model="contractForm.upgradeable" />
            <span style="margin-left: 8px;">支持合约升级</span>
          </a-form-item>
          <a-form-item label="权限管理">
            <a-switch v-model="contractForm.permission" />
            <span style="margin-left: 8px;">启用权限管理</span>
          </a-form-item>
          <a-form-item label="事件日志">
            <a-switch v-model="contractForm.eventLog" />
            <span style="margin-left: 8px;">启用事件日志</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="deployBlockchain">部署区块链网络</a-button>
          <a-button @click="testConsensus">测试共识机制</a-button>
          <a-button @click="testSmartContract">测试智能合约</a-button>
          <a-button @click="showBlockchainStatus">显示区块链状态</a-button>
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
      title="区块链网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>区块链网络通过OVS实现节点间的P2P通信和共识机制的网络优化。OVS为区块链节点创建虚拟网络环境，支持多种共识算法，并提供智能合约的执行环境。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>P2P网络</strong>：节点间直接通信，无需中心化服务器</li>
          <li><strong>共识机制</strong>：确保网络中各节点数据一致性的算法</li>
          <li><strong>智能合约</strong>：在区块链上自动执行的程序代码</li>
          <li><strong>Gas机制</strong>：以太坊中执行智能合约的燃料费用</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建区块链网络</h4>
          <pre class="command"># 创建区块链专用网桥
ovs-vsctl add-br blockchain-br

# 为节点创建虚拟接口
ovs-vsctl add-port blockchain-br node1 -- set interface node1 type=internal
ovs-vsctl add-port blockchain-br node2 -- set interface node2 type=internal
ovs-vsctl add-port blockchain-br node3 -- set interface node3 type=internal

# 配置节点IP地址
ip addr add 10.0.1.1/24 dev node1
ip addr add 10.0.1.2/24 dev node2
ip addr add 10.0.1.3/24 dev node3</pre>

          <h4>2. 配置P2P通信</h4>
          <pre class="command"># 配置流表规则实现P2P通信
ovs-ofctl add-flow blockchain-br "table=0, priority=100, ip, nw_src=10.0.1.1, actions=output:2,output:3"
ovs-ofctl add-flow blockchain-br "table=0, priority=100, ip, nw_src=10.0.1.2, actions=output:1,output:3"
ovs-ofctl add-flow blockchain-br "table=0, priority=100, ip, nw_src=10.0.1.3, actions=output:1,output:2"

# 查看流表规则
ovs-ofctl dump-flows blockchain-br</pre>

          <h4>3. 配置共识机制网络</h4>
          <pre class="command"># 为PBFT共识配置低延迟网络
ovs-ofctl add-flow blockchain-br "table=0, priority=200, tcp, tp_dst=8545, actions=set_queue:1,normal"

# 配置QoS确保共识消息优先级
ovs-vsctl set port blockchain-br qos=@newqos
ovs-vsctl -- --id=@newqos create qos type=linux-htb other-config:max-rate=1000000000 queues=1=@q1
ovs-vsctl -- --id=@q1 create queue other-config:min-rate=100000000</pre>

          <h4>4. 智能合约网络隔离</h4>
          <pre class="command"># 为不同合约创建隔离网络
ovs-vsctl add-br contract-br1
ovs-vsctl add-br contract-br2

# 配置合约间通信规则
ovs-vsctl add-port contract-br1 patch1 -- set interface patch1 type=patch options:peer=patch2
ovs-vsctl add-port contract-br2 patch2 -- set interface patch2 type=patch options:peer=patch1</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>网络架构设计</strong>：根据区块链类型设计网络拓扑</li>
          <li><strong>节点网络配置</strong>：为每个区块链节点配置虚拟网络接口</li>
          <li><strong>共识网络优化</strong>：配置低延迟网络支持共识机制</li>
          <li><strong>智能合约环境</strong>：为合约执行创建隔离网络环境</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>P2P网络需要确保节点间双向通信</li>
          <li>共识机制对网络延迟敏感，需要QoS保证</li>
          <li>智能合约执行需要网络隔离和安全控制</li>
          <li>区块链网络扩展时需要考虑网络性能瓶颈</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>企业联盟链</strong>：多个企业节点通过OVS虚拟网络连接</li>
          <li><strong>智能合约部署</strong>：通过OVS网络隔离不同的合约执行环境</li>
          <li><strong>共识优化</strong>：使用OVS的QoS功能确保共识消息的及时传递</li>
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
const networkForm = reactive({ name: 'enterprise-blockchain', type: 'hyperledger', mode: 'consortium', nodeCount: 10, topology: 'mesh', p2p: true, port: 8545 })
const consensusForm = reactive({ algorithm: 'pbft', blockTime: 15, blockSize: 2, validatorCount: 5, faultTolerance: 33, reward: true, rewardType: 'both' })
const contractForm = reactive({ platform: 'chaincode', environment: 'docker', gasLimit: 3000000, gasPrice: 20, upgradeable: true, permission: true, eventLog: true })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('区块链网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
const deployBlockchain = () => { testResults.value = '区块链网络部署结果:\n网络名称: enterprise-blockchain\n区块链类型: Hyperledger Fabric\n网络模式: 联盟链\n节点数量: 10个\n网络拓扑: 网状拓扑\nP2P网络: 已启用\n状态: 部署成功\n\n网络配置:\n- 节点间通信: 正常\n- 共识机制: PBFT\n- 区块生成时间: 15秒\n- 网络延迟: 50ms' }
const testConsensus = () => { testResults.value = '共识机制测试:\n共识算法: PBFT\n验证节点: 5个\n容错能力: 33%\n区块生成时间: 15秒\n\n性能指标:\n- 共识达成时间: 2.5秒\n- 交易吞吐量: 1000 TPS\n- 区块确认率: 99.9%\n- 网络同步: 正常\n- 容错测试: 通过' }
const testSmartContract = () => { testResults.value = '智能合约测试:\n合约平台: Chaincode\n执行环境: Docker容器\nGas限制: 3,000,000\nGas价格: 20 Gwei\n\n性能指标:\n- 合约部署: 成功\n- 合约调用: 正常\n- 执行时间: 150ms\n- Gas消耗: 2,100,000\n- 事件日志: 正常\n- 权限验证: 通过' }
const showBlockchainStatus = () => { testResults.value = '区块链网络状态:\n网络状态: 正常运行\n运行时间: 720小时\n活跃节点: 10个\n\n区块信息:\n- 当前区块高度: 28,800\n- 区块大小: 2MB\n- 交易数量: 15,000\n- 平均确认时间: 15秒\n\n网络性能:\n- 交易吞吐量: 1000 TPS\n- 网络延迟: 50ms\n- 节点同步: 正常\n- 共识状态: 稳定\n\n智能合约:\n- 部署合约: 25个\n- 活跃合约: 20个\n- 合约调用: 50,000次' }
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