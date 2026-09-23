<template>
  <div class="driver-flow-form" aria-label="接单">
    <div class="driver-status" aria-hidden="true"><strong>9:41</strong><span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span></div>

    <header class="flow-form-header">
      <button type="button" aria-label="返回货源详情" @click="emit('back')"><van-icon name="arrow-left" /></button>
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
          <label>接单重量</label>
          <span class="row-value">
            <input v-model="acceptWeight" type="number" inputmode="decimal" placeholder="请输入" aria-label="接单重量">
            <span class="unit">吨</span>
          </span>
        </div>

        <h2 class="flow-section-title">运费信息</h2>
        <div class="flow-row">
          <label class="plain">计价规则</label>
          <span class="row-value"><span class="value-text">卸货量 * 运价</span></span>
        </div>
        <div class="flow-row">
          <label class="plain">运价</label>
          <span class="row-value"><span class="value-text">{{ cargo.pricePerTon }} 元/吨</span></span>
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
import { driverVehicles, cargoExpireReason, isCargoActive } from './driver-flow-store.js'
import './driver-flow.css'

const props = defineProps({ cargo: { type: Object, required: true } })
const emit = defineEmits(['back', 'confirm'])

const screenRoot = ref(null)
const vehicleSheetOpen = ref(false)
const acceptWeight = ref('')
const remark = ref('')
const selectedVehicleId = ref(driverVehicles.find((v) => v.isDefault)?.id || driverVehicles[0].id)

const selectedVehicle = computed(() => driverVehicles.find((v) => v.id === selectedVehicleId.value) || null)
const acceptTime = computed(() => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
})

// 预估运费按司机手填重量与运价试算；未填时按货源需求吨位预填，
// 实际结算以卸货量核算为准（与计价规则一致）。
const estimateFreightText = computed(() => {
  const weight = Number(acceptWeight.value)
  if (!weight) return '按实际装卸量计算'
  return `¥${Math.round(weight * props.cargo.pricePerTon).toLocaleString('zh-CN')}`
})

// 装货时间即接单截止时间：司机在详情页停留到装货时刻之后时，
// 这里必须拦住提交，否则会绕过详情页的截止校验生成运单。
const cargoOpen = computed(() => isCargoActive(props.cargo))
const closedReason = computed(() => cargoExpireReason(props.cargo)?.title || '该货源当前不可接单')
const canSubmit = computed(() => cargoOpen.value && Boolean(Number(acceptWeight.value)) && Boolean(selectedVehicle.value))

function chooseVehicle(vehicle) {
  selectedVehicleId.value = vehicle.id
  vehicleSheetOpen.value = false
}

function submit() {
  if (!cargoOpen.value) {
    showToast(`${closedReason.value}，无法接单`)
    return
  }
  if (!canSubmit.value) {
    showToast(Number(acceptWeight.value) ? '请选择承运车辆' : '请填写接单重量')
    return
  }
  emit('confirm', {
    acceptWeight: acceptWeight.value,
    vehicleId: selectedVehicleId.value,
    remark: remark.value,
  })
}
</script>

<style scoped>
.flow-vehicle-sheet { padding: 14px 16px 20px; }
.flow-vehicle-sheet header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.flow-vehicle-sheet h2 { margin: 0; color: #30343b; font-size: 16px; }
.flow-vehicle-sheet header button { display: grid; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: #eef0f5; color: #606a7b; place-items: center; }
.vehicle-option { display: flex; width: 100%; min-height: 62px; padding: 12px 0; border: 0; border-bottom: 1px solid #f0f2f7; background: transparent; color: #30343b; align-items: center; text-align: left; gap: 10px; }
.vehicle-option:last-child { border-bottom: 0; }
.vehicle-option-main { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.vehicle-option-main strong { font-size: 15px; }
.vehicle-option-main small { color: #7b8698; font-size: 11px; }
.vehicle-option-tags { display: flex; gap: 4px; }
.vehicle-option-tags i { padding: 2px 6px; border-radius: 4px; background: #f2f4f8; color: #7183a5; font-size: 9px; font-style: normal; }
.vehicle-option-tags i:first-child { background: #e9f8f1; color: #54a982; }
.vehicle-option > .van-icon { color: #3a65ff; font-size: 17px; }
</style>
