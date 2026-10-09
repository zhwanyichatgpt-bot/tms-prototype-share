<template>
  <span :class="['la-icon', `la-icon--${tone}`]" aria-hidden="true">
    <TransportIcon v-if="transportMode" :mode="transportMode" />
    <Icon v-else :name="iconNames[name] || 'description'" />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from 'vant'
import TransportIcon from './TransportIcon.vue'

const props = defineProps({ name: { type: String, default: 'document' }, tone: { type: String, default: 'blue' } })
const transportMode = computed(() => ({ truck: 'road', ship: 'water', train: 'rail' })[props.name])
// 复用已有运输图标与 Vant 内置图标，统一应用入口的表现。
const iconNames = {
  document: 'description', route: 'cluster', container: 'column', crane: 'logistics',
  task: 'todo-list', wallet: 'balance-list', person: 'manager',
  'search-document': 'orders-o', energy: 'fire', chart: 'bar-chart-o', leaf: 'certificate',
  alert: 'warning', camera: 'photo', shield: 'shield-o', grid: 'apps-o',
  cloud: 'shopping-cart', plus: 'plus',
}
</script>
