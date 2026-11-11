<script setup>
/**
 * 新建运输核算单 —— 复刻真实系统全屏抽屉
 * 支持被 AI 工作台嵌入：传入 draft 时展示 AI 汇总的核算运单与结算总额
 */
import { computed, ref, watch } from 'vue'
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
})

const emit = defineEmits(['close', 'notice', 'confirm', 'update-row', 'update-meta', 'scope'])

const asset = (name) => `/transport-settlement-assets/${name}`

const settleObject = ref(props.draft?.settleObject || '托运方')
const objectMenu = ref(false)
const party = ref(props.draft?.party || '')
const partyMenu = ref(false)
const settleDate = ref(props.draft?.settleDate || '')
const remark = ref(props.draft?.remark || '')
const pickerOpen = ref(false)

watch(() => props.draft, value => {
  if (!value) return
  settleObject.value = value.settleObject || '托运方'
  party.value = value.party || ''
  settleDate.value = value.settleDate || ''
  remark.value = value.remark || ''
})

const partyLabel = computed(() => {
  if (settleObject.value === '承运方') return '承运方'
  if (settleObject.value === '司机') return '司机'
  return '托运方'
})

const partyPlaceholder = computed(() => {
  if (settleObject.value === '承运方') return '请选择承运企业'
  if (settleObject.value === '司机') return '请选择司机'
  return '请选择托运企业'
})

const workflow = computed(() => props.embedded && Boolean(props.workflowPhase))
const editable = computed(() => workflow.value && props.workflowPhase === 'draft' && !props.submitted)
const planGroups = computed(() => {
  const plans = props.draft?.plans?.length ? props.draft.plans : [{ id: 'all', name: '石灰石（散装）', number: `QYCG-${props.draft?.rows?.[0]?.id || ''}` }]
  return plans.map(plan => {
    const allRows = (props.draft?.rows || []).filter(row => plan.id === 'all' || row.planId === plan.id)
    const rows = visibleRows.value.filter(row => plan.id === 'all' || row.planId === plan.id)
    const sum = field => Math.round(allRows.reduce((n, row) => n + Number(row[field] || 0), 0) * 100) / 100
    const prices = [...new Set(allRows.map(row => row.price))]
    return { ...plan, rows, priceText: prices.length === 1 ? prices[0] : '按运单单价', summary: { totalLoad: sum('load'), totalUnload: sum('unload'), totalBasic: sum('basic'), loss: sum('loss'), total: sum('amount') } }
  })
})
const numericText = value => value === '' || !Number.isFinite(Number(value)) ? '' : Number(value).toFixed(2)
function editRow(row, field, event) {
  const value = event.target.value === '' ? '' : Number(event.target.value)
  event.target.value = numericText(value)
  emit('update-row', { id: row.id, field, value })
}
function changeDate(event) { settleDate.value = event.target.value; emit('update-meta', { field: 'settleDate', value: settleDate.value }) }
const isDraft = computed(() => Boolean(props.draft?.rows?.length))
const visibleRows = computed(() => {
  const rows = props.draft?.rows || []
  return props.diffOnly ? rows.filter(row => row.flag && row.flag !== '重复') : rows
})
const totalText = computed(() => {
  const value = props.draft?.total || 0
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const money = value => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function chooseParty(value) {
  party.value = value
  partyMenu.value = false
}

function addWaybill() {
  if (isDraft.value) {
    emit('notice', '本次核算运单已由至小简汇总，可直接在上方表格核对')
    return
  }
  if (!party.value) {
    emit('notice', '请选择结算对象')
    return
  }
  pickerOpen.value = true
}

function batchAdd(type) {
  if (!party.value) {
    emit('notice', '请选择结算对象')
    return
  }
  emit('notice', `请先添加核算运单，再批量添加${type}`)
}
</script>

<template>
  <div class="ts-drawer" :class="{ 'is-embedded': embedded, 'ts-collaboration': workflow }">
    <div class="ts-drawer-head">
      <div class="ts-crumb">
        <span class="ts-crumb-link">运输结算</span>
        <span class="ts-crumb-sep">&gt;</span>
        <span>新建运输核算单</span>
      </div>
      <button class="ts-close" type="button" @click="emit('close')">×</button>
    </div>

    <div class="ts-drawer-body">
      <div class="ts-section-title first">基础信息</div>

      <div class="ts-form">
        <div class="ts-form-item">
          <label>结算对象</label>
          <div class="ts-field" :class="{ 'is-locked': workflow }" @click="!workflow && (objectMenu = !objectMenu)">
            <span class="ts-field-value">{{ settleObject }}</span>
            <span class="ts-field-caret" />
            <div v-if="objectMenu" class="ts-select-pop">
              <div
                v-for="item in ['托运方', '承运方', '司机']"
                :key="item"
                class="ts-select-option"
                :class="{ selected: settleObject === item }"
                @click.stop="settleObject = item; objectMenu = false; party = ''"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <div class="ts-form-item">
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

      <template v-if="isDraft">
        <section v-for="group in planGroups" :key="group.id" v-show="group.rows.length || !diffOnly" class="ts-canonical-plan">
        <div class="ts-plan-strip">
          <span class="ts-plan-title">{{ group.name }} | {{ group.number }}</span>
          <span class="ts-plan-field">计费类型：<i>单位计费</i></span>
          <span class="ts-plan-field">计费条件：<i>重量</i></span>
          <span class="ts-plan-field">计费依据：<i>{{ draft.basis === 'custom' ? '确认后的计价量' : draft.basis === 'theirs' ? '回单重量' : '卸货重量' }}</i></span>
          <span class="ts-plan-formula">基础运费= 计价量 * {{ group.priceText }} 元/吨</span>
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
              <tr class="ts-draft-waybill">
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
                <td colspan="5" class="ts-merged">
                  <div class="ts-merged-flex">
                    <div class="ts-sub ts-sub-goods"><span class="ts-goods-box" />其他 | {{ row.goods }}</div>
                    <div class="ts-sub ts-sub-places">
                      <div class="ts-sub-line"><span class="ts-place-tag load">装</span>{{ row.loadPlace }}</div>
                      <div class="ts-sub-line"><span class="ts-place-tag unload">卸</span>{{ row.unloadPlace }}</div>
                    </div>
                    <div class="ts-sub ts-sub-num">
                      <div class="ts-pair"><label>装</label><i>{{ row.load.toFixed(2) }}</i></div>
                      <div class="ts-pair"><label>卸</label><i>{{ row.unload.toFixed(2) }}</i></div>
                    </div>
                    <div class="ts-sub ts-sub-num">
                      <div class="ts-pair"><label>装</label><i /></div>
                      <div class="ts-pair"><label>卸</label><i /></div>
                    </div>
                    <div class="ts-sub ts-sub-num">
                      <div class="ts-pair"><label>装</label><i /></div>
                      <div class="ts-pair"><label>卸</label><i /></div>
                    </div>
                  </div>
                </td>
                <td class="ts-loss">路耗金额：{{ money(row.loss) }}<br />耗损：0</td>
                <td class="ts-num">{{ row.goodsPrice ?? row.price }} 元</td>
                <td class="ts-mileage">计划：0.00<br />实际：0.00</td>
                <td class="ts-num">{{ money(row.basic) }}<label v-if="workflow" class="ts-canonical-rate">计费单价<input type="number" min="0" step="0.01" :value="numericText(row.price)" :disabled="!editable" :aria-label="`第${row.seq}条运单单价`" @change="editRow(row, 'price', $event)" /></label></td>
                <td class="ts-fee">0 <button type="button">添加费用</button></td>
                <td class="ts-fee">0 <button type="button">添加费用</button></td>
                <td class="ts-num ts-strong">{{ money(row.amount) }}</td>
              </tr>
            </tbody>
            <tfoot>
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
        <p class="ts-draft-summary">
          共 {{ draft.totalRows }} 条运单 · 计入 {{ draft.count }} 条 · 计价量 {{ draft.weight.toFixed(2) }} t · 路耗合计 {{ money(draft.loss) }} · 按{{ draft.basis === 'custom' ? '人工确认数据' : draft.basis === 'theirs' ? '运输企业回单' : '我方磅单' }}计算
          <span v-if="diffOnly"> · 仅显示差异运单</span>
        </p>
      </template>

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

    <WaybillPicker v-if="pickerOpen" @close="pickerOpen = false" />
  </div>
</template>
