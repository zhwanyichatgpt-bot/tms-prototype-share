<script setup>
import { computed } from 'vue'
import TaskSummary from './TaskSummary.vue'
import TaskDetailRow from './TaskDetailRow.vue'
import TaskProgress from './TaskProgress.vue'
import { statusLabel, statusStyle, headerActions, headerTagList } from '../task-model'

const props = defineProps({
  task: { type: Object, required: true },
  expanded: { type: Boolean, default: undefined },
})
const emit = defineEmits(['action', 'waypoint-enter', 'waypoint-leave', 'toggle-expand'])

const isExpanded = computed(() => (props.expanded !== undefined ? props.expanded : !!props.task.expanded))
</script>

<template>
  <article class="tt-card" :class="{ expanded: isExpanded }" data-testid="transport-task-card">
    <div class="tt-card-header">
      <span
        class="tt-card-icon"
        :class="{ expanded: isExpanded }"
        role="button"
        tabindex="0"
        title="点击展开/收起"
        aria-label="展开或收起任务"
        @click.stop="emit('toggle-expand', task)"
        @keydown.enter.stop="emit('toggle-expand', task)"
        @keydown.space.stop="emit('toggle-expand', task)"
      />
      <span class="tt-card-id">{{ task.id }}</span>
      <span class="tt-card-dispatch">{{ task.dispatchText }}</span>
      <span
        class="tt-card-status"
        :style="{
          color: statusStyle(task.status).color,
          borderColor: statusStyle(task.status).border,
          backgroundColor: statusStyle(task.status).background,
        }"
      >{{ statusLabel(task.status) }}</span>

      <div class="tt-card-tags">
        <span v-for="tag in headerTagList(task)" :key="tag.text" class="tt-card-tag">{{ tag.text }}</span>
      </div>

      <span class="tt-card-company tt-card-carrier">{{ task.carrier }}<i><b aria-hidden="true">▥</b>{{ task.carrierTag }}</i></span>
      <span class="tt-card-company tt-card-shipper">{{ task.shipper }}<i><b aria-hidden="true">▥</b>{{ task.shipperTag }}</i></span>

      <TaskProgress class="tt-card-progress" label="任务进度" :value="task.progressText" />
      <span
        class="tt-card-waypoint"
        tabindex="0"
        @mouseenter="emit('waypoint-enter', $event)"
        @mouseleave="emit('waypoint-leave', $event)"
        @focus="emit('waypoint-enter', $event)"
        @blur="emit('waypoint-leave', $event)"
        @click.stop="emit('waypoint-enter', $event)"
      >{{ task.waypointLabel }}<b :style="{ color: '#3a65ff' }">&nbsp;{{ task.waypointCount }}</b></span>

      <div class="tt-card-actions">
        <button v-for="action in headerActions(task)" :key="action.key" type="button" class="tt-card-action" @click="$emit('action', { key: action.key, task })">{{ action.label }}</button>
      </div>
    </div>

    <template v-if="isExpanded">
      <div class="tt-card-hr" />
      <TaskSummary :items="task.summary" />
      <div class="tt-card-subtasks">
        <TaskDetailRow v-for="sub in task.subtasks" :key="sub.seq" :sub="sub" />
      </div>
    </template>
  </article>
</template>
