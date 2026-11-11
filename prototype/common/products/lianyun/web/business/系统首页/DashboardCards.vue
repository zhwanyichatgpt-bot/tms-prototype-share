<script setup>
import { ref } from 'vue'
import DashboardCard from './DashboardCard.vue'
import DashboardTrend from './DashboardTrend.vue'
import { stages, stockCards, tasks } from './dashboard-data.js'

const blue = 'var(--wb-chart-1)'
const cyan = 'var(--wb-chart-3)'
const secondaryBlue = 'var(--wb-chart-2)'
const orange = 'var(--wb-chart-5)'
const scheduleTab = ref('货源大厅')
const selectedDay = ref(5)
const weighTab = ref('过磅计划')
const stockTabs = ref({ receiving: '入库类型', shipping: '出库类型' })
const zeroes = Array(12).fill(0)
const bars = (name, values, color = blue, stack = false) => ({ name, values, color, type: 'bar', stack })
const line = (name, values, color) => ({ name, values, color, type: 'line' })
const transferSeries = card => [
  bars(card.prefix + '入库量', card.bars),
  bars(card.prefix + '出库量', card.bars.map(value => Math.round(value * .04)), secondaryBlue, true),
  ...(card.trend ? [line(card.lead, card.bars.map(value => Math.round(value * .035)), orange)] : []),
]
const latestIncome = [
  line('总入账收益', [0, 0, 0, 0, 0], cyan),
  line('总运输成本', [390, 390, 390, 390, 390], blue),
  { name: '平均单趟效益', color: 'var(--wb-chart-4)', type: 'legend', values: [] },
]
const dateLabels = ['11/01', '11/02', '11/03', '11/04', '11/05']
</script>

<template>
  <div class="system-dashboard-grid">
    <DashboardCard title="待办任务" icon="☷" :count="56" class="dashboard-short">
      <div class="dashboard-task-scroll">
        <div v-for="[title, creator] in tasks" :key="title" class="dashboard-task-row">
          <div><strong>{{ title }}</strong><mark>待处理</mark></div>
          <small>创建人 <i aria-hidden="true"></i>{{ creator }}　　时间　截止2026-11-05</small>
        </div>
      </div>
    </DashboardCard>

    <DashboardCard title="运力资源统计" icon="▥" timestamp class="dashboard-short dashboard-resources">
      <div class="dashboard-resource-grid">
        <div v-for="[name, total, unit, percent] in [['运输司机',60,'人',10],['运输车辆',332,'辆',7]]" :key="name" class="dashboard-resource">
          <div>{{ name }}</div>
          <p><b>{{ total }}</b> {{ unit }}</p>
          <span class="dashboard-resource-rate"><b>{{ percent }}%</b><small>任务中</small></span>
          <svg viewBox="0 0 130 22" preserveAspectRatio="none" aria-hidden="true"><path d="M0 9H9L15 3L21 9H130V22H0Z" fill="#e9effe"/><path d="M0 9H9L15 3L21 9H130" fill="none" stroke="#6275d4"/></svg>
          <small v-if="unit === '辆'" class="dashboard-resource-foot">内部 <b>93</b>　外部 <b>239</b></small>
        </div>
      </div>
    </DashboardCard>

    <DashboardCard title="运输计划" icon="▥" period="今日" more class="dashboard-short">
      <div class="dashboard-plan">
        <div class="dashboard-plan-count"><b>0</b> 条 <small>新增 0 条<span>＋</span></small></div>
        <p>当前完成进度 <em>0%</em></p>
        <div class="dashboard-progress"></div>
        <div class="dashboard-plan-status">
          <div v-for="[label, symbol] in [['已完成','✓'],['进行中','◷'],['未开始','▤']]" :key="label">
            <i class="dashboard-card-icon">{{ symbol }}</i><span>{{ label }}<br><b>0</b>条</span>
          </div>
        </div>
      </div>
    </DashboardCard>

    <DashboardCard title="运单任务" icon="▤" period="今日" more class="dashboard-short">
      <div class="dashboard-waybills">
        <div class="dashboard-waybill-primary">
          <span>全部任务</span><p><b>1</b> 条</p>
          <div class="dashboard-gauge"><div><strong>100%</strong><small>已完成</small></div></div>
          <footer>今日新增任务 1条<small>环比 <em>↑100%</em></small></footer>
        </div>
        <div class="dashboard-waybill-metrics">
          <div><i class="dashboard-card-icon">▥</i><small title="平均接单数量">平均接单数量</small><b>1</b><small>单/天</small></div>
          <div><small title="平均运输里程">平均运输里程</small><b>331</b><small>Km/天</small></div>
          <div><small title="平均承运趟次">平均承运趟次</small><b>1</b><small>车/天</small></div>
        </div>
      </div>
    </DashboardCard>

    <DashboardCard title="日程安排" icon="▦" class="dashboard-schedule">
      <p class="dashboard-month">2026年　11月　▴</p>
      <div class="dashboard-week">
        <span v-for="day in '日一二三四五六'" :key="day">{{ day }}</span>
        <button v-for="day in 7" :key="day" type="button" :aria-pressed="day === selectedDay" @click="selectedDay = day">0{{ day }}</button>
      </div>
      <div class="dashboard-schedule-tabs">
        <button v-for="label in ['货源大厅','运单动态','消息通知']" :key="label" type="button" :aria-pressed="scheduleTab === label" @click="scheduleTab = label">{{ label }}</button>
      </div>
      <div v-if="scheduleTab === '货源大厅' && selectedDay === 5" class="dashboard-schedule-item">
        <time>10:46<small>11/05</small></time><span aria-hidden="true">∘</span>
        <div><strong>计划：热轧卷板（Q355B）</strong><small>发布企业　<span>至简测试企业</span></small></div><mark>已发布</mark>
      </div>
      <p v-else class="dashboard-schedule-empty">暂无数据</p>
    </DashboardCard>

    <DashboardCard title="运输概况" icon="●" timestamp class="dashboard-overview">
      <div class="dashboard-stage-grid">
        <div v-for="(stage, index) in stages" :key="stage.title" class="dashboard-stage" :class="'dashboard-stage-' + index">
          <h3><i aria-hidden="true">{{ stage.icon }}</i>{{ stage.title }}<span></span></h3>
          <div class="dashboard-stage-items">
            <div v-for="[label, number] in stage.items" :key="label" class="dashboard-stage-metric">
              <span>{{ label }}</span><span class="dashboard-stage-next" aria-hidden="true">›</span>
              <p><b>{{ number }}</b> 条</p>
              <small v-if="label === '运输核算'">货主 733<br>司机 122<br>承运方 ⑤</small>
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>

    <DashboardCard title="运输效益总览" icon="⇄" period="本月" class="dashboard-efficiency">
      <div class="dashboard-profit">
        <div class="dashboard-profit-primary"><small>总净收益</small><b>¥ -1944</b><p>上期总净收益 -16928.42元</p><small>环比 <em>↓ −88.5%</em></small></div>
        <div><div><small>总入账收益</small><p><b>¥ 0</b><small>环比 0%</small></p></div><div><small>总运输成本</small><p><b>¥ 1944</b><small>环比 <em>↓ −88.5%</em></small></p></div></div>
      </div>
      <DashboardTrend :labels="dateLabels" :series="latestIncome" :max="400" :steps="4" :right-scale="['1','0.8','0.6','0.4','0.2','0']"/>
    </DashboardCard>

    <DashboardCard title="仓库概览统计" icon="⌂" timestamp>
      <div class="dashboard-stock-summary">
        <div class="dashboard-warehouse-main">仓库使用<p><b>45</b> 个</p>
          <div class="dashboard-gauge three-quarters"><div><strong>75%</strong><small>使用率</small></div></div>
          <small>总数 <b>60</b>个</small><small>空闲仓库 <b>15</b>个</small>
        </div>
        <div class="dashboard-stock-usage">
          <div v-for="[label, rate, used, total] in [['区位',77,37,48],['货位',7,87,1237]]" :key="label">
            {{ label }}<div class="dashboard-progress"><i :style="{width: rate + '%'}"></i><span :style="{left: Math.min(rate, 85) + '%'}">{{ rate }}%</span></div><small>使用中 <b>{{ used }}</b><span>总数 {{ total }}个</span></small>
          </div>
        </div>
      </div>
      <DashboardTrend :labels="['11月','','01月','','03月','','05月','','07月','','09月','']" :series="[bars('库存总量', Array(12).fill(1150000000)),line('库存变化趋势',zeroes,orange)]" :max="1200000000" :steps="6" :right-scale="['100%','80%','60%','40%','20%','','0%']"/>
    </DashboardCard>

    <DashboardCard :title="stockCards[0].title" icon="▥" period="本月" class="dashboard-inventory">
      <div class="dashboard-stock-summary">
        <div class="dashboard-mini-main">
          <div v-for="[title, unit] in [['总入库数量','万吨'],['总入库金额','万元']]" :key="title"><small>{{ title }}</small><p>0.00 <small>{{ unit }}</small></p><em>环比↓−100%</em></div>
        </div>
        <div class="dashboard-mini-grid"><div v-for="(item, i) in stockCards[0].metrics" :key="item"><small>{{ item }}</small><p>{{ i % 2 ? '0.00' : '0' }} <small>{{ i % 2 ? '万吨' : '车' }}</small></p></div></div>
      </div>
      <div class="dashboard-subtabs"><button v-for="tab in ['入库类型','入库货品']" :key="tab" type="button" :aria-pressed="stockTabs.receiving === tab" @click="stockTabs.receiving = tab">{{ tab }}</button></div>
      <div class="dashboard-empty"><img src="/zhiyun-mobile-assets/invoice/empty-box.png" alt=""><small>暂无数据</small></div>
    </DashboardCard>

    <DashboardCard title="无人值守概览" icon="◉" period="本月" more>
      <div class="dashboard-scale-lead"><span>单车平均过磅费</span><b>¥0.00</b><div class="dashboard-gauge"><div><strong>5</strong><small>地磅数</small></div></div></div>
      <div class="dashboard-scale-numbers"><div v-for="[title,value,unit] in [['平均过磅时长','0','分'],['平均过磅重量','0.00','吨'],['日平均过磅总量','0.00','万吨/日']]" :key="title"><small>{{ title }}</small><p><b>{{ value }}</b> {{ unit }}</p></div></div>
      <DashboardTrend :series="[bars('过磅量',[0,0,100,0,0,0,520,240,350,20,0,0]),line('平均过磅时长',zeroes,orange)]" :max="600" :steps="6" :right-scale="['1','','','','','','0']"/>
    </DashboardCard>

    <DashboardCard title="过磅计划统计" icon="▣" period="本月" more>
      <div class="dashboard-weigh"><span class="dashboard-donut" aria-hidden="true"></span><div><p>过磅记录 <b>0</b> 条</p><div><section v-for="label in ['收货过磅','发货过磅']" :key="label">{{ label }}<b>0条</b><small>净重 0 万吨</small></section></div></div></div>
      <div class="dashboard-subtabs"><button v-for="tab in ['过磅计划','过磅总量']" :key="tab" type="button" :aria-pressed="weighTab === tab" @click="weighTab = tab">{{ tab }}</button></div>
      <DashboardTrend :series="[bars('发货',[2,3,4,11,10,7,4,10,2,5,1,0]),bars('收货',[0,0,2,3,0,2,1,3,0,1,0,0],secondaryBlue,true)]" :max="15"/>
    </DashboardCard>

    <DashboardCard title="实时仓储库存统计" icon="⌂" more>
      <div class="dashboard-stock-summary dashboard-current-stock">
        <div class="dashboard-warehouse-main">库存总量<p><b>114972.76</b> 万吨</p><small>可用库存 114972.74　溢损库存 0万吨</small><small>月均库存 114972.74　库存周转 0次/月</small></div>
        <div class="dashboard-mini-grid"><div><small>货品种类</small><p>33 种</p></div><div><small>库存价值</small><p>4825.09 万元</p></div></div>
      </div>
      <div class="dashboard-subtabs"><span>库存货品统计</span></div>
      <div class="dashboard-pie"><span>99.98%</span><div><p><i></i>蜂窝煤　<b>99.98%</b></p><p><i></i>其他　<b>0.02%</b></p></div></div>
    </DashboardCard>

    <DashboardCard v-for="card in stockCards.slice(1,4)" :key="card.key" :title="card.title" icon="▥" period="本月">
      <div class="dashboard-stock-summary">
        <div class="dashboard-mini-main dashboard-throughput"><small>{{ card.lead }}</small><p>0 <small>万吨/天</small></p><div class="dashboard-progress"></div><p>{{ card.prefix }}入库 <small>0万吨/天</small></p><p>{{ card.prefix }}出库 <small>0万吨/天</small></p></div>
        <div class="dashboard-mini-grid"><div v-for="(label, i) in ['入库单','出库单','入库量','出库量']" :key="label"><small>{{ label }}</small><p>0 <small>{{ i < 2 ? '条' : '万吨' }}</small></p></div></div>
      </div>
      <div class="dashboard-subtabs"><span>出入库统计</span></div>
      <DashboardTrend :series="transferSeries(card)" :max="card.max" :steps="card.max % 7 === 0 ? 7 : card.max === 60 ? 6 : 5"/>
    </DashboardCard>

    <DashboardCard :title="stockCards[4].title" icon="▥" period="本月" class="dashboard-inventory">
      <div class="dashboard-stock-summary">
        <div class="dashboard-mini-main"><div v-for="[title, unit] in [['总出库数量','万吨'],['总出库金额','万元']]" :key="title"><small>{{ title }}</small><p>0.00 <small>{{ unit }}</small></p><em>环比↓−100%</em></div></div>
        <div class="dashboard-mini-grid"><div v-for="item in stockCards[4].metrics" :key="item"><small>{{ item }}</small><p>0.00 <small>万吨</small></p></div></div>
      </div>
      <div class="dashboard-subtabs"><button v-for="tab in ['出库类型','出库货品']" :key="tab" type="button" :aria-pressed="stockTabs.shipping === tab" @click="stockTabs.shipping = tab">{{ tab }}</button></div>
      <div class="dashboard-empty"><img src="/zhiyun-mobile-assets/invoice/empty-box.png" alt=""><small>暂无数据</small></div>
    </DashboardCard>
  </div>
</template>
