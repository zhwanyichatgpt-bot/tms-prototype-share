<template>
  <div class="ws-root">
    <!-- 顶部品牌导航 -->
    <nav class="ws-topbar">
      <a class="brand-wrap" @click="goHome">
        <span class="brand-mark">至</span>
        <span class="brand-text">
          <span class="brand-name">至简集运</span>
          <span class="brand-sub">运输部 · 福州迅辉南运有限公司</span>
        </span>
      </a>
      <div class="main-nav">
        <span class="active" @click="goHome">工作台</span>
        <span>3D数字孪生</span>
        <span>数字大屏展示</span>
        <span>应用导航</span>
        <span>业务工作台</span>
      </div>
      <div class="header-meta">
        <span class="back-link" @click="goHome">← 返回原型目录</span>
        <span class="meta-date">{{ currentDate }}</span>
        <span class="meta-pill">待办 {{ todoCount }}</span>
      </div>
    </nav>

    <!-- workbench tabs 条 -->
    <div class="ws-workbench-row">
      <span class="workbench-tab muted" @click="goHome">▦ 工作台</span>
      <div class="workbench-tab active">{{ currentTitle }} <i @click="goHome">×</i></div>
    </div>

    <!-- 左侧深色 sider -->
    <aside class="ws-sider">
      <div class="sider-icon" @click="goHome">▦</div>
      <div class="sider-icon">▣</div>
      <div class="sider-icon">◧</div>
    </aside>

    <!-- 主内容区 -->
    <main class="ws-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { prototypeStore, setCurrentPage } from '../shared/prototype-store'

const props = defineProps({
  currentTitle: { type: String, default: '业务工作台' },
  todoCount: { type: [String, Number], default: 55 },
})

const currentDate = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y} 年 ${m} 月 ${d} 日`
})

function goHome() {
  // 通过 store 通知父级 App.vue 返回首页
  setCurrentPage('home')
  // 触发一个全局事件让 App.vue 清空 currentComponent
  window.dispatchEvent(new CustomEvent('prototype-go-home'))
}
</script>

<style scoped>
.ws-root {
  min-height: 100vh;
  background: #eef3f8;
  padding: 92px 28px 40px 92px;
  position: relative;
}

/* 顶部导航 */
.ws-topbar {
  position: fixed;
  z-index: 30;
  top: 0; left: 0; right: 0;
  height: 58px;
  padding: 0 26px 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: #f3f7fb;
  border-bottom: 1px solid #dfe6ef;
  box-shadow: 0 1px 2px rgba(29, 41, 57, 0.04);
}
.brand-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 258px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.brand-mark {
  width: 34px; height: 34px;
  border-radius: 6px;
  background: #2f6df6;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1f2329;
}
.brand-sub {
  font-size: 12px;
  color: #7b8794;
}
.main-nav {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.main-nav span {
  min-width: 104px;
  height: 34px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7480;
  font-size: 14px;
  cursor: pointer;
}
.main-nav .active {
  background: #fff;
  color: #1f2937;
  box-shadow: inset 0 0 0 1px #d9dee8;
  font-weight: 600;
}
.header-meta {
  min-width: 320px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #4e5969;
}
.back-link {
  color: #2f68ed;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 4px;
}
.back-link:hover {
  background: #e8f3ff;
}
.meta-date {
  font-size: 14px;
  font-weight: 600;
  color: #2b3240;
}
.meta-pill {
  padding: 5px 12px;
  border-radius: 999px;
  background: #6f8ff8;
  color: #fff;
  font-weight: 600;
}

/* workbench tabs 条 */
.ws-workbench-row {
  position: fixed;
  z-index: 29;
  top: 58px;
  left: 0; right: 0;
  height: 34px;
  display: flex;
  align-items: flex-end;
  background: #dfe4ec;
}
.workbench-tab {
  height: 34px;
  min-width: 140px;
  padding: 0 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #7a8492;
  background: #d8dee7;
  border-radius: 0 18px 0 0;
  font-size: 14px;
  cursor: pointer;
}
.workbench-tab.active {
  min-width: 155px;
  background: #fff;
  color: #344052;
  font-weight: 600;
}
.workbench-tab i {
  margin-left: 24px;
  font-style: normal;
  color: #697586;
}

/* 左侧 sider */
.ws-sider {
  position: fixed;
  z-index: 28;
  top: 92px;
  left: 0;
  bottom: 0;
  width: 54px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  gap: 24px;
  background: #e7eef6;
}
.sider-icon {
  color: #7b8794;
  font-size: 22px;
  cursor: pointer;
}

.ws-main {
  min-height: calc(100vh - 132px);
}
</style>
