<script setup>
defineProps({
  steps: { type: Array, required: true },
  expanded: Boolean,
  summary: String,
  label: { type: String, default: '分析过程' },
})
</script>

<template>
  <details v-if="steps.length" class="answer-process" :open="expanded">
    <summary>{{ label }}<span v-if="summary" class="answer-process-summary"> · {{ summary }}</span></summary>
    <ol>
      <li v-for="(step, index) in steps" :key="index">{{ step }}</li>
    </ol>
  </details>
</template>

<style scoped>
.answer-process { margin: 0 0 12px; color: #59657b; font-size: 13px; line-height: 1.65; }
.answer-process summary { width: fit-content; max-width: 100%; cursor: pointer; color: #425886; }
.answer-process-summary { color: #59657b; }
.answer-process[open] .answer-process-summary { display: none; }
.answer-process ol { margin: 6px 0 0; padding-left: 24px; list-style: decimal; }
.answer-process li + li { margin-top: 3px; }
</style>
