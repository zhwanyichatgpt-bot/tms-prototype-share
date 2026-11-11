<script setup>
import { computed } from 'vue'
import AnswerProcess from '../ai-answer/AnswerProcess.vue'
import { getDocumentAnalysisUpdates } from './document-analysis.js'

const props = defineProps({ run: { type: Object, required: true }, steps: Array })
const steps = computed(() => props.steps || [
  `已定位${props.run.documentType} ${props.run.documentNo}`,
  props.run.documentType === '托运单' ? '核对货主与货物、承运执行、财务与回款信息' : '核对运输状态、执行节点与异常记录',
  '整理结论与可用数据范围',
])
const updates = computed(() => getDocumentAnalysisUpdates(props.run))
const visibleUpdates = computed(() => updates.value.slice(0, Math.min(2, Math.max(0, props.run.stage || 0)) + 1))
</script>

<template>
  <div class="document-progress">
    <AnswerProcess v-if="run.status === 'completed'" :steps="steps" label="已完成分析" />
    <div v-else class="document-progress-updates" role="status" aria-live="polite">
      <p v-for="(update, index) in visibleUpdates" :key="index" :class="{ 'is-current': index === visibleUpdates.length - 1 }">
        <span class="document-progress-dot" aria-hidden="true" />
        <span>{{ update }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.document-progress{margin:0 0 10px;color:#616e89;font-size:13px;line-height:1.65}
.document-progress-updates{display:grid;gap:8px}
.document-progress-updates p{display:flex;align-items:baseline;gap:8px;margin:0;color:#808080;font-size:13px;line-height:22px}
.document-progress-updates p.is-current{color:#59657b}
.document-progress-dot{flex:none;width:6px;height:6px;align-self:flex-start;margin-top:8px;border-radius:50%;background:#d4d8e0}
.is-current .document-progress-dot{background:#3a65ff}
</style>
