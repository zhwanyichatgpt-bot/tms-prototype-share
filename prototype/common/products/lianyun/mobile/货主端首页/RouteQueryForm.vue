<template>
  <form class="lya-simple-query" :class="{'lya-home-query':compact}" @submit.prevent="query">
    <van-tabs class="lya-mode-tabs" :active="mode" @update:active="$emit('update:mode',$event)" :ellipsis="false" :swipe-threshold="6" line-width="20" line-height="3" background="transparent" color="var(--ly-brand)" title-active-color="var(--ly-text)" title-inactive-color="var(--ly-secondary)" aria-label="查询运输方式"><van-tab v-for="option in transportModes" :key="option.key" :name="option.key" :title="option.label"/></van-tabs>
    <div class="lya-query-addresses">
      <button ref="originButton" type="button" :aria-label="'装货地，' + (origin?.name || '未选择')" :aria-invalid="Boolean(queryError && !origin)" :aria-describedby="queryError ? errorId : undefined" @click="openPicker('origin')"><i></i><span><small>装货地</small><strong :class="{ placeholder: !origin }">{{ origin?.name || '选择省市、地区或港口' }}</strong></span><van-icon name="arrow-down"/></button>
      <button ref="destinationButton" type="button" class="destination" :aria-label="'卸货地，' + (destination?.name || '未选择')" :aria-invalid="Boolean(queryError && (!destination || origin?.id === destination?.id))" :aria-describedby="queryError ? errorId : undefined" @click="openPicker('destination')"><i></i><span><small>卸货地</small><strong :class="{ placeholder: !destination }">{{ destination?.name || '选择省市、地区或港口' }}</strong></span><van-icon name="arrow-down"/></button>
    </div>
    <label class="lya-optional-goods"><span>货品 <small>选填</small></span><input v-model="goodsText" aria-label="货品（选填）" placeholder="如：普货、设备或冷链货物" maxlength="100"/></label>
    <slot/>
    <p v-if="queryError" class="lya-error" role="alert" :id="errorId">{{ queryError }}</p>
    <button type="submit" class="lya-primary" :disabled="loading">{{ loading ? '查询中…' : queryLabel }}</button>
    <van-popup v-model:show="pickerOpen" :duration="0" round position="bottom" :teleport="teleport" :style="{ position:'absolute' }" :overlay-style="{ position:'absolute' }" class="lya-address-picker">
      <div class="lya-heading"><h3>选择{{ pickerMode === 'origin' ? '装货地' : '卸货地' }}</h3><button type="button" aria-label="关闭地点选择" @click="pickerOpen = false"><van-icon name="cross"/></button></div>
      <div class="lya-address-tabs"><button v-for="tab in addressTabs" :key="tab.key" type="button" :class="{active: pickerTab === tab.key}" @click="pickerTab = tab.key; level = 0; regionPath = []">{{ tab.label }}</button></div>
      <p class="lya-secondary">选择具体地区或物流节点，查询到该地点的运输服务。</p>
      <div v-if="level === 0 && pickerTab === 'region'" class="lya-picker-quick"><small>快捷选择</small><button v-for="location in quickLocations" :key="location.id" type="button" @click="choose(location)">{{ location.name }}</button></div>
      <template v-if="pickerTab === 'region' || pickerTab === 'overseas'">
        <div class="lya-region-path"><button v-for="(name,index) in regionPath" :key="index" type="button" @click="level = index; regionPath = regionPath.slice(0,index)">{{ name }} <van-icon name="arrow"/></button><span>{{ level === 0 ? pickerTab === 'region' ? '选择省份' : '选择国家' : level === 1 ? '选择城市' : '选择区域 / 节点' }}</span></div>
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
const props = defineProps({ teleport: { default:null }, loading:Boolean, mode:{default:'all'}, compact:Boolean, queryLabel:{default:'查询运输方案'} })
const emit = defineEmits(['query','update:mode'])
const errorId = useId()
const originButton=ref(null),destinationButton=ref(null)
const origin = ref(null), destination = ref(null), goodsText = ref(''), queryError = ref('')
const pickerOpen = ref(false), pickerMode = ref('origin'), pickerTab = ref('region'), level = ref(0), regionPath = ref([])
const addressTabs = [{key:'region',label:'国内地区'},{key:'port',label:'港口 / 场站'},{key:'overseas',label:'海外地区'}]
const quickLocations = ['yangluo','changsha','islamabad','sh-port'].map(id=>locations.find(item=>item.id===id))
const portLocations = locations.filter(location => location.type === 'port')
const candidates = computed(() => locations.filter(location => location.type === pickerTab.value && regionPath.value.every((item,index) => location.region[index] === item)))
const regionOptions = computed(() => [...new Set(candidates.value.map(item => item.region[level.value]))])
function openPicker(mode) { pickerMode.value = mode; pickerOpen.value = true; pickerTab.value = 'region'; level.value = 0; regionPath.value = [] }
function chooseRegion(item) { if(level.value === 2) choose(candidates.value.find(location => location.region[2] === item)); else {regionPath.value.push(item); level.value++} }
function choose(location) { if(pickerMode.value === 'origin') origin.value = location; else destination.value = location; pickerOpen.value = false; queryError.value = '' }
function query() { if(!origin.value || !destination.value) {queryError.value = '请选择装货地和卸货地，货品可以不填。';(origin.value?destinationButton:originButton).value?.focus();return} if(origin.value.id === destination.value.id) {queryError.value = '请选不同的装货地和卸货地。';destinationButton.value?.focus();return} queryError.value = ''; emit('query',{origin:origin.value,destination:destination.value,goodsText:goodsText.value,transportMode:props.mode}) }
function prefill(demand) { origin.value = resolveLocation(demand.origin) || null; destination.value = resolveLocation(demand.destination) || null; goodsText.value = demand.goodsProvided ? demand.goodsDescription || demand.goods : '' }
function clear() { origin.value = null; destination.value = null; goodsText.value = ''; queryError.value = '' }
defineExpose({ prefill, clear })
</script>
