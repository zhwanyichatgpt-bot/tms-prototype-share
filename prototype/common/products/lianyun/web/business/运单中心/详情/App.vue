<script setup>
/**
 * 运单详情 —— 页面主入口（内容页，不含 TMS 系统框架）
 * 需求归属：common；所属项目：null；研发版本：pending
 * 布局：面包屑 + 左侧信息列 + 地图区 + 费用区。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElDescriptions, ElDescriptionsItem } from 'element-plus'
import DetailHeader from './components/DetailHeader.vue'
import DetailLeftPanel from './components/DetailLeftPanel.vue'
import DetailMap from './components/DetailMap.vue'
import DetailFees from './components/DetailFees.vue'
import { getWaybillDetail, waybillDetail } from './mock-data'
import { transportModeMeta, waybillRows } from '../mock-data.js'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import './waybill-detail.css'

const route = useRoute()
const router = useRouter()

/* 运单标识：列表点击「详情」时携带 */
const waybillKey = computed(() => route.query.key || 'wb-0')
/* 页签参数（route/task） */
const initialTab = computed(() => route.query.tab || '')
const detail = computed(() => getWaybillDetail(waybillKey.value))
const summary = computed(() => {
  if (detail.value !== waybillDetail) return null
  return waybillRows.find(row => row.key === waybillKey.value)
})

function handleBack() {
  openPrototypePage(router, route, 'waybillCenter')
}
</script>

<template>
  <div class="waybill-detail-page">
    <DetailHeader parent-title="运单中心" page-title="运单详情" @back="handleBack" />

    <section v-if="summary" class="wd-summary" aria-label="运单信息">
      <ElDescriptions title="运单信息" :column="2" border>
        <ElDescriptionsItem label="运单号">{{ summary.waybillNo }}</ElDescriptionsItem>
        <ElDescriptionsItem label="运单状态">{{ summary.statusLabel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="接单时间">{{ summary.acceptTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="运单来源">{{ summary.source }}</ElDescriptionsItem>
        <ElDescriptionsItem :label="transportModeMeta[summary.transportMode].resourceLabel">
          {{ summary.resource.primary }} · {{ summary.resource.secondary }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="业务类型">{{ summary.bizType }}</ElDescriptionsItem>
        <ElDescriptionsItem label="起点">{{ summary.stops[0].name }}</ElDescriptionsItem>
        <ElDescriptionsItem label="终点">{{ summary.stops[1].name }}</ElDescriptionsItem>
      </ElDescriptions>
    </section>
    <div v-else class="wd-body">
      <DetailLeftPanel :waybill-key="waybillKey" :initial-tab="initialTab" />
      <div class="wd-right">
        <DetailMap :waybill-key="waybillKey" />
        <DetailFees v-if="!detail.containerManifest" :waybill-key="waybillKey" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wd-summary {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0 24px 24px;
  padding: 20px;
  border: 1px solid #e1e5f2;
  border-radius: 8px;
  background: #fff;
}
</style>
