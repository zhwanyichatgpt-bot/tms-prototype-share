<template>
  <main class="driver-waybill-detail" aria-label="司机运单详情">
    <div class="detail-scroll">
      <section class="detail-map-section">
        <img class="detail-map-image" src="/cargo-detail-map.png" alt="公路运输路线地图">
        <div class="driver-status" aria-hidden="true"><strong>9:41</strong><span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span></div>
        <button type="button" class="detail-back" aria-label="返回运单列表" @click="emit('back')"><van-icon name="arrow-left" /></button>
        <h1>运单详情</h1>
        <img class="detail-route-image" src="/cargo-detail-route.svg" alt="">
        <div class="detail-point load-point"><span>装货地</span><b>{{ originTitle }}</b><i></i></div>
        <div class="detail-point unload-point"><span>卸货地</span><b>{{ destinationTitle }}</b><i></i></div>
      </section>

      <section class="detail-panel">
        <section class="detail-card detail-summary">
          <div class="detail-summary-top"><strong>{{ waybill.cargoName }} {{ waybill.cargoWeight }}</strong><b>¥{{ waybill.freightAmount }}</b></div>
          <div class="detail-time-row">
            <div><b>{{ startTime }}</b><span>{{ startDate }}</span></div>
            <p><i></i><span>{{ durationText }}</span><i></i></p>
            <div class="align-right"><b>{{ endTime }}</b><span>{{ endDate }}</span></div>
          </div>
          <div class="detail-tags"><span>{{ waybill.cargoName }}</span><span>整车运输</span><span>{{ waybill.statusText }}</span></div>
        </section>

        <section class="detail-card detail-addresses">
          <div><em class="start">起</em><p><b>{{ originTitle }}</b><span>{{ waybill.origin }}</span></p><van-icon name="location-o" /></div>
          <i class="address-rail"></i>
          <div><em class="end">终</em><p><b>{{ destinationTitle }}</b><span>{{ waybill.destination }}</span></p><van-icon name="location-o" /></div>
        </section>

        <section class="detail-card progress-card" aria-label="运输进度">
          <div v-for="(step, index) in progressSteps" :key="step.name" class="progress-item" :class="{ last: index === progressSteps.length - 1 }">
            <span :class="step.statusClass">{{ step.status }}</span>
            <div><header><b>{{ step.name }}</b><time>{{ step.time }}</time></header><p :class="{ active: step.statusClass === 'running' }">{{ step.description }}</p><small>{{ step.extra }}</small></div>
          </div>
        </section>

        <section class="detail-card vehicle-card">
          <div><b>{{ waybill.plateNo }}</b><p><span>车型</span>13米高栏</p><p><span>司机</span>林师傅（138****5621）</p><div class="vehicle-tags"><span>证照齐全</span><span>平台认证</span><span>承运 126 次</span></div></div>
          <div class="truck-art"><van-icon name="logistics" /><span>重型货车</span></div>
        </section>

        <section class="detail-card detail-info">
          <div><span>运单号</span><button type="button" @click="copyWaybill">{{ waybill.waybillNo }} <van-icon name="description" /></button></div>
          <div><span>接单时间</span><b>2026-09-17 09:36:18</b></div>
          <div><span>装货凭证</span><b>{{ (waybill.loadVoucher?.length || waybill.status !== 'loading') ? '已上传' : '待上传' }}</b></div>
          <div><span>卸货凭证</span><b>{{ (waybill.unloadVoucher?.length || ['unloading', 'accounting', 'pending', 'settled', 'delivered'].includes(waybill.status)) ? '已上传' : '待上传' }}</b></div>
        </section>
      </section>
    </div>

    <footer class="detail-actions">
      <button type="button" class="detail-more" @click="notify('更多运单操作后续验证')"><van-icon name="ellipsis" /><span>更多</span></button>
      <button v-if="!flowAction" type="button" class="detail-contact" @click="notify('正在联系货主')"><van-icon name="phone" /><span>联系货主</span></button>
      <template v-if="flowAction">
        <button type="button" class="detail-contact secondary" @click="notify('正在联系货主')"><van-icon name="phone" /><span>联系货主</span></button>
        <button type="button" class="detail-exception" @click="flowAction.handler()">{{ flowAction.label }}</button>
      </template>
    </footer>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { showToast } from 'vant'
import './driver-waybill-detail.css'

const props = defineProps({ waybill: { type: Object, required: true } })
const emit = defineEmits(['back', 'open-load-form', 'open-unload-form', 'confirm-receipt', 'finish-accounting', 'settle-waybill'])
const originTitle = computed(() => props.waybill.origin.split(' · ')[0])
const destinationTitle = computed(() => props.waybill.destination.split(' · ')[0])

// 闭环状态：有 status 字段的走闭环运单，按状态给出下一步操作；
// 静态历史运单（无闭环状态）沿用原有分支，保持既有表现不变。
// accounting 与 pending 两步在真实业务中由平台核算与上游付款触发，
// 司机端只读；原型内提供模拟入口，仅为验证完整链路可走通。
const FLOW_ACTION = {
  loading: { label: '装货确认', event: 'open-load-form' },
  transporting: { label: '卸货确认', event: 'open-unload-form' },
  unloading: { label: '模拟货主确认收货', event: 'confirm-receipt' },
  accounting: { label: '模拟平台核算完成', event: 'finish-accounting' },
  pending: { label: '模拟上游付款', event: 'settle-waybill' },
}
const flowAction = computed(() => {
  const config = FLOW_ACTION[props.waybill.status]
  if (!config) return null
  return { label: config.label, handler: () => emit(config.event, props.waybill) }
})

const startTime = computed(() => props.waybill.status === 'loading' ? '11:20' : '09:36')
const startDate = computed(() => props.waybill.status === 'loading' ? '09月17日 周四' : '09月17日 周四')
const endTime = computed(() => props.waybill.status === 'delivered' ? props.waybill.timeValue.slice(-5) : '18:30')
const endDate = computed(() => props.waybill.status === 'delivered' ? '09月16日 周三' : '09月17日 周四')
const durationText = computed(() => props.waybill.status === 'delivered' ? '已完成' : '预计 8 小时')
const progressSteps = computed(() => {
  // 闭环运单：按公路运输节点推演，替代水运的船闸节点
  if (props.waybill.status === 'transporting' || props.waybill.status === 'unloading'
    || props.waybill.status === 'accounting' || props.waybill.status === 'pending' || props.waybill.status === 'settled') {
    const arrived = ['unloading', 'accounting', 'pending', 'settled'].includes(props.waybill.status)
    return [
      { status: '已完成', statusClass: 'passed', name: '接单成功', time: props.waybill.acceptTime?.slice(5) || '09/17 09:36', description: `承运车辆 ${props.waybill.plateNo}`, extra: props.waybill.acceptRemark || '' },
      { status: '已完成', statusClass: 'passed', name: '完成装货', time: props.waybill.loadTime || '--', description: `装货 ${props.waybill.loadWeight || props.waybill.acceptWeight} 吨，装货凭证已上传`, extra: props.waybill.originShort },
      { status: arrived ? '已完成' : '进行中', statusClass: arrived ? 'passed' : 'running', name: '运输途中', time: arrived ? '已抵达' : '运输中', description: arrived ? `全程 ${props.waybill.routeDistance}` : '车辆按计划运输', extra: props.waybill.routeDistance },
      { status: arrived ? '已完成' : '待开始', statusClass: arrived ? 'passed' : 'pending', name: '到达卸货地', time: arrived ? props.waybill.unloadTime || '--' : '--', description: arrived ? `卸货 ${props.waybill.unloadWeight} 吨，等待收货确认` : '到达后需上传卸货凭证', extra: props.waybill.destinationShort },
    ]
  }
  if (props.waybill.status === 'delivered') return [
    { status: '已完成', statusClass: 'passed', name: '完成装货', time: '09/16 08:12', description: '装货凭证已上传', extra: '福州装货地' },
    { status: '已完成', statusClass: 'passed', name: '运输途中', time: '09/16 10:05', description: '车辆按计划运输', extra: '行驶 186 公里' },
    { status: '已完成', statusClass: 'passed', name: '签收送达', time: props.waybill.timeValue, description: '收货方已确认签收', extra: props.waybill.destination },
  ]
  return [
    { status: '已完成', statusClass: 'passed', name: '接单成功', time: '09/17 09:36', description: '司机已确认承运', extra: props.waybill.plateNo },
    { status: props.waybill.status === 'loading' ? '进行中' : '已完成', statusClass: props.waybill.status === 'loading' ? 'running' : 'passed', name: '到达装货地', time: '09/17 11:05', description: props.waybill.status === 'loading' ? '正在装货，请完成装货确认' : '装货完成并已发车', extra: props.waybill.origin },
    { status: props.waybill.status === 'transporting' ? '进行中' : '待开始', statusClass: props.waybill.status === 'transporting' ? 'running' : 'pending', name: '运输途中', time: props.waybill.status === 'transporting' ? '09/17 13:20' : '--', description: props.waybill.status === 'transporting' ? '车辆运输正常' : '完成装货后进入运输', extra: props.waybill.status === 'transporting' ? '已行驶 128 公里' : '' },
  ]
})
const notify = (message) => showToast(message)
async function copyWaybill() {
  try { await navigator.clipboard?.writeText(props.waybill.waybillNo) } finally { showToast('运单号已复制') }
}
</script>
