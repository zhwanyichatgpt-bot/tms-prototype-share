<template>
  <div class="plan-create-page">
    <BackBar current-title="集装箱运输计划创建" />
    <!-- 页头 -->
    <header class="page-header">
      <div class="header-left">
        <span class="breadcrumb">公路计划管理 / 集装箱运输计划 / 新建</span>
        <h1 class="page-title">新建集装箱运输计划</h1>
      </div>
      <div class="header-right">
        <el-radio-group v-model="mode" size="small" @change="onModeChange">
          <el-radio-button label="independent">独立创建</el-radio-button>
          <el-radio-button label="intermodal">联运来源子计划</el-radio-button>
        </el-radio-group>
      </div>
    </header>

    <div class="page-body">
      <!-- 基础信息区 -->
      <section class="form-section">
        <h3 class="section-title">基础信息</h3>
        <el-form :model="baseInfo" label-width="100px" label-position="right">
          <el-row :gutter="16">
            <el-col :span="6" v-if="mode === 'independent'">
              <el-form-item label="关联托运单">
                <el-input
                  :model-value="baseInfo.orderRef"
                  placeholder="点击选择托运单"
                  readonly
                  @click="openOrderDrawer"
                >
                  <template #append v-if="baseInfo.orderRef">
                    <el-button link @click.stop="baseInfo.orderRef = ''">清空</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="计划名称" required>
                <el-input v-model="baseInfo.planName" maxlength="100" placeholder="请输入计划名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="托运企业" required>
                <el-select v-model="baseInfo.shipperCompany" :disabled="mode === 'intermodal'" style="width: 100%">
                  <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系人">
                <el-input v-model="baseInfo.contactName" maxlength="50" :readonly="mode === 'intermodal'" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话">
                <el-input v-model="baseInfo.contactPhone" maxlength="20" :readonly="mode === 'intermodal'" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="baseInfo.remark" type="textarea" :rows="2" maxlength="200" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 联运来源信息面板 -->
        <div v-if="mode === 'intermodal'" class="source-panel">
          <div class="source-card">
            <div class="source-label">来源类型</div>
            <div class="source-value">{{ sourceInfo.sourceType }}</div>
          </div>
          <div class="source-card">
            <div class="source-label">联运主计划</div>
            <div class="source-value">{{ sourceInfo.multimodalPlan }}</div>
          </div>
          <div class="source-card">
            <div class="source-label">路段</div>
            <div class="source-value">{{ sourceInfo.segment }}</div>
          </div>
          <div class="source-card">
            <div class="source-label">路段起点 / 终点</div>
            <div class="source-value">{{ sourceInfo.segmentStart }} → {{ sourceInfo.segmentEnd }}</div>
          </div>
        </div>
      </section>

      <!-- 路线骨架区（仅独立模式） -->
      <section v-if="mode === 'independent'" class="form-section">
        <h3 class="section-title">路线骨架</h3>
        <el-form :inline="true" :model="routeSkeleton" label-width="100px">
          <el-form-item label="集装箱来源" required>
            <el-radio-group v-model="routeSkeleton.containerSource">
              <el-radio v-for="o in containerSourceOptions" :key="o.value" :label="o.value">{{ o.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="运输路线" required>
            <el-radio-group v-model="routeSkeleton.template" @change="onTemplateChange">
              <el-radio v-for="o in routeTemplateOptions" :key="o.value" :label="o.value">{{ o.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 路线节点区 -->
      <section class="form-section">
        <div class="section-header">
          <h3 class="section-title">路线节点</h3>
          <el-button type="primary" link @click="addNode">+ 新增节点</el-button>
        </div>
        <div class="route-timeline">
          <div v-for="(node, index) in nodesWithBridge" :key="node.id" class="route-node">
            <span class="timeline-dot" :class="{ bridge: node.autoBridge }" />
            <div class="node-panel" :class="{ 'auto-bridge': node.autoBridge }">
              <div class="node-toolbar">
                <el-tag size="small" :type="nodeTagType(node)">{{ nodeTypeLabel[node.type] }}</el-tag>
                <el-select
                  v-if="!node.autoBridge"
                  v-model="node.type"
                  size="small"
                  placeholder="节点类型"
                  style="width: 110px"
                  @change="onNodeTypeChange(node)"
                >
                  <el-option
                    v-for="t in availableNextTypes(index)"
                    :key="t"
                    :label="nodeTypeLabel[t]"
                    :value="t"
                  />
                </el-select>
                <el-select
                  v-model="node.addressId"
                  size="small"
                  placeholder="选择地址"
                  :disabled="node.autoBridge"
                  style="width: 280px"
                >
                  <el-option v-for="a in addresses" :key="a.id" :label="a.name" :value="a.id" />
                </el-select>
                <el-date-picker
                  v-model="node.plannedTime"
                  type="datetime"
                  size="small"
                  placeholder="预计时间"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm"
                  style="width: 200px"
                />
                <el-input v-model="node.contactName" placeholder="联系人" size="small" style="width: 120px" />
                <el-input v-model="node.contactPhone" placeholder="联系电话" size="small" style="width: 130px" />
                <el-button v-if="!node.autoBridge" type="danger" link size="small" @click="removeNode(node.id)">删除</el-button>
              </div>
              <!-- 甩挂（仅 load/unload 手动节点） -->
              <div v-if="!node.autoBridge && (node.type === 'load' || node.type === 'unload')" class="node-extra">
                <el-checkbox v-model="node.sling" @change="onSlingChange(node)">甩挂</el-checkbox>
                <template v-if="node.sling">
                  <el-checkbox v-model="node.leaveTrailer">留车架</el-checkbox>
                  <el-input v-model="node.trailerNo" placeholder="车架号（选填）" size="small" style="width: 160px" />
                </template>
              </div>
            </div>
          </div>
          <el-empty v-if="!nodesWithBridge.length" description="暂无节点，请添加" />
        </div>
      </section>

      <!-- 集装箱信息区 -->
      <section class="form-section">
        <div class="section-header">
          <h3 class="section-title">集装箱信息</h3>
          <el-button type="primary" link @click="addContainerDraft">+ 新增箱型</el-button>
        </div>
        <el-alert
          v-if="duplicateContainers.length"
          type="warning"
          :closable="false"
          show-icon
          :title="`检测到重复箱型组合：${duplicateContainers.join('、')}，建议合并数量后填写；如确需保留请继续`"
          style="margin-bottom: 12px"
        />
        <el-table :data="containers" border size="small">
          <el-table-column label="箱型" width="120">
            <template #default="{ row }">
              <el-select v-model="row.containerType" size="small" style="width: 100%">
                <el-option v-for="t in containerTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="尺寸" width="100">
            <template #default="{ row }">
              <el-select v-model="row.containerSize" size="small" style="width: 100%">
                <el-option v-for="s in containerSizes" :key="s" :label="s" :value="s" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :controls="false" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="货品名称" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.cargoName" maxlength="50" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="预估重量(吨)" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.estimatedWeight" :min="0" :step="0.1" :controls="false" size="small" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.remark" maxlength="100" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeContainer($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 行内新增草稿 -->
        <div v-if="containerAdding" class="container-draft-row">
          <el-select v-model="containerDraft.containerType" size="small" placeholder="箱型" style="width: 110px">
            <el-option v-for="t in containerTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="containerDraft.containerSize" size="small" placeholder="尺寸" style="width: 90px">
            <el-option v-for="s in containerSizes" :key="s" :label="s" :value="s" />
          </el-select>
          <el-input-number v-model="containerDraft.quantity" :min="1" :controls="false" size="small" placeholder="数量" style="width: 90px" />
          <el-input v-model="containerDraft.cargoName" size="small" placeholder="货品名称" style="width: 160px" />
          <el-input-number v-model="containerDraft.estimatedWeight" :min="0" :step="0.1" :controls="false" size="small" placeholder="重量" style="width: 110px" />
          <el-button type="primary" size="small" @click="confirmAddContainer">新增</el-button>
          <el-button size="small" @click="cancelAddContainer">取消</el-button>
        </div>
      </section>

      <!-- 费用信息区 -->
      <section class="form-section">
        <h3 class="section-title">费用信息</h3>
        <el-row :gutter="16">
          <!-- 托运企业费用（联运模式锁定禁用） -->
          <el-col :span="12">
            <div class="fee-card" :class="{ disabled: mode === 'intermodal' }">
              <div class="fee-header">
                <span>托运企业费用</span>
                <el-switch v-model="fees.customer.enabled" :disabled="mode === 'intermodal'" />
              </div>
              <div v-if="mode === 'intermodal'" class="fee-locked-tip">联运来源计划不支持客户费用配置</div>
              <FeeForm
                v-else-if="fees.customer.enabled"
                :fee="fees.customer"
                :container-groups="containerFeeGroups"
                :plan-distance-km="planDistanceKm"
              />
            </div>
          </el-col>
          <!-- 承运商费用 -->
          <el-col :span="12">
            <div class="fee-card">
              <div class="fee-header">
                <span>承运商费用</span>
                <el-switch v-model="feees_carrier_enabled" />
              </div>
              <FeeForm
                v-if="feees_carrier_enabled"
                :fee="fees.carrier"
                :container-groups="containerFeeGroups"
                :plan-distance-km="planDistanceKm"
              />
            </div>
          </el-col>
        </el-row>
      </section>
    </div>

    <!-- 底部操作栏 -->
    <footer class="page-footer">
      <el-button @click="saveDraft">保存草稿</el-button>
      <el-button type="primary" :loading="submitting" @click="submitPlan">提交计划</el-button>
    </footer>

    <!-- 托运单抽屉 -->
    <el-drawer v-model="orderDrawerVisible" title="选择关联托运单" direction="rtl" size="500px">
      <div class="drawer-filter">
        <el-input v-model="orderKeyword" placeholder="按编号/路线/托运企业搜索" size="small" clearable />
      </div>
      <el-radio-group v-model="selectedOrderId" class="drawer-list">
        <el-radio
          v-for="o in filteredOrderDrawer"
          :key="o.id"
          :label="o.id"
          class="drawer-item"
        >
          <div class="drawer-item-main">
            <strong>{{ o.id }}</strong>
            <span>{{ o.route }} · {{ o.shipperCompany }}</span>
            <em>{{ o.contactName }} {{ o.contactPhone }}</em>
          </div>
        </el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="orderDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmOrder">确认</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, h } from 'vue'
import { ElMessage } from 'element-plus'
import BackBar from '../../src/components/BackBar.vue'
import {
  scenarioIndependent, scenarioIntermodal,
  companies, addresses, containerTypes, containerSizes,
  nodeTypes, nodeTypeLabel, START_TYPES, END_TYPES, allowedNextTypesFromNode,
  containerSourceOptions, routeTemplateOptions, feeRules, feeTax, distanceBasis,
  orderDrawerOrders,
} from './mock-data'
import FeeForm from './FeeForm.vue'

// ============ 全局状态 ============
const mode = ref('independent')
const submitting = ref(false)

let scenario = JSON.parse(JSON.stringify(scenarioIndependent))
const sourceInfo = reactive({ ...scenario.sourceInfo })
const baseInfo = reactive({ ...scenario.baseInfo })
const routeSkeleton = reactive({ ...scenario.routeSkeleton })
const nodes = ref(scenario.nodes.map(n => ({ ...n })))
const containers = ref(scenario.containers.map(c => ({ ...c })))
const fees = reactive({
  customer: { ...scenario.fees.customer, boxUnitPrices: { ...scenario.fees.customer.boxUnitPrices } },
  carrier: { ...scenario.fees.carrier, boxUnitPrices: { ...scenario.fees.carrier.boxUnitPrices } },
})
const planDistanceKm = ref(scenario.planDistanceKm)

// 承运商费用开关（别名映射，避免改 fees.carrier.enabled 直接渲染问题）
const feees_carrier_enabled = computed({
  get: () => fees.carrier.enabled,
  set: v => { fees.carrier.enabled = v },
})

// ============ 模式切换 ============
function onModeChange(m) {
  scenario = JSON.parse(JSON.stringify(m === 'independent' ? scenarioIndependent : scenarioIntermodal))
  Object.assign(sourceInfo, scenario.sourceInfo)
  Object.assign(baseInfo, scenario.baseInfo)
  Object.assign(routeSkeleton, scenario.routeSkeleton)
  nodes.value = scenario.nodes.map(n => ({ ...n }))
  containers.value = scenario.containers.map(c => ({ ...c }))
  Object.assign(fees.customer, scenario.fees.customer, { boxUnitPrices: { ...scenario.fees.customer.boxUnitPrices } })
  Object.assign(fees.carrier, scenario.fees.carrier, { boxUnitPrices: { ...scenario.fees.carrier.boxUnitPrices } })
  planDistanceKm.value = scenario.planDistanceKm
  syncBridgeNodes()
}

// ============ 模板切换 ============
function onTemplateChange(tpl) {
  if (tpl === 'custom') {
    // 自定义不清空
    return
  }
  const [startType, endType] = tpl.split('-')
  nodes.value = [
    { id: `n-${Date.now()}-1`, type: startType, addressId: '', plannedTime: '', contactName: '', contactPhone: '', sling: false, leaveTrailer: false, trailerNo: '' },
    { id: `n-${Date.now()}-2`, type: 'load', addressId: '', plannedTime: '', contactName: '', contactPhone: '', sling: false, leaveTrailer: false, trailerNo: '' },
    { id: `n-${Date.now()}-3`, type: 'unload', addressId: '', plannedTime: '', contactName: '', contactPhone: '', sling: false, leaveTrailer: false, trailerNo: '' },
    { id: `n-${Date.now()}-4`, type: endType, addressId: '', plannedTime: '', contactName: '', contactPhone: '', sling: false, leaveTrailer: false, trailerNo: '' },
  ]
  syncBridgeNodes()
}

// ============ 节点流转规则 ============
function availableNextTypes(index) {
  // 找到第 index 个手动节点的前一个手动节点
  const manualNodes = nodes.value.filter(n => !n.autoBridge)
  const current = manualNodes[index]
  if (!current) return nodeTypes.map(t => t.value)
  // 第一节点只能起始
  if (index === 0) return START_TYPES
  const prev = manualNodes[index - 1]
  let allowed = allowedNextTypesFromNode[prev.type] || []
  // 末节点限制
  return allowed
}

function nodeTagType(node) {
  if (node.autoBridge) return 'warning'
  if (START_TYPES.includes(node.type)) return 'success'
  if (END_TYPES.includes(node.type)) return 'info'
  return 'primary'
}

function onNodeTypeChange(node) {
  if (node.type !== 'load' && node.type !== 'unload') {
    node.sling = false
    node.leaveTrailer = false
    node.trailerNo = ''
  }
  syncBridgeNodes()
}

function onSlingChange(node) {
  if (!node.sling) {
    node.leaveTrailer = false
    node.trailerNo = ''
  }
  syncBridgeNodes()
}

// ============ 甩挂承接型提挂节点生成 ============
const nodesWithBridge = computed(() => {
  // 每次读取时基于 nodes（手动）计算 + 承接型提挂插入
  const result = []
  nodes.value.forEach(node => {
    if (node.autoBridge) return // 跳过旧的
    result.push(node)
    if ((node.type === 'load' || node.type === 'unload') && node.sling) {
      result.push({
        id: `bridge-${node.id}`,
        type: 'pickupBridge',
        addressId: node.addressId,
        plannedTime: '',
        contactName: node.contactName,
        contactPhone: node.contactPhone,
        sling: false, leaveTrailer: false, trailerNo: '',
        autoBridge: true,
        sourceNodeId: node.id,
      })
    }
  })
  return result
})

function syncBridgeNodes() {
  // 触发响应式（nodesWithBridge 是 computed）
  nodes.value = nodes.value.filter(n => !n.autoBridge)
}

// ============ 节点增删 ============
function addNode() {
  const manual = nodes.value.filter(n => !n.autoBridge)
  const last = manual[manual.length - 1]
  if (last) {
    const allowed = allowedNextTypesFromNode[last.type] || []
    if (!allowed.length) {
      ElMessage.warning(`当前末节点「${nodeTypeLabel[last.type]}」无合法后续节点类型`)
      return
    }
  }
  nodes.value.push({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: '', addressId: '', plannedTime: '', contactName: '', contactPhone: '',
    sling: false, leaveTrailer: false, trailerNo: '',
  })
}

function removeNode(id) {
  const idx = nodes.value.findIndex(n => n.id === id)
  if (idx >= 0) nodes.value.splice(idx, 1)
}

// ============ 集装箱 ============
const containerAdding = ref(false)
const containerDraft = reactive({
  containerType: 'gp', containerSize: '20尺', quantity: 1, cargoName: '', estimatedWeight: 0, remark: '',
})

function addContainerDraft() {
  Object.assign(containerDraft, { containerType: 'gp', containerSize: '20尺', quantity: 1, cargoName: '', estimatedWeight: 0, remark: '' })
  containerAdding.value = true
}
function confirmAddContainer() {
  if (!containerDraft.containerType || !containerDraft.containerSize || !containerDraft.quantity || !containerDraft.cargoName) {
    ElMessage.warning('请补齐箱型/尺寸/数量/货品名称')
    return
  }
  containers.value.push({ id: `c-${Date.now()}`, ...containerDraft })
  containerAdding.value = false
}
function cancelAddContainer() {
  containerAdding.value = false
}
function removeContainer(idx) {
  containers.value.splice(idx, 1)
}

// 重复箱型检测
const duplicateContainers = computed(() => {
  const counts = {}
  containers.value.forEach(c => {
    const key = `${c.containerType}_${c.containerSize}`
    counts[key] = (counts[key] || 0) + 1
  })
  const dups = []
  for (const key in counts) {
    if (counts[key] > 1) {
      const [t, s] = key.split('_')
      const tLabel = containerTypes.find(ct => ct.value === t)?.label || t
      dups.push(`${tLabel} ${s}`)
    }
  }
  return dups
})

// 费用分组（按箱型+尺寸合计数量）
const containerFeeGroups = computed(() => {
  const map = {}
  containers.value.forEach(c => {
    const key = `${c.containerType}_${c.containerSize}`
    if (!map[key]) {
      map[key] = { type: c.containerType, typeLabel: containerTypes.find(t => t.value === c.containerType)?.label || c.containerType, size: c.containerSize, count: 0 }
    }
    map[key].count += Number(c.quantity) || 0
  })
  return Object.values(map)
})

// ============ 托运单抽屉 ============
const orderDrawerVisible = ref(false)
const orderKeyword = ref('')
const selectedOrderId = ref('')

const filteredOrderDrawer = computed(() => {
  if (!orderKeyword.value) return orderDrawerOrders
  const k = orderKeyword.value.toLowerCase()
  return orderDrawerOrders.filter(o =>
    o.id.toLowerCase().includes(k) ||
    o.route.toLowerCase().includes(k) ||
    o.shipperCompany.toLowerCase().includes(k)
  )
})

function openOrderDrawer() {
  selectedOrderId.value = baseInfo.orderRef
  orderDrawerVisible.value = true
}
function confirmOrder() {
  const o = orderDrawerOrders.find(x => x.id === selectedOrderId.value)
  if (o) {
    baseInfo.orderRef = o.id
    baseInfo.shipperCompany = o.shipperCompany
    baseInfo.contactName = o.contactName
    baseInfo.contactPhone = o.contactPhone
  }
  orderDrawerVisible.value = false
}

// ============ 提交校验 ============
function validateContainers() {
  if (!containers.value.length) return '请至少添加一条集装箱信息'
  for (let i = 0; i < containers.value.length; i++) {
    const c = containers.value[i]
    if (!c.containerType) return `第 ${i + 1} 行箱型未选`
    if (!c.containerSize) return `第 ${i + 1} 行尺寸未选`
    if (!c.quantity || c.quantity <= 0) return `第 ${i + 1} 行数量必须大于 0`
    if (!c.cargoName) return `第 ${i + 1} 行货品名称必填`
  }
  return null
}

function validateRoute() {
  const manual = nodes.value.filter(n => !n.autoBridge)
  if (manual.length < 2) return '路线节点至少需要 2 个手动节点'
  if (!START_TYPES.includes(manual[0].type)) return '首节点只能是提空 / 提重'
  if (!END_TYPES.includes(manual[manual.length - 1].type)) return '末节点必须是还空 / 还重'
  const addrSeen = new Set()
  for (let i = 0; i < manual.length; i++) {
    const n = manual[i]
    if (!n.type) return `第 ${i + 1} 个节点类型未选`
    if (!n.addressId) return `第 ${i + 1} 个节点地址未选`
    if (addrSeen.has(n.addressId)) return `第 ${i + 1} 个节点地址与前面节点重复`
    addrSeen.add(n.addressId)
    if (i > 0) {
      const allowed = allowedNextTypesFromNode[manual[i - 1].type] || []
      if (!allowed.includes(n.type)) return `第 ${i + 1} 个节点类型 ${nodeTypeLabel[n.type]} 不能跟在 ${nodeTypeLabel[manual[i - 1].type]} 之后`
    }
  }
  return null
}

function validateFees() {
  // 联运模式跳过客户费用
  const checkFee = (fee, name) => {
    if (!fee.enabled) return null
    if (!fee.rule) return `${name}：请选择计费规则`
    if (!fee.tax) return `${name}：请选择税务`
    if (fee.rule === 'byBox') {
      for (const g of containerFeeGroups.value) {
        const price = fee.boxUnitPrices[`${g.type}_${g.size}`]
        if (!price) return `${name}：${g.typeLabel} ${g.size} 单价未填`
      }
    } else if (fee.rule === 'byDistance') {
      if (!fee.distanceBasis) return `${name}：请选择计费依据`
      if (!fee.unitPrice) return `${name}：请填运输单价`
    } else if (fee.rule === 'byTruck') {
      if (!fee.truckCount || fee.truckCount <= 0) return `${name}：请填计费车次`
      if (!fee.unitPrice) return `${name}：请填单车单价`
    }
    return null
  }
  if (mode.value !== 'intermodal') {
    const e = checkFee(fees.customer, '托运企业费用')
    if (e) return e
  }
  const e2 = checkFee(fees.carrier, '承运商费用')
  if (e2) return e2
  return null
}

function saveDraft() {
  if (!baseInfo.planName || !baseInfo.planName.trim()) {
    ElMessage.warning('请输入计划名称')
    return
  }
  // 草稿持久化（仅模拟）
  ElMessage.success('草稿已保存')
}

function submitPlan() {
  if (!baseInfo.planName || !baseInfo.planName.trim()) {
    ElMessage.warning('请输入计划名称')
    return
  }
  const cErr = validateContainers()
  if (cErr) return ElMessage.warning(cErr)
  const rErr = validateRoute()
  if (rErr) return ElMessage.warning(rErr)
  const fErr = validateFees()
  if (fErr) return ElMessage.warning(fErr)

  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    if (duplicateContainers.value.length) {
      ElMessage.warning(`提交成功，但存在重复箱型组合：${duplicateContainers.value.join('、')}，建议合并`)
    } else {
      ElMessage.success('提交成功')
    }
  }, 900)
}
</script>

<style scoped>
.plan-create-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fb 0%, #f2f4f8 100%);
  padding: 20px 24px 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(28, 46, 86, 0.04);
  margin-bottom: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.breadcrumb {
  font-size: 12px;
  color: #909399;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0;
}

.page-body {
  padding: 16px 24px;
}

.form-section {
  background: #fff;
  border: 1px solid #e7ebf0;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(28, 46, 86, 0.04);
}

.section-title {
  position: relative;
  padding-left: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin: 0 0 16px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 14px;
  background: #2468f2;
  transform: translateY(-50%);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-header .section-title {
  margin: 0;
}

.source-panel {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: #f7f9fc;
  border-radius: 4px;
  border: 1px dashed #d5dfeb;
}
.source-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.source-label {
  font-size: 12px;
  color: #909399;
}
.source-value {
  font-size: 13px;
  color: #1f2d3d;
  font-weight: 500;
}

.route-timeline {
  position: relative;
  padding-left: 24px;
}
.route-timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 12px;
  bottom: 12px;
  border-left: 2px dotted #c7d2e3;
}
.route-node {
  position: relative;
  margin-bottom: 14px;
}
.timeline-dot {
  position: absolute;
  left: -22px;
  top: 14px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #2468f2;
  box-shadow: 0 0 0 4px rgba(36, 104, 242, 0.12);
  z-index: 1;
  z-index: 1;
}
.timeline-dot.bridge {
  border-color: #f2870b;
  background: #fff7e6;
}
.node-panel {
  border: 1px solid #e7ebf0;
  border-radius: 4px;
  background: #fff;
  padding: 12px;
}
.node-panel.auto-bridge {
  background: #fffbe6;
  border-color: #ffe58f;
}
.node-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.node-extra {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eef0f5;
  display: flex;
  align-items: center;
  gap: 14px;
}

.container-draft-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: #f7f9fc;
  border-radius: 4px;
  flex-wrap: wrap;
}

.fee-card {
  background: #fff;
  border: 1px solid #e7ebf0;
  border-radius: 4px;
  padding: 14px;
  min-height: 200px;
}
.fee-card.disabled {
  background: #f7f9fc;
  opacity: 0.7;
}
.fee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eef0f5;
}
.fee-locked-tip {
  font-size: 12px;
  color: #909399;
  padding: 20px 0;
  text-align: center;
}
.fee-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fee-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fee-label {
  width: 80px;
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}
.fee-value {
  font-size: 13px;
  color: #1f2d3d;
}
.box-price-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.box-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.box-price-row span {
  flex: 1;
}
.unit {
  font-size: 12px;
  color: #909399;
}
.fee-estimate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f2f6ff;
  border-radius: 4px;
  margin-top: 6px;
}
.fee-estimate strong {
  color: #f53f3f;
  font-size: 16px;
}

.page-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e7ebf0;
  box-shadow: 0 -2px 12px rgba(20, 32, 56, 0.05);
  z-index: 10;
}

.drawer-filter {
  margin-bottom: 12px;
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
</style>
