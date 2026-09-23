<template>
  <div class="publish-flow">
    <div v-show="step !== 3" class="publish-map" aria-label="福州至厦门运输路线地图">
      <img src="/zhiyun-mobile-assets/quick-publish-map-reference.png" alt="" />
      <button class="back-hotspot" type="button" aria-label="返回" @click="handleBack"></button>
    </div>

    <section v-if="step === 1" class="publish-sheet form-sheet" aria-label="填写货源计划">
      <div v-if="prefill?.targetFleet" class="prefill-banner">
        <p class="prefill-title">定向发布 · 已选择{{ prefill.targetFleet.kind === 'driver' ? '司机' : '车队' }}</p>
        <p class="prefill-line">{{ prefill.targetFleet.name }}</p>
        <p class="prefill-note">请填写本次货源信息</p>
      </div>
      <div v-else-if="prefill?.route" class="prefill-banner">
        <p class="prefill-title">来自行情测算</p>
        <p class="prefill-line">{{ prefill.route }} · {{ prefill.goods }} · {{ prefill.quantity }}吨 · {{ prefill.price }}元/吨</p>
        <p class="prefill-note">城市级线路，请核对并补充详细装卸地址后发布</p>
      </div>
      <div class="date-row">
        <button type="button" class="date-block" :class="{ 'date-empty': !loadDate }" @click="openPicker('load')">
          <template v-if="loadDate">
            <strong>{{ loadDate.split(' ')[0] }}</strong>
            <span>{{ loadDate.split(' ').slice(1).join(' ') }}</span>
          </template>
          <template v-else>
            <strong>选择</strong>
            <span>装货时间</span>
          </template>
        </button>
        <span class="duration-pill">共2天</span>
        <button type="button" class="date-block date-block-right" :class="{ 'date-empty': !unloadDate }" @click="openPicker('unload')">
          <template v-if="unloadDate">
            <strong>{{ unloadDate.split(' ')[0] }}</strong>
            <span>{{ unloadDate.split(' ').slice(1).join(' ') }}</span>
          </template>
          <template v-else>
            <strong>选择</strong>
            <span>卸货时间</span>
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

      <label class="form-row">
        <span class="form-label">运输单价</span>
        <span class="input-wrap price-input">
          <input v-model="price" inputmode="decimal" placeholder="请输入" />
          <b>元｜吨</b>
        </span>
      </label>

      <p v-if="weightError" class="form-error" role="alert">{{ weightError }}</p>
      <p v-else-if="!loadDate || !unloadDate" class="form-error" role="alert">请选择装货和卸货时间</p>
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

        <div class="platform-list">
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
        <p v-if="!selectedPlatforms.length" class="form-error mode-error" role="alert">请至少选择一个发布平台</p>
      </div>

      <div class="confirm-bar">
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

    <!-- 装卸货时间选择：沿用二级页底部弹层写法 -->
    <div v-if="pickerTarget" class="fp-overlay" @click.self="pickerTarget = ''">
      <section class="fp-sheet">
        <div class="fp-sheet-head">
          <h2>{{ pickerTarget === 'load' ? '选择装货时间' : '选择卸货时间' }}</h2>
          <button type="button" aria-label="关闭" @click="pickerTarget = ''">×</button>
        </div>
        <button
          v-for="option in dateOptions"
          :key="option.value"
          type="button"
          class="fp-option"
          @click="pickDate(option)"
        >
          <span class="fp-option-main">{{ option.label }}</span>
          <span class="fp-option-sub">{{ option.sub }}</span>
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import PlatformSelectRow from '../shared/PlatformSelectRow.vue'
import PublishSuccessPage from './PublishSuccessPage.vue'

const props = defineProps({ prefill: { type: Object, default: null } })
const emit = defineEmits(['back', 'published'])

const step = ref(1)
const loadModes = ['吨', '方', '车']
const loadMode = ref('吨')
const goodsText = ref(props.prefill?.goods || '普货')
const weight = ref(props.prefill?.quantity == null ? '' : String(props.prefill.quantity))
const price = ref(props.prefill?.price == null ? '' : String(props.prefill.price))

/* 装卸货时间：默认空，必须由货主确认后才能进入下一步 */
const loadDate = ref('')
const unloadDate = ref('')
const pickerTarget = ref('') // '' | 'load' | 'unload'
const dateOptions = [
  { value: '05月07日 周二 09:00', label: '05月07日', sub: '周二 09:00装货' },
  { value: '05月08日 周三 09:00', label: '05月08日', sub: '周三 09:00装货' },
  { value: '05月09日 周四 09:00', label: '05月09日', sub: '周四 09:00装货' },
  { value: '05月10日 周五 09:00', label: '05月10日', sub: '周五 09:00装货' },
]

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
const canGoStep2 = computed(() => !weightError.value && Boolean(loadDate.value) && Boolean(unloadDate.value))

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
}))

const openPicker = (target) => { pickerTarget.value = target }
const pickDate = (option) => {
  if (pickerTarget.value === 'load') loadDate.value = option.value
  else unloadDate.value = option.value
  pickerTarget.value = ''
}

const handleBack = () => {
  if (step.value === 2) {
    step.value = 1
    return
  }
  emit('back')
}

const goSuccess = () => {
  if (!selectedPlatforms.value.length) return
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

/* 固定在面板下沿，与滚动内容分离 */
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

/* 装卸货时间弹层：与二级页底部弹层同一套 */
.fp-overlay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: flex-end; background: rgba(0, 0, 0, 0.4); }
.fp-sheet { width: 100%; background: #fff; border-radius: 12px 12px 0 0; padding: 16px 16px 20px; box-sizing: border-box; }
.fp-sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.fp-sheet-head h2 { margin: 0; color: #252b3a; font-size: 16px; font-weight: 700; }
.fp-sheet-head button { border: 0; background: none; color: #747c8c; font-size: 20px; line-height: 1; cursor: pointer; }
.fp-option {
  width: 100%;
  height: 52px;
  padding: 0;
  border: 0;
  border-top: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  cursor: pointer;
}
.fp-option-main { color: #252b3a; font-size: 15px; font-weight: 600; }
.fp-option-sub { color: #747c8c; font-size: 12px; }
</style>
