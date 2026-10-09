<template>
  <section class="business-pixso" aria-label="货主经营">
    <div ref="scrollRoot" class="business-scroll">
      <div class="score-region">
        <BusinessStatusBar />
        <header class="page-nav"><h1>经营</h1><small>09月28日 09:30 更新</small></header>
        <nav class="period-tabs" aria-label="经营统计周期"><button v-for="option in businessPeriodOptions" :key="option.key" :class="{ active: period === option.key }" @click="changePeriod(option.key)">{{ option.label }}</button></nav>
        <div class="score-overview">
          <div class="score-copy"><span>运输经营综合评分</span><strong>{{ score }}<small>分</small></strong><b>整体表现良好</b><small>{{ periodOption.range }}</small></div>
          <BusinessCharts class="score-radar" kind="radar" :data="dimensions" label="发货、承接、时效、成本、异常处理五维评分" />
        </div>
        <div class="score-tags"><span>承接较稳</span><span>交付良好</span><span class="warm">成本需关注</span></div>
      </div>
      <div class="executive-note"><span>“</span><p><b>交付整体稳定，成本仍有优化空间。</b>{{ highestBenchmark.route }}运价高于平台同条件参考{{ highestBenchmark.deviation.toFixed(1) }}%，另有{{ report.overdue }}单异常需要优先跟进。</p></div>
      <nav class="section-nav annot-zhiyunShipperHome-rule-business-object-boundary" aria-label="经营模块定位"><button v-for="item in sections" :key="item.key" @click="jump(item.key)">{{ item.label }}</button></nav>
      <main class="business-main">
        <section ref="progressSection" class="pixso-card">
          <header class="card-heading"><h2>发货与运输</h2><button class="round-link" aria-label="查看全部货源" @click="openCargoList('planned')">›</button></header>
          <div class="transport-overview">
            <div class="metric-primary"><span>累计发货量</span><strong>{{ fmt(report.loaded) }}<small>吨</small></strong><p>计划 {{ fmt(report.planned) }} 吨</p><span class="state-tag">已发出 {{ (report.loaded/report.planned*100).toFixed(1) }}%</span></div>
            <div class="transport-orbit"><svg viewBox="0 0 150 150" role="img" :aria-label="'送达货量占计划的'+deliveryPercent+'%'"><defs><linearGradient id="transport-gradient"><stop stop-color="#4372ff"/><stop offset="1" stop-color="#9edaff"/></linearGradient></defs><circle cx="75" cy="75" r="63" fill="none" stroke="#edf2ff"/><circle cx="75" cy="75" r="53" fill="none" stroke="#e7efff" stroke-width="15"/><circle cx="75" cy="75" r="53" fill="none" stroke="url(#transport-gradient)" stroke-width="15" :stroke-dasharray="deliveryPercent*3.33+' 333'" transform="rotate(-90 75 75)"/><circle cx="75" cy="75" r="40" fill="#f8faff"/></svg><div><strong>{{ deliveryPercent }}%</strong><span>货量送达进度</span></div></div>
          </div>
          <div class="progress-bars">
            <button v-for="(stage,i) in stages.slice(1)" :key="stage.key" @click="openCargoList(stage.key)"><span>{{ stage.label }}</span><i><b :class="'tone-'+i" :style="{ width: report[stage.key]/report.planned*100+'%' }"></b></i><strong>{{ fmt(report[stage.key]) }}<small>吨</small></strong></button>
          </div>
          <div class="capacity-strip"><img src="./business-assets/acceptance-gauge.svg" alt="" /><div><span>货源承接率</span><strong>{{ (report.accepted/report.planned*100).toFixed(1) }}%</strong></div><p>尚有 <b>{{ fmt(report.planned-report.accepted) }}吨</b> 待承接<br/>涉及 {{ report.sources.filter(s=>s.planned>s.accepted).length }} 票货源</p></div>
          <div class="subheading"><h3>还有哪些货没推进？</h3></div>
          <div class="gap-tabs"><button v-for="gap in gaps" :key="gap.key" :class="{ active: selectedGap === gap.key }" @click="selectedGap = gap.key"><span>{{ gap.label }}</span><strong>{{ fmt(gap.value) }}<small>吨</small></strong></button></div>
          <div class="cargo-focus"><button v-for="cargo in gapCargoes.slice(0,2)" :key="cargo.id" @click="openCargo(cargo)"><span><b>{{ cargo.route }}</b><small>{{ cargo.cargo }} · {{ cargo.number }}</small></span><strong>{{ fmt(cargoGap(cargo)) }}<small>吨 ›</small></strong></button></div>
          <button class="text-link all-link" @click="openCargoList()">查看{{ activeGap.label }}的{{ gapCargoes.length }}票货源 ›</button>
        </section>

        <section ref="deliverySection" class="pixso-card">
          <header class="card-heading"><h2>交付与异常</h2><button class="round-link" aria-label="查看异常明细" @click="openEvents()">›</button></header>
          <div class="risk-overview"><div class="metric-primary"><span>当前异常运单</span><strong>{{ report.events.length }}<small>单</small></strong><p>按时送达 <b>{{ onTime }}%</b></p><small>{{ report.onTimeCount }}/{{ report.dueCount }} 单按时送达</small></div><BusinessCharts kind="risk" :data="eventGroups" :value="report.overdue" label="异常按承接装货、在途、交付、凭证四类分布" /></div>
          <div class="risk-panels">
            <div class="risk-cargo"><span>受影响货源</span><strong>{{ report.affectedCargoes }}<small>票 / </small>{{ report.affectedTons }}<small>吨</small></strong><p>涉及 {{ affectedRoutes.length }} 条线路</p><div class="risk-hotspot"><small>异常较集中线路</small><b>{{ affectedRoutes[0].route }}</b><span>{{ affectedRoutes[0].count }}单 · {{ affectedRoutes[0].tons }}吨</span></div></div>
            <div class="risk-small"><span>在途运输异常</span><strong>{{ eventGroups.find(g=>g.key==='transit').count }}<small>单</small></strong><p>故障 · 定位中断 · 疑似偏航</p><span class="state-tag">涉及 {{ report.events.filter(e=>e.group==='transit').reduce((s,e)=>s+e.tons,0) }} 吨货物</span></div>
            <div class="risk-small"><span>处理进度</span><strong>{{ report.overdue }}<small>单需跟进</small></strong><p>到场延迟、到货超时</p><span class="state-tag orange">平台正在处理</span></div>
          </div>
          <div class="subheading"><h3>异常类型分布</h3><span>当前待处理 · 单</span></div>
          <div class="exception-distribution"><button v-for="type in eventTypes" :key="type.label" @click="openEvents(type.label)"><span>{{ type.label }}</span><i><b :style="{width: type.count / maxEventType*100+'%'}"></b></i><strong>{{ type.count }}</strong></button></div>
          <div class="subheading"><h3>优先跟进</h3><span>{{ report.overdue }}单</span></div>
          <button v-for="event in priorityEvents" :key="event.id" class="event-focus" @click="openEvent(event)"><span class="event-mark">!</span><div><strong>{{ event.type }}</strong><p>{{ event.cargo.route }} · {{ event.tons }}吨{{ event.cargo.cargo }}</p><small>{{ event.progress }}</small></div><b>›</b></button>
          <div class="analysis-note"><b>小简分析</b><p>在途问题集中在泉州→南昌和宁德→温州；定位中断、疑似偏航尚待核查。到货超时已影响收货安排，建议先跟进平台承诺的到货时间。</p></div>
        </section>

        <section ref="costSection" class="pixso-card annot-zhiyunShipperHome-rule-business-market-reference">
          <header class="card-heading"><h2>线路运价对比</h2><span class="muted">元/吨</span></header>
          <div class="price-benchmark">
            <div class="benchmark-heading"><b>运价对标</b><span>自己的运价，高还是低？</span></div>
            <div class="chart-legend"><span><i class="own"></i>自有实际</span><span><i class="reference"></i>平台同条件参考</span></div>
            <div class="benchmark-bars" role="img" aria-label="各线路自有实际吨运价与平台参考对比">
              <button v-for="route in report.routes" :key="route.id" :class="{selected:selectedLane===route.id}" @click="selectedLane=route.id">
                <div class="pair"><div><b>{{ route.currentRate.toFixed(0) }}</b><i class="own" :style="{height:route.currentRate/benchmarkMax*94+'px'}"></i></div><div><b>{{ route.referenceRate }}</b><i class="reference" :style="{height:route.referenceRate/benchmarkMax*94+'px'}"></i></div></div>
                <span>{{ route.route.split(' → ')[0] }}<br/>↓ {{ route.route.split(' → ')[1] }}</span>
              </button>
            </div>
            <button v-for="route in report.routes" :key="route.id" class="benchmark-line" :class="{selected:selectedLane===route.id}" @click="selectedLane=route.id"><span class="small-dot"></span><strong>{{ route.route }}</strong><span>{{ route.currentRate>route.referenceRate?'高于':'低于' }} {{ Math.abs(route.deviation).toFixed(1) }}%</span><b :class="{saving:route.deviation<=0}">{{ route.deviation>0?'需关注':'较有优势' }}</b></button>
          </div>
          <div class="subheading"><h3>{{ lane.route }} · 运价走势</h3><span>{{ period==='month'?'按周':'分期' }}</span></div>
          <p class="muted">{{ lane.cargo }} · {{ lane.vehicle }} · 基础运费，不含补贴及扣费</p>
          <BusinessCharts class="rate-trend" kind="trend" :data="lane.trend" :label="lane.route+'自有及平台参考运价走势'" />
          <div class="sample-caption"><span>自有 {{ lane.records.length }} 单</span><span>平台参考 {{ lane.referenceCount }} 单</span><button class="text-link" @click="openBills(lane.records,lane.route+' · 运价构成')">查看构成 ›</button></div>
          <div class="analysis-note"><b>小简分析</b><p>{{ lane.route }}自有均价{{ lane.currentRate.toFixed(1) }}元/吨，{{ lane.deviation>0?'高于':'低于' }}平台同条件参考{{ Math.abs(lane.currentRate-lane.referenceRate).toFixed(1) }}元/吨。{{ lane.deviation>0?'可结合发货时段与运单费用核对差异原因。':'价格较有优势，可同时关注准时交付表现。' }}</p></div>
        </section>

        <section ref="financeSection" class="pixso-card annot-zhiyunShipperHome-rule-business-financial-states">
          <header class="card-heading"><h2>运输费用构成</h2><button class="round-link" aria-label="查看已结算费用明细" @click="openBills(report.settled,'已结算费用明细')">›</button></header>
          <div class="expense-overview"><div class="metric-primary"><span>已结算总费用</span><strong>{{ (netExpense/10000).toFixed(2) }}<small>万元</small></strong><p>{{ report.settled.length }} 单 · {{ fmt(settledTons) }} 吨</p></div><div class="expense-seal"><span>基础运费占比</span><strong>{{ (report.cost/(report.cost+report.subsidy)*100).toFixed(1) }}<small>%</small></strong></div></div>
          <div class="fee-ribbon"><b>费用构成</b><span>基础运费 ＋ 补贴 − 扣费</span></div>
          <div class="fee-rows">
            <button @click="openBills(report.settled,'基础运费明细')"><i class="small-dot"></i><span>基础运费</span><strong>¥{{ money(report.cost) }}</strong></button>
            <button @click="openBills(report.settled.filter(b=>b.subsidy),'装卸补贴明细')"><i class="small-dot pale"></i><span>装卸补贴</span><strong>＋¥{{ money(report.subsidy) }}</strong></button>
            <button @click="openBills(report.settled.filter(b=>b.deduction),'扣费抵减明细')"><i class="small-dot teal"></i><span>扣费抵减</span><strong class="saving">−¥{{ money(report.deduction) }}</strong></button>
          </div>
          <div class="subheading"><h3>钱主要花在哪些线路？</h3><span>基础运费占比</span></div>
          <div class="spend-routes"><button v-for="(route,i) in expenseRoutes" :key="route.id" @click="selectedLane=route.id;jump('cost')"><span>{{ route.route }}</span><i><b :class="'tone-'+i" :style="{width:route.amount/report.cost*100+'%'}"></b></i><strong>{{ (route.amount/report.cost*100).toFixed(1) }}%</strong></button></div>
          <div class="analysis-note"><b>小简分析</b><p>{{ expenseRoutes[0].route }}占基础运费{{ (expenseRoutes[0].amount/report.cost*100).toFixed(1) }}%，可优先结合该线路的运价对标查看成本。补贴与扣费单独列出，避免把费用调整误认为运价变化。</p></div>
          <div class="finance-actions"><button @click="openBills(report.pending,'待结算运单')"><span>待结算</span><b>{{ report.pending.length }}单 ›</b></button><button @click="openBills(report.unpaid,'待付款运单')"><span>待付款</span><b>{{ (report.payable/10000).toFixed(2) }}万元 ›</b></button></div>
        </section>
      </main>
    </div>
    <VanPopup v-model:show="drawerOpen" position="bottom" :teleport="null" round :style="{ height: '88%' }" class="business-drawer" :class="{ 'annot-zhiyunShipperHome-rule-business-bill-detail': drawerOpen && drawerKind === 'bills' }" @closed="selectedEvent = null">
      <div class="drawer-header" :class="{ 'annot-zhiyunShipperHome-rule-business-cargo-detail': drawerOpen && drawerKind === 'cargo' }"><h2>{{ drawerTitle }}</h2><button aria-label="关闭明细" @click="drawerOpen = false">×</button></div>
      <div class="drawer-body" :class="{ 'annot-zhiyunShipperHome-rule-business-event-evidence': drawerOpen && drawerKind === 'event' }">
        <template v-if="drawerKind === 'cargo'">
          <article v-for="cargo in drawerCargoes" :key="cargo.id" class="drawer-record">
            <h3>{{ cargo.route }} · {{ cargo.cargo }}</h3><p class="muted">{{ cargo.number }}</p>
            <dl class="comparison-facts"><div><dt>计划发货</dt><dd>{{ fmt(cargo.planned) }}吨</dd></div><div><dt>已承接 / 已装货</dt><dd>{{ fmt(cargo.accepted) }} / {{ fmt(cargo.loaded) }}吨</dd></div><div><dt>已送达</dt><dd>{{ fmt(cargo.delivered) }}吨</dd></div><div><dt>承接平台</dt><dd>{{ cargo.platform }}</dd></div><div><dt>装货安排</dt><dd>{{ cargo.deadline }}</dd></div></dl>
            <p v-if="cargo.planned !== cargo.delivered">待承接{{ fmt(cargo.planned - cargo.accepted) }}吨 · 待装货{{ fmt(cargo.accepted - cargo.loaded) }}吨 · 待送达{{ fmt(cargo.loaded - cargo.delivered) }}吨</p>
          </article>
        </template>
        <template v-else-if="drawerKind === 'event'">
          <template v-if="selectedEvent">
            <span class="state-tag" :class="{ orange: selectedEvent.overdue }">{{ selectedEvent.suspected ? '疑似预警 · ' : '' }}{{ selectedEvent.status }}</span>
            <h3 class="drawer-subtitle">{{ selectedEvent.cargo.route }} · {{ selectedEvent.tons }}吨{{ selectedEvent.cargo.cargo }}</h3>
            <p class="muted">{{ selectedEvent.bill.number }}<br />货源 {{ selectedEvent.cargo.number }}</p>
            <dl class="comparison-facts"><div><dt>发现时间</dt><dd>{{ selectedEvent.time }}</dd></div><div><dt>影响</dt><dd>{{ selectedEvent.impact }}</dd></div><div><dt>当前处理方</dt><dd>{{ selectedEvent.owner }}</dd></div></dl>
            <h3 class="drawer-subtitle">处理进展</h3><ol class="event-timeline"><li v-for="step in selectedEvent.timeline" :key="step.time"><small>{{ step.time }}</small><p>{{ step.text }}</p></li></ol>
            <button class="outline-action" @click="openBills([selectedEvent.bill], '关联运单')">查看关联运单 ›</button>
          </template>
          <template v-else><button v-for="event in drawerEvents" :key="event.id" class="drawer-record event-list-button" @click="openEvent(event)"><div class="event-heading"><h3>{{ event.type }}</h3><span class="state-tag">{{ event.status }}</span></div><p>{{ event.cargo.route }} · {{ event.tons }}吨</p><p class="muted">{{ event.bill.number }}</p><p>{{ event.progress }} ›</p></button></template>
        </template>
        <template v-else>
          <p class="muted">{{ drawerBills.length }}单 · {{ fmt(drawerBills.reduce((sum, bill) => sum + bill.tons, 0)) }}吨</p>
          <article v-for="bill in drawerBills" :key="bill.id" class="drawer-record">
            <div class="event-heading"><h3>{{ bill.route }}</h3><span class="state-tag">{{ billStateLabels[bill.state] }}</span></div><p class="muted">{{ bill.number }}<br />货源 {{ bill.cargoNo }}</p><p>{{ bill.cargo }} · {{ bill.tons }}吨 · {{ bill.platform }}</p>
            <dl class="comparison-facts"><div><dt>{{ bill.state === 'pending' || bill.state === 'transporting' ? '约定吨运价' : '结算吨运价' }}</dt><dd>{{ money(bill.rate) }}元/吨</dd></div><div v-if="bill.state === 'settled' || bill.state === 'unpaid'"><dt>{{ bill.state === 'unpaid' ? '已确认应付' : '基础运费' }}</dt><dd>¥{{ money(bill.amount) }}</dd></div><div v-if="bill.subsidy"><dt>装卸补贴</dt><dd>＋¥{{ money(bill.subsidy) }}</dd></div><div v-if="bill.deduction"><dt>扣费抵减</dt><dd>−¥{{ money(bill.deduction) }}</dd></div><div v-if="bill.reason"><dt>当前卡点</dt><dd>{{ bill.reason }}</dd></div><div v-if="bill.waitDays"><dt>等待时间</dt><dd>{{ bill.waitDays }}天</dd></div></dl>
            <p v-if="bill.state === 'pending'" class="muted">补齐凭证与重量核对后，逐单确认结算。</p>
          </article>
        </template>
      </div>
    </VanPopup>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Popup as VanPopup } from 'vant'
import 'vant/lib/popup/style'
import BusinessCharts from './BusinessCharts.vue'
import BusinessStatusBar from './BusinessStatusBar.vue'
import { businessPeriodOptions, businessExceptionGroups, businessScoreDimensions, getBusinessReport } from './business-data.js'
import './business-pixso.css'

const emit = defineEmits(['overlay-change'])
const period = ref('month')
const periodOption = computed(() => businessPeriodOptions.find(item => item.key === period.value))
const report = computed(() => getBusinessReport(period.value))
const fmt = value => Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
const money = value => Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const onTime = computed(() => report.value.onTimeRate.toFixed(1))
const sections = [{ key: 'progress', label: '发货进度' }, { key: 'delivery', label: '交付异常' }, { key: 'cost', label: '运价对比' }, { key: 'finance', label: '费用构成' }]
const scrollRoot = ref(null)
const progressSection = ref(null), deliverySection = ref(null), costSection = ref(null), financeSection = ref(null)
function jump(key) {
  const target = { progress: progressSection, delivery: deliverySection, cost: costSection, finance: financeSection }[key].value
  scrollRoot.value.scrollTo({ top: target.getBoundingClientRect().top - scrollRoot.value.getBoundingClientRect().top + scrollRoot.value.scrollTop - 58, behavior: 'smooth' })
}
const stages = [{ key: 'planned', label: '计划发货' }, { key: 'accepted', label: '已承接' }, { key: 'loaded', label: '已装货' }, { key: 'delivered', label: '已送达' }]
const selectedGap = ref('accept')
const gaps = computed(() => [
  { key: 'accept', label: '待承接', value: report.value.planned - report.value.accepted },
  { key: 'load', label: '已承接待装', value: report.value.accepted - report.value.loaded },
  { key: 'deliver', label: '已装待送达', value: report.value.loaded - report.value.delivered },
])
const activeGap = computed(() => gaps.value.find(item => item.key === selectedGap.value))
const cargoGap = cargo => selectedGap.value === 'accept' ? cargo.planned - cargo.accepted : selectedGap.value === 'load' ? cargo.accepted - cargo.loaded : cargo.loaded - cargo.delivered
const gapCargoes = computed(() => report.value.sources.filter(item => cargoGap(item) > 0).sort((a, b) => cargoGap(b) - cargoGap(a)))
const eventFilter = ref('all')
const eventGroups = computed(() => businessExceptionGroups.map(group => ({ ...group, short: ({loading:'装货',transit:'在途',delivery:'交付',voucher:'凭证'})[group.key], count: report.value.events.filter(event => event.group === group.key).length })).filter(item => item.count > 0))
const filteredEvents = computed(() => report.value.events.filter(item => eventFilter.value === 'all' || item.group === eventFilter.value))
const priorityEvents = computed(() => [...filteredEvents.value].sort((a, b) => Number(Boolean(b.overdue)) - Number(Boolean(a.overdue))).slice(0, 2))
const eventTypes = computed(() => [...new Set(filteredEvents.value.map(item => item.type))].map(label => ({ label, count: filteredEvents.value.filter(item => item.type === label).length })))
const selectedLane = ref('l1')
const lane = computed(() => report.value.routes.find(item => item.id === selectedLane.value))
const settledTons = computed(() => report.value.settled.reduce((sum, item) => sum + item.tons, 0))
const drawerOpen = ref(false), drawerKind = ref(''), drawerTitle = ref('')
const drawerCargoes = ref([]), drawerEvents = ref([]), drawerBills = ref([]), selectedEvent = ref(null)
const billStateLabels = { pending: '待结算', unpaid: '待付款', settled: '已结算', transporting: '运输中' }
watch(drawerOpen, value => emit('overlay-change', value))
function showDrawer(kind, title) { drawerKind.value = kind; drawerTitle.value = title; drawerOpen.value = true }
function openCargo(cargo) { drawerCargoes.value = [cargo]; showDrawer('cargo', '货源进度明细') }
function openCargoList(stage) {
  drawerCargoes.value = stage ? report.value.sources.filter(item => item[stage] > 0) : gapCargoes.value
  showDrawer('cargo', stage ? stages.find(item => item.key === stage).label + ' · 货源明细' : activeGap.value.label + ' · 货源明细')
}
function openEvents(type) { selectedEvent.value = null; drawerEvents.value = filteredEvents.value.filter(item => !type || item.type === type); showDrawer('event', type || '当前异常明细') }
function openEvent(event) { selectedEvent.value = event; showDrawer('event', event.type + ' · 处理进展') }
function openBills(bills, title) { drawerBills.value = bills; showDrawer('bills', title) }
function changePeriod(key) { period.value = key; selectedGap.value = 'accept'; eventFilter.value = 'all' }

const dimensions = computed(() => ['发货执行','运力承接','运输时效','成本表现','异常处理'].map((label,i) => ({label,value:businessScoreDimensions[period.value][i]})))
const score = computed(() => Math.round(dimensions.value.reduce((s,d)=>s+d.value,0)/dimensions.value.length))
const deliveryPercent = computed(() => Math.round(report.value.delivered/report.value.planned*100))
const highestBenchmark = computed(() => [...report.value.routes].sort((a,b)=>b.deviation-a.deviation)[0])
const benchmarkMax = computed(() => Math.max(...report.value.routes.flatMap(r=>[r.currentRate,r.referenceRate])))
const expenseRoutes = computed(() => [...report.value.routes].sort((a,b)=>b.amount-a.amount))
const netExpense = computed(() => report.value.cost + report.value.subsidy - report.value.deduction)
const affectedRoutes = computed(() => [...new Set(report.value.events.map(e=>e.cargo.route))].map(route=>({route,count:report.value.events.filter(e=>e.cargo.route===route).length,tons:report.value.events.filter(e=>e.cargo.route===route).reduce((s,e)=>s+e.tons,0)})).sort((a,b)=>b.count-a.count))
const maxEventType = computed(() => Math.max(...eventTypes.value.map(t=>t.count)))
</script>
