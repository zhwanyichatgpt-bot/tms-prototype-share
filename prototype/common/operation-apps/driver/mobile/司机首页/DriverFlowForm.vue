<template>
  <div class="driver-flow-form" :aria-label="isLoading ? '装货' : '卸货'">
    <div class="driver-status" aria-hidden="true"><strong>9:41</strong><span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span></div>

    <header class="flow-form-header">
      <button type="button" :aria-label="`返回${isLoading ? '跑货' : '运单详情'}`" @click="emit('back')"><van-icon name="arrow-left" /></button>
      <h1>{{ isLoading ? '装货' : '卸货' }}</h1>
      <span class="flow-form-capsule"><van-icon name="ellipsis" /></span>
    </header>

    <div class="flow-form-scroll">
      <section class="flow-form-card">
        <div class="flow-row required">
          <label>{{ isLoading ? '装货时间' : '卸货时间' }}</label>
          <button type="button" class="row-value" style="border:0;background:transparent;padding:0" @click="timeSheetOpen = true">
            <span class="value-text" :class="{ placeholder: !eventTime }">{{ eventTime || '请选择' }}</span>
            <van-icon name="arrow" class="chevron" />
          </button>
        </div>

        <div class="flow-row required">
          <label>{{ isLoading ? '装货重量' : '卸货重量' }}</label>
          <span class="row-value">
            <input v-model="weight" type="number" inputmode="decimal" placeholder="请输入" :aria-label="isLoading ? '装货重量' : '卸货重量'">
            <span class="unit">吨</span>
          </span>
        </div>

        <div class="voucher-head">
          <label>{{ isLoading ? '装货凭证' : '卸货凭证' }}</label>
          <button type="button" @click="addVoucher('main')"><van-icon name="plus" />附件</button>
        </div>
        <p v-if="mainVouchers.length === 0" class="voucher-empty">请上传{{ isLoading ? '装货' : '卸货' }}磅单或现场照片</p>
        <div class="voucher-list">
          <div v-for="item in mainVouchers" :key="item.id" class="voucher-item">
            <span class="voucher-thumb"><van-icon name="photo-o" /></span>
            <span class="voucher-meta">
              <strong>{{ item.name }}</strong>
              <small :class="item.state">{{ voucherStateText(item) }}</small>
            </span>
            <button type="button" class="voucher-action" :class="{ uploading: item.state === 'uploading' }" :aria-label="`移除${item.name}`" @click="removeVoucher('main', item.id)">
              <van-icon :name="item.state === 'uploading' ? 'pause' : 'minus'" />
            </button>
          </div>
        </div>

        <template v-if="!isLoading">
          <div class="voucher-head">
            <label>回单凭证</label>
            <button type="button" @click="addVoucher('return')"><van-icon name="plus" />附件</button>
          </div>
          <div class="voucher-list">
            <div v-for="item in returnVouchers" :key="item.id" class="voucher-item">
              <span class="voucher-thumb"><van-icon name="photo-o" /></span>
              <span class="voucher-meta">
                <strong>{{ item.name }}</strong>
                <small :class="item.state">{{ voucherStateText(item) }}</small>
              </span>
              <button type="button" class="voucher-action" :class="{ uploading: item.state === 'uploading' }" :aria-label="`移除${item.name}`" @click="removeVoucher('return', item.id)">
                <van-icon :name="item.state === 'uploading' ? 'pause' : 'minus'" />
              </button>
            </div>
          </div>
        </template>

        <div class="flow-note-label">备注</div>
        <div class="flow-note-box">
          <textarea v-model="remark" maxlength="50" :placeholder="`请输入${isLoading ? '装货' : '卸货'}备注`" aria-label="备注"></textarea>
          <span class="flow-note-count">{{ remark.length }}/50</span>
        </div>
      </section>
    </div>

    <footer class="flow-form-actions">
      <button type="button" :disabled="!canSubmit" @click="submit">确认{{ isLoading ? '装货' : '卸货' }}</button>
    </footer>

    <van-popup v-model:show="timeSheetOpen" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="flow-time-sheet">
      <header><h2>选择{{ isLoading ? '装货' : '卸货' }}时间</h2><button type="button" aria-label="关闭" @click="timeSheetOpen = false"><van-icon name="cross" /></button></header>
      <button v-for="option in timeOptions" :key="option" type="button" class="time-option" :class="{ active: eventTime === option }" @click="chooseTime(option)">
        <span>{{ option }}</span>
        <van-icon v-if="eventTime === option" name="success" />
      </button>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import './driver-flow.css'

const props = defineProps({
  mode: { type: String, default: 'loading' },
  waybill: { type: Object, required: true },
})
const emit = defineEmits(['back', 'confirm'])

const screenRoot = ref(null)
const isLoading = computed(() => props.mode === 'loading')

const timeSheetOpen = ref(false)
const eventTime = ref('')
const weight = ref('')
const remark = ref('')
const mainVouchers = ref([])
const returnVouchers = ref([])

// 可选的作业时间：以当前整点为中心给出前后各两个时段，避免引入日期组件
const timeOptions = computed(() => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = (offset) => {
    const d = new Date(now.getTime() + offset * 3600 * 1000)
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`
  }
  return [stamp(0), stamp(-1), stamp(-2), stamp(-3)]
})

const canSubmit = computed(() => Boolean(eventTime.value) && Boolean(Number(weight.value)) && mainVouchers.value.length > 0)

function chooseTime(option) {
  eventTime.value = option
  timeSheetOpen.value = false
}

// 附件为原型模拟：点击即生成一条凭证，状态在“上传中→已上传”之间自动流转，
// 用于验证三态样式，不代表真实文件选择。
let voucherSeq = 0
function addVoucher(kind) {
  const target = kind === 'main' ? mainVouchers : returnVouchers
  voucherSeq += 1
  const label = isLoading.value ? '装货' : '卸货'
  const name = kind === 'return' ? `回单${voucherSeq}.jpg` : `${label}${voucherSeq % 2 === 0 ? '磅单' : '单'}.jpg`
  target.value.push({ id: `v-${Date.now()}-${voucherSeq}`, name, state: 'uploading', size: `${(Math.random() * 0.4 + 0.4).toFixed(2)}MB` })
  const index = target.value.length - 1
  showToast(`正在上传 ${name}`)
  // 必须通过数组下标改写，直接持有 push 前的对象引用不会触发响应式更新
  setTimeout(() => {
    const current = target.value[index]
    if (current) current.state = 'done'
  }, 1400)
}

function removeVoucher(kind, id) {
  const target = kind === 'main' ? mainVouchers : returnVouchers
  const index = target.value.findIndex((item) => item.id === id)
  if (index >= 0) target.value.splice(index, 1)
}

function voucherStateText(item) {
  if (item.state === 'uploading') return '上传中...'
  return `已上传 ${item.size}`
}

function submit() {
  if (!canSubmit.value) {
    if (!eventTime.value) showToast(`请选择${isLoading.value ? '装货' : '卸货'}时间`)
    else if (!Number(weight.value)) showToast(`请填写${isLoading.value ? '装货' : '卸货'}重量`)
    else showToast(`请上传${isLoading.value ? '装货' : '卸货'}凭证`)
    return
  }
  emit('confirm', {
    eventTime: eventTime.value,
    weight: weight.value,
    vouchers: mainVouchers.value.filter((item) => item.state === 'done').map((item) => ({ name: item.name, size: item.size })),
    returnVouchers: returnVouchers.value.map((item) => ({ name: item.name, size: item.size })),
    remark: remark.value,
  })
}
</script>

<style scoped>
.flow-time-sheet { padding: 14px 16px 20px; }
.flow-time-sheet header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.flow-time-sheet h2 { margin: 0; color: #30343b; font-size: 16px; }
.flow-time-sheet header button { display: grid; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: #eef0f5; color: #606a7b; place-items: center; }
.time-option { display: flex; width: 100%; min-height: 48px; padding: 0 2px; border: 0; border-bottom: 1px solid #f0f2f7; background: transparent; color: #30343b; align-items: center; justify-content: space-between; font-size: 15px; }
.time-option:last-child { border-bottom: 0; }
.time-option.active { color: #3a65ff; font-weight: 600; }
.time-option > .van-icon { color: #3a65ff; font-size: 16px; }
</style>
