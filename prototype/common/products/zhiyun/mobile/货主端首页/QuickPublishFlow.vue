<template>
  <div class="publish-flow" data-annotation-container="modal" :data-annotation-content="addressPickerMode || editingAddress || ruleSheetOpen || pickerTarget ? null : 'modal'">
    <div v-show="step !== 3 && !addressPickerMode && !editingAddress && !ruleSheetOpen && !pickerTarget" class="publish-map" :class="{ 'annot-zhiyunShipperHome-field-publish-address-review': step === 1 }" aria-label="福州至厦门运输路线地图">
      <img src="/zhiyun-mobile-assets/quick-publish-map-reference.png" alt="" />
      <button class="back-hotspot" type="button" aria-label="返回" @click="handleBack"></button>
      <button v-for="mode in ['load', 'unload']" :key="mode" type="button" class="address-pin" :class="`address-pin-${mode}`" @click="openAddress(mode)">
        <span class="address-pin-label">{{ mode === 'load' ? '装货点' : '卸货点' }}</span>
        <strong>{{ addresses[mode]?.name || (mode === 'load' ? '请选择装货地址' : '请选择卸货地址') }}</strong>
        <small>{{ addresses[mode] ? ([addresses[mode].contactName, addresses[mode].contactPhone].filter(Boolean).join(' ') || '联系人选填') : '点击选择地址 · 联系人选填' }}</small>
        <b>›</b>
      </button>
      <span class="route-demo-label">路线示意 · 实际里程以所选地址为准</span>

    </div>

    <section v-if="step === 1" v-show="!addressPickerMode && !editingAddress && !ruleSheetOpen && !pickerTarget" class="publish-sheet form-sheet annot-zhiyunShipperHome-field-publish-transport-conditions" aria-label="填写货源计划">
      <div v-if="prefill?.targetFleet" class="prefill-banner annot-zhiyunShipperHome-rule-target-driver">
        <p class="prefill-title">定向发布 · 已选择{{ prefill.targetFleet.kind === 'driver' ? '司机' : '车队' }}</p>
        <p class="prefill-line">{{ prefill.targetFleet.name }}</p>
        <p class="prefill-note">请填写本次货源信息</p>
      </div>
      <div v-else-if="prefill?.route" class="prefill-banner">
        <p class="prefill-title">来自行情测算</p>
        <p class="prefill-line">{{ prefill.route }} · {{ prefill.goods }} · {{ prefill.quantity }}吨 · {{ prefill.price }}元/吨</p>
        <p class="prefill-note">城市级线路，请核对并补充详细装卸地址后发布</p>
      </div>
      <div v-else-if="prefill?.resumeDraft" class="prefill-banner">
        <p class="prefill-title">继续发布 · {{ prefill.resumeDraft.cargoNo }}</p>
        <p class="prefill-line">已带出该货源已填写的信息</p>
        <p class="prefill-note">请核对并补充装卸地址与时间后发布</p>
      </div>
      <div class="date-row">
        <button type="button" class="date-block" :class="{ 'date-empty': !loadDate }" @click="openPicker('load')">
          <template v-if="loadDate">
            <strong>{{ formatDate(loadDate) }}</strong>
            <span>装货日期</span>
          </template>
          <template v-else>
            <strong>选择</strong>
            <span>装货日期</span>
          </template>
        </button>
        <span class="duration-pill">{{ durationText }}</span>
        <button type="button" class="date-block date-block-right" :class="{ 'date-empty': !unloadDate }" @click="openPicker('unload')">
          <template v-if="unloadDate">
            <strong>{{ formatDate(unloadDate) }}</strong>
            <span>卸货日期</span>
          </template>
          <template v-else>
            <strong>选择</strong>
            <span>卸货日期</span>
          </template>
        </button>
      </div>

      <button type="button" class="form-row">
        <span class="form-label">货品</span>
        <span class="form-value">{{ goodsText }} <b>›</b></span>
      </button>

      <div class="form-row">
        <span class="form-label">配载方式</span>
        <div class="load-modes">
          <button
            v-for="mode in loadModes"
            :key="mode"
            type="button"
            :class="{ active: loadMode === mode }"
            @click="loadMode = mode"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <label class="form-row">
        <span class="form-label">需求重量</span>
        <span class="input-wrap">
          <input v-model="weight" inputmode="decimal" placeholder="请输入" />
          <b>吨</b>
        </span>
      </label>

      <div class="form-row road-loss-row">
        <span class="form-label">路耗容忍值</span>
        <div class="road-loss-inputs">
          <label>− <input v-model="roadLossMinus" inputmode="decimal" placeholder="选填" aria-label="允许少收吨数" /> 吨</label>
          <label>＋ <input v-model="roadLossPlus" inputmode="decimal" placeholder="选填" aria-label="允许多收吨数" /> 吨</label>
        </div>
      </div>

      <button type="button" class="form-row" @click="ruleSheetOpen = true">
        <span class="form-label">核算规则</span>
        <span class="form-value">{{ selectedRuleTemplate?.name || '选择模板' }}{{ ruleCustomized ? ' · 已调整' : '' }} <b>›</b></span>
      </button>
      <p v-if="selectedRuleTemplate" class="rule-summary">补贴 {{ subsidy || 0 }} 元 · 扣减 {{ deduction || 0 }} 元 · {{ rounding }}</p>

      <label class="form-row">
        <span class="form-label">运输单价</span>
        <span class="input-wrap price-input">
          <input v-model="price" inputmode="decimal" placeholder="请输入" />
          <b>元｜吨</b>
        </span>
      </label>

      <div class="form-row">
        <span class="form-label">是否开票</span>
        <div class="invoice-options">
          <button type="button" :class="{ active: invoiceRequired === true }" @click="invoiceRequired = true">需要开票</button>
          <button type="button" :class="{ active: invoiceRequired === false }" @click="invoiceRequired = false">无需开票</button>
        </div>
      </div>

      <p v-if="publishError" class="form-error" role="alert">{{ publishError }}</p>
    </section>

    <section v-else class="publish-sheet mode-sheet" aria-label="选择发布方式">
      <div class="mode-scroll">
        <header class="mode-head">
          <h2>选择发布方式</h2>
          <p>当前线路可用运力共238辆，覆盖3个平台，最快8分钟响应</p>
        </header>

        <div class="publish-modes" role="group" aria-label="发布方式">
          <button
            v-for="mode in publishModes"
            :key="mode.key"
            type="button"
            :class="{ active: publishMode === mode.key }"
            @click="publishMode = mode.key"
          >
            {{ mode.label }}
            <span v-if="publishMode === mode.key" class="mode-check">✓</span>
          </button>
        </div>

        <div class="platform-list annot-zhiyunShipperHome-rule-publish-platform-quota">
          <PlatformSelectRow
            v-for="platform in platformRows"
            :key="platform.id"
            :logo="platform.logo"
            :logo-color="platform.color"
            :name="platform.name"
            :feature="platform.feature"
            :state="platform.stateText"
            :state-label="platform.stateLabel"
            :state-value="platform.stateValue"
            state-unit=""
            :muted="platform.quotaBlocked"
            :meta="platform.metaText"
            :checked="selectedPlatforms.includes(platform.id)"
            :selectable="!platform.quotaBlocked"
            @select="togglePlatform(platform.id)"
          />
        </div>
        <p class="filter-note">平台承接情况实时变化，以提交时为准</p>
        <p v-if="submissionError" class="form-error mode-error" role="alert">{{ submissionError }}</p>
        <p v-if="!selectedPlatforms.length" class="form-error mode-error" role="alert">请至少选择一个发布平台</p>
      </div>

      <div class="confirm-bar annot-zhiyunShipperHome-rule-publish-price-estimate">
        <div class="estimate-total">
          <span v-if="estimateTotal">预估 <b>{{ estimateTotal }}</b> 元</span>
          <span v-else>预估 —</span>
          <small>已选{{ selectedPlatforms.length }}个平台</small>
        </div>
        <button type="button" class="confirm-action" :disabled="!selectedPlatforms.length" @click="goSuccess">确认发布</button>
      </div>
    </section>

    <!-- 第一步的操作栏：固定在面板之上，不随表单内容滚动 -->
    <div v-if="step === 1" class="primary-action-bar">
      <button type="button" class="primary-action" :disabled="!canGoStep2" @click="step = 2">
        下一步，选择发布方式
      </button>
    </div>

    <!-- 第三步：发布成功 + 推荐运力（Pixso 7:798） -->
    <PublishSuccessPage v-if="step === 3" :published="publishedInfo" @back="backToHome" />

    <AddressPickerPage
      v-if="addressPickerMode"
      :mode="addressPickerMode"
      @back="addressPickerMode = ''"
      @confirm="onAddressPicked"
      @set-alias="addressPickerMode = ''"
    />

    <div v-if="editingAddress" class="fp-overlay" data-annotation-container="drawer" @click.self="editingAddress = ''">
      <section class="fp-sheet detail-sheet annot-zhiyunShipperHome-field-publish-address-edit" data-annotation-content="drawer">
        <div class="fp-sheet-head">
          <h2>{{ editingAddress === 'load' ? '装货地址与联系人' : '卸货地址与联系人' }}</h2>
          <button type="button" aria-label="关闭" @click="editingAddress = ''">×</button>
        </div>
        <button type="button" class="detail-change" @click="changeAddress">{{ addressDraft.name || '选择地址' }} <span>更换地址 ›</span></button>
        <label class="detail-field">详细地址<input v-model.trim="addressDraft.detail" placeholder="请输入门牌号等详细地址" /></label>
        <label class="detail-field">地址联系人（选填）<input v-model.trim="addressDraft.contactName" placeholder="请输入联系人姓名" /></label>
        <label class="detail-field">联系电话（选填）<input v-model.trim="addressDraft.contactPhone" inputmode="tel" placeholder="请输入联系电话" /></label>
        <p v-if="addressError" class="form-error" role="alert">{{ addressError }}</p>
        <button type="button" class="detail-save" @click="saveAddress">保存地址信息</button>
      </section>
    </div>

    <div v-if="ruleSheetOpen" class="fp-overlay" data-annotation-container="drawer" @click.self="ruleSheetOpen = false">
      <section class="fp-sheet rule-sheet annot-zhiyunShipperHome-rule-publish-template-local" data-annotation-content="drawer">
        <div class="fp-sheet-head"><h2>核算规则</h2><button type="button" aria-label="关闭" @click="ruleSheetOpen = false">×</button></div>
        <p class="sheet-hint">选择示例模板会带入规则，本单各项仍可修改</p>
        <div class="rule-template-list">
          <button v-for="item in ruleTemplates" :key="item.id" type="button" :class="{ active: ruleTemplateId === item.id }" @click="applyRuleTemplate(item)">{{ item.name }}</button>
        </div>
        <p class="sheet-hint">运输单价已带入主表单，可直接在主表单修改</p>
        <label class="detail-field">补贴项（元）<input v-model="subsidy" inputmode="decimal" placeholder="0" /></label>
        <label class="detail-field">扣减项（元）<input v-model="deduction" inputmode="decimal" placeholder="0" /></label>
        <div class="rounding-row"><span>抹零规则</span><select v-model="rounding"><option>不抹零</option><option>抹去角分</option><option>四舍五入到元</option></select></div>
        <button type="button" class="detail-save" :disabled="!selectedRuleTemplate" @click="ruleSheetOpen = false">完成</button>
      </section>
    </div>

    <!-- 装卸货日期选择：沿用原日期列表弹层，只精确到日 -->
    <div v-if="pickerTarget" class="fp-overlay" data-annotation-container="drawer" @click.self="pickerTarget = ''">
      <section class="fp-sheet" data-annotation-content="drawer">
        <div class="fp-sheet-head">
          <h2>{{ pickerTarget === 'load' ? '选择装货日期' : '选择卸货日期' }}</h2>
          <button type="button" aria-label="关闭" @click="pickerTarget = ''">×</button>
        </div>
        <div class="date-option-list">
          <button v-for="option in dateOptions" :key="option.value" type="button" class="fp-option" @click="pickDate(option)">
            <span class="fp-option-main">{{ option.label }}</span>
            <span class="fp-option-sub">{{ option.sub }}</span>
          </button>
        </div>
        <p v-if="pickerError" class="form-error" role="alert">{{ pickerError }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import PlatformSelectRow from '../shared/PlatformSelectRow.vue'
import PublishSuccessPage from './PublishSuccessPage.vue'
import AddressPickerPage from './AddressPickerPage.vue'

const props = defineProps({ prefill: { type: Object, default: null } })
const emit = defineEmits(['back', 'published'])

const step = ref(1)
const loadModes = ['吨', '方', '车']
const loadMode = ref('吨')
const goodsText = ref(props.prefill?.goods || '普货')
const weight = ref(props.prefill?.quantity == null ? '' : String(props.prefill.quantity))
const price = ref(props.prefill?.price == null ? '' : String(props.prefill.price))
/* 首页仅传入货主确认过的地址；进入发布页后仍可点击两端地址更换或补充。 */
const addresses = ref({
  load: props.prefill?.addresses?.load ? { ...props.prefill.addresses.load } : null,
  unload: props.prefill?.addresses?.unload ? { ...props.prefill.addresses.unload } : null,
})
const addressPickerMode = ref('')
const editingAddress = ref('')
const addressDraft = ref({ name: '', detail: '', contactName: '', contactPhone: '' })
const addressError = ref('')
const roadLossMinus = ref('')
const roadLossPlus = ref('')
const invoiceRequired = ref(null)
/* 以下是可交互的原型示例模板，不代表生产环境已有配置。 */
const ruleTemplates = [
  { id: 'standard', name: '常规运输核算', price: '285', subsidy: '0', deduction: '0', rounding: '不抹零' },
  { id: 'subsidy', name: '含补贴运输核算', price: '300', subsidy: '100', deduction: '0', rounding: '四舍五入到元' },
]
const ruleTemplateId = ref('')
const ruleSheetOpen = ref(false)
const subsidy = ref('0')
const deduction = ref('0')
const rounding = ref('不抹零')
const selectedRuleTemplate = computed(() => ruleTemplates.find((item) => item.id === ruleTemplateId.value))
const ruleCustomized = computed(() => Boolean(selectedRuleTemplate.value) && (
  price.value !== selectedRuleTemplate.value.price ||
  subsidy.value !== selectedRuleTemplate.value.subsidy ||
  deduction.value !== selectedRuleTemplate.value.deduction ||
  rounding.value !== selectedRuleTemplate.value.rounding
))

const openAddress = (mode) => {
  addressError.value = ''
  if (!addresses.value[mode]) {
    addressPickerMode.value = mode
    return
  }
  addressDraft.value = { ...addresses.value[mode] }
  editingAddress.value = mode
}
const onAddressPicked = (addr) => {
  const previous = addresses.value[addr.mode]
  addressDraft.value = {
    name: addr.name,
    detail: addr.detail || '',
    contactName: previous?.name === addr.name ? previous.contactName : '',
    contactPhone: previous?.name === addr.name ? previous.contactPhone : '',
  }
  addressPickerMode.value = ''
  editingAddress.value = addr.mode
  addressError.value = ''
}
const changeAddress = () => {
  addressPickerMode.value = editingAddress.value
  editingAddress.value = ''
}
const saveAddress = () => {
  if (!addressDraft.value.name || !addressDraft.value.detail) addressError.value = '请补充详细地址'
  else if (addressDraft.value.contactPhone && !/^[+\d()\-\s]{6,20}$/.test(addressDraft.value.contactPhone)) addressError.value = '请填写有效联系电话或留空'
  else {
    addresses.value[editingAddress.value] = { ...addressDraft.value }
    editingAddress.value = ''
    addressError.value = ''
  }
}
const applyRuleTemplate = (item) => {
  ruleTemplateId.value = item.id
  price.value = item.price
  subsidy.value = item.subsidy
  deduction.value = item.deduction
  rounding.value = item.rounding
}

/* 装卸货日期默认空，选择后按日保存，不附带固定时分。 */
const loadDate = ref('')
const unloadDate = ref('')
const pickerTarget = ref('') // '' | 'load' | 'unload'
const pickerError = ref('')
const dateOptions = Array.from({ length: 7 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return {
    value: `${date.getFullYear()}-${month}-${day}`,
    label: `${month}月${day}日`,
    sub: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
  }
})
const formatDate = (value) => {
  const [, month, day] = value.split('-')
  return `${month}月${day}日`
}
const durationText = computed(() => {
  if (!loadDate.value || !unloadDate.value) return '待定'
  const elapsed = Date.parse(unloadDate.value) - Date.parse(loadDate.value)
  return elapsed >= 0 ? `共${Math.round(elapsed / 86400000) + 1}天` : '待核对'
})

const publishMode = ref('platform')
const publishModes = [
  { key: 'platform', label: '指定平台' },
  { key: 'carrier', label: '指定承运商' },
  { key: 'public', label: '全部公开' },
]
/* 与行情页同一批平台；承运价以货主填写的运输单价为准，平台不再各自报价。
   quotaBlocked 模拟平台侧承接能力已满：行保留展示但不可勾选，文案不出现额度概念 */
const platforms = [
  { id: 'zhiyun', logo: '象', name: '象奔奔', feature: '多式联运 适配大宗', capacity: 240, cover: '12省', response: 15, color: '#246df7' },
  { id: 'jinshi', logo: '金', name: '金石智运', feature: '网络货运 覆盖广', capacity: 32, cover: '8省', response: 15, color: '#52b8ea' },
  { id: 'haoyun', logo: '好运', name: '超好运', feature: '平台运力 响应快', capacity: 120, cover: '6省', response: 8, color: '#2389ee', quotaBlocked: true },
]
/* 默认沿用行情页勾选的平台；未从行情页进入时给一个可用的初始选择 */
const selectedPlatforms = ref(props.prefill?.platformIds?.length ? [...props.prefill.platformIds] : ['zhiyun', 'jinshi'])

const togglePlatform = (id) => {
  selectedPlatforms.value = selectedPlatforms.value.includes(id)
    ? selectedPlatforms.value.filter((item) => item !== id)
    : [...selectedPlatforms.value, id]
}

/* 非正数或空值阻断发布衔接，避免带着无效货量算钱 */
const weightNum = computed(() => Number(weight.value))
const weightError = computed(() => {
  const raw = weight.value
  if (!String(raw).trim()) return '请填写需求重量'
  if (!Number.isFinite(Number(raw))) return '需求重量请输入数字'
  if (Number(raw) <= 0) return '需求重量需大于0'
  return ''
})
const roadLossError = computed(() => {
  if ([roadLossMinus.value, roadLossPlus.value].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) return '路耗范围请输入非负数或留空'
  return ''
})
const roadLossSummary = computed(() => {
  if (roadLossMinus.value === '' && roadLossPlus.value === '') return '未设置'
  return `−${roadLossMinus.value || 0}/＋${roadLossPlus.value || 0} 吨`
})
const publishError = computed(() => {
  if (!addresses.value.load || !addresses.value.unload) return '请分别填写装货、卸货地址'
  if (!loadDate.value || !unloadDate.value) return '请选择装货和卸货日期'
  if (unloadDate.value < loadDate.value) return '卸货日期不能早于装货日期'
  if (weightError.value) return weightError.value
  if (roadLossError.value) return roadLossError.value
  if (!selectedRuleTemplate.value) return '请选择核算规则模板'
  if (!Number.isFinite(Number(price.value)) || Number(price.value) <= 0) return '运输单价需大于0'
  if ([subsidy.value, deduction.value].some((value) => value === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) return '补贴项和扣减项请输入非负数'
  if (invoiceRequired.value === null) return '请选择是否开票'
  return ''
})
const canGoStep2 = computed(() => !publishError.value)

/* 预估总价 = 货量 × 货主填写的运输单价，所有平台一致；不再按平台分别报价 */
const priceNum = computed(() => Number(price.value))
const platformRows = computed(() =>
  platforms.map((p) => ({
    ...p,
    /* 可选平台右侧给接单时效；已满平台只给一句状态说明 */
    stateLabel: p.quotaBlocked ? '' : '预计司机接单',
    stateValue: p.quotaBlocked ? '' : `${p.response}分钟`,
    stateText: p.quotaBlocked ? '接单已满' : '',
    metaText: p.quotaBlocked
      ? '今日承接已满，建议选择其他平台'
      : `平台运力${p.capacity}辆｜覆盖${p.cover}`,
  })),
)
const estimateTotal = computed(() => {
  if (weightNum.value <= 0 || !Number.isFinite(priceNum.value) || priceNum.value <= 0) return ''
  return (weightNum.value * priceNum.value).toLocaleString()
})

/* 成功页展示实际发布信息：货主填写的单价即发布单价 */
const publishedInfo = computed(() => ({
  goods: goodsText.value,
  quantity: weightNum.value > 0 ? weightNum.value : '',
  price: priceNum.value > 0 ? priceNum.value : '',
  loadDate: loadDate.value,
  unloadDate: unloadDate.value,
  loadAddress: addresses.value.load,
  unloadAddress: addresses.value.unload,
  roadLossMinus: roadLossMinus.value,
  roadLossPlus: roadLossPlus.value,
  ruleTemplate: selectedRuleTemplate.value?.name,
  subsidy: subsidy.value,
  deduction: deduction.value,
  rounding: rounding.value,
  invoiceRequired: invoiceRequired.value,
}))

const openPicker = (target) => {
  pickerTarget.value = target
  pickerError.value = ''
}
const pickDate = (option) => {
  if (pickerTarget.value === 'unload' && loadDate.value && option.value < loadDate.value) {
    pickerError.value = '卸货日期不能早于装货日期'
    return
  }
  if (pickerTarget.value === 'load') {
    loadDate.value = option.value
  } else {
    unloadDate.value = option.value
  }
  pickerTarget.value = ''
}

const handleBack = () => {
  if (step.value === 2) {
    step.value = 1
    return
  }
  emit('back')
}

// 发布时重新检查所选平台，状态变化时先提示并要求重新核对。
const submissionError = ref('')
const goSuccess = () => {
  submissionError.value = ''
  if (publishError.value || !selectedPlatforms.value.length) return
  const changedPlatforms = selectedPlatforms.value.filter((id) => !platforms.some((p) => p.id === id && !p.quotaBlocked))
  if (changedPlatforms.length) {
    const names = changedPlatforms.map((id) => platforms.find((p) => p.id === id)?.name || id)
    selectedPlatforms.value = selectedPlatforms.value.filter((id) => !changedPlatforms.includes(id))
    submissionError.value = `${names.join('、')}当前不可承接，请重新核对发布平台`
    return
  }
  step.value = 3
}

const backToHome = () => {
  step.value = 1
  emit('back')
}
</script>

<style scoped>
.publish-flow {
  position: absolute;
  inset: 0;
  z-index: 100;
  overflow: hidden;
  background: #f5f7fb;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.publish-map {
  position: absolute;
  inset: 0 0 auto;
  height: 406px;
  overflow: hidden;
  background: #e9f1fb;
}

.publish-map > img {
  position: absolute;
  inset: 0;
  width: 375px;
  height: 812px;
  object-fit: fill;
}

.back-hotspot {
  position: absolute;
  left: 7px;
  top: 42px;
  width: 34px;
  height: 42px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.address-pin {
  position: absolute;
  z-index: 1;
  width: 174px;
  min-height: 58px;
  padding: 10px 20px 7px 10px;
  border: 0;
  border-radius: 9px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(42, 69, 111, 0.2);
  text-align: left;
  color: #2b3444;
  cursor: pointer;
}
.address-pin-load { top: 88px; right: 17px; }
.address-pin-unload { top: 276px; left: 16px; }
.address-pin-label {
  position: absolute;
  bottom: 100%;
  left: 0;
  padding: 3px 8px;
  border-radius: 6px 6px 0 0;
  background: #3866ff;
  color: #fff;
  font-size: 10px;
}
.address-pin-unload .address-pin-label { background: #20b99e; }
.address-pin strong, .address-pin small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.address-pin strong { font-size: 12px; line-height: 17px; }
.address-pin small { margin-top: 2px; color: #8a91a1; font-size: 10px; }
.address-pin b { position: absolute; right: 8px; top: 17px; color: #8a91a1; font-size: 18px; font-weight: 400; }
.route-demo-label { position: absolute; z-index: 1; top: 192px; left: 50%; transform: translateX(-50%); padding: 4px 7px; border-radius: 3px; background: #3c4655; color: #fff; white-space: nowrap; font-size: 10px; }

/* 地图底部的智运运营条：地图底图是整页截图，底部烘焙着旧版「至小简」提示；
   用一条实底横带覆盖该区域，第二步只保留这一条运营表达 */

.publish-sheet {
  position: absolute;
  left: 0;
  right: 0;
  top: 405px;
  bottom: 0;
  z-index: 2;
  box-sizing: border-box;
  border-radius: 20px 20px 0 0;
  background: #fff;
  /* 内容超出面板高度时滚动 */
  overflow-y: auto;
  scrollbar-width: none;
}
.publish-sheet::-webkit-scrollbar { display: none; }

/* 表单面板底部止于固定操作栏上沿（操作栏高 79px + 底距 20px） */
.form-sheet {
  bottom: 99px;
  padding: 24px 29px 20px;
}

.prefill-banner{margin-bottom:10px;padding:9px 11px;border-radius:8px;background:#eef4ff}
.prefill-title{margin:0;color:#3a65ff;font-size:11px;font-weight:700}
.prefill-line{margin:3px 0 0;color:#1f2a3d;font-size:13px;font-weight:600}
.prefill-note{margin:2px 0 0;color:#747c8c;font-size:11px}

.date-row {
  position: relative;
  height: 72px;
  display: flex;
  justify-content: space-between;
}

.date-block {
  width: 128px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #333;
  text-align: left;
}

.date-block-right { text-align: right; }
.date-block strong {
  display: block;
  font-size: 20px;
  line-height: 27px;
  font-weight: 500;
}
.date-block span {
  display: block;
  margin-top: 3px;
  color: #999;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
}

.duration-pill {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 58px;
  height: 20px;
  border: 1px solid #d8dce6;
  border-radius: 11px;
  color: #596171;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.duration-pill::before,
.duration-pill::after {
  content: '';
  position: absolute;
  top: 9px;
  width: 30px;
  height: 1px;
  background: #e5e7ed;
}
.duration-pill::before { right: 58px; }
.duration-pill::after { left: 58px; }

.form-row {
  width: 100%;
  height: 51px;
  padding: 0;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  color: #333;
  text-align: left;
}
.form-label {
  font-size: 16px;
  font-weight: 500;
}
.form-value {
  font-size: 14px;
  color: #333;
}
.form-value b {
  margin-left: 5px;
  color: #999;
  font-size: 19px;
  font-weight: 400;
}

.load-modes {
  display: flex;
  gap: 8px;
}
.load-modes button {
  width: 38px;
  height: 27px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: #f5f5f6;
  color: #555;
  font-size: 13px;
}
.load-modes button.active {
  border: 1px solid #3866ff;
  background: #edf2ff;
  color: #3866ff;
}

.input-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 14px;
}
.input-wrap input {
  width: 70px;
  padding: 0 6px 0 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #333;
  font: inherit;
  text-align: right;
}
.input-wrap input::placeholder { color: #aaa; }
.input-wrap b { font-weight: 500; }
.price-input input { width: 66px; }
.road-loss-row { height: 55px; }
.road-loss-inputs { display: flex; align-items: center; gap: 6px; }
.road-loss-inputs label { display: flex; align-items: center; gap: 3px; color: #596171; font-size: 11px; white-space: nowrap; }
.road-loss-inputs input { width: 38px; padding: 5px 2px; border: 1px solid #e1e6ef; border-radius: 4px; outline-color: #3866ff; text-align: center; font-size: 12px; }
.road-loss-inputs input::placeholder { color: #aaa; font-size: 10px; }
.rule-summary { margin: -6px 0 4px; color: #8a91a1; text-align: right; font-size: 10px; }
.invoice-options { display: flex; gap: 6px; }
.invoice-options button { padding: 6px 8px; border: 1px solid transparent; border-radius: 5px; background: #f5f5f6; color: #555; font-size: 11px; }
.invoice-options button.active { border-color: #3866ff; background: #edf2ff; color: #3866ff; }

.primary-action-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 20px;
  z-index: 3;
  height: 79px;
  padding: 15px 28px 16px;
  box-sizing: border-box;
  border-top: 1px solid #edf0f5;
  background: #fff;
}
.primary-action {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 6px;
  background: #3866ff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.primary-action:disabled {
  background: #b9c4d9;
  cursor: not-allowed;
}

/* 未选择时间时的占位态 */
.date-block.date-empty strong { color: #b6bcc8; }
.date-block.date-empty span { color: #b6bcc8; }

.form-error {
  margin: 2px 0 0;
  color: #d56b34;
  font-size: 12px;
  line-height: 17px;
  font-weight: 600;
}

/* 面板本身不分栏：内容区滚动、确认栏固定在下沿，两者互不遮挡 */

/* 智运运营条：一行讲清智运替货主做了什么，规模作副行辅助。
   压扁成窄条，把版面留给平台列表 */

/* 发布方式：两个投递方式并列，独立横排，不进标签竖排 */

/* 我的运力：车队与个体司机合并为一份名单，勾选后发出邀请 */

/* 决策口径：横排次级，切换后重新排序，不是静态高亮 */

/* 左竖排按运输方式筛选，右侧内容区顶部横排口径 */

/* 展开全部平台 / 收起 */

/* 批量选择：规模下勾选平台不宜逐个点 */

/* 固定在面板下沿，与滚动内容分离 */

/* 装卸货时间弹层：与二级页底部弹层同一套 */
.fp-overlay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: flex-end; background: rgba(0, 0, 0, 0.4); }
.fp-sheet { width: 100%; background: #fff; border-radius: 12px 12px 0 0; padding: 16px 16px 20px; box-sizing: border-box; }
.fp-sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.fp-sheet-head h2 { margin: 0; color: #252b3a; font-size: 16px; font-weight: 700; }
.fp-sheet-head button { border: 0; background: none; color: #747c8c; font-size: 20px; line-height: 1; cursor: pointer; }
.date-option-list { max-height: 340px; overflow-y: auto; }
.fp-option { width: 100%; height: 52px; padding: 0; border: 0; border-top: 1px solid #eef2f6; display: flex; align-items: center; justify-content: space-between; background: transparent; cursor: pointer; }
.fp-option-main { color: #252b3a; font-size: 15px; font-weight: 600; }
.fp-option-sub { color: #747c8c; font-size: 12px; }
.detail-sheet, .rule-sheet { padding-bottom: 28px; }
.detail-change { width: 100%; margin: 8px 0; padding: 12px 0; border: 0; border-bottom: 1px solid #eef2f6; background: transparent; text-align: left; color: #252b3a; font-size: 14px; font-weight: 600; }
.detail-change span { float: right; color: #3866ff; font-size: 12px; font-weight: 400; }
.detail-field { min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #eef2f6; color: #333; font-size: 13px; white-space: nowrap; }
.detail-field input { min-width: 0; width: 60%; padding: 8px 0; border: 0; outline: 0; text-align: right; font: inherit; }
.detail-save { width: 100%; height: 46px; margin-top: 16px; border: 0; border-radius: 6px; background: #3866ff; color: #fff; font-size: 15px; font-weight: 600; }
.detail-save:disabled { background: #b9c4d9; }
.sheet-hint { margin: 6px 0 10px; color: #8a91a1; font-size: 11px; line-height: 16px; }
.rule-template-list { display: flex; gap: 8px; }
.rule-template-list button { flex: 1; min-height: 38px; border: 1px solid #e1e6ef; border-radius: 5px; background: #fff; color: #3d4555; font-size: 12px; }
.rule-template-list button.active { border-color: #3866ff; background: #edf2ff; color: #3866ff; }
.rounding-row { display: flex; align-items: center; justify-content: space-between; height: 46px; border-bottom: 1px solid #eef2f6; color: #333; font-size: 13px; }
.rounding-row select { max-width: 60%; border: 0; background: #fff; color: #333; font: inherit; text-align: right; }
.mode-sheet {
  display: flex;
  flex-direction: column;
  padding: 12px 12px 16px;
}
.mode-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.mode-scroll::-webkit-scrollbar { display: none; }
.mode-head h2 {
  margin: 0;
  color: #252b3a;
  font-size: 17px;
  line-height: 23px;
  font-weight: 700;
}
.mode-head p {
  margin: 3px 0 6px;
  color: #747c8c;
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
}

.publish-modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.publish-modes button {
  position: relative;
  height: 42px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 5px;
  background: #f5f5f5;
  color: #3d4555;
  font-size: 13px;
  font-weight: 500;
}
.publish-modes button.active {
  border-color: #3866ff;
  background: #eef3ff;
  color: #3866ff;
}
.mode-check {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 15px;
  height: 15px;
  border-radius: 5px 0 4px 0;
  background: #3866ff;
  color: #fff;
  font-size: 10px;
  line-height: 15px;
}

.platform-list { margin-top: 7px; }
.mode-error { margin: 4px 0 0; }
.filter-note { margin: 5px 0 0; color: #8a91a1; font-size: 10px; line-height: 14px; }
.confirm-bar {
  flex: 0 0 49px;
  margin-top: 8px;
  display: flex;
  overflow: hidden;
  border-radius: 6px;
}
.estimate-total {
  width: 190px;
  padding: 7px 12px;
  box-sizing: border-box;
  background: #555762;
  color: #fff;
}
.estimate-total span {
  display: block;
  font-size: 10px;
  line-height: 17px;
}
.estimate-total b { font-size: 16px; }
.estimate-total small {
  display: block;
  color: rgba(255, 255, 255, 0.68);
  font-size: 9px;
  line-height: 12px;
}
.confirm-action {
  flex: 1;
  border: 0;
  background: #3866ff;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.confirm-action:disabled { background: #b9c4d9; cursor: not-allowed; }
</style>
