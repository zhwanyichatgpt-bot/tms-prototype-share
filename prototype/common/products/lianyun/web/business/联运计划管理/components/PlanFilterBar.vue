<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['search', 'reset'])

const filters = reactive({
  keyword: '',
  startTime: '',
  endTime: '',
  creator: '',
})

function onSearch() {
  emit('search', { ...filters })
}
function onReset() {
  filters.keyword = ''
  filters.startTime = ''
  filters.endTime = ''
  filters.creator = ''
  emit('reset')
}
</script>

<template>
  <div class="plan-filter-bar">
    <label class="pf-field pf-keyword">
      <span class="pf-search-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="#909499" stroke-width="1.3" />
          <path d="M9.5 9.5L12.5 12.5" stroke="#909499" stroke-width="1.3" stroke-linecap="round" />
        </svg>
      </span>
      <input v-model="filters.keyword" class="pf-input" type="text" placeholder="输入计划名称/编号搜索" @keyup.enter="onSearch" />
    </label>

    <label class="pf-field pf-select">
      <select v-model="filters.creator" class="pf-select-control">
        <option value="">创建时间</option>
        <option value="today">今天</option>
        <option value="week">本周</option>
        <option value="month">本月</option>
      </select>
      <span class="pf-caret" aria-hidden="true">▾</span>
    </label>

    <div class="pf-field pf-range">
      <span class="pf-cal-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="#909499" stroke-width="1.2" />
          <path d="M1 5.5h12M4.5 1v2M9.5 1v2" stroke="#909499" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </span>
      <input v-model="filters.startTime" class="pf-input pf-time" type="text" placeholder="请选择开始时间" />
      <span class="pf-range-sep">→</span>
      <input v-model="filters.endTime" class="pf-input pf-time" type="text" placeholder="请选择结束时间" />
    </div>

    <label class="pf-field pf-select">
      <select v-model="filters.creator" class="pf-select-control">
        <option value="">创建人</option>
        <option value="花同学">花同学</option>
      </select>
      <span class="pf-caret" aria-hidden="true">▾</span>
    </label>

    <div class="pf-actions">
      <button type="button" class="pf-reset-btn" title="重置" @click="onReset">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2v3h-3" stroke="#3D4050" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button type="button" class="pf-search-btn" @click="onSearch">搜索</button>
    </div>
  </div>
</template>
