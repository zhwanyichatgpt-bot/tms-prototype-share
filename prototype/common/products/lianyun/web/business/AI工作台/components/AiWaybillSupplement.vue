<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import { saveSupplementSession, retainSupplementFiles } from '../supplement-handoff.js'
import { ElButton, ElRadio, ElRadioGroup, ElTable, ElTableColumn, ElDialog, ElAlert } from 'element-plus'
import AiComposer from './AiComposer.vue'
import AiChat from './AiChat.vue'
import AiIcon from './AiIcon.vue'
import '../ai-workbench.css'
import { driverChoices, shortHaulDriverChoices, loadSupplementExample, confirmSupplementTask, decideSupplementTrip, selectSupplementDriver, supplementIssues, deferSupplementRows, pendingTrip, decideSupplementWeight } from '../supplement-flow.js'
import '../supplement-flow.css'

const props = defineProps({ state: { type: Object, required: true }, session: { type: Object, required: true }, model: Object, agents: Array, business: Boolean })
const router = useRouter()
const route = useRoute()
const host = ref(null)
const draft = ref('')
const attachments = ref([])
const sourceVisible = ref(false)
const resultVisible = ref(false)
const selectedDriver = ref('')
const tripOptions = [
  { value: 'same', badge: '1 趟', label: '同一趟，一车两箱', description: '两只箱合并补录，生成 1 张运单。' },
  { value: 'separate', badge: '2 趟', label: '分两趟，分别补录', description: '两只箱分别补录，生成 2 张运单。' },
]
const weightOptions = [
  { value: 'site', badge: '磅单', label: '使用石场磅单值', description: '将石场磅单值填入装货重量。' },
  { value: 'empty', badge: '留空', label: '装货重量暂留空', description: '保留原始明细，暂不填装货重量。' },
]
const group = computed(() => props.state.groups.find(item => item.id === props.state.currentId))
const issues = computed(() => supplementIssues(group.value))
const currentIssue = computed(() => issues.value[0])
const trip = computed(() => pendingTrip(group.value))
const choiceOptions = computed(() => {
  if (currentIssue.value?.id === 'trip') return tripOptions
  if (currentIssue.value?.id === 'weight') return weightOptions
  return null
})
const navigating = ref(false)
watch(() => group.value?.matched, async matched => {
  if (!matched || props.business || navigating.value) return
  navigating.value = true
  await nextTick()
  props.state.workspaceOpen = false
  saveSupplementSession(props.session)
  try {
    await openPrototypePage(router, route, 'roadBatchWaybillSupplement', { aiSupplement: props.session.id })
  } catch {
    props.state.notice = '页面暂时未能打开，请稍后从当前对话继续。'
  } finally { navigating.value = false }
}, { immediate: true })
const activeDriverChoices = computed(() => group.value?.tripQuestions ? shortHaulDriverChoices : driverChoices)
const missingPhoneRows = computed(() => (group.value?.rows || []).filter(row => !String(row.phone || '').trim()))
const sourceRows = computed(() => props.state.records.filter(record => !group.value || [...group.value.rows, ...group.value.deferred].some(row => row.sourceIds.includes(record.id))))
const tripRows = computed(() => {
  if (currentIssue.value?.id !== 'trip') return []
  const ids = trip.value?.ids || [1, 2]
  return sourceRows.value.filter(record => ids.includes(record.id))
})
const tripSummary = computed(() => tripRows.value[0])
const candidates = computed(() => props.state.groups.map(candidate => {
  const { task } = candidate
  const addressOf = key => {
    const node = task.route.nodes.find(item => item.key === key)
    return [node?.city, node?.address].filter(Boolean).join(' · ') || '未登记'
  }
  return {
    id: candidate.id,
    task,
    dispatched: candidate.dispatched,
    loadAddress: addressOf('load'),
    unloadAddress: addressOf('unload'),
    cargo: [...new Set(task.containers.map(container => container.cargo))].join('、'),
  }
}))
const message = computed(() => {
  if (!props.state.loaded) return props.state.fileName
    ? '已收到运输明细，附件会随本次补录一起带入业务页。当前演示可使用脱敏示例验证补录流程。'
    : '请上传公路运输明细。我会根据线路、日期和箱号查找对应任务。'
  if (group.value?.completed) return `当前任务已完成模拟补录，生成 ${group.value.results.length} 张运单。可以查看结果，或继续其他记录。`
  if (currentIssue.value?.id === 'task' && group.value.tripQuestions) return '这份明细有 13 箱。我找到了一个候选任务，请对照任务的装卸地址、日期和人员，确认是否补到这段运输。'
  if (currentIssue.value?.id === 'task') return '我按装卸地点和箱号整理了两组记录。请核对当前这组记录对应的运输任务。'
  if (currentIssue.value?.id === 'trip') return `原表第 ${trip.value?.ids.join('、') || '1、2'} 行的日期、司机和车牌相同。请对照箱明细，确认两箱同趟运输，还是分了两趟。`
  if (currentIssue.value?.id === 'weight') return '明细有「石场磅单」和「铁路吨数」两列，其中 3 条记录数值不同。请确认公路装货重量是否使用石场磅单值。'
  if (currentIssue.value?.id === 'driver') {
    if (group.value.tripQuestions) return `已补齐 ${group.value.rows.length - missingPhoneRows.value.length} 趟的手机号。「${activeDriverChoices.value[0].name}」有两份同名档案，请确认司机身份后带出手机号。`
    return '已按你确认的车次整理明细。运输明细只写了“张强”，系统里有两位同名司机，请确认是哪一位。'
  }
  if (currentIssue.value?.id === 'phone') return currentIssue.value.text
  if (currentIssue.value?.id?.startsWith('binding')) return `这组任务已有派车记录，记录车辆为 ${group.value.expectedPlate}。请核对实际执行车辆与运输明细填写是否一致。`
  if (!group.value?.rows.length) return '当前记录已暂缓，可以恢复后继续处理，或切换其他任务。'
  return `已整理出 ${group.value.rows.length} 趟运输，司机手机号已补齐。请核对批量补录表后提交。原表未提供具体装卸时刻，对应字段留空。`
})

watch(() => [props.business, props.session.messages.length, currentIssue.value?.id], async () => {
  if (!props.business) return
  await nextTick()
  const scroller = host.value?.querySelector('.ai-chat-scroll')
  if (scroller) scroller.scrollTop = scroller.scrollHeight
}, { immediate: true })
watch(() => group.value?.id, () => { selectedDriver.value = ''; props.state.notice = '' })

function record(text, files = []) {
  const index = props.session.messages.length
  props.session.messages.push(
    { id: `supplement-step-${index}`, role: 'assistant', supplementPrompt: true, answer: { title: message.value, sections: [] } },
    { id: `supplement-step-${index + 1}`, role: 'user', text, files },
  )
  props.state.history.push(text)
  props.state.notice = ''
}
function loadExample() {
  record('使用示例运输明细')
  loadSupplementExample(props.state)
  attachments.value = []
}
function acceptTask() {
  if (group.value.candidate !== group.value.task.key) {
    props.state.notice = '所选任务的装卸路线与这组记录不同，请查看原表核实，或先暂缓这组记录。'
    return
  }
  record(`已确认任务 ${group.value.task.info.number}。`)
  confirmSupplementTask(group.value)
}
function decideTrip(decision, text, files) {
  const rows = trip.value?.ids.join('、') || '1、2'
  record(text || `原表第 ${rows} 行${decision === 'same' ? '同一趟运输，一车两箱。' : '分两趟运输。'}`, files)
  decideSupplementTrip(group.value, decision)
}
function decideWeight(useSiteWeight) {
  record(useSiteWeight ? '装货重量使用石场磅单值。' : '装货重量暂留空。')
  decideSupplementWeight(group.value, props.state.records, useSiteWeight)
}
function chooseOption(value) {
  if (currentIssue.value?.id === 'trip') return decideTrip(value)
  if (currentIssue.value?.id === 'weight') decideWeight(value === 'site')
}
function selectDriver() {
  const chosen = activeDriverChoices.value.find(item => item.id === selectedDriver.value)
  if (!chosen) return
  record(`确认司机为${chosen.name}，手机号尾号 ${chosen.phone.slice(-4)}。`)
  selectSupplementDriver(group.value, chosen.id)
}
function confirmBinding() {
  if (group.value.rows.some(row => row.plateNo !== group.value.expectedPlate)) {
    props.state.notice = '请先在业务表格修改经核实的运输明细值。若确为实际换车，需按原调度流程更正；本原型可暂缓该记录。'
    return
  }
  record('已核实原始运输明细，车辆与已有派车记录一致。')
  group.value.bindingConfirmed = true
}
function deferRows(rows) {
  record('暂缓所选记录。')
  deferSupplementRows(group.value, rows)
}
function restoreDeferred() {
  record('恢复暂缓记录。')
  if (group.value.completed) {
    group.value.rows = []
    group.value.completed = false
  }
  group.value.rows.push(...group.value.deferred.splice(0))
  group.value.rows.forEach((row, index) => { row.seq = index + 1 })
}
async function filesAdded(files) {
  attachments.value.push(...await retainSupplementFiles(files))
}
function submitText() {
  const text = draft.value.trim()
  const files = attachments.value.map(file => ({ ...file }))
  if (files.length) props.state.files = [...(props.state.files || []), ...files]
  if (!text && !files.length) return
  if (!props.state.loaded) {
    record(text, files)
    if (files.length) props.state.fileName = files[0].name
    props.state.notice = '已接收补录意图。本原型尚未解析上传文件，请点击“使用示例运输明细”验证处理流程。'
  } else if (currentIssue.value?.id === 'trip' && /两趟|分开/.test(text)) decideTrip('separate', text, files)
  else if (currentIssue.value?.id === 'trip' && /同趟|同一趟|一车两箱/.test(text)) decideTrip('same', text, files)
  else if (currentIssue.value?.id === 'phone' && /(?<!\d)1[3-9]\d{9}(?!\d)/.test(text)) {
    const phones = text.match(/(?<!\d)1[3-9]\d{9}(?!\d)/g)
    const candidates = missingPhoneRows.value
    const named = candidates.filter(row => text.includes(row.driver) || text.includes(row.plateNo))
    const targets = named.length ? named : candidates.length === 1 ? candidates : []
    record(text, files)
    if (phones.length === 1 && targets.length === 1) targets[0].phone = phones[0]
    else props.state.notice = '请注明要补充的司机姓名或车牌，每次补充一位司机的手机号。'
  } else {
    record(text, files)
    props.state.notice = '已保留你的补充说明。请使用当前问题下的选项确认，或直接修改业务页明细；自由对话判断尚未接入。'
  }
  attachments.value = []
  draft.value = ''
}
defineExpose({ showSource: () => { sourceVisible.value = true } })
</script>

<template>
  <section ref="host" class="ai-supplement" :class="{ 'ai-supplement-business': business }" aria-label="AI辅助运单补录">
    <div class="ais-body">
      <aside class="ais-conversation" aria-label="至小简补录对话">
        <nav v-if="business && state.groups.length > 1" class="ais-group-switch" aria-label="运输任务分组"><button v-for="(item, index) in state.groups" :key="item.id" type="button" :class="{ active: state.currentId === item.id }" @click="state.currentId = item.id">任务 {{ index + 1 }} · {{ item.completed ? '已完成' : item.matched ? '核对中' : '待确认' }}</button></nav>
        <header v-if="!business" class="ai-conversation-header"><h1>{{ session.title }}</h1></header>
        <AiChat :session="session" :selected-messages="[]">
          <section class="ai-message-row role-assistant">
            <span class="ai-response-avatar"><img src="/ai-workbench-assets/assistant-avatar.svg" alt="至小简" /></span>
            <div class="ai-assistant-message ais-chat">
          <p class="ais-message" aria-live="polite">{{ message }}</p>
          <ElButton v-if="group?.completed" link type="primary" @click="resultVisible = true">查看补录结果</ElButton>
          <template v-if="!state.loaded">
            <p class="ais-muted">附件已保留在当前浏览器。当前原型使用脱敏示例验证处理流程。</p>
            <ElButton type="primary" @click="loadExample">使用示例运输明细</ElButton>
          </template>
          <template v-else-if="currentIssue?.id === 'task'">
            <ElRadioGroup v-model="group.candidate" class="ais-candidates" aria-label="候选运输任务">
              <div v-for="candidate in candidates" :key="candidate.id" class="ais-candidate ais-task-candidate">
                <ElRadio :value="candidate.task.key"><strong>{{ candidate.loadAddress }} → {{ candidate.unloadAddress }}</strong></ElRadio>
                <div class="ais-task-meta">任务编号 {{ candidate.task.info.number }}</div>
                <dl class="ais-evidence-grid">
                  <div><dt>装货地址</dt><dd>{{ candidate.loadAddress }}</dd></div>
                  <div><dt>卸货地址</dt><dd>{{ candidate.unloadAddress }}</dd></div>
                  <div><dt>计划运输日期</dt><dd>{{ candidate.task.info.plannedDateRange || '未登记' }}</dd></div>
                  <div><dt>运输货品</dt><dd>{{ candidate.cargo || '未登记' }}</dd></div>
                  <div><dt>装货联系人</dt><dd>{{ candidate.task.info.loadContact || '未登记' }}</dd></div>
                  <div><dt>卸货联系人</dt><dd>{{ candidate.task.info.unloadContact || '未登记' }}</dd></div>
                  <div><dt>承运方</dt><dd>{{ candidate.task.info.carrier || '未登记' }}</dd></div>
                  <div><dt>派车情况</dt><dd>{{ candidate.dispatched ? '已有派车记录' : '未提前派车' }}</dd></div>
                </dl>
              </div>
            </ElRadioGroup>
            <div class="ais-buttons"><ElButton type="primary" @click="acceptTask">确认任务</ElButton><ElButton link type="primary" @click="sourceVisible = true">查看运输明细</ElButton></div>
          </template>
          <template v-else-if="currentIssue?.id === 'trip'">
            <div v-if="tripSummary" class="ais-trip-evidence">
              <dl class="ais-evidence-grid">
                <div><dt>运输日期</dt><dd>{{ tripSummary.date || '未提供' }}</dd></div>
                <div><dt>司机 / 车牌</dt><dd>{{ tripSummary.driver || '未提供' }} / {{ tripSummary.plate || '未提供' }}</dd></div>
                <div><dt>装货点</dt><dd>{{ tripSummary.start || '未提供' }}</dd></div>
                <div><dt>卸货点</dt><dd>{{ tripSummary.end || '未提供' }}<template v-if="tripSummary.unloadCode">（{{ tripSummary.unloadCode }}）</template></dd></div>
              </dl>
              <ElTable :data="tripRows" border aria-label="待确认的两条箱明细">
                <ElTableColumn prop="id" label="原表行" width="76" />
                <ElTableColumn prop="box" label="箱号" min-width="132" />
                <ElTableColumn label="装货时间" min-width="96"><template #default="{ row }">{{ row.loadTime || '未提供' }}</template></ElTableColumn>
                <ElTableColumn label="卸货时间" min-width="96"><template #default="{ row }">{{ row.unloadTime || '未提供' }}</template></ElTableColumn>
                <ElTableColumn v-if="tripSummary.siteWeight" prop="siteWeight" label="石场磅单（吨）" min-width="120" />
                <ElTableColumn v-if="tripSummary.railWeight" prop="railWeight" label="铁路吨数" min-width="96" />
              </ElTable>
            </div>
            <p class="ais-muted ais-trip-hint">明细没有趟次或派车单号，也没有具体装卸时刻。可以先核对装卸记录或向司机确认。</p>
          </template>
          <template v-else-if="currentIssue?.id === 'weight'">
            <p class="ais-muted">如选用石场磅单值，同一趟的两箱重量相加。铁路吨数保留在原始明细中，卸货重量留空。</p>
          </template>
          <template v-else-if="currentIssue?.id === 'driver'">
            <ElRadioGroup v-model="selectedDriver" class="ais-candidates" aria-label="同名司机">
              <div v-for="driver in activeDriverChoices" :key="driver.id" class="ais-candidate">
                <ElRadio :value="driver.id">{{ driver.name }} · 尾号 {{ driver.phone.slice(-4) }}</ElRadio>
                <span>{{ driver.company }}</span><small>历史关联车辆 {{ driver.plate }} · 仅供辅助核对</small>
              </div>
            </ElRadioGroup>
            <ElButton type="primary" :disabled="!selectedDriver" @click="selectDriver">确认司机并补齐信息</ElButton>
          </template>
          <template v-else-if="currentIssue?.id === 'phone'">
            <p class="ais-muted">可以直接发送手机号，也可以在业务表格中填写。</p><ElButton link type="primary" @click="deferRows(missingPhoneRows)">暂缓缺少手机号的车次</ElButton>
            <p class="ais-muted">待补手机号：{{ [...new Set(missingPhoneRows.map(row => `${row.driver}（${row.plateNo}）`))].join('、') }}</p>
          </template>
          <template v-else-if="currentIssue?.id?.startsWith('binding')">
            <p>运输明细车辆 <strong>{{ group.rows[0]?.plateNo }}</strong><br />派车记录 <strong>{{ group.expectedPlate }}</strong></p>
            <p class="ais-muted">运输明细写错时可在业务表格修正后核对。确为实际换车时，需按原调度业务处理。</p>
            <div class="ais-buttons"><ElButton type="primary" @click="confirmBinding">已核实，检查一致性</ElButton><ElButton @click="deferRows([...group.rows])">暂缓处理</ElButton></div>
          </template>
          <template v-if="choiceOptions">
            <div role="group" class="ais-candidates ais-choice-list" :aria-label="currentIssue.id === 'trip' ? '选择实际车次' : '选择装货重量'">
              <button v-for="option in choiceOptions" :key="option.value" type="button" class="ais-choice" @click="chooseOption(option.value)">
                <span class="ais-choice-badge" aria-hidden="true">{{ option.badge }}</span>
                <span class="ais-choice-copy"><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span>
                <span class="ais-choice-arrow" aria-hidden="true"><AiIcon name="chevron" :size="14" /></span>
              </button>
            </div>
            <div class="ais-choice-actions">
              <ElButton v-if="currentIssue.id === 'trip'" link type="primary" @click="state.notice = '这两条记录已保留。核实后可回到当前对话继续确认。'">暂不确认</ElButton>
              <ElButton v-else link type="primary" @click="sourceVisible = true">查看两列重量</ElButton>
            </div>
          </template>
          <div v-if="business && group?.deferred.length" class="ais-deferred">暂缓 {{ group.deferred.length }} 趟<ElButton link type="primary" @click="restoreDeferred">恢复处理</ElButton></div>
          <ElAlert v-if="state.notice"  :title="state.notice" type="warning" :closable="false" class="ais-notice" />
          <details v-if="state.history.length && session.messages.length === 0" class="ais-history"><summary>本次处理记录（{{ state.history.length }}）</summary><p v-for="(entry, index) in state.history" :key="index">{{ entry }}</p></details>
            </div>
          </section>
        </AiChat>
        <AiComposer v-model="draft" :model="model" :agents="agents" :attachments="attachments" :selected-tags="[]" :show-model="false" :show-tags="false" context-placeholder="补充实际情况，或使用上方选项确认…" @files="filesAdded" @remove-file="attachments = attachments.filter(file => file.id !== $event)" @submit="submitText" />
      </aside>

    </div>
    <ElDialog :z-index="business ? 2400 : undefined" v-model="sourceVisible" title="原始运输明细 · 示例" width="min(1048px, 94vw)" append-to-body>
      <ElTable :data="trip ? sourceRows.filter(row => trip.ids.includes(row.id)) : sourceRows" border max-height="460"><ElTableColumn prop="id" label="原表行" width="78" /><ElTableColumn prop="date" label="日期" width="116" /><ElTableColumn prop="start" label="起运地" /><ElTableColumn prop="end" label="到达地" /><ElTableColumn prop="driver" label="司机" width="80" /><ElTableColumn prop="plate" label="车牌号" width="116" /><ElTableColumn prop="box" label="箱号" width="140" /><template v-if="group?.tripQuestions"><ElTableColumn prop="siteWeight" label="石场磅单（吨）" width="128" /><ElTableColumn prop="railWeight" label="铁路吨数" width="105" /></template></ElTable>
      <template #footer><ElButton @click="sourceVisible = false">返回核对</ElButton></template>
    </ElDialog>
    <ElDialog :z-index="business ? 2400 : undefined" v-model="resultVisible" title="模拟运单结果" width="min(744px, 94vw)" append-to-body><div v-for="result in group?.results" :key="result.number" class="ais-result-item"><strong>{{ result.number }}</strong><p>{{ result.driver }} · {{ result.plate }} · {{ result.boxes.join('、') }}</p><p>来源于原表第 {{ result.sourceIds.join('、') }} 行</p></div><template #footer><ElButton @click="resultVisible = false">关闭</ElButton></template></ElDialog>
  </section>
</template>
