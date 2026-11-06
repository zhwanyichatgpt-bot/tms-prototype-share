<template>
  <header class="aia-topbar">
    <div class="aia-topbar__left">
      <button type="button" aria-label="历史记录" @click="emit('history')"><van-icon name="wap-nav"/></button>
      <button type="button" aria-label="开启新任务" @click="emit('new-task')">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M4 4.5h16v12H9.6L4 20.5z" stroke-linejoin="round"/>
          <path d="M12 7.8v5M9.5 10.3h5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <span class="aia-topbar__title">{{ title }}<van-icon name="arrow-down"/></span>
    <div class="aia-topbar__right">
      <button type="button" aria-label="更多操作" :aria-expanded="menu" @click="menu = !menu"><van-icon name="ellipsis"/></button>
      <button type="button" aria-label="关闭并返回首页" @click="emit('close')"><van-icon name="cross"/></button>
      <div v-if="menu" class="aia-topbar__menu">
        <button v-for="item in extraMenus" :key="item.key" type="button" @click="menu = false; emit('menu-action', item.key)">{{ item.label }}</button>
        <button type="button" @click="menu = false; emit('restart')">重新开始</button>
        <button type="button" @click="menu = false; emit('close')">返回首页</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, default: '至小简' },
  extraMenus: { type: Array, default: () => [] },
})
const emit = defineEmits(['history', 'new-task', 'restart', 'close', 'menu-action'])
const menu = ref(false)
</script>
