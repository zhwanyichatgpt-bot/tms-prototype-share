<script setup>
import { computed, reactive, ref } from 'vue'
import { settlementTemplates, templatesReady, inspectTemplate, saveTemplate, downloadTemplate, setTemplateEnabled } from '../settlement-templates.js'
const props = defineProps({ initialId: { type: String, default: '' } })
const selectedId = ref(props.initialId)
const selected = computed(() => settlementTemplates.find(item => item.id === selectedId.value))
const adding = ref(false), busy = ref(false), error = ref(''), status = ref(''), file = ref(null), layout = ref(null)
const form = reactive({ name: '', party: '福建大道成国际联运有限公司', direction: '托运方', version: 'V1.0' })
const columns = ref([])
templatesReady.then(() => { if (!selectedId.value) selectedId.value = settlementTemplates[0]?.id })
async function chooseFile(event) {
  error.value = ''; layout.value = null; file.value = null
  const uploaded = event.target.files?.[0]
  if (!uploaded) return
  busy.value = true
  try { layout.value = await inspectTemplate(uploaded); file.value = uploaded; columns.value = layout.value.columns; form.name = uploaded.name.replace(/\.xlsx$/i, '') }
  catch (problem) { error.value = problem.message }
  finally { busy.value = false }
}
async function save() {
  if (!file.value || !layout.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    const entry = await saveTemplate(file.value, { name: form.name.trim(), party: form.party.trim(), direction: form.direction, version: form.version.trim() }, layout.value)
    selectedId.value = entry.id; adding.value = false; file.value = null; status.value = '模板已保存，匹配此结算企业的对账单时可选用。'
  } catch (problem) { error.value = problem.message }
  finally { busy.value = false }
}
async function download(entry) {
  error.value = ''
  try { await downloadTemplate(entry) } catch (problem) { error.value = problem.message }
}
async function toggle(entry) {
  error.value = ''
  try { await setTemplateEnabled(entry, !entry.enabled) } catch (problem) { error.value = problem.message }
}
</script>
<template>
  <section class="statement-library" aria-label="结算与对账模板">
    <header><div><h2>结算与对账模板</h2><p>按结算企业匹配，沿用原文件的表头、列顺序和样式。</p></div><button type="button" class="template-primary" @click="adding = !adding; error = ''; status = ''">{{ adding ? '取消上传' : '上传模板' }}</button></header>
    <p v-if="error" class="template-error" role="alert">{{ error }}</p><p v-if="status" class="template-status" role="status">{{ status }}</p>
    <form v-if="adding" class="template-upload-form" @submit.prevent="save">
      <label class="template-file">Excel 模板<input type="file" accept=".xlsx" aria-label="上传 Excel 对账模板" @change="chooseFile" /><small>支持 2 MB 以内的 .xlsx 空白模板。表头至少包含“运单号”和“核算金额”，下一行保留为空白明细行。</small></label>
      <label>模板名称<input v-model="form.name" required maxlength="80" /></label><label>适用结算企业<input v-model="form.party" required maxlength="80" /></label>
      <label>对账方向<select v-model="form.direction"><option value="托运方">货主（托运方）对账</option><option value="承运方">承运方对账</option></select></label><label>模板版本<input v-model="form.version" required maxlength="20" /></label>
      <p v-if="layout" class="template-columns">已识别 {{ layout.sheet }} · 第 {{ layout.header }} 行表头<br />{{ columns.map(item => item.label).join(' · ') }}</p>
      <div class="template-form-actions"><button type="button" @click="download(settlementTemplates.find(item => item.example))">下载示例模板</button><button type="submit" class="template-primary" :disabled="!file || busy">{{ busy ? '正在处理…' : '保存模板' }}</button></div>
    </form>
    <div class="template-list">
      <button v-for="item in settlementTemplates" :key="item.id" type="button" :class="{ selected: item.id === selectedId }" @click="selectedId = item.id"><span class="template-file-icon">XLSX</span><span><strong>{{ item.name }}</strong><small>{{ item.party }} · {{ item.version }} · {{ item.direction === '托运方' ? '货主对账' : '承运方对账' }}</small></span><em>{{ item.enabled ? '启用中' : '已停用' }}</em></button>
    </div>
    <article v-if="selected && !adding" class="template-preview">
      <div class="template-preview-title"><h3>{{ selected.name }}</h3><span>{{ selected.version }}</span></div>
      <dl><div><dt>适用企业</dt><dd>{{ selected.party }}</dd></div><div><dt>对账方向</dt><dd>{{ selected.direction === '托运方' ? '货主（托运方）对账' : '承运方对账' }}</dd></div><div><dt>原文件</dt><dd>{{ selected.fileName }}</dd></div><div><dt>保存位置</dt><dd>{{ selected.example ? '内置示例模板' : '当前浏览器' }}</dd></div></dl>
      <p v-if="selected.example" class="template-example-note">这是用于原型演示的示例模板，正式使用前可上传企业已有模板。</p>
      <p v-else class="template-columns">明细列：{{ selected.layout.columns.map(item => item.label).join(' · ') }}</p>
      <footer><button type="button" class="template-primary" @click="download(selected)">下载原模板</button><button type="button" @click="toggle(selected)">{{ selected.enabled ? '停用模板' : '启用模板' }}</button></footer>
    </article>
  </section>
</template>
<style scoped>
.statement-library{color:#333;font-size:14px;line-height:1.6;max-width:1000px}.statement-library header{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}.statement-library h2{margin:0 0 6px;font-size:20px;font-weight:600}.statement-library p{margin:0;color:#777}.statement-library button{font:inherit;cursor:pointer}.statement-library header p{max-width:580px}.statement-library .template-primary{flex:none;min-height:32px;padding:5px 14px;border:1px solid #4062ff;border-radius:4px;background:#4062ff;color:#fff}.template-list{display:grid;gap:10px;margin-top:18px}.template-list>button{display:flex;gap:14px;align-items:center;width:100%;padding:16px;border:1px solid #e1e4eb;border-radius:6px;background:white;text-align:left}.template-list>button.selected{border-color:#9bacff;background:#f8f9ff}.template-list strong{display:block;font-weight:500}.template-list small{display:block;margin-top:4px;color:#777}.template-list em{font-style:normal;color:#777;font-size:12px;margin-left:auto;white-space:nowrap}.template-file-icon{display:grid;place-items:center;flex:none;width:40px;height:44px;border-radius:4px;background:#edf7f2;color:#27835c;font-size:11px;font-weight:600}.template-preview{margin-top:24px;border-top:1px solid #e5e7ed;padding-top:20px}.template-preview-title{display:flex;gap:12px;align-items:center}.template-preview h3{margin:0;font-size:16px}.template-preview-title span{font-size:12px;color:#777}.template-preview dl{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}.template-preview dl div{min-width:0}.template-preview dt{color:#777}.template-preview dd{margin:4px 0 0;overflow-wrap:anywhere}.template-preview footer{display:flex;gap:16px;align-items:center;margin-top:20px}.template-preview footer>button:not(.template-primary),.template-form-actions>button:not(.template-primary){border:0;background:none;color:#4062ff}.statement-library .template-example-note{padding:10px 14px;border-radius:4px;background:#f5f6f8;font-size:13px}.template-upload-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8f9fb;border:1px solid #e1e4eb;padding:20px;border-radius:6px}.template-upload-form label{display:grid;gap:6px}.template-upload-form input,.template-upload-form select{min-width:0;width:100%;height:34px;border:1px solid #d9dce4;border-radius:4px;padding:4px 8px;background:white;color:#333;font:inherit}.template-upload-form input[type=file]{height:auto}.template-file,.template-columns,.template-form-actions{grid-column:1/-1}.template-file small{color:#777;font-size:12px}.template-form-actions{display:flex;justify-content:flex-end;gap:16px}.statement-library .template-error{margin:10px 0;color:#b13b3b}.statement-library .template-status{margin:10px 0;color:#27835c}.template-primary:disabled{opacity:.45;cursor:not-allowed}@media(max-width:600px){.template-preview dl,.template-upload-form{grid-template-columns:1fr}}
</style>
