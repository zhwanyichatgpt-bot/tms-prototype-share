<script setup>
import { computed } from 'vue'

const props = defineProps({
  labels: { type: Array, default: () => ['12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月'] },
  series: { type: Array, required: true },
  max: { type: Number, required: true },
  rightScale: { type: Array, default: null },
  steps: { type: Number, default: 5 },
})
const ticks = computed(() => Array.from({ length: props.steps + 1 }, (_, index) => ({
  y: 12 + 128 * index / props.steps,
  value: Math.round(props.max * (1 - index / props.steps)).toLocaleString('en-US'),
})))
const firstX = computed(() => props.max >= 1e8 ? 81 : 42)
const lastX = computed(() => props.rightScale ? 315 : 338)
const center = index => firstX.value + (lastX.value - firstX.value) * (index + .5) / props.labels.length
const y = value => 140 - 128 * value / props.max
const points = values => values.map((value, i) => `${center(i)},${y(value)}`).join(' ')
</script>

<template>
  <figure class="dashboard-trend">
    <svg viewBox="0 0 348 161" preserveAspectRatio="none" role="img" :aria-label="series.map(item => item.name).join('、')">
      <g v-for="(tick, index) in ticks" :key="index">
        <line :x1="firstX" :x2="lastX" :y1="tick.y" :y2="tick.y" stroke="var(--wb-chart-grid)" stroke-dasharray="3 2"/>
        <text :x="firstX - 7" :y="tick.y + 4" text-anchor="end">{{ tick.value }}</text>
      </g>
      <text v-for="(tick, i) in rightScale" :key="'right-' + i" :x="lastX + 6" :y="16 + 128 * i / (rightScale.length - 1)">{{ tick }}</text>
      <path :d="`M${firstX} 12V140H${lastX}`" fill="none" stroke="var(--wb-border)"/>
      <g v-for="(item, s) in series" :key="item.name">
        <template v-if="item.type === 'bar'">
          <rect v-for="(value, i) in item.values" :key="i" :x="center(i) - 3" :y="y(value) + (item.stack ? y(series[s - 1].values[i]) - 140 : 0)" width="6" :height="140 - y(value)" :fill="item.color"/>
        </template>
        <template v-else-if="item.type === 'line'">
          <polyline :points="points(item.values)" fill="none" :stroke="item.color" stroke-width="1.5"/>
          <circle v-for="(value, i) in item.values" :key="i" :cx="center(i)" :cy="y(value)" r="2.5" fill="white" :stroke="item.color" stroke-width="1.5"/>
        </template>
      </g>
      <text v-for="(label, i) in labels" :key="i" :x="center(i)" y="155" text-anchor="middle">{{ label }}</text>
    </svg>
    <figcaption><span v-for="item in series" :key="item.name"><i :style="{ backgroundColor: item.color }"></i>{{ item.name }}</span></figcaption>
  </figure>
</template>
