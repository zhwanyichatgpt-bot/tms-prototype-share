<script setup>
/**
 * 运单中心 —— 发起地址及运价变更弹窗（合同承运商视角）
 * PRD：地址 + 托运企业运输单价整体提交，不可拆分；本层下游费用同步维护。
 * 布局：上下纵向表单（参考项目 Pixso 新增托运单表单风格），label 在上控件在下。
 * 命名：托运企业运输单价（原客户运输单价）；下游费用按场景叫船东运费/承运商运输费用。
 */
import { reactive, ref, watch, computed } from 'vue'
import { getSnapshot, unloadAddressOptions, downstreamTitle as orgDownstreamTitle } from '../address-change-store'

const props = defineProps({
  visible: { type: Boolean, default: false },
  waybillKey: { type: String, default: '' },
})
const emit = defineEmits(['close', 'submit'])

const snapshot = ref(null)

const form = reactive({
  newAddress: '',
  newPrice: '',
  downstreamPrice: '',
  reason: '',
  note: '',
})
const errors = reactive({
  newAddress: '',
  newPrice: '',
  downstreamPrice: '',
  reason: '',
})

/* 下游费用场景化命名：直接指派船东 → 船东运费；委外实际承运商 → 承运商运输费用 */
const downstreamTitle = computed(() => {
  if (!snapshot.value) return ''
  return orgDownstreamTitle(snapshot.value.orgMode)
})
const downstreamCurrentLabel = computed(() => {
  if (!snapshot.value) return ''
  return snapshot.value.orgMode === 'direct' ? '当前船东运费单价' : '当前承运商运输费用单价'
})

watch(() => [props.visible, props.waybillKey], ([v, key]) => {
  if (!v || !key) return
  snapshot.value = getSnapshot(key)
  form.newAddress = ''
  // 价格默认带入当前值：可改可不改，留空/等于原值即不修改
  form.newPrice = snapshot.value?.currentPrice ?? ''
  form.downstreamPrice = snapshot.value?.downstream?.currentPrice ?? ''
  form.reason = ''
  form.note = ''
  Object.keys(errors).forEach(k => { errors[k] = '' })
})

function close() {
  emit('close')
}

function submit() {
  if (!snapshot.value) return
  errors.newAddress = form.newAddress ? '' : '请选择新卸货地址'
  // 价格非必填：为空则沿用当前价（不修改）；有值才校验 >0
  const currentPrice = snapshot.value.currentPrice
  const currentDownstream = snapshot.value.downstream?.currentPrice
  const newPriceRaw = String(form.newPrice).trim()
  const downstreamRaw = String(form.downstreamPrice).trim()
  const price = newPriceRaw === '' ? Number(currentPrice) : Number(newPriceRaw)
  const dp = downstreamRaw === '' ? Number(currentDownstream) : Number(downstreamRaw)
  errors.newPrice = (newPriceRaw === '' || price > 0) ? '' : '请输入大于 0 的新托运企业运输单价'
  errors.downstreamPrice = (downstreamRaw === '' || dp > 0) ? '' : '请输入大于 0 的调整后单价'
  // 变更原因非必填
  errors.reason = ''
  if (errors.newAddress || errors.newPrice || errors.downstreamPrice || errors.reason) return

  emit('submit', {
    waybillKey: props.waybillKey,
    time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    newAddress: form.newAddress,
    newPrice: price.toFixed(2),
    downstreamPrice: dp.toFixed(2),
    reason: form.reason.trim(),
    note: form.note.trim(),
  })
}
</script>

<template>
  <!-- 挂到 body：列表页 TMS 框架有 scale 缩放，挂内部会相对缩放容器定位而贴错右缘；挂 body 用 fixed 相对视口 -->
  <Teleport to="body">
    <div v-if="visible && snapshot" class="ac-dialog-mask" data-annotation-container="modal" @click.self="close">
      <div class="ac-dialog" data-annotation-content="modal">
        <div class="ac-dialog-head">
          <span>地址及运价变更</span>
          <button type="button" class="ac-dialog-close" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="ac-dialog-body">
          <!-- 当前运单信息（只读快照） -->
          <div class="ac-section annot-waybill-center-beigang-field-change-target">
            <div class="ac-section-title">当前运单信息</div>
            <div class="ac-info-grid">
              <div class="ac-info-item"><span class="ac-info-label">运单号</span><span class="ac-info-value">{{ snapshot.waybillNo }}</span></div>
              <div class="ac-info-item"><span class="ac-info-label">运单状态</span><span class="ac-info-value">{{ snapshot.statusLabel }}</span></div>
              <div class="ac-info-item"><span class="ac-info-label">货品名称</span><span class="ac-info-value">{{ snapshot.cargoName }}</span></div>
              <div class="ac-info-item"><span class="ac-info-label">计价方式</span><span class="ac-info-value">{{ snapshot.priceBasis }}</span></div>
              <div class="ac-info-item ac-info-full"><span class="ac-info-label">装货地址</span><span class="ac-info-value">{{ snapshot.loadAddress }}</span></div>
            </div>
          </div>

          <!-- 变更内容：地址 + 托运企业运输单价整体变更（上下布局） -->
          <div class="ac-section annot-waybill-center-beigang-rule-atomic-change">
            <div class="ac-section-title">变更内容</div>
            <div class="ac-tip-bar">新卸货地址与新托运企业运输单价整体提交、一起生效</div>

            <div class="ac-field">
              <label class="ac-form-label">当前卸货地址</label>
              <div class="ac-readonly-box">{{ snapshot.currentUnloadAddress }}</div>
            </div>
            <div class="ac-field">
              <label class="ac-form-label"><i class="ac-required">*</i>新卸货地址</label>
              <select v-model="form.newAddress" class="ac-form-control">
                <option value="" disabled>请选择新卸货地址</option>
                <option v-for="addr in unloadAddressOptions" :key="addr" :value="addr">{{ addr }}</option>
              </select>
              <div v-if="errors.newAddress" class="ac-form-error">{{ errors.newAddress }}</div>
            </div>

            <div class="ac-field">
              <label class="ac-form-label">当前托运企业运输单价</label>
              <div class="ac-readonly-box ac-price-box">{{ snapshot.currentPrice }} <span class="ac-price-unit">{{ snapshot.priceUnit }}</span></div>
            </div>
            <div class="ac-field">
              <label class="ac-form-label">新托运企业运输单价（{{ snapshot.priceUnit }}）<span class="ac-label-hint">不修改则保持原价</span></label>
              <input v-model="form.newPrice" type="number" min="0" step="0.01" class="ac-form-control" placeholder="默认沿用当前单价，可修改" />
              <div v-if="errors.newPrice" class="ac-form-error">{{ errors.newPrice }}</div>
            </div>
          </div>

          <!-- 下游费用（合同承运商维护，场景化命名） -->
          <div class="ac-section annot-waybill-center-beigang-rule-downstream-price">
            <div class="ac-section-title">{{ downstreamTitle }}</div>
            <div class="ac-tip-bar">{{ snapshot.orgMode === 'direct' ? '直接指派船东，船东确认新地址后本次调整一起生效' : '委外实际承运商，实际承运商确认后发送船东，船东确认后生效' }}</div>

            <div class="ac-field">
              <label class="ac-form-label">{{ downstreamCurrentLabel }}</label>
              <div class="ac-readonly-box ac-price-box">{{ snapshot.downstream.currentPrice }} <span class="ac-price-unit">{{ snapshot.downstream.unit }}</span></div>
            </div>
            <div class="ac-field">
              <label class="ac-form-label">调整后单价（{{ snapshot.downstream.unit }}）<span class="ac-label-hint">不修改则保持原价</span></label>
              <input v-model="form.downstreamPrice" type="number" min="0" step="0.01" class="ac-form-control" placeholder="默认沿用当前单价，可修改" />
              <div v-if="errors.downstreamPrice" class="ac-form-error">{{ errors.downstreamPrice }}</div>
            </div>
          </div>

          <!-- 变更原因与说明 -->
          <div class="ac-section annot-waybill-center-beigang-field-change-reason">
            <div class="ac-section-title">变更原因与说明</div>
            <div class="ac-field">
              <label class="ac-form-label">变更原因</label>
              <textarea v-model="form.reason" class="ac-form-control ac-form-textarea" rows="2" placeholder="选填，说明本次地址及运价变更的业务原因" maxlength="200" />
              <div v-if="errors.reason" class="ac-form-error">{{ errors.reason }}</div>
            </div>
            <div class="ac-field">
              <label class="ac-form-label">变更说明</label>
              <textarea v-model="form.note" class="ac-form-control ac-form-textarea" rows="2" placeholder="选填，补充说明" maxlength="200" />
            </div>
          </div>
        </div>

        <div class="ac-dialog-foot annot-waybill-center-beigang-action-submit-change">
          <button type="button" class="ac-btn" @click="close">取消</button>
          <button type="button" class="ac-btn ac-btn-primary" @click="submit">提交变更</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
