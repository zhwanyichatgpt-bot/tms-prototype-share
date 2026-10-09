<template>
  <div ref="viewport" class="ana-viewport">
  <div class="ana-page" :style="{ zoom: scale }">
    <!-- ===== 1. 综合评分 ===== -->
    <section class="ana-card ana-score" aria-label="综合评分">
      <div class="ana-score-left">
        <h2 class="ana-score-title">{{ scoreOverview.title }}</h2>
        <p class="ana-score-value">
          <svg class="ana-score-swoosh" viewBox="0 0 55 20" aria-hidden="true">
            <path d="M1 18 L11 3 L24 0 L29 12 L42 11 L54 6 L46 19 L27 19 L22 9 L11 10 Z" fill="#A4EB68"/>
          </svg>
          {{ scoreOverview.score }}<em>{{ scoreOverview.decimal }}</em><span class="ana-delta"><van-icon name="arrow-up"/>{{ scoreOverview.delta }}</span>
        </p>
        <p class="ana-score-compare">{{ scoreOverview.compare }}</p>
      </div>
      <div class="ana-score-right">
        <button class="ana-mode" type="button"><span>{{ scoreOverview.mode }}</span><van-icon name="arrow-down"/></button>
        <span class="ana-score-radar"><AnalysisCharts kind="radar" :data="scoreOverview.radar" label="业务、财务、风控三维雷达图"/></span>
      </div>
    </section>

    <!-- ===== 2. 业务表现 ===== -->
    <section class="ana-card ana-business" aria-label="业务表现">
      <button class="ana-more" type="button" aria-label="查看业务表现详情"><van-icon name="arrow"/></button>
      <h2 class="ana-section-title">{{ businessPerformance.title }}</h2>

      <!-- 托运单总量 + 完成率环形 -->
      <div class="ana-intro">
        <div class="ana-intro-text">
          <p class="ana-metric"><span>{{ businessPerformance.consignment.label }}</span><b>{{ businessPerformance.consignment.value }}</b><i>{{ businessPerformance.consignment.unit }}</i></p>
          <p class="ana-sub">{{ businessPerformance.consignment.volume }}</p>
          <p class="ana-hint">{{ businessPerformance.hint }}</p>
        </div>
        <div class="ana-intro-ring">
          <AnalysisCharts kind="ring" :percent="businessPerformance.completion.arc" :value="businessPerformance.completion.rate" :center-label="businessPerformance.completion.label" label="订单完成率与状态分布"/>
          <div class="ana-bubbles">
            <span v-for="bubble in businessPerformance.completion.bubbles" :key="bubble.key" :class="['ana-bubble', `is-${bubble.position}`]"><b>{{ bubble.value }}</b><small>{{ bubble.label }}</small></span>
          </div>
        </div>
      </div>

      <!-- 方案成交情况 + 客户结构 -->
      <div class="ana-grid2 ana-tiles">
        <article class="ana-tile">
          <p class="ana-tile-head"><van-icon name="completed"/>{{ businessPerformance.deal.title }}</p>
          <p class="ana-tile-lead">{{ businessPerformance.deal.rate }}</p>
          <p class="ana-deal-value"><b>{{ businessPerformance.deal.value }}</b><i>{{ businessPerformance.deal.unit }}</i></p>
          <div class="ana-deal-chart">
            <AnalysisCharts kind="deal" :percent="businessPerformance.deal.progress" label="中标方案占行业平均的进度"/>
            <small>{{ businessPerformance.deal.note }}</small>
          </div>
          <p class="ana-tile-foot">{{ businessPerformance.deal.label }}</p>
        </article>

        <article class="ana-tile">
          <p class="ana-tile-head"><van-icon name="bar-chart-o"/>{{ businessPerformance.customer.title }}</p>
          <p class="ana-tile-lead">{{ businessPerformance.customer.summary }}</p>
          <div class="ana-customer">
            <span class="ana-customer-ghost is-2"/>
            <span class="ana-customer-ghost is-1"/>
            <span class="ana-customer-top"><em>{{ businessPerformance.customer.top.badge }}</em>{{ businessPerformance.customer.top.name }}</span>
          </div>
        </article>
      </div>

      <!-- 预计产生运量 + 运力使用率 -->
      <div class="ana-volume">
        <article class="ana-volume-card">
          <div class="ana-volume-head">
            <p class="ana-block-title">{{ businessPerformance.volumeForecast.title }}</p>
            <span class="ana-tag ana-tag-warn">{{ businessPerformance.volumeForecast.tag }}</span>
          </div>
          <p class="ana-volume-value">{{ businessPerformance.volumeForecast.value }}<i>{{ businessPerformance.volumeForecast.unit }}</i></p>
          <div class="ana-volume-chart">
            <AnalysisCharts kind="curve" label="预计产生运量走势"/>
            <span class="ana-volume-ref">{{ businessPerformance.volumeForecast.reference }}</span>
          </div>
          <p class="ana-volume-note">{{ businessPerformance.volumeForecast.note }}</p>
        </article>

        <article class="ana-capacity">
          <p class="ana-block-title">{{ businessPerformance.capacity.title }}</p>
          <p class="ana-capacity-value">{{ businessPerformance.capacity.rate }}</p>
          <p class="ana-capacity-scope"><span v-for="item in businessPerformance.capacity.scope" :key="item.label">{{ item.label }} {{ item.value }}</span></p>
          <span class="ana-tag ana-tag-ok">{{ businessPerformance.capacity.tag }}</span>
          <div class="ana-capacity-foot">
            <div>
              <p class="ana-block-title">{{ businessPerformance.capacity.dispatchLabel }}</p>
              <p class="ana-capacity-dispatch">{{ businessPerformance.capacity.dispatchValue }}</p>
            </div>
            <AnalysisCharts kind="column" :percent="businessPerformance.capacity.share" :value="`${businessPerformance.capacity.share}%`" label="可调度运力占比"/>
          </div>
        </article>
      </div>

      <!-- 预计收入 -->
      <div class="ana-revenue">
        <div class="ana-revenue-head">
          <div>
            <p class="ana-block-title">{{ businessPerformance.revenue.title }}</p>
            <p class="ana-revenue-value">{{ businessPerformance.revenue.value }}<i>{{ businessPerformance.revenue.unit }}</i></p>
          </div>
          <span class="ana-badge-dark">{{ businessPerformance.revenue.badge }}</span>
        </div>
        <div class="ana-revenue-strip" :style="revenueBoundaryStyle">
          <AnalysisCharts kind="strip" :count="businessPerformance.revenue.bars" :highlight-from="businessPerformance.revenue.highlightFrom" label="预计成本与预计收益构成"/>
          <div class="ana-revenue-labels">
            <p v-for="item in businessPerformance.revenue.items" :key="item.label" :class="{ 'is-emphasis': item.emphasis }"><small>{{ item.label }}</small><b>{{ item.value }}</b></p>
          </div>
        </div>
      </div>

      <!-- 运输计划 -->
      <div class="ana-plan">
        <div class="ana-plan-info">
          <p class="ana-metric"><span>{{ businessPerformance.plan.title }}</span><b>{{ businessPerformance.plan.value }}</b><i>{{ businessPerformance.plan.unit }}</i></p>
          <p class="ana-sub">{{ businessPerformance.plan.volume }}</p>
          <p class="ana-reward-title"><span>{{ businessPerformance.plan.reward.label }}</span><small>{{ businessPerformance.plan.reward.note }}</small></p>
          <div class="ana-reward-bars"><i v-for="n in businessPerformance.plan.reward.segments" :key="n" :class="{ 'is-off': n > businessPerformance.plan.reward.filled }"/></div>
        </div>
        <ul class="ana-plan-bars">
          <li v-for="row in businessPerformance.plan.bars" :key="row.key">
            <span class="ana-plan-track"><span class="ana-plan-shape" :class="`tone-${row.tone}`" :style="{ width: row.ratio + '%' }"><em>{{ row.label }}</em></span><span v-if="row.tail" class="ana-plan-tail"/></span>
            <b>{{ row.value }}</b>
          </li>
        </ul>
      </div>

      <!-- 运输路线 + 准时交付率 -->
      <div class="ana-route">
        <div class="ana-route-left">
          <p class="ana-metric"><span>{{ businessPerformance.route.title }}</span><b>{{ businessPerformance.route.value }}</b><i>{{ businessPerformance.route.unit }}</i></p>
          <div class="ana-route-body">
            <ul class="ana-route-labels"><li v-for="row in businessPerformance.route.rows" :key="row.label">{{ row.label }}</li></ul>
            <AnalysisCharts kind="funnel" :data="businessPerformance.route.rows" label="运输路线分布"/>
          </div>
        </div>
        <article class="ana-tile ana-ontime">
          <p class="ana-tile-head">{{ businessPerformance.onTime.title }}</p>
          <p class="ana-ontime-value">{{ businessPerformance.onTime.value }}<i>{{ businessPerformance.onTime.unit }}</i></p>
          <span class="ana-tag ana-tag-ok">{{ businessPerformance.onTime.tag }}</span>
          <p class="ana-ontime-note">{{ businessPerformance.onTime.note }}</p>
        </article>
      </div>

      <!-- 调度任务 -->
      <div class="ana-dispatch">
        <div class="ana-dispatch-donut">
          <AnalysisCharts kind="dispatch" label="调度完成情况"/>
          <span class="ana-dispatch-badge"><i/>{{ businessPerformance.dispatch.done.label }} <b>{{ businessPerformance.dispatch.done.value }}</b></span>
        </div>
        <div class="ana-dispatch-body">
          <p class="ana-metric"><span>{{ businessPerformance.dispatch.title }}</span><b>{{ businessPerformance.dispatch.value }}</b><i>{{ businessPerformance.dispatch.unit }}</i></p>
          <div class="ana-dispatch-labels"><span v-for="row in businessPerformance.dispatch.segments.slice(0, 2)" :key="row.key">{{ row.label }}</span></div>
          <AnalysisCharts kind="stacked" :data="businessPerformance.dispatch.segments" label="调度进度"/>
          <p class="ana-dispatch-scheduled"><span>{{ businessPerformance.dispatch.scheduled }}</span></p>
        </div>
      </div>

      <!-- 司机 / 车辆 -->
      <div class="ana-grid2 ana-fleet-grid">
        <article v-for="group in businessPerformance.fleet" :key="group.key" :class="['ana-fleet', `is-${group.tone}`]">
          <p class="ana-fleet-title">{{ group.title }}</p>
          <p class="ana-fleet-value">{{ group.value }}<i>{{ group.total }}</i></p>
          <p class="ana-fleet-scope">{{ group.scope }}</p>
          <span class="ana-fleet-gauge"><AnalysisCharts kind="gauge" :percent="group.arc" :value="`${group.rate}%`" :center-label="group.rateLabel" :tone="group.tone" :label="`${group.title}${group.rateLabel}`"/></span>
          <p class="ana-fleet-foot">{{ group.footer }}</p>
        </article>
      </div>

      <!-- 运单量 + 运输画像 -->
      <div class="ana-waybill">
        <div class="ana-waybill-list">
          <p class="ana-metric"><span>{{ businessPerformance.waybill.title }}</span><b>{{ businessPerformance.waybill.value }}</b><i>{{ businessPerformance.waybill.unit }}</i></p>
          <ul>
            <li v-for="row in businessPerformance.waybill.rows" :key="row.key">
              <span>{{ row.label }}</span><b>{{ row.value }}</b>
              <span class="ana-waybill-bar" :style="{ '--ana-marker': businessPerformance.waybill.marker + '%' }">
                <i :class="`tone-${row.tone}`" :style="{ width: row.width + '%' }"/>
              </span>
            </li>
          </ul>
        </div>
        <article class="ana-portrait">
          <p class="ana-portrait-title">{{ businessPerformance.portrait.title }}</p>
          <div class="ana-portrait-art">
            <span v-for="(tag, index) in businessPerformance.portrait.tags" :key="index" :class="['ana-portrait-tag', `is-${index}`]">{{ tag }}</span>
            <strong>{{ businessPerformance.portrait.headline }}</strong>
            <em>{{ businessPerformance.portrait.highlight }}</em>
          </div>
          <p class="ana-portrait-desc">{{ businessPerformance.portrait.description }}</p>
        </article>
      </div>
    </section>

    <!-- ===== 3. 财务分析 ===== -->
    <section class="ana-card ana-finance" aria-label="财务分析">
      <button class="ana-more" type="button" aria-label="查看财务分析详情"><van-icon name="arrow"/></button>
      <h2 class="ana-section-title">{{ financialAnalysis.title }}</h2>
      <div class="ana-receivable">
        <p class="ana-metric"><span>{{ financialAnalysis.receivable.label }}</span><b>{{ financialAnalysis.receivable.value }}</b><i>{{ financialAnalysis.receivable.unit }}</i></p>
        <p class="ana-sub">{{ financialAnalysis.receivable.receivedLabel }} {{ financialAnalysis.receivable.receivedValue }} {{ financialAnalysis.receivable.receivedUnit }}</p>
        <p class="ana-hint">{{ financialAnalysis.receivable.note }}</p>
      </div>
      <div class="ana-finance-ring">
        <AnalysisCharts kind="ring" tone="finance" :percent="financialAnalysis.receivable.arc" :value="financialAnalysis.receivable.rate" :center-label="financialAnalysis.receivable.rateLabel" label="回款率"/>
      </div>

      <div class="ana-grid2 ana-tiles">
        <article v-for="panel in [financialAnalysis.perVehicle, financialAnalysis.perKm]" :key="panel.title" class="ana-tile ana-perf">
          <span class="ana-verify">{{ panel.verify }}</span>
          <p class="ana-tile-head">{{ panel.title }}</p>
          <div v-for="item in panel.items" :key="item.label" class="ana-perf-item">
            <p class="ana-perf-label">{{ item.label }}<span :class="`tone-${item.tone}`"><svg class="ana-perf-direction" viewBox="0 0 16 16" aria-hidden="true"><path :d="item.direction === 'up' ? 'M1 11L5 7L9 10L14 5M10 5H14V9' : 'M1 5L5 8L9 6L14 11M10 11H14V7'" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>{{ item.delta }}</span></p>
            <p class="ana-perf-value">{{ item.value }}<i>{{ item.unit }}</i><span v-if="item.tone === 'red'" class="ana-cost-marker">↑</span></p>
            <span class="ana-perf-spark"><AnalysisCharts kind="spark" :tone="item.tone" :label="`${panel.title}${item.label}走势`"/></span>
          </div>
        </article>
      </div>

      <div class="ana-funds">
        <article class="ana-profit">
          <p class="ana-profit-title">{{ financialAnalysis.profit.title }}</p>
          <p class="ana-profit-value">{{ financialAnalysis.profit.value }}<i>{{ financialAnalysis.profit.unit }}</i></p>
          <p class="ana-profit-payable">{{ financialAnalysis.profit.payableLabel }}<b>{{ financialAnalysis.profit.payableValue }}</b></p>
          <div class="ana-profit-gauge">
            <span class="ana-profit-rate">{{ financialAnalysis.profit.rate }}</span>
            <i :style="{ height: financialAnalysis.profit.fill + '%' }">{{ financialAnalysis.profit.rateLabel }}</i>
          </div>
        </article>
        <article class="ana-funds-panel">
          <p class="ana-block-title">{{ financialAnalysis.funds.title }}</p>
          <p class="ana-funds-note">{{ financialAnalysis.funds.note }}</p>
          <p class="ana-funds-balance">{{ financialAnalysis.funds.balanceTitle }}</p>
          <div class="ana-funds-box">
            <p class="ana-funds-net"><span>{{ financialAnalysis.funds.netLabel }}</span><b>{{ financialAnalysis.funds.netValue }}<i>{{ financialAnalysis.funds.netUnit }}</i></b></p>
            <ul>
              <li v-for="row in financialAnalysis.funds.rows" :key="row.key">
                <span>{{ row.label }}</span>
                <span class="ana-funds-bar"><i/></span>
                <b>{{ row.value }}</b>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- ===== 4. 风险预警 ===== -->
    <section class="ana-card ana-risk" aria-label="风险预警">
      <div class="ana-risk-head">
        <div>
          <p class="ana-metric"><span>{{ riskWarning.title }}</span><b>{{ riskWarning.value }}</b><i>{{ riskWarning.unit }}</i></p>
          <p class="ana-sub">{{ riskWarning.safety }}</p>
          <p class="ana-stars"><van-icon v-for="n in 5" :key="n" name="star" :class="{ 'is-muted': n > riskWarning.stars }"/></p>
          <p class="ana-hint">{{ riskWarning.note }}</p>
        </div>
        <span class="ana-risk-chart"><AnalysisCharts kind="risk-donut" :data="riskWarning.categories" :center-label="riskWarning.highRisk" label="风险分类占比"/></span>
      </div>

      <div class="ana-risk-body">
        <article class="ana-tile ana-cargo">
          <p class="ana-tile-head">{{ riskWarning.cargo.title }}</p>
          <p class="ana-cargo-value"><b>{{ riskWarning.cargo.kinds }}</b><i>{{ riskWarning.cargo.kindsUnit }}</i> / <b>{{ riskWarning.cargo.weight }}</b><i>{{ riskWarning.cargo.weightUnit }}</i></p>
          <p class="ana-sub">{{ riskWarning.cargo.value }}</p>
          <p class="ana-sub">{{ riskWarning.cargo.highRiskKinds }}</p>
          <div class="ana-cargo-detail">
            <p><span>{{ riskWarning.cargo.detail.name }}</span><em>{{ riskWarning.cargo.detail.tag }}</em></p>
            <p class="ana-sub">{{ riskWarning.cargo.detail.window }}</p>
            <p class="ana-sub">{{ riskWarning.cargo.detail.route }}</p>
          </div>
        </article>
        <div class="ana-risk-side">
          <article v-for="group in [riskWarning.vehicle, riskWarning.driver]" :key="group.title" class="ana-tile ana-risk-item">
            <p class="ana-tile-head">{{ group.title }}</p>
            <div class="ana-risk-item-body">
              <p class="ana-risk-count">{{ group.value }}<i>{{ group.unit }}</i></p>
              <span class="ana-peak"><AnalysisCharts kind="peak" :text="group.peak" :from="group.peakFrom" :to="group.peakTo" :label="`${group.title}高发时段`"/></span>
            </div>
            <p class="ana-risk-foot"><span>{{ group.riskLabel }}</span><b>{{ group.riskValue }}</b><em>{{ group.route }}</em></p>
          </article>
        </div>
      </div>

      <div class="ana-trend">
        <AnalysisCharts kind="combo" :bars="riskWarning.trend.bars" :lines="riskWarning.trend.lines" :ticks="riskWarning.trend.ticks" :axis="riskWarning.trend.axis" label="预警趋势组合图"/>
        <div class="ana-trend-legend">
          <span><i class="is-bar"/>{{ riskWarning.trend.legendTotal }}</span>
          <span v-for="line in riskWarning.trend.lines" :key="line.key"><i class="is-line" :style="{ background: line.color }"/>{{ line.label }}</span>
        </div>
      </div>
    </section>
  </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AnalysisCharts from './AnalysisCharts.vue'
import { businessPerformance, financialAnalysis, riskWarning, scoreOverview } from './analysis-data.js'

// 与条带 SVG 的间距和柱宽保持一致，虚线分别落在两段交界与收益段末端。
const revenue = businessPerformance.revenue
const revenueStripWidth = revenue.bars * 9.6
const revenueBoundaryStyle = {
  '--ana-cost-end': `${(revenue.highlightFrom * 9.6 - 2.1) / revenueStripWidth * 100}%`,
  '--ana-profit-end': `${((revenue.bars - 1) * 9.6 + 5.4) / revenueStripWidth * 100}%`,
}

// 以设计画板为唯一尺寸基准；外层手机容器负责滚动，页内不新增滚动区域。
const viewport = ref(null)
const scale = ref(351 / 589)
let resizeObserver
onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width > 0) scale.value = entry.contentRect.width / 589
  })
  resizeObserver.observe(viewport.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style src="./analysis.css"></style>
