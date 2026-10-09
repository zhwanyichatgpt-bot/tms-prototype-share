<template>
  <div class="ly-network-map">
    <span class="ly-network-caption">运输网络示意 · 非实际轨迹</span>
    <svg viewBox="0 0 330 236" role="group" aria-label="武汉出发的公路、水路、铁路及多式联运服务网络示意">
      <rect width="330" height="236" fill="#eaf2fa"/>
      <path d="M0 18L38 32 68 15 108 39 152 21 191 45 232 29 273 45 303 77 292 101 307 126 277 142 274 171 246 188 228 231H0Z" fill="#f6f9fc" stroke="#d8e5f1"/>
      <path d="M21 53l44 18 11 46-23 42M108 39l-8 43 27 39-10 55 37 41M191 45l-18 30 28 57-17 29 26 48M232 29l4 70 35 24M0 135l53-11 74 12 56-11 90 17M31 192l74-16 69 7 72 5" stroke="#e1eaf2" fill="none"/>
      <path d="M24 86Q80 68 131 107T280 102" fill="none" stroke="#bbd9ec" stroke-width="4"/>
      <text x="228" y="125" fill="#94b7cf" font-size="10">长江</text>
      <g v-for="route in mainRoutes" :key="route.id" :style="{ color: modeColor(route.mode) }" role="button" tabindex="0" :aria-label="route.from + '到' + route.to + '，' + modeName(route.mode)" :aria-pressed="selectedId === route.id" @click="$emit('select', route.id)" @keydown.enter="$emit('select', route.id)" @keydown.space.prevent="$emit('select', route.id)">
        <path :d="routePath(route)" fill="none" stroke="transparent" stroke-width="22"/>
        <path :d="routePath(route)" fill="none" stroke="currentColor" :stroke-width="selectedId === route.id ? 3.5 : 2" :stroke-dasharray="route.mode === 'road' ? undefined : '6 5'" :opacity="selectedId === route.id ? 1 : .65"/>
      </g>
      <g v-for="node in visibleNodes" :key="node.id" pointer-events="none">
        <circle :cx="node.x" :cy="node.y" :r="node.id === 'wuhan' ? 7 : 5" fill="#3a65ff" stroke="white" stroke-width="2"/>
        <text :x="node.x" :y="node.y - 13" text-anchor="middle" fill="#374f68" font-size="12" font-weight="600">{{ node.label }}</text>
      </g>
      <text v-if="!mainRoutes.length" x="165" y="146" text-anchor="middle" fill="#74869c" font-size="12">低空服务请查看局部范围</text>
    </svg>
    <button v-if="airRoute" class="ly-air-inset" :class="{ selected: selectedId === airRoute.id }" :aria-pressed="selectedId === airRoute.id" @click="$emit('select', airRoute.id)">
      <span>低空局部服务</span><TransportIcon mode="air"/><strong>园区A <i>···</i> 园区B</strong>
    </button>
    <div class="ly-map-legend"><span v-for="mode in legend" :key="mode.key"><i :style="{ background: mode.color }"></i>{{ mode.short }}</span></div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { modes, networkNodes } from './mock-data.js'
import TransportIcon from './TransportIcon.vue'
const props = defineProps({ routes: { type: Array, required: true }, selectedId: { type: String, default: '' } })
defineEmits(['select'])
const mainRoutes = computed(() => props.routes.filter(route => route.mode !== 'air'))
const airRoute = computed(() => props.routes.find(route => route.mode === 'air'))
const visibleNodes = computed(() => networkNodes.filter(node => mainRoutes.value.some(route => route.fromId === node.id || route.toId === node.id)))
const legend = computed(() => modes.filter(mode => props.routes.some(route => route.mode === mode.key)))
const modeColor = key => modes.find(mode => mode.key === key)?.color
const modeName = key => modes.find(mode => mode.key === key)?.label
function routePath(route) {
  const from = networkNodes.find(node => node.id === route.fromId)
  const to = networkNodes.find(node => node.id === route.toId)
  if (!from || !to) return ''
  return 'M' + from.x + ' ' + from.y + ' Q' + (from.x + to.x) / 2 + ' ' + (Math.min(from.y, to.y) - 18) + ' ' + to.x + ' ' + to.y
}
</script>
