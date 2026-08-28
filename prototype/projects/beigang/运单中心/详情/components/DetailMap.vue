<script setup>
/**
 * 运单详情 —— 地图区
 * 复用水运计划详情同款真实地图底图资产（map-embedded.png，与托运单详情/水运计划详情一致）。
 * 底图为福州市区视野：装货点（仓山榕城江上图）在图内，卸货点（十堰）在图外西北方向，
 * 规划/北斗/设备三条路线自装货点向西北延伸出图，图例勾选可切换显隐；支持缩放交互。不接真实地图 SDK。
 */
import { computed, ref } from 'vue'
import { getWaybillDetail } from '../mock-data'

const props = defineProps({
  waybillKey: { type: String, default: '' },
})

const data = computed(() => getWaybillDetail(props.waybillKey))
const legends = ref(data.value.legends.map(l => ({ ...l })))
const zoom = ref(1)

const showPlanned = computed(() => legends.value.find(l => l.key === 'planned')?.checked)
const showBeidou = computed(() => legends.value.find(l => l.key === 'beidou')?.checked)
const showDevice = computed(() => legends.value.find(l => l.key === 'device')?.checked)

function zoomIn() { zoom.value = Math.min(1.6, +(zoom.value + 0.2).toFixed(2)) }
function zoomOut() { zoom.value = Math.max(0.6, +(zoom.value - 0.2).toFixed(2)) }
</script>

<template>
  <div class="wd-map">
    <div class="wd-map-canvas">
      <!-- 底图 + 缩放层 -->
      <div class="wd-map-zoom" :style="{ transform: `scale(${zoom})` }">
        <div class="wd-map-base" />

        <!-- 城市标注点 -->
        <div
          v-for="c in data.cityMarks"
          :key="c.name"
          class="wd-city-mark"
          :style="{ left: `${c.x / 10}%`, top: `${c.y / 4.6}%` }"
        ><span class="wd-city-dot" />{{ c.name }}</div>

        <!-- 规划路线（福州仓山装货点 → 向西北出图，通往十堰方向） -->
        <svg v-show="showPlanned" class="wd-map-route" viewBox="0 0 1000 460" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M 400 320 L 340 268 L 268 216 L 196 166 L 128 118 L 66 76 L 8 40"
            stroke="#5b8cff"
            stroke-width="6"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.9"
          />
        </svg>
        <!-- 北斗轨迹（深蓝，略偏移） -->
        <svg v-show="showBeidou" class="wd-map-route" viewBox="0 0 1000 460" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M 396 326 L 334 274 L 262 222 L 190 172 L 122 124 L 60 82 L 2 46"
            stroke="#2c3e70"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="2 6"
            opacity="0.8"
          />
        </svg>
        <!-- 设备轨迹（绿色，略偏移） -->
        <svg v-show="showDevice" class="wd-map-route" viewBox="0 0 1000 460" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            d="M 404 316 L 346 264 L 274 212 L 202 162 L 134 114 L 72 72 L 14 36"
            stroke="#20be8d"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.8"
          />
        </svg>

        <!-- 起点（装）：福州仓山装货点 -->
        <div class="wd-map-pin wd-pin-start">
          <span class="wd-pin-badge load">装</span>
          <span class="wd-pin-label">榕城江上图</span>
        </div>
        <!-- 终点（卸）：十堰在图外西北方向，pin 固定在图内西北边缘 -->
        <div class="wd-map-pin wd-pin-end">
          <span class="wd-pin-badge unload">卸</span>
          <span class="wd-pin-label">十堰（图外西北方向）</span>
        </div>
      </div>

      <!-- 图例面板 -->
      <div class="wd-map-legend">
        <div class="wd-legend-title">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="#3a65ff"/><circle cx="7" cy="7" r="2" fill="#3a65ff"/></svg>
          <span>运输轨迹</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="#909399" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <label v-for="legend in legends" :key="legend.key" class="wd-legend-item">
          <input type="checkbox" v-model="legend.checked" />
          <span class="wd-legend-line" :class="legend.tone" aria-hidden="true" />
          <span class="wd-legend-label">{{ legend.label }}</span>
        </label>
      </div>

      <!-- 缩放控件 -->
      <div class="wd-map-zoomctrl">
        <button type="button" class="wd-zoom-btn" aria-label="放大" @click="zoomIn">+</button>
        <button type="button" class="wd-zoom-btn" aria-label="缩小" @click="zoomOut">−</button>
      </div>

      <span class="wd-map-attribution">高德地图</span>

      <!-- 底部统计条 -->
      <div class="wd-map-stats">
        <div v-for="s in data.mapStats" :key="s.key" class="wd-map-stat">
          <span class="wd-map-stat-icon" aria-hidden="true" />
          <span class="wd-map-stat-label">{{ s.label }}</span>
          <span class="wd-map-stat-value">{{ s.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
