<template>
  <section class="aia-page aia-select" :aria-label="`选择${objectLabel}数据`">
    <header class="aia-select__bar">
      <button type="button" :aria-label="`返回${assistantName}推荐`" @click="emit('back')"><van-icon name="arrow-left"/></button>
      <h1>选择{{ objectLabel }}数据</h1>
    </header>

    <div class="aia-select__scroll">
      <span class="aia-select__watermark" aria-hidden="true">DATA SCREENING</span>
      <p class="aia-select__caption">数据筛选</p>

      <section class="aia-filter" :aria-label="`${objectLabel}筛选条件`">
        <label class="aia-field">
          <span>{{ objectLabel }}名称</span>
          <input v-model="draftName" type="text" maxlength="40" placeholder="输入名称关键词"/>
        </label>
        <label class="aia-field">
          <span>业务单号</span>
          <input v-model="draftOrder" type="text" maxlength="40" placeholder="输入业务单号"/>
        </label>
        <div class="aia-dates">
          <label class="aia-date">
            <span>开始时间</span>
            <input v-model="draftStart" type="date" aria-label="开始时间"/>
            <van-icon name="arrow-down"/>
          </label>
          <span class="aia-dates__arrow" aria-hidden="true">→</span>
          <label class="aia-date">
            <span>结束时间</span>
            <input v-model="draftEnd" type="date" aria-label="结束时间"/>
            <van-icon name="arrow-down"/>
          </label>
        </div>
        <div class="aia-filter__actions">
          <button type="button" class="aia-filter__reset" @click="resetFilters">重置</button>
          <button type="button" class="aia-filter__query" @click="applyFilters">查询数据</button>
        </div>
      </section>

      <section class="aia-results-head" aria-live="polite">
        <img :src="mascotSrc" alt=""/>
        <p>{{ assistantName }}为您找到 <b>{{ filtered.length }}</b> 条查询结果</p>
        <button type="button" @click="toggleAll">{{ allSelected ? '清空' : '全选' }}</button>
      </section>

      <div class="aia-result-list">
        <button
          v-for="bill in filtered"
          :key="bill.id"
          type="button"
          class="aia-result-card"
          :class="{ 'is-selected': selectedIds.includes(bill.id) }"
          :aria-pressed="selectedIds.includes(bill.id)"
          @click="toggleBill(bill.id)"
        >
          <span class="aia-check" :class="{ 'is-checked': selectedIds.includes(bill.id) }">
            <van-icon v-if="selectedIds.includes(bill.id)" name="success"/>
          </span>
          <span class="aia-result-card__body">
            <span class="aia-result-card__head">
              <strong>{{ bill.name }}</strong>
              <span class="aia-status" :class="'is-' + billTone(bill)">{{ bill.status }}</span>
            </span>
            <span class="aia-route">
              <i class="aia-route__dot is-start"/>
              <i class="aia-route__line"/>
              <i class="aia-route__dot is-end"/>
              <span class="aia-route__names"><span>{{ bill.origin }}</span><span>{{ bill.destination }}</span></span>
            </span>
            <span class="aia-result-card__meta">
              <span>{{ bill.id }}</span>
              <time>{{ bill.datetime }}</time>
            </span>
          </span>
        </button>
        <p v-if="!filtered.length" class="aia-empty">没有找到符合条件的{{ objectLabel }}，请调整筛选条件。</p>
      </div>
    </div>

    <button type="button" class="aia-start-analysis" :disabled="!selected.length" @click="startAnalysis">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.6c.5 4.2 2.6 6.3 6.8 6.8-4.2.5-6.3 2.6-6.8 6.8-.5-4.2-2.6-6.3-6.8-6.8 4.2-.5 6.3-2.6 6.8-6.8Z"/>
        <path d="M19 15.2c.3 2.3 1.4 3.5 3.7 3.8-2.3.3-3.5 1.4-3.8 3.7-.3-2.3-1.4-3.5-3.7-3.8 2.3-.3 3.5-1.4 3.8-3.7Z" opacity=".7"/>
      </svg>
      <span><b>开始分析</b><small>已选 {{ selected.length }} 项</small></span>
    </button>
    <i class="aia-home-indicator"/>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { billTone } from './ai-bill.js'

const props = defineProps({
  bills: { type: Array, default: () => [] },
  objectLabel: { type: String, default: '托运单' },
  assistantName: { type: String, default: '至宝' },
  mascotSrc: { type: String, default: '/shared-mobile-assets/ai/zhibao-mascot.png' },
  defaultRange: { type: Object, default: () => ({ start: '2026-10-01', end: '2026-10-31' }) },
})
const emit = defineEmits(['back', 'analyse'])

const initialRange = { start: props.defaultRange.start || '', end: props.defaultRange.end || '' }
const draftName = ref('')
const draftOrder = ref('')
const draftStart = ref(initialRange.start)
const draftEnd = ref(initialRange.end)
const applied = reactive({ name: '', order: '', start: initialRange.start, end: initialRange.end })
// 与设计稿一致：默认勾选第 1、3 笔。
const selectedIds = ref(props.bills.length > 2 ? [props.bills[0].id, props.bills[2].id] : props.bills.slice(0, 1).map(bill => bill.id))

const filtered = computed(() => {
  const name = applied.name.trim().toLowerCase()
  const order = applied.order.trim().toLowerCase()
  return props.bills.filter(bill => {
    if (name && !String(bill.name || '').toLowerCase().includes(name)) return false
    if (order && !String(bill.id || '').toLowerCase().includes(order)) return false
    if (applied.start && String(bill.date || '') < applied.start) return false
    if (applied.end && String(bill.date || '') > applied.end) return false
    return true
  })
})
const selected = computed(() => props.bills.filter(bill => selectedIds.value.includes(bill.id)))
const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every(bill => selectedIds.value.includes(bill.id)))

function toggleBill(id) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}
function toggleAll() {
  if (allSelected.value) {
    const visible = new Set(filtered.value.map(bill => bill.id))
    selectedIds.value = selectedIds.value.filter(id => !visible.has(id))
    return
  }
  selectedIds.value = [...new Set([...selectedIds.value, ...filtered.value.map(bill => bill.id)])]
}
function applyFilters() {
  applied.name = draftName.value
  applied.order = draftOrder.value
  applied.start = draftStart.value
  applied.end = draftEnd.value
  const visible = new Set(filtered.value.map(bill => bill.id))
  selectedIds.value = selectedIds.value.filter(id => visible.has(id))
}
function resetFilters() {
  draftName.value = ''
  draftOrder.value = ''
  draftStart.value = initialRange.start
  draftEnd.value = initialRange.end
  Object.assign(applied, { name: '', order: '', start: initialRange.start, end: initialRange.end })
}
function startAnalysis() {
  if (!selected.value.length) return
  emit('analyse', selected.value)
}
</script>
