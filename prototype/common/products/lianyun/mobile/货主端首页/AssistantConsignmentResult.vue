<template>
  <section class="lyf-page lcs-page" aria-label="指定托运结果"><AssistantFlowHeader title="指定托运详情" :back-label="backLabel" @back="$emit('back')" @close="$emit('close')"/><main class="lcs-scroll"><section class="lcs-card lcs-result-banner"><van-icon :name="current.status==='已拒绝'?'warning-o':current.status==='待执行'?'checked':'clock-o'"/><h2>{{ current.status }}</h2><p>{{ current.id }}</p><p v-if="current.status==='待承运商确认'">等待 {{ current.provider.name }} 确认承接或拒绝。</p><p v-else-if="current.status==='待执行'">承运商已确认承接，后续由承运商安排运输。</p><p v-else>承运商未承接本次托运，可修改信息后重新发起。</p><p v-if="current.responseReason" class="lcs-error">拒绝原因：{{ current.responseReason }}</p><small>本地模拟记录，未向真实承运商发送。</small><p v-if="consignmentStore.storageError" class="lcs-error">当前记录仅在本次会话有效。</p></section><section class="lcs-card lcs-target"><h3>指定承运商</h3><AssistantCarrierCard :provider="current.provider" compact/><dl class="lcs-facts"><dt>提交时间</dt><dd>{{ time(current.submittedAt) }}</dd><template v-if="current.respondedAt"><dt>处理时间</dt><dd>{{ time(current.respondedAt) }}</dd></template><dt>来源方案</dt><dd>{{ current.scheme.name }}</dd></dl></section><ConsignmentSummary :form="current.form"/></main><footer class="lcs-footer"><div><button v-if="current.status==='已拒绝'" type="button" class="lyf-primary" @click="$emit('restart',current)">修改后重新发起</button><button v-else type="button" class="lyf-primary" @click="$emit('back')">返回查看方案</button></div></footer></section>
</template>
<script setup>
import { computed } from 'vue'
import AssistantFlowHeader from './AssistantFlowHeader.vue'
import AssistantCarrierCard from './AssistantCarrierCard.vue'
import ConsignmentSummary from './ConsignmentSummary.vue'
import { consignmentStore } from './assistant-consignment-store.js'
import './assistant-consignment.css'
const props=defineProps({record:{type:Object,required:true},backLabel:{default:'返回方案详情'}})
defineEmits(['back','close','restart'])
const current=computed(()=>consignmentStore.records.find(r=>r.id===props.record.id)||props.record)
function time(value){return value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'未提交'}
</script>
