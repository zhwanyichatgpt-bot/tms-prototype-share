<template>
  <div class="lya-map lya-real-map" :class="{ expanded, 'lya-network-overview':networkOverview }">
    <div ref="canvas" class="lya-real-canvas" :style="{ height: height + 'px' }">
      <div ref="baseMap" class="lya-vector-basemap" :style="{visibility:networkGeography&&!expanded&&!cleanNetwork ? 'hidden':undefined}" aria-label="运输路线地理底图"/>
      <svg class="lya-route-overlay" :viewBox="`0 0 ${width} ${height}`" role="group" :aria-label="scheme.name + '运输路线'">
        <g v-if="networkGeography && ((!expanded && !cleanNetwork) || !loaded || mapError)" aria-hidden="true"><path v-for="(path,index) in geographyPaths" :key="index" :d="path" :fill="cleanNetwork ? '#e8eef6' : '#d9eaff'" stroke="#fff" stroke-width=".7"/></g>
        <g v-for="(segment,index) in projectedSegments" :key="index" class="lya-route-segment" role="button" tabindex="0"
          :aria-label="`第${index + 1}段：${segment.from}至${segment.to}，${modeLabels[segment.mode]}`"
          :aria-pressed="networkOverview ? activeRoute === segment.routeId : selected === index" @click="selectSegment(segment,index)" @keydown.enter.prevent="selectSegment(segment,index)" @keydown.space.prevent="selectSegment(segment,index)">
          <path :d="segment.line" stroke="transparent" stroke-width="22" fill="none"/>
          <path :d="segment.line" :stroke="cleanNetwork ? '#3a65ff' : networkRegions.length ? segment.mode==='water' ? '#16b58a' : '#3a65ff' : displayModeColors[segment.mode]" :stroke-width="cleanNetwork ? activeRoute===segment.routeId ? 3.5 : 2.2 : networkOverview ? 1.8 : selected === index ? 9 : 6" :opacity="networkOverview ? 1 : selected === index ? 1 : .8"
            :stroke-dasharray="segment.mode === 'air' ? '12 7' : networkRegions.length && segment.mode==='water' ? '5 4' : undefined" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
          <g v-for="(arrow,n) in networkOverview && !cleanNetwork ? [] : cleanNetwork ? segment.arrows.filter((_,n)=>n%2===0) : segment.arrows" :key="n" :transform="`translate(${arrow.x},${arrow.y}) rotate(${arrow.angle})`" aria-hidden="true">
            <path d="M -4,-3 L 0,0 L -4,3 L -1,3 L 3,0 L -1,-3 Z" fill="#fff" :opacity="selected === index ? .95 : .7"/>
          </g>
        </g>
        <g v-for="(node,index) in displayedNodes" :key="index" class="lya-route-node" :class="{'lya-place-node': places.length}" :role="places.length ? 'button' : undefined" :tabindex="places.length ? 0 : undefined" :aria-label="places.length ? node.clusterIds ? node.clusterIds.length+'处组合节点' : node.name : undefined" :aria-pressed="places.length ? node.id===activePlace : undefined" @click="selectNode(node)" @keydown.enter.prevent="selectNode(node)" @keydown.space.prevent="selectNode(node)" :transform="`translate(${node.x},${node.y})`">
          <template v-if="node.clusterIds">
            <circle r="22" fill="transparent"/><circle r="16" fill="#fff" stroke="#3a65ff" stroke-width="2"/>
            <text y="5" text-anchor="middle" fill="#3a65ff" font-size="13" font-weight="700">{{ node.clusterIds.length }}</text>
          </template>
          <template v-else-if="networkOverview">
            <circle v-if="cleanNetwork && node.id===activePlace" r="20" fill="#3a65ff" fill-opacity=".13"/>
            <circle r="22" fill="transparent"/>
            <rect v-if="node.networkKind !== 'port'" x="-10" y="-10" width="20" height="20" rx="5" fill="#fff" :stroke="node.networkColor" stroke-width="2"/>
            <circle v-else r="10" fill="#fff" :stroke="node.networkColor" stroke-width="2"/>
            <foreignObject x="-8" y="-8" width="16" height="16"><TransportIcon v-if="node.networkKind!=='warehouse'" :mode="node.networkKind==='port'?'water':'rail'" :style="{width:'16px',height:'16px',color:node.networkColor}"/><van-icon v-else name="shop-o" :style="{fontSize:'16px',color:node.networkColor}"/></foreignObject>
          </template>
          <template v-else-if="node.endpoint && transferLabels">
            <circle r="5" fill="#435571" stroke="#fff" stroke-width="2"/>
          </template>
          <template v-else-if="node.endpoint">
            <path d="M 0,0 C -3,-7 -14,-12 -14,-22 A 14,14 0 1,1 14,-22 C 14,-12 3,-7 0,0 Z"
              :fill="index === 0 ? colors.load : colors.unload" stroke="#ffffff" stroke-width="2"/>
            <text y="-18" text-anchor="middle" class="lya-pin-letter">{{ index === 0 ? '装' : '卸' }}</text>
          </template>
          <template v-else>
            <circle :r="places.length ? 9 : 5" :fill="node.id === activePlace ? '#3a65ff' : '#ffffff'" :stroke="transferLabels ? '#748292' : colors.route" stroke-width="3"/>
            <text y="3" text-anchor="middle" class="lya-transfer-number">{{ index + (places.length ? 1 : 0) }}</text>
          </template>
          <line v-if="node.transfer && node.showLabel" x1="0" y1="0" :x2="node.leaderX" :y2="node.leaderY" stroke="#808cb6" stroke-width="1"/>
          <g :class="{'lya-transfer-label':node.transfer}" v-if="(cleanNetwork ? node.id===activePlace && !node.clusterIds : node.showLabel && !networkRegions.length)" :transform="`translate(${node.labelX},${node.labelY})`">
            <rect :width="node.labelWidth" :height="node.labelHeight" :rx="node.transfer ? 8 : 5" fill="#ffffff" fill-opacity=".95" :stroke="node.transfer ? '#cbd5e4' : undefined"/>
            <text :x="node.labelWidth / 2" y="15" text-anchor="middle" class="lya-place-label">{{ node.short }}</text>
            <text v-if="node.transfer" :x="node.labelWidth / 2" y="29" text-anchor="middle" class="lya-transfer-description">{{ node.transfer }}</text>
          </g>
        </g>
        <g v-for="item in networkEndpoints" :key="item.id" :transform="`translate(${item.x},${item.y})`" aria-hidden="true">
          <circle r="5" :fill="item.origin ? '#3a65ff' : '#16a783'" stroke="#fff" stroke-width="2"/>
          <g v-if="activeRoute" :transform="`translate(${item.labelX},${item.labelY})`"><rect :width="item.labelWidth" height="21" rx="5" fill="#fff"/><text :x="item.labelWidth/2" y="14" text-anchor="middle" fill="#435571" font-size="10">{{ item.name }}</text></g>
        </g>
        <g v-if="cleanNetwork && locationPoint" :transform="`translate(${project(locationPoint).x},${project(locationPoint).y})`" aria-label="我的位置"><circle r="13" fill="#3a65ff" fill-opacity=".13"/><circle r="5" fill="#3a65ff" stroke="#fff" stroke-width="2"/></g>
        <g v-for="item in projectedRegions" :key="item.id" class="lya-region-node" role="button" tabindex="0" :aria-label="item.name+'服务网络，'+item.count+'项资源'" :aria-pressed="activeRegion===item.id" :transform="`translate(${item.x},${item.y})`" @click="$emit('region',item.id)" @keydown.enter.prevent="$emit('region',item.id)" @keydown.space.prevent="$emit('region',item.id)">
          <circle r="22" fill="transparent"/>
          <circle v-if="activeRegion===item.id" r="18" fill="#3a65ff" fill-opacity=".12" stroke="#3a65ff" stroke-opacity=".25"/>
          <circle :r="activeRegion===item.id ? 9 : 7" :fill="activeRegion===item.id ? '#3a65ff' : '#16b58a'" stroke="#fff" stroke-width="2.5"/>
          <g :transform="`translate(${item.labelOffset[0]},${item.labelOffset[1]})`"><rect :x="-item.labelWidth/2" y="-11" :width="item.labelWidth" height="24" rx="12" :fill="activeRegion===item.id ? '#3a65ff' : '#fff'"/><text y="5" text-anchor="middle" :fill="activeRegion===item.id ? '#fff' : '#33425b'" font-size="12" font-weight="600">{{ item.name }} {{ item.count }}</text></g>
        </g>
      </svg>
      <div class="lya-map-caption"><button class="lya-map-expand" @click="$emit('expand')" :aria-label="networkOverview ? expanded ? '收起网络地图' : '放大网络地图' : expanded ? '收起路线地图' : '放大路线地图'"><van-icon :name="expanded ? 'shrink' : 'expand-o'"/></button></div>
      <div v-if="!networkOverview || expanded" class="lya-map-controls"><button aria-label="地图放大一级" @click="changeZoom(1)">＋</button><button aria-label="地图缩小一级" @click="changeZoom(-1)">−</button><button aria-label="查看全程路线" @click="fitRoute"><van-icon name="aim"/></button></div>
      <div v-if="mapError && !networkGeography" class="lya-map-status" role="status">底图暂未加载<button @click="retryMap">重新加载</button></div>
      <div v-else-if="!loaded && !networkGeography" class="lya-map-status" role="status">正在加载地图…</div>
      <div class="lya-map-attribution"><template v-if="networkGeography && ((!expanded && !cleanNetwork) || !loaded || mapError)">地理底图：DataV GeoAtlas</template><template v-else><a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></template></div>
    </div>
    <div v-if="networkOverview" class="lya-network-legend"><template v-if="cleanNetwork || networkRegions.length"><span v-if="networkRoutes.length"><i style="background:#3a65ff;width:13px;height:2px"/>通道</span><span v-if="places.some(n=>n.kind==='ports'&&!n.id.startsWith('station'))"><TransportIcon mode="water" style="width:13px;height:13px;color:#3a65ff"/>港口</span><span v-if="places.some(n=>n.id.startsWith('station'))"><TransportIcon mode="rail" style="width:13px;height:13px;color:#8262cf"/>场站</span><span v-if="places.some(n=>n.kind==='warehouses')"><van-icon name="shop-o" style="color:#16b58a"/>仓储</span></template><template v-else><span v-if="networkRoutes.length"><i style="background:#0ea4b2;width:13px;height:2px"/>线路</span><span v-if="places.some(n=>n.kind==='ports'&&!n.id.startsWith('station'))"><i style="background:#0ea4b2"/>港口</span><span v-if="places.some(n=>n.id.startsWith('station'))"><i style="background:#8b66d7"/>场站</span><span v-if="places.some(n=>n.kind==='warehouses')"><i style="background:#d78d31"/>仓储</span></template></div>
    <div v-else class="lya-map-legend"><span v-for="mode in uniqueModes" :key="mode" :style="{'--route-mode-color':displayModeColors[mode]}"><i class="lya-mode-line"/><TransportIcon :mode="mode"/>{{ modeLabels[mode] }}</span><small>可拖动、缩放地图</small></div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { modeColors, modeLabels } from './assistant-data.js'
import TransportIcon from './TransportIcon.vue'
import { transferDescription } from './service-routes.js'
import { createRouteMapStyle, routeMapColors as colors } from './route-map-theme.js'

const props = defineProps({ scheme: { type: Object, required: true }, selected: { type: Number, default: 0 }, expanded: Boolean, compact: Boolean, transferLabels:Boolean, places: {type:Array,default:()=>[]}, activePlace:String, networkOverview:Boolean, networkRoutes:{type:Array,default:()=>[]}, activeRoute:String,networkRegions:{type:Array,default:()=>[]},activeRegion:String,networkGeography:Object,cleanNetwork:Boolean,networkBounds:Array,locationPoint:Array })
const emit=defineEmits(['select', 'expand', 'place', 'route','region','cluster'])
function selectSegment(segment,index){if(props.networkOverview)emit('route',segment.routeId);else emit('select',index)}
const canvas = ref(null), baseMap = ref(null), width = ref(347), revision = ref(0)
const loaded = ref(false), mapError = ref(false)
const height = computed(() => props.networkOverview ? props.expanded ? 320 : props.cleanNetwork ? 208 : props.networkGeography ? 230 : 202 : props.expanded ? 440 : props.compact ? 210 : props.transferLabels && new Set(props.scheme.segments.map(segment=>segment.mode)).size>=3 ? 330 : 272)
let map, observer, visibilityObserver, disposed = false, loadTimer, initializeSequence = 0

const displaySegments = computed(() => (props.networkOverview ? props.networkRoutes.flatMap(route=>route.segments.map(segment=>({...segment,routeId:route.id}))) : props.scheme.segments).map((segment,index,list) => {
  const path = segment.path.map(xy => [...xy])
  if (index === 0 && props.scheme.demand?.originPoint) path[0] = props.scheme.demand.originPoint
  if (index === list.length - 1 && props.scheme.demand?.destinationPoint) path[path.length - 1] = props.scheme.demand.destinationPoint
  return { ...segment, path }
}))
// 方案详情采用公路绿、铁路灰、水路蓝；网络总览继续使用已有颜色。
const displayModeColors=computed(()=>props.transferLabels ? {...modeColors,road:'#19b88b',rail:'#748292',water:'#3977ef'} : modeColors)
const uniqueModes = computed(() => [...new Set(displaySegments.value.map(segment => segment.mode))])
const nodes = computed(() => {
  if (props.places.length) return props.places.map(place => {
    const networkKind=place.kind==='warehouses'?'warehouse':place.id.startsWith('station')?'rail':'port'
    return {...place,short:props.cleanNetwork?place.name:props.networkOverview?place.city+(networkKind==='port'?'港':networkKind==='rail'?'场站':'仓'):place.name,endpoint:false,networkKind,networkColor:props.cleanNetwork ? networkKind==='warehouse'?'#16a783':networkKind==='rail'?'#8262cf':'#3a65ff' : props.networkRegions.length ? networkKind==='warehouse'?'#16b58a':networkKind==='rail'?'#647089':'#3a65ff' : networkKind==='warehouse'?'#d78d31':networkKind==='rail'?'#8b66d7':'#0ea4b2'}
  })
  if(props.networkOverview)return []
  const list = displaySegments.value.map((segment,index) => ({ name: segment.from, xy: segment.path[0], segmentIndex:index, transfer:props.transferLabels && index>0 ? transferDescription(displaySegments.value[index-1].mode,segment.mode) : '' }))
  const last = displaySegments.value.at(-1)
  if (last) list.push({ name: last.to, xy: last.path.at(-1) })
  if (props.scheme.id === 'europe-rail') list.splice(2, 0, { name: '阿拉山口', xy: [82.57, 45.17] })
  return list.map((node,index) => ({ ...node, endpoint: index === 0 || index === list.length - 1,
    short: node.name.replace('物流节点', '').replace('装货点', '').replace('卸货点', '').replace('铁路节点', '铁路站') }))
})

// 覆盖层与底图使用同一个投影；不通过平滑路线改变方案中的地理坐标。
function project(xy) {
  if(map && (props.expanded||props.cleanNetwork))return map.project(xy)
  if(!props.networkGeography)return map ? map.project(xy) : {x:-1000,y:-1000}
  const mercator=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI
  const bounds=props.networkBounds||[[73,17],[136,54]]
  const top=mercator(bounds[1][1]),bottom=mercator(bounds[0][1]),span=bounds[1][0]-bounds[0][0]
  const scale=Math.min((width.value-40)/span,(height.value-62)/(top-bottom))
  return {x:(xy[0]-(bounds[0][0]+bounds[1][0])/2)*scale+width.value/2,y:((top+bottom)/2-mercator(xy[1]))*scale+height.value/2}

}
const geographyPaths=computed(()=>{revision.value;return (props.networkGeography?.features||[]).flatMap(feature=>{
  const geometry=feature.geometry,polygons=geometry.type==='MultiPolygon'?geometry.coordinates:[geometry.coordinates]
  return polygons.map(polygon=>polygon.map(ring=>ring.map((xy,index)=>{const p=project(xy);return `${index?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`}).join(' ')+' Z').join(' '))
})})
const projectedRegions=computed(()=>{revision.value;return props.networkRegions.map(item=>({...item,...project(item.xy),labelWidth:item.name.length*12+String(item.count).length*7+22}))})
function arrowsAlong(points) {
  const arrows = []
  let traveled = 0, target = 30
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y)
    if (!length) continue
    while (target < traveled + length) {
      const ratio = (target - traveled) / length
      const x = a.x + (b.x - a.x) * ratio, y = a.y + (b.y - a.y) * ratio
      if (x > -10 && x < width.value + 10 && y > -10 && y < height.value + 10) arrows.push({ x, y, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI })
      target += 48
      if (arrows.length >= 50) return arrows
    }
    traveled += length
  }
  return arrows
}
const projectedSegments = computed(() => {
  revision.value
  return displaySegments.value.map(segment => {
    const points = segment.path.map(project)
    return { ...segment, line: points.map((p,i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '), arrows: arrowsAlong(points) }
  })
})
const projectedNodes = computed(() => {
  revision.value
  const occupied = []
  // 先为装卸点保留标签位置；邻近中转点只显示节点，避免小屏堆叠。
  return nodes.value.map((node,index) => ({ ...node, index, ...project(node.xy) }))
    .sort((a,b) => Number(b.endpoint) - Number(a.endpoint))
    .map(node => {
      const short = !node.transfer && node.short.length > 15 ? node.short.slice(0,14) + '…' : node.short
      const labelHeight=node.transfer?38:23
      const labelWidth = Math.min(width.value - 20, Math.max(short.length * 10.5, node.transfer ? node.transfer.length*10 : 0) + 14)
      const defaultX = Math.max(8 - node.x, Math.min(-labelWidth / 2, width.value - 8 - node.x - labelWidth))
      const defaultY=props.networkOverview&&node.id==='storage-sz'?-33:node.endpoint?8:12
      const candidates=node.transfer ? [-78,42,-120,84].flatMap(y=>[defaultX,defaultX-36,defaultX+36].map(x=>({x:Math.max(8-node.x,Math.min(x,width.value-52-node.x-labelWidth)),y:Math.max(4-node.y,Math.min(y,height.value-labelHeight-4-node.y))}))) : [{x:defaultX,y:defaultY}]
      const collides=({x,y,w,h})=>occupied.some(other=>x<other.x+other.w+4 && x+w+4>other.x && y<other.y+other.h+4 && y+h+4>other.y)
      const placement=candidates.find(({x,y})=>!collides({x:node.x+x,y:node.y+y,w:labelWidth,h:labelHeight}))
      const labelX=placement?.x??defaultX,labelY=placement?.y??defaultY
      const showLabel=!!placement
      if(showLabel)occupied.push({x:node.x+labelX,y:node.y+labelY,w:labelWidth,h:labelHeight})
      if(node.endpoint && props.transferLabels)occupied.push({x:node.x-7,y:node.y-7,w:14,h:14})
      const leaderX=Math.max(labelX+4,Math.min(0,labelX+labelWidth-4))
      const leaderY=labelY<0?labelY+labelHeight:labelY
      return { ...node, short, labelX, labelY, labelWidth,labelHeight,leaderX,leaderY, showLabel }
    }).sort((a,b) => a.index - b.index)
})


// 同屏距离小于44像素的资源合并；组合节点可继续放大，也可在信息卡中选择。
const displayedNodes=computed(()=>{
  if(!props.cleanNetwork)return projectedNodes.value
  const remaining=[...projectedNodes.value],groups=[]
  while(remaining.length){
    const group=[remaining.shift()]
    for(let changed=true;changed;){
      changed=false
      for(let index=remaining.length-1;index>=0;index--){
        if(group.some(item=>Math.hypot(item.x-remaining[index].x,item.y-remaining[index].y)<44)){
          group.push(...remaining.splice(index,1));changed=true
        }
      }
    }
    groups.push(group.length===1?group[0]:{...group[0],id:'cluster-'+group.map(item=>item.id).join('-'),name:'组合节点',clusterIds:group.map(item=>item.id),x:group.reduce((sum,item)=>sum+item.x,0)/group.length,y:group.reduce((sum,item)=>sum+item.y,0)/group.length})
  }
  return groups
})
function selectNode(node){if(!props.places.length)return;emit(node.clusterIds?'cluster':'place',node.clusterIds||node.id)}
const networkEndpoints=computed(()=>{
  revision.value
  if(!props.cleanNetwork)return []
  const seen=new Set(),result=[]
  for(const route of props.networkRoutes){
    const endpoints=[route.segments[0]?.path[0],route.segments.at(-1)?.path.at(-1)]
    endpoints.forEach((xy,index)=>{
      if(!xy)return
      const key=xy.join(',');if(seen.has(key))return;seen.add(key)
      const point=project(xy),name=(route.name.split(' → ')[index]||'').slice(0,10),labelWidth=name.length*10+12
      result.push({...point,id:key,origin:index===0,name,labelWidth,labelX:Math.max(5-point.x,Math.min(-labelWidth/2,width.value-labelWidth-5-point.x)),labelY:point.y>height.value-42?-29:9})
    })
  }
  return result
})

function fitRoute() {
  if (!map) return
  const points = props.networkBounds || (props.networkGeography ? [[73,17],[136,54]] : [...displaySegments.value.flatMap(segment => segment.path), ...props.places.map(place => place.xy)])
  if (!points.length) return
  const xs = points.map(p => p[0]), ys = points.map(p => p[1])
  map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], {
    padding: props.cleanNetwork ? {top:40,bottom:30,left:24,right:24} : props.networkGeography ? {top:14,bottom:20,left:8,right:8} : props.networkOverview ? {top:38,bottom:42,left:36,right:42} : { top: 53, bottom: 49, left: 48, right: 58 }, maxZoom: props.cleanNetwork ? 11 : props.networkOverview ? 6.3 : 13, duration: 0,
  })
  revision.value++
}
function changeZoom(delta) { map?.zoomTo(Math.max(2, Math.min(16, map.getZoom() + delta)), { duration: 180 }) }
function startLoadingTimer() {
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => { if (!loaded.value) mapError.value = true }, 15000)
}
async function initializeMap() {
  const sequence = ++initializeSequence
  try {
    const { Map, setWorkerUrl } = await import('maplibre-gl')
    if (disposed || sequence !== initializeSequence) return
    // 以静态资源 URL 加载原生模块 worker，避免将模块对象传入地图初始化。
    setWorkerUrl(mapWorkerUrl)
    map = new Map({ container: baseMap.value, style: createRouteMapStyle(!!props.networkGeography), center: [114.3, 30.5], zoom: 5,
      minZoom: 2, maxZoom: 16, attributionControl: false, renderWorldCopies: false, interactive:!props.networkOverview||props.expanded,
      dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0,
      localIdeographFontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
    })
    map.touchZoomRotate.disableRotation()
    map.on('move', () => { revision.value++ })
    map.on('load', () => { loaded.value = true; mapError.value = false; clearTimeout(loadTimer) })
    map.on('error', () => { mapError.value = true })
    map.on('idle', () => { if (map.isStyleLoaded() && map.areTilesLoaded()) { loaded.value = true; mapError.value = false; clearTimeout(loadTimer) } })
    fitRoute()
    startLoadingTimer()
  } catch { if (!disposed && sequence === initializeSequence) mapError.value = true }
}
function retryMap() {
  clearTimeout(loadTimer)
  map?.remove()
  map = undefined
  mapError.value = false
  loaded.value = false
  initializeMap()
}
watch(() => props.networkBounds, () => nextTick(fitRoute))
watch(() => props.scheme, () => nextTick(fitRoute))
watch(() => props.places, () => nextTick(fitRoute))
watch(() => props.networkRoutes, () => nextTick(fitRoute))
watch(() => props.expanded, value=>{if(props.networkGeography&&value&&!map)initializeMap();revision.value++;if(props.networkOverview&&map){for(const control of ['dragPan','scrollZoom','touchZoomRotate','doubleClickZoom','keyboard'])map[control][value?'enable':'disable']();map.touchZoomRotate.disableRotation()}})
watch(height, () => nextTick(() => { map?.resize(); fitRoute() }))
onMounted(() => {
  width.value = canvas.value.clientWidth || 347
  observer = new ResizeObserver(entries => {
    const nextWidth = entries[0].contentRect.width
    if (nextWidth > 0 && nextWidth !== width.value) { width.value = nextWidth; map?.resize(); fitRoute() }
  })
  observer.observe(canvas.value)
  if(props.networkGeography&&!props.expanded&&!props.cleanNetwork)return
  if(props.networkOverview){visibilityObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){visibilityObserver.disconnect();initializeMap()}},{rootMargin:'150px'});visibilityObserver.observe(canvas.value)}else initializeMap()
})
onBeforeUnmount(() => { disposed = true; clearTimeout(loadTimer); observer?.disconnect(); visibilityObserver?.disconnect(); map?.remove() })
</script>

<style scoped>
.lya-real-map { background:#dce2e9; border-color:#dce2e9; }
.lya-real-canvas { background:#dce2e9; }
.lya-vector-basemap { position:absolute; inset:0; }
.lya-route-overlay { pointer-events:none; }
.lya-region-node{pointer-events:all;cursor:pointer;outline:none}
.lya-region-node:focus-visible>circle:first-child{stroke:#1534b8;stroke-width:2}
.lya-route-segment { pointer-events:stroke; cursor:pointer; outline:none; }
.lya-place-node { pointer-events:all; cursor:pointer; }
.lya-network-overview:not(.expanded) .lya-real-canvas {touch-action:pan-y}
.lya-place-node:focus-visible circle { stroke:#1534b8; stroke-width:5; }
.lya-route-segment:focus-visible > path:nth-child(2) { stroke-width:11; }
.lya-pin-letter { fill:white; font-size:14px; font-weight:700; }
.lya-transfer-number { fill:#6575b5; font-size:7px; font-weight:600; }
.lya-transfer-description{fill:#3a65ff;font-size:10px}
.lya-transfer-label .lya-place-label{fill:#435571;font-weight:600}
.lya-place-label { fill:#555e70; font-size:10.5px; font-weight:500; }
.lya-map-expand { margin-left:auto; }
.lya-map-caption button,.lya-map-controls button { color:#586477; background:#fffffff0; }
.lya-map-attribution { display:flex; gap:3px; max-width:100%; font-size:8px; background:#edf0f5d9; }
.lya-map-attribution a { color:#687384; text-decoration:none; }
.lya-map-legend { background:#f6f8fb; gap:10px; flex-wrap:wrap; color:#667085; }
.lya-map-legend span { gap:4px; }
.lya-map-legend .lya-mode-line { width:12px; height:3px; border-radius:2px; background:var(--route-mode-color); }
.lya-map-legend :deep(svg) { width:14px; height:14px; color:var(--route-mode-color); }
.lya-map-legend small { color:#858f9f; }
.lya-map-status { position:absolute; bottom:22px; left:9px; max-width:235px; padding:6px 9px; border-radius:6px; color:#697384; background:#fffffff2; font-size:10px; }
.lya-map-status button { margin-left:8px; padding:0; color:#4366cf; background:none; border:0; }
.lya-network-overview {position:relative}
.lya-network-overview .lya-real-canvas {overflow:hidden}
.lya-network-overview .lya-map-caption {top:8px;right:8px;left:auto;bottom:auto;padding:0}
.lya-network-overview .lya-map-expand {width:44px;height:44px;border-radius:9px;color:#3a65ff;font-size:20px;display:grid;place-items:center}
.lya-network-overview .lya-map-attribution {bottom:0;padding:2px 5px;font-size:8px;gap:3px}
.lya-network-overview .lya-transfer-description{fill:#3a65ff;font-size:10px}
.lya-transfer-label .lya-place-label{fill:#435571;font-weight:600}
.lya-place-label {font-size:10.5px;fill:#3b4e67}
.lya-network-overview .lya-map-controls {top:62px;bottom:auto}
.lya-network-overview .lya-map-controls button {width:44px;height:44px}
.lya-network-overview .lya-map-status {top:8px;bottom:auto;left:8px;max-width:245px}
.lya-network-legend {position:absolute;left:8px;bottom:20px;z-index:2;display:flex;gap:10px;align-items:center;padding:4px 6px;border-radius:5px;background:#fffffff0;font-size:10px;color:#40546d;pointer-events:none}
.lya-network-legend span {display:flex;align-items:center;gap:4px}
.lya-network-legend i {width:7px;height:7px;border-radius:2px}
</style>
