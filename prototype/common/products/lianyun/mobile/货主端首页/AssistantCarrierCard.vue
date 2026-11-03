<template>
  <article class="lyf-carrier-card" :class="{'lyf-carrier-compact':compact}">
    <component :is="compact?'div':'button'" :type="compact?undefined:'button'" class="lyf-carrier-choice" :aria-label="compact?undefined:'选择'+provider.name" :role="compact?undefined:'radio'" :aria-checked="compact?undefined:selected" @click="!compact && $emit('toggle',provider.id)">
      <span v-if="!compact" class="lyf-choice-mark" :class="{selected}" aria-hidden="true"><van-icon v-if="selected" name="success"/></span>
      <span v-else class="lyf-carrier-avatar" aria-hidden="true">{{ provider.name.slice(0,2) }}</span>
      <span class="lyf-carrier-identity"><strong :title="provider.name">{{ provider.name }}</strong><span class="lyf-carrier-tags"><span v-for="(tag,index) in tags" :key="index" :title="tag">{{ tag }}</span></span></span>
    </component>
    <button v-if="!compact" type="button" class="lyf-carrier-score" :aria-label="provider.name+'服务评价'" @click="$emit('reviews',provider)"><strong>{{ provider.score == null ? '—' : provider.score.toFixed(1) }}</strong><span>{{ provider.reviewCount ? provider.reviewCount+'条评价' : '暂无评价' }}<van-icon name="arrow"/></span></button>
    <p v-if="!compact" class="lyf-carrier-description" :title="provider.cooperation">{{ provider.cooperation }}</p>
  </article>
</template>
<script setup>
import { computed } from 'vue'
const props=defineProps({provider:{type:Object,required:true},selected:Boolean,compact:Boolean})
defineEmits(['toggle','reviews'])
const tags=computed(()=>props.provider.capability.split(/[、，,；;]/).filter(Boolean).slice(0,3))
</script>
