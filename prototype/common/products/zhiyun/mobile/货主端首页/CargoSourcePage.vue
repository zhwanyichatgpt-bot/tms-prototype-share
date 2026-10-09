<template>
  <section class="cargo-page" aria-label="我的货源">
    <div class="cargo-scroll">
      <header class="cargo-header">
        <div class="cargo-status-bar">
          <span>9:41</span>
          <span class="status-icons" aria-hidden="true">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="#0c0c0c"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#0c0c0c"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#0c0c0c"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#0c0c0c"/></svg>
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><path d="M8.5 2.4c2.5 0 4.8 1 6.5 2.6l1.7-1.7C14.5 1.2 11.6 0 8.5 0S2.5 1.2.3 3.3L2 5c1.7-1.6 4-2.6 6.5-2.6z" fill="#0c0c0c"/><path d="M8.5 6.4c1.4 0 2.7.6 3.7 1.5l1.7-1.7c-1.4-1.4-3.3-2.2-5.4-2.2S4.5 4.8 3.1 6.2l1.7 1.7c1-.9 2.3-1.5 3.7-1.5z" fill="#0c0c0c"/><path d="M10.6 9.6c-.6-.5-1.3-.8-2.1-.8s-1.5.3-2.1.8L8.5 12l2.1-2.4z" fill="#0c0c0c"/></svg>
            <i class="battery"></i>
          </span>
        </div>

        <div class="cargo-title-row">
          <h1>我的货源 · 智能匹配运力</h1>
          <span class="title-accent" aria-hidden="true"></span>
        </div>

        <label class="cargo-search">
          <span aria-hidden="true"></span>
          <input v-model="searchText" type="search" placeholder="搜索货品、装货地或卸货地" />
        </label>
      </header>

      <div class="filter-row" aria-label="货源筛选">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          :class="{ active: activeFilter === filter.key }"
          @click="onFilterClick(filter.key)"
        >
          {{ filterLabel(filter) }} <i></i>
        </button>
      </div>

      <div class="cargo-list annot-zhiyunShipperHome-rule-cargo-plan-list">
        <article
          v-for="item in filteredCargoes"
          :key="item.id"
          class="cargo-card"
          role="button"
          tabindex="0"
          @click="$emit('open-cargo', item)"
          @keydown.enter="$emit('open-cargo', item)"
        >
          <span class="corner-fold" aria-hidden="true">▦</span>

          <div class="cargo-summary">
            <strong>{{ item.cargo }} <b>{{ item.weight }}</b></strong>
            <span>{{ loadDate(item) }}装货 → {{ unloadDate(item) }}卸货</span>
          </div>

          <div class="route-lines">
            <p><i class="route-dot load-dot"></i>{{ item.loadCity }}·{{ item.loadDetail }}</p>
            <p><i class="route-dot unload-dot"></i>{{ item.unloadCity }}·{{ item.unloadDetail }}</p>
          </div>

          <div class="cargo-detail-row">
            <div class="cargo-tags">
              <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
            </div>
            <div class="cargo-price">
              <small>运输总价</small>
              <strong>{{ item.price }}</strong><b>元</b>
            </div>
          </div>

          <div class="cargo-card-footer">
            <div class="cargo-state" :class="`state-${item.stateType}`">
              <span class="state-dot"></span>
              <strong>{{ item.state }}</strong>
              <template v-if="item.progress">
                <em>{{ item.progress.done }}/{{ item.progress.total }}吨</em>
                <span class="progress-track"><i :style="{ width: `${item.progress.percent}%` }"></i></span>
              </template>
              <em v-else>{{ item.stateDate }}</em>
            </div>
            <button
              v-if="item.action"
              type="button"
              class="cargo-action"
              @click.stop="handleAction(item)"
            >
              {{ item.action }}
            </button>
          </div>
        </article>

        <p v-if="!filteredCargoes.length" class="cargo-empty">没有符合条件的货源</p>
      </div>
    </div>

    <button type="button" class="floating-publish" @click="$emit('publish')">
      <span>＋</span>发布货源
    </button>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { cargoList } from './mock-data.js'

const emit = defineEmits(['publish', 'open-cargo', 'resume-publish'])

const searchText = ref('')

/* 排序与状态筛选：状态口径与详情页提示、底部操作保持一致 */
const filters = [
  { key: 'all', label: '全部' },
  { key: 'time', label: '时间排序' },
  { key: 'state', label: '上架状态' },
]
const activeFilter = ref('all')
/* 「上架状态」逐次点按循环：全部 → 仅上架中 → 仅已结束，循环回到全部 */
const stateScopes = ['', 'on', 'off']
const stateScopeIndex = ref(0)

const onFilterClick = (key) => {
  if (key === 'state' && activeFilter.value === 'state') {
    stateScopeIndex.value = (stateScopeIndex.value + 1) % stateScopes.length
    return
  }
  activeFilter.value = key
  if (key === 'state') stateScopeIndex.value = 0
}

const stateScope = computed(() => (activeFilter.value === 'state' ? stateScopes[stateScopeIndex.value] : ''))

/* 「上架状态」按钮直接显示当前生效的范围，避免只有箭头看不出筛了什么 */
const filterLabel = (filter) => {
  if (filter.key !== 'state') return filter.label
  if (activeFilter.value !== 'state') return filter.label
  return { on: '上架中', off: '已结束' }[stateScopes[stateScopeIndex.value]] || filter.label
}

const filteredCargoes = computed(() => {
  let list = [...cargoList]

  if (stateScope.value === 'on') list = list.filter((item) => item.stateType === 'pending' || item.stateType === 'matched')
  else if (stateScope.value === 'off') list = list.filter((item) => item.stateType === 'completed' || item.stateType === 'cancelled')

  if (activeFilter.value === 'time') {
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }

  const keyword = searchText.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter((item) => (
      [item.cargo, item.cargoCategory, item.loadCity, item.loadDetail, item.unloadCity, item.unloadDetail]
        .some((value) => String(value).toLowerCase().includes(keyword))
    ))
  }
  return list
})

/* 列表只展示装卸日期，时间与详情页保持一致 */
const loadDate = (item) => item.loadDate.split(' ')[0] || ''
const unloadDate = (item) => item.unloadDate.split(' ')[0] || ''

const handleAction = (item) => {
  if (item.action === '继续发布') {
    emit('resume-publish', item)
    return
  }
  if (item.action === '取消货源') {
    item.state = '已取消'
    item.stateType = 'cancelled'
    item.stateDate = '2026年3月24日 取消'
    item.action = '重新发布'
    return
  }
  item.state = '待接单'
  item.stateType = 'pending'
  item.stateDate = '2026年4月15日 发布'
  item.listedAt = '2026-04-15 08:00:00'
  item.action = '取消货源'
}
</script>

<style scoped>
.cargo-page {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: hidden;
  background: #f2f4f8;
  color: #30333b;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  -webkit-font-smoothing: antialiased;
}
.cargo-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 176px;
  box-sizing: border-box;
  scrollbar-width: none;
}
.cargo-scroll::-webkit-scrollbar { display: none; }

.cargo-header {
  height: 134px;
  padding: 0 16px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f1f4f9, #f2f4f8);
}
.cargo-status-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 700;
  color: #0d1118;
}
.status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
}
.battery {
  width: 21px;
  height: 10px;
  border: 1px solid #111;
  border-radius: 2px;
  box-shadow: inset 0 0 0 2px #f2f4f8;
  background: #111;
}

.cargo-title-row {
  position: relative;
  height: 42px;
  display: flex;
  align-items: flex-start;
}
.cargo-title-row h1 {
  margin: 4px 0 0;
  color: #17364f;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}
.title-accent {
  position: absolute;
  left: 150px;
  top: 26px;
  width: 10px;
  height: 3px;
  border-radius: 3px;
  background: #34dc6c;
  transform: rotate(-28deg);
}

.cargo-search {
  height: 32px;
  display: flex;
  align-items: center;
  border-radius: 18px;
  background: #fff;
}
.cargo-search > span {
  position: relative;
  width: 16px;
  height: 16px;
  margin-left: 14px;
  border: 2px solid #adb2ba;
  border-radius: 50%;
  box-sizing: border-box;
}
.cargo-search > span::after {
  content: '';
  position: absolute;
  right: -5px;
  bottom: -3px;
  width: 7px;
  height: 2px;
  background: #adb2ba;
  transform: rotate(45deg);
}
.cargo-search input {
  flex: 1;
  min-width: 0;
  margin-left: 8px;
  padding: 0 12px 0 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #333;
  font-size: 14px;
}
.cargo-search input::placeholder { color: #b1b4ba; }

.filter-row {
  height: 41px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.45);
}
.filter-row button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #30333b;
  font-size: 15px;
  font-weight: 600;
}
.filter-row button.active { color: #2f6df7; }
.filter-row i {
  display: inline-block;
  margin-left: 3px;
  border: 4px solid transparent;
  border-bottom: 0;
  border-top-color: currentColor;
  vertical-align: 3px;
}

.cargo-list {
  padding: 0 16px;
}
.cargo-card {
  position: relative;
  height: 170px;
  margin-top: 10px;
  padding: 14px 14px 0;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 11px;
  background: #fff;
  cursor: pointer;
}
.corner-fold {
  position: absolute;
  top: 0;
  right: 0;
  width: 35px;
  height: 35px;
  box-sizing: border-box;
  padding: 2px 2px 0 13px;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
  background: #b8cbec;
  color: #fff;
  font-size: 15px;
  text-align: center;
}
.cargo-summary {
  height: 24px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  white-space: nowrap;
}
.cargo-summary strong {
  font-size: 15px;
  font-weight: 700;
}
.cargo-summary strong b {
  color: #20ad82;
  font-size: 18px;
}
.cargo-summary > span {
  font-size: 13px;
  font-weight: 500;
}

.route-lines {
  position: relative;
  margin-top: 7px;
}
.route-lines::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 11px;
  width: 1px;
  height: 22px;
  background: #d8dde8;
}
.route-lines p {
  position: relative;
  margin: 0 0 4px;
  padding-left: 11px;
  color: #30333b;
  font-size: 14px;
  line-height: 19px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.route-dot {
  position: absolute;
  left: -1px;
  top: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.load-dot { background: #3d6dff; }
.unload-dot { background: #1fc38d; }

.cargo-detail-row {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cargo-tags {
  display: flex;
  gap: 5px;
  overflow: hidden;
}
.cargo-tags span {
  padding: 3px 8px;
  border-radius: 5px;
  background: #edf2fa;
  color: #6b7d9b;
  font-size: 10px;
  line-height: 13px;
  white-space: nowrap;
}
.cargo-price {
  text-align: right;
  color: #3d6dff;
  white-space: nowrap;
}
.cargo-price small {
  display: block;
  color: #a2a8b4;
  font-size: 9px;
  line-height: 10px;
}
.cargo-price strong {
  font-size: 19px;
  line-height: 20px;
}
.cargo-price b {
  margin-left: 2px;
  font-size: 11px;
}

.cargo-card-footer {
  height: 44px;
  border-top: 1px solid #eef0f4;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cargo-state {
  display: flex;
  align-items: center;
  min-width: 0;
  font-size: 11px;
  white-space: nowrap;
}
.state-dot {
  width: 4px;
  height: 4px;
  margin-right: 4px;
  border-radius: 50%;
  background: currentColor;
}
.cargo-state strong {
  font-size: 13px;
  font-weight: 500;
  text-decoration: underline;
}
.cargo-state em {
  margin-left: 8px;
  color: #9aa3b3;
  font-size: 11px;
  font-style: normal;
}
.state-pending,
.state-matched { color: #2f6df7; }
.state-draft { color: #c47d09; }
.state-completed,
.state-cancelled { color: #999; }
.progress-track {
  width: 85px;
  height: 7px;
  margin-left: 7px;
  overflow: hidden;
  border-radius: 4px;
  background: #e8e9ed;
}
.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3d6dff;
}
.cargo-action {
  min-width: 82px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #d9dce3;
  border-radius: 16px;
  background: #fff;
  color: #333;
  font-size: 13px;
  font-weight: 600;
}

.cargo-empty {
  margin: 60px 0 0;
  text-align: center;
  color: #9aa3b3;
  font-size: 13px;
}

.floating-publish {
  position: absolute;
  left: 50%;
  bottom: 111px;
  z-index: 12;
  height: 47px;
  padding: 0 22px 0 10px;
  border: 0;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translateX(-50%);
  background: linear-gradient(100deg, #4ea3ff, #315df8);
  box-shadow: 0 5px 14px rgba(49, 93, 248, 0.35);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.floating-publish span {
  width: 31px;
  height: 31px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #dff1ff;
  color: #3f97f6;
  font-size: 29px;
  line-height: 28px;
  font-weight: 400;
}
</style>
