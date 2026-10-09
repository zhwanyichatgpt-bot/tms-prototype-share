<template>
 <section class="ly-service-page ly-detail-page sd-page" aria-label="运输方案详情">
  <header class="ly-service-nav"><button aria-label="返回运输方案列表" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>运输方案详情</h1><span/></header>
  <main class="ly-service-content">
   <section class="sd-map-hero" aria-label="运输路线地图"><AssistantRouteMap :scheme="route" transfer-labels :selected="selected" :expanded="expanded" @select="selected=$event" @expand="expanded=!expanded"/></section>
   <section class="ly-detail-card sd-route-card" aria-label="全流程路线">
    <div class="sd-flow">
     <div v-for="(node,index) in flowNodes" :key="index" class="sd-flow-node">
      <span class="sd-address-badge" :class="{'sd-address-end':index===flowNodes.length-1}">{{ index===0?'起':index===flowNodes.length-1?'终':'转' }}</span>
      <div><strong>{{ node.label }}</strong><p v-if="node.detail">{{ node.detail }}</p><div v-if="node.outgoing" class="sd-flow-leg"><i :style="{background:modeColors[node.outgoing.mode]}"/>{{ modeNames[node.outgoing.mode] || node.outgoing.mode }}<span>{{ node.outgoing.duration || '时效待确认' }}</span></div></div>
     </div>
    </div>
    <p v-if="service.summary" class="sd-route-summary">{{ service.summary }}</p>
   </section>

   <section class="ly-detail-card sd-main" aria-label="方案详情信息">
    <dl class="sd-facts">
     <dt>运输方式</dt><dd>{{ service.mode==='multi'?combination:mode.label }}</dd>
     <dt>适用货物</dt><dd>{{ service.cargo }}</dd>
     <template v-if="boxType"><dt>箱型</dt><dd>{{ boxType }}</dd></template>
     <template v-if="service.minimumShipment"><dt>起运量</dt><dd>{{ service.minimumShipment }}</dd></template>
     <dt>全程时效</dt><dd>{{ duration }}</dd>
     <dt>参考运价</dt><dd class="sd-fact-price">{{ priceParts?'¥'+priceParts[1]+priceParts[2]:'询价' }}</dd>
     <dt>发运安排</dt><dd>{{ service.dispatchPlan || arrangement.title }}</dd>
     <dt>交付方式</dt><dd>{{ service.coverage || '交付范围待确认' }}</dd>
     <template v-if="detailTags.length"><dt>服务特色</dt><dd>{{ detailTags.join('、') }}</dd></template>
     <template v-if="service.recentOrders"><dt>近30天成交</dt><dd>{{ service.recentOrders }} 单</dd></template>
    </dl>
    <p class="sd-detail-note">{{ service.dispatchNote || arrangement.text }}<br>{{ priceParts?'参考运价，最终报价按货物与服务确认':service.inquiryLabel || '按货物及交付要求确认报价' }}</p>
   </section>

   <section class="ly-detail-card" aria-label="承运与服务说明">
    <h2>承运与服务说明</h2>
    <dl><template v-for="row in conditions" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></template><dt>包含服务</dt><dd>{{ includedServices }}</dd><dt>费用边界</dt><dd>{{ service.feeBoundary || '包含项目与附加费用需询价确认' }}</dd><dt>时效起算</dt><dd>{{ service.durationBasis || '起算节点与预计到达时间需在发运前确认' }}</dd></dl>
    <details class="sd-notes"><summary>交接注意事项<van-icon name="arrow-down"/></summary><p>{{ arrangement.check }}</p></details>
   </section>

   <section class="ly-detail-card ly-logistics-company" aria-label="承运企业">
    <div class="ly-detail-card-heading"><h2>承运企业</h2><button @click="$emit('provider',provider)">企业详情<van-icon name="arrow"/></button></div>
    <div class="ly-company-identity"><span class="ly-company-avatar" aria-hidden="true">{{ provider.name.slice(0,2) }}</span><div><button class="ly-company-name" @click="$emit('provider',provider)">{{ provider.name }}</button><p class="sd-company-meta">{{ provider.city || provider.area }}<span v-if="provider.verified"><van-icon name="passed"/>认证企业</span></p></div></div>
    <div class="sd-rating"><span>企业服务评分</span><ProviderRating :provider="provider" compact stars @open="$emit('reviews',$event)"/></div>
    <dl class="ly-company-facts"><dt>主营业务</dt><dd>{{ provider.specialty }}</dd><dt>服务区域</dt><dd>{{ provider.area }}</dd></dl>
   </section>
  </main>
  <footer class="ly-service-actions ly-detail-actions"><FavoriteButton :saved="favorite" :label="service.originLabel+'至'+service.destinationLabel+'方案'" @toggle="$emit('favorite',service)"/><button class="primary" @click="$emit('inquiry',service)">按此方案询价</button></footer>
 </section>
</template>
<script setup>
import { computed,ref } from 'vue'
import AssistantRouteMap from './AssistantRouteMap.vue'
import ProviderRating from './ProviderRating.vue'
import FavoriteButton from './FavoriteButton.vue'
import { serviceRoute,transferDescription } from './service-routes.js'
const props=defineProps({service:Object,provider:Object,mode:Object,favorite:Boolean})
defineEmits(['back','provider','reviews','inquiry','favorite'])
const route=computed(()=>serviceRoute(props.service))
const selected=ref(0),expanded=ref(false)
const priceParts=computed(()=>String(props.service.price||'').match(/^(\d[\d,.]*)元(.*)$/))
const duration=computed(()=>/询价|确认/.test(props.service.duration||'')?'时效待确认':props.service.duration||'时效待确认')
const modeNames={road:'公路',water:'水路',rail:'铁路',air:'低空'}
const modeColors={road:'#19b88b',water:'#3977ef',rail:'#748292',air:'#8a7de2'}
const flowNodes=computed(()=>{
 const segments=route.value.segments || []
 const originDetail=props.service.originScope || (props.service.coverage?.startsWith('门')?'约定装货地点上门提货':'按约定起运节点交接')
 const destinationDetail=props.service.destinationScope || (props.service.coverage?.endsWith('门')?'约定收货地点配送交接':'按约定目的节点交接')
 if(!segments.length)return [{label:props.service.originLabel,detail:originDetail},{label:props.service.destinationLabel,detail:destinationDetail}]
 return [{label:segments[0].from,detail:originDetail,outgoing:segments[0]},...segments.map((segment,index)=>({label:segment.to,detail:index===segments.length-1?destinationDetail:transferDescription(segment.mode,segments[index+1].mode),outgoing:segments[index+1]}))]
})
const combination=computed(()=>{
 const modes=[...new Set((route.value.segments||[]).map(item=>item.mode))]
 const ordered=modes
 if(ordered.length===1 && ordered[0]==='water' && route.value.segments.length>1)return '水水联运'
 return ordered.map(mode=>({road:'公',rail:'铁',water:'水',air:'空'}[mode])).join('')+'联运'
})
const boxType=computed(()=>props.service.boxType || [...new Set(props.service.condition?.match(/(?:20|40|45)(?:GP|HQ|HC)/g)||[])].join(' / '))
const detailTags=computed(()=>[...new Set((props.service.tags||[]).filter(tag=>tag && tag!==props.service.coverage && tag!==combination.value && tag!==boxType.value && !/^(?:20|40|45)(?:GP|HQ|HC)$/.test(tag)))])
const includedServices=computed(()=>props.service.includedServices?.join('、') || [props.service.coverage?.startsWith('门')?'起点提货':'起点节点交接',props.service.mode==='multi'?'分段运输及中转衔接':'约定干线运输',props.service.coverage?.endsWith('门')?'目的地配送':'目的节点交接'].join('、'))
// 按方案已有资料展示承运条件，缺失项保持待确认，不推定班期、箱型或可订运力。
const conditions=computed(()=>{
 const service=props.service
 return ({
  road:[['适用车型',service.vehicleType||'按货量匹配，需确认']],
  water:[['装载限制',service.loadLimit||'箱型与单箱载重需确认']],
  rail:[['装载限制',service.loadLimit||'箱型与装载条件需确认']],
  multi:[['装载限制',service.loadLimit||(boxType.value ? '单箱载重、单件尺寸及特殊货物需核验' : '箱型与各段装载条件需确认')]],
  air:[['载重尺寸',service.loadLimit||'重量、尺寸需核验']]
 }[service.mode]||[])

})
const arrangement=computed(()=>({
 road:{title:'预约发运',text:'提供装货日期与货量，由企业确认车辆及提送时间。',check:'请提供单件重量与尺寸，并确认装卸设备、进场要求和收货窗口。'},
 water:{title:'航次与集港时间待确认',text:'由企业确认船期、截单及集港要求，班期不代表可订舱位。',check:'确认进港资料、码头交接要求及两端接驳范围。'},
 rail:{title:'班列与进站安排待确认',text:'由企业确认办理站、发运批次与进站交接时间。',check:'确认进站资料、交箱凭证及到站提货要求。'},
 multi:{title:'分段发运与衔接待确认',text:'由服务企业核对各段运力、换装节点及两端接驳安排。',check:'确认各段承接主体、交接凭证与异常衔接责任。'},
 air:{title:'预约及运行条件核验',text:'核对货物、起降点和天气条件后，再确认承接与发运时间。',check:'确认货物包装、交付点及天气变化后的交接安排。'}
}[props.service.mode]||{title:'发运安排待确认',text:'由服务企业确认发运与交付时间。',check:'发运前确认货物条件、交付范围、费用及时间。'}))
</script>

<style scoped>
/* 沿用智运详情的白卡、12px圆角、14px内边距、蓝色价格和8px按钮圆角。 */
.sd-page{color:#333}
.sd-map-hero{margin:-12px -15px 12px}
.sd-map-hero :deep(.lya-real-map){margin:0;border:0;border-radius:0}
.sd-page .ly-service-nav h1{font-size:17px}
/* 路线先呈现，其他信息沿用货源详情的左右字段列表。 */
.sd-flow-node{position:relative;display:flex;align-items:flex-start;gap:12px;padding-bottom:16px}
.sd-flow-node:last-child{padding-bottom:0}
.sd-flow-node:not(:last-child):after{content:'';position:absolute;left:8px;top:25px;bottom:5px;border-left:1px dashed #d4d8e2}
.sd-address-badge{width:18px;height:18px;margin-top:2px;flex:none;display:grid;place-items:center;border-radius:4px;background:#e1e4ec;color:#3a4564;font-size:10px;font-weight:600}
.sd-address-end{background:#3a65ff;color:#fff}
.sd-flow-node>div{min-width:0;flex:1}
.sd-flow-node strong{font-size:14px;line-height:21px;font-weight:500;color:#333}
.sd-flow-node p{margin:3px 0 0;font-size:12px;line-height:18px;color:#999}
.sd-flow-leg{display:flex;align-items:center;gap:6px;margin-top:7px;font-size:12px;line-height:18px;color:#80899d}
.sd-flow-leg i{width:12px;height:3px;border-radius:2px;flex:none}
.sd-flow-leg>span{margin-left:4px}
.sd-route-summary,.sd-detail-note{margin:14px 0 0;padding:10px 12px;border-radius:8px;background:#f8f8fb;color:#666;font-size:12px;line-height:20px}
.sd-page .sd-facts{margin:0}
.sd-page .sd-fact-price{color:#3a65ff}
.sd-detail-note{color:#999}
.sd-notes{margin-top:14px;padding:10px;border-radius:8px;background:#f8f8fb;font-size:12px;line-height:20px;color:#666}
.sd-notes summary{display:flex;justify-content:space-between;align-items:center;cursor:pointer;list-style:none;min-height:24px}
.sd-notes summary::-webkit-details-marker{display:none}
.sd-notes[open] summary .van-icon{transform:rotate(180deg)}
.sd-notes p{margin:8px 0 0;color:#8a91a1}
.sd-page .ly-company-avatar{font-size:14px;color:#3a65ff;background:#eff3ff}
.sd-company-meta{font-size:12px;margin:5px 0 0;color:#8a91a1;display:flex;gap:10px}
.sd-company-meta>span{display:flex;align-items:center;gap:3px;color:#668c7a;font-size:11px}
.sd-rating{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.sd-rating>span{font-size:12px;color:#8a91a1}
.sd-page button:focus-visible,.sd-notes summary:focus-visible{outline:2px solid #3a65ff;outline-offset:2px}
</style>
