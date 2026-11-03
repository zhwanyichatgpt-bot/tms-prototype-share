<template>
  <div class="cq-summary">
    <section class="cq-receipt" aria-label="报价运输明细">
      <article v-for="(leg, index) in form.segments" :key="leg.id" class="cq-receipt-leg">
        <div class="cq-tags">
          <span class="cq-mode-badge" :class="'cq-mode-' + leg.mode"><i class="cq-transport-glyph" aria-hidden="true"/>{{ modeLabel(leg.mode) }}</span>
          <span class="cq-tag">{{ leg.carryForm === '散货运输' ? '散杂货运输' : leg.carryForm }}</span>
        </div>
        <h3>{{ label(leg.from) }} → {{ label(leg.to) }}</h3>
        <template v-if="feeFor(leg)">
          <div class="cq-receipt-charge"><span>{{ feeDescription(feeFor(leg), feeIndex(index)) }}</span><b>¥{{ money(transportAmount(source, form, feeFor(leg), feeIndex(index))) }}</b></div>
          <div v-for="extra in feeFor(leg).extraFees" :key="extra.id" class="cq-receipt-charge"><span>{{ extra.type }} · {{ extra.name }} · {{ extra.base }}×{{ money(extra.unitPrice) }}元</span><b>{{ extra.type === '减项' ? '−' : '＋' }}¥{{ money(Math.abs(extraAmount(extra))) }}</b></div>
        </template>
      </article>
      <article v-if="form.quoteMode === '整票报价' && form.segments.length > 1" class="cq-receipt-leg">
        <h3>整票运输费用</h3>
        <div class="cq-receipt-charge"><span>{{ feeDescription(form.whole, null) }}</span><b>¥{{ money(sum.transport) }}</b></div>
        <div v-for="extra in form.whole.extraFees" :key="extra.id" class="cq-receipt-charge"><span>{{ extra.type }} · {{ extra.name }} · {{ extra.base }}×{{ money(extra.unitPrice) }}元</span><b>{{ extra.type === '减项' ? '−' : '＋' }}¥{{ money(Math.abs(extraAmount(extra))) }}</b></div>
      </article>
    </section>
    <section class="cq-card cq-summary-card cq-summary-totals" aria-label="报价汇总">
      <dl class="cq-facts"><dt>运输费合计</dt><dd>¥ {{ money(sum.transport) }}</dd><dt>增项费用</dt><dd>+ ¥ {{ money(sum.additions) }}</dd><dt>减项费用</dt><dd>- ¥ {{ money(sum.deductions) }}</dd><dt>报价合计</dt><dd class="cq-blue">¥ {{ money(sum.total) }}</dd></dl>
    </section>
    <section class="cq-card cq-summary-card" aria-label="配送与增值服务"><dl class="cq-facts"><dt>配送方式</dt><dd>{{ form.delivery.join('、') || '未选择' }}</dd><dt>增值服务</dt><dd>{{ form.valueAdd.join('、') || '未选择' }}</dd></dl></section>
    <section v-if="includeContacts" class="cq-card cq-summary-card" aria-label="报价联系信息"><dl class="cq-facts"><dt>报价企业</dt><dd>{{ form.company }}</dd><dt>报价联系人</dt><dd>{{ form.contactName }}（{{ maskedPhone }}）</dd></dl></section>
    <section class="cq-card cq-summary-card" aria-label="方案概述"><dl class="cq-facts"><dt>方案概述</dt><dd class="cq-outline">{{ form.outline || '未填写' }}</dd></dl></section>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { extraAmount, feeQuantity, money, nodeLabel, totals, transportAmount } from './cargo-quote-model.js'
const props = defineProps({ source: { type: Object, required: true }, form: { type: Object, required: true }, includeContacts: { type: Boolean, default: true } })
const sum = computed(() => totals(props.source, props.form))
const maskedPhone = computed(() => String(props.form.contactPhone || '').replace(/^(1\d{2})\d{4}(\d{4})$/, '$1****$2'))
function modeLabel(mode) { return { 公路: '汽运', 铁路: '铁运', 水路: '水运' }[mode] || mode }
function label(id) { return nodeLabel(props.source, id).replace(/^(装货|卸货)｜/, '') }
function feeFor(leg) { return props.form.quoteMode === '分段报价' ? leg : props.form.segments.length === 1 ? props.form.whole : null }
function feeIndex(index) { return props.form.quoteMode === '分段报价' ? index : null }
function feeDescription(fee, index) {
  if (fee.carryForm === '集装箱运输') return fee.boxes.map(box => `按集装箱 · ${box.size}${box.boxType} · ${box.quantity}箱×${money(box.unitPrice)}元`).join('；')
  return `${fee.billingDimension} · ${fee.billingBasis} · ${feeQuantity(props.source, props.form, fee, index).label}×${money(fee.unitPrice)}元`
}
</script>
