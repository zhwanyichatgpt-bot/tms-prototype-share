<template>
  <article :style="compact ? {'--plan-accent':accent} : undefined" :class="compact ? 'ly-offer-card lh-transport' : 'ly-offer-card'">
    <template v-if="compact">
      <header class="lh-plan-top">
        <span class="lh-plan-mode"><TransportIcon :mode="service.mode"/>{{ mode.label }}</span>
        <strong class="lh-plan-price" aria-label="参考运价"><small class="lh-plan-price-label">参考</small><template v-if="numericPrice"><span>{{ numericPrice[1] }}</span><small>{{ numericPrice[2] }}</small></template><template v-else>{{ inquiryOnly ? '面议' : channel.price }}</template></strong>
      </header>
      <button class="lh-plan-main" :aria-label="service.originLabel+'至'+service.destinationLabel+'，查看运输方案'" @click="$emit('open',service)">
        <span class="lh-plan-route-block">
          <span class="lh-plan-address"><strong>{{ origin.primary }}</strong><small v-if="origin.secondary">{{ origin.secondary }}</small></span>
          <span class="lh-plan-connection">
            <span class="lh-plan-time" :title="service.durationBasis || '参考时效，以询价确认为准'">{{ duration }}</span>
            <svg class="lh-plan-route-arrow" viewBox="0 0 84 12" fill="none" aria-hidden="true"><path d="M1 8H81L74 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="lh-plan-address"><strong>{{ destination.primary }}</strong><small v-if="destination.secondary">{{ destination.secondary }}</small></span>
        </span>
        <span class="lh-plan-tags"><span v-for="tag in featureTags" :key="tag">{{ tag }}</span></span>
        <span v-if="introduction" class="lh-plan-introduction">{{ introduction }}</span>
        <span class="lh-plan-activity">{{ channel.paths.length }}条路线 · {{ channel.schemes.length }}个经营方案</span>
      </button>
      <footer class="lh-plan-footer">
        <button v-if="!hideProvider" class="lh-plan-company" @click="$emit('provider',provider)"><van-icon name="hotel-o"/><span class="lh-plan-company-name">{{ provider.name }}</span></button>
        <ProviderRating :provider="provider" compact readable concise @open="$emit('reviews',$event)"/>
        <button class="lh-plan-action" @click="$emit('open',service)"><span>查看方案</span></button>
      </footer>
    </template>
    <template v-else>
    <button class="ly-offer-main" @click="$emit('open',service)">
      <span class="ly-offer-type"><TransportIcon :mode="service.mode"/>{{ mode.label }}<i>·</i>{{ channel.schemes.length }}个经营方案</span>
      <strong class="ly-offer-route">{{ service.originLabel }} <i>→</i> {{ service.destinationLabel }}</strong>
      <span class="ly-offer-metrics"><span><b>{{ duration }}</b><small>参考时效</small></span><span><b class="ly-offer-price">{{ channel.price }}</b><small>参考运价</small></span></span>
      <span class="ly-offer-cargo">{{ featureTags.join(' · ') }}</span>
      <span v-if="service.recommendation" class="ly-offer-reason"><van-icon name="passed"/>{{ service.recommendation }}</span>
    </button>
    <div class="ly-offer-company"><button @click="$emit('provider',provider)"><van-icon name="hotel-o"/>{{ provider.name }}</button><button class="ly-offer-link" @click="$emit('open',service)">查看方案<van-icon name="arrow"/></button></div>
    <ProviderRating :provider="provider" compact @open="$emit('reviews',$event)"/>
    </template>
  </article>
</template>
<script setup>
import { computed } from 'vue'
import { transportChannel,channelCapabilityLabels } from './transport-channels.js'
import TransportIcon from './TransportIcon.vue'
import ProviderRating from './ProviderRating.vue'
const props=defineProps({service:Object,provider:Object,mode:Object,compact:Boolean,hideProvider:Boolean})
defineEmits(['open','provider','reviews'])
const accent=computed(()=>({road:'#3a65ff',water:'#179eaa',rail:'#8262cf',multi:'#3a65ff',air:'#329fc8'}[props.service.mode]))
const channel=computed(()=>transportChannel(props.service))
const inquiryOnly=computed(()=>channel.value.price==='面议')
const numericPrice=computed(()=>inquiryOnly.value ? null : String(channel.value.price).match(/^(\d[\d,.]*)(.*)$/))
const introduction=computed(()=>channel.value.description.split('。')[0])
const duration=computed(()=>channel.value.duration==='待确认'?'时效待确认':channel.value.duration)
// 用城市和区县／节点两级呈现已有地址，完整名称不截断。
function endpoint(label, city){
  const parts=(label||'').split('·')
  if(parts.length>1)return {primary:parts[0],secondary:parts.slice(1).join('·')}
  if(city && label?.startsWith(city) && label!==city)return {primary:city,secondary:label.slice(city.length)}
  return {primary:label,secondary:''}
}
const origin=computed(()=>endpoint(props.service.originLabel,props.service.from))
const destination=computed(()=>endpoint(props.service.destinationLabel,props.service.to))
const featureTags=computed(()=>[...channel.value.cargoTypes,...channelCapabilityLabels(channel.value.capabilities)].slice(0,4))
</script>

<style scoped>
.lh-transport.ly-offer-card{padding:11px 12px 0;border:1px solid #edf0f5;border-radius:10px;background:#fff}
.lh-transport .lh-plan-top{display:flex;gap:8px;min-height:20px;align-items:center}
.lh-transport .lh-plan-mode{display:flex;gap:4px;align-items:center;color:#333;font-size:13px;font-weight:600;white-space:nowrap}
.lh-transport .lh-plan-mode svg{width:16px;height:16px;color:var(--plan-accent);flex:none}
.lh-transport .lh-plan-price{display:flex;align-items:baseline;gap:2px;margin-left:auto;color:#3a65ff;font-size:16px;font-weight:600;line-height:20px}
.lh-transport .lh-plan-price>span{font-size:21px;line-height:22px;font-variant-numeric:tabular-nums}
.lh-transport .lh-plan-price>small{font-size:12px;font-weight:500}
.lh-transport .lh-plan-time{font-size:12px;line-height:18px;font-weight:400;color:#647090;white-space:nowrap}
.lh-transport .lh-plan-main{display:flex;flex-direction:column;gap:7px;width:100%;padding:9px 0 8px;text-align:left}
.lh-transport .lh-plan-route-block{display:grid;grid-template-columns:minmax(0,1fr) 78px minmax(0,1fr);align-items:center;gap:12px;width:100%;min-height:44px}
.lh-transport .lh-plan-address{display:flex;flex-direction:column;gap:2px;min-width:0}
.lh-transport .lh-plan-address:last-child{text-align:right}
.lh-transport .lh-plan-address strong{color:#333;font-size:18px;line-height:24px;font-weight:600;overflow-wrap:anywhere}
.lh-transport .lh-plan-address small{font-size:12px;line-height:18px;color:#647090;overflow-wrap:anywhere}
.lh-transport .lh-plan-connection{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}
.lh-transport .lh-plan-route-arrow{display:block;width:100%;height:12px;color:#adb7c7}
.lh-transport .lh-plan-tags{display:flex;align-items:stretch;flex-wrap:wrap;gap:5px;min-width:0;width:100%}
.lh-transport .lh-plan-tags>span{flex:1 1 auto;display:flex;align-items:center;justify-content:center;text-align:center;min-width:0;padding:3px 7px;border-radius:4px;background:#edf1f7;color:#647090;font-size:12px;line-height:16px;overflow-wrap:anywhere}
.lh-transport .lh-plan-introduction{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:12px;line-height:18px;color:#758096;overflow-wrap:anywhere}
.lh-transport .lh-plan-footer{margin-top:0;padding:0;border-top:1px solid #eceef2;gap:8px;min-height:44px}
.lh-transport .lh-plan-company{display:flex;min-width:0;flex:1;gap:5px;font-size:12px;text-align:left;color:#333}
.lh-transport .lh-plan-company .van-icon{width:20px;height:20px;border-radius:4px;background:#eef3ff;color:#3a65ff;font-size:14px}
.lh-transport .lh-plan-company-name{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-transport .lh-plan-action span{font-size:12px;font-weight:500;color:#333;border-color:#d4d4d4;padding:4px 10px;line-height:18px}
.lh-transport .lh-plan-footer :deep(.ly-rating){flex:none;min-height:44px;margin:0;padding:0;gap:3px}
.lh-transport .lh-plan-footer :deep(.ly-rating>.van-icon-arrow){display:none}
.lh-plan-activity{font-size:11px;line-height:16px;color:#8a91a1}
.lh-plan-activity b{color:#536581;font-weight:500}
</style>
