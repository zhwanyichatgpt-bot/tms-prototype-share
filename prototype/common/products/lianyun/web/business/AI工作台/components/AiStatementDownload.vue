<script setup>
import { money } from '../recon-data.js'
defineProps({ file: { type: Object, required: true } })
defineEmits(['download', 'template'])
</script>
<template>
  <div class="rc-statement-file">
    <div class="rc-statement-file-heading"><span>XLSX</span><strong>{{ file.fileName }}</strong></div>
    <p>{{ file.count }} 条运单 · {{ money(file.total) }}</p>
    <button type="button" class="rc-statement-source" @click="$emit('template', file.templateId)">模板：{{ file.templateName }} · {{ file.version }}</button>
    <small v-if="file.example">示例模板 · 演示数据</small>
    <button type="button" class="rc-btn primary" @click="$emit('download', file)">下载对账单</button>
  </div>
</template>
