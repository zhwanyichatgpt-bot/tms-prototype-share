<script setup>
/**
 * 运单中心 —— 运单列表
 * 表头 + 行，行由 v-for 数据驱动；状态徽标与来源标签使用映射表。
 */
import { statusTone, sourceTone } from '../mock-data'

defineProps({
  rows: { type: Array, default: () => [] },
})
const emit = defineEmits(['action'])
</script>

<template>
  <div class="wc-table">
    <div class="wc-table-head">
      <span class="wc-col wc-col-check"><input type="checkbox" aria-label="全选" /></span>
      <span class="wc-col wc-col-seq">序号</span>
      <span class="wc-col wc-col-no">运单号</span>
      <span class="wc-col wc-col-status">状态</span>
      <span class="wc-col wc-col-biz">业务类型</span>
      <span class="wc-col wc-col-source">运单来源</span>
      <span class="wc-col wc-col-vehicle">车辆</span>
      <span class="wc-col wc-col-stops">装卸货信息</span>
      <span class="wc-col wc-col-waypoints">途经点</span>
      <span class="wc-col wc-col-cargo">货品/箱型</span>
      <span class="wc-col wc-col-dispatcher">派单人</span>
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
        <span class="wc-status-badge" :class="statusTone[row.status] || 'gray'">{{ row.statusLabel }}</span>
      </span>
      <span class="wc-col wc-col-biz">{{ row.bizType }}</span>
      <span class="wc-col wc-col-source">
        <span class="wc-source-tag" :class="sourceTone[row.source] || 'gray'">{{ row.source }}</span>
      </span>
      <span class="wc-col wc-col-vehicle">
        <span class="wc-vehicle-icon" aria-hidden="true" />
        <span class="wc-vehicle-text">
          <span class="wc-vehicle-plate">{{ row.vehicle.plate }}</span>
          <span class="wc-vehicle-driver">主驾 {{ row.vehicle.driver }}</span>
        </span>
      </span>
      <span class="wc-col wc-col-stops">
        <span v-for="(stop, i) in row.stops" :key="i" class="wc-stop">
          <i class="wc-stop-dot" :class="i === 0 ? 'start' : 'end'" aria-hidden="true" />
          <span class="wc-stop-name">{{ stop.name }}</span>
          <span class="wc-stop-time">{{ stop.time }}</span>
        </span>
      </span>
      <span class="wc-col wc-col-waypoints">{{ row.waypoints }}</span>
      <span class="wc-col wc-col-cargo">{{ row.cargoCount }}</span>
      <span class="wc-col wc-col-dispatcher">{{ row.dispatcher }}</span>
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
  </div>
</template>
