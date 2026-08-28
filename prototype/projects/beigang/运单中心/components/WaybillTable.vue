<script setup>
/**
 * 运单中心 —— 运单列表
 * 表头 + 行，行由 v-for 数据驱动；状态徽标与来源标签使用映射表。
 * 地址变更：仅已接单/运输中/有异常状态展示入口（PRD R05）。
 */
import { ref } from 'vue'
import { statusTone, sourceTone, ADDRESS_CHANGE_ALLOWED_STATUS, addressChangeStatusMeta } from '../mock-data'

defineProps({
  rows: { type: Array, default: () => [] },
})
const emit = defineEmits(['action'])

/* 「更多」展开状态：按运单 key 记录哪一行展开了更多操作 */
const expandedMoreKey = ref('')
function toggleMore(row) {
  expandedMoreKey.value = expandedMoreKey.value === row.key ? '' : row.key
}
function isMoreOpen(row) {
  return expandedMoreKey.value === row.key
}

/* 操作列固定顺序：详情 → 运单复核 → 地址变更；其余（标记异常）收进「更多」 */
const DIRECT_ACTIONS = ['详情', '运单复核']
const MORE_ACTIONS = ['标记异常']
function directActions(row) {
  return (row.actions || []).filter(a => DIRECT_ACTIONS.includes(a))
}
function moreActions(row) {
  return (row.actions || []).filter(a => MORE_ACTIONS.includes(a))
}

/* 是否实际承运商视角 */
function isActualCarrier(row) {
  return row.perspective === 'actualCarrier'
}

/* 允许发起（合同承运商）：状态符合 + 无处理中申请；实际承运商不发起 */
function canAddressChange(row) {
  return !isActualCarrier(row) && ADDRESS_CHANGE_ALLOWED_STATUS.includes(row.status) && !row.changeStatus
}

/* 处理中申请：显示「地址变更」标识 */
function hasProcessing(row) {
  return !!row.changeStatus
}
function changeStatusTone(row) {
  return addressChangeStatusMeta[row.changeStatus]?.tone || 'gray'
}
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
      <span class="wc-col wc-col-actions annot-waybill-center-beigang-rule-list-entry">操作</span>
    </div>

    <div v-for="row in rows" :key="row.key" class="wc-table-row">
      <span class="wc-col wc-col-check"><input type="checkbox" :aria-label="`选择运单 ${row.waybillNo}`" /></span>
      <span class="wc-col wc-col-seq">{{ row.seq }}</span>
      <span class="wc-col wc-col-no">
        <span class="wc-no-icon" aria-hidden="true" />
        <span class="wc-no-text">
          <span class="wc-no-value">{{ row.waybillNo }}</span>
          <span class="wc-no-time">接单：{{ row.acceptTime }}</span>
          <span
            v-if="hasProcessing(row)"
            class="wc-ac-flag"
            :class="changeStatusTone(row)"
            title="该运单存在处理中地址变更申请"
          >地址变更</span>
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
        <!-- 固定顺序：详情 → 运单复核 -->
        <button
          v-for="action in directActions(row)"
          :key="action"
          type="button"
          class="wc-action"
          @click="emit('action', { row, action })"
        >{{ action }}</button>
        <!-- 地址变更：仅无进行中地址变更、可发起时展示；已有进行中变更不展示，避免误跳详情 -->
        <button
          v-if="canAddressChange(row)"
          type="button"
          class="wc-action wc-action-address"
          @click="emit('action', { row, action: '地址变更' })"
        >地址变更</button>
        <!-- 更多：标记异常等收起 -->
        <span v-if="moreActions(row).length" class="wc-action-more-wrap">
          <button
            type="button"
            class="wc-action wc-action-more"
            :class="{ open: isMoreOpen(row) }"
            @click="toggleMore(row)"
          >更多</button>
          <span v-if="isMoreOpen(row)" class="wc-action-more-panel">
            <button
              v-for="action in moreActions(row)"
              :key="action"
              type="button"
              class="wc-action-more-item"
              @click="emit('action', { row, action }); toggleMore(row)"
            >{{ action }}</button>
          </span>
        </span>
      </span>
    </div>
  </div>
</template>
