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

        <label class="waybill-search" :class="{ 'with-entry': currentMode === 'settlement' }">
          <span aria-hidden="true"></span>
          <input v-model="searchText" type="search" placeholder="请输入运单号" />
        </label>
        <button v-if="currentMode === 'settlement'" type="button" class="settle-entry">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1" width="11" height="12" rx="2" stroke="#333" stroke-width="1.3"/><path d="M4.2 4.5h5.6M4.2 7h5.6M4.2 9.5h3" stroke="#333" stroke-width="1.3" stroke-linecap="round"/></svg>
          结算单
        </button>
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
        <span class="settle-tools">
          <button type="button" class="filter-trigger">筛选<i></i></button>
          <em class="tool-divider"></em>
          <button type="button" class="batch-trigger"><i></i>批量</button>
        </span>
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
        <button type="button" class="filter-trigger">筛选<i></i></button>
      </nav>

      <div v-if="currentMode === 'transport'" class="waybill-list">
        <article v-for="item in filteredWaybills" :key="item.id" class="waybill-card">
          <div class="card-heading">
            <span class="waybill-state" :class="`state-${item.statusType}`">{{ item.status }}</span>
            <strong>{{ item.number }}</strong>
            <button type="button" class="copy-button" aria-label="复制运单号">
              <i></i><i></i>
            </button>
            <b class="waybill-price">{{ item.price }}</b>
          </div>

          <div class="card-content">
            <h2>{{ item.cargo }} <small>{{ item.weight }}</small></h2>
            <p>{{ item.loadPort }}<i></i>{{ item.unloadPort }}</p>
            <div class="arrival-time">
              <span>{{ item.timeLabel }}</span>
              <strong>{{ item.time }}</strong>
            </div>
          </div>

          <footer class="card-footer">
            <span class="owner-avatar" aria-hidden="true">
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-base.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-face.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-detail.svg" alt="" />
            </span>
            <span class="owner-role">船东</span>
            <strong>{{ item.owner }}</strong>
            <button v-if="item.action" type="button" class="voucher-button">{{ item.action }}</button>
          </footer>
        </article>

        <div v-if="filteredWaybills.length === 0" class="empty-state">
          <span aria-hidden="true">⌕</span>
          <p>暂无符合条件的运单</p>
        </div>
      </div>

      <div v-else class="waybill-list">
        <article v-for="item in filteredSettlements" :key="item.id" class="settle-card">
          <div class="card-heading">
            <span class="waybill-state settle-state" :class="`sstate-${item.statusType}`">{{ item.status }}</span>
            <strong>{{ item.number }}</strong>
            <button type="button" class="copy-button" aria-label="复制运单号">
              <i></i><i></i>
            </button>
            <b class="waybill-price">{{ item.price }}</b>
          </div>

          <div class="settle-content">
            <div class="settle-field">
              <h2>{{ item.machine }}</h2>
              <p>运输机型</p>
            </div>
            <div class="settle-field">
              <h2><small>{{ item.cargo }}</small> <em>{{ item.weightNum }}</em><small class="unit">{{ item.weightUnit }}</small></h2>
              <p>吊运重量</p>
            </div>
            <div class="settle-time">
              <span>{{ item.time }}</span>
              <strong>{{ item.date }}</strong>
            </div>
          </div>

          <footer class="settle-footer">
            <span class="owner-avatar" aria-hidden="true">
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-base.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-face.svg" alt="" />
              <img src="/zhiyun-mobile-assets/waybill/pixso/avatar-detail.svg" alt="" />
            </span>
            <strong class="settle-owner">{{ item.owner }}</strong>
            <span class="settle-actions">
              <template v-for="act in item.actions" :key="act">
                <button type="button" class="settle-btn" :class="{ primary: isPrimaryAction(item.statusType, act) }" @click="onSettleAction(act, item)">
                  {{ act }}
                </button>
              </template>
            </span>
          </footer>
        </article>

        <div v-if="filteredSettlements.length === 0" class="empty-state">
          <span aria-hidden="true">¥</span>
          <p>暂无符合条件的结算单</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const modes = [
  { key: 'transport', label: '运输' },
  { key: 'settlement', label: '结算' },
]

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'open', label: '已开航' },
  { key: 'arrived', label: '已到港' },
  { key: 'cancelled', label: '已取消' },
]

const currentMode = ref('transport')
const currentStatus = ref('all')
const currentSettleStatus = ref('all')
const searchText = ref('')

const waybills = [
  {
    id: 'w1', status: '已开航', statusType: 'open', number: 'C9715157747486741', price: '￥500.00',
    cargo: '玉米', weight: '10.23kg', loadPort: '福州市·马尾港', unloadPort: '无锡市·舟山港',
    timeLabel: '预计到港', time: '今天 12:00', owner: '测试船主', action: '补录凭证',
  },
  {
    id: 'w2', status: '已开航', statusType: 'open', number: 'C9715157747486741', price: '￥500.00',
    cargo: '玉米', weight: '10.23kg', loadPort: '福州市·马尾港', unloadPort: '无锡市·舟山港',
    timeLabel: '预计到港', time: '今天 12:00', owner: '测试船主', action: '补录凭证',
  },
  {
    id: 'w3', status: '已取消', statusType: 'cancelled', number: 'C9715157747486741', price: '￥500.00',
    cargo: '玉米', weight: '10.23kg', loadPort: '福州市·马尾港', unloadPort: '无锡市·舟山港',
    timeLabel: '取消时间', time: '前天 12:00', owner: '测试船主', action: '',
  },
  {
    id: 'w4', status: '已取消', statusType: 'cancelled', number: 'C9715157747486741', price: '￥500.00',
    cargo: '玉米', weight: '10.23kg', loadPort: '福州市·马尾港', unloadPort: '无锡市·舟山港',
    timeLabel: '取消时间', time: '07/01 12:00', owner: '测试船主', action: '',
  },
]

// 结算态：复核 → 核算 → 申请打款 → 打款，按钮随状态流转（Pixso 运单（结算）画板）
const settleFilters = [
  { key: 'all', label: '全部' },
  { key: 'reviewed', label: '已复核' },
  { key: 'checked', label: '已核算' },
  { key: 'applied', label: '已申请' },
  { key: 'paid', label: '已打款' },
  { key: 'cancelled', label: '已取消' },
]

const settlements = [
  {
    id: 's1', status: '已复核', statusType: 'reviewed', number: 'C9715157747486741', price: '￥500.00',
    machine: 'P200', cargo: '蜜柚', weightNum: '35', weightUnit: 'kg',
    time: '17:00', date: '2026/07/14', owner: '漳州市小飞侠无人机…',
    actions: ['作废', '核算'],
  },
  {
    id: 's2', status: '已核算', statusType: 'checked', number: 'C9715157747486741', price: '￥500.00',
    machine: 'P200', cargo: '蜜柚', weightNum: '35', weightUnit: 'kg',
    time: '17:00', date: '2026/07/14', owner: '漳州市小飞侠无人机…',
    actions: ['作废', '申请打款'],
  },
  {
    id: 's3', status: '已申请', statusType: 'applied', number: 'C9715157747486741', price: '￥500.00',
    machine: 'P200', cargo: '蜜柚', weightNum: '35', weightUnit: 'kg',
    time: '17:00', date: '2026/07/14', owner: '漳州市小飞侠无人机…',
    actions: ['作废', '打款'],
  },
  {
    id: 's4', status: '已打款', statusType: 'paid', number: 'C9715157747486741', price: '￥500.00',
    machine: 'P200', cargo: '蜜柚', weightNum: '35', weightUnit: 'kg',
    time: '17:00', date: '2026/07/14', owner: '漳州市小飞侠无人机…',
    actions: ['评价'],
  },
  {
    id: 's5', status: '已取消', statusType: 'cancelled', number: 'C9715157747486741', price: '￥500.00',
    machine: 'P200', cargo: '蜜柚', weightNum: '35', weightUnit: 'kg',
    time: '17:00', date: '2026/07/14', owner: '漳州市小飞侠无人机',
    actions: [],
  },
]

const isPrimaryAction = (statusType, act) => statusType !== 'paid' && act !== '作废'

const onSettleAction = (act, item) => {
  // 原型验证：动作仅作展示反馈
  if (typeof window !== 'undefined' && window.sharedStorage && window.sharedStorage.toast) {
    window.sharedStorage.toast(`${act}：${item.number}`)
  }
}

const filteredWaybills = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return waybills.filter((item) => {
    const matchesStatus = currentStatus.value === 'all' || item.statusType === currentStatus.value
    const matchesKeyword = !keyword || [item.number, item.cargo, item.loadPort, item.unloadPort]
      .some((value) => value.toLowerCase().includes(keyword))
    return matchesStatus && matchesKeyword
  })
})

const filteredSettlements = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return settlements.filter((item) => {
    const matchesStatus = currentSettleStatus.value === 'all' || item.statusType === currentSettleStatus.value
    const matchesKeyword = !keyword || [item.number, item.cargo, item.machine, item.owner]
      .some((value) => value.toLowerCase().includes(keyword))
    return matchesStatus && matchesKeyword
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
  padding-bottom: 100px;
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
.waybill-search.with-entry { right: 92px; }
.settle-entry {
  position: absolute;
  right: 16px;
  top: 78.5px;
  z-index: 4;
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 16px;
  background: rgba(255,255,255,.9);
  box-shadow: 0 2px 9px rgba(74,95,126,.08);
  color: #333;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

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
.status-tabs .filter-trigger { flex: 0 0 49px; margin-left: auto; background: transparent; color: #333; font-size: 12px; font-weight: 600; text-align: right; }
.filter-trigger i { display: inline-block; margin-left: 5px; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #777e88; vertical-align: 2px; }

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
  flex: 0 0 60px;
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
.settle-tabs button + button { margin-left: 8px; }
.settle-tools { margin-left: auto; display: flex; align-items: center; margin-top: 8px; }
.settle-tools .filter-trigger { flex: 0 0 auto; }
.tool-divider { width: 1px; height: 12px; margin: 0 8px; background: #d5d9e0; }
.batch-trigger { border: 0; background: transparent; color: #333; font-size: 12px; font-weight: 600; }
.batch-trigger i {
  display: inline-block;
  width: 12px; height: 12px;
  margin-right: 4px;
  vertical-align: -2px;
  background: url('/zhiyun-mobile-assets/waybill/pixso/copy.svg') center / 12px 12px no-repeat;
  opacity: .75;
}

/* 结算卡片：686×249 → 343×124.5 */
.settle-card {
  position: relative;
  min-height: 124.5px;
  margin-bottom: 7.5px;
  box-sizing: border-box;
  border-radius: 15px;
  background: #fff;
}
.settle-card .card-heading { position: absolute; left: 14px; right: 14px; top: 12px; }
.settle-state { color: #4063ff; }
.settle-state.sstate-cancelled { color: #999; }
.settle-state.sstate-paid { color: #333; }
.settle-card .waybill-price { color: #567bff; }

/* 内容区：P200（运输机型）| 蜜柚 35kg（吊运重量）| 右侧时间 */
.settle-content {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 40.5px;
  height: 52px;
  display: flex;
}
.settle-field { min-width: 0; }
.settle-field + .settle-field { margin-left: 40px; }
.settle-field h2 { margin: 0; color: #333; font-size: 17px; line-height: 24px; font-weight: 700; }
.settle-field h2 em { font-style: normal; font-size: 18px; font-weight: 700; }
.settle-field h2 small { font-size: 18px; font-weight: 700; }
.settle-field h2 .unit { margin-left: 1px; }
.settle-field p { margin: 1px 0 0; color: #8a91a1; font-size: 12px; line-height: 17px; }
.settle-time { margin-left: auto; text-align: right; }
.settle-time span { display: block; color: #8a91a1; font-size: 12px; line-height: 17px; }
.settle-time strong { display: block; margin-top: 4px; color: #8a91a1; font-size: 12px; line-height: 17px; font-weight: 400; }

/* 底部：头像 + 承运方 + 动作按钮组 */
.settle-footer {
  position: absolute;
  left: 14px;
  right: 14px;
  top: 90.5px;
  height: 28px;
  display: flex;
  align-items: center;
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
