<script setup>
/**
 * 运单中心 —— 左侧运单类型面板
 * 汽运/水运/铁路运单 + 待复核/待结算/异常单计数，与系统左侧导航分离。
 */
import { waybillTypes } from '../mock-data'

defineProps({
  activeKey: { type: String, default: 'truck' },
})
const emit = defineEmits(['change'])
</script>

<template>
  <aside class="wc-typepanel" aria-label="运单类型">
    <div
      v-for="type in waybillTypes"
      :key="type.key"
      class="wc-typepanel-group"
      :class="{ active: type.key === activeKey }"
    >
      <button type="button" class="wc-typepanel-head" @click="emit('change', type.key)">
        <svg class="wc-typepanel-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="5" width="9" height="7" rx="1" stroke="currentColor"/>
          <path d="M11 8h2l1 2v2h-3" stroke="currentColor"/>
          <circle cx="5" cy="13" r="1.4" fill="currentColor"/>
          <circle cx="12" cy="13" r="1.4" fill="currentColor"/>
        </svg>
        <span class="wc-typepanel-label">{{ type.label }}</span>
        <svg class="wc-typepanel-chevron" width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
          <path d="M2 1l4 5-4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <ul v-if="type.key === activeKey" class="wc-typepanel-stats">
        <li v-for="stat in type.stats" :key="stat.key" class="wc-typepanel-stat">
          <span class="wc-typepanel-stat-label">{{ stat.label }}</span>
          <span class="wc-typepanel-stat-count">{{ stat.count }}</span>
        </li>
      </ul>
    </div>
  </aside>
</template>
