<script setup>
/**
 * 水路集装箱运单补录原型。
 * 需求归属：common；所属项目：null；研发版本：TMS-COMMON-202609-02。
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import { initialRoutes, taskScenarios } from './mock-data'
import './water-container-supplement.css'

const router = useRouter()
const route = useRoute()
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
const cloneRoutes = task => initialRoutes.filter(route => task.routeKeys.includes(route.key)).map(route => ({
  ...route,
  groups: route.groups.map(group => ({ ...group, manifest: group.manifest.map(item => ({ ...item })) })),
}))
const routes = ref(cloneRoutes(taskScenarios[0]))
const voyageInfo = ref({ ...taskScenarios[0].voyageInfo })
const manifestVisible = ref(false)
const activeRoute = ref(null)
const activeGroup = ref(null)
const entryMode = ref('')
const importDone = ref(false)
const confirmVisible = ref(false)
const successVisible = ref(false)

const allGroups = computed(() => routes.value.flatMap(route => route.groups))
const loadedTotal = computed(() => allGroups.value.reduce((sum, item) => sum + item.loadedCount, 0))

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
  routes.value = cloneRoutes(currentTask.value)
  voyageInfo.value = { ...currentTask.value.voyageInfo }
  manifestVisible.value = false
})
onMounted(() => document.addEventListener('pointerdown', closeTaskPickerOnOutside))
onUnmounted(() => document.removeEventListener('pointerdown', closeTaskPickerOnOutside))

function openManifest(route, group) {
  activeRoute.value = route
  activeGroup.value = group
  entryMode.value = ''
  importDone.value = false
  manifestVisible.value = true
}

function openEntryMode(mode) {
  entryMode.value = mode
  importDone.value = false
}

function finishImport() {
  importDone.value = true
}

function addManualContainer() {
  activeGroup.value.manifest.unshift({
    key: `manual-${Date.now()}`,
    containerNo: '',
    size: activeGroup.value.size,
    cargo: activeGroup.value.cargo,
    sealNo: '',
    weight: '',
    status: '待完善',
    totalCount: activeGroup.value.loadedCount,
  })
  entryMode.value = 'manual'
}

function removeManifestItem(key) {
  activeGroup.value.manifest = activeGroup.value.manifest.filter(item => item.key !== key)
}

function backToCenter() {
  openPrototypePage(router, route, 'waybillCenter')
}
</script>

<template>
  <div class="rcs-page wcs-page">
    <header class="rcs-breadcrumb">
      <div><strong>运单中心</strong><span>›</span><em>水路集装箱运单补录</em></div>
      <button type="button" @click="backToCenter">↩ 返回</button>
    </header>

    <main class="rcs-content">
      <section class="rcs-section">
        <h2>指定信息</h2>
        <div class="rcs-plan-table">
          <div class="rcs-plan-head">请选择运输任务</div><div class="rcs-plan-head">任务状态</div><div class="rcs-plan-head">承运企业</div><div class="rcs-plan-head">调度者</div><div class="rcs-plan-head">指派企业</div><div class="rcs-plan-head">指派时间</div>
          <div class="rcs-plan-value">
            <div ref="taskPicker" class="rcs-task-picker annot-waterContainerWaybillSupplement-rule-plan-selection" @keydown.esc="taskPickerOpen = false">
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

      <section class="rcs-section rcs-route-section">
        <div class="rcs-section-heading"><h2>运输路线</h2><span class="rcs-route-summary annot-waterContainerWaybillSupplement-rule-route-groups">共 {{ routes.length }} 个装卸路段</span></div>
        <div class="rcs-bulk-resource-row wcs-voyage-row">
          <label><span><i>*</i>船舶信息：</span><select v-model="voyageInfo.vessel"><option>{{ voyageInfo.vessel }}</option></select></label>
          <label class="annot-waterContainerWaybillSupplement-field-voyage"><span><i>*</i>航次号：</span><input v-model="voyageInfo.voyageNo" /></label>
        </div>

        <div class="wcs-route-list">
          <section v-for="(route, routeIndex) in routes" :key="route.key" class="rcs-bulk-route-card">
            <header class="rcs-bulk-route-head">
              <div><p><b class="start">装船</b><strong>{{ route.loadPort }}</strong></p><small>{{ route.loadAddress }}</small></div>
              <div><p><b class="end">卸船</b><strong>{{ route.unloadPort }}</strong></p><small>{{ route.unloadAddress }}</small></div>
              <em class="rcs-route-stage-label">路段{{ routeIndex + 1 }}</em>
              <button type="button" aria-label="收起路段">﹀</button>
            </header>

            <div class="wcs-group-table">
              <div class="wcs-group-row wcs-group-head"><span>序号</span><span>箱型</span><span>尺寸</span><span>货品</span><span>计划箱数</span><span>已补录装船</span><span>已补录卸船</span><span>箱清单</span></div>
              <div v-for="(group, groupIndex) in route.groups" :key="group.key" class="wcs-group-row">
                <span>{{ groupIndex + 1 }}</span><span>{{ group.containerType }}</span><span>{{ group.size }}</span><span>{{ group.cargo }}</span><span>{{ group.plannedCount }}</span><span><strong>{{ group.loadedCount }}</strong></span><span><strong>{{ group.unloadedCount }}</strong></span><span><button type="button" class="rcs-text-action" @click="openManifest(route, group)">补录箱清单</button></span>
              </div>
              <div class="wcs-group-row wcs-group-total"><span>合计</span><span></span><span></span><span></span><span>{{ route.groups.reduce((sum, item) => sum + item.plannedCount, 0) }}</span><span>{{ route.groups.reduce((sum, item) => sum + item.loadedCount, 0) }}</span><span>{{ route.groups.reduce((sum, item) => sum + item.unloadedCount, 0) }}</span><span></span></div>
            </div>

            <div class="rcs-route-work-row">
              <label><span><i>*</i>实际装船时间：</span><input v-model="route.loadTime" /></label>
              <label><span><i>*</i>实际卸船时间：</span><input v-model="route.unloadTime" /></label>
              <label><span><i>*</i>装船凭证：</span><button type="button" class="rcs-proof">{{ route.loadProof }} <i>＋</i></button></label>
              <label><span><i>*</i>卸船凭证：</span><button type="button" class="rcs-proof">{{ route.unloadProof }} <i>＋</i></button></label>
            </div>
          </section>
        </div>
      </section>
    </main>

    <footer class="rcs-actions"><button type="button" class="secondary" @click="backToCenter">取消</button><button type="button" class="primary annot-waterContainerWaybillSupplement-action-submit" @click="confirmVisible = true">提交</button></footer>

    <div v-if="manifestVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal wcs-manifest-modal" data-annotation-content="modal">
        <header class="wcs-manifest-head">
          <div><h3>补录集装箱清单</h3><p>{{ activeRoute.loadPort }} → {{ activeRoute.unloadPort }}｜{{ activeGroup.containerType }} {{ activeGroup.size }}｜{{ activeGroup.cargo }}</p></div>
          <button type="button" @click="manifestVisible = false">×</button>
        </header>
        <div class="wcs-manifest-toolbar">
          <div class="wcs-manifest-toolbar-copy"><span>计划 {{ activeGroup.plannedCount }} 箱，已补录 {{ activeGroup.loadedCount }} 箱</span><small>支持批量导入、图片识别与手动维护</small></div>
          <div class="wcs-manifest-actions annot-waterContainerWaybillSupplement-action-manifest-input">
            <button type="button" :class="{ active: entryMode === 'excel' }" @click="openEntryMode('excel')">导入表格</button>
            <button type="button" :class="{ active: entryMode === 'image' }" @click="openEntryMode('image')">上传图片识别</button>
            <button type="button" @click="addManualContainer">＋ 手动新增</button>
          </div>
        </div>
        <div v-if="entryMode === 'excel' || entryMode === 'image'" class="wcs-import-panel">
          <div>
            <strong>{{ entryMode === 'excel' ? '导入集装箱清单表格' : '上传装箱单或理货单图片' }}</strong>
            <p>{{ entryMode === 'excel' ? '支持 .xlsx / .xls，导入后可继续编辑每条箱信息。' : '识别箱号、铅封号和重量，识别结果需人工确认。' }}</p>
          </div>
          <button type="button" @click="finishImport">{{ importDone ? '解析完成，请确认下方明细' : (entryMode === 'excel' ? '选择表格文件' : '选择图片') }}</button>
        </div>
        <div class="wcs-manifest-table">
          <div class="wcs-manifest-row wcs-manifest-row-head"><span>序号</span><span>箱号</span><span>箱型</span><span>货品</span><span>铅封号</span><span>实际重量(t)</span><span class="annot-waterContainerWaybillSupplement-rule-manifest-items">作业状态</span><span>操作</span></div>
          <div v-for="(item, index) in activeGroup.manifest" :key="item.key" class="wcs-manifest-row">
            <span>{{ index + 1 }}</span><span><input v-model="item.containerNo" placeholder="请输入箱号" /></span><span>{{ item.size }}</span><span>{{ item.cargo }}</span><span><input v-model="item.sealNo" placeholder="请输入铅封号" /></span><span><input v-model="item.weight" placeholder="0.00" /></span><span><select v-model="item.status"><option>待完善</option><option>已装船</option><option>已卸船</option><option>已完成</option></select></span><span><button type="button" class="rcs-text-action" @click="removeManifestItem(item.key)">删除</button></span>
          </div>
        </div>
        <p class="wcs-manifest-pagination">共 {{ activeGroup.manifest[0]?.totalCount || activeGroup.loadedCount }} 箱，当前展示 5 条示例数据</p>
        <footer><button type="button" @click="manifestVisible = false">取消</button><button type="button" class="primary" @click="manifestVisible = false">保存箱清单</button></footer>
      </section>
    </div>

    <div v-if="confirmVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal annot-waterContainerWaybillSupplement-rule-confirm" data-annotation-content="modal"><h3>确认提交补录</h3><p>本次补录包含 <strong>{{ routes.length }}</strong> 个装卸路段、<strong>{{ loadedTotal }}</strong> 个已装船集装箱。</p><footer><button type="button" @click="confirmVisible = false">取消</button><button type="button" class="primary" @click="confirmVisible = false; successVisible = true">确认提交</button></footer></section>
    </div>

    <div v-if="successVisible" class="rcs-modal-mask" data-annotation-container="modal">
      <section class="rcs-modal rcs-success-modal" data-annotation-content="modal"><span class="rcs-success-icon">✓</span><h3>水路集装箱补录成功</h3><p>装卸路段、箱清单与路段凭证已保存。</p><footer><button type="button" class="primary" @click="backToCenter">返回运单中心</button></footer></section>
    </div>
  </div>
</template>
