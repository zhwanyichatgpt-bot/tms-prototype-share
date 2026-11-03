<template>
  <section class="lyf-page lyf-provider-page" aria-label="选择承运商">
    <AssistantFlowHeader title="选择承运商" :back-label="backLabel" @back="$emit('back')" @close="$emit('close')"/>
    <main class="lyf-provider-list" role="radiogroup" aria-label="指定托运承运商"><AssistantCarrierCard v-for="provider in providers" :key="provider.id" :provider="provider" :selected="selectedId===provider.id" @toggle="$emit('select',$event)" @reviews="$emit('reviews',$event)"/><p v-if="!providers.length" class="lyf-empty">当前方案暂无匹配承运商，请返回调整运输条件。</p></main>
    <footer class="lyf-provider-footer"><span class="lcs-selection-count">{{ selectedId?'已选1家':'请选择1家承运商' }}</span><button type="button" class="lyf-primary" :disabled="!selectedId" @click="$emit('confirm')">下一步，填写托运</button></footer>
  </section>
</template>
<script setup>
import AssistantFlowHeader from './AssistantFlowHeader.vue'
import AssistantCarrierCard from './AssistantCarrierCard.vue'
import './assistant-consignment.css'
defineProps({providers:{type:Array,required:true},selectedId:{type:String,default:''},backLabel:{default:'返回方案详情'}})
defineEmits(['select','reviews','confirm','back','close'])
</script>
