<template>
  <section class="lyo-view" aria-label="运输方案选择">
    <header class="lyo-toolbar">
      <button type="button" aria-label="修改运输要求" @click="$emit('edit')"><img :src="asset('settings.svg')" alt=""/></button>
      <button type="button" aria-label="继续向至宝提问" @click="$emit('chat')"><img :src="asset('message.svg')" alt=""/></button>
      <div class="lyo-capsule"><img src="/lianyun-mobile-assets/scheme-detail/capsule.svg" alt="" aria-hidden="true"/><button type="button" aria-label="返回首页" @click="$emit('close')"/></div>
    </header>
    <button type="button" class="lyo-route" aria-label="修改运输需求" @click="$emit('edit')"><span :title="demand.origin">{{ demand.origin }}</span><img :src="asset('route-arrow.svg')" alt="到"/><span :title="demand.destination">{{ demand.destination }}</span><img :src="asset('route-expand.svg')" alt=""/></button>
    <h1 class="lyo-title">至宝提供了 <strong>{{ schemes.length }}</strong> 套运输方案<img :src="asset('count-accent.svg')" alt=""/></h1>
    <p class="lyo-recommendation">建议优先选「{{ recommended.name }}」<br/>预计全程{{ recommended.duration }}，{{ recommended.transfers ? recommended.transfers+'次交接' : '无需转换' }}。</p>
    <section ref="carousel" class="lyo-carousel" aria-label="左右切换运输方案" aria-roledescription="轮播" @pointerdown="beginSwipe" @pointermove="moveSwipe" @pointerup="endSwipe" @pointercancel="cancelSwipe" @click.capture="ignoreSwipeClick" @keydown="onKey">
      <button v-for="(scheme,index) in schemes" :key="scheme.id" type="button" class="lyo-card" :class="positionClass(index)" :style="index===activeIndex ? {'--drag-x':dragX+'px'} : undefined" :aria-label="'方案'+(index+1)+'，'+scheme.name+'，查看详情'" :aria-hidden="positionClass(index)==='lyo-card-hidden' ? true : undefined" :tabindex="index===activeIndex ? 0 : -1" @click="$emit('open',scheme.id)">
        <div class="lyo-card-map"><AssistantResultMap :scheme="scheme" card-preview/></div>
        <span class="lyo-card-badge">{{ scheme.label }}</span>
        <span class="lyo-view-detail">查看详情</span>
        <h2>{{ scheme.name }}</h2><span class="lyo-mode">{{ scheme.mode==='multi' ? scheme.name : modeLabels[scheme.mode]+'运输' }}</span>
        <div class="lyo-card-facts"><span>时效{{ scheme.duration }}</span><i/><span>{{ priceBasis(scheme) }}</span></div>
        <p class="lyo-card-price"><small v-if="scheme.priceKnown">¥</small><strong>{{ priceText(scheme).replace(/^¥/,'') }}</strong><small>参考价</small></p>
      </button>
    </section>
    <button type="button" class="lyo-carousel-arrow lyo-carousel-previous" aria-label="上一个方案" :disabled="schemes.length<2" @click="select(activeIndex-1)"><van-icon name="arrow-left"/></button>
    <button type="button" class="lyo-carousel-arrow lyo-carousel-next" aria-label="下一个方案" :disabled="schemes.length<2" @click="select(activeIndex+1)"><van-icon name="arrow"/></button>
    <nav class="lyo-dots" aria-label="方案页码"><button v-for="(scheme,index) in schemes" :key="scheme.id" type="button" :aria-label="'切换到方案'+(index+1)+'，'+scheme.name" :aria-current="index===activeIndex ? 'true' : undefined" @click="select(index)"/></nav>
    <p class="lyo-sr-only" role="status" aria-live="polite">当前方案{{ activeIndex+1 }}，共{{ schemes.length }}个：{{ selected.name }}</p>
    <form class="lyo-composer" @submit.prevent="sendQuestion">
      <button type="button" class="lyo-keyboard" aria-label="输入问题" @click="questionInput?.focus()"><img :src="asset('keyboard.svg')" alt=""/></button>
      <input ref="questionInput" v-model="question" aria-label="继续向至宝提问" placeholder="继续向至宝提问" maxlength="500"/>
      <button type="submit" class="lyo-send" aria-label="发送问题" :disabled="!question.trim()"><img v-if="!question.trim()" :src="asset('send.svg')" alt=""/><img v-else :src="asset('send-arrow.svg')" alt=""/></button>
    </form>
    <p class="lyo-ai-note">内容由AI生成，仅供参考</p><i class="lyo-home-indicator" aria-hidden="true"/>
  </section>
</template>
<script setup>
import { computed, nextTick, ref } from 'vue'
import AssistantResultMap from './AssistantResultMap.vue'
import { modeLabels } from './assistant-data.js'
import './transport-scheme-overview.css'
const props=defineProps({schemes:{type:Array,required:true},selectedId:String,recommendedId:String,demand:{type:Object,required:true},priceText:{type:Function,required:true}})
const emit=defineEmits(['select','open','edit','chat','question','close'])
const asset=name=>'/lianyun-mobile-assets/scheme-overview/'+name
const activeIndex=computed(()=>Math.max(0,props.schemes.findIndex(item=>item.id===props.selectedId)))
const selected=computed(()=>props.schemes[activeIndex.value])
const recommended=computed(()=>props.schemes.find(item=>item.id===props.recommendedId)||props.schemes[0])
const carousel=ref(null),questionInput=ref(null),question=ref(''),dragX=ref(0)
let swipeStart=null,suppressClickUntil=0
function positionClass(index){const relative=(index-activeIndex.value+props.schemes.length)%props.schemes.length;return relative===0?'lyo-card-active':relative===1?'lyo-card-next':relative===props.schemes.length-1?'lyo-card-previous':'lyo-card-hidden'}
function select(index){const count=props.schemes.length;if(count>1)emit('select',props.schemes[(index+count)%count].id)}
function beginSwipe(event){if(event.isPrimary===false||event.button!==0)return;swipeStart={x:event.clientX,y:event.clientY,id:event.pointerId}}
function moveSwipe(event){if(!swipeStart||event.pointerId!==swipeStart.id)return;const x=event.clientX-swipeStart.x,y=event.clientY-swipeStart.y;if(Math.abs(x)>8&&Math.abs(x)>Math.abs(y)){carousel.value?.setPointerCapture(event.pointerId);dragX.value=Math.max(-45,Math.min(45,x*.35))}}
function endSwipe(event){if(!swipeStart)return;const x=event.clientX-swipeStart.x,y=event.clientY-swipeStart.y;if(Math.abs(x)>35&&Math.abs(x)>Math.abs(y)){select(activeIndex.value+(x<0?1:-1));suppressClickUntil=Date.now()+350}cancelSwipe()}
function cancelSwipe(){swipeStart=null;dragX.value=0}
function ignoreSwipeClick(event){if(Date.now()<suppressClickUntil){event.preventDefault();event.stopPropagation()}}
function onKey(event){const offset=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(!offset)return;event.preventDefault();select(activeIndex.value+offset);nextTick(()=>carousel.value?.querySelector('.lyo-card-active')?.focus())}
function priceBasis(scheme){if(!scheme.priceKnown)return '费用需询价确认';return scheme.priceAssumed?'按 '+props.demand.equipment+' '+props.demand.goods+'箱计价':'按 '+props.demand.quantity+' 箱估算总额'}
function sendQuestion(){const text=question.value.trim();if(text){emit('question',text);question.value=''}}
</script>
