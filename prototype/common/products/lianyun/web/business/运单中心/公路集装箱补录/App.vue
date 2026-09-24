<script setup>
/**
 * 公路集装箱运单补录原型。
 * 需求归属：common；所属项目：null；研发版本：TMS-COMMON-202609-02。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import { taskScenarios } from './mock-data'
import './road-container-supplement.css'

const router = useRouter()
const route = useRoute()
const selectedTaskKey = ref('')
const taskPicker = ref(null)
const taskSearch = ref(null)
const taskPickerOpen = ref(false)
const taskQuery = ref('')
const segment = ref(null)
const bulkForm = ref(null)
const formError = ref('')
const bulkProofInput = ref(null)
const bulkProofTarget = ref('')
const confirmVisible = ref(false)
const successVisible = ref(false)

const currentTask = computed(() => taskScenarios.find(item => item.key === selectedTaskKey.value))
const filteredTasks = computed(() => {
  const query = taskQuery.value.trim().toLowerCase()
  if (!query) return taskScenarios
  return taskScenarios.filter(task => [task.info.number, taskTransportType(task), taskStartAlias(task), taskEndAlias(task)]
    .some(value => value.toLowerCase().includes(query)))
})
const taskInfo = computed(() => currentTask.value?.info || {})
const isContainerTask = computed(() => currentTask.value?.kind === 'container')
const isBulkTask = computed(() => currentTask.value?.kind === 'bulk')
const taskContainer = computed(() => currentTask.value?.container || {})
const isFixedAssignment = computed(() => currentTask.value?.assignmentMode === 'fixed')
const actualContainerCount = computed(() => segment.value?.containers.length || 0)
const selectedCargo = computed(() => taskContainer.value.cargo || '-')
const bulkLoadTotal = computed(() => bulkForm.value?.cargoRows.reduce((sum, item) => sum + Number(item.loadWeight || 0), 0).toFixed(2) || '0.00')
const bulkUnloadTotal = computed(() => bulkForm.value?.cargoRows.reduce((sum, item) => sum + Number(item.unloadWeight || 0), 0).toFixed(2) || '0.00')
const bulkLoss = (item) => (Number(item.loadWeight || 0) - Number(item.unloadWeight || 0)).toFixed(2)

function taskTransportType(task) {
  return task.kind === 'bulk' ? '散杂货运输' : '集装箱运输'
}

function taskStartAlias(task) {
  return task.startAlias || (task.kind === 'bulk' ? task.bulk.loadAddress : task.segment.nodes[0].address)
}

function taskEndAlias(task) {
  return task.endAlias || (task.kind === 'bulk' ? task.bulk.unloadAddress : task.segment.nodes.at(-1).address)
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

onMounted(() => document.addEventListener('pointerdown', closeTaskPickerOnOutside))
onUnmounted(() => document.removeEventListener('pointerdown', closeTaskPickerOnOutside))

function loadTaskScenario() {
  formError.value = ''
  if (!currentTask.value) {
    segment.value = null
    bulkForm.value = null
    return
  }
  if (isBulkTask.value) {
    segment.value = null
    bulkForm.value = {
      ...currentTask.value.bulk,
      cargoRows: currentTask.value.bulk.cargoRows.map(item => ({ ...item })),
    }
    return
  }
  bulkForm.value = null
  const taskSegment = currentTask.value.segment
  segment.value = {
    ...taskSegment,
    containers: taskSegment.containers.map(item => ({ ...item })),
    nodes: taskSegment.nodes.map(node => ({ ...node })),
    stages: taskSegment.stages.map(stage => ({ ...stage })),
  }
}

loadTaskScenario()
watch(selectedTaskKey, loadTaskScenario)

function addContainer() {
  if (isFixedAssignment.value || actualContainerCount.value >= 2 || actualContainerCount.value >= taskContainer.value.taskCount) return
  segment.value.containers.push({
    key: `actual-${Date.now()}`,
    containerNo: '',
    sealNo: '',
    chassisNo: '',
  })
}

function isContainerUsed(containerNo, currentKey) {
  return segment.value?.containers.some(item => item.key !== currentKey && item.containerNo === containerNo) || false
}

function onContainerSelected(item) {
  const selected = currentTask.value?.candidateContainers?.find(box => box.containerNo === item.containerNo)
  item.sealNo = selected?.sealNo || ''
  item.chassisNo = selected?.chassisNo || ''
  formError.value = ''
}

function removeContainer(key) {
  if (isFixedAssignment.value || segment.value.containers.length === 1) return
  segment.value.containers = segment.value.containers.filter(item => item.key !== key)
}

function routeLoadWeight(segment, stage) {
  if (stage.weightMode !== 'unload') return segment.nodes[stage.startIndex].quantity || '0.00'
  return segment.loadedWeight || segment.nodes.find(node => node.type === '装货')?.quantity || '0.00'
}

function routeLoss(segment, stage) {
  return (Number(routeLoadWeight(segment, stage)) - Number(segment.nodes[stage.endIndex].quantity || 0)).toFixed(2)
}

function backToCenter() {
  openPrototypePage(router, route, 'waybillCenter')
}

function chooseBulkProof(target) {
  bulkProofTarget.value = target
  bulkProofInput.value?.click()
}

function onBulkProofChange(event) {
  const file = event.target.files?.[0]
  if (file && bulkForm.value && bulkProofTarget.value) bulkForm.value[bulkProofTarget.value] = file.name
  event.target.value = ''
}

function submitForm() {
  if (!currentTask.value) return
  formError.value = ''
  if (isContainerTask.value) {
    const boxes = segment.value.containers
    if (boxes.length < 1 || boxes.length > 2) {
      formError.value = '本次补录须关联 1—2 个箱号。'
      return
    }
    if (boxes.length > taskContainer.value.taskCount) {
      formError.value = '本次箱号数量不能超过任务箱数。'
      return
    }
    if (boxes.some(item => !item.containerNo) || new Set(boxes.map(item => item.containerNo)).size !== boxes.length) {
      formError.value = '请选择实际箱号，同一任务内不可重复选用。'
      return
    }
    if (!isFixedAssignment.value && boxes.some(item => !currentTask.value.candidateContainers.some(box => box.containerNo === item.containerNo))) {
      formError.value = '实际箱号必须从当前任务的候选箱中选择。'
      return
    }
  }
  confirmVisible.value = true
}

function confirmSubmit() {
  confirmVisible.value = false
  successVisible.value = true
}
</script>

<template>
  <div class="rcs-page">
    <header class="rcs-breadcrumb">
      <div><strong>运单中心</strong><span>›</span><em>公路运单补录</em></div>
      <button type="button" @click="backToCenter">↩ 返回</button>
    </header>

    <main class="rcs-content">
      <section class="rcs-section">
        <h2>指定信息</h2>
        <div class="rcs-plan-table">
          <div class="rcs-plan-head">请选择运输任务</div>
          <div class="rcs-plan-head">任务状态</div>
          <div class="rcs-plan-head">承运企业</div>
          <div class="rcs-plan-head">调度者</div>
          <div class="rcs-plan-head">指派企业</div>
          <div class="rcs-plan-head">指派时间</div>

          <div class="rcs-plan-value">
            <div ref="taskPicker" class="rcs-task-picker annot-roadContainerWaybillSupplement-rule-plan-selection" @keydown.esc="taskPickerOpen = false">
              <button type="button" class="rcs-task-trigger" :aria-expanded="taskPickerOpen" aria-label="选择运输任务" @click="toggleTaskPicker">
                <span v-if="currentTask" class="rcs-task-trigger-text">
                  <strong :title="`${taskTransportType(currentTask)}｜${taskStartAlias(currentTask)} → ${taskEndAlias(currentTask)}`">{{ taskTransportType(currentTask) }}｜{{ taskStartAlias(currentTask) }} → {{ taskEndAlias(currentTask) }}</strong>
                  <small>{{ taskInfo.number }}</small>
                </span>
                <span v-else class="rcs-task-placeholder">请选择运输任务</span>
                <span class="rcs-task-chevron">⌄</span>
              </button>
              <div v-if="taskPickerOpen" class="rcs-task-menu">
                <input ref="taskSearch" v-model="taskQuery" type="search" aria-label="搜索运输任务" placeholder="搜索运输类型、地址别名或任务编号" />
                <div class="rcs-task-options" role="listbox" aria-label="运输任务">
                  <button v-for="task in filteredTasks" :key="task.key" type="button" class="rcs-task-option" role="option" :aria-selected="task.key === selectedTaskKey" @click="selectTask(task)">
                    <strong :title="`${taskTransportType(task)}｜${taskStartAlias(task)} → ${taskEndAlias(task)}`">{{ taskTransportType(task) }}｜{{ taskStartAlias(task) }} → {{ taskEndAlias(task) }}</strong>
                    <small>{{ task.info.number }}</small>
                  </button>
                  <div v-if="filteredTasks.length === 0" class="rcs-task-empty">没有匹配的运输任务</div>
                </div>
              </div>
            </div>
          </div>
          <div class="rcs-plan-value"><span class="rcs-status">{{ taskInfo.status || '—' }}</span></div>
          <div class="rcs-plan-value">{{ taskInfo.carrier || '—' }}</div>
          <div class="rcs-plan-value">{{ taskInfo.dispatcher || '—' }}</div>
          <div class="rcs-plan-value">{{ taskInfo.assigningCompany || '—' }}</div>
          <div class="rcs-plan-value">{{ taskInfo.assignedAt || '—' }}</div>
        </div>
      </section>

      <template v-if="isContainerTask">
      <section class="rcs-section annot-roadContainerWaybillSupplement-rule-plan-quantity">
        <h2>任务箱型信息</h2>
        <div class="rcs-table">
          <div class="rcs-row rcs-row-head rcs-task-container-grid">
            <span>箱型</span><span>尺寸</span><span>货品</span><span>任务箱数</span><span>箱号分配方式</span>
          </div>
          <div class="rcs-row rcs-task-container-grid">
            <span>{{ taskContainer.containerType }}</span><span>{{ taskContainer.size }}</span><span>{{ taskContainer.cargo }}</span>
            <span>{{ taskContainer.taskCount }}</span><span>{{ isFixedAssignment ? '固定指派' : '入场匹配' }}</span>
          </div>
        </div>
      </section>

      <section class="rcs-section">
        <h2>司机信息</h2>
        <div class="rcs-driver-container-card annot-roadContainerWaybillSupplement-field-actual-containers">
          <div class="rcs-bulk-resource-row rcs-driver-resource-row">
            <label><span><i>*</i>车辆信息：</span><select v-model="segment.vehicle" :disabled="isFixedAssignment"><option>{{ segment.vehicle }}</option><option>苏A8M320</option></select></label>
            <label><span><i>*</i>司机信息：</span><select v-model="segment.driver" :disabled="isFixedAssignment"><option>{{ segment.driver }}</option><option>王师傅</option></select></label>
            <label><span>联系电话：</span><input v-model="segment.phone" :readonly="isFixedAssignment" /></label>
          </div>
          <div class="rcs-container-table-head">
            <strong>集装箱信息</strong>
            <button v-if="!isFixedAssignment" type="button" class="rcs-inline-add" :disabled="actualContainerCount >= 2 || actualContainerCount >= taskContainer.taskCount" @click="addContainer">＋ 添加箱号</button>
          </div>
          <div class="rcs-table">
            <div class="rcs-row rcs-row-head rcs-actual-container-grid">
              <span>任务箱型</span><span>货品</span><span><i>*</i>实际箱号</span><span>铅封号</span><span>车架号</span><span>操作</span>
            </div>
            <div v-for="item in segment.containers" :key="item.key" class="rcs-row rcs-actual-container-grid">
              <span>{{ taskContainer.containerType }}｜{{ taskContainer.size }}</span>
              <span>{{ taskContainer.cargo }}</span>
              <span v-if="isFixedAssignment">{{ item.containerNo }}</span>
              <span v-else>
                <select v-model="item.containerNo" @change="onContainerSelected(item)">
                  <option value="" disabled>请选择实际箱号</option>
                  <option v-for="candidate in currentTask.candidateContainers" :key="candidate.key" :value="candidate.containerNo" :disabled="isContainerUsed(candidate.containerNo, item.key)">{{ candidate.containerNo }}</option>
                </select>
              </span>
              <span><input v-model="item.sealNo" placeholder="请输入铅封号" /></span>
              <span><input v-model="item.chassisNo" placeholder="请输入车架号" /></span>
              <span><button v-if="!isFixedAssignment" type="button" class="rcs-text-action" :disabled="segment.containers.length === 1" @click="removeContainer(item.key)">删除</button><em v-else class="rcs-readonly-text">已指派</em></span>
            </div>
          </div>
        </div>
      </section>

      <section class="rcs-section rcs-route-section annot-roadContainerWaybillSupplement-rule-route-segments">
        <h2>运输路线</h2>

        <article class="rcs-bulk-route-block">
          <div class="rcs-route-stage-list">
            <section v-for="stage in segment.stages" :key="stage.key" class="rcs-bulk-route-card">
              <header class="rcs-bulk-route-head">
                <div>
                  <p><b class="start">{{ segment.nodes[stage.startIndex].type }}</b><strong>{{ segment.nodes[stage.startIndex].city }}</strong></p>
                  <small>{{ segment.nodes[stage.startIndex].address }}</small>
                </div>
                <div>
                  <p><b class="end">{{ segment.nodes[stage.endIndex].type }}</b><strong>{{ segment.nodes[stage.endIndex].city }}</strong></p>
                  <small>{{ segment.nodes[stage.endIndex].address }}</small>
                </div>
                <em class="rcs-route-stage-label">{{ stage.name }}</em>
                <button type="button" aria-label="收起路段">﹀</button>
              </header>

              <template v-if="stage.mode === 'cargo'">
                <div class="rcs-route-cargo-table">
                  <div class="rcs-route-cargo-row rcs-route-cargo-head" :class="`weight-${stage.weightMode}`">
                    <span>序号</span><span>货品</span><span><i>*</i>装货重量</span><span v-if="stage.weightMode !== 'load'"><i>*</i>卸货重量</span><span v-if="stage.weightMode !== 'load'">耗损(重量)</span>
                  </div>
                  <div class="rcs-route-cargo-row" :class="`weight-${stage.weightMode}`">
                    <span>1</span><span>{{ selectedCargo }}｜其他</span>
                    <span v-if="stage.weightMode === 'unload'">{{ routeLoadWeight(segment, stage) }}</span>
                    <span v-else><input v-model="segment.nodes[stage.startIndex].quantity" placeholder="请输入装货重量" /></span>
                    <span v-if="stage.weightMode !== 'load'"><input v-model="segment.nodes[stage.endIndex].quantity" placeholder="请输入卸货重量" /></span>
                    <span v-if="stage.weightMode !== 'load'">{{ routeLoss(segment, stage) }}</span>
                  </div>
                  <div class="rcs-route-cargo-row rcs-route-cargo-total" :class="`weight-${stage.weightMode}`">
                    <span>合计</span><span></span><span>{{ routeLoadWeight(segment, stage) }}</span><span v-if="stage.weightMode !== 'load'">{{ segment.nodes[stage.endIndex].quantity || '0.00' }}</span><span v-if="stage.weightMode !== 'load'">{{ routeLoss(segment, stage) }}</span>
                  </div>
                </div>

                <div class="rcs-route-work-row">
                  <label><span><i>*</i>实际{{ segment.nodes[stage.startIndex].type }}时间：</span><input v-model="segment.nodes[stage.startIndex].actualTime" /></label>
                  <label><span><i>*</i>实际{{ segment.nodes[stage.endIndex].type }}时间：</span><input v-model="segment.nodes[stage.endIndex].actualTime" /></label>
                  <label><span><i>*</i>{{ segment.nodes[stage.startIndex].type }}凭证：</span><button type="button" class="rcs-proof">{{ segment.nodes[stage.startIndex].proof }} <i>＋</i></button></label>
                  <label><span><i>*</i>{{ segment.nodes[stage.endIndex].type }}凭证：</span><button type="button" class="rcs-proof">{{ segment.nodes[stage.endIndex].proof }} <i>＋</i></button></label>
                </div>
              </template>

              <div v-else class="rcs-route-simple-row">
                <label><span><i>*</i>实际{{ segment.nodes[stage.operationIndex].type }}时间：</span><input v-model="segment.nodes[stage.operationIndex].actualTime" /></label>
                <label><span><i>*</i>{{ segment.nodes[stage.operationIndex].type }}凭证：</span><button type="button" class="rcs-proof">{{ segment.nodes[stage.operationIndex].proof }} <i>＋</i></button></label>
              </div>
            </section>
          </div>
        </article>
      </section>
      </template>

      <section v-if="isBulkTask && bulkForm" class="rcs-section rcs-route-section">
        <h2>运输路线</h2>
        <div class="rcs-bulk-resource-row rcs-plan-bulk-resource-row">
          <label><span><i>*</i>车辆信息：</span><input v-model="bulkForm.vehicle" placeholder="请选择车辆" /></label>
          <label><span><i>*</i>司机信息：</span><input v-model="bulkForm.driver" placeholder="请选择司机" /></label>
        </div>
        <section class="rcs-bulk-route-card">
          <header class="rcs-bulk-route-head">
            <div><p><b class="start">装</b><strong>{{ bulkForm.loadCity }}</strong></p><small>{{ bulkForm.loadAddress }}</small></div>
            <div><p><b class="end">卸</b><strong>{{ bulkForm.unloadCity }}</strong></p><small>{{ bulkForm.unloadAddress }}</small></div>
          </header>
          <div class="rcs-route-cargo-table">
            <div class="rcs-route-cargo-row rcs-route-cargo-head rcs-plan-bulk-cargo-row"><span>序号</span><span>货品</span><span>已运输重量</span><span>剩余可运输重量</span><span><i>*</i>装货重量</span><span><i>*</i>卸货重量</span><span>耗损(重量)</span></div>
            <div v-for="(item, index) in bulkForm.cargoRows" :key="item.key" class="rcs-route-cargo-row rcs-plan-bulk-cargo-row"><span>{{ index + 1 }}</span><span>{{ item.cargo }}</span><span>{{ item.transportedWeight }}</span><span>{{ item.remainingWeight }}</span><span><input v-model="item.loadWeight" placeholder="请输入装货重量" /></span><span><input v-model="item.unloadWeight" placeholder="请输入卸货重量" /></span><span>{{ bulkLoss(item) }}</span></div>
            <div class="rcs-route-cargo-row rcs-route-cargo-total rcs-plan-bulk-cargo-row"><span>合计</span><span></span><span></span><span></span><span>{{ bulkLoadTotal }}</span><span>{{ bulkUnloadTotal }}</span><span>{{ (Number(bulkLoadTotal) - Number(bulkUnloadTotal)).toFixed(2) }}</span></div>
          </div>
          <div class="rcs-route-work-row">
            <label><span><i>*</i>实际装货时间：</span><input v-model="bulkForm.loadTime" /></label>
            <label><span><i>*</i>实际卸货时间：</span><input v-model="bulkForm.unloadTime" /></label>
            <label><span><i>*</i>装货凭证：</span><button type="button" class="rcs-proof" @click="chooseBulkProof('loadProof')">{{ bulkForm.loadProof }} <i>＋</i></button></label>
            <label><span><i>*</i>卸货凭证：</span><button type="button" class="rcs-proof" @click="chooseBulkProof('unloadProof')">{{ bulkForm.unloadProof }} <i>＋</i></button></label>
            <input ref="bulkProofInput" type="file" accept="image/*,.pdf" hidden @change="onBulkProofChange" />
          </div>
        </section>
      </section>
    </main>

    <footer class="rcs-actions">
      <button type="button" class="secondary" @click="backToCenter">取消</button>
      <span v-if="formError" class="rcs-form-error">{{ formError }}</span>
      <button type="button" class="primary annot-roadContainerWaybillSupplement-action-submit" :disabled="!currentTask" @click="submitForm">提交</button>
    </footer>

    <div v-if="confirmVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal annot-roadContainerWaybillSupplement-rule-confirm" data-annotation-content="modal">
        <h3>确认提交补录</h3>
        <p v-if="isContainerTask">任务 {{ taskInfo.number }} 本次补录 <strong>{{ actualContainerCount }}</strong> 个实际箱号，确认后生成一张运单。</p>
        <p v-else>本次按散杂货运输任务补录，实际装货 <strong>{{ bulkLoadTotal }}</strong> 吨、卸货 <strong>{{ bulkUnloadTotal }}</strong> 吨。</p>
        <div v-if="isContainerTask" class="rcs-confirm-line">
          <b>{{ segment.driver }}｜{{ segment.containers.map(item => item.containerNo).join('、') }}</b>
          <span>{{ segment.nodes[0].type }} → {{ segment.nodes[segment.nodes.length - 1].type }}</span>
          <span>{{ segment.vehicle }}</span>
        </div>
        <footer><button type="button" @click="confirmVisible = false">取消</button><button type="button" class="primary" @click="confirmSubmit">确认生成</button></footer>
      </section>
    </div>

    <div v-if="successVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal rcs-success-modal" data-annotation-content="modal">
        <span class="rcs-success-icon">✓</span>
        <h3>运单补录成功</h3>
        <p v-if="isContainerTask">已生成一张公路集装箱运单，关联 {{ actualContainerCount }} 个箱号。</p>
        <p v-else>已保存公路散杂货运单补录信息。</p>
        <footer><button type="button" class="primary" @click="backToCenter">返回运单中心</button></footer>
      </section>
    </div>
  </div>
</template>
