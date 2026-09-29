<script setup>
/**
 * 运单中心 —— 运单列表
 * 表头 + 行，主阶段、执行状态和当前企业财务进度分层展示。
 */
import { computed } from 'vue'
import { statusTone, sourceTone, transportModeMeta } from '../mock-data'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  transportMode: { type: String, default: 'truck' },
})
const emit = defineEmits(['action'])
const modeMeta = computed(() => transportModeMeta[props.transportMode] || transportModeMeta.truck)
</script>

<template>
  <div class="wc-table">
    <div class="wc-table-grid">
      <div class="wc-table-head">
      <span class="wc-col wc-col-check"><input type="checkbox" aria-label="全选" /></span>
      <span class="wc-col wc-col-seq">序号</span>
      <span class="wc-col wc-col-no">运单号</span>
      <span class="wc-col wc-col-status">当前阶段</span>
      <span class="wc-col wc-col-finance">结算状态</span>
      <span class="wc-col wc-col-biz">业务类型</span>
      <span class="wc-col wc-col-source">运单来源</span>
      <span class="wc-col wc-col-resource">{{ modeMeta.resourceLabel }}</span>
      <span class="wc-col wc-col-stops">{{ modeMeta.routeLabel }}</span>
      <span class="wc-col wc-col-actions">操作</span>
      </div>

      <div v-for="row in rows" :key="row.key" class="wc-table-row">
      <span class="wc-col wc-col-check"><input type="checkbox" :aria-label="`选择运单 ${row.waybillNo}`" /></span>
      <span class="wc-col wc-col-seq">{{ row.seq }}</span>
      <span class="wc-col wc-col-no">
        <span class="wc-no-icon" aria-hidden="true" />
          <span class="wc-no-text">
            <span class="wc-no-value">{{ row.waybillNo }}</span>
            <span class="wc-no-time">接单：{{ row.acceptTime }}</span>
          </span>
      </span>
      <span class="wc-col wc-col-status">
        <span class="wc-status-badge" :class="statusTone[row.stage] || 'gray'">{{ row.stageLabel }}</span>
      </span>
      <span class="wc-col wc-col-finance">
        <span v-for="line in row.financeLines" :key="line.label" class="wc-finance-line">
          <span class="wc-finance-label">{{ line.label }}</span>
          <strong class="wc-finance-value" :class="line.tone">{{ line.value }}</strong>
        </span>
      </span>
      <span class="wc-col wc-col-biz">{{ row.bizType }}</span>
      <span class="wc-col wc-col-source">
        <span class="wc-source-tag" :class="sourceTone[row.source] || 'gray'">{{ row.source }}</span>
      </span>
      <span class="wc-col wc-col-resource">
        <span class="wc-resource-icon" :class="`is-${row.transportMode}`" aria-hidden="true" />
        <span class="wc-resource-text">
          <span class="wc-resource-primary">{{ row.resource.primary }}</span>
          <span class="wc-resource-secondary">{{ row.resource.secondary }}</span>
        </span>
      </span>
      <span class="wc-col wc-col-stops">
        <span v-for="(stop, i) in row.stops" :key="i" class="wc-stop">
          <i class="wc-stop-dot" :class="i === 0 ? 'start' : 'end'" aria-hidden="true" />
          <span class="wc-stop-name">{{ stop.name }}</span>
          <span class="wc-stop-time">{{ stop.time }}</span>
        </span>
      </span>
      <span class="wc-col wc-col-actions">
        <button
          v-for="action in row.actions"
          :key="action"
          type="button"
          class="wc-action"
          @click="emit('action', { row, action })"
        >{{ action }}</button>
      </span>
      </div>
      <div v-if="rows.length === 0" class="wc-table-empty">暂无符合条件的运单</div>
    </div>
  </div>
</template>
