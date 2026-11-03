<template>
  <section class="cgr-page" :aria-label="record?'抢单成功':unavailable?'抢单结果':'核对抢单'">
    <header class="cgr-nav"><button type="button" aria-label="返回货源详情" @click="$emit('close')"><van-icon name="arrow-left"/></button><h1>{{ record?'抢单成功':unavailable?'抢单结果':'核对抢单' }}</h1><span class="cgd-tag">抢单货源</span></header>
    <main class="cgr-scroll">
      <section v-if="record||unavailable" class="cgd-card cgr-result" role="status"><van-icon :name="record?'checked':'info-o'"/><h2>{{ record?'抢单成功，待执行':resultTitle }}</h2><p>{{ record?'已确定承运商，后续履约在托运订单查看。':resultMessage }}</p><small>本地模拟，未产生真实承运业务。</small></section>
      <p v-else class="cgr-brief">抢单成功即进入待执行，后续在托运订单查看。</p>
      <section class="cgd-card cgr-price"><div class="cgd-between"><h2>货主定价</h2><b v-if="price">{{ money(price.total) }}<small>元／票总额</small></b><b v-else>待完善</b></div><template v-if="price?.lines.length"><div v-for="(line,index) in price.lines" :key="index" class="cgr-price-line"><span>{{ line.label }}<small>{{ line.quantity }}箱 × {{ money(line.unitPrice) }}元／箱</small></span><strong>¥{{ money(line.quantity*line.unitPrice) }}</strong></div></template><p v-else-if="price&&price.unit!=='票'">{{ price.quantity }}{{ price.unit }} × {{ money(price.unitPrice) }}元／{{ price.unit }}</p><p class="cgr-muted">{{ displayCargo.fees||'费用范围未提供' }}</p><dl class="cgd-facts"><dt>支付方式</dt><dd>{{ displayCargo.payment||'未提供' }}</dd></dl></section>
      <section class="cgd-card cgr-shipment"><div class="cgd-between"><h2>{{ displayCargo.goods }}</h2><b>{{ displayCargo.quantity }}</b></div><div v-for="(place,index) in [displayCargo.origin,displayCargo.destination]" :key="index" class="cgr-route-row"><i :class="{end:index===1}">{{ index?'卸':'装' }}</i><div><strong>{{ place.city }} · {{ place.address||place.name }}</strong><p>{{ index?displayCargo.unloadDate:displayCargo.loadDate }} <span>{{ index?displayCargo.unloadWindow:displayCargo.loadWindow }}</span></p></div></div><p v-if="keyRequirements.length" class="cgr-key-requirements">{{ keyRequirements.map(row=>row[1]).join('；') }}</p></section>
      <details class="cgd-card cgr-more"><summary>更多托运信息<van-icon name="arrow-down"/></summary><dl class="cgd-facts"><template v-for="row in displayCargo.requirements" :key="row[0]"><dt>{{ row[0] }}</dt><dd>{{ row[1] }}</dd></template><dt>抢单截止</dt><dd>{{ displayCargo.grabEndsAt?.replace('T',' ').replace('+08:00','') }}</dd></dl><p class="cgr-muted">{{ displayCargo.summary }}</p></details>
      <section v-if="record" class="cgd-card"><h2>抢单记录</h2><dl class="cgd-facts"><dt>抢单号</dt><dd>{{ record.id }}</dd><dt>承运企业</dt><dd>{{ record.carrier.name }}</dd><dt>业务状态</dt><dd class="cgr-blue">待执行</dd><dt>抢单时间</dt><dd>{{ new Date(record.submittedAt).toLocaleString('zh-CN',{hour12:false}) }}</dd></dl><p v-if="cargoGrabStore.storageError" class="cgr-warning">记录仅保存在本次会话，关闭后可能丢失。</p></section>
      <p v-if="error" class="cgr-warning" role="alert">{{ error }}</p>
    </main>
    <footer class="cgr-footer"><template v-if="!record&&!unavailable"><label class="cgr-consent"><input v-model="consent" type="checkbox"/>我已核对价格及承运条件</label><div><button type="button" class="cgr-secondary" :disabled="submitting" @click="$emit('close')">返回详情</button><button type="button" class="cgr-primary" :disabled="!consent||submitting" @click="submit">{{ submitting?'提交中…':'确认抢单' }}</button></div></template><div v-else><button type="button" class="cgr-secondary" @click="$emit('close')">返回详情</button><button type="button" class="cgr-primary" @click="$emit('browse')">查看其他货源</button></div></footer>
  </section>
</template>
<script setup>
import { computed,onUnmounted,ref } from 'vue'
import { grabFingerprint,grabPrice,grabState } from './cargo-grab-model.js'
import { cargoGrabStore,submitCargoGrab } from './cargo-grab-store.js'
const props=defineProps({cargo:{type:Object,required:true}})
defineEmits(['close','browse'])
const consent=ref(false),submitting=ref(false),error=ref(''),now=ref(Date.now()),failure=ref(''),reviewKey=ref(grabFingerprint(props.cargo))
const timer=setInterval(()=>{now.value=Date.now()},1000);onUnmounted(()=>clearInterval(timer))
const record=computed(()=>cargoGrabStore.records.find(row=>row.cargoId===props.cargo.id))
const displayCargo=computed(()=>record.value?.snapshot||props.cargo),price=computed(()=>grabPrice(displayCargo.value))
const keyRequirements=computed(()=>(displayCargo.value.requirements||[]).filter(row=>['车辆要求','运输要求','装载条件','中转安排'].includes(row[0])))
const state=computed(()=>grabState(props.cargo,record.value,now.value))
const unavailable=computed(()=>!['ready','won'].includes(state.value)||['taken','expired','closed','unavailable'].includes(failure.value))
const resultTitle=computed(()=>({taken:'该货源已被抢走',expired:'抢单已截止',closed:'货源已关闭',unavailable:'暂不可抢单'}[failure.value||state.value]||'暂不可抢单'))
const resultMessage=computed(()=>({taken:'该货源已由其他承运商承接，可以查看其他货源。',expired:'已超过货主设置的抢单截止时间，可以查看其他货源。',closed:'货主已关闭该货源，请查看其他货源。'}[failure.value||state.value]||'货源定价或有效期不完整，暂时无法承接。'))
const money=value=>Number(value||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})
async function submit(){if(submitting.value||!consent.value)return;submitting.value=true;error.value='';try{await submitCargoGrab(props.cargo,reviewKey.value);consent.value=false}catch(e){failure.value=e.code||'';error.value=e.message;consent.value=false;if(e.code==='changed')reviewKey.value=grabFingerprint(props.cargo)}finally{submitting.value=false}}
</script>
<style src="./cargo-grab.css"></style>
