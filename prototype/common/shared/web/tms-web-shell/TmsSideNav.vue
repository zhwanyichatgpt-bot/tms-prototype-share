<script setup>
/**
 * TMS 系统左侧导航栏：垂直图标列。
 * item 结构与坐标由使用方传入，激活状态与点击事件上抛。
 */
defineProps({
  items: { type: Array, default: () => [] },
  activeKey: { type: String, default: '' },
})
const emit = defineEmits(['navigate'])

function badgeStyle(badge) {
  return {
    position: 'absolute',
    width: `${badge.w}px`,
    height: `${badge.h}px`,
    left: `${badge.x}px`,
    top: `${badge.y}px`,
    borderRadius: '2px',
    backgroundColor: '#93999f',
    transform: 'rotate(45deg)',
  }
}
</script>

<template>
  <nav class="tms-sidenav" aria-label="系统导航">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="tms-sidenav-item"
      :class="{ active: item.key === activeKey }"
      :style="{
        left: `${item.left ?? 0}px`,
        top: `${item.top ?? 0}px`,
        width: `${item.width ?? 32}px`,
        height: `${item.height ?? 32}px`,
      }"
      :aria-label="item.label || '导航'"
      @click="emit('navigate', item.key)"
    >
      <img
        v-for="(img, idx) in item.imgs || []"
        :key="idx"
        :src="img.src || img"
        :alt="item.label || ''"
        class="tms-sidenav-item-img"
        :style="{
          left: `${(img.x ?? 0)}px`,
          top: `${(img.y ?? 0)}px`,
          width: `${(img.w ?? 24)}px`,
          height: `${(img.h ?? 24)}px`,
        }"
      />
      <span v-if="item.badge" class="tms-sidenav-item-badge" :style="badgeStyle(item.badge)" />
    </button>
  </nav>
</template>

<style>
.tms-sidenav {
  position: relative;
  left: 8px;
  top: 296px;
  width: 32px;
  height: 132px;
}

.tms-sidenav-item {
  position: absolute;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.tms-sidenav-item-img {
  position: absolute;
  pointer-events: none;
}

.tms-sidenav-item-badge {
  position: absolute;
  pointer-events: none;
}
</style>
