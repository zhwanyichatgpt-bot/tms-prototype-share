<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openPrototypePage } from '../../../../../../../src/review/prototype-navigation.mjs'
import { ElDialog, ElSwitch, ElButton } from 'element-plus'
import AiExpertProfile from '../AI工作台/components/AiExpertProfile.vue'
import AssistantUpdateNotice from './AssistantUpdateNotice.vue'
import { expertAnnouncement } from '../AI工作台/expert-data.js'
import AnswerProcess from '../../../../../shared/web/ai-answer/AnswerProcess.vue'
import mascot from '../托运单管理/详情/assets/xiaojian-inspector-poses.png'
import { entryPreferences, setFloatingVisible, dismissEntryIntro, dismissAnnouncement } from './entry-state.js'
const props = defineProps({ context: Object, announcement: [Object, Array], activityNotice: Object, signInStatus: Object, updatePreview: String, workspace: Boolean, hideFloating: Boolean, autoOpen: Boolean, placement: { type: String, default: 'status' } })
const emit = defineEmits(['workspace', 'locate', 'dismiss-activity'])
const router = useRouter()
const route = useRoute()
const expertProfile = ref(false)
function summonExpert(question = '') {
 expertProfile.value = false
 openPrototypePage(router, route, 'aiWorkbench', {}, { systemHomeAi: { expertId: expertAnnouncement.expertId, draft: question } })
}
const open = ref(props.autoOpen), settings = ref(false), overview = ref(false), draft = ref(''), messages = ref([]), input = ref(null)
const contextEnabled = ref(true), skill = ref(false), preview = ref('documents')
const thread = ref(null)
const sessionId = crypto.randomUUID()
const currentContext = computed(() => contextEnabled.value && props.context?.kind !== 'home' ? props.context : null)
const contextLabel = computed(() => currentContext.value?.label || '未关联业务对象')
watch(() => props.context, () => { contextEnabled.value = true })
const welcomeNotice = {
  id: 'welcome', available: true,
  title: '你好，我是至小简',
  text: '查业务、问知识、做分析，带你认识 AI 工作台。',
  action: '认识至小简',
}
const sampleUpdates = [
  expertAnnouncement,
  { id: 'preview-knowledge', available: true, skill: 'knowledge', icon: 'agent-report.svg',
    title: '企业知识问答', text: '查制度、流程与经验，回答附资料来源。', action: '查看知识库' },
  { id: 'preview-documents', available: true, skill: 'documents', icon: 'agent-analysis.svg',
    title: '单据分析', text: '指定系统单据，生成分析报告。', action: '试用分析' },
]
// 多项预览补充同一能力的不同使用场景，便于测试大量更新的切换。
const manySampleUpdates = [
  ...sampleUpdates,
  ...[
    [0, '物流指标体系', '统一运输指标和统计口径。'],
    [0, '吨均成本拆解', '按运输环节拆解每吨成本。'],
    [0, '库存周转诊断', '从周转天数和库龄结构定位问题。'],
    [1, '制度查询', '从企业知识库查找适用制度。'],
    [1, '流程问答', '了解业务流程和办理要求。'],
    [1, '操作手册查询', '从操作手册定位相关步骤。'],
    [2, '托运单分析', '查看托运单上的关键信息。'],
    [2, '运单分析', '梳理运输进展和需要关注的事项。'],
    [2, '单据费用核对', '查看费用构成和需要复核的条目。'],
  ].map(([source, title, text], index) => ({
    ...sampleUpdates[source],
    id: 'preview-scenario-' + index,
    title,
    text,
    example: undefined,
  })),
]
const updatePreviews = {
  welcome: [welcomeNotice, ...sampleUpdates],
  single: [expertAnnouncement],
  multiple: sampleUpdates,
  many: manySampleUpdates,
}
const isUpdatePreview = computed(() => Object.hasOwn(updatePreviews, props.updatePreview))
const showWelcome = computed(() => !entryPreferences.introSeen && props.context?.kind === 'home')
const previewDismissedIds = ref([])
watch(() => props.updatePreview, () => { previewDismissedIds.value = [] })
const pendingUpdates = computed(() => {
  const configured = [props.announcement ?? expertAnnouncement].flat()
  const updates = isUpdatePreview.value
    ? updatePreviews[props.updatePreview]
    : (showWelcome.value ? [welcomeNotice, ...configured] : configured)
  const dismissed = isUpdatePreview.value ? previewDismissedIds.value : entryPreferences.dismissedAnnouncements
  const visible = updates.filter(update => update?.available && !dismissed.includes(update.id))
  return !isUpdatePreview.value && props.activityNotice ? [props.activityNotice, ...visible] : visible
})
const canShowNotice = computed(() => !overview.value && !expertProfile.value && !settings.value && !open.value && entryPreferences.floatingVisible)
function dismissUpdate(id) {
  if (id === props.activityNotice?.id) emit('dismiss-activity')
  else if (isUpdatePreview.value) previewDismissedIds.value.push(id)
  else if (id === welcomeNotice.id) dismissEntryIntro()
  else dismissAnnouncement(id)
}
function exploreUpdate(update) {
  if (update.activityTarget) {
    openPrototypePage(router, route, 'aiWorkbench', {}, { systemHomeAi: { activityTarget: update.activityTarget } })
    return
  }
  if (update.id === welcomeNotice.id) {
    goWorkspace(false, { startOnboarding: true, previewOnboarding: isUpdatePreview.value })
    return
  }
  dismissUpdate(update.id)
  if (update.expertId) expertProfile.value = true
  else if (update.skill) openPrototypePage(router, route, 'aiWorkbench', {}, { systemHomeAi: { skill: update.skill } })
}

function showChat(analysis = false) { open.value = true; skill.value = analysis; nextTick(() => input.value?.focus()) }
function goWorkspace(continueConversation = false, entryOptions = {}) {
  if (!entryOptions.previewOnboarding) dismissEntryIntro()
  const handoff = continueConversation
    ? { draft: draft.value, context: currentContext.value, skill: skill.value ? 'documents' : null,
        conversation: messages.value.length ? { id: sessionId, messages: messages.value } : null }
    : {}
  if (props.workspace) emit('workspace')
  else openPrototypePage(router, route, 'aiWorkbench', {}, { systemHomeAi: { ...handoff, ...entryOptions } })
}
function ask() {
 const question = draft.value.trim(); if (!question) return
 if (skill.value) { goWorkspace(true); return }
 const records = currentContext.value?.records || []
 let answer, reasoning, suggestions = []
 if (/优先|先处理|关注|截止|紧急/.test(question) && records.length) {
   const waiting = records.filter(r => /待审核|待确认|待确定/.test(r.snapshot?.status || ''))
   const timed = records.filter(r => r.snapshot?.status === '竞价中' && /^\d+$/.test(String(r.snapshot?.countdownDays)))
     .sort((a,b) => (Number(a.snapshot.countdownDays)*1440+Number(a.snapshot.countdownHours||0)*60+Number(a.snapshot.countdownMinutes||0))-(Number(b.snapshot.countdownDays)*1440+Number(b.snapshot.countdownHours||0)*60+Number(b.snapshot.countdownMinutes||0)))
   suggestions = [...waiting, ...timed].slice(0, 2)
   reasoning = [
     `检查「${contextLabel.value}」中的 ${records.length} 条可见单据。`,
     '筛出待审核、待确认的记录，并按剩余时间排序可比较的竞价记录。',
     suggestions.length ? '列出需要先核对的记录，供你确认处理顺序。' : '缺少可用于排序的状态或时间，暂不判断优先级。',
   ]
   answer = `已查看${contextLabel.value}。\n`
   if (waiting.length) answer += `有 ${waiting.length} 张待审核或待确认单据，建议先核对资料与处理意见。\n`
   if (timed.length) answer += `竞价中的单据按页面剩余时间由近到远列出，建议先查看：\n${timed.slice(0,2).map(r=>`${r.id}：剩余 ${r.snapshot.countdownDays} 天 ${r.snapshot.countdownHours||0} 小时；${r.snapshot.route||'路线未填写'}。`).join('\n')}\n`
   if (!suggestions.length) answer += '当前可见资料不足以排出可靠先后顺序，建议补充截止时间与待处理事项。'
   else answer += '下一步：查看对应记录，核对报价和截止时间后决定处理顺序。以上是基于可见字段的建议，不会自动修改单据。'
 } else if (records.length === 1) {
   const r=records[0]; answer=`${r.type} ${r.id}\n当前状态：${r.snapshot?.status||'未提供'}。\n${r.snapshot?.route?'运输路线：'+r.snapshot.route+'。\n':''}如需进一步梳理委托、路段和费用，可以选择单据分析；涉及成本、回款等判断时还需对应明细。`
   reasoning = [`读取已关联的${r.type} ${r.id} 的可见字段，整理状态和路线。`, '成本和回款需补充相应明细。']
 } else {
   answer = currentContext.value ? `本次关联${contextLabel.value}。你可以问“哪些单据建议先关注”，也可以先选择一张单据再继续提问。` : '请告诉我你希望查找的业务或知识范围。也可以进入完整工作台了解技能与成果。'
   reasoning = [currentContext.value ? `识别到「${contextLabel.value}」，需要进一步明确目标单据或处理问题。` : '当前没有关联业务对象，先确认要查找的业务或知识范围。']
 }
 messages.value.push({role:'user',text:question},{role:'assistant',text:answer,reasoning,suggestions}); draft.value=''
 nextTick(() => { if(thread.value) thread.value.scrollTop=thread.value.scrollHeight })
}
defineExpose({ showChat, showSettings: () => { settings.value = true } })
</script>
<template>
 <div class="zx-entry" :class="'zx-entry-' + placement">
  <button class="zx-main-entry" @click="goWorkspace()" aria-label="进入至小简工作台"><svg viewBox="334 96 334 384" aria-hidden="true"><image :href="mascot" width="1672" height="941" /></svg><strong>至小简</strong><small>AI</small></button>
  <button v-if="!workspace" class="zx-setting-trigger" aria-label="至小简入口设置" title="至小简入口设置" @click="settings=true">⚙</button>

 </div>
 <Teleport to="body">
  <div v-if="!workspace && !hideFloating" class="zx-floating" :data-business-context="context?.kind" :class="{'zx-floating-home':context?.kind==='home','zx-floating-business':placement==='business'}">
   <AssistantUpdateNotice
     v-if="canShowNotice && pendingUpdates.length"
     :updates="pendingUpdates"
     :sign-in-status="isUpdatePreview ? null : signInStatus"
     @close="pendingUpdates.forEach(update => dismissUpdate(update.id))"
     @explore="exploreUpdate"
     @sign-in="exploreUpdate({ activityTarget: 'sign-in' })"
   />
   <div v-if="entryPreferences.floatingVisible" class="zx-pet-wrap"><button class="zx-hide" aria-label="隐藏至小简悬浮入口" @click="setFloatingVisible(false);open=false">×</button><button class="zx-pet" aria-label="打开至小简轻对话" @click="open=!open"><svg viewBox="2 94 334 384" aria-hidden="true"><image :href="mascot" width="1672" height="941" /></svg><span>至小简</span></button></div>
   <section v-if="open" class="zx-chat" aria-label="至小简轻对话" @keydown.esc="open=false">
    <header><strong>至小简</strong><div><button aria-label="轻对话设置" @click="settings=true">⚙</button><button aria-label="收起至小简对话" @click="open=false">×</button></div></header>
    <div v-if="context && context.kind !== 'home'" class="zx-context"><span>{{ contextLabel }}</span><template v-if="!$slots.conversation"><button v-if="contextEnabled" @click="contextEnabled=false">取消关联</button><button v-else @click="contextEnabled=true">关联当前页面</button></template></div>
    <slot name="conversation">
    <div ref="thread" class="zx-thread"><p v-if="!messages.length">你好，有什么可以帮你？你可以直接提问，也可以选择技能。</p><article v-for="(m,i) in messages" :key="i"><AnswerProcess v-if="m.role==='assistant'" :steps="m.reasoning" /><p :class="m.role">{{ m.text }}</p><button v-for="r in m.suggestions || []" :key="r.id" class="zx-record-action" @click="emit('locate',r.id);open=false">在列表中查看 {{ r.id }}</button></article></div>
    <form @submit.prevent="ask"><button type="button" class="zx-skill" @click="skill=!skill">{{ skill ? '单据分析已选择 ×' : '选择单据分析技能' }}</button><small v-if="skill">进入工作台后确认单据并执行；一次分析一张单据。</small><div class="zx-input"><input ref="input" v-model="draft" aria-label="轻对话输入" placeholder="输入你的问题"/><button :disabled="!draft.trim()">{{ skill ? '继续' : '发送' }}</button></div></form>
    <button class="zx-expand" @click="goWorkspace(true)">进入完整工作台</button>
    </slot>
   </section>
  </div>
 </Teleport>
 <AiExpertProfile v-model="expertProfile" @summon="summonExpert" />
 <ElDialog v-model="settings" title="至小简入口设置" width="460px" append-to-body><div class="zx-setting-row"><span>显示至小简悬浮入口</span><ElSwitch :model-value="entryPreferences.floatingVisible" @update:model-value="setFloatingVisible" /></div><p class="zx-muted">隐藏后仍可从顶部或我的应用进入至小简。设置会保存在当前浏览器。</p><ElButton @click="settings=false;overview=true">重新认识至小简</ElButton><ElButton @click="settings=false;expertProfile=true">了解新专家</ElButton></ElDialog>
 <ElDialog v-model="overview" title="认识至小简" width="640px" append-to-body><p>把业务问题交给至小简，在对话中查找信息、使用技能、获得专业建议与工作成果。</p><div class="zx-overview"><article v-for="item in [{id:'documents',title:'分析一张托运单',text:'带入系统单据，梳理委托、路段与费用，查看需要核对的地方。'},{id:'knowledge',title:'查企业制度与流程',text:'指定知识资料提问，查看答案引用的来源。'},{id:'expert',title:'召唤物流专家',text:'建立物流指标，拆解吨均成本，诊断库存周转。'}]" :key="item.id"><h3>{{ item.title }}</h3><p>{{ item.text }}</p><button class="zx-preview-link" @click="preview=item.id">查看成果例子</button></article></div><section class="zx-outcome-preview" aria-label="成果预览"><h3>{{ preview==='documents'?'托运单分析 · 成果预览':preview==='knowledge'?'知识问答 · 成果预览':'物流指标 · 成果预览' }}</h3><template v-if="preview==='documents'"><p><strong>发现：</strong>单据为待执行，路段却显示 50% 进度，建议核对执行状态。</p><p><strong>判断边界：</strong>成本与到账明细不足，暂不能判断毛利和回款情况。</p><p><strong>如何使用：</strong>选择单据分析，指定系统单据，再查看报告并继续讨论。</p></template><template v-else-if="preview==='knowledge'"><p><strong>结果形式：</strong>先给出相关制度要点，再列引用资料及章节，方便回查。</p><p><strong>如何使用：</strong>选择有权访问的知识资料，描述问题；没有依据时明确说明。</p></template><template v-else><p><strong>结果形式：</strong>物流指标及统计口径、成本拆解方法和库存诊断建议。</p><p><strong>如何使用：</strong>召唤大宗运输物流专家，说明管理目标与分析范围，再补充所需资料。</p></template></section><template #footer><ElButton @click="overview=false">先了解一下</ElButton><ElButton type="primary" @click="overview=false;goWorkspace()">进入至小简</ElButton></template></ElDialog>
</template>
<style>
.zx-entry{display:flex;align-items:center;gap:4px;pointer-events:auto;position:relative;z-index:30;font:14px 'PingFang SC',sans-serif}.zx-main-entry{display:flex;align-items:center;gap:6px;height:34px;padding:0 10px 0 4px;border:1px solid #b9c6ff;border-radius:18px;color:#4257c8;background:linear-gradient(105deg,#eef3ff,#f3edff);cursor:pointer;white-space:nowrap}.zx-main-entry svg{width:26px;height:30px}.zx-main-entry small{font-size:9px;background:#6678eb;color:white;border-radius:4px;padding:2px}.zx-setting-trigger{border:0;background:transparent;color:#6c7290;cursor:pointer}.zx-floating{position:fixed;right:24px;bottom:22px;z-index:2100;font:14px/1.6 'PingFang SC',sans-serif}.zx-pet{border:0;background:none;display:grid;justify-items:center;color:#4155a0;cursor:pointer}.zx-pet svg{width:70px;height:82px}.zx-pet span{background:#fff;border:1px solid #dce3fa;padding:0 12px;border-radius:20px}.zx-hide{position:absolute;right:-4px;top:0;border:1px solid #dfe5ef;background:#fff;border-radius:50%;cursor:pointer;color:#758099}.zx-chat{position:absolute;right:0;bottom:118px;width:min(390px,calc(100vw - 32px));max-height:70vh;background:#fff;border:1px solid #dce3fa;border-radius:16px;box-shadow:0 14px 50px #283e6b26;overflow:auto}.zx-chat header{display:flex;justify-content:space-between;padding:13px 16px;background:#f3f5ff}.zx-chat header button{border:0;background:none;font-size:18px;cursor:pointer}.zx-context{display:flex;justify-content:space-between;gap:8px;font-size:12px;background:#fafbff;padding:10px 16px}.zx-context button,.zx-expand,.zx-skill{border:0;background:none;color:#5267d7;cursor:pointer}.zx-thread{padding:8px 16px;min-height:135px;max-height:240px;overflow:auto;white-space:pre-wrap}.zx-thread p{background:#f4f6fa;border-radius:10px;padding:10px}.zx-thread .user{background:#eef0ff;margin-left:32px}.zx-chat form{padding:12px 16px;border-top:1px solid #eef0f5}.zx-chat form small{display:block;color:#7c8395;font-size:11px}.zx-input{display:flex;margin-top:8px;gap:8px}.zx-input input{min-width:0;flex:1;border:1px solid #d9dfed;border-radius:8px;padding:10px}.zx-input button{border:0;border-radius:8px;background:#6174e8;color:white;cursor:pointer}.zx-input button:disabled{opacity:.5}.zx-expand{display:block;margin:0 auto 12px}.zx-overview{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.zx-overview article{background:#f5f7fd;border-radius:10px;padding:12px}.zx-overview h3{font-size:14px;margin:0 0 6px}.zx-overview p,.zx-muted{font-size:13px;color:#788198;line-height:1.7}.zx-setting-row{display:flex;justify-content:space-between;align-items:center}.zx-entry-legacy{position:absolute;left:1580px;top:10px}.zx-entry-status{position:absolute;right:160px;top:-8px}.tms-ai-workbench-chrome-fluid .zx-entry-status{position:relative;right:auto;top:-4px}.zx-entry button:focus-visible{outline:2px solid #5267d7;outline-offset:3px}
</style>

<style>
/* 只调整接入新入口的页面，给工具区留出空间。 */
.tms-web-shell:not(.tms-ai-workbench-chrome-fluid):has(.zx-entry) .tms-topbar-date{left:1270px}
.tms-web-shell:not(.tms-ai-workbench-chrome-fluid):has(.zx-entry) .tms-topbar-weather{left:1430px}
.tms-web-shell:not(.tms-ai-workbench-chrome-fluid):has(.zx-entry) .tms-topbar-weather-icon{left:1510px}
.tp-topbar:has(.zx-entry) .tp-date{left:1270px}
.tp-topbar:has(.zx-entry) .tp-weather{left:1430px}
.tp-topbar:has(.zx-entry) .tp-user{left:1510px}
</style>

<style>
.zx-entry-legacy{left:min(1580px,calc(100vw - var(--canvas-offset-left,232px) - 170px));top:20px}
@media(max-width:1900px){
.tp-topbar:has(.zx-entry) :is(.tp-date,.tp-weather,.tp-user){display:none}
.tp-topbar:has(.zx-entry) .tp-nav{left:min(854px,calc(50vw - 260px))}
}
</style>

<style>
.zx-floating-home{bottom:150px}
.zx-overview{grid-template-columns:repeat(3,minmax(0,1fr))}
.zx-preview-link,.zx-record-action{border:0;background:none;color:#5267d7;cursor:pointer;text-align:left}
.zx-record-action{display:block;padding:6px 8px;font-size:12px;margin:4px 0}
.zx-outcome-preview{padding:16px 18px;background:#f5f7fd;border:1px solid #e1e6f5;border-radius:12px;margin-top:16px}
.zx-outcome-preview h3{font-size:15px;margin:0 0 12px;color:#344465}
.zx-outcome-preview p{font-size:14px;line-height:1.8;color:#5c6880;margin:6px 0}
@media(max-height:700px){.zx-floating-home{bottom:124px}}
</style>
