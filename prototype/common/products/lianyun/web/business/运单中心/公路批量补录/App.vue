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

const router = useRouter()
const route = useRoute()

const selectedTaskKey = ref('')
const rows = ref([])
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
const currentTask = computed(() => batchTasks.find(item => item.key === selectedTaskKey.value) || null)
const dynamicColumns = computed(() => dynamicColumnsOf(currentTask.value))
const gridTemplate = computed(() => {
  const dynamic = dynamicColumns.value.map(column => `${column.width}px`).join(' ')
  const fixed = HEAD_FIXED.map(column => `${column.width}px`).join(' ')
  return `40px ${fixed} ${dynamic} 52px 216px`
})
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
  onlyErrors.value = false
  formError.value = ''
  importRows('台账', { silent: !previous })
})

/* 默认选中首个任务并预置一批评审数据，打开页面即可看到完整形态。 */
selectedTaskKey.value = batchTasks[0].key

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
  rows.value = rows.value.filter(row => !row.selected).map((row, index) => ({ ...row, seq: index + 1 }))
  showToast(`已删除 ${count} 行车次记录`)
}

function submitBatch() {
  if (!currentTask.value || !rows.value.length) return
  formError.value = ''
  if (errorCount.value) {
    formError.value = `还有 ${errorCount.value} 行异常，修正后才能提交。`
    return
  }
  confirmVisible.value = true
}

function confirmSubmit() {
  if (!currentTask.value) return
  successSummary.value = { waybills: rows.value.length, boxes: totalBoxCount.value }
  confirmVisible.value = false
  successVisible.value = true
}

/* 生成后停留在本页，可返回运单中心或继续补录下一批。 */
function continueBatch() {
  successVisible.value = false
  rows.value = []
  onlyErrors.value = false
  formError.value = ''
}

function backToCenter() {
  openPrototypePage(router, route, 'waybillCenter')
}

document.addEventListener('pointerdown', closeTaskPickerOnOutside)
onUnmounted(() => {
  document.removeEventListener('pointerdown', closeTaskPickerOnOutside)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="rcs-page">
    <header class="rcs-breadcrumb">
      <div><strong>运单中心</strong><span>›</span><em>公路批量补录</em></div>
      <button type="button" @click="backToCenter">↩ 返回</button>
    </header>

    <main class="rcs-content rbs-content">
      <section class="rcs-section">
        <h2>指定信息</h2>
        <div class="rcs-plan-table annot-roadBatchWaybillSupplement-rule-task-scope">
          <div class="rcs-plan-head">请选择运输任务</div>
          <div class="rcs-plan-head">任务状态</div>
          <div class="rcs-plan-head">承运企业</div>
          <div class="rcs-plan-head">调度者</div>
          <div class="rcs-plan-head">指派企业</div>
          <div class="rcs-plan-head">指派时间</div>

          <div class="rcs-plan-value">
            <div ref="taskPicker" class="rcs-task-picker" @keydown.esc="taskPickerOpen = false">
              <button type="button" class="rcs-task-trigger" :aria-expanded="taskPickerOpen" aria-label="选择运输任务" @click="toggleTaskPicker">
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

      <section class="rcs-section">
        <h2>任务箱型信息</h2>
        <div class="rcs-table annot-roadBatchWaybillSupplement-rule-task-container">
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
          <h2>车次明细</h2>
          <div v-if="rows.length" class="rbs-stats">
            <span>共 <b>{{ rows.length }}</b> 条</span>
            <span class="is-pass">通过 <b>{{ passCount }}</b></span>
            <span :class="{ 'is-error': errorCount }">异常 <b>{{ errorCount }}</b></span>
            <button type="button" class="rbs-toggle" :class="{ active: onlyErrors }" @click="onlyErrors = !onlyErrors">仅看异常</button>
          </div>
        </div>

        <div class="rbs-toolbar annot-roadBatchWaybillSupplement-action-import">
          <div class="rbs-toolbar-left">
            <button type="button" class="rbs-tool" :disabled="!currentTask" @click="downloadTemplate">⬇ 下载模板</button>
            <button type="button" class="rbs-tool" :disabled="!currentTask" @click="triggerExcel">⬆ 上传 Excel</button>
            <button type="button" class="rbs-tool" :disabled="!currentTask" @click="openPaste">📋 粘贴数据</button>
            <button type="button" class="rbs-tool" :disabled="!rows.length" @click="removeSelected">🗑 删除选中</button>
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
        <div v-else class="rbs-table-wrap annot-roadBatchWaybillSupplement-rule-validation">
          <div class="rbs-grid-head annot-roadBatchWaybillSupplement-rule-derive-columns" :style="{ gridTemplateColumns: gridTemplate }">
            <span class="rbs-hcell rbs-hcheck"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></span>
            <span
              v-for="(column, index) in HEAD_FIXED" :key="column.key"
              class="rbs-hcell" :style="{ gridColumn: index + 2 }"
            >{{ column.label }}<i v-if="column.required">*</i></span>
            <span
              v-for="(column, index) in dynamicColumns" :key="column.key"
              class="rbs-hcell" :style="{ gridColumn: dynamicStartColumn + index }"
            >{{ column.label }}</span>
            <span class="rbs-hcell" :style="{ gridColumn: statusColumnIndex }">状态</span>
            <span class="rbs-hcell" :style="{ gridColumn: reasonColumnIndex }">异常原因</span>
          </div>

          <div
            v-for="row in visibleRows" :key="row.key"
            class="rbs-row" :class="{ 'is-error': errorOf(row).length }"
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
            <span class="rbs-cell"><input v-model="row.driver" placeholder="司机" /></span>
            <span class="rbs-cell"><input v-model="row.phone" placeholder="选填" /></span>
            <span class="rbs-cell"><input v-model="row.plateNo" placeholder="车牌号" /></span>
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
      <span v-if="formError" class="rcs-form-error">{{ formError }}</span>
      <button type="button" class="secondary" @click="backToCenter">取消</button>
      <button type="button" class="primary annot-roadBatchWaybillSupplement-action-submit" :disabled="!currentTask || !rows.length || errorCount > 0" @click="submitBatch">
        {{ rows.length ? `生成 ${passCount} 张运单` : '生成运单' }}
      </button>
    </footer>

    <div v-if="pasteVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal rbs-paste-modal" data-annotation-content="modal">
        <h3>粘贴台账数据</h3>
        <p>从 Excel 复制数据后粘贴到下方，列顺序需与模板一致（车次序号、司机、联系电话、车牌号、车架号、箱号、铅封号，再按任务路段填写作业时间与重量）。</p>
        <textarea v-model="pasteText" spellcheck="false" aria-label="粘贴台账数据"></textarea>
        <footer>
          <button type="button" @click="pasteVisible = false">取消</button>
          <button type="button" class="primary" @click="applyPaste">解析并导入</button>
        </footer>
      </section>
    </div>

    <div v-if="confirmVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal annot-roadBatchWaybillSupplement-rule-confirm" data-annotation-content="modal">
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
      </section>
    </div>

    <div v-if="successVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal rcs-success-modal annot-roadBatchWaybillSupplement-rule-success" data-annotation-content="modal">
        <span class="rcs-success-icon">✓</span>
        <h3>批量补录成功</h3>
        <p>已生成 <strong>{{ successSummary.waybills }}</strong> 张公路集装箱运单，关联 <strong>{{ successSummary.boxes }}</strong> 个箱号。</p>
        <p class="rbs-success-sub">运单已进入运单中心，可在列表中查看与处理。</p>
        <footer>
          <button type="button" @click="continueBatch">继续补录下一批</button>
          <button type="button" class="primary" @click="backToCenter">返回运单中心</button>
        </footer>
      </section>
    </div>

    <div v-if="toastText" class="rbs-toast" role="status">{{ toastText }}</div>
  </div>
</template>
