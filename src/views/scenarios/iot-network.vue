<template>
  <a-card title="物联网网络配置" class="scenario-card">
    <template #extra>
      <a-button type="primary" @click="showHelp">
        <template #icon>
          <icon-question-circle />
        </template>
        帮助
      </a-button>
    </template>
    <a-steps :current="currentStep" style="margin-bottom: 24px">
      <a-step title="配置IoT网关" description="配置物联网网关" />
      <a-step title="配置设备网络" description="配置设备连接网络" />
      <a-step title="配置数据处理" description="配置数据采集和处理" />
      <a-step title="测试IoT网络" description="测试物联网网络功能" />
    </a-steps>
    <div class="step-content">
      <div v-if="currentStep === 0">
        <a-form :model="gatewayForm" layout="vertical">
          <a-form-item label="IoT网关名称">
            <a-input v-model="gatewayForm.name" placeholder="例如: iot-gateway-01" />
          </a-form-item>
          <a-form-item label="网关类型">
            <a-select v-model="gatewayForm.type" placeholder="选择网关类型">
              <a-option value="edge">边缘网关</a-option>
              <a-option value="cloud">云端网关</a-option>
              <a-option value="hybrid">混合网关</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="通信协议">
            <a-select v-model="gatewayForm.protocols" placeholder="选择通信协议" multiple>
              <a-option value="mqtt">MQTT</a-option>
              <a-option value="coap">CoAP</a-option>
              <a-option value="http">HTTP/HTTPS</a-option>
              <a-option value="websocket">WebSocket</a-option>
              <a-option value="lora">LoRaWAN</a-option>
              <a-option value="zigbee">Zigbee</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="网关位置">
            <a-input v-model="gatewayForm.location" placeholder="例如: 北京市朝阳区" />
          </a-form-item>
          <a-form-item label="处理能力">
            <a-input-number v-model="gatewayForm.processingPower" :min="1" :max="100" :default-value="10" />
            <span style="margin-left: 8px;">万次/秒</span>
          </a-form-item>
          <a-form-item label="存储容量">
            <a-input-number v-model="gatewayForm.storage" :min="1" :max="10000" :default-value="100" />
            <span style="margin-left: 8px;">GB</span>
          </a-form-item>
          <a-form-item label="电池供电">
            <a-switch v-model="gatewayForm.batteryPowered" />
            <span style="margin-left: 8px;">支持电池供电</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 1">
        <a-form :model="deviceForm" layout="vertical">
          <a-form-item label="设备类型">
            <a-select v-model="deviceForm.type" placeholder="选择设备类型" multiple>
              <a-option value="sensor">传感器</a-option>
              <a-option value="actuator">执行器</a-option>
              <a-option value="camera">摄像头</a-option>
              <a-option value="controller">控制器</a-option>
              <a-option value="meter">计量表</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="设备数量">
            <a-input-number v-model="deviceForm.count" :min="1" :max="10000" :default-value="100" />
          </a-form-item>
          <a-form-item label="连接方式">
            <a-select v-model="deviceForm.connection" placeholder="选择连接方式">
              <a-option value="wifi">WiFi</a-option>
              <a-option value="ethernet">以太网</a-option>
              <a-option value="cellular">蜂窝网络</a-option>
              <a-option value="bluetooth">蓝牙</a-option>
              <a-option value="zigbee">Zigbee</a-option>
              <a-option value="lora">LoRa</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="数据采集频率">
            <a-input-number v-model="deviceForm.samplingRate" :min="1" :max="3600" :default-value="60" />
            <span style="margin-left: 8px;">秒</span>
          </a-form-item>
          <a-form-item label="设备认证">
            <a-switch v-model="deviceForm.authentication" />
            <span style="margin-left: 8px;">启用设备认证</span>
          </a-form-item>
          <a-form-item v-if="deviceForm.authentication" label="认证方式">
            <a-select v-model="deviceForm.authMethod" placeholder="选择认证方式">
              <a-option value="certificate">数字证书</a-option>
              <a-option value="token">访问令牌</a-option>
              <a-option value="password">用户名密码</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="设备管理">
            <a-switch v-model="deviceForm.management" />
            <span style="margin-left: 8px;">启用设备管理</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 2">
        <a-form :model="dataForm" layout="vertical">
          <a-form-item label="数据处理模式">
            <a-select v-model="dataForm.mode" placeholder="选择数据处理模式">
              <a-option value="real-time">实时处理</a-option>
              <a-option value="batch">批处理</a-option>
              <a-option value="streaming">流处理</a-option>
              <a-option value="hybrid">混合处理</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="数据格式">
            <a-select v-model="dataForm.format" placeholder="选择数据格式">
              <a-option value="json">JSON</a-option>
              <a-option value="xml">XML</a-option>
              <a-option value="protobuf">Protocol Buffers</a-option>
              <a-option value="csv">CSV</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="数据压缩">
            <a-switch v-model="dataForm.compression" />
            <span style="margin-left: 8px;">启用数据压缩</span>
          </a-form-item>
          <a-form-item label="数据加密">
            <a-switch v-model="dataForm.encryption" />
            <span style="margin-left: 8px;">启用数据加密</span>
          </a-form-item>
          <a-form-item label="数据过滤">
            <a-switch v-model="dataForm.filtering" />
            <span style="margin-left: 8px;">启用数据过滤</span>
          </a-form-item>
          <a-form-item v-if="dataForm.filtering" label="过滤规则">
            <a-textarea v-model="dataForm.filterRules" placeholder="例如: temperature > 25, humidity < 80" :rows="3" />
          </a-form-item>
          <a-form-item label="数据存储">
            <a-select v-model="dataForm.storage" placeholder="选择数据存储" multiple>
              <a-option value="local">本地存储</a-option>
              <a-option value="cloud">云端存储</a-option>
              <a-option value="database">数据库</a-option>
              <a-option value="timeseries">时序数据库</a-option>
            </a-select>
          </a-form-item>
          <a-form-item label="数据保留策略">
            <a-input-number v-model="dataForm.retention" :min="1" :max="3650" :default-value="365" />
            <span style="margin-left: 8px;">天</span>
          </a-form-item>
        </a-form>
      </div>
      <div v-if="currentStep === 3">
        <a-space direction="vertical" style="width: 100%">
          <a-button @click="deployIoTGateway">部署IoT网关</a-button>
          <a-button @click="testDeviceConnection">测试设备连接</a-button>
          <a-button @click="testDataProcessing">测试数据处理</a-button>
          <a-button @click="showIoTStatus">显示IoT网络状态</a-button>
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
      title="物联网网络配置 - 原理与命令"
      width="800px"
      :footer="null"
    >
      <div class="help-content">
        <h3>🎯 场景原理</h3>
        <p>物联网网络通过OVS实现设备连接、数据采集和处理的网络虚拟化。OVS为IoT设备创建隔离的网络环境，支持多种通信协议，并提供数据流控制和QoS保证。</p>
        
        <h3>🔧 核心概念</h3>
        <ul>
          <li><strong>IoT网关</strong>：连接IoT设备和云端的网络节点</li>
          <li><strong>设备网络</strong>：IoT设备连接的虚拟网络环境</li>
          <li><strong>数据管道</strong>：设备数据采集、传输和处理的网络路径</li>
          <li><strong>协议转换</strong>：不同IoT协议间的转换和路由</li>
        </ul>

        <h3>📋 命令示例</h3>
        <div class="command-section">
          <h4>1. 创建IoT网关网络</h4>
          <pre class="command"># 创建IoT网关网桥
ovs-vsctl add-br iot-gateway-br

# 创建设备网络网桥
ovs-vsctl add-br iot-sensors-br
ovs-vsctl add-br iot-actuators-br

# 连接网关到设备网络
ovs-vsctl add-port iot-gateway-br patch-sensors -- set interface patch-sensors type=patch options:peer=patch-gateway
ovs-vsctl add-port iot-sensors-br patch-gateway -- set interface patch-gateway type=patch options:peer=patch-sensors</pre>

          <h4>2. 配置设备网络隔离</h4>
          <pre class="command"># 为传感器创建隔离网络
ovs-vsctl add-port iot-sensors-br sensor1 -- set interface sensor1 type=internal
ovs-vsctl add-port iot-sensors-br sensor2 -- set interface sensor2 type=internal

# 为执行器创建隔离网络
ovs-vsctl add-port iot-actuators-br actuator1 -- set interface actuator1 type=internal
ovs-vsctl add-port iot-actuators-br actuator2 -- set interface actuator2 type=internal

# 配置设备IP地址
ip addr add 192.168.1.101/24 dev sensor1
ip addr add 192.168.1.102/24 dev sensor2
ip addr add 192.168.2.101/24 dev actuator1
ip addr add 192.168.2.102/24 dev actuator2</pre>

          <h4>3. 配置协议转换和路由</h4>
          <pre class="command"># 配置MQTT到HTTP的协议转换
ovs-ofctl add-flow iot-gateway-br "table=0, priority=100, tcp, tp_dst=1883, actions=mod_tp_dst:8080,normal"

# 配置设备数据流路由
ovs-ofctl add-flow iot-sensors-br "table=0, priority=100, ip, nw_src=192.168.1.0/24, actions=output:patch-gateway"
ovs-ofctl add-flow iot-actuators-br "table=0, priority=100, ip, nw_dst=192.168.2.0/24, actions=output:patch-gateway"

# 查看流表规则
ovs-ofctl dump-flows iot-gateway-br</pre>

          <h4>4. 配置数据流控制和QoS</h4>
          <pre class="command"># 为传感器数据配置高优先级
ovs-ofctl add-flow iot-sensors-br "table=0, priority=200, ip, nw_src=192.168.1.0/24, actions=set_queue:2,normal"

# 为执行器控制配置低延迟
ovs-ofctl add-flow iot-actuators-br "table=0, priority=300, ip, nw_dst=192.168.2.0/24, actions=set_queue:1,normal"

# 配置带宽限制
ovs-vsctl set port iot-sensors-br qos=@sensorqos
ovs-vsctl -- --id=@sensorqos create qos type=linux-htb other-config:max-rate=10000000</pre>
        </div>

        <h3>🚀 操作步骤</h3>
        <ol>
          <li><strong>网关网络配置</strong>：创建IoT网关和连接网络</li>
          <li><strong>设备网络隔离</strong>：为不同类型设备创建隔离网络</li>
          <li><strong>协议转换配置</strong>：配置不同IoT协议间的转换</li>
          <li><strong>数据流控制</strong>：配置QoS和数据流优先级</li>
        </ol>

        <h3>⚠️ 注意事项</h3>
        <ul>
          <li>IoT设备网络需要确保安全隔离</li>
          <li>传感器数据需要高优先级传输</li>
          <li>执行器控制需要低延迟保证</li>
          <li>协议转换需要考虑兼容性和性能</li>
        </ul>

        <h3>🔗 实际应用</h3>
        <ul>
          <li><strong>智能家居</strong>：各种传感器和执行器通过OVS网络隔离和管理</li>
          <li><strong>工业物联网</strong>：工厂设备通过OVS实现数据采集和控制分离</li>
          <li><strong>边缘计算</strong>：边缘节点通过OVS与云端建立安全连接</li>
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
const gatewayForm = reactive({ name: 'iot-gateway-01', type: 'edge', protocols: ['mqtt', 'http'], location: '北京市朝阳区', processingPower: 10, storage: 100, batteryPowered: true })
const deviceForm = reactive({ type: ['sensor', 'actuator'], count: 100, connection: 'wifi', samplingRate: 60, authentication: true, authMethod: 'certificate', management: true })
const dataForm = reactive({ mode: 'real-time', format: 'json', compression: true, encryption: true, filtering: true, filterRules: 'temperature > 25, humidity < 80', storage: ['local', 'cloud'], retention: 365 })

const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 0) currentStep.value-- }
const applyScenario = async () => { Message.success('物联网网络配置已应用') }
const showHelp = () => { helpVisible.value = true }
const deployIoTGateway = () => { testResults.value = 'IoT网关部署结果:\n网关名称: iot-gateway-01\n网关类型: 边缘网关\n通信协议: MQTT, HTTP\n位置: 北京市朝阳区\n处理能力: 10万次/秒\n存储容量: 100GB\n电池供电: 支持\n状态: 部署成功\n\n网络配置:\n- 设备连接: 正常\n- 协议支持: 完整\n- 数据处理: 就绪' }
const testDeviceConnection = () => { testResults.value = '设备连接测试:\n设备类型: 传感器, 执行器\n设备数量: 100个\n连接方式: WiFi\n采集频率: 60秒\n认证方式: 数字证书\n\n连接状态:\n- 在线设备: 95个\n- 离线设备: 5个\n- 连接成功率: 95%\n- 平均响应时间: 200ms\n- 数据传输: 正常\n- 认证状态: 通过' }
const testDataProcessing = () => { testResults.value = '数据处理测试:\n处理模式: 实时处理\n数据格式: JSON\n数据压缩: 已启用\n数据加密: 已启用\n数据过滤: 已启用\n\n性能指标:\n- 数据处理速率: 1000条/秒\n- 压缩比: 60%\n- 加密开销: 5ms\n- 过滤效率: 90%\n- 存储写入: 正常\n- 数据质量: 优秀' }
const showIoTStatus = () => { testResults.value = 'IoT网络状态:\n网关状态: 正常运行\n运行时间: 240小时\n活跃设备: 95个\n\n网络性能:\n- 设备连接率: 95%\n- 数据传输量: 50MB/小时\n- 平均延迟: 200ms\n- 丢包率: 0.1%\n\n数据处理:\n- 处理数据量: 1.2M条/天\n- 存储使用率: 65%\n- 数据压缩率: 60%\n- 过滤效率: 90%\n\n告警信息:\n- 设备离线: 5个\n- 数据异常: 2个\n- 网络延迟: 正常' }
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