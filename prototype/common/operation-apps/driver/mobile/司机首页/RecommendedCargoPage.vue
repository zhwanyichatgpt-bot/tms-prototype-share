<template>
  <main class="recommend-page" aria-label="地图找货">
    <img
      class="recommend-design recommend-design-base"
      src="/driver-mobile-assets/today-recommend-pixso.png"
      alt="至简智运地图找货设计稿"
    >

    <section class="map-cargo-layer" aria-label="货源地图，点击货源查看详情">
      <button
        v-for="cargo in mapCargos"
        :key="cargo.id"
        type="button"
        class="cargo-click-target"
        :class="{ selected: selectedCargoId === cargo.id }"
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
import { activeCargos, cargoTimeText } from './driver-flow-store.js'
import './recommended-cargo.css'

const emit = defineEmits(['back', 'navigate', 'open-cargo'])

const activeBottomTab = ref('home')
// 地图是「可接机会池」：过期货源与已失效货源出池，不再展示；
// 地图、悬浮卡与详情页同读 cargoSourceCatalog 中同一条记录，按 id 定位
const mapCargos = computed(() => activeCargos())
const selectedCargoId = ref(activeCargos()[4]?.id || activeCargos()[0]?.id)
const selectedCargo = computed(() => mapCargos.value.find(cargo => cargo.id === selectedCargoId.value) || mapCargos.value[0])

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
