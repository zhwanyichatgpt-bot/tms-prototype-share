<script setup>
/**
 * 运单详情 —— 面包屑与返回
 */
defineProps({
  parentTitle: { type: String, default: '运单中心' },
  pageTitle: { type: String, default: '运单详情' },
})
const emit = defineEmits(['back'])
</script>

<template>
  <div class="wd-header">
    <div class="wd-breadcrumb">
      <span class="wd-crumb-parent" @click="emit('back')">{{ parentTitle }}</span>
      <span class="wd-crumb-sep">›</span>
      <span class="wd-crumb-current">{{ pageTitle }}</span>
    </div>
    <div class="wd-back" @click="emit('back')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M5.5 3L2 6.5L5.5 10M2.5 6.5H10.5C11.6046 6.5 12.5 7.39543 12.5 8.5C12.5 9.60457 11.6046 10.5 10.5 10.5H9" stroke="#606266" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="wd-back-text">返回列表</span>
    </div>
  </div>
</template>
