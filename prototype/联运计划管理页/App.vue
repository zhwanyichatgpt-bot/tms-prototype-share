<template>
  <div class="plan-page">
      <header class="page-header">
        <h1 class="page-title">联运计划管理</h1>
        <button class="ws-btn primary" @click="handleCreate">新增联运计划</button>
      </header>

      <!-- 状态 Tabs（自定义 pill 式）-->
      <div class="status-tabs">
        <button
          v-for="t in statusTabs"
          :key="t.value"
          :class="{ active: activeStatus === t.value }"
          @click="activeStatus = t.value"
        >{{ t.label }}</button>
      </div>

      <!-- 筛选区（扁平横条，无独立卡片）-->
      <div class="filter-row">
        <input class="ws-input-sm" v-model="filters.planName" placeholder="计划名称/编号" />
        <select class="ws-select-sm" v-model="filters.creator">
          <option value="">创建人</option>
          <option v-for="c in creatorOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <input class="ws-input-sm datetime" type="datetime-local" v-model="filters.startDate" />
        <span class="separator">至</span>
        <input class="ws-input-sm datetime" type="datetime-local" v-model="filters.endDate" />
        <button class="ws-btn-sm primary" @click="handleQuery">搜索</button>
        <button class="ws-btn-sm" @click="handleReset">↻ 重置</button>
      </div>

      <!-- 主列表 -->
      <div class="plan-list">
        <article
          v-for="plan in filteredPlans"
          :key="plan.id"
          class="plan-card"
          :class="{ expanded: expandedRows[plan.id] }"
        >
          <!-- 主行 -->
          <div class="plan-main-row">
            <button class="expand-btn" @click="toggleExpand(plan.id)">
              <span v-if="!expandedRows[plan.id]">›</span>
              <span v-else>⌄</span>
            </button>
            <div class="plan-tags">
              <span class="soft-tag blue">公水联运</span>
            </div>
            <div class="plan-title">
              <strong>{{ plan.id }} {{ plan.name }}</strong>
            </div>
            <span class="status-pill" :class="planStatusClass(plan.status)">{{ plan.status }}</span>
            <!-- 进度条 -->
            <div class="progress-block">
              <div class="progress-line">
                <span :class="{ active: plan.status === '执行中' || plan.status === '已完成' }"></span>
                <span :class="{ active: plan.status === '已完成' }"></span>
                <span :class="{ active: plan.status === '已完成' }"></span>
                <em>{{ progressPercent(plan.status) }}%</em>
              </div>
              <div class="progress-labels">
                <b>汽运</b><span>水运</span><span>铁运</span>
              </div>
            </div>
            <div class="address-block">
              <span>装</span>
              <strong>{{ cargoMain(plan.cargoSummary) }}</strong>
            </div>
            <span class="settle-pill">{{ plan.settlementMode }}</span>
            <div class="plan-meta">
              <span>{{ plan.consignerName }}</span>
              <span>{{ plan.creator }}</span>
              <span>{{ plan.createTime }}</span>
            </div>
            <div class="row-actions">
              <button v-if="canDelete(plan)" class="text-link danger" @click="handleDelete(plan)">删除</button>
              <button class="text-link" @click="handleDetail(plan)">详情</button>
              <button v-if="canEdit(plan)" class="text-link" @click="handleEdit(plan)">编辑</button>
              <button v-if="plan.status === '待执行' || plan.status === '执行中'" class="text-link" @click="handlePause(plan)">暂停</button>
              <button v-if="plan.status === '已暂停'" class="text-link" @click="handleResume(plan)">开启</button>
              <button v-if="plan.status === '已暂停' || plan.status === '待执行'" class="text-link danger" @click="handleVoid(plan)">作废</button>
              <button v-if="plan.status === '已作废'" class="text-link" @click="handleRepublish(plan)">重新发布</button>
            </div>
          </div>

        <!-- 展开区 -->
        <div v-if="expandedRows[plan.id]" class="plan-expand">
          <div class="summary-row">
            <div><span>承运企业</span><strong>{{ plan.consignerName }}</strong></div>
            <div><span>关联运单</span><strong>{{ plan.relatedWaybillNo }}</strong></div>
            <div><span>货物</span><strong>{{ cargoMain(plan.cargoSummary) }}</strong></div>
            <div><span>结算方式</span><strong>{{ plan.settlementMode }}</strong></div>
            <div><span>创建人</span><strong>{{ plan.creator }}</strong></div>
            <div><span>创建时间</span><strong>{{ plan.createTime }}</strong></div>
            <div v-if="plan.remark"><span>备注</span><strong>{{ plan.remark }}</strong></div>
          </div>

          <!-- 子计划明细表 -->
          <h4 class="sub-title">子计划明细</h4>
          <table class="ws-table">
            <thead>
              <tr>
                <th width="180">子计划编号</th>
                <th>子计划名称</th>
                <th width="100">状态</th>
                <th width="110">运输方式</th>
                <th>装卸点</th>
                <th>货量摘要</th>
                <th width="180">计划时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sp in plan.subPlans" :key="sp.id">
                <td>{{ sp.id }}</td>
                <td>{{ sp.name }}</td>
                <td><span class="status-pill" :class="planStatusClass(sp.status)">{{ sp.status }}</span></td>
                <td>{{ sp.transportMode }}</td>
                <td>{{ sp.loadPoint }} → {{ sp.unloadPoint }}</td>
                <td>{{ sp.cargoSummary }}</td>
                <td>{{ sp.planTime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <div v-if="!filteredPlans.length" class="empty-state">
        <strong>暂无符合条件的联运计划</strong>
      </div>
    </div>

    <!-- 二次确认弹窗 -->
    <el-dialog v-model="confirmVisible" :title="confirmTitle" width="420px" :append-to-body="false">
      <span>{{ confirmMessage }}</span>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import mockData from './mock-data'

const plans = ref(mockData.plans.map(p => ({ ...p, subPlans: [...p.subPlans] })))
const statusTabs = mockData.statusTabs

const activeStatus = ref('全部')
const filters = reactive({
  planName: '',
  creator: '',
  startDate: '',
  endDate: '',
})
const expandedRows = reactive({})
const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingAction = ref(null)

const creatorOptions = computed(() => {
  const set = new Set(plans.value.map(p => p.creator))
  return Array.from(set)
})

const filteredPlans = computed(() => {
  return plans.value.filter(p => {
    if (activeStatus.value !== '全部' && p.status !== activeStatus.value) return false
    if (filters.planName) {
      const k = filters.planName.toLowerCase()
      if (!p.id.toLowerCase().includes(k) && !p.name.toLowerCase().includes(k)) return false
    }
    if (filters.creator && p.creator !== filters.creator) return false
    return true
  })
})

function onTabChange() {
  // 切换 tab 不重置筛选（与原 PRD 待确认保持，原型保留筛选）
}

function handleQuery() {
  ElMessage.success(`查询完成，共 ${filteredPlans.value.length} 条`)
}
function handleReset() {
  filters.planName = ''
  filters.creator = ''
  filters.startDate = ''
  filters.endDate = ''
}

function toggleExpand(id) {
  expandedRows[id] = !expandedRows[id]
}

function planStatusClass(status) {
  const map = {
    草稿: 'draft',
    待执行: 'pending',
    执行中: 'running',
    已暂停: 'paused',
    已作废: 'cancelled',
    已完成: 'success',
  }
  return map[status] || 'draft'
}

function progressPercent(status) {
  const map = { 草稿: 0, 待执行: 10, 执行中: 40, 已暂停: 40, 已作废: 0, 已完成: 100 }
  return map[status] ?? 0
}

function cargoMain(summary) {
  // 简化展示：取第一个货品名
  if (!summary) return '-'
  return summary.split('/')[0].trim()
}

function canDelete(plan) {
  return plan.status === '草稿'
}
function canEdit(plan) {
  return plan.status === '草稿' || plan.status === '待执行'
}

function handleCreate() {
  ElMessage.info('新增联运计划（创建联运计划页待迁移后跳转）')
}
function handleDetail(plan) {
  ElMessage.info(`查看详情：${plan.id}`)
}
function handleEdit(plan) {
  ElMessage.info(`编辑：${plan.id}`)
}
function handleDelete(plan) {
  showConfirm('删除联运计划', `确认删除草稿「${plan.name}」？删除后不可恢复。`, () => {
    const idx = plans.value.findIndex(p => p.id === plan.id)
    if (idx >= 0) plans.value.splice(idx, 1)
    ElMessage.success('已删除')
  })
}
function handlePause(plan) {
  showConfirm('暂停联运计划', `确认暂停「${plan.name}」？暂停后未完成子计划同步已暂停，已完成子计划不变。`, () => {
    plan.status = '已暂停'
    plan.subPlans.forEach(sp => {
      if (sp.status !== '已完成') sp.status = '已暂停'
    })
    ElMessage.success('已暂停')
  })
}
function handleResume(plan) {
  showConfirm('开启联运计划', `确认开启「${plan.name}」？子计划恢复暂停前状态。`, () => {
    const hasExecuting = plan.subPlans.some(sp => sp.status === '执行中')
    plan.status = hasExecuting ? '执行中' : '待执行'
    plan.subPlans.forEach(sp => {
      if (sp.status === '已暂停') sp.status = '待执行'
    })
    ElMessage.success('已开启')
  })
}
function handleVoid(plan) {
  showConfirm('作废联运计划', `确认作废「${plan.name}」？未完成子计划同步已作废，已完成子计划不变。`, () => {
    plan.status = '已作废'
    plan.subPlans.forEach(sp => {
      if (sp.status !== '已完成') sp.status = '已作废'
    })
    ElMessage.success('已作废')
  })
}
function handleRepublish(plan) {
  showConfirm('重新发布联运计划', `确认重新发布「${plan.name}」？主计划与子计划恢复为草稿，需再次生效才能进入待执行。`, () => {
    plan.status = '草稿'
    plan.subPlans.forEach(sp => { sp.status = '草稿' })
    ElMessage.success('已恢复为草稿，请再次生效')
  })
}

function showConfirm(title, message, action) {
  confirmTitle.value = title
  confirmMessage.value = message
  pendingAction.value = action
  confirmVisible.value = true
}
function handleConfirm() {
  if (pendingAction.value) pendingAction.value()
  confirmVisible.value = false
  pendingAction.value = null
}
</script>

<style scoped>
/* ============ 弹窗约束回画布内（不盖外层工具栏，避让左侧目录）============ */
:deep(.el-overlay) {
  top: var(--canvas-toolbar-height, 48px);
  left: calc(var(--canvas-offset-left, 232px) + 16px);
  right: 16px;
  bottom: auto;
  height: calc(100vh - var(--canvas-toolbar-height, 48px));
  overflow: hidden;
}
:deep(.el-overlay-dialog) {
  top: var(--canvas-toolbar-height, 48px);
}
:deep(.el-drawer) {
  top: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 100% !important;
  width: 100% !important;
  display: flex;
  flex-direction: column;
}
:deep(.el-drawer__body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.plan-page {
  min-height: calc(100vh - 48px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 54px;
  padding: 0 18px;
  background: #fff;
  border: 1px solid #e7ebf0;
  border-bottom: none;
  margin-bottom: 0;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* 自定义按钮 */
.ws-btn {
  height: 32px; padding: 0 16px; border: 1px solid #c9cdd4; border-radius: 2px;
  background: #fff; color: #4e5969; font-size: 14px; cursor: pointer;
}
.ws-btn:hover { border-color: #165dff; color: #165dff; }
.ws-btn.primary { background: #165dff; border-color: #165dff; color: #fff; }
.ws-btn.primary:hover { background: #4080ff; color: #fff; }
.ws-btn-sm {
  height: 28px; padding: 0 12px; border: 1px solid #d9dee8; border-radius: 2px;
  background: #fff; color: #4e5969; font-size: 13px; cursor: pointer;
}
.ws-btn-sm:hover { border-color: #165dff; color: #165dff; }
.ws-btn-sm.primary { background: #165dff; border-color: #165dff; color: #fff; }
.ws-btn-sm.primary:hover { background: #4080ff; }

/* 状态 Tabs（pill 式）*/
.status-tabs {
  display: flex;
  gap: 4px;
  padding: 0 18px;
  background: #fff;
  border-left: 1px solid #e7ebf0;
  border-right: 1px solid #e7ebf0;
  height: 48px;
  align-items: center;
}
.status-tabs button {
  height: 32px;
  padding: 0 16px;
  border: none;
  background: transparent;
  color: #6b7480;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
}
.status-tabs button:hover { background: #f2f6ff; color: #165dff; }
.status-tabs button.active {
  color: #165dff;
  font-weight: 600;
  position: relative;
}
.status-tabs button.active::after {
  content: '';
  position: absolute;
  left: 16px; right: 16px;
  bottom: -10px;
  height: 2px;
  background: #165dff;
}

/* 筛选区（扁平横条，无独立卡片）*/
.filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 18px;
  background: #fff;
  border: 1px solid #e7ebf0;
  border-bottom: none;
}
.ws-input-sm {
  height: 28px; padding: 0 10px; border: 1px solid #d9dee8; border-radius: 2px;
  font-size: 13px; color: #1f2937; outline: none; width: 200px; background: #fff;
}
.ws-input-sm:focus { border-color: #165dff; }
.ws-input-sm.datetime { width: 170px; }
.ws-select-sm {
  height: 28px; padding: 0 10px; border: 1px solid #d9dee8; border-radius: 2px;
  font-size: 13px; outline: none; background: #fff; min-width: 130px;
}
.separator { color: #909399; font-size: 12px; }

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #e7ebf0;
  border-top: none;
  background: #fff;
}

.plan-card {
  background: #fff;
  border-bottom: 1px solid #eef2f7;
  transition: background 0.15s;
}
.plan-card:last-child { border-bottom: none; }
.plan-card:hover { background: #fbfdff; }
.plan-card.expanded { background: #f7faff; }

.plan-main-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.expand-btn {
  width: 22px; height: 22px; border: none; background: transparent;
  color: #6b7480; font-size: 18px; cursor: pointer; line-height: 1;
}

.plan-tags { display: flex; gap: 4px; }
.soft-tag {
  padding: 2px 8px; border-radius: 3px; font-size: 11px;
}
.soft-tag.blue { background: #e8f3ff; color: #165dff; }

.plan-title {
  min-width: 240px;
}
.plan-title strong {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

/* 状态 pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px; height: 24px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}
.status-pill.draft { background: #f1f4f8; color: #5f6b7a; }
.status-pill.pending { background: #fff2df; color: #f2870b; border-color: #ffe5b4; }
.status-pill.running { background: #e8f3ff; color: #2868ff; border-color: #bedaff; }
.status-pill.paused { background: #fff2df; color: #f2870b; border-color: #ffe5b4; }
.status-pill.cancelled { background: #f1f4f8; color: #7d8795; }
.status-pill.success { background: #eaf9ef; color: #1ea25d; border-color: #c5edd5; }

/* 进度条 */
.progress-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}
.progress-line {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}
.progress-line span {
  flex: 1;
  height: 4px;
  background: #e5e8ef;
  border-radius: 2px;
}
.progress-line span.active {
  background: #2868ff;
}
.progress-line em {
  position: absolute;
  right: 0;
  top: -10px;
  font-size: 11px;
  color: #2868ff;
  font-style: normal;
  font-weight: 600;
}
.progress-labels {
  display: flex;
  gap: 4px;
  font-size: 11px;
  color: #909399;
}
.progress-labels b {
  color: #2868ff;
  font-weight: 600;
  flex: 1;
}
.progress-labels span { flex: 1; }

.address-block {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
  min-width: 100px;
}
.address-block > span {
  width: 18px; height: 18px;
  background: #3b82f6; color: #fff;
  border-radius: 3px; font-size: 11px;
  display: inline-flex; align-items: center; justify-content: center;
}

.settle-pill {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  background: #f5f5f5;
  color: #5f6b7a;
}

.plan-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #909399;
}

.row-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.text-link {
  border: none; background: transparent; color: #165dff; font-size: 13px;
  cursor: pointer; padding: 0;
}
.text-link:hover { color: #4080ff; }
.text-link.danger { color: #f53f3f; }
.text-link.danger:hover { color: #d91a15; }

.plan-expand {
  padding: 14px 16px 18px 50px;
  background: #fafbfc;
  border-top: 1px solid #eef0f5;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 20px;
  margin-bottom: 16px;
}
.summary-row > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.summary-row span {
  font-size: 12px;
  color: #909399;
}
.summary-row strong {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 10px;
}

/* 自定义表格 */
.ws-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.ws-table th, .ws-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #eef2f7;
}
.ws-table th {
  background: #f7f9fc;
  color: #556273;
  font-weight: 600;
}
.ws-table tbody tr:hover { background: #fbfdff; }
.ws-table tbody tr:last-child td { border-bottom: none; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
  background: #fff;
  border: 1px solid #e7ebf0;
  border-top: none;
}

@media (max-width: 1200px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
  .progress-block { display: none; }
}
</style>
