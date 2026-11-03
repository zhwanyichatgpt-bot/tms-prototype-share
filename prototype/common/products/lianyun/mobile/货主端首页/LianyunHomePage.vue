<template>
  <main ref="page" class="lyhp-page" :class="['lyhp-state-'+state,{'lyhp-collapsed':collapsed}]" aria-label="至简联运首页" @scroll.passive="onScroll">
    <header ref="header" class="lyhp-header">
      <button class="lyhp-region" aria-label="选择当前区域" @click="$emit('region')"><van-icon name="location"/><span>{{ region || '定位名称...' }}</span><van-icon name="arrow-down"/></button>
      <button class="lyhp-publish" @click="$emit('publish')"><img :src="asset('publish.svg')" alt=""/>发布货源</button>
    </header>
    <div class="lyhp-query-top">
      <div class="lyhp-query-wrap"><RouteQueryForm ref="queryForm" home-design v-model:mode="mode" :teleport="teleport" @query="$emit('query',$event)"/><button class="lyhp-chat" aria-label="和小简聊聊" @click="$emit('assistant')"><img :src="asset('chat-strip.svg')" alt=""/></button></div>
      <section class="lyhp-promos" aria-label="行业服务"><button aria-label="行业解决方案" @click="$emit('industry')"><img :src="asset('industry-tile.png')" alt="行业解决方案"/></button><div><img :src="asset('fleet-tile.png')" alt="车队管理"/></div></section>
    </div>
    <section ref="recommendations" class="lyhp-recommendations" aria-label="推荐内容"><div class="lyhp-sticky-controls">
      <nav class="lyhp-tabs" role="tablist" aria-label="推荐分类">
        <button v-for="tab in tabs" :key="tab.key" role="tab" :aria-selected="state===tab.key" :aria-controls="'home-panel-'+tab.key" @click="changeState(tab.key)"><img v-if="state===tab.key" :src="asset('tab-'+tab.key+'.svg')" alt=""/><span>{{ tab.label }}</span><img v-if="state===tab.key" class="lyhp-tab-line" :src="asset('tab-underline.svg')" alt=""/></button>
      </nav>
      <nav v-if="collapsed" class="lyhp-filters" :aria-label="state==='cargo'?'货源运输方式':state==='service'?'方案运输方式':'企业运输方式'"><button v-for="option in filters" :key="option.key" :aria-pressed="filter===option.key" @click="filter=option.key">{{ option.label }}</button></nav>
      </div>
      <div :id="'home-panel-'+state" role="tabpanel" :aria-label="tabs.find(tab=>tab.key===state).label">
        <div v-if="state==='cargo'" class="lyhp-cargo-list">
          <CargoCard v-for="cargo in visibleCargos" :key="cargo.id" :cargo="cargo" :match="recommendedCargoIds.has(cargo.id)?{score:96}:cargo.recommendation" :distances="recommendedCargoIds.has(cargo.id)?['1.2km','328.9km']:[]" :show-estimate="recommendedCargoIds.has(cargo.id)" @open="$emit('cargo',$event)"/>
          <p v-if="!visibleCargos.length" class="lyhp-empty">当前区域暂无推荐货源</p>
        </div>
        <template v-else-if="state==='service'">
          <div class="lyhp-service-list"><button v-for="service in visibleServices" :key="service.id" class="lyhp-service-card" @click="$emit('service',service)">
            <div class="lyhp-service-route"><div><b>江苏·{{ service.from }}</b><small>相城区</small></div><div class="lyhp-route-graphic"><img :src="asset('transport-'+service.homeArt+'.png')" alt=""/><small>{{ service.duration }}</small></div><div><b>浙江·{{ service.to }}</b><small>萧山区</small></div><div class="lyhp-service-price"><div><b>70-90</b><span>元/吨</span></div><small>参考单价</small></div></div>
            <div class="lyhp-tags"><span>{{ modeLabel[service.mode] }}</span><span v-for="tag in service.tags" :key="tag">{{ tag }}</span></div><p class="lyhp-service-count">运输路线{{ service.homeDesignChannel.paths.length }}条 <i></i> 经营方案{{ service.homeDesignChannel.schemes.length }}个</p>
            <div class="lyhp-card-footer"><span><img :src="asset('publisher-logo.png')" alt=""/>大同运输物流有限公司</span><time>10分钟前发布</time></div>
          </button><p v-if="!visibleServices.length" class="lyhp-empty">暂无符合当前条件的方案</p></div>
        </template>
        <div v-else class="lyhp-provider-list"><article v-for="row in visibleProviders" :key="row.key" class="lyhp-provider-card">
          <button class="lyhp-provider-main" :aria-label="'查看'+row.company.name" @click="$emit('provider',row.company)"><img class="lyhp-provider-logo" :src="asset(row.logo)" alt=""/><div class="lyhp-provider-info"><div><b>{{ row.company.name }}</b><img :src="asset('verified.svg')" alt="认证企业"/></div><p>累计承运 <b>345</b> 单 <i></i> 承运量 <b>5,345万吨</b></p></div><p class="lyhp-provider-description">{{ row.company.description }}</p><p class="lyhp-provider-routes"><span v-for="n in row.routes" :key="n">{{ n===1 ? '常跑 江苏' : '江苏' }} → 湖北</span></p><span class="lyhp-provider-area">服务华东</span></button>
          <button class="lyhp-provider-rating" :aria-label="row.company.name+'服务评价'" @click="$emit('reviews',row.company)"><b>{{ row.company.score }}</b><small>{{ row.company.reviewCount }}条评价</small></button>
        </article><p v-if="!visibleProviders.length" class="lyhp-empty">当前区域暂无推荐企业</p></div>
      </div>
    </section>
  </main>
</template>
<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { cargos as allCargos } from './cargo-data.js'
import { visibleInCargoDiscovery } from './cargo-participation.js'
import CargoCard from './CargoCard.vue'
import RouteQueryForm from './RouteQueryForm.vue'
import './home-design.css'
const props=defineProps({fixtures:{type:Object,required:true},teleport:{default:null},region:String})
defineEmits(['region','publish','assistant','industry','query','cargo','service','provider','reviews'])
const mode=defineModel('mode',{default:'all'})
const page=ref(null),header=ref(null),recommendations=ref(null),collapsed=ref(false)
// 三个页签共用同一滚动容器；顶部内容自然移出，页签与筛选吸顶。
function onScroll(){if(!page.value||!header.value||!recommendations.value)return;const threshold=recommendations.value.offsetTop-header.value.offsetHeight;collapsed.value=page.value.scrollTop>=threshold-1}
async function changeState(key){const keepCollapsed=collapsed.value;state.value=key;filter.value='all';await nextTick();if(keepCollapsed&&page.value&&recommendations.value&&header.value)page.value.scrollTop=recommendations.value.offsetTop-header.value.offsetHeight;onScroll()}
onMounted(onScroll)
const state=ref('cargo'),filter=ref('all'),queryForm=ref(null)
const asset=name=>'/lianyun-mobile-assets/home-design/'+name
const tabs=[{key:'cargo',label:'精选货源'},{key:'service',label:'运输方案'},{key:'provider',label:'物流企业'}]
const filters=[{key:'all',label:'推荐'},{key:'road',label:'公路'},{key:'water',label:'水路'},{key:'rail',label:'铁路'},{key:'multi',label:'联运'},{key:'air',label:'低空'}]
const modeLabel={road:'公路运输',water:'水路运输',rail:'铁路运输',multi:'公水联运'}
const inRegion=(...labels)=>!props.region||props.region==='全国'||labels.some(label=>label?.includes(props.region.replace(/市$/, '')))
const recommendedCargoIds=computed(()=>new Set(props.fixtures.cargos.map(row=>row.id)))
const orderedCargos=computed(()=>[...props.fixtures.cargos,...allCargos.filter(row=>!recommendedCargoIds.value.has(row.id))])
const matchesMode=row=>filter.value==='all'||row.mode===filter.value||row.transportModes?.includes(filter.value)
const visibleCargos=computed(()=>orderedCargos.value.filter(row=>visibleInCargoDiscovery(row)&&matchesMode(row)&&inRegion(row.origin.city,row.destination.city)))
const visibleProviders=computed(()=>props.fixtures.providers.filter(row=>matchesMode(row.company)&&inRegion(row.company.city)))
const visibleServices=computed(()=>props.fixtures.services.filter(row=>(filter.value==='all'||row.mode===filter.value)&&inRegion(row.from,row.to)))
defineExpose({prefill:demand=>queryForm.value?.prefill(demand)})
</script>
