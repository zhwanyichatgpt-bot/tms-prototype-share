<script setup>
import { ElDialog, ElButton } from 'element-plus'
import { transportExpert as expert } from '../expert-data.js'
defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'summon'])
</script>
<template>
  <ElDialog :model-value="modelValue" :title="expert.name" width="min(600px, 92vw)" append-to-body @update:model-value="emit('update:modelValue', $event)">
    <div class="ai-expert-profile">
      <span class="ai-expert-type">专家 · 数据分析</span>
      <h3>能力介绍</h3><p>{{ expert.description }}</p>
      <h3>擅长领域</h3><div class="ai-expert-fields"><span v-for="field in expert.fields" :key="field">{{ field }}</span></div>
      <h3>试试这样问我</h3>
      <button v-for="question in expert.questions" :key="question" class="ai-expert-example" @click="emit('summon', question)">{{ question }}</button>
    </div>
    <template #footer><ElButton type="primary" @click="emit('summon', '')">召唤专家</ElButton></template>
  </ElDialog>
</template>
<style>
.ai-expert-profile{font:14px/1.7 'PingFang SC','Microsoft YaHei',sans-serif;color:#333}.ai-expert-profile h3{font-size:14px;font-weight:600;margin:24px 0 10px}.ai-expert-profile p{margin:0}.ai-expert-type{font-size:12px;color:#59657b}.ai-expert-fields{display:flex;gap:8px;flex-wrap:wrap}.ai-expert-fields span{padding:2px 10px;border-radius:4px;background:#f3f5ff;color:#59657b}.ai-expert-example{display:block;text-align:left;width:100%;border:1px solid #e2e6f5;background:#f8f9fd;border-radius:8px;padding:11px 14px;margin-top:8px;cursor:pointer;font:inherit;color:inherit}.ai-expert-example:hover{border-color:#8796ff;background:#f1f3ff}.ai-expert-example:focus-visible{outline:2px solid #5368ff}
</style>
