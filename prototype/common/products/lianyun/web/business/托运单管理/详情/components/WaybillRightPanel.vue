<script setup>
import { ref } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const emit = defineEmits([
  'tab-change',
  'view-mode-change',
  'waybill-type-change',
  'search-waybill',
  'create-plan',
  'relate-plan',
  'view-voucher',
])

// 选项卡与视图模式状态
const activeTab = ref('segments')
const activeViewMode = ref('multimodal')
const activeWaybillTab = ref(props.data.beidouQuery.activeWaybillTab || 'truck')
const waybillSearchKey = ref('')

// 图例状态
const legendStates = ref({
  inTransit: true,
  toLoad: true,
  unloaded: true,
})

// 路段卡片折叠展开状态
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
  <div class="waybill-right-panel">
    <!-- 顶部主选项卡栏 -->
    <div class="panel-top-tabs-bar">
      <div class="top-tabs-group">
        <button
          type="button"
          class="top-tab-btn"
          :class="{ active: activeTab === 'segments' }"
          @click="activeTab = 'segments'; emit('tab-change', 'segments')"
        >
          路段信息
        </button>
        <button
          type="button"
          class="top-tab-btn"
          :class="{ active: activeTab === 'settlement' }"
          @click="activeTab = 'settlement'; emit('tab-change', 'settlement')"
        >
          结算明细
        </button>
        <button
          type="button"
          class="top-tab-btn"
          :class="{ active: activeTab === 'process' }"
          @click="activeTab = 'process'; emit('tab-change', 'process')"
        >
          流程管理
        </button>
      </div>
    </div>

    <!-- 主展示区（1352 × 751 标准舞台） -->
    <div class="right-main-stage">
      <!-- 1. 底层：铺满全屏的中东部地理大地图 -->
      <div class="map-container">
        <!-- 华中/华东真实地理底图与城市点位 -->
        <div class="map-canvas-bg">
          <!-- 城市地名标注点（严格对照 Pixso 标注） -->
          <div class="map-city-mark p-zhengzhou"><span class="c-dot" />郑州</div>
          <div class="map-city-mark p-luoyang"><span class="c-dot" />洛阳</div>
          <div class="map-city-mark p-xuchang"><span class="c-dot" />许昌</div>
          <div class="map-city-mark p-zhoukou"><span class="c-dot" />周口</div>
          <div class="map-city-mark p-bozhou"><span class="c-dot" />亳州</div>
          <div class="map-city-mark p-lianyungang"><span class="c-dot" />连云港</div>
          <div class="map-city-mark p-huaian"><span class="c-dot" />淮安</div>
          <div class="map-city-mark p-yangzhou"><span class="c-dot" />扬州</div>
          <div class="map-city-mark p-zhenjiang"><span class="c-dot" />镇江</div>
          <div class="map-city-mark p-nanjing"><span class="c-dot" />南京</div>
          <div class="map-city-mark p-hefei"><span class="c-dot" />合肥</div>
          <div class="map-city-mark p-liuan"><span class="c-dot" />六安</div>
          <div class="map-city-mark p-wuhu"><span class="c-dot" />芜湖</div>
          <div class="map-city-mark p-chizhou"><span class="c-dot" />池州</div>
          <div class="map-city-mark p-tongling"><span class="c-dot" />铜陵</div>
          <div class="map-city-mark p-anqing"><span class="c-dot" />安庆</div>
          <div class="map-city-mark p-wuhan"><span class="c-dot" />武汉</div>
          <div class="map-city-mark p-huangshi"><span class="c-dot" />黄石</div>
          <div class="map-city-mark p-xianning"><span class="c-dot" />咸宁</div>
          <div class="map-city-mark p-jingdezhen"><span class="c-dot" />景德镇</div>
          <div class="map-city-mark p-huangshan"><span class="c-dot" />黄山</div>
          <div class="map-city-mark p-quzhou"><span class="c-dot" />衢州</div>
        </div>

        <!-- 线路视图切换胶囊 -->
        <div class="view-mode-capsule">
          <button
            type="button"
            class="capsule-btn"
            :class="{ active: activeViewMode === 'multimodal' }"
            @click="activeViewMode = 'multimodal'; emit('view-mode-change', 'multimodal')"
          >
            联运线路
          </button>
          <button
            type="button"
            class="capsule-btn"
            :class="{ active: activeViewMode === 'segment' }"
            @click="activeViewMode = 'segment'; emit('view-mode-change', 'segment')"
          >
            路段线路
          </button>
          <button
            type="button"
            class="capsule-btn"
            :class="{ active: activeViewMode === 'map' }"
            @click="activeViewMode = 'map'; emit('view-mode-change', 'map')"
          >
            地图视图
          </button>
        </div>

        <!-- 矢量联运路线 SVG（1:1 匹配 Pixso 路线走势） -->
        <svg class="map-routes-svg" viewBox="0 0 1352 751" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 1. 汽运段（草绿实线）: 阜阳站到鑫淮港口 -->
          <path
            d="M 536 220 L 542 258 L 610 236 L 668 206"
            stroke="#80d148"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 2. 水运段（蔚蓝实线）: 鑫淮港口沿长江水路到水转铁枢纽 -->
          <path
            d="M 668 206 L 730 228 L 795 248 L 788 322 L 728 360 L 678 375"
            stroke="#3a84ff"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- 3. 铁路段（双轨虚线）: 水转铁枢纽到九江站 -->
          <path
            d="M 678 375 L 670 435 L 632 505 L 602 565"
            stroke="#ffffff"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M 678 375 L 670 435 L 632 505 L 602 565"
            stroke="#5c6068"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="6 6"
          />
        </svg>

        <!-- 地图节点标注 -->
        <div class="map-overlay-elements">
          <!-- 阜阳站 -->
          <div class="map-pin pin-fuyang">
            <span class="pin-badge load-badge">装</span>
            <span class="pin-label">阜阳站</span>
          </div>

          <!-- 鑫淮港口浮层 -->
          <div class="map-popup-port">
            <div class="port-popup-header">
              <span class="port-name">鑫淮港口</span>
              <span class="port-tag tag-transfer">公转水</span>
              <span class="port-tag tag-bulk">散改集</span>
            </div>
            <div class="port-time-row">汽运装货时间：2024-9-3 12:00</div>
            <div class="port-time-row">水运装货时间：2024-9-3 12:00</div>
            <div class="port-cargo-grid">
              <div class="port-cargo-item">玉米：30吨</div>
              <div class="port-cargo-item">玉米：30吨</div>
              <div class="port-cargo-item full-row">集装箱：20GP | 30吨</div>
              <div class="port-cargo-item full-row">集装箱：40GP | 30吨</div>
            </div>
          </div>

          <!-- 水转铁节点 -->
          <div class="map-node-capsule node-transfer">
            <span>水转铁 | 集装箱</span>
          </div>

          <!-- 九江站 -->
          <div class="map-pin pin-jiujiang">
            <span class="pin-badge unload-badge">卸</span>
            <span class="pin-label">九江站</span>
          </div>

          <!-- 右下角警示图标 -->
          <div class="map-alert-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L26 24H2L14 3Z" fill="#ff4d4f" fill-opacity="0.2" stroke="#ff4d4f" stroke-width="1.5" stroke-linejoin="round" />
              <path d="M14 10V16M14 20H14.01" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
        </div>

        <!-- 底部图例开关 -->
        <div class="map-bottom-legend">
          <label class="legend-switch">
            <input type="checkbox" v-model="legendStates.inTransit" />
            <span class="switch-bullet active-blue" />
            <span class="switch-text">在途货品</span>
          </label>
          <label class="legend-switch">
            <input type="checkbox" v-model="legendStates.toLoad" />
            <span class="switch-bullet active-blue" />
            <span class="switch-text">待装货货品</span>
          </label>
          <label class="legend-switch">
            <input type="checkbox" v-model="legendStates.unloaded" />
            <span class="switch-bullet active-blue" />
            <span class="switch-text">已卸货货品</span>
          </label>
        </div>
      </div>

      <!-- 2. 左侧路段卡片流（悬浮在地图左侧，宽 260px） -->
      <div class="segments-floating-column">
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

        <!-- 路段 1：详细路线与指标 -->
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

        <!-- 路段 4：铁路与操作 -->
        <div class="segment-card">
          <div class="seg-card-header" @click="toggleSegment('seg-4')">
            <span class="seg-arrow" :class="{ open: segmentExpanded['seg-4'] }">▼</span>
            <span class="seg-title">路段4</span>
            <span class="seg-mode-badge mode-train">铁路</span>
            <span class="seg-cargo-badge">集装箱</span>
          </div>
          <div v-if="segmentExpanded['seg-4']" class="seg-card-body actions-body">
            <button type="button" class="btn-seg-action" @click="emit('create-plan')">新建计划</button>
            <button type="button" class="btn-seg-action" @click="emit('relate-plan')">关联计划</button>
          </div>
        </div>
      </div>

      <!-- 3. 右侧北斗轨迹查询面板（悬浮在地图右侧，宽 310px） -->
      <div class="beidou-query-panel">
        <div class="beidou-header">
          <span class="beidou-title">北斗轨迹查询</span>
          <span class="beidou-remain">剩余查询次数{{ data.beidouQuery.remainCount }}次</span>
        </div>
        <div class="beidou-notice-box">
          <span class="notice-icon">📍</span>
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
            v-for="t in data.beidouQuery.waybillTabs"
            :key="t.key"
            type="button"
            class="type-tab-btn"
            :class="{ active: activeWaybillTab === t.key }"
            @click="activeWaybillTab = t.key; emit('waybill-type-change', t.key)"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- 运单搜索框 -->
        <div class="waybill-search-box">
          <span class="search-icon">🔍</span>
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
                  <span v-if="nIdx < wb.timeline.length - 1" class="node-line" />
                </div>
                <div class="node-label">{{ node.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
