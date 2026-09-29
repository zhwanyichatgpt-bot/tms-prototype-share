<script setup>
/**
 * 运单中心 —— 运单类型页签（普通运单/平台运单/委外运单）
 */
defineProps({
  activeKey: { type: String, default: 'normal' },
  tabs: { type: Array, default: () => [] },
})
const emit = defineEmits(['change'])
</script>

<template>
  <div class="wc-kindtabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="wc-kindtabs-item"
      :class="{ active: tab.key === activeKey }"
      role="tab"
      :aria-selected="tab.key === activeKey"
      @click="emit('change', tab.key)"
    >{{ tab.label }}</button>
  </div>
</template>
