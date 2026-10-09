<template>
  <div class="task-list-wrap">
    <!-- 类型页签：一装一卸（TMS2.0 体系）与多装多卸/集装箱（3.0 升级）两套数据结构无法合并，
         在展示层分组。计数只统计待接单，提示司机「还有点活可接」，
         把已过期数混进来会让计数失去意义 -->
    <div class="task-type-tabs" role="tablist" aria-label="任务类型">
      <button
        v-for="type in typeOptions"
        :key="type.key"
        type="button"
        role="tab"
        :aria-selected="activeType === type.key"
        :class="{ active: activeType === type.key }"
        @click="emit('change-type', type.key)"
      >{{ type.label }}<em v-if="countOf(type.key)">{{ countOf(type.key) }}</em></button>
    </div>

    <div class="cargo-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="cargo-card task-card"
        :class="{ expired: isExpired(task) }"
        @click="emit('open', task)"
      >
        <div class="task-head">
          <em class="task-source">调度指派</em>
          <span class="task-no">{{ task.taskNo }}</span>
          <small class="task-assign">指派于 {{ taskAssignText(task) }}</small>
        </div>

        <div class="task-time-row">
          <strong>{{ taskClock(task, 'start') }}</strong><span>{{ startStopType(task) }}</span>
          <i></i>
          <span>{{ taskClock(task, 'end') }}</span><span>{{ endStopType(task) }}</span>
          <!-- 状态位让给差异化信号：待接单不显示（列表里恒真、无信息量），
               只有已过期才提示司机「这条已经赶不上了」 -->
          <em v-if="statusFlag(task)" class="cargo-flag" :class="statusFlag(task).tone">{{ statusFlag(task).text }}</em>
          <em v-else-if="stopCount(task)" class="cargo-flag task-multi">{{ stopCount(task) }}</em>
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

        <!-- 接单是闸门：必须先接单才能进装货。已过期任务不再提供接单入口，
             点击卡片时给出「已过装货时间」提示，司机据此反馈调度重新指派 -->
        <div class="task-action">
          <button
            v-if="!isExpired(task)"
            type="button"
            class="task-accept"
            @click.stop="emit('accept', task)"
          >立即接单</button>
          <button
            v-else
            type="button"
            class="task-accept disabled"
            @click.stop="emit('expired', task)"
          >已过装货时间</button>
        </div>
      </div>

      <div v-if="tasks.length === 0" class="cargo-empty">
        <van-icon name="orders-o" />
        <p>暂无指派任务</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  isTaskOpen,
  taskAssignText,
  taskClock,
  taskEndStop,
  taskStartStop,
  taskStatusFlag,
  taskStopCountText,
  taskStopTypeText,
  taskTypeCount,
  taskTypeOptions,
} from './driver-flow-store.js'

const props = defineProps({
  tasks: { type: Array, required: true },
  activeType: { type: String, default: 'single' },
})
const emit = defineEmits(['open', 'accept', 'expired', 'change-type'])

const typeOptions = taskTypeOptions
const countOf = (type) => taskTypeCount(type)
const isExpired = (task) => !isTaskOpen(task)
const statusFlag = (task) => taskStatusFlag(task)
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
