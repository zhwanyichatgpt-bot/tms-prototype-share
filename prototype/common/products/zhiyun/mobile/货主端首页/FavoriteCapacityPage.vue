<template>
  <div class="capacity-page">
    <BusinessStatusBar />
    <header class="capacity-nav">
      <button type="button" class="nav-back" aria-label="返回" @click="emit('back')">
        <van-icon name="arrow-left" />
      </button>
      <h1>收藏运力</h1>
      <span class="nav-placeholder" aria-hidden="true"></span>
    </header>

    <div class="capacity-scroll">
      <section class="capacity-summary">
        <div class="summary-copy">
          <span class="summary-kicker">我的运力池</span>
          <p class="summary-count"><strong>{{ total }}</strong><small>条收藏</small></p>
          <p class="summary-detail">司机 {{ driverCount }} 位 · 车队 {{ fleetCount }} 支</p>
        </div>
        <span class="summary-icon" aria-hidden="true"><van-icon name="logistics" /></span>
      </section>

      <div class="capacity-toolbar">
        <label class="search-box">
          <van-icon name="search" />
          <input v-model.trim="keyword" type="search" placeholder="搜索司机、车队或线路" aria-label="搜索收藏运力" />
          <button v-if="keyword" type="button" class="search-clear" aria-label="清空搜索" @click="keyword = ''">
            <van-icon name="cross" />
          </button>
        </label>
        <div class="filter-row" role="tablist" aria-label="运力类型筛选">
          <button
            v-for="filter in filters"
            :key="filter.key"
            type="button"
            class="filter-chip"
            :class="{ active: activeFilter === filter.key }"
            role="tab"
            :aria-selected="activeFilter === filter.key"
            @click="activeFilter = filter.key"
          >
            {{ filter.label }}<em>{{ filter.count }}</em>
          </button>
        </div>
      </div>

      <template v-if="visibleItems.length">
        <div class="capacity-list">
          <article
            v-for="item in visibleItems"
            :key="item.uid"
            class="capacity-card"
            role="button"
            tabindex="0"
            @click="emit('open-detail', item)"
            @keydown.enter="emit('open-detail', item)"
          >
            <span class="capacity-avatar" :class="item.kind">
              <img v-if="item.kind === 'driver' && item.carrier.photo" :src="item.carrier.photo" :alt="item.carrier.name" />
              <van-icon v-else name="logistics" />
            </span>
            <div class="capacity-body">
              <div class="capacity-heading">
                <h2>{{ item.carrier.name }}</h2>
                <span class="kind-tag" :class="item.kind">{{ item.kind === 'driver' ? '司机' : '车队' }}</span>
              </div>
              <p class="capacity-meta">
                <van-icon name="logistics" />
                <span>{{ item.carrier.platform }} · {{ item.carrier.route }}</span>
              </p>
              <p class="capacity-meta">
                <van-icon :name="item.kind === 'driver' ? 'friends-o' : 'cluster-o'" />
                <span>{{ detailLine(item) }}</span>
              </p>
              <p class="capacity-time">{{ formatFavoriteTime(item.favoritedAt) }}</p>
            </div>
            <button type="button" class="fav-toggle" :aria-label="`取消收藏${item.carrier.name}`" @click.stop="removeItem(item)">
              <van-icon name="star" />
            </button>
          </article>
        </div>
        <p class="capacity-note">收藏仅保存在当前浏览器；取消收藏后，该运力会从列表移除。</p>
      </template>

      <van-empty v-else-if="keyword || activeFilter !== 'all'" image="search" description="没有找到匹配的运力">
        <button type="button" class="empty-action" @click="resetFilters">清空筛选</button>
      </van-empty>
      <van-empty v-else description="还没有收藏运力">
        <button type="button" class="empty-action" @click="emit('back')">返回我的</button>
      </van-empty>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'

import BusinessStatusBar from './BusinessStatusBar.vue'
import { favoriteCapacityItems, removeFavoriteCapacity, syncFavoriteCapacity } from './favorite-capacity-store.js'

const emit = defineEmits(['back', 'open-detail'])

const keyword = ref('')
const activeFilter = ref('all')

onMounted(syncFavoriteCapacity)

const total = computed(() => favoriteCapacityItems.value.length)
const driverCount = computed(() => favoriteCapacityItems.value.filter(item => item.kind === 'driver').length)
const fleetCount = computed(() => favoriteCapacityItems.value.filter(item => item.kind === 'fleet').length)

const filters = computed(() => [
  { key: 'all', label: '全部', count: total.value },
  { key: 'driver', label: '司机', count: driverCount.value },
  { key: 'fleet', label: '车队', count: fleetCount.value },
])

const visibleItems = computed(() => {
  const query = keyword.value.toLowerCase()
  return favoriteCapacityItems.value.filter(item => {
    if (activeFilter.value !== 'all' && item.kind !== activeFilter.value) return false
    if (!query) return true
    return [item.carrier.name, item.carrier.platform, item.carrier.route, item.carrier.goods]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))
  })
})

function detailLine(item) {
  if (item.kind === 'fleet') return `${item.carrier.fleet} · ${item.carrier.goods}`
  return `${item.carrier.vehicle} · ${item.carrier.goods}`
}

function formatFavoriteTime(value) {
  return value ? `收藏于 ${value.slice(5)}` : ''
}

function resetFilters() {
  keyword.value = ''
  activeFilter.value = 'all'
}

async function removeItem(item) {
  try {
    await showConfirmDialog({
      title: '取消收藏',
      message: `取消收藏「${item.carrier.name}」后，可在首页重新添加。`,
      confirmButtonText: '取消收藏',
      cancelButtonText: '再想想',
      confirmButtonColor: '#ef4444',
    })
    removeFavoriteCapacity(item.uid)
    if (!favoriteCapacityItems.value.length) activeFilter.value = 'all'
    showToast('已取消收藏')
  } catch {
    /* 用户选择再想想 */
  }
}
</script>

<style scoped>
.capacity-page {
  position: absolute;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  color: #18213a;
  background: linear-gradient(180deg, #edf4ff 0, #f4f7fc 230px);
}

.capacity-page :deep(.ios-bar) {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.capacity-nav {
  height: 44px;
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center;
}

.capacity-nav h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
}

.nav-back {
  width: 44px;
  height: 44px;
  margin-left: 6px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #18213a;
  font-size: 20px;
}

.nav-back:active {
  background: rgba(50, 101, 255, 0.08);
}

.capacity-scroll {
  position: absolute;
  inset: 88px 0 0;
  overflow-y: auto;
  padding: 4px 14px 30px;
  -webkit-overflow-scrolling: touch;
}

.capacity-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #3265ff, #5b86ff 58%, #7ba4ff);
  box-shadow: 0 12px 26px rgba(50, 101, 255, 0.2);
}

.summary-kicker {
  font-size: 13px;
  opacity: 0.86;
}

.summary-count {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 8px 0 4px;
}

.summary-count strong {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

.summary-count small {
  font-size: 14px;
  opacity: 0.9;
}

.summary-detail {
  margin: 0;
  font-size: 13px;
  opacity: 0.88;
}

.summary-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 28px;
}

.capacity-toolbar {
  margin-top: 14px;
}

.search-box {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fff;
  color: #8b95a9;
}

.search-box input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #18213a;
  font-size: 14px;
}

.search-box input::placeholder {
  color: #9ba8bd;
}

.search-clear {
  width: 36px;
  height: 36px;
  margin-right: -8px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8b95a9;
  font-size: 15px;
}

.filter-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-row::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  flex: none;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  border: 1px solid #e3e9f3;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  color: #66738e;
  font-size: 14px;
}

.filter-chip em {
  min-width: 18px;
  height: 18px;
  margin-left: 6px;
  display: inline-grid;
  place-items: center;
  padding: 0 5px;
  border-radius: 9px;
  background: #f0f3f8;
  color: #6d7b94;
  font-size: 11px;
  font-style: normal;
}

.filter-chip.active {
  border-color: #3265ff;
  background: #3265ff;
  color: #fff;
  box-shadow: 0 6px 14px rgba(50, 101, 255, 0.2);
}

.filter-chip.active em {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.capacity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.capacity-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #edf1f7;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(31, 58, 110, 0.035);
}

.capacity-card:active {
  background: #fbfcff;
}

.capacity-avatar {
  flex: none;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 15px;
  font-size: 22px;
}

.capacity-avatar.driver {
  background: #eef4ff;
}

.capacity-avatar.fleet {
  background: #eaf8f1;
  color: #11a776;
}

.capacity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.capacity-body {
  flex: 1;
  min-width: 0;
}

.capacity-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.capacity-heading h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #18213a;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kind-tag {
  flex: none;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 15px;
}

.kind-tag.driver {
  background: #eef4ff;
  color: #3265ff;
}

.kind-tag.fleet {
  background: #eaf8f1;
  color: #11a776;
}

.capacity-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 5px 0 0;
  color: #6d7b94;
  font-size: 12px;
  line-height: 18px;
}

.capacity-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capacity-time {
  margin: 8px 0 0;
  color: #9ba8bd;
  font-size: 11px;
  line-height: 15px;
}

.fav-toggle {
  flex: none;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-top: 2px;
  border: 0;
  border-radius: 14px;
  background: #fff8e8;
  color: #f2a51a;
  font-size: 21px;
}

.fav-toggle:active {
  transform: scale(0.95);
}

.capacity-note {
  margin: 14px 4px 0;
  color: #9ba8bd;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.empty-action {
  min-height: 40px;
  padding: 0 20px;
  border: 1px solid #d5deee;
  border-radius: 20px;
  background: #fff;
  color: #3265ff;
  font-size: 14px;
  font-weight: 500;
}

.capacity-scroll :deep(.van-empty) {
  padding: 42px 0 20px;
}

.capacity-scroll :deep(.van-empty__description) {
  margin-top: 10px;
  color: #6d7b94;
  font-size: 14px;
}
</style>
