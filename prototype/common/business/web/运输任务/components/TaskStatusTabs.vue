<script setup>
import { statusTabs } from '../mock-data'

defineProps({
  activeKey: { type: String, default: 'all' },
})
const emit = defineEmits(['change'])

function indicatorLeft(tab, index) {
  // 激活指示器（23×2）相对激活 tab 左偏移 5
  return `${index * 72 + 5}px`
}
</script>

<template>
  <div class="tt-statustabs" role="tablist">
    <button
      v-for="(tab, index) in statusTabs"
      :key="tab.key"
      type="button"
      class="tt-statustabs-item"
      :class="{ active: tab.key === activeKey }"
      :style="{ left: `${index * 72}px` }"
      role="tab"
      :aria-selected="tab.key === activeKey"
      @click="emit('change', tab.key)"
    >{{ tab.label }}</button>
    <span class="tt-statustabs-indicator" :style="{ left: indicatorLeft(activeKey, statusTabs.findIndex(t => t.key === activeKey)) }" />
  </div>
</template>