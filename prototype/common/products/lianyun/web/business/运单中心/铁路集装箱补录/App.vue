<script setup>
/**
 * 铁路集装箱运单补录原型。
 * 需求归属：common；所属项目：null；研发版本：TMS-COMMON-202609-02。
 * 普通直达示例：一个发到站路段对应一个铁路货物运单号。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import { taskScenarios, transportFields } from './mock-data'
import './rail-container-supplement.css'

const router = useRouter()
const routeContext = useRoute()
const selectedTaskKey = ref(taskScenarios[0].key)
const taskPicker = ref(null)
const taskSearch = ref(null)
const taskPickerOpen = ref(false)
const taskQuery = ref('')
const currentTask = computed(() => taskScenarios.find(task => task.key === selectedTaskKey.value))
const filteredTasks = computed(() => {
  const query = taskQuery.value.trim().toLowerCase()
  return taskScenarios.filter(task => !query || [task.number, task.transportType, task.startAlias, task.endAlias]
    .some(value => value.toLowerCase().includes(query)))
})
const cloneRoute = task => ({
  ...task.route,
  groups: task.route.groups.map(group => ({ ...group, manifest: group.manifest.map(item => ({ ...item })) })),
})
const route = ref(cloneRoute(taskScenarios[0]))
const transportInfo = ref({ ...taskScenarios[0].transportInfo })
const manifestVisible = ref(false)
const activeGroup = ref(null)
const manifestDraft = ref([])
const entryMode = ref('')
const importFileName = ref('')
const manifestError = ref('')
const submitError = ref('')
const confirmVisible = ref(false)
const successVisible = ref(false)
const importInput = ref(null)
const proofInput = ref(null)
const proofTarget = ref('')

const recordedCount = group => group.manifest.filter(item => item.status === '已装车' || item.status === '已卸车').length
const unloadedCount = group => group.manifest.filter(item => item.status === '已卸车').length
const recordedTotal = computed(() => route.value.groups.reduce((sum, group) => sum + recordedCount(group), 0))
const unloadedTotal = computed(() => route.value.groups.reduce((sum, group) => sum + unloadedCount(group), 0))

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

watch(selectedTaskKey, () => {
  route.value = cloneRoute(currentTask.value)
  transportInfo.value = { ...currentTask.value.transportInfo }
  manifestVisible.value = false
  submitError.value = ''
})
onMounted(() => document.addEventListener('pointerdown', closeTaskPickerOnOutside))
onUnmounted(() => document.removeEventListener('pointerdown', closeTaskPickerOnOutside))

function openManifest(group) {
  activeGroup.value = group
  manifestDraft.value = group.manifest.map(item => ({ ...item }))
  entryMode.value = ''
  importFileName.value = ''
  manifestError.value = ''
  manifestVisible.value = true
}

function openEntryMode(mode) {
  entryMode.value = mode
  importFileName.value = ''
  manifestError.value = ''
}

function chooseImportFile() {
  importInput.value?.click()
}

function onImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importFileName.value = file.name
  const seed = Date.now()
  for (let index = 0; index < 2; index += 1) {
    manifestDraft.value.push({
      key: `import-${seed}-${index}`,
      containerNo: `MOCK${String(seed).slice(-5)}${index + 1}`,
      sealNo: '',
      weight: '',
      wagonType: '集装箱平车',
      wagonNo: '',
      status: '待装车',
    })
  }
  event.target.value = ''
}

function addManualContainer() {
  manifestDraft.value.unshift({
    key: `manual-${Date.now()}`,
    containerNo: '', sealNo: '', weight: '', wagonType: '集装箱平车', wagonNo: '', status: '待装车',
  })
  entryMode.value = 'manual'
}

function removeManifestItem(key) {
  manifestDraft.value = manifestDraft.value.filter(item => item.key !== key)
}

function saveManifest() {
  const allNumbers = route.value.groups.flatMap(group => group === activeGroup.value ? [] : group.manifest.map(item => item.containerNo.trim()).filter(Boolean))
  const numbers = manifestDraft.value.map(item => item.containerNo.trim()).filter(Boolean)
  if (new Set([...allNumbers, ...numbers]).size !== allNumbers.length + numbers.length) {
    manifestError.value = '箱号不能在本次铁路运单中重复。'
    return
  }
  if (manifestDraft.value.some(item => item.status !== '待装车' && (!item.containerNo.trim() || !item.wagonNo.trim()))) {
    manifestError.value = '已装车或已卸车的集装箱，请填写箱号和车皮号。'
    return
  }
  activeGroup.value.manifest = manifestDraft.value.map(item => ({ ...item }))
  manifestVisible.value = false
  submitError.value = ''
}

function chooseProof(target) {
  proofTarget.value = target
  proofInput.value?.click()
}

function onProofFile(event) {
  const file = event.target.files?.[0]
  if (file && proofTarget.value) route.value[proofTarget.value] = file.name
  event.target.value = ''
}

function requestSubmit() {
  const missingField = transportFields.find(field => field.required && !String(transportInfo.value[field.key] ?? '').trim())
  if (missingField) {
    submitError.value = `请填写${missingField.label}。`
    return
  }
  submitError.value = ''
  confirmVisible.value = true
}

function backToCenter() {
  openPrototypePage(router, routeContext, 'waybillCenter')
}
</script>

<template>
  <div class="rcs-page wcs-page rcw-page">
    <header class="rcs-breadcrumb">
      <div><strong>运单中心</strong><span>›</span><em>铁路集装箱运单补录</em></div>
      <button type="button" @click="backToCenter">↩ 返回</button>
    </header>

    <main class="rcs-content">
      <section class="rcs-section">
        <h2>指定信息</h2>
        <div class="rcs-plan-table">
          <div class="rcs-plan-head">请选择运输任务</div><div class="rcs-plan-head">任务状态</div><div class="rcs-plan-head">承运企业</div><div class="rcs-plan-head">调度者</div><div class="rcs-plan-head">指派企业</div><div class="rcs-plan-head">指派时间</div>
          <div class="rcs-plan-value">
            <div ref="taskPicker" class="rcs-task-picker annot-railContainerWaybillSupplement-rule-plan-selection" @keydown.esc="taskPickerOpen = false">
              <button type="button" class="rcs-task-trigger" :aria-expanded="taskPickerOpen" aria-label="选择运输任务" @click="toggleTaskPicker">
                <span class="rcs-task-trigger-text">
                  <strong :title="`${currentTask.transportType}｜${currentTask.startAlias} → ${currentTask.endAlias}`">{{ currentTask.transportType }}｜{{ currentTask.startAlias }} → {{ currentTask.endAlias }}</strong>
                  <small>{{ currentTask.number }}</small>
                </span>
                <span class="rcs-task-chevron">⌄</span>
              </button>
              <div v-if="taskPickerOpen" class="rcs-task-menu">
                <input ref="taskSearch" v-model="taskQuery" type="search" aria-label="搜索运输任务" placeholder="搜索运输类型、地址别名或任务编号" />
                <div class="rcs-task-options" role="listbox" aria-label="运输任务">
                  <button v-for="task in filteredTasks" :key="task.key" type="button" class="rcs-task-option" role="option" :aria-selected="task.key === selectedTaskKey" @click="selectTask(task)">
                    <strong :title="`${task.transportType}｜${task.startAlias} → ${task.endAlias}`">{{ task.transportType }}｜{{ task.startAlias }} → {{ task.endAlias }}</strong>
                    <small>{{ task.number }}</small>
                  </button>
                  <div v-if="filteredTasks.length === 0" class="rcs-task-empty">没有匹配的运输任务</div>
                </div>
              </div>
            </div>
          </div>
          <div class="rcs-plan-value"><span class="rcs-status">{{ currentTask.status }}</span></div><div class="rcs-plan-value">{{ currentTask.carrier }}</div><div class="rcs-plan-value">{{ currentTask.dispatcher }}</div><div class="rcs-plan-value">{{ currentTask.assigningCompany }}</div><div class="rcs-plan-value">{{ currentTask.assignedAt }}</div>
        </div>
      </section>

      <section class="rcs-section rcw-transport-section">
        <h2>运输信息</h2>
        <div class="rcw-transport-grid">
          <label v-for="field in transportFields" :key="field.key" class="rcw-transport-field" :class="{ 'annot-railContainerWaybillSupplement-field-transport-info': field.key === 'wagonNo' }">
            <span><i v-if="field.required">*</i>{{ field.label }}</span>
            <span class="rcw-transport-control">
              <select v-if="field.type === 'select'" v-model="transportInfo[field.key]">
                <option value="">请选择</option><option>现付</option><option>到付</option><option>月结</option>
              </select>
              <input v-else v-model="transportInfo[field.key]" :type="field.type || 'text'" :maxlength="field.maxLength" :min="field.type === 'number' ? 0 : undefined" :step="field.type === 'number' ? '0.01' : undefined" :placeholder="field.type === 'datetime-local' ? '请选择' : '请输入'" />
              <small v-if="field.maxLength">{{ String(transportInfo[field.key] || '').length }}/{{ field.maxLength }}</small>
            </span>
          </label>
        </div>
      </section>

      <section class="rcs-section rcs-route-section">
        <div class="rcs-section-heading"><h2>运输路线</h2><span class="rcs-route-summary annot-railContainerWaybillSupplement-rule-route-groups">共 1 个发到站路段</span></div>
        <section class="rcs-bulk-route-card">
          <header class="rcs-bulk-route-head">
            <div><p><b class="start">装车</b><strong>{{ route.departureStation }}</strong></p><small>{{ route.departureAddress }}</small></div>
            <div><p><b class="end">卸车</b><strong>{{ route.arrivalStation }}</strong></p><small>{{ route.arrivalAddress }}</small></div>
          </header>

          <div class="wcs-group-table">
            <div class="wcs-group-row wcs-group-head"><span>序号</span><span>箱型</span><span>尺寸</span><span>货品</span><span>计划箱数</span><span>已补录装车</span><span>已补录卸车</span><span>箱清单</span></div>
            <div v-for="(group, index) in route.groups" :key="group.key" class="wcs-group-row">
              <span>{{ index + 1 }}</span><span>{{ group.containerType }}</span><span>{{ group.size }}</span><span>{{ group.cargo }}</span><span>{{ group.plannedCount }}</span><span><strong>{{ recordedCount(group) }}</strong></span><span><strong>{{ unloadedCount(group) }}</strong></span><span><button type="button" class="rcs-text-action" @click="openManifest(group)">补录箱清单</button></span>
            </div>
            <div class="wcs-group-row wcs-group-total"><span>合计</span><span></span><span></span><span></span><span>{{ route.groups.reduce((sum, group) => sum + group.plannedCount, 0) }}</span><span>{{ recordedTotal }}</span><span>{{ unloadedTotal }}</span><span></span></div>
          </div>

          <div class="rcs-route-work-row rcw-work-row">
            <label><span><i>*</i>装车凭证：</span><button type="button" class="rcs-proof" @click="chooseProof('loadProof')">{{ route.loadProof }} <i>＋</i></button></label>
            <label><span><i>*</i>卸车凭证：</span><button type="button" class="rcs-proof" @click="chooseProof('unloadProof')">{{ route.unloadProof }} <i>＋</i></button></label>
            <input ref="proofInput" type="file" accept="image/*,.pdf" hidden @change="onProofFile" />
          </div>
        </section>
        <p v-if="submitError" class="rcw-submit-error">{{ submitError }}</p>
      </section>
    </main>

    <footer class="rcs-actions"><button type="button" class="secondary" @click="backToCenter">取消</button><button type="button" class="primary annot-railContainerWaybillSupplement-action-submit" @click="requestSubmit">提交</button></footer>

    <div v-if="manifestVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal wcs-manifest-modal rcw-manifest-modal" data-annotation-content="modal" role="dialog" aria-modal="true" aria-label="补录铁路集装箱清单">
        <header class="wcs-manifest-head">
          <div><h3>补录集装箱清单</h3><p>{{ route.departureStation }} → {{ route.arrivalStation }}｜{{ activeGroup.containerType }} {{ activeGroup.size }}｜{{ activeGroup.cargo }}</p></div>
          <button type="button" aria-label="关闭" @click="manifestVisible = false">×</button>
        </header>
        <div class="wcs-manifest-toolbar">
          <div class="wcs-manifest-toolbar-copy"><span>计划 {{ activeGroup.plannedCount }} 箱，本次清单 {{ manifestDraft.length }} 箱</span><small>同一份清单记录装车、卸车状态及对应车皮</small></div>
          <div class="wcs-manifest-actions annot-railContainerWaybillSupplement-action-manifest-input">
            <button type="button" :class="{ active: entryMode === 'excel' }" @click="openEntryMode('excel')">导入表格</button>
            <button type="button" :class="{ active: entryMode === 'image' }" @click="openEntryMode('image')">上传图片识别</button>
            <button type="button" @click="addManualContainer">＋ 手动新增</button>
          </div>
        </div>
        <div v-if="entryMode === 'excel' || entryMode === 'image'" class="wcs-import-panel">
          <div><strong>{{ entryMode === 'excel' ? '导入集装箱清单表格' : '上传铁路装车清单图片' }}</strong><p>{{ entryMode === 'excel' ? '导入箱号、封号、重量和车皮号后，可在下方继续核对与修改。' : '图片识别结果将作为待确认明细，需人工核对箱号和车皮号。' }}</p></div>
          <button type="button" @click="chooseImportFile">{{ entryMode === 'excel' ? '选择表格文件' : '选择图片' }}</button>
          <input ref="importInput" type="file" :accept="entryMode === 'excel' ? '.xlsx,.xls' : 'image/*'" hidden @change="onImportFile" />
        </div>
        <p v-if="importFileName" class="wcs-manifest-pagination rcw-import-hint">已选择 {{ importFileName }}，下方新增 2 条待核对的 Mock 明细。</p>
        <div class="rcw-manifest-scroll">
          <div class="wcs-manifest-table">
            <div class="wcs-manifest-row wcs-manifest-row-head rcw-manifest-row"><span>序号</span><span>箱号</span><span>尺寸</span><span>货品</span><span>铅封号</span><span>重量(t)</span><span>车皮车型</span><span>车皮号</span><span class="annot-railContainerWaybillSupplement-rule-manifest-items">作业状态</span><span>操作</span></div>
            <div v-for="(item, index) in manifestDraft" :key="item.key" class="wcs-manifest-row rcw-manifest-row">
              <span>{{ index + 1 }}</span><span><input v-model="item.containerNo" placeholder="请输入箱号" /></span><span>{{ activeGroup.size }}</span><span>{{ activeGroup.cargo }}</span><span><input v-model="item.sealNo" placeholder="请输入铅封号" /></span><span><input v-model="item.weight" placeholder="0.00" /></span><span><input v-model="item.wagonType" placeholder="车型" /></span><span><input v-model="item.wagonNo" placeholder="请输入车皮号" /></span><span><select v-model="item.status"><option>待装车</option><option>已装车</option><option>已卸车</option></select></span><span class="rcw-row-action"><button type="button" @click="removeManifestItem(item.key)">删除</button></span>
            </div>
          </div>
        </div>
        <p v-if="manifestError" class="rcw-error">{{ manifestError }}</p>
        <p class="wcs-manifest-pagination">共 {{ manifestDraft.length }} 箱，箱号与车皮号可逐条修改</p>
        <footer><button type="button" @click="manifestVisible = false">取消</button><button type="button" class="primary" @click="saveManifest">保存箱清单</button></footer>
      </section>
    </div>

    <div v-if="confirmVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal annot-railContainerWaybillSupplement-rule-confirm" data-annotation-content="modal"><h3>确认提交补录</h3><p>铁路运单号 <strong>{{ transportInfo.railWaybillNo }}</strong>，本次已补录装车 <strong>{{ recordedTotal }}</strong> 箱、卸车 <strong>{{ unloadedTotal }}</strong> 箱。</p><footer><button type="button" @click="confirmVisible = false">取消</button><button type="button" class="primary" @click="confirmVisible = false; successVisible = true">确认提交</button></footer></section>
    </div>

    <div v-if="successVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal rcs-success-modal" data-annotation-content="modal"><span class="rcs-success-icon">✓</span><h3>铁路集装箱补录成功</h3><p>发到站作业、箱清单、车皮关系与凭证已保存。</p><footer><button type="button" class="primary" @click="backToCenter">返回运单中心</button></footer></section>
    </div>
  </div>
</template>
