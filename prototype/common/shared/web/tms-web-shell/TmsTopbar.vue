<script setup>
import { useSlots } from 'vue'
/**
 * TMS 系统顶部栏：Logo、企业信息、应用菜单、日期天气与右侧窗口图标。
 * 全部按 1920 设计稿坐标定位，页面级缩放由外层 shell 统一控制。
 */
defineProps({
  siteName: { type: String, default: '' },
  organizationName: { type: String, default: '' },
  dateText: { type: String, default: '' },
  weatherText: { type: String, default: '' },
  menus: {
    type: Array,
    default: () => [
      { key: 'twin', label: '3D数字孪生' },
      { key: 'screen', label: '数字大屏' },
      { key: 'dashboard', label: '工作台' },
    ],
  },
  activeMenu: { type: String, default: 'dashboard' },
})
const emit = defineEmits(['menu-select'])
const slots = useSlots()
</script>

<template>
  <div class="tms-topbar">
    <div class="tms-topbar-logo">
      <slot name="logo" />
    </div>
    <div class="tms-topbar-divider" />
    <div class="tms-topbar-avatar">
      <slot name="avatar" />
    </div>
    <div class="tms-topbar-id">
      <div class="tms-topbar-site">{{ siteName }}</div>
      <div class="tms-topbar-org">{{ organizationName }}</div>
    </div>

    <div v-if="menus.length" class="tms-topbar-menus" role="tablist">
      <button
        v-for="menu in menus"
        :key="menu.key"
        type="button"
        class="tms-topbar-menu-item"
        :class="{ active: menu.key === activeMenu }"
        @click="emit('menu-select', menu.key)"
      >{{ menu.label }}</button>
    </div>

    <div class="tms-topbar-status">
      <span v-if="dateText" class="tms-topbar-date">{{ dateText }}</span>
      <span v-if="slots['weather-icon']" class="tms-topbar-weather-icon"><slot name="weather-icon" /></span>
      <span v-if="weatherText" class="tms-topbar-weather">{{ weatherText }}</span>
      <slot name="status" />
    </div>

    <div class="tms-topbar-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style>
.tms-topbar {
  position: relative;
  width: 1920px;
  height: var(--tms-topbar-height);
}

.tms-topbar-logo {
  position: absolute;
  left: 48px;
  top: 17px;
  width: 124px;
  height: 28px;
  display: flex;
  align-items: center;
}

.tms-topbar-divider {
  position: absolute;
  left: 200px;
  top: 18px;
  width: 1px;
  height: 24px;
  background-color: var(--tms-text-primary);
}

.tms-topbar-avatar {
  position: absolute;
  left: 227px;
  top: 13px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tms-topbar-id {
  position: absolute;
  left: 268px;
  top: 11px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tms-topbar-site {
  font-size: 16px;
  font-weight: 700;
  color: var(--tms-text-primary);
  line-height: 19px;
}

.tms-topbar-org {
  font-size: 12px;
  color: var(--tms-text-secondary);
  line-height: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 190px;
}

.tms-topbar-menus {
  position: absolute;
  left: 854px;
  top: 12px;
  width: 318px;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0;
  gap: 0;
  background-color: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}

.tms-topbar-menu-item {
  flex: 0 0 106px;
  width: 106px;
  height: 100%;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--tms-text-muted);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.tms-topbar-menu-item.active {
  background-color: #ffffff;
  color: var(--tms-text-primary);
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.05);
}

.tms-topbar-status {
  position: absolute;
  left: 0;
  top: 17px;
  width: 1920px;
  height: 31px;
  display: flex;
  align-items: center;
}

.tms-topbar-date {
  position: absolute;
  left: 1474px;
  top: 0;
  width: 137px;
  white-space: nowrap;
}

.tms-topbar-weather-icon {
  position: absolute;
  left: 1715px;
  top: -3px;
  width: 37px;
  height: 31px;
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

.tms-topbar-weather {
  position: absolute;
  left: 1635px;
  top: 0;
  width: 70px;
  white-space: nowrap;
}

.tms-topbar-date,
.tms-topbar-weather {
  font-size: 16px;
  font-weight: 700;
  color: var(--tms-text-primary);
}

.tms-topbar-actions {
  position: absolute;
  left: 1792px;
  top: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
