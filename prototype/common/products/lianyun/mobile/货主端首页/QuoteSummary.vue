<template>
  <div class="cq-summary">
          <section class="cq-card"><div class="cq-between"><h2>运输安排</h2><button v-if="editable" class="cq-link" @click="$emit('edit',1)">修改 ›</button></div><p>运输方式：{{ form.transportMode }}</p><p v-if="form.schemeName">引用方案：{{ form.schemeName }}</p><article v-for="(leg,i) in form.segments" :key="leg.id" class="cq-leg"><h3><span class="cq-number">{{ i+1 }}</span>{{ leg.mode }} · {{ leg.carryForm }}</h3><p class="cq-route">{{ nodeLabel(source,leg.from) }} → {{ nodeLabel(source,leg.to) }}</p><p v-if="flowSummary(source,form,i)" class="cq-muted">承运货品：{{ flowSummary(source,form,i) }}</p><p v-if="leg.duration" class="cq-muted">时效：{{ leg.duration }}</p></article></section>
          <section class="cq-card"><div class="cq-between"><h2>费用明细</h2><button v-if="editable" class="cq-link" @click="$emit('edit',2)">修改 ›</button></div><strong class="cq-badge">{{ form.quoteMode }}</strong>
            <article v-for="(fee,i) in form.quoteMode==='整票报价'?[form.whole]:form.segments" :key="fee.id||'whole'" class="cq-leg"><h3>{{ form.quoteMode==='整票报价'?'整票运输':`路段${i+1} · ${fee.mode}` }}</h3><template v-if="fee.carryForm==='集装箱运输'"><p v-for="box in fee.boxes" :key="box.id" class="cq-between"><span>{{ box.size }}{{ box.boxType }} · {{ box.cargoName }}<small>{{ box.quantity }}箱 × {{ box.unitPrice }}元/箱</small></span><b>¥{{ money(Number(box.quantity)*Number(box.unitPrice)) }}</b></p></template><p v-else class="cq-muted">{{ fee.billingDimension }} · {{ fee.billingBasis }} · {{ feeQuantity(source,form,fee,form.quoteMode==='整票报价'?null:i).label }} × {{ fee.unitPrice }}元</p><p class="cq-between"><span>运输费</span><b>¥{{ money(transportAmount(source,form,fee,form.quoteMode==='整票报价'?null:i)) }}</b></p><p v-for="extra in fee.extraFees" :key="extra.id" class="cq-between"><span>{{ extra.name }}（{{ extra.type }}）<small>{{ extra.base }} × {{ extra.unitPrice }}元</small></span><b>{{ extraAmount(extra)<0?'−':'＋' }}¥{{ money(Math.abs(extraAmount(extra))) }}</b></p></article>
            <dl class="cq-facts"><dt>运输费合计</dt><dd>¥{{ money(sum.transport) }}</dd><dt>增项费用</dt><dd>＋¥{{ money(sum.additions) }}</dd><dt>减项费用</dt><dd>−¥{{ money(sum.deductions) }}</dd><dt>报价总额</dt><dd class="cq-total">¥{{ money(sum.total) }}</dd></dl>
          </section>
          <section class="cq-card"><div class="cq-between"><h2>服务承诺</h2><button v-if="editable" class="cq-link" @click="$emit('edit',2)">修改 ›</button></div><dl class="cq-facts"><dt>配送方式</dt><dd>{{ form.delivery.join('、') }}</dd><dt>增值服务</dt><dd>{{ form.valueAdd.join('、')||'未选择' }}</dd></dl><h3>方案概述</h3><p class="cq-outline">{{ form.outline }}</p></section>
          <section v-if="includeContacts" class="cq-card"><div class="cq-between"><h2>报价信息</h2><button v-if="editable" class="cq-link" @click="$emit('contacts')">修改 ›</button></div><dl class="cq-facts"><dt>报价企业</dt><dd>{{ form.company }}</dd><dt>联系人</dt><dd>{{ form.contactName }}</dd><dt>联系电话</dt><dd>{{ form.contactPhone }}</dd></dl></section>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { extraAmount, feeQuantity, flowSummary, money, nodeLabel, totals, transportAmount } from './cargo-quote-model.js'
const props=defineProps({source:{type:Object,required:true},form:{type:Object,required:true},editable:Boolean,includeContacts:{type:Boolean,default:true}})
defineEmits(['edit','contacts'])
const sum=computed(()=>totals(props.source,props.form))
</script>
