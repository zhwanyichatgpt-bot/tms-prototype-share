<script setup>
/** 运输结算：左侧确认范围和计费，右侧共享同一份可编辑草稿。 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AiReconChat from './AiReconChat.vue'
import CreateDrawer from '../../运输结算/components/CreateDrawer.vue'
import SettlementDetail from '../../运输结算/components/SettlementDetail.vue'
import AiTemplateLibrary from './AiTemplateLibrary.vue'
import { ElDialog } from 'element-plus'
import { templatesReady, matchingTemplates, exportStatement, downloadBlob } from '../settlement-templates.js'
import '../../运输结算/transport-settlement.css'
import { PLANS, SETTLEMENT, draftFor, diffCountsFor, recalculateDraft, money } from '../recon-data'
import '../recon.css'

const emit = defineEmits(['close', 'suggestion-progress'])
const phase = ref('loading')
const showWorkspace = computed(() => ['review', 'compare', 'draft', 'done'].includes(phase.value))
const host = ref(null)
const paneWidth = ref(0)
const chatWidth = ref(null)
const resizing = ref(false)
const minChatWidth = computed(() => Math.min(280, Math.max(0, paneWidth.value - 368)))
const maxChatWidth = computed(() => Math.max(minChatWidth.value, paneWidth.value - 368))
const clampWidth = value => Math.round(Math.max(minChatWidth.value, Math.min(maxChatWidth.value, value)))
const effectiveChatWidth = computed(() => clampWidth(chatWidth.value ?? paneWidth.value * 0.34))
let sizeObserver, activePointer = null, pointerOffset = 0
function startResize(event) {
  if (event.button !== 0) return
  event.preventDefault()
  activePointer = event.pointerId
  pointerOffset = event.clientX - host.value.getBoundingClientRect().left - effectiveChatWidth.value
  resizing.value = true
  event.currentTarget.focus({ preventScroll: true })
  event.currentTarget.setPointerCapture(event.pointerId)
}
function resize(event) {
  if (!resizing.value || event.pointerId !== activePointer) return
  chatWidth.value = clampWidth(event.clientX - host.value.getBoundingClientRect().left - pointerOffset)
}
function stopResize(event) {
  if (event.pointerId !== activePointer) return
  resizing.value = false
  activePointer = null
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
}
function resizeByKey(event) {
  const step = event.shiftKey ? 64 : 24
  if (event.key === 'ArrowLeft') chatWidth.value = clampWidth(effectiveChatWidth.value - step)
  else if (event.key === 'ArrowRight') chatWidth.value = clampWidth(effectiveChatWidth.value + step)
  else if (event.key === 'Home') chatWidth.value = minChatWidth.value
  else if (event.key === 'End') chatWidth.value = maxChatWidth.value
  else if (event.key === 'Enter') chatWidth.value = null
  else return
  event.preventDefault()
}
onMounted(() => {
  paneWidth.value = host.value.clientWidth
  sizeObserver = new ResizeObserver(() => {
    paneWidth.value = host.value.clientWidth
    if (chatWidth.value !== null) chatWidth.value = clampWidth(chatWidth.value)
  })
  sizeObserver.observe(host.value)
})
const basis = ref('ours')
const selectedIds = ref([])
const comparison = ref(false)
const diffOnly = ref(false)
const draft = ref(draftFor('ours', []))
const messages = ref([{ role: 'user', text: '帮我创建 10 月福建大道成的运输结算单' }])
const response = ref('')
const edits = new Map()
const confirmed = ref(null)
const createdRow = ref(null)
const exportBusy = ref(false)
const exportFile = ref(null)
const exportOptions = ref([])
const exportError = ref(false)
watch([phase, exportFile], () => emit('suggestion-progress', { phase: phase.value, exported: !!exportFile.value }), { immediate: true })
const templateLibraryOpen = ref(false)
const templateId = ref('')
function showTemplates(id = '') { templateId.value = id; templateLibraryOpen.value = true }
function download(file) { downloadBlob(file.blob, file.fileName) }
async function requestExport() {
  if (exportBusy.value || !confirmed.value) return
  exportBusy.value = true; exportError.value = false; exportOptions.value = []
  response.value = '正在从知识库匹配适用于本次结算对象的对账模板。'
  try {
    await templatesReady
    const options = matchingTemplates(confirmed.value)
    if (!options.length) {
      response.value = `知识库中暂无适用于“${confirmed.value.party}”的已启用模板。请上传对应模板或启用已有模板，再继续导出。`
      exportError.value = true
    } else if (options.length > 1) {
      exportOptions.value = options
      response.value = `找到 ${options.length} 个适用于“${confirmed.value.party}”的模板，请选择本次对账使用的格式。`
    } else await generateExport(options[0])
  } catch (error) { response.value = error.message || '模板读取失败，请稍后重试。'; exportError.value = true }
  finally { exportBusy.value = false }
}
async function generateExport(template) {
  exportBusy.value = true; exportError.value = false
  response.value = '正在按模板生成对账单，使用本次已确认的计划、运单和金额。'
  try {
    const result = await exportStatement(template, confirmed.value)
    exportFile.value = { ...result, templateId: template.id }
    exportOptions.value = []
    response.value = `已按“${template.name}”生成对账单，结算对象为${confirmed.value.party}，共 ${result.count} 条运单、${money(result.total)}。下载后即可用于本单对账。`
  } catch (error) { response.value = error.message || '对账单生成失败，请重试。'; exportError.value = true }
  finally { exportBusy.value = false }
}
function selectTemplate(template) { record(`使用模板“${template.name}”（${template.version}）导出。`); generateExport(template) }
function startExport() { if (exportBusy.value) return; record('按知识库中已有的模板导出这张结算单的对账单。'); requestExport() }

const selectedPlans = computed(() => PLANS.filter(plan => selectedIds.value.includes(plan.id)))
const allDraft = draftFor('ours')
const differences = computed(() => diffCountsFor(selectedIds.value))
const invalid = computed(() => draft.value.rows.some(row => [row.weight, row.price].some(value => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)))
const canSubmit = computed(() => phase.value === 'draft' && draft.value.count > 0 && !invalid.value && Boolean(draft.value.settleDate))
const assistantText = computed(() => {
  if (response.value) return response.value
  if (phase.value === 'loading') return '正在查找福建大道成 10 月可结算的计划与运单，并汇总各计划的装卸货量。'
  if (phase.value === 'scope') return `找到 ${PLANS.length} 个计划、${allDraft.count} 条可结算运单，装货量 ${allDraft.totalLoad.toFixed(2)} 吨，卸货量 ${allDraft.totalUnload.toFixed(2)} 吨。请选择全部或部分计划，确认后再打开右侧结算单页面。`
  if (phase.value === 'review') return `已选择 ${selectedPlans.value.length} 个计划、${draft.value.count} 条运单。计划规则为按卸货重量、合同单价 150 元/吨计费，路耗按当前计划规则扣减，预估金额 ${money(draft.value.total)}。请确认本次计费口径。`
  if (phase.value === 'compare') return `已载入示例对账单，仅比较选中的 ${draft.value.count} 条运单：重量差 ${differences.value.weight} 条、单价差 ${differences.value.price} 条，另有 ${differences.value.duplicate} 条对方重复记录不计入。请选择采用的数据，右侧同步更新。`
  if (phase.value === 'done') return `结算单 ${SETTLEMENT.no} 已创建（演示）：${selectedPlans.value.length} 个计划、${draft.value.count} 条运单，结算金额 ${money(draft.value.total)}。右侧已打开详情，也可以继续让我按知识库模板导出对账单。`
  return `已确认${basis.value === 'theirs' ? '运输企业回单' : '计划计费规则'}，结算金额 ${money(draft.value.total)}。可以在对话中调整本次计费数据，右侧会同步重算。例如“计划一单价改为155”。核对无误后，请在右侧点击“确定”。`
})

function rebuild() {
  const previous = draft.value
  const next = draftFor(basis.value, selectedIds.value, comparison.value)
  Object.assign(next, { settleDate: previous.settleDate, remark: previous.remark })
  for (const row of next.rows) if (edits.has(row.id)) Object.assign(row, edits.get(row.id), { manual: true })
  if (edits.size) next.basis = 'custom'
  draft.value = recalculateDraft(next)
}
function record(text) {
  messages.value.push({ role: 'ai', text: assistantText.value, file: exportFile.value }, { role: 'user', text })
  response.value = ''; exportFile.value = null; exportOptions.value = []; exportError.value = false
}
const timer = setTimeout(() => { selectedIds.value = PLANS.map(plan => plan.id); rebuild(); phase.value = 'scope' }, 600)
function selectPlans(ids) {
  if (phase.value !== 'scope') return
  selectedIds.value = ids.filter(id => PLANS.some(plan => plan.id === id))
  rebuild()
}
function confirmScope(text) {
  if (!selectedIds.value.length) return
  record(text || `本次结算${selectedPlans.value.map(plan => plan.name).join('、')}，共 ${draft.value.count} 条运单。`)
  phase.value = 'review'
}
function chooseBasis(value = 'ours') {
  record(value === 'theirs' ? '按示例对账单的数据核算。' : '按计划计费规则核算。')
  basis.value = value
  edits.clear()
  rebuild()
  phase.value = 'draft'
}
function loadComparison() {
  record('使用示例对账单，核对当前选中的运单。')
  comparison.value = true
  diffOnly.value = false
  rebuild()
  phase.value = 'compare'
}
function changeScope() {
  if (phase.value === 'done' || phase.value === 'loading') return
  record('调整本次结算的计划范围。')
  diffOnly.value = false
  phase.value = 'scope'
}
function changeRows(ids, field, value, text) {
  if (phase.value !== 'draft') return
  const rows = draft.value.rows.filter(row => ids.includes(row.id))
  if (!rows.length) return
  record(text)
  for (const row of rows) {
    row[field] = value
    row.manual = true
    edits.set(row.id, { ...(edits.get(row.id) || {}), [field]: value })
  }
  draft.value.basis = 'custom'
  recalculateDraft(draft.value)
  response.value = invalid.value ? '计价量和单价需要填写有效的非负数，补齐后才能提交。' : `已更新 ${rows.length} 条运单的${field === 'price' ? '单价' : '计价量'}，右侧已同步，结算金额更新为 ${money(draft.value.total)}。本次调整只作用于结算草稿。`
}
function updateRow({ id, field, value }) {
  const row = draft.value.rows.find(item => item.id === id)
  if (!row || !['weight', 'price'].includes(field)) return
  changeRows([id], field, value, `将第 ${row.seq} 条运单的${field === 'price' ? '单价' : '计价量'}改为 ${value === '' ? '待填写' : value}${field === 'price' ? ' 元/吨' : ' 吨'}。`)
}
function updateMeta({ field, value }) {
  if (phase.value === 'done' || !['remark', 'settleDate'].includes(field)) return
  draft.value[field] = value
}
function confirmCreate() {
  if (!canSubmit.value) return
  record('已在右侧核对并确定创建运输结算单。')
  confirmed.value = JSON.parse(JSON.stringify({ ...draft.value, no: SETTLEMENT.no, period: SETTLEMENT.period }))
  createdRow.value = { id: SETTLEMENT.no, status: '待打款（演示）', total: money(confirmed.value.total),
    settleAt: confirmed.value.settleDate, creator: '当前用户', createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    remark: confirmed.value.remark, baseFreight: money(confirmed.value.totalBasic), deduction: money(confirmed.value.loss) }
  phase.value = 'done'
}
function question(text) {
  if (exportBusy.value) return
  if (phase.value === 'done') {
    record(text)
    if (/导出|对账单|下载/.test(text)) requestExport()
    else if (/模板|知识库/.test(text)) { response.value = '可以查看知识库中的模板原文件与适用企业，上传后再按模板导出。'; showTemplates() }
    else response.value = '本次结算已创建，右侧展示已确认的详情。可以说“按模板导出对账单”，文件会沿用本单数据。'
    return
  }
  const field = /单价/.test(text) ? 'price' : /计价量|计费重量/.test(text) ? 'weight' : null
  const value = text.match(/(?:改为|改成|调整为)\s*(\d+(?:\.\d+)?)/)
  if (field && value) {
    const seq = text.match(/第\s*(\d+)\s*(?:条|张)/)
    const plan = PLANS.find(item => text.includes(item.number) || text.includes(item.name) || text.includes(`计划${{ 'plan-a': '一', 'plan-b': '二', 'plan-c': '三' }[item.id]}`))
    const targets = draft.value.rows.filter(row => text.includes(row.id) || (seq && row.seq === Number(seq[1])) || (plan && row.planId === plan.id) || /全部|所有|统一/.test(text))
    if (phase.value === 'draft' && targets.length) return changeRows(targets.map(row => row.id), field, Number(value[1]), text)
    record(text); response.value = phase.value !== 'draft' ? '请先确认计费口径，再调整结算草稿。' : '请注明计划编号、计划一/二/三或第几条运单，避免修改到其他运单。'; return
  }
  if (phase.value === 'scope') {
    const ids = /全部|全选/.test(text) ? PLANS.map(plan => plan.id) : PLANS.filter(plan => text.includes(plan.name) || text.includes(plan.number) || text.includes(`计划${{ 'plan-a': '一', 'plan-b': '二', 'plan-c': '三' }[plan.id]}`)).map(plan => plan.id)
    if (ids.length) { selectPlans(ids); return confirmScope(text) }
  }
  if (['review', 'compare'].includes(phase.value) && /计划规则|计划计费|我方|系统|卸货重量/.test(text)) return chooseBasis('ours')
  if (phase.value === 'compare' && /对方|回单/.test(text)) return chooseBasis('theirs')
  if (/重新选择|调整计划|重新选计划/.test(text)) return changeScope()
  record(text)
  if (/路耗|损耗/.test(text)) response.value = '当前示例计划按“装货量－计价量－允许损耗0.3吨”的正差额，乘以货品单价150元/吨计算路耗扣减。各计划的正式规则应以合同配置为准。'
  else response.value = phase.value === 'scope' ? '可以全选，或勾选本次要结算的计划后确认；也可以说“只结算计划一”。' : '可以调整计划范围、确认计费口径，或在计费确认后指定某条运单、某个计划修改单价和计价量。提交请在右侧完成。'
}
onUnmounted(() => { clearTimeout(timer); sizeObserver?.disconnect() })
</script>

<template>
  <div ref="host" class="rc-recon" :class="{ 'is-chat-only': !showWorkspace, 'is-resizing': resizing }" :style="showWorkspace ? { '--rc-chat-width': `${effectiveChatWidth}px` } : undefined">
    <AiReconChat :phase="phase" :basis="basis" :comparison="comparison" :diff-only="diffOnly" :messages="messages" :assistant-text="assistantText" :plans="PLANS" :selected-ids="selectedIds" :draft="draft" :differences="differences" :export-busy="exportBusy" :export-file="exportFile" :export-options="exportOptions" :export-error="exportError" @export="startExport" @select-template="selectTemplate" @download="download" @templates="showTemplates" @select-plans="selectPlans" @confirm-scope="confirmScope()" @choose-basis="chooseBasis" @compare="loadComparison" @toggle-diff="diffOnly = !diffOnly" @scope="changeScope" @question="question" />
    <div v-if="showWorkspace" class="rc-splitter" role="separator" tabindex="0" aria-label="调整对话和结算页面宽度" aria-orientation="vertical" :aria-valuemin="minChatWidth" :aria-valuemax="maxChatWidth" :aria-valuenow="effectiveChatWidth" :aria-valuetext="`对话宽度 ${effectiveChatWidth} 像素`" title="左右拖动调整宽度，双击恢复默认" @pointerdown="startResize" @pointermove="resize" @pointerup="stopResize" @pointercancel="stopResize" @lostpointercapture="stopResize" @keydown="resizeByKey" @dblclick="chatWidth = null" />
    <SettlementDetail v-if="phase === 'done'" embedded :row="createdRow" :draft="confirmed" @close="emit('close')" @notice="response = $event" />
    <CreateDrawer v-else-if="showWorkspace" embedded :draft="draft" :diff-only="diffOnly" :workflow-phase="phase" :comparison="comparison" :confirm-blocked="!canSubmit" :submitted="phase === 'done'" @update-row="updateRow" @update-meta="updateMeta" @scope="changeScope" @confirm="confirmCreate" @close="emit('close')" @notice="response = $event" />
    <ElDialog v-model="templateLibraryOpen" title="知识库 · 结算与对账模板" width="min(900px, 92vw)" append-to-body destroy-on-close><AiTemplateLibrary :initial-id="templateId" /></ElDialog>
  </div>
</template>
