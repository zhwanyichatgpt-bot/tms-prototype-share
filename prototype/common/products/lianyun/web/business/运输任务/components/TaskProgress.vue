<script setup>
/**
 * 任务进度展示：标题 + 进度文案（如“50% | 75箱”）。
 * 子任务网格中的静态指标（指派进度/运输进度/司机任务/运单）也由本组件承载。
 */
defineProps({
  label: { type: String, default: '任务进度' },
  value: { type: String, default: '' },
  /** 数字下沉展示（设计稿司机任务/运单行高下沉） */
  sink: { type: Boolean, default: false },
  percent: { type: Number, default: 50 },
})
</script>

<template>
  <div class="tt-progress" :class="{ sink }" :data-metric="label">
    <span class="tt-progress-label">{{ label }}</span>
    <span class="tt-progress-value">{{ value }}</span>
    <span v-if="!sink" class="tt-progress-track" aria-hidden="true">
      <span class="tt-progress-fill" :style="{ width: `${percent}%` }" />
    </span>
  </div>
</template>
