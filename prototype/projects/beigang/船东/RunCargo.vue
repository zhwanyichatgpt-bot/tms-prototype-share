<template>
  <div class="rc-preview">
    <main class="rc-screen" aria-label="跑货">
      <!-- 顶部状态栏 -->
      <img class="rc-status-art" src="/shipowner-statusbar.svg" alt="" />

      <!-- 标题：运输跟踪 + 蓝色对勾（右上角胶囊由状态栏自带，不重复） -->
      <header class="rc-header">
        <h1 class="rc-title">
          运输跟踪
          <svg class="rc-title-check" viewBox="0 0 19 10" fill="none" aria-hidden="true">
            <path d="M1 5.5 L6.5 9.5 L18 1" stroke="#3A65FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </h1>
      </header>

      <div class="rc-scroll">
        <!-- 运输跟踪地图卡（含空态） -->
        <section class="rc-map-card annot-shipowner-runcargo-field-map">
          <img class="rc-map-img" src="/shipowner-map-original.png" alt="运输跟踪地图" />
          <button type="button" class="rc-map-full" aria-label="全屏" @click="onFullscreen">
            <van-icon name="enlarge" size="16" color="#333333" />
          </button>
          <!-- 空态：暂无运输中 -->
          <div class="rc-map-empty">
            <div class="rc-empty-icon">
              <svg viewBox="0 0 72 72" fill="none" aria-hidden="true">
                <rect x="16" y="10" width="34" height="50" rx="3" fill="#fff" stroke="#161A28" stroke-width="1.5" />
                <rect x="44" y="10" width="12" height="50" fill="#3A65FF" stroke="#161A28" stroke-width="1.5" />
                <rect x="20" y="20" width="22" height="3.5" rx="1.75" fill="#DCDDDD" />
                <rect x="20" y="30" width="22" height="3.5" rx="1.75" fill="#DCDDDD" />
                <rect x="20" y="40" width="15" height="3.5" rx="1.75" fill="#DCDDDD" />
                <circle cx="26" cy="40" r="9" fill="#3A65FF" stroke="#161A28" stroke-width="1.5" />
                <circle cx="23" cy="38" r="1.2" fill="#fff" />
                <circle cx="26" cy="41" r="1.2" fill="#fff" />
                <circle cx="29" cy="38" r="1.2" fill="#fff" />
                <path d="M33 47 L39 53" stroke="#161A28" stroke-width="2.5" stroke-linecap="round" />
              </svg>
            </div>
            <p class="rc-empty-title">暂无运输中</p>
            <p class="rc-empty-desc">您已接的运输任务将在开启运输后显示路线</p>
          </div>
        </section>

        <!-- 我已接的 + 运单中心入口 -->
        <div class="rc-section-head">
          <span class="rc-section-title">
            我已接的
            <svg class="rc-section-check" viewBox="0 0 26 17" fill="none" aria-hidden="true">
              <path d="M2 9 L9 15 L24 2" stroke="#3A65FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <button type="button" class="rc-waybill-entry" @click="onWaybillCenter">
            运单中心
            <van-icon name="arrow" size="13" color="#455075" />
          </button>
        </div>

        <!-- 已接运输卡片列表 -->
        <section class="rc-list annot-shipowner-runcargo-field-list" aria-label="已接运输任务列表">
          <article
            v-for="t in runCargoList"
            :key="t.id"
            class="rc-card"
            :class="{ 'has-address-change': showAddressBar(t) }"
            @click="onCard(t)"
          >
            <!-- 状态行：主状态 + 运单号 + 复制 | 运费 -->
            <div class="rc-card-head">
              <span class="rc-status-badge" :class="t.status">{{ t.statusText }}</span>
              <span class="rc-waybill-no">{{ t.waybillNo }}</span>
              <button type="button" class="rc-copy-btn" aria-label="复制运单号" @click.stop="copyNo(t.waybillNo)">
                <van-icon name="description" size="13" color="#8A91A1" />
              </button>
              <div class="rc-freight"><b>¥{{ t.freightAmount }}</b></div>
            </div>

            <!-- 货物行 + 到港时间 -->
            <div class="rc-cargo-row">
              <div class="rc-cargo-main">
                <div class="rc-cargo-name">
                  <span class="rc-cargo-text">{{ t.cargoName }}</span>
                  <span class="rc-cargo-weight">{{ t.cargoWeight }}</span>
                </div>
                <div class="rc-route-line">{{ t.origin }} - {{ t.destination }}</div>
              </div>
              <div class="rc-time-block">
                <span class="rc-time-label">{{ t.arriveLabel }}</span>
                <span class="rc-time-value">{{ t.arriveTime }}</span>
              </div>
            </div>

            <!-- 地址变更提醒条：仅当前存在待船东处理申请时显示 -->
            <div v-if="showAddressBar(t)" class="rc-address-bar annot-shipowner-runcargo-rule-address-change" @click.stop="onCard(t)">
              <span class="rc-address-tag">地址变更</span>
              <span class="rc-address-tip">卸货地址已调整</span>
              <span class="rc-address-action">
                去处理
                <van-icon name="arrow" size="12" />
              </span>
            </div>

            <!-- 船东信息 + 补录凭证 -->
            <div class="rc-ship-row">
              <div class="rc-ship-info">
                <img src="/shipowner-publisher-logo.svg" alt="" />
                <span class="rc-ship-name">船东 {{ t.shipownerName }}</span>
              </div>
              <button type="button" class="rc-voucher-btn" @click.stop="onVoucher(t)">补录凭证</button>
            </div>
          </article>

          <div v-if="runCargoList.length === 0" class="rc-list-empty">
            <van-icon name="orders-o" size="40" color="#c4cbd8" />
            <p>暂无已接运输任务</p>
          </div>
        </section>
      </div>

      <!-- 底部导航：高亮“跑货” (第二项) -->
      <div class="rc-bottom-mask"></div>
      <nav class="rc-bottom-nav annot-shipowner-runcargo-field-tabbar" aria-label="底部导航">
        <img src="/shipowner-tabbar-runcargo.svg?v=hall2" alt="找货、跑货、运单、我的" />
        <button
          v-for="(nav, index) in navs"
          :key="nav"
          type="button"
          :style="{ left: `${index * 25}%` }"
          :aria-label="nav"
          class="rc-nav-hitbox"
          @click="onNav(nav)"
        ></button>
      </nav>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import { mockRunCargoList } from './mock-data.js'

const props = defineProps({
  // 由 ShipownerApp 传入：当前是否存在待船东处理地址变更（与运单详情强制弹窗联动）
  hasPendingAddressChange: { type: Boolean, default: false },
})

const emit = defineEmits(['nav-find', 'nav-waybill', 'view-waybill'])

const navs = ['找货', '跑货', '运单', '我的']

const runCargoList = ref(mockRunCargoList)

// 提醒条：卡片标记有待处理变更 + 当前详情确实处于待处理状态（与强制弹窗一致）
const showAddressBar = (t) => {
  return t.hasPendingAddressChange === true && props.hasPendingAddressChange && t.status !== 'cancelled'
}

// 点击卡片/提醒条：进入运单详情（与运单列表逻辑一致）
const onCard = (t) => {
  emit('view-waybill', t)
}

const copyNo = (no) => {
  showToast(`已复制运单号：${no}`)
}

const onVoucher = (t) => {
  showToast(`补录凭证（演示：${t.waybillNo}）`)
}

const onFullscreen = () => {
  showToast('全屏查看地图（演示）')
}

const onWaybillCenter = () => {
  emit('nav-waybill')
}

const onNav = (nav) => {
  if (nav === '跑货') {
    showToast('当前已在跑货')
    return
  }
  if (nav === '找货') {
    emit('nav-find')
    return
  }
  if (nav === '运单') {
    emit('nav-waybill')
    return
  }
  showToast(`${nav}页面待演示`)
}
</script>

<style scoped>
.rc-screen,
.rc-screen *,
.rc-screen *::before,
.rc-screen *::after { box-sizing: border-box; }

.rc-preview {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 0;
  background: #e7e9ed;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.rc-screen {
  position: relative;
  width: 375px;
  height: 812px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #d8e6fb 0%, #e6f0fc 100px, #eef2f8 200px, #eef2f8 100%);
  box-shadow: 0 16px 46px rgba(20, 37, 68, 0.18);
}

.rc-status-art {
  position: absolute;
  top: 0; left: 0;
  width: 375px; height: 72px;
  z-index: 20;
  pointer-events: none;
  display: block;
}

/* ============ 标题栏 ============ */
.rc-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 60px 16px 10px 22px;
}

.rc-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  color: #162f4a;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.rc-title-check { width: 19px; height: 10px; flex: 0 0 auto; }

/* ============ 滚动区 ============ */
.rc-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 92px;
  scrollbar-width: none;
}
.rc-scroll::-webkit-scrollbar { display: none; }

/* ============ 地图卡 ============ */
.rc-map-card {
  position: relative;
  width: 343px;
  height: 256px;
  border-radius: 12px;
  overflow: hidden;
  background: #e6eef8;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 14px rgba(23, 54, 100, 0.06);
}

.rc-map-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rc-map-full {
  position: absolute;
  top: 10px; right: 10px;
  z-index: 5;
  width: 30px; height: 30px;
  border: 0;
  border-radius: 6px;
  background: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 空态 */
.rc-map-empty {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  width: 180px;
  padding: 18px 14px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(23, 54, 100, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rc-empty-icon { width: 72px; height: 72px; }
.rc-empty-icon svg { width: 72px; height: 72px; display: block; }

.rc-empty-title {
  margin: 10px 0 0;
  color: #333333;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.rc-empty-desc {
  margin: 6px 0 0;
  color: #999999;
  font-size: 12px;
  line-height: 18px;
}

/* ============ 我已接的 标题区 ============ */
.rc-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 2px 10px;
}

.rc-section-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #333333;
  font-size: 15px;
  font-weight: 700;
}

.rc-section-check { width: 16px; height: 11px; }

.rc-waybill-entry {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 0;
  background: transparent;
  color: #455075;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

/* ============ 运输卡片 ============ */
.rc-list { display: flex; flex-direction: column; }

.rc-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 14px 13px;
  margin-bottom: 12px;
  box-shadow: 0 4px 14px rgba(23, 54, 100, 0.04);
}

.rc-card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 11px; }

.rc-status-badge { font-size: 13px; font-weight: 700; }
.rc-status-badge.arrived { color: #0fb26a; }
.rc-status-badge.sailing { color: #3a65ff; }
.rc-status-badge.accepted { color: #ff8400; }

.rc-waybill-no { font-size: 13px; color: #8a91a1; font-weight: 500; letter-spacing: -0.2px; }

.rc-copy-btn { border: 0; background: transparent; padding: 0; display: flex; align-items: center; cursor: pointer; }

.rc-freight { margin-left: auto; }
.rc-freight b { font-size: 15px; font-weight: 700; color: #567bff; }

.rc-cargo-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }

.rc-cargo-name { display: flex; align-items: baseline; gap: 5px; margin-bottom: 5px; }
.rc-cargo-text { font-size: 16px; font-weight: 700; color: #333333; }
.rc-cargo-weight { font-size: 17px; font-weight: 700; color: #333333; }

.rc-route-line { font-size: 12px; color: #8a91a1; }

/* 地址变更提醒条（与运单列表一致） */
.rc-address-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff4e8;
  border-radius: 8px;
  padding: 9px 11px;
  margin-bottom: 12px;
  cursor: pointer;
}
.rc-address-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #ff8400;
  background: rgba(255, 132, 0, 0.12);
  border-radius: 4px;
  padding: 2px 6px;
}
.rc-address-tip { font-size: 12px; color: #333333; font-weight: 500; }
.rc-address-action {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
  color: #3a65ff;
  flex-shrink: 0;
}

.rc-time-block { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.rc-time-label { font-size: 12px; color: #8a91a1; line-height: 17px; }
.rc-time-value { font-size: 12px; color: #8a91a1; line-height: 17px; margin-top: 3px; }

.rc-ship-row { display: flex; align-items: center; justify-content: space-between; }
.rc-ship-info { display: flex; align-items: center; gap: 5px; }
.rc-ship-info img { width: 15px; height: 15px; }
.rc-ship-name { font-size: 13px; color: #333333; font-weight: 500; }

.rc-voucher-btn {
  border: 1px solid #d4d4d4;
  background: #ffffff;
  border-radius: 100px;
  padding: 5px 16px;
  font-size: 13px;
  color: #333333;
  font-weight: 500;
  cursor: pointer;
}

.rc-list-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 0; color: #8c99a8; gap: 12px; font-size: 13px;
}

/* ============ 底部导航 ============ */
.rc-bottom-mask {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%; height: 70px;
  background: linear-gradient(180deg, rgba(238, 242, 248, 0) 0%, #eef2f8 80%);
  pointer-events: none;
}

.rc-bottom-nav {
  position: absolute;
  bottom: 12px; left: 16px;
  width: 343px; height: 55px;
  z-index: 20;
}

.rc-bottom-nav img { width: 100%; height: 100%; display: block; }

.rc-nav-hitbox {
  position: absolute;
  top: 0;
  width: 25%; height: 100%;
  border: 0; background: transparent; cursor: pointer;
}

@media (max-width: 420px) {
  .rc-preview { min-height: 812px; padding: 0; background: #eef2f8; }
  .rc-screen { width: 100vw; max-width: 375px; box-shadow: none; }
}
</style>
