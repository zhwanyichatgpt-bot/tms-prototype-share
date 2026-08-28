<script setup>
import { ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits(['create-plan', 'relate-plan'])

const segmentExpanded = ref({
  'seg-1': true,
  'seg-1-detail': true,
  'seg-3': false,
  'seg-4': true,
})

function toggleSegment(id) {
  segmentExpanded.value[id] = !segmentExpanded.value[id]
}
</script>

<template>
  <div class="waybill-segments-col">
    <!-- 路段 1：装卸进度 -->
    <div class="segment-card">
      <div class="seg-card-header" @click="toggleSegment('seg-1')">
        <span class="seg-arrow" :class="{ open: segmentExpanded['seg-1'] }">▼</span>
        <span class="seg-title">路段1</span>
        <span class="seg-mode-badge mode-truck">汽运</span>
        <span class="seg-cargo-badge">散杂货</span>
        <span class="seg-current-stage-tag">当前阶段</span>
      </div>
      <div v-if="segmentExpanded['seg-1']" class="seg-card-body">
        <div class="seg-section-title">装卸进度</div>
        <div class="seg-progress-row">
          <span class="seg-icon-sign sign-load">装</span>
          <span class="progress-info-text">
            已装 75 <i class="detail-paren">（数量50件+数量25吨）</i>
          </span>
          <span class="progress-percent">50%</span>
        </div>
        <div class="progress-track-bar">
          <div class="progress-fill" style="width: 50%;" />
        </div>
        <div class="seg-total-desc">
          总量：100吨  |  已完成：50吨  |  剩余：50吨
        </div>
      </div>
    </div>

    <!-- 路段 1：详细路线与指标网格 -->
    <div class="segment-card">
      <div class="seg-card-header" @click="toggleSegment('seg-1-detail')">
        <span class="seg-arrow" :class="{ open: segmentExpanded['seg-1-detail'] }">▼</span>
        <span class="seg-title">路段1</span>
        <span class="seg-mode-badge mode-truck">汽运</span>
        <span class="seg-cargo-badge">散杂货</span>
        <span class="header-progress-inline">
          <span class="pct">50%</span>
          <div class="mini-bar"><div class="mini-fill" style="width: 50%;" /></div>
        </span>
      </div>
      <div v-if="segmentExpanded['seg-1-detail']" class="seg-card-body">
        <!-- 装货点 -->
        <div class="route-point-row">
          <span class="route-sign-badge load">装</span>
          <div class="route-point-main">
            <div class="route-city-time">
              <span class="city">辽宁 朝阳</span>
              <span class="time">装货时间：2025-03-02 08:00</span>
            </div>
            <div class="route-address">北票市龙潭镇马架子村幸福路123号</div>
          </div>
        </div>

        <!-- 卸货点 -->
        <div class="route-point-row">
          <span class="route-sign-badge unload">卸</span>
          <div class="route-point-main">
            <div class="route-city-time">
              <span class="city">福州 台江</span>
              <span class="time">卸货时间：2025-03-02 08:00</span>
            </div>
            <div class="route-address">好运街道野姜花路1号</div>
          </div>
        </div>

        <!-- 数据指标网格 -->
        <div class="metrics-grid">
          <div class="metric-cell"><div class="val">50</div><div class="lbl">总量</div></div>
          <div class="metric-cell"><div class="val">20</div><div class="lbl">余量</div></div>
          <div class="metric-cell"><div class="val">10</div><div class="lbl">已接单量</div></div>
          <div class="metric-cell"><div class="val">10</div><div class="lbl">可接单量</div></div>
          <div class="metric-cell"><div class="val">50</div><div class="lbl">在途</div></div>
          <div class="metric-cell"><div class="val">20</div><div class="lbl">已卸货</div></div>
          <div class="metric-cell"><div class="val">10</div><div class="lbl">路耗</div></div>
        </div>
      </div>
    </div>

    <!-- 路段 3：水运 -->
    <div class="segment-card">
      <div class="seg-card-header" @click="toggleSegment('seg-3')">
        <span class="seg-arrow" :class="{ open: segmentExpanded['seg-3'] }">
          {{ segmentExpanded['seg-3'] ? '▼' : '▶' }}
        </span>
        <span class="seg-title">路段3</span>
        <span class="seg-mode-badge mode-ship">水运</span>
        <span class="seg-cargo-badge">集装箱</span>
      </div>
      <div v-if="segmentExpanded['seg-3']" class="seg-card-body">
        <div class="seg-section-title">装卸进度</div>
        <div class="seg-progress-row">
          <span class="seg-icon-sign sign-load">装</span>
          <span class="progress-info-text">
            已装 75 <i class="detail-paren">（数量50件+数量25吨）</i>
          </span>
          <span class="progress-percent">50%</span>
        </div>
        <div class="progress-track-bar">
          <div class="progress-fill" style="width: 50%;" />
        </div>
        <div class="seg-total-desc">
          集装箱：10个  |  已装：5个  |  已卸：5个
        </div>
      </div>
    </div>

    <!-- 路段 4：铁路与新建/关联操作 -->
    <div class="segment-card">
      <div class="seg-card-header" @click="toggleSegment('seg-4')">
        <span class="seg-arrow" :class="{ open: segmentExpanded['seg-4'] }">▼</span>
        <span class="seg-title">路段4</span>
        <span class="seg-mode-badge mode-train">铁路</span>
        <span class="seg-cargo-badge">集装箱</span>
      </div>
    </div>
  </div>
</template>
