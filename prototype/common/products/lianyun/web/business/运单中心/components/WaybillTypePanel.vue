<script setup>
/**
 * 运单中心 —— 汽运/水运/铁路运输方式导航。
 */
import { waybillTypes } from '../mock-data'

defineProps({
  activeKey: { type: String, default: 'truck' },
})

const emit = defineEmits(['change'])
</script>

<template>
  <aside class="wc-typepanel" aria-label="运输方式">
    <section
      v-for="type in waybillTypes"
      :key="type.key"
      class="wc-typepanel-group"
      :class="{ active: type.key === activeKey }"
    >
      <button type="button" class="wc-typepanel-head" @click="emit('change', type.key)">
        <span class="wc-typepanel-icon" :class="`is-${type.key}`" aria-hidden="true" />
        <span class="wc-typepanel-label">{{ type.label }}</span>
        <span class="wc-typepanel-chevron" aria-hidden="true">›</span>
      </button>
      <ul class="wc-typepanel-stats">
        <li v-for="stat in type.stats" :key="stat.key" class="wc-typepanel-stat">
          <span>{{ stat.label }}</span>
          <strong class="wc-typepanel-stat-count">{{ stat.count }}</strong>
        </li>
      </ul>
    </section>
  </aside>
</template>
