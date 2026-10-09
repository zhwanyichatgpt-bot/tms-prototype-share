<template>
  <div class="ly-preview">
    <div ref="screenRoot" class="ly-screen" :class="{ 'ly-ai-screen': activeTab === 'ai' }">
      <div class="ly-status" aria-hidden="true"><span>9:41</span><span class="ly-status-icons"><i class="ly-signal"></i><van-icon name="wifi-o"/><i class="ly-battery"></i></span></div>
      <main v-show="activeTab === 'home'" ref="homeScroll" class="ly-scroll lh-home" aria-label="至简联运首页">
        <header class="lh-brand">
          <h1><img src="/lianyun-mobile-assets/brand-logo-v2.png" alt=""/>至简联运</h1>
          <button class="lh-notifications" aria-label="消息通知" @click="openNotifications"><van-icon name="bell"/><span>消息通知</span></button>
        </header>
        <div class="lh-banner-wrap"><button class="lh-banner" @click="openTopic"><img src="/lianyun-mobile-assets/home-banner-v1.png" width="2172" height="724" alt="至简联运，让每一程更简单。公水铁联运，一站找方案。" fetchpriority="high"/></button></div>
        <section class="lh-query" aria-label="运输助手">
          <div class="lh-query-heading"><h2>运输助手 <small>AI</small></h2><p>比较路线、费用与时效</p></div>
          <RouteQueryForm ref="homeQuery" v-model:mode="serviceMode" compact :teleport="screenRoot" @query="queryFromHome"/>
          <button class="lh-chat" @click="openAssistant()"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt=""/>查在途或问运输，和小简聊聊<van-icon name="arrow"/></button>
        </section>
        <nav class="lh-categories ly-platform-shortcuts" aria-label="配套服务分类"><button v-for="category in homeServiceCategories" :key="category.id" @click="openCatalog(category.id)"><span><van-icon :name="category.icon"/></span>{{ category.name }}</button></nav>
        <button v-if="businessReminder.hasRecords" class="lh-reminder" @click="openRequests()"><van-icon name="orders-o"/><strong>{{ businessReminder.title }}</strong><span>{{ businessReminder.detail }}</span><van-icon name="arrow"/></button>
        <CargoMarketplace ref="cargoMarket" :teleport="screenRoot" @overlay-change="cargoOverlay=$event"/>
        <section ref="serviceSection" class="lh-section lh-plans" aria-label="精选运输方案">
          <div class="lh-section-heading"><h2>精选运输方案</h2><button @click="openList('运输方案', services, '', featuredMode)">全部 ›</button></div>
          <nav class="lh-featured-tabs" role="tablist" aria-label="精选方案运输方式"><button v-for="item in featuredModes" :key="item.key" role="tab" :aria-selected="featuredMode===item.key" aria-controls="featured-service-panel" @click="featuredMode=item.key">{{ item.label }}</button></nav>
          <div id="featured-service-panel" role="tabpanel" :aria-label="featuredModes.find(item=>item.key===featuredMode)?.label+'运输方案'">
          <ServiceCard v-for="service in featuredServices" :key="service.id" compact :service="service" :provider="providerById(service.providerId)" :mode="modeInfo(service.mode)" @open="openService" @provider="openProvider" @reviews="openReviews"/>
          <div v-if="!featuredServices.length" class="ly-empty"><p>暂无符合当前条件的方案</p><button class="ly-text-button" @click="homeOrigin='全国'; featuredMode='all';browseRegion='全国'">查看推荐方案</button></div>
          </div>
        </section>
        <section class="lh-section" aria-label="物流企业精选">
          <div class="lh-section-heading"><h2>物流企业精选</h2><button @click="openProviders(providers)">查看全部 ›</button></div>
          <article v-for="provider in featuredProviders" :key="provider.id" class="lh-provider">
            <header>
              <button class="lh-provider-identity" @click="openProvider(provider)">
                <span class="lh-provider-logo" aria-hidden="true">{{ provider.name.slice(0,2) }}</span>
                <span class="lh-provider-heading"><strong :title="provider.name">{{ provider.name }}</strong><span class="lh-provider-location"><span v-if="provider.city">{{ provider.city }}</span><small v-if="provider.verified" class="lh-provider-verified"><van-icon name="passed"/>认证企业</small></span></span>
              </button>
              <ProviderRating :provider="provider" compact readable stars @open="openReviews"/>
            </header>
            <div class="lh-provider-body">
              <p v-if="provider.operatingStats" class="lh-provider-operations"><span>累计承运 <b>{{ provider.operatingStats.completedOrders }}</b> 单</span><span>承运 <b>{{ provider.operatingStats.volume }}</b></span></p>
              <div class="lh-provider-tags" aria-label="主营业务与服务能力"><span v-for="tag in [...new Set([...provider.specialty.split(' · '),...provider.capabilities])].slice(0,4)" :key="tag">{{ tag }}</span></div>
              <p class="lh-provider-area"><span>服务区域</span>{{ provider.area }}</p>
              <p class="lh-provider-description">{{ provider.description }}</p>
            </div>
            <footer><button v-for="service in providerServices(provider.id).slice(0,1)" :key="service.id" class="lh-representative" @click="openService(service)"><small>代表线路</small><strong>{{ service.from }} → {{ service.to }}</strong><van-icon name="arrow"/></button><button class="lh-provider-action" @click="openProvider(provider)">企业详情<van-icon name="arrow"/></button></footer>
          </article><div v-if="!featuredProviders.length" class="ly-empty"><p>当前地区暂无推荐企业</p><button class="ly-text-button" @click="openProviders(providers)">浏览全部企业</button></div>
        </section>
        <section class="lh-section lh-network-section" aria-label="平台服务网络"><PlatformNetwork :expanded="networkExpanded" :teleport="screenRoot" :initial-region="browseRegion" @expand="networkExpanded=!networkExpanded" @close="networkExpanded=false" @service="openService" @provider="openProvider" @offer="openOffer" @node="openNode"/></section>
      </main>

      <NetworkNodeDetail v-if="nodeDetail" v-show="!catalog && !openedService" :key="nodeDetail.id" :place="nodeDetail" @back="nodeDetail=null" @offer="openOffer" @service="openService" @provider="openProvider" @reviews="openReviews" @request="place=>startRequest('node',place)"/>
      <PlatformCatalog v-if="catalog" v-show="!openedService" :key="catalog.category+catalog.offer+catalog.guide" :initial-category="catalog.category" :initial-offer="catalog.offer" :initial-guide="catalog.guide" :initial-region="catalog.region||browseRegion" @back="catalog=null" @provider="openProvider" @request="offer=>startRequest('offer',offer)"/>
      <ServiceRequests v-if="requestsPage" :key="requestsPage.key" :target="requestsPage.target" @back="requestsPage=null" @browse="browseServices" @source="openRequestSource"/>

      <section v-if="serviceList" v-show="!openedService" class="ly-service-page" aria-label="全部运输方案">
        <header class="ly-service-nav"><button aria-label="返回首页" @click="serviceList=null"><van-icon name="arrow-left"/></button><h1>{{ serviceList.title }}</h1><span/></header>
        <main class="ly-service-content"><p v-if="serviceList.context" class="ly-sheet-hint">{{ serviceList.context }}</p><div class="ly-list-filters"><label>出发地<select v-model="listOrigin"><option v-for="region in browsingRegions" :key="region">{{ region }}</option></select></label><label>目的地<select v-model="listDestination"><option v-for="region in destinationRegions" :key="region">{{ region }}</option></select></label></div><div class="ly-filters"><button :class="{active:listMode==='all'}" @click="listMode='all'">全部</button><button v-for="mode in modes" :key="mode.key" :class="{active:listMode===mode.key}" @click="listMode=mode.key">{{ mode.short }}</button></div><ServiceCard v-for="service in filteredListServices" :key="service.id" :service="service" :provider="providerById(service.providerId)" :mode="modeInfo(service.mode)" @open="openService" @provider="openProvider" @reviews="openReviews"/><div v-if="!filteredListServices.length" class="ly-empty"><p>暂无符合条件的方案，请调整条件。</p><button class="ly-text-button" @click="listOrigin='全国';listDestination='全国';listMode='all'">重置筛选</button></div></main>
      </section>
      <ServiceDetailPage :favorite="isFavorite('services',openedService.id)" @favorite="item=>toggleSaved('services',item.id)" v-if="openedService" :key="openedService.id" :service="openedService" :provider="providerById(openedService.providerId)" :mode="modeInfo(openedService.mode)" @back="openedService=null" @provider="openProvider" @reviews="openReviews" @inquiry="openInquiry"/>
      <ProviderDetailPage v-if="openedProvider" v-show="!openedService && !requestsPage" :key="openedProvider.id" :provider="openedProvider" :services="providerServices(openedProvider.id)" :offers="catalogOffers.filter(item=>item.providerId===openedProvider.id)" :modes="modes" :favorite="isFavorite('providers',openedProvider.id)" @back="closeProvider" @service="openService" @offer="openProviderOffer" @reviews="openReviews" @favorite="item=>toggleSaved('providers',item.id)" @contact="contactProvider"/>
      <TransportAssistant v-show="activeTab === 'ai'" v-model:mode="serviceMode" ref="assistantRef" @demand-change="homeQuery?.prefill($event)" @close="activeTab = 'home'"/>
      <main v-show="activeTab === 'analysis'" class="ly-scroll ly-analysis-scroll" aria-label="运输分析">
        <AnalysisPage/>
      </main>
      <AppsPage v-show="activeTab === 'app'" @overlay-change="appsOverlay=$event"/>
      <MinePage v-show="activeTab === 'mine'" :favorite-counts="{ services: savedServices.length, providers: savedProviders.length, cargos: savedCargos.length }" @navigate="onMineNavigate"/>
      <section v-if="favoritesOpen" v-show="!openedService && !cargoOverlay" class="ly-service-page" aria-label="我的收藏">
        <header class="ly-service-nav"><button aria-label="返回我的" @click="favoritesOpen=false"><van-icon name="arrow-left"/></button><h1>我的收藏</h1><span/></header>
        <main class="ly-service-content lh-home lh-favorites-content">
          <div class="lh-featured-tabs" role="tablist" aria-label="收藏分类"><button role="tab" :aria-selected="favoriteMode==='services'" @click="favoriteMode='services'">运输方案 {{ savedServices.length }}</button><button role="tab" :aria-selected="favoriteMode==='providers'" @click="favoriteMode='providers'">物流企业 {{ savedProviders.length }}</button><button role="tab" :aria-selected="favoriteMode==='cargos'" @click="favoriteMode='cargos'">货源 {{ savedCargos.length }}</button></div>
          <p v-if="favoriteStore.storageError" role="status" class="ly-sheet-hint">收藏暂时只保存在当前会话，浏览器存储不可用。</p>
          <template v-if="favoriteMode==='services'"><ServiceCard v-for="service in savedServices" :key="service.id" compact :service="service" :provider="providerById(service.providerId)" :mode="modeInfo(service.mode)" @open="openService" @provider="openProvider" @reviews="openReviews"/></template>
          <template v-else-if="favoriteMode==='providers'"><article v-for="provider in savedProviders" :key="provider.id" class="lh-saved-provider"><div><button class="ly-list-row" @click="openProvider(provider)"><TransportIcon :mode="provider.mode"/><span><strong>{{ provider.name }}</strong><small>{{ provider.area }}</small></span><van-icon name="arrow"/></button></div><ProviderRating :provider="provider" compact stars @open="openReviews"/></article></template>
          <template v-else><CargoCard v-for="cargo in savedCargos" :key="cargo.id" :cargo="cargo" @open="cargoMarket.openCargo($event)"/></template>
          <p v-if="favoriteMode==='cargos' && cargoStore.storageError" role="status" class="ly-sheet-hint">货源收藏暂时只保存在当前会话。</p>
          <div v-if="!(favoriteMode==='services' ? savedServices : favoriteMode==='providers' ? savedProviders : savedCargos).length" class="ly-empty"><van-icon name="like-o"/><p>还没有收藏{{ favoriteMode==='services' ? '运输方案' : favoriteMode==='providers' ? '物流企业' : '货源' }}</p><button class="ly-text-button" @click="favoritesOpen=false; activeTab='home'">去首页看看</button></div>
        </main>
      </section>
      <nav v-show="(activeTab !== 'ai' || (assistantRef?.isLanding && !assistantRef?.overlayOpen)) && !openedService && !openedProvider && !serviceList && !catalog && !networkExpanded && !nodeDetail && !requestsPage && !favoritesOpen && !cargoOverlay && !appsOverlay" class="ly-bottom-nav" :class="{ 'ly-ai-navigation': activeTab === 'ai' }" aria-label="主导航">
        <button v-for="tab in tabs" :key="tab.key" :class="['ly-tab', { active: activeTab === tab.key, 'ly-tab-ai': tab.key === 'ai' }]" :aria-current="activeTab === tab.key ? 'page' : undefined" @click="activeTab = tab.key">
          <img v-if="tab.key === 'ai'" class="ly-tab-mascot" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="">
          <img v-else-if="tab.key !== 'analysis'" class="ly-tab-icon" :src="'/zhiyun-mobile-assets/icons/tab-' + tab.key + '.svg'" alt="">
          <van-icon v-else :name="tab.icon"/><span>{{ tab.label }}</span>
        </button><span class="ly-home-indicator"></span>
      </nav>

      <van-popup v-model:show="addressOpen" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="ly-sheet">
        <div class="ly-sheet-title"><h2>选择{{ addressMode === 'load' ? '装货地' : '卸货地' }}</h2><button aria-label="关闭地址选择" @click="addressOpen = false"><van-icon name="cross"/></button></div>
        <van-search v-model="addressQuery" placeholder="搜索城市或区域"/><p class="ly-sheet-hint">选择具体城市、区域或服务点</p>
        <div class="ly-address-options"><button v-for="address in filteredAddresses" :key="address.id" @click="selectAddress(address)"><van-icon name="location-o"/><span><strong>{{ address.city }}</strong><small>{{ address.district }}</small></span><van-icon name="arrow"/></button><p v-if="!filteredAddresses.length" class="ly-empty">暂无匹配地址，请换个关键词</p></div>
      </van-popup>

      <van-popup v-model:show="sheet.open" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="ly-sheet">
        <div class="ly-sheet-title"><h2>{{ sheet.title }}</h2><button aria-label="关闭" @click="sheet.open = false"><van-icon name="cross"/></button></div>
        <div class="ly-sheet-body">
          <template v-if="sheet.kind === 'list'">
            <p v-if="sheet.context" class="ly-sheet-hint">{{ sheet.context }}</p>
            <button v-for="service in sheet.items" :key="service.id" class="ly-list-row" @click="openService(service)"><TransportIcon :mode="service.mode"/><span><strong>{{ service.from }} → {{ service.to }}</strong><small>{{ modeInfo(service.mode).label }} · {{ service.coverage }} · {{ service.price }}</small></span><van-icon name="arrow"/></button>
            <div v-if="!sheet.items.length" class="ly-empty"><van-icon name="search"/><p>暂无符合条件的方案</p><small>可以调整条件或浏览其他方案。</small><button class="ly-text-button" @click="openList('全部运输方案', services)">浏览全部方案</button></div>
          </template>
          <template v-else-if="sheet.kind === 'providers'"><div v-for="provider in sheet.items" :key="provider.id"><button class="ly-list-row" @click="openProvider(provider)"><TransportIcon :mode="provider.mode"/><span><strong>{{ provider.name }}</strong><small>{{ provider.area }}</small></span><van-icon name="arrow"/></button><ProviderRating :provider="provider" compact @open="openReviews"/></div></template>
          <template v-else-if="sheet.kind === 'reviews'">
            <div class="ly-detail-hero"><h3>{{ sheet.provider.name }}</h3><p>企业服务评价</p><ProviderRating :provider="sheet.provider" stars @open="openReviews"/></div>
            <p class="ly-sheet-hint">以下展示{{ sheet.provider.reviews.length }}条评价。企业评分不等于本单履约保证。</p>
            <article v-for="review in sheet.provider.reviews" :key="review.id" class="ly-review-card"><div><strong>货主评价</strong><span>{{ review.score.toFixed(1) }}分</span></div><small>{{ review.business }} · {{ review.date }}</small><p>{{ review.text }}</p><p v-if="review.reply" class="ly-review-reply">企业回复：{{ review.reply }}</p></article>
            <div v-if="!sheet.provider.reviews.length" class="ly-empty"><van-icon name="comment-o"/><p>暂无评价</p><small>没有评价不表示服务质量差。</small></div>
          </template>
          <template v-else-if="sheet.kind === 'network'">
            <div class="ly-filters"><button :class="{ active: networkMode === 'all' }" @click="chooseNetworkMode('all')">全部</button><button v-for="mode in modes" :key="mode.key" :class="{ active: networkMode === mode.key }" @click="chooseNetworkMode(mode.key)">{{ mode.short }}</button></div>
            <TransportNetwork :routes="networkRoutes" :selected-id="selectedRouteId" @select="selectedRouteId = $event"/>
            <p class="ly-sheet-hint">选择连线或低空区域，再点击下方线路查看方案。线条仅示意服务关系，不表示实际运输路径。</p>
            <button v-for="service in networkRoutes" :key="service.id" class="ly-list-row" :class="{ selected: selectedRouteId === service.id }" @click="selectedRouteId = service.id; openService(service)"><TransportIcon :mode="service.mode"/><span><strong>{{ service.from }} → {{ service.to }}</strong><small>{{ modeInfo(service.mode).label }} · {{ service.coverage }}</small></span><van-icon name="arrow"/></button>
          </template>
          <template v-else-if="sheet.kind === 'track'">
            <div class="ly-detail-hero"><h3>{{ sheet.tracking.route }}</h3><p>{{ sheet.tracking.status }} · {{ sheet.tracking.number }}</p><small>最近更新：{{ sheet.tracking.updated }}</small></div>
            <ol class="ly-timeline"><li v-for="event in sheet.tracking.events" :key="event.time"><small>{{ event.time }}</small><strong>{{ event.title }}</strong><p>{{ event.detail }}</p></li></ol><p class="ly-sheet-hint">示例节点回放，未接入实时轨迹与运输数据。</p>
          </template>
          <template v-else><div class="ly-notice"><h3>{{ sheet.heading }}</h3><p>{{ sheet.body }}</p></div><van-button block type="primary" @click="sheet.open = false">知道了</van-button></template>
        </div>
      </van-popup>
    </div>
    <aside class="ly-validation-disclosure" role="note">体验验证环境：路线、节点设施、服务、时效、费用、企业、评分及成交统计为测试数据；地图底图来自 OpenStreetMap。需求与收藏仅保存在本机浏览器，未连接真实 AI、运输网络或对外询价。</aside>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { showToast } from 'vant'
import { favoriteStore, isFavorite, toggleFavorite } from './platform-favorites.js'
import { addresses, modes, providers, services, tabs } from './mock-data.js'
import TransportIcon from './TransportIcon.vue'
import TransportNetwork from './TransportNetwork.vue'
import ProviderRating from './ProviderRating.vue'
import TransportAssistant from './TransportAssistant.vue'
import RouteQueryForm from './RouteQueryForm.vue'
import ServiceCard from './ServiceCard.vue'
import ServiceDetailPage from './ServiceDetailPage.vue'
import ProviderDetailPage from './ProviderDetailPage.vue'
import PlatformCatalog from './PlatformCatalog.vue'
import PlatformNetwork from './PlatformNetwork.vue'
import NetworkNodeDetail from './NetworkNodeDetail.vue'
import ServiceRequests from './ServiceRequests.vue'
import AnalysisPage from './AnalysisPage.vue'
import AppsPage from './AppsPage.vue'
import MinePage from './MinePage.vue'
import CargoMarketplace from './CargoMarketplace.vue'
import CargoCard from './CargoCard.vue'
import { cargos } from './cargo-data.js'
import { cargoStore } from './cargo-store.js'
import { requestStore } from './platform-requests.js'
import { browsingRegions, serviceCategories, catalogOffers, networkPlaces } from './platform-data.js'
import './home.css'
import './service-cards.css'
import './platform-home.css'
import './homepage-ui.css'

const screenRoot = ref(null)
const cargoMarket = ref(null), cargoOverlay = ref(false)
const favoritesOpen = ref(false), favoriteMode = ref('services')
const appsOverlay = ref(false)
const savedServices = computed(()=>favoriteStore.services.map(id=>services.find(item=>item.id===id)).filter(Boolean))
const savedProviders = computed(()=>favoriteStore.providers.map(id=>providers.find(item=>item.id===id)).filter(Boolean))
const savedCargos = computed(()=>cargoStore.favorites.map(id=>cargos.find(item=>item.id===id)).filter(Boolean))
function toggleSaved(kind,id){
  const saved=toggleFavorite(kind,id)
  showToast({message:favoriteStore.storageError ? '已更新收藏，当前仅保存在本次会话' : saved ? '已收藏，可在“我的收藏”查看' : '已取消收藏',teleport:screenRoot.value})
}
const homeScroll = ref(null)
const serviceSection = ref(null)
const openedService = ref(null)
const openedProvider = ref(null), providerReturnService = ref(null)
const serviceList = ref(null)
const browseRegion=ref('全国'), homeOrigin=ref('全国'), listOrigin=ref('全国'), listDestination=ref('全国'), listMode=ref('all')
const catalog=ref(null), networkExpanded=ref(false)
const homeServiceCategories=serviceCategories.filter(category=>category.id!=='transport')
const nodeDetail=ref(null), requestsPage=ref(null)
const businessReminder=computed(()=>{
  const draft=requestStore.items.filter(item=>item.status==='draft').length
  const waiting=requestStore.items.filter(item=>item.status==='submitted').length
  return {hasRecords:requestStore.items.length>0,title:requestStore.items.length?'我的服务需求':'服务需求与进展',detail:requestStore.items.length?`${draft}份待确认 · ${waiting}份待回复`:'找好服务后，在这里继续办理'}
})
const featuredMode=ref('all')
const featuredModes=[{key:'all',label:'推荐'},{key:'road',label:'公路'},{key:'water',label:'水路'},{key:'rail',label:'铁路'},{key:'multi',label:'联运'},{key:'air',label:'低空'}]
const destinationRegions=['全国',...new Set(services.map(item=>item.to))]
const orderedServices=[...services.filter(item=>['road-sz-hz','multi-cd-wh-gz'].includes(item.id)),...services.filter(item=>!['road-sz-hz','multi-cd-wh-gz'].includes(item.id))]
const featuredServices=computed(()=>orderedServices.filter(item=>(featuredMode.value==='all'||item.mode===featuredMode.value)&&(homeOrigin.value==='全国'||item.from.includes(homeOrigin.value))&&(browseRegion.value==='全国'||(item.from+item.to).includes(browseRegion.value))).slice(0,2))
const filteredListServices=computed(()=>(serviceList.value?.items||[]).filter(item=>(listOrigin.value==='全国'||item.from.includes(listOrigin.value))&&(listDestination.value==='全国'||item.to.includes(listDestination.value))&&(listMode.value==='all'||item.mode===listMode.value)))
const activeTab = ref('home')
const assistantPrompt = ref('')
const assistantRef = ref(null)
const homeQuery = ref(null)
const loadAddress = ref(addresses[0])
const unloadAddress = ref(null)
const requirements = ref('')
const queryError = ref('')
const addressOpen = ref(false)
const addressMode = ref('load')
const addressQuery = ref('')
const serviceMode = ref('all')
const networkMode = ref('all')
const selectedRouteId = ref(services[0].id)
const sheet = ref({ open: false, kind: 'notice', title: '' })
const visibleServices = computed(() => services.filter(service => serviceMode.value === 'all' || service.mode === serviceMode.value))
const featuredProviders = computed(()=>browseRegion.value==='全国'?providers.filter(provider=>['supply-road','supply-multi'].includes(provider.id)):providers.filter(provider=>providerServices(provider.id).some(service=>(service.from+service.to).includes(browseRegion.value))||catalogOffers.some(offer=>offer.providerId===provider.id&&offer.city===browseRegion.value)).slice(0,2))
const networkRoutes = computed(() => services.filter(service => networkMode.value === 'all' || service.mode === networkMode.value))
const selectedRoute = computed(() => networkRoutes.value.find(service => service.id === selectedRouteId.value))
const filteredAddresses = computed(() => addresses.filter(address => (address.city + address.district).includes(addressQuery.value.trim())))
const formatAddress = address => address ? address.city + ' · ' + address.district : ''
const routeSummary = computed(() => formatAddress(loadAddress.value) + ' → ' + (formatAddress(unloadAddress.value) || '待选择卸货地'))
const modeInfo = key => modes.find(mode => mode.key === key)
const modeStyle = key => ({ '--mode-color': modeInfo(key).color })
const providerById = id => providers.find(provider => provider.id === id)
const providerServices = id => services.filter(service => service.providerId === id)
function openAddress(mode) { addressMode.value = mode; addressQuery.value = ''; addressOpen.value = true }
function selectAddress(address) { if (addressMode.value === 'load') loadAddress.value = address; else unloadAddress.value = address; addressOpen.value = false; queryError.value = '' }
function openNotice(title, heading, body) { sheet.value = { open: true, kind: 'notice', title, heading, body } }
function onMineNavigate({ target }) {
  if (target === 'favorites') {
    favoritesOpen.value = true
    return
  }
  showToast({ message: '该功能页面暂未接入', teleport: screenRoot.value })
}
function openNotifications() { openNotice('消息通知', '暂无新消息', '收到新的业务或平台通知后，会在这里显示。') }
function openList(title, items, context = '', mode = serviceMode.value) { sheet.value.open = false; listOrigin.value=homeOrigin.value; listDestination.value='全国';listMode.value=mode;serviceList.value = { title, items, context } }
function openService(service) { sheet.value.open = false; openedService.value = service }
function openProvider(provider) { sheet.value.open=false;if(!openedProvider.value)providerReturnService.value=openedService.value;openedService.value=null;openedProvider.value=provider }
function closeProvider(){openedProvider.value=null;openedService.value=providerReturnService.value;providerReturnService.value=null}
function openProviderOffer(id){openedProvider.value=null;providerReturnService.value=null;openOffer(id)}
function contactProvider(provider){openRequests({kind:'provider',sourceId:provider.id,title:'企业服务咨询',providerId:provider.id,providerName:provider.name,context:provider.specialty})}
function openProviders(items) { sheet.value = { open: true, kind: 'providers', title: '运输服务商', items } }
function openReviews(provider) { sheet.value = { open: true, kind: 'reviews', title: '企业服务评价', provider } }
function openInquiry(service) { startRequest('transport',service) }
function openTopic() { openList('平台精选服务', orderedServices, '不同运输方式，同一处比较。结合起讫地、货物与交付范围，选择方案与物流企业。') }
function openCatalog(category){if(category==='transport')openList('运输服务',services);else catalog.value={category}}
function openOffer(id){sheet.value.open=false;openedService.value=null;serviceList.value=null;catalog.value={category:catalogOffers.find(item=>item.id===id)?.category,offer:id}}
function openAllOffers(){catalog.value={category:'more',region:'全国'}}
function openNode(place){nodeDetail.value=place}
function openRequests(target){sheet.value.open=false;requestsPage.value={key:Date.now(),target}}
function startRequest(kind,item){openRequests({kind,sourceId:item.id,title:kind==='transport'?`${item.originLabel} → ${item.destinationLabel}`:item.name,providerId:item.providerId,providerName:providerById(item.providerId).name,context:kind==='transport'?`${modeInfo(item.mode).label} · ${item.coverage}`:kind==='node'?`${item.city} · 节点服务咨询`:item.city})}
function browseServices(){requestsPage.value=null;nodeDetail.value=null;openedService.value=null;openedProvider.value=null;providerReturnService.value=null;catalog.value=null;networkExpanded.value=false;activeTab.value='home';openAllOffers()}
function openRequestSource(record){
  const item=(record.kind==='provider'?providers:record.kind==='transport'?services:record.kind==='node'?networkPlaces:catalogOffers).find(item=>item.id===record.sourceId)
  if(!item){openNotice('原服务已更新','暂时无法查看此服务','已保存的需求仍然保留，可返回核对。');return}
  requestsPage.value=null;catalog.value=null;openedService.value=null;openedProvider.value=null;providerReturnService.value=null;nodeDetail.value=null
  if(record.kind==='provider')openProvider(item);else if(record.kind==='transport')openService(item);else if(record.kind==='node')openNode(item);else openOffer(item.id)
}
function openPublish() { openNotice('发布货源', routeSummary.value, (requirements.value || '暂未填写运输要求') + '。地址与要求已带入演示入口；本轮未展开发布表单，也未发布任何货源。') }

async function openAssistant(text = '', fill = false) {
  activeTab.value = 'ai'
  await nextTick()
  if(fill) assistantRef.value.fillDemand()
  else assistantRef.value.start(text)
  assistantPrompt.value = ''
}
async function queryFromHome(demand) { activeTab.value = 'ai'; await nextTick(); assistantRef.value.queryFromHome(demand) }
function chooseNetworkMode(mode) { networkMode.value = mode; selectedRouteId.value = services.find(service => mode === 'all' || service.mode === mode)?.id || '' }
function openNetwork() { sheet.value = { open: true, kind: 'network', title: '平台运输网络' } }
</script>

<style src="./platform-home-enhanced.css"></style>

<style scoped>
.lh-featured-tabs{display:flex;gap:4px;margin:2px 0 9px;overflow-x:auto;scrollbar-width:none}
.lh-featured-tabs::-webkit-scrollbar{display:none}
.lh-featured-tabs button{flex:1 0 44px;min-height:44px;padding:0 4px;color:#647089;border-radius:8px;background:transparent;font-size:13px;white-space:nowrap}
.lh-featured-tabs button[aria-selected=true]{color:#3a65ff;font-weight:600;background:#e8eeff}
.lh-featured-tabs button:focus-visible{outline:2px solid #3a65ff;outline-offset:-2px}
.lh-favorites-entry{display:flex;align-items:center;gap:12px;width:100%;margin-top:20px;padding:16px;border:0;border-radius:12px;background:white;text-align:left}
.lh-favorites-entry>span{display:flex;flex-direction:column;gap:7px;flex:1}
.lh-favorites-entry strong{font-size:15px;color:#333}
.lh-favorites-entry small{font-size:12px;color:#8a91a1}
.lh-favorites-entry>.van-icon{color:#3a65ff;font-size:22px}
.lh-favorites-content{padding:12px 16px 24px}
.ly-analysis-scroll{padding:0 12px 114px;background:#eef0f5}
.lh-saved-provider{background:white;border-radius:10px;padding:8px 12px;margin:8px 0}
.lh-saved-provider>div{display:flex;align-items:center;gap:8px}
.lh-saved-provider .ly-list-row{flex:1;min-width:0}
</style>
