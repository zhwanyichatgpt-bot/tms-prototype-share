<script setup>
import { ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits([
  'terminate',
  'print',
  'copy-contact',
  'view-loss-template',
  'view-attachment',
])

const goodsExpanded = ref({
  0: true,
  1: false,
})

function toggleGoods(idx) {
  goodsExpanded.value[idx] = !goodsExpanded.value[idx]
}
</script>

<template>
  <div class="waybill-left-panel">
    <!-- 1. 顶部单号、状态与操作按钮 -->
    <div class="panel-header-section">
      <div class="header-id-row">
        <span class="waybill-no">{{ data.id }}</span>
        <span class="waybill-status-badge">{{ data.statusText || '待执行' }}</span>
      </div>

      <div class="header-tag-row">
        <span class="waybill-type-tag">{{ data.typeTag || '公开托运' }}</span>
      </div>

      <div class="meta-create-time">
        创建时间：{{ data.createTime }} （{{ data.creator }}）
      </div>

      <!-- 80x28 尺寸的终止与打印按钮 -->
      <div class="header-btn-row">
        <button type="button" class="btn-action-sm btn-terminate" @click="emit('terminate')">
          终止
        </button>
        <button type="button" class="btn-action-sm btn-print" @click="emit('print')">
          打印
        </button>
      </div>
    </div>

    <!-- 2. 托运信息卡片 -->
    <div v-if="data.shipperInfo" class="panel-card">
      <div class="card-title">托运信息</div>
      <div class="card-field-row">
        <span class="field-label">托运企业：</span>
        <span class="field-value">{{ data.shipperInfo.company }}</span>
      </div>
      <div class="card-field-row">
        <span class="field-label">联系人：</span>
        <span class="field-value">{{ data.shipperInfo.contact }}</span>
        <svg
          class="copy-icon"
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          @click="emit('copy-contact')"
        >
          <rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="#909399" stroke-width="1.1" />
          <path d="M8.5 4.5V2.5C8.5 1.94772 8.05228 1.5 7.5 1.5H2.5C1.94772 1.5 1.5 1.94772 1.5 2.5V7.5C1.5 8.05228 1.94772 8.5 2.5 8.5H4.5" stroke="#909399" stroke-width="1.1" />
        </svg>
      </div>
      <div class="card-field-row">
        <span class="field-label">备注：</span>
        <span class="field-value remark-value">{{ data.shipperInfo.remark }}</span>
      </div>
    </div>

    <!-- 3. 费用信息卡片 -->
    <div v-if="data.costInfo" class="panel-card">
      <div class="card-title">费用信息</div>
      <div class="cost-item-row">
        <span class="field-label">基础运费：</span>
        <span class="cost-amount-num">{{ data.costInfo.baseFreight }}</span>
        <span class="cost-unit">元</span>
        <span class="cost-tags">
          <span v-for="(tag, tIdx) in (data.costInfo.tags || ['含税', '单位计费'])" :key="tIdx" class="cost-badge">{{ tag }}</span>
        </span>
      </div>
      <div class="card-field-row">
        <span class="field-label">计费条件：</span>
        <span class="field-value">{{ data.costInfo.rule }}</span>
      </div>
      <div class="cost-item-row">
        <span class="field-label">付款类型：</span>
        <span class="cost-amount-num">{{ data.costInfo.payTypeAmount }}</span>
        <span class="cost-unit">元</span>
        <span class="cost-tags">
          <span class="cost-badge">{{ data.costInfo.payTypeTag }}</span>
        </span>
      </div>
      <div class="card-field-row">
        <span class="field-label">付款方式：</span>
        <span class="field-value">{{ data.costInfo.payMethod }}</span>
      </div>
      <div class="card-field-row">
        <span class="field-label">路耗模版：</span>
        <span class="field-value">{{ data.costInfo.lossTemplate }}</span>
        <button type="button" class="btn-link-action" @click="emit('view-loss-template')">查看</button>
      </div>

      <!-- 结算三列卡片 -->
      <div class="settlement-grid">
        <div
          v-for="(item, sIdx) in (data.costInfo.settlementSummary || [])"
          :key="sIdx"
          class="settle-box"
        >
          <div class="settle-amount">
            <span class="num">{{ item.amount }}</span>
            <span class="unit">{{ item.unit }}</span>
          </div>
          <div class="settle-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <!-- 4. 货品信息卡片 -->
    <div v-if="data.goodsList" class="panel-card">
      <div class="card-title">货品信息</div>
      <div class="goods-list">
        <div
          v-for="(item, idx) in data.goodsList"
          :key="idx"
          class="goods-item"
        >
          <div class="goods-item-header" @click="toggleGoods(idx)">
            <svg class="goods-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L12 4.2V9.8L7 12.5L2 9.8V4.2L7 1.5Z" stroke="#8a532d" stroke-width="1.1" fill="#fcf6ec" />
              <path d="M7 1.5V12.5M2 4.2L7 7L12 4.2" stroke="#8a532d" stroke-width="1.1" />
            </svg>
            <span class="goods-name">{{ item.name }}</span>
            <span class="goods-spec">{{ item.spec }}</span>
            <span class="goods-arrow" :class="{ open: goodsExpanded[idx] }">▼</span>
          </div>

          <div v-if="goodsExpanded[idx] && item.fields && item.fields.length" class="goods-item-body">
            <div
              v-for="(field, fIdx) in item.fields"
              :key="fIdx"
              class="goods-prop-row"
            >
              <span class="prop-label">{{ field.label }}</span>
              <span class="prop-value">{{ field.value }}</span>
            </div>
            <div v-if="item.remark" class="goods-prop-row goods-remark-row">
              <span class="prop-label">备注：</span>
              <span class="prop-value">{{ item.remark }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 附件卡片 -->
    <div v-if="data.attachments" class="panel-card">
      <div class="card-title">附件 {{ data.attachments.length }}</div>
      <div class="attachment-list">
        <div
          v-for="(att, idx) in data.attachments"
          :key="idx"
          class="attachment-item"
          @click="emit('view-attachment', att)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2H9L12 5V12H3V2Z" stroke="#3a65ff" stroke-width="1.1" fill="#f0f4ff" />
            <path d="M8.5 2V5.5H12" stroke="#3a65ff" stroke-width="1.1" />
          </svg>
          <span>{{ att.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
