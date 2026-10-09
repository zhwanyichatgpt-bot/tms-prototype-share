<template>
  <Teleport :to="teleport || 'body'" :disabled="!expanded">
    <section class="lh-network" :class="{'ly-service-page':expanded}" :aria-label="expanded ? '平台服务网络详情' : '平台服务网络预览'">
      <header v-if="expanded" class="ly-service-nav"><button aria-label="返回首页" @click="$emit('close')"><van-icon name="arrow-left"/></button><h1>平台服务网络</h1><span/></header>
      <div :class="{'ly-service-content':expanded}">
        <div class="lh-section-heading"><h2 v-if="!expanded">平台服务网络</h2><strong v-else>{{ areaLabel }}服务网络</strong><button class="lh-network-link" @click="showNationwide">全国网络 ›</button></div>
        <div class="lh-network-location"><label><van-icon name="location-o"/><select :value="area" aria-label="服务网络城市" @change="changeArea($event.target.value)"><option value="current" :disabled="!locationPoint">当前位置{{ nearbyCity ? ' · '+nearbyCity+'附近' : '' }}</option><option value="全国">全国</option><option v-for="city in cities" :key="city.name" :value="city.name">{{ city.name }}</option></select><van-icon name="arrow-down"/></label><button @click="locate" :disabled="locating"><van-icon name="aim"/>{{ locating ? '定位中' : '重新定位' }}</button></div>
        <p v-if="locationNotice" class="lh-network-location-note" role="status">{{ locationNotice }}</p>
        <nav class="lh-network-tabs" aria-label="网络资源分类"><button v-for="tab in categories" :key="tab.id" :aria-pressed="kind===tab.id" @click="changeKind(tab.id)">{{ tab.name }}</button></nav>
        <div class="lh-network-map">
          <AssistantRouteMap :scheme="emptyScheme" :network-routes="mapRoutes" :places="places" :active-place="placeId" :active-route="selectedRouteId" :network-geography="networkGeography" :network-bounds="mapBounds" :location-point="area==='current' ? locationPoint : null" clean-network network-overview :expanded="expanded" @route="chooseRoute" @place="choosePlace" @cluster="chooseCluster" @expand="toggleMap"/>
          <span class="lh-network-map-context">{{ kind==='routes' ? '从'+areaLabel+'出发' : area==='全国' ? '全国服务节点' : '周边服务节点' }}</span>
        </div>
        <div class="lh-network-info" aria-live="polite">
          <template v-if="place">
            <header><span class="lh-network-type" :style="{'--node-color':nodeType(place).color}">{{ nodeProfiles[place.id]?.type || nodeType(place).name }}</span><button @click="go('node',place)">查看详情 ›</button></header>
            <strong>{{ place.name }}</strong><p><van-icon name="location-o"/> {{ nodeProfiles[place.id]?.location || place.city }}</p><p class="lh-network-capability">{{ place.summary }}</p>
          </template>
          <template v-else-if="selectedRoute">
            <header><span class="lh-network-type">{{ modeInfo(selectedRoute.mode).label }}</span><button @click="go('service',selectedRoute)">查看通道详情 ›</button></header>
            <strong>{{ selectedRoute.originLabel }} → {{ selectedRoute.destinationLabel }}</strong><p>{{ selectedRoute.coverage }} · {{ selectedRoute.condition }}</p><select :value="selectedRouteId" aria-label="选择出发通道" @change="chooseRoute($event.target.value)"><option value="">代表通道 · 点击地图或选择</option><option v-for="item in routes" :key="item.id" :value="item.id">{{ item.originLabel }} → {{ item.destinationLabel }} · {{ item.mode==='multi' ? item.condition : modeInfo(item.mode).short }}</option></select>
          </template>
          <template v-else-if="clusterIds.length">
            <header><span class="lh-network-type">组合节点 · {{ clusterPlaces.length }}处</span><button @click="clearSelection">取消选择</button></header><strong>选择具体服务节点</strong><select aria-label="组合节点中的资源" :value="''" @change="choosePlace($event.target.value)"><option value="" disabled>请选择港口、场站或仓储</option><option v-for="item in clusterPlaces" :key="item.id" :value="item.id">{{ nodeType(item).name }} · {{ item.name }}</option></select><p>已放大这组节点所在区域</p>
          </template>
          <template v-else>
            <header><span class="lh-network-type">{{ areaLabel }} · {{ kind==='routes'?'出发通道':'服务资源' }}</span><button v-if="!expanded" @click="$emit('expand')">查看资源 ›</button></header>
            <strong>{{ kind==='routes' ? routes.length ? routes.length+'条出发通道' : '暂无出发通道样例' : places.length ? '发现'+places.length+'处服务节点' : '暂无该区域的节点样例' }}</strong>
            <p v-if="kind==='overview'">港口 {{ counts.ports }} · 场站 {{ counts.stations }} · 仓储 {{ counts.warehouses }}</p><p v-else>{{ category.name }} · {{ kind==='routes' ? '点击连接线了解通道' : '点击地图标记了解服务能力' }}</p>
            <template v-if="kind==='routes' && routes.length"><select :value="selectedRouteId" aria-label="选择出发通道" @change="chooseRoute($event.target.value)"><option value="">代表通道 · 点击地图或选择</option><option v-for="item in routes" :key="item.id" :value="item.id">{{ item.originLabel }} → {{ item.destinationLabel }} · {{ item.mode==='multi' ? item.condition : modeInfo(item.mode).short }}</option></select></template><p v-else class="lh-network-capability">{{ area==='全国' ? '选择城市，了解当地服务资源' : '切换分类查看资源，密集节点可点开选择' }}</p>
          </template>
        </div>
        <p class="lh-network-demo">资源与位置为原型示例，非实际平台覆盖</p>
        <template v-if="expanded">
          <div class="lh-network-objects" aria-label="当前范围的网络资源"><button v-for="item in kind==='routes' ? routes : places" :key="item.id" :aria-pressed="selectedRouteId===item.id || placeId===item.id" @click="kind==='routes' ? chooseRoute(item.id) : choosePlace(item.id)"><span>{{ kind==='routes' ? item.originLabel+' → '+item.destinationLabel : item.name }}<small>{{ kind==='routes' ? modeInfo(item.mode).label : nodeType(item).name+' · '+item.summary }}</small></span><van-icon name="arrow"/></button></div>
          <p v-if="kind==='routes' ? !routes.length : !places.length" class="lh-network-empty">当前区域暂无此类样例资源，可切换城市或查看全国网络。</p>
        </template>
      </div>
    </section>
  </Teleport>
</template>
<script setup>
import { computed,onMounted,onBeforeUnmount,ref,watch } from 'vue'
import AssistantRouteMap from './AssistantRouteMap.vue'
import { services,modes } from './mock-data.js'
import { serviceRoute } from './service-routes.js'
import { networkPlaces } from './platform-data.js'
import { nodeProfiles } from './node-profiles.js'
import { networkCities as cities,distanceKm,pointBounds,nodeType } from './network-view.js'
import networkGeography from './network-geography.json'
const props=defineProps({expanded:Boolean,teleport:Object,initialRegion:String})
const emit=defineEmits(['service','provider','offer','node','expand','close'])
const categories=[{id:'overview',name:'综合'},{id:'routes',name:'通道'},{id:'ports',name:'港口'},{id:'stations',name:'场站'},{id:'warehouses',name:'仓储'}]
const kind=ref('overview'),area=ref('全国'),selectedRouteId=ref(''),placeId=ref(''),clusterIds=ref([]),clusterBounds=ref(null)
const locationPoint=ref(null),locating=ref(false),locationNotice=ref('')
let locationRequest=0,disposed=false,homeView=null
const emptyScheme={id:'platform-network',name:'平台服务网络',segments:[]}
const category=computed(()=>categories.find(item=>item.id===kind.value))
const center=computed(()=>area.value==='current'?locationPoint.value:cities.find(item=>item.name===area.value)?.xy)
const nearbyCity=computed(()=>{
  if(!locationPoint.value)return ''
  const closest=[...cities].sort((a,b)=>distanceKm(a.xy,locationPoint.value)-distanceKm(b.xy,locationPoint.value))[0]
  return closest&&distanceKm(closest.xy,locationPoint.value)<60?closest.name:''
})
const areaLabel=computed(()=>area.value==='current' ? nearbyCity.value ? nearbyCity.value+'附近' : '当前位置' : area.value)
// 原型按定位点或所选城市周边100公里筛选节点；通道仅按始发点筛选，不包含途经线路。
const nearbyPlaces=computed(()=>networkPlaces.filter(item=>!center.value || distanceKm(item.xy,center.value)<=100))
const places=computed(()=>kind.value==='routes'?[]:nearbyPlaces.value.filter(item=>kind.value==='overview'||nodeType(item).key===kind.value))
const counts=computed(()=>Object.fromEntries(['ports','stations','warehouses'].map(key=>[key,nearbyPlaces.value.filter(item=>nodeType(item).key===key).length])))
const routes=computed(()=>services.filter(item=>{
  const start=serviceRoute(item).segments?.[0]?.path?.[0]
  return start&&(!center.value||distanceKm(start,center.value)<=100)
}))
const selectedRoute=computed(()=>routes.value.find(item=>item.id===selectedRouteId.value))
const place=computed(()=>places.value.find(item=>item.id===placeId.value))
const clusterPlaces=computed(()=>places.value.filter(item=>clusterIds.value.includes(item.id)))
const mapRoutes=computed(()=>kind.value==='routes'?(selectedRoute.value?[selectedRoute.value]:routes.value.slice(0,3)).map(serviceRoute):[])
const mapBounds=computed(()=>{
  if(clusterBounds.value)return clusterBounds.value
  if(kind.value==='routes' && mapRoutes.value.length)return pointBounds(mapRoutes.value.flatMap(item=>item.segments.flatMap(segment=>segment.path)),.35)
  return center.value?pointBounds([center.value,...nearbyPlaces.value.map(item=>item.xy)],.8):[[73,17],[136,54]]
})
const modeInfo=id=>modes.find(item=>item.key===id)||{label:'运输通道',short:'通道'}
function clearSelection(){placeId.value='';selectedRouteId.value='';clusterIds.value=[];clusterBounds.value=null}
function changeKind(value){kind.value=value;clearSelection()}
function changeArea(value){locationRequest++;locating.value=false;area.value=value;locationNotice.value='';clearSelection()}
function choosePlace(id){if(!places.value.some(item=>item.id===id))return;placeId.value=id;selectedRouteId.value='';clusterIds.value=[]}
function chooseRoute(id){selectedRouteId.value=id;placeId.value='';clusterIds.value=[];clusterBounds.value=null}
function chooseCluster(ids){clearSelection();clusterIds.value=ids;clusterBounds.value=pointBounds(places.value.filter(item=>ids.includes(item.id)).map(item=>item.xy),.08)}
function showNationwide(){
  if(!props.expanded)homeView={area:area.value,kind:kind.value,placeId:placeId.value,routeId:selectedRouteId.value}
  changeArea('全国');if(!props.expanded)emit('expand')
}
watch(()=>props.expanded,value=>{
  if(value||!homeView)return
  const saved=homeView;homeView=null;changeArea(saved.area);kind.value=saved.kind;placeId.value=saved.placeId;selectedRouteId.value=saved.routeId
})
function toggleMap(){emit(props.expanded?'close':'expand')}
function go(type,item){if(!item)return;if(props.expanded)emit('close');emit(type,item)}
function locate(){
  const request=++locationRequest
  if(!navigator.geolocation){locationNotice.value='当前环境不支持定位，请选择城市';return}
  locating.value=true;locationNotice.value='正在获取当前位置…'
  navigator.geolocation.getCurrentPosition(position=>{
    if(disposed||request!==locationRequest)return
    locationPoint.value=[position.coords.longitude,position.coords.latitude];area.value='current';locating.value=false;clearSelection()
    locationNotice.value='已定位 · 节点按周边100公里展示'
  },error=>{
    if(disposed||request!==locationRequest)return
    locating.value=false
    locationNotice.value=error.code===1?'未开启定位，可选择城市查看':error.code===3?'定位超时，可重试或选择城市':'暂时无法获取位置，可选择城市查看'
  },{enableHighAccuracy:false,timeout:8000,maximumAge:300000})
}
onMounted(locate)
onBeforeUnmount(()=>{disposed=true;locationRequest++})
</script>
<style scoped>
.lh-network .lh-section-heading{min-height:38px;margin-bottom:0}
.lh-network .lh-section-heading>strong{font-size:15px}
.lh-network-link{min-height:44px;color:#3a65ff;background:none;font-size:12px;padding:0}
.lh-network-location{display:flex;justify-content:space-between;align-items:center;gap:8px}
.lh-network-location label{display:flex;align-items:center;gap:5px;color:#3a65ff;min-width:0}
.lh-network-location select{max-width:205px;appearance:none;border:0;background:transparent;color:#33425b;font:inherit;font-size:13px;min-height:44px}
.lh-network-location button{min-height:44px;color:#647089;background:none;font-size:12px;white-space:nowrap}
.lh-network-location button .van-icon{margin-right:4px}
.lh-network-location button:disabled{opacity:.6}
.lh-network-location-note{margin:0 0 7px;font-size:11px;color:#738199;line-height:16px}
.lh-network-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;margin-bottom:10px;padding:3px;border-radius:10px;background:#f1f4f9}
.lh-network-tabs button{min-height:44px;font-size:13px;color:#647089;border:0;background:none;padding:0;white-space:nowrap;border-radius:8px}
.lh-network-tabs button[aria-pressed=true]{color:#3a65ff;background:#fff;font-weight:600;box-shadow:0 2px 6px #33425b10}
.lh-network-map{position:relative;overflow:hidden;border:1px solid #e7edf5;border-radius:12px;background:#f4f7fb}
.lh-network-map-context{position:absolute;top:10px;left:10px;padding:5px 8px;border-radius:6px;background:#ffffffed;font-size:11px;color:#647089;pointer-events:none;max-width:75%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-network-info{height:132px;box-sizing:border-box;margin-top:10px;padding:8px 12px 10px;border:1px solid #e7edf5;border-radius:12px;background:#fff;overflow:hidden}
.lh-network-info header{display:flex;align-items:center;justify-content:space-between;gap:8px;height:35px}
.lh-network-type{color:var(--node-color,#3a65ff);font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-network-info header button{font-size:12px;min-height:44px;color:#3a65ff;background:none;padding:0;flex:none}
.lh-network-info>strong{display:block;color:#25334b;font-size:15px;line-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-network-info p{font-size:12px;line-height:19px;margin:4px 0 0;color:#647089;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lh-network-info .lh-network-capability{color:#435571}
.lh-network-info select{width:100%;height:32px;margin-top:3px;color:#435571;border:1px solid #e7edf5;border-radius:5px;background:#fff;font-size:12px}
.lh-network-demo{margin:7px 0 0;text-align:center;font-size:10px;line-height:16px;color:#8b96a9}
.lh-network-objects{display:grid;gap:8px;padding-top:14px}
.lh-network-objects button{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:58px;border:1px solid #e7edf5;border-radius:9px;padding:10px 12px;background:#fff;text-align:left;font-size:13px;color:#33425b}
.lh-network-objects button[aria-pressed=true]{border-color:#3a65ff;background:#f5f7ff}
.lh-network-objects small{display:block;margin-top:5px;font-size:11px;color:#647089}
.lh-network-empty{font-size:12px;line-height:20px;color:#647089;margin:16px 0}
.lh-network :deep(.lya-network-overview){border:0;border-radius:0;margin:0}
.lh-network :deep(.lya-real-canvas),.lh-network :deep(.lya-real-map){background:#f4f7fb}
.lh-network :deep(.lya-network-legend){bottom:17px;font-size:10px;color:#647089;gap:9px;background:#fffffff2}
</style>
