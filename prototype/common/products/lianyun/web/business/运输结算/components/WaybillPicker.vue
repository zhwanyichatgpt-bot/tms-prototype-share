<script setup>
/**
 * 待核算运单选择 —— 复刻真实系统“添加核算运单”右侧覆盖层
 */
const emit = defineEmits(['close'])

const asset = (name) => `/transport-settlement-assets/${name}`
</script>

<template>
  <div class="ts-picker">
    <div class="ts-picker-head">
      <span class="ts-picker-title">待核算运单</span>
      <button class="ts-close" type="button" @click="emit('close')">×</button>
    </div>

    <div class="ts-picker-filters">
      <div class="ts-picker-search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="#c0c4cc" stroke-width="1.4" />
          <path d="M11 11L14 14" stroke="#c0c4cc" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <input placeholder="请输入运单号搜索" />
      </div>

      <div class="ts-picker-group" style="width: 286px">
        <span>计划名称</span>
        <input placeholder="请输入计划名称/单号..." />
      </div>

      <div class="ts-picker-group" style="width: 305px">
        <span>任务运单号</span>
        <input placeholder="请输入运输任务运单号..." />
      </div>

      <div class="ts-picker-group" style="width: 420px">
        <span>接单日期</span>
        <input placeholder="开始日期" />
        <span class="ts-date-sep">-</span>
        <input placeholder="结束日期" />
      </div>

      <button class="ts-icon-btn" type="button" title="刷新">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.2 6.2A5.4 5.4 0 1 0 13.4 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          <path d="M13.6 2.6V6.4H9.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="ts-btn primary" type="button" style="width: 80px; height: 36px">搜索</button>
    </div>

    <table class="ts-picker-table">
      <colgroup>
        <col style="width: 50px" />
        <col style="width: 280px" />
        <col style="width: 150px" />
        <col style="width: 180px" />
        <col style="width: 130px" />
        <col style="width: 180px" />
        <col style="width: 180px" />
        <col style="width: 160px" />
        <col style="width: 160px" />
      </colgroup>
      <thead>
        <tr>
          <th><span class="ts-checkbox" /></th>
          <th>运单号</th>
          <th>运输类型</th>
          <th>实际承运商</th>
          <th>司机运费(元)</th>
          <th>任务运单号</th>
          <th>托运企业</th>
          <th>装货地</th>
          <th>装货时间</th>
        </tr>
      </thead>
    </table>

    <div class="ts-picker-empty">
      <img :src="asset('empty-box.png')" alt="" />
      <p>暂无数据</p>
    </div>

    <div class="ts-picker-footer">
      <span>已选运单:0条</span>
      <div class="ts-footer-actions">
        <button class="ts-btn default" type="button" @click="emit('close')">取消</button>
        <button class="ts-btn primary is-disabled" type="button" disabled>确认</button>
      </div>
    </div>
  </div>
</template>
