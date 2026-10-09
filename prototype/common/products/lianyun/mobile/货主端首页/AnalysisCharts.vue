<template>
  <!-- 三维雷达：业务在顶部，财务在左，风控在右；保留稿面网格与数据点位置。 -->
  <svg v-if="kind === 'radar'" class="ana-chart ana-radar" viewBox="0 0 259 174" role="img" :aria-label="label">
    <g class="ana-radar-grid">
      <polygon v-for="points in radarGrid" :key="points" :points="points"/>
      <line v-for="(point, index) in radarVertices" :key="index" x1="100" y1="90" :x2="point[0]" :y2="point[1]"/>
    </g>
    <polygon :points="radarDataPoints.map(point => point.join(',')).join(' ')" class="ana-radar-area"/>
    <circle v-for="(point, index) in radarDataPoints" :key="index" class="ana-radar-dot" :cx="point[0]" :cy="point[1]" r="4"/>
    <text class="ana-radar-label" x="100" y="18" text-anchor="middle">{{ data[0]?.label }}<tspan class="ana-radar-value" dx="6">{{ data[0]?.value }}</tspan></text>
    <text class="ana-radar-value" x="18" y="124" text-anchor="middle">{{ data[1]?.value }}</text>
    <text class="ana-radar-label" x="18" y="144" text-anchor="middle">{{ data[1]?.label }}</text>
    <text class="ana-radar-value" x="187" y="124" text-anchor="middle">{{ data[2]?.value }}</text>
    <text class="ana-radar-label" x="187" y="144" text-anchor="middle">{{ data[2]?.label }}</text>
  </svg>

  <!-- 回款率使用设计稿的左右环形轮廓，保留顶部与右下方切口。 -->
  <svg v-else-if="kind === 'ring' && tone === 'finance'" class="ana-chart ana-ring is-finance" viewBox="0 0 176 176" role="img" :aria-label="label">
    <defs><linearGradient :id="`${chartId}-finance`" x1="0" y1="1" x2="0" y2="0"><stop stop-color="#3a65ff"/><stop offset="1" stop-color="#a6cafe"/></linearGradient></defs>
    <circle cx="88" cy="88" r="88" fill="#fbfcff" stroke="#bfd9ff40"/>
    <circle cx="88" cy="88" r="84" fill="#eff5ff"/>
    <g transform="translate(-30 -30)">
      <path v-for="(arc, index) in financeArcs" :key="index" :d="arc.path" :transform="arc.transform" :fill="index ? '#bfd9ff' : `url(#${chartId}-finance)`"/>
    </g>
    <circle cx="88.5" cy="87.5" r="49.5" fill="#fff" stroke="#eaf1ff"/>
    <text class="ana-ring-value" x="88" y="95" text-anchor="middle">{{ value }}</text>
    <text class="ana-ring-label" x="88" y="120" text-anchor="middle">{{ centerLabel }}</text>
  </svg>

  <!-- 完成率：四个扇区矢量、渐变与中心覆盖层。 -->
  <svg v-else-if="kind === 'ring'" class="ana-chart ana-ring" viewBox="0 0 200 200" role="img" :aria-label="label">
    <defs>
      <linearGradient v-for="(segment, index) in completionSegments" :key="index" :id="`${chartId}-completion-${index}`" gradientUnits="userSpaceOnUse" v-bind="segment.gradient"><stop :stop-color="segment.colors[0]"/><stop offset="1" :stop-color="segment.colors[1]"/></linearGradient>
      <radialGradient :id="`${chartId}-core`"><stop stop-color="#fff"/><stop offset="1" stop-color="#ffffff80"/></radialGradient>
      <filter :id="`${chartId}-inner`"><feFlood flood-opacity="0"/><feBlend in="SourceGraphic"/><feGaussianBlur in="SourceAlpha" stdDeviation="5.3"/><feComposite operator="arithmetic" k2="-1" k3="1" in2="SourceAlpha"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .64 0"/><feBlend in2="SourceGraphic"/></filter>
    </defs>
    <circle class="ana-ring-dashes" cx="100" cy="100" r="97"/>
    <circle cx="100" cy="100" r="88" fill="none" stroke="#e9effc" stroke-width="1.5"/>
    <g transform="translate(21.5 17.1)">
      <path v-for="(segment, index) in completionSegments" :key="index" :d="segment.path" :transform="segment.transform" :fill="`url(#${chartId}-completion-${index})`" :filter="`url(#${chartId}-inner)`"/>
    </g>
    <circle class="ana-ring-core" :fill="`url(#${chartId}-core)`" cx="100" cy="100" r="48"/>
    <text class="ana-ring-value" x="100" y="102" text-anchor="middle">{{ value }}</text>
    <text class="ana-ring-label" x="100" y="120" text-anchor="middle">{{ centerLabel }}</text>
  </svg>

  <!-- 半环仪表：司机 / 车辆利用率 -->
  <svg v-else-if="kind === 'gauge'" class="ana-chart ana-gauge" viewBox="0 0 120 120" role="img" :aria-label="label">
    <circle class="ana-gauge-track" cx="60" cy="60" r="46"/>
    <circle :class="['ana-gauge-arc', `tone-${tone}`]" cx="60" cy="60" r="46" transform="rotate(-72 60 60)" :stroke-dasharray="`${gaugeFilled} ${gaugeTotal}`"/>
    <text :class="['ana-gauge-value', `tone-${tone}`]" x="60" y="60" text-anchor="middle">{{ value.replace('%', '') }}<tspan font-size="16">%</tspan></text>
    <text class="ana-gauge-label" x="60" y="80" text-anchor="middle">{{ centerLabel }}</text>
  </svg>

  <!-- 迷你折线：单车 / 每公里表现 -->
  <svg v-else-if="kind === 'spark'" class="ana-chart ana-spark" viewBox="0 0 94 53" role="img" :aria-label="label">
    <defs>
      <linearGradient :id="`${chartId}-spark-line`"><stop :stop-color="tone === 'blue' ? '#83a8ff' : '#ffc2c0'"/><stop offset="1" :stop-color="tone === 'blue' ? '#3a65ff' : '#e64b4b'"/></linearGradient>
      <linearGradient :id="`${chartId}-spark-area`" x1="0" y1="0" x2="0" y2="1"><stop :stop-color="tone === 'blue' ? '#b7c5ff' : '#ffc2c0'" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <line class="ana-spark-base" x1="0" y1="24" x2="86" y2="24"/>
    <path :fill="`url(#${chartId}-spark-area)`" :d="tone === 'blue' ? 'M0 31L27 25L35 31L57 25L68 25L89 17V53H0Z' : 'M0 17L22 25L33 25L55 31L62 24L89 30V53H0Z'"/>
    <path :fill="`url(#${chartId}-spark-line)`" :d="sparkLinePaths[tone]" :transform="tone === 'blue' ? 'translate(0 17)' : 'translate(0 16) matrix(-1 0 0 1 89.637 .941406)'"/>
    <rect :class="['ana-spark-cap', `tone-${tone}`]" x="85" y="0" width="9" height="53" rx="2"/>
    <circle :class="['ana-spark-dot', `tone-${tone}`]" cx="89" :cy="tone === 'blue' ? 17 : 30" r="2.5"/>
  </svg>

  <!-- 预计产生运量走势 -->
  <svg v-else-if="kind === 'curve'" class="ana-chart ana-curve" viewBox="0 0 214 76" role="img" :aria-label="label">
    <g class="ana-curve-grid">
      <line v-for="n in 12" :key="n" :x1="(n - 1) * 19" y1="4" :x2="(n - 1) * 19" y2="58"/>
      <line v-for="n in 4" :key="'h' + n" x1="0" :y1="14.5 * n" x2="209" :y2="14.5 * n"/>
    </g>
    <defs>
      <linearGradient :id="`${chartId}-curve-soft`" x1="0" x2="1"><stop stop-color="#aac0ff00"/><stop offset=".5" stop-color="#aac0ff"/><stop offset="1" stop-color="#aac0ff00"/></linearGradient>
      <linearGradient :id="`${chartId}-curve-strong`" x1="0" x2="1"><stop stop-color="#83a8ff00"/><stop offset="1" stop-color="#3a65ff"/></linearGradient>
    </defs>
    <line class="ana-curve-ref" x1="2" y1="18.5" x2="212" y2="18.5"/>
    <g transform="translate(19 0)"><path v-for="(path, index) in volumeCurvePaths" :key="index" :d="path.d" fill="none" :stroke="`url(#${chartId}-curve-${index ? 'strong' : 'soft'})`" stroke-width="6"/></g>
    <circle class="ana-curve-dot" cx="122" cy="7" r="5" stroke="#fff" stroke-width="2"/>
  </svg>

  <!-- 竖向填充条：可调度运力占比 -->
  <svg v-else-if="kind === 'column'" class="ana-chart ana-column" viewBox="0 0 58 129" role="img" :aria-label="label">
    <defs><pattern :id="`${chartId}-hatch`" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff80" stroke-width="2"/></pattern></defs>
    <rect class="ana-column-track" x="0" y="0" width="58" height="129" rx="6"/>
    <rect x="0" y="0" width="58" height="129" rx="6" :fill="`url(#${chartId}-hatch)`"/>
    <rect class="ana-column-fill" x="4" :y="129 - filledHeight - 4" width="51" :height="filledHeight" rx="6"/>
    <circle class="ana-column-badge" cx="29" cy="79" r="20"/>
    <text class="ana-column-text" x="29" y="84" text-anchor="middle">{{ value }}</text>
  </svg>

  <!-- 收入构成条带：灰底成本段 + 蓝色收益段 -->
  <svg v-else-if="kind === 'strip'" class="ana-chart ana-strip" :viewBox="`0 0 ${count * 9.6} 30`" role="img" :aria-label="label">
    <rect v-for="n in count" :key="n" :class="['ana-strip-bar', { 'is-on': n > highlightFrom }]" :x="(n - 1) * 9.6" :y="n > highlightFrom ? 0 : 8" width="5.4" :height="n > highlightFrom ? 30 : 22" rx="2.7"/>
  </svg>

  <!-- 方案成交情况：弧线进度 -->
  <svg v-else-if="kind === 'deal'" class="ana-chart ana-deal" viewBox="0 0 86 64" role="img" :aria-label="label">
    <defs><linearGradient :id="`${chartId}-deal`"><stop stop-color="#6F90FF"/><stop offset="1" stop-color="#6753FF"/></linearGradient></defs>
    <path d="M13 56 A34 34 0 1 1 74 56" fill="none" stroke="#dedfe3" stroke-width="9" pathLength="100"/>
    <path d="M13 56 A34 34 0 1 1 74 56" fill="none" :stroke="`url(#${chartId}-deal)`" stroke-width="9" pathLength="100" :stroke-dasharray="`${percent} 100`"/>
    <circle cx="43" cy="43" r="13" fill="#eef3ff" stroke="#7568FF" stroke-width="6"/>
    <path d="M43 23 l6 13 h-12 z" fill="#7568FF"/>
  </svg>

  <!-- 调度任务：双层环形 -->
  <svg v-else-if="kind === 'dispatch'" class="ana-chart ana-dispatch-chart" viewBox="0 0 131 132" role="img" :aria-label="label">
    <defs><linearGradient :id="`${chartId}-dispatch`" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6DD8DE"/><stop offset="1" stop-color="#28BDC9"/></linearGradient></defs>
    <circle cx="65" cy="66" r="58" fill="none" :stroke="`url(#${chartId}-dispatch)`" stroke-width="15"/>
    <circle cx="65" cy="66" r="58" fill="none" stroke="#4777FE" stroke-width="15" stroke-dasharray="97 365" transform="rotate(-90 65 66)"/>
    <circle cx="65" cy="66" r="43" fill="none" stroke="#86DDE4" stroke-width="10"/>
    <circle cx="65" cy="66" r="43" fill="none" stroke="#B2C5FF" stroke-width="10" stroke-dasharray="73 270" transform="rotate(-90 65 66)"/>
  </svg>

  <!-- 运输路线：向下收窄的漏斗 -->
  <svg v-else-if="kind === 'funnel'" class="ana-chart ana-funnel" viewBox="0 0 200 140" role="img" :aria-label="label">
    <g v-for="(row, index) in data" :key="row.label">
      <polygon :class="['ana-funnel-shape', `tone-${index}`]" :points="funnelShape(index)"/>
      <text :class="['ana-funnel-value', `tone-${index}`]" x="100" :y="index * 35 + 25" text-anchor="middle">{{ row.value }}</text>
    </g>
  </svg>

  <!-- 调度进度：分段进度条 -->
  <svg v-else-if="kind === 'stacked'" class="ana-chart ana-stacked" viewBox="0 0 440 34" role="img" :aria-label="label">
    <rect class="ana-stacked-rail" x="0" y="4" width="440" height="13" rx="6.5"/>
    <rect class="ana-stacked-seg tone-1" x="0" y="4" :width="segmentWidth(0)" height="13"/>
    <rect class="ana-stacked-seg tone-2" :x="segmentWidth(0)" y="4" :width="segmentWidth(1)" height="13"/>
    <rect class="ana-stacked-seg tone-3" :x="segmentWidth(0) + segmentWidth(1)" y="4" :width="segmentWidth(2)" height="13" rx="6.5"/>
    <g v-for="(row, index) in data.slice(0, 2)" :key="row.key">
      <polygon class="ana-stacked-mark" :points="markPoints(segmentStart(index + 1))"/>
    </g>
  </svg>

  <!-- 预警分类：半环分区 -->
  <svg v-else-if="kind === 'risk-donut'" class="ana-chart ana-risk-donut" viewBox="0 0 226 122" role="img" :aria-label="label">
    <path v-for="(item, index) in data" :key="item.key" :class="['ana-risk-sector', `tone-${index}`]" :d="riskSector(index)"/>
    <text v-for="(item, index) in data" :key="'l' + item.key" class="ana-risk-label" :x="riskLabelPoint(index)[0]" :y="riskLabelPoint(index)[1]" text-anchor="middle">{{ item.label }}</text>
    <path d="M70 120 A43 43 0 0 1 156 120 M79 120 A34 34 0 0 1 147 120" fill="none" stroke="#ddd" stroke-width="1"/>
    <text class="ana-risk-center" x="113" y="112" text-anchor="middle">{{ centerLabel }}</text>
  </svg>

  <!-- 高发时段带 -->
  <svg v-else-if="kind === 'peak'" class="ana-chart ana-peak" viewBox="0 0 112 64" role="img" :aria-label="label">
    <g class="ana-peak-grid"><line v-for="n in 4" :key="n" x1="4" :y1="8 * n + 4" x2="108" :y2="8 * n + 4"/></g>
    <rect class="ana-peak-band" x="34" y="4" width="44" height="36" rx="3"/>
    <text class="ana-peak-text" x="56" y="27" text-anchor="middle">{{ text }}</text>
    <line class="ana-peak-axis" x1="4" y1="44" x2="108" y2="44"/>
    <g class="ana-peak-ticks"><line v-for="n in 11" :key="n" :x1="4 + (n - 1) * 10.4" y1="44" :x2="4 + (n - 1) * 10.4" y2="49"/></g>
    <text class="ana-peak-scale" x="46" y="60" text-anchor="middle">{{ from }}</text>
    <text class="ana-peak-scale" x="88" y="60" text-anchor="middle">{{ to }}</text>
  </svg>

  <!-- 预警趋势组合图：柱 + 三条对比折线 -->
  <svg v-else-if="kind === 'combo'" class="ana-chart ana-combo" viewBox="0 0 506 177" role="img" :aria-label="label">
    <g class="ana-combo-grid"><line v-for="tick in ticks" :key="tick" x1="29" :y1="yScale(tick)" x2="505" :y2="yScale(tick)"/></g>
    <g class="ana-combo-bars"><rect v-for="(bar, index) in bars" :key="index" :x="29 + index * 20" :y="yScale(bar)" width="12" :height="151 - yScale(bar)" rx="2"/></g>
    <path v-for="line in lines" :key="line.key" class="ana-combo-line" :stroke="line.color" :d="line.path" :transform="`translate(29 ${line.offset})`"/>
    <line x1="29" y1="151" x2="505" y2="151" stroke="#333" stroke-width="1"/>
    <g class="ana-combo-scale"><text v-for="tick in ticks" :key="'t' + tick" x="0" :y="yScale(tick) + 4">{{ tick }}</text></g>
    <g class="ana-combo-axis-label"><text v-for="hour in axis" :key="hour" :x="35 + hour * 20" y="169" text-anchor="middle">{{ hour }}</text></g>
  </svg>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import { completionSegments, financeArcs, sparkLinePaths, volumeCurvePaths } from './analysis-data.js'

const props = defineProps({
  kind: { type: String, required: true },
  data: { type: Array, default: () => [] },
  value: { type: String, default: '' },
  centerLabel: { type: String, default: '' },
  tone: { type: String, default: 'blue' },
  label: { type: String, default: '' },
  percent: { type: Number, default: 0 },
  count: { type: Number, default: 50 },
  highlightFrom: { type: Number, default: 34 },
  text: { type: String, default: '' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  ticks: { type: Array, default: () => [100, 200, 300] },
  bars: { type: Array, default: () => [] },
  lines: { type: Array, default: () => [] },
  axis: { type: Array, default: () => [] },
})

// 各实例独立渐变标识，避免隐藏 Tab 或多个原型实例间串色。
const chartId = `analysis-chart-${getCurrentInstance().uid}`
const radarVertices = [[100, 6], [27.25, 132], [172.75, 132]]
const radarGrid = ['100,6 27.25,132 172.75,132', '100,17 36.78,126.5 163.22,126.5', '100.5,48 63.69,111.75 137.31,111.75', '100,71 83.55,99.5 116.45,99.5']
const radarDataPoints = computed(() => [[100, 90 - 45 * (props.data[0]?.value ?? 0) / 75], [100 - 45 * (props.data[1]?.value ?? 0) / 75, 116], [100 + 40 * (props.data[2]?.value ?? 0) / 80, 112]])

/* 利用率图示弧长保持稿面显示角度，示例数值仍由数据提供。 */
const gaugeTotal = Math.round(2 * Math.PI * 46)
const gaugeFilled = computed(() => Math.round(gaugeTotal * props.percent / 100))

/* 竖向填充条 */
const filledHeight = computed(() => Math.round(121 * props.percent / 100))

/* 漏斗：逐行向下收窄 */
const FUNNEL_WIDTHS = [192, 141, 92, 47]
function funnelShape(index) {
  const top = index * 35
  const topWidth = FUNNEL_WIDTHS[index] ?? 40
  const bottomWidth = FUNNEL_WIDTHS[index + 1] ?? FUNNEL_WIDTHS.at(-1) / 2
  return `${100 - topWidth / 2},${top} ${100 + topWidth / 2},${top} ${100 + bottomWidth / 2},${top + 35} ${100 - bottomWidth / 2},${top + 35}`
}

/* 调度分段进度条 */
const totalRatio = computed(() => props.data.reduce((sum, row) => sum + row.ratio, 0) || 1)
const segmentWidth = index => Math.round((props.data[index]?.ratio ?? 0) / totalRatio.value * 440)
const segmentStart = index => props.data.slice(0, index).reduce((sum, row) => sum + row.ratio, 0) / totalRatio.value * 440
const markPoints = x => `${x - 6},0 ${x + 6},0 ${x},8`

/* 风险分类半环 */
const RISK_OUTER = 110
const RISK_INNER = 62
const riskPoint = (angle, radius) => {
  const radians = (angle * Math.PI) / 180
  return [(113 + Math.cos(radians) * radius).toFixed(1), (113 + Math.sin(radians) * radius).toFixed(1)]
}
function riskSector(index) {
  const step = 180 / Math.max(1, props.data.length)
  const from = 180 + index * step + 1.5
  const to = 180 + (index + 1) * step - 1.5
  return `M${riskPoint(from, RISK_OUTER)} A${RISK_OUTER} ${RISK_OUTER} 0 0 1 ${riskPoint(to, RISK_OUTER)} L${riskPoint(to, RISK_INNER)} A${RISK_INNER} ${RISK_INNER} 0 0 0 ${riskPoint(from, RISK_INNER)} Z`
}
function riskLabelPoint(index) {
  const step = 180 / Math.max(1, props.data.length)
  const angle = 180 + index * step + step / 2
  const radians = (angle * Math.PI) / 180
  return [(113 + Math.cos(radians) * 86).toFixed(1), (113 + Math.sin(radians) * 86 + 5).toFixed(1)]
}

/* 组合图：0 基线 151，每 100 对应 47 */
const yScale = v => 151 - (v * 47) / 100
</script>

<style scoped>
svg { display: block; width: 100%; height: auto; overflow: visible; font-family: inherit; }

/* 雷达 */
.ana-radar-grid polygon { fill: none; stroke: #09296d; stroke-opacity: .16; stroke-width: 1.5; }
.ana-radar-grid line { stroke: #d7e0f0; stroke-width: 1; }
.ana-radar-area { fill: rgba(12, 140, 247, .42); stroke: #0c63f7; stroke-width: 2; }
.ana-radar-dot { fill: #fff; stroke: #3a65ff; stroke-width: 2; }
.ana-radar-label { font-size: 18px; fill: #333; }
.ana-radar-value { font-size: 18px; font-weight: 700; fill: #333; }

/* 环形 */
.ana-ring-dashes { fill: none; stroke: #e9effc; stroke-width: 1.5; }
.ana-ring-value { font-size: 28px; font-weight: 700; fill: #333; }
.ana-ring-label { font-size: 16px; fill: #999; }
.is-finance { filter:drop-shadow(0 0 12px #b2cdff70); }
.is-finance .ana-ring-value { font-size:36px; }
.is-finance .ana-ring-label { font-size:18px; }

/* 半环仪表 */
.ana-gauge-track { fill: none; stroke: #dde3e9; stroke-width: 2; }
.ana-gauge-arc { fill: none; stroke-width: 6; stroke-linecap: round; }
.ana-gauge-arc.tone-blue { stroke: #3a65ff; }
.ana-gauge-arc.tone-cyan { stroke: #29bad9; }
.ana-gauge-value { font-size: 28px; font-weight: 600; }
.ana-gauge-value.tone-blue { fill: #3a65ff; }
.ana-gauge-value.tone-cyan { fill: #29bad9; }
.ana-gauge-label { font-size: 16px; fill: #9ba4b3; }

/* 迷你折线 */
.ana-spark-base { stroke: #c9cdd6; stroke-width: 1; stroke-dasharray: 4 3; }
.ana-spark-cap.tone-blue { fill: #b7c5ff; opacity: .7; }
.ana-spark-cap.tone-red { fill: #ffc2c0; opacity: .75; }
.ana-spark-dot { fill: #fff; stroke-width: 2; }
.ana-spark-dot.tone-blue { stroke: #3a65ff; }
.ana-spark-dot.tone-red { stroke: #e64b4b; }

/* 运量曲线 */
.ana-curve-grid line { stroke: #eaeffb; stroke-width: 1; }
.ana-curve-ref { stroke: #9d9d9d; stroke-width: 1; stroke-dasharray: 4 3; }
.ana-curve-dot { fill: #2f5bff; }

/* 竖向填充条 */
.ana-column-track { fill: #eef1f8; }
.ana-column-fill { fill: #3a65ff; }
.ana-column-badge { fill: #fff; }
.ana-column-text { font-size: 14px; font-weight: 700; fill: #333; }

/* 收入条带 */
.ana-strip-bar { fill: #c4c4c4; }
.ana-strip-bar.is-on { fill: #3a65ff; }

/* 漏斗 */
.ana-funnel-shape.tone-0 { fill: #4069ff; }
.ana-funnel-shape.tone-1 { fill: #94abff; }
.ana-funnel-shape.tone-2 { fill: #c3d0ff; }
.ana-funnel-shape.tone-3 { fill: #dae2ff; }
.ana-funnel-value { font-size: 20px; font-weight: 600; }
.ana-funnel-value.tone-0, .ana-funnel-value.tone-1 { fill: #fff; }
.ana-funnel-value.tone-2, .ana-funnel-value.tone-3 { fill: #2e4973; }

/* 调度进度 */
.ana-stacked-rail { fill: #dfe4fb; }
.ana-stacked-seg.tone-1 { fill: #2f5bff; }
.ana-stacked-seg.tone-2 { fill: #8fa8fb; }
.ana-stacked-seg.tone-3 { fill: #d3dcfd; }
.ana-stacked-mark { fill: #0fc36f; }

/* 风险分类 */
.ana-risk-sector.tone-0 { fill: #e6e6e8; }
.ana-risk-sector.tone-1, .ana-risk-sector.tone-2 { fill: #c9cacc; }
.ana-risk-label { font-size: 16px; fill: #555; }
.ana-risk-center { font-size: 20px; fill: #999; }

/* 高发时段 */
.ana-peak-grid line { stroke: #dcdcdc; stroke-width: 1; stroke-dasharray: 2 2; }
.ana-peak-band { fill: #e3e3e3; }
.ana-peak-text { font-size: 13px; fill: #999; }
.ana-peak-axis, .ana-peak-ticks line { stroke: #b4b4b4; stroke-width: 1; }
.ana-peak-scale { font-size: 12px; fill: #b4b4b4; }

/* 组合图 */
.ana-combo-grid line { stroke: #000; stroke-width: 1; stroke-dasharray: 5 4; stroke-opacity:.6; }
.ana-combo-bars rect { fill: #c4c4c4; }
.ana-combo-line { fill: none; stroke-width: 1; }
.ana-combo-scale text { font-size: 16px; fill: #999; }
.ana-combo-axis-label text { font-size: 18px; fill: #999; }
</style>
