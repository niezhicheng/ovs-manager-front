<template>
  <div class="network-devices-page-flex">
    <!-- 左侧设备面板 -->
    <div class="device-panel">
      <a-card title="设备库" class="device-panel-card">
        <div v-for="(devices, type) in deviceTypes" :key="type" class="device-type-group">
          <div class="device-type-title">{{ typeMap[type] }}</div>
          <div class="device-list">
            <div
              v-for="device in devices"
              :key="device.id"
              class="device-item"
              draggable="true"
              @dragstart="onDragStart($event, device, type)"
            >
              <span class="device-icon">🔌</span>
              <span>{{ device.name }}</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>
    <!-- 右侧拓扑画布 -->
    <div class="topology-canvas">
      <a-card title="网络拓扑编辑器" class="topology-canvas-card">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          style="height: 600px; background: #f4f6fa; border-radius: 12px;"
          :connection-line-type="'bezier'"
          :connection-mode="'loose'"
          :fit-view="true"
          :default-edge-options="{ type: 'default', animated: true, style: { stroke: '#1890ff', strokeWidth: 3 } }"
          :node-types="customNodeTypes"
          @drop="onDrop"
          @dragover.prevent
          @mousemove="onCanvasMouseMove"
          @click="onCanvasClick"
        >
          <template #edge-label="{ edge }">
            <span v-if="edge.data && edge.data.label" class="edge-label">{{ edge.data.label }}</span>
          </template>
          <template #controls>
            <div class="flow-controls">
              <button class="zoom-btn" @click="$emit('zoomIn')">+</button>
              <button class="zoom-btn" @click="$emit('zoomOut')">-</button>
            </div>
          </template>
        </VueFlow>
        <!-- 将 pending-line-svg 移到画布容器内，和 VueFlow 并列 -->
        <svg v-if="pendingLine" class="pending-line-svg">
          <line
            :x1="pendingLine.start.x"
            :y1="pendingLine.start.y"
            :x2="pendingLine.end.x"
            :y2="pendingLine.end.y"
            stroke="#1890ff"
            stroke-width="3"
            stroke-dasharray="6,4"
            marker-end="url(#arrowhead)"
          />
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8" fill="#1890ff" />
            </marker>
          </defs>
        </svg>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, defineComponent, h, onMounted, onBeforeUnmount } from 'vue';
import { Message } from '@arco-design/web-vue';
import { VueFlow, Handle, Position, useVueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';

const typeMap = {
  switch: '交换机',
  router: '路由器',
  vm: '虚拟机',
};

const defaultInterfaces = {
  switch: ['eth0', 'eth1', 'eth2', 'eth3'],
  router: ['ge-0/0/0', 'ge-0/0/1'],
  vm: ['eth0', 'eth1'],
};

const deviceTypes = reactive({
  switch: [
    { id: 's1', name: '交换机1' },
    { id: 's2', name: '交换机2' },
  ],
  router: [
    { id: 'r1', name: '路由器1' },
    { id: 'r2', name: '路由器2' },
  ],
  vm: [
    { id: 'v1', name: '虚拟机1' },
    { id: 'v2', name: '虚拟机2' },
  ],
});

const nodes = ref([]);
const edges = ref([]);

// 点击-点击连线相关状态
const pendingSource = ref(null); // { nodeId, iface, position: {x, y} }
const pendingLine = ref(null);   // { start: {x, y}, end: {x, y} }
const mousePos = ref({ x: 0, y: 0 });

// 获取画布节点的绝对坐标
function getHandleCenter(nodeId, iface, type) {
  const nodeEl = document.querySelector(`[data-id='${nodeId}']`);
  if (!nodeEl) return { x: 0, y: 0 };
  const handleEl = nodeEl.querySelector(`.iface-handle[type='${type}'][id='${iface}']`) || nodeEl.querySelector(`.iface-handle[id='${iface}']`);
  if (!handleEl) return { x: 0, y: 0 };
  const rect = handleEl.getBoundingClientRect();
  // 统一参考系为 .topology-canvas-card
  const parentRect = document.querySelector('.topology-canvas-card').getBoundingClientRect();
  const pos = {
    x: rect.left + rect.width / 2 - parentRect.left,
    y: rect.top + rect.height / 2 - parentRect.top,
  };
  console.log('getHandleCenter', nodeId, iface, type, pos);
  return pos;
}

// 自定义节点组件，渲染接口 handle，支持点击-点击连线
const CustomDeviceNode = defineComponent({
  props: ['id', 'data', 'label', 'type'],
  setup(props) {
    function onHandleClick(iface, handleType, e) {
      const canvasRect = document.querySelector('.topology-canvas-card').getBoundingClientRect();
      const pos = {
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
      };
      if (!pendingSource.value) {
        pendingSource.value = { nodeId: props.id, iface, handleType, position: pos };
        pendingLine.value = { start: pos, end: pos };
        console.log('handle clicked, pendingSource', pendingSource.value);
      } else if (
        pendingSource.value &&
        (props.id !== pendingSource.value.nodeId || iface !== pendingSource.value.iface)
      ) {
        const source = pendingSource.value;
        const target = { nodeId: props.id, iface, handleType };
        edges.value.push({
          id: `e-${source.nodeId}-${source.iface}-${target.nodeId}-${target.iface}-${Date.now()}`,
          source: source.nodeId,
          sourceHandle: source.iface,
          target: target.nodeId,
          targetHandle: target.iface,
          label: `${source.iface} <-> ${target.iface}`,
          data: { label: `${source.iface} <-> ${target.iface}` },
          animated: true,
          type: 'default',
          style: { stroke: '#1890ff', strokeWidth: 3 },
        });
        pendingSource.value = null;
        pendingLine.value = null;
      }
    }
    return () =>
      h(
        'div',
        { class: 'custom-device-node' },
        [
          h('div', { class: 'node-title' }, [props.label]),
          h(
            'div',
            { class: 'node-interfaces' },
            props.data.interfaces.map((iface, idx) =>
              h('div', {
                style: {
                  position: 'absolute',
                  left: '0',
                  top: `${36 + idx * 32}px`,
                  width: '24px',
                  height: '24px',
                  zIndex: 10,
                  cursor: 'pointer',
                  background: 'transparent',
                },
                onClick: (e) => { e.stopPropagation(); onHandleClick(iface, 'source', e); },
              }, [
                h(
                  Handle,
                  {
                    key: iface,
                    id: iface,
                    type: 'source',
                    position: Position.Right,
                    style: { top: '0', background: '#1890ff', border: '3px solid #fff', boxShadow: '0 2px 8px #1890ff33', width: '18px', height: '18px', borderRadius: '50%', transition: 'box-shadow 0.2s', cursor: 'pointer', position: 'relative' },
                    title: iface,
                    class: 'iface-handle',
                  },
                  () => h('span', { class: 'iface-label' }, iface)
                )
              ])
            ).concat(
              props.data.interfaces.map((iface, idx) =>
                h('div', {
                  style: {
                    position: 'absolute',
                    left: '0',
                    top: `${36 + idx * 32}px`,
                    width: '24px',
                    height: '24px',
                    zIndex: 10,
                    cursor: 'pointer',
                    background: 'transparent',
                  },
                  onClick: (e) => { e.stopPropagation(); onHandleClick(iface, 'target', e); },
                }, [
                  h(
                    Handle,
                    {
                      key: iface + '-target',
                      id: iface,
                      type: 'target',
                      position: Position.Left,
                      style: { top: '0', background: '#52c41a', border: '3px solid #fff', boxShadow: '0 2px 8px #52c41a33', width: '18px', height: '18px', borderRadius: '50%', transition: 'box-shadow 0.2s', cursor: 'pointer', position: 'relative' },
                      title: iface,
                      class: 'iface-handle',
                    },
                    () => h('span', { class: 'iface-label' }, iface)
                  )
                ])
              )
            )
          ),
        ]
      );
  },
});

const customNodeTypes = { customDevice: CustomDeviceNode };

function onDragStart(e, device, type) {
  e.dataTransfer.setData('application/json', JSON.stringify({ device, type }));
}

function onDrop(e) {
  const data = e.dataTransfer.getData('application/json');
  if (!data) return;
  const { device, type } = JSON.parse(data);
  const boundingRect = e.target.getBoundingClientRect();
  const position = {
    x: e.clientX - boundingRect.left,
    y: e.clientY - boundingRect.top,
  };
  const nodeId = `${device.id}-${Date.now()}`;
  nodes.value.push({
    id: nodeId,
    type: 'customDevice',
    label: device.name,
    position,
    data: {
      ...device,
      type,
      interfaces: defaultInterfaces[type] || ['eth0', 'eth1'],
    },
  });
}

// 画布鼠标移动时，更新虚拟线终点
function onCanvasMouseMove(e) {
  if (!pendingSource.value) return;
  // 统一参考系为 .topology-canvas-card
  const canvasRect = document.querySelector('.topology-canvas-card').getBoundingClientRect();
  const pos = {
    x: e.clientX - canvasRect.left,
    y: e.clientY - canvasRect.top,
  };
  pendingLine.value = {
    start: pendingSource.value.position,
    end: pos,
  };
  console.log('pendingLine', pendingLine.value);
}

// 画布点击时，若有pendingSource则取消连线
function onCanvasClick() {
  if (pendingSource.value) {
    pendingSource.value = null;
    pendingLine.value = null;
  }
}

// 支持ESC取消连线
function onEsc(e) {
  if (e.key === 'Escape' && pendingSource.value) {
    pendingSource.value = null;
    pendingLine.value = null;
  }
}
onMounted(() => {
  window.addEventListener('keydown', onEsc);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEsc);
});
</script>

<style scoped>
.network-devices-page-flex {
  display: flex;
  gap: 24px;
  padding: 24px 0;
}
.device-panel {
  width: 240px;
}
.device-panel-card {
  height: 100%;
}
.device-type-group {
  margin-bottom: 24px;
}
.device-type-title {
  font-weight: bold;
  margin-bottom: 8px;
}
.device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.device-item {
  background: #f4f6fa;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: grab;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}
.device-item:active {
  background: #e6f7ff;
}
.device-icon {
  font-size: 18px;
}
.topology-canvas {
  flex: 1;
  min-width: 0;
}
.topology-canvas-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  position: relative; /* 修复虚线定位问题 */
}
.custom-device-node {
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 12px;
  min-width: 140px;
  min-height: 60px;
  padding: 12px 20px 12px 20px;
  box-shadow: 0 4px 16px #1890ff22;
  position: relative;
  transition: box-shadow 0.2s, border 0.2s;
}
.custom-device-node:hover {
  box-shadow: 0 8px 32px #1890ff33;
  border: 2.5px solid #52c41a;
}
.node-title {
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
  color: #1890ff;
  font-size: 16px;
}
.node-interfaces {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 8px;
}
.iface-label {
  font-size: 12px;
  margin-left: 6px;
  color: #888;
  user-select: none;
}
.iface-handle {
  transition: box-shadow 0.2s, background 0.2s;
}
.iface-handle:hover {
  box-shadow: 0 0 0 4px #ffe58f99, 0 2px 8px #1890ff33;
  background: #ffe58f !important;
}
.edge-label {
  background: #fffbe6;
  border: 1.5px solid #ffe58f;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 13px;
  color: #ad8b00;
  box-shadow: 0 1px 4px #0000000d;
  font-weight: 500;
}
.pending-line-svg {
  pointer-events: none;
  z-index: 9999;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.flow-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}
.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px #1890ff33;
  transition: background 0.2s;
}
.zoom-btn:hover {
  background: #52c41a;
}
</style>
 