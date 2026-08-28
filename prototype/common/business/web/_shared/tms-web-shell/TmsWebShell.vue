<script setup>
/**
 * TMS 业务系统公共框架（唯一实现）。
 * 只负责组合顶部栏 / 工作台栏 / 左侧导航 / 业务内容插槽，
 * 不依赖任何业务页面的数据或 Pixso 编号。缩放由页面级 CSS 变量控制。
 */
import TmsTopbar from './TmsTopbar.vue'
import TmsWorkspaceBar from './TmsWorkspaceBar.vue'
import TmsSideNav from './TmsSideNav.vue'
import './shell-tokens.css'

defineProps({
  /* 顶部栏 */
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
  /* 工作台栏 */
  tabs: { type: Array, default: () => [] },
  activeTabKey: { type: String, default: '' },
  /* 左侧导航 */
  navItems: { type: Array, default: () => [] },
  activeNav: { type: String, default: '' },
  /* 整体缩放（页面级） */
  scale: { type: Number, default: 1 },
})

const emit = defineEmits([
  'menu-select',
  'go-workbench',
  'close-tab',
  'switch-tab',
  'navigate',
])
</script>

<template>
  <div class="tms-web-shell" :style="{ '--tms-shell-scale': scale }">
    <TmsTopbar
      :site-name="siteName"
      :organization-name="organizationName"
      :date-text="dateText"
      :weather-text="weatherText"
      :menus="menus"
      :active-menu="activeMenu"
      @menu-select="emit('menu-select', $event)"
    >
      <template #logo><slot name="logo" /></template>
      <template #avatar><slot name="avatar" /></template>
      <template #weather-icon><slot name="weather-icon" /></template>
      <template #status><slot name="status" /></template>
      <template #actions><slot name="actions" /></template>
    </TmsTopbar>

    <TmsWorkspaceBar
      :tabs="tabs"
      :active-key="activeTabKey"
      @go-workbench="emit('go-workbench')"
      @switch-tab="emit('switch-tab', $event)"
      @close-tab="emit('close-tab', $event)"
    >
      <template #home-icon><slot name="home-icon" /></template>
    </TmsWorkspaceBar>

    <div class="tms-shell-body">
      <TmsSideNav
        :items="navItems"
        :active-key="activeNav"
        @navigate="emit('navigate', $event)"
      />
      <div class="tms-shell-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style>
.tms-web-shell {
  position: relative;
  width: 1920px;
  height: 1364px;
  background: linear-gradient(135deg, #edf3f8 0%, #f2f1f6 100%);
  transform: scale(var(--tms-shell-scale, 1));
  transform-origin: left top;
  --tms-topbar-height: 60px;
}

.tms-shell-body {
  position: absolute;
  left: 0;
  top: 96px;
  width: 1920px;
  height: 1268px;
}

.tms-shell-content {
  position: absolute;
  left: 48px;
  top: 0;
  width: 1872px;
  height: 1268px;
  background-color: #ffffff;
}
</style>
