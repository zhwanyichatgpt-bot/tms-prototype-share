<template>
  <WorkspaceShell current-title="创建联运计划">
    <div class="plan-create-page">
      <header class="page-header">
        <div class="header-left">
          <h1 class="page-title">新增联运计划</h1>
        </div>
        <button class="ws-btn" @click="handleCancel">返回联运计划</button>
      </header>

    <!-- 关联托运单信息卡 -->
    <section v-if="waybillOrder" class="source-card">
      <div class="source-line">
        <strong>已关联托运单：{{ waybillOrder.id }}</strong>
        <el-button type="primary" link size="small" @click="clearWaybillRelation">解除关联</el-button>
      </div>
      <div class="source-line">
        <span>{{ waybillOrder.shipperCompany }}</span>
        <span>{{ waybillOrder.mainTransportMode }}</span>
        <span>{{ waybillOrder.businessType }}</span>
      </div>
    </section>

    <!-- 基础信息 -->
    <section class="form-section">
      <div class="section-header">
        <h3 class="section-title">基础信息</h3>
        <el-button v-if="!waybillOrder" type="primary" link @click="openWaybillDrawer">+ 关联托运单</el-button>
      </div>
      <el-form :model="plan" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="计划名称" required>
              <el-input v-model="plan.planName" maxlength="100" placeholder="请输入计划名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="托运企业" required>
              <el-input v-model="plan.shipperCompany" :disabled="!!waybillOrder" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系人">
              <el-input v-model="plan.contactName" :readonly="!!waybillOrder" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系电话">
              <el-input v-model="plan.contactPhone" :readonly="!!waybillOrder" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="plan.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </section>

    <!-- 货品信息 -->
    <section class="form-section">
      <div class="section-header">
        <h3 class="section-title">货品信息</h3>
        <el-form-item label="配载方式" label-width="80" style="margin-bottom: 0">
          <el-radio-group v-model="plan.stowageMode" :disabled="!!waybillOrder">
            <el-radio v-for="s in stowageModes" :key="s" :label="s">{{ s }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-table v-if="!waybillOrder" :data="plan.cargoItems" border size="small">
        <el-table-column label="货品名称" min-width="140">
          <template #default="{ row }"><el-input v-model="row.cargoName" size="small" /></template>
        </el-table-column>
        <el-table-column label="包装" width="120">
          <template #default="{ row }">
            <el-select v-model="row.packageType" size="small" style="width: 100%">
              <el-option v-for="p in packageTypes" :key="p" :label="p" :value="p" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="重量(吨)" width="100">
          <template #default="{ row }"><el-input-number v-model="row.weight" :min="0" :controls="false" size="small" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="体积(m³)" width="100">
          <template #default="{ row }"><el-input-number v-model="row.volume" :min="0" :controls="false" size="small" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }"><el-input-number v-model="row.quantity" :min="0" :controls="false" size="small" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="装货点" min-width="120">
          <template #default="{ row }"><el-input v-model="row.loadPoint" size="small" /></template>
        </el-table-column>
        <el-table-column label="卸货点" min-width="120">
          <template #default="{ row }"><el-input v-model="row.unloadPoint" size="small" /></template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button v-if="plan.cargoItems.length > 1" type="danger" link size="small" @click="removeCargo($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 关联托运单后只读展示 -->
      <el-table v-else :data="plan.cargoItems" border size="small">
        <el-table-column prop="cargoName" label="货品名称" min-width="140" />
        <el-table-column prop="packageType" label="包装" width="100" />
        <el-table-column prop="weight" label="重量(吨)" width="100" />
        <el-table-column prop="volume" label="体积(m³)" width="100" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="loadPoint" label="装货点" min-width="120" />
        <el-table-column prop="unloadPoint" label="卸货点" min-width="120" />
      </el-table>

      <el-button v-if="!waybillOrder" type="primary" link size="small" style="margin-top: 10px" @click="addCargo">+ 添加货品</el-button>
    </section>

    <!-- 路线规划 -->
    <section class="form-section">
      <div class="section-header">
        <h3 class="section-title">路线规划（执行段）</h3>
        <el-button v-if="!waybillOrder" type="primary" link @click="addSegment">+ 添加执行段</el-button>
      </div>

      <div v-for="(seg, idx) in plan.routeSegments" :key="seg.id" class="segment-card">
        <div class="segment-header">
          <strong>执行段 {{ seg.seq }}</strong>
          <el-tag size="small" :type="seg.transportMode === '公路' ? 'success' : seg.transportMode === '铁路' ? 'warning' : 'primary'">{{ seg.transportMode }}</el-tag>
          <el-tag size="small" type="info">{{ seg.carryForm }}</el-tag>
          <span class="seg-route">{{ seg.from }} → {{ seg.to }}</span>
          <div class="segment-actions">
            <el-button v-if="seg.subPlan" type="primary" link size="small" @click="viewSubPlan(seg)">查看子计划</el-button>
            <el-button v-else type="primary" link size="small" @click="createSubPlan(seg)">创建子计划</el-button>
            <el-button v-if="!waybillOrder && plan.routeSegments.length > 1" type="danger" link size="small" @click="removeSegment(idx)">删除</el-button>
          </div>
        </div>

        <el-form :inline="true" size="small" label-width="80">
          <el-form-item label="运输方式">
            <el-select v-model="seg.transportMode" :disabled="!!waybillOrder" style="width: 130px">
              <el-option v-for="m in transportModes" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
          <el-form-item label="运输类型">
            <el-select v-model="seg.carryForm" :disabled="!!waybillOrder" style="width: 130px">
              <el-option v-for="c in carryForms" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="起点">
            <el-input v-model="seg.from" :readonly="!!waybillOrder" style="width: 160px" />
          </el-form-item>
          <el-form-item label="终点">
            <el-input v-model="seg.to" :readonly="!!waybillOrder" style="width: 160px" />
          </el-form-item>
          <el-form-item label="装货时间">
            <el-date-picker v-model="seg.loadWorkTime" type="datetime" :readonly="!!waybillOrder" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="装货时间" style="width: 200px" />
          </el-form-item>
          <el-form-item label="卸货时间">
            <el-date-picker v-model="seg.unloadWorkTime" type="datetime" :readonly="!!waybillOrder" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="卸货时间" style="width: 200px" />
          </el-form-item>
        </el-form>

        <!-- 承运货品摘要 -->
        <div class="cargo-summary">
          <span class="summary-label">承运货品：</span>
          <el-tag v-for="(c, ci) in seg.cargoItems" :key="ci" size="small" type="info" effect="plain" style="margin-right: 4px">
            {{ c.cargoName }} <em v-if="c.weight">| {{ c.weight }}吨</em>
          </el-tag>
        </div>

        <!-- 子计划摘要 -->
        <div v-if="seg.subPlan" class="subplan-summary">
          <span class="summary-label">子计划：</span>
          <span>{{ seg.subPlan.id }} {{ seg.subPlan.type }}（{{ seg.subPlan.status }}）</span>
        </div>
      </div>
    </section>

    <!-- 费用信息 -->
    <section class="form-section">
      <div class="section-header">
        <h3 class="section-title">费用信息</h3>
        <el-switch v-model="plan.feeConfig.enabled" />
      </div>

      <div v-if="plan.feeConfig.enabled">
        <el-form :model="plan.feeConfig" label-width="120px">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="结算方式">
                <el-radio-group v-model="plan.feeConfig.settlementMode">
                  <el-radio v-for="s in settlementModes" :key="s" :label="s">{{ s }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="是否含税">
                <el-radio-group v-model="plan.feeConfig.includeTax">
                  <el-radio v-for="t in taxOptions" :key="t" :label="t">{{ t }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="付款方式">
                <el-select v-model="plan.feeConfig.paymentType" style="width: 100%">
                  <el-option v-for="p in paymentTypes" :key="p" :label="p" :value="p" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="支付方式">
                <el-select v-model="plan.feeConfig.paymentMethod" style="width: 100%">
                  <el-option v-for="m in paymentMethods" :key="m" :label="m" :value="m" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 整票结算 -->
          <template v-if="plan.feeConfig.settlementMode === '整票结算'">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item label="计费条件">
                  <el-select v-model="plan.feeConfig.calcRule" style="width: 100%">
                    <el-option v-for="c in calcRules" :key="c" :label="c" :value="c" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="计量单位">
                  <el-select v-model="plan.feeConfig.measureUnit" style="width: 100%">
                    <el-option v-for="u in measureUnits" :key="u" :label="u" :value="u" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="运输单价">
                  <el-input-number v-model="plan.feeConfig.unitPrice" :min="0" :controls="false" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="预估运费">
                  <strong class="amount">¥{{ wholeFee.toFixed(2) }}</strong>
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <!-- 分段结算 -->
          <template v-else>
            <el-table :data="segmentFeeRules" border size="small" style="margin-bottom: 12px">
              <el-table-column label="执行段" min-width="180">
                <template #default="{ row }">{{ row.from }} → {{ row.to }}（{{ row.transportMode }}）</template>
              </el-table-column>
              <el-table-column label="计费规则" width="140">
                <template #default="{ row }">
                  <el-select v-model="row.calcRule" size="small" style="width: 100%">
                    <el-option v-for="c in calcRules" :key="c" :label="c" :value="c" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="运输单价" width="140">
                <template #default="{ row }">
                  <el-input-number v-model="row.feeUnitPrice" :min="0" :controls="false" size="small" style="width: 100%" />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="120">
                <template #default="{ row }">¥{{ (row.feeUnitPrice || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
            <div class="fee-formula">
              <span>结算总额 = Σ各段金额 = </span>
              <strong class="amount">¥{{ segmentFeeTotal.toFixed(2) }}</strong>
            </div>
          </template>
        </el-form>

        <!-- 其他费用 -->
        <div class="extra-fee-block">
          <div class="section-header">
            <h4 class="sub-title">其他费用</h4>
            <el-button type="primary" link size="small" @click="addExtraFee">+ 添加</el-button>
          </div>
          <el-table :data="plan.extraFeeRows" border size="small" empty-text="暂无其他费用">
            <el-table-column label="费用名称" min-width="200">
              <template #default="{ row }"><el-input v-model="row.name" size="small" placeholder="费用名称" /></template>
            </el-table-column>
            <el-table-column label="金额" width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.amount" :min="0" :controls="false" size="small" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link size="small" @click="removeExtraFee($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </section>

    <!-- 附件 -->
    <section class="form-section">
      <h3 class="section-title">附件</h3>
      <el-upload action="#" :auto-upload="false" :limit="3">
        <el-button>点击上传</el-button>
        <template #tip>
          <div class="upload-tip">支持扩展名：jpg、png、pdf，单个文件不超过 10MB</div>
        </template>
      </el-upload>
    </section>

    <!-- 底部操作栏 -->
    <footer class="page-footer">
      <span class="footer-info">已创建 {{ createdSubPlanCount }} 个子计划</span>
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="saveDraft">保存草稿</el-button>
      <el-button type="primary" :loading="submitting" @click="submitPlan">提交生效</el-button>
    </footer>

    <!-- 关联托运单抽屉 -->
    <el-drawer v-model="waybillDrawerVisible" title="选择关联托运单" direction="rtl" size="500px">
      <el-radio-group v-model="selectedWaybillId" class="drawer-list">
        <el-radio
          v-for="w in selectableWaybills"
          :key="w.id"
          :label="w.id"
          class="drawer-item"
        >
          <div class="drawer-item-main">
            <strong>{{ w.id }}</strong>
            <span>{{ w.shipperCompany }} · {{ w.businessType }} · {{ w.mainTransportMode }}</span>
            <em>{{ w.contactName }} {{ w.contactPhone }}</em>
          </div>
        </el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="waybillDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmWaybillRelation">确认关联</el-button>
      </template>
    </el-drawer>

    <!-- 子计划详情 -->
    <el-dialog v-model="subPlanDialogVisible" title="子计划详情" width="500px">
      <template v-if="currentSubPlan">
        <div class="subplan-detail">
          <div><span>子计划编号：</span><strong>{{ currentSubPlan.id }}</strong></div>
          <div><span>类型：</span><strong>{{ currentSubPlan.type }}</strong></div>
          <div><span>状态：</span><strong>{{ currentSubPlan.status }}</strong></div>
          <div><span>摘要：</span><strong>{{ currentSubPlan.summary }}</strong></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="subPlanDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    </div>
  </WorkspaceShell>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import WorkspaceShell from '../../src/components/WorkspaceShell.vue'
import {
  transportModes, carryForms, packageTypes, cargoUnits, stowageModes,
  settlementModes, billingConditions, billingBases, priceUnits,
  taxOptions, paymentTypes, paymentMethods, calcRules, measureUnits,
  defaultPlan, selectableWaybills, subPlanTypeMap, subPlanStatusOptions,
} from './mock-data'

// ============ 状态 ============
const plan = reactive(JSON.parse(JSON.stringify(defaultPlan)))
const waybillOrder = ref(null) // 关联托运单
const waybillDrawerVisible = ref(false)
const selectedWaybillId = ref('')
const submitting = ref(false)
const subPlanDialogVisible = ref(false)
const currentSubPlan = ref(null)

// ============ 关联托运单 ============
function openWaybillDrawer() {
  selectedWaybillId.value = waybillOrder.value?.id || ''
  waybillDrawerVisible.value = true
}

function confirmWaybillRelation() {
  const w = selectableWaybills.find(x => x.id === selectedWaybillId.value)
  if (!w) return ElMessage.warning('请选择托运单')
  waybillOrder.value = w
  plan.shipperCompany = w.shipperCompany
  plan.contactName = w.contactName
  plan.contactPhone = w.contactPhone
  plan.cargoItems = (w.cargoItems || []).map(c => ({ ...c }))
  // 锁定执行段（基于托运单装卸点）
  if (plan.routeSegments.length) {
    plan.routeSegments[0].from = w.loadNodes?.[0]?.name || plan.routeSegments[0].from
    plan.routeSegments[plan.routeSegments.length - 1].to = w.unloadNodes?.[0]?.name || plan.routeSegments[plan.routeSegments.length - 1].to
    plan.routeSegments.forEach(s => { s.locked = true })
  }
  waybillDrawerVisible.value = false
  ElMessage.success('已关联托运单')
}

function clearWaybillRelation() {
  waybillOrder.value = null
  plan.routeSegments.forEach(s => { s.locked = false })
  ElMessage.success('已解除关联，字段保留可继续编辑')
}

// ============ 货品 ============
function addCargo() {
  plan.cargoItems.push({ id: `c-${Date.now()}`, cargoName: '', packageType: '散装', weight: 0, volume: 0, quantity: 0, unit: '吨', loadPoint: '', unloadPoint: '' })
}
function removeCargo(idx) {
  if (plan.cargoItems.length > 1) plan.cargoItems.splice(idx, 1)
}

// ============ 执行段 ============
function addSegment() {
  const seq = plan.routeSegments.length + 1
  plan.routeSegments.push({
    id: `seg-${Date.now()}`, seq,
    transportMode: '公路', carryForm: '散货运输',
    from: '', to: '', loadWorkTime: '', unloadWorkTime: '', duration: '待确认',
    locked: false, subPlan: null,
    cargoItems: [],
  })
}
function removeSegment(idx) {
  plan.routeSegments.splice(idx, 1)
  // 重排 seq
  plan.routeSegments.forEach((s, i) => { s.seq = i + 1 })
}

// ============ 子计划 ============
function createSubPlan(seg) {
  seg.subPlan = {
    id: `SP${Date.now().toString().slice(-8)}`,
    type: subPlanTypeMap[seg.transportMode] || '子计划',
    status: '草稿',
    summary: `${seg.from}|${seg.transportMode}|${seg.carryForm}`,
  }
  ElMessage.success('子计划已创建')
}
function viewSubPlan(seg) {
  currentSubPlan.value = seg.subPlan
  subPlanDialogVisible.value = true
}

const createdSubPlanCount = computed(() => plan.routeSegments.filter(s => s.subPlan).length)

// ============ 费用 ============
const wholeFee = computed(() => {
  const qty = plan.cargoItems.reduce((sum, c) => sum + (Number(c.weight) || Number(c.quantity) || 0), 0)
  return qty * (Number(plan.feeConfig.unitPrice) || 0)
})

// 分段结算规则（按执行段展开）
const segmentFeeRules = computed(() => {
  return plan.routeSegments.map(s => ({
    id: s.id, from: s.from, to: s.to, transportMode: s.transportMode,
    calcRule: '按重量', feeUnitPrice: 0,
  }))
})

const segmentFeeTotal = computed(() => {
  return segmentFeeRules.value.reduce((sum, r) => sum + (Number(r.feeUnitPrice) || 0), 0)
})

// 其他费用
function addExtraFee() {
  plan.extraFeeRows.push({ id: `ef-${Date.now()}`, name: '', amount: 0 })
}
function removeExtraFee(idx) {
  plan.extraFeeRows.splice(idx, 1)
}

// ============ 提交 ============
function handleCancel() {
  ElMessage.info('返回联运计划管理页')
}

function validateDraft() {
  if (!plan.planName?.trim()) return '请输入计划名称'
  return null
}

function validateSubmit() {
  if (!plan.planName?.trim()) return '请输入计划名称'
  if (!plan.shipperCompany?.trim()) return '请输入托运企业'
  if (!plan.contactName?.trim()) return '请输入联系人'
  if (!plan.contactPhone?.trim()) return '请输入联系电话'
  if (!plan.cargoItems.length) return '请至少添加一条货品'
  for (let i = 0; i < plan.cargoItems.length; i++) {
    const c = plan.cargoItems[i]
    if (!c.cargoName?.trim()) return `第 ${i + 1} 条货品名称必填`
    if (!Number(c.weight) && !Number(c.quantity)) return `第 ${i + 1} 条货品重量或数量至少填一项`
  }
  if (!plan.routeSegments.length) return '请至少添加一个执行段'
  for (let i = 0; i < plan.routeSegments.length; i++) {
    const s = plan.routeSegments[i]
    if (!s.transportMode) return `第 ${i + 1} 段运输方式必选`
    if (!s.from?.trim() || !s.to?.trim()) return `第 ${i + 1} 段起点终点必填`
  }
  if (plan.feeConfig.enabled) {
    if (plan.feeConfig.settlementMode === '整票结算') {
      if (!plan.feeConfig.unitPrice) return '整票结算请填运输单价'
    } else {
      for (let i = 0; i < segmentFeeRules.value.length; i++) {
        if (!segmentFeeRules.value[i].feeUnitPrice) return `分段结算第 ${i + 1} 段请填运输单价`
      }
    }
  }
  return null
}

function saveDraft() {
  const err = validateDraft()
  if (err) return ElMessage.warning(err)
  ElMessage.success('草稿已保存')
}

function submitPlan() {
  const err = validateSubmit()
  if (err) return ElMessage.warning(err)
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    ElMessage.success('提交成功，已生效')
  }, 800)
}
</script>

<style scoped>
.plan-create-page {
  min-height: calc(100vh - 132px);
  padding-bottom: 80px;
}

/* 自定义按钮 */
.ws-btn {
  height: 32px; padding: 0 16px; border: 1px solid #c9cdd4; border-radius: 2px;
  background: #fff; color: #4e5969; font-size: 14px; cursor: pointer;
}
.ws-btn:hover { border-color: #165dff; color: #165dff; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
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

.source-card {
  background: #e8f3ff;
  border: 1px solid #b3d1ff;
  border-left: 3px solid #165dff;
  border-radius: 0;
  padding: 12px 14px;
  margin-bottom: 0;
  border-top: none;
  border-right: none;
}
.source-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #606266;
}
.source-line + .source-line {
  margin-top: 6px;
}

.form-section {
  background: #fff;
  border: 1px solid #e7ebf0;
  border-top: none;
  border-radius: 0;
  padding: 18px 20px;
  margin-bottom: 0;
}
.form-section:last-of-type {
  border-bottom: 1px solid #e7ebf0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}
.section-title {
  position: relative;
  padding-left: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  background: #165dff;
  transform: translateY(-50%);
}

.segment-card {
  background: #f7f9fc;
  border-left: 3px solid #2d67f4;
  border-radius: 0;
  padding: 12px 14px 12px 18px;
  margin-bottom: 12px;
  position: relative;
}
.segment-card::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 18px;
  width: 9px; height: 9px;
  border-radius: 50%;
  background: #2d67f4;
  box-shadow: 0 0 0 4px #edf3ff;
}
.segment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.segment-header strong {
  font-size: 14px;
  color: #1f2d3d;
}
.seg-route {
  flex: 1;
  font-size: 13px;
  color: #606266;
}
.segment-actions {
  display: flex;
  gap: 4px;
}
.cargo-summary, .subplan-summary {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #eef0f5;
  font-size: 13px;
}
.summary-label {
  color: #909399;
  margin-right: 6px;
}
.cargo-summary em {
  font-style: normal;
  color: #909399;
}

.amount {
  color: #f53f3f;
  font-size: 16px;
  font-weight: 600;
}

.fee-formula {
  padding: 10px 14px;
  background: #f2f6ff;
  border-radius: 4px;
  font-size: 13px;
  color: #1f2d3d;
}

.extra-fee-block {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #eef0f5;
}
.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.page-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: #fff;
  border-top: 1px solid #e7ebf0;
  z-index: 10;
}
.footer-info {
  margin-right: auto;
  font-size: 13px;
  color: #909399;
}

.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.drawer-item {
  display: flex;
  padding: 12px;
  background: #f7f9fc;
  border-radius: 4px;
  width: 100%;
  margin: 0;
}
.drawer-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}
.drawer-item-main strong {
  font-size: 13px;
  color: #1f2d3d;
}
.drawer-item-main span {
  font-size: 12px;
  color: #606266;
}
.drawer-item-main em {
  font-size: 12px;
  color: #909399;
  font-style: normal;
}

.subplan-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}
.subplan-detail span {
  color: #909399;
  display: inline-block;
  width: 100px;
}
</style>
