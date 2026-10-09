<template>
  <section class="ly-service-page ly-node-page" aria-label="物流节点详情">
    <header class="ly-service-nav"><button aria-label="返回平台网络" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>{{ profile.type }}详情</h1><span/></header>
    <main ref="content" class="ly-service-content">
      <section class="ly-detail-card"><div class="ly-tags"><span>{{ profile.type }}</span><span v-for="mode in profile.modes" :key="mode">{{ mode }}</span></div><h2 class="ly-catalog-title">{{ place.name }}</h2><p class="ly-detail-muted"><van-icon name="location-o"/> {{ profile.location }}</p><AssistantRouteMap :scheme="emptyScheme" :places="[place]" :active-place="place.id" compact :expanded="mapExpanded" @expand="mapExpanded=!mapExpanded"/><p class="ly-detail-muted">{{ profile.intro }}</p></section>
      <nav class="ly-node-nav" aria-label="节点信息分类"><button v-for="tab in tabs" :key="tab.id" @click="jump(tab.id)">{{ tab.name }}</button></nav>
      <section ref="basic" class="ly-detail-card"><h2>基础资料</h2><dl><template v-for="fact in profile.facts" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></template></dl></section>
      <section class="ly-detail-card"><h2>{{ place.kind==='warehouses'?'仓储与作业条件':'货物与设施条件' }}</h2><dl><template v-for="fact in profile.facilities" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></template></dl></section>
      <section ref="capabilities" class="ly-detail-card"><h2>可咨询的服务</h2><p class="ly-detail-muted">以下由关联物流企业提供，非节点统一自营；承接条件需逐项确认。</p><div v-for="group in profile.serviceGroups" :key="group[0]" class="ly-node-service-group"><strong>{{ group[0] }}</strong><p>{{ group[1] }}</p></div><button v-for="offer in offers" :key="offer.id" class="ly-list-row" @click="$emit('offer',offer.id)"><span><strong>{{ offer.name }}</strong><small>{{ provider(offer.providerId).name }} · {{ offer.tags.join(' / ') }}</small></span><van-icon name="arrow"/></button></section>
      <section v-if="route" class="ly-detail-card"><h2>关联运输线路</h2><button class="ly-list-row" @click="$emit('service',route)"><span><strong>{{ route.originLabel }} → {{ route.destinationLabel }}</strong><small>{{ route.coverage }} · {{ route.condition }}</small><small>{{ route.duration }} · {{ route.price }}</small></span><van-icon name="arrow"/></button></section>
      <section ref="companies" class="ly-detail-card"><h2>关联物流企业</h2><div v-for="company in companiesList" :key="company.id" class="ly-node-company"><button class="ly-list-row" @click="$emit('provider',company)"><span><strong>{{ company.name }}</strong><small>{{ company.specialty }}</small></span><van-icon name="arrow"/></button><ProviderRating :provider="company" compact @open="$emit('reviews',$event)"/><p class="ly-detail-muted">{{ providerFit(company).responsibility }}</p></div></section>
      <section ref="guide" class="ly-detail-card"><h2>办理准备</h2><ol class="ly-node-checklist"><li v-for="item in profile.preparation" :key="item">{{ item }}</li></ol><h3>询价时核对费用</h3><div class="ly-tags"><span v-for="fee in profile.fees" :key="fee">{{ fee }}</span></div><p class="ly-detail-muted">先确认办理点和企业承接范围，再约定时间、交接凭证与费用；地图位置不作为直接进场指引。</p></section>
    </main>
    <footer class="ly-service-actions"><button @click="jump('services')">查看节点服务</button><button class="primary" @click="$emit('request',place)">咨询服务需求</button></footer>
  </section>
</template>
<script setup>
import { computed,ref } from 'vue'
import { nodeProfiles,providerFit } from './node-profiles.js'
import { catalogOffers } from './platform-data.js'
import { providers,services } from './mock-data.js'
import AssistantRouteMap from './AssistantRouteMap.vue'
import ProviderRating from './ProviderRating.vue'
const props=defineProps({place:Object})
defineEmits(['back','offer','service','provider','reviews','request'])
const content=ref(null),basic=ref(null),capabilities=ref(null),companies=ref(null),guide=ref(null),mapExpanded=ref(false)
const emptyScheme={id:'node-location',name:'物流节点位置',segments:[]}
const tabs=[{id:'basic',name:'基本信息'},{id:'services',name:'节点服务'},{id:'companies',name:'物流企业'},{id:'guide',name:'办理指引'}]
const profile=computed(()=>nodeProfiles[props.place.id])
const offers=computed(()=>catalogOffers.filter(item=>profile.value.offers.includes(item.id)))
const route=computed(()=>services.find(item=>item.id===props.place.serviceId))
const companiesList=computed(()=>providers.filter(item=>item.id===props.place.providerId||offers.value.some(offer=>offer.providerId===item.id)))
const provider=id=>providers.find(item=>item.id===id)
function jump(id){
  const el={basic:basic.value,services:capabilities.value,companies:companies.value,guide:guide.value}[id]
  const scroller=content.value
  if(el&&scroller)scroller.scrollTo({top:scroller.scrollTop+el.getBoundingClientRect().top-scroller.getBoundingClientRect().top-60,behavior:'smooth'})
}
</script>
