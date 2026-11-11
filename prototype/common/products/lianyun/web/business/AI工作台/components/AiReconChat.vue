<script setup>
/** 左侧保留一问一答历史，当前步骤负责范围选择与计费确认。 */
import { computed, nextTick, ref, watch } from 'vue'
import AiStatementDownload from './AiStatementDownload.vue'
import { money, SETTLEMENT } from '../recon-data'
const props = defineProps({ phase: String, basis: String, comparison: Boolean, diffOnly: Boolean, messages: Array, assistantText: String, plans: Array, selectedIds: Array, draft: Object, differences: Object, exportBusy: Boolean, exportFile: Object, exportOptions: Array, exportError: Boolean })
const emit = defineEmits(['select-plans', 'confirm-scope', 'choose-basis', 'compare', 'toggle-diff', 'scope', 'question', 'export', 'select-template', 'download', 'templates'])
const scrollEl = ref(null)
const draftText = ref('')
const allSelected = computed(() => props.selectedIds.length === props.plans.length)
function togglePlan(id, checked) { emit('select-plans', checked ? [...props.selectedIds, id] : props.selectedIds.filter(value => value !== id)) }
function keydown(event) { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); send() } }
function send() { const text = draftText.value.trim(); if (text) { draftText.value = ''; emit('question', text) } }
watch(() => [props.phase, props.messages.length, props.assistantText, props.exportFile], async () => { await nextTick(); if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight })
</script>
<template>
  <aside class="rc-chat" aria-label="至小简运输结算对话">
    <header class="rc-chat-head">
      <div class="rc-chat-title"><h2>运输结算</h2><p>选择计划 · 确认计费 · 核对提交</p></div>
    </header>
    <div ref="scrollEl" class="rc-chat-scroll">
      <div class="rc-chat-stream">
        <div v-for="(message, index) in messages" :key="index" class="rc-msg" :class="message.role === 'user' ? 'user' : 'ai'">
          <div v-if="message.role === 'user'" class="rc-user-bubble">{{ message.text }}</div>
          <template v-else><span class="ai-response-avatar rc-avatar"><img src="/ai-workbench-assets/assistant-avatar.svg" alt="至小简" /></span><div class="rc-msg-body"><p class="rc-line">{{ message.text }}</p><AiStatementDownload v-if="message.file" :file="message.file" @download="emit('download', $event)" @template="emit('templates', $event)" /></div></template>
        </div>
        <div class="rc-msg ai">
          <span class="ai-response-avatar rc-avatar"><img src="/ai-workbench-assets/assistant-avatar.svg" alt="至小简" /></span>
          <div class="rc-msg-body">
            <p class="rc-line" :class="{ 'rc-running': phase === 'loading' }"><i v-if="phase === 'loading'" />{{ assistantText }}</p>
            <template v-if="phase === 'scope'">
              <p class="rc-muted">{{ SETTLEMENT.party }} · 2026 年 10 月 · 演示数据</p>
              <label class="rc-select-all"><input type="checkbox" :checked="allSelected" @change="emit('select-plans', $event.target.checked ? plans.map(plan => plan.id) : [])" />全部计划<span>{{ selectedIds.length }}/{{ plans.length }}</span></label>
              <div class="rc-plan-options">
                <label v-for="plan in plans" :key="plan.id" class="rc-plan-option" :class="{ selected: selectedIds.includes(plan.id) }">
                  <input type="checkbox" :aria-label="`选择计划 ${plan.number}`" :checked="selectedIds.includes(plan.id)" @change="togglePlan(plan.id, $event.target.checked)" />
                  <div class="rc-plan-info"><div class="rc-plan-heading"><strong>{{ plan.name }}</strong><small>{{ plan.number }}</small></div><p>{{ plan.route }}</p><dl class="rc-plan-metrics"><div><dt>可结算运单</dt><dd>{{ plan.count }} 条</dd></div><div><dt>装货量</dt><dd>{{ plan.load.toFixed(2) }} 吨</dd></div><div><dt>卸货量</dt><dd>{{ plan.unload.toFixed(2) }} 吨</dd></div></dl></div>
                </label>
              </div>
              <div class="rc-selection-footer"><p class="rc-selection-summary">已选 {{ selectedIds.length }} 个计划 · {{ draft.count }} 条运单<br />装 {{ draft.totalLoad.toFixed(2) }} 吨 · 卸 {{ draft.totalUnload.toFixed(2) }} 吨</p>
              <button class="rc-btn primary rc-full-button" type="button" :disabled="!selectedIds.length" @click="emit('confirm-scope')">结算选中计划（{{ draft.count }} 条）</button></div>
            </template>
            <template v-else-if="phase === 'review'">
              <dl class="rc-evidence"><div><dt>计费依据</dt><dd>卸货重量</dd></div><div><dt>合同单价</dt><dd>150 元/吨</dd></div><div><dt>计价量</dt><dd>{{ draft.weight.toFixed(2) }} 吨</dd></div><div><dt>路耗扣减</dt><dd>{{ money(draft.loss) }}</dd></div><div><dt>预估金额</dt><dd>{{ money(draft.total) }}</dd></div></dl>
              <div class="rc-actions"><button class="rc-btn primary" type="button" @click="emit('choose-basis', 'ours')">采用计划计费规则</button></div>
              <div class="rc-subactions"><button type="button" @click="emit('scope')">调整计划范围</button><button type="button" @click="emit('compare')">使用示例对账单</button></div>
            </template>
            <template v-else-if="phase === 'compare'">
              <dl class="rc-evidence"><div><dt>重量差</dt><dd>{{ differences.weight }} 条</dd></div><div><dt>单价差</dt><dd>{{ differences.price }} 条</dd></div><div><dt>重复记录</dt><dd>{{ differences.duplicate }} 条，不计入</dd></div></dl>
              <div class="rc-actions"><button class="rc-btn primary" type="button" @click="emit('choose-basis', 'ours')">按我方数据核算</button><button class="rc-btn" type="button" @click="emit('choose-basis', 'theirs')">按对账单数据核算</button></div>
            </template>
            <template v-else-if="phase === 'draft'">
              <dl class="rc-evidence"><div><dt>选中计划</dt><dd>{{ selectedIds.length }} 个</dd></div><div><dt>核算运单</dt><dd>{{ draft.count }} 条</dd></div><div><dt>结算金额</dt><dd class="strong">{{ money(draft.total) }}</dd></div></dl>
              <div class="rc-subactions"><button type="button" @click="emit('scope')">调整计划范围</button></div>
            </template>
            <template v-else-if="phase === 'done'">
              <AiStatementDownload v-if="exportFile" :file="exportFile" @download="emit('download', $event)" @template="emit('templates', $event)" />
              <div v-if="exportOptions?.length" class="rc-template-options"><button v-for="item in exportOptions" :key="item.id" type="button" :disabled="exportBusy" @click="emit('select-template', item)"><strong>{{ item.name }}</strong><span>{{ item.version }} · {{ item.direction === '托运方' ? '货主对账' : '承运方对账' }}<small v-if="item.example"> · 示例</small></span><b aria-hidden="true">›</b></button></div>
              <div v-if="!exportFile && !exportOptions?.length" class="rc-actions"><button class="rc-btn primary" type="button" :disabled="exportBusy" @click="emit('export')">{{ exportBusy ? '正在生成…' : exportError ? '重试导出' : '按模板导出对账单' }}</button></div>
              <div v-if="!exportFile" class="rc-subactions"><button type="button" @click="emit('templates')">查看知识库模板</button></div>
            </template>
            <div v-if="comparison && ['compare', 'draft'].includes(phase)" class="rc-subactions"><button type="button" @click="emit('toggle-diff')">{{ diffOnly ? '显示全部运单' : '仅看差异运单' }}</button></div>
          </div>
        </div>
      </div>
    </div>
    <form class="rc-composer" :class="{ 'is-expanded': draftText.length > 80 }" @submit.prevent="send"><textarea v-model="draftText" rows="2" aria-label="结算对话输入" placeholder="补充结算要求，或使用上方选项继续…" :disabled="phase === 'loading' || exportBusy" @keydown="keydown" /><div class="rc-composer-footer"><span>Enter 发送 · Shift + Enter 换行</span><button class="rc-send" type="submit" aria-label="发送结算消息" title="发送" :disabled="!draftText.trim() || phase === 'loading' || exportBusy"><img src="/ai-workbench-assets/send.svg" alt="" width="14" height="16" /></button></div></form>
  </aside>
</template>
