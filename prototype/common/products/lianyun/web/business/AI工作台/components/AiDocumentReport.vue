<script setup>
import { computed } from 'vue'
import { getDocumentReport } from '../../../../../../shared/web/ai-document-analysis/document-analysis.js'
import sampleHtml from '../fixtures/consignment-report.html.txt?raw'

const reportHtml = sampleHtml
  .replaceAll('模拟案例判断 · 数据可复算 · 安全与经营结果分开', '评分结果与改进建议')
  .replaceAll('字段来自本托运单模拟案例', '字段来源见取数说明')
  .replaceAll('（模拟案例）', '')
  .replaceAll('当前示例 ', '本项得分 ')
  .replaceAll('示例得分：', '本项得分：')
  .replaceAll('本例值（模拟）', '报告取值')
  .replaceAll('演示', '')

const props = defineProps({ run: { type: Object, required: true }, expanded: Boolean })
const emit = defineEmits(['close','expand'])
const report = computed(() => getDocumentReport(props.run))
const hasOriginalLayout = computed(() => props.run.documentType === '托运单')
</script>

<template>
  <aside class="ai-report-pane" aria-label="报告阅读区">
    <header>
      <div>
        <h2>{{ run.title }}</h2>
        <p>{{ run.documentNo }}</p>
      </div>
      <div class="ai-report-header-actions"><button type="button" class="ai-report-expand" @click="emit('expand')">{{ expanded?'收回阅读':'展开阅读' }}</button><button type="button" aria-label="关闭报告" @click="emit('close')">×</button></div>
    </header>
    <iframe v-if="hasOriginalLayout" :srcdoc="reportHtml" :title="`${run.title} · ${run.documentNo}`" sandbox="allow-scripts" referrerpolicy="no-referrer" />
    <div v-else class="ai-report-pane-body">
      <article class="ai-structured-report">
        <div class="ai-report-overview">
          <div>
            <small>{{ run.documentType }} {{ run.documentNo }}</small>
            <h2>{{ report.summary }}</h2>
          </div>
          <span v-if="report.status">{{ report.status }}</span>
        </div>
        <section v-for="(section, index) in report.sections" :key="section.heading" class="ai-report-section">
          <h3><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ section.heading }}</h3>
          <div class="ai-report-section-body">
            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
            <dl v-if="section.fields.length">
              <div v-for="[label, value] in section.fields" :key="label">
                <dt>{{ label }}</dt><dd>{{ value }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </article>
    </div>
  </aside>
</template>

<style scoped>
.ai-report-pane{position:absolute;inset:0 0 0 43%;display:flex;flex-direction:column;border-left:1px solid #e0e6f3;background:#f4f7fb}
.ai-report-pane header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-bottom:1px solid #e0e6f3;background:#fff}
.ai-report-pane h2{font-size:17px}
.ai-report-pane header p{color:#727c92;font-size:12px;margin-top:4px}
.ai-report-pane header button{width:34px;height:34px;border-radius:8px;color:#566481;font-size:25px;line-height:1}
.ai-report-pane header button:hover{background:#eef2fa}
.ai-report-pane iframe,.ai-report-pane-body{flex:1;min-height:0;width:100%;border:0}
.ai-report-pane-body{padding:18px;overflow:auto}
.ai-structured-report{display:grid;gap:14px;max-width:980px;margin:auto;color:#233851}
.ai-report-overview{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:18px 20px;border-radius:12px;background:linear-gradient(120deg,#1e3a5f,#16283f);color:white}
.ai-report-overview small{display:block;margin-bottom:6px;color:#c3d3e6;font-size:13px}
.ai-report-overview h2{line-height:1.6}
.ai-report-overview>span{flex:none;padding:4px 10px;border-radius:14px;background:#f5e7c6;color:#664817;font-size:12px}
.ai-report-section{overflow:hidden;border:1px solid #e1e7ef;border-radius:12px;background:white}
.ai-report-section h3{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#eaf1f8;color:#1e3a5f;font-size:15px}
.ai-report-section h3 span{padding:3px 6px;border-radius:5px;background:#d9e5f2;font-size:12px;font-variant-numeric:tabular-nums}
.ai-report-section-body{padding:14px 16px;font-size:14px;line-height:1.65}
.ai-report-section dl{margin:12px 0 0}
.ai-report-section dl>div{display:grid;grid-template-columns:110px minmax(0,1fr);gap:8px;padding:7px 0;border-top:1px solid #eaf0f5}
.ai-report-section dt{color:#5e6e86}
.ai-report-section dd{margin:0;overflow-wrap:anywhere}
</style>

<style scoped>
.ai-report-header-actions{display:flex;align-items:center;gap:8px;flex:none}
.ai-report-pane header button.ai-report-expand{width:auto;padding:6px 10px;font-size:13px;line-height:20px;border:1px solid #eee;background:#fff}
</style>
