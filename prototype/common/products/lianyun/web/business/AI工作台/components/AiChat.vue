<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { asset, followupQuestions } from '../mock-data.js'
import { getDocumentReport } from '../../../../../../shared/web/ai-document-analysis/document-analysis.js'
import AiIcon from './AiIcon.vue'
import { businessSuggestions } from '../business-suggestions.js'
import AiScheduledTaskProposal from './AiScheduledTaskProposal.vue'
import { anomalyTaskExample } from '../scheduled-tasks.js'
import DocumentAnalysisProgress from '../../../../../../shared/web/ai-document-analysis/DocumentAnalysisProgress.vue'
import AnswerProcess from '../../../../../../shared/web/ai-answer/AnswerProcess.vue'
const props = defineProps({ session: Object, result: Object, actionMode: String, selectedMessages: Array, generating: Boolean, speakingId: String, runs: { type: Array, default: () => [] } })
const emit = defineEmits(['action','toggle-message','question','open-run','open-result','prefill','open-source','confirm-schedule','cancel-schedule','open-scheduled-tasks'])
const runsById = computed(() => new Map(props.runs.map(run => [run.id, run])))
const reportsById = computed(() => new Map(props.runs
  .filter(run => run.documentNo && run.status === 'completed')
  .map(run => [run.id, getDocumentReport(run)])))
const lastMessage = computed(() => props.session?.messages.at(-1))
const currentFollowups = computed(() => businessSuggestions.find(item => item.id === props.session?.businessSuggestionId)?.followups || followupQuestions)
const resultName = computed(() => props.result?.resultType === 'scheduled-brief' ? '简报' : '早报')
function processSteps(message) {
  if (message.answer.reasoning?.length) return message.answer.reasoning
  if (message.answer.sources?.length) {
    return [`已保存的回答引用了${message.answer.sources.map(source => `「${source.label}」`).join('、')}。`]
  }
  if (message.documentCandidates) {
    return [message.documentCandidates.length
      ? '根据当前可见单据和输入条件查找候选，等待确认分析对象。'
      : '根据输入查找系统单据，当前没有可供分析的匹配记录。']
  }
  return ['这条历史回答未保存分析步骤。']
}
function processSummary(message) {
  const { answer, documentCandidates } = message
  if (answer.processSummary) return answer.processSummary
  if (answer.sources?.length) return `找到 ${answer.sources.length} 处资料依据`
  if (documentCandidates) return documentCandidates.length ? '等待确认分析对象' : '未找到匹配的单据'
  return answer.reasoning?.length ? undefined : '历史回答未保存步骤'
}
const documentConversation = computed(() => !!props.result || props.session?.messages.some(message => message.runId || message.documentCandidates || message.knowledgeScope))
const scheduleConversation = computed(() => props.session?.scheduleSetup || props.session?.messages.some(message => message.scheduleProposal))
function chooseDocument(record) { emit('question', '分析' + record.type + ' ' + record.id) }
const scroller = ref(null)
watch(() => [props.session?.id, props.session?.messages?.length], async ([id,len], old) => { await nextTick(); if(scroller.value) scroller.value.scrollTop = old?.[0] === id ? scroller.value.scrollHeight : 0 })
const actions = [{key:'quote',icon:'quote',label:'引用'},{key:'speak',icon:'speaker',label:'朗读'},{key:'regenerate',icon:'refresh',label:'重新生成'},{key:'copy',icon:'copy',label:'复制'},{key:'send',icon:'send',label:'发送'},{key:'share',icon:'share',label:'分享'},{key:'favorite',icon:'star',label:'收藏'},{key:'like',icon:'like',label:'喜欢'},{key:'dislike',icon:'dislike',label:'不喜欢'}]
</script>
<template>
  <div ref="scroller" class="ai-chat-scroll" :class="{ 'selection-mode': !!actionMode }">
    <div class="ai-chat-stream">
      <section v-if="session.scheduleSetup && !session.messages.length" class="ai-message-row role-assistant">
        <span class="ai-response-avatar"><img :src="asset('assistant-avatar.svg')" alt="至小简" /></span>
        <div class="ai-assistant-message ai-answer-content">
          <h2>想让至小简定期做什么？</h2>
          <p>告诉我想定期做什么、什么时候执行。我会整理成计划，等你确认后启用。</p>
          <button class="ai-document-candidate" type="button" @click="emit('prefill', anomalyTaskExample)">试试「每日异常运单简报」</button>
        </div>
      </section>
      <section v-if="result" class="ai-result-conversation-entry" aria-label="当前成果对话">
        <span class="ai-response-avatar"><img :src="asset('assistant-avatar.svg')" alt="至小简" /></span>
        <div class="ai-assistant-message ai-document-reply">
          <button class="ai-document-link" @click="emit('open-result',result.id)"><AiIcon name="file" :size="20"/><span><strong :title="result.title">{{ result.title }}</strong><small :title="result.generatedAt">{{ result.generatedAt }} · {{ result.resultLabel }}</small></span><span class="ai-document-link-action">查看成果</span></button>
          <p v-if="!session.messages.length" class="ai-result-discussion-hint">可以针对这份{{ resultName }}继续提问，讨论会保留在本次对话中。</p>
        </div>
        <div v-if="!session.messages.length" class="ai-followups"><button @click="emit('prefill','这份'+resultName+'有哪些事项需要关注？')">这份{{ resultName }}有哪些事项需要关注？</button><button @click="emit('prefill','还缺少哪些信息需要核对？')">还缺少哪些信息需要核对？</button></div>
      </section>
      <article v-for="message in session.messages" :key="message.id" class="ai-message-row" :class="[`role-${message.role}`, {'is-selected': selectedMessages.includes(message.id)}]">
        <label v-if="actionMode" class="ai-message-check"><input type="checkbox" :checked="selectedMessages.includes(message.id)" :aria-label="`选择${message.role==='user'?'问题':'回答'}`" @change="emit('toggle-message',message.id)" /></label>
        <template v-if="message.role==='user'"><div class="ai-user-message"><div v-if="message.skillName" class="ai-message-quote">技能 · {{ message.skillName }}</div><div v-if="message.knowledgeScope" class="ai-message-quote">知识范围 · {{ message.knowledgeScope }}</div><div v-if="message.quote" class="ai-message-quote">{{ message.quote }}</div><p>{{ message.text }}</p><small v-if="message.files?.length">{{ message.files.map(f=>f.name).join('、') }}</small></div></template>
        <template v-else><span class="ai-response-avatar"><img :src="asset('assistant-avatar.svg')" alt="至小简" /></span><div class="ai-assistant-message">
          <div v-if="message.pending" class="ai-generating" role="status"><span />正在思考并整理回答…</div>
          <AiScheduledTaskProposal
            v-else-if="message.scheduleProposal"
            :proposal="message.scheduleProposal"
            :read-only="!!actionMode"
            @confirm="emit('confirm-schedule', $event)"
            @cancel="emit('cancel-schedule', $event)"
            @open="emit('open-scheduled-tasks')"
          />
          <template v-else-if="message.runId && runsById.has(message.runId)">
            <div v-for="run in [runsById.get(message.runId)]" :key="run.id">
              <template v-if="reportsById.has(run.id)">
                <div v-for="report in [reportsById.get(run.id)]" :key="run.id" class="ai-document-reply">
                  <DocumentAnalysisProgress v-if="!actionMode" :run="run" :steps="report.process" />
                  <h2>{{ report.summary }}</h2>
                  <ul v-if="report.findings.length">
                    <li v-for="finding in report.findings" :key="finding.label">
                      <strong>{{ finding.label }}</strong>
                      <span>{{ finding.text }}</span>
                    </li>
                  </ul>
                  <button v-if="!actionMode" class="ai-document-link" @click="emit('open-run', run.id)">
                    <AiIcon name="file" :size="20" />
                    <span><strong>{{ run.title }}</strong><small>{{ run.documentNo }}</small></span>
                    <span class="ai-document-link-action">查看报告</span>
                  </button>
                </div>
              </template>
              <DocumentAnalysisProgress v-else :run="run" />
            </div>
          </template>
          <div v-else-if="message.documentCandidates" class="ai-document-result">
            <AnswerProcess v-if="!actionMode" :steps="processSteps(message)" :summary="processSummary(message)" />
            <p>{{ message.answer.title }}</p>
            <template v-if="message === lastMessage && !actionMode">
              <button v-for="record in message.documentCandidates" :key="record.id" class="ai-document-candidate" @click="chooseDocument(record)">{{ record.type }} {{ record.id }} · {{ record.label }}</button>
            </template>
          </div>
          <p v-else-if="message.stopped"  class="ai-stopped">已停止生成，你可以继续提问或重新生成。</p>
          <p v-else-if="message.supplementPrompt" class="ais-message">{{ message.answer.title }}</p>
          <template v-else>
            <AnswerProcess v-if="!actionMode" :steps="processSteps(message)" :summary="processSummary(message)" />
            <div class="ai-answer-content"><h2>{{ message.answer.title }}</h2><section v-for="section in message.answer.sections" :key="section.heading"><h3>{{ section.heading }}</h3><p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p></section></div>
            <div v-if="message.answer.sources?.length && !actionMode" class="ai-knowledge-sources">
              <span>资料出处</span>
              <button v-for="source in message.answer.sources" :key="source.label" type="button" @click="emit('open-source', source)">{{ source.label }}</button>
            </div>
            <div v-if="!actionMode && !session.supplement" class="ai-response-actions"><button v-for="action in actions" :key="action.key" :title="action.key==='send'?'发送到输入框':action.label" :aria-label="action.label" :class="{selected: message.feedback===action.key || (action.key==='speak' && speakingId===message.id)}" @click="emit('action',action.key,message)"><AiIcon :name="action.icon" :size="20" /><span v-if="['send','share','favorite'].includes(action.key)">{{ action.label }}</span></button></div>
          </template>
        </div></template>
      </article>
      <div v-if="!actionMode && !generating && !documentConversation && !scheduleConversation && !session?.expertId && !session?.supplement" class="ai-followups"><button v-for="question in currentFollowups" :key="question" @click="emit('question',question)">{{ question }}</button></div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ai-result-conversation-entry{position:relative;margin-bottom:24px}
.ai-result-conversation-entry .ai-document-link{margin:0}
.ai-result-conversation-entry .ai-document-link>span:not(.ai-document-link-action){min-width:0;flex:1}
.ai-result-conversation-entry .ai-document-link strong,.ai-result-conversation-entry .ai-document-link small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ai-result-discussion-hint{margin-top:16px;font-size:14px;line-height:24px;color:#999}
.ai-result-conversation-entry .ai-followups button{font-size:14px;padding:10px 16px}
</style>
