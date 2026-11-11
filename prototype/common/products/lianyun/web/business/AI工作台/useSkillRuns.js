import { ref, watch, onMounted, onUnmounted } from 'vue'
import { skills, documentTypes, analysisFocus } from './skill-data.js'
import { documentRunDuration, documentAnalysisStage, runStorageKey as storageKey } from '../../../../../shared/web/ai-document-analysis/document-analysis.js'
export function useSkillRuns(){
  const runs=ref([])
  try {
    const stored=JSON.parse(localStorage.getItem(storageKey)||'[]')
    if(Array.isArray(stored))runs.value=stored.filter(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&skills.some(s=>s.id===r.skillId)&&['running','completed'].includes(r.status)&&Number.isFinite(r.startedAt)&&Array.isArray(r.files)&&r.files.every(f=>typeof f.name==='string')&&Array.isArray(r.focus)&&r.focus.every(f=>typeof f==='string')&&typeof r.sessionId==='string').map(r=>({...r,stage:Math.min(2,Math.max(0,Number(r.stage)||0))}))
  } catch { /* 无效的演示任务只影响技能模块。 */ }
  const storageError=ref(false)
  watch(runs,()=>{try{localStorage.setItem(storageKey,JSON.stringify(runs.value));storageError.value=false}catch{storageError.value=true}},{deep:true})
  function advance(){
    const now=Date.now()
    runs.value.filter(r=>r.status==='running').forEach(r=>{r.stage=r.documentNo?documentAnalysisStage(now-r.startedAt):Math.min(2,Math.floor((now-r.startedAt)/2000));if(now-r.startedAt>=(r.documentNo?documentRunDuration:6000)){r.status='completed';r.completedAt=now;r.stage=2}})
  }
  let timer
  onMounted(()=>{advance();timer=setInterval(advance,800)})
  onUnmounted(()=>clearInterval(timer))
  function create(skill,config,sessionId){
    const run={id:crypto.randomUUID(),skillId:skill.id,skillName:skill.name,sessionId,title:config.title||`${config.documentType||skill.name}分析`,documentType:config.documentType||documentTypes[0],focus:config.focus||[analysisFocus[0]],files:config.files.map(f=>({name:f.name})),question:config.question||'',requirements:config.requirements||'',sample:!!config.sample,startedAt:Date.now(),status:'running',stage:0}
    runs.value.unshift(run);return run
  }
  function complete(id){const run=runs.value.find(r=>r.id===id);if(run?.status==='running'){run.stage=2;run.status='completed';run.completedAt=Date.now()}}
  return {runs,create,complete,storageError}
}
