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
  workspaceVariant: { type: String, default: '' },
  /* 左侧导航 */
  navItems: { type: Array, default: () => [] },
  activeNav: { type: String, default: '' },
  /* 整体缩放（页面级） */
  scale: { type: Number, default: 1 },
  /* 框架规格：design（1920×1364 设计稿）/ business（业务系统 1920×936） */
  variant: { type: String, default: 'design' },
  fluid: { type: Boolean, default: false },
  /* business 规格画布高度 */
  canvasHeight: { type: Number, default: 936 },
  /* 是否显示页签栏左侧「工作台」入口 */
  showHome: { type: Boolean, default: true },
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
  <div
    class="tms-web-shell"
    :class="[`tms-web-shell--${variant}`, { 'tms-web-shell--fluid': fluid }]"
    :style="{ '--tms-shell-scale': scale, '--tms-shell-height': `${canvasHeight}px` }"
  >
    <TmsTopbar
      :variant="variant"
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
      <template #menu-extra><slot name="menu-extra" /></template>
      <template #status><slot name="status" /></template>
      <template #actions><slot name="actions" /></template>
    </TmsTopbar>

    <TmsWorkspaceBar
      :variant="workspaceVariant || variant"
      :show-home="showHome"
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
        :variant="variant"
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

/* =====================================================
 * business 规格：真实业务系统（1920×936）
 * 顶栏 72px + 页签栏 36px + 图标栏 64px + 内容区 1856×828
 * ===================================================== */
.tms-web-shell--business {
  height: var(--tms-shell-height, 936px);
  background: linear-gradient(127deg, #edf3f8 0%, #f2f1f6 100%);
}

.tms-web-shell--business .tms-shell-body {
  top: 108px;
  height: calc(var(--tms-shell-height, 936px) - 108px);
}

.tms-web-shell--business .tms-shell-content {
  left: 64px;
  width: 1856px;
  height: calc(var(--tms-shell-height, 936px) - 108px);
  background-color: #ffffff;
}
.tms-web-shell--business .tms-workbar--design {
  left: 64px;
  width: 1856px;
}
.tms-web-shell--business .tms-workbar--design .tms-workbar-tabs { left: 153px; }
.tms-web-shell--business .tms-workbar--design :is(.tms-workbar-home-text, .tms-workbar-tab-label) { font-weight: 400; }
.tms-web-shell--business .tms-workbar-home-icon img { width: 16px; height: 16px; }

/* 业务页按实际画布排版，保留浏览器原生字号。 */
.tms-web-shell--business.tms-web-shell--fluid {
  container: tms-fluid-shell / inline-size;
  width: 100%;
  height: 100%;
  transform: none;
}
.tms-web-shell--fluid .tms-shell-body {
  width: 100%;
  height: auto;
  bottom: 0;
}
.tms-web-shell--fluid .tms-shell-content,
.tms-web-shell--fluid .tms-workbar {
  width: calc(100% - 64px);
}
.tms-web-shell--fluid .tms-shell-content {
  height: 100%;
  overflow: auto;
}
.tms-web-shell--fluid .tms-topbar--business {
  width: 100%;
  display: grid;
  grid-template-columns: 480px minmax(0, 1fr) 420px;
}
.tms-web-shell--fluid .tms-topbar--business .tms-topbar-menus {
  position: relative;
  grid-column: 2;
  left: auto;
  justify-self: center;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
@container tms-fluid-shell (width < 1500px) {
  .tms-web-shell--fluid .tms-topbar--business {
    grid-template-columns: min(36%, 370px) minmax(0, 1fr) 132px;
  }
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-logo { left: 20px; }
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-divider { left: 156px; }
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-avatar { left: 168px; }
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-id { left: 210px; max-width: calc(36% - 218px); }
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-org,
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-site {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tms-web-shell--fluid .tms-topbar--business .tms-topbar-status { display: none; }
}
@container tms-fluid-shell (width < 760px) {
  .tms-web-shell--fluid .tms-topbar--business { grid-template-columns: 156px minmax(0, 1fr) 132px; }
  .tms-web-shell--fluid .tms-topbar--business :is(.tms-topbar-id, .tms-topbar-divider, .tms-topbar-avatar) { display: none; }
}
</style>
