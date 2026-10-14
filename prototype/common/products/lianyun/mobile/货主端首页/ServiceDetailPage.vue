<template>
 <section class="ly-service-page ly-detail-page sd-page" aria-label="运输通道详情">
  <header class="ly-service-nav"><button aria-label="返回运输方案列表" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>运输通道详情</h1><span/></header>
  <main class="ly-service-content">
   <section class="ly-detail-card sd-schemes" aria-label="运输方案">
    <h2>运输方案 <small>{{ channel.schemes.length }}个可选</small></h2>
    <p class="sd-channel-route">{{ service.originLabel }} → {{ service.destinationLabel }}</p>
    <p class="sd-channel-reference">参考运价 <strong>{{ channel.price }}</strong><span>参考时效 {{ channel.duration }}</span></p>
    <div class="sd-capabilities"><span>{{ channel.cargoTypes.join('、') }}</span><span v-for="label in capabilityLabels" :key="label">{{ label }}</span></div>
    <div class="sd-scheme-options">
     <button v-for="item in channel.schemes" :key="item.id" :aria-pressed="item.id===scheme.id" :class="{active:item.id===scheme.id}" @click="chooseScheme(item.id)">
      <span><strong>{{ item.name }}</strong><van-icon v-if="item.id===scheme.id" name="checked"/></span>
      <small>{{ channel.paths.find(path=>path.id===item.pathId).name }}</small>
      <span class="sd-scheme-metrics">{{ item.price }}<small>{{ item.duration }}</small></span>
     </button>
    </div>
   </section>
   <section class="sd-map-hero" aria-label="运输路线地图"><AssistantRouteMap :scheme="route" :selected="selected" :expanded="expanded" @select="selected=$event" @expand="expanded=!expanded"/></section>
   <section class="ly-detail-card sd-route-card" :aria-label="route.name">
    <div class="sd-route-heading"><h2>{{ route.name }}</h2></div>
    <ol class="sd-flow"><li v-for="(node,index) in flowNodes" :key="index" class="sd-flow-node">
     <span class="sd-address-badge" :class="{'sd-address-end':index===flowNodes.length-1}">{{ index===0?'起':index===flowNodes.length-1?'终':'经' }}</span><div><strong>{{ node }}</strong><small v-if="route.segments[index]">{{ segmentMode(route.segments[index].mode) }}</small></div>
    </li></ol>
   </section>
   <section class="ly-detail-card sd-main" aria-label="所选经营方案信息">
    <h2>{{ scheme.name }}</h2><p class="sd-price" aria-label="参考运价"><small>参考运价</small>{{ scheme.price }}</p>
    <p class="sd-cargo"><van-icon name="goods-collect-o"/><span>{{ channel.cargoTypes.join('、') }}</span></p>
    <dl class="sd-facts">
     <dt>运输类型</dt><dd>物流方案</dd>
     <dt>运输方式</dt><dd>{{ routeModeLabel(route) }}</dd>
     <dt>参考时效</dt><dd>{{ scheme.duration }}</dd>
     <dt>费用组织方式</dt><dd>{{ scheme.quoteMode }}</dd>
     <dt>仓储中转</dt><dd>{{ booleanLabel(scheme.services.warehouseTransfer,'包含','不包含') }}</dd>
     <dt>增值服务</dt><dd>{{ servicesLabel(scheme.services.valueAdded) }}</dd>
     <dt>通关服务</dt><dd>{{ servicesLabel(scheme.services.customs) }}</dd>
     <dt>上门服务</dt><dd>{{ booleanLabel(scheme.services.pickup) }}</dd>
     <dt>末端服务</dt><dd>{{ booleanLabel(scheme.services.lastMile) }}</dd>
    </dl>
   </section>
   <section class="ly-detail-card sd-publisher" aria-label="发布企业">
    <div class="ly-company-identity"><span class="ly-company-avatar" aria-hidden="true">{{ publisher?.name.slice(0,2) || '企业' }}</span><div>
     <button v-if="publisher" class="ly-company-name" @click="$emit('provider',publisher)">{{ publisher.name }}</button><strong v-else>发布企业未提供</strong>
     <p class="sd-published-at">{{ channel.publishedAt ? channel.publishedAt+' 发布' : '发布时间未提供' }}</p>
    </div></div>
    <div class="sd-publisher-stats"><span>交易 {{ stats ? stats.transactions+'次' : '未提供' }}</span><span>发货量 {{ stats?.shipmentVolume || '未提供' }}</span>
     <button v-if="publisher?.score!=null" @click="$emit('reviews',publisher)">评分 {{ publisher.score.toFixed(1) }}分</button><span v-else>暂无评分</span>
    </div>
   </section>
   <section class="sd-related" aria-label="类似运输通道推荐">
    <h2>类似运输通道推荐</h2>
    <ServiceCard v-for="item in relatedServices" :key="item.id" :service="item" :provider="providerFor(item)" :mode="modeFor(item)" compact @open="$emit('service',$event)" @provider="$emit('provider',$event)" @reviews="$emit('reviews',$event)"/>
    <p v-if="!relatedServices.length" class="sd-empty">暂无类似运输通道</p>
   </section>
  </main>
  <footer class="ly-service-actions ly-detail-actions"><FavoriteButton :saved="favorite" :label="channel.name" @toggle="$emit('favorite',service)"/><button class="primary" @click="$emit('inquiry',transportInquiry(service,channel,scheme))">按此方案询价</button></footer>
 </section>
</template>
<script setup>
import { computed,ref } from 'vue'
import AssistantRouteMap from './AssistantRouteMap.vue'
import FavoriteButton from './FavoriteButton.vue'
import ServiceCard from './ServiceCard.vue'
import { transportChannel,channelCapabilityLabels,routeModeLabel,transportInquiry,relatedTransportChannels } from './transport-channels.js'
import { providers,services,modes } from './mock-data.js'
import { publisherStats,booleanLabel,servicesLabel } from './service-detail-data.js'
const props=defineProps({service:Object,provider:Object,mode:Object,favorite:Boolean})
defineEmits(['back','provider','reviews','inquiry','favorite','service'])
const channel=computed(()=>transportChannel(props.service))
const selectedSchemeId=ref(props.service.selectedSchemeId||channel.value.schemes[0].id)
const scheme=computed(()=>channel.value.schemes.find(item=>item.id===selectedSchemeId.value)||channel.value.schemes[0])
const route=computed(()=>channel.value.paths.find(item=>item.id===scheme.value.pathId))
const selected=ref(0),expanded=ref(false)
const capabilityLabels=computed(()=>channelCapabilityLabels(channel.value.capabilities))
const publisher=computed(()=>providers.find(item=>item.id===channel.value.publisherId))
const stats=computed(()=>publisherStats[channel.value.publisherId])
const segmentMode=mode=>({road:'公路',rail:'铁路',water:'水路',air:'低空'}[mode]||mode)
function chooseScheme(id){selectedSchemeId.value=id;selected.value=0;expanded.value=false}
const flowNodes=computed(()=>{
 const segments=route.value.segments || []
 return segments.length?[segments[0].from,...segments.map(segment=>segment.to)]:[props.service.originLabel,props.service.destinationLabel]
})
const relatedServices=computed(()=>relatedTransportChannels(props.service,services))
const providerFor=service=>providers.find(item=>item.id===service.providerId)
const modeFor=service=>modes.find(item=>item.key===service.mode)
</script>
<style scoped>
.sd-page{color:#333}
.sd-channel-route{margin:10px 0 6px;font-size:13px;color:#647090;line-height:22px}
.sd-channel-reference{margin:0 0 10px;display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#888;align-items:baseline}
.sd-channel-reference strong{color:#3a65ff;font-size:17px}.sd-channel-reference>span{margin-left:auto}
.sd-capabilities{display:flex;flex-wrap:wrap;gap:6px}.sd-capabilities>span{background:#eef3ff;padding:4px 7px;border-radius:4px;font-size:11px;color:#647090}
.sd-schemes h2{display:flex;justify-content:space-between}.sd-schemes h2 small{font-size:12px;color:#888;font-weight:400}
.sd-scheme-options{display:flex;gap:8px;margin-top:12px;overflow-x:auto;padding:0 1px 5px;scroll-snap-type:x proximity;scrollbar-width:thin}
.sd-scheme-options button{flex:0 0 152px;min-width:0;scroll-snap-align:start;padding:10px;border:1px solid #e4e8f0;border-radius:8px;text-align:left}
.sd-scheme-options button.active{border-color:#3a65ff;background:#f3f6ff}
.sd-scheme-options button>span{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px}
.sd-scheme-options .van-icon{color:#3a65ff}.sd-scheme-options button>small{display:block;color:#888;margin:6px 0;font-size:12px}
.sd-scheme-options .sd-scheme-metrics{align-items:flex-start;flex-direction:column;gap:5px;font-size:13px;color:#3a65ff}.sd-scheme-metrics small{color:#647090;font-size:12px}
.sd-flow-node>div{min-width:0}.sd-flow-node small{display:block;font-size:12px;color:#888;margin-top:5px}
.sd-price small{display:block;font-size:12px;color:#888;font-weight:400;margin:12px 0 6px}

.sd-map-hero{margin:-12px -15px 12px}
.sd-map-hero :deep(.lya-real-map){margin:0;border:0;border-radius:0}
.sd-page .ly-service-nav h1{font-size:17px}
.sd-route-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.sd-route-heading h2{margin:0}
.sd-flow{list-style:none;margin:0;padding:0}
.sd-flow-node{position:relative;display:flex;align-items:flex-start;gap:12px;padding-bottom:16px}
.sd-flow-node:last-child{padding-bottom:0}
.sd-flow-node:not(:last-child):after{content:'';position:absolute;left:8px;top:23px;bottom:3px;border-left:1px dashed #d4d8e2}
.sd-address-badge{width:18px;height:18px;margin-top:2px;flex:none;display:grid;place-items:center;border-radius:4px;background:#3a65ff;color:#fff;font-size:10px}
.sd-address-end{background:#19b88b}
.sd-flow-node strong{font-size:14px;line-height:21px;font-weight:500;overflow-wrap:anywhere}
.sd-price{margin:0 0 12px;color:#ff3545;font-size:25px;font-weight:700}
.sd-cargo{display:flex;gap:8px;align-items:flex-start;margin:0 0 16px;font-size:13px;line-height:21px;color:#666}
.sd-cargo .van-icon{margin-top:3px}
.sd-facts{margin:0;padding-top:16px;border-top:1px solid #eee}
.sd-facts dd{overflow-wrap:anywhere}
.sd-publisher .ly-company-avatar{font-size:14px;background:#85899d;color:white}
.sd-publisher .ly-company-identity>div{min-width:0}
.sd-publisher .ly-company-name{font-size:14px;text-align:left;overflow-wrap:anywhere}
.sd-published-at{margin:5px 0 0;color:#999;font-size:12px;line-height:18px}
.sd-publisher-stats{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px;line-height:20px;color:#888}
.sd-publisher-stats button{font:inherit;color:#555}
.sd-related{margin-top:18px}
.sd-related>h2{margin:0 0 12px;font-size:16px;font-weight:600}
.sd-empty{font-size:13px;color:#999;text-align:center;padding:12px 0}
.sd-page button:focus-visible{outline:2px solid #3a65ff;outline-offset:2px}
</style>
