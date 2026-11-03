<template>
  <button type="button" class="lyhp-cargo-card" :style="{'--cargo-price-width':price.text.length>9?'130px':'90px'}" :aria-label="`${cargo.goods}${cargo.quantity}，${placeLabel(cargo.origin)}至${placeLabel(cargo.destination)}，查看货源`" @click="$emit('open',cargo)">
    <div class="lyhp-cargo-dates"><img v-if="score===96" :src="asset('match-score.png')" alt="匹配度96%"/><span v-else-if="score!=null" class="lyhp-cargo-match"><b>{{ score }}%</b><small>匹配度</small></span><span><b>{{ dateParts(cargo.loadDate)[0] }}</b>月<b>{{ dateParts(cargo.loadDate)[1] }}</b>日<small>装货</small></span><i></i><span><b>{{ dateParts(cargo.unloadDate)[0] }}</b>月<b>{{ dateParts(cargo.unloadDate)[1] }}</b>日<small>卸货</small></span></div>
    <div class="lyhp-cargo-body"><div class="lyhp-cargo-routes"><p v-for="(place,index) in [cargo.origin,cargo.destination]" :key="index"><i></i><b :title="placeLabel(place)">{{ placeLabel(place) }}</b><small v-if="distances[index]">{{ distances[index] }}</small></p></div><div class="lyhp-tags"><span>{{ cargoParticipationLabel(cargo) }}</span><span v-for="tag in tags" :key="tag">{{ tag }}</span></div><div class="lyhp-estimate"><small>{{ price.label }}</small><div><b>{{ price.text }}</b><span v-if="price.unit">{{ price.unit }}</span></div></div></div>
    <div class="lyhp-card-footer"><span><img :src="asset('publisher-logo.png')" alt=""/><span class="lyhp-cargo-publisher">{{ cargo.publisher.name }}</span></span><time>{{ cargo.publishLabel }}</time></div>
  </button>
</template>
<script setup>
import { computed } from 'vue'
import { cargoParticipationLabel } from './cargo-participation.js'
import { placeLabel,cargoDisplayTags } from './cargo-data.js'
const props=defineProps({cargo:{type:Object,required:true},match:Object,showEstimate:Boolean,distances:{type:Array,default:()=>[]}})
defineEmits(['open'])
const dateParts=date=>date.slice(5).split('-').map(Number)
const asset=name=>'/lianyun-mobile-assets/home-design/'+name
const score=computed(()=>props.match?.score??props.cargo.matchScore??null)
const tags=computed(()=>props.showEstimate?props.cargo.tags:cargoDisplayTags(props.cargo))
const price=computed(()=>{
 const cargo=props.cargo,estimate=props.showEstimate&&cargo.publishMode!=='抢单'?cargo.estimatedFreight:null
 const number=value=>Number(value).toLocaleString('zh-CN')
 if(estimate)return {label:'预计运价',text:number(estimate.min)+(estimate.max!==estimate.min?'—'+number(estimate.max):''),unit:estimate.unit}
 if(cargo.price.amount==null)return {label:cargo.price.label||'货主发布价',text:'面议',unit:''}
 return {label:cargo.publishMode==='抢单'?'货主定价':cargo.price.label,text:number(cargo.price.amount),unit:cargo.price.unit}
})
</script>
