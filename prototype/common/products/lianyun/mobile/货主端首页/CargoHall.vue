<template>
  <section class="lc-page" aria-label="货源大厅">
    <header class="lc-nav"><button aria-label="返回首页" @click="$emit('back')"><van-icon name="arrow-left"/></button><h1>货源大厅</h1><span/></header>
    <main class="lc-content">
      <section class="lc-filters" aria-label="货源筛选">
        <div class="lc-location-filters"><label>装货地<select v-model="origin"><option value="">不限</option><option v-for="city in origins" :key="city">{{ city }}</option></select></label><button aria-label="交换装卸城市" @click="swapPlaces"><van-icon name="exchange"/></button><label>卸货地<select v-model="destination"><option value="">不限</option><option v-for="city in destinations" :key="city">{{ city }}</option></select></label></div>
        <nav class="lc-mode-filters" aria-label="货源业务类型"><button v-for="item in businessTypes" :key="item.key" :aria-pressed="businessType===item.key" @click="businessType=item.key">{{ item.label }}</button></nav>
        <nav class="lc-mode-filters" aria-label="运输方式"><button v-for="item in cargoModes" :key="item.key" :aria-pressed="mode===item.key" @click="mode=item.key">{{ item.label }}</button></nav>
        <div class="lc-secondary"><label><span class="lc-sr-only">货物类型</span><select v-model="category"><option value="">货物类型</option><option v-for="item in categories" :key="item">{{ item }}</option></select></label><label class="lc-date-filter"><span>装货时间</span><input v-model="loadDate" type="date" aria-label="装货日期"/></label></div>
        <div class="lc-more"><button @click="reset">重置筛选</button></div>
      </section>
      <div class="lc-list-heading"><h2>可报价货源</h2><label><span class="lc-sr-only">排序方式</span><select v-model="sort"><option value="latest">最新发布</option><option value="load">装货时间</option></select></label></div>
      <CargoCard v-for="cargo in filtered" :key="cargo.id" :cargo="cargo" @open="$emit('open',$event)"/>
      <div v-if="!filtered.length" class="lc-empty"><van-icon name="search"/><p>暂无符合条件的货源</p><button @click="reset">重置筛选</button></div>
    </main>
  </section>
</template>
<script setup>
import { computed, ref } from 'vue'
import CargoCard from './CargoCard.vue'
import { cargos, cargoModes } from './cargo-data.js'
defineEmits(['back','open'])
const businessTypes=[{key:'all',label:'全部'},{key:'散杂货',label:'散杂货'},{key:'集装箱',label:'集装箱'}]
const businessType=ref('all')
const origin=ref(''),destination=ref(''),mode=ref('all'),category=ref(''),loadDate=ref(''),sort=ref('latest')
const origins=[...new Set(cargos.flatMap(item=>[item.origin.city,item.destination.city]))],destinations=origins,categories=[...new Set(cargos.map(item=>item.category))]
const filtered=computed(()=>cargos.filter(item=>(businessType.value==='all'||item.businessType===businessType.value)&&(!origin.value||item.origin.city===origin.value)&&(!destination.value||item.destination.city===destination.value)&&(mode.value==='all'||item.mode===mode.value)&&(!category.value||item.category===category.value)&&(!loadDate.value||item.loadDate===loadDate.value)).sort((a,b)=>sort.value==='load'?a.loadDate.localeCompare(b.loadDate):b.publishedAt.localeCompare(a.publishedAt)))
function reset(){businessType.value='all';origin.value='';destination.value='';mode.value='all';category.value='';loadDate.value='';sort.value='latest'}
function swapPlaces(){const value=origin.value;origin.value=destination.value;destination.value=value}
</script>
<style src="./cargo-ui.css"></style>
<style scoped>
.lc-filters{padding:11px;background:#fff;border-radius:12px;margin-bottom:14px}.lc-location-filters{display:flex;align-items:center;gap:6px}.lc-location-filters label{flex:1;min-width:0;padding:8px;background:#f5f7fc;border-radius:7px;font-size:11px}.lc-location-filters select{display:block;width:100%;margin-top:4px;font-size:13px}.lc-location-filters>button{color:#4064ff;background:none;border:0;min-height:40px;padding:2px;font-size:18px}.lc-mode-filters{display:flex;gap:5px;margin:10px 0}.lc-mode-filters button{flex:1;min-height:38px;border:1px solid #e7ebf4;border-radius:7px;background:#fff;color:#647089;font-size:12px}.lc-mode-filters button[aria-pressed=true]{color:#4064ff;background:#eaf0ff;border-color:#dbe5ff}.lc-secondary{display:flex;align-items:center;gap:8px}.lc-secondary>label{flex:1;min-width:0;border:1px solid #e7ebf4;border-radius:6px;padding:7px;font-size:11px}.lc-secondary select{width:100%;font-size:12px}.lc-date-filter>span{display:block;color:#8b93a5;margin-bottom:4px}.lc-date-filter input{width:100%;min-width:0;border:0;background:none;font-size:11px;color:#556681;font-family:inherit}.lc-more{margin-top:9px;font-size:12px}.lc-more summary{display:flex;justify-content:space-between;align-items:center;list-style:none;cursor:pointer;padding:6px;color:#647089}.lc-more label{display:flex;align-items:center;justify-content:space-between;margin:8px 0}.lc-more button,.lc-empty button{min-height:40px;border:0;border-radius:6px;background:#edf2ff;color:#4064ff;padding:0 14px}.lc-list-heading{display:flex;justify-content:space-between;align-items:center;margin:0 0 10px}.lc-list-heading h2{margin:0;font-size:15px}.lc-list-heading select{font-size:12px;color:#647089}.lc-filters select,.lc-list-heading select{border:0;background:transparent;color:#556681;max-width:100%;font-family:inherit}.lc-empty{text-align:center;padding:36px 10px;color:#8b93a5;font-size:13px}.lc-empty>.van-icon{font-size:28px}
</style>
