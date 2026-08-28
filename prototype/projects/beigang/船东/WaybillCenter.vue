<template>
  <div class="wb-preview">
    <main class="wb-screen" aria-label="运单">
      <!-- 顶部状态栏 -->
      <img class="wb-status-art" src="/shipowner-statusbar.svg" alt="" />

      <!-- 顶部 Header：标题“运单” + 运输/结算切换 -->
      <header class="wb-header annot-shipowner-waybill-field-header">
        <div class="wb-title-group">
          <span class="wb-title">运单</span>
          <span class="wb-title-decor"></span>
        </div>

        <!-- 运输/结算 胶囊切换 -->
        <nav class="wb-capsule-tabs" aria-label="运输结算切换">
          <button
            type="button"
            class="wb-tab-item"
            :class="{ active: currentTab === 'transport' }"
            @click="switchTab('transport')"
          >
            运输
          </button>
          <button
            type="button"
            class="wb-tab-item"
            :class="{ active: currentTab === 'settle' }"
            @click="switchTab('settle')"
          >
            结算
          </button>
        </nav>
      </header>

      <!-- 搜索行：运单号搜索框 + 筛选入口 -->
      <div class="wb-search-row annot-shipowner-waybill-field-search">
        <div class="wb-search">
          <van-icon name="search" size="15" color="#8C99A8" />
          <input
            v-model="keyword"
            placeholder="请输入运单号"
            aria-label="搜索运单号"
          />
        </div>
        <button class="wb-filter-btn annot-shipowner-waybill-action-filter" type="button" aria-label="筛选" @click="onFilter">
          <span>筛选</span>
          <van-icon name="arrow-down" size="11" />
        </button>
      </div>

      <!-- 状态筛选 chips -->
      <div class="wb-status-row annot-shipowner-waybill-field-status" aria-label="状态筛选">
        <button
          v-for="s in statusOptions"
          :key="s.value"
          type="button"
          class="wb-status-chip"
          :class="{ active: statusFilter === s.value }"
          @click="statusFilter = s.value"
        >
          {{ s.text }}
        </button>
      </div>

      <!-- ================= 运输 Tab 运单卡片列表 ================= -->
      <section v-if="currentTab === 'transport'" class="wb-list annot-shipowner-waybill-field-list" aria-label="运单列表">
        <article
          v-for="w in filteredList"
          :key="w.waybillId"
          class="wb-card"
          :class="{ 'has-address-change': showAddressBar(w) }"
          @click="onCard(w)"
        >
          <!-- 状态行：主状态 + 运单号 + 复制 | 船东运费 -->
          <div class="wb-card-head">
            <span class="wb-status-badge" :class="statusCls(w.status)">{{ statusText(w.status) }}</span>
            <span class="wb-waybill-no">{{ w.waybillNo }}</span>
            <button type="button" class="wb-copy-btn" aria-label="复制运单号" @click.stop="copyNo(w.waybillNo)">
              <van-icon name="description" size="13" color="#8A91A1" />
            </button>
            <div class="wb-freight">
              <b>¥{{ w.freightAmount }}</b>
            </div>
          </div>

          <!-- 货物行 + 时间 -->
          <div class="wb-cargo-row">
            <div class="wb-cargo-main">
              <div class="wb-cargo-name">
                <span class="wb-cargo-text">{{ w.cargoName }}</span>
                <span class="wb-cargo-weight">{{ w.cargoWeight }}</span>
              </div>
              <div class="wb-route-line">{{ w.origin }} - {{ w.destination }}</div>
            </div>
            <div class="wb-time-block">
              <span class="wb-time-label">{{ w.status === 'cancelled' ? '取消时间' : '预计到港' }}</span>
              <span class="wb-time-value">{{ w.status === 'cancelled' ? w.cancelTime : w.expectArriveTime }}</span>
            </div>
          </div>

          <!-- 地址变更提醒条：仅当前存在待船东处理申请时显示 -->
          <div v-if="showAddressBar(w)" class="wb-address-bar annot-shipowner-waybill-rule-address-change" @click.stop="onAddressChange(w)">
            <span class="wb-address-tag">地址变更</span>
            <span class="wb-address-tip">卸货地址已调整</span>
            <span class="wb-address-action">
              去处理
              <van-icon name="arrow" size="12" />
            </span>
          </div>

          <!-- 船东信息 + 补录凭证 -->
          <div class="wb-ship-row">
            <div class="wb-ship-info">
              <img src="/shipowner-publisher-logo.svg" alt="" />
              <span class="wb-ship-name">船东 {{ w.shipownerName }}</span>
            </div>
            <button type="button" class="wb-voucher-btn" @click.stop="onVoucher(w)">补录凭证</button>
          </div>
        </article>

        <div v-if="filteredList.length === 0" class="wb-empty">
          <van-icon name="search" size="40" color="#c4cbd8" />
          <p>暂无符合条件的运单</p>
        </div>
      </section>

      <!-- ================= 结算 Tab（占位演示） ================= -->
      <section v-else class="wb-list" aria-label="结算列表">
        <div class="wb-empty">
          <van-icon name="balance-o" size="40" color="#c4cbd8" />
          <p>结算运单待演示</p>
        </div>
      </section>

      <!-- 底部导航：高亮“运单” (第三项) -->
      <div class="wb-bottom-mask"></div>
      <nav class="wb-bottom-nav annot-shipowner-waybill-field-tabbar" aria-label="底部导航">
        <img src="/shipowner-tabbar-waybill.svg?v=hall2" alt="找货、跑货、运单、我的" />
        <button
          v-for="(nav, index) in navs"
          :key="nav"
          type="button"
          :style="{ left: `${index * 25}%` }"
          :aria-label="nav"
          class="wb-nav-hitbox"
          @click="onNav(nav)"
        ></button>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { mockWaybillList } from './mock-data.js'

const props = defineProps({
  // 由 ShipownerApp 传入：当前是否存在待船东处理地址变更（与运单详情强制弹窗联动）
  hasPendingAddressChange: { type: Boolean, default: false },
})

const emit = defineEmits(['view-waybill', 'nav-runcargo', 'nav-find'])

const navs = ['找货', '跑货', '运单', '我的']

// 运输/结算 切换
const currentTab = ref('transport')
const switchTab = (tab) => {
  currentTab.value = tab
}

// 状态筛选
const statusFilter = ref('all')
const statusOptions = [
  { text: '全部', value: 'all' },
  { text: '已开航', value: 'sailing' },
  { text: '已到港', value: 'arrived' },
  { text: '已取消', value: 'cancelled' },
]

// 运单号搜索
const keyword = ref('')

const filteredList = computed(() => {
  let list = mockWaybillList
  if (statusFilter.value !== 'all') {
    list = list.filter((w) => w.status === statusFilter.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(
      (w) =>
        (w.waybillNo && w.waybillNo.toLowerCase().includes(kw)) ||
        (w.cargoName && w.cargoName.toLowerCase().includes(kw)) ||
        (w.origin && w.origin.toLowerCase().includes(kw)) ||
        (w.destination && w.destination.toLowerCase().includes(kw))
    )
  }
  return list
})

const statusText = (status) => {
  if (status === 'sailing') return '已开航'
  if (status === 'arrived') return '已到港'
  if (status === 'cancelled') return '已取消'
  return status
}

const statusCls = (status) => {
  if (status === 'sailing') return 'status-sailing'
  if (status === 'arrived') return 'status-arrived'
  if (status === 'cancelled') return 'status-cancelled'
  return ''
}

// 提醒条：卡片标记有待处理变更 + 当前详情确实处于待处理状态（与强制弹窗一致，已取消不显示）
const showAddressBar = (w) => {
  return w.hasPendingAddressChange === true && props.hasPendingAddressChange && w.status !== 'cancelled'
}

const copyNo = (no) => {
  showToast(`已复制运单号：${no}`)
}

const onVoucher = (w) => {
  showToast(`补录凭证（演示：${w.waybillNo}）`)
}

const onCard = (w) => {
  emit('view-waybill', w)
}

const onAddressChange = (w) => {
  // 进入运单详情处理地址变更（详情页强制弹窗）
  emit('view-waybill', w)
}

const onFilter = () => {
  showToast('筛选面板待演示')
}

const onNav = (nav) => {
  if (nav === '运单') {
    showToast('当前已在运单列表')
    return
  }
  if (nav === '跑货') {
    emit('nav-runcargo')
    return
  }
  if (nav === '找货') {
    emit('nav-find')
    return
  }
  // 我的：本期占位
  showToast(`${nav}页面待演示`)
}
</script>

<style scoped>
.wb-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.wb-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #dce7fc 0%, #edf2fc 60px, #f0f2f6 140px, #f0f2f6 100%);
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.wb-status-art {
  position: absolute;
  top: 0;
  left: 0;
  width: 375px;
  height: 72px;
  z-index: 20;
  pointer-events: none;
  display: block;
}

/* ================= 头部 Header ================= */
.wb-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 44px 18px 12px 18px;
  gap: 18px;
  position: relative;
  z-index: 10;
}

.wb-title-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.wb-title {
  font-size: 22px;
  font-weight: 700;
  color: #173664;
  letter-spacing: -0.5px;
}

.wb-title-decor {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3a65ff;
  opacity: 0.8;
}

/* 运输/结算 胶囊 */
.wb-capsule-tabs {
  display: inline-flex;
  align-items: center;
  background: rgba(23, 54, 100, 0.08);
  border-radius: 100px;
  padding: 3px;
  gap: 2px;
}

.wb-tab-item {
  border: none;
  background: transparent;
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 13px;
  color: #5a6e85;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wb-tab-item.active {
  background: #ffffff;
  color: #173664;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(23, 54, 100, 0.08);
}

/* ================= 搜索行 ================= */
.wb-search-row {
  display: flex;
  align-items: center;
  padding: 6px 16px 12px 16px;
  gap: 12px;
}

.wb-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: 100px;
  padding: 7px 14px;
  box-shadow: 0 2px 6px rgba(23, 54, 100, 0.04);
}

.wb-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #173664;
}

.wb-search input::placeholder {
  color: #8c99a8;
  font-size: 12px;
}

.wb-filter-btn {
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  color: #5a6e85;
  cursor: pointer;
  padding: 4px 0;
  font-weight: 500;
}

/* ================= 状态筛选 ================= */
.wb-status-row {
  display: flex;
  align-items: center;
  padding: 0 16px 12px 16px;
  gap: 10px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.wb-status-row::-webkit-scrollbar {
  display: none;
}

.wb-status-chip {
  flex-shrink: 0;
  border: none;
  background: rgba(255, 255, 255, 0.65);
  color: #5a6e85;
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.18s ease;
}

.wb-status-chip.active {
  background: #ffffff;
  color: #3a65ff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(58, 101, 255, 0.12);
}

/* ================= 列表与卡片 ================= */
.wb-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 16px 92px 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.wb-list::-webkit-scrollbar {
  display: none;
}

/* 设计稿卡片 686×266 (2x) → 343×133 (1x)；有提醒条 +64px */
.wb-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 14px 13px 14px;
  margin-bottom: 12px;
  box-shadow: 0 4px 14px rgba(23, 54, 100, 0.04);
}

/* 卡片头部：状态 + 运单号 + 复制 | 运费 */
.wb-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 11px;
}

.wb-status-badge {
  font-size: 13px;
  font-weight: 700;
}

.wb-status-badge.status-sailing {
  color: #3a65ff;
}

.wb-status-badge.status-arrived {
  color: #0fb26a;
}

.wb-status-badge.status-cancelled {
  color: #999999;
}

.wb-waybill-no {
  font-size: 13px;
  color: #8a91a1;
  font-weight: 500;
  letter-spacing: -0.2px;
}

.wb-copy-btn {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.wb-freight {
  margin-left: auto;
}

.wb-freight b {
  font-size: 15px;
  font-weight: 700;
  color: #567bff;
}

/* 货物行 + 时间 */
.wb-cargo-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.wb-cargo-name {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 5px;
}

.wb-cargo-text {
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}

.wb-cargo-weight {
  font-size: 17px;
  font-weight: 700;
  color: #333333;
}

.wb-route-line {
  font-size: 12px;
  color: #8a91a1;
}

.wb-time-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.wb-time-label {
  font-size: 12px;
  color: #8a91a1;
  line-height: 17px;
}

.wb-time-value {
  font-size: 12px;
  color: #8a91a1;
  line-height: 17px;
  margin-top: 3px;
}

/* ================= 地址变更提醒条 ================= */
.wb-address-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff4e8;
  border-radius: 8px;
  padding: 9px 11px;
  margin-bottom: 12px;
  cursor: pointer;
}

.wb-address-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #ff8400;
  background: rgba(255, 132, 0, 0.12);
  border-radius: 4px;
  padding: 2px 6px;
}

.wb-address-tip {
  font-size: 12px;
  color: #333333;
  font-weight: 500;
}

.wb-address-action {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  color: #3a65ff;
  flex-shrink: 0;
}

/* 船东信息 + 补录凭证 */
.wb-ship-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wb-ship-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.wb-ship-info img {
  width: 15px;
  height: 15px;
}

.wb-ship-name {
  font-size: 13px;
  color: #333333;
  font-weight: 500;
}

.wb-voucher-btn {
  border: 1px solid #d4d4d4;
  background: #ffffff;
  border-radius: 100px;
  padding: 5px 16px;
  font-size: 13px;
  color: #333333;
  font-weight: 500;
  cursor: pointer;
}

.wb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #8c99a8;
  gap: 12px;
  font-size: 13px;
}

/* ================= 底部导航 ================= */
.wb-bottom-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: linear-gradient(180deg, rgba(240, 242, 246, 0) 0%, #f0f2f6 80%);
  pointer-events: none;
}

.wb-bottom-nav {
  position: absolute;
  bottom: 12px;
  left: 16px;
  width: 343px;
  height: 55px;
  z-index: 20;
}

.wb-bottom-nav img {
  width: 100%;
  height: 100%;
  display: block;
}

.wb-nav-hitbox {
  position: absolute;
  top: 0;
  width: 25%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
}
</style>
