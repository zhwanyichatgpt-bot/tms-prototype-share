<script setup>
/**
 * 运输任务筛选区：搜索框 + 业务/调度类型 + 装货时间 + 发货/卸货地址 + 更多 + 搜索按钮。
 * 占位与展示与验收页面一致；下拉为原型的静态展示态。
 */
const emit = defineEmits(['search', 'more', 'reset'])
</script>

<template>
  <div class="tt-filterbar">
    <label class="tt-searchbox tt-filter-field">
      <svg class="tt-searchbox-icon" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="#9a9da6" stroke-width="1.5"/>
        <path d="M11 11L15 15" stroke="#9a9da6" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input class="tt-searchbox-input" aria-label="任务单号" placeholder="输入任务单号搜索" />
    </label>

    <button type="button" class="tt-filter-item tt-filter-business">
      <span>业务类型</span>
      <svg class="tt-filter-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
    <button type="button" class="tt-filter-item tt-filter-schedule">
      <span>调度类型</span>
      <svg class="tt-filter-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>

    <button type="button" class="tt-filter-item tt-filter-time">
      <span>装货时间</span>
      <svg class="tt-filter-calendar" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3.5" width="12" height="10.5" rx="1" stroke="#3d4050" />
        <path d="M2 6.5H14M5 2V5M11 2V5" stroke="#3d4050" stroke-linecap="round" />
      </svg>
      <span class="tt-filter-time-ph">请选择开始时间</span>
      <span class="tt-filter-time-sep">—</span>
      <span class="tt-filter-time-ph">请选择结束时间</span>
      <svg class="tt-filter-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>

    <label class="tt-filter-item tt-filter-address">
      <span>发货地址</span>
      <input class="tt-filter-address-input" aria-label="发货地址" placeholder="输入发货地址" />
    </label>
    <label class="tt-filter-item tt-filter-address tt-filter-address-to">
      <span>卸货地址</span>
      <input class="tt-filter-address-input" aria-label="卸货地址" placeholder="输入发货地址" />
    </label>

    <button type="button" class="tt-filter-more" @click="emit('more')"><span aria-hidden="true">⌄</span>更多</button>
    <button type="button" class="tt-filter-reset" aria-label="重置" @click="emit('reset')">↻</button>
    <button type="button" class="tt-filter-submit" @click="emit('search')">搜索</button>
  </div>
</template>
