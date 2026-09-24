<script setup>
/**
 * 运单中心 —— 分页
 */
const props = defineProps({
  current: { type: Number, default: 1 },
  meta: {
    type: Object,
    default: () => ({ totalText: '共 0 条', pageSizeText: '10条/页', pageCount: 1 }),
  },
})
const emit = defineEmits(['change'])

function pageList() {
  return Array.from({ length: props.meta.pageCount }, (_, i) => i + 1)
}
</script>

<template>
  <div class="wc-pagination">
    <span class="wc-pagination-total">{{ meta.totalText }}</span>
    <span class="wc-pagination-size">{{ meta.pageSizeText }}</span>
    <button type="button" class="wc-pagination-arrow" aria-label="上一页" @click="current > 1 && emit('change', current - 1)">‹</button>
    <div class="wc-pagination-pages">
      <button
        v-for="page in pageList()"
        :key="page"
        type="button"
        class="wc-pagination-page"
        :class="{ active: page === current }"
        @click="emit('change', page)"
      >{{ page }}</button>
    </div>
    <button type="button" class="wc-pagination-arrow" aria-label="下一页" @click="emit('change', current + 1)">›</button>
    <span class="wc-pagination-jump">前往</span>
    <input class="wc-pagination-input" :value="current" aria-label="跳转页码" />
    <span class="wc-pagination-jump">页</span>
  </div>
</template>
