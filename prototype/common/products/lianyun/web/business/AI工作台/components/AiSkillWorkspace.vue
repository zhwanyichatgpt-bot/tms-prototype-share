<script setup>
import { computed, ref, watch } from 'vue'
import { ElButton, ElInput, ElSelect, ElOption, ElCheckboxGroup, ElCheckbox } from 'element-plus'
import { asset } from '../mock-data.js'
import { documentTypes, analysisFocus, demoRows, makeSkillReport, workResultType } from '../skill-data.js'
import AiIcon from './AiIcon.vue'
import AnswerProcess from '../../../../../../shared/web/ai-answer/AnswerProcess.vue'
const props=defineProps({skill:Object,task:Object})
const emit=defineEmits(['back','start','complete','conversation','reuse'])
const documentType=ref('过磅单'),files=ref([]),focus=ref(['单据汇总','差异与缺项']),requirements=ref(''),question=ref(''),sample=ref(false),error=ref(''),source=ref(null),fileInput=ref(null)
const knowledgeScope=ref('示例结算资料说明')
watch(()=>props.skill?.id,()=>{files.value=[];focus.value=['单据汇总','差异与缺项'];requirements.value='';question.value='';sample.value=false;error.value='';source.value=null},{immediate:true})
watch(()=>props.task?.id,()=>source.value=null)
const fileMode=computed(()=>props.skill?.input==='files')
const report=computed(()=>props.task?makeSkillReport(props.task):null)
function addFiles(e){files.value.push(...Array.from(e.target.files||[]).map(f=>({name:f.name})));sample.value=false;error.value='';e.target.value=''}
function useSample(){sample.value=true;error.value='';files.value=fileMode.value?[{name:props.skill.id==='contract'?'示例运输合同.pdf':`示例${documentType.value}明细.csv`}]:[];if(!fileMode.value)question.value=props.skill.input==='knowledge'?'结算前需要准备哪些资料？':'如何比较同一批大宗货物的运输方案？'}
function start(){
  if(fileMode.value&&!files.value.length){error.value='请添加资料，或使用示例资料体验';return}
  if(fileMode.value&&!focus.value.length){error.value='请至少选择一项分析重点';return}
  if(!fileMode.value&&!question.value.trim()){error.value='请填写要解决的问题，或使用示例问题';return}
  emit('start',{title:props.skill.id==='documents'?`${documentType.value}分析报告`:(workResultType(props.skill.id).title || props.skill.name),documentType:documentType.value,files:files.value,focus:focus.value,requirements:requirements.value,question:question.value,knowledgeScope:knowledgeScope.value,sample:sample.value})
}
function exportReport(){
  const text=['【工作成果 · 参考内容】',report.value.title,...report.value.sections.flatMap(s=>[s.heading,...s.paragraphs]),...(!props.task.documentNo && !props.task.isExample && ['documents','operations'].includes(props.task.skillId) ? ['明细：', ...demoRows.map(r=>`${r.id} / ${r.date} / ${r.quantity}吨 / ${r.source}`)] : [])].join('\n\n')
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`${props.task.title}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
</script>
<template>
  <section class="ai-skill-workspace">
    <header class="ai-skill-header"><button class="ai-back" @click="emit('back')">返回首页</button><span>{{ task?'分析与成果':skill.type+'使用' }}</span><small>本地交互原型</small></header>
    <div class="ai-skill-heading"><img :src="asset(skill.icon)" alt=""/><div><h1>{{ task?.title || skill.name }}</h1><p>{{ skill.description }}</p></div><span class="ai-skill-type">{{ skill.type }}</span></div>
    <template v-if="!task">
      <div class="ai-skill-steps"><b>1 准备资料与要求</b><span>2 执行处理</span><span>3 查看成果</span></div>
      <form class="ai-skill-form" @submit.prevent="start">
        <div v-if="fileMode" class="ai-skill-fields">
          <label v-if="skill.id==='documents'">单据类型<ElSelect v-model="documentType" aria-label="单据类型" @change="sample && useSample()"><ElOption v-for="type in documentTypes" :key="type" :label="type" :value="type"/></ElSelect></label>
          <div class="ai-skill-upload"><div class="ai-field-title">分析资料 <button type="button" @click="useSample">使用示例资料</button></div><input ref="fileInput" type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.doc,.docx" @change="addFiles"/><button type="button" class="ai-upload-zone" @click="fileInput.click()"><AiIcon name="attach" :size="25"/><strong>点击添加单据、表格或文档</strong><span>文件仅在本地记录名称，不上传、不读取内容</span></button><div v-for="(file,i) in files" :key="i" class="ai-skill-file"><AiIcon name="file" :size="17"/><span>{{ file.name }}</span><small>{{ sample?'示例资料':'本地文件' }}</small><button type="button" :aria-label="`移除${file.name}`" @click="files.splice(i,1)">×</button></div></div>
          <label>分析重点<ElCheckboxGroup v-model="focus"><ElCheckbox v-for="item in analysisFocus" :key="item" :value="item" :label="item">{{ item }}</ElCheckbox></ElCheckboxGroup></label>
          <label>补充要求 <small>选填</small><ElInput v-model="requirements" type="textarea" :rows="2" placeholder="例如：按月份汇总，优先列出需要核对的内容" aria-label="补充分析要求"/></label>
        </div>
        <div v-else class="ai-skill-fields"><label v-if="skill.input==='knowledge'">参考知识<ElSelect v-model="knowledgeScope" aria-label="参考知识"><ElOption label="示例结算资料说明" value="示例结算资料说明"/></ElSelect><small>当前仅有内置示例知识，未连接企业知识库</small></label><label>{{ skill.type==='专家团'?'你希望专家团帮助解决什么问题？':'你的问题' }}<ElInput v-model="question" type="textarea" :rows="5" aria-label="技能问题" placeholder="说明业务背景、希望得到的帮助以及关键限制条件"/></label><button type="button" class="ai-sample-link" @click="useSample">使用示例问题</button></div>
        <p v-if="error" class="ai-skill-error" role="alert">{{ error }}</p><div class="ai-skill-submit"><p>原型模拟：执行过程与输出使用内置示例，不能用于真实业务判断。</p><ElButton type="primary" native-type="submit">{{ fileMode?'开始分析':skill.type==='专家团'?'开始咨询':'查询知识' }}</ElButton></div>
      </form>
    </template>
    <template v-else-if="task.status==='running'">
      <div class="ai-running-card" role="status"><div class="ai-running-symbol"><AiIcon name="chart" :size="30"/></div><h2>正在{{ ['整理资料','处理任务','生成成果'][task.stage] }}</h2><p>可以返回首页或切换对话。任务完成后可在「工作成果」中查看。</p><ol><li v-for="(step,i) in ['整理资料','处理任务','生成成果']" :key="step" :class="{current:i===task.stage,done:i<task.stage}"><span>{{ i<task.stage?'✓':i+1 }}</span>{{ step }}</li></ol><div class="ai-run-input-summary"><strong>本次输入</strong><span>{{ task.files.map(f=>f.name).join('、') || task.question }}</span><small>{{ task.focus.join(' · ') }}</small></div><small>模拟执行约6秒，未调用真实分析服务</small><div><ElButton @click="emit('back')">返回首页</ElButton><ElButton type="primary" plain @click="emit('complete',task.id)">立即完成演示</ElButton></div></div>
    </template>
    <template v-else>
      <div class="ai-report-toolbar"><span>{{ task.isExample ? '成果案例' : '已生成' }}</span><ElButton v-if="task.sessionId" @click="emit('conversation',task.sessionId)">回到对话 / 继续提问</ElButton><ElButton @click="exportReport">导出成果</ElButton><ElButton type="primary" @click="emit('reuse',skill.id)">再次使用技能</ElButton></div>
      <article class="ai-full-report"><div v-if="!task.isExample" class="ai-report-disclaimer">{{ task.documentNo ? '示例成果 · 使用系统单据样例' : '示例成果 · 使用内置合成资料' }}</div><h1>{{ report.title }}</h1><div class="ai-report-meta">{{ task.skillName }} · {{ task.documentNo || task.files.map(f=>f.name).join('、') || (task.isExample ? '成果案例' : '任务结果') }}</div>
        <AnswerProcess :steps="report.reasoning || report.process || []" :expanded="!task.isExample" />
        <section v-for="section in report.sections" :key="section.heading"><h2>{{ section.heading }}</h2><p v-for="line in section.paragraphs" :key="line">{{ line }}</p></section><section v-if="!task.isExample && !task.documentNo && ['documents','operations'].includes(task.skillId)"><h2>示例明细与引用依据</h2><table><thead><tr><th>示例编号</th><th>日期</th><th>数量（吨）</th><th>依据</th></tr></thead><tbody><tr v-for="row in demoRows" :key="row.id"><td>{{ row.id }}</td><td>{{ row.date }}</td><td>{{ row.quantity }}</td><td><button @click="source=source?.id===row.id?null:row">{{ row.source }}</button></td></tr></tbody></table><div v-if="source" class="ai-source-detail"><strong>{{ source.source }}</strong><p>编号 {{ source.id }}；日期 {{ source.date }}；数量 {{ source.quantity }} 吨。</p><small>内置合成记录，仅用于体验引用追溯，不代表真实单据。</small></div></section></article>
    </template>
  </section>
</template>
