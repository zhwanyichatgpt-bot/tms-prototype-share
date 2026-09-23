<script setup>
import TaskProgress from './TaskProgress.vue'
import { statusLabel, statusStyle } from '../task-model'

defineProps({
  sub: { type: Object, required: true },
})
</script>

<template>
  <div class="tt-subtask">
    <div class="tt-subtask-seq">{{ sub.seq }}</div>
    <div class="tt-subtask-main">
      <div class="tt-subtask-no">{{ sub.waybillNo }}</div>
      <div class="tt-subtask-time">{{ sub.time }}</div>
      <div class="tt-subtask-org">{{ sub.org }} | {{ sub.person }}</div>
    </div>
    <span
      class="tt-subtask-status"
      :style="{
        color: statusStyle(sub.status).color,
        borderColor: statusStyle(sub.status).border,
        backgroundColor: statusStyle(sub.status).background,
      }"
    >{{ statusLabel(sub.status) }}</span>

    <div class="tt-subtask-detail">
      <div class="tt-subtask-detail-cell" :data-field="sub.detail.firstField?.label || '任务集装箱'">
        <span class="tt-cell-label">{{ sub.detail.firstField?.label || '任务集装箱' }}</span>
        <span class="tt-cell-value tt-cell-cargo"><i aria-hidden="true">▣</i>{{ sub.detail.firstField?.value }}</span>
      </div>
      <div class="tt-subtask-detail-cell" data-field="任务时间">
        <span class="tt-cell-label">任务时间</span>
        <span class="tt-cell-value tt-time-value"><i class="start" />{{ sub.detail.taskTimeStart }}</span>
        <span class="tt-cell-value tt-time-value"><i class="end" />{{ sub.detail.taskTimeEnd }}</span>
      </div>
      <div class="tt-subtask-detail-cell" data-field="计费方式">
        <span class="tt-cell-label">计费方式</span>
        <span class="tt-cell-value">{{ sub.detail.cost }}</span>
        <i class="tt-cell-value-tag">{{ sub.detail.costTag }}</i>
      </div>
      <TaskProgress label="指派进度" :value="sub.detail.dispatchProgress" />
      <TaskProgress label="运输进度" :value="sub.detail.transportProgress" />
      <TaskProgress label="司机任务" :value="sub.detail.driverTaskCount" sink />
      <TaskProgress label="运单" :value="sub.detail.waybillCount" sink />
    </div>

    <div class="tt-subtask-actions">
      <button v-for="action in sub.actions" :key="action" type="button" class="tt-subtask-action">{{ action }}</button>
    </div>
  </div>
</template>
