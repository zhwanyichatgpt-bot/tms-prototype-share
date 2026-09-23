<script setup>
const emit = defineEmits(['create', 'export'])
</script>

<template>
  <div class="plan-toolbar">
    <button type="button" class="pt-btn pt-btn-primary" @click="emit('create')">新建联运计划</button>
    <button type="button" class="pt-btn pt-btn-plain" @click="emit('export')">导出</button>
  </div>
</template>
