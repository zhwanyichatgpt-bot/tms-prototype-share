<template>
  <section ref="root" class="cq-page" aria-label="承运商报价" @keydown.esc.stop="back">
    <header class="cq-nav"><button class="cq-icon-button" aria-label="返回" @click="back"><van-icon name="arrow-left"/></button><h1>{{ viewing?'我的报价':step===3?'核对报价':'报价' }}</h1><span v-if="viewing" class="cq-badge">已报价</span><span v-else class="cq-nav-space"></span></header>
    <nav v-if="!viewing" class="cq-steps" aria-label="报价步骤"><span v-for="(title,i) in steps" :key="title" :class="{active:step===i+1,done:step>i+1}" :aria-current="step===i+1?'step':undefined"><b>{{ step>i+1?'✓':i+1 }}</b>{{ title }}</span></nav>
    <main ref="scroll" class="cq-scroll">
      <section class="cq-card cq-source"><div class="cq-between"><h2>货源摘要</h2><button class="cq-link" @click="openModal('source')">托运要求 ›</button></div><strong><span class="cq-badge">{{ cargo.businessType }}</span> {{ cargo.goods }} · {{ cargo.quantity }}</strong><p>{{ cargo.origin.city }}·{{ cargo.origin.district }} → {{ cargo.destination.city }}·{{ cargo.destination.district }}</p><p v-if="form.schemeName" class="cq-muted">已引用 {{ form.schemeName }}</p></section>

      <template v-if="step===1">
        <section class="cq-card"><h2>运输方式</h2><div class="cq-mode-grid"><button v-for="mode in source.availableModes" :key="mode" :aria-pressed="form.transportMode===mode" :class="{selected:form.transportMode===mode}" @click="changeMode(mode)">{{ mode }}</button></div></section>
        <button class="cq-card cq-reference" @click="openSchemes"><van-icon name="description"/><span><strong>{{ form.schemeName||'引用已有运输方案' }}</strong><small>{{ form.schemeName?'可更换，报价修改不影响原方案':'选填，也可自行编排路线' }}</small></span><van-icon name="arrow"/></button>
        <section class="cq-card"><div class="cq-between"><h2>{{ isMulti?'运输路段':'运输承接顺序' }}</h2><span class="cq-muted">{{ form.segments.length }}段</span></div>
          <p v-if="!isMulti" class="cq-muted">按托运单节点承接完整运输</p>
          <article v-for="(leg,i) in form.segments" :key="leg.id" class="cq-leg">
            <div class="cq-between"><h3><span class="cq-number">{{ i+1 }}</span>{{ leg.mode }} · {{ leg.carryForm }}</h3><button v-if="isMulti" class="cq-link" :aria-label="`编辑路段${i+1}`" @click="editLeg(i)">编辑 ›</button></div>
            <p class="cq-route">{{ nodeLabel(source,leg.from) }} <span>→</span> {{ nodeLabel(source,leg.to) }}</p>
            <p v-if="flowSummary(source,form,i)" class="cq-muted">承运货品：{{ flowSummary(source,form,i) }}</p>
            <label v-if="!isMulti" class="cq-inline">时效（选填）<input v-model="leg.duration" maxlength="30" placeholder="填写时效"/></label><p v-else-if="leg.duration" class="cq-muted">时效：{{ leg.duration }}</p>
            <div v-if="isMulti" class="cq-leg-actions"><button :disabled="i===0" :aria-label="`上移路段${i+1}`" @click="moveLeg(i,-1)">上移</button><button :disabled="i===form.segments.length-1" :aria-label="`下移路段${i+1}`" @click="moveLeg(i,1)">下移</button><button :disabled="form.segments.length<=1" :aria-label="`删除路段${i+1}`" @click="removeLeg(i)">删除</button><button :aria-label="`在路段${i+1}插入中转点`" @click="insertLeg(i)">插入中转</button></div>
          </article>
          <button v-if="isMulti" class="cq-add" @click="insertLeg(form.segments.length-1)">＋ 添加路段</button>
          <ul v-if="routeProblems.length" class="cq-route-errors" role="alert"><li v-for="error in routeProblems" :key="error">{{ error }}</li></ul><p v-else class="cq-success"><van-icon name="checked"/> 已覆盖全部{{ source.isContainer?'托运节点':'装卸点' }}，{{ form.segments.length }}段首尾连续</p>
        </section>
      </template>

      <template v-else-if="step===2">
        <section v-if="isMulti" class="cq-card"><h2>报价模式</h2><div class="cq-grid cq-toggle"><button v-for="mode in ['整票报价','分段报价']" :key="mode" :aria-pressed="form.quoteMode===mode" :class="{selected:form.quoteMode===mode}" @click="changeQuoteMode(mode)">{{ form.quoteMode===mode?'✓ ':'' }}{{ mode }}</button></div></section>
        <section v-if="form.quoteMode==='整票报价'" class="cq-card" :data-error="errors.whole?'true':undefined"><h2>运输费用</h2><QuoteFeeFields :source="source" :form="form" :fee="form.whole" :error="errors.whole" @extra="editExtra"/></section>
        <template v-else>
          <section v-for="(leg,i) in form.segments" :key="leg.id" class="cq-card" :data-error="errors[leg.id]?'true':undefined">
            <button class="cq-accordion" :aria-expanded="expandedLeg===leg.id" @click="expandedLeg=expandedLeg===leg.id?'':leg.id"><strong><span class="cq-number">{{ i+1 }}</span>{{ leg.mode }} · {{ leg.carryForm }}</strong><van-icon :name="expandedLeg===leg.id?'arrow-up':'arrow-down'"/></button>
            <p class="cq-route">{{ nodeLabel(source,leg.from) }} → {{ nodeLabel(source,leg.to) }}</p><p v-if="flowSummary(source,form,i)" class="cq-muted">承运货品：{{ flowSummary(source,form,i) }}</p>
            <QuoteFeeFields v-if="expandedLeg===leg.id" :source="source" :form="form" :fee="leg" :index="i" :error="errors[leg.id]" @extra="editExtra"/>
            <template v-else><div class="cq-between"><span>运输费</span><b class="cq-blue">¥{{ money(transportAmount(source,form,leg,i)) }}</b></div><p v-for="extra in leg.extraFees" :key="extra.id" class="cq-between cq-muted"><span>{{ extra.type }} · {{ extra.name }}</span><span>{{ extraAmount(extra)<0?'−':'＋' }}¥{{ money(Math.abs(extraAmount(extra))) }}</span></p><p v-if="errors[leg.id]" class="cq-error" role="alert">{{ errors[leg.id] }}</p></template>
          </section>
        </template>
        <section class="cq-card cq-between"><span>运输费 ¥{{ money(sum.transport) }}</span><span>其他费用 {{ sum.extra<0?'−':'＋' }}¥{{ money(Math.abs(sum.extra)) }}</span></section>
        <section class="cq-card"><h2>服务承诺</h2><fieldset :data-error="errors.delivery?'true':undefined"><legend>配送方式 <em>*</em><small>至少一种，可多选</small></legend><div class="cq-grid"><label v-for="option in deliveries" :key="option" class="cq-choice" :class="{selected:form.delivery.includes(option)}"><input v-model="form.delivery" type="checkbox" :value="option"/>{{ option }}</label></div><p v-if="errors.delivery" class="cq-error" role="alert">{{ errors.delivery }}</p></fieldset>
          <button class="cq-accordion cq-divider" :aria-expanded="servicesOpen" @click="servicesOpen=!servicesOpen"><strong>增值服务 <small>选填</small></strong><span>{{ form.valueAdd.length?`已选${form.valueAdd.length}项`:'' }} <van-icon :name="servicesOpen?'arrow-up':'arrow-down'"/></span></button><div v-if="servicesOpen" class="cq-grid"><label v-for="option in valueServices" :key="option" class="cq-choice" :class="{selected:form.valueAdd.includes(option)}"><input v-model="form.valueAdd" type="checkbox" :value="option"/>{{ option }}</label></div><p v-else-if="form.valueAdd.length" class="cq-muted">{{ form.valueAdd.join('、') }}</p>
        </section>
        <section class="cq-card" :data-error="errors.outline?'true':undefined"><label class="cq-heading">方案概述 <em>*</em><textarea v-model="form.outline" maxlength="500" rows="4" placeholder="补充服务范围、特殊说明等"/></label><p class="cq-muted cq-character-count">{{ form.outline.length }}/500</p><p v-if="errors.outline" class="cq-error" role="alert">{{ errors.outline }}</p></section>
        <section class="cq-card" :data-error="errors.contactName||errors.contactPhone?'true':undefined"><button class="cq-accordion" :aria-expanded="contactsOpen" @click="contactsOpen=!contactsOpen"><strong>报价联系人</strong><van-icon :name="contactsOpen?'arrow-up':'arrow-down'"/></button><p class="cq-muted">{{ form.company }} · {{ form.contactName }} · {{ form.contactPhone }}</p><template v-if="contactsOpen"><label>报价企业<input :value="form.company" readonly/></label><label>联系人 <em>*</em><input v-model="form.contactName" maxlength="50" autocomplete="name"/></label><p v-if="errors.contactName" class="cq-error" role="alert">{{ errors.contactName }}</p><label>联系电话 <em>*</em><input v-model="form.contactPhone" type="tel" maxlength="25" autocomplete="tel"/></label><p v-if="errors.contactPhone" class="cq-error" role="alert">{{ errors.contactPhone }}</p></template></section>
        <p v-if="errors.total" class="cq-error" role="alert">{{ errors.total }}</p>
      </template>

      <template v-else>
        <template v-if="legacy"><section class="cq-card"><h2>报价金额</h2><strong class="cq-total">¥{{ money(existing.amount) }} {{ existing.unit }}</strong></section></template>
        <template v-else>
          <QuoteSummary :source="source" :form="form" :editable="!viewing" @edit="go" @contacts="contactsOpen=true;go(2)"/>
        </template>
        <p v-if="viewing" class="cq-muted">提交时间：{{ new Date(existing.submittedAt).toLocaleString('zh-CN') }}</p>
      </template>
    </main>
    <footer class="cq-footer">
      <template v-if="viewing"><strong class="cq-total">¥{{ money(existing.amount) }}</strong><button class="cq-primary" @click="$emit('close')">返回货源详情</button></template>
      <button v-else-if="step===1" class="cq-primary cq-full" @click="next">下一步，填写费用</button>
      <template v-else><div class="cq-footer-total"><small>报价合计</small><strong>¥{{ money(sum.total) }}</strong></div><button v-if="step===2" class="cq-secondary" @click="go(1)">上一步</button><button class="cq-primary" :disabled="submitting" @click="step===2?next():submit()">{{ submitting?'提交中…':step===2?'核对报价':'提交报价' }}</button></template>
    </footer>

    <div v-if="modal" class="cq-modal" :class="{'cq-modal-sheet':modal==='extra','cq-modal-confirm':modal==='confirm'}" @click.self="closeModal">
      <section ref="dialog" class="cq-dialog" role="dialog" aria-modal="true" :aria-label="modalTitle" tabindex="-1" @keydown.tab="trapFocus">
        <header class="cq-nav"><button class="cq-icon-button" aria-label="关闭" @click="back"><van-icon :name="['confirm','extra'].includes(modal)?'cross':'arrow-left'"/></button><h2>{{ modalTitle }}</h2><span class="cq-nav-space"></span></header>
        <div class="cq-dialog-scroll">
          <template v-if="modal==='channel'">
            <p class="cq-muted">先选择运输通道，再选择通道内的运输方案</p>
            <button v-for="channel in channels" :key="channel" class="cq-card cq-channel" @click="chooseChannel(channel)"><span><strong>{{ channel }}</strong><small>{{ form.transportMode }} · {{ schemes.filter(item=>item.enabled&&item.channel===channel&&item.form.transportMode===form.transportMode).length }}个方案</small></span><van-icon name="arrow"/></button>
            <p v-if="!channels.length" class="cq-empty">暂无可引用的通道，可返回自行编排路线</p>
          </template>
          <template v-else-if="modal==='scheme'">
            <div class="cq-card cq-between"><strong>{{ channelFilter }}</strong><button class="cq-link" @click="openModal('channel')">更换通道</button></div>
            <label>方案名称<input v-model="search" placeholder="搜索当前通道内的方案" @input="page=1"/></label><p class="cq-muted">当前运输方式：{{ form.transportMode }}</p>
            <article v-for="scheme in shownSchemes" :key="scheme.id" class="cq-scheme" :class="{chosen:chosenScheme===scheme.id}"><button class="cq-scheme-select" :aria-pressed="chosenScheme===scheme.id" @click="chosenScheme=scheme.id"><van-icon :name="chosenScheme===scheme.id?'checked':'circle'"/><strong>{{ scheme.name }}</strong></button><p>来源通道：{{ scheme.channel }}</p><p class="cq-muted">{{ scheme.form.segments.map(leg=>leg.mode).join('＋') }} · {{ scheme.form.quoteMode }}</p><p class="cq-route">{{ routeNodes(scheme.form).map(id=>nodeLabel(source,id)).join(' → ') }}</p><p class="cq-between"><span>参考运输费</span><b class="cq-blue">¥{{ money(totals(source,scheme.form).transport) }}</b></p><p class="cq-muted">服务：{{ [...scheme.form.delivery,...scheme.form.valueAdd].join('、') }}<br/>时效：{{ scheme.form.segments.map(leg=>leg.duration).join('＋') }}<br/>更新：{{ scheme.updatedAt }}</p><button class="cq-link" @click="schemeDetail=scheme;openModal('schemeDetail')">查看详情 ›</button></article>
            <p v-if="!filteredSchemes.length" class="cq-empty">没有符合条件的方案，可调整筛选或自行编排</p><button v-if="shownSchemes.length<filteredSchemes.length" class="cq-add" @click="page++">加载更多方案</button><p class="cq-muted">引用后可修改，不影响原运输方案。</p>
          </template>
          <template v-else-if="modal==='schemeDetail' && schemeDetail"><section class="cq-card"><h3>{{ schemeDetail.name }}</h3><p class="cq-muted">{{ schemeDetail.channel }}</p></section><QuoteSummary :source="source" :form="schemeDetail.form" :include-contacts="false"/></template>
          <template v-else-if="modal==='leg'">
            <p v-if="inserting" class="cq-muted">选择中转点，将当前路段拆成两段</p>
            <label>运输方式<select v-model="legDraft.mode"><option>公路</option><option>铁路</option><option>水路</option></select></label><label>运输类型<select v-model="legDraft.carryForm"><option>散货运输</option><option>集装箱运输</option></select></label>
            <template v-if="inserting"><p>原路段：{{ nodeLabel(source,legDraft.from) }} → {{ nodeLabel(source,legDraft.to) }}</p><label>中转点<select v-model="middle"><option value="" disabled>请选择中转点</option><option v-for="node in commonAddresses.filter(n=>n.id!==legDraft.from&&n.id!==legDraft.to)" :key="node.id" :value="node.id">{{ node.name }}</option></select></label></template>
            <template v-else><label>起点<select v-model="legDraft.from"><option v-for="node in addressOptions" :key="node.id" :value="node.id">{{ node.common?'中转｜':node.type+'｜' }}{{ node.name }}</option></select></label><label>终点<select v-model="legDraft.to"><option v-for="node in addressOptions" :key="node.id" :value="node.id">{{ node.common?'中转｜':node.type+'｜' }}{{ node.name }}</option></select></label></template>
            <label>时效（选填）<input v-model="legDraft.duration" maxlength="30" placeholder="填写本路段时效"/></label><p class="cq-muted">保存后校验整条路线，并重新计算各段承运货品。</p><p v-if="modalError" class="cq-error" role="alert">{{ modalError }}</p>
          </template>
          <template v-else-if="modal==='extra'"><label>费用类型<select v-model="extraDraft.type"><option>增项</option><option>减项</option></select></label><label>费用名称 <em>*</em><input v-model="extraDraft.name" maxlength="80"/></label><label>基数 <em>*</em><input v-model="extraDraft.base" type="number" min="0.01" step="0.01" inputmode="decimal"/></label><label>单价（元） <em>*</em><input v-model="extraDraft.unitPrice" type="number" min="0" step="0.01" inputmode="decimal"/></label><p class="cq-amount">金额 {{ extraDraft.type==='减项'?'−':'＋' }}¥{{ money(Math.abs(extraAmount(extraDraft))) }}</p><p v-if="modalError" class="cq-error" role="alert">{{ modalError }}</p></template>
          <template v-else-if="modal==='confirm'"><p class="cq-confirm-text">{{ confirmText }}</p></template>
          <template v-else-if="modal==='source'"><h3>{{ cargo.number }}</h3><p>{{ cargo.goods }} · {{ cargo.quantity }}</p><article v-for="node in source.nodes" :key="node.id" class="cq-leg"><strong>{{ node.type }}｜{{ node.name }}</strong><p>{{ node.address }}</p></article><p>可报价方式：{{ source.availableModes.join('、') }}</p><p>报价截止：{{ cargo.deadline }}</p><p v-if="cargo.summary">备注：{{ cargo.summary }}</p><p v-for="row in cargoPublishedRequirements(cargo)" :key="row[0]">{{ row[0] }}：{{ row[1] }}</p></template>
        </div>
        <footer class="cq-dialog-footer"><button v-if="modal==='scheme'" class="cq-primary cq-full" :disabled="!chosenScheme" @click="importChosen">确认引用</button><button v-else-if="modal==='schemeDetail'" class="cq-primary cq-full" @click="chosenScheme=schemeDetail.id;openModal('scheme')">选择此方案</button><button v-else-if="modal==='leg'" class="cq-primary cq-full" @click="saveLeg">保存路段</button><button v-else-if="modal==='extra'" class="cq-primary cq-full" @click="saveExtra">保存费用项</button><template v-else-if="modal==='confirm'"><button class="cq-secondary" @click="closeModal">取消</button><button class="cq-primary" @click="runConfirm">确认</button></template><button v-else class="cq-primary cq-full" @click="closeModal">返回报价</button></footer>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { showToast } from 'vant'
import QuoteFeeFields from './QuoteFeeFields.vue'
import QuoteSummary from './QuoteSummary.vue'
import { cargoPublishedRequirements } from './cargo-data.js'
import { cargoStore, saveCargoQuote } from './cargo-store.js'
import { availableSchemes, commonAddresses, copy, createQuoteForm, deliveries, extraAmount, feeErrors, feeQuantity, flowSummary, money, newFee, newLeg, nodeLabel, quoteSource, routeErrors, routeNodes, totals, transportAmount, valueServices } from './cargo-quote-model.js'
const props=defineProps({cargo:{type:Object,required:true},existing:Object,teleport:Object})
const emit=defineEmits(['close'])
const viewing=!!props.existing, legacy=viewing&&!props.existing.snapshot
const source=props.existing?.snapshot?.source?copy(props.existing.snapshot.source):quoteSource(props.cargo)
const form=ref(props.existing?.snapshot?.form?copy(props.existing.snapshot.form):createQuoteForm(source))
const root=ref(null),scroll=ref(null),dialog=ref(null),step=ref(viewing?3:1),modal=ref(''),errors=ref({}),submitting=ref(false)
const steps=['运输安排','费用与服务','核对报价'],servicesOpen=ref(false),contactsOpen=ref(false),expandedLeg=ref(form.value.segments[0]?.id)
const sum=computed(()=>totals(source,form.value)),isMulti=computed(()=>form.value.transportMode==='多式联运'),routeProblems=computed(()=>routeErrors(source,form.value)),addressOptions=[...source.nodes,...commonAddresses]
const schemes=availableSchemes(source),search=ref(''),channelFilter=ref(''),page=ref(1),chosenScheme=ref(''),schemeDetail=ref(null)
const filteredSchemes=computed(()=>schemes.filter(item=>item.enabled&&item.form.transportMode===form.value.transportMode&&item.channel===channelFilter.value&&item.name.includes(search.value.trim())))
const shownSchemes=computed(()=>filteredSchemes.value.slice(0,page.value*3)),channels=computed(()=>[...new Set(schemes.filter(item=>item.enabled&&item.form.transportMode===form.value.transportMode).map(item=>item.channel))])
const legDraft=ref({}),legIndex=ref(0),inserting=ref(false),middle=ref(''),extraDraft=ref({}),modalError=ref(''),confirmText=ref('')
let extraTarget=null,confirmAction=null,returnFocus=null
const modalTitle=computed(()=>({channel:'选择运输通道',scheme:'选择运输方案',schemeDetail:'方案详情',leg:inserting.value?'添加中转路段':'编辑路段',extra:'其他费用',confirm:'确认修改',source:'托运要求'}[modal.value]||''))
function toast(message){showToast({message,teleport:props.teleport})}
function go(value){step.value=value;nextTick(()=>{if(scroll.value)scroll.value.scrollTop=0})}
function openModal(type){if(!modal.value)returnFocus=document.activeElement;modal.value=type;modalError.value='';nextTick(()=>dialog.value?.focus())}
function closeModal(){modal.value='';nextTick(()=>returnFocus?.focus?.())}
function back(){if(submitting.value)return;if(modal.value){if(modal.value==='schemeDetail')openModal('scheme');else if(modal.value==='scheme')openModal('channel');else closeModal();return}if(viewing||step.value===1)emit('close');else go(step.value-1)}
function trapFocus(event){const items=dialog.value.querySelectorAll('button:not(:disabled),input,select,textarea,[tabindex="0"]');if(!items.length)return;const first=items[0],last=items[items.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.value)){event.preventDefault();last.focus()}else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog.value)){event.preventDefault();first.focus()}}
function confirm(text,action){confirmText.value=text;confirmAction=action;openModal('confirm')}
function runConfirm(){const action=confirmAction;closeModal();confirmAction=null;action?.()}
function changeMode(mode){if(mode===form.value.transportMode)return;confirm('切换运输方式将清空引用方案、路线、费用与服务配置，联系人保留。是否继续？',()=>{const old=form.value;form.value={...createQuoteForm(source,mode),contactName:old.contactName,contactPhone:old.contactPhone};expandedLeg.value=form.value.segments[0]?.id;errors.value={};toast('已切换运输方式，请重新配置')})}
function resetFees(){form.value.whole=newFee(source);form.value.segments=form.value.segments.map(leg=>({...leg,...newFee(source,leg.carryForm)}));errors.value={};expandedLeg.value=form.value.segments[0]?.id}
function changeQuoteMode(mode){if(mode===form.value.quoteMode)return;confirm('切换报价模式会清空当前运输单价与其他费用，路线、服务及联系人保留。是否继续？',()=>{resetFees();form.value.quoteMode=mode;toast('已切换报价模式，费用已重置')})}
function openSchemes(){search.value='';page.value=1;chosenScheme.value=form.value.schemeId;openModal('channel')}
function chooseChannel(channel){channelFilter.value=channel;search.value='';page.value=1;if(!schemes.some(item=>item.id===chosenScheme.value&&item.channel===channel))chosenScheme.value='';openModal('scheme')}
function hasArrangement(){
  const current=form.value, initial=createQuoteForm(source,current.transportMode)
  const routeKey=list=>JSON.stringify(list.map(({from,to,mode,carryForm,duration})=>({from,to,mode,carryForm,duration})))
  return !!(current.schemeId||hasFees()||current.outline.trim()||current.delivery.length||current.valueAdd.length||routeKey(current.segments)!==routeKey(initial.segments))
}
function importChosen(){
  const scheme=schemes.find(item=>item.id===chosenScheme.value);if(!scheme||scheme.channel!==channelFilter.value||scheme.form.transportMode!==form.value.transportMode)return
  const apply=()=>{const contacts={contactName:form.value.contactName,contactPhone:form.value.contactPhone};form.value={...copy(scheme.form),...contacts};expandedLeg.value=form.value.segments[0]?.id;errors.value={};closeModal();go(1);toast('已引用方案，可继续调整')}
  if(hasArrangement())confirm('引用此方案将替换已填写的路线、费用和服务，联系人保留。是否继续？',apply);else apply()
}
function editLeg(index){legIndex.value=index;inserting.value=false;legDraft.value=copy(form.value.segments[index]);openModal('leg')}
function insertLeg(index){legIndex.value=index;inserting.value=true;middle.value='';legDraft.value=copy(form.value.segments[index]);openModal('leg')}
function saveLeg(){
  const index=legIndex.value,old=form.value.segments[index],draft=legDraft.value
  if(inserting.value){if(!middle.value){modalError.value='请选择中转点';return}}
  else if(!draft.from||!draft.to||draft.from===draft.to){modalError.value='请选择不同的起终点';return}
  const apply=()=>{
    if(inserting.value){const first={...copy(old),...draft,to:middle.value,...newFee(source,draft.carryForm)};const second={...newLeg(source,middle.value,old.to,old.mode),...newFee(source,old.carryForm)};form.value.segments.splice(index,1,first,second)}
    else {form.value.segments[index]={...draft,...newFee(source,draft.carryForm)};if(index>0)form.value.segments[index-1].to=draft.from;if(index<form.value.segments.length-1)form.value.segments[index+1].from=draft.to}
    resetFees();closeModal();toast('路线已更新，费用已重置，请核对承运范围')
  }
  if(hasFees())confirm('修改路段将重新计算货量，并清空当前费用。是否继续？',apply);else apply()
}
function hasFees(){return [form.value.whole,...form.value.segments].some(fee=>fee.unitPrice!==''||fee.boxes.some(box=>box.unitPrice!=='')||fee.extraFees.length)}
function changeRoute(action){if(hasFees())confirm('调整路线会重新计算货量并清空当前费用。是否继续？',()=>{action();resetFees()});else{action();resetFees()}}
function moveLeg(index,dir){const target=index+dir;if(target<0||target>=form.value.segments.length)return;changeRoute(()=>{const list=form.value.segments;[list[index],list[target]]=[list[target],list[index]];for(let i=1;i<list.length;i++)list[i].from=list[i-1].to})}
function removeLeg(index){if(form.value.segments.length<=1)return;changeRoute(()=>{const list=form.value.segments,old=list[index];list.splice(index,1);if(index>0)list[index-1].to=old.to;else list[0].from=old.from})}
function editExtra({fee,extra}){extraTarget=fee;extraDraft.value=extra?copy(extra):{id:crypto.randomUUID(),type:'增项',name:'',base:1,unitPrice:''};openModal('extra')}
function saveExtra(){const extra=extraDraft.value;const price=Number(extra.unitPrice),base=Number(extra.base);if(!extra.name.trim()||extra.unitPrice===''||!Number.isFinite(price)||price<0||price>100000000||Math.abs(price*100-Math.round(price*100))>.00001||!Number.isFinite(base)||base<=0||base>100000000){modalError.value='请填写费用名称、有效基数和单价（最多两位小数）';return}const index=extraTarget.extraFees.findIndex(item=>item.id===extra.id);if(index<0)extraTarget.extraFees.push(copy(extra));else extraTarget.extraFees[index]=copy(extra);closeModal()}

async function checkFees(){errors.value=feeErrors(source,form.value);const key=Object.keys(errors.value)[0];if(!key)return true;if(['contactName','contactPhone'].includes(key))contactsOpen.value=true;if(form.value.segments.some(leg=>leg.id===key))expandedLeg.value=key;await nextTick();scroll.value?.querySelector('[data-error="true"]')?.scrollIntoView({block:'center',behavior:'smooth'});toast('请检查标红的内容');return false}
async function next(){if(routeProblems.value.length){toast(routeProblems.value[0]);go(1);return}if(step.value===1){go(2);return}if(await checkFees())go(3)}
async function submit(){if(submitting.value||viewing)return;if(routeProblems.value.length){go(1);toast(routeProblems.value[0]);return}if(!(await checkFees())){go(2);return}submitting.value=true;await new Promise(resolve=>setTimeout(resolve,350));const snapshot=copy({version:2,source,form:form.value});const success=saveCargoQuote({cargoId:props.cargo.id,amount:sum.value.total,unit:'元/票',fees:form.value.outline,duration:form.value.segments.map(leg=>leg.duration).filter(Boolean).join('＋'),snapshot});submitting.value=false;if(success){toast(cargoStore.storageError?'报价已保存，当前仅在本次会话有效':'报价已保存');emit('close')}else toast('报价未保存，请检查费用与路线')}
watch(modal,value=>{if(root.value)for(const element of root.value.children)if(!element.classList.contains('cq-modal'))element.inert=!!value})
onMounted(()=>root.value?.querySelector('.cq-nav button')?.focus())
</script>
<style src="./cargo-quote.css"></style>
