<template>
  <section class="lyar-map" aria-label="当前方案分段路线示意">
    <div ref="canvas" class="lyar-basemap" aria-hidden="true"/>
    <div class="lyar-map-caption"><span>路线示意 · 非等比例</span><div><span v-for="mode in modes" :key="mode"><i :style="{background:colors[mode]}"/>{{ modeLabels[mode] }}</span><span><i class="transfer"/>转换点</span></div></div>
    <svg viewBox="0 0 375 288" preserveAspectRatio="none" role="img" :aria-label="scheme.segments.map(s => s.from+'经'+modeLabels[s.mode]+'到'+s.to).join('；')">
      <g v-for="(leg,index) in geometry.legs" :key="index" :opacity="selected < 0 || selected === index ? 1 : 0.35">
        <path :d="leg.path" fill="none" :stroke="colors[leg.mode]" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
        <path :d="leg.path" fill="none" :stroke="fills[leg.mode]" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
        <path v-for="(arrow,i) in leg.arrows" :key="i" d="M-3 -2 L0 0 L-3 2" fill="none" stroke="white" stroke-width="1.5" :transform="'translate('+arrow.x+' '+arrow.y+') rotate('+arrow.angle+')'"/>
        <path :d="leg.path" class="lyar-map-hit" role="button" tabindex="0" :aria-label="'查看第'+(index+1)+'段 '+modeLabels[leg.mode]" :aria-pressed="selected === index" @click="$emit('select',index)" @keydown.enter="$emit('select',index)" @keydown.space.prevent="$emit('select',index)"/>
        <g :transform="'translate('+leg.tag[0]+' '+leg.tag[1]+')'" class="lyar-map-leg"><rect width="70" height="20" rx="10" :fill="colors[leg.mode]"/><text x="35" y="14">{{ modeLabels[leg.mode] }} {{ leg.km }}km</text></g>
      </g>
      <g v-for="(node,index) in geometry.nodes" :key="index">
        <circle :cx="node.point[0]" :cy="node.point[1]" r="6" fill="white" stroke="#3e4969" stroke-width="3"/>
        <g :transform="'translate('+node.label[0]+' '+node.label[1]+')'" class="lyar-map-node">
          <rect :width="node.width" :height="node.transfer ? 38 : 27" rx="13" fill="white" stroke="#d7deea"/>
          <circle cx="14" cy="13" r="10" :fill="index === 0 ? '#3a65ff' : index === geometry.nodes.length-1 ? '#20b68d' : '#3e4969'"/>
          <text x="14" y="17" text-anchor="middle" fill="white">{{ index === 0 ? '起' : index === geometry.nodes.length-1 ? '终' : index }}</text>
          <text x="28" y="17" fill="#333"><title>{{ node.name }}</title>{{ shortName(node.name) }}</text>
          <text v-if="node.transfer" x="28" y="31" fill="#68758c" font-size="9">{{ node.transfer }}</text>
        </g>
      </g>
    </svg>
    <small class="lyar-map-credit">OpenFreeMap · © OpenMapTiles · © OpenStreetMap</small>
  </section>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { createRouteMapStyle } from './route-map-theme.js'
import { modeLabels } from './assistant-data.js'
const props = defineProps({scheme:{type:Object,required:true},selected:{type:Number,default:-1}})
defineEmits(['select'])
const canvas = ref(null)
const colors = {road:'#20b68d',rail:'#6a869c',water:'#538bea',air:'#279bc4'}
const fills = {road:'#91dbc8',rail:'#b8cad6',water:'#acc8f5',air:'#a1d9ea'}
const modes = computed(() => [...new Set(props.scheme.segments.map(s => s.mode))])
const shortName = name => name.replace(/市|装货点|卸货点|物流节点/g,'').slice(0,9)
function arrows(points) {
  return points.slice(1).flatMap((point,index) => {
    const from = points[index], distance = Math.hypot(point[0]-from[0],point[1]-from[1])
    if(distance < 22) return []
    return [{x:(from[0]+point[0])/2,y:(from[1]+point[1])/2,angle:Math.atan2(point[1]-from[1],point[0]-from[0])*180/Math.PI}]
  })
}
// 展开短接驳段以便手机辨认；所有节点位置均为非等比例示意，不是地理定位。
const geometry = computed(() => {
  const segments = props.scheme.segments, count = segments.length
  let points, labels, paths, tags
  if(count === 3) {
    // 节点上下错开，分段标签沿各段排布，避免全部挤在地图底部。
    points = [[34,166],[122,83],[248,207],[340,127]]
    labels = [[8,202],[58,37],[186,223],[252,78]]
    paths = [[[34,166],[57,151],[69,121],[101,109],[122,83]],[[122,83],[152,112],[169,147],[201,165],[222,193],[248,207]],[[248,207],[271,189],[283,159],[317,151],[340,127]]]
    tags = [[18,108],[153,137],[285,178]]
  } else if(count === 4) {
    points = [[34,143],[106,88],[188,196],[269,87],[340,161]]
    labels = [[8,185],[55,38],[130,225],[225,38],[249,193]]
    paths = [[[34,143],[55,126],[79,115],[106,88]],[[106,88],[130,118],[151,161],[188,196]],[[188,196],[213,165],[240,119],[269,87]],[[269,87],[289,110],[319,131],[340,161]]]
    tags = [[14,91],[108,139],[213,165],[293,119]]
  } else {
    points = Array.from({length:count+1},(_,i) => [35+i*305/count,i === 0 ? 100 : i === count ? 80 : i%2 ? 182 : 95])
    labels = points.map((p,i) => [Math.max(8,Math.min(250,p[0]-52)),p[1]+(i === 0 || i === count ? -40 : i%2 ? 15 : -47)])
    paths = segments.map((s,i) => [points[i],[points[i][0]+(points[i+1][0]-points[i][0])*.35,points[i][1]+20],[points[i][0]+(points[i+1][0]-points[i][0])*.65,points[i+1][1]+18],points[i+1]])
    tags = segments.map((s,i) => [(points[i][0]+points[i+1][0])/2-35,Math.max(points[i][1],points[i+1][1])+48])
  }
  return {legs:segments.map((segment,i) => ({...segment,path:'M'+paths[i].map(p => p.join(' ')).join(' L'),arrows:arrows(paths[i]),tag:tags[i]})),nodes:points.map((point,i) => {
    const name = i === count ? segments[count-1].to : segments[i].from
    const transfer = i > 0 && i < count ? modeLabels[segments[i-1].mode]+' → '+modeLabels[segments[i].mode] : ''
    return {point,label:labels[i],name,transfer,width:Math.min(125,38+shortName(name).length*10)}
  })}
})
let map, observer, disposed = false
function fitMap() {
  if(!map) return
  map.resize()
  const points = props.scheme.segments.flatMap(segment => segment.path || [])
  if(!points.length) return
  const xs = points.map(p => p[0]), ys = points.map(p => p[1])
  map.fitBounds([[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)]],{padding:38,duration:0,maxZoom:8})
}
onMounted(async () => {
  await nextTick()
  const {Map,setWorkerUrl} = await import('maplibre-gl')
  if(disposed || !canvas.value) return
  setWorkerUrl(mapWorkerUrl)
  const style = createRouteMapStyle()
  style.layers = style.layers.filter(layer => !layer.id.startsWith('city-'))
  map = new Map({container:canvas.value,style,center:[114,29],zoom:5,interactive:false,attributionControl:false})
  fitMap()
  observer = new ResizeObserver(fitMap)
  observer.observe(canvas.value)
})
watch(() => props.scheme,() => nextTick(fitMap))
onBeforeUnmount(() => {disposed=true;observer?.disconnect();map?.remove()})
</script>
