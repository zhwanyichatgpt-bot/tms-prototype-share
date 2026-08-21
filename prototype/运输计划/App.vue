<template>
  <PlanDetail v-if="viewDetail" :plan="viewDetail" :initial-tab="viewDetailTab" @back="viewDetail = null" @publish="handlePublishFromDetail" />
  <div v-else class="plan-scroll">
    <div class="plan-page">
      <!-- 顶部系统区 (业务系统顶栏) -->
      <header class="tp-topbar">
        <img class="tp-logo" src="/transport-plan-assets/logo.png" alt="logo" />
        <span class="tp-divider1"></span>
        <span class="tp-avatar"></span>
        <div class="tp-site">
          <span class="tp-site-name">楹联集运站</span>
          <span class="tp-site-org">企业名称企业名称企业企业名称...</span>
        </div>
        <img class="tp-nav" src="/transport-plan-assets/nav.png" alt="nav" />
        <span class="tp-date">2022 年 05 月 27 日</span>
        <span class="tp-weather">24℃ 多云</span>
        <img class="tp-user" src="/transport-plan-assets/avatar.png" alt="user" />
        <span class="tp-divider2"></span>
        <img class="tp-icon i1" src="/transport-plan-assets/icon1.png" alt="icon1" />
        <img class="tp-icon i2" src="/transport-plan-assets/icon2.png" alt="icon2" />
        <img class="tp-icon i3" src="/transport-plan-assets/icon3.png" alt="icon3" />
      </header>

      <!-- 第二层工作台条 -->
      <div class="tp-workbar">
        <img class="wb-ws-icon" src="/transport-plan-assets/workspace-icon.png" alt="workspace" />
        <span class="wb-ws-text">工作台</span>
        <span class="wb-tab-active">
          <span class="wb-tab-shape"></span>
          <span class="wb-tab-text">运输计划</span>
          <span class="wb-tab-close">
            <svg width="7" height="7" viewBox="0 0 6.58 6.58" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.82" y="0" width="8.14" height="1.16" transform="rotate(45 0.82 0)" rx="0.58" fill="#3D4050" />
              <rect x="6.58" y="0.82" width="8.14" height="1.16" transform="rotate(135 6.58 0.82)" rx="0.58" fill="#3D4050" />
            </svg>
          </span>
        </span>
      </div>

      <!-- 内容区 -->
      <div class="tp-body">
        <!-- 查询区 -->
        <div class="query-row annot-transport-plan-filter-list">
          <div class="query-field search-field">
            <input class="q-input" v-model="filters.planName" placeholder="输入计划名称/编号搜索" />
          </div>
          <div class="query-field">
            <span class="q-label">托运企业</span>
            <input class="q-input" v-model="filters.shipper" placeholder="输入企业名称" />
          </div>
          <div class="query-field time-field">
            <span class="q-label">创建时间</span>
            <input class="q-input date" type="date" v-model="filters.startDate" placeholder="请选择开始时间" />
            <input class="q-input date" type="date" v-model="filters.endDate" placeholder="请选择结束时间" />
          </div>
          <div class="query-field select-field">
            <span class="q-label">业务员</span>
            <select class="q-select" v-model="filters.creator">
              <option value="">创建人</option>
              <option v-for="c in creatorOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <button class="q-refresh" title="刷新" @click="handleRefresh">↻</button>
          <button class="q-search-btn" @click="handleQuery">搜索</button>
        </div>

        <!-- 状态页签 -->
        <div class="status-tabs">
          <button
            v-for="t in statusTabs"
            :key="t.value"
            :class="{ active: activeStatus === t.value }"
            @click="activeStatus = t.value"
          >{{ t.label }}</button>
        </div>

        <!-- 操作按钮行 -->
        <div class="action-row">
          <button class="btn-primary" @click="handleCreate">新建计划</button>
          <button class="btn-plain" @click="handleDispatch">运输调度</button>
        </div>

        <!-- 运输计划表格 -->
        <div class="table-wrap annot-transport-plan-field-list-actions">
          <table class="plan-table">
            <thead>
              <tr class="table-header">
                <th class="col-check"><el-checkbox v-model="checkAll" @change="handleCheckAll" /></th>
                <th class="col-index">序号</th>
                <th class="col-plan">计划信息</th>
                <th class="col-status">状态</th>
                <th class="col-settle">结算状态</th>
                <th class="col-shipper">托运企业</th>
                <th class="col-type">运输类型</th>
                <th class="col-shared">是否拼车</th>
                <th class="col-progress">进度</th>
                <th class="col-loadtime">装卸时间</th>
                <th class="col-fee">计费信息</th>
                <th class="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pagedPlans.length" v-for="(plan, index) in pagedPlans" :key="plan.id" class="plan-row">
                <td class="col-check"><el-checkbox :model-value="!!checkedRows[plan.id]" @change="v => handleRowCheck(plan, v)" /></td>
                <td class="col-index idx">{{ rowIndex(index) }}</td>
                <td class="col-plan">
                  <div class="plan-name" :title="plan.name">{{ plan.name }}</div>
                  <div class="plan-no">{{ plan.planNo }}</div>
                  <span class="plan-tag" :class="planTypeClass(plan.planType)">{{ plan.planType }}</span>
                </td>
                <td class="col-status"><span class="tag" :class="statusTagClass(plan.status)">{{ plan.status }}</span></td>
                <td class="col-settle"><span class="tag" :class="settleTagClass(plan.settlementStatus)">{{ plan.settlementStatus }}</span></td>
                <td class="col-shipper shipper-cell" :title="plan.shipperCompany">{{ plan.shipperCompany }}</td>
                <td class="col-type"><span class="tag" :class="typeTagClass(plan.transportType)">{{ plan.transportType }}</span></td>
                <td class="col-shared"><span class="tag" :class="sharedTagClass(plan.isShared)">{{ plan.isShared }}</span></td>
                <td class="col-progress">
                  <div class="progress-cell">
                    <div class="progress-track"><span class="progress-fill"></span></div>
                    <em>{{ plan.progress }}%</em>
                  </div>
                </td>
                <td class="col-loadtime">
                  <div class="loadtime-cell">
                    <div class="lt-item"><span class="lt-tag load">装</span><span>{{ plan.loadTime }}</span></div>
                    <div class="lt-item"><span class="lt-tag unload">卸</span><span>{{ plan.unloadTime }}</span></div>
                  </div>
                </td>
                <td class="col-fee">
                  <div class="fee-cell">
                    <div class="fee-name" :title="plan.billingTemplate">{{ plan.billingTemplate }}</div>
                    <span class="tag" :class="feeTagClass(plan.billingMode)">{{ plan.billingMode }}</span>
                  </div>
                </td>
                <td class="col-actions">
                  <div class="row-actions">
                    <button
                      v-for="act in visibleActions(plan)"
                      :key="act.key"
                      class="text-link"
                      :class="{ publish: act.publish, danger: act.danger }"
                      @click="handleAction(plan, act)"
                    >{{ act.label }}</button>
                    <el-dropdown v-if="hasDropdown(plan)" trigger="click" @command="c => handleAction(plan, c)">
                      <span class="text-link more">更多</span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            v-for="act in dropdownActions(plan)"
                            :key="act.key"
                            :command="act"
                          >{{ act.label }}</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </td>
              </tr>
              <tr v-else>
                <td colspan="12" class="empty-cell">暂无符合条件的运输计划</td>
              </tr>
            </tbody>
          </table>

          <!-- 分页 -->
          <div class="pagination-row">
            <span class="page-total">共4433条</span>
            <span class="page-size">10条/页</span>
            <button class="page-btn" :disabled="page <= 1" @click="page--">‹</button>
            <button
              v-for="n in pageNumbers"
              :key="n"
              class="page-btn"
              :class="{ active: n === page }"
              @click="page = n"
            >{{ n }}</button>
            <button class="page-btn" :disabled="page >= pageNumbers.length" @click="page++">›</button>
            <span class="page-jump">到第 <input class="page-input" v-model.number="jumpPage" @keyup.enter="doJump" /> 页</span>
          </div>
        </div>
      </div>

      <!-- 左侧业务导航 -->
      <img class="tp-sider" src="/transport-plan-assets/sider-icons.png" alt="sider" />
    </div>

    <!-- 二次确认弹窗 -->
    <el-dialog v-model="confirmVisible" class="annot-transport-plan-action-status-confirm" :title="confirmTitle" width="420px" :append-to-body="false">
      <span>{{ confirmMessage }}</span>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>

  <!-- 发布运力需求蒙层页（列表与详情共用） -->
  <PublishDemand
    v-if="publishPlan"
    :plan="publishPlan"
    @close="closePublish"
    @published="onPublished"
    @validate-error="onValidateError"
  />
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { statusTabs, sampleTransportPlans } from './mock-data'
import PublishDemand from './PublishDemand.vue'
import PlanDetail from './PlanDetail.vue'

const plans = ref(sampleTransportPlans.map(p => ({ ...p })))

const activeStatus = ref('全部')
const filters = reactive({
  planName: '',
  startDate: '',
  endDate: '',
  shipper: '',
  creator: '',
})
const page = ref(1)
const pageSize = ref(10)
const jumpPage = ref(1)
const checkedRows = reactive({})
const checkAll = ref(false)

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingAction = ref(null)

// 发布运力需求蒙层
const publishPlan = ref(null)

// 计划详情视图
const viewDetail = ref(null)
const viewDetailTab = ref('货品路线')

const creatorOptions = computed(() => {
  const set = new Set(plans.value.map(p => p.creator || '业务员'))
  return Array.from(set)
})

const filteredPlans = computed(() => {
  return plans.value.filter(p => {
    // 设计稿状态"待执中"归入"执行中"页签
    if (activeStatus.value === '执行中' && p.status === '待执中') return true
    if (activeStatus.value !== '全部' && p.status !== activeStatus.value) return false
    if (filters.planName) {
      const k = filters.planName.toLowerCase()
      if (!p.name.toLowerCase().includes(k) && !p.planNo.toLowerCase().includes(k)) return false
    }
    if (filters.shipper && !p.shipperCompany.includes(filters.shipper)) return false
    if (filters.creator && p.creator !== filters.creator) return false
    return true
  })
})

const pagedPlans = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredPlans.value.slice(start, start + pageSize.value)
})

const pageNumbers = computed(() => {
  const total = Math.max(1, Math.ceil(filteredPlans.value.length / pageSize.value))
  const start = Math.max(1, page.value - 2)
  const end = Math.min(total, start + 4)
  const arr = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

function rowIndex(index) {
  return (page.value - 1) * pageSize.value + index + 1
}

// ============ 选择 ============
function handleRowCheck(plan, val) {
  if (val) checkedRows[plan.id] = true
  else delete checkedRows[plan.id]
}
function handleCheckAll(val) {
  if (val) pagedPlans.value.forEach(p => { checkedRows[p.id] = true })
  else Object.keys(checkedRows).forEach(k => { delete checkedRows[k] })
}

// ============ 发布运力显隐 ============
function canPublish(plan) {
  if (plan.status === '草稿' || plan.status === '已完成' || plan.status === '已作废') return false
  return (plan.remainingDispatchQuantity ?? 0) > 0
}

// ============ 查询与状态 ============
function handleQuery() {
  page.value = 1
  ElMessage.success(`查询完成，共 ${filteredPlans.value.length} 条`)
}
function handleRefresh() {
  page.value = 1
  ElMessage.success('已刷新')
}
function doJump() {
  const total = pageNumbers.value.length
  if (jumpPage.value >= 1 && jumpPage.value <= total) page.value = jumpPage.value
}

function statusTagClass(status) {
  const map = {
    草稿: 'gray', 待执行: 'blue', 执行中: 'blue', 待执中: 'blue', 已执行: 'blue',
    已完成: 'green', 已暂停: 'gray', 已作废: 'gray',
  }
  return map[status] || 'blue'
}
function settleTagClass(status) {
  const map = { 未结算: 'blue', 部分结算: 'blue', 已结算: 'green', 无需结算: 'gray' }
  return map[status] || 'blue'
}
function typeTagClass(type) {
  const map = { 多装多卸: 'green', 集装箱运输: 'purple', 整车运输: 'steel' }
  return map[type] || 'steel'
}
function sharedTagClass(v) {
  return v === '允许' ? 'steel' : 'purple'
}
function feeTagClass(mode) {
  return mode === '单位计费' ? 'purple' : 'steel'
}
function planTypeClass(type) {
  return type === '平台计划' ? 'brown' : 'steel'
}

// ============ 操作列状态判定(按设计稿逐行) ============
// 待执行→详情+编辑 / 待执中→详情+暂停+作废 / 已完成→详情 / 已暂停→详情+开启+作废 / 已作废→详情+删除
function canEdit(plan) {
  return plan.status === '待执行'
}
function canPause(plan) {
  return plan.status === '待执中' || plan.status === '执行中'
}
function canResume(plan) {
  return plan.status === '已暂停'
}
function canVoid(plan) {
  return plan.status === '待执中' || plan.status === '执行中' || plan.status === '已暂停'
}
function canDelete(plan) {
  return plan.status === '已作废'
}

// 行操作列表(按设计稿顺序:详情 → 发布运力 → 编辑/暂停/开启/删除 → 作废)
function rowActions(plan) {
  const list = []
  list.push({ key: 'detail', label: '详情', danger: false })
  if (canPublish(plan)) list.push({ key: 'publish', label: '发布运力', danger: false, publish: true })
  if (canEdit(plan)) list.push({ key: 'edit', label: '编辑', danger: false })
  if (canPause(plan)) list.push({ key: 'pause', label: '暂停', danger: false })
  if (canResume(plan)) list.push({ key: 'resume', label: '开启', danger: false })
  if (canVoid(plan)) list.push({ key: 'void', label: '作废', danger: true })
  if (canDelete(plan)) list.push({ key: 'delete', label: '删除', danger: true })
  return list
}

// 每行平铺显示的前 2 个操作 + "更多"(占第3个位置)收进下拉的剩余操作
function visibleActions(plan) {
  return rowActions(plan).slice(0, 2)
}
function dropdownActions(plan) {
  return rowActions(plan).slice(2)
}
function hasDropdown(plan) {
  return rowActions(plan).length > 2
}

function handleAction(plan, action) {
  const map = {
    detail: handleDetail,
    publish: handlePublish,
    edit: handleEdit,
    pause: handlePause,
    resume: handleResume,
    void: handleVoid,
    delete: handleDelete,
  }
  const fn = map[action.key]
  if (fn) fn(plan)
}

// ============ 操作 ============
function handleCreate() {
  ElMessage.info('新建计划（创建页待接入）')
}
function handleDispatch() {
  ElMessage.info('运输调度（页面待接入）')
}
function handleDetail(plan) {
  viewDetailTab.value = '货品路线'
  viewDetail.value = plan
}
function handlePublish(plan) {
  // 为未配置装卸节点的计划生成默认节点(带入发布页)
  const p = { ...plan }
  if (!p.nodes || !p.nodes.length) {
    p.nodes = [
      { type: '装', name: '福州马尾港', time: p.loadTime || '2023-03-04 08:00', contactName: '陈建国', contactPhone: '139****2201', goods: [{ name: '玉米', weight: Math.round((p.remainingDispatchQuantity || 30) / 2), volume: 20, quantity: 300, pack: '散装', remark: '' }] },
      { type: '卸', name: '江阴港', time: p.unloadTime || '2023-03-06 18:00', contactName: '林海峰', contactPhone: '136****8802', goods: [{ name: '玉米', weight: p.remainingDispatchQuantity || 30, volume: 40, quantity: 600, pack: '散装', remark: '' }] },
    ]
  }
  if (p.totalWeight == null) p.totalWeight = p.remainingDispatchQuantity || 30
  if (p.arrangedWeight == null) p.arrangedWeight = 0
  publishPlan.value = p
}
function handlePublishFromDetail() {
  // 详情页“运力竞价”页签内发布，复用同一发布抽屉
  if (viewDetail.value) handlePublish(viewDetail.value)
}
function handleEdit(plan) {
  ElMessage.info(`编辑：${plan.name}`)
}
function handlePause(plan) {
  showConfirm('暂停运输计划', `确认暂停「${plan.name}」？`, () => {
    plan.status = '已暂停'
    ElMessage.success('已暂停')
  })
}
function handleResume(plan) {
  showConfirm('开启运输计划', `确认开启「${plan.name}」？`, () => {
    plan.status = '待执行'
    ElMessage.success('已开启')
  })
}
function handleVoid(plan) {
  showConfirm('作废运输计划', `确认作废「${plan.name}」？作废后不可恢复。`, () => {
    plan.status = '已作废'
    ElMessage.success('已作废')
  })
}
function handleDelete(plan) {
  showConfirm('删除运输计划', `确认删除草稿「${plan.name}」？删除后不可恢复。`, () => {
    const idx = plans.value.findIndex(p => p.id === plan.id)
    if (idx >= 0) plans.value.splice(idx, 1)
    ElMessage.success('已删除')
  })
}

// ============ 发布运力需求 ============
function closePublish() {
  publishPlan.value = null
}
function onValidateError(msg) {
  ElMessage.warning(msg)
}
function onPublished(payload) {
  const src = publishPlan.value
  if (src && payload) {
    // 将竞价记录写入对应运输计划（按 id 找到原计划）
    const target = plans.value.find(p => p.id === src.id) || src
    if (!target.capacityBiddingRecords) target.capacityBiddingRecords = []
    target.capacityBiddingRecords.unshift(payload)
    // 打开对应计划详情，默认选中“运力竞价”页签
    viewDetailTab.value = '运力竞价'
    viewDetail.value = target
  }
  closePublish()
  ElMessage.success('发布成功')
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
/* ============ 弹窗约束回画布内 ============ */
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

.plan-scroll {
  overflow-x: auto;
  background: #f5f6f8;
}

.plan-page {
  position: relative;
  width: 1920px;
  min-height: 1456px;
  background: #ffffff;
  box-sizing: border-box;
}

/* ============ 顶部系统区 (y 0-72, 白底) ============ */
.tp-topbar {
  position: relative;
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #eef1f5;
}
.tp-logo {
  position: absolute;
  left: 64px;
  top: 22px;
  width: 124px;
  height: 28px;
}
.tp-divider1 {
  position: absolute;
  left: 216px;
  top: 24px;
  width: 1px;
  height: 24px;
  background: #3d4050;
}
.tp-avatar {
  position: absolute;
  left: 244px;
  top: 21px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e1dede;
  border: 2px solid #c4cad1;
}
.tp-site {
  position: absolute;
  left: 284px;
  top: 17px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tp-site-name {
  font-size: 16px;
  color: #3d4050;
  line-height: 22px;
}
.tp-site-org {
  font-size: 12px;
  color: #91929e;
  line-height: 18px;
}
.tp-nav {
  position: absolute;
  left: 854px;
  top: 20px;
  width: 318px;
  height: 36px;
}
.tp-date {
  position: absolute;
  left: 1474px;
  top: 27px;
  font-size: 16px;
  color: #3d4050;
  line-height: 21px;
  white-space: nowrap;
}
.tp-weather {
  position: absolute;
  left: 1635px;
  top: 27px;
  font-size: 16px;
  color: #3d4050;
  line-height: 22px;
  white-space: nowrap;
}
.tp-user {
  position: absolute;
  left: 1715px;
  top: 22px;
  width: 37px;
  height: 31px;
}
.tp-divider2 {
  position: absolute;
  left: 1771px;
  top: 28px;
  width: 1px;
  height: 21px;
  background: #3d4050;
}
.tp-icon {
  position: absolute;
  top: 26px;
  width: 24px;
  height: 24px;
}
.tp-icon.i1 { left: 1792px; }
.tp-icon.i2 { left: 1828px; }
.tp-icon.i3 { left: 1864px; }

/* ============ 第二层工作台条 (y 72-108, 浅灰:黑色填充6%透明度) ============ */
.tp-workbar {
  position: relative;
  height: 36px;
  margin: 0 64px;
  background: rgba(0, 0, 0, 0.06);
}
.wb-ws-icon {
  position: absolute;
  left: 48px;
  top: 11px;
  width: 16px;
  height: 16px;
}
.wb-ws-text {
  position: absolute;
  left: 72px;
  top: 8px;
  font-size: 16px;
  color: #909499;
  line-height: 22px;
}
.wb-tab-active {
  position: absolute;
  left: 153px;
  top: 0;
  width: 202px;
  height: 36px;
}
.wb-tab-shape {
  position: absolute;
  inset: 0;
  background: url('/transport-plan-assets/tab-transport.png') no-repeat center / 100% 100%;
}
.wb-tab-text {
  position: absolute;
  left: 59px;
  top: 8px;
  font-size: 16px;
  color: #3d4050;
  line-height: 22px;
}
.wb-tab-close {
  position: absolute;
  left: 161px;
  top: 17px;
  width: 7px;
  height: 7px;
}

/* ============ 内容区 (y 108+, 白底) ============ */
.tp-body {
  margin: 0 64px;
  padding-top: 20px;
  background: #ffffff;
  box-sizing: border-box;
}

/* 查询区 */
.query-row {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 32px;
  margin-bottom: 37px;
}
.query-field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  border: 1px solid #e0e2e6;
  background: #fff;
  padding: 0 10px;
  box-sizing: border-box;
}
.search-field { width: 280px; }
.query-field:nth-child(2) { width: 300px; }
.time-field { width: 408px; }
.select-field { width: 256px; }
.q-label {
  font-size: 14px;
  color: #1b1b1b;
  white-space: nowrap;
}
.q-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1f2329;
  background: transparent;
  min-width: 0;
}
.q-input::placeholder { color: #cccccc; }
.q-input.date { min-width: 0; }
.q-select {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #3d4050;
  background: transparent;
}
.q-refresh {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e2e6;
  background: #fff;
  color: #4e5969;
  font-size: 16px;
  cursor: pointer;
  border-radius: 2px;
}
.q-refresh:hover { border-color: #3a65ff; color: #3a65ff; }
.q-search-btn {
  width: 80px;
  height: 32px;
  border: none;
  background: #3a65ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
}
.q-search-btn:hover { background: #5982ff; }

/* 状态页签 */
.status-tabs {
  display: flex;
  gap: 24px;
  height: 29px;
  align-items: center;
  margin-bottom: 20px;
}
.status-tabs button {
  border: none;
  background: transparent;
  font-size: 16px;
  color: #333333;
  cursor: pointer;
  padding: 0 2px;
  line-height: 29px;
  position: relative;
}
.status-tabs button:hover { color: #3a65ff; }
.status-tabs button.active {
  color: #3a65ff;
  font-weight: 600;
}
.status-tabs button.active::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  bottom: 0;
  height: 2px;
  background: #3a65ff;
}

/* 操作按钮行 */
.action-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.btn-primary {
  width: 92px;
  height: 28px;
  border: none;
  background: #3a65ff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
}
.btn-primary:hover { background: #5982ff; }
.btn-plain {
  width: 92px;
  height: 28px;
  border: 1px solid #d8dce3;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
}
.btn-plain:hover { border-color: #3a65ff; color: #3a65ff; }

/* 表格 */
.table-wrap {
  background: #fff;
  border: 1px solid #eef1f5;
}
.plan-table {
  width: 1816px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}
.table-header th {
  background: #f7f9fc;
  color: #b3b3b3;
  font-size: 12px;
  font-weight: 400;
  text-align: left;
  height: 28px;
  line-height: 28px;
  padding: 0 8px;
  border-bottom: 1px solid #eef1f5;
  box-sizing: border-box;
  white-space: nowrap;
}
.table-header .col-check { line-height: 1; }
.table-header :deep(.el-checkbox) { height: 16px; }
.table-header :deep(.el-checkbox__inner) {
  width: 16px;
  height: 16px;
}
.table-header :deep(.el-checkbox__inner::after) {
  height: 8px;
  left: 5px;
  top: 2px;
  width: 3px;
}
.plan-row td {
  height: 98px;
  padding: 10px 8px;
  box-sizing: border-box;
  vertical-align: middle;
  border-bottom: 1px solid #f2f4f7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.plan-row:nth-child(even) td { background: #f7f7f7; }
.plan-row:nth-child(odd) td { background: #ffffff; }
.plan-row:hover td { background: #f0f6ff; }

.col-check { width: 32px; text-align: center; padding-right: 0 !important; }
.col-index { width: 76px; }
.col-plan { width: 224px; }
.col-status { width: 116px; }
.col-settle { width: 136px; }
.col-shipper { width: 196px; }
.col-type { width: 108px; }
.col-shared { width: 116px; }
.col-progress { width: 104px; }
.col-loadtime { width: 183px; }
.col-fee { width: 262px; }
.col-actions { width: 263px; }

.idx { color: #333; font-size: 14px; }

.plan-name {
  font-size: 14px;
  color: #323234;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.plan-no {
  font-size: 12px;
  color: #b3b3b3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.plan-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border-radius: 2px;
  font-size: 12px;
  white-space: nowrap;
}
.plan-tag::before {
  content: '';
  width: 14px;
  height: 14px;
  background: url('/transport-plan-assets/plan-type-icon.png') no-repeat center / 14px 14px;
  flex: 0 0 auto;
}
.plan-tag.steel { background: #ebeff7; color: #808cb6; }
.plan-tag.brown { background: #fcecde; color: #aa7b57; }

.shipper-cell {
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 2px;
  font-size: 12px;
  white-space: nowrap;
}
.tag.blue { background: #f0f3ff; color: #3a65ff; }
.tag.green { background: #e8f8ed; color: #21bd88; }
.tag.purple { background: #f2ecff; color: #9482b8; }
.tag.steel { background: #ebeff7; color: #808cb6; }
.tag.gray { background: #f2f2f2; color: #999999; }

.progress-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  height: 100%;
}
.progress-track {
  width: 56px;
  height: 4px;
  background: #ececec;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  display: block;
  width: 20px;
  height: 100%;
  background: #3a65ff;
  border-radius: 2px;
}
.progress-cell em {
  font-style: normal;
  font-size: 14px;
  color: #333;
  line-height: 1;
}

.loadtime-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  height: 100%;
  font-size: 14px;
  color: #323234;
}
.lt-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lt-tag {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.lt-tag.load { background: #e1e4ec; color: #3a4564; }
.lt-tag.unload { background: #366afb; color: #ffffff; }

.fee-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  height: 100%;
}
.fee-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fee-cell .tag { align-self: flex-start; height: 24px; }

.row-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}
.text-link {
  border: none;
  background: transparent;
  color: #3a65ff;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  line-height: 1;
}
.text-link:hover { color: #5982ff; }
.text-link.publish { color: #21bd88; }
.text-link.publish:hover { color: #2fcf9b; }
.text-link.danger { color: #f53f3f; }
.text-link.danger:hover { color: #d91a15; }
.text-link.more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.text-link.more::after {
  content: '';
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
}

/* 更多下拉菜单(与设计稿操作文字风格一致) */
:deep(.el-dropdown-menu) {
  padding: 4px 0;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(29, 41, 57, 0.1);
}
:deep(.el-dropdown-menu__item) {
  font-size: 14px;
  color: #3a65ff;
  padding: 7px 18px;
  line-height: 1;
}
:deep(.el-dropdown-menu__item:hover) {
  background: #f0f6ff;
  color: #3a65ff;
}
:deep(.el-dropdown-menu__item:not(.is-disabled):focus) {
  background: #f0f6ff;
  color: #3a65ff;
}

.empty-cell {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
}

/* 分页 */
.pagination-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 96px;
  padding: 4px 18px;
  border-top: 1px solid #eef1f5;
  font-size: 14px;
  color: #323234;
  justify-content: flex-end;
  height: 32px;
  box-sizing: border-box;
}
.page-btn {
  min-width: 24px;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #e0e2e6;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
}
.page-btn.active {
  background: #3a65ff;
  border-color: #3a65ff;
  color: #fff;
}
.page-btn:disabled { cursor: not-allowed; opacity: 0.4; }
.page-jump { display: flex; align-items: center; gap: 4px; }
.page-input {
  width: 40px;
  height: 24px;
  border: 1px solid #e0e2e6;
  text-align: center;
  font-size: 14px;
  outline: none;
}

/* 左侧业务导航 */
.tp-sider {
  position: absolute;
  left: 20px;
  top: 404px;
  width: 32px;
  height: 117px;
}
</style>
