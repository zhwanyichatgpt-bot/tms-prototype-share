<script setup>
import { ref } from 'vue'
import { periods, updateTime } from './dashboard-data.js'

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '▥' },
  period: { type: String, default: '' },
  timestamp: Boolean,
  more: Boolean,
  count: { type: Number, default: null },
})
const selected = ref(props.period)
</script>

<template>
  <section class="dashboard-card" :aria-label="title">
    <header class="dashboard-card-heading">
      <i class="dashboard-card-icon" aria-hidden="true">{{ icon }}</i>
      <h2>{{ title }}</h2>
      <span v-if="count !== null" class="dashboard-count">{{ count }}</span>
      <small v-if="timestamp" class="dashboard-timestamp" :title="updateTime">更新时间：{{ updateTime }}</small>
      <div v-if="period" class="dashboard-periods" aria-label="统计周期">
        <button v-for="item in periods" :key="item" type="button" :aria-pressed="item === selected" @click="selected = item">{{ item }}</button>
      </div>
      <span v-if="more" class="dashboard-more" aria-hidden="true">›</span>
    </header>
    <slot />
  </section>
</template>
