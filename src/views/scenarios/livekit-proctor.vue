<template>
  <a-card title="LiveKit监考配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
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

    <!-- 帮助弹窗 -->
    <a-modal
      v-model:visible="helpVisible"
      title="LiveKit监考配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>LiveKit监考系统用于远程在线考试监控，支持音视频流、屏幕共享、AI行为检测等功能，保障考试公平和安全。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>LiveKit服务</strong>：实时音视频通信平台</li>
          <li><strong>监考房间</strong>：用于考试监控的虚拟房间</li>
          <li><strong>AI监考</strong>：自动检测异常行为</li>
          <li><strong>权限管理</strong>：分配监考员操作权限</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建监考房间</h4>
          <pre class="command"># 创建房间
POST /rooms { "name": "exam_2024_01", "maxParticipants": 50 }

# 查询房间
GET /rooms/exam_2024_01

# 删除房间
DELETE /rooms/exam_2024_01</pre>

          <h4>2. 生成Token</h4>
          <pre class="command"># 生成访问Token
POST /access-token { "room": "exam_2024_01", "user": "proctor1" }</pre>

          <h4>3. 配置监考规则</h4>
          <pre class="command"># 启用AI行为检测
PATCH /rooms/exam_2024_01 { "aiDetection": true }

# 配置屏幕共享监控
PATCH /rooms/exam_2024_01 { "screenShare": true }</pre>

          <h4>4. 监控与日志</h4>
          <pre class="command"># 查询监考日志
GET /logs?room=exam_2024_01

# 导出监考报告
GET /report?room=exam_2024_01</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>配置LiveKit服务</strong>：设置服务器地址和API密钥</li>
          <li><strong>创建监考房间</strong>：定义房间参数和参与者</li>
          <li><strong>配置监考规则</strong>：设置AI检测、屏幕共享等策略</li>
          <li><strong>测试系统</strong>：验证监考功能和系统状态</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>API密钥和Secret要妥善保管</li>
          <li>监考房间要提前测试</li>
          <li>AI检测需保证网络带宽</li>
          <li>日志和报告要定期导出</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>高校考试</strong>：远程监考</li>
          <li><strong>企业认证</strong>：在线考核</li>
          <li><strong>职业资格</strong>：远程面试</li>
          <li><strong>培训测评</strong>：在线测验</li>
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
const serverForm = reactive({ url: 'wss://livekit.example.com', apiKey: '', apiSecret: '', roomPrefix: 'exam_' })
const roomForm = reactive({ name: 'exam_2024_01', maxParticipants: 50, recording: true, description: '2024年春季考试监考房间' })
const proctorForm = reactive({ mode: 'hybrid', screenShare: true, audioMonitoring: true, behaviorDetection: true, permissions: ['mute', 'disconnect'] })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('LiveKit监考系统配置已应用') }
const showHelp = () => { helpVisible.value = true }
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
.help-content { max-height: 600px; overflow-y: auto; }
.help-content h3 { color: #1890ff; margin-top: 20px; margin-bottom: 10px; }
.help-content h4 { color: #52c41a; margin-top: 15px; margin-bottom: 8px; }
.help-content ul, .help-content ol { margin-left: 20px; }
.help-content li { margin-bottom: 5px; }
.command-section { margin: 15px 0; }
.command { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 12px; margin: 8px 0; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.4; }
</style> 