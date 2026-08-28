<template>
  <div class="shipowner-app">
    <!-- 运单详情 -->
    <WaybillDetail
      v-if="currentView === 'waybillDetail'"
      :detail="waybillDetail"
      @back="currentView = detailReturnView"
      @confirm-address="onConfirmAddress"
      @reject-address="onRejectAddress"
    />

    <!-- 跑货（运输跟踪） -->
    <RunCargo
      v-else-if="currentView === 'runCargo'"
      :has-pending-address-change="hasPendingAddressChange"
      @nav-find="onNavFind"
      @nav-waybill="currentView = 'waybill'"
      @view-waybill="openWaybillDetail"
    />

    <!-- 运单列表（默认视图，含底部导航：找货/跑货/运单/我的） -->
    <WaybillCenter
      v-else
      :has-pending-address-change="hasPendingAddressChange"
      @view-waybill="openWaybillDetail"
      @nav-runcargo="currentView = 'runCargo'"
      @nav-find="onNavFind"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { showToast } from 'vant'
import WaybillCenter from './WaybillCenter.vue'
import WaybillDetail from './WaybillDetail.vue'
import RunCargo from './RunCargo.vue'
import { mockWaybillDetail } from './mock-data.js'

// 船东移动端：本期默认进入运单列表（“运单”Tab），找货为占位，跑货已接入
const currentView = ref('waybill') // 'waybill' | 'waybillDetail' | 'runCargo'

// 找货：本期占位
const onNavFind = () => {
  showToast('找货页面待演示')
}

// ================= 运单详情（含地址变更处理） =================
// 响应式运单详情：深拷贝 mock，确认/拒绝真实更新当前页面状态
const waybillDetail = reactive(JSON.parse(JSON.stringify(mockWaybillDetail)))

// 当前是否存在待船东处理的地址变更申请：列表/跑货提醒条与此联动，保证入口一致
const hasPendingAddressChange = computed(() => waybillDetail.addressChange?.status === 'pending')

// 运单详情返回目标：记录进入详情前的来源视图（运单列表 / 跑货）
const detailReturnView = ref('waybill')

const openWaybillDetail = () => {
  detailReturnView.value = currentView.value === 'runCargo' ? 'runCargo' : 'waybill'
  currentView.value = 'waybillDetail'
}

const nowStr = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// 确认新地址：更新当前有效地址 + 生成已确认记录
const onConfirmAddress = ({ id }) => {
  const ac = waybillDetail.addressChange
  if (!ac || ac.id !== id) return
  // 新地址成为当前有效地址（地图终点、地址卡、路线同步更新）
  const [port, ...rest] = ac.newAddr.split('·').map((s) => s.trim())
  waybillDetail.currentDest = { port: port || ac.newAddr, addr: rest.join(' · ') || ac.newAddr }
  // 生成一条“已确认”记录，置于最前
  const seq = (waybillDetail.addressChangeRecords[0]?.seq || 0) + 1
  waybillDetail.addressChangeRecords.unshift({
    id: ac.id,
    seq,
    result: 'confirmed',
    resultText: '已确认',
    originAddr: ac.originAddr,
    newAddr: ac.newAddr,
    reason: ac.reason,
    initiator: ac.initiator,
    initiateTime: ac.initiateTime,
    handleResult: '已确认',
    handleTime: nowStr(),
    rejectReason: '',
    withdrawTime: '',
  })
  // 标记申请已处理，不再强制弹窗
  waybillDetail.addressChange = { ...ac, status: 'confirmed' }
}

// 拒绝地址变更：保留原地址 + 生成已拒绝记录
const onRejectAddress = ({ id, reason }) => {
  const ac = waybillDetail.addressChange
  if (!ac || ac.id !== id) return
  const seq = (waybillDetail.addressChangeRecords[0]?.seq || 0) + 1
  waybillDetail.addressChangeRecords.unshift({
    id: ac.id,
    seq,
    result: 'rejected',
    resultText: '已拒绝',
    originAddr: ac.originAddr,
    newAddr: ac.newAddr,
    reason: ac.reason,
    initiator: ac.initiator,
    initiateTime: ac.initiateTime,
    handleResult: '已拒绝',
    handleTime: nowStr(),
    rejectReason: reason,
    withdrawTime: '',
  })
  // 原地址保持不变，标记申请已拒绝
  waybillDetail.addressChange = { ...ac, status: 'rejected' }
}
</script>

<style scoped>
.shipowner-app {
  display: block;
  width: 100%;
}
</style>
