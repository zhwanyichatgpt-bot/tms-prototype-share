<script setup>
/**
 * 运单中心 —— 状态页签（全部/已接单/运输中/待复核/待结算/已完成/有异常/已作废）
 */
import { statusTabs } from '../mock-data'

defineProps({
  activeKey: { type: String, default: 'all' },
})
const emit = defineEmits(['change'])
</script>

<template>
  <div class="wc-statustabs" role="tablist">
    <button
      v-for="tab in statusTabs"
      :key="tab.key"
      type="button"
      class="wc-statustabs-item"
      :class="{ active: tab.key === activeKey }"
      role="tab"
      :aria-selected="tab.key === activeKey"
      @click="emit('change', tab.key)"
    >{{ tab.label }}</button>
  </div>
</template>
