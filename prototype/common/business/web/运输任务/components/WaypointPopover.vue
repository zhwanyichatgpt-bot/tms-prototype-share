<script setup>
import { waypointOverlay } from '../mock-data'

defineProps({
  visible: { type: Boolean, default: false },
  /** 弹层锚定位置（相对画板） */
  anchor: { type: Object, default: null },
})
defineEmits(['enter', 'leave'])
</script>

<template>
  <div
    v-show="visible"
    class="tt-waypoint-pop"
    data-testid="waypoint-popover"
    :style="anchor ? { left: `${anchor.x}px`, top: `${anchor.y}px` } : undefined"
    @mouseenter="$emit('enter')"
    @mouseleave="$emit('leave')"
  >
    <div class="tt-waypoint-pop-card">
      <div v-for="(point, index) in waypointOverlay" :key="index" class="tt-waypoint-pop-row">
        <span class="tt-waypoint-pop-sign" :class="point.tone">{{ point.sign }}</span>
        <div class="tt-waypoint-pop-main">
          <div class="tt-waypoint-pop-title">{{ point.title }}</div>
          <div class="tt-waypoint-pop-address">{{ point.address }}</div>
          <div class="tt-waypoint-pop-time">{{ point.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
