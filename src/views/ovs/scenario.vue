<template>
  <a-card title="场景引导">
    <a-space direction="vertical" style="width: 100%">
      <a-button type="primary" @click="applyScenario">应用场景</a-button>
    </a-space>
  </a-card>
</template>

<script setup>
import { applyScenario as apiApplyScenario } from '@/api/ovs/scenario'

const applyScenario = async () => {
  await apiApplyScenario()
  // 可加提示
}
</script> 