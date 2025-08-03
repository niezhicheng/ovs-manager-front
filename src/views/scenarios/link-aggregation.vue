<template>
  <a-card title="链路聚合配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择聚合模式" description="选择链路聚合模式" />
      <a-step title="配置物理链路" description="配置物理链路参数" />
      <a-step title="配置LACP协议" description="设置LACP协议参数" />
      <a-step title="测试聚合链路" description="测试链路聚合效果" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="modeForm" layout="vertical">
          <a-form-item label="聚合模式">
            <a-select v-model="modeForm.type" placeholder="选择聚合模式">
              <a-option value="static">静态聚合 (Static)</a-option>
              <a-option value="lacp">动态聚合 (LACP)</a-option>
              <a-option value="balance">负载均衡聚合</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="聚合组名称">
            <a-input v-model="modeForm.name" placeholder="例如: lag0" />
          </a-form-item>
          <a-form-item label="聚合组描述">
            <a-input v-model="modeForm.description" placeholder="例如: 核心交换机上行链路聚合" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="linkForm" layout="vertical">
          <a-form-item label="物理接口">
            <a-select v-model="linkForm.interfaces" placeholder="选择物理接口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="接口速率">
            <a-select v-model="linkForm.speed" placeholder="选择接口速率">
              <a-option value="100">100Mbps</a-option>
              <a-option value="1000">1Gbps</a-option>
              <a-option value="10000">10Gbps</a-option>
              <a-option value="40000">40Gbps</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="双工模式">
            <a-select v-model="linkForm.duplex" placeholder="选择双工模式">
              <a-option value="full">全双工</a-option>
              <a-option value="half">半双工</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="MTU大小">
            <a-input-number v-model="linkForm.mtu" :min="68" :max="9000" :default-value="1500" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="lacpForm" layout="vertical">
          <a-form-item label="LACP模式">
            <a-select v-model="lacpForm.mode" placeholder="选择LACP模式">
              <a-option value="active">主动模式 (Active)</a-option>
              <a-option value="passive">被动模式 (Passive)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="LACP超时">
            <a-select v-model="lacpForm.timeout" placeholder="选择LACP超时">
              <a-option value="short">短超时 (1秒)</a-option>
              <a-option value="long">长超时 (30秒)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="系统优先级">
            <a-input-number v-model="lacpForm.systemPriority" :min="1" :max="65535" :default-value="32768" />
          </a-form-item>
          <a-form-item label="端口优先级">
            <a-input-number v-model="lacpForm.portPriority" :min="1" :max="65535" :default-value="32768" />
          </a-form-item>
          <a-form-item label="负载均衡算法">
            <a-select v-model="lacpForm.loadBalance" placeholder="选择负载均衡算法">
              <a-option value="src-mac">源MAC地址</a-option>
              <a-option value="dst-mac">目标MAC地址</a-option>
              <a-option value="src-dst-mac">源目标MAC地址</a-option>
              <a-option value="src-ip">源IP地址</a-option>
              <a-option value="dst-ip">目标IP地址</a-option>
              <a-option value="src-dst-ip">源目标IP地址</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createAggregation">创建链路聚合</a-button>
          <a-button @click="testAggregation">测试链路聚合</a-button>
          <a-button @click="showAggregationStatus">显示聚合状态</a-button>
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
const modeForm = reactive({ type: 'lacp', name: 'lag0', description: '核心交换机上行链路聚合' })
const linkForm = reactive({ interfaces: [], speed: 1000, duplex: 'full', mtu: 1500 })
const lacpForm = reactive({ mode: 'active', timeout: 'short', systemPriority: 32768, portPriority: 32768, loadBalance: 'src-dst-ip' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('链路聚合配置已应用') }
const createAggregation = () => { testResults.value = '链路聚合创建结果:\n聚合组: lag0\n模式: LACP动态聚合\n物理接口: eth0, eth1, eth2\n速率: 1Gbps\nLACP模式: 主动模式\n状态: 已创建' }
const testAggregation = () => { testResults.value = '链路聚合测试:\n聚合链路: 正常\n负载均衡: 工作正常\n故障切换: 测试通过\n带宽利用率: 85%\n延迟: 0.5ms\n状态: 正常' }
const showAggregationStatus = () => { testResults.value = '聚合状态信息:\n聚合组: lag0\n状态: active\n成员接口: 3个\n活跃接口: 3个\n总带宽: 3Gbps\nLACP状态: 协商成功' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 