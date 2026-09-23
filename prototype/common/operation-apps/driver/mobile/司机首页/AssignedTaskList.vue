<template>
  <div class="cargo-list">
    <div v-for="task in tasks" :key="task.id" class="cargo-card task-card" @click="emit('open', task)">
      <div class="task-head">
        <em class="task-source">调度指派</em>
        <span class="task-no">{{ task.taskNo }}</span>
        <small class="task-assign">指派于 {{ taskAssignText(task) }}</small>
      </div>

      <div class="task-time-row">
        <strong>{{ taskClock(task, 'start') }}</strong><span>{{ startStopType(task) }}</span>
        <i></i>
        <span>{{ taskClock(task, 'end') }}</span><span>{{ endStopType(task) }}</span>
        <em v-if="stopCount(task)" class="cargo-flag task-multi">{{ stopCount(task) }}</em>
      </div>

      <div class="route-row"><i class="route-dot load"></i><span>{{ startStop(task).name }}</span><small>{{ startStop(task).distance }}</small></div>
      <div class="route-row"><i class="route-dot unload"></i><span>{{ endStop(task).name }}</span><small>{{ endStop(task).distance }}</small></div>

      <div class="cargo-meta">
        <div class="tag-list">
          <span>{{ task.cargoName }} {{ task.cargoAmount }}{{ task.cargoUnit }}</span>
          <span>{{ task.vehicleShort }}</span>
          <span v-if="task.isContainer" class="task-container-tag">{{ containerText(task) }}</span>
        </div>
        <div class="price"><small>{{ priceLabel(task) }}</small><strong>{{ task.unitPrice }}<em>{{ task.priceUnit }}</em></strong></div>
      </div>

      <!-- 接单只表示知晓确认并回写调度，没有拒绝入口；接单后任务离开本列表 -->
      <div class="task-action">
        <button type="button" class="task-accept" @click.stop="emit('accept', task)">立即接单</button>
      </div>
    </div>

    <div v-if="tasks.length === 0" class="cargo-empty">
      <van-icon name="orders-o" />
      <p>暂无指派任务</p>
    </div>
  </div>
</template>

<script setup>
import {
  taskAssignText,
  taskClock,
  taskEndStop,
  taskStartStop,
  taskStopCountText,
  taskStopTypeText,
} from './driver-flow-store.js'

defineProps({ tasks: { type: Array, required: true } })
const emit = defineEmits(['open', 'accept'])

const startStop = (task) => taskStartStop(task)
const endStop = (task) => taskEndStop(task)
// 时间标签随停靠点类型走：集装箱任务的首尾是提箱 / 还箱，写成「装货 / 卸货」会误导到场时间
const startStopType = (task) => taskStopTypeText(taskStartStop(task))
const endStopType = (task) => taskStopTypeText(taskEndStop(task))
const stopCount = (task) => taskStopCountText(task)
// 按趟是一次性总价，标签不能写「单价」；按吨/按方才是单位价格
const priceLabel = (task) => (task.pricingRule === '按趟' ? '运输费用' : '运输单价')
const containerText = (task) => task.containers.map((box) => `${box.type}×${box.count} ${box.mode}`).join(' + ')
</script>
