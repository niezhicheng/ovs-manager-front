<template>
  <a-card title="端口镜像配置" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="选择网桥" description="选择要配置镜像的网桥" />
      <a-step title="配置镜像规则" description="设置镜像源和目标" />
      <a-step title="配置过滤条件" description="设置镜像过滤规则" />
      <a-step title="测试镜像" description="测试镜像功能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="bridgeForm" layout="vertical">
          <a-form-item label="网桥名称">
            <a-select v-model="bridgeForm.name" placeholder="选择网桥">
              <a-option value="br0">br0</a-option>
              <a-option value="br1">br1</a-option>
              <a-option value="br2">br2</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="镜像名称">
            <a-input v-model="bridgeForm.mirrorName" placeholder="例如: mirror1" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="mirrorForm" layout="vertical">
          <a-form-item label="镜像类型">
            <a-select v-model="mirrorForm.type" placeholder="选择镜像类型">
              <a-option value="ingress">入站镜像 (Ingress)</a-option>
              <a-option value="egress">出站镜像 (Egress)</a-option>
              <a-option value="both">双向镜像 (Both)</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="源端口">
            <a-select v-model="mirrorForm.srcPorts" placeholder="选择源端口" multiple>
              <a-option value="eth0">eth0</a-option>
              <a-option value="eth1">eth1</a-option>
              <a-option value="eth2">eth2</a-option>
              <a-option value="eth3">eth3</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="目标端口">
            <a-input v-model="mirrorForm.dstPort" placeholder="例如: eth4" />
          </a-form-item>
          <a-form-item label="镜像所有端口">
            <a-switch v-model="mirrorForm.selectAll" />
            <span style="margin-left: 8px;">镜像网桥上的所有端口</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="filterForm" layout="vertical">
          <a-form-item label="VLAN过滤">
            <a-input-number v-model="filterForm.vlan" :min="1" :max="4094" placeholder="指定VLAN ID，留空表示不过滤" />
          </a-form-item>
          <a-form-item label="源MAC地址">
            <a-input v-model="filterForm.srcMac" placeholder="例如: 00:11:22:33:44:55" />
          </a-form-item>
          <a-form-item label="目标MAC地址">
            <a-input v-model="filterForm.dstMac" placeholder="例如: 00:aa:bb:cc:dd:ee" />
          </a-form-item>
          <a-form-item label="协议过滤">
            <a-select v-model="filterForm.protocol" placeholder="选择协议" allow-clear>
              <a-option value="tcp">TCP</a-option>
              <a-option value="udp">UDP</a-option>
              <a-option value="icmp">ICMP</a-option>
              <a-option value="arp">ARP</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="端口过滤">
            <a-input v-model="filterForm.port" placeholder="例如: 80,443,8080" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="createMirror">创建镜像</a-button>
          <a-button @click="testMirror">测试镜像功能</a-button>
          <a-button @click="showMirrorStatus">显示镜像状态</a-button>
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
const bridgeForm = reactive({ name: '', mirrorName: 'mirror1' })
const mirrorForm = reactive({ type: 'both', srcPorts: [], dstPort: 'eth4', selectAll: false })
const filterForm = reactive({ vlan: null, srcMac: '', dstMac: '', protocol: '', port: '' })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('端口镜像配置已应用') }
const createMirror = () => { testResults.value = '镜像创建结果:\n镜像名称: mirror1\n网桥: br0\n类型: 双向镜像\n源端口: eth0, eth1\n目标端口: eth4\n状态: 已创建' }
const testMirror = () => { testResults.value = '镜像功能测试:\n测试包数量: 1000\n镜像包数量: 1000\n镜像率: 100%\n延迟: 0.1ms\n状态: 正常' }
const showMirrorStatus = () => { testResults.value = '镜像状态信息:\n镜像名称: mirror1\n状态: active\n类型: both\n源端口: 2个\n目标端口: eth4\n统计信息: 正常收集' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 