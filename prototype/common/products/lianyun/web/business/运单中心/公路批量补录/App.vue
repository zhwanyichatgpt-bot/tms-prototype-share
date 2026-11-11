<script setup>
/**
 * 公路集装箱运单批量补录原型。
 * 需求归属：common；所属项目：null；研发版本：TMS-COMMON-202609-02。
 *
 * 一个运输任务一个批次：任务决定路线与箱型，表格列由任务路段派生，
 * 车次明细整批导入、整批校验，提交后一次生成多张运单并形成批次。
 */
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import {
  batchTasks,
  buildTaskRows,
  cargoOf,
  containerOptionsOf,
  dynamicColumnsOf,
  nodeSequenceOf,
  parseTsv,
  templateCsvText,
  templateTsvText,
} from './mock-data'
import { buildBoxContainerKeyMap, buildBoxOwners, buildValidationMap } from './batch-rules'
import './road-batch-supplement.css'
import AssistantEntry from '../../至小简入口/AssistantEntry.vue'
import AiWaybillSupplement from '../../AI工作台/components/AiWaybillSupplement.vue'
import { loadSupplementSession, saveSupplementSession, supplementFile } from '../../AI工作台/supplement-handoff.js'
import { supplementIssues, finishSupplementGroup, deferSupplementRows } from '../../AI工作台/supplement-flow.js'

const props = defineProps({
  embedded: Boolean,
  supplementDraft: Object,
  submissionBlocked: Boolean,
  submissionMessage: String,
  focusedRowKeys: { type: Array, default: () => [] },
  focusedField: String,
})
const emit = defineEmits(['submitted', 'defer', 'close'])
const detailsOpen = ref(false)
const tableWrap = ref(null)
const router = useRouter()
const route = useRoute()

// AI 工作台的新增交接仅在普通原型接收，不改变已交付版本的入口。
const aiRequested = computed(() => typeof route.query.aiSupplement === 'string')
const aiSession = computed(() => aiRequested.value ? loadSupplementSession(route.query.aiSupplement) : null)
const aiGroup = computed(() => aiSession.value?.supplement.groups.find(group => group.id === aiSession.value.supplement.currentId))
const aiIssues = computed(() => supplementIssues(aiGroup.value))
const linkedDraft = computed(() => props.embedded || Boolean(aiSession.value))
const blocked = computed(() => props.submissionBlocked || (aiRequested.value && !aiSession.value) || aiIssues.value.length > 0 || Boolean(aiGroup.value?.completed))
const blockMessage = computed(() => aiRequested.value && !aiSession.value ? '未找到这次补录记录，请返回原对话继续。' : props.submissionMessage || aiIssues.value[0]?.text || '')
const assistant = ref(null)
const supplementChat = ref(null)
const aiFocusKeys = computed(() => {
  const issue = aiIssues.value[0]
  const group = aiGroup.value
  if (!group || !issue) return []
  if (issue.id === 'phone') return group.rows.filter(row => !String(row.phone || '').trim()).map(row => row.key)
  if (issue.id === 'trip') {
    const ids = group.tripQuestions?.find(item => !item.decision)?.ids || [1, 2]
    return group.rows.filter(row => row.sourceIds.some(id => ids.includes(id))).map(row => row.key)
  }
  if (issue.id === 'driver') return group.rows.filter(row => !row.phone).map(row => row.key)
  return group.rows.map(row => row.key)
})
const focusKeys = computed(() => aiSession.value ? aiFocusKeys.value : props.focusedRowKeys)
const focusField = computed(() => aiSession.value ? (['driver', 'phone'].includes(aiIssues.value[0]?.id) ? 'phone' : '') : props.focusedField)
const sourceFiles = computed(() => {
  const files = [...(aiSession.value?.supplement.files || []), ...(aiSession.value?.messages.flatMap(message => message.files || []) || [])]
  return [...new Map(files.map(file => [file.id, file])).values()]
})
watch(aiSession, session => { if (session) saveSupplementSession(session) }, { deep: true, flush: 'sync' })
const selectedTaskKey = ref('')
const rows = ref(aiGroup.value?.rows || props.supplementDraft?.rows || [])
watch(() => aiGroup.value?.rows, value => { if (value) rows.value = value }, { flush: 'sync' })
watch(() => props.supplementDraft?.rows, value => {
  if (props.embedded && value) rows.value = value
})
const onlyErrors = ref(false)
const taskPickerOpen = ref(false)
const taskQuery = ref('')
const taskPicker = ref(null)
const taskSearch = ref(null)
const excelInput = ref(null)
const pasteVisible = ref(false)
const pasteText = ref('')
const confirmVisible = ref(false)
const successVisible = ref(false)
const successSummary = ref({ waybills: 0, boxes: 0 })
const formError = ref('')
const toastText = ref('')
let toastTimer = null

const HEAD_FIXED = [
  { key: 'seq', label: '序号', width: 44 },
  { key: 'container', label: '箱型', width: 136, required: true },
  { key: 'cargo', label: '货品', width: 88 },
  { key: 'driver', label: '司机', width: 74, required: true },
  { key: 'phone', label: '联系电话', width: 92 },
  { key: 'plateNo', label: '车牌号', width: 80, required: true },
  { key: 'chassisNo', label: '车架号', width: 68 },
  { key: 'box1', label: '实际箱号①', width: 100, required: true },
  { key: 'seal1', label: '铅封号①', width: 82 },
  { key: 'box2', label: '实际箱号②', width: 100 },
  { key: 'seal2', label: '铅封号②', width: 82 },
]
const currentTask = computed(() => aiRequested.value ? (aiGroup.value?.matched ? aiGroup.value.task : null) : props.embedded ? props.supplementDraft?.task : batchTasks.find(item => item.key === selectedTaskKey.value) || null)
const dynamicColumns = computed(() => dynamicColumnsOf(currentTask.value))
const embeddedColumnWidths = { seq: 60, cargo: 112, driver: 112, phone: 152, plateNo: 112, chassisNo: 112, box1: 142, seal1: 112, box2: 142, seal2: 112 }
const gridTemplate = computed(() => {
  const dynamic = dynamicColumns.value.map(column => `${column.width}px`).join(' ')
  const fixed = HEAD_FIXED.map(column => {
    const width = linkedDraft.value ? embeddedColumnWidths[column.key] || column.width : column.width
    return `${width}px`
  }).join(' ')
  return `40px ${fixed} ${dynamic} 52px 216px`
})
watch(() => [focusKeys.value[0], focusField.value], async ([key, field]) => {
  if (!linkedDraft.value || !key || !field) return
  await nextTick()
  const table = tableWrap.value
  const cell = table?.querySelector(`.rbs-row.is-focused [data-field="${field}"]`)
  if (!cell) return
  const bounds = table.getBoundingClientRect()
  const position = cell.getBoundingClientRect()
  if (position.left < bounds.left || position.right > bounds.right) {
    table.scrollLeft += position.left - bounds.left - 16
  }
}, { immediate: true })
const statusColumnIndex = computed(() => 2 + HEAD_FIXED.length + dynamicColumns.value.length)
const reasonColumnIndex = computed(() => statusColumnIndex.value + 1)
const dynamicStartColumn = computed(() => 2 + HEAD_FIXED.length)

const poolSet = computed(() => new Set((currentTask.value?.candidateContainers || []).map(box => box.containerNo)))
const boxContainerKeyMap = computed(() => buildBoxContainerKeyMap(currentTask.value?.candidateContainers || []))
const containerOptions = computed(() => containerOptionsOf(currentTask.value))
const validationMap = computed(() => {
  if (!currentTask.value) return new Map()
  return buildValidationMap(rows.value, {
    pool: poolSet.value,
    boxContainerKey: boxContainerKeyMap.value,
    boxOwners: buildBoxOwners(rows.value),
    nodeSequence: nodeSequenceOf(currentTask.value),
    phoneRequired: linkedDraft.value,
  })
})
const errorOf = (row) => validationMap.value.get(row.key) || []
const errorCount = computed(() => rows.value.filter(row => errorOf(row).length).length)
const passCount = computed(() => rows.value.length - errorCount.value)
const totalBoxCount = computed(() => rows.value.reduce(
  (sum, row) => sum + row.boxes.filter(box => String(box.containerNo || '').trim()).length, 0,
))
const visibleRows = computed(() => (onlyErrors.value ? rows.value.filter(row => errorOf(row).length) : rows.value))
const allSelected = computed(() => visibleRows.value.length > 0 && visibleRows.value.every(row => row.selected))
const filteredTasks = computed(() => {
  const query = taskQuery.value.trim().toLowerCase()
  if (!query) return batchTasks
  return batchTasks.filter(task => [
    task.info.number, task.startAlias, task.endAlias,
    ...(task.containers || []).map(item => `${item.size}${item.cargo}`),
  ].some(value => String(value).toLowerCase().includes(query)))
})

function taskRouteText(task) {
  return `集装箱运输｜${task.startAlias} → ${task.endAlias}`
}

async function toggleTaskPicker() {
  taskPickerOpen.value = !taskPickerOpen.value
  if (taskPickerOpen.value) {
    taskQuery.value = ''
    await nextTick()
    taskSearch.value?.focus()
  }
}

function selectTask(task) {
  selectedTaskKey.value = task.key
  taskPickerOpen.value = false
  taskQuery.value = ''
}

function closeTaskPickerOnOutside(event) {
  if (taskPickerOpen.value && !taskPicker.value?.contains(event.target)) taskPickerOpen.value = false
}

function showToast(text) {
  toastText.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastText.value = '' }, 2600)
}

function writeCell(row, column, value) {
  if (column.kind === 'time') row.times[column.nodeKey] = value
  else row.weights[column.nodeKey] = value
}

/* 选择箱型后带出货品；一个车次只允许同一箱型。 */
function onContainerChange(row, containerKey) {
  row.containerKey = containerKey
  row.cargo = cargoOf(currentTask.value, containerKey)
}

function readCell(row, column) {
  return column.kind === 'time' ? row.times[column.nodeKey] : row.weights[column.nodeKey]
}

watch(selectedTaskKey, (next, previous) => {
  if (props.embedded || aiRequested.value) return
  onlyErrors.value = false
  formError.value = ''
  importRows('台账', { silent: !previous })
})

/* 默认选中首个任务并预置一批评审数据，打开页面即可看到完整形态。 */
if (!props.embedded && !aiRequested.value) selectedTaskKey.value = batchTasks[0].key

function importRows(sourceLabel, { silent = false } = {}) {
  if (!currentTask.value) return
  rows.value = buildTaskRows(currentTask.value, { count: 300 })
  onlyErrors.value = false
  if (!silent) showToast(`已从${sourceLabel}导入 ${rows.value.length} 条车次记录`)
}

function triggerExcel() {
  if (!currentTask.value) {
    showToast('请先选择运输任务')
    return
  }
  excelInput.value?.click()
}

function onExcelPicked(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  importRows(`${file.name}`)
}

function downloadTemplate() {
  if (!currentTask.value) {
    showToast('请先选择运输任务')
    return
  }
  const csv = templateCsvText(currentTask.value)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `公路集装箱批量补录模板_${currentTask.value.info.number}.csv`
  link.click()
  URL.revokeObjectURL(url)
  showToast('模板已下载，按列填入台账后上传')
}

function openPaste() {
  if (!currentTask.value) {
    showToast('请先选择运输任务')
    return
  }
  pasteText.value = templateTsvText(currentTask.value, 300)
  pasteVisible.value = true
}

function applyPaste() {
  const parsed = parseTsv(pasteText.value, currentTask.value)
  if (!parsed.length) {
    showToast('未解析到有效数据行')
    return
  }
  rows.value = parsed
  onlyErrors.value = false
  pasteVisible.value = false
  showToast(`已解析 ${parsed.length} 条车次记录`)
}

function toggleAll() {
  const next = !allSelected.value
  visibleRows.value.forEach(row => { row.selected = next })
}

function removeSelected() {
  const count = rows.value.filter(row => row.selected).length
  if (!count) {
    showToast('请先勾选要删除的车次行')
    return
  }
  if (aiSession.value) {
    deferSupplementRows(aiGroup.value, rows.value.filter(row => row.selected))
    return
  }
  if (props.embedded) {
    emit('defer', rows.value.filter(row => row.selected))
    return
  }
  rows.value = rows.value.filter(row => !row.selected).map((row, index) => ({ ...row, seq: index + 1 }))
  showToast(`已删除 ${count} 行车次记录`)
}

function submitBatch() {
  if (!currentTask.value || !rows.value.length || blocked.value) return
  formError.value = ''
  if (errorCount.value) {
    formError.value = `还有 ${errorCount.value} 行异常，修正后才能提交。`
    return
  }
  confirmVisible.value = true
}

function confirmSubmit() {
  if (!currentTask.value) return
  if (blocked.value || errorCount.value || !rows.value.length) {
    confirmVisible.value = false
    formError.value = blockMessage.value || '明细已变化，请重新核对后提交。'
    return
  }
  successSummary.value = { waybills: rows.value.length, boxes: totalBoxCount.value }
  confirmVisible.value = false
  if (props.embedded) {
    emit('submitted', successSummary.value)
    return
  }
  if (aiGroup.value) {
    if (!finishSupplementGroup(aiGroup.value)) return
    saveSupplementSession(aiSession.value)
  }
  successVisible.value = true
}

/* 生成后停留在本页，可返回运单中心或继续补录下一批。 */
function continueBatch() {
  if (aiSession.value) return openPrototypePage(router, route, 'aiWorkbench')
  successVisible.value = false
  rows.value = []
  onlyErrors.value = false
  formError.value = ''
}

function backToCenter() {
  if (props.embedded) return emit('close')
  openPrototypePage(router, route, 'waybillCenter')
}

function openAiSupplement() {
  if (aiSession.value) return assistant.value?.showChat()
  openPrototypePage(router, route, 'aiWorkbench', { capability: 'waybill-supplement', task: selectedTaskKey.value })
}

async function downloadSource(file) {
  const blob = await supplementFile(file.id)
  if (!blob) return showToast('原附件在当前浏览器中不可用，仍可查看已保留的运输明细。')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

document.addEventListener('pointerdown', closeTaskPickerOnOutside)
onUnmounted(() => {
  document.removeEventListener('pointerdown', closeTaskPickerOnOutside)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="rcs-page" :class="{ 'rbs-embedded': embedded, 'rbs-ai-handoff': aiSession }">
    <header class="rcs-breadcrumb">
      <div><strong>运单中心</strong><span>›</span><em>公路批量补录</em></div>
      <button v-if="embedded" type="button" @click="detailsOpen = !detailsOpen">{{ detailsOpen ? '收起任务信息' : '展开任务信息' }}</button>
      <button v-else type="button" @click="backToCenter">↩ 返回</button>
    </header>

    <main class="rcs-content rbs-content">
      <div v-if="aiRequested && !aiSession" class="rbs-ai-source" role="alert">{{ blockMessage }}<button type="button" @click="openAiSupplement">返回至小简</button></div>
      <div v-if="aiSession" class="rbs-ai-source">
        <span>至小简已带入任务与 {{ rows.length }} 条运输明细</span>
        <button v-for="file in sourceFiles" :key="file.id" type="button" @click="downloadSource(file)">{{ file.name }}</button>
        <button type="button" @click="supplementChat?.showSource()">查看原始明细</button>
        <button type="button" @click="openAiSupplement">继续对话</button>
      </div>
      <section v-if="!embedded || detailsOpen" class="rcs-section">
        <h2><span class="annot-roadBatchWaybillSupplement-rule-task-scope">指定信息</span></h2>
        <div class="rcs-plan-table">
          <div class="rcs-plan-head">请选择运输任务</div>
          <div class="rcs-plan-head">任务状态</div>
          <div class="rcs-plan-head">承运企业</div>
          <div class="rcs-plan-head">调度者</div>
          <div class="rcs-plan-head">指派企业</div>
          <div class="rcs-plan-head">指派时间</div>

          <div class="rcs-plan-value">
            <div ref="taskPicker" class="rcs-task-picker" @keydown.esc="taskPickerOpen = false">
              <button type="button" class="rcs-task-trigger" :disabled="linkedDraft" :aria-expanded="taskPickerOpen" aria-label="选择运输任务" @click="toggleTaskPicker">
                <span v-if="currentTask" class="rcs-task-trigger-text">
                  <strong :title="taskRouteText(currentTask)">{{ taskRouteText(currentTask) }}</strong>
                  <small>{{ currentTask.info.number }}</small>
                </span>
                <span v-else class="rcs-task-placeholder">请选择运输任务</span>
                <span class="rcs-task-chevron">⌄</span>
              </button>
              <div v-if="taskPickerOpen" class="rcs-task-menu">
                <input ref="taskSearch" v-model="taskQuery" type="search" aria-label="搜索运输任务" placeholder="搜索运输类型、地址别名或任务编号" />
                <div class="rcs-task-options" role="listbox" aria-label="运输任务">
                  <button v-for="task in filteredTasks" :key="task.key" type="button" class="rcs-task-option" role="option" :aria-selected="task.key === selectedTaskKey" @click="selectTask(task)">
                    <strong :title="taskRouteText(task)">{{ taskRouteText(task) }}</strong>
                    <small>{{ task.info.number }}</small>
                  </button>
                  <div v-if="filteredTasks.length === 0" class="rcs-task-empty">没有匹配的运输任务</div>
                </div>
              </div>
            </div>
          </div>
          <div class="rcs-plan-value"><span class="rcs-status">{{ currentTask?.info.status || '—' }}</span></div>
          <div class="rcs-plan-value">{{ currentTask?.info.carrier || '—' }}</div>
          <div class="rcs-plan-value">{{ currentTask?.info.dispatcher || '—' }}</div>
          <div class="rcs-plan-value">{{ currentTask?.info.assigningCompany || '—' }}</div>
          <div class="rcs-plan-value">{{ currentTask?.info.assignedAt || '—' }}</div>
        </div>
      </section>

      <section v-if="!embedded || detailsOpen" class="rcs-section">
        <h2><span class="annot-roadBatchWaybillSupplement-rule-task-binding">任务箱型信息</span></h2>
        <div class="rcs-table">
          <div class="rcs-row rcs-row-head rcs-task-container-grid">
            <span>箱型</span><span>尺寸</span><span>货品</span><span>任务箱数</span><span>箱号分配方式</span>
          </div>
          <div v-for="item in currentTask?.containers || []" :key="item.key" class="rcs-row rcs-task-container-grid">
            <span>{{ item.containerType }}</span>
            <span>{{ item.size }}</span>
            <span>{{ item.cargo }}</span>
            <span>{{ item.taskCount }}</span>
            <span>{{ currentTask?.assignmentMode || '—' }}</span>
          </div>
          <div v-if="!currentTask" class="rcs-row rcs-task-container-grid">
            <span>—</span><span>—</span><span>—</span><span>—</span><span>—</span>
          </div>
        </div>
      </section>

      <section class="rcs-section rbs-section-detail">
        <div class="rcs-section-heading">
          <h2><span class="annot-roadBatchWaybillSupplement-rule-validation">车次明细</span></h2>
          <div v-if="rows.length" class="rbs-stats">
            <span>共 <b>{{ rows.length }}</b> 条</span>
            <span class="is-pass">通过 <b>{{ passCount }}</b></span>
            <span :class="{ 'is-error': errorCount }">异常 <b>{{ errorCount }}</b></span>
            <button type="button" class="rbs-toggle" :class="{ active: onlyErrors }" @click="onlyErrors = !onlyErrors">仅看异常</button>
          </div>
        </div>

        <div class="rbs-toolbar">
          <div class="rbs-toolbar-left">
            <button v-if="!embedded && !aiRequested" type="button" class="rbs-tool annot-roadBatchWaybillSupplement-action-import" :disabled="!currentTask" @click="downloadTemplate">⬇ 下载模板</button>
            <button v-if="!embedded && !aiRequested" type="button" class="rbs-tool" :disabled="!currentTask" @click="triggerExcel">⬆ 上传 Excel</button>
            <button v-if="!embedded && !aiRequested" type="button" class="rbs-tool" :disabled="!currentTask" @click="openPaste">📋 粘贴数据</button>
            <button v-if="!embedded && !route.params.versionId" type="button" class="rbs-tool" @click="openAiSupplement">至小简协助补录</button>
            <button type="button" class="rbs-tool annot-roadBatchWaybillSupplement-action-correction" :disabled="!rows.length || aiGroup?.completed" @click="removeSelected">{{ linkedDraft ? '暂缓选中' : '🗑 删除选中' }}</button>
            <input ref="excelInput" type="file" accept=".xlsx,.xls,.csv" hidden @change="onExcelPicked" />
          </div>
          <p class="rbs-toolbar-hint">一行 = 一个车次 = 一张运单；箱号 1—2 个，须在任务候选箱池内且批内不重复。</p>
        </div>

        <div v-if="!currentTask" class="rbs-empty">
          <p>请先在上方选择运输任务，系统将按任务路线生成车次明细模板。</p>
        </div>
        <div v-else-if="!rows.length" class="rbs-empty">
          <p>选择「下载模板」按列整理台账，或直接上传 / 粘贴已有台账数据。</p>
          <p class="rbs-empty-sub">当前任务路线：{{ currentTask.route.pattern }}｜{{ currentTask.startAlias }} → {{ currentTask.endAlias }}｜{{ (currentTask.containers || []).map(item => item.size).join('、') }}</p>
        </div>
        <div v-else ref="tableWrap" class="rbs-table-wrap">
          <div class="rbs-grid-head" :style="{ gridTemplateColumns: gridTemplate }">
            <span class="rbs-hcell rbs-hcheck"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></span>
            <span
              v-for="(column, index) in HEAD_FIXED" :key="column.key"
              class="rbs-hcell" :style="{ gridColumn: index + 2 }"
            ><span :class="{
              'annot-roadBatchWaybillSupplement-rule-box-validation': column.key === 'box1'
            }">{{ column.label }}<i v-if="column.required || (linkedDraft && column.key === 'phone')">*</i></span></span>
            <span
              v-for="(column, index) in dynamicColumns" :key="column.key"
              class="rbs-hcell" :style="{ gridColumn: dynamicStartColumn + index }"
            >{{ column.label }}</span>
            <span class="rbs-hcell" :style="{ gridColumn: statusColumnIndex }">状态</span>
            <span class="rbs-hcell" :style="{ gridColumn: reasonColumnIndex }">异常原因</span>
          </div>

          <div
            v-for="row in visibleRows" :key="row.key" :inert="aiGroup?.completed || undefined"
            class="rbs-row" :class="{ 'is-error': errorOf(row).length, 'is-focused': focusKeys.includes(row.key) }"
            :style="{ gridTemplateColumns: gridTemplate }"
          >
            <span class="rbs-cell rbs-ccheck"><input type="checkbox" v-model="row.selected" /></span>
            <span class="rbs-cell rbs-cnum">{{ row.seq }}</span>
            <span class="rbs-cell">
              <select :value="row.containerKey" @change="onContainerChange(row, $event.target.value)">
                <option value="" disabled>请选择箱型</option>
                <option v-for="option in containerOptions" :key="option.key" :value="option.key">{{ option.label }}</option>
              </select>
            </span>
            <span class="rbs-cell rbs-creadonly">{{ row.cargo || '—' }}</span>
            <span class="rbs-cell" data-field="driver"><input v-model="row.driver" placeholder="司机" /></span>
            <span class="rbs-cell" data-field="phone"><input v-model="row.phone" type="tel" :aria-label="`第 ${row.seq} 趟司机联系电话`" :aria-required="linkedDraft" :placeholder="linkedDraft ? '请输入手机号' : '选填'" /></span>
            <span class="rbs-cell" data-field="plateNo"><input v-model="row.plateNo" placeholder="车牌号" /></span>
            <span class="rbs-cell"><input v-model="row.chassisNo" placeholder="选填" /></span>
            <span class="rbs-cell"><input v-model="row.boxes[0].containerNo" placeholder="请从候选箱池选择" /></span>
            <span class="rbs-cell"><input v-model="row.boxes[0].sealNo" placeholder="选填" /></span>
            <span class="rbs-cell"><input v-model="row.boxes[1].containerNo" placeholder="单箱留空" /></span>
            <span class="rbs-cell"><input v-model="row.boxes[1].sealNo" placeholder="选填" /></span>
            <span v-for="column in dynamicColumns" :key="column.key" class="rbs-cell">
              <input
                :value="readCell(row, column)"
                :placeholder="column.kind === 'time' ? 'YYYY-MM-DD HH:mm' : '选填'"
                @input="writeCell(row, column, $event.target.value)"
              />
            </span>
            <span class="rbs-cell rbs-cstatus">
              <i v-if="errorOf(row).length" class="rbs-badge is-error">✗</i>
              <i v-else class="rbs-badge is-pass">✓</i>
            </span>
            <span class="rbs-cell rbs-creason" :title="errorOf(row).join('；')">
              <em v-if="errorOf(row).length">{{ errorOf(row).join('；') }}</em>
              <em v-else class="rbs-reason-pass">—</em>
            </span>
          </div>
        </div>
      </section>
    </main>

    <footer class="rcs-actions">
      <span class="rbs-actions-summary">
        <template v-if="rows.length">本批次将生成 <b>{{ passCount }}</b> 张运单，关联 <b>{{ totalBoxCount }}</b> 个箱号</template>
      </span>
      <span v-if="formError || blockMessage" class="rcs-form-error">{{ formError || blockMessage }}</span>
      <button type="button" class="secondary" @click="backToCenter">取消</button>
      <button type="button" class="primary annot-roadBatchWaybillSupplement-action-submit" :disabled="!currentTask || !rows.length || errorCount > 0 || blocked" @click="submitBatch">
        {{ rows.length ? `生成 ${passCount} 张运单` : '生成运单' }}
      </button>
    </footer>

    <div v-if="pasteVisible || confirmVisible || successVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal" :class="{
        'rbs-paste-modal': pasteVisible,
        'rcs-success-modal': successVisible,
        'annot-roadBatchWaybillSupplement-action-paste': pasteVisible,
        'annot-roadBatchWaybillSupplement-rule-confirm': confirmVisible,
        'annot-roadBatchWaybillSupplement-rule-success': successVisible
      }" data-annotation-content="modal">
        <template v-if="pasteVisible">
        <h3>粘贴台账数据</h3>
        <p>从 Excel 复制数据后粘贴到下方，列顺序需与模板一致（车次序号、司机、联系电话、车牌号、车架号、箱号、铅封号，再按任务路段填写作业时间与重量）。</p>
        <textarea v-model="pasteText" spellcheck="false" aria-label="粘贴台账数据"></textarea>
        <footer>
          <button type="button" @click="pasteVisible = false">取消</button>
          <button type="button" class="primary" @click="applyPaste">解析并导入</button>
        </footer>

        </template>
        <template v-else-if="confirmVisible">
        <h3>确认批量生成运单</h3>
        <p>任务 <strong>{{ currentTask?.info.number }}</strong> 本批次共 <strong>{{ rows.length }}</strong> 个车次，将一次生成 <strong>{{ passCount }}</strong> 张运单，关联 <strong>{{ totalBoxCount }}</strong> 个箱号。</p>
        <div class="rcs-confirm-line">
          <b>{{ currentTask?.route.pattern }}｜{{ currentTask?.startAlias }} → {{ currentTask?.endAlias }}</b>
          <span>{{ (currentTask?.containers || []).map(item => item.size).join('、') }}</span>
        </div>
        <footer>
          <button type="button" @click="confirmVisible = false">取消</button>
          <button type="button" class="primary" @click="confirmSubmit">确认生成</button>
        </footer>

        </template>
        <template v-else>
        <span class="rcs-success-icon">✓</span>
        <h3>{{ aiSession ? '模拟补录完成' : '批量补录成功' }}</h3>
        <p>已生成 <strong>{{ successSummary.waybills }}</strong> 张公路集装箱运单，关联 <strong>{{ successSummary.boxes }}</strong> 个箱号。</p>
        <p class="rbs-success-sub">{{ aiSession ? '本次为原型演示，结果已保留在这次对话中。' : '运单已进入运单中心，可在列表中查看与处理。' }}</p>
        <footer>
          <button type="button" @click="continueBatch">继续补录下一批</button>
          <button type="button" class="primary" @click="backToCenter">返回运单中心</button>
        </footer>

        </template>
      </section>
    </div>

    <AssistantEntry v-if="aiSession" :key="aiSession.id" ref="assistant" auto-open placement="business" :context="{ kind: 'supplement', label: `运单补录 · ${aiGroup?.task.info.number}` }">
      <template #conversation>
        <AiWaybillSupplement ref="supplementChat" business :session="aiSession" :state="aiSession.supplement" :agents="[]" />
      </template>
    </AssistantEntry>
    <div v-if="toastText" class="rbs-toast" role="status">{{ toastText }}</div>
  </div>
</template>
