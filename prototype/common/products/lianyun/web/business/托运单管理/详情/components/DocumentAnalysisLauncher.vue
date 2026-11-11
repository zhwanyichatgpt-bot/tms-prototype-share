<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import mascotPoses from '../assets/xiaojian-inspector-poses.png'
import DocumentAnalysisProgress from '../../../../../../../shared/web/ai-document-analysis/DocumentAnalysisProgress.vue'
import AnswerProcess from '../../../../../../../shared/web/ai-answer/AnswerProcess.vue'
import {
  captureConsignmentSnapshot, createDocumentAnalysis, documentAnalysisStage, documentRunDuration, getDocumentReport,
  isDocumentAnalysisRequest, resolveDocument, saveFloatingAnalysis,
} from '../../../../../../../shared/web/ai-document-analysis/document-analysis.js'

const props = defineProps({ document: { type: Object, required: true } })
const documentNo = computed(() => props.document.id)
const documentStatus = computed(() => props.document.statusText)
const router = useRouter()
const open = ref(false)
const draft = ref('')
const input = ref(null)
const launcher = ref(null)
const thread = ref(null)
const messages = ref([])
const runs = ref({})
const skillMenu = ref(false)
const skillActive = ref(false)
const notice = ref('')
const activeRun = computed(() => Object.values(runs.value).find(run => run.status === 'running'))
const busy = computed(() => Boolean(activeRun.value))
const reportReady = computed(() => runs.value[messages.value.at(-1)?.runId]?.status === 'completed')
// 素材为同一张透明姿势图。取景框以原图坐标定位，统一脚底基线。
const petFrames = {
  idle: '2 94 334 384',
  greet: '334 96 334 384',
  search: '1338 497 334 384',
  review: '664 99 334 384',
  compose: '350 493 334 384',
  ready: '1014 497 334 384',
}
const analysisPoses = ['search', 'review', 'compose']
const petPose = computed(() => {
  if (activeRun.value) return analysisPoses[activeRun.value.stage] || 'search'
  if (reportReady.value) return 'ready'
  return open.value ? 'greet' : 'idle'
})
const record = computed(() => ({
  id: documentNo.value,
  type: '托运单',
  label: '当前页面',
  snapshot: captureConsignmentSnapshot(props.document),
}))
const sessionId = crypto.randomUUID()
let timer

watch([() => messages.value.length, busy], async () => {
  await nextTick()
  if (thread.value) thread.value.scrollTop = thread.value.scrollHeight
})
onUnmounted(() => window.clearInterval(timer))

async function show() {
  open.value = true
  await nextTick()
  input.value?.focus()
}
async function close() {
  open.value = false
  skillMenu.value = false
  await nextTick()
  launcher.value?.focus()
}
async function selectSkill() {
  skillMenu.value = false
  skillActive.value = true
  await nextTick()
  input.value?.focus()
}
function makeResponse(title, reasoning = []) {
  return { id: crypto.randomUUID(), role: 'assistant', answer: { title, sections: [], reasoning } }
}
function answerQuestion(question) {
  if (/状态|进度|到哪|开始执行/.test(question)) {
    return makeResponse(`当前页面显示，托运单 ${documentNo.value} 的状态为「${documentStatus.value}」。`, ['读取当前托运单的状态字段。'])
  }
  if (/单号|编号/.test(question)) return makeResponse(`当前托运单号是 ${documentNo.value}。`, ['读取当前托运单的编号。'])
  return makeResponse('你可以问我当前托运单的单号、状态，也可以告诉我你想完成什么。', ['已关联当前托运单，需要明确要查询的字段或要执行的分析。'])
}
function submit(question = draft.value.trim(), useSkill = skillActive.value) {
  if (!question || busy.value) return
  notice.value = ''
  const user = { id: crypto.randomUUID(), role: 'user', text: question, files: [] }
  if (!useSkill && !isDocumentAnalysisRequest(question)) {
    messages.value.push(user, answerQuestion(question))
    draft.value = ''
    return
  }
  const resolution = resolveDocument(question, record.value)
  if (!resolution.record) {
    const reasoning = [resolution.candidates?.length ? '根据输入查找候选单据，等待你确认分析对象。' : '根据输入查找系统单据，当前没有可供分析的匹配记录。']
    messages.value.push(user, { ...makeResponse(resolution.message, reasoning), documentCandidates: resolution.candidates })
    draft.value = ''
    return
  }
  const run = createDocumentAnalysis(resolution.record, question, sessionId)
  const response = { ...makeResponse(run.title), runId: run.id }
  try {
    saveFloatingAnalysis(run, [...messages.value, user, response])
  } catch {
    notice.value = '本地记录保存失败。请稍后重试。'
    return
  }
  runs.value[run.id] = run
  messages.value.push(user, response)
  draft.value = ''
  skillActive.value = false
  timer = window.setInterval(() => {
    const task = runs.value[run.id]
    const elapsed = Date.now() - task.startedAt
    task.stage = documentAnalysisStage(elapsed)
    if (elapsed >= documentRunDuration) {
      task.status = 'completed'
      task.completedAt = Date.now()
      window.clearInterval(timer)
    }
  }, 300)
}
function openReport(run) {
  try {
    saveFloatingAnalysis(run, messages.value)
  } catch {
    notice.value = '本地记录保存失败。请稍后重试。'
    return
  }
  router.push({ name: 'aiWorkbench', query: { analysisReport: run.id } })
}
</script>

<template>
  <Teleport to="body">
    <div class="document-assistant">
      <button
        ref="launcher"
        class="document-launcher"
        :class="['pet-pose-' + petPose, { 'is-running': busy, 'is-ready': reportReady }]"
        type="button"
        :aria-label="open ? '收起至小简' : '打开至小简'"
        :aria-expanded="open"
        :aria-controls="open ? 'waybill-assistant-dialog' : undefined"
        @click="open ? close() : show()"
      >
        <span class="document-pet" aria-hidden="true">
          <svg class="document-pet-sprite" :viewBox="petFrames[petPose]" width="75" height="86" focusable="false">
            <image :href="mascotPoses" width="1672" height="941" preserveAspectRatio="none" />
          </svg>
        </span>
        <span class="document-pet-label">
          <span v-if="busy" class="document-pet-spinner" aria-hidden="true" />
          <svg v-else-if="reportReady" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 2h5l3 3v9H4zM9 2v3h3M6 8h4M6 11h4" />
          </svg>
          {{ busy ? '分析中' : reportReady ? '报告已生成' : '至小简' }}
        </span>
      </button>
      <Transition name="document-dialog">
        <aside v-if="open" id="waybill-assistant-dialog" class="document-dialog" aria-label="至小简对话" @keydown.esc.stop="close">
          <header>
            <div class="document-dialog-heading">
              <strong>至小简</strong>
              <div class="document-context"><span>当前单据</span><b>托运单 {{ documentNo }}</b></div>
            </div>
            <button type="button" class="document-close" aria-label="关闭至小简" @click="close">×</button>
          </header>
          <div ref="thread" class="document-thread" aria-live="polite">
            <p v-if="!messages.length" class="document-answer">你好，有什么可以帮你？</p>
            <article v-for="message in messages" :key="message.id">
              <p v-if="message.role === 'user'" class="document-request">{{ message.text }}</p>
              <template v-else-if="message.runId">
                <div v-for="run in [runs[message.runId]]" :key="run.id">
                  <DocumentAnalysisProgress :run="run" />
                  <div v-if="run.status === 'completed'" class="document-result">
                    <strong>{{ run.title }}</strong>
                    <small>{{ run.documentType }} {{ run.documentNo }}</small>
                    <p>{{ getDocumentReport(run).summary }}</p>
                    <button type="button" @click="openReport(run)">查看报告 →</button>
                  </div>
                </div>
              </template>
              <template v-else>
                <AnswerProcess :steps="message.answer.reasoning" />
                <p class="document-answer">{{ message.answer.title }}</p>
                <template v-if="message === messages.at(-1)">
                  <button v-for="item in message.documentCandidates" :key="item.id" type="button" class="document-candidate" @click="submit('分析' + item.type + ' ' + item.id, true)">{{ item.type }} {{ item.id }} · {{ item.label }}</button>
                </template>
              </template>
            </article>
            <p v-if="notice" class="document-notice" role="status">{{ notice }}</p>
          </div>
          <form @submit.prevent="submit()">
            <div class="document-input-row">
              <input ref="input" v-model="draft" aria-label="向至小简提问" :placeholder="skillActive ? '告诉至小简要分析哪张单据' : '输入你想了解的问题'" />
              <button type="submit" :disabled="!draft.trim() || busy">发送</button>
            </div>
            <div class="document-tools">
              <button v-if="skillActive" type="button" aria-label="移除单据分析技能" @click="skillActive=false">单据分析 ×</button>
              <template v-else>
                <button type="button" :aria-expanded="skillMenu" @click="skillMenu=!skillMenu">选择技能</button>
                <button v-if="skillMenu" type="button" class="document-skill-menu" @click="selectSkill">单据分析</button>
              </template>
            </div>
          </form>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.document-assistant {
  --launcher-width: 96px;
  --dialog-border: #dfe6f3;
  position: fixed;
  right: 24px;
  bottom: 20px;
  z-index: 2100;
  font: 14px/1.6 'PingFang SC', sans-serif;
}

.document-assistant, .document-assistant * { box-sizing: border-box; }
.document-launcher {
  display: grid;
  justify-items: center;
  gap: 4px;
  width: var(--launcher-width);
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: none;
  color: #274580;
  cursor: pointer;
}

.document-launcher:focus-visible { outline: 2px solid #4062ff; outline-offset: 4px; }
.document-pet { position: relative; display: grid; place-items: end center; width: 82px; height: 86px; }
.document-pet::before {
  position: absolute;
  inset: auto 11px 1px;
  height: 12px;
  border-radius: 50%;
  background: #233a7442;
  filter: blur(5px);
  content: '';
}
.document-pet-sprite {
  position: relative;
  display: block;
  overflow: hidden;
  transform-origin: 50% 90%;
  filter: drop-shadow(0 3px 4px #20385d2b);
  transition: transform .18s ease;
}
.pet-pose-idle:hover .document-pet-sprite { transform: translateY(-3px) rotate(-4deg); }
.document-pet-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 56px;
  max-width: 100%;
  padding: 2px 7px;
  border: 1px solid #dce6fb;
  border-radius: 14px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 19px;
  white-space: nowrap;
  box-shadow: 0 3px 8px #182c4d13;
}
.is-running .document-pet-label { background: #eef3ff; color: #365cd3; }
.pet-pose-greet .document-pet-sprite { animation: document-pet-greet .48s ease-out; }
.pet-pose-search .document-pet-sprite { animation: document-pet-search .9s ease-in-out infinite; }
.pet-pose-review .document-pet-sprite { animation: document-pet-review 1s ease-in-out infinite; }
.pet-pose-compose .document-pet-sprite { animation: document-pet-compose .62s ease-in-out; }
.pet-pose-ready .document-pet-sprite { animation: document-pet-ready .64s ease-out; }
.is-ready .document-pet-label { color: #284f96; }
.document-pet-spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid #b9cbf8;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: document-pet-spin .85s linear infinite;
}

@keyframes document-pet-greet { 45% { transform: translateY(-4px) rotate(-6deg); } }
@keyframes document-pet-search { 50% { transform: translateX(-4px) rotate(-4deg); } }
@keyframes document-pet-review { 50% { transform: translateX(3px) rotate(3deg); } }
@keyframes document-pet-compose { 45% { transform: scaleY(.94) rotate(-2deg); } }
@keyframes document-pet-ready {
  35% { transform: translateY(-8px) rotate(3deg); }
  72% { transform: translateY(-3px) rotate(-2deg); }
}
@keyframes document-pet-spin { to { transform: rotate(360deg); } }

.document-dialog {
  position: absolute;
  right: 0;
  bottom: calc(100% + 16px);
  display: flex;
  flex-direction: column;
  width: min(408px, calc(100vw - 48px));
  max-height: calc(100dvh - 164px);
  border: 1px solid var(--dialog-border);
  border-radius: 18px;
  background: #fff;
  color: #26344a;
  box-shadow: 0 12px 36px #202d5326;
  transform-origin: calc(100% - var(--launcher-width) / 2) bottom;
}
.document-dialog::after {
  position: absolute;
  right: calc(var(--launcher-width) / 2 - 7px);
  bottom: -8px;
  width: 14px;
  height: 14px;
  box-sizing: border-box;
  border-right: 1px solid var(--dialog-border);
  border-bottom: 1px solid var(--dialog-border);
  border-radius: 0 0 3px;
  background: #fff;
  transform: rotate(45deg);
  pointer-events: none;
  content: '';
}
.document-dialog-enter-active, .document-dialog-leave-active { transition: opacity .16s ease, transform .16s ease; }
.document-dialog-enter-from, .document-dialog-leave-to { opacity: 0; transform: translateY(6px) scale(.98); }

@media (prefers-reduced-motion: reduce) {
  .document-launcher .document-pet-sprite, .document-pet-spinner { animation: none; transition: none; transform: none; }
  .document-dialog-enter-active, .document-dialog-leave-active { transition: none; }
  .document-dialog-enter-from, .document-dialog-leave-to { opacity: 1; transform: none; }
}

.document-dialog header {
  display: flex;
  flex: none;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #ecf0f8;
  border-radius: 17px 17px 0 0;
  background: linear-gradient(110deg, #f1f5ff, #fafbff);
}
.document-dialog-heading { min-width: 0; }
.document-dialog-heading > strong { display: block; font-size: 16px; }
.document-dialog button { border: 0; background: transparent; color: #365cd3; font: inherit; cursor: pointer; }
.document-dialog .document-close {
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  color: #536788;
  font-size: 21px;
  line-height: 1;
}
.document-close:hover { background: #e8eefc; }
.document-context { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 7px; margin-top: 4px; color: #536788; font-size: 12px; }
.document-context span { padding: 0 5px; border-radius: 4px; background: #e7eeff; color: #405d97; white-space: nowrap; }
.document-context b { overflow-wrap: anywhere; font-weight: 500; }

.document-thread { min-height: 0; max-height: 45vh; padding: 14px 16px; overflow: hidden auto; scrollbar-width: thin; overflow-wrap: anywhere; }
.document-thread p { margin: 0 0 8px; }
.document-thread article + article { margin-top: 10px; }
.document-thread .document-answer, .document-thread .document-request { width: fit-content; padding: 8px 10px; border-radius: 10px; }
.document-thread .document-answer { background: #f3f5f9; }
.document-thread .document-request { margin-left: auto; max-width: 90%; background: #edf2ff; }
.document-thread > .document-answer:first-child { margin-bottom: 20px; }
.document-dialog .document-candidate, .document-result {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 9px 11px;
  border: 1px solid #e5ebf7;
  border-radius: 10px;
  background: #f7f9fe;
  text-align: left;
}
.document-result small { display: block; margin: 3px 0 6px; color: #657590; font-size: 12px; }
.document-result button { padding: 0; }
.document-notice { color: #9b592b; font-size: 12px; }

.document-dialog form { display: grid; flex: none; gap: 8px; padding: 12px 16px 14px; border-top: 1px solid #ecf0f8; }
.document-input-row, .document-tools { display: flex; align-items: center; gap: 8px; }
.document-dialog input { min-width: 0; width: 100%; flex: 1; padding: 7px 10px; border: 1px solid #dfe6f3; border-radius: 8px; color: inherit; font: inherit; }
.document-dialog input:focus { border-color: #6685f4; outline: 1px solid #6685f4; }
.document-dialog form button[type="submit"] { flex: none; padding: 7px 13px; border-radius: 8px; background: #4062ef; color: #fff; }
.document-tools { position: relative; min-height: 25px; font-size: 12px; }
.document-tools > button { padding: 2px 8px; border: 1px solid #dfe7fb; border-radius: 6px; }
.document-tools .document-skill-menu { position: absolute; bottom: 100%; left: 0; padding: 5px 10px; background: #fff; box-shadow: 0 4px 16px #202d5320; white-space: nowrap; }
.document-dialog button:disabled { opacity: .45; cursor: default; }
</style>
