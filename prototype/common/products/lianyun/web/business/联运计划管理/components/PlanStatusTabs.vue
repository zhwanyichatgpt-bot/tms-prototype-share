<script setup>
defineProps({
  tabs: { type: Array, default: () => [] },
  activeKey: { type: String, default: '全部' },
})
const emit = defineEmits(['change'])
</script>

<template>
  <div class="plan-status-tabs">
    <button
      v-for="t in tabs"
      :key="t.value"
      type="button"
      class="plan-status-tab"
      :class="{ active: activeKey === t.value }"
      @click="emit('change', t.value)"
    >{{ t.label }}</button>
  </div>
</template>
