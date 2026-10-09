<template>
  <main class="driver-setting-page" aria-label="接单设置">
    <div class="driver-status setting-status" aria-hidden="true">
      <strong>9:41</strong>
      <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery" /></span>
    </div>

    <div class="setting-scroll">
      <header class="setting-header">
        <button type="button" aria-label="返回个人中心" @click="emit('back')"><van-icon name="arrow-left" /></button>
        <h1>接单设置</h1>
        <span aria-hidden="true" />
      </header>

      <p class="setting-intro">设置常跑目的地和可运输货品，平台据此推送匹配的货源。</p>

      <!-- 常跑路线：出发地单选 + 目的地多选，两者都由司机自己选 -->
      <section class="setting-card" aria-label="常跑路线">
        <div class="setting-card-heading">
          <h2>常跑路线</h2>
          <small>{{ route.destinations.length ? `已选 ${route.destinations.length} 个目的地` : '未设置目的地' }}</small>
        </div>

        <div class="setting-subheading">
          <span>出发地</span>
          <small>单选</small>
        </div>
        <div class="setting-chip-grid">
          <button
            v-for="city in cityOptions"
            :key="`from-${city}`"
            type="button"
            class="setting-chip"
            :class="{ active: route.origin === city }"
            @click="chooseOrigin(city)"
          >{{ city }}</button>
        </div>

        <div class="setting-subheading">
          <span>目的地</span>
          <small>可多选</small>
        </div>
        <div class="setting-chip-grid">
          <button
            v-for="city in cityOptions"
            :key="`to-${city}`"
            type="button"
            class="setting-chip"
            :class="{ active: isDestination(city) }"
            @click="chooseDestination(city)"
          >{{ city }}<em v-if="cityCargoCount(city)">{{ cityCargoCount(city) }}</em></button>
        </div>

        <p class="setting-note">常跑路线只用于筛选货源，不代表优先接单或预留货量；被货主定向邀请的货源仍按原有规则展示。</p>
      </section>

      <!-- 可运输货品：不限时全部推送 -->
      <section class="setting-card" aria-label="可运输货品">
        <div class="setting-card-heading">
          <h2>可运输货品</h2>
          <small>{{ store.categories.length ? `已选 ${store.categories.length} 类` : '不限' }}</small>
        </div>
        <div class="setting-chip-grid">
          <button
            v-for="category in categoryOptions"
            :key="category"
            type="button"
            class="setting-chip"
            :class="{ active: store.categories.includes(category) }"
            @click="toggleCategory(category)"
          >{{ category }}</button>
        </div>
        <p class="setting-note">不选表示不限货品，全部货源都会推送。</p>
      </section>

      <p class="setting-footnote">以上设置影响首页货源与地图找货的推送和筛选，不改变已接运单，也不限制司机主动浏览全部货源。</p>
    </div>
  </main>
</template>

<script setup>
import { showToast } from 'vant'
import {
  CARGO_CATEGORY_OPTIONS,
  ROUTE_CITY_OPTIONS,
  cityCargoCount,
  frequentRouteStore,
  orderSettingStore,
  setRouteOrigin,
  toggleOrderCategory,
  toggleRouteDestination,
} from './driver-flow-store.js'
import './driver-setting.css'

const emit = defineEmits(['back'])

// 两个 store 职责不同：路线偏好归 frequentRouteStore，货品偏好归 orderSettingStore。
// 分开维护是因为地图找货的「常跑路线」筛选只读前者。
const route = frequentRouteStore
const store = orderSettingStore
const cityOptions = ROUTE_CITY_OPTIONS
const categoryOptions = CARGO_CATEGORY_OPTIONS

const isDestination = (city) => route.destinations.includes(city)

// 出发地单选：切换出发地不清空已选目的地，司机改的是起点不是整条线路
function chooseOrigin(city) {
  if (route.origin === city) return
  setRouteOrigin(city)
  showToast(`出发地已设为 ${city}`)
}

function chooseDestination(city) {
  const wasSelected = isDestination(city)
  toggleRouteDestination(city)
  // 取消最后一个目的地会让地图筛选直接不可用，如实提示而不是静默变成空结果
  if (wasSelected && route.destinations.length === 0) {
    showToast('已清空常跑路线，地图的「常跑路线」筛选需先设置')
  }
}

function toggleCategory(category) {
  toggleOrderCategory(category)
}
</script>
