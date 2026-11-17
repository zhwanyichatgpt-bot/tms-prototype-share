<script setup>
import { computed, ref, watch } from 'vue'
import { ElDatePicker, ElInput, ElOption, ElSelect } from 'element-plus'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import { settlementWaybills, waybillNumber } from '../waybill-mock'
import { driverPendingWaybills } from '../driver-accounting'

const props = defineProps({
  accounted: Boolean,
  driverMode: Boolean,
  mode: { type: String, required: true },
})
const emit = defineEmits(['detail', 'create'])

const sharedColumns = [
  { key: 'carrier', label: '实际承运商', width: 165 },
  { key: 'plan', label: '计划信息', width: 212 },
  { key: 'tasks', label: '运单任务单号', width: 155 },
  { key: 'shipper', label: '托运企业', width: 155 },
]
const pendingColumns = [
  { key: 'loadedAt', label: '装货时间', width: 165 },
  { key: 'to', label: '卸货地', width: 155 },
  { key: 'unloaded', label: '卸货', width: 105 },
  { key: 'unloadedAt', label: '卸货时间', width: 165 },
  { key: 'unitPrice', label: '运输单价（元）', width: 140 },
  { key: 'receivable', label: '应收金额（元）', width: 140 },
  { key: 'payable', label: '应付金额（元）', width: 140 },
  { key: 'acceptedAt', label: '接单时间', width: 165 },
]
const accountedColumns = [
  { key: 'to', label: '卸货地', width: 155 },
  { key: 'unloaded', label: '卸货信息', width: 215 },
  { key: 'baseFreight', label: '基础运费（元）', width: 140 },
  { key: 'roadLoss', label: '路耗扣减金额（元）', width: 160 },
  { key: 'deduction', label: '其他扣减（元）', width: 140 },
  { key: 'subsidy', label: '补贴金额（元）', width: 140 },
  { key: 'total', label: '结算总运费（元）', width: 150 },
  { key: 'paid', label: '已付金额（元）', width: 140 },
  { key: 'unpaid', label: '未付金额（元）', width: 140 },
]
const columns = computed(() => [
  { key: 'transportType', label: '运输类型', width: 104 },
  ...(props.accounted ? [{ key: 'status', label: '结算状态', width: 106 }] : []),
  ...sharedColumns,
  { key: 'from', label: '装货地', width: 155 },
  { key: 'loaded', label: props.accounted ? '装货信息' : '装货', width: props.accounted ? 215 : 105 },
  ...(props.accounted ? accountedColumns : pendingColumns
    .filter(col => !props.driverMode || col.key !== 'receivable')
    .map(col => {
      if (!props.driverMode) return col
      if (col.key === 'unitPrice') return { ...col, label: '计费范围' }
      if (col.key === 'payable') return { ...col, label: '司机应付（元）' }
      return col
    })),
  { key: 'accountedAt', label: '核算时间', width: 165 },
])

const kind = ref('bulk')
const moreFilters = ref(false)
const emptyFilters = () => ({ id: '', plan: '', shipper: '', operator: '', vehicle: '', acceptedRange: null, status: '' })
const filters = ref(emptyFilters())
const applied = ref(emptyFilters())
const page = ref(1)
const pageSize = ref(10)
const selected = ref([])
const operatorLabel = computed(() => props.mode === 'water' ? '船东/联系电话' : '司机/手机号')
const vehicleLabel = computed(() => props.mode === 'water' ? '船名' : '车牌号')
const sourceRows = computed(() => {
  const rows = props.driverMode && !props.accounted ? driverPendingWaybills : settlementWaybills
  return rows.filter(row => row.mode === props.mode && row.kind === kind.value && Boolean(row.settlement) === props.accounted)
})
const shipperOptions = computed(() => [...new Set(sourceRows.value.map(row => row.shipper))])

const matches = (value, keyword) => value.toLowerCase().includes(keyword.trim().toLowerCase())
const filtered = computed(() => {
  const query = applied.value
  const [from, to] = query.acceptedRange || []
  return sourceRows.value.filter(row =>
    matches([row.id, ...row.tasks.map(task => task.id)].join(' '), query.id) &&
    matches(`${row.planName} ${row.planNo}`, query.plan) &&
    (!query.shipper || row.shipper === query.shipper) &&
    matches(`${row.operator} ${row.contact}`, query.operator) &&
    matches(row.vehicle, query.vehicle) &&
    (!from || row.acceptedAt >= from) &&
    (!to || row.acceptedAt <= to) &&
    (!query.status || row.settlement?.status === query.status),
  )
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const allChecked = computed(() => pageRows.value.length > 0 && pageRows.value.every(row => selected.value.includes(row.id)))

watch(kind, reset)
watch(pageSize, () => {
  page.value = 1
  selected.value = []
})

function search() {
  applied.value = { ...filters.value }
  page.value = 1
  selected.value = []
}

function reset() {
  filters.value = emptyFilters()
  search()
}

function togglePage() {
  const ids = pageRows.value.map(row => row.id)
  selected.value = allChecked.value ? selected.value.filter(id => !ids.includes(id)) : [...new Set([...selected.value, ...ids])]
}

function cellLines(row, key) {
  if (key === 'plan') return [row.planName, row.planNo]
  if (key === 'tasks') return row.tasks.map(task => task.id)
  if (key === 'unitPrice' && props.driverMode) return [row.billingMode === 'task' ? '分段计费' : '整趟定价']
  if (key === 'loaded' || key === 'unloaded') {
    const quantity = `${waybillNumber(row[key])} ${row.unit}`
    return props.accounted ? [`${row.goods} | ${quantity}`, row[`${key}At`]] : [quantity]
  }
  const value = row[key] ?? row.settlement?.[key]
  return [typeof value === 'number' ? waybillNumber(value) : (value ?? '—')]
}

function exportRows() {
  const rows = selected.value.length ? filtered.value.filter(row => selected.value.includes(row.id)) : filtered.value
  const csvCell = value => `"${String(value).replaceAll('"', '""')}"`
  const records = [
    ['运单号', operatorLabel.value, vehicleLabel.value, ...columns.value.map(col => col.label)],
    ...rows.map(row => [row.id, `${row.operator} ${row.contact}`, row.vehicle, ...columns.value.map(col => cellLines(row, col.key).join(' / '))]),
  ]
  const contents = records.map(record => record.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', contents], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = props.accounted ? '模拟运单-已核算.csv' : '模拟运单-待结算.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function openAccounting() {
  const rows = sourceRows.value.filter(row => selected.value.includes(row.id))
  emit('create', { rows, kind: kind.value })
}
</script>

<template>
  <div class="ts-waybill-types" aria-label="运单类型">
    <button type="button" :aria-pressed="kind === 'bulk'" @click="kind = 'bulk'">散杂货运单</button>
    <button type="button" :aria-pressed="kind === 'container'" @click="kind = 'container'">集装箱运单</button>
  </div>

  <form class="ts-waybill-search" @submit.prevent="search">
    <div class="ts-search-fields">
      <ElInput v-model="filters.id" aria-label="运单号" placeholder="请输入运单号搜索" :prefix-icon="Search" clearable />
      <ElInput v-model="filters.plan" aria-label="运输计划" placeholder="请输入运输计划名称" clearable>
        <template #prepend>运输计划</template>
      </ElInput>
      <div class="ts-waybill-field">
        <span>托运企业</span>
        <ElSelect v-model="filters.shipper" aria-label="托运企业" placeholder="请选择" filterable clearable>
          <ElOption v-for="shipper in shipperOptions" :key="shipper" :label="shipper" :value="shipper" />
        </ElSelect>
      </div>
      <template v-if="moreFilters">
        <ElInput v-model="filters.operator" :aria-label="operatorLabel" :placeholder="`请输入${operatorLabel}搜索`" clearable>
          <template #prepend>{{ operatorLabel }}</template>
        </ElInput>
        <ElInput v-model="filters.vehicle" :aria-label="vehicleLabel" :placeholder="`请输入${vehicleLabel}搜索`" clearable>
          <template #prepend>{{ vehicleLabel }}</template>
        </ElInput>
        <div v-if="accounted" class="ts-waybill-field">
          <span>结算状态</span>
          <ElSelect v-model="filters.status" aria-label="结算状态" placeholder="全部" clearable>
            <ElOption v-for="status in ['未打款', '部分打款', '已打款']" :key="status" :label="status" :value="status" />
          </ElSelect>
        </div>
        <div class="ts-waybill-field ts-waybill-dates">
          <span>接单时间</span>
          <ElDatePicker
            v-model="filters.acceptedRange"
            type="datetimerange"
            aria-label="接单时间"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="-"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </div>
      </template>
    </div>
    <div class="ts-search-actions">
      <button class="ts-btn plain" type="button" :aria-expanded="moreFilters" @click="moreFilters = !moreFilters">{{ moreFilters ? '收起' : '更多' }}</button>
      <button class="ts-icon-btn" type="button" aria-label="重置" title="重置" @click="reset"><Refresh /></button>
      <button class="ts-btn primary" type="submit">搜索</button>
    </div>
  </form>

  <div class="ts-toolbar ts-waybill-toolbar">
    <button v-if="!accounted" class="ts-btn primary" type="button" @click="openAccounting">新增核算</button>
    <button class="ts-btn plain" type="button" :disabled="!filtered.length" @click="exportRows"><Download />导出</button>
  </div>

  <div class="ts-table-wrap">
    <table class="ts-table ts-waybill-table" :aria-label="accounted ? '已核算运单列表' : '待结算运单列表'" :style="{ minWidth: `${columns.reduce((sum, col) => sum + col.width, 392)}px` }">
      <colgroup>
        <col style="width: 44px" />
        <col style="width: 256px" />
        <col v-for="col in columns" :key="col.key" :style="{ width: `${col.width}px` }" />
        <col style="width: 92px" />
      </colgroup>
      <thead>
        <tr>
          <th class="ts-waybill-check"><input :checked="allChecked" aria-label="全选本页运单" type="checkbox" @change="togglePage" /></th>
          <th class="ts-waybill-id">运单号</th>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ 'annot-transportSettlement-rule-driver-billing-scope': driverMode && !accounted && col.key === 'unitPrice' }"
          >{{ col.label }}</th>
          <th class="col-op">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in pageRows" :key="row.id">
          <td class="ts-waybill-check"><input v-model="selected" :value="row.id" :aria-label="`选择 ${row.id}`" type="checkbox" /></td>
          <td class="ts-waybill-id">
            <div class="ts-settle-no">
              <img src="/transport-settlement-assets/task-logo.png" alt="" />
              <div>
                <button class="ts-link ts-waybill-link" type="button" @click="emit('detail', row)">{{ row.id }}</button>
                <div class="ts-grey-title">{{ row.operator }} | {{ row.contact }} | {{ row.vehicle }}</div>
              </div>
            </div>
          </td>
          <td v-for="col in columns" :key="col.key">
            <span v-if="col.key === 'status'" class="ts-tag-pill" :class="row.settlement.status === '已打款' ? 'green' : 'blue'">{{ row.settlement.status }}</span>
            <template v-else>
              <div v-for="(line, index) in cellLines(row, col.key)" :key="index" :class="{ 'ts-grey-title': index > 0 && col.key !== 'tasks' }">{{ line }}</div>
            </template>
          </td>
          <td class="col-op"><button class="ts-link ts-waybill-link" type="button" @click="emit('detail', row)">详情</button></td>
        </tr>
      </tbody>
    </table>
    <p v-if="!pageRows.length" class="ts-waybill-empty">暂无运单</p>
  </div>

  <div class="ts-list-footer">
    <div class="ts-pagination">
      <span v-if="selected.length">已选 {{ selected.length }} 条</span>
      <span>共 {{ filtered.length }} 条</span>
      <select v-model.number="pageSize" class="ts-page-size" aria-label="每页运单条数">
        <option :value="10">10条/页</option>
        <option :value="20">20条/页</option>
      </select>
      <button class="ts-page-btn" type="button" aria-label="上一页" :disabled="page === 1" @click="page--">‹</button>
      <button v-for="number in pageCount" :key="number" class="ts-page-btn" :class="{ active: page === number }" type="button" @click="page = number">{{ number }}</button>
      <button class="ts-page-btn" type="button" aria-label="下一页" :disabled="page === pageCount" @click="page++">›</button>
    </div>
  </div>
</template>
