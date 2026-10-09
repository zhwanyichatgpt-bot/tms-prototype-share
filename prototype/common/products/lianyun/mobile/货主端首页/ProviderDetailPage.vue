<template>
 <section class="ly-service-page ly-detail-page pd-page" aria-label="物流企业详情">
  <header class="ly-service-nav"><button aria-label="返回上一页" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>企业详情</h1><span/></header>
  <main class="ly-service-content">
   <section class="pd-hero" aria-label="企业信息与评分">
    <div class="pd-identity"><span v-if="provider.logo" class="pd-logo"><img :src="provider.logo" alt="企业Logo"/></span><h2>{{ provider.name }}</h2><span class="pd-enterprise-kind">物流企业</span></div>
    <p class="pd-meta"><span v-if="provider.city">{{ provider.city }}</span><span v-if="provider.verified"><van-icon name="passed"/>认证企业</span></p>
    <p class="pd-specialty">{{ provider.specialty }}</p>
    <div class="pd-hero-rating"><ProviderRating :provider="provider" compact stars @open="$emit('reviews',$event)"/><span>企业服务评分</span></div>
   </section>

   <section class="pd-section pd-capabilities" aria-label="运输与服务能力">
    <div class="pd-section-heading"><h2>运输与服务能力</h2><small>企业服务信息</small></div>
    <div class="ly-detail-card pd-capability-overview">
     <div><div class="pd-summary-heading"><h3>已发布线路</h3><small>{{ routeCount }} 条</small></div><p v-if="services.length" class="pd-route"><span>{{ services[0].from }}</span><van-icon name="arrow"/><span>{{ services[0].to }}</span></p><p v-else class="pd-summary-empty">暂无已发布线路</p><span v-if="routeCount>1" class="pd-more-routes">另有 {{ routeCount-1 }} 条线路</span></div>
     <div><div class="pd-summary-heading"><h3>常运货物</h3><small v-if="cargoTypes.length">{{ cargoTypes.length }} 类</small></div><div v-if="cargoTypes.length" class="pd-goods"><span v-for="cargo in cargoTypes" :key="cargo">{{ cargo }}</span></div><p v-else class="pd-summary-empty">可联系企业咨询</p></div>
    </div>
    <div class="ly-detail-card">
     <div class="pd-capability-group"><p>运输方式</p><div class="pd-capability-tags"><span v-for="mode in transportModes" :key="mode.key" class="pd-mode-tag"><TransportIcon :mode="mode.key"/>{{ mode.label }}</span></div></div>
     <dl><dt>服务区域</dt><dd>{{ provider.area }}</dd><dt>配套服务</dt><dd>{{ provider.capabilities?.join('、') || '可联系企业咨询' }}</dd></dl>
    </div>
   </section>

   <section class="pd-section" aria-label="合作与履约">
    <div class="pd-section-heading"><h2>合作与履约</h2><small>平台历史记录</small></div>
    <div class="ly-detail-card"><p v-if="provider.cooperationRecord" class="pd-cooperation"><van-icon name="passed"/>{{ provider.cooperationRecord }}</p>
     <div v-if="performanceMetrics.length" class="pd-metrics"><div v-for="metric in performanceMetrics" :key="metric.label"><strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong><span>{{ metric.label }}</span></div></div>
     <p v-else class="ly-detail-muted pd-record-note">暂未展示平台履约统计</p>
     <dl class="pd-cooperation-facts"><dt>合作方式</dt><dd>{{ provider.cooperation || '按需求协商' }}</dd></dl>
    </div>
   </section>

   <section class="ly-detail-card pd-services" aria-label="企业运输方案">
    <div class="ly-detail-card-heading"><h2>企业运输方案</h2><button v-if="services.length>2" @click="showAll=!showAll">{{ showAll?'收起':'全部 '+services.length }}<van-icon :name="showAll?'arrow-up':'arrow'"/></button></div>
    <div class="lh-home"><ServiceCard v-for="service in visibleServices" :key="service.id" compact hide-provider :service="service" :provider="provider" :mode="modes.find(item=>item.key===service.mode)" @open="$emit('service',$event)" @reviews="$emit('reviews',$event)"/></div>
    <p v-if="!services.length" class="ly-detail-muted">暂无已发布运输方案，可联系企业咨询承接需求。</p>
    <div v-if="offers.length" class="pd-offers"><h3>其他物流服务</h3><button v-for="offer in offers" :key="offer.id" class="ly-list-row" @click="$emit('offer',offer.id)"><span><strong>{{ offer.name }}</strong><small>{{ offer.city }} · {{ offer.tags.join(' · ') }}</small></span><van-icon name="arrow"/></button></div>
   </section>

   <section class="pd-section" aria-label="资质与企业资料">
    <div class="pd-section-heading"><h2>资质与企业资料</h2></div>
    <div class="ly-detail-card"><ul v-if="qualificationItems.length" class="pd-credentials"><li v-for="credential in qualificationItems" :key="credential"><van-icon name="passed"/>{{ credential }}</li></ul><p v-else class="ly-detail-muted pd-record-note">暂未展示相关资质资料</p>
     <div class="pd-company-profile"><h3>企业简介</h3><p class="pd-description">{{ provider.description || '暂未提供企业简介' }}</p><dl v-if="provider.address"><dt>经营地址</dt><dd>{{ provider.address }}</dd></dl></div>
    </div>
   </section>

   <section class="ly-detail-card" aria-label="货主评价"><div class="ly-detail-card-heading"><h2>货主评价</h2><button v-if="provider.reviews?.length" @click="$emit('reviews',provider)">查看全部<van-icon name="arrow"/></button></div><article v-for="review in provider.reviews?.slice(0,2)" :key="review.id" class="pd-review"><div><strong>货主评价</strong><span class="pd-review-stars">★ {{ review.score.toFixed(1) }}</span></div><small>{{ review.business }} · {{ review.date }}</small><p>{{ review.text }}</p></article><p v-if="!provider.reviews?.length" class="ly-detail-muted">暂无评价</p></section>
  </main>
  <footer class="ly-service-actions ly-detail-actions"><FavoriteButton :saved="favorite" :label="provider.name" @toggle="$emit('favorite',provider)"/><button class="primary" @click="$emit('contact',provider)">联系企业</button></footer>
 </section>
</template>
<script setup>
import { computed,ref } from 'vue'
import ServiceCard from './ServiceCard.vue'
import ProviderRating from './ProviderRating.vue'
import FavoriteButton from './FavoriteButton.vue'
import TransportIcon from './TransportIcon.vue'
const props=defineProps({provider:{type:Object,required:true},services:{type:Array,default:()=>[]},offers:{type:Array,default:()=>[]},modes:Array,favorite:Boolean})
defineEmits(['back','service','offer','reviews','favorite','contact'])
const showAll=ref(false)
const visibleServices=computed(()=>showAll.value?props.services:props.services.slice(0,2))
const transportModes=computed(()=>(props.provider.transportModes||[props.provider.mode]).map(key=>({key,label:props.modes.find(item=>item.key===key)?.label||key})))
// 优先使用企业声明的货物范围，未提供时沿用其已发布方案中的货物信息。
const cargoTypes=computed(()=>[...new Set((props.provider.cargoTypes || props.services.map(item=>item.cargo)).filter(Boolean))])
const routeCount=computed(()=>new Set(props.services.map(item=>item.originLabel+'→'+item.destinationLabel)).size)
const performanceMetrics=computed(()=>{
 const stats=props.provider.operatingStats
 if(!stats)return []
 const items=[]
 if(stats.completedOrders!=null)items.push({label:'累计承运',value:stats.completedOrders,unit:'单'})
 if(stats.volume){const match=String(stats.volume).match(/^([\d,.]+)(.*)$/);items.push({label:'承运量',value:match?match[1]:stats.volume,unit:match?match[2]:''})}
 return items
})
const qualificationItems=computed(()=>[...new Set([props.provider.verified?'企业已认证':null,...props.provider.credentials||[],...props.provider.assurances||[]].filter(Boolean))])
</script>
<style scoped>
/* 借鉴 Pixso 车队详情的蓝色身份卡、叠接内容区和双列信息，适配企业已有资料。 */
.pd-page{z-index:21;color:#333;background:linear-gradient(160deg,#dce5ff 0,#eef1fb 350px,#f3f5f9 600px)}
.pd-page .ly-service-nav{background:transparent}
.pd-page .ly-service-content{padding-top:8px}
.pd-hero{position:relative;padding:20px 18px 30px;border-radius:24px 12px 12px 12px;background:radial-gradient(ellipse at 0 0,rgba(158,181,255,.26),transparent 52%),linear-gradient(145deg,#1a2d73,#1836a2 55%,#344b96);color:#f4f6ff;border:1px solid rgba(255,255,255,.85);box-shadow:inset 0 1px 5px rgba(219,229,255,.35);margin-bottom:-12px}
.pd-identity{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pd-identity h2{font-size:20px;line-height:28px;font-weight:600;margin:0;overflow-wrap:anywhere}
.pd-logo{width:32px;height:32px;display:grid;place-items:center;background:#fff;border-radius:8px;flex:none}
.pd-logo img{width:100%;height:100%;object-fit:contain}
.pd-enterprise-kind{padding:3px 8px;border-radius:5px;background:#eef3ff;color:#254291;font-size:11px;line-height:16px;white-space:nowrap}
.pd-meta{display:flex;gap:12px;margin:7px 0 0;color:#c4d1fc;font-size:12px;line-height:18px}
.pd-meta>span{display:inline-flex;align-items:center;gap:3px}
.pd-specialty{font-size:12px;line-height:18px;color:#dce5ff;margin:6px 0 0}
.pd-hero-rating{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:9px;border-top:1px solid rgba(255,255,255,.18)}
.pd-hero-rating>span{color:#bdcaff;font-size:10px;line-height:16px;margin-left:auto}
.pd-hero-rating :deep(.ly-rating){color:#dce5ff;margin:0;padding:0;gap:5px;min-height:34px;font-size:11px}
.pd-hero-rating :deep(.ly-rating strong){color:#f4f6ff;font-size:28px;line-height:34px;font-weight:600}
.pd-hero-rating :deep(.ly-rating-stars){font-size:14px}
.pd-hero-rating :deep(.ly-rating>em){color:#dce5ff}
.pd-section{margin-bottom:12px}
.pd-section-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 9px}
.pd-section-heading h2{font-size:16px;line-height:24px;font-weight:600;margin:0}
.pd-section-heading small{font-size:10px;line-height:16px;color:#8a91a1;flex:none}
.pd-capabilities{position:relative;padding-top:18px;background:linear-gradient(180deg,#e5e9f6,rgba(243,245,249,0) 200px);border-top:1px solid #fff;border-radius:14px 14px 0 0;margin-left:-15px;margin-right:-15px;padding-left:15px;padding-right:15px}
.pd-section .ly-detail-card{background:linear-gradient(125deg,#f4f6ff,#fafbff);box-shadow:0 2px 7px rgba(15,45,155,.06);border:1px solid rgba(255,255,255,.8);border-radius:12px}
.pd-capability-overview{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;padding:14px}
.pd-capability-overview>div+div{border-left:1px solid #e7ebf7;padding-left:12px}
.pd-summary-heading{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:12px;line-height:18px;color:#647090}
.pd-summary-heading h3{font-size:13px;line-height:20px;font-weight:600;margin:0;color:#333}
.pd-summary-heading small{font-size:10px;line-height:16px;color:#8a91a1;flex:none}
.pd-route{display:flex;align-items:center;gap:7px;font-size:14px;line-height:21px;margin:10px 0 0;overflow-wrap:anywhere}
.pd-route>span{min-width:0}
.pd-route .van-icon{font-size:12px;color:#647090;flex:none}
.pd-more-routes{font-size:10px;color:#8a91a1;display:block;margin-top:4px}
.pd-goods{display:flex;flex-wrap:wrap;gap:4px 7px;margin-top:10px;font-size:13px;line-height:21px;color:#333}
.pd-summary-empty{margin:10px 0 0;font-size:12px;line-height:18px;color:#8a91a1}
.pd-capability-group{margin-top:0}
.pd-capability-group>p{margin:0 0 7px;font-size:12px;line-height:18px;color:#8a91a1}
.pd-capability-tags{display:flex;flex-wrap:wrap;gap:6px}
.pd-capability-tags>span{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;background:#edf1f7;color:#647090;font-size:12px;line-height:18px}
.pd-capability-tags>.pd-mode-tag{background:#e9eeff;color:#3a65ff}
.pd-mode-tag svg{width:15px;height:15px;flex:none}
.pd-cooperation{display:flex;gap:6px;align-items:center;background:#eef8f5;color:#668c7a;font-size:12px;line-height:20px;padding:8px 10px;border-radius:8px;margin:0 0 12px}
.pd-metrics{display:flex;align-items:flex-start;gap:0;margin:2px 0 14px;text-align:center}
.pd-metrics>div{flex:1;min-width:0}
.pd-metrics>div+div{border-left:1px solid #e1e6f3}
.pd-metrics strong{display:block;font-size:24px;line-height:32px;font-weight:600;color:#333;overflow-wrap:anywhere}
.pd-metrics strong small{font-size:12px;margin-left:3px;font-weight:400}
.pd-metrics>div>span{display:block;font-size:12px;line-height:18px;color:#8a91a1;margin-top:3px}
.pd-page .pd-cooperation-facts{margin-top:0;padding-top:12px;border-top:1px solid #e7ebf7;font-size:12px}
.pd-record-note{margin-bottom:0}
.pd-credentials{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 10px;list-style:none;padding:0;margin:0;font-size:12px;line-height:20px;color:#666}
.pd-credentials li{display:flex;gap:6px;align-items:flex-start}
.pd-credentials .van-icon{color:#19b88b;line-height:20px}
.pd-company-profile{margin-top:14px;padding-top:12px;border-top:1px solid #e7ebf7}
.pd-company-profile h3{margin:0;font-weight:500;color:#333}
.pd-services>.lh-home{background:none;padding:0;margin-top:12px}
.pd-services :deep(.ly-offer-card:last-child){margin-bottom:0}
.pd-services :deep(.lh-plan-footer){justify-content:space-between}
.pd-offers{margin-top:14px}
.pd-offers h3{font-weight:500}
.pd-offers .ly-list-row:last-child{border-bottom:0}
.pd-review{padding:12px 0;border-bottom:1px solid #edf0f5}
.pd-review:last-child{border-bottom:0;padding-bottom:0}
.pd-review>div{display:flex;justify-content:space-between;font-size:13px;line-height:20px}
.pd-review strong{font-weight:500}
.pd-review-stars{color:#b57416}
.pd-review small{display:block;font-size:11px;line-height:18px;color:#8a91a1;margin-top:3px}
.pd-review p,.pd-description{font-size:13px;line-height:21px;color:#666;margin:8px 0 0}
.pd-page button:focus-visible{outline:2px solid #3a65ff;outline-offset:2px}
</style>
