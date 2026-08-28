<script setup>
import { paginationMeta } from '../mock-data'

defineProps({
  current: { type: Number, default: 1 },
})
const emit = defineEmits(['change'])

function pageList() {
  return Array.from({ length: paginationMeta.pageCount }, (_, i) => i + 1)
}
</script>

<template>
  <div class="tt-pagination">
    <span class="tt-pagination-total">{{ paginationMeta.totalText }}</span>
    <span class="tt-pagination-size">{{ paginationMeta.pageSizeText }}</span>
    <button type="button" class="tt-pagination-arrow" aria-label="上一页" @click="current > 1 && emit('change', current - 1)">‹</button>
    <div class="tt-pagination-pages">
      <button
        v-for="page in pageList()"
        :key="page"
        type="button"
        class="tt-pagination-page"
        :class="{ active: page === current }"
        @click="emit('change', page)"
      >{{ page }}</button>
      <span class="tt-pagination-ellipsis">…</span>
      <span class="tt-pagination-page tt-pagination-page-static">105</span>
    </div>
    <button type="button" class="tt-pagination-arrow" aria-label="下一页" @click="emit('change', current + 1)">›</button>
    <span class="tt-pagination-jump">到第</span>
    <input class="tt-pagination-input" :value="current" aria-label="跳转页码" />
    <span class="tt-pagination-jump">页</span>
  </div>
</template>
