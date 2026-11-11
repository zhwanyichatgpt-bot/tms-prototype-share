<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../src/review/prototype-navigation.mjs'
import { createDocumentAnalysis, documentSamples, isDocumentAnalysisRequest, resolveDocument, conversationStorageKey } from '../../../../../shared/web/ai-document-analysis/document-analysis.js'
import TmsAiWorkbenchShell from '../../../../../shared/web/tms-web-shell/TmsAiWorkbenchShell.vue'
import { workspaceDateText, dailyBrief, makeBriefReply } from '../至小简入口/workspace-content.js'
import AssistantEntry from '../至小简入口/AssistantEntry.vue'
import AiSidebar from './components/AiSidebar.vue'
import AiAccountEntry from './components/AiAccountEntry.vue'
import AiAccountPanel from './components/AiAccountPanel.vue'
import { useAccountDemo } from './account-demo.js'
import AiHome from './components/AiHome.vue'
import { businessSuggestions, makeBusinessSuggestionReply } from './business-suggestions.js'
import AiOnboarding from './components/AiOnboarding.vue'
import AiLearningGuide from './components/AiLearningGuide.vue'
import AiWorkResultList from './components/AiWorkResultList.vue'
import AiWorkResultPreview from './components/AiWorkResultPreview.vue'
import AiScheduledTaskForm from './components/AiScheduledTaskForm.vue'
import AiScheduledTasks from './components/AiScheduledTasks.vue'
import { anomalyTaskExample, canActivateScheduledTask, scheduleDraftFromQuestion, useScheduledTasks } from './scheduled-tasks.js'
import AiExpertProfile from './components/AiExpertProfile.vue'
import { transportExpert, makeExpertAnswer } from './expert-data.js'
import AiComposer from './components/AiComposer.vue'
import AiChat from './components/AiChat.vue'
import AiWaybillSupplement from './components/AiWaybillSupplement.vue'
import AiSettlementRecon from './components/AiSettlementRecon.vue'
import { createSupplementState, refreshSupplementExample } from './supplement-flow.js'
import { retainSupplementFiles } from './supplement-handoff.js'
import AiDocumentReport from './components/AiDocumentReport.vue'
import AiOverlays from './components/AiOverlays.vue'
import AiIcon from './components/AiIcon.vue'
import AiSkillWorkspace from './components/AiSkillWorkspace.vue'
import AiKnowledgeWorkspace from './components/AiKnowledgeWorkspace.vue'
import { ElDialog, ElButton } from 'element-plus'
import { skills, makeSkillReport } from './skill-data.js'
import { knowledgeDocuments, knowledgeEntries, knowledgeGroups, knowledgeOptions, makeKnowledgeAnswer } from './knowledge-data.js'
import { useSkillRuns } from './useSkillRuns.js'
import { agents, asset, createInitialState, questionBatches, makeAnswer } from './mock-data.js'
import './ai-workbench.css'
import './homepage.css'
import './responsive.css'

const { runs, create: createSkillRun, complete: completeSkillRun, storageError } = useSkillRuns()
const account = useAccountDemo()
const { credits: accountCredits, promotion } = account
const pendingPromotion = computed(() => promotion.value?.status === '待领取' ? promotion.value : null)
const accountSection = ref(null)
const accountActivityTarget = ref(null)
const demoStartedAt = Date.now()
watch(() => runs.value.some(run => run.documentType === '托运单' && run.status === 'completed' && run.completedAt >= demoStartedAt), completed => {
  if (completed) account.completeTask('waybill')
})

function openAccount(section, target = null) {
  accountActivityTarget.value = target
  accountSection.value = section
}

async function openPromotion() {
  const task = promotion.value
  if (!task) return
  if (task.status === '待领取') return openAccount('activity', task.id)
  if (accountSection.value) openAccount(null)
  await openSkill('documents')
  if (!draft.value) draft.value = '分析托运单 ' + documentSamples[0].id
}
const scheduled = useScheduledTasks()
const { tasks: scheduledTasks, runs: scheduledRuns, results: scheduledResults } = scheduled
const scheduledHistoryTaskId = ref(null)
const scheduledEdit = ref(null)
const completedResults = computed(() => [dailyBrief, ...scheduledResults.value, ...runs.value.filter(run => run.status === 'completed' && run.id !== dailyBrief.id)]
  .sort((a,b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt)))
const previewResultId = ref(null)
const resultExpanded = ref(false)
const previewResult = computed(() => completedResults.value.find(result => result.id === previewResultId.value) || null)
function openResultPreview(id) {
  const result=completedResults.value.find(item=>item.id===id)
  if (!result) return
  if (result.resultType==='brief' || result.resultType==='scheduled-brief') {
    let session=sessions.value.find(item=>item.resultId===id)
    if (!session) {
      session={id:uid('result-chat'),title:result.title,agentId:'analysis',group:'今天',pinned:false,resultId:id,messages:[]}
      sessions.value.unshift(session)
    }
    businessContext.value=null
    if(view.value!=='chat' || activeSessionId.value!==session.id) openSession(session.id)
    openReportId.value=null
    previewResultId.value=id
  } else { previewResultId.value=null;openRun(id) }
  resultExpanded.value=false
}
const route = useRoute()
const router = useRouter()
const homeHandoff = window.history.state?.systemHomeAi
const businessContext = ref(['detail', 'selected', 'filtered'].includes(homeHandoff?.context?.kind) ? homeHandoff.context : null)
const onboardingStorageKey = 'tms.ai-workbench.onboarding.v1'
const showOnboarding = ref(false)
const activeLesson = ref(null)
const seenLessons = new Set()
const lessonStorageKey = id => `${onboardingStorageKey}.lesson.${id}`
const replayCatalogFilter = ref('')
function closeLearning() {
  activeLesson.value = null
}
function showLesson(id, step, replay = false) {
  closeLearning()
  if (!replay) {
    if (seenLessons.has(id)) return
    try { if (localStorage.getItem(lessonStorageKey(id)) === 'seen') return } catch { /* 本地存储不可用时只保留会话状态。 */ }
  }
  activeLesson.value = { id, step }
}
function finishLesson() {
  const lesson = activeLesson.value
  if (!lesson) return
  closeLearning()
  seenLessons.add(lesson.id)
  try { localStorage.setItem(lessonStorageKey(lesson.id), 'seen') } catch { /* 本次会话内不重复引导。 */ }
}
function rememberOnboarding() {
  if (homeHandoff?.previewOnboarding) return
  try { localStorage.setItem(onboardingStorageKey, 'seen') } catch { /* 本次会话内仍可退出导览。 */ }
}
function closeOnboarding() {
  showOnboarding.value = false
  rememberOnboarding()
}
const expertProfile = ref(false)
const pendingExpertId = ref(null)
const activeExpert = computed(() => (activeSession.value?.expertId || pendingExpertId.value) === transportExpert.id ? transportExpert : null)
function summonExpert(question = '') {
  newChat('analysis')
  businessContext.value = null
  pendingExpertId.value = transportExpert.id
  expertProfile.value = false
  view.value = 'chat'
  draft.value = question
  nextTick(() => host.value?.querySelector('textarea[aria-label="向至小简提问"]')?.focus())
}
const documentSkillActive = ref(false)
const supplementSkillActive = ref(false)
const supplementTaskKey = ref('')
const referenceSkills = skills.filter(skill => ['documents', 'waybill-supplement'].includes(skill.id))
const knowledgePicker=ref(false)
const quotedKnowledgeId = ref(null)
const knowledgeSource = ref(null)
const knowledgeChoices = computed(() => knowledgeGroups.map(group => ({
  label: group.label, options: group.ids.flatMap(id => knowledgeOptions(id)),
})))
const selectedSkillId=ref('documents'), selectedRunId=ref(null), catalogFilter=ref('全部')
const selectedSkill=computed(()=>skills.find(s=>s.id===selectedSkillId.value)||skills[0])
const selectedRun=computed(()=>runs.value.find(r=>r.id===selectedRunId.value))
const sessionRun=computed(()=>runs.value.find(r=>r.sessionId===activeSessionId.value && !r.documentNo))
const openReportId = ref(null)
const openReport = computed(() => runs.value.find(run =>
  run.id === openReportId.value && run.sessionId === activeSessionId.value && run.status === 'completed'
))
const catalogSkills=computed(()=>skills.filter(s=>catalogFilter.value==='全部'||s.type===catalogFilter.value))
const storageKey = conversationStorageKey
const initial = createInitialState()
let saved
try {
  const value = JSON.parse(localStorage.getItem(storageKey) || 'null')
  if (value?.version === 1 && Array.isArray(value.sessions) && value.sessions.every(s=>typeof s.id==='string' && typeof s.title==='string' && agents.some(a=>a.id===s.agentId) && Array.isArray(s.messages) && s.messages.every(m=>m.role==='user'?typeof m.text==='string':m.answer?.sections?.every(section=>Array.isArray(section.paragraphs))))) saved = value
} catch { /* 无效的本地演示记录使用初始场景，不影响其他页面数据。 */ }
for (const session of saved?.sessions || []) {
  if (session.supplement) {
    refreshSupplementExample(session.supplement, session.messages)
    if (session.title === '运单补录 · 运输台账') session.title = '运单补录 · 运输明细'
  }
  if (session.scheduleSetup && session.title === '创建持续任务') session.title = '创建定时任务'
  for (const message of session.messages) {
    if (message.scheduleProposal && message.answer?.title === '持续任务计划') message.answer.title = '定时任务计划'
  }
}
const sessions = ref(saved?.sessions || initial.sessions)
const favorites = ref(Array.isArray(saved?.favorites) ? saved.favorites.filter(f=>sessions.value.some(s=>s.id===f.sessionId) && Array.isArray(f.messageIds)) : initial.favorites)
const savedOrder = saved?.agentOrder
const agentOrder = ref(Array.isArray(savedOrder) && savedOrder.length===agents.length && new Set(savedOrder).size===agents.length && savedOrder.every(id=>agents.some(a=>a.id===id)) ? savedOrder : initial.agentOrder)
const orderedAgents = computed(()=>agentOrder.value.map(id=>agents.find(a=>a.id===id)))
const view = ref('home'), activeAgentId = ref(null), activeSessionId = ref(null), modelId = ref('analysis')
watch(view, current => {
  if (current !== 'home') showOnboarding.value = false
})
const activeAgent = computed(()=>agents.find(a=>a.id===activeAgentId.value))
const activeSession = computed(()=>sessions.value.find(s=>s.id===activeSessionId.value))
const activeScheduleDraft = computed(() => activeSession.value?.messages.findLast(message => message.scheduleProposal?.state === 'draft'))
const schedulePlaceholder = computed(() => {
  const config = activeScheduleDraft.value?.scheduleProposal.config
  if (!config) return activeSession.value?.scheduleSetup ? '描述你想定期执行的任务' : undefined
  return canActivateScheduledTask(config) ? '可以说「改成每天九点」或「确认启用」' : '补充执行时间，比如「每天早上 8 点」'
})
const activeKnowledgeId = computed(() => (documentSkillActive.value || supplementSkillActive.value) ? null : quotedKnowledgeId.value || activeSession.value?.knowledgeScopeId)
const activeKnowledge = computed(() => knowledgeEntries[activeKnowledgeId.value])
const activeConversationResult = computed(()=>completedResults.value.find(result=>result.id===activeSession.value?.resultId) || null)
const model = computed(()=>agents.find(a=>a.id===modelId.value)||orderedAgents.value[0])
const draft = ref(''), selectedTags = ref([]), deep = ref(false), attachments = ref([]), quote = ref(null)
const batch = ref(0), questions = computed(()=>questionBatches[batch.value%questionBatches.length])
const menuId = ref(null), overlay = ref(null), targetSessionId = ref(null), feedbackMessage = ref(null), feedbackKind = ref('like')
const sidebarCollapsed = ref(false)
const targetSession = computed(()=>sessions.value.find(s=>s.id===targetSessionId.value))
const actionMode = ref(null), selectedMessages = ref([]), favoriteFilter = ref('all'), managingFavorites = ref(false), selectedFavorites = ref([])
const visibleFavorites = computed(()=>favorites.value.filter(f=>favoriteFilter.value==='all'||f.agentId===favoriteFilter.value))
const generating = ref(false), speakingId = ref(null), toast = ref('')
const host = ref(null)
let generationTimer, toastTimer, pendingTarget
const uid = prefix => `${prefix}-${crypto.randomUUID()}`
const dateText = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date())
const messageText = m => m.role==='user' ? m.text : [m.answer?.title,...(m.answer?.sections||[]).flatMap(s=>[s.heading,...s.paragraphs])].filter(Boolean).join('\n\n')

function notify(text){toast.value=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2500)}
watch([sessions,favorites,agentOrder],()=>{
  try { localStorage.setItem(storageKey,JSON.stringify({version:1,sessions:sessions.value.map(s=>({...s,messages:s.messages.filter(m=>!m.pending)})),favorites:favorites.value,agentOrder:agentOrder.value})) }
  catch { notify('本地存储不可用，本次操作仅在当前页面保留') }
},{deep:true})
function stopGenerating(){
  clearTimeout(generationTimer)
  if(pendingTarget){pendingTarget.pending=false;pendingTarget.stopped=true;pendingTarget.answer={title:'已停止生成',reasoning:[],sections:[]}}
  pendingTarget=null;generating.value=false
}
function clearComposer(){supplementSkillActive.value=false;supplementTaskKey.value='';draft.value='';attachments.value=[];quote.value=null;quotedKnowledgeId.value=null;selectedTags.value=[]}
function leaveView(){resultExpanded.value=false;previewResultId.value=null;closeLearning();replayCatalogFilter.value='';openReportId.value=null;stopGenerating();actionMode.value=null;selectedMessages.value=[];overlay.value=null;menuId.value=null;speakingId.value=null;window.speechSynthesis?.cancel()}
function openScheduledTasks(historyTaskId = null) {
  leaveView()
  showOnboarding.value = false
  businessContext.value = null
  scheduledHistoryTaskId.value = historyTaskId
  view.value = 'tasks'
  activeSessionId.value = null
  activeAgentId.value = null
}
function saveScheduledTask(config) {
  scheduled.saveTask(config)
  scheduledEdit.value = null
  notify('定时任务已更新')
}
function createScheduleSession(title) {
  const session = { id: uid('chat'), title, agentId: 'analysis', group: '今天', pinned: false, scheduleSetup: true, messages: [] }
  sessions.value.unshift(session)
  activeSessionId.value = session.id
  activeAgentId.value = session.agentId
  view.value = 'chat'
  return activeSession.value
}
function startScheduleConversation(useExample = false) {
  newChat('analysis')
  businessContext.value = null
  createScheduleSession('创建定时任务')
  if (useExample) draft.value = anomalyTaskExample
  nextTick(() => host.value?.querySelector('textarea[aria-label="向至小简提问"]')?.focus())
}
function confirmSchedule(proposal) {
  if (activeScheduleDraft.value?.scheduleProposal !== proposal || !canActivateScheduledTask(proposal.config)) return
  const task = scheduled.saveTask(proposal.config)
  proposal.state = 'enabled'
  activeSession.value.title = task.title
  notify('定时任务已启用')
}
function cancelSchedule(proposal) {
  if (activeScheduleDraft.value?.scheduleProposal === proposal) proposal.state = 'cancelled'
}
function scheduleAnswer(session, title, text, scheduleProposal) {
  session.messages.push({
    id: uid('answer'), role: 'assistant', scheduleProposal,
    answer: { title, reasoning: [], sections: text ? [{ heading: '', paragraphs: [text] }] : [] },
  })
}
function handleScheduleTurn(question) {
  const pending = activeScheduleDraft.value?.scheduleProposal
  const fromTaskEntry = activeSession.value?.scheduleSetup && !activeSession.value.messages.some(message => message.scheduleProposal)
  const config = scheduleDraftFromQuestion(question, pending?.config, fromTaskEntry)
  if (!config && !pending && !fromTaskEntry) return false

  closeLearning()
  businessContext.value = null
  const session = activeSession.value || createScheduleSession('创建定时任务')
  session.messages.push({ id: uid('question'), role: 'user', text: question, files: [] })
  if (pending && /^(确认|确认启用|启用)[。！!]?$/.test(question)) {
    if (canActivateScheduledTask(pending.config)) confirmSchedule(pending)
    else scheduleAnswer(session, '请补充执行时间', '告诉我执行频率、几点执行，每周执行时还需要星期几。')
  } else if (pending && /^(取消|取消创建|先不建)[。！!]?$/.test(question)) {
    cancelSchedule(pending)
  } else if (config) {
    if (pending) pending.state = 'superseded'
    scheduleAnswer(session, '定时任务计划', '', { config, state: 'draft' })
  } else {
    scheduleAnswer(session, pending ? '你想调整哪一项？' : '想定期跟进哪些异常运单？',
      pending ? '你可以说「改成每天九点」或「不用提醒」。' : '例如「' + anomalyTaskExample + '」')
  }
  clearComposer()
  return true
}
async function runScheduledTask(id) {
  const task = scheduledTasks.value.find(item => item.id === id)
  scheduledHistoryTaskId.value = id
  const run = await scheduled.runNow(id)
  if (run && task?.remind) notify('简报已生成，可在执行记录中查看')
}
function newChat(agentId=null){leaveView();pendingExpertId.value=null;documentSkillActive.value=false;view.value='home';activeAgentId.value=agentId;activeSessionId.value=null;modelId.value=agentId||agentOrder.value[0];selectedRunId.value=null;clearComposer()}
function goWorkbench() {
  if (homeHandoff) return openPrototypePage(router, route, 'systemWorkbench',
    homeHandoff.preview ? { preview: homeHandoff.preview === 'floating' ? 'floating' : 'ai' } : {})
  newChat()
}
function receiveHomeHandoff(handoff) {
  if (handoff.activityTarget) {
    openAccount('activity', handoff.activityTarget)
    return
  }
  if (handoff.expertId === transportExpert.id) { summonExpert(handoff.draft || ''); return }
  if (handoff.startOnboarding) {
    let seen = false
    try { seen = localStorage.getItem(onboardingStorageKey) === 'seen' } catch { /* 存储不可用时仍可开始导览。 */ }
    showOnboarding.value = handoff.previewOnboarding || !seen
  }
  if (handoff.conversation) {
    const { id, messages } = handoff.conversation
    if (!sessions.value.some(session => session.id === id)) {
      sessions.value.unshift({
        id, title: messages[0].text.slice(0, 40), agentId: 'analysis', group: '今天', pinned: false,
        messages: messages.map(message => message.role === 'user'
          ? { id: uid('question'), role: 'user', text: message.text, files: [] }
          : { id: uid('answer'), role: 'assistant', answer: { title: message.text, sections: [], reasoning: message.reasoning || [] } }),
      })
    }
    openSession(id)
  }
  if (handoff.draft) draft.value = handoff.draft
  if (handoff.skill === 'knowledge') { openSkill('knowledge'); return }
  if (handoff.skill) { documentSkillActive.value = handoff.skill === 'documents'; closeLearning() }
}
function setChatSkill(id) {
  documentSkillActive.value = id === 'documents'
  supplementSkillActive.value = id === 'waybill-supplement'
  if (!supplementSkillActive.value) supplementTaskKey.value = ''
  quotedKnowledgeId.value = null
}
async function referenceChatSkill(id) {
  if (!referenceSkills.some(skill => skill.id === id)) return
  closeLearning()
  setChatSkill(id)
  await nextTick()
  host.value?.querySelector('textarea[aria-label="向至小简提问"]')?.focus()
}
async function openSkill(id, replay = false) {
  const skill = skills.find(item => item.id === id)
  if (!skill) return
  showOnboarding.value = false
  if (id === 'settlement-recon') {
    leaveView()
    documentSkillActive.value = false
    activeSessionId.value = null
    businessContext.value = null
    clearComposer()
    view.value = 'recon'
    return
  }
  if (id === transportExpert.id) { closeLearning(); expertProfile.value = true; return }
  if (id === 'knowledge') {
    if (view.value !== 'knowledge') {
      leaveView()
      documentSkillActive.value = false
      activeSessionId.value = null
      businessContext.value = null
      clearComposer()
      view.value = 'knowledge'
    }
    showLesson('knowledge.workspace', 'knowledge', replay)
    return
  }
  if (id === 'waybill-supplement') {
    const continueChat = ['chat', 'catalog'].includes(view.value) && activeSession.value && !activeSession.value.supplement && !activeExpert.value
    if (!continueChat) {
      leaveView()
      view.value = 'chat'
      activeSessionId.value = null
      activeAgentId.value = null
      businessContext.value = null
      pendingExpertId.value = null
    } else {
      view.value = 'chat'
    }
    return referenceChatSkill(id)
  }
  if (id === 'documents') {
    if (view.value !== 'chat') {
      leaveView()
      view.value = 'home'
      activeSessionId.value = null
    }
    setChatSkill(id)
    showLesson('skill.' + id, 'documents', replay)
    await nextTick()
    if (!activeLesson.value) host.value?.querySelector('textarea[aria-label="向至小简提问"]')?.focus()
    return
  }
  leaveView()
  documentSkillActive.value = false
  selectedSkillId.value = id
  selectedRunId.value = null
  view.value = 'skill'
  const step = skill.type === '专家团' ? 'expert' : 'skill'
  showLesson('skill.' + id, step, replay)
}
function openRun(id) {
  const run = runs.value.find(item => item.id === id)
  if (!run) return
  if (run.documentNo && sessions.value.some(session => session.id === run.sessionId)) {
    if (view.value !== 'chat' || activeSessionId.value !== run.sessionId) openSession(run.sessionId)
    openReportId.value = run.status === 'completed' ? run.id : null
    return
  }
  leaveView()
  selectedSkillId.value = run.skillId
  selectedRunId.value = id
  view.value = 'skill'
}
function selectCatalogFilter(filter, replay = false) {
  catalogFilter.value = filter
  if (replayCatalogFilter.value !== filter) replayCatalogFilter.value = ''
  if (replay) replayCatalogFilter.value = filter
  const experts = filter === '专家' || filter === '专家团'
  showLesson(experts ? 'catalog.experts' : 'catalog.skills', experts ? 'choose-expert' : 'choose-skill', replay)
}
function openCatalog(mode, filter = '全部', replay = false) {
  leaveView()
  view.value = mode === 'results' ? 'results' : 'catalog'
  if (mode !== 'results') selectCatalogFilter(filter, replay)
}
function openOnboardingTopic(topic) {
  closeOnboarding()
  if (topic === '知识库') openSkill('knowledge', true)
  else openCatalog('skills', topic, true)
}
function openCatalogSkill(id) {
  openSkill(id, replayCatalogFilter.value === catalogFilter.value && skills.some(skill => skill.id === id && skill.type === catalogFilter.value))
}
function startSkill(config){
  closeLearning()
  const skill=selectedSkill.value,sessionId=uid('chat')
  const run=createSkillRun(skill,config,sessionId)
  const session={id:sessionId,title:run.title,agentId:'analysis',group:'今天',pinned:false,messages:[
    {id:uid('question'),role:'user',text:`使用${skill.name}。${config.question||config.requirements||`单据类型：${config.documentType}；分析重点：${config.focus.join('、')}`}`,files:config.files.map((f,i)=>({id:`skill-file-${i}`,name:f.name}))},
    {id:uid('answer'),role:'assistant',answer:{title:'技能执行已创建',reasoning:[`已记录「${skill.name}」的输入和要求。`,'已创建模拟任务，后续处理与成果使用内置示例。'],sections:[{heading:skill.name,paragraphs:['已保留本次输入与分析要求，可通过本对话上方入口查看进度和报告。','当前为本地原型：执行与报告采用合成示例，不读取上传文件内容。']}]}}
  ]}
  sessions.value.unshift(session);activeSessionId.value=sessionId;selectedRunId.value=run.id
}
function openSession(id){
  const session=sessions.value.find(s=>s.id===id);if(!session)return
  leaveView();pendingExpertId.value=null;documentSkillActive.value=session.messages.at(-1)?.documentCandidates != null;activeSessionId.value=id;activeAgentId.value=session.agentId;modelId.value=session.agentId;view.value='chat';clearComposer()
  if(session.resultId && completedResults.value.some(result=>result.id===session.resultId)) { businessContext.value=null;previewResultId.value=session.resultId }
}
function openFavorites(){leaveView();view.value='favorites';activeSessionId.value=null;favoriteFilter.value='all';managingFavorites.value=false;selectedFavorites.value=[]}
function askInKnowledge(question, scopeId) {
  if (!question || !knowledgeDocuments(scopeId).length) return
  newChat('analysis')
  submitQuestion(question, scopeId)
}
function selectKnowledge(id) {
  quotedKnowledgeId.value = id
  supplementSkillActive.value = false
  documentSkillActive.value = false
  knowledgePicker.value = false
}
function removeKnowledge() {
  if (quotedKnowledgeId.value) quotedKnowledgeId.value = null
  else if (activeSession.value) delete activeSession.value.knowledgeScopeId
}
function openKnowledgeSource(source) {
  const document = knowledgeEntries[source.docId]
  const index = source.sectionIndex
  const sections = document?.sections
  const liveSection = sections?.[index]
  const section = source.content ? { title: source.title, content: source.content } : liveSection
  if (!section) return
  const matchesDocument = liveSection?.title === section.title && liveSection?.content === section.content
  knowledgeSource.value = {
    name: source.name || document?.name || '引用资料',
    section,
    position: matchesDocument ? `第 ${index + 1} 节 · 共 ${sections.length} 节` : '回答中保留的引用片段',
    previous: matchesDocument && index > 0 ? sections[index - 1] : null,
    next: matchesDocument ? sections[index + 1] : null,
  }
}
function toggleTag(tag){selectedTags.value=selectedTags.value.includes(tag)?selectedTags.value.filter(t=>t!==tag):[...selectedTags.value,tag]}
function submitDocumentQuestion(question) {
  if (!question) {
    notify('请输入要分析的系统单据')
    return
  }
  let session = activeSession.value
  if (!session) {
    const id = uid('chat')
    sessions.value.unshift({ id, title: '单据分析', agentId: 'analysis', group: '今天', pinned: false, messages: [] })
    activeSessionId.value = id
    session = activeSession.value
  }
  const scopedRecords = businessContext.value?.records || []
  const explicitRecord = scopedRecords.find(record => question.toUpperCase().includes(record.id.toUpperCase()))
  const resolution = scopedRecords.length > 1 && !explicitRecord
    ? { message: '请选择本次要分析的一张单据。', candidates: scopedRecords }
    : resolveDocument(question, explicitRecord || businessContext.value?.record)
  const userMessage = { id: uid('question'), role: 'user', text: question, files: attachments.value.map(file => ({ id: file.id, name: file.name })) }
  const answer = { title: resolution.message || '单据分析', reasoning: [], sections: [] }
  const response = { id: uid('answer'), role: 'assistant', answer }
  if (resolution.record) {
    const run = createDocumentAnalysis(resolution.record, question, session.id)
    runs.value.unshift(run)
    session.title = run.title + ' · ' + run.documentNo
    response.runId = run.id
    documentSkillActive.value = false
  } else {
    response.documentCandidates = resolution.candidates
  }
  session.messages.push(userMessage, response)
  view.value = 'chat'
  activeAgentId.value = session.agentId
  clearComposer()
}
function previousKnowledgeSources(messages, questionIndex, scopeId) {
  if (questionIndex < 2) return undefined
  const previousQuestion = messages[questionIndex - 2]
  const previousAnswer = messages[questionIndex - 1]
  return previousQuestion.knowledgeScopeId === scopeId ? previousAnswer.answer?.sources : undefined
}
const settlementSuggestionProgress = ref({ phase: 'scope', exported: false })
const homeSuggestions = computed(() => businessSuggestions.map(item => {
  if (item.id === 'settlement-oct') {
    const progress = settlementSuggestionProgress.value
    return {
      ...item,
      ...(progress.phase === 'done' ? {
        title: '编制福建大道成 10 月客户对账单',
        description: '本次运输结算单已创建，可沿用已确认的数据，匹配知识库模板并生成对账文件。',
        action: '生成对账单',
      } : progress.phase !== 'scope' ? { action: '继续核对' } : {}),
      completed: progress.exported,
    }
  }
  return { ...item, completed: sessions.value.some(session => session.businessSuggestionId === item.id) }
}))
function openBusinessSuggestion(id) {
  if (id === 'settlement-oct') return openSkill('settlement-recon')
  const item = businessSuggestions.find(item => item.id === id)
  if (!item?.answer) return
  const existing = sessions.value.find(session => session.businessSuggestionId === id)
  if (existing) return openSession(existing.id)
  leaveView()
  clearComposer()
  showOnboarding.value = false
  documentSkillActive.value = false
  activeAgentId.value = 'analysis'
  businessContext.value = null
  const session = {
    id: uid('business'), title: item.title, businessSuggestionId: id,
    agentId: 'analysis', group: '今天', pinned: false,
    messages: [
      { id: uid('question'), role: 'user', text: item.question, files: [] },
      { id: uid('answer'), role: 'assistant', answer: item.answer },
    ],
  }
  sessions.value.unshift(session)
  activeSessionId.value = session.id
  view.value = 'chat'
}
function buildReply(session, question, questionIndex, contextRun) {
  if (session.businessSuggestionId && !question.knowledgeScopeId) return makeBusinessSuggestionReply(session.businessSuggestionId, question.text)
  if (session.expertId === transportExpert.id && !question.knowledgeScopeId) return makeExpertAnswer(question.text, session.messages.slice(0, questionIndex).filter(m => m.role === 'user').map(m => m.text))
  if (question.knowledgeScopeId) {
    const sources = previousKnowledgeSources(session.messages, questionIndex, question.knowledgeScopeId)
    return makeKnowledgeAnswer(question.text, question.knowledgeScopeId, sources)
  }
  if (contextRun?.resultType === 'brief') return makeBriefReply(question.text)
  if (contextRun?.resultType === 'scheduled-brief') return {
    title: contextRun.summary,
    reasoning: contextRun.reasoning,
    sections: contextRun.sections.map(section => ({ heading: section.title, paragraphs: [section.text] })),
  }
  if (contextRun) {
    return {
      title: '报告依据',
      reasoning: [`参考本次关联的「${contextRun.title}」，整理已有报告内容供对照。`, '沿用原报告的数据范围。'],
      sections: [
        { heading: '关联成果', paragraphs: [contextRun.title + (contextRun.documentNo ? ' · ' + contextRun.documentNo : '')] },
        ...makeSkillReport(contextRun).sections,
      ],
    }
  }
  return makeAnswer(question.text, agents.find(agent => agent.id === session.agentId) || model.value)
}
function contextForReply(session) {
  return activeConversationResult.value || openReport.value
    || runs.value.find(run => run.sessionId === session.id && run.status === 'completed')
}
async function startSupplement(question, files, taskKey) {
  files = await retainSupplementFiles(files)
  const previous = view.value === 'chat' ? activeSession.value : null
  leaveView()
  showOnboarding.value = false
  const message = {
    id: uid('question'), role: 'user', text: question || '帮我补录这份运输明细',
    skillName: '运单补录', files: files.map(({ id, name }) => ({ id, name })),
  }
  const supplement = createSupplementState(files[0]?.name || '', taskKey)
  supplement.files = files
  if (previous && !previous.supplement) {
    previous.supplement = supplement
    previous.messages.push(message)
  } else {
    const session = {
      id: uid('supplement'), title: '运单补录', agentId: 'analysis', group: '今天',
      pinned: false, messages: [message], supplement,
    }
    sessions.value.unshift(session)
    activeSessionId.value = session.id
  }
  activeAgentId.value = activeSession.value.agentId
  businessContext.value = null
  view.value = 'chat'
  clearComposer()
}

async function submitQuestion(text, initialKnowledgeScopeId = null){
  const question=(typeof text==='string'?text:draft.value).trim()
  if((!question&&!attachments.value.length&&!supplementSkillActive.value)||generating.value)return
  if (question || !documentSkillActive.value) closeLearning()
  const knowledgeScopeId = initialKnowledgeScopeId ?? activeKnowledgeId.value
  const knowledgeScope = knowledgeEntries[knowledgeScopeId]?.name
  const supplementRequest = supplementSkillActive.value || /(?:帮我|请|我要|开始).*(?:补录|补进去)|^(?:运单补录|批量补录|补录运单)$/.test(question)
    || (attachments.value.length > 0 && /补录|补进去/.test(question))
  if (!activeExpert.value && (!knowledgeScope || supplementSkillActive.value) && !documentSkillActive.value && supplementRequest) return startSupplement(question, attachments.value, supplementTaskKey.value)
  if (question && !activeExpert.value && !knowledgeScope && !documentSkillActive.value && handleScheduleTurn(question)) return
  if (knowledgeScope && !question) return notify('请输入要基于知识资料提问的内容')
  if (!activeExpert.value && !knowledgeScope && (documentSkillActive.value || isDocumentAnalysisRequest(question))) return submitDocumentQuestion(question)
  let session=activeSession.value
  if(!session){
    session={id:uid('chat'),title:(question||attachments.value[0].name).slice(0,40),agentId:modelId.value,group:'今天',pinned:false,messages:[]}
    if (pendingExpertId.value) {
      session.expertId = pendingExpertId.value
      pendingExpertId.value = null
    }
    if (initialKnowledgeScopeId) session.knowledgeScopeId = initialKnowledgeScopeId
    sessions.value.unshift(session);activeSessionId.value=session.id;session=activeSession.value
  }
  const userMessage={id:uid('question'),role:'user',text:question||'请结合附件帮我分析',files:attachments.value.map(f=>({id:f.id,name:f.name})),quote:quote.value?.text,tags:[...selectedTags.value]}
  if (knowledgeScope) Object.assign(userMessage, { knowledgeScopeId, knowledgeScope })
  const response={id:uid('answer'),role:'assistant',pending:true,answer:{title:'',reasoning:[],sections:[]}}
  const questionIndex = session.messages.length
  session.messages.push(userMessage,response)
  const target=session.messages.at(-1)
  activeAgentId.value=session.agentId;view.value='chat';actionMode.value=null;clearComposer();generating.value=true;pendingTarget=target
  const contextRun = contextForReply(session)
  generationTimer=setTimeout(()=>{
    target.answer = buildReply(session, userMessage, questionIndex, contextRun)
    target.pending=false;generating.value=false;pendingTarget=null
  },650)
  await nextTick()
}
function addFiles(files){attachments.value.push(...files.map(f=>({id:uid('file'),name:f.name,file:f})));if(files.length)notify(`已添加${files.length}个本地附件，未上传`)}
function beginSelection(mode,message){
  if(generating.value)return notify('请等待回答完成或停止生成')
  const index=activeSession.value.messages.findIndex(m=>m.id===message.id)
  actionMode.value=mode;selectedMessages.value=[message.id]
  if(activeSession.value.messages[index-1]?.role==='user')selectedMessages.value.unshift(activeSession.value.messages[index-1].id)
}
function toggleSelection(id){selectedMessages.value=selectedMessages.value.includes(id)?selectedMessages.value.filter(x=>x!==id):[...selectedMessages.value,id]}
function saveFavorite(session=activeSession.value,ids=selectedMessages.value){
  if(!session)return
  const messages=session.messages.filter(m=>ids.includes(m.id)&&!m.pending)
  if(!messages.some(m=>m.role==='assistant'))return notify('请至少选择一条回答')
  const key=[...ids].sort().join('|')
  if(favorites.value.some(f=>f.sessionId===session.id&&[...f.messageIds].sort().join('|')===key)){notify('所选对话已收藏');actionMode.value=null;return}
  favorites.value.unshift({id:uid('favorite'),sessionId:session.id,messageIds:messages.map(m=>m.id),title:session.title,agentId:session.agentId,date:dateText(),excerpt:messageText(messages.find(m=>m.role==='assistant'))})
  actionMode.value=null;notify('收藏成功，可在“我的收藏”中查看')
}
async function copyText(text){
  try { await navigator.clipboard.writeText(text);notify('已复制') }
  catch {
    const textarea=document.createElement('textarea');textarea.value=text;textarea.style.cssText='position:fixed;left:-9999px';document.body.append(textarea);textarea.select()
    const copied=document.execCommand('copy');textarea.remove();notify(copied?'已复制':'复制失败，请选中文字手动复制')
  }
}
function responseAction(action,message){
  if(action==='copy')return copyText(messageText(message))
  if(action==='quote'){quote.value={id:message.id,text:messageText(message).slice(0,180)};return}
  if(action==='send'){draft.value=messageText(message);notify('回答已放入输入框');return}
  if(['favorite','share'].includes(action))return beginSelection(action,message)
  if(['like','dislike'].includes(action)){feedbackMessage.value=message;feedbackKind.value=action;overlay.value='feedback';return}
  if(action==='regenerate'){
    if(generating.value)return notify('正在生成，请稍候')
    const session = activeSession.value
    const index = session.messages.findIndex(m => m.id === message.id)
    const questionIndex = session.messages.slice(0, index).findLastIndex(m => m.role === 'user')
    const question = session.messages[questionIndex]
    if(!question)return
    const contextRun = contextForReply(session)
    message.pending=true;generating.value=true;pendingTarget=message
    generationTimer=setTimeout(()=>{
      message.answer = buildReply(session, question, questionIndex, contextRun)
      message.pending=false;message.stopped=false;generating.value=false;pendingTarget=null
    },650)
  }
  if(action==='speak'){
    if(!window.speechSynthesis)return notify('当前浏览器不支持朗读')
    window.speechSynthesis.cancel()
    if(speakingId.value===message.id){speakingId.value=null;return}
    const utterance=new SpeechSynthesisUtterance(messageText(message));utterance.lang='zh-CN';utterance.onend=utterance.onerror=()=>speakingId.value=null;speakingId.value=message.id;window.speechSynthesis.speak(utterance)
  }
}
function historyAction(action,id){
  const session=sessions.value.find(s=>s.id===id);menuId.value=null;if(!session)return
  if(action==='pin'){session.pinned=!session.pinned;return}
  if(action==='favorite')return saveFavorite(session,session.messages.filter(m=>!m.pending).map(m=>m.id))
  targetSessionId.value=id;overlay.value=action==='rename'?'rename':'delete'
}
function deleteSession(){
  const id=targetSessionId.value;runs.value=runs.value.filter(r=>r.sessionId!==id);sessions.value=sessions.value.filter(s=>s.id!==id);favorites.value=favorites.value.filter(f=>f.sessionId!==id);overlay.value=null
  if(activeSessionId.value===id)newChat()
  notify('对话已删除')
}
function toggleFavorite(id){selectedFavorites.value=selectedFavorites.value.includes(id)?selectedFavorites.value.filter(x=>x!==id):[...selectedFavorites.value,id]}
function removeFavorites(){if(!selectedFavorites.value.length)return;favorites.value=favorites.value.filter(f=>!selectedFavorites.value.includes(f.id));selectedFavorites.value=[];notify('已取消收藏，历史对话仍保留')}
function openFavorite(f){openSession(f.sessionId)}
async function saveShareImage(){
  const messages=activeSession.value?.messages.filter(m=>selectedMessages.value.includes(m.id))||[]
  if(!messages.length)return notify('请选择需要分享的内容')
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),width=1200,padding=60
  canvas.width=width;ctx.font='24px "PingFang SC", sans-serif'
  const lines=[]
  for(const message of messages){lines.push(message.role==='user'?'我':'至小简');for(const paragraph of messageText(message).split('\n')){let line='';for(const char of paragraph){if(ctx.measureText(line+char).width>width-padding*2){lines.push(line);line=''}line+=char}lines.push(line)}lines.push('')}
  canvas.height=Math.max(360,200+lines.length*36);ctx.fillStyle='#f6f7fb';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#333';ctx.font='bold 30px "PingFang SC",sans-serif';ctx.fillText('AI工作台 · 对话分享',padding,65);ctx.font='24px "PingFang SC",sans-serif';lines.forEach((line,i)=>ctx.fillText(line,padding,120+i*36));ctx.fillStyle='#999';ctx.font='18px sans-serif';ctx.fillText('内容由AI生成，仅供参考 · 本地原型演示',padding,canvas.height-30)
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)return notify('图片生成失败，请重试')
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`AI工作台-对话分享-${dateText()}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('分享图片已生成');actionMode.value=null
}
const navigation = [
  {key:'ai',label:'AI工作台',left:0,top:0,width:32,height:32,imgs:[{src:asset('nav-brand-left.svg'),x:3.2,y:3.16,w:13.54,h:13.9},{src:asset('nav-brand-bottom.svg'),x:7.36,y:16.12,w:13.6,h:12.72},{src:asset('nav-brand-right.svg'),x:17.11,y:4.36,w:11.68,h:14.97}]},
  {key:'apps',label:'应用',left:0,top:90,width:32,height:32,imgs:[{src:asset('apps.svg'),x:4,y:0,w:26,h:26}]},
]
onMounted(() => {
  if (typeof route.query.analysisReport === 'string') {
    openRun(route.query.analysisReport)
    return
  }
  if (route.query.view === 'tasks') {
    openScheduledTasks()
    return
  }
  if (homeHandoff) receiveHomeHandoff(homeHandoff)
})
watch(() => [route.query.capability, route.query.task], ([capability, task]) => {
  if (capability !== 'waybill-supplement') return
  newChat()
  openSkill('waybill-supplement')
  supplementTaskKey.value = typeof task === 'string' ? task : ''
}, { immediate: true })
onUnmounted(()=>{clearTimeout(generationTimer);clearTimeout(toastTimer);window.speechSynthesis?.cancel()})
</script>

<template>
  <div ref="host" class="ai-workbench-host">
    <div class="ai-workbench-frame" @click="menuId=null">
      <TmsAiWorkbenchShell fluid site-name="楹联集运站" organization-name="企业名称企业名称企业企业名称..." :date-text="workspaceDateText" weather-text="24℃ 多云" :tabs="[{key:'ai',label:'至小简'}]" active-tab-key="ai" :nav-items="navigation" active-nav="ai" @go-workbench="goWorkbench" @switch-tab="newChat()" @close-tab="newChat()" @navigate="key=>key==='ai'?newChat():overlay='more'" @menu-select="notify('当前原型聚焦AI工作台')">
        <template #menu-extra><AssistantEntry workspace @workspace="businessContext=null;newChat()" /></template>
        <AiSidebar :agents="orderedAgents" :sessions="sessions" :active-agent="activeAgentId" :active-session="activeSessionId" :view="view" :menu-id="menuId" :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" @new="newChat()" @agent="newChat" @favorites="openFavorites" @search="overlay='search'" @settings="overlay='agents'" @more="overlay='more'" @session="openSession" @menu="id=>menuId=menuId===id?null:id" @history-action="historyAction" @home="newChat()" @skill="openSkill" @catalog="openCatalog" @tasks="openScheduledTasks()" @onboarding="closeLearning();showOnboarding=true">
          <template #account>
            <AiAccountEntry
              :collapsed="sidebarCollapsed"
              :credits="accountCredits"
              :plan="account.plan"
              :pending-reward="pendingPromotion"
              @open="openAccount"
            />
          </template>
        </AiSidebar>
        <main class="ai-main" :class="[`ai-view-${view}`, {'ai-action-mode':!!actionMode,'has-result-preview':!!previewResult,'result-reading':resultExpanded && !!(previewResult || openReport)}, `ai-action-${actionMode}`]" aria-label="AI工作台">
          <KeepAlive><AiSettlementRecon v-if="view==='recon'" @close="newChat()" @suggestion-progress="settlementSuggestionProgress=$event" /></KeepAlive>
          <AiWaybillSupplement v-if="view==='chat' && activeSession?.supplement" :key="activeSession.id" :session="activeSession" :state="activeSession.supplement" :model="model" :agents="orderedAgents" />
          <template v-else-if="view==='recon'" />
          <AiKnowledgeWorkspace v-else-if="view==='knowledge'" @ask="askInKnowledge" @help="showLesson('knowledge.workspace', 'knowledge', true)" />
          <AiScheduledTasks
            v-else-if="view==='tasks'"
            :history-task-id="scheduledHistoryTaskId"
            :tasks="scheduledTasks"
            :runs="scheduledRuns"
            @back="openScheduledTasks()"
            @history="scheduledHistoryTaskId=$event"
            @new="startScheduleConversation"
            @edit="scheduledEdit=$event"
            @toggle="scheduled.toggleTask"
            @run="runScheduledTask"
            @result="openResultPreview"
          />
          <template v-else-if="view==='skill'"><AiSkillWorkspace :key="selectedSkillId" :skill="selectedSkill" :task="selectedRun" @back="newChat()" @start="startSkill" @complete="completeSkillRun" @conversation="openSession" @reuse="openSkill"/></template>
          <section v-else-if="view==='catalog'" class="ai-capability-catalog"><h1>专家与技能</h1><p>选择能力后，按它的输入要求开始使用。</p>
            <div class="ai-catalog-filters"><button v-for="type in ['全部','技能','专家','专家团']" :key="type" :class="{selected:catalogFilter===type}" @click="selectCatalogFilter(type)">{{ type }}</button></div><div class="ai-catalog-grid"><button v-for="skill in catalogSkills" :key="skill.id" @click="openCatalogSkill(skill.id)"><img :src="asset(skill.icon)" alt=""/><h2>{{ skill.name }} <small>{{ skill.type }}</small></h2><p>{{ skill.description }}</p><span>{{ skill.type === '专家' ? '了解专家' : '使用' + skill.type }}</span></button></div></section>
          <section v-else-if="view==='results'" class="ai-capability-catalog ai-all-results">
            <button class="ai-back" @click="newChat()">返回首页</button>
            <h1>全部工作成果</h1>
            <AiWorkResultList :results="completedResults" @open="openResultPreview" />
          </section>
          <template v-else-if="view==='favorites'">
            <h1 class="ai-page-heading">我的收藏</h1><section class="ai-favorites-content"><div class="ai-favorite-filters"><button :class="{selected:favoriteFilter==='all'}" @click="favoriteFilter='all';selectedFavorites=[]">全部</button><button v-for="agent in orderedAgents" :key="agent.id" :class="{selected:favoriteFilter===agent.id}" @click="favoriteFilter=agent.id;selectedFavorites=[]">{{ agent.model }}</button><button class="ai-favorite-manage ai-icon-button" aria-label="管理收藏" title="管理收藏" @click="managingFavorites=!managingFavorites;selectedFavorites=[]"><AiIcon name="settings" /></button></div>
            <div class="ai-favorite-grid"><article v-for="favorite in visibleFavorites" :key="favorite.id" class="ai-favorite-card" :class="{selected:selectedFavorites.includes(favorite.id)}"><label v-if="managingFavorites" class="ai-favorite-checkbox"><input type="checkbox" :checked="selectedFavorites.includes(favorite.id)" :aria-label="`选择收藏：${favorite.title}`" @change="toggleFavorite(favorite.id)" /></label><button @click="managingFavorites?toggleFavorite(favorite.id):openFavorite(favorite)"><h2 :title="favorite.title">{{ favorite.title }}</h2><p>{{ favorite.excerpt }}</p><footer>{{ favorite.date }} {{ agents.find(a=>a.id===favorite.agentId)?.model }}</footer></button></article></div><p v-if="!visibleFavorites.length" class="ai-empty">暂无收藏，可以在对话中收藏有价值的回答</p></section>
            <footer v-if="managingFavorites" class="ai-selection-bar"><label><input type="checkbox" :checked="visibleFavorites.length>0&&selectedFavorites.length===visibleFavorites.length" @change="selectedFavorites=$event.target.checked?visibleFavorites.map(f=>f.id):[]" />全选</label><button class="ai-primary ai-rounded" :disabled="!selectedFavorites.length" @click="removeFavorites">取消收藏</button></footer>
          </template>
          <template v-else>
            <div class="ai-conversation-pane" :class="{ 'has-report': !!(openReport || previewResult) }">
            <header v-if="view==='chat' || businessContext" class="ai-conversation-header">
              <h1 v-if="view==='chat'">{{ activeSession?.title || '新对话' }}</h1>
              <button v-if="activeConversationResult?.resultType==='scheduled-brief'" class="ai-back" @click="openScheduledTasks(activeConversationResult.taskId)">返回执行记录</button>
              <div v-if="businessContext" class="ai-business-context"><span>关联范围：{{ businessContext.label }}</span><button @click="businessContext=null">取消关联</button></div>
              <div v-if="view==='chat'&&sessionRun" class="ai-session-run"><span>{{ sessionRun.title }} · {{ sessionRun.status==='running'?'分析中':'报告已生成' }}</span><button @click="openRun(sessionRun.id)">{{ sessionRun.status==='running'?'查看进度':'查看报告' }}</button></div>
            </header>
            <AiChat v-if="view==='chat'&&activeSession" :session="activeSession" :runs="runs" :result="activeConversationResult" @open-result="openResultPreview" @prefill="draft=$event" @confirm-schedule="confirmSchedule" @cancel-schedule="cancelSchedule" @open-scheduled-tasks="openScheduledTasks()" @open-run="openRun" @open-source="openKnowledgeSource" :action-mode="actionMode" :selected-messages="selectedMessages" :generating="generating" :speaking-id="speakingId" @action="responseAction" @toggle-message="toggleSelection" @question="submitQuestion" />
            <section v-else-if="activeExpert" class="ai-expert-start">
              <img :src="asset('agent-dispatch.svg')" alt=""/><h1>{{ activeExpert.name }}</h1><p>{{ activeExpert.description }}</p>
              <h3>试试这样问我</h3><button v-for="question in activeExpert.questions" :key="question" class="ai-expert-example" @click="draft=question">{{ question }}</button>
            </section>
            <AiHome v-else-if="view!=='chat'" :results="completedResults" :promotion="promotion" :suggestions="homeSuggestions" @suggestion="openBusinessSuggestion" @promotion="openPromotion" @skill="openSkill" @run="openResultPreview" @catalog="openCatalog">
              <template #onboarding>
                <AiOnboarding v-if="showOnboarding" :workspace="host" @close="closeOnboarding" @complete="rememberOnboarding" @learn="openOnboardingTopic" />
              </template>
            </AiHome>
            <AiComposer :expert-name="activeExpert?.name" :context-placeholder="schedulePlaceholder || (activeExpert ? '告诉专家你的问题，或选择上方示例开始' : activeConversationResult?.resultType==='scheduled-brief' ? '针对这份简报继续提问' : activeConversationResult ? '针对这份早报继续提问' : undefined)" v-if="!actionMode" v-model="draft" :document-skill="documentSkillActive" :supplement-skill="supplementSkillActive" @remove-supplement-skill="supplementSkillActive=false;supplementTaskKey=''" @remove-document-skill="documentSkillActive=false;closeLearning()" :model="model" :agents="orderedAgents" :selected-tags="selectedTags" :deep="deep" :attachments="attachments" :quote="quote" :knowledge-scope="activeKnowledge?.name" @remove-knowledge="removeKnowledge" :show-tags="false" :show-model="false" :homepage="view==='home'" :reference-skills="referenceSkills" @choose-skill="referenceChatSkill" @knowledge="knowledgePicker=true" :generating="generating" @tag="toggleTag" @deep="deep=!deep" @model="id=>id?modelId=id:newChat()" @files="addFiles" @remove-file="id=>attachments=attachments.filter(f=>f.id!==id)" @remove-quote="quote=null" @submit="submitQuestion" @stop="stopGenerating" />
            <footer v-else class="ai-selection-bar"><span>{{ actionMode==='share'?'分享对话':'收藏对话' }}</span><small v-if="actionMode==='share'">*内容由AI生成，不能完成保障真实性，仅作参考</small><label><input type="checkbox" :checked="selectedMessages.length===activeSession.messages.filter(m=>!m.pending).length" @change="selectedMessages=$event.target.checked?activeSession.messages.filter(m=>!m.pending).map(m=>m.id):[]" />全选</label><button class="ai-outline ai-rounded" @click="actionMode=null">取消</button><button class="ai-primary ai-rounded" :disabled="!selectedMessages.length" @click="actionMode==='share'?saveShareImage():saveFavorite()">{{ actionMode==='share'?'保存为图片':'收藏对话' }}</button></footer>
            </div>
            <AiDocumentReport v-if="view==='chat' && openReport" :key="openReport.id" :run="openReport" :expanded="resultExpanded" @expand="resultExpanded=!resultExpanded" @close="openReportId=null;resultExpanded=false" />
          </template>
          <AiWorkResultPreview v-if="previewResult" :result="previewResult" :expanded="resultExpanded" @expand="resultExpanded=!resultExpanded" @close="previewResultId=null;resultExpanded=false" />
        </main>
      </TmsAiWorkbenchShell>
      <AiExpertProfile v-model="expertProfile" @summon="summonExpert" />
      <AiOverlays :type="overlay" :sessions="sessions" :agents="orderedAgents" :target="targetSession" :feedback-kind="feedbackKind" @close="overlay=null" @session="openSession" @agent="newChat" @save-order="order=>{agentOrder=order;overlay=null;notify('智能体排序已保存')}" @rename="name=>{targetSession.title=name;overlay=null;notify('名称已更新')}" @delete="deleteSession" @feedback="data=>{feedbackMessage.feedback=feedbackKind;feedbackMessage.feedbackDetail=data;overlay=null;notify('反馈已记录在本地演示数据中')}" />
      <ElDialog v-model="knowledgePicker" title="引用知识" width="520px" :append-to-body="false">
        <div class="ai-knowledge-picker">
          <p>选择本次提问使用的知识库、文件夹或文档。</p>
          <section v-for="group in knowledgeChoices" :key="group.label">
            <h3>{{ group.label }}</h3>
            <p v-if="!group.options.length">暂无可引用资料</p>
            <button v-for="option in group.options" :key="option.id" type="button" @click="selectKnowledge(option.id)">{{ option.label }}</button>
          </section>
        </div>
      </ElDialog>
      <ElDialog :model-value="!!knowledgeSource" :title="knowledgeSource?.name" width="min(620px, 92vw)" :append-to-body="false" @close="knowledgeSource=null">
        <article v-if="knowledgeSource" class="ai-knowledge-source-reader">
          <section class="ai-knowledge-source-match">
            <small>引用段落 · {{ knowledgeSource.position }}</small>
            <h3>{{ knowledgeSource.section.title }}</h3>
            <p>{{ knowledgeSource.section.content }}</p>
          </section>
          <section v-if="knowledgeSource.previous" class="ai-knowledge-source-neighbor">
            <small>上文</small>
            <h3>{{ knowledgeSource.previous.title }}</h3>
            <p>{{ knowledgeSource.previous.content }}</p>
          </section>
          <section v-if="knowledgeSource.next" class="ai-knowledge-source-neighbor">
            <small>下文</small>
            <h3>{{ knowledgeSource.next.title }}</h3>
            <p>{{ knowledgeSource.next.content }}</p>
          </section>
        </article>
        <template #footer><ElButton @click="knowledgeSource=null">返回对话</ElButton></template>
      </ElDialog>
      <AiScheduledTaskForm v-if="scheduledEdit" :config="scheduledEdit" @close="scheduledEdit=null" @save="saveScheduledTask" />
      <AiAccountPanel :section="accountSection" :activity-target="accountActivityTarget" :account="account" @navigate="openAccount" @start-task="openPromotion" />
      <div v-if="storageError" class="ai-storage-warning" role="status">本地存储不可用，技能记录仅在当前页面保留</div>
      <div v-if="toast" class="ai-toast" role="status">{{ toast }}</div>
    </div>
    <AiLearningGuide v-if="activeLesson" :key="activeLesson.id" :workspace="host" :step="activeLesson.step" @finish="finishLesson" />
  </div>
</template>

<style>
.ai-business-context{padding:8px 14px;background:#f1f4ff;color:#5267b6;font-size:13px;border-radius:8px;margin:8px 0}.ai-business-context button{border:0;background:none;color:#5267d7;cursor:pointer}
.ai-knowledge-picker{max-height:55vh;overflow:auto}
.ai-knowledge-picker h3,.ai-knowledge-source-reader h3{font-size:16px;font-weight:500;margin:12px 0 8px}
.ai-knowledge-picker button,.ai-knowledge-sources button{border:1px solid #dce3fa;background:#f7f8ff;color:#4257c8;border-radius:6px;padding:6px 8px;text-align:left}
.ai-knowledge-picker button{display:block;width:100%;margin-bottom:6px}
.ai-knowledge-picker button:hover,.ai-knowledge-sources button:hover{background:#eef0ff}
.ai-knowledge-sources{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:12px;line-height:18px;color:#59657b}
.ai-knowledge-sources button{max-width:100%;padding:2px 6px;border-radius:4px;font-size:12px;line-height:18px;overflow-wrap:anywhere}
.ai-knowledge-source-reader{max-height:50vh;overflow:auto}
.ai-knowledge-source-reader p{margin:0;font-size:14px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}
.ai-knowledge-source-reader small{color:#536583;font-size:12px}
.ai-knowledge-source-match{padding:12px 14px;border-left:3px solid #8c9de3;border-radius:4px;background:#f3f5ff}
.ai-knowledge-source-neighbor{margin-top:14px;padding:12px 14px;border-top:1px solid #e7ebf4}
</style>

<style>
.ai-expert-start{flex:1;min-height:0;overflow:auto;padding:40px 24px;max-width:760px;width:100%;box-sizing:border-box;margin:0 auto}.ai-expert-start>img{width:44px;height:44px}.ai-expert-start h1{font-size:20px;font-weight:500;margin:12px 0}.ai-expert-start p{font-size:14px;color:#59657b;line-height:1.8;margin-bottom:28px}.ai-expert-start h3{font-size:14px;font-weight:500}.ai-expert-start .ai-expert-example{font-size:14px;line-height:1.6}.ai-expert-identity{max-width:100%;font-size:12px;color:#4f60ce}
</style>
