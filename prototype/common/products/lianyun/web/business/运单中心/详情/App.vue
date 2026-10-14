<script setup>
/**
 * 运单详情 —— 页面主入口（内容页，不含 TMS 系统框架）
 * 需求归属：common；所属项目：null；研发版本：pending
 * 布局：面包屑 + 左侧信息列 + 地图区 + 费用区。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetailHeader from './components/DetailHeader.vue'
import DetailLeftPanel from './components/DetailLeftPanel.vue'
import DetailMap from './components/DetailMap.vue'
import DetailFees from './components/DetailFees.vue'
import { getWaybillDetail } from './mock-data'
import './waybill-detail.css'

const route = useRoute()
const router = useRouter()

/* 运单标识：列表点击「详情」时携带 */
const waybillKey = computed(() => route.query.key || 'wb-0')
/* 页签参数（route/task） */
const initialTab = computed(() => route.query.tab || '')
const detail = computed(() => getWaybillDetail(waybillKey.value))

function handleBack() {
  router.push('/waybillCenter')
}
</script>

<template>
  <div class="waybill-detail-page">
    <DetailHeader parent-title="运单中心" page-title="运单详情" @back="handleBack" />

    <div class="wd-body">
      <DetailLeftPanel :waybill-key="waybillKey" :initial-tab="initialTab" />
      <div class="wd-right">
        <DetailMap :waybill-key="waybillKey" />
        <DetailFees v-if="!detail.containerManifest" :waybill-key="waybillKey" />
      </div>
    </div>
  </div>
</template>
