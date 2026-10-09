<template>
  <main class="recommend-page" aria-label="地图找货">
    <img
      class="recommend-design recommend-design-base"
      src="/driver-mobile-assets/today-recommend-pixso.png"
      alt="至简智运地图找货设计稿"
    >

    <section class="map-filter-bar" aria-label="地图找货筛选">
      <div class="map-filter-row" role="group">
        <button
          v-for="filter in mapFilters"
          :key="filter.key"
          type="button"
          class="map-filter-chip"
          :class="{ active: activeFilterKeys.includes(filter.key) }"
          :aria-pressed="activeFilterKeys.includes(filter.key)"
          @click="toggleFilter(filter.key)"
        >{{ filter.label }}</button>
      </div>
      <p v-if="filterHint" class="map-filter-hint">{{ filterHint }}</p>
    </section>

    <section class="map-cargo-layer" aria-label="货源地图，点击货源查看详情">
      <button
        v-for="cargo in mapCargos"
        :key="cargo.id"
        type="button"
        class="cargo-click-target"
        :class="{ dimmed: !matchesFilter(cargo), selected: selectedCargoId === cargo.id }"
        :style="{ left: `${cargo.mapLeft}%`, top: `${cargo.mapTop}%` }"
        :aria-label="`${cargo.loadShort}到${cargo.unloadShort}，${cargo.cargoName}${cargo.pricePerTon}元每吨`"
        @click="selectCargo(cargo.id)"
      >
        <strong>{{ cargo.pricePerTon }}<small>元/吨</small></strong>
        <span>{{ cargo.cargoName }}</span>
      </button>
    </section>

    <button class="recommend-back" type="button" aria-label="返回司机首页" @click="$emit('back')"><van-icon name="arrow-left" /></button>
    <button class="design-hotspot location-hotspot" type="button" aria-label="当前定位：榕城·江上图" @click="notify('当前定位：榕城 · 江上图')"></button>

    <button v-if="selectedCargo" class="cargo-preview-card" type="button" :aria-label="`查看货源详情：${selectedCargo.loadShort}到${selectedCargo.unloadShort}`" @click="openSelectedCargo">
      <span class="cargo-preview-copy">
        <span class="cargo-preview-title"><span>{{ selectedCargo.cargoName }}</span><b>{{ selectedCargo.pricePerTon }}</b><small>元/吨</small></span>
        <span class="cargo-preview-meta">{{ selectedCargo.loadShort }} → {{ selectedCargo.unloadShort }}　|　{{ selectedCargo.needWeight }}吨　|　{{ cargoTimeText(selectedCargo, 'load') }}</span>
      </span>
    </button>

    <div class="recommend-bottom-mask" aria-hidden="true"></div>
    <nav class="driver-bottom-nav recommend-bottom-nav" aria-label="司机端主导航">
      <img class="driver-tab-bg-top" src="/zhiyun-mobile-assets/icons/tab-band-top.svg" alt="">
      <img class="driver-tab-bg-bottom" src="/zhiyun-mobile-assets/icons/tab-band-bottom.svg" alt="">
      <img class="driver-tab-glass" src="/zhiyun-mobile-assets/icons/tab-glass-band.svg" alt="">
      <button v-for="tab in bottomTabs" :key="tab.key" type="button" class="driver-tab-item" :class="[`driver-tab-${tab.key}`, { active: activeBottomTab === tab.key }]" :aria-current="activeBottomTab === tab.key ? 'page' : undefined" @click="selectBottomTab(tab)">
        <template v-if="tab.key === 'assistant'">
          <img class="driver-tab-ai-image" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="">
          <span>{{ tab.label }}</span>
        </template>
        <template v-else>
          <img class="driver-tab-icon" :src="tab.icon" alt="">
          <span>{{ tab.label }}</span>
        </template>
      </button>
    </nav>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { bottomTabs } from './mock-data.js'
import {
  activeCargos,
  cargoTimeText,
  frequentRouteStore,
  hasReturnTrip,
  inFrequentRoute,
} from './driver-flow-store.js'
import './recommended-cargo.css'

const emit = defineEmits(['back', 'navigate', 'open-cargo'])

const activeBottomTab = ref('home')
// 地图是「可接机会池」：过期货源与已失效货源出池，不再展示；
// 地图、悬浮卡与详情页同读 cargoSourceCatalog 中同一条记录，按 id 定位
const mapCargos = computed(() => activeCargos())
const selectedCargoId = ref(activeCargos()[4]?.id || activeCargos()[0]?.id)
const selectedCargo = computed(() => mapCargos.value.find(cargo => cargo.id === selectedCargoId.value) || null)

// 筛选项只读取货源自身已有字段：常跑路线取卸货城市、有回程取货主已标注的「有回城」标签，
// 不引入推断出的匹配度（见 D14、D16）。两个条件可叠加，用于回答
// 「我常跑的片区里哪趟能带回程货」；单独点一个即按该条件筛选。
const mapFilters = [
  { key: 'frequent', label: '常跑路线' },
  { key: 'return', label: '有回程' },
]
const activeFilterKeys = ref([])

function matchesFilter(cargo) {
  if (!activeFilterKeys.value.length || !cargo) return true
  return activeFilterKeys.value.every((key) => (
    key === 'frequent' ? inFrequentRoute(cargo) : hasReturnTrip(cargo)
  ))
}

const matchedCount = computed(() => mapCargos.value.filter((cargo) => matchesFilter(cargo)).length)

// 常跑路线现在有起点和终点，提示要给出完整线路，否则司机不知道按什么在筛
const frequentRouteLabel = computed(() => {
  const { origin, destinations } = frequentRouteStore
  if (!destinations.length) return ''
  return `${origin} → ${destinations.join(' / ')}`
})

// 未命中货源只变淡不隐藏，保留分布感：司机能看出「这段路上有没有我常跑的货」。
const filterHint = computed(() => {
  if (!activeFilterKeys.value.length || !mapCargos.value.length) return ''
  if (matchedCount.value === 0) return '没有符合条件的货源'
  const scope = activeFilterKeys.value.includes('frequent') ? `常跑路线：${frequentRouteLabel.value}` : '有回程'
  return `${scope} · 共 ${matchedCount.value} 条`
})

function toggleFilter(key) {
  // 未设置目的地时不进入「筛完什么都没有」的状态，直接引导到维护入口
  if (key === 'frequent' && frequentRouteStore.destinations.length === 0) {
    notify('尚未设置常跑路线，可在「我的 → 接单设置」设置')
    return
  }
  const index = activeFilterKeys.value.indexOf(key)
  if (index >= 0) activeFilterKeys.value.splice(index, 1)
  else activeFilterKeys.value.push(key)
  syncSelectionWithFilter()
}

// 筛选后当前选中货源若已不在结果里，顺延到第一条命中，避免悬浮卡与地图高亮脱节
function syncSelectionWithFilter() {
  const current = selectedCargo.value
  if (current && matchesFilter(current)) return
  const next = mapCargos.value.find((cargo) => matchesFilter(cargo))
  selectedCargoId.value = next ? next.id : null
}

function notify(message) { showToast(message) }
function selectBottomTab(tab) {
  if (tab.key === 'home') emit('back')
  else emit('navigate', tab.key)
}

function selectCargo(cargoId) { selectedCargoId.value = cargoId }

// 地图气泡与货源目录共用一条记录，气泡上展示的货种、单价就是详情页读到的数据
function openSelectedCargo() {
  if (selectedCargo.value) emit('open-cargo', selectedCargo.value)
}
</script>
