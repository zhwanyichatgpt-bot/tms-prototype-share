<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
  current: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },
})
const emit = defineEmits(['change'])

const pageItems = computed(() => {
  // 设计稿形态：1 2 3 4 5 6 … 105
  const items = []
  const max = props.pages
  const head = [1, 2, 3, 4, 5, 6]
  head.forEach(p => { if (p <= max) items.push(p) })
  if (max > 6) {
    items.push('…')
    items.push(max)
  }
  return items
})

function go(p) {
  if (p === '…' || p === props.current || p < 1 || p > props.pages) return
  emit('change', p)
}
function prev() { go(props.current - 1) }
function next() { go(props.current + 1) }
</script>

<template>
  <div class="plan-pagination">
    <span class="pp-total">共{{ total }}条</span>
    <span class="pp-size">{{ pageSize }}条/页 <i class="pp-caret">▾</i></span>

    <button type="button" class="pp-arrow" :disabled="current <= 1" @click="prev">‹</button>
    <button
      v-for="(p, i) in pageItems"
      :key="i"
      type="button"
      class="pp-page"
      :class="{ active: p === current, ellipsis: p === '…' }"
      @click="go(p)"
    >{{ p }}</button>
    <button type="button" class="pp-arrow" :disabled="current >= pages" @click="next">›</button>

    <span class="pp-jump-label">到第</span>
    <input class="pp-jump-input" type="text" :value="current" readonly />
    <span class="pp-jump-label">页</span>
  </div>
</template>
