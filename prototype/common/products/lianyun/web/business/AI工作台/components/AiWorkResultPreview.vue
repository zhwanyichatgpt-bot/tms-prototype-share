<script setup>
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../../src/review/prototype-navigation.mjs'
import AnswerProcess from '../../../../../../shared/web/ai-answer/AnswerProcess.vue'
const props=defineProps({result:{type:Object,required:true},expanded:Boolean})
const emit=defineEmits(['close','expand'])
const router=useRouter()
const route=useRoute()
</script>
<template>
 <aside class="ai-report-pane ai-work-result-preview" aria-label="工作成果预览" :data-result-id="result.id">
  <header><div><h2>{{ result.title }}</h2><p>{{ result.resultLabel }} · {{ result.generatedAt }}</p></div><div class="ai-report-header-actions"><button class="ai-report-expand" type="button" @click="emit('expand')">{{ expanded?'收回阅读':'展开阅读' }}</button><button type="button" aria-label="关闭成果预览" @click="emit('close')">×</button></div></header>
  <div class="ai-report-pane-body"><article class="ai-full-report"><h1>{{ result.title }}</h1><div class="ai-report-meta">所属日期：{{ result.date }} · 生成时间：{{ result.generatedAt }}</div><AnswerProcess v-if="result.reasoning?.length" :steps="result.reasoning" /><section><h2>本期摘要</h2><p>{{ result.summary }}</p></section><section v-for="section in result.sections" :key="section.title"><h2>{{ section.title }}</h2><p>{{ section.text }}</p><button v-if="section.page && section.action" class="ai-result-business-link" @click="openPrototypePage(router, route, section.page, section.query)">{{ section.action }}</button></section></article></div>
 </aside>
</template>
<style scoped>
.ai-work-result-preview{position:absolute;inset:0 0 0 43%;display:flex;flex-direction:column;border-left:1px solid #eee;background:#f6f7fb}
.ai-work-result-preview header{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 22px;border-bottom:1px solid #eee;background:#fff}
.ai-work-result-preview header h2{font-size:17px;line-height:26px;color:#333}
.ai-work-result-preview header p{font-size:12px;line-height:20px;color:#999;margin-top:4px}
.ai-report-header-actions{display:flex;align-items:center;gap:8px;flex:none}
.ai-work-result-preview header button{width:34px;height:34px;border-radius:8px;color:#999;font-size:24px}
.ai-work-result-preview header button.ai-report-expand{width:auto;height:auto;padding:6px 10px;font-size:13px;line-height:20px;border:1px solid #eee}
.ai-work-result-preview .ai-report-pane-body{flex:1;min-height:0;overflow:auto;padding:24px}
.ai-result-business-link{font-size:13px;color:#3a65ff;margin-top:10px}
</style>
