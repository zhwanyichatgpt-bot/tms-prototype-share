<template>
  <section class="lyar-map lyd-design-map" :class="{'lyd-map-card-preview':cardPreview}" aria-label="运输方案路线示意">
    <svg :viewBox="cardPreview ? '0 0 415 325' : '0 0 686 426'" role="img" :aria-label="scheme.segments.map(item => item.from+'至'+item.to).join('；')">
      <defs><clipPath :id="clipId"><rect x="15" y="15" width="654" height="392" rx="18"/></clipPath></defs>
      <template v-if="cardPreview"><image href="/lianyun-mobile-assets/scheme-overview/map-background.png" x="-10" y="-5.5" width="425" height="429" preserveAspectRatio="none"/><image :href="assetRoot+'route-shape.svg'" x="-8" y="5" width="439.04" height="272.64"/></template>
      <template v-else><rect width="686" height="426" rx="18" fill="#fff" fill-opacity=".63"/>
      <image :href="assetRoot+'map-background.png'" x="15" y="15" width="654" height="392" preserveAspectRatio="xMidYMid slice" :clip-path="'url(#'+clipId+')'"/>
      <image :href="assetRoot+'route-shape.svg'" width="686" height="426"/></template>
      <g v-for="(node,index) in nodes" :key="index" class="lyd-map-node">
        <circle v-if="!node.transfer" :cx="node.x" :cy="node.y" :r="cardPreview ? 7 : 11" fill="#fff" stroke="#404a6b" :stroke-width="cardPreview ? 4 : 6"/>
        <image v-else :href="assetRoot+'transfer-marker.svg'" :x="node.x-(cardPreview?11:16)" :y="node.y-(cardPreview?11:16)" :width="cardPreview?22:32" :height="cardPreview?22:32"/>
        <foreignObject :x="node.labelX" :y="node.y-(cardPreview?36:54)" :width="node.width" :height="cardPreview?30:43">
          <div xmlns="http://www.w3.org/1999/xhtml" class="lyd-map-bubble" :title="node.name"><span v-if="!node.transfer" class="lyd-map-endpoint" :class="{destination:index === nodes.length-1}">{{ index === 0 ? '起' : '终' }}</span><img v-else :src="assetRoot+'transfer-marker.svg'" alt=""/><span>{{ node.label }}</span></div>
        </foreignObject>
      </g>
    </svg>
  </section>
</template>
<script setup>
import { computed, useId } from 'vue'
const props = defineProps({scheme:{type:Object,required:true},selected:{type:Number,default:-1},cardPreview:Boolean})
const clipId = 'detail-map-'+useId()
const assetRoot = '/lianyun-mobile-assets/scheme-detail/'
const shortMode = {road:'公',rail:'铁',water:'水',air:'空'}
// 坐标来自设计稿的路线示意区；仅用于排布，不代表地理位置或真实轨迹。
const nodes = computed(() => {
  const segments = props.scheme.segments, count = segments.length
  const anchors = count === 1 ? [[86,201],[598,182]]
    : count === 2 ? [[86,201],[255,279],[598,182]]
      : count === 3 ? [[86,201],[255,279],[538,254],[598,182]]
        : [[86,201],...Array.from({length:count-1},(_,i) => [255+i*283/(count-2),279-i*25/(count-2)]),[598,182]]
  return anchors.map(([x,y],index) => {
    if(props.cardPreview){x=x*.64-8;y=y*.64+5}
    const name = index === count ? segments.at(-1).to : segments[index].from
    const transfer = index > 0 && index < count
    const city = name.replace(/铁路货运场站|铁路场站|铁路节点|物流节点|物流交接点|提货点|交付点/g,'')
    const label = transfer ? city+'｜'+shortMode[segments[index-1].mode]+'转'+shortMode[segments[index].mode] : name
    const width = props.cardPreview ? Math.max(72,30+label.length*13) : Math.max(100,47+label.length*20)
    return {x,y,name,label,transfer,width,labelX:Math.max(0,Math.min(x-(props.cardPreview?30:50),(props.cardPreview?415:678)-width))}
  })
})
</script>
<style scoped>
.lyd-design-map{position:relative;width:100%;height:100%;overflow:hidden;border-radius:9px}
.lyd-design-map>svg{display:block;width:100%;height:100%}
.lyd-map-bubble{display:inline-flex;align-items:center;gap:6px;height:38px;max-width:100%;padding:3px 8px 3px 3px;border-radius:70px;background:#fff;box-shadow:0 2px 8px #3a456333;font:20px/28px 'PingFang SC',sans-serif;white-space:nowrap;color:#333}
.lyd-map-bubble>img{width:30px;height:30px;flex:none}
.lyd-map-bubble>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lyd-map-endpoint{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;background:#3a65ff;color:#fff;font-size:20px;line-height:30px}
.lyd-map-endpoint.destination{background:#21bd88}
.lyd-map-card-preview .lyd-map-bubble{height:25px;padding:2px 5px 2px 2px;gap:3px;font-size:14px;line-height:20px}
.lyd-map-card-preview .lyd-map-bubble>img,.lyd-map-card-preview .lyd-map-endpoint{width:20px;height:20px;font-size:14px;line-height:20px}
</style>
