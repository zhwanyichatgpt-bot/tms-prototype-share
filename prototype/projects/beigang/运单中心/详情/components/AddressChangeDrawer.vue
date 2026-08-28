<script setup>
/**
 * 运单详情 —— 地址变更详情抽屉（统一，合同承运商视角）
 * 完整新旧对比 + 本层下游价格 + 处理进度时间线 + 角色操作。
 * 价格可见性按 PRD 7.4：合同承运商可见客户单价与本层下游价格。
 */
import { computed, ref, watch } from 'vue'
import { addressChangeStatusMeta } from '../mock-data'
import { PROCESSING_STATUS, downstreamTitle as orgDownstreamTitle, statusLabelFor } from '../../address-change-store'

const props = defineProps({
  visible: { type: Boolean, default: false },
  record: { type: Object, default: null },
  orgMode: { type: String, default: 'direct' },
  perspective: { type: String, default: 'contractCarrier' },
  /* 本企业（实际承运商）当前给船东的运输单价：确认时作为默认值 */
  shipownerPrice: { type: Object, default: null },
})
const emit = defineEmits(['close', 'withdraw', 'actualConfirm', 'actualReject'])

/* 是否实际承运商视角 */
const isActualCarrier = computed(() => props.perspective === 'actualCarrier')

const statusMeta = computed(() => props.record ? addressChangeStatusMeta[props.record.status] : null)
/* 状态文案按视角：实际承运商视角「待实际承运商确认」→「待本企业确认」 */
const statusLabel = computed(() => props.record ? statusLabelFor(props.record.status, props.perspective) : '')
/* 处理中（非终态）：待实际承运商确认 / 待船东确认 */
const isProcessing = computed(() => props.record && PROCESSING_STATUS.includes(props.record.status))
/* 实际承运商：待本企业确认时可操作确认/拒绝 */
const canActualConfirm = computed(() => isActualCarrier.value && props.record?.status === 'pendingActualCarrier')
/* 合同承运商：处理中（船东确认前）可撤回 */
const canWithdraw = computed(() => !isActualCarrier.value && isProcessing.value)

/* 下游费用场景化命名：直接指派船东 → 船东运费；委外实际承运商 → 承运商运输费用 */
const downstreamTitle = computed(() => orgDownstreamTitle(props.orgMode))

/* 价格是否发生变化：未变化时不展示价格对比 */
const priceChanged = computed(() => props.record && props.record.newPrice !== props.record.oldPrice)
const downstreamChanged = computed(() => props.record?.downstream && props.record.downstream.newPrice !== props.record.downstream.oldPrice)

/* 实际承运商视角：本企业给船东价格是否已确认写入（确认后只读回看） */
const shipownerPriceConfirmed = computed(() => isActualCarrier.value && !!props.record?.shipownerPrice)

/* 实际承运商确认时填写的「给船东的运输单价」：默认带入本企业原给船东价，必填且 >0 */
const shipownerPriceInput = ref('')
const shipownerPriceError = ref('')
watch(
  () => [props.visible, props.record],
  () => {
    if (props.visible && canActualConfirm.value) {
      shipownerPriceInput.value = props.shipownerPrice?.currentPrice ?? ''
      shipownerPriceError.value = ''
    }
  },
  { immediate: true },
)

function close() {
  emit('close')
}
function withdraw() {
  emit('withdraw', props.record)
}
function actualConfirm() {
  /* 校验：调整后单价必填且必须大于 0；空值、0 或负数不得提交 */
  const v = Number(shipownerPriceInput.value)
  if (String(shipownerPriceInput.value).trim() === '' || !(v > 0)) {
    shipownerPriceError.value = '请输入大于0的给船东运输单价'
    return
  }
  shipownerPriceError.value = ''
  emit('actualConfirm', props.record, shipownerPriceInput.value)
}
function actualReject() {
  emit('actualReject', props.record)
}
</script>

<template>
  <!-- 直接渲染：组件挂在 .waybill-detail-page（position:relative）内，absolute 蒙层只覆盖原型内容区 -->
  <div v-if="visible && record" class="acd-mask" data-annotation-container="drawer" @click.self="close">
      <div class="acd-drawer" data-annotation-content="drawer">
        <!-- 头部 -->
        <div class="acd-head">
          <div class="acd-head-left">
            <span class="acd-title">地址变更详情</span>
            <span class="acd-status" :class="statusMeta.tone">{{ statusLabel }}</span>
          </div>
          <button type="button" class="acd-close" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="acd-body">
          <!-- 基本信息 -->
          <div class="acd-section">
            <div class="acd-info-grid">
              <div class="acd-info-item"><span class="acd-info-label">变更编号</span><span class="acd-info-value">{{ record.id }}</span></div>
              <div class="acd-info-item"><span class="acd-info-label">第几次变更</span><span class="acd-info-value">第 {{ record.seq }} 次</span></div>
              <div class="acd-info-item acd-info-full"><span class="acd-info-label">发起方</span><span class="acd-info-value">{{ record.initiator }}</span></div>
              <div class="acd-info-item acd-info-full"><span class="acd-info-label">发起时间</span><span class="acd-info-value">{{ record.initiateTime }}</span></div>
            </div>
          </div>

          <!-- 地址对比 -->
          <div class="acd-section annot-waybill-detail-beigang-field-address-compare">
            <div class="acd-section-title">卸货地址变更</div>
            <div class="acd-compare">
              <div class="acd-compare-box old">
                <div class="acd-compare-tag">变更前</div>
                <div class="acd-compare-text">{{ record.oldAddress }}</div>
              </div>
              <div class="acd-compare-box new">
                <div class="acd-compare-tag">变更后</div>
                <div class="acd-compare-text">{{ record.newAddress }}</div>
              </div>
            </div>
          </div>

          <!-- 托运企业运输单价对比（实际承运商视角不可见：托运企业与合同承运商之间的价格）；价格未变化不展示 -->
          <div v-if="!isActualCarrier && priceChanged" class="acd-section">
            <div class="acd-section-title">托运企业运输单价变更</div>
            <div class="acd-compare">
              <div class="acd-compare-box old">
                <div class="acd-compare-tag">变更前</div>
                <div class="acd-compare-text acd-price">{{ record.oldPrice }} <span class="acd-price-unit">{{ record.priceUnit }}</span></div>
              </div>
              <div class="acd-compare-arrow" aria-hidden="true">→</div>
              <div class="acd-compare-box new">
                <div class="acd-compare-tag">变更后</div>
                <div class="acd-compare-text acd-price acd-price-new">{{ record.newPrice }} <span class="acd-price-unit">{{ record.priceUnit }}</span></div>
              </div>
            </div>
          </div>

          <!-- 合同承运商给本企业的运输单价（实际承运商视角只读，委外场景始终展示；合同承运商视角=船东运费/承运商运输费用，价格未变化不展示） -->
          <div v-if="record.downstream && (isActualCarrier ? true : downstreamChanged)" class="acd-section annot-waybill-detail-beigang-rule-price-visibility">
            <div class="acd-section-title">{{ isActualCarrier ? '本企业承运价格' : downstreamTitle }}<span class="acd-section-hint">{{ orgMode === 'direct' ? '直接指派船东' : '委外实际承运商' }}</span></div>
            <div class="acd-compare">
              <div class="acd-compare-box old">
                <div class="acd-compare-tag">调整前</div>
                <div class="acd-compare-text acd-price">{{ record.downstream.oldPrice }} <span class="acd-price-unit">{{ record.downstream.unit }}</span></div>
              </div>
              <div class="acd-compare-arrow" aria-hidden="true">→</div>
              <div class="acd-compare-box new">
                <div class="acd-compare-tag">调整后</div>
                <div v-if="record.downstream.newPrice" class="acd-compare-text acd-price acd-price-new">{{ record.downstream.newPrice }} <span class="acd-price-unit">{{ record.downstream.unit }}</span></div>
                <div v-else class="acd-compare-text acd-price-pending">待{{ orgMode === 'direct' ? '船东' : '实际承运商' }}确认后维护</div>
              </div>
            </div>
          </div>

          <!-- 变更原因与说明 -->
          <div class="acd-section">
            <div class="acd-section-title">变更原因</div>
            <div class="acd-reason">{{ record.reason }}</div>
            <template v-if="record.note">
              <div class="acd-section-title acd-note-title">变更说明</div>
              <div class="acd-reason">{{ record.note }}</div>
            </template>
          </div>

          <!-- 拒绝信息 -->
          <div v-if="record.rejectInfo" class="acd-section">
            <div class="acd-reject-box">
              <div class="acd-reject-title">拒绝信息</div>
              <div class="acd-reject-line">拒绝方：{{ record.rejectInfo.by }}</div>
              <div class="acd-reject-line">拒绝时间：{{ record.rejectInfo.time }}</div>
              <div class="acd-reject-line">拒绝原因：{{ record.rejectInfo.reason }}</div>
            </div>
          </div>

          <!-- 处理进度时间线：只列已发生节点，每节点显示动作 + 操作人·时间 -->
          <div class="acd-section annot-waybill-detail-beigang-rule-processing-status">
            <div class="acd-section-title">处理进度</div>
            <div class="acd-timeline">
              <div v-for="(node, i) in record.timeline" :key="i" class="acd-timeline-node" :class="{ last: i === record.timeline.length - 1 }">
                <span class="acd-timeline-dot" :class="{ current: i === record.timeline.length - 1 && isProcessing }" aria-hidden="true" />
                <div class="acd-timeline-content">
                  <div class="acd-timeline-action">{{ node.action }}</div>
                  <div class="acd-timeline-actor">{{ node.actor }} · {{ node.time }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 本企业给船东的运输单价（实际承运商视角） -->
          <!-- 待本企业确认：展示原单价（只读）+ 调整后单价输入框（必填 >0） -->
          <div v-if="canActualConfirm" class="acd-section acd-shipowner-price annot-waybill-detail-beigang-rule-actual-carrier-price">
            <div class="acd-section-title">本企业给船东的运输单价</div>
            <div class="acd-compare">
              <div class="acd-compare-box old">
                <div class="acd-compare-tag">原运输单价</div>
                <div class="acd-compare-text acd-price">{{ shipownerPrice?.currentPrice }} <span class="acd-price-unit">{{ shipownerPrice?.unit || '元/吨' }}</span></div>
              </div>
              <div class="acd-compare-box new">
                <div class="acd-compare-tag">调整后单价<i class="acd-required">*</i></div>
                <input
                  v-model="shipownerPriceInput"
                  type="number"
                  min="0"
                  step="0.01"
                  class="acd-shipowner-price-input"
                  :class="{ 'is-error': shipownerPriceError }"
                  placeholder="默认沿用当前给船东单价，可修改"
                />
              </div>
            </div>
            <div v-if="shipownerPriceError" class="acd-field-error">{{ shipownerPriceError }}</div>
          </div>

          <!-- 确认后（待船东处理及以后）：只读回看 本企业给船东 调整前 → 调整后 -->
          <div v-else-if="shipownerPriceConfirmed" class="acd-section">
            <div class="acd-section-title">本企业给船东的运输单价</div>
            <div class="acd-compare">
              <div class="acd-compare-box old">
                <div class="acd-compare-tag">调整前</div>
                <div class="acd-compare-text acd-price">{{ record.shipownerPrice.oldPrice }} <span class="acd-price-unit">{{ record.shipownerPrice.unit }}</span></div>
              </div>
              <div class="acd-compare-arrow" aria-hidden="true">→</div>
              <div class="acd-compare-box new">
                <div class="acd-compare-tag">调整后</div>
                <div class="acd-compare-text acd-price acd-price-new">{{ record.shipownerPrice.newPrice }} <span class="acd-price-unit">{{ record.shipownerPrice.unit }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作：实际承运商待本企业确认时「确认并发送船东/拒绝」；合同承运商处理中可撤回 -->
        <div v-if="canActualConfirm" class="acd-foot">
          <button type="button" class="acd-btn" @click="actualReject">拒绝</button>
          <button type="button" class="acd-btn acd-btn-primary" @click="actualConfirm">确认并发送船东</button>
        </div>
        <div v-else-if="canWithdraw" class="acd-foot annot-waybill-detail-beigang-action-withdraw">
          <button type="button" class="acd-btn acd-btn-danger" @click="withdraw">撤回变更</button>
        </div>
      </div>
    </div>
</template>
