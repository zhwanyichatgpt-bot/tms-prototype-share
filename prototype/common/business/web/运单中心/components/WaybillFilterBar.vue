<script setup>
/**
 * 运单中心 —— 筛选栏
 * 运单号 / 接单时间 / 车牌号 / 运单来源 / 司机 / 重置 / 搜索。
 * 占位与展示与设计截图一致；下拉为原型的静态展示态。
 */
const emit = defineEmits(['search', 'reset'])
</script>

<template>
  <div class="wc-filterbar">
    <label class="wc-searchbox wc-filter-field">
      <svg class="wc-searchbox-icon" width="16" height="16" viewBox="0 0 17 17" fill="none" aria-hidden="true">
        <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="#9a9da6" stroke-width="1.5"/>
        <path d="M11 11L15 15" stroke="#9a9da6" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input class="wc-searchbox-input" aria-label="运单号" placeholder="请输入运单号" />
    </label>

    <button type="button" class="wc-filter-item wc-filter-timefield">
      <span>接单时间</span>
      <svg class="wc-filter-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
    <div class="wc-filter-item wc-filter-timerange">
      <svg class="wc-filter-calendar" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3.5" width="12" height="10.5" rx="1" stroke="#3d4050"/>
        <path d="M2 6.5H14M5 2V5M11 2V5" stroke="#3d4050" stroke-linecap="round"/>
      </svg>
      <span class="wc-filter-time-val">2026-05-27 00:00:00</span>
      <span class="wc-filter-time-sep">—</span>
      <span class="wc-filter-time-val">2026-08-25 23:59:59</span>
    </div>

    <button type="button" class="wc-filter-item wc-filter-plate">
      <span class="wc-filter-ph">车牌号</span>
      <span class="wc-filter-ph-input">请输入车牌号</span>
    </button>

    <button type="button" class="wc-filter-item wc-filter-source">
      <span class="wc-filter-ph">运单来源</span>
      <svg class="wc-filter-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>

    <button type="button" class="wc-filter-item wc-filter-driver">
      <span class="wc-filter-ph">司机</span>
      <svg class="wc-filter-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1L5 5L9 1" stroke="#999" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>

    <button type="button" class="wc-filter-reset" aria-label="重置" @click="emit('reset')">↻</button>
    <button type="button" class="wc-filter-submit" @click="emit('search')">搜索</button>
  </div>
</template>
