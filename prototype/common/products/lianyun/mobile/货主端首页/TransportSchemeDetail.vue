<template>
  <section class="lyd-view" aria-label="运输方案详情">
    <header class="lyd-toolbar">
      <button class="lyd-route" aria-label="修改运输需求" @click="$emit('edit')"><span :title="demand.origin">{{ demand.origin }}</span><i>→</i><span :title="demand.destination">{{ demand.destination }}</span><van-icon name="arrow-down"/></button>
      <button class="lyd-settings" aria-label="修改运输要求" @click="$emit('edit')"><img :src="assetRoot+'settings.svg'" alt=""/></button>
      <div class="lyd-capsule"><img :src="assetRoot+'capsule.svg'" alt="" aria-hidden="true"/><button class="lyd-exit" aria-label="返回首页" title="返回首页" @click="$emit('close')"/></div>
    </header>
    <nav class="lyd-tabs" role="tablist" aria-label="运输方案切换">
      <button v-for="(item,index) in schemes" :id="'plan-tab-'+item.id" :ref="el => tabButtons[index] = el" :key="item.id" role="tab" :aria-label="'方案'+(index+1)+'，'+item.name" :aria-selected="scheme.id === item.id" aria-controls="result-details" :tabindex="scheme.id === item.id ? 0 : -1" :class="{active:scheme.id === item.id}" @click="$emit('select',item.id)" @keydown="onTabKey($event,index)">方案{{ numerals[index] || index+1 }}</button>
    </nav>
    <div ref="content" class="lyd-content">
      <article id="result-details" class="lyd-panel" role="tabpanel" :aria-labelledby="'plan-tab-'+scheme.id">
        <div class="lyd-summary">
          <div class="lyd-title"><h2>{{ scheme.name }}</h2><span class="lyd-preference">{{ scheme.label }}</span></div>
          <button type="button" class="lyd-panel-close" aria-label="返回方案选择" @click="$emit('overview')"/>
          <div class="lyd-tags"><span>{{ priceText }}{{ scheme.priceKnown ? scheme.priceAssumed ? '／箱' : ' 总额' : '' }}</span><span>{{ scheme.transfers ? scheme.transfers+'次转换' : '无需转换' }}</span><span>{{ scheme.delivery }}</span></div>
          <section class="lyd-recommendation" :aria-label="scheme.id === recommendedId ? '推荐理由' : '方案特点'">
            <h3>{{ scheme.id === recommendedId ? '推荐理由' : '方案特点' }}</h3>
            <p class="lyd-explanation">{{ explanation }}</p>
            <p class="lyd-policy"><strong>政策补贴</strong><span>待核实，参考费用未扣补贴。</span></p>
          </section>
          <dl class="lyd-metrics"><div><dt>{{ scheme.priceAssumed ? '参考价' : '参考总额' }}</dt><dd class="lyd-price"><small v-if="priceText?.startsWith('¥')" class="lyd-currency">¥</small>{{ metricPrice }}</dd></div><div><dt>总里程</dt><dd>{{ scheme.km.toLocaleString() }}<small>km</small></dd></div><div><dt>时效</dt><dd class="lyd-time">{{ durationParts.value }}<small>{{ durationParts.unit }}</small></dd></div></dl>
        </div>
        <div ref="mapArea" class="lyd-map-pane"><AssistantResultMap :scheme="scheme" :selected="focusedSegment"/></div>
        <ol class="lyd-segments" aria-label="分段运输">
          <li v-for="(segment,index) in scheme.segments" :key="index"><button :aria-label="'查看第'+(index+1)+'段地图：'+segment.from+'至'+segment.to" :aria-pressed="focusedSegment === index" @click="focusSegment(index)">
            <div class="lyd-segment-heading"><strong><span :title="segment.from">{{ segment.from }}</span><img class="lyd-segment-arrow" :src="assetRoot+'segment-arrow.svg'" alt=""/><span :title="segment.to">{{ segment.to }}</span></strong><img v-if="modeIcons[segment.mode]" :src="assetRoot+modeIcons[segment.mode]" :alt="modeLabels[segment.mode]"/><span v-else class="lyd-mode-air">{{ modeLabels[segment.mode] }}</span></div>
            <p class="lyd-segment-facts">时效{{ durationLabel(segment.hours) }}<i/>里程 {{ segment.km.toLocaleString() }}km</p><p class="lyd-segment-note">{{ segment.note }}</p>
          </button></li>
        </ol>
      </article>
    </div>
    <footer class="lyd-actions"><slot name="actions"/><i class="lyd-home-indicator" aria-hidden="true"/></footer>
  </section>
</template>
<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AssistantResultMap from './AssistantResultMap.vue'
import { modeLabels } from './assistant-data.js'
import { durationLabel } from './assistant-engine.js'
import './transport-scheme-detail.css'
const props = defineProps({scheme:{type:Object,required:true},schemes:{type:Array,required:true},demand:{type:Object,required:true},recommendedId:String,priceText:String,explanation:String,focusedSegment:{type:Number,default:-1}})
const emit = defineEmits(['select','edit','segment','close','overview'])
const content = ref(null), mapArea = ref(null), tabButtons = ref([])
const assetRoot = '/lianyun-mobile-assets/scheme-detail/'
const metricPrice = computed(() => props.priceText?.replace(/^¥/,'') || '')
const durationParts = computed(() => {const match = props.scheme.duration.match(/^(.*?)(小时|天)$/);return {value:match ? match[1] : props.scheme.duration,unit:match?.[2] || ''}})
const modeIcons = {road:'mode-road.svg',rail:'mode-rail.svg',water:'mode-water.svg'}
const numerals = ['一','二','三','四','五','六']
function focusSegment(index) {
  emit('segment',index)
  if(content.value && mapArea.value) content.value.scrollTo({top:content.value.scrollTop+mapArea.value.getBoundingClientRect().top-content.value.getBoundingClientRect().top-8,behavior:'smooth'})
}
async function onTabKey(event,index) {
  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if(!offset && !['Home','End'].includes(event.key)) return
  event.preventDefault()
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? props.schemes.length-1 : (index+offset+props.schemes.length)%props.schemes.length
  emit('select',props.schemes[target].id)
  await nextTick(); tabButtons.value[target]?.focus()
}
watch(() => props.scheme.id,async () => {if(content.value) content.value.scrollTop = 0;await nextTick();tabButtons.value[props.schemes.findIndex(item => item.id === props.scheme.id)]?.scrollIntoView({block:'nearest',inline:'nearest'})})
</script>
