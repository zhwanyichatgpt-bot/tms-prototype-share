<script setup>
/**
 * 待核算运单选择 —— 复刻真实系统“添加核算运单”右侧覆盖层
 */
import { computed, ref } from 'vue'
import { waybillNumber } from '../waybill-mock'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  initialSelection: { type: Array, default: () => [] },
  editableSelection: Boolean,
})
const emit = defineEmits(['close', 'select'])

const asset = (name) => `/transport-settlement-assets/${name}`
const emptyFilters = () => ({ id: '', plan: '', task: '', from: '', to: '' })
const filters = ref(emptyFilters())
const query = ref(emptyFilters())
const selected = ref(props.initialSelection.map(row => row.id))
const matches = (value, text) => value.toLowerCase().includes(text.trim().toLowerCase())
const filtered = computed(() => props.rows.filter(row => {
  const { id, plan, task, from, to } = query.value
  const date = row.acceptedAt.slice(0, 10)
  return matches(row.id, id) &&
    matches(`${row.planName} ${row.planNo}`, plan) &&
    matches(row.tasks.map(task => task.id).join(' '), task) &&
    (!from || date >= from) && (!to || date <= to)
}))
const visibleSelected = computed(() => filtered.value.length > 0 && filtered.value.every(row => selected.value.includes(row.id)))

function toggleVisible() {
  const ids = filtered.value.map(row => row.id)
  selected.value = visibleSelected.value
    ? selected.value.filter(id => !ids.includes(id))
    : [...new Set([...selected.value, ...ids])]
}

function reset() {
  filters.value = emptyFilters()
  query.value = emptyFilters()
}
</script>

<template>
  <div class="ts-picker" :data-annotation-container="editableSelection ? 'drawer' : undefined"
    :data-annotation-content="editableSelection ? 'drawer' : undefined"
    :class="{ 'annot-transportSettlement-rule-waybill-driver': editableSelection }">
    <div class="ts-picker-head">
      <span class="ts-picker-title">待核算运单</span>
      <button class="ts-close" type="button" @click="emit('close')">×</button>
    </div>

    <form class="ts-picker-filters" @submit.prevent="query = { ...filters }">
      <div class="ts-picker-search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="#c0c4cc" stroke-width="1.4" />
          <path d="M11 11L14 14" stroke="#c0c4cc" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        <input v-model="filters.id" placeholder="请输入运单号搜索" />
      </div>

      <div class="ts-picker-group" style="width: 286px">
        <span>计划名称</span>
        <input v-model="filters.plan" placeholder="请输入计划名称/单号..." />
      </div>

      <div class="ts-picker-group" style="width: 305px">
        <span>任务运单号</span>
        <input v-model="filters.task" placeholder="请输入运输任务运单号..." />
      </div>

      <div class="ts-picker-group" style="width: 420px">
        <span>接单日期</span>
        <input v-model="filters.from" :type="editableSelection ? 'date' : 'text'" aria-label="接单开始日期" placeholder="开始日期" />
        <span class="ts-date-sep">-</span>
        <input v-model="filters.to" :type="editableSelection ? 'date' : 'text'" aria-label="接单结束日期" placeholder="结束日期" />
      </div>

      <button class="ts-icon-btn" type="button" title="刷新" @click="reset">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.2 6.2A5.4 5.4 0 1 0 13.4 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          <path d="M13.6 2.6V6.4H9.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="ts-btn primary" type="submit" style="width: 80px; height: 36px">搜索</button>
    </form>

    <table class="ts-picker-table">
      <colgroup>
        <col style="width: 50px" />
        <col style="width: 280px" />
        <col style="width: 150px" />
        <col style="width: 180px" />
        <col style="width: 130px" />
        <col style="width: 180px" />
        <col style="width: 180px" />
        <col style="width: 160px" />
        <col style="width: 160px" />
      </colgroup>
      <thead>
        <tr>
          <th>
            <input v-if="editableSelection" type="checkbox" aria-label="全选查询运单" :checked="visibleSelected" :disabled="!filtered.length" @change="toggleVisible" />
            <span v-else class="ts-checkbox" />
          </th>
          <th>运单号</th>
          <th>运输类型</th>
          <th>实际承运商</th>
          <th>司机运费(元)</th>
          <th>任务运单号</th>
          <th>托运企业</th>
          <th>装货地</th>
          <th>装货时间</th>
        </tr>
      </thead>
      <tbody v-if="editableSelection">
        <tr v-for="row in filtered" :key="row.id">
          <td><input v-model="selected" type="checkbox" :value="row.id" :aria-label="`待核算 ${row.id}`" /></td>
          <td>{{ row.id }}<div class="ts-grey-title">{{ row.operator }} | {{ row.contact }}</div></td>
          <td>{{ row.transportType }}</td>
          <td>{{ row.carrier }}</td>
          <td>{{ waybillNumber(row.payable) }}</td>
          <td><div v-for="task in row.tasks" :key="task.id">{{ task.id }}</div></td>
          <td>{{ row.shipper }}</td>
          <td>{{ row.from }}</td>
          <td>{{ row.loadedAt }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="!filtered.length" class="ts-picker-empty">
      <img :src="asset('empty-box.png')" alt="" />
      <p>暂无数据</p>
    </div>

    <div class="ts-picker-footer">
      <span>已选运单:{{ selected.length }}条</span>
      <div class="ts-footer-actions">
        <button class="ts-btn default" type="button" @click="emit('close')">取消</button>
        <button class="ts-btn primary" type="button" :disabled="!editableSelection || (!selected.length && !initialSelection.length)" @click="emit('select', rows.filter(row => selected.includes(row.id)))">确认</button>
      </div>
    </div>
  </div>
</template>
