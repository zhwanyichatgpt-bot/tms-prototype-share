<template>
  <div class="driver-flow-form" aria-label="接单">
    <div class="driver-status" aria-hidden="true"><strong>9:41</strong><span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span></div>

    <header class="flow-form-header">
      <button type="button" aria-label="返回任务详情" @click="emit('back')"><van-icon name="arrow-left" /></button>
      <h1>接单</h1>
      <span class="flow-form-capsule"><van-icon name="ellipsis" /></span>
    </header>

    <div class="flow-form-scroll">
      <section class="flow-form-card">
        <div class="flow-row required">
          <label>接单时间</label>
          <span class="row-value"><span class="value-text">{{ acceptTime }}</span></span>
        </div>

        <div class="flow-row required">
          <label>承运车辆</label>
          <button type="button" class="row-value" style="border:0;background:transparent;padding:0" @click="vehicleSheetOpen = true">
            <span class="value-text" :class="{ placeholder: !selectedVehicle }">{{ selectedVehicle ? `${selectedVehicle.plateNo} · ${selectedVehicle.vehicleType}` : '请选择' }}</span>
            <van-icon name="arrow" class="chevron" />
          </button>
        </div>

        <div class="flow-row required">
          <label>{{ amountLabel }}</label>
          <span class="row-value">
            <input v-model="acceptAmount" type="number" inputmode="decimal" placeholder="请输入" :aria-label="amountLabel">
            <span class="unit">{{ task.cargoUnit }}</span>
          </span>
        </div>

        <h2 class="flow-section-title">运费信息</h2>
        <div class="flow-row">
          <label class="plain">计价规则</label>
          <span class="row-value"><span class="value-text">{{ pricingText }}</span></span>
        </div>
        <div class="flow-row">
          <label class="plain">{{ task.pricingRule === '按趟' ? '运输费用' : '运价' }}</label>
          <span class="row-value"><span class="value-text">{{ task.unitPrice }} {{ task.priceUnit }}</span></span>
        </div>
        <div class="flow-row">
          <label class="plain">预估运费</label>
          <span class="row-value"><span class="value-text">{{ estimateFreightText }}</span></span>
        </div>

        <div class="flow-note-label">备注</div>
        <div class="flow-note-box">
          <textarea v-model="remark" maxlength="50" placeholder="请输入接单备注" aria-label="接单备注"></textarea>
          <span class="flow-note-count">{{ remark.length }}/50</span>
        </div>
      </section>
    </div>

    <footer class="flow-form-actions">
      <button type="button" :disabled="!canSubmit" @click="submit">确认接单</button>
    </footer>

    <van-popup v-model:show="vehicleSheetOpen" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="flow-vehicle-sheet">
      <header><h2>选择承运车辆</h2><button type="button" aria-label="关闭" @click="vehicleSheetOpen = false"><van-icon name="cross" /></button></header>
      <button v-for="vehicle in driverVehicles" :key="vehicle.id" type="button" class="vehicle-option" :class="{ active: selectedVehicleId === vehicle.id }" @click="chooseVehicle(vehicle)">
        <span class="vehicle-option-main"><strong>{{ vehicle.plateNo }}</strong><small>{{ vehicle.vehicleType }} · 载重 {{ vehicle.loadCapacity }}</small></span>
        <span class="vehicle-option-tags"><i>{{ vehicle.certText }}</i><i v-if="vehicle.isDefault">默认车辆</i></span>
        <van-icon v-if="selectedVehicleId === vehicle.id" name="success" />
      </button>
    </van-popup>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { driverVehicles, taskFreight } from './driver-flow-store.js'
import './driver-flow.css'

const props = defineProps({ task: { type: Object, required: true } })
const emit = defineEmits(['back', 'confirm'])

const screenRoot = ref(null)
const vehicleSheetOpen = ref(false)
const acceptAmount = ref(String(props.task.cargoAmount))
const remark = ref('')
const selectedVehicleId = ref(driverVehicles.find((v) => v.isDefault)?.id || driverVehicles[0].id)

const selectedVehicle = computed(() => driverVehicles.find((v) => v.id === selectedVehicleId.value) || null)
const acceptTime = computed(() => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
})

// 按趟是一次性总价，不随数量变化；按吨 / 按方按司机填写的数量试算
const isPerTrip = computed(() => props.task.pricingRule === '按趟')
const amountLabel = computed(() => (isPerTrip.value ? '承运数量' : `承运${props.task.cargoUnit === '方' ? '方量' : '重量'}`))
const pricingText = computed(() => (isPerTrip.value ? '整车一口价' : `${props.task.cargoUnit}数 * 运价`))
const estimateFreightText = computed(() => {
  if (isPerTrip.value) return `¥${taskFreight(props.task, props.task.cargoAmount).toLocaleString('zh-CN')}`
  const amount = Number(acceptAmount.value)
  if (!amount) return '按实际装卸量计算'
  return `¥${taskFreight(props.task, amount).toLocaleString('zh-CN')}`
})

const canSubmit = computed(() => Boolean(Number(acceptAmount.value)) && Boolean(selectedVehicle.value))

function chooseVehicle(vehicle) {
  selectedVehicleId.value = vehicle.id
  vehicleSheetOpen.value = false
}

function submit() {
  if (!canSubmit.value) {
    showToast(Number(acceptAmount.value) ? '请选择承运车辆' : `请填写${amountLabel.value}`)
    return
  }
  emit('confirm', {
    acceptWeight: acceptAmount.value,
    vehicleId: selectedVehicleId.value,
    remark: remark.value,
  })
}
</script>
