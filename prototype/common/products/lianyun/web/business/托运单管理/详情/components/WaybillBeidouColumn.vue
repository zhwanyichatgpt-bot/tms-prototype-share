<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits([
  'waybill-type-change',
  'search-waybill',
  'view-voucher',
])

const activeWaybillTab = ref('truck')
const waybillSearchKey = ref('')

const waybillTabs = computed(() => props.data.beidouQuery.waybillTabs || [])
</script>

<template>
  <div class="waybill-beidou-col">
    <div class="beidou-header">
      <span class="beidou-title">北斗轨迹查询</span>
      <span class="beidou-remain">剩余查询次数{{ data.beidouQuery.remainCount }}次</span>
    </div>

    <!-- 消耗提醒框 -->
    <div class="beidou-notice-box">
      <svg class="notice-pin-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5C2.5 7.125 6 11 6 11C6 11 9.5 7.125 9.5 4.5C9.5 2.567 7.933 1 6 1ZM6 5.75C5.31 5.75 4.75 5.19 4.75 4.5C4.75 3.81 5.31 3.25 6 3.25C6.69 3.25 7.25 3.81 7.25 4.5C7.25 5.19 6.69 5.75 6 5.75Z" fill="#3a65ff" />
      </svg>
      <span class="notice-text">本次查询将消耗次数 {{ data.beidouQuery.consumeCount }}</span>
      <span class="notice-links">
        <a href="javascript:;" class="link-rule">规则</a>
        <span class="sep">|</span>
        <a href="javascript:;" class="link-buy">购买次数</a>
      </span>
    </div>

    <!-- 运单类型切换 -->
    <div class="waybill-type-tabs">
      <button
        v-for="t in waybillTabs"
        :key="t.key"
        type="button"
        class="type-tab-btn"
        :class="{ active: activeWaybillTab === t.key }"
        @click="activeWaybillTab = t.key; emit('waybill-type-change', t.key)"
      >
        <span class="type-tab-label">{{ t.label }}</span>
        <span v-if="activeWaybillTab === t.key" class="type-tab-underline" />
      </button>
    </div>

    <!-- 运单搜索框 -->
    <div class="waybill-search-box">
      <svg class="search-svg-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M5.5 10C7.98528 10 10 7.98528 10 5.5C10 3.01472 7.98528 1 5.5 1C3.01472 1 1 3.01472 1 5.5C1 7.98528 3.01472 10 5.5 10Z" stroke="#909399" stroke-width="1.2" />
        <path d="M8.8 8.8L12 12" stroke="#909399" stroke-width="1.2" stroke-linecap="round" />
      </svg>
      <input
        type="text"
        class="search-input"
        v-model="waybillSearchKey"
        placeholder="输入运单号/车牌号/司机姓名/手机号"
        @keyup.enter="emit('search-waybill', waybillSearchKey)"
      />
    </div>

    <!-- 运单卡片列表 -->
    <div class="waybill-card-list">
      <div
        v-for="(wb, idx) in data.beidouQuery.waybillList"
        :key="idx"
        class="waybill-card-item"
      >
        <div class="wb-card-header">
          <span class="wb-no">{{ wb.id }}</span>
          <span class="wb-status">{{ wb.status }}</span>
          <span class="wb-voucher-link" @click="emit('view-voucher', wb)">凭证 &gt;</span>
        </div>
        <div class="wb-driver-row">
          {{ wb.truck }}  |  {{ wb.driver }}  |  {{ wb.phone }}
        </div>

        <!-- 时间轴状态节点 -->
        <div class="wb-timeline-flow">
          <div
            v-for="(node, nIdx) in wb.timeline"
            :key="nIdx"
            class="timeline-node"
            :class="{ active: node.active }"
          >
            <div class="node-date">{{ node.date }}</div>
            <div class="node-time">{{ node.time }}</div>
            <div class="node-dot-wrap">
              <span class="node-dot" />
              <span
                v-if="nIdx < wb.timeline.length - 1"
                class="node-line"
                :class="{ active: node.active && wb.timeline[nIdx + 1].active }"
              />
            </div>
            <div class="node-label">{{ node.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
