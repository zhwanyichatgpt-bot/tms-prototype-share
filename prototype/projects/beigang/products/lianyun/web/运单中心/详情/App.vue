<script setup>
/**
 * 北港运单详情 —— 页面主入口（内容页，不含 TMS 系统框架）
 * 需求归属：project；所属项目：beigang；研发版本：TMS-BEIGANG-202608-02（北港1.0.3.5版本）
 * 布局：面包屑 + 左侧信息列 + 地图区 + 费用区。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import DetailHeader from './components/DetailHeader.vue'
import DetailLeftPanel from './components/DetailLeftPanel.vue'
import DetailMap from './components/DetailMap.vue'
import DetailFees from './components/DetailFees.vue'
import './waybill-detail.css'

const route = useRoute()
const router = useRouter()

/* 运单标识：列表点击“详情/查看变更”时携带，保证详情与列表同一张运单 */
const waybillKey = computed(() => route.query.key || 'wb-0')
/* 页签：查看变更时直接定位到地址变更页签 */
const initialTab = computed(() => route.query.tab || '')

function handleBack() {
  /* 返回列表：版本感知导航，保留当前 versionId */
  openPrototypePage(router, route, 'waybillCenterBeigang')
}
</script>

<template>
  <div class="waybill-detail-page">
    <DetailHeader parent-title="运单中心" page-title="运单详情" @back="handleBack" />

    <div class="wd-body">
      <DetailLeftPanel :waybill-key="waybillKey" :initial-tab="initialTab" />
      <div class="wd-right">
        <DetailMap :waybill-key="waybillKey" />
        <DetailFees :waybill-key="waybillKey" />
      </div>
    </div>
  </div>
</template>
