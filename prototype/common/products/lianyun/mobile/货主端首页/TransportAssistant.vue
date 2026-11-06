<template>
  <section ref="shellElement" class="lya-shell" :class="{ 'lya-start-shell': isLanding, 'lya-result-shell': view === 'results', 'lya-overview-shell': view === 'overview', 'lya-provider-shell':view==='providers', 'lya-inquiry-shell':['consignment','done'].includes(view) }" aria-label="运输助手完整流程">
    <AssistantStartPage v-show="isLanding" :sessions="savedSessions" @message="submitText" @restore="restoreSession" @restart="reset" @overlay="overlayOpen = $event" @open-select="openBillSelect" @analyse="openBillAnalysis" @history-select="onHistoryRecord" @close="closeAi"/>
    <AiBillSelectPage v-if="aiSubpage === 'select'" :bills="aiBills" object-label="托运单" :default-range="aiDefaultRange" @back="backToAiHome" @analyse="openBillAnalysis"/>
    <AiBillAnalysisPage v-else-if="aiSubpage === 'analysis'" :bills="analysisBills" :sessions="savedSessions" :groups="aiHistoryGroups" object-label="托运单" @close="closeAi" @new-task="newAiTask" @history-select="onHistoryRecord"/>
    <AssistantWorkbenchBar v-if="!aiSubpage && !isLanding && !['results','overview','providers','consignment','done'].includes(view)" :title="titles[view]" @back="goBack" @restart="resetOpen = true"/>
    <main v-show="!isLanding && !aiSubpage" ref="scrollArea" class="lya-body" :class="{ 'lya-chat-body': view === 'chat', 'lya-results-layout': view === 'results', 'lya-overview-layout': view === 'overview', 'lyf-flow-layout':['providers','consignment','done'].includes(view) }">
      <template v-if="view === 'planning'">
        <section class="lya-planning" aria-label="运输方案查询进度" aria-busy="true">
          <div class="lya-planning-avatar"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt="小简"/></div>
          <h2>正在为你整理运输方案</h2>
          <p class="lya-planning-route">{{ draft.origin }}<span>→</span>{{ draft.destination }}</p>
          <ol class="lya-progress-list"><li v-for="(step,index) in planningSteps" :key="step.title" :class="{done:index < planningStep,current:index === planningStep}">
            <span class="lya-progress-mark"><van-icon v-if="index < planningStep" name="success"/><i v-else-if="index === planningStep" class="lya-progress-spinner"/><i v-else/></span>
            <div><strong>{{ step.title }}</strong><p v-if="index <= planningStep">{{ step.detail }}</p></div>
          </li></ol>
          <p class="lya-planning-status" role="status" aria-live="polite">{{ planningSteps[planningStep].title }}…</p>
          <button class="lya-link" @click="cancelPlanning">取消查询</button>
        </section>
      </template>
      <template v-else-if="view === 'chat'">
        <div v-for="(message,index) in messages" :key="index" class="lya-message" :class="message.role">
          <div v-if="message.role === 'assistant'" class="lya-speaker"><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt=""/>小简</div>
          <p>{{ message.text }}</p>
        </div>
        <section v-if="tracking" class="lya-card lya-tracking">
          <span class="lya-eyebrow">运输节点记录</span><h3>{{ tracking.number }}</h3><p>{{ tracking.route }} · {{ tracking.status }}</p>
          <ol><li v-for="event in tracking.events" :key="event.time"><b>{{ event.title || event.status }}</b><small>{{ event.time }}</small><p>{{ event.description || event.detail }}</p></li></ol>
          <small>记录更新时间：{{ tracking.updated }}；节点记录不代表实时定位。</small>
        </section>
        <section v-if="needsConfirmation" class="lya-card lya-confirm">
          <div class="lya-heading"><h3>选两个地点，直接查</h3><span>货品选填</span></div>
          <p v-if="ambiguous" class="lya-secondary">“{{ draft.destination }}”是一条方向，请在海外地区选择具体城市或节点。</p>
          <RouteQueryForm :mode="mode" @update:mode="changeMode" ref="editForm" :teleport="shellElement" :loading="loading" @query="quickQuery"/>
          <button v-if="schemes.length" class="lya-link" @click="cancelEdit">取消修改，回到原方案</button>
        </section>
        <button v-if="schemes.length && !needsConfirmation" class="lya-result-reopen lya-card" @click="navigate('overview')"><span><strong>已整理 {{ schemes.length }} 个运输方案</strong><small>{{ confirmed.origin }} → {{ confirmed.destination }}</small></span><van-icon name="arrow"/></button>
        <div v-if="!needsConfirmation && messages.length" class="lya-suggestions"><button v-for="question in contextualQuestions" :key="question" @click="submitText(question)">{{ question }}</button></div>
      </template>

      <template v-else-if="view === 'overview'">
        <TransportSchemeOverview v-if="selected" :schemes="orderedSchemes" :selected-id="selectedId" :recommended-id="analysis.recommendedId" :demand="confirmed" :price-text="resultPrice" @select="selectScheme" @open="openSchemeDetail" @edit="editDemand" @chat="navigate('chat')" @question="submitText" @close="exitHomeQuery"/>
      </template>

      <template v-else-if="view === 'results'">
        <TransportSchemeDetail v-if="selected" :scheme="selected" :schemes="orderedSchemes" :demand="confirmed" :recommended-id="analysis.recommendedId" :price-text="resultPrice(selected)" :explanation="schemeRecommendation(schemes,selected.id)" :focused-segment="resultFocusedSegment" @select="selectScheme" @edit="editDemand" @segment="focusResultSegment" @close="exitHomeQuery" @overview="backToOverview">
          <template #actions><button class="lyd-primary" @click="showProviders">选择承运商</button></template>
        </TransportSchemeDetail>
      </template>

      <template v-else-if="view === 'providers'">
        <AssistantCarrierSelection :providers="matchedProviders" :selected-id="chosenProviderId" :back-label="history.at(-1)==='consignment' ? '返回填写托运' : '返回方案详情'" @select="selectProvider" @reviews="reviewProvider=$event" @confirm="confirmCarrierSelection" @back="goBack" @close="exitHomeQuery"/>
      </template>

      <template v-else-if="view === 'map'">
        <div class="lya-heading"><div><h2>{{ selected.name }}</h2><p>{{ confirmed.origin }} → {{ confirmed.destination }}</p></div></div>
        <AssistantRouteMap :scheme="selected" :selected="selectedSegment" expanded @select="selectedSegment = $event" @expand="goBack"/>
        <div class="lya-route-facts"><span>{{ selected.duration }}</span><span>约 {{ selected.km.toLocaleString() }} km</span><span>{{ selected.delivery }}</span></div>
        <p class="lya-secondary">{{ selected.segments[selectedSegment].from }} → {{ selected.segments[selectedSegment].to }}</p>
      </template>

      <template v-else-if="view === 'consignment'">
        <AssistantConsignmentFlow v-if="selected && consignmentDraft" v-model:form="consignmentDraft" :scheme="selected" :confirmed="confirmed" :provider="chosenProvider" :reference-price="resultPrice(selected)" @providers="showProviders" @back="backToProviders" @close="exitHomeQuery" @submitted="onConsignmentSubmitted" @open-record="openConsignmentRecord"/>
      </template>

      <template v-else-if="view === 'done'">
        <AssistantConsignmentResult v-if="consignmentRecord" :record="consignmentRecord" :back-label="consignmentDraft?'返回填写托运':'返回方案详情'" @back="backFromConsignmentResult" @close="exitHomeQuery" @restart="restartConsignment"/>
      </template>

      <template v-else-if="view === 'empty'">
        <div class="lya-result-modes" aria-label="结果运输方式"><button v-for="option in transportModes" :key="option.key" :class="{active:mode === option.key}" :aria-pressed="mode === option.key" @click="changeMode(option.key)">{{ option.label }}</button></div>
        <section class="lya-card lya-empty"><van-icon name="search"/><h2>暂未找到符合条件的服务</h2><p>{{ noMatchReason }}</p><p>{{ confirmed.origin }} → {{ confirmed.destination }}<br>{{ demandSummary }}</p><button class="lya-primary" @click="editDemand">修改条件继续查</button><button class="lya-outline" @click="retainedDemand = {...confirmed}; retained = true">{{ retained ? '需求已保存在本地会话' : '保留需求，待人工确认' }}</button><p v-if="retained">已保留需求草稿；尚未分配客服或发送咨询。</p></section>
        <section class="lya-card"><h3>其他查询</h3><button v-for="example in assistantExamples.slice(0,2)" :key="example" class="lya-example-button" @click="submitText(example)">{{ example }}</button></section>
      </template>
    </main>

    <form v-if="view === 'chat' && !isLanding && !aiSubpage" class="lya-composer" @submit.prevent="send"><textarea v-model="input" aria-label="向运输助手发送消息" placeholder="说说装卸地点、货物，或继续追问…" rows="2" maxlength="500"/><div><span>可继续追问当前路线、费用与时效</span><button type="submit" :disabled="!input.trim() || loading" aria-label="发送消息"><van-icon name="arrow-up"/></button></div></form>
    <footer v-else-if="view==='map'" class="lya-footer"><button class="lya-outline" @click="navigate('chat')">继续问小简</button><button class="lya-primary" @click="chosenProviderId ? confirmCarrierSelection() : showProviders()">{{ chosenProviderId ? '填写指定托运' : '选择承运商' }}</button></footer>
    <AssistantDemandEditSheet ref="resultEditForm" v-model:show="editOpen" v-model:mode="editMode" :teleport="shellElement" :error="error" @query="saveEditedDemand"/>
    <div v-if="reviewProvider || resetOpen" class="lya-modal-backdrop" @click.self="reviewProvider = null; resetOpen = false">
      <section v-if="reviewProvider" role="dialog" aria-modal="true" aria-label="企业服务评价" class="lya-modal lya-card"><div class="lya-heading"><h3>企业服务评价</h3><button aria-label="关闭评价" @click="reviewProvider = null"><van-icon name="cross"/></button></div><h3>{{ reviewProvider.name }}</h3><p>{{ reviewProvider.score === null ? '暂无评价' : reviewProvider.score+' / 5 · '+reviewProvider.reviewCount+'条评价' }}</p><p v-if="reviewProvider.reviewCount < 5 && reviewProvider.reviewCount > 0" class="lya-error">评价数量较少，评分仅作参考。</p><blockquote v-if="reviewProvider.review">{{ reviewProvider.review }}</blockquote><small>企业评分仅供参考，不等于本单履约保证。</small></section>
      <section v-else role="dialog" aria-modal="true" aria-label="开始新会话确认" class="lya-modal lya-card"><h3>开始新会话？</h3><p>当前消息、方案选择和未保存的托运信息将清空。返回首页不会清空会话。</p><button class="lya-primary" @click="reset">清空并开始</button><button class="lya-outline" @click="resetOpen = false">保留当前会话</button></section>
    </div>
  </section>
</template>

<script setup>
import AssistantWorkbenchBar from './AssistantWorkbenchBar.vue'
import AssistantStartPage from './AssistantStartPage.vue'
import AiBillSelectPage from '../../../../shared/mobile/ai/AiBillSelectPage.vue'
import AiBillAnalysisPage from '../../../../shared/mobile/ai/AiBillAnalysisPage.vue'
import { aiBills, aiHistoryGroups } from './ai-data.js'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AssistantRouteMap from './AssistantRouteMap.vue'
import TransportSchemeDetail from './TransportSchemeDetail.vue'
import TransportSchemeOverview from './TransportSchemeOverview.vue'
import AssistantCarrierSelection from './AssistantCarrierSelection.vue'
import AssistantConsignmentFlow from './AssistantConsignmentFlow.vue'
import AssistantConsignmentResult from './AssistantConsignmentResult.vue'
import { clone,createConsignment } from './assistant-consignment-model.js'
import { consignmentStore } from './assistant-consignment-store.js'
import AssistantDemandEditSheet from './AssistantDemandEditSheet.vue'
import './assistant-flow-design.css'
import RouteQueryForm from './RouteQueryForm.vue'
import { assistantExamples, assistantProviders, blankDemand, modeColors, modeLabels, transportModes } from './assistant-data.js'
import { answerQuestion, buildSchemes, demandIssue, durationLabel, money, parseRequest } from './assistant-engine.js'
import { trackingExamples } from './mock-data.js'
import { extraProviders } from './assistant-scenarios.js'
import { resolveLocation } from './assistant-locations.js'
import { analyseSchemes, schemeRecommendation } from './assistant-analysis.js'
import './assistant.css'
import '../../../../shared/mobile/ai/ai-pages.css'
const props = defineProps({mode:{default:'all'}})
const emit = defineEmits(['close','update:mode','demand-change'])
const shellElement = ref(null), editForm = ref(null)
const resultFocusedSegment = ref(-1)
const editOpen = ref(false), resultEditForm = ref(null), editDraft = ref(blankDemand()), editMode = ref('all')
const planningStep = ref(0), planningResult = ref(null)
const entrySource = ref('assistant')
const view = ref('chat'), history = ref([]), input = ref(''), messages = ref([]), draft = ref(blankDemand()), confirmed = ref(blankDemand())
const savedSessions = ref([]), overlayOpen = ref(false)
const aiSubpage = ref(''), analysisBills = ref([])
const aiDefaultRange = { start: '2026-10-01', end: '2026-10-31' }
const isLanding = computed(() => view.value === 'chat' && messages.value.length === 0 && !aiSubpage.value)
const needsConfirmation = ref(false), error = ref(''), schemes = ref([]), selectedId = ref(''), selectedSegment = ref(0), scrollArea = ref(null), loading = ref(false)
const tracking = ref(null), noMatchReason = ref(''), chosenProviderId = ref(''), reviewProvider = ref(null), resetOpen = ref(false)
const consignmentDraft=ref(null),consignmentRecord=ref(null),retained=ref(false),retainedDemand=ref(null)
let generation = 0, timer
const titles = { chat:'运输助手', planning:'运输助手', overview:'运输方案', results:'方案详情', providers:'选择承运商', map:'路线地图', consignment:'指定托运', done:'托运详情', empty:'查询结果' }
const selected = computed(() => schemes.value.find(item => item.id === selectedId.value) || schemes.value[0])
const ambiguous = computed(() => /^(中欧|欧洲|中缅|缅甸|东南亚)$/.test(draft.value.destination.trim()))
const demandSummary = computed(() => `${confirmed.value.goodsProvided ? confirmed.value.goodsDescription || confirmed.value.goods : '货品未填写'} · ${confirmed.value.transportMode === 'all' ? '不限运输方式' : modeLabels[confirmed.value.transportMode]}`)
const matchedProviders = computed(() => [...assistantProviders,...extraProviders].filter(provider => selected.value?.providerIds.includes(provider.id)))
const chosenProvider=computed(()=>matchedProviders.value.find(provider=>provider.id===chosenProviderId.value))

const analysis = computed(() => analyseSchemes(schemes.value,confirmed.value.priority))
// 推荐置前；排序只依赖推荐结果，用户选中其他方案不会改变卡片位置。
const orderedSchemes = computed(() => [...schemes.value.filter(item => item.id === analysis.value.recommendedId), ...schemes.value.filter(item => item.id !== analysis.value.recommendedId)])
function referenceTotal(range) { return range[0] >= 10000 ? '¥'+range.map(value => (value/10000).toFixed(2)).join('—')+'万' : money(range) }
function resultPrice(scheme) { return scheme.priceKnown ? referenceTotal(scheme.priceAssumed ? scheme.price : scheme.total) : '待承运商确认' }
function revealSelectedPlan() { const list = shellElement.value?.querySelector('.lyd-tabs'), tab = shellElement.value?.querySelector('#plan-tab-'+selectedId.value); if(list && tab) list.scrollLeft = tab.offsetLeft-list.offsetLeft }
function focusResultSegment(index) { resultFocusedSegment.value = index; selectedSegment.value = index }
async function saveEditedDemand(payload) {
  const candidate = {...editDraft.value,equipment:editDraft.value.equipment || '40HQ',origin:payload.origin.name,destination:payload.destination.name}
  const issue = demandIssue(candidate)
  if(issue) { error.value = issue; return }
  editOpen.value = false
  quickQuery({...payload,equipment:editDraft.value.equipment,equipmentProvided:!!editDraft.value.equipment,quantity:editDraft.value.quantity,departure:editDraft.value.departure,priority:editDraft.value.priority})
}

const planningSteps = computed(() => [
  {title:'识别装卸地点',detail:draft.value.origin+' → '+draft.value.destination},
  {title:'匹配运输路线',detail:'按'+(draft.value.transportMode === 'all' ? '可用运输方式' : modeLabels[draft.value.transportMode])+'查找衔接节点'},
  {title:'比较时效与费用',detail:planningResult.value?.items.length ? '找到'+planningResult.value.items.length+'个方案，比较全程时效、交接与计价条件' : '核对匹配范围与承运条件'},
  {title:'整理推荐与服务商',detail:planningResult.value?.items.length ? '将路线与可承接的服务商关联，整理推荐依据' : '整理未匹配原因与可调整条件'},
])
const contextualQuestions = computed(() => selected.value ? ['这个价格包含哪些费用？','这个方案的时效怎么算？','路线经过哪些节点？'] : ['门到门包含哪些环节？','查询运单 LY20260930001'])
async function scrollBottom() { await nextTick(); if(scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight }
function navigate(target) { if (view.value !== target) history.value.push(view.value); view.value = target; error.value = ''; nextTick(() => { if(scrollArea.value) scrollArea.value.scrollTop = 0 }) }
function exitHomeQuery() {
  history.value = []; view.value = 'chat'; error.value = ''; needsConfirmation.value = false; aiSubpage.value = ''
  entrySource.value = 'assistant'; emit('close')
}
// AI 首页、托运单选择与分析对话之间的页面切换。
function openBillSelect() { aiSubpage.value = 'select' }
function openBillAnalysis(bills) { analysisBills.value = [...bills]; aiSubpage.value = 'analysis' }
function backToAiHome() { aiSubpage.value = '' }
function closeAi() { aiSubpage.value = ''; emit('close') }
function newAiTask() { aiSubpage.value = ''; reset() }
function onHistoryRecord(record) {
  if (record?.session) { restoreSession(record.session); aiSubpage.value = ''; return }
  openBillAnalysis(aiBills)
}
function goBack() {
  if(loading.value) { cancelPlanning(); return }
  // 首页发起的查询在结果根页直接返回首页；深入地图和托运仍按原路径返回。
  if(entrySource.value === 'home' && ['overview','results','empty'].includes(view.value) && (!history.value.length || history.value.at(-1) === 'chat')) { exitHomeQuery(); return }
  if(history.value.length) { view.value = history.value.pop(); error.value = '' }
  else { entrySource.value = 'assistant'; emit('close') }
}
function addMessage(role,text) { messages.value.push({role,text}) }
function invalidate() { generation++; clearTimeout(timer); loading.value = false; schemes.value = []; selectedId.value = ''; chosenProviderId.value = ''; consignmentRecord.value = null; consignmentDraft.value = null; history.value = []; retained.value = false }
function start(text = '') { entrySource.value = 'assistant'; if(text.trim()) submitText(text) }
function fillDemand() { entrySource.value = 'assistant'; view.value = 'chat'; needsConfirmation.value = true; scrollBottom() }
function send() { const text = input.value.trim(); if(!text || loading.value) return; input.value = ''; submitText(text) }
function submitText(text) {
  if(loading.value) return
  entrySource.value = 'assistant'
  const oldDemand = { ...draft.value }
  if(view.value !== 'chat') navigate('chat')
  addMessage('user',text); error.value = ''; tracking.value = null
  const number = text.match(/LY\d+/i)?.[0]
  if(number || /查.*运单|查运输/.test(text)) {
    tracking.value = trackingExamples.find(item => item.number.toUpperCase() === number?.toUpperCase()) || null
    addMessage('assistant',tracking.value ? '以下是该运单的运输节点，请留意记录更新时间。' : '未找到该运单，请核对运单号与查询权限。')
    scrollBottom(); return
  }
  const parsed = parseRequest(text,draft.value)
  const changed = JSON.stringify(parsed) !== JSON.stringify(oldDemand)
  if(changed || /到|至|规划|方案|运输需求/.test(text) && !schemes.value.length && !/包含|哪些|时效|费用|轨迹|谁/.test(text)) {
    const from = resolveLocation(parsed.origin), to = resolveLocation(parsed.destination)
    if(changed && from && to && (from.id !== to.id)) {
      quickQuery({origin:from,destination:to,goodsText:parsed.goodsDescription || (parsed.goodsProvided ? parsed.goods : ''),equipment:parsed.equipment,equipmentProvided:parsed.equipmentProvided,quantity:parsed.quantity,departure:parsed.departure,transportMode:parsed.transportMode || props.mode,priority:parsed.priority},false)
      return
    }
    if(changed) invalidate()
    draft.value = parsed
    needsConfirmation.value = true
    addMessage('assistant',changed && oldDemand.origin ? '已更新运输需求。请选择对应地点，再直接查询；货品可以不填。' : '请选择装货地和卸货地，就能查询路线。货品选填，不必先补全箱量或出运日期。')
    if(ambiguous.value) addMessage('assistant','“'+draft.value.destination+'”是方向，请先选择具体目的城市或港口；我不会把方向当作准确交付地址。')
  } else if(/最快|最便宜|便宜|快一点/.test(text) && schemes.value.length) {
    draft.value = parsed; generate()
  } else addMessage('assistant',answerQuestion(text,selected.value,selected.value?.demand || draft.value))
  nextTick(() => { if(needsConfirmation.value) editForm.value?.prefill(draft.value); scrollBottom() })
}
function queryFromHome(payload) { entrySource.value = 'home'; quickQuery(payload) }
function quickQuery(payload, recordMessage = true) {
  view.value = 'chat'; needsConfirmation.value = false
  invalidate(); tracking.value = null
  payload = {...payload,origin:resolveLocation(payload.origin.name) || payload.origin,destination:resolveLocation(payload.destination.name) || payload.destination}
  const goodsText = payload.goodsText.trim()
  emit("update:mode",payload.transportMode || props.mode)
  draft.value = { ...blankDemand(), origin:payload.origin.name, destination:payload.destination.name, originPoint:payload.origin.xy, destinationPoint:payload.destination.xy, goodsProvided:!!goodsText, equipmentProvided:/20GP|40HQ/i.test(goodsText), equipment:goodsText.toUpperCase().match(/20GP|40HQ/)?.[0] || "40HQ", transportMode:payload.transportMode || props.mode, priority:payload.priority || "综合考虑", originType:payload.origin.type, destinationType:payload.destination.type, goodsDescription:goodsText, goods:/危险|危化/.test(goodsText) ? '危险品' : /冷链|冷藏/.test(goodsText) ? '冷链货物' : '普货', delivery:payload.origin.type === 'region' && payload.destination.type === 'region' ? '门到门' : payload.origin.type === 'port' && payload.destination.type === 'region' ? '节点到门' : payload.origin.type === 'region' ? '门到节点' : '指定节点交付' }
  if(payload.equipmentProvided) { draft.value.equipmentProvided = true; draft.value.equipment = payload.equipment }
  draft.value.quantity = payload.quantity ?? Number(goodsText.match(/(\d+)\s*(?:箱|柜)/)?.[1] || 1)
  draft.value.departure = payload.departure || ''
  emit('demand-change',draft.value)
  if(recordMessage) addMessage('user',`${draft.value.origin} → ${draft.value.destination}${goodsText ? '；货品：'+goodsText : '；货品未填写'}`)
  generate()
}
function generate() {
  error.value = demandIssue(draft.value)
  if(error.value) { scrollBottom(); return }
  clearTimeout(timer)
  resultFocusedSegment.value = -1
  loading.value = true; view.value = 'planning'; needsConfirmation.value = false; planningStep.value = 0; planningResult.value = null
  history.value = []
  nextTick(() => {if(scrollArea.value) scrollArea.value.scrollTop = 0})
  const token = ++generation, request = {...draft.value}
  // 原型按阶段推进；正式接入后由各查询任务的完成状态驱动。
  function advance() {
    if(token !== generation) return
    if(planningStep.value === 0) planningResult.value = buildSchemes(request)
    if(planningStep.value < 3) {
      planningStep.value++
      timer = setTimeout(advance,420)
      return
    }
    const result = planningResult.value
    confirmed.value = request; schemes.value = result.items; noMatchReason.value = result.reason
    selectedId.value = analyseSchemes(result.items,request.priority).recommendedId
    selectedSegment.value = 0; chosenProviderId.value = ''; consignmentRecord.value = null; consignmentDraft.value = null; retained.value = false; loading.value = false
    const conclusion = analyseSchemes(result.items,request.priority)
    addMessage('assistant',result.items.length ? conclusion.title+'。'+conclusion.reason : result.reason)
    view.value = 'chat'; navigate(result.items.length ? 'overview' : 'empty'); nextTick(revealSelectedPlan)
  }
  timer = setTimeout(advance,420)
}
function cancelPlanning() {
  generation++; clearTimeout(timer); loading.value = false
  if(entrySource.value === 'home') { exitHomeQuery(); return }
  view.value = 'chat'; needsConfirmation.value = true
  nextTick(() => {editForm.value?.prefill(draft.value);scrollBottom()})
}
function showProviders() { navigate('providers') }
function confirmCarrierSelection(){
  if(!chosenProvider.value)return
  if(!consignmentDraft.value){const next=createConsignment(confirmed.value,selected.value);const saved=consignmentStore.records.find(r=>r.status==='草稿'&&r.provider.id===chosenProviderId.value&&r.form.contextKey===next.contextKey);consignmentDraft.value=saved?clone(saved.form):next}
  if(history.value.at(-1)==='consignment')goBack();else navigate('consignment')
}
function backToProviders(){if(history.value.at(-1)==='providers')goBack();else navigate('providers')}
function changeMode(mode) {
  emit('update:mode',mode)
  draft.value.transportMode = mode
  if(!['overview','results','empty','map','providers','consignment'].includes(view.value)) return
  confirmed.value = {...confirmed.value,transportMode:mode}
  draft.value = {...confirmed.value}
  const result = buildSchemes(confirmed.value)
  schemes.value = result.items; noMatchReason.value = result.reason
  selectedId.value = analyseSchemes(result.items,confirmed.value.priority).recommendedId; selectedSegment.value = 0; chosenProviderId.value = ''; consignmentRecord.value = null; consignmentDraft.value = null
  history.value = []; view.value = 'chat'
  navigate(result.items.length ? 'overview' : 'empty')
}
function openSchemeDetail(id){selectScheme(id);navigate('results')}
function backToOverview(){resultFocusedSegment.value=-1;if(history.value.at(-1)==='overview')goBack();else navigate('overview')}
function selectScheme(id) { resultFocusedSegment.value = -1; nextTick(revealSelectedPlan); if(selectedId.value !== id) { selectedId.value = id; selectedSegment.value = 0; resultFocusedSegment.value = -1; consignmentRecord.value = null; consignmentDraft.value = null; chosenProviderId.value = '' } }
function editDemand() { if(['results','overview'].includes(view.value)) { editDraft.value = {...confirmed.value,equipment:confirmed.value.equipmentProvided ? confirmed.value.equipment : ''}; editMode.value = confirmed.value.transportMode; error.value = ''; editOpen.value = true; nextTick(() => resultEditForm.value?.prefill(confirmed.value)); return } draft.value = {...confirmed.value}; needsConfirmation.value = true; navigate('chat'); nextTick(() => {editForm.value?.prefill(draft.value); scrollBottom()}) }
function cancelEdit() { draft.value = {...confirmed.value}; needsConfirmation.value = false; navigate('overview') }
function askAbout(text) { submitText(text) }
function selectProvider(id){if(matchedProviders.value.some(provider=>provider.id===id))chosenProviderId.value=id}
function onConsignmentSubmitted(record){consignmentRecord.value=record;consignmentDraft.value=null;navigate('done')}
function openConsignmentRecord(record){consignmentRecord.value=record;navigate('done')}
function backFromConsignmentResult(){if(consignmentDraft.value&&history.value.at(-1)==='consignment')goBack();else navigate('results')}
function restartConsignment(record){consignmentDraft.value=clone({...record.form,id:''});chosenProviderId.value=record.provider.id;consignmentRecord.value=null;navigate('consignment')}
function reset() {
  if(messages.value.length) {
    const snapshot = JSON.parse(JSON.stringify({messages:messages.value,draft:draft.value,confirmed:confirmed.value,schemes:schemes.value,tracking:tracking.value,needsConfirmation:needsConfirmation.value,selectedId:selectedId.value}))
    savedSessions.value.unshift({id:Date.now(),title:messages.value.find(message=>message.role === 'user')?.text || '运输会话',snapshot})
    savedSessions.value = savedSessions.value.slice(0,8)
  }
  entrySource.value = 'assistant'; invalidate(); view.value = 'chat'; draft.value = blankDemand(); confirmed.value = blankDemand(); messages.value = []; input.value = ''; needsConfirmation.value = false; resetOpen.value = false; tracking.value = null; retainedDemand.value = null; error.value = '' }
function restoreSession(session) {
  invalidate()
  const snapshot = JSON.parse(JSON.stringify(session.snapshot))
  messages.value = snapshot.messages; draft.value = snapshot.draft; confirmed.value = snapshot.confirmed
  schemes.value = snapshot.schemes; tracking.value = snapshot.tracking; needsConfirmation.value = snapshot.needsConfirmation
  selectedId.value = snapshot.selectedId; entrySource.value = 'assistant'; view.value = 'chat'
  nextTick(() => { if(needsConfirmation.value) editForm.value?.prefill(draft.value); scrollBottom() })
}
onBeforeUnmount(() => clearTimeout(timer))
defineExpose({ start, fillDemand, query:quickQuery, queryFromHome, isLanding, overlayOpen })
</script>

<style>
/* AI 页签按 Pixso 设计稿为全屏对话界面，不再叠加 App 底部导航。 */
.lya-shell.lya-start-shell{bottom:0;background:#eaf2ff}
</style>
