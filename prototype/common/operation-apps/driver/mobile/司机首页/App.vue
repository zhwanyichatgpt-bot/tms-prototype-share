<template>
  <div class="driver-preview">
    <div ref="screenRoot" class="driver-phone">
      <template v-if="currentPage === 'home'">
      <div class="driver-status" aria-hidden="true">
        <strong>9:41</strong>
        <span><i class="signal"></i><van-icon name="wifi-o" /><i class="battery"></i></span>
      </div>

      <main ref="homeScroll" class="driver-scroll" aria-label="至简司机首页">
        <section class="home-map" aria-label="附近货源地图" @click="currentPage = 'recommend'">
          <img class="home-map-art" src="/shipowner-map-original.png" alt="福州附近货源地图">
          <div class="home-map-fade" aria-hidden="true"></div>
          <div class="map-toolbar" @click.stop>
            <button class="location-chip" type="button" @click="notify('当前定位：榕城·江上图')">
              <svg class="location-pin" width="10" height="10" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M11 1.6C6.4 1.6 2.7 5.3 2.7 9.9C2.7 14.4 8.1 19.1 10.2 20.7C10.7 21.1 11.3 21.1 11.8 20.7C13.9 19.1 19.3 14.4 19.3 9.9C19.3 5.3 15.6 1.6 11 1.6Z" fill="#333"/><circle cx="11" cy="9.7" r="3" fill="#fff"/></svg>
              <span>榕城·江上图</span><van-icon name="arrow-down" />
            </button>
          </div>

          <h1 class="home-slogan">发货找车·就上至简智运</h1>

          <button
            v-for="point in mapPoints"
            :key="point.id"
            type="button"
            class="home-map-marker"
            :style="{ left: `${point.x}%`, top: `${point.y}%` }"
            :aria-label="`${point.count}条货源`"
            @click.stop="currentPage = 'recommend'"
          ><img src="/shipowner-map-pin.svg" alt=""></button>
        </section>

        <section
          class="cargo-section"
          :class="{ pulling: isPulling }"
          :style="{ transform: `translateY(${pullDistance}px)` }"
          :aria-label="activeSourceTab === 'nearby' ? '附近货源，下拉进入地图找货' : '关注货源'"
          @pointerdown="handlePullStart"
          @pointermove="handlePullMove"
          @pointerup="handlePullEnd"
          @pointercancel="handlePullEnd"
          @click.capture="guardPullClick"
        >
          <div class="cargo-tabs" role="tablist" aria-label="货源分类">
            <button v-for="tab in sourceTabs" :key="tab.key" type="button" role="tab" :aria-selected="activeSourceTab === tab.key" :class="{ active: activeSourceTab === tab.key }" @click="selectSourceTab(tab)">{{ tab.label }}</button>
            <button class="scan-tab" type="button" aria-label="扫码接单" @click="notify('扫码接单功能将在后续链路中验证')">
              <img src="/shipowner-scan-button.svg" alt="扫码接单">
            </button>
          </div>

          <!-- 关注货源与附近货源共用同一套货源卡片，只是数据源与状态位不同 -->
          <template v-if="activeSourceTab === 'nearby'">
            <div class="cargo-list">
              <button v-for="cargo in cargoSources" :key="cargo.id" type="button" class="cargo-card" @click="openCargoDetail(cargo)">
                <div class="cargo-title-row">
                  <strong>{{ cargo.recommendation }}</strong>
                  <span>{{ cargoTimeText(cargo, 'load') }}</span><i></i><span>{{ cargoTimeText(cargo, 'unload') }}</span>
                </div>
                <div class="route-row"><i class="route-dot load"></i><span>{{ cargo.loadAddress }}</span><small>{{ cargo.loadDistance }}</small></div>
                <div class="route-row"><i class="route-dot unload"></i><span>{{ cargo.unloadAddress }}</span><small>{{ cargo.unloadDistance }}</small></div>
                <div class="cargo-meta">
                  <div class="tag-list"><span v-for="tag in cargo.tags" :key="tag">{{ tag }}</span></div>
                  <div class="price"><small>运输单价</small><strong>{{ cargo.pricePerTon }}<em>元/吨</em></strong></div>
                </div>
                <div class="provider-row">
                  <span class="provider"><img src="/driver-mobile-assets/cargo-owner-logo.png" alt="货主标识"><span>{{ cargo.publisher }}</span></span>
                  <small>{{ relativePublishLabel(cargo) }}</small>
                </div>
              </button>
              <div v-if="cargoSources.length === 0" class="cargo-empty"><van-icon name="orders-o" /><p>附近暂无货源</p><small>下拉地图可查看其他区域货源</small></div>
            </div>
          </template>

          <template v-else-if="activeSourceTab === 'following'">
            <!-- 筛选行：装货时间 / 距离 两个维度 + 已失效开关。
                 已失效是布尔维度，不作为装货时间的一个选项
                 （失效原因里只有「已过装货时间」与时间相关，其余是货主侧动作） -->
            <div class="follow-filter-wrap">
              <div class="follow-filter" aria-label="关注货源筛选">
                <button
                  v-for="dim in filterDims"
                  :key="dim.key"
                  type="button"
                  class="filter-item"
                  :class="{ active: filter[dim.key] !== 'all', disabled: dim.key === 'loadDay' && showExpired }"
                  :aria-expanded="openFilter === dim.key"
                  @click="toggleFilterPanel(dim.key)"
                >
                  {{ filterLabel(dim) }}<i class="filter-caret" aria-hidden="true"></i>
                </button>
                <button type="button" class="filter-item filter-expired" :class="{ active: showExpired }" @click="showExpired = !showExpired">已失效</button>
              </div>

              <!-- 筛选面板浮层：绝对定位在筛选行正下方、盖住货源列表，不占文档流，
                   否则展开时会把下方卡片整体下推。透明遮罩负责点击关闭 -->
              <div v-if="openFilter && activeFilterOptions.length" class="filter-overlay" @click="openFilter = ''"></div>
              <div v-if="openFilter && activeFilterOptions.length" class="filter-panel">
                <h4 class="filter-panel-title">{{ activeFilterDim?.label }}</h4>
                <div class="filter-panel-grid">
                  <button
                    v-for="option in activeFilterOptions"
                    :key="option.value"
                    type="button"
                    class="filter-chip"
                    :class="{ active: filter[openFilter] === option.value }"
                    @click="chooseFilterOption(option.value)"
                  >{{ option.label }}</button>
                </div>
                <div class="filter-panel-actions">
                  <button type="button" class="filter-clear" @click="chooseFilterOption('all')">清空筛选</button>
                  <button type="button" class="filter-confirm" @click="openFilter = ''">查看结果</button>
                </div>
              </div>
            </div>

            <div v-if="!showExpired" class="cargo-list">
              <!-- 卡片内含操作按钮，容器不能用 button：HTML 不允许 button 嵌套 button -->
              <div v-for="item in visibleActiveItems" :key="item.cargo.id" class="cargo-card" @click="openCargoDetail(item.cargo)">
                <div class="cargo-title-row">
                  <strong>{{ item.cargo.recommendation }}</strong>
                  <span>{{ cargoTimeText(item.cargo, 'load') }}</span><i></i><span>{{ cargoTimeText(item.cargo, 'unload') }}</span>
                  <em v-if="item.changes.length" class="cargo-flag changed">信息有变化</em>
                  <em v-else-if="item.closingSoon" class="cargo-flag soon">即将截止</em>
                </div>
                <div class="route-row"><i class="route-dot load"></i><span>{{ item.cargo.loadAddress }}</span><small>{{ item.cargo.loadDistance }}</small></div>
                <div class="route-row"><i class="route-dot unload"></i><span>{{ item.cargo.unloadAddress }}</span><small>{{ item.cargo.unloadDistance }}</small></div>
                <div class="cargo-meta">
                  <div class="tag-list"><span v-for="tag in item.cargo.tags" :key="tag">{{ tag }}</span></div>
                  <div class="price">
                    <small>运输单价</small>
                    <strong><i v-if="item.priceTrend" class="price-trend" :class="item.priceTrend">{{ item.priceTrend === 'up' ? '↑' : '↓' }}</i>{{ item.cargo.pricePerTon }}<em>元/吨</em></strong>
                  </div>
                </div>
                <div class="provider-row">
                  <span class="provider"><img src="/driver-mobile-assets/cargo-owner-logo.png" alt="货主标识"><span>{{ item.cargo.publisher }}</span></span>
                  <small>{{ item.followLabel }}</small>
                </div>
                <div v-if="item.displayChanges.length" class="cargo-change">{{ cargoChangeLine(item.displayChanges) }}</div>
              </div>
              <div v-if="visibleActiveItems.length === 0" class="cargo-empty">
                <van-icon :name="hasActiveFollow ? 'search' : 'star-o'" />
                <p>{{ hasActiveFollow ? '没有符合条件的货源' : '暂无有效关注货源' }}</p>
                <small>{{ hasActiveFollow ? '换个筛选条件试试' : '在货源详情页点「关注」后，可在这里持续跟进' }}</small>
              </div>
            </div>

            <div v-else class="cargo-list">
              <div v-for="item in visibleExpiredItems" :key="item.cargo.id" class="cargo-card expired" @click="openCargoDetail(item.cargo)">
                <div class="cargo-title-row">
                  <strong>{{ item.cargo.recommendation }}</strong>
                  <span>{{ cargoTimeText(item.cargo, 'load') }}</span><i></i><span>{{ cargoTimeText(item.cargo, 'unload') }}</span>
                  <em class="cargo-flag invalid">{{ item.expire.title }}</em>
                </div>
                <div class="route-row"><i class="route-dot load"></i><span>{{ item.cargo.loadAddress }}</span><small>{{ item.cargo.loadDistance }}</small></div>
                <div class="route-row"><i class="route-dot unload"></i><span>{{ item.cargo.unloadAddress }}</span><small>{{ item.cargo.unloadDistance }}</small></div>
                <div class="cargo-meta">
                  <div class="tag-list"><span v-for="tag in item.cargo.tags" :key="tag">{{ tag }}</span></div>
                  <div class="price"><small>货物重量</small><strong>{{ item.cargo.needWeight }}<em>吨</em></strong></div>
                </div>
                <div class="provider-row">
                  <span class="provider"><img src="/driver-mobile-assets/cargo-owner-logo.png" alt="货主标识"><span>{{ item.cargo.publisher }}</span></span>
                  <small>{{ item.followLabel }}</small>
                </div>
                <p class="cargo-expire-detail">{{ item.expire.detail }}</p>
                <div v-if="item.changes.length" class="cargo-change">{{ cargoChangeLine(item.changes) }}</div>
              </div>
              <div v-if="visibleExpiredItems.length === 0" class="cargo-empty">
                <van-icon :name="followedExpiredItems.length ? 'search' : 'passed'" />
                <p>{{ followedExpiredItems.length ? '没有符合条件的货源' : '暂无已失效货源' }}</p>
                <small>{{ followedExpiredItems.length ? '换个筛选条件试试' : '关注过的货源失效后会保留在这里' }}</small>
              </div>
            </div>
          </template>

          <!-- 任务指派：调度派给本司机的运输任务。只展示待接收，
               接单即知晓确认并回写调度，随后离开本列表进入跑货装卸货链路 -->
          <template v-else>
            <AssignedTaskList
              :tasks="visibleTasks"
              :active-type="taskTypeTab"
              @open="openTaskDetail"
              @accept="openTaskAcceptOrder"
              @expired="notifyTaskExpired"
              @change-type="taskTypeTab = $event"
            />
          </template>
        </section>
      </main>

      <nav class="driver-bottom-nav" aria-label="司机端主导航">
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

      </template>

      <RecommendedCargoPage v-else-if="currentPage === 'recommend'" @back="returnHome" @navigate="navigateDriverPage" @open-cargo="openCargoDetail" />

      <DriverCargoDetail
        v-else-if="currentPage === 'cargoDetail'"
        :cargo="selectedCargoDetail"
        @back="returnFromCargoDetail"
        @accept="openAcceptOrder"
      />

      <DriverAcceptOrder
        v-else-if="currentPage === 'acceptOrder'"
        :cargo="selectedCargoDetail"
        @back="currentPage = 'cargoDetail'"
        @confirm="confirmAcceptOrder"
      />

      <AssignedTaskDetail
        v-else-if="currentPage === 'taskDetail'"
        :task="selectedTask"
        @back="returnFromTaskDetail"
        @accept="openTaskAcceptOrder"
      />

      <DriverTaskAcceptOrder
        v-else-if="currentPage === 'taskAcceptOrder'"
        :task="selectedTask"
        @back="currentPage = 'taskDetail'"
        @confirm="confirmAcceptTask"
      />

      <DriverFlowForm
        v-else-if="currentPage === 'loadForm'"
        mode="loading"
        :waybill="selectedWaybill"
        @back="returnToWorkPage"
        @confirm="confirmLoading"
      />

      <DriverFlowForm
        v-else-if="currentPage === 'unloadForm'"
        mode="unloading"
        :waybill="selectedWaybill"
        @back="returnToWorkPage"
        @confirm="confirmUnloading"
      />

      <DriverWaybillDetail
        v-else-if="currentPage === 'detail'"
        :waybill="selectedWaybill"
        @back="returnToWorkPage"
        @open-load-form="openLoadForm"
        @open-unload-form="openUnloadForm"
        @confirm-receipt="confirmReceiptAction"
        @finish-accounting="finishAccountingAction"
        @settle-waybill="settleWaybillAction"
      />

      <DriverWalletPage
        v-else-if="currentPage === 'wallet'"
        @back="returnToMinePage"
        @open-waybill="openWaybillDetail"
        @open-cash="currentPage = 'cash'"
        @open-cash-cards="openCashCards"
      />

      <DriverCashPage
        v-else-if="currentPage === 'cash'"
        :initial-view="cashInitialView"
        @back="returnToMinePage"
      />

      <DriverProfilePage
        v-else-if="currentPage === 'profile'"
        :focus-key="profileFocusKey"
        @back="returnToMinePage"
      />

      <DriverTodoPage
        v-else-if="currentPage === 'todo'"
        @back="returnToMinePage"
        @open-profile="openProfileFromTodo"
      />

      <DriverOrderSettingPage
        v-else-if="currentPage === 'orderSetting'"
        @back="returnToMinePage"
      />

      <DriverMinePage
        v-else-if="currentPage === 'mine'"
        @navigate="navigateDriverPage"
        @open-wallet="currentPage = 'wallet'"
        @open-profile="openProfile"
        @open-cash="openCashWithdraw"
        @open-todo="currentPage = 'todo'"
        @open-order-setting="currentPage = 'orderSetting'"
      />

      <DriverWorkPage
        v-else
        :page="currentPage"
        @navigate="navigateDriverPage"
        @open-waybill="openWaybillDetail"
      />

      <van-popup v-if="currentPage === 'home'" v-model:show="cargoOpen" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="driver-sheet cargo-sheet">
        <header><h2>货源详情</h2><button type="button" aria-label="关闭详情" @click="cargoOpen = false"><van-icon name="cross" /></button></header>
        <template v-if="selectedCargo">
          <h3>{{ selectedCargo.loadAddress }} → {{ selectedCargo.unloadAddress }}</h3>
          <p>{{ selectedCargo.loadAddress }}</p><p>{{ selectedCargo.unloadAddress }}</p>
          <div class="sheet-price">参考运费 <strong>{{ selectedCargo.estimateFreight }}</strong> 元</div>
          <van-button block type="primary" @click="openCargoDetail(selectedCargo); cargoOpen = false">查看并接单</van-button>
        </template>
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { showToast } from 'vant'
import { bottomTabs, mapPoints } from './mock-data.js'
import {
  activeCargos,
  cargoChangeLine,
  cargoSourceCatalog,
  cargoTimeText,
  distanceOptions,
  driverFlowStore,
  followedActive,
  followedExpired,
  loadDayOptions,
  matchesFollowFilter,
  acceptCargo,
  acceptTask,
  assignedTasks,
  assignedTasksByType,
  isTaskOpen,
  submitLoading,
  submitUnloading,
  confirmReceipt,
  finishAccounting,
  settleWaybill,
} from './driver-flow-store.js'
import RecommendedCargoPage from './RecommendedCargoPage.vue'
import DriverWorkPage from './DriverWorkPage.vue'
import DriverWaybillDetail from './DriverWaybillDetail.vue'
import DriverMinePage from './DriverMinePage.vue'
import DriverWalletPage from './DriverWalletPage.vue'
import DriverCashPage from './DriverCashPage.vue'
import DriverProfilePage from './DriverProfilePage.vue'
import DriverTodoPage from './DriverTodoPage.vue'
import DriverOrderSettingPage from './DriverOrderSettingPage.vue'
import DriverCargoDetail from './DriverCargoDetail.vue'
import DriverAcceptOrder from './DriverAcceptOrder.vue'
import DriverTaskAcceptOrder from './DriverTaskAcceptOrder.vue'
import AssignedTaskList from './AssignedTaskList.vue'
import AssignedTaskDetail from './AssignedTaskDetail.vue'
import DriverFlowForm from './DriverFlowForm.vue'
import './home.css'
import './zhiyun-shell.css'
import './driver-flow.css'

const screenRoot = ref(null)
const homeScroll = ref(null)
const currentPage = ref('home')
const sourceTabs = [
  { key: 'nearby', label: '附近货源' },
  { key: 'following', label: '关注货源' },
  { key: 'task', label: '任务指派' },
]
const activeSourceTab = ref('nearby')
// 关注货源的筛选与列表都由 followStore 派生，页面不各自维护列表。
// 取消关注与移除记录都在货源详情页完成，列表卡片只负责进入详情。
const followedActiveItems = computed(() => followedActive())
const followedExpiredItems = computed(() => followedExpired())

// 两个下拉维度按「与」组合；已失效是独立开关，不是装货时间的一个选项
const filter = reactive({ loadDay: 'all', distance: 'all' })
const showExpired = ref(false)
const openFilter = ref('')

const filterDims = computed(() => [
  { key: 'loadDay', label: '装货时间', options: loadDayOptions },
  { key: 'distance', label: '距离', options: distanceOptions },
])

const activeFilterOptions = computed(() => {
  const dim = filterDims.value.find((item) => item.key === openFilter.value)
  return dim ? dim.options : []
})
const activeFilterDim = computed(() => filterDims.value.find((item) => item.key === openFilter.value) || null)

// 选中非默认值时标签显示选中值，否则司机看不出自己筛了什么
function filterLabel(dim) {
  const current = filter[dim.key]
  if (current === 'all') return dim.label
  return dim.options.find((option) => option.value === current)?.label || dim.label
}

function toggleFilterPanel(key) {
  // 已失效开启时按时间筛选无意义，直接不响应
  if (key === 'loadDay' && showExpired.value) return
  openFilter.value = openFilter.value === key ? '' : key
}

function chooseFilterOption(value) {
  if (openFilter.value) filter[openFilter.value] = value
  openFilter.value = ''
}

const visibleActiveItems = computed(() => followedActiveItems.value.filter((item) => matchesFollowFilter(item.cargo, filter)))
// 已失效货源的装货时间都已过去，按时间筛选必然筛空，该维度不参与失效列表判定
const visibleExpiredItems = computed(() => followedExpiredItems.value.filter((item) => matchesFollowFilter(item.cargo, filter, { skipLoadDay: true })))
// 区分「关注列表本来就空」与「筛选后为空」，空状态文案不同
const hasActiveFollow = computed(() => followedActiveItems.value.length > 0)

const activeBottomTab = ref('home')
const cargoOpen = ref(false)
const selectedCargo = ref(null)
const selectedCargoDetail = ref(null)
const selectedTask = ref(null)
const selectedWaybill = ref(null)
const detailReturnPage = ref('order')
const cashInitialView = ref('withdraw')
const profileFocusKey = ref('')
const pullDistance = ref(0)
const isPulling = ref(false)
let pullPointerId = null
let pullStartY = 0
let pullCaptured = false
let blockNextClick = false
const pullThreshold = 72
// 手指点击时的自然抖动阈值：小于该位移视为点击，不进入下拉态
const pullDragSlop = 8

// 首页货源列表读可接机会池：过期货源出池，不再展示（关注货源页仍保留其失效记录）
const cargoSources = computed(() => activeCargos())

// 指派任务列表同样由 store 派生：接单后任务 status 变化即自动离开列表，
// 页面不缓存一份自己的任务数组。按类型页签分组，页签内待接单在前、已过期在后。
const taskTypeTab = ref('single')
const visibleTasks = computed(() => assignedTasksByType(taskTypeTab.value))

// 列表页相对时间由单一数据源 listedAt 派生，不再与详情页各写一份——
// 否则「X分钟前发布」（相对）与「上架时间 07:52:05」（绝对）两套文案会同义不同值。
function relativePublishLabel(cargo) {
  const raw = cargo.listedAt || ''
  if (!raw) return ''
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  if (!m) return ''
  const published = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  const minutes = Math.max(0, Math.round((Date.now() - published.getTime()) / 60000))
  if (minutes < 1) return '刚刚发布'
  if (minutes < 60) return `${minutes}分钟前发布`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前发布`
  return `${Math.floor(hours / 24)}天前发布`
}

function notify(message) { showToast(message) }
function openMapPage() {
  pullDistance.value = 0
  isPulling.value = false
  currentPage.value = 'recommend'
}
function returnHome() {
  pullDistance.value = 0
  isPulling.value = false
  currentPage.value = 'home'
  activeBottomTab.value = 'home'
}
function handlePullStart(event) {
  if (activeSourceTab.value !== 'nearby' || (homeScroll.value?.scrollTop || 0) > 1) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pullPointerId = event.pointerId
  pullStartY = event.clientY
  // 每次新手势都清掉上一次的拦截标记，否则未达阈值的拖动会永久吞掉后续点击
  blockNextClick = false
  pullCaptured = false
}
function handlePullMove(event) {
  if (event.pointerId !== pullPointerId) return
  const delta = event.clientY - pullStartY
  if (delta <= 0) {
    pullDistance.value = 0
    return
  }
  event.preventDefault()
  // 指针捕获必须等到确认进入拖拽后再做：捕获期间 pointerup 的目标会被改写，
  // 随后的 click 也会落到本容器上，页签与货源卡片的 @click 就再也收不到事件。
  // 点到即止的轻点（含手指微动）不捕获，click 才能正常到达被点的元素。
  if (!pullCaptured && delta > pullDragSlop) {
    pullCaptured = true
    try { event.currentTarget.setPointerCapture?.(event.pointerId) } catch { /* 捕获失败不中断手势 */ }
  }
  isPulling.value = delta > pullDragSlop
  pullDistance.value = Math.min(116, delta * 0.7)
}
function handlePullEnd(event) {
  if (event.pointerId !== pullPointerId) return
  if (pullCaptured) {
    try { event.currentTarget.releasePointerCapture?.(event.pointerId) } catch { /* 未捕获过则忽略 */ }
    pullCaptured = false
  }
  pullPointerId = null
  if (pullDistance.value >= pullThreshold) {
    // 只有下拉真正进入地图时才吞掉随后由 pointerup 产生的合成 click；
    // 点到即止的轻点（含手指微动）必须放行，否则货源卡片点不进详情
    blockNextClick = true
    openMapPage()
  } else {
    pullDistance.value = 0
    isPulling.value = false
    blockNextClick = false
  }
}
function guardPullClick(event) {
  if (!blockNextClick) return
  event.preventDefault()
  event.stopPropagation()
  blockNextClick = false
}
function selectSourceTab(tab) {
  activeSourceTab.value = tab.key
  // 三个 Tab 共用同一屏，只切换下方列表数据源；下拉进地图仅对附近货源生效
  if (tab.key === 'following') showExpired.value = false
}
function openCargo(cargo) { selectedCargo.value = cargo; cargoOpen.value = true }
function selectBottomTab(tab) {
  navigateDriverPage(tab.key)
}
function navigateDriverPage(page) {
  if (['home', 'run', 'order', 'mine'].includes(page)) {
    currentPage.value = page
    activeBottomTab.value = page
    return
  }
  const tab = bottomTabs.find((item) => item.key === page)
  notify(`${tab?.label || '该'}页面后续验证`)
}
function openWaybillDetail(waybill) {
  selectedWaybill.value = waybill
  detailReturnPage.value = ['run', 'wallet'].includes(currentPage.value) ? currentPage.value : 'order'
  currentPage.value = 'detail'
}
function returnToWorkPage() {
  currentPage.value = detailReturnPage.value
  activeBottomTab.value = detailReturnPage.value === 'wallet' ? 'mine' : detailReturnPage.value
}
function returnToMinePage() {
  currentPage.value = 'mine'
  activeBottomTab.value = 'mine'
}

// 银行卡管理直接进入「银行卡管理」视图；提现按钮进入「提现」视图，
// 两者共用 DriverCashPage，入口不同只会影响默认初始视图。
function openCashCards() {
  cashInitialView.value = 'cards'
  currentPage.value = 'cash'
}

function openCashWithdraw() {
  cashInitialView.value = 'withdraw'
  currentPage.value = 'cash'
}

// 资料页入口：从「我的」进入不带聚焦项，从待办进入时聚焦到对应证件
function openProfile() {
  profileFocusKey.value = ''
  currentPage.value = 'profile'
}

function openProfileFromTodo(focusKey) {
  profileFocusKey.value = focusKey || ''
  currentPage.value = 'profile'
}

// ============ 运输闭环：货源 → 接单 → 装货 → 运输 → 卸货 → 核算 → 打款 ============
function openCargoDetail(cargo) {
  selectedCargoDetail.value = cargo
  currentPage.value = 'cargoDetail'
}
function returnFromCargoDetail() {
  currentPage.value = 'home'
  activeBottomTab.value = 'home'
}
function openAcceptOrder(cargo) {
  selectedCargoDetail.value = cargo
  currentPage.value = 'acceptOrder'
}
function confirmAcceptOrder(payload) {
  const waybill = acceptCargo(selectedCargoDetail.value, payload)
  selectedWaybill.value = waybill
  detailReturnPage.value = 'order'
  activeBottomTab.value = 'order'
  // 接单后先进入运单详情，由详情页的「装货确认」按钮带进装货流程，
  // 而不是确认接单就直接跳到装货表单。
  currentPage.value = 'detail'
  notify(`接单成功，运单号 ${waybill.waybillNo}`)
}
// ============ 任务指派：调度派单 → 知晓确认 → 跑货装卸货 ============
function openTaskDetail(task) {
  selectedTask.value = task
  currentPage.value = 'taskDetail'
}
// 已过期任务不再提供接单入口：点到时明确告知原因，司机据此反馈调度重新指派。
// 直接静默移除会让司机到场后「连单子都没有了」，不知道自己漏了哪条。
function notifyTaskExpired(task) {
  notify(`${task.taskNo} 已过装货时间，无法接单，请联系调度重新指派`)
}
function returnFromTaskDetail() {
  currentPage.value = 'home'
  activeBottomTab.value = 'home'
  activeSourceTab.value = 'task'
}
function openTaskAcceptOrder(task) {
  selectedTask.value = task
  currentPage.value = 'taskAcceptOrder'
}
// 接单后直接进入运单详情，由详情页的「装货确认」带进装货流程，
// 与货源接单保持同一条链路，不额外造一套。
function confirmAcceptTask(payload) {
  const waybill = acceptTask(selectedTask.value, payload)
  selectedWaybill.value = waybill
  detailReturnPage.value = 'order'
  activeBottomTab.value = 'order'
  currentPage.value = 'detail'
  notify(`接单成功，运单号 ${waybill.waybillNo}`)
}

function openLoadForm(waybill) {
  selectedWaybill.value = waybill
  detailReturnPage.value = 'detail'
  currentPage.value = 'loadForm'
}
function openUnloadForm(waybill) {
  selectedWaybill.value = waybill
  detailReturnPage.value = 'detail'
  currentPage.value = 'unloadForm'
}
function confirmLoading(payload) {
  submitLoading(selectedWaybill.value.id, {
    loadTime: payload.eventTime,
    loadWeight: payload.weight,
    vouchers: payload.vouchers,
    remark: payload.remark,
  })
  notify('装货已确认，运单进入运输中')
  currentPage.value = 'detail'
  activeBottomTab.value = 'order'
  detailReturnPage.value = 'order'
}
function confirmUnloading(payload) {
  submitUnloading(selectedWaybill.value.id, {
    unloadTime: payload.eventTime,
    unloadWeight: payload.weight,
    vouchers: payload.vouchers,
    remark: payload.remark,
  })
  notify('卸货已确认，等待货主确认收货')
  currentPage.value = 'detail'
  activeBottomTab.value = 'order'
  detailReturnPage.value = 'order'
}
// 原型内提供货主确认收货与上游付款的触发入口，便于验证完整链路；
// 真实业务中这两步分别由货主侧与平台财务发起，司机端只读。
function confirmReceiptAction(waybill) {
  confirmReceipt(waybill.id)
  notify('货主已确认收货，运费核算中')
}
function finishAccountingAction(waybill) {
  finishAccounting(waybill.id)
  notify('运费已核算，等待上游付款')
}
function settleWaybillAction(waybill) {
  settleWaybill(waybill.id)
  notify('运费已入账，可查看钱包流水')
}
</script>
