<script setup>
import { computed, onMounted, ref } from 'vue'
import { waybillNumber } from '../waybill-mock'

const props = defineProps({ row: { type: Object, required: true } })
const emit = defineEmits(['close'])
const back = ref(null)
onMounted(() => back.value?.focus())

const money = value => `${waybillNumber(value)} 元`
const quantity = value => `${waybillNumber(value)} ${props.row.unit}`
const metrics = computed(() => {
  const row = props.row
  return [
    ['预估距离', `${waybillNumber(row.distance)} km`],
    ['实际距离', row.actualDistance == null ? '—' : `${waybillNumber(row.actualDistance)} km`],
    ['实际装货', quantity(row.loaded)],
    ['实际卸货', quantity(row.unloaded)],
    ['损耗', quantity(Math.max(row.loaded - row.unloaded, 0))],
    ['基础运费', row.settlement ? money(row.settlement.baseFreight) : '—'],
  ]
})
const feeSections = computed(() => {
  const { row } = props
  const settled = row.settlement
  return [
    {
      title: '在途费用',
      columns: ['费用名称', '金额（元）', '费用支出时间', '缴费地点', '关联结算单', '核销状态'],
      lines: row.expenses.map(fee => [fee.name, waybillNumber(fee.amount), fee.at, fee.location, settled?.id || '—', settled ? '已核销' : '未核销']),
    },
    {
      title: '其他补贴',
      columns: ['费用名称', '计费方式', '基数', '单位', '补贴单价（元）', '补贴总价（元）', '备注'],
      lines: settled?.subsidy ? [['运输补贴', '按次', 1, '次', waybillNumber(settled.subsidy), waybillNumber(settled.subsidy), '示例补贴']] : [],
    },
    {
      title: '货品损耗',
      columns: ['货品', '实际装货', '实际卸货', '损耗', '货品计价（元）', '实际扣减金额（元）'],
      lines: settled?.roadLoss ? [[row.goods, quantity(row.loaded), quantity(row.unloaded), quantity(row.loaded - row.unloaded), waybillNumber(settled.roadLoss / (row.loaded - row.unloaded)), waybillNumber(settled.roadLoss)]] : [],
    },
    {
      title: '其他扣减',
      columns: ['费用名称', '计费方式', '基数', '单位', '扣减单价（元）', '扣减总价（元）', '备注'],
      lines: settled?.deduction ? [['运输服务扣减', '按次', 1, '次', waybillNumber(settled.deduction), waybillNumber(settled.deduction), '示例扣减']] : [],
    },
  ]
})
</script>

<template>
  <div class="tsd-root ts-waybill-detail" role="dialog" aria-modal="true" aria-label="运输结算 运单详情" @keydown.esc.stop="emit('close')">
    <header class="tsd-header">
      <div class="tsd-crumb">
        <span class="tsd-crumb-parent">运输结算</span>
        <span class="tsd-crumb-sep" />
        <span class="tsd-crumb-current">运单详情</span>
      </div>
      <button ref="back" class="tsd-back" type="button" @click="emit('close')">
        <span class="tsd-back-icon" />返回列表
      </button>
    </header>
    <div class="tsd-body ts-waybill-detail-body">
      <section class="tsd-summary">
        <img class="tsd-summary-icon" src="/transport-settlement-assets/detail-doc.png" alt="" />
        <div class="tsd-summary-main">
          <div class="tsd-summary-title">
            <span>运单号：{{ row.id }}</span>
            <span class="ts-tag-pill" :class="row.settlement?.status === '已打款' ? 'green' : 'blue'">{{ row.settlement?.status || '待结算' }}</span>
          </div>
          <dl class="ts-waybill-facts">
            <div><dt>{{ row.mode === 'water' ? '船名' : '车牌号' }}</dt><dd>{{ row.vehicle }}</dd></div>
            <div><dt>{{ row.mode === 'water' ? '船东' : '主驾' }}</dt><dd>{{ row.operator }} {{ row.contact }}</dd></div>
            <div><dt>运输类型</dt><dd>{{ row.transportType }} · {{ row.kind === 'bulk' ? '散杂货' : '集装箱' }}</dd></div>
            <div><dt>托运企业</dt><dd>{{ row.shipper }}</dd></div>
            <div><dt>实际承运商</dt><dd>{{ row.carrier }}</dd></div>
            <div><dt>运输计划</dt><dd>{{ row.planName }}（{{ row.planNo }}）</dd></div>
            <div><dt>接单时间</dt><dd>{{ row.acceptedAt }}</dd></div>
          </dl>
        </div>
      </section>

      <section class="ts-waybill-panel">
        <h3>运输路线</h3>
        <div class="ts-waybill-route">
          <div><span class="ts-tag-pill blue">装货</span> {{ row.from }}<p>{{ row.loadedAt }}</p></div>
          <span class="ts-waybill-route-arrow" aria-hidden="true">→</span>
          <div><span class="ts-tag-pill green">卸货</span> {{ row.to }}<p>{{ row.unloadedAt }}</p></div>
        </div>
        <dl class="ts-waybill-facts ts-waybill-metrics">
          <div v-for="[label, value] in metrics" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div>
        </dl>
        <h3>任务信息</h3>
        <div class="ts-waybill-panel-table">
          <table>
            <thead><tr><th>运单任务单号</th><th>货品</th><th>装货地</th><th>实际装货</th><th>装货时间</th><th>卸货地</th><th>实际卸货</th><th>卸货时间</th></tr></thead>
            <tbody>
              <tr v-for="task in row.tasks" :key="task.id">
                <td>{{ task.id }}</td><td>{{ task.goods || row.goods }}</td><td>{{ task.from }}</td><td>{{ quantity(task.loaded) }}</td><td>{{ task.loadedAt }}</td>
                <td>{{ task.to }}</td><td>{{ quantity(task.unloaded) }}</td><td>{{ task.unloadedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="ts-waybill-panel">
        <h3>{{ row.settlement ? '结算信息' : '费用信息' }}</h3>
        <dl v-if="row.settlement" class="ts-waybill-facts">
          <div><dt>结算单号</dt><dd>{{ row.settlement.id }}</dd></div>
          <div><dt>核算时间</dt><dd>{{ row.settlement.accountedAt }}</dd></div>
          <div><dt>结算总运费</dt><dd>{{ money(row.settlement.total) }}</dd></div>
          <div><dt>已付金额</dt><dd>{{ money(row.settlement.paid) }}</dd></div>
          <div><dt>未付金额</dt><dd>{{ money(row.settlement.unpaid) }}</dd></div>
        </dl>
        <dl v-else-if="row.billingMode" class="ts-waybill-facts">
          <div><dt>计费方式</dt><dd>{{ row.billingMode === 'task' ? '分段计费' : '整趟定价' }}</dd></div>
          <div><dt>司机应付</dt><dd>{{ money(row.payable) }}</dd></div>
        </dl>
        <dl v-else class="ts-waybill-facts">
          <div><dt>运输单价</dt><dd>{{ money(row.unitPrice) }}/{{ row.unit }}</dd></div>
          <div><dt>应收金额</dt><dd>{{ money(row.receivable) }}</dd></div>
          <div><dt>应付金额</dt><dd>{{ money(row.payable) }}</dd></div>
        </dl>
      </section>

      <section v-for="section in feeSections" :key="section.title" class="ts-waybill-panel">
        <h3>{{ section.title }}</h3>
        <div class="ts-waybill-panel-table">
          <table>
            <thead><tr><th v-for="column in section.columns" :key="column">{{ column }}</th></tr></thead>
            <tbody>
              <tr v-for="(line, index) in section.lines" :key="index">
                <td v-for="(value, position) in line" :key="position">{{ value }}</td>
              </tr>
              <tr v-if="!section.lines.length"><td :colspan="section.columns.length" class="ts-waybill-empty">暂无数据</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
