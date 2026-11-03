<template>
  <form class="lya-simple-query" :class="{'lya-home-query':compact,'lyhp-query':homeDesign,'lyf-edit-query':editDesign}" @submit.prevent="query">
    <nav v-if="homeDesign" class="lyhp-mode-tabs" aria-label="查询运输方式"><button v-for="option in transportModes" :key="option.key" type="button" :aria-pressed="mode===option.key" @click="$emit('update:mode',option.key)">{{ option.label }}<img v-if="mode===option.key" src="/lianyun-mobile-assets/home-design/tab-underline.svg" alt=""/></button></nav>
    <section v-else-if="editDesign" class="lyf-edit-modes"><h4>运输方式</h4><nav class="lyf-edit-mode-options" aria-label="修改运输方式"><button v-for="option in transportModes" :key="option.key" type="button" :aria-pressed="mode===option.key" @click="$emit('update:mode',option.key)">{{ option.label }}<van-icon v-if="mode===option.key" name="checked"/></button></nav></section>
    <van-tabs v-else class="lya-mode-tabs" :active="mode" @update:active="$emit('update:mode',$event)" :ellipsis="false" :swipe-threshold="6" line-width="20" line-height="3" background="transparent" color="var(--ly-brand)" title-active-color="var(--ly-text)" title-inactive-color="var(--ly-secondary)" aria-label="查询运输方式"><van-tab v-for="option in transportModes" :key="option.key" :name="option.key" :title="option.label"/></van-tabs>
    <h4 v-if="editDesign" class="lyf-edit-address-title">装卸货地址</h4>
    <div class="lya-query-addresses">
      <button ref="originButton" type="button" :aria-label="'装货地，' + (origin?.name || '未选择')" :aria-invalid="Boolean(queryError && !origin)" :aria-describedby="queryError ? errorId : undefined" @click="openPicker('origin')"><i></i><span><template v-if="homeDesign"><strong>将从 <em>{{ origin?.name || '选择装货城市' }}</em> 装货</strong><small>推荐附近装货港，周边船舶响应更快</small></template><template v-else><small>装货地</small><strong :class="{ placeholder: !origin }">{{ origin?.name || '选择城市或物流节点' }}</strong></template></span><van-icon :name="homeDesign || editDesign ? 'arrow' : 'arrow-down'"/></button>
      <button ref="destinationButton" type="button" class="destination" :aria-label="'卸货地，' + (destination?.name || '未选择')" :aria-invalid="Boolean(queryError && (!destination || origin?.id === destination?.id))" :aria-describedby="queryError ? errorId : undefined" @click="openPicker('destination')"><i></i><span><small v-if="!homeDesign">卸货地</small><strong :class="{ placeholder: !destination }">{{ destination?.name || (homeDesign ? '卸到哪个港口' : '选择城市或物流节点') }}</strong></span><van-icon :name="homeDesign || editDesign ? 'arrow' : 'arrow-down'"/></button>
    </div>
    <div v-if="homeDesign" class="lyhp-goods"><button type="button" class="lyhp-goods-entry" aria-label="选择货品" @click="openGoodsPicker"><span>货品</span><span :class="{placeholder:!goodsText}">{{ goodsText || '（选填）' }}</span></button><button v-for="goods in ['冷链货物','普货']" :key="goods" type="button" :aria-pressed="goodsText===goods" @click="goodsText=goods">{{ goods }}</button><button type="button" class="lyhp-goods-more" aria-label="更多货品" @click="openGoodsPicker"><van-icon name="arrow"/></button></div>
    <div v-else-if="editDesign" class="lyf-edit-goods"><span>运输货品<small>（选填）</small></span><button v-if="goodsText" type="button" :title="goodsText" @click="openGoodsPicker"><span>{{ goodsText }}</span></button><button v-if="goodsText" type="button" aria-label="清空运输货品" @click="goodsText=''">×</button><button type="button" class="lyf-edit-goods-more" aria-label="选择货品" @click="openGoodsPicker"><van-icon name="arrow"/></button></div>
    <div v-else class="lya-optional-goods"><span>货品 <small>选填</small></span><input v-model="goodsText" aria-label="货品（选填）" placeholder="如：普货、设备或冷链货物" maxlength="100"/><button type="button" class="lya-goods-trigger" aria-label="选择货品" @click="openGoodsPicker"><van-icon name="arrow"/></button></div>
    <slot/>
    <p v-if="queryError" class="lya-error" role="alert" :id="errorId">{{ queryError }}</p>
    <button type="submit" class="lya-primary" :disabled="loading"><img v-if="homeDesign" src="/lianyun-mobile-assets/home-design/query-sparkle.svg" alt=""/>{{ loading ? '查询中…' : queryLabel }}</button>
    <div v-if="homeDesign" class="lyhp-query-caption"><img src="/lianyun-mobile-assets/home-design/brand-caption.png" alt=""/><i></i><span>N 种解法，灵活选配</span></div>
    <van-popup v-model:show="goodsPickerOpen" :duration="0" round position="bottom" :teleport="teleport" :style="{ position:'absolute' }" :overlay-style="{ position:'absolute' }" class="lya-address-picker lya-goods-picker">
      <div class="lya-heading"><h3>选择货品</h3><button type="button" aria-label="取消货品选择" @click="goodsPickerOpen=false"><van-icon name="cross"/></button></div>
      <div class="lya-goods-options"><button v-for="goods in ['普货','冷链货物']" :key="goods" type="button" :aria-pressed="goodsDraft===goods" @click="goodsDraft=goods">{{ goods }}<van-icon v-if="goodsDraft===goods" name="success"/></button></div>
      <label class="lya-goods-custom">货品名称或补充说明（选填）<input v-model="goodsDraft" aria-label="货品名称或补充说明" placeholder="可填写其他货品名称、箱型或数量" maxlength="100" @keydown.enter.prevent="confirmGoods"/></label>
      <div class="lya-goods-actions"><button type="button" @click="goodsDraft=''">清空</button><button type="button" @click="confirmGoods">确定</button></div>
    </van-popup>
    <van-popup v-model:show="pickerOpen" :duration="0" round position="bottom" :teleport="teleport" :style="{ position:'absolute' }" :overlay-style="{ position:'absolute' }" class="lya-address-picker">
      <div class="lya-heading"><h3>选择{{ pickerMode === 'origin' ? '装货地' : '卸货地' }}</h3><button type="button" aria-label="关闭地点选择" @click="pickerOpen = false"><van-icon name="cross"/></button></div>
      <div class="lya-address-tabs"><button v-for="tab in addressTabs" :key="tab.key" type="button" :class="{active: pickerTab === tab.key}" @click="pickerTab = tab.key; level = 0; regionPath = []">{{ tab.label }}</button></div>
      <p class="lya-secondary">地区选择到城市即可，也可直接选择港口或场站。</p>
      <div v-if="level === 0 && pickerTab === 'region'" class="lya-picker-quick"><small>快捷选择</small><button v-for="location in quickLocations" :key="location.id" type="button" @click="choose(location)">{{ location.name }}</button></div>
      <template v-if="pickerTab === 'region' || pickerTab === 'overseas'">
        <div class="lya-region-path"><button v-for="(name,index) in regionPath" :key="index" type="button" @click="level = index; regionPath = regionPath.slice(0,index)">{{ name }} <van-icon name="arrow"/></button><span>{{ level === 0 ? pickerTab === 'region' ? '选择省份' : '选择国家' : '选择城市' }}</span></div>
        <div class="lya-address-options"><button v-for="item in regionOptions" :key="item" type="button" @click="chooseRegion(item)">{{ item }}<van-icon name="arrow"/></button></div>
      </template>
      <div v-else class="lya-address-options"><button v-for="item in portLocations" :key="item.id" type="button" @click="choose(item)"><span><strong>{{ item.name }}</strong><small>{{ item.region.join(' · ') }}</small></span><van-icon name="arrow"/></button></div>
    </van-popup>
  </form>
</template>
<script setup>
import { computed, ref, useId } from 'vue'
import { Tabs as VanTabs, Tab as VanTab } from 'vant'
import { transportModes } from './assistant-data.js'
import { locations, resolveLocation } from './assistant-locations.js'
const props = defineProps({ teleport: { default:null }, loading:Boolean, mode:{default:'all'}, compact:Boolean, homeDesign:Boolean, editDesign:Boolean, queryLabel:{default:'查询运输方案'} })
const emit = defineEmits(['query','update:mode'])
const errorId = useId()
const originButton=ref(null),destinationButton=ref(null)
const origin = ref(props.homeDesign ? locations.find(item=>item.id==='fz-mawei') : null), destination = ref(null), goodsText = ref(''), queryError = ref('')
const goodsPickerOpen=ref(false),goodsDraft=ref('')
function openGoodsPicker(){goodsDraft.value=goodsText.value;goodsPickerOpen.value=true}
function confirmGoods(){goodsText.value=goodsDraft.value.trim();goodsPickerOpen.value=false}
const pickerOpen = ref(false), pickerMode = ref('origin'), pickerTab = ref('region'), level = ref(0), regionPath = ref([])
const addressTabs = [{key:'region',label:'国内地区'},{key:'port',label:'港口 / 场站'},{key:'overseas',label:'海外地区'}]
const quickLocations = ['yangluo','changsha','islamabad','sh-port'].map(id=>locations.find(item=>item.id===id))
const portLocations = locations.filter(location => location.type === 'port')
const candidates = computed(() => locations.filter(location => location.type === pickerTab.value && regionPath.value.every((item,index) => location.region[index] === item)))
const regionOptions = computed(() => [...new Set(candidates.value.map(item => item.region[level.value]))])
function openPicker(mode) { pickerMode.value = mode; pickerOpen.value = true; pickerTab.value = 'region'; level.value = 0; regionPath.value = [] }
function chooseRegion(item) { if(level.value === 1) choose(candidates.value.find(location => location.region[1] === item)); else {regionPath.value.push(item); level.value++} }
function choose(location) { if(pickerMode.value === 'origin') origin.value = location; else destination.value = location; pickerOpen.value = false; queryError.value = '' }
function query() { if(!origin.value || !destination.value) {queryError.value = '请选择装货地和卸货地，货品可以不填。';(origin.value?destinationButton:originButton).value?.focus();return} if(origin.value.id === destination.value.id) {queryError.value = '请选不同的装货地和卸货地。';destinationButton.value?.focus();return} queryError.value = ''; emit('query',{origin:origin.value,destination:destination.value,goodsText:goodsText.value,transportMode:props.mode}) }
function prefill(demand) { origin.value = resolveLocation(demand.origin) || null; destination.value = resolveLocation(demand.destination) || null; goodsText.value = demand.goodsProvided ? demand.goodsDescription || demand.goods : '' }
function clear() { origin.value = null; destination.value = null; goodsText.value = ''; queryError.value = '' }
defineExpose({ prefill, clear })
</script>

<style>
.ly-screen .lyhp-goods>.lyhp-goods-entry{display:flex;align-items:center;flex:1;min-width:0;gap:4px;padding:0;background:none;color:#303744;font-size:12px;text-align:left}
.ly-screen .lyhp-goods-entry>span:last-child{font-size:11px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.ly-screen .lyhp-goods-entry .placeholder{color:#9099a9}
.ly-screen .lyhp-goods>.lyhp-goods-more{padding:0;background:none;width:12px;flex:none}
.ly-screen .lya-goods-trigger{flex:none;width:24px;height:24px;padding:0;border:0;background:none;color:#8190a5}
.ly-screen .lya-goods-options{display:flex;gap:10px;margin:16px 0}
.ly-screen .lya-goods-options>button{flex:1;display:flex;align-items:center;justify-content:space-between;border:1px solid #e4eaf3;background:#f5f7fb;border-radius:9px;padding:12px;color:#526079;font-size:14px}
.ly-screen .lya-goods-options>button[aria-pressed=true]{border-color:#4779ef;background:#edf3ff;color:#386bff}
.ly-screen .lya-goods-custom{display:block;color:#60718a;font-size:12px}
.ly-screen .lya-goods-custom input{display:block;box-sizing:border-box;width:100%;margin-top:8px;border:1px solid #e4eaf3;border-radius:9px;padding:12px;font-size:14px;background:#fff;color:#303744}
.ly-screen .lya-goods-actions{display:flex;gap:12px;margin-top:20px}
.ly-screen .lya-goods-actions>button{flex:1;height:44px;border:1px solid #dce5f4;border-radius:10px;background:#fff;color:#526079;font-size:14px}
.ly-screen .lya-goods-actions>button:last-child{flex:2;background:#386bff;border-color:#386bff;color:#fff}
</style>
