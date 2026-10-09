<template>
  <section class="waybill-page" aria-label="运单">
    <div class="waybill-scroll">
      <header class="waybill-header">
        <img class="waybill-top-art" src="/zhiyun-mobile-assets/waybill/pixso/mini-capsule.svg" alt="" />

        <div class="waybill-title-row">
          <h1>运单</h1>
          <img class="title-mark" src="/zhiyun-mobile-assets/waybill/pixso/header-cat.svg" alt="" />
          <div class="mode-switch" aria-label="运单类型">
            <button
              v-for="item in modes"
              :key="item.key"
              type="button"
              :class="{ active: currentMode === item.key }"
              @click="currentMode = item.key"
            >
              {{ item.label }}
            </button>
          </div>
          <img class="header-cat" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="" />
        </div>

        <label class="waybill-search">
          <span aria-hidden="true"></span>
          <input v-model="searchText" type="search" :placeholder="currentMode === 'settlement' ? '请输入运单号' : '请输入运单号或货源号'" />
        </label>
      </header>

      <nav v-if="currentMode === 'settlement'" class="settle-tabs" aria-label="结算状态筛选">
        <button
          v-for="item in settleFilters"
          :key="item.key"
          type="button"
          :class="{ active: currentSettleStatus === item.key }"
          @click="currentSettleStatus = item.key"
        >
          {{ item.label }}
        </button>
      </nav>
      <nav v-else class="status-tabs" aria-label="运单状态筛选">
        <button
          v-for="item in statusFilters"
          :key="item.key"
          type="button"
          :class="{ active: currentStatus === item.key }"
          @click="currentStatus = item.key"
        >
          {{ item.label }}
        </button>
      </nav>

      <div v-if="currentMode === 'transport'" class="waybill-list annot-zhiyunShipperHome-rule-waybill-transport-finance">
        <article
          v-for="item in filteredWaybills"
          :key="item.id"
          class="waybill-card"
          role="button"
          tabindex="0"
          @click="emit('open-waybill', item)"
          @keydown.enter="emit('open-waybill', item)"
        >
          <div class="card-heading">
            <span class="waybill-state" :class="`state-${item.statusType}`">{{ item.status }}</span>
            <strong>{{ item.number }}</strong>
            <button type="button" class="copy-button" aria-label="复制运单号" @click.stop="copyWaybill(item)">
              <i></i><i></i>
            </button>
            <b class="waybill-price">¥{{ item.freight }}</b>
          </div>

          <div class="card-content">
            <h2>{{ item.cargo }} <small>{{ item.tons }} 吨</small></h2>
            <p>{{ item.loadCity }}<i></i>{{ item.unloadCity }}</p>
            <div class="arrival-time">
              <span>{{ wbTimeLabel(item) }}</span>
              <strong>{{ wbTimeValue(item) }}</strong>
            </div>
          </div>

          <footer class="card-footer">
            <span class="owner-avatar" aria-hidden="true">
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-base.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-face.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-detail.svg" alt="" />
            </span>
            <span class="owner-role">司机</span>
            <strong>{{ item.driver }} · {{ item.plate }}</strong>
            <button v-if="item.settleType !== 'settled'" type="button" class="voucher-button" @click.stop="emit('open-waybill', item)">
              {{ item.statusType === 'done' ? '去结算' : '查看凭证' }}
            </button>
          </footer>
        </article>

        <div v-if="filteredWaybills.length === 0" class="empty-state">
          <span aria-hidden="true">⌕</span>
          <p>暂无符合条件的运单</p>
        </div>
      </div>

      <div v-else class="waybill-list annot-zhiyunShipperHome-rule-waybill-settlement-states">
        <article v-for="item in filteredSettlements" :key="item.id" class="settle-card">
          <div class="card-heading">
            <span class="waybill-state settle-state" :class="`sstate-${item.settleType}`">{{ settleLabel(item) }}</span>
            <strong>{{ item.number }}</strong>
            <button type="button" class="copy-button" aria-label="复制运单号" @click.stop="copyWaybill(item)">
              <i></i><i></i>
            </button>
            <b class="waybill-price">¥{{ money(settleAmount(item)) }}</b>
          </div>

          <p class="settle-route">{{ item.loadCity }}<i></i>{{ item.unloadCity }}</p>

          <div class="settle-content">
            <div class="settle-field">
              <h2>{{ item.cargo }}<small class="unit"> · {{ item.tons }}吨</small></h2>
              <p>货品 · 计费吨位</p>
            </div>
            <div class="settle-field">
              <h2 class="settle-platform">{{ item.platform }}</h2>
              <p>承接平台</p>
            </div>
            <div class="settle-time">
              <strong>{{ item.unloadTime || item.loadTime }}</strong>
              <span>卸货时间</span>
            </div>
          </div>

          <footer class="settle-footer">
            <span class="owner-avatar" aria-hidden="true">
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-base.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-face.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-detail.svg" alt="" />
            </span>
            <strong class="settle-owner">{{ item.vehicleType }} · {{ item.driver }}</strong>
            <span class="settle-actions">
              <button v-if="item.settleType === 'pending' && !voucherReady(item)" type="button" class="settle-btn" @click.stop="emit('open-settle', item)">补凭证</button>
              <button v-else-if="item.settleType === 'pending'" type="button" class="settle-btn primary" @click.stop="emit('open-settle', item)">去结算</button>
              <button v-else-if="item.settleType === 'unpaid'" type="button" class="settle-btn primary" @click.stop="emit('open-settle', item)">付款</button>
              <button v-else type="button" class="settle-btn" @click.stop="emit('open-settle', item)">查看</button>
            </span>
          </footer>
        </article>

        <div v-if="filteredSettlements.length === 0" class="empty-state">
          <span aria-hidden="true">¥</span>
          <p>暂无符合条件的运单</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { money, waybillList } from './mock-data.js'

const props = defineProps({
  initialMode: { type: String, default: 'transport' },
  initialStatus: { type: String, default: 'all' },
  initialSettleStatus: { type: String, default: 'all' },
})

const modes = [
  { key: 'transport', label: '运输' },
  { key: 'settlement', label: '结算' },
]

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'loaded', label: '已装货' },
  { key: 'moving', label: '在途' },
  { key: 'done', label: '已送达' },
  { key: 'abnormal', label: '有异常' },
]

const currentMode = ref(props.initialMode)
const currentStatus = ref(props.initialStatus)
const currentSettleStatus = ref(props.initialSettleStatus)
const searchText = ref('')

const emit = defineEmits(['open-waybill', 'open-settle'])

const waybills = waybillList

// 结算模式下按结算状态分页签：待结算 → 待付款 → 已结算（运单级，逐单结算）
const settleFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待结算' },
  { key: 'unpaid', label: '待付款' },
  { key: 'settled', label: '已结算' },
]

const SETTLE_LABELS = { pending: '待结算', unpaid: '待付款', settled: '已结算' }

// 装卸货凭证齐全才能结算；齐了走「去结算」，不齐走「补凭证」
const voucherReady = (item) => Boolean(item.vouchers?.load && item.vouchers?.unload)

// 应付金额 = 运费 + 金额调整。调整是货主核对时的核增核减，不是平台抽佣。
const settleAmount = (item) => Number(String(item.freight).replace(/[,\s]/g, '')) + (item.adjustAmount || 0)

const settleLabel = (item) => SETTLE_LABELS[item.settleType] || '待结算'

/* 运单卡右下角时间：在途看预计到达，已送达看卸货时间 */
const wbTimeLabel = (item) => {
  if (item.statusType === 'done') return '卸货时间'
  if (item.statusType === 'moving') return '预计到达'
  return '装货时间'
}
const wbTimeValue = (item) => {
  if (item.statusType === 'done') return item.unloadTime || '--'
  if (item.statusType === 'moving') return item.arriveText?.replace('预计 ', '').replace(' 到达', '') || '运输中'
  return item.loadTime || '--'
}

const copyWaybill = (item) => {
  try {
    window.navigator?.clipboard?.writeText(item.number)
  } catch { /* 剪贴板不可用时仍给出提示 */ }
  if (typeof window !== 'undefined' && window.sharedStorage?.toast) {
    window.sharedStorage.toast('运单号已复制')
  }
}

const filteredWaybills = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return waybills.filter((item) => {
    const matchesStatus = currentStatus.value === 'all'
      || (currentStatus.value === 'abnormal' ? Boolean(item.exception) : item.statusType === currentStatus.value)
    const matchesKeyword = !keyword || [item.number, item.cargo, item.loadPort, item.unloadPort]
      .some((value) => value.toLowerCase().includes(keyword))
    return matchesStatus && matchesKeyword
  })
})

/* 结算列表只收作业已完成、可进入结算的运单：已装货/在途还没卸货，谈不上结算 */
const filteredSettlements = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return waybills
    .filter((item) => item.statusType === 'done')
    .filter((item) => currentSettleStatus.value === 'all' || item.settleType === currentSettleStatus.value)
    .filter((item) => {
      if (!keyword) return true
      return [item.number, item.cargo, item.loadCity, item.unloadCity, item.platform, item.driver]
        .some((value) => String(value).toLowerCase().includes(keyword))
    })
})
</script>

<style scoped>
.waybill-page {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: hidden;
  background: #f0f2f6;
  color: #262a32;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.waybill-page::before {
  content: '';
  position: absolute;
  z-index: 0;
  left: 0;
  right: 0;
  top: 0;
  height: 180px;
  background: linear-gradient(180deg, rgba(218,229,255,.96) 0%, rgba(232,238,250,.92) 67%, rgba(240,242,246,0) 100%);
  pointer-events: none;
}
.waybill-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  /* 底部留给 Tab 栏（约 130px）并再垫一段，避免最后一张卡的按钮压在导航上 */
  padding-bottom: 168px;
  box-sizing: border-box;
  scrollbar-width: none;
}
.waybill-scroll::-webkit-scrollbar { display: none; }

.waybill-header {
  position: relative;
  height: 114.5px;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: visible;
  background: transparent url('/zhiyun-mobile-assets/waybill/header-decor.png') center top / 600px 133.5px no-repeat;
}
.waybill-top-art {
  position: absolute;
  z-index: 4;
  left: 0;
  top: 0;
  width: 375px;
  height: 72px;
  pointer-events: none;
}

.waybill-title-row {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 3;
  height: 78px;
}
.waybill-title-row h1 {
  position: absolute;
  left: 16px;
  top: 51.83px;
  width: 34.33px;
  height: 16.29px;
  margin: 0;
  overflow: hidden;
  color: transparent;
  font-size: 0;
  background: url('/zhiyun-mobile-assets/waybill/title.svg') center / 100% 100% no-repeat;
}
.title-mark {
  position: absolute;
  left: 57.53px;
  top: 55.91px;
  width: 11.56px;
  height: 9.99px;
  pointer-events: none;
}
.mode-switch {
  position: absolute;
  left: 77.5px;
  top: 46px;
  width: 87px;
  height: 24px;
  padding: 2px;
  display: flex;
  box-sizing: border-box;
  border-radius: 12px;
  background: rgba(217,221,232,.7);
  box-shadow: 0 1px 7px rgba(0,0,0,.08);
}
.mode-switch button {
  flex: 1;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #626b78;
  font-size: 12px;
  font-weight: 400;
}
.mode-switch button.active {
  background: #fff;
  color: #2f61f6;
  font-weight: 600;
  box-shadow: 0 2px 7px rgba(65,87,130,.15);
}
.header-cat {
  position: absolute;
  left: 182.5px;
  top: 22px;
  width: 70.5px;
  height: 70.5px;
  object-fit: cover;
  content: url('/zhiyun-mobile-assets/waybill/header-cat.png');
  pointer-events: none;
  opacity: .96;
}
.waybill-search {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 78.5px;
  z-index: 4;
  height: 32px;
  display: flex;
  align-items: center;
  border-radius: 16px;
  background: rgba(255,255,255,.9);
  box-shadow: 0 2px 9px rgba(74,95,126,.08);
}
.waybill-search > span {
  width: 19px;
  height: 19px;
  margin-left: 14px;
  background: url('/zhiyun-mobile-assets/waybill/search.svg') center / 100% 100% no-repeat;
}
.waybill-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin-left: 3px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #252931;
  font-size: 13px;
}
.waybill-search input::placeholder { color: #a3a8b1; }

.status-tabs {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: flex-start;
  background: transparent;
  box-shadow: none;
}
.status-tabs button {
  position: relative;
  flex: 0 0 52px;
  height: 20px;
  margin-top: 8px;
  border: 0;
  border-radius: 5px;
  background: rgba(255,255,255,.92);
  color: #666;
  font-size: 10px;
  font-weight: 600;
}
.status-tabs button.active { color: #3a65ff; font-weight: 600; }
.status-tabs button + button { margin-left: 8px; }

.waybill-list { position: relative; z-index: 1; padding: 0 16px 4px; }
.waybill-card {
  position: relative;
  height: 133px;
  margin-bottom: 7.5px;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 15px;
  background: #fff;
  box-shadow: none;
}
.waybill-card:nth-child(2) { margin-bottom: 12.5px; }
.waybill-card:nth-child(3) { margin-bottom: 10px; }
.card-heading { position: absolute; left: 14px; right: 14px; top: 14px; height: 18.5px; display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.waybill-state { color: #3a65ff; font-size: 13px; line-height: 17px; font-weight: 600; }
.waybill-state.state-cancelled { color: #9399a3; }
.waybill-state.state-arrived { color: #28aa83; }
.card-heading > strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: #8a91a1; font-size: 13px; line-height: 18px; font-weight: 400; }
.copy-button { width: 14px; height: 14px; flex: 0 0 14px; padding: 0; border: 0; background: url('/zhiyun-mobile-assets/waybill/pixso/copy.svg') center / 14px 14px no-repeat; }
.copy-button i { display: none; }
.waybill-price { margin-left: auto; color: #567bff; font-size: 14px; line-height: 18.5px; font-weight: 700; }

.card-content { position: absolute; left: 14px; right: 14px; top: 40.5px; height: 42px; }
.card-content h2 { margin: 0; max-width: 205px; color: #333; font-size: 16px; line-height: 24px; font-weight: 400; }
.card-content h2 small { color: #333; font-size: 18px; font-weight: 700; }
.card-content p { max-width: 235px; margin: 0; overflow: hidden; text-overflow: ellipsis; color: #8a91a1; font-size: 12px; line-height: 18px; white-space: nowrap; }
.card-content p i { display: inline-block; width: 4px; height: 1px; margin: 0 6px; background: #8a91a1; vertical-align: 4px; }
.arrival-time { position: absolute; right: 0; top: 1px; width: 86px; text-align: right; }
.arrival-time span { display: block; color: #8a91a1; font-size: 12px; line-height: 17px; }
.arrival-time strong { display: block; margin-top: 3px; color: #8a91a1; font-size: 12px; line-height: 17px; font-weight: 400; }

.card-footer { position: absolute; left: 14px; right: 14px; top: 90.5px; height: 28px; display: flex; align-items: center; border-top: 0; }
.owner-avatar { position: relative; width: 17.35px; height: 16.5px; display: inline-block; flex: 0 0 17.35px; }
.owner-avatar img { position: absolute; left: 0; top: 0; width: 17.35px; height: 16.5px; }
.owner-avatar img + img { left: 1.5px; top: 1.5px; width: 15.85px; height: 15px; }
.owner-role { margin-left: 6px; color: #333; font-size: 13px; }
.card-footer > strong { margin-left: 4px; color: #333; font-size: 13px; font-weight: 400; }
.voucher-button { margin-left: auto; min-width: 82px; height: 28px; padding: 0 15px; border: 1px solid #d4d4d4; border-radius: 14px; background: #fff; color: #333; font-size: 13px; font-weight: 600; }

.empty-state { min-height: 185px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #abb0b8; }
.empty-state span { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #e3e8f0; color: #8f99a8; font-size: 24px; }
.empty-state p { margin: 10px 0 0; font-size: 13px; }
.settlement-empty { margin-top: 45px; }

/* ===== 结算 Tab（Pixso 运单（结算）6:2861，@750 → @375 半分） ===== */
.settle-tabs {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: flex-start;
}
.settle-tabs button {
  position: relative;
  flex: 0 0 52px;
  height: 21px;
  margin-top: 8px;
  border: 0;
  border-radius: 5px;
  background: rgba(255,255,255,.92);
  color: #666;
  font-size: 10px;
  font-weight: 600;
}
.settle-tabs button.active { color: #4063ff; font-weight: 600; }
.settle-tabs button + button { margin-left: 6px; }

/* 结算卡片：686×249 → 343×124.5。
   改用正常流布局：原来按固定坐标定位内容区，换成较长字段后相互压字，用 flex 让内容自己撑开。 */
.settle-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
  margin-bottom: 7.5px;
  box-sizing: border-box;
  border-radius: 15px;
  background: #fff;
}
.settle-card .card-heading { position: static; }
.settle-state { color: #4063ff; }
.settle-state.sstate-pending { color: #4063ff; }
.settle-state.sstate-unpaid { color: #f0a020; }
.settle-state.sstate-settled { color: #28aa83; }
.settle-card .waybill-price { color: #567bff; }

/* 结算卡片的路线行：货主认路线不认运单号 */
.settle-route {
  margin: 8px 0 0;
  color: #4a5364;
  font-size: 13px;
}
.settle-route i { display: inline-block; width: 4px; height: 1px; margin: 0 6px; background: #8a91a1; vertical-align: 4px; }
.settle-field h2 .unit { margin-left: 1px; font-size: 14px; font-weight: 400; }

/* 内容区：结算货量 | 承接平台 | 日期与运单数 */
.settle-content {
  display: flex;
  align-items: flex-end;
}
.settle-field { min-width: 0; }
.settle-field + .settle-field { margin-left: 32px; }
.settle-field h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  white-space: nowrap;
}
.settle-field h2 .unit { margin-left: 1px; font-size: 15px; font-weight: 700; }
.settle-field h2.settle-platform { font-size: 15px; }
.settle-field p { margin: 2px 0 0; color: #8a91a1; font-size: 12px; line-height: 17px; }
.settle-time { margin-left: auto; text-align: right; }
.settle-time strong { display: block; color: #8a91a1; font-size: 12px; line-height: 17px; font-weight: 400; }
.settle-time span { display: block; margin-top: 2px; color: #8a91a1; font-size: 12px; line-height: 17px; }

/* 底部：头像 + 关联货源号 + 动作按钮组 */
.settle-footer {
  display: flex;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f2f7;
}
.settle-owner { margin-left: 6px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333; font-size: 13px; font-weight: 400; }
.settle-actions { margin-left: auto; display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.settle-btn {
  min-width: 52px;
  height: 26px;
  padding: 0 12px;
  border: 1px solid #d4d4d4;
  border-radius: 13px;
  background: #fff;
  color: #333;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.settle-btn.primary {
  border: 0;
  background: linear-gradient(93deg, #6f8dff 0%, #4063ff 100%);
  color: #fff;
}
.settle-actions .settle-btn + .settle-btn { margin-left: 7px; }
</style>
