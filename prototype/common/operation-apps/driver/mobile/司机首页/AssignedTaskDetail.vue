<template>
  <main class="driver-cargo-detail assigned-task-detail" :class="{ scrolled: isScrolled }" aria-label="指派任务详情">
    <div class="cargo-detail-scroll" @scroll="handleScroll">
      <section class="task-detail-head">
        <div class="task-head-main">
          <em class="task-source">调度指派</em>
          <span class="task-no">{{ task.taskNo }}</span>
        </div>
        <p class="task-head-sub">{{ task.dispatcher }} · 指派于 {{ taskAssignText(task) }}</p>
        <div class="task-head-summary">
          <div><b>{{ taskClock(task, 'start') }}</b><span>{{ startStopType }} {{ taskDayLabel(task, 'start') }}</span></div>
          <i></i>
          <div class="align-right"><b>{{ taskClock(task, 'end') }}</b><span>{{ endStopType }} {{ taskDayLabel(task, 'end') }}</span></div>
        </div>
        <div class="task-head-tags">
          <span>{{ task.cargoName }} {{ task.cargoAmount }}{{ task.cargoUnit }}</span>
          <span>{{ task.vehicleShort }}</span>
          <span>{{ task.routeDistance }}</span>
          <span v-if="stopCount">{{ stopCount }}</span>
        </div>
      </section>

      <div class="cargo-detail-panel">
        <!-- 装卸货顺序：调度给出推荐顺序作为初始值，司机可在接单前调整执行顺序 -->
        <section class="cargo-detail-card">
          <div class="task-card-head">
            <h2>装卸货顺序</h2>
            <button v-if="customized" type="button" class="task-reset" @click="resetOrder">恢复推荐顺序</button>
          </div>
          <p class="task-order-hint">{{ customized ? '已按你的调整排列，接单后按此顺序执行' : '调度推荐顺序，如需调整可在接单前修改' }}</p>
          <div class="stop-list">
            <div v-for="(stop, index) in orderedStops" :key="stop.id" class="stop-item">
              <div class="stop-index" :class="stop.type">{{ index + 1 }}</div>
              <div class="stop-main">
                <div class="stop-title">
                  <em :class="stop.type">{{ stopTypeText(stop) }}</em>
                  <b>{{ stop.name }}</b>
                </div>
                <p>{{ stop.detail }}</p>
                <small>{{ taskStopText(stop) }} ｜ {{ stop.distance }}<template v-if="stop.contact"> ｜ {{ stop.contact }} {{ stop.phone }}</template></small>
              </div>
              <div class="stop-move">
                <button type="button" aria-label="上移" :disabled="index === 0" @click="moveStop(index, -1)"><van-icon name="arrow-up" /></button>
                <button type="button" aria-label="下移" :disabled="index === orderedStops.length - 1" @click="moveStop(index, 1)"><van-icon name="arrow-down" /></button>
              </div>
            </div>
          </div>
        </section>

        <!-- 集装箱任务单独一段：提空箱 / 还空箱与箱型箱量集中在这里，不混进普通货物信息 -->
        <section v-if="task.isContainer" class="cargo-detail-card">
          <h2>集装箱信息</h2>
          <div class="info-row"><span>箱型箱量</span><b>{{ containerText }}</b></div>
          <div class="info-row"><span>提空箱</span><b>{{ pickupStop ? pickupStop.name : '—' }}</b></div>
          <div class="info-row"><span>还空箱</span><b>{{ returnStop ? returnStop.name : '—' }}</b></div>
          <p class="task-note-text">{{ task.containerNote }}</p>
        </section>

        <section class="cargo-detail-card">
          <h2>货物信息</h2>
          <div class="info-row"><span>货物名称</span><b>{{ task.cargoName }}</b></div>
          <div class="info-row"><span>货物类型</span><b>{{ task.cargoCategory }}</b></div>
          <div class="info-row"><span>货物数量</span><b>{{ task.cargoAmount }} {{ task.cargoUnit }}</b></div>
          <div class="info-row"><span>运输里程</span><b>{{ task.routeDistance }}</b></div>
        </section>

        <section class="cargo-detail-card">
          <h2>车辆与运输要求</h2>
          <div class="info-row"><span>要求车型</span><b>{{ task.vehicleShort }}</b></div>
          <p class="task-note-text">{{ task.vehicleRequirement }}</p>
        </section>

        <section class="cargo-detail-card">
          <h2>运价与结算</h2>
          <div class="info-row"><span>计价方式</span><b>{{ task.pricingRule }}</b></div>
          <div class="info-row"><span>{{ task.pricingRule === '按趟' ? '运输费用' : '运价' }}</span><b>{{ task.unitPrice }} {{ task.priceUnit }}</b></div>
          <div class="info-row"><span>预估运费</span><b class="task-freight">¥{{ estimateFreight }}</b></div>
        </section>

        <section class="cargo-detail-card">
          <h2>调度备注</h2>
          <p class="task-note-text">{{ task.dispatchRemark }}</p>
        </section>
      </div>
    </div>

    <div class="driver-status" aria-hidden="true"><strong>9:41</strong><span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span></div>

    <header class="cargo-detail-header">
      <button type="button" class="cargo-detail-back" aria-label="返回任务指派" @click="emit('back')"><van-icon name="arrow-left" /></button>
      <h1>任务详情</h1>
    </header>

    <footer class="cargo-detail-actions task-detail-actions">
      <button type="button" class="action-primary" @click="emit('accept', task)">立即接单</button>
    </footer>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  taskAssignText,
  taskClock,
  taskDayLabel,
  taskEndStop,
  taskFreight,
  taskHasCustomOrder,
  taskOrderedStops,
  taskStartStop,
  taskStopCountText,
  taskStopText,
  taskStopTypeText,
  setTaskExecOrder,
  resetTaskExecOrder,
} from './driver-flow-store.js'
import './driver-flow.css'

const props = defineProps({ task: { type: Object, required: true } })
const emit = defineEmits(['back', 'accept'])

const isScrolled = ref(false)

function handleScroll(event) {
  isScrolled.value = event.target.scrollTop > 60
}

// 执行顺序存在 store 里，页面不自己维护副本，避免与接单时读取的顺序不一致。
// taskExecOrder 是 reactive，调整后 computed 自动重算。
const orderedStops = computed(() => taskOrderedStops(props.task))
const customized = computed(() => taskHasCustomOrder(props.task.id))
const stopCount = computed(() => taskStopCountText(props.task))
const estimateFreight = computed(() => taskFreight(props.task, props.task.cargoAmount).toLocaleString('zh-CN'))
const containerText = computed(() => props.task.containers.map((box) => `${box.type}×${box.count} ${box.mode}`).join(' + '))
const pickupStop = computed(() => orderedStops.value.find((stop) => stop.type === 'pickup'))
const returnStop = computed(() => orderedStops.value.find((stop) => stop.type === 'return'))
// 顶部起止时间标签随停靠点类型走：集装箱任务是提箱 / 还箱，不能写成装货 / 卸货
const startStopType = computed(() => taskStopTypeText(taskStartStop(props.task)))
const endStopType = computed(() => taskStopTypeText(taskEndStop(props.task)))

function stopTypeText(stop) {
  return taskStopTypeText(stop)
}

function moveStop(index, delta) {
  const next = index + delta
  if (next < 0 || next >= orderedStops.value.length) return
  const order = orderedStops.value.map((stop) => stop.id)
  const [moved] = order.splice(index, 1)
  order.splice(next, 0, moved)
  setTaskExecOrder(props.task.id, order)
}

function resetOrder() {
  resetTaskExecOrder(props.task.id)
}
</script>
