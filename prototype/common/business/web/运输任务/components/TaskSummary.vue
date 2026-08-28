<script setup>
/**
 * 展开任务摘要：七列「标签 + 值」详情（货物/集装箱/运输单价/基础运费/调度员/指派时间/备注）。
 */
defineProps({
  items: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="tt-summary">
    <div v-for="(item, index) in items" :key="index" class="tt-summary-col" :data-field="item.label">
      <span class="tt-summary-label">{{ item.label }}</span>
      <span class="tt-summary-value" :title="item.value">{{ item.value }}</span>
    </div>
  </div>
</template>