<template>
  <section class="lc-page" aria-label="货源详情">
    <header v-show="!quoteOpen" class="lc-nav"><button aria-label="返回货源列表" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>货源详情</h1><span class="lc-status">{{ quote?'已报价':'待报价' }}</span></header>
    <main v-show="!quoteOpen" class="lc-content lc-has-actions">
      <section class="lc-map" aria-label="货源运输地点"><AssistantRouteMap :scheme="route" :places="mapPlaces" compact :expanded="expanded" :selected="selected" @expand="expanded=!expanded" @select="selected=$event"/></section>
      <section class="lc-section lc-core" aria-label="货物、运费和装卸时间">
        <div class="lc-core-title">
          <h2><span v-if="cargo.businessType" class="lc-business-type">{{ cargo.businessType }}</span>{{ cargo.goods }} <b>{{ cargo.quantity }}</b></h2>
          <p class="lc-core-price" :aria-label="cargo.price.label + '，' + cargoPrice(cargo)"><template v-if="cargo.price.amount != null">{{ cargo.price.amount.toLocaleString('zh-CN') }}<small>{{ cargo.price.unit }}</small></template><template v-else>邀约报价</template></p>
        </div>
        <div class="lc-time-pair">
          <div class="lc-time"><strong>{{ dateLabel(cargo.loadDate) }}</strong><span>{{ weekdayLabel(cargo.loadDate) }} 预计装货</span></div>
          <span class="lc-date-link" aria-hidden="true"></span>
          <div class="lc-time lc-time-right"><strong>{{ dateLabel(cargo.unloadDate) }}</strong><span>{{ weekdayLabel(cargo.unloadDate) }} 预计卸货</span></div>
        </div>
        <div class="lc-core-tags"><span v-for="row in cargoPublishedRequirements(cargo)" :key="row[0]" class="lc-tag">{{ row[1] }}</span></div>
      </section>
      <section class="lc-section" aria-label="装卸地址与需求说明">
        <div v-for="(place,index) in [cargo.origin,cargo.destination]" :key="index" class="lc-address"><span :class="{end:index===1}">{{ index?'终':'起' }}</span><div><strong>{{ place.city }}市·{{ place.district }}</strong><p>{{ place.address }}</p></div><van-icon name="location-o"/></div>
        <p v-if="cargo.summary" class="lc-description">备注：{{ cargo.summary }}</p>
      </section>
      <section class="lc-section"><h2>运输信息</h2><dl class="lc-facts"><template v-for="row in cargoPublishedRequirements(cargo)" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></template></dl></section>
      <section class="lc-section"><h2>报价设置</h2><dl class="lc-facts"><dt>报价截止</dt><dd>{{ cargo.deadline }}</dd><template v-if="['到付','月结','现结'].includes(cargo.payment)"><dt>支付方式</dt><dd>{{ cargo.payment }}</dd></template></dl></section>
      <section class="lc-section"><div class="lc-company-heading"><h2>发布企业</h2><button @click="info='company'">企业详情<van-icon name="arrow"/></button></div><strong class="lc-company-name">{{ cargo.publisher.name }}</strong><dl class="lc-facts"><dt>联系人</dt><dd>{{ cargo.publisher.contact }}</dd><dt>联系电话</dt><dd>{{ cargo.publisher.phone }}</dd></dl></section>
      <section class="lc-section"><h2>货源信息</h2><dl class="lc-facts"><dt>货源编号</dt><dd>{{ cargo.number }}</dd><dt>发布时间</dt><dd>{{ cargo.publishedAt }}</dd></dl></section>

    </main>
    <footer v-show="!quoteOpen" class="lc-actions"><FavoriteButton :saved="saved" :label="cargo.goods+'货源'" @toggle="toggleSaved"/><button @click="info='contact'">联系货主</button><button class="lc-primary" @click="openQuote">{{ quote?'查看我的报价':'提交报价' }}</button></footer>
    <CargoQuoteFlow v-if="quoteOpen" :cargo="cargo" :existing="quote" :teleport="teleport" @close="quoteOpen=false"/>
    <van-popup :show="!!info" position="bottom" round :teleport="teleport" :z-index="85" :style="{position:'absolute'}" :overlay-style="{position:'absolute'}" @update:show="value=>{if(!value)info=''}"><div class="lc-quote-panel"><div class="lc-panel-heading"><h2>{{ info==='company'?'发布企业':'联系货主' }}</h2><button aria-label="关闭企业信息" @click="info=''"><van-icon name="cross"/></button></div><strong class="lc-company-name">{{ cargo.publisher.name }}</strong><dl class="lc-facts"><dt>联系人</dt><dd>{{ cargo.publisher.contact }}</dd><dt>联系电话</dt><dd>{{ cargo.publisher.phone }}</dd></dl></div></van-popup>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import AssistantRouteMap from './AssistantRouteMap.vue'
import FavoriteButton from './FavoriteButton.vue'
import CargoQuoteFlow from './CargoQuoteFlow.vue'
import { cargoPrice, cargoPublishedRequirements, dateLabel } from './cargo-data.js'
import { cargoStore, toggleCargoFavorite } from './cargo-store.js'
const props=defineProps({cargo:{type:Object,required:true},teleport:Object})
defineEmits(['back'])
const expanded=ref(false),selected=ref(0),quoteOpen=ref(false),info=ref('')
// 公开托运单提供装卸地点，尚未选定承运方案，不展示供给线路。
const route=computed(()=>({id:props.cargo.id,name:`${props.cargo.origin.city} → ${props.cargo.destination.city}`,segments:[]}))
const mapPlaces=computed(()=>[{id:'cargo-origin',name:props.cargo.origin.city+'·'+props.cargo.origin.district,xy:props.cargo.origin.xy},{id:'cargo-destination',name:props.cargo.destination.city+'·'+props.cargo.destination.district,xy:props.cargo.destination.xy}])
const saved=computed(()=>cargoStore.favorites.includes(props.cargo.id))
const quote=computed(()=>cargoStore.quotes.find(item=>item.cargoId===props.cargo.id))
function weekdayLabel(date) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(`${date}T12:00:00`).getDay()]
}
function toggleSaved(){const value=toggleCargoFavorite(props.cargo.id);showToast({message:cargoStore.storageError?'收藏仅保存在本次会话':value?'已收藏，可在我的收藏查看':'已取消收藏',teleport:props.teleport})}
function openQuote(){quoteOpen.value=true}
</script>
<style src="./cargo-ui.css"></style>
<style scoped>
.lc-map{margin:-12px -14px 12px}.lc-map :deep(.lya-real-map){margin:0;border:0;border-radius:0}.lc-map :deep(.lya-map-legend){display:none}
.lc-map :deep(.lya-map-expand),.lc-map :deep(.lya-map-controls button[aria-label="地图缩小一级"]){display:none}
.lc-map>p{font-size:11px;margin:0;padding:8px 14px;color:#647089;background:#edf2ff}/* 沿用智运货源详情的主卡、时间、标签和地址层级，样式仅作用于联运详情。 */
.lc-section{padding:16px 14px}
.lc-core{padding-bottom:14px}
.lc-core-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.lc-core-title h2{margin:0;min-width:0;font-size:18px;line-height:24px;font-weight:600;color:#333;overflow-wrap:anywhere}
.lc-core-title .lc-business-type{display:inline-block;vertical-align:middle;margin-right:6px;padding:2px 6px;border-radius:4px;color:#3157ee;background:#e6edff;font-size:11px;line-height:18px;white-space:nowrap}
.lc-core-title h2 b{font-weight:600}
.lc-core-price{display:flex;flex:none;align-items:baseline;margin:0;color:#3a65ff;font-size:22px;line-height:24px;font-weight:700;white-space:nowrap}
.lc-core-price small{margin-left:2px;font-size:11px;line-height:16px;font-weight:400}
.lc-time-pair{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px}
.lc-time{display:flex;flex:1;min-width:0;flex-direction:column}
.lc-time-right{align-items:flex-end;text-align:right}
.lc-time strong{font-size:26px;line-height:28px;font-weight:700;color:#333;overflow-wrap:anywhere}
.lc-time span{margin-top:5px;color:#a1a1a1;font-size:12px;line-height:17px;white-space:nowrap}
.lc-date-link{flex:none;width:36px;margin-bottom:20px;border-top:1px solid #d9d9d9}
.lc-core-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.lc-tag{display:inline-flex;align-items:center;gap:4px;min-height:18px;padding:1px 8px;border:1px solid #d7dff5;border-radius:3px;color:#7180a6;font-size:10px;line-height:18px;overflow-wrap:anywhere}
.lc-address{position:relative;display:flex;align-items:flex-start;gap:12px;padding-bottom:30px}
.lc-address+.lc-address{padding-bottom:0}
.lc-address:first-child:after{content:'';position:absolute;left:8px;top:26px;bottom:5px;border-left:3px dotted #e6e6e6}
.lc-address>span{display:grid;place-items:center;flex:none;width:18px;height:18px;margin-top:2px;border-radius:4px;background:#e1e4ec;color:#3a4564;font-size:10px;font-weight:600}
.lc-address>span.end{background:#3a65ff;color:#fff}
.lc-address>div{flex:1;min-width:0}
.lc-address strong{font-size:14px;line-height:19px;font-weight:600;color:#333}
.lc-address p{margin:2px 0 0;font-size:12px;line-height:17px;color:#999}
.lc-address>.van-icon{flex:none;font-size:17px;color:#c1c8d5}
.lc-description{margin:12px 0 0;padding:10px;background:#f8f8fb;border-radius:8px;color:#333;font-size:12px;line-height:17px;overflow-wrap:anywhere}
.lc-facts{grid-template-columns:85px minmax(0,1fr);gap:14px 12px;font-size:14px;line-height:20px}
.lc-company-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.lc-company-heading h2{margin:0}.lc-company-heading button{background:none;border:0;color:#4064ff;font-size:12px}.lc-company-name{font-size:14px;line-height:22px}.lc-company-credit{display:flex;flex-wrap:wrap;gap:9px;font-size:11px;margin:7px 0 14px;color:#c77b17}.lc-company-credit>span:first-child{color:#4064ff}.lc-local-note{font-size:11px;color:#8b93a5;line-height:18px;margin:14px 0 0}.lc-quote-panel{padding:16px 16px 28px;color:#30343b}.lc-panel-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.lc-panel-heading h2{font-size:16px;margin:0}.lc-panel-heading button{border:0;background:none;min-width:36px;min-height:36px;font-size:18px;color:#8b93a5}.lc-quote-panel form>label{display:block;font-size:12px;margin-bottom:14px}.lc-quote-panel input,.lc-quote-panel textarea,.lc-quote-panel select{box-sizing:border-box;width:100%;font:inherit;font-size:13px;padding:10px;border:1px solid #e2e7f0;border-radius:6px;background:#fafbfe;color:#333;margin-top:7px}.lc-quote-panel textarea{min-height:65px;resize:vertical}.lc-amount-input{display:flex;gap:8px}.lc-amount-input input{flex:1;min-width:0}.lc-amount-input select{width:85px;flex:none}.lc-submit{width:100%;min-height:44px;margin-top:14px;background:#4064ff;border:0;color:#fff;border-radius:8px;font-size:14px}.lc-form-error{font-size:12px;color:#ce514f}
</style>
