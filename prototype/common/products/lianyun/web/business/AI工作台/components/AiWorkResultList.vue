<script setup>
import { workResultType } from '../skill-data.js'

defineProps({ results: { type: Array, required: true } })
const emit = defineEmits(['open'])
const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
})

function resultDetail(result) {
  const source = result.documentNo || result.files?.[0]?.name || result.question
  return [dateFormat.format(new Date(result.completedAt || result.startedAt)), result.summary || source].filter(Boolean).join(' · ')
}
</script>

<template>
  <div class="ai-work-result-list">
    <button v-for="result in results" :key="result.id" class="ai-work-result" @click="emit('open', result.id)">
      <span class="ai-work-result-content">
        <span class="ai-work-result-title">
          <strong :title="result.title">{{ result.title }}</strong>
          <span class="ai-work-result-kind">{{ result.resultLabel || workResultType(result.skillId).label }}</span>
        </span>
        <small :title="resultDetail(result)">{{ resultDetail(result) }}</small>
      </span>
      <span class="ai-work-result-action">查看成果</span>
    </button>
    <p v-if="!results.length" class="ai-work-result-empty">完成分析或生成方案后，可以在这里查看。</p>
  </div>
</template>

<style scoped>
.ai-work-result-list .ai-work-result{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:11px 0;border-bottom:1px solid #edf0f6;text-align:left}
.ai-work-result:last-child{border-bottom:0}
.ai-work-result-content{display:block;min-width:0}
.ai-work-result-title{display:flex;align-items:center;gap:8px;min-width:0}
.ai-work-result-title strong,.ai-work-result-content small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ai-work-result-title strong{font-size:14px;color:#2c374b}
.ai-work-result-content small{display:block;margin-top:5px;color:#68738a;font-size:12px;line-height:17px}
.ai-work-result-kind{flex:none;padding:2px 6px;border-radius:4px;background:#edf2fb;color:#54688d;font-size:11px;white-space:nowrap}
.ai-work-result-action{flex:none;color:#4167d3;font-size:12px;white-space:nowrap}
.ai-work-result:hover .ai-work-result-title strong{color:#4167d3}
.ai-work-result-empty{padding:36px 12px;text-align:center;color:#68738a;font-size:13px;line-height:1.6}
</style>
