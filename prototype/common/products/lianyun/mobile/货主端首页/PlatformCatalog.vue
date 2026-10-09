<template>
  <section class="ly-service-page ly-platform-page" aria-label="物流服务目录">
    <header class="ly-service-nav"><button aria-label="返回" @click="back"><van-icon name="arrow-left"/></button><h1>{{ title }}</h1><span/></header>
    <main class="ly-service-content">
      <template v-if="selected">
        <section class="ly-detail-card"><div class="ly-tags"><span v-for="tag in selected.tags" :key="tag">{{ tag }}</span></div><h2 class="ly-catalog-title">{{ selected.name }}</h2><dl><template v-for="fact in selected.facts" :key="fact[0]"><dt>{{ fact[0] }}</dt><dd>{{ fact[1] }}</dd></template></dl></section>
        <section class="ly-detail-card"><h2>服务说明</h2><p class="ly-detail-muted">{{ selected.note }}</p></section>
        <section class="ly-detail-card"><h2>物流企业</h2><button class="ly-list-row" @click="$emit('provider',provider(selected.providerId))"><span><strong>{{ provider(selected.providerId).name }}</strong><small>{{ provider(selected.providerId).specialty }}</small></span><van-icon name="arrow"/></button></section>
      </template>
      <template v-else-if="guide">
        <section class="ly-detail-card"><small class="ly-detail-muted">发货指南</small><h2>{{ guide.title }}</h2><ol class="ly-guide-steps"><li v-for="step in guide.steps" :key="step[0]"><h3>{{ step[0] }}</h3><p>{{ step[1] }}</p></li></ol><p class="ly-detail-muted">{{ guide.note }}</p></section>
      </template>
      <template v-else-if="category==='guides'">
        <section class="ly-detail-card"><button v-for="item in guides" :key="item.id" class="ly-list-row" @click="guide=item"><span><strong>{{ item.title }}</strong><small>发货准备与费用核对</small></span><van-icon name="arrow"/></button></section>
      </template>
      <template v-else>
        <div class="ly-filters" aria-label="服务分类"><button v-for="item in serviceCategories.filter(item=>item.id!=='transport')" :key="item.id" :class="{active:category===item.id}" @click="category=item.id">{{ item.name }}</button></div>
        <section v-if="category==='air'" class="ly-detail-card"><h2>小件配送，先确认服务条件</h2><p class="ly-detail-muted">适用于指定服务点之间的小件配送。起降点、货物重量尺寸、可用航段及天气条件均需核验，不支持任意地点即时发运。</p></section>
        <label class="ly-catalog-filter">服务地区<select v-model="region"><option v-for="item in browsingRegions" :key="item">{{ item }}</option></select></label>
        <article v-for="offer in offers" :key="offer.id" class="ly-detail-card">
          <button class="ly-catalog-open" @click="selected=offer"><small>{{ offer.city }} · 按需询价</small><h2>{{ offer.name }}</h2><div class="ly-tags"><span v-for="tag in offer.tags" :key="tag">{{ tag }}</span></div><p>{{ offer.facts[2][1] }}</p><footer>{{ provider(offer.providerId).name }}<span>查看服务 ›</span></footer></button>
        </article>
        <div v-if="!offers.length" class="ly-empty"><van-icon name="search"/><p>当前地区暂无此类服务</p><button class="ly-text-button" @click="region='全国'">查看全国服务</button></div>
      </template>
    </main>
    <footer v-if="selected" class="ly-service-actions"><button @click="$emit('provider',provider(selected.providerId))">了解企业</button><button class="primary" @click="$emit('request',selected)">提交服务需求</button></footer>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import { browsingRegions, catalogOffers, guides, serviceCategories } from './platform-data.js'
import { providers } from './mock-data.js'
const props=defineProps({initialCategory:String,initialOffer:String,initialGuide:String,initialRegion:{type:String,default:'全国'}})
const emit=defineEmits(['back','provider','request'])
const category=ref(props.initialCategory || 'warehouse'), region=ref(props.initialRegion)
const selected=ref(catalogOffers.find(item=>item.id===props.initialOffer) || null)
const guide=ref(guides.find(item=>item.id===props.initialGuide) || null)
const offers=computed(()=>catalogOffers.filter(item=>(category.value==='more' || item.category===category.value) && (region.value==='全国' || item.city===region.value)))
const title=computed(()=>selected.value?'服务详情':guide.value||category.value==='guides'?'发货指南':'物流服务')
const provider=id=>providers.find(item=>item.id===id)
function back(){if(selected.value){if(props.initialOffer)emit('back');else selected.value=null}else if(guide.value){if(props.initialGuide)emit('back');else guide.value=null}else emit('back')}
</script>
