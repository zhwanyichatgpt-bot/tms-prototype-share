<template>
  <div class="quote-preview">
    <main ref="mobileContainerRef" class="detail-screen" aria-label="报价页面">
      <!-- 可滚动内容区 -->
      <div ref="scrollContainer" class="detail-scroll">
        <!-- 1. 顶部航线地图区 (220px 适中高度，还原完整 3D 港口气泡、时间与航线) -->
        <section class="map-section">
          <img class="map-image" src="/cargo-detail-map.png" alt="运输路线地图" />
          <img class="status-bar" src="/shipowner-statusbar.svg" alt="" />

          <button type="button" class="back-button" aria-label="返回" @click="onBack">
            <van-icon name="arrow-left" size="22" color="#333333" />
          </button>
          <h1 class="header-title">{{ isFreight ? '参与货源需求' : '参与运力需求' }}</h1>

          <!-- 航线曲线 -->
          <img class="route-image" src="/cargo-detail-route.svg" alt="" />

          <!-- 起点港口卡片 (装货港 / 始发港) -->
          <div class="port-card load-port">
            <span class="port-label load-label">
              {{ isCapacity ? '始发港' : '装货港' }}
            </span>
            <div class="port-content">
              <div class="port-name">{{ originPort }}</div>
              <div class="port-time">{{ isCapacity ? `${startTimeText} 到位` : `${startTimeText} 要求装货` }}</div>
            </div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>

          <!-- 终点港口卡片 (卸货港 / 目的港) -->
          <div class="port-card unload-port">
            <span class="port-label unload-label">
              {{ isCapacity ? '目的港' : '卸货港' }}
            </span>
            <div class="port-content">
              <div class="port-name">{{ destPort }}</div>
              <div class="port-time">{{ isCapacity ? `${endTimeText} 完成` : `${endTimeText} 要求完成` }}</div>
            </div>
            <span class="port-line"></span>
            <span class="port-anchor"></span>
          </div>

          <!-- 航线里程标签 (严格读取 routeDistance 数据) -->
          <div class="route-distance">航线{{ routeDistText }}</div>
        </section>

        <!-- 2. 下方内容面板区 (圆角衔接) -->
        <section class="detail-sheet">
          <!-- 喇叭提示栏 (统一展示报价截止时间) -->
          <div class="bidding-notice">
            <div class="notice-left">
              <img src="/cargo-detail-notice.svg" alt="" />
              <span>竞价中，报价截止：{{ deadlineText }}</span>
            </div>
            <span class="notice-badge" :class="{ readonly: isReadOnlyState }">
              {{ isReadOnlyState ? '已报价' : (isFreight ? '货源需求' : '运力需求') }}
            </span>
          </div>

          <!-- 3. 紧凑单行货物摘要 -->
          <div class="compact-cargo-bar">
            <span class="cargo-specs">{{ cargoNameText }} · {{ cargoQuantityText }} · {{ transportModeText }}</span>
            <span class="ref-price">参考运费 {{ referencePriceText }}</span>
          </div>

          <!-- 4. 报价企业信息卡片 (紧凑 3 行：企业只读、联系人与电话可编辑校验) -->
          <section class="design-card">
            <div class="card-sec-header"><span class="sec-title">报价企业信息</span></div>

            <div class="form-row-horizontal readonly-bg">
              <span class="row-label readonly-lbl">报价企业</span>
              <span class="row-val readonly-val">{{ companyName }}</span>
            </div>

            <div
              id="field-contactPerson"
              class="form-row-horizontal"
              :class="{ 'row-error': errors.contactPerson }"
            >
              <span class="row-label required">联系人</span>
              <div class="row-val-action">
                <input
                  v-if="!isReadOnlyState"
                  v-model="form.contactPerson"
                  type="text"
                  class="row-inline-input"
                  placeholder="请输入联系人姓名"
                  @input="clearError('contactPerson')"
                />
                <span v-else class="row-val">{{ form.contactPerson || '--' }}</span>
              </div>
            </div>
            <span v-if="errors.contactPerson" class="inline-err-text">{{ errors.contactPerson }}</span>

            <div
              id="field-contactPhone"
              class="form-row-horizontal no-border"
              :class="{ 'row-error': errors.contactPhone }"
            >
              <span class="row-label required">联系电话</span>
              <div class="row-val-action">
                <input
                  v-if="!isReadOnlyState"
                  v-model="form.contactPhone"
                  type="tel"
                  maxlength="11"
                  class="row-inline-input"
                  placeholder="请输入11位手机号"
                  @input="clearError('contactPhone')"
                />
                <span v-else class="row-val">{{ form.contactPhone || '--' }}</span>
              </div>
            </div>
            <span v-if="errors.contactPhone" class="inline-err-text">{{ errors.contactPhone }}</span>
          </section>

          <!-- 5.1 参与货源竞价 专属表单区 -->
          <template v-if="isFreight">
            <!-- 运输方案卡片 -->
            <section class="design-card">
              <div class="card-sec-header"><span class="sec-title">运输方案</span></div>

              <div
                id="field-transportType"
                class="form-row-horizontal"
                :class="{ 'row-error': errors.transportType }"
                @click="openTransportPicker"
              >
                <span class="row-label required">运输方式</span>
                <div class="row-val-action">
                  <span class="row-val">{{ form.transportType }}</span>
                  <van-icon v-if="!isReadOnlyState" name="arrow" size="14" color="#a7a7a7" />
                </div>
              </div>

              <!-- 统一表达为 运输方案 -->
              <div class="form-row-horizontal" @click="openSchemePicker">
                <span class="row-label">运输方案 <em class="optional-tag">(选填)</em></span>
                <div class="row-val-action">
                  <span class="row-val" :class="{ placeholder: !form.referencedScheme }">
                    {{ form.referencedScheme || '请选择运输方案' }}
                  </span>
                  <van-icon v-if="!isReadOnlyState" name="arrow" size="14" color="#a7a7a7" />
                </div>
              </div>

              <div class="form-row-horizontal no-border">
                <span class="row-label">预计运输时长 <em class="optional-tag">(选填)</em></span>
                <div class="row-val-action">
                  <input
                    v-if="!isReadOnlyState"
                    v-model="form.duration"
                    type="number"
                    class="row-inline-input number"
                    placeholder="请输入"
                  />
                  <span v-else class="row-val">{{ form.duration || '--' }}</span>
                  <span class="unit-suffix">天</span>
                </div>
              </div>
            </section>

            <!-- 费用报价卡片 -->
            <section class="design-card">
              <div class="card-sec-header"><span class="sec-title">费用报价</span></div>

              <div
                id="field-basis"
                class="form-row-horizontal"
                :class="{ 'row-error': errors.basis }"
                @click="openBasisPicker"
              >
                <span class="row-label required">计费依据</span>
                <div class="row-val-action">
                  <span class="row-val">{{ form.basis }}</span>
                  <van-icon v-if="!isReadOnlyState" name="arrow" size="14" color="#a7a7a7" />
                </div>
              </div>

              <div
                id="field-unitPrice"
                class="form-row-horizontal"
                :class="{ 'row-error': errors.unitPrice }"
              >
                <span class="row-label required">运输单价</span>
                <div class="row-val-action">
                  <input
                    v-if="!isReadOnlyState"
                    ref="unitPriceInput"
                    v-model="form.unitPrice"
                    type="number"
                    step="0.01"
                    class="row-inline-input number highlight-price"
                    placeholder="请输入"
                    @input="clearError('unitPrice')"
                  />
                  <span v-else class="row-val highlight-price">{{ form.unitPrice || '--' }}</span>
                  <span class="unit-suffix">元/吨</span>
                </div>
              </div>
              <span v-if="errors.unitPrice" class="inline-err-text">{{ errors.unitPrice }}</span>

              <!-- 其他费用 (默认收起) -->
              <div class="extra-fee-wrapper">
                <div v-if="!isReadOnlyState && !showExtraFee" class="add-extra-btn" @click="showExtraFee = true">
                  <van-icon name="plus" size="13" />
                  <span>添加其他费用</span>
                </div>

                <div v-if="showExtraFee || (isReadOnlyState && form.extraFeeAmount)" class="extra-fee-box">
                  <div class="extra-fee-row">
                    <span class="extra-lbl">费用名称</span>
                    <input
                      v-if="!isReadOnlyState"
                      v-model="form.extraFeeName"
                      type="text"
                      class="extra-input"
                      placeholder="如：封仓过闸费"
                    />
                    <span v-else class="row-val">{{ form.extraFeeName || '其他杂费' }}</span>
                  </div>
                  <div class="extra-fee-row">
                    <span class="extra-lbl">固定金额</span>
                    <div class="flex-align">
                      <input
                        v-if="!isReadOnlyState"
                        v-model="form.extraFeeAmount"
                        type="number"
                        class="extra-input number"
                        placeholder="0.00"
                      />
                      <span v-else class="row-val">¥{{ form.extraFeeAmount }}</span>
                      <span class="unit-suffix">元</span>
                      <button v-if="!isReadOnlyState" type="button" class="del-fee-btn" @click="removeExtraFee">
                        <van-icon name="delete-o" size="15" color="#f53f3f" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- 服务承诺卡片 -->
            <section class="design-card">
              <div class="card-sec-header"><span class="sec-title">服务承诺</span></div>

              <div
                id="field-deliveryMethod"
                class="form-row-horizontal"
                :class="{ 'row-error': errors.deliveryMethod }"
                @click="openDeliveryPicker"
              >
                <span class="row-label required">配送方式</span>
                <div class="row-val-action">
                  <span class="row-val">{{ form.deliveryMethod }}</span>
                  <van-icon v-if="!isReadOnlyState" name="arrow" size="14" color="#a7a7a7" />
                </div>
              </div>

              <div class="form-row-horizontal">
                <span class="row-label">增值服务</span>
                <div v-if="!isReadOnlyState" class="tag-selector">
                  <span
                    v-for="tag in valueAddedOptions"
                    :key="tag"
                    class="value-tag"
                    :class="{ active: form.valueAddedServices.includes(tag) }"
                    @click="toggleValueAdded(tag)"
                  >
                    {{ tag }}
                  </span>
                </div>
                <span v-else class="row-val">{{ form.valueAddedServices.join('、') || '无' }}</span>
              </div>

              <div
                id="field-schemeOverview"
                class="form-row-vertical"
                :class="{ 'row-error': errors.schemeOverview }"
              >
                <div class="flex-between">
                  <span class="row-label required">方案概述</span>
                  <span class="word-limit">{{ form.schemeOverview.length }}/500字</span>
                </div>
                <textarea
                  v-if="!isReadOnlyState"
                  v-model="form.schemeOverview"
                  rows="3"
                  maxlength="500"
                  class="row-textarea"
                  placeholder="请填写运输及安全保障方案概述"
                  @input="clearError('schemeOverview')"
                ></textarea>
                <div v-else class="row-val-multiline">{{ form.schemeOverview || '无' }}</div>
                <span v-if="errors.schemeOverview" class="inline-err-text">{{ errors.schemeOverview }}</span>
              </div>

              <!-- 附件列表与支持添加/删除 -->
              <div class="form-row-vertical no-border">
                <div class="flex-between">
                  <span class="row-label">附件证书</span>
                  <button v-if="!isReadOnlyState" type="button" class="add-file-btn" @click="triggerAddAttachment">
                    <van-icon name="plus" size="12" /> 添加附件
                  </button>
                </div>

                <div class="attachment-list">
                  <div v-for="(file, idx) in attachments" :key="idx" class="file-item-chip">
                    <van-icon name="description" size="14" color="#3a65ff" />
                    <span class="file-name">{{ file.name }}</span>
                    <button v-if="!isReadOnlyState" type="button" class="del-file-btn" @click="removeAttachment(idx)">
                      <van-icon name="cross" size="12" color="#999999" />
                    </button>
                  </div>
                  <div v-if="attachments.length === 0" class="no-file-tip">暂无上传附件</div>
                </div>
              </div>
            </section>
          </template>

          <!-- 5.2 参与运力竞价 专属表单区 -->
          <template v-else>
            <section class="design-card">
              <div class="card-sec-header"><span class="sec-title">运力报价</span></div>

              <!-- 计费依据 (支持 按重量 与 按船) -->
              <div
                id="field-capacityBasis"
                class="form-row-horizontal"
                @click="openCapacityBasisPicker"
              >
                <span class="row-label required">计费依据</span>
                <div class="row-val-action">
                  <span class="row-val">{{ form.basis }}</span>
                  <van-icon v-if="!isReadOnlyState" name="arrow" size="14" color="#a7a7a7" />
                </div>
              </div>

              <!-- 运输单价 / 单船报价 (必填、初始为空) -->
              <div
                id="field-unitPrice"
                class="form-row-horizontal no-border"
                :class="{ 'row-error': errors.unitPrice }"
              >
                <span class="row-label required">{{ form.basis === '按船' ? '单船报价' : '运输单价' }}</span>
                <div class="row-val-action">
                  <input
                    v-if="!isReadOnlyState"
                    ref="unitPriceInput"
                    v-model="form.unitPrice"
                    type="number"
                    step="0.01"
                    class="row-inline-input number highlight-price"
                    placeholder="请输入"
                    @input="clearError('unitPrice')"
                  />
                  <span v-else class="row-val highlight-price">{{ form.unitPrice || '--' }}</span>
                  <span class="unit-suffix">{{ form.basis === '按船' ? '元/船' : '元/吨' }}</span>
                </div>
              </div>
              <span v-if="errors.unitPrice" class="inline-err-text">{{ errors.unitPrice }}</span>

              <!-- 报价说明 (默认直接展示、初始为空、最大 200 字) -->
              <div class="quote-remark-box-always">
                <div class="flex-between">
                  <span class="row-label">报价说明</span>
                  <span class="word-limit">{{ form.quoteRemark.length }}/200字</span>
                </div>
                <textarea
                  v-if="!isReadOnlyState"
                  v-model="form.quoteRemark"
                  rows="2"
                  maxlength="200"
                  class="row-textarea"
                  placeholder="请输入报价包含范围、费用说明等"
                ></textarea>
                <div v-else class="row-val-multiline">{{ form.quoteRemark || '无' }}</div>
              </div>
            </section>
          </template>
        </section>
      </div>

      <!-- 6. 固定底部操作栏 -->
      <footer class="detail-action">
        <div class="price-sum-box">
          <span class="sum-label">报价总额</span>
          <strong class="sum-val">{{ computedTotalDisplay }}</strong>
        </div>

        <button
          type="button"
          class="submit-btn"
          :class="{ readonly: isReadOnlyState }"
          @click="onSubmitOrReturn"
        >
          {{ isReadOnlyState ? '返回详情' : '提交报价' }}
        </button>
      </footer>

      <!-- 7. 选择器 Actionsheet 弹窗 (全量挂载至 mobileContainerRef 约束在 375px 内部) -->
      <van-action-sheet
        v-model:show="showTransportSheet"
        title="选择运输方式"
        :actions="transportActions"
        :teleport="mobileContainerRef"
        @select="onSelectTransport"
      />

      <van-action-sheet
        v-model:show="showSchemeSheet"
        title="选择运输方案"
        :teleport="mobileContainerRef"
      >
        <div class="sheet-picker-list">
          <div
            v-for="item in mockSchemes"
            :key="item.name"
            class="sheet-picker-item"
            @click="selectSchemeItem(item)"
          >
            <div class="item-title">{{ item.name }}</div>
            <div class="item-desc">{{ item.route }} | 预计{{ item.days }}天</div>
          </div>
        </div>
      </van-action-sheet>

      <van-action-sheet
        v-model:show="showBasisSheet"
        title="选择计费依据"
        :actions="basisActions"
        :teleport="mobileContainerRef"
        @select="onSelectBasis"
      />

      <van-action-sheet
        v-model:show="showDeliverySheet"
        title="选择配送方式"
        :actions="deliveryActions"
        :teleport="mobileContainerRef"
        @select="onSelectDelivery"
      />

      <!-- 8. 核心报价确认弹窗 (全量挂载至 mobileContainerRef) -->
      <van-dialog
        v-model:show="showConfirmDialogModal"
        title="确认提交报价"
        show-cancel-button
        confirm-button-text="确认提交"
        cancel-button-text="返回修改"
        :teleport="mobileContainerRef"
        @confirm="executeSubmit"
      >
        <div class="confirm-modal-body">
          <div class="confirm-row">
            <span class="lbl">报价企业：</span>
            <span class="val">{{ companyName }}</span>
          </div>
          <div class="confirm-row">
            <span class="lbl">联系人：</span>
            <span class="val">{{ form.contactPerson }}</span>
          </div>
          <div class="confirm-row">
            <span class="lbl">联系电话：</span>
            <span class="val">{{ form.contactPhone }}</span>
          </div>

          <template v-if="isCapacity">
            <div class="confirm-row">
              <span class="lbl">计费依据：</span>
              <span class="val">{{ form.basis }}</span>
            </div>
            <div class="confirm-row">
              <span class="lbl">报价金额：</span>
              <span class="val highlight">{{ form.unitPrice }} {{ form.basis === '按船' ? '元/船' : '元/吨' }}</span>
            </div>
          </template>
          <template v-else>
            <div class="confirm-row">
              <span class="lbl">运输单价：</span>
              <span class="val highlight">{{ form.unitPrice }} 元/吨</span>
            </div>
            <div v-if="form.duration" class="confirm-row">
              <span class="lbl">预计运输时长：</span>
              <span class="val">{{ form.duration }} 天</span>
            </div>
          </template>

          <div class="confirm-row">
            <span class="lbl">报价总额：</span>
            <span class="val total">{{ computedTotalDisplay }}</span>
          </div>
        </div>
      </van-dialog>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  biddingType: {
    type: String,
    default: 'freight',
  },
  cargoData: {
    type: Object,
    default: () => null,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  initialQuote: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['back', 'submit-success'])

const mobileContainerRef = ref(null)
const scrollContainer = ref(null)
const unitPriceInput = ref(null)

const urlParams = new URLSearchParams(window.location.search)
const urlBiddingType = urlParams.get('biddingType') || 'freight'
const urlReadOnly = urlParams.get('readOnly') === 'true'

const isFreight = computed(() => {
  if (props.biddingType !== 'freight') return false
  if (urlParams.has('biddingType')) return urlBiddingType === 'freight'
  return true
})

const isCapacity = computed(() => !isFreight.value)
const isReadOnlyState = computed(() => props.readOnly || urlReadOnly)

// 动态提取 cargoData (防写死)
const originPort = computed(() => {
  if (!props.cargoData) return '福州港'
  return props.cargoData.origin && props.cargoData.origin.includes('·')
    ? props.cargoData.origin.split('·')[1]
    : props.cargoData.origin || '福州港'
})

const destPort = computed(() => {
  if (!props.cargoData) return '五通港'
  return props.cargoData.destination && props.cargoData.destination.includes('·')
    ? props.cargoData.destination.split('·')[1]
    : props.cargoData.destination || '五通港'
})

const routeDistText = computed(() => props.cargoData?.routeDistance || '328.9海里')
const cargoNameText = computed(() => props.cargoData?.cargoName || props.cargoData?.cargoType || '煤')
const cargoQuantityText = computed(() => props.cargoData?.cargoQuantity || props.cargoData?.cargoSpec || '340吨')
const transportModeText = computed(() => props.cargoData?.transportType || '水路运输')

const numericQuantity = computed(() => {
  const str = String(cargoQuantityText.value)
  const num = Number(str.replace(/[^\d.]/g, ''))
  return (num && !isNaN(num)) ? num : 340
})

const referencePriceText = computed(() =>
  props.cargoData?.price
    ? `${props.cargoData.price}元/吨`
    : (isFreight.value ? '500元/吨' : '480元/吨')
)

// 动态提取时间（防模板写死）
const deadlineText = computed(() => props.cargoData?.deadline || '04月16日 18:00')
const startTimeText = computed(() => props.cargoData?.startTime || '04月17日 09:24')
const endTimeText = computed(() => props.cargoData?.endTime || '04月19日 09:24')

const companyName = ref(props.initialQuote?.companyName || '福州港船企业')

// 附件列表（新建报价时默认为空数组，不预设虚假默认文件）
const attachments = ref(props.initialQuote?.attachments || [])

// 选择器与弹窗状态
const showTransportSheet = ref(false)
const showSchemeSheet = ref(false)
const showBasisSheet = ref(false)
const showDeliverySheet = ref(false)
const showExtraFee = ref(false)
const showConfirmDialogModal = ref(false)

const transportActions = [
  { name: '水路运输' },
  { name: '公路运输' },
  { name: '铁路运输' },
  { name: '多式联运' },
]

const basisActions = computed(() =>
  isCapacity.value
    ? [{ name: '按重量' }, { name: '按船' }]
    : [{ name: '按装货口径' }, { name: '按卸货口径' }]
)

const deliveryActions = [
  { name: '港到港' },
  { name: '门到港' },
  { name: '港到门' },
]

const valueAddedOptions = ['封仓防护', '全程GPS', '优先过闸']

const mockSchemes = computed(() => [
  { name: '水路直达运输方案', route: `${originPort.value} → ${destPort.value}`, days: 2 },
  { name: '公水联运运输方案', route: `公路集港 → 水路运输(${routeDistText.value})`, days: 3 },
])

// 初始表单字段（新建报价时：联系人、电话、单价、概述、说明全量默认为空！）
const form = reactive({
  contactPerson: props.initialQuote?.contactPerson || '',
  contactPhone: props.initialQuote?.contactPhone || '',
  transportType: props.initialQuote?.transportType || '水路运输',
  referencedScheme: props.initialQuote?.referencedScheme || '',
  basis: props.initialQuote?.basis || (isCapacity.value ? '按重量' : '按装货口径'),
  unitPrice: props.initialQuote?.unitPrice || '',
  extraFeeName: props.initialQuote?.extraFeeName || '',
  extraFeeAmount: props.initialQuote?.extraFeeAmount || '',
  deliveryMethod: props.initialQuote?.deliveryMethod || '港到港',
  valueAddedServices: props.initialQuote?.valueAddedServices || [],
  schemeOverview: props.initialQuote?.schemeOverview || '',
  duration: props.initialQuote?.duration || '',
  quoteRemark: props.initialQuote?.quoteRemark || '',
})

// 校验错误消息
const errors = reactive({
  contactPerson: '',
  contactPhone: '',
  transportType: '',
  basis: '',
  unitPrice: '',
  deliveryMethod: '',
  schemeOverview: '',
})

const clearError = (field) => {
  errors[field] = ''
}

// 实时计算报价总额 (基于实际货量或按船算计)
const computedTotalDisplay = computed(() => {
  const price = Number(form.unitPrice)
  if (!form.unitPrice || isNaN(price) || price <= 0) {
    return '¥--'
  }
  let total = 0
  if (isCapacity.value && form.basis === '按船') {
    total = price
  } else {
    total = price * numericQuantity.value
  }

  if (isFreight.value && form.extraFeeAmount && !isNaN(Number(form.extraFeeAmount))) {
    total += Number(form.extraFeeAmount)
  }
  return `¥${total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
})

// 弹窗与选项交互
const openTransportPicker = () => {
  if (!isReadOnlyState.value) showTransportSheet.value = true
}
const onSelectTransport = (item) => {
  form.transportType = item.name
  showTransportSheet.value = false
  clearError('transportType')
}

const openSchemePicker = () => {
  if (!isReadOnlyState.value) showSchemeSheet.value = true
}
const selectSchemeItem = (item) => {
  form.referencedScheme = item.name
  showSchemeSheet.value = false
  showToast(`已选择: ${item.name}`)
}

const openBasisPicker = () => {
  if (!isReadOnlyState.value) showBasisSheet.value = true
}
const openCapacityBasisPicker = () => {
  if (!isReadOnlyState.value) showBasisSheet.value = true
}
const onSelectBasis = (item) => {
  if (form.basis !== item.name) {
    form.unitPrice = ''
  }
  form.basis = item.name
  showBasisSheet.value = false
  clearError('basis')
}

const openDeliveryPicker = () => {
  if (!isReadOnlyState.value) showDeliverySheet.value = true
}
const onSelectDelivery = (item) => {
  form.deliveryMethod = item.name
  showDeliverySheet.value = false
  clearError('deliveryMethod')
}

const toggleValueAdded = (tag) => {
  if (isReadOnlyState.value) return
  const idx = form.valueAddedServices.indexOf(tag)
  if (idx > -1) {
    form.valueAddedServices.splice(idx, 1)
  } else {
    form.valueAddedServices.push(tag)
  }
}

const removeExtraFee = () => {
  form.extraFeeName = ''
  form.extraFeeAmount = ''
  showExtraFee.value = false
}

const triggerAddAttachment = () => {
  if (isReadOnlyState.value) return
  attachments.value.push({ name: '水路运输资质证书.pdf' })
  showToast('已模拟添加附件证书')
}

const removeAttachment = (index) => {
  if (isReadOnlyState.value) return
  attachments.value.splice(index, 1)
  showToast('已移除附件')
}

const onBack = () => emit('back')

// 提交报价或返回处理
const onSubmitOrReturn = () => {
  if (isReadOnlyState.value) {
    emit('back')
    return
  }

  // 1. 全量必填校验
  let isValid = true
  let firstErrId = ''

  if (!form.contactPerson || !form.contactPerson.trim()) {
    errors.contactPerson = '请填写联系人'
    isValid = false
    if (!firstErrId) firstErrId = 'field-contactPerson'
  }

  if (!form.contactPhone || !form.contactPhone.trim()) {
    errors.contactPhone = '请填写联系电话'
    isValid = false
    if (!firstErrId) firstErrId = 'field-contactPhone'
  } else if (!/^1\d{10}$/.test(form.contactPhone.trim())) {
    errors.contactPhone = '请输入正确的11位手机号'
    isValid = false
    if (!firstErrId) firstErrId = 'field-contactPhone'
  }

  const priceNum = Number(form.unitPrice)
  if (!form.unitPrice || isNaN(priceNum) || priceNum <= 0) {
    errors.unitPrice = form.basis === '按船' ? '请输入单船报价' : '请输入运输单价'
    isValid = false
    if (!firstErrId) firstErrId = 'field-unitPrice'
  }

  if (isFreight.value) {
    if (!form.transportType) {
      errors.transportType = '请选择运输方式'
      isValid = false
      if (!firstErrId) firstErrId = 'field-transportType'
    }
    if (!form.basis) {
      errors.basis = '请选择计费依据'
      isValid = false
      if (!firstErrId) firstErrId = 'field-basis'
    }
    if (!form.deliveryMethod) {
      errors.deliveryMethod = '请选择配送方式'
      isValid = false
      if (!firstErrId) firstErrId = 'field-deliveryMethod'
    }
    if (!form.schemeOverview || !form.schemeOverview.trim()) {
      errors.schemeOverview = '请填写方案概述'
      isValid = false
      if (!firstErrId) firstErrId = 'field-schemeOverview'
    }
  }

  // 2. 校验失败：聚焦与定位
  if (!isValid) {
    showToast('请完整填写必填项')
    if (firstErrId) {
      const el = document.getElementById(firstErrId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  // 3. 校验通过，弹出核心确认弹窗
  showConfirmDialogModal.value = true
}

const executeSubmit = () => {
  showToast('报价提交成功')
  const sharedPayload = {
    companyName: companyName.value,
    contactPerson: form.contactPerson,
    contactPhone: form.contactPhone,
    basis: form.basis,
    unitPrice: form.unitPrice,
    totalDisplay: computedTotalDisplay.value,
    unitSuffix: form.basis === '按船' ? '元/船' : '元/吨',
  }

  const quotePayload = isCapacity.value
    ? {
        ...sharedPayload,
        quoteRemark: form.quoteRemark,
      }
    : {
        ...sharedPayload,
        transportType: form.transportType,
        referencedScheme: form.referencedScheme,
        duration: form.duration,
        extraFeeName: form.extraFeeName,
        extraFeeAmount: form.extraFeeAmount,
        deliveryMethod: form.deliveryMethod,
        valueAddedServices: [...form.valueAddedServices],
        schemeOverview: form.schemeOverview,
        attachments: [...attachments.value],
      }

  emit('submit-success', quotePayload)
}
</script>

<style scoped>
.detail-screen,
.detail-screen *,
.detail-screen *::before,
.detail-screen *::after {
  box-sizing: border-box;
}

.quote-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: auto;
  text-rendering: optimizeLegibility;
}

.detail-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  flex: 0 0 auto;
  background: #eff1f6;
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

/* 容器级定位约束：将所有 Teleport Vant 弹窗与 Overlay 严格锁定在 375px 手机屏幕内部 */
.detail-screen :deep(.van-overlay) {
  position: absolute !important;
  inset: 0 !important;
  width: 375px !important;
  height: 812px !important;
  z-index: 2000 !important;
}

.detail-screen :deep(.van-popup) {
  position: absolute !important;
  max-width: 375px !important;
  z-index: 2001 !important;
}

.detail-screen :deep(.van-dialog) {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  width: 320px !important;
  max-width: 320px !important;
  z-index: 2002 !important;
}

.detail-scroll {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: 86px;
  scrollbar-width: none;
}

.detail-scroll::-webkit-scrollbar {
  display: none;
}

/* 1. 恢复顶部航线地图区 (220px 适中高度，还原完整 3D 港口气泡、时间与航线) */
.map-section {
  position: relative;
  width: 375px;
  height: 220px;
  overflow: hidden;
}

.map-image {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 220px;
  object-fit: cover;
}

.status-bar {
  position: absolute;
  z-index: 8;
  inset: 0 auto auto 0;
  width: 375px;
  height: 72px;
  pointer-events: none;
}

.back-button {
  position: absolute;
  z-index: 10;
  left: 8px;
  top: 46px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.header-title {
  position: absolute;
  z-index: 9;
  left: 46px;
  top: 49px;
  margin: 0;
  color: #333333;
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
}

.route-image {
  position: absolute;
  z-index: 2;
  left: 142px;
  top: 90px;
  width: 106px;
  height: 90px;
  object-fit: contain;
}

.port-card {
  position: absolute;
  z-index: 4;
  width: 165px;
  color: #333333;
}

.load-port {
  left: 166px;
  top: 80px;
  width: 155px;
}

.unload-port {
  left: 30px;
  top: 125px;
  width: 160px;
}

.port-label {
  position: absolute;
  z-index: 2;
  left: 8px;
  top: 0;
  height: 22px;
  padding: 2px 8px 0;
  border-radius: 6px 6px 0 0;
  color: #ffffff;
  font-size: 11px;
  line-height: 16px;
}

.load-label { background: #3a65ff; }
.unload-label { background: #34c7a9; }

.port-content {
  position: absolute;
  left: 8px;
  top: 18px;
  width: 145px;
  min-height: 36px;
  padding: 4px 6px;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.port-name {
  color: #222222;
  font-size: 11.5px;
  font-weight: 700;
  line-height: 15px;
  white-space: nowrap;
}

.port-time {
  color: #666666;
  font-size: 9.5px;
  line-height: 13px;
  white-space: nowrap;
}

.port-line {
  position: absolute;
  left: 70px;
  top: 54px;
  width: 2px;
  height: 12px;
  background: #333333;
}

.port-anchor {
  position: absolute;
  left: 67.5px;
  top: 64px;
  width: 7px;
  height: 7px;
  border: 1px solid #ffffff;
  border-radius: 50%;
  background: #34c7a9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.route-distance {
  position: absolute;
  z-index: 5;
  left: 175px;
  top: 138px;
  height: 18px;
  padding: 1px 6px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.72);
  color: #ffffff;
  font-size: 9.5px;
  line-height: 16px;
}

/* 2. 内容面板区 (-8px 上浮圆角衔接) */
.detail-sheet {
  position: relative;
  z-index: 6;
  width: 375px;
  min-height: 520px;
  margin-top: -8px;
  padding: 0 0 16px;
  border-radius: 12px 12px 0 0;
  background: #eff1f6;
}

/* 喇叭提示栏 */
.bidding-notice {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #55627a;
  font-size: 12px;
  font-weight: 500;
}

.notice-left {
  display: flex;
  align-items: center;
}

.notice-left img {
  width: 13px;
  height: 13px;
  margin-right: 6px;
}

.notice-badge {
  padding: 2px 6px;
  border-radius: 4px;
  background: #eef3ff;
  color: #3a65ff;
  font-size: 11px;
  font-weight: 600;
}

.notice-badge.readonly {
  background: #e6f7f2;
  color: #149e77;
}

/* 3. 紧凑单行货物摘要 */
.compact-cargo-bar {
  width: 343px;
  margin: 0 16px 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  box-shadow: 0 1px 3px rgba(39, 62, 103, 0.04);
}

.cargo-specs {
  color: #222222;
  font-weight: 700;
}

.ref-price {
  color: #3a65ff;
  font-weight: 600;
}

/* 白色分组卡片规范 */
.design-card {
  width: 343px;
  margin: 0 16px 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(39, 62, 103, 0.04);
}

.card-sec-header {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sec-title {
  color: #111111;
  font-size: 14px;
  font-weight: 700;
}

/* 区分只读与填写表单行 */
.form-row-horizontal {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f2f3f7;
  font-size: 14px;
  padding: 0 2px;
}

.form-row-horizontal.no-border {
  border-bottom: 0;
}

.form-row-horizontal.readonly-bg {
  background: #f7f8fa;
  padding: 0 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  border-bottom: 0;
}

.readonly-lbl {
  color: #778499 !important;
  font-weight: 400 !important;
}

.readonly-val {
  color: #778499 !important;
  font-weight: 500 !important;
}

.form-row-horizontal.row-error {
  background: #fff8f8;
  border: 1px solid #f53f3f;
  border-radius: 4px;
}

.row-label {
  color: #222222;
  font-size: 14px;
  font-weight: 500;
}

.row-label.required::after {
  content: " *";
  color: #f53f3f;
}

.optional-tag {
  font-style: normal;
  color: #999999;
  font-size: 11px;
  font-weight: 400;
}

.row-val {
  color: #222222;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
}

.row-val.placeholder {
  color: #a7a7a7;
  font-weight: 400;
}

.row-val.highlight-price {
  color: #3a65ff;
  font-size: 16px;
  font-weight: 700;
}

.row-val-action {
  display: flex;
  align-items: center;
  gap: 4px;
}

.row-inline-input {
  height: 32px;
  border: 0;
  background: transparent;
  color: #222222;
  font-size: 14px;
  text-align: right;
  outline: none;
  font-weight: 600;
}

.row-inline-input.number {
  width: 90px;
}

.unit-suffix {
  color: #8b94a5;
  font-size: 13px;
  margin-left: 2px;
}

.inline-err-text {
  display: block;
  margin-top: 2px;
  color: #f53f3f;
  font-size: 11px;
  text-align: right;
}

/* 多行文本区域 */
.form-row-vertical {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-bottom: 1px solid #f2f3f7;
}

.form-row-vertical.no-border {
  border-bottom: 0;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-align {
  display: flex;
  align-items: center;
}

.word-limit {
  color: #a7a7a7;
  font-size: 11px;
}

.row-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e9f2;
  border-radius: 6px;
  background: #f8f9fc;
  color: #222222;
  font-size: 13px;
  outline: none;
  resize: none;
}

.row-val-multiline {
  color: #4e5969;
  font-size: 13px;
  line-height: 18px;
}

/* 运力竞价报价说明默认常驻展 */
.quote-remark-box-always {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f8f9fc;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 其他费用 */
.extra-fee-wrapper {
  margin-top: 6px;
}

.add-extra-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3a65ff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
}

.extra-fee-box {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f8f9fc;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.extra-fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.extra-lbl { color: #666666; }

.extra-input {
  width: 120px;
  height: 28px;
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  font-size: 12px;
  outline: none;
  text-align: right;
}

.extra-input.number {
  width: 80px;
}

.del-fee-btn {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.tag-selector {
  display: flex;
  gap: 6px;
}

.value-tag {
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #666666;
  font-size: 11.5px;
  cursor: pointer;
}

.value-tag.active {
  border-color: #3a65ff;
  background: #eef3ff;
  color: #3a65ff;
  font-weight: 600;
}

.add-file-btn {
  padding: 2px 6px;
  border: 1px solid #3a65ff;
  border-radius: 4px;
  background: #eef3ff;
  color: #3a65ff;
  font-size: 11px;
  cursor: pointer;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.file-item-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f0f3fa;
  color: #333333;
  font-size: 12px;
}

.del-file-btn {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.no-file-tip {
  color: #a7a7a7;
  font-size: 12px;
}

/* 确认弹窗 */
.confirm-modal-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-row .lbl { color: #666666; }
.confirm-row .val { color: #222222; font-weight: 600; }
.confirm-row .val.highlight { color: #3a65ff; }
.confirm-row .val.total { color: #3a65ff; font-size: 16px; font-weight: 800; }

/* 底部固定操作栏 */
.detail-action {
  position: absolute;
  z-index: 20;
  left: 0;
  right: 0;
  bottom: 0;
  width: 375px;
  height: 70px;
  padding: 10px 24px 20px;
  background: #ffffff;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-sum-box {
  display: flex;
  flex-direction: column;
}

.sum-label {
  color: #8b94a5;
  font-size: 10px;
  line-height: 12px;
}

.sum-val {
  color: #3a65ff;
  font-size: 20px;
  line-height: 24px;
  font-weight: 800;
}

.submit-btn {
  width: 140px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: #3a65ff;
  color: #ffffff;
  font-size: 15px;
  line-height: 40px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn.readonly {
  background: #eef3ff;
  color: #3a65ff;
  border: 1px solid #3a65ff;
}

/* 选择器 Actionsheet */
.sheet-picker-list {
  padding: 12px 16px 32px;
}

.sheet-picker-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f4f6fa;
  cursor: pointer;
}

.sheet-picker-item:active {
  background: #eef3ff;
}

.item-title {
  color: #333333;
  font-size: 14px;
  font-weight: 700;
}

.item-desc {
  margin-top: 4px;
  color: #778499;
  font-size: 12px;
}

@media (max-width: 420px) {
  .quote-preview {
    min-height: 812px;
    padding: 0;
    background: #eff1f6;
  }

  .detail-screen {
    width: 100vw;
    max-width: 375px;
    box-shadow: none;
  }
}
</style>
