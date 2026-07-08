<template>
  <div class="back-bar">
    <span class="back-link" @click="goHome">← 返回原型目录</span>
    <span class="page-name">{{ currentTitle }}</span>
    <div class="back-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { setCurrentPage } from '../shared/prototype-store'

defineProps({
  currentTitle: { type: String, default: '' },
})

function goHome() {
  setCurrentPage('home')
  window.dispatchEvent(new CustomEvent('prototype-go-home'))
}
</script>

<style scoped>
.back-bar {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f4;
  position: sticky;
  top: 0;
  z-index: 50;
}
.back-link {
  color: #165dff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e8f3ff;
  transition: all 0.15s;
}
.back-link:hover {
  background: #d0e7ff;
}
.page-name {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
}
.back-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
