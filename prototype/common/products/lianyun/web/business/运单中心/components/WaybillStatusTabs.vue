<script setup>
/** 运单中心 —— 当前企业视角下的运单阶段页签。 */

defineProps({
  activeKey: { type: String, default: 'all' },
  tabs: { type: Array, default: () => [] },
})
const emit = defineEmits(['change'])
</script>

<template>
  <div class="wc-statustabs" role="tablist">
    <button
      v-for="tab in tabs"
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
