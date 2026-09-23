<template>
  <div class="ly-preview">
    <div ref="screenRoot" class="ly-screen">
      <div class="ly-status" aria-hidden="true">
        <span>9:41</span>
        <span class="ly-status-icons"><i class="ly-signal"></i><van-icon name="wifi-o" /><i class="ly-battery"></i></span>
      </div>

      <main v-show="activeTab === 'home'" class="ly-scroll" aria-label="至简联运首页">
        <header class="ly-brand">
          <button class="ly-location" @click="openAddress('load')"><van-icon name="location" />{{ loadAddress?.city || '选择装货地' }}<van-icon name="arrow-down" /></button>
          <button class="ly-icon-button" aria-label="消息" @click="openNotice('消息', '暂无其他消息', '收到的报价与运输进展提醒将在这里汇集。')"><van-icon name="bell" /></button>
        </header>
        <section class="ly-hero">
          <h1>至简联运，让运输更合适<img class="ly-title-swoosh" src="/zhiyun-mobile-assets/icons/title-swoosh.svg" alt=""></h1>
          <p>公路 · 铁路 · 水路，多种运输方式可选</p>
        </section>

        <section class="ly-map-card" aria-label="装货位置预览">
          <img v-if="loadAddress?.id === 'fuzhou'" class="ly-map-img" src="/zhiyun-mobile-assets/map-embedded.png" alt="福州装货位置示意地图">
          <span class="ly-map-pin" aria-hidden="true"></span>
          <span class="ly-map-tag">装货点</span>
          <button class="ly-map-bubble" @click="openAddress('load')">{{ formatAddress(loadAddress) || '请选择装货地' }}<van-icon name="arrow" /></button>
        </section>
        <section class="ly-guidance" aria-label="运输方案引导">
          <p>输入装卸地点，比较适合这批货的运输方案；需求明确，也可以直接发布货源。</p>
          <button aria-label="AI找方案" @click="openAi"><van-icon name="arrow" /></button>
        </section>
        <section class="ly-address-card" aria-label="运输需求">
          <div class="ly-addresses">
            <button class="ly-load-row" aria-label="选择装货地" @click="openAddress('load')">
              <i class="ly-dot"></i>
              <span class="ly-load-copy"><span>将在 <b>{{ formatAddress(loadAddress) || '请选择装货地' }}</b> 装货</span><small>选择装货地点，查找适合这批货的运输方案</small></span>
              <van-icon name="arrow" />
            </button>
            <button class="ly-unload-row" aria-label="选择卸货地" @click="openAddress('unload')">
              <i class="ly-dot ly-dot-green"></i><strong>{{ formatAddress(unloadAddress) || '您要去哪卸货' }}</strong><van-icon name="arrow" />
            </button>
          </div>
          <div class="ly-actions">
            <van-button class="ly-ai-button" type="primary" @click="openAi"><van-icon name="star" /> AI 找方案</van-button>
            <van-button class="ly-publish-button" @click="openNotice('发布货源', routeSummary, '已保留您选择的装卸地址。')"><van-icon name="records-o" /> 发布货源</van-button>
          </div>
        </section>

        <div class="ly-business-strip"><BusinessReminder @open="openNotice('查看报价', '武汉 → 广州', '收到 3 份新报价，待您比较。')" /></div>

        <section class="ly-services" aria-label="精选联运方案">
          <div class="ly-section-heading"><div><h2>精选联运方案</h2><p>承运企业提供的运输服务</p></div><button @click="openNotice('全部运输服务', '浏览联运方案', '公水联运 · 公铁联运 · 铁水联运')">查看全部 <van-icon name="arrow" /></button></div>
          <button v-for="service in services" :key="service.id" class="ly-service-card" :aria-label="`${service.mode} ${service.from}到${service.to} 查看方案`" @click="openService(service)">
            <div class="ly-tags"><span class="ly-mode" :class="service.tone">{{ service.mode }}</span><span>{{ service.coverage }}</span></div>
            <h3>{{ service.from }} <span class="ly-route-arrow">⟶</span> {{ service.to }}</h3>
            <div class="ly-service-address"><span><small>装</small>{{ service.load }}</span><span><small>卸</small>{{ service.unload }}</span></div>
            <div class="ly-service-metrics"><span class="ly-duration">预计 <b>{{ service.duration }}</b> 天</span><span class="ly-price"><small>参考价</small><strong><i>¥</i>{{ service.price }}</strong><span>/{{ service.unit }} 箱起</span></span></div>
            <p class="ly-service-conditions">{{ service.frequency }} · {{ service.cargo }} · {{ service.containers }}</p>
            <p class="ly-service-fee">{{ service.fee }}</p>
            <div class="ly-provider"><span class="ly-provider-avatar" :class="service.tone">{{ service.initial }}</span><strong>{{ service.company }}</strong><span class="ly-cert"><img src="/zhiyun-mobile-assets/icons/cert-badge.svg" alt="">企业认证</span><van-icon name="arrow" /></div>
          </button>
        </section>
      </main>

      <main v-show="activeTab !== 'home'" class="ly-tab-page" :aria-label="activeLabel">
        <h1>{{ activeTab === 'cargo' ? '我的货源' : activeTab === 'analysis' ? '运输分析' : activeLabel }}</h1>
        <div class="ly-tab-empty">
          <img v-if="activeTab === 'ai'" class="ly-empty-ai" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="小简 AI">
          <van-icon v-else :name="tabs.find(tab => tab.key === activeTab)?.icon" />
          <h2>{{ activeLabel }}</h2>
          <p v-if="activeTab === 'ai' && aiContext">{{ aiContext }}</p>
          <p v-else>暂无内容</p>
        </div>
      </main>

      <nav class="ly-bottom-nav" aria-label="主导航">
        <button v-for="tab in tabs" :key="tab.key" :class="['ly-tab', { active: activeTab === tab.key, 'ly-tab-ai': tab.key === 'ai' }]" :aria-current="activeTab === tab.key ? 'page' : undefined" @click="activeTab = tab.key">
          <img v-if="tab.key === 'ai'" class="ly-tab-mascot" src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="">
          <img v-else-if="tab.key !== 'ai' && tab.key !== 'analysis'" class="ly-tab-icon" :src="`/zhiyun-mobile-assets/icons/tab-${tab.key === 'cargo' ? 'hall' : tab.key}.svg`" alt="">
          <van-icon v-else :name="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
        <span class="ly-home-indicator" aria-hidden="true"></span>
      </nav>

      <van-popup v-model:show="addressOpen" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="ly-sheet">
        <div class="ly-sheet-title"><h2>选择{{ addressMode === 'load' ? '装货地' : '卸货地' }}</h2><button aria-label="关闭地址选择" @click="addressOpen = false"><van-icon name="cross" /></button></div>
        <van-search v-model="addressQuery" placeholder="搜索城市或区域" />
        <div class="ly-address-options"><button v-for="address in filteredAddresses" :key="address.id" @click="selectAddress(address)"><van-icon name="location-o" /><span><strong>{{ address.city }}</strong><small>{{ address.district }}</small></span><van-icon name="arrow" /></button><p v-if="!filteredAddresses.length" class="ly-no-address">暂无匹配地址，请换个关键词</p></div>
      </van-popup>
      <van-popup v-model:show="notice.open" position="bottom" round :teleport="screenRoot" :style="{ position: 'absolute' }" :overlay-style="{ position: 'absolute' }" class="ly-sheet">
        <div class="ly-sheet-title"><h2>{{ notice.title }}</h2><button aria-label="关闭" @click="notice.open = false"><van-icon name="cross" /></button></div>
        <div class="ly-notice"><h3>{{ notice.heading }}</h3><p>{{ notice.body }}</p><van-button block type="primary" @click="notice.open = false">知道了</van-button></div>
      </van-popup>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { addresses, services, tabs } from './mock-data.js'
import './home.css'
import BusinessReminder from './BusinessReminder.vue'

const screenRoot = ref(null)
const activeTab = ref('home')
const activeLabel = computed(() => tabs.find(tab => tab.key === activeTab.value)?.label || '')
const loadAddress = ref(addresses[0])
const unloadAddress = ref(null)
const addressOpen = ref(false)
const addressMode = ref('load')
const addressQuery = ref('')
const aiContext = ref('')
const notice = ref({ open: false, title: '', heading: '', body: '' })
const formatAddress = address => address ? `${address.city} · ${address.district}` : ''
const routeSummary = computed(() => `${formatAddress(loadAddress.value) || '待选择装货地'} → ${formatAddress(unloadAddress.value) || '待选择卸货地'}`)
const filteredAddresses = computed(() => addresses.filter(address => `${address.city}${address.district}`.includes(addressQuery.value.trim())))
function openAddress(mode) { addressMode.value = mode; addressQuery.value = ''; addressOpen.value = true }
function selectAddress(address) { if (addressMode.value === 'load') loadAddress.value = address; else unloadAddress.value = address; addressOpen.value = false }
function openAi() { aiContext.value = routeSummary.value; activeTab.value = 'ai' }
function openNotice(title, heading, body) { notice.value = { open: true, title, heading, body } }
function openService(service) { openNotice('运输服务', `${service.from} → ${service.to} · ${service.mode}`, `装货点：${service.load}；卸货点：${service.unload}。预计 ${service.duration} 天，${service.frequency}。参考价 ¥${service.price}/${service.unit} 箱起。${service.fee}。`) }
</script>
