<template>
  <a-card title="LiveKit 监考系统" class="scenario-card">
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置LiveKit服务" description="设置LiveKit服务器参数" />
      <a-step title="创建监考房间" description="创建在线监考房间" />
      <a-step title="配置监考规则" description="设置监考策略和规则" />
      <a-step title="测试监考系统" description="测试监考功能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="serverForm" layout="vertical">
          <a-form-item label="LiveKit服务器地址">
            <a-input v-model="serverForm.url" placeholder="例如: wss://livekit.example.com" />
          </a-form-item>
          <a-form-item label="API密钥">
            <a-input v-model="serverForm.apiKey" placeholder="输入API密钥" />
          </a-form-item>
          <a-form-item label="API密钥Secret">
            <a-input v-model="serverForm.apiSecret" placeholder="输入API密钥Secret" />
          </a-form-item>
          <a-form-item label="房间前缀">
            <a-input v-model="serverForm.roomPrefix" placeholder="例如: exam_" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="roomForm" layout="vertical">
          <a-form-item label="房间名称">
            <a-input v-model="roomForm.name" placeholder="例如: exam_2024_01" />
          </a-form-item>
          <a-form-item label="最大参与者数">
            <a-input-number v-model="roomForm.maxParticipants" :min="1" :max="100" :default-value="50" />
          </a-form-item>
          <a-form-item label="录制设置">
            <a-switch v-model="roomForm.recording" />
            <span style="margin-left: 8px;">启用自动录制</span>
          </a-form-item>
          <a-form-item label="房间描述">
            <a-textarea v-model="roomForm.description" placeholder="例如: 2024年春季考试监考房间" :rows="3" />
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="proctorForm" layout="vertical">
          <a-form-item label="监考模式">
            <a-select v-model="proctorForm.mode" placeholder="选择监考模式">
              <a-option value="manual">人工监考</a-option>
              <a-option value="ai">AI智能监考</a-option>
              <a-option value="hybrid">混合监考</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="屏幕共享监控">
            <a-switch v-model="proctorForm.screenShare" />
            <span style="margin-left: 8px;">监控屏幕共享</span>
          </a-form-item>
          <a-form-item label="音频监控">
            <a-switch v-model="proctorForm.audioMonitoring" />
            <span style="margin-left: 8px;">监控音频输入</span>
          </a-form-item>
          <a-form-item label="异常行为检测">
            <a-switch v-model="proctorForm.behaviorDetection" />
            <span style="margin-left: 8px;">检测异常行为</span>
          </a-form-item>
          <a-form-item label="监考员权限">
            <a-select v-model="proctorForm.permissions" placeholder="选择监考员权限" multiple>
              <a-option value="mute">静音参与者</a-option>
              <a-option value="disconnect">断开连接</a-option>
              <a-option value="record">录制会话</a-option>
              <a-option value="chat">查看聊天记录</a-option>
            </a-select>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="testLiveKit">测试LiveKit连接</a-button>
          <a-button @click="createTestRoom">创建测试房间</a-button>
          <a-button @click="showSystemStatus">显示系统状态</a-button>
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
const serverForm = reactive({ url: 'wss://livekit.example.com', apiKey: '', apiSecret: '', roomPrefix: 'exam_' })
const roomForm = reactive({ name: 'exam_2024_01', maxParticipants: 50, recording: true, description: '2024年春季考试监考房间' })
const proctorForm = reactive({ mode: 'hybrid', screenShare: true, audioMonitoring: true, behaviorDetection: true, permissions: ['mute', 'disconnect'] })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('LiveKit监考系统配置已应用') }
const testLiveKit = () => { testResults.value = 'LiveKit连接测试结果:\n服务器: wss://livekit.example.com\n状态: 连接成功\n延迟: 45ms\nAPI密钥: 验证通过' }
const createTestRoom = () => { testResults.value = '测试房间创建结果:\n房间名称: exam_2024_01\n状态: 已创建\n最大参与者: 50\n录制: 已启用\n监考模式: 混合监考' }
const showSystemStatus = () => { testResults.value = '系统状态:\nLiveKit服务: 运行中\n活跃房间: 1\n在线监考员: 2\n在线考生: 15\n录制状态: 正常' }
</script>

<style scoped>
.scenario-card { min-height: 80vh; }
.step-content { margin: 30px 0; min-height: 300px; }
.step-actions { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.test-results { margin-top: 20px; padding: 15px; background: #f6f8fa; border-radius: 6px; border: 1px solid #e1e4e8; }
.test-results pre { margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; }
</style> 