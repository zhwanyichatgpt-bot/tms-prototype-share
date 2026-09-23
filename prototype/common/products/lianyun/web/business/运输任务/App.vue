<script setup>
/**
 * 运输任务 —— 页面主入口
 * 职责：组合公共系统框架 + 运输任务业务组件 + 页面级状态，不承载重复任务结构。
 */
import { computed, onUnmounted, ref } from 'vue'
import { TmsWebShell } from '../../../../../shared/web/tms-web-shell/index.js'
import TaskTopLogo from './components/TaskTopLogo.vue'
import TaskStatusTabs from './components/TaskStatusTabs.vue'
import TaskFilterBar from './components/TaskFilterBar.vue'
import TransportTaskCard from './components/TransportTaskCard.vue'
import TaskPagination from './components/TaskPagination.vue'
import WaypointPopover from './components/WaypointPopover.vue'
import { initialTasks, paginationMeta } from './mock-data'
import './transport-task.css'

/* —— 顶部栏 / 系统框架数据 —— */
const siteName = '楹联集运站'
const organizationName = '企业名称企业名称企业企业名称...'
const dateText = '2022 年 05 月 27 日'
const weatherText = '24℃ 多云'
const tabs = [{ key: 'transportTask', label: '运输任务' }]
const shellScale = 0.85

const navItems = [
  {
    key: 'task', label: '运输任务', left: 0, top: 0, width: 32, height: 32,
    imgs: [
      { src: '/tms-web-shell-assets/Vector_26_236.svg', x: 3.2, y: 3.2, w: 13.5, h: 13.9 },
      { src: '/tms-web-shell-assets/Vector_26_237.svg', x: 7.4, y: 16.1, w: 13.6, h: 12.7 },
      { src: '/tms-web-shell-assets/Vector_26_238.svg', x: 17.1, y: 4.4, w: 11.7, h: 15 },
    ],
  },
  {
    key: 'other', label: '其他', left: 1, top: 87, width: 30, height: 30,
    imgs: [{ src: '/tms-web-shell-assets/Group_26_241.svg', x: 3.75, y: 3.43, w: 22, h: 22.5 }],
    badge: { x: 13.9, y: 2.6, w: 9, h: 9 },
  },
]

/* —— 页面级状态 —— */
const statusTab = ref('all')
const page = ref(paginationMeta.current)
const taskList = ref(initialTasks.map(t => ({ ...t })))

const visibleTasks = computed(() => {
  if (statusTab.value === 'all') return taskList.value
  return taskList.value.filter(task => task.status === statusTab.value)
})

function toggleTaskExpand(targetTask) {
  const item = taskList.value.find(t => t.key === targetTask.key)
  if (item) {
    item.expanded = !item.expanded
  }
}

const waypointVisible = ref(false)
const waypointAnchor = ref(null)
let popoverHideTimer = null

function onWaypointEnter(event) {
  clearPopoverHideTimer()
  const frame = document.querySelector('.tms-web-shell')
  const frameRect = frame?.getBoundingClientRect()
  const rect = event.currentTarget.getBoundingClientRect()
  if (frameRect) {
    // 锚定到途经点文本下方（相对画板坐标）
    waypointAnchor.value = {
      x: (rect.left - frameRect.left) / shellScale - 200,
      y: (rect.top - frameRect.top) / shellScale + 44,
    }
  }
  waypointVisible.value = true
}

function onWaypointLeave() {
  clearPopoverHideTimer()
  popoverHideTimer = setTimeout(() => {
    waypointVisible.value = false
  }, 120)
}

function clearPopoverHideTimer() {
  if (popoverHideTimer) clearTimeout(popoverHideTimer)
  popoverHideTimer = null
}

function onFilterSearch() {
  page.value = 1
}

function onFilterReset() {
  statusTab.value = 'all'
  page.value = paginationMeta.current
}

function onFilterMore() {}

/* 框架动作：原型层保持静态，不外跳 */
function goWorkbench() {}
function closeTab() {}
function switchTab() {}
function onNavigate() {}
function onMenuSelect() {}
function onAction() {}

onUnmounted(clearPopoverHideTimer)
</script>

<template>
  <div class="transport-task-viewport">
    <div class="transport-task-stage">
      <TmsWebShell
        :site-name="siteName"
        :organization-name="organizationName"
        :date-text="dateText"
        :weather-text="weatherText"
        :active-menu="'dashboard'"
        :tabs="tabs"
        :active-tab-key="'transportTask'"
        :nav-items="navItems"
        :active-nav="'task'"
        :scale="shellScale"
        @menu-select="onMenuSelect"
        @go-workbench="goWorkbench"
        @close-tab="closeTab"
        @switch-tab="switchTab"
        @navigate="onNavigate"
      >
        <template #logo>
          <TaskTopLogo />
        </template>
        <template #avatar>
          <img
            class="tt-top-avatar"
            src="/tms-web-shell-assets/af74f762675bd2d9a53df99aaaab41f3519de48b.png"
            alt="企业头像"
          />
        </template>
        <template #weather-icon>
          <span class="tt-top-weather-glyph" aria-hidden="true">
            <img class="sun-glow" src="/tms-web-shell-assets/Vector_26_214.svg" alt="" />
            <img class="sun-core" src="/tms-web-shell-assets/Group_26_216.svg" alt="" />
            <img class="sun-ray" src="/tms-web-shell-assets/Vector_26_226.svg" alt="" />
          </span>
        </template>
        <template #actions>
          <img src="/tms-web-shell-assets/Group_26_152.svg" class="tt-top-window-icon" alt="" />
          <img src="/tms-web-shell-assets/Vector_26_158.svg" class="tt-top-window-icon" alt="" />
          <span class="tt-top-window-glyph">
            <img src="/tms-web-shell-assets/Group_26_162.svg" class="tt-top-window-icon" alt="" />
            <img src="/tms-web-shell-assets/Group_26_164.svg" class="tt-top-window-icon" alt="" />
          </span>
        </template>
        <template #home-icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="8.4" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="0.6" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="8.4" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
            <rect x="0" y="8.2" width="7" height="7" rx="1.2" fill="#909499" />
          </svg>
        </template>

        <div class="transport-task-page">
          <TaskStatusTabs :active-key="statusTab" @change="statusTab = $event" />
          <TaskFilterBar @search="onFilterSearch" @reset="onFilterReset" @more="onFilterMore" />
          <div class="tt-filter-divider" />

          <div class="tt-tasklist">
            <TransportTaskCard
              v-for="task in visibleTasks"
              :key="task.key"
              :task="task"
              :expanded="task.expanded"
              :class="{ 'tt-card-expanded': task.expanded }"
              @action="onAction"
              @toggle-expand="toggleTaskExpand"
              @waypoint-enter="onWaypointEnter"
              @waypoint-leave="onWaypointLeave"
            />
          </div>

          <TaskPagination :current="page" @change="page = $event" />
          <WaypointPopover
            :visible="waypointVisible"
            :anchor="waypointAnchor"
            @enter="clearPopoverHideTimer"
            @leave="onWaypointLeave"
          />
        </div>
      </TmsWebShell>
    </div>
  </div>
</template>

<style>
/* 顶部栏插槽内联尺寸 */
.tt-top-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}

.tt-top-weather-glyph {
  position: relative;
  display: block;
  width: 36.9px;
  height: 30.6px;
}

.tt-top-weather-glyph img { position: absolute; display: block; }
.tt-top-weather-glyph .sun-glow {
  left: 6.24px;
  top: 11.86px;
  width: 54.69px;
  height: 46.74px;
}
.tt-top-weather-glyph .sun-core {
  left: 12.57px;
  top: 0;
  width: 24.34px;
  height: 24.34px;
}
.tt-top-weather-glyph .sun-ray {
  left: 0;
  top: 6.74px;
  width: 27.8px;
  height: 19.52px;
}

.tt-top-window-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.tt-top-window-glyph {
  width: 24px;
  height: 24px;
  position: relative;
}

.tt-top-window-glyph .tt-top-window-icon {
  position: absolute;
  left: 0;
  top: 0;
}
</style>
