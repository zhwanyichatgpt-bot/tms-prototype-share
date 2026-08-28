<script setup>
/**
 * TMS 工作台页签栏：工作台入口 + 当前页面页签 + 关闭入口。
 * 位置与动作通过事件上抛，公共组件不写业务跳转。
 */
import { useSlots } from 'vue'

defineProps({
  tabs: {
    type: Array,
    default: () => [{ key: 'transportTask', label: '运输任务' }],
  },
  activeKey: { type: String, default: '' },
  closable: { type: Boolean, default: true },
})
const emit = defineEmits(['go-workbench', 'switch-tab', 'close-tab'])
const slots = useSlots()
</script>

<template>
  <div class="tms-workbar">
    <button type="button" class="tms-workbar-home" @click="emit('go-workbench')">
      <span v-if="slots['home-icon']" class="tms-workbar-home-icon"><slot name="home-icon" /></span>
      <span class="tms-workbar-home-text">工作台</span>
    </button>

    <div class="tms-workbar-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tms-workbar-tab"
        :class="{ active: tab.key === activeKey }"
        @click="emit('switch-tab', tab.key)"
      >
        <span class="tms-workbar-tab-label">{{ tab.label }}</span>
        <button
          v-if="closable"
          type="button"
          class="tms-workbar-tab-close"
          aria-label="关闭页签"
          @click.stop="emit('close-tab', tab.key)"
        >
          <span class="tms-workbar-tab-close-icon" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.tms-workbar {
  position: relative;
  left: 48px;
  top: 0;
  width: 1872px;
  height: var(--tms-workbar-height);
  background-color: rgba(0, 0, 0, 0.06);
  border-radius: 12px 0 0 0;
}

.tms-workbar-home {
  position: absolute;
  left: 48px;
  top: 0;
  height: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--tms-text-muted);
  padding: 0;
}

.tms-workbar-home-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tms-workbar-home-text {
  font-size: 16px;
  font-weight: 700;
}

.tms-workbar-tabs {
  position: absolute;
  left: 217px;
  top: 0;
  height: 100%;
  width: 202px;
  display: block;
}

.tms-workbar-tab {
  position: relative;
  display: block;
  width: 202px;
  height: 100%;
  padding: 0;
  background: url('/tms-web-shell-assets/Vector_26_176.svg') center / 202px 36px no-repeat;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.tms-workbar-tab-label {
  position: absolute;
  left: 59px;
  top: 7px;
  font-size: 16px;
  font-weight: 700;
  color: var(--tms-text-primary);
}

.tms-workbar-tab-close {
  position: absolute;
  left: 160px;
  top: 13px;
  width: 10px;
  height: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.tms-workbar-tab-close-icon {
  position: absolute;
  inset: 0;
}
.tms-workbar-tab-close-icon::before,
.tms-workbar-tab-close-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 1.5px;
  border-radius: 2px;
  background-color: var(--tms-text-primary);
}
.tms-workbar-tab-close-icon::before {
  transform: translate(-50%, -50%) rotate(45deg);
}
.tms-workbar-tab-close-icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}
</style>
