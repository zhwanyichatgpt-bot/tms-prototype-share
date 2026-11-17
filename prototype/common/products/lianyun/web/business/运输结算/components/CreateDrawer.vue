<script setup>
/**
 * 新建运输核算单 —— 复刻真实系统全屏抽屉
 * 支持被 AI 工作台嵌入：传入 draft 时展示 AI 汇总的核算运单与结算总额
 */
import { computed, ref, watch } from 'vue'
import { ElButton, ElDialog, ElInput, ElInputNumber, ElTable, ElTableColumn } from 'element-plus'
import { partyOptions } from '../mock-data'
import WaybillPicker from './WaybillPicker.vue'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  draft: { type: Object, default: null },
  diffOnly: { type: Boolean, default: false },
  workflowPhase: String,
  comparison: Boolean,
  confirmBlocked: Boolean,
  submitted: Boolean,
  driverMode: Boolean,
  allowDriverMode: Boolean,
  pickerRows: Array,
  selectedWaybills: Array,
})

const emit = defineEmits(['close', 'notice', 'confirm', 'update-row', 'update-meta', 'scope', 'select-waybills', 'choose-driver'])

const asset = (name) => `/transport-settlement-assets/${name}`

const settleObject = ref(props.driverMode ? '司机' : (props.draft?.settleObject || '托运方'))
const objectMenu = ref(false)
const party = ref(props.draft?.party || '')
const partyMenu = ref(false)
const settleDate = ref(props.draft?.settleDate || '')
const remark = ref(props.draft?.remark || '')
const pickerOpen = ref(false)
const feeItemsByRow = ref({})
const feeDialogOpen = ref(false)
const feeTarget = ref(null)
const feeItems = ref([])
const feeError = ref('')
const feeLabels = { deduction: '扣减', subsidy: '补贴' }
const emptyFee = () => ({ name: '', amount: undefined, remark: '' })
const cents = value => Math.round(value * 100)
const sumFees = items => (items || []).reduce((sum, item) => sum + cents(item.amount), 0)

watch(() => props.draft, value => {
  if (!value || props.driverMode) return
  settleObject.value = value.settleObject || '托运方'
  party.value = value.party || ''
  settleDate.value = value.settleDate || ''
  remark.value = value.remark || ''
})

const partyLabel = computed(() => {
  if (settleObject.value === '承运方') return '承运方'
  return '托运方'
})

const partyPlaceholder = computed(() => {
  if (settleObject.value === '承运方') return '请选择承运企业'
  return '请选择托运企业'
})

const workflow = computed(() => props.embedded && Boolean(props.workflowPhase))
const editable = computed(() => workflow.value && props.workflowPhase === 'draft' && !props.submitted)

function summarizeRows(rows) {
  const sum = field => Math.round(rows.reduce((total, row) => total + Number(row[field] || 0), 0) * 100) / 100
  return { totalLoad: sum('load'), totalUnload: sum('unload'), totalBasic: sum('basic'), loss: sum('loss'), total: sum('amount') }
}

const planGroups = computed(() => {
  const plans = props.draft?.plans?.length ? props.draft.plans : [{ id: 'all', name: '石灰石（散装）', number: `QYCG-${props.draft?.rows?.[0]?.id || ''}` }]
  return plans.map(plan => {
    const allRows = (props.draft?.rows || []).filter(row => plan.id === 'all' || row.planId === plan.id)
    const rows = visibleRows.value.filter(row => plan.id === 'all' || row.planId === plan.id)
    const prices = [...new Set(allRows.map(row => row.price))]
    return { ...plan, rows, priceText: prices.length === 1 ? prices[0] : '按运单单价', summary: summarizeRows(allRows) }
  })
})

const accountingCards = computed(() => {
  if (!props.driverMode) return [{ id: 'plans', groups: planGroups.value }]
  return (props.draft?.cards || []).map(card => {
    const groups = card.groups.map(group => {
      const rows = group.rows.map(row => {
        const fees = feeItemsByRow.value[row.id]
        const deduction = sumFees(fees?.deduction)
        const subsidy = sumFees(fees?.subsidy)
        return { ...row, deduction: deduction / 100, subsidy: subsidy / 100, amount: (cents(row.amount) + subsidy - deduction) / 100 }
      })
      return { ...group, rows, summary: summarizeRows(rows) }
    })
    const total = groups.reduce((sum, group) => sum + cents(group.summary.total), 0) / 100
    return { ...card, groups, total }
  })
})
const numericText = value => value === '' || !Number.isFinite(Number(value)) ? '' : Number(value).toFixed(2)
function editRow(row, field, event) {
  const value = event.target.value === '' ? '' : Number(event.target.value)
  event.target.value = numericText(value)
  emit('update-row', { id: row.id, field, value })
}
function changeDate(event) { settleDate.value = event.target.value; emit('update-meta', { field: 'settleDate', value: settleDate.value }) }
const isDraft = computed(() => Boolean(props.driverMode ? props.draft?.cards?.length : props.draft?.rows?.length))
const billingBasis = computed(() => {
  if (props.draft?.basis === 'loaded') return '装货量'
  if (props.draft?.basis === 'custom') return '确认后的计价量'
  return props.draft?.basis === 'theirs' ? '回单重量' : '卸货重量'
})
const visibleRows = computed(() => {
  const rows = props.draft?.rows || []
  return props.diffOnly ? rows.filter(row => row.flag && row.flag !== '重复') : rows
})
const totalText = computed(() => {
  const value = props.driverMode
    ? accountingCards.value.reduce((sum, card) => sum + cents(card.total), 0) / 100
    : (props.draft?.total || 0)
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const money = value => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function chooseParty(value) {
  party.value = value
  partyMenu.value = false
}

function chooseObject(value) {
  objectMenu.value = false
  if (value === '司机') {
    emit('choose-driver')
    return
  }
  settleObject.value = value
  party.value = ''
}

function addWaybill() {
  if (props.driverMode) {
    pickerOpen.value = true
    return
  }
  if (isDraft.value) {
    emit('notice', workflow.value ? '本次核算运单已由至小简汇总，可直接在上方表格核对' : '请返回待结算列表调整所选运单')
    return
  }
  if (!party.value) {
    emit('notice', '请选择结算对象')
    return
  }
  pickerOpen.value = true
}

function batchAdd(type) {
  if (props.driverMode) {
    emit('notice', isDraft.value ? '当前可核对运单计费明细' : '请先添加核算运单')
    return
  }
  if (!party.value) {
    emit('notice', '请选择结算对象')
    return
  }
  emit('notice', `请先添加核算运单，再批量添加${type}`)
}

function updateDriverWaybills(rows) {
  const retained = new Set(rows.flatMap(row => [row.id, ...row.tasks.map(task => task.id)]))
  feeItemsByRow.value = Object.fromEntries(Object.entries(feeItemsByRow.value).filter(([id]) => retained.has(id)))
  emit('select-waybills', rows)
  pickerOpen.value = false
}

function removeWaybill(id) {
  updateDriverWaybills(props.selectedWaybills.filter(row => row.id !== id))
}

function openFeeDialog(row, type) {
  const saved = feeItemsByRow.value[row.id]?.[type] || []
  feeTarget.value = { id: row.id, type }
  feeItems.value = saved.length ? saved.map(item => ({ ...item })) : [emptyFee()]
  feeError.value = ''
  feeDialogOpen.value = true
}

function confirmFees() {
  const invalidIndex = feeItems.value.findIndex(item => !item.name.trim() || !Number.isFinite(item.amount) || cents(item.amount) <= 0)
  if (invalidIndex >= 0) {
    feeError.value = `第 ${invalidIndex + 1} 行请填写项目名称及大于 0 的金额`
    return
  }
  const { id, type } = feeTarget.value
  feeItemsByRow.value[id] = {
    ...feeItemsByRow.value[id],
    [type]: feeItems.value.map(item => ({ ...item, name: item.name.trim() })),
  }
  feeDialogOpen.value = false
}
</script>

<template>
  <div class="ts-drawer" :data-annotation-container="driverMode && !pickerOpen && !feeDialogOpen ? 'drawer' : undefined" :class="{ 'is-embedded': embedded, 'ts-collaboration': workflow }">
    <div class="ts-drawer-head">
      <div class="ts-crumb">
        <span class="ts-crumb-link">运输结算</span>
        <span class="ts-crumb-sep">&gt;</span>
        <span>新建运输核算单</span>
      </div>
      <button class="ts-close" type="button" @click="emit('close')">×</button>
    </div>

    <div class="ts-drawer-body" :data-annotation-content="driverMode && !pickerOpen && !feeDialogOpen ? 'drawer' : undefined">
      <div class="ts-section-title first">基础信息</div>

      <div class="ts-form" :class="{ 'annot-transportSettlement-rule-responsibility': driverMode && !pickerOpen && !feeDialogOpen }">
        <div class="ts-form-item">
          <label>结算对象</label>
          <div class="ts-field" :class="{ 'is-locked': workflow || driverMode }" @click="!workflow && !driverMode && (objectMenu = !objectMenu)">
            <span class="ts-field-value">{{ driverMode ? '司机' : settleObject }}</span>
            <span v-if="!driverMode" class="ts-field-caret" />
            <div v-if="objectMenu" class="ts-select-pop">
              <div
                v-for="item in allowDriverMode ? ['托运方', '承运方', '司机'] : ['托运方', '承运方']"
                :key="item"
                class="ts-select-option"
                :class="{ selected: settleObject === item }"
                @click.stop="chooseObject(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="!driverMode" class="ts-form-item">
          <label><span class="req">*</span>{{ partyLabel }}</label>
          <div class="ts-field" :class="{ 'is-locked': workflow }" @click="!workflow && (partyMenu = !partyMenu)">
            <span class="ts-field-value" :class="{ placeholder: !party }">{{ party || partyPlaceholder }}</span>
            <span class="ts-field-caret" />
            <div v-if="partyMenu" class="ts-select-pop">
              <div
                v-for="item in partyOptions"
                :key="item"
                class="ts-select-option"
                :class="{ selected: party === item }"
                @click.stop="chooseParty(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <div class="ts-form-item">
          <label><span class="req">*</span>结算日期</label>
          <div class="ts-field">
            <span class="ts-field-value" :class="{ placeholder: !settleDate }">{{ settleDate || '选择结算日期' }}</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="flex: none">
              <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#c0c4cc" stroke-width="1.2" />
              <path d="M2 6.5H14M5.5 1.8V4M10.5 1.8V4" stroke="#c0c4cc" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            <input
              type="date"
              style="position: absolute; inset: 0; opacity: 0; cursor: pointer"
              :value="settleDate"
              :disabled="submitted"
              aria-label="结算日期"
              @change="changeDate"
            />
          </div>
        </div>

        <div class="ts-form-item">
          <label>结算总额</label>
          <div class="ts-field disabled">
            <span class="ts-field-value">{{ totalText }}</span>
          </div>
        </div>

        <div class="ts-form-item full">
          <label>备注</label>
          <div class="ts-textarea-wrap">
            <textarea v-model="remark" :disabled="submitted" aria-label="结算备注" maxlength="50" placeholder="请输入备注信息" @input="emit('update-meta', { field: 'remark', value: $event.target.value })" />
            <span class="ts-textarea-count">{{ remark.length }}/50</span>
          </div>
        </div>
      </div>

      <div class="ts-section-title ts-waybill-title">核算运单</div>

      <div class="ts-waybill-actions">
        <button class="ts-btn primary small" type="button" style="width: 98px" @click="addWaybill">添加核算运单</button>
        <button class="ts-btn default" type="button" style="width: 128px" @click="batchAdd('补贴项')">批量添加补贴项</button>
        <button class="ts-btn default" type="button" style="width: 128px" @click="batchAdd('扣减项')">批量添加扣减项</button>
        <span class="ts-formula">
          <i class="ts-info-icon">i</i>核算运费=基础运费+补贴金额-扣减金额-路耗
        </span>
      </div>

      <div v-if="isDraft" :class="{ 'annot-transportSettlement-rule-accounting-levels': driverMode && !pickerOpen && !feeDialogOpen }">
        <div v-for="card in accountingCards" :key="card.id" :class="{ 'ts-driver-card': driverMode }">
        <div v-if="driverMode" class="ts-wb-line ts-driver-card-heading">
          <strong>运单号：{{ card.id }}</strong>
          <span>{{ card.driver }} | {{ card.phone }} | {{ card.plate }}</span>
          <strong class="ts-driver-card-amount">{{ card.taskPricing ? '分段计费' : '整趟定价' }} · 本趟核算 {{ money(card.total) }}</strong>
          <span class="ts-wb-links"><button type="button" :aria-label="`移除 ${card.id}`" @click="removeWaybill(card.id)">删除</button></span>
        </div>
        <section v-for="group in card.groups" :key="group.id" v-show="group.rows.length || !diffOnly" class="ts-canonical-plan">
        <div class="ts-plan-strip">
          <span class="ts-plan-title">{{ group.title || `${group.name} | ${group.number}` }}</span>
          <span class="ts-plan-field">计费类型：<i>{{ group.billingType || '单位计费' }}</i></span>
          <span class="ts-plan-field">计费条件：<i>{{ group.condition || (draft.unit === '箱' ? '箱量' : '重量') }}</i></span>
          <span class="ts-plan-field">计费依据：<i>{{ group.basis || billingBasis }}</i></span>
          <span v-if="driverMode" class="ts-plan-formula">
            基础运费 = {{ card.taskPricing ? `${group.basis} × ${group.unitPrice} 元/吨` : money(group.summary.totalBasic) }}
          </span>
          <span v-else class="ts-plan-formula">基础运费= 计价量 * {{ group.priceText }} 元/{{ draft.unit || '吨' }}</span>
        </div>

        <div class="ts-drawer-table-wrap">
          <table class="ts-table ts-draft-table">
            <colgroup>
              <col style="width: 48px" />
              <col style="width: 60px" />
              <col style="width: 250px" />
              <col style="width: 180px" />
              <col style="width: 120px" />
              <col style="width: 120px" />
              <col style="width: 120px" />
              <col style="width: 200px" />
              <col style="width: 120px" />
              <col style="width: 180px" />
              <col style="width: 90px" />
              <col style="width: 100px" />
              <col style="width: 100px" />
              <col style="width: 110px" />
            </colgroup>
            <thead>
              <tr>
                <th><span class="ts-checkbox" /></th>
                <th>序号</th>
                <th>货品</th>
                <th>装卸点</th>
                <th>装卸重量(吨)</th>
                <th>装卸体积(m³)</th>
                <th>装卸数量</th>
                <th>路耗</th>
                <th>货品单价</th>
                <th>里程(km)</th>
                <th>基础运费</th>
                <th>其他扣减</th>
                <th>补贴金额</th>
                <th>核算运费</th>
              </tr>
            </thead>
            <tbody v-for="row in group.rows" :key="row.id">
              <tr v-if="!driverMode" class="ts-draft-waybill">
                <td colspan="14">
                  <div class="ts-wb-line">
                    <span class="ts-wb-title">运单号：{{ row.id }} | {{ row.driver }} | {{ row.phone }} | {{ row.plate }}</span>
                    <span v-if="row.manual" class="ts-flag-tag">人工调整</span><span v-else-if="row.flag" class="ts-flag-tag" :class="{ muted: row.flag === '重复' }">{{ row.flag }}</span>
                    <span class="ts-wb-links"><button type="button">详情</button><button type="button">删除</button></span>
                  </div>
                </td>
              </tr>
              <tr class="ts-draft-detail" :class="{ 'ts-draft-diff': row.flag && row.flag !== '重复' }">
                <td class="ts-center"><span class="ts-checkbox" /></td>
                <td class="ts-center">{{ row.seq }}</td>
                <td class="ts-draft-field">
                  <div class="ts-sub ts-sub-goods"><span class="ts-goods-box" />其他 | {{ row.goods }}</div>
                </td>
                <td class="ts-draft-field">
                  <div class="ts-sub">
                    <div class="ts-sub-line"><span class="ts-place-tag load">装</span>{{ row.loadPlace }}</div>
                    <div class="ts-sub-line"><span class="ts-place-tag unload">卸</span>{{ row.unloadPlace }}</div>
                  </div>
                </td>
                <td class="ts-draft-field">
                  <div class="ts-sub ts-sub-num">
                    <div class="ts-pair"><label>装</label><i>{{ row.unit === '箱' ? '' : row.load.toFixed(2) }}</i></div>
                    <div class="ts-pair"><label>卸</label><i>{{ row.unit === '箱' ? '' : row.unload.toFixed(2) }}</i></div>
                  </div>
                </td>
                <td class="ts-draft-field">
                  <div class="ts-sub ts-sub-num">
                    <div class="ts-pair"><label>装</label><i /></div>
                    <div class="ts-pair"><label>卸</label><i /></div>
                  </div>
                </td>
                <td class="ts-draft-field">
                  <div class="ts-sub ts-sub-num">
                    <div class="ts-pair"><label>装</label><i>{{ row.unit === '箱' ? row.load : '' }}</i></div>
                    <div class="ts-pair"><label>卸</label><i>{{ row.unit === '箱' ? row.unload : '' }}</i></div>
                  </div>
                </td>
                <td class="ts-loss">路耗金额：{{ money(row.loss) }}<br />耗损：0</td>
                <td class="ts-num">{{ driverMode ? '—' : `${row.goodsPrice ?? row.price} 元` }}</td>
                <td class="ts-mileage">计划：0.00<br />实际：0.00</td>
                <td class="ts-num">{{ money(row.basic) }}<label v-if="workflow" class="ts-canonical-rate">计费单价<input type="number" min="0" step="0.01" :value="numericText(row.price)" :disabled="!editable" :aria-label="`第${row.seq}条运单单价`" @change="editRow(row, 'price', $event)" /></label></td>
                <td class="ts-fee">
                  {{ driverMode ? money(row.deduction) : '0' }}
                  <button type="button" :aria-label="driverMode ? `${row.id} 添加扣减费用` : undefined" @click="driverMode && openFeeDialog(row, 'deduction')">添加费用</button>
                </td>
                <td class="ts-fee">
                  {{ driverMode ? money(row.subsidy) : '0' }}
                  <button type="button" :aria-label="driverMode ? `${row.id} 添加补贴费用` : undefined" @click="driverMode && openFeeDialog(row, 'subsidy')">添加费用</button>
                </td>
                <td class="ts-num ts-strong">{{ money(row.amount) }}</td>
              </tr>
            </tbody>
            <tfoot v-if="!driverMode">
              <tr class="ts-draft-total">
                <td colspan="2">合计</td>
                <td colspan="2" />
                <td>装：{{ group.summary.totalLoad.toFixed(2) }}<br />卸：{{ group.summary.totalUnload.toFixed(2) }}</td>
                <td>装：0.00<br />卸：0.00</td>
                <td>装：0.00<br />卸：0.00</td>
                <td>路耗：{{ money(group.summary.loss) }}</td>
                <td />
                <td>计划：0.00<br />实际：0.00</td>
                <td>{{ money(group.summary.totalBasic) }}</td>
                <td>0 元</td>
                <td>0 元</td>
                <td>{{ money(group.summary.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        </section>
        <div v-if="driverMode && card.taskPricing" class="ts-driver-card-total">合计核算运费　<strong>{{ money(card.total) }}</strong></div>
        </div>
        <p v-if="!driverMode" class="ts-draft-summary">
          共 {{ draft.totalRows }} 条运单 · 计入 {{ draft.count }} 条 · 计价量 {{ draft.weight.toFixed(2) }} {{ draft.unit || 't' }} · 路耗合计 {{ money(draft.loss) }} · 按{{ draft.basis === 'loaded' ? '装货量' : draft.basis === 'custom' ? '人工确认数据' : draft.basis === 'theirs' ? '运输企业回单' : '我方磅单' }}计算
          <span v-if="diffOnly"> · 仅显示差异运单</span>
        </p>
      </div>

      <div v-else class="ts-drawer-empty">
        <img :src="asset('empty-doc.png')" alt="" />
        <p>{{ workflow ? '请在左侧选择本次要结算的计划' : '暂无核算数据，请先添加核算运单' }}</p>
        <button v-if="!workflow" class="ts-btn primary" type="button" style="width: 114px" @click="addWaybill">添加核算运单</button>
      </div>
    </div>

    <div class="ts-drawer-footer">
      <button class="ts-btn plain" type="button" @click="emit('close')">{{ submitted ? '返回工作台' : '取消' }}</button>
      <button class="ts-btn primary" :class="{ 'is-disabled': !isDraft || confirmBlocked || submitted }" type="button" :disabled="!isDraft || confirmBlocked || submitted" @click="emit('confirm')">{{ submitted ? '已模拟创建' : '确定' }}</button>
    </div>

    <WaybillPicker
      v-if="pickerOpen"
      :rows="driverMode ? pickerRows : []"
      :initial-selection="driverMode ? selectedWaybills : []"
      :editable-selection="driverMode"
      @select="updateDriverWaybills"
      @close="pickerOpen = false"
    />

    <ElDialog
      v-if="driverMode && feeTarget"
      v-model="feeDialogOpen"
      :title="`维护${feeLabels[feeTarget.type]}项`"
      width="min(640px, 92vw)"
      append-to-body
    >
      <p class="ts-fee-target">运单号 {{ feeTarget.id }}</p>
      <ElTable :data="feeItems" :class="{ 'annot-transportSettlement-rule-fee-items': driverMode && feeDialogOpen }" border size="small">
        <ElTableColumn label="项目名称" min-width="135">
          <template #default="{ row, $index }">
            <ElInput v-model="row.name" :aria-label="`第 ${$index + 1} 行项目名称`" placeholder="项目名称" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额（元）" width="126">
          <template #default="{ row, $index }">
            <ElInputNumber v-model="row.amount" :aria-label="`第 ${$index + 1} 行金额`" :min="0" :precision="2" :controls="false" style="width: 100%" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="112">
          <template #default="{ row, $index }">
            <ElInput v-model="row.remark" :aria-label="`第 ${$index + 1} 行备注`" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="65">
          <template #default="{ $index }">
            <ElButton type="danger" link @click="feeItems.splice($index, 1)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElButton type="primary" link @click="feeItems.push(emptyFee())">添加{{ feeLabels[feeTarget.type] }}项</ElButton>
      <p v-if="feeError" class="ts-fee-error" role="alert">{{ feeError }}</p>
      <template #footer>
        <ElButton @click="feeDialogOpen = false">取消</ElButton>
        <ElButton type="primary" @click="confirmFees">确认</ElButton>
      </template>
    </ElDialog>
  </div>
</template>
