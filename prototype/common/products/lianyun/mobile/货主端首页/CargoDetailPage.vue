<template>
  <section class="lc-page cgd-page" aria-label="货源详情">
    <header v-show="!flowOpen" class="cgd-nav"><button aria-label="返回货源列表" @click="$emit('back')"><van-icon name="arrow-left"/></button><div class="cgd-capsule" aria-hidden="true"><b>•••</b><span>◎</span></div></header>
    <main v-show="!flowOpen" class="cgd-scroll">
      <section class="cgd-map" aria-label="装卸地点设计示意图"><div v-for="(place,index) in [cargo.origin,cargo.destination]" :key="index" :class="['cgd-map-pin',{end:index===1}]"><span><b>{{ index?'终':'起' }}</b>{{ [place.city,place.district].filter(Boolean).join('·') }}</span><i/></div><i class="cgd-location-dot" aria-hidden="true"/></section>
      <section class="cgd-sheet">
        <div class="cgd-status"><img src="/lianyun-mobile-assets/cargo-quote/quote-status.png" alt=""/><div><h1>{{ isGrab?grabStateLabels[state]:quote?'已提交报价':'等待报价' }}</h1><p>{{ isGrab?(grabRecord?formatTime(grabRecord.submittedAt)+' 抢单成功':cargo.deadline+' 抢单截止'):quote?formatTime(quote.submittedAt)+' 完成报价':cargo.deadline+' 截止' }}</p></div></div>
        <section class="cgd-card cgd-core" aria-label="货品与装卸时间"><div class="cgd-between"><h2>{{ cargo.goods }} <b>{{ cargo.quantity }}</b></h2><strong class="cgd-price">{{ cargo.price.amount!=null?'¥'+cargo.price.amount.toLocaleString('zh-CN'):'面议' }}<small v-if="cargo.price.amount!=null">{{ cargo.price.unit }}</small></strong></div><div class="cgd-dates"><div><strong>{{ dateLabel(cargo.loadDate) }}</strong><p>预计装货（{{ weekdayLabel(cargo.loadDate) }}）</p></div><span>共 {{ days }} 天</span><div><strong>{{ dateLabel(cargo.unloadDate) }}</strong><p>预计卸货（{{ weekdayLabel(cargo.unloadDate) }}）</p></div></div><div class="cgd-tags"><span class="cgd-tag" :class="{'cgd-mode-grab':isGrab}">{{ isGrab?'抢单货源':'报价货源' }}</span><span v-if="cargo.businessType" class="cgd-tag cgd-tag-teal">{{ cargo.businessType }}</span><span v-for="row in cargoPublishedRequirements(cargo).slice(0,3)" :key="row[0]" class="cgd-tag">{{ row[1] }}</span></div></section>
        <section v-if="isGrab" class="cgd-card"><h2 class="cgr-detail-title">货主定价与费用范围</h2><p class="cgr-detail-terms">{{ cargo.fees }}</p><p class="cgr-detail-terms">支付方式：{{ cargo.payment }}</p><p class="cgr-detail-terms">抢单成功即确定承运商，进入待执行。</p></section><CargoPlaces :cargo="cargo"/>
        <section class="cgd-card"><dl class="cgd-facts"><dt>货源号</dt><dd>{{ cargo.number }} <button class="cgd-copy" aria-label="复制货源号" @click="copyNumber"><van-icon name="description-o"/></button></dd><dt>发布企业</dt><dd><button class="cgd-text-button" @click="info='company'">{{ cargo.publisher.name }}</button></dd><dt>发布联系人</dt><dd>{{ cargo.publisher.contact }}（{{ cargo.publisher.phone }}）</dd><dt>发布时间</dt><dd>{{ cargo.publishedAt }}</dd></dl></section>
      </section>
    </main>
    <footer v-show="!flowOpen" class="cgd-actions"><button class="cgd-contact" @click="info='contact'">联系货主</button><button class="cgd-primary" @click="isGrab?grabOpen=true:quoteOpen=true">{{ isGrab?(state==='won'?'查看抢单详情':state==='ready'?'立即抢单':'查看状态'):quote?'查看我的报价':'提交报价' }}</button></footer>
    <CargoGrabFlow v-if="grabOpen" :cargo="cargo" @close="grabOpen=false" @browse="$emit('browse')"/><CargoQuoteFlow v-if="quoteOpen&&!isGrab" :cargo="cargo" :existing="quote" :teleport="teleport" @close="quoteOpen=false"/>
    <van-popup :show="!!info" position="bottom" round :teleport="teleport" :z-index="95" :style="{position:'absolute'}" :overlay-style="{position:'absolute'}" @update:show="value=>{if(!value)info=''}"><div class="cgd-contact-sheet"><div class="cgd-between"><h2>{{ info==='company'?'发布企业':'联系货主' }}</h2><button aria-label="关闭企业信息" @click="info=''"><van-icon name="cross"/></button></div><strong>{{ cargo.publisher.name }}</strong><dl class="cgd-facts"><dt>联系人</dt><dd>{{ cargo.publisher.contact }}</dd><dt>联系电话</dt><dd>{{ cargo.publisher.phone }}</dd></dl></div></van-popup>
  </section>
</template>
<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { showToast } from 'vant'
import CargoGrabFlow from './CargoGrabFlow.vue'
import { isGrabCargo,grabState,grabStateLabels } from './cargo-grab-model.js'
import { cargoGrabStore } from './cargo-grab-store.js'
import CargoQuoteFlow from './CargoQuoteFlow.vue'
import CargoPlaces from './CargoPlaces.vue'
import { cargoPublishedRequirements, dateLabel } from './cargo-data.js'
import { cargoStore } from './cargo-store.js'
const props=defineProps({cargo:{type:Object,required:true},teleport:Object})
defineEmits(['back','browse'])
const quoteOpen=ref(false),grabOpen=ref(false),info=ref(''),now=ref(Date.now())
const timer=setInterval(()=>{now.value=Date.now()},1000);onUnmounted(()=>clearInterval(timer))
const isGrab=computed(()=>isGrabCargo(props.cargo)),flowOpen=computed(()=>quoteOpen.value||grabOpen.value)
const grabRecord=computed(()=>cargoGrabStore.records.find(row=>row.cargoId===props.cargo.id))
const state=computed(()=>grabState(props.cargo,grabRecord.value,now.value))
const quote=computed(()=>cargoStore.quotes.find(item=>item.cargoId===props.cargo.id))
const days=computed(()=>Math.max(0,Math.round((Date.parse(props.cargo.unloadDate)-Date.parse(props.cargo.loadDate))/86400000)))
function weekdayLabel(date){return ['周日','周一','周二','周三','周四','周五','周六'][new Date(`${date}T12:00:00`).getDay()]}
function formatTime(time){return new Date(time).toLocaleString('zh-CN',{hour12:false})}
async function copyNumber(){try{await navigator.clipboard.writeText(props.cargo.number);showToast({message:'货源号已复制',teleport:props.teleport})}catch{showToast({message:props.cargo.number,teleport:props.teleport})}}
</script>
<style src="./cargo-ui.css"></style>
<style src="./cargo-detail-design.css"></style>
<style src="./cargo-grab.css"></style>
