<template>
  <section ref="shellElement" class="lya-shell" :class="{ 'lya-start-shell': isLanding, 'lya-result-shell': view === 'results' }" aria-label="运输助手完整流程">
    <AssistantStartPage v-show="isLanding" :sessions="savedSessions" @message="submitText" @restore="restoreSession" @restart="reset" @overlay="overlayOpen = $event"/>
    <AssistantWorkbenchBar v-if="!isLanding" :title="titles[view]" @back="goBack" @restart="resetOpen = true"/>
    <main v-show="!isLanding" ref="scrollArea" class="lya-body" :class="{ 'lya-chat-body': view === 'chat', 'lya-results-layout': view === 'results' }">
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
        <button v-if="schemes.length && !needsConfirmation" class="lya-result-reopen lya-card" @click="navigate('results')"><span><strong>已整理 {{ schemes.length }} 个运输方案</strong><small>{{ confirmed.origin }} → {{ confirmed.destination }}</small></span><van-icon name="arrow"/></button>
        <div v-if="!needsConfirmation && messages.length" class="lya-suggestions"><button v-for="question in contextualQuestions" :key="question" @click="submitText(question)">{{ question }}</button></div>
      </template>

      <template v-else-if="view === 'results'">
        <section class="lyar-demand">
          <div><strong>{{ confirmed.origin }} <span>→</span> {{ confirmed.destination }}</strong><button class="lya-link" @click="editDemand">修改</button></div>
          <p>{{ resultDemandSummary }}</p>
        </section>
        <AssistantResultMap v-if="selected" :scheme="selected" :selected="resultFocusedSegment" @select="focusResultSegment"/>
        <div v-if="resultsExpanded" :style="{flex:'0 0 '+collapsedSheetHeight+'px'}" aria-hidden="true"/>
        <section ref="resultSheet" class="lyar-sheet" :class="{expanded:resultsExpanded}" aria-label="运输方案与分析">
          <div class="lyar-handle"/>
          <section v-if="!resultsExpanded" class="lyar-advice" aria-label="小简方案分析">
            <div><strong><img src="/zhiyun-mobile-assets/icons/tab-cat-ai.png" alt=""/>小简建议：{{ recommendedScheme?.name }}</strong><button class="lya-link" @click="navigate('compare')">分析依据 <van-icon name="arrow"/></button></div>
            <p>{{ recommendationBrief }}</p>
          </section>
          <div class="lyar-heading"><h3>{{ resultsExpanded ? '方案详情' : '可选方案' }} <small>{{ schemes.length }}个{{ schemes.length > 2 ? ' · 横滑切换' : '' }}</small></h3><button class="lya-link" :aria-expanded="resultsExpanded" aria-controls="result-details" @click="toggleResultsDetails">{{ resultsExpanded ? '收起详情' : '展开详情' }} <van-icon :name="resultsExpanded ? 'arrow-down' : 'arrow-up'"/></button></div>
          <div class="lyar-plans" role="tablist" aria-label="运输方案">
            <button v-for="(scheme,index) in orderedSchemes" :id="'plan-tab-'+scheme.id" :key="scheme.id" role="tab" :aria-selected="selectedId === scheme.id" aria-controls="result-details" :tabindex="selectedId === scheme.id ? 0 : -1" :class="{selected:selectedId === scheme.id}" @click="selectScheme(scheme.id)" @keydown="onPlanTabKey($event,index)">
              <div><strong>{{ scheme.name }}</strong><span v-if="analysis.recommendedId === scheme.id" class="lyar-recommended">小简推荐</span></div>
              <p><span>时效</span><b>{{ scheme.duration }}</b></p>
              <p class="lyar-plan-price"><span>{{ scheme.priceAssumed ? '参考价' : '参考总额' }}</span><b>{{ resultPrice(scheme) }}</b></p>
              <p v-if="scheme.priceKnown && scheme.priceAssumed" class="lyar-price-basis">按{{ scheme.demand.equipment }}普货／箱</p>
              <small>{{ scheme.transfers ? scheme.transfers+'次转换' : '无需转换' }} · {{ scheme.label }}</small>
            </button>
          </div>
          <div v-show="resultsExpanded" id="result-details" ref="resultsDetails" class="lyar-details" role="tabpanel" :aria-labelledby="selected ? 'plan-tab-'+selected.id : undefined">
            <template v-if="selected">
              <section class="lyar-selected-summary" aria-label="当前方案摘要">
                <div><strong>{{ selected.name }}</strong><button class="lya-link" @click="navigate('compare')">分析依据 <van-icon name="arrow"/></button></div>
                <p>{{ selected.duration }} <span>·</span> {{ resultPrice(selected) }}{{ selected.priceKnown ? selected.priceAssumed ? '／箱' : '（参考总额）' : '' }} <span>·</span> {{ selected.transfers ? selected.transfers+'次转换' : '无需转换' }}</p>
                <small v-if="selected.priceKnown && selected.priceAssumed">参考价按{{ selected.demand.equipment }}普货，实际货物与箱型待确认</small>
                <small>{{ selected.summary }}</small>
              </section>
              <div class="lyar-heading"><h3>分段运输</h3><small>约{{ selected.km.toLocaleString() }} km · {{ selected.delivery }}</small></div>
              <ol class="lyar-segments"><li v-for="(segment,index) in selected.segments" :key="index">
                <button :aria-pressed="resultFocusedSegment === index" @click="focusResultSegment(index)"><span class="lyar-mode" :class="segment.mode">{{ modeLabels[segment.mode] }}</span><span class="lyar-map-link">查看地图 <van-icon name="arrow"/></span><strong>{{ segment.from }} → {{ segment.to }}</strong><p>约{{ segment.km }} km <span>·</span> {{ durationLabel(segment.hours) }}</p><small>{{ segment.note }}</small></button>
              </li></ol>
              <section class="lyar-fees"><h3>费用范围</h3><p><span>包含</span>{{ selected.included }}</p><p><span>另计</span>{{ selected.excluded }}</p><small>{{ selected.risk }}</small></section>
              <section ref="inlineProviders" class="lya-inline-providers" aria-label="对应服务商">
                <div class="lyar-heading"><h3>全程服务商</h3><small>{{ matchedProviders.length }}家 · 可多选询价</small></div>
                <article v-for="provider in matchedProviders" :key="provider.id" class="lya-inline-provider" :class="{chosen:chosenProviderIds.includes(provider.id)}">
                  <button class="lya-provider-choice" :aria-label="'选择'+provider.name" :aria-pressed="chosenProviderIds.includes(provider.id)" @click="toggleProvider(provider.id)"><strong>{{ provider.name }}</strong><van-icon :name="chosenProviderIds.includes(provider.id) ? 'checked' : 'circle'"/></button>
                  <ProviderRating :provider="provider" compact @open="reviewProvider = provider"/>
                  <p>{{ provider.capability }}</p><small>{{ provider.cooperation }}</small>
                </article>
              </section>
            </template>
          </div>
        </section>
      </template>

      <template v-else-if="view === 'compare'">
        <div class="lya-compare-context"><strong>{{ confirmed.origin }} → {{ confirmed.destination }}</strong><p>{{ demandSummary }}</p></div>
        <section class="lya-analysis-report" aria-label="AI方案对比分析">
          <div class="lya-report-heading"><img src="/zhiyun-mobile-assets/ai-workbench/mascot.png" alt=""/><div><span>小简帮你比较</span><h2>{{ analysis.title }}</h2></div></div>
          <section v-for="part in analysis.details" :key="part.title" class="lya-analysis-part"><h3>{{ part.title }}</h3><p>{{ part.text }}</p></section>
          <p class="lya-analysis-note">{{ analysis.note }}</p>
        </section>
        <div class="lya-inline-heading"><h3>逐项对比</h3><small>{{ schemes.length }} 个方案 · 同一货物条件</small></div>
        <div class="lya-comparison" tabindex="0" aria-label="方案对比表，可横向滚动">
          <table><thead><tr><th>比较项</th><th v-for="scheme in orderedSchemes" :key="scheme.id">{{ scheme.name }}</th></tr></thead><tbody>
            <tr v-for="row in comparisonRows" :key="row.label"><th>{{ row.label }}</th><td v-for="scheme in orderedSchemes" :key="scheme.id">{{ row.value(scheme) }}</td></tr>
            <tr><th>下一步</th><td v-for="scheme in orderedSchemes" :key="scheme.id"><button class="lya-primary" @click="selectScheme(scheme.id); navigate('results')">选择此方案</button></td></tr>
          </tbody></table>
        </div>
      </template>

      <template v-else-if="view === 'map'">
        <div class="lya-heading"><div><h2>{{ selected.name }}</h2><p>{{ confirmed.origin }} → {{ confirmed.destination }}</p></div></div>
        <AssistantRouteMap :scheme="selected" :selected="selectedSegment" expanded @select="selectedSegment = $event" @expand="goBack"/>
        <div class="lya-route-facts"><span>{{ selected.duration }}</span><span>约 {{ selected.km.toLocaleString() }} km</span><span>{{ selected.delivery }}</span></div>
        <p class="lya-secondary">{{ selected.segments[selectedSegment].from }} → {{ selected.segments[selectedSegment].to }}</p>
      </template>

      <template v-else-if="view === 'inquiry'">
        <section class="lya-card"><h3>核对询价内容</h3><dl><dt>装卸地点</dt><dd>{{ confirmed.origin }} → {{ confirmed.destination }}</dd><dt>运输需求</dt><dd>{{ demandSummary }}</dd><dt>出运日期</dt><dd>{{ confirmed.departure || '未确定，请服务商确认' }}</dd><dt>所选方案</dt><dd>{{ selected.name }}</dd><dt>参考费用</dt><dd>{{ selected.priceKnown ? selected.priceAssumed ? money(selected.price)+' / '+selected.demand.equipment+'普货箱；条件待确认，非服务商报价' : money(selected.total)+' / '+confirmed.quantity+'箱；非服务商报价' : '待服务商按货物条件报价' }}</dd><dt>询价对象</dt><dd>{{ inquiryProviders.map(p => p.name).join('、') }}</dd></dl><button class="lya-link" @click="showProviders">修改服务商</button></section>
        <section class="lya-card lya-confirm"><h3>按需补充询价信息</h3><p>查询无需先填这些；询价时补充后，服务商才能给出针对性报价。</p><label>货物信息<input v-model="draft.goodsDescription" aria-label="询价货物信息" placeholder="货物名称、重量、尺寸等"/></label><div v-if="selected.mode !== 'air'" class="lya-form-grid"><label>箱型<select v-model="draft.equipment" aria-label="询价箱型"><option>40HQ</option><option>20GP</option></select></label><label>箱量<input v-model.number="draft.quantity" aria-label="询价箱量" type="number" min="1" max="100"/></label><label>出运日期<input v-model="draft.departure" aria-label="询价出运日期" type="date"/></label></div><label>补充说明<textarea v-model="inquiryNote" aria-label="询价补充说明" maxlength="500" placeholder="货物、装卸、境外配送或其他要求…" rows="3"/></label><label class="lya-checkbox"><input v-model="inquiryConsent" type="checkbox"/>我已核对运输条件，先保存询价草稿，尚不对外发送。</label><p v-if="error" class="lya-error" role="alert">{{ error }}</p></section>
      </template>

      <template v-else-if="view === 'done'">
        <section class="lya-card lya-success"><van-icon name="checked"/><h2>询价草稿已保存</h2><p>{{ inquiryRecord.id }} · 当前会话</p><p>已整理方案与{{ inquiryRecord.providers.length }}家服务商，尚未对外发送。</p></section>
        <section class="lya-card"><h3>本次询价内容</h3><p>{{ inquiryRecord.demand.origin }} → {{ inquiryRecord.demand.destination }}</p><p>{{ inquiryRecord.scheme.name }} · {{ inquiryRecord.demand.goodsDescription || '货物待确认' }}</p><p>{{ inquiryRecord.note || '无额外说明' }}</p><p v-for="provider in inquiryRecord.providers" :key="provider.id" class="lya-response-state"><strong>{{ provider.name }}</strong><span>已加入询价草稿</span></p></section>
        <button class="lya-primary" @click="navigate('inquiry')">继续完善询价</button>
        <button class="lya-link" @click="navigate('results')">返回方案，继续比较</button>
      </template>

      <template v-else-if="view === 'empty'">
        <div class="lya-result-modes" aria-label="结果运输方式"><button v-for="option in transportModes" :key="option.key" :class="{active:mode === option.key}" :aria-pressed="mode === option.key" @click="changeMode(option.key)">{{ option.label }}</button></div>
        <section class="lya-card lya-empty"><van-icon name="search"/><h2>暂未找到符合条件的服务</h2><p>{{ noMatchReason }}</p><p>{{ confirmed.origin }} → {{ confirmed.destination }}<br>{{ demandSummary }}</p><button class="lya-primary" @click="editDemand">修改条件继续查</button><button class="lya-outline" @click="retainedDemand = {...confirmed}; retained = true">{{ retained ? '需求已保存在本地会话' : '保留需求，待人工确认' }}</button><p v-if="retained">已保留需求草稿；尚未分配客服或发送咨询。</p></section>
        <section class="lya-card"><h3>其他查询</h3><button v-for="example in assistantExamples.slice(0,2)" :key="example" class="lya-example-button" @click="submitText(example)">{{ example }}</button></section>
      </template>
    </main>

    <form v-if="view === 'chat' && !isLanding" class="lya-composer" @submit.prevent="send"><textarea v-model="input" aria-label="向运输助手发送消息" placeholder="说说装卸地点、货物，或继续追问…" rows="2" maxlength="500"/><div><span>可继续追问当前路线、费用与时效</span><button type="submit" :disabled="!input.trim() || loading" aria-label="发送消息"><van-icon name="arrow-up"/></button></div></form>
    <footer v-else-if="!isLanding && !['empty','done','planning'].includes(view)" class="lya-footer" :class="{'lyar-footer':view === 'results'}">
      <template v-if="view === 'inquiry'"><button class="lya-outline" @click="goBack">返回修改</button><button class="lya-primary" @click="confirmInquiry">保存询价草稿</button></template>
      <template v-else-if="view === 'results'"><div class="lyar-footer-summary"><span>当前选择 <b>{{ selected?.name }}</b></span><small>费用与时效待服务商确认</small></div><div class="lyar-footer-actions"><button class="lya-outline" @click="navigate('chat')">继续问小简</button><button class="lya-primary" @click="chosenProviderIds.length ? navigate('inquiry') : showProviders()">{{ chosenProviderIds.length ? '核对询价（'+chosenProviderIds.length+'家）' : '选择服务商询价' }}</button></div></template>
      <template v-else><button class="lya-outline" @click="navigate('chat')">继续问小简</button><button class="lya-primary" @click="chosenProviderIds.length ? navigate('inquiry') : showProviders()">{{ chosenProviderIds.length ? '核对询价（'+chosenProviderIds.length+'家）' : '选择服务商询价' }}</button></template>
    </footer>
    <van-popup v-model:show="editOpen" round position="bottom" :teleport="shellElement" :style="{position:'absolute'}" :overlay-style="{position:'absolute'}" class="lyar-edit">
      <div class="lyar-heading"><h3>修改运输需求</h3><button class="lya-link" aria-label="关闭需求修改" @click="editOpen = false"><van-icon name="cross"/></button></div>
      <RouteQueryForm ref="resultEditForm" v-model:mode="editMode" :teleport="shellElement" query-label="更新运输方案" @query="saveEditedDemand">
        <div class="lyar-edit-fields"><label>箱型<select v-model="editDraft.equipment"><option value="">待补充</option><option>40HQ</option><option>20GP</option></select></label><label>箱量<input v-model.number="editDraft.quantity" type="number" min="1" max="100" required/></label><label>出运日期<input v-model="editDraft.departure" type="date"/></label><label>优先考虑<select v-model="editDraft.priority"><option>综合考虑</option><option>费用优先</option><option>时效优先</option></select></label></div><p v-if="error" class="lya-error" role="alert">{{ error }}</p>
      </RouteQueryForm>
    </van-popup>
    <div v-if="reviewProvider || resetOpen" class="lya-modal-backdrop" @click.self="reviewProvider = null; resetOpen = false">
      <section v-if="reviewProvider" role="dialog" aria-modal="true" aria-label="企业服务评价" class="lya-modal lya-card"><div class="lya-heading"><h3>企业服务评价</h3><button aria-label="关闭评价" @click="reviewProvider = null"><van-icon name="cross"/></button></div><h3>{{ reviewProvider.name }}</h3><p>{{ reviewProvider.score === null ? '暂无评价' : reviewProvider.score+' / 5 · '+reviewProvider.reviewCount+'条评价' }}</p><p v-if="reviewProvider.reviewCount < 5 && reviewProvider.reviewCount > 0" class="lya-error">评价数量较少，评分仅作参考。</p><blockquote v-if="reviewProvider.review">{{ reviewProvider.review }}</blockquote><small>企业评分仅供参考，不等于本单履约保证。</small></section>
      <section v-else role="dialog" aria-modal="true" aria-label="开始新会话确认" class="lya-modal lya-card"><h3>开始新会话？</h3><p>当前消息、方案选择和询价草稿将清空。返回首页不会清空会话。</p><button class="lya-primary" @click="reset">清空并开始</button><button class="lya-outline" @click="resetOpen = false">保留当前会话</button></section>
    </div>
  </section>
</template>

<script setup>
import AssistantWorkbenchBar from './AssistantWorkbenchBar.vue'
import AssistantStartPage from './AssistantStartPage.vue'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import AssistantRouteMap from './AssistantRouteMap.vue'
import AssistantResultMap from './AssistantResultMap.vue'
import ProviderRating from './ProviderRating.vue'
import RouteQueryForm from './RouteQueryForm.vue'
import { assistantExamples, assistantProviders, blankDemand, modeColors, modeLabels, transportModes } from './assistant-data.js'
import { answerQuestion, buildSchemes, demandIssue, durationLabel, money, parseRequest } from './assistant-engine.js'
import { trackingExamples } from './mock-data.js'
import { extraProviders } from './assistant-scenarios.js'
import { resolveLocation } from './assistant-locations.js'
import { analyseSchemes } from './assistant-analysis.js'
import './assistant.css'
import './assistant-results.css'
const props = defineProps({mode:{default:'all'}})
const emit = defineEmits(['close','update:mode','demand-change'])
const shellElement = ref(null), editForm = ref(null), inlineProviders = ref(null)
const resultSheet = ref(null), collapsedSheetHeight = ref(311)
const resultsExpanded = ref(false), resultsDetails = ref(null), resultFocusedSegment = ref(-1)
const editOpen = ref(false), resultEditForm = ref(null), editDraft = ref(blankDemand()), editMode = ref('all')
const planningStep = ref(0), planningResult = ref(null)
const entrySource = ref('assistant')
const view = ref('chat'), history = ref([]), input = ref(''), messages = ref([]), draft = ref(blankDemand()), confirmed = ref(blankDemand())
const savedSessions = ref([]), overlayOpen = ref(false)
const isLanding = computed(() => view.value === 'chat' && messages.value.length === 0)
const needsConfirmation = ref(false), error = ref(''), schemes = ref([]), selectedId = ref(''), selectedSegment = ref(0), scrollArea = ref(null), loading = ref(false)
const tracking = ref(null), noMatchReason = ref(''), chosenProviderIds = ref([]), reviewProvider = ref(null), resetOpen = ref(false)
const inquiryNote = ref(''), inquiryConsent = ref(false), inquiryRecord = ref(null), retained = ref(false), retainedDemand = ref(null)
let generation = 0, timer
const titles = { chat:'运输助手', planning:'运输助手', results:'运输方案', compare:'方案对比', map:'路线地图', inquiry:'确认询价', done:'询价记录', empty:'查询结果' }
const selected = computed(() => schemes.value.find(item => item.id === selectedId.value) || schemes.value[0])
const ambiguous = computed(() => /^(中欧|欧洲|中缅|缅甸|东南亚)$/.test(draft.value.destination.trim()))
const demandSummary = computed(() => `${confirmed.value.goodsProvided ? confirmed.value.goodsDescription || confirmed.value.goods : '货品未填写'} · ${confirmed.value.transportMode === 'all' ? '不限运输方式' : modeLabels[confirmed.value.transportMode]}`)
const matchedProviders = computed(() => [...assistantProviders,...extraProviders].filter(provider => selected.value?.providerIds.includes(provider.id)))
const inquiryProviders = computed(() => matchedProviders.value.filter(provider => chosenProviderIds.value.includes(provider.id)))
const analysis = computed(() => analyseSchemes(schemes.value,confirmed.value.priority))
// 推荐置前；排序只依赖推荐结果，用户选中其他方案不会改变卡片位置。
const orderedSchemes = computed(() => [...schemes.value.filter(item => item.id === analysis.value.recommendedId), ...schemes.value.filter(item => item.id !== analysis.value.recommendedId)])
const recommendedScheme = computed(() => schemes.value.find(item => item.id === analysis.value.recommendedId))
const resultDemandSummary = computed(() => [confirmed.value.goodsProvided ? confirmed.value.goodsDescription || confirmed.value.goods : '货品待补充', confirmed.value.equipmentProvided ? confirmed.value.quantity+'×'+confirmed.value.equipment : '箱型待补充', confirmed.value.delivery, confirmed.value.departure || '日期待定'].join(' · '))
const recommendationBrief = computed(() => {
  const scheme = recommendedScheme.value
  if(!scheme) return ''
  if(confirmed.value.priority === '综合考虑' && scheme.balancedReason && schemes.value.every(item => item.priceKnown)) return scheme.balancedReason
  if(schemes.value.length === 1) return '当前条件匹配到这一条方案；请核实出运安排、费用范围与承接条件。'
  if(confirmed.value.priority === '费用优先' && schemes.value.every(item => item.priceKnown)) return '按预算优先考虑，这条方案的参考总额较低；'+(scheme.hours[1] > Math.min(...schemes.value.map(item => item.hours[1])) ? '代价是耗时更长，' : '预计时效也较短，')+'需确认干线发运与节点衔接。'
  return scheme.transfers === 0 ? '综合时效与交接环节，优先选择直达方案；无需中转，组织更简单。'+(scheme.priceKnown ? '预算优先时可比较联运方案。' : '货物与箱型补齐后，再比较费用。') : '优先考虑预计时效较短的方案；仍需核实干线安排、节点交接与全程服务范围。'
})
function referenceTotal(range) { return range[0] >= 10000 ? '¥'+range.map(value => (value/10000).toFixed(2)).join('—')+'万' : money(range) }
function resultPrice(scheme) { return scheme.priceKnown ? referenceTotal(scheme.priceAssumed ? scheme.price : scheme.total) : '待询价' }
function revealSelectedPlan() { const list = shellElement.value?.querySelector('.lyar-plans'), tab = shellElement.value?.querySelector('#plan-tab-'+selectedId.value); if(list && tab) list.scrollLeft = tab.offsetLeft-list.offsetLeft }
function expandResultsDetails() { if(!resultsExpanded.value) collapsedSheetHeight.value = resultSheet.value?.getBoundingClientRect().height || 311; resultsExpanded.value = true }
function toggleResultsDetails() { if(resultsExpanded.value) resultsExpanded.value = false; else expandResultsDetails() }
function focusResultSegment(index) { resultFocusedSegment.value = index; selectedSegment.value = index; resultsExpanded.value = false }
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
const comparisonRows = [
  {label:'参考单价', value:s => s.priceKnown ? money(s.price)+'/'+s.demand.equipment+'箱'+(s.priceAssumed ? '（按普货示例）' : '') : '待询价'}, {label:'全程参考费用', value:s => s.priceKnown ? money(s.total)+(s.priceAssumed ? '（按'+s.demand.quantity+'箱'+s.demand.equipment+'普货示例）' : '') : '待询价'}, {label:'预计时效', value:s => s.duration},
  {label:'规划里程', value:s => s.km.toLocaleString()+' km'}, {label:'运输组织', value:s => s.summary}, {label:'交付范围', value:s => s.delivery},
  {label:'费用包含', value:s => s.included}, {label:'不含费用', value:s => s.excluded}, {label:'待核实项', value:s => s.risk}, {label:'匹配服务商',value:s => s.providerIds.length+'家'},
]
async function scrollBottom() { await nextTick(); if(scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight }
function navigate(target) { if (view.value !== target) history.value.push(view.value); view.value = target; error.value = ''; nextTick(() => { if(scrollArea.value) scrollArea.value.scrollTop = 0 }) }
function exitHomeQuery() {
  history.value = []; view.value = 'chat'; error.value = ''; needsConfirmation.value = false
  entrySource.value = 'assistant'; emit('close')
}
function goBack() {
  if(loading.value) { cancelPlanning(); return }
  // 首页发起的查询在结果根页直接返回首页；深入比较、地图和询价仍按原路径返回。
  if(entrySource.value === 'home' && ['results','empty'].includes(view.value) && (!history.value.length || history.value.at(-1) === 'chat')) { exitHomeQuery(); return }
  if(history.value.length) { view.value = history.value.pop(); error.value = '' }
  else { entrySource.value = 'assistant'; emit('close') }
}
function addMessage(role,text) { messages.value.push({role,text}) }
function invalidate() { generation++; clearTimeout(timer); loading.value = false; schemes.value = []; selectedId.value = ''; chosenProviderIds.value = []; inquiryRecord.value = null; inquiryConsent.value = false; inquiryNote.value = ''; history.value = []; retained.value = false }
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
  resultsExpanded.value = false; resultFocusedSegment.value = -1
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
    selectedSegment.value = 0; chosenProviderIds.value = []; inquiryRecord.value = null; inquiryConsent.value = false; retained.value = false; loading.value = false
    const conclusion = analyseSchemes(result.items,request.priority)
    addMessage('assistant',result.items.length ? conclusion.title+'。'+conclusion.reason : result.reason)
    view.value = 'chat'; navigate(result.items.length ? 'results' : 'empty'); nextTick(revealSelectedPlan)
  }
  timer = setTimeout(advance,420)
}
function cancelPlanning() {
  generation++; clearTimeout(timer); loading.value = false
  if(entrySource.value === 'home') { exitHomeQuery(); return }
  view.value = 'chat'; needsConfirmation.value = true
  nextTick(() => {editForm.value?.prefill(draft.value);scrollBottom()})
}
async function showProviders() {
  if(view.value !== 'results') navigate('results')
  await nextTick()
  expandResultsDetails()
  await nextTick()
  if(inlineProviders.value && resultsDetails.value) resultsDetails.value.scrollTo({top:resultsDetails.value.scrollTop+inlineProviders.value.getBoundingClientRect().top-resultsDetails.value.getBoundingClientRect().top-8,behavior:'smooth'})
}
function onPlanTabKey(event,index) {
  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if(!offset && !['Home','End'].includes(event.key)) return
  event.preventDefault()
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? orderedSchemes.value.length-1 : (index+offset+orderedSchemes.value.length)%orderedSchemes.value.length
  selectScheme(orderedSchemes.value[target].id)
  nextTick(() => {const tab=shellElement.value?.querySelector('#plan-tab-'+orderedSchemes.value[target].id);tab?.focus();tab?.scrollIntoView({block:'nearest',inline:'nearest'})})
}
function changeMode(mode) {
  emit('update:mode',mode)
  draft.value.transportMode = mode
  if(!['results','empty','compare','map','inquiry'].includes(view.value)) return
  confirmed.value = {...confirmed.value,transportMode:mode}
  draft.value = {...confirmed.value}
  const result = buildSchemes(confirmed.value)
  schemes.value = result.items; noMatchReason.value = result.reason
  selectedId.value = analyseSchemes(result.items,confirmed.value.priority).recommendedId; selectedSegment.value = 0; chosenProviderIds.value = []; inquiryRecord.value = null; inquiryConsent.value = false
  history.value = []; view.value = 'chat'
  navigate(result.items.length ? 'results' : 'empty')
}
function selectScheme(id) { resultFocusedSegment.value = -1; nextTick(revealSelectedPlan); if(selectedId.value !== id) { selectedId.value = id; selectedSegment.value = 0; resultFocusedSegment.value = -1; inquiryRecord.value = null; chosenProviderIds.value = []; inquiryConsent.value = false; inquiryNote.value = '' } }
function editDemand() { if(view.value === 'results') { editDraft.value = {...confirmed.value,equipment:confirmed.value.equipmentProvided ? confirmed.value.equipment : ''}; editMode.value = confirmed.value.transportMode; error.value = ''; editOpen.value = true; nextTick(() => resultEditForm.value?.prefill(confirmed.value)); return } draft.value = {...confirmed.value}; needsConfirmation.value = true; navigate('chat'); nextTick(() => {editForm.value?.prefill(draft.value); scrollBottom()}) }
function cancelEdit() { draft.value = {...confirmed.value}; needsConfirmation.value = false; navigate('results') }
function askAbout(text) { submitText(text) }
function toggleProvider(id) { chosenProviderIds.value = chosenProviderIds.value.includes(id) ? chosenProviderIds.value.filter(item => item !== id) : [...chosenProviderIds.value,id]; inquiryConsent.value = false }
function confirmInquiry() {
  if(!inquiryProviders.value.length) { error.value = '请至少选择一家匹配服务商。'; return }
  if(!inquiryConsent.value) { error.value = '请先核对询价条件并勾选确认。'; return }
  const issue = demandIssue(draft.value)
  if(issue) {error.value = issue; return}
  draft.value.goods = /危险|危化/.test(draft.value.goodsDescription || '') ? '危险品' : /冷链|冷藏/.test(draft.value.goodsDescription || '') ? '冷链货物' : '普货'
  draft.value.goodsProvided = !!draft.value.goodsDescription?.trim(); draft.value.equipmentProvided = selected.value.mode !== "air"
  const inquiryScheme = buildSchemes(draft.value).items.find(scheme => scheme.id === selectedId.value)
  if(!inquiryScheme) {error.value = '补充后的条件需重新匹配，请返回查询。'; return}
  if(inquiryProviders.value.some(provider => !inquiryScheme.providerIds.includes(provider.id))) {error.value = '调整后的箱型超出所选服务商承接条件，请重新查询匹配服务商。'; return}
  inquiryRecord.value = { id:'XJ-'+String(Date.now()).slice(-8), demand:{...draft.value}, scheme:inquiryScheme, providers:[...inquiryProviders.value], note:inquiryNote.value }
  addMessage('assistant','询价草稿已保存，可继续核对服务商与运输条件；尚未对外发送或产生订单。'); navigate('done')
}
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
.lya-shell.lya-start-shell{bottom:84px;background:#fff}
.lya-start-shell:has(.las-overlay){bottom:0}
.ly-screen.ly-ai-screen:has(.lya-start-shell) .ly-status{background:#fff}
.ly-bottom-nav.ly-ai-navigation{left:0;right:0;bottom:0;height:84px;padding:7px 7px 25px;border:0;border-top:1px solid #edf0f5;border-radius:0;background:#fff;backdrop-filter:none}
.ly-bottom-nav.ly-ai-navigation::before{display:none}
.ly-ai-navigation .ly-tab-mascot{position:static;width:30px;height:30px;object-fit:contain}
.ly-ai-navigation .ly-tab{gap:3px;padding:0;font-size:11px}
.ly-ai-navigation .ly-tab-ai{padding:0}
.ly-ai-navigation .ly-home-indicator{bottom:7px}
</style>
