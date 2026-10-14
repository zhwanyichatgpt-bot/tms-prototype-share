<template>
  <div class="cq-fee-fields">
    <template v-if="fee.carryForm==='集装箱运输'">
      <p class="cq-muted">计费条件：按集装箱</p>
      <div v-for="(box,i) in fee.boxes" :key="box.id" class="cq-box-row">
        <strong v-if="source.isContainer">{{ box.size }}{{ box.boxType }} · {{ box.cargoName }} · {{ box.quantity }}箱</strong>
        <template v-else>
          <div class="cq-grid"><label>箱种<select v-model="box.boxType"><option>GP</option><option>HQ</option><option>HC</option></select></label><label>尺寸<select v-model="box.size"><option>20</option><option>40</option><option>45</option></select></label></div>
          <label>货品名称<input v-model="box.cargoName" maxlength="80"/></label>
          <label>箱数<input v-model="box.quantity" type="number" min="1" step="1" inputmode="numeric"/></label>
        </template>
        <label>箱型单价（元/箱）<input v-model="box.unitPrice" type="number" min="0" step="0.01" inputmode="decimal" :aria-label="`${box.size}${box.boxType}箱型单价`"/></label>
        <div class="cq-between"><span>金额 ¥{{ money(Number(box.quantity||0)*Number(box.unitPrice||0)) }}</span><button v-if="!source.isContainer" class="cq-link" @click="fee.boxes.splice(i,1)">删除箱型</button></div>
      </div>
      <button v-if="!source.isContainer" class="cq-add" @click="addBox">＋ 添加箱型价格明细</button>
    </template>
    <template v-else>
      <div class="cq-grid"><label>计费条件<select v-model="fee.billingDimension"><option v-for="option in billingOptions" :key="option">{{ option }}</option></select></label><label>计费依据<select v-model="fee.billingBasis"><option>按装货口径</option><option>按卸货口径</option></select></label></div>
      <label>运输单价（元/{{ quantity.unit||'单位' }}）<input v-model="fee.unitPrice" type="number" min="0" step="0.01" inputmode="decimal" aria-label="运输单价"/></label>
      <p class="cq-muted">计费货量：{{ quantity.label }}</p>
    </template>
    <div class="cq-amount"><span>{{ index==null?'运输费':'路段运输费' }}</span><strong>¥{{ money(amount) }}</strong></div>
    <div class="cq-between cq-divider"><h3>{{ index==null?'其他费用':'本段其他费用' }}</h3><button class="cq-link" @click="$emit('extra',{fee})">＋ 添加费用项</button></div>
    <div v-for="extra in fee.extraFees" :key="extra.id" class="cq-extra-row">
      <div><span :class="['cq-extra-type',{minus:extra.type==='减项'}]">{{ extra.type }}</span><strong>{{ extra.name }}</strong><p>{{ extra.base }} × {{ extra.unitPrice }}元</p><b>{{ extra.type==='减项'?'−':'＋' }}¥{{ money(Math.abs(extraAmount(extra))) }}</b></div>
      <div class="cq-extra-actions"><button class="cq-icon-button" :aria-label="`编辑${extra.name}`" @click="$emit('extra',{fee,extra})"><van-icon name="edit"/></button><button class="cq-icon-button" :aria-label="`删除${extra.name}`" @click="fee.extraFees.splice(fee.extraFees.indexOf(extra),1)"><van-icon name="delete-o"/></button></div>
    </div>
    <p v-if="!fee.extraFees.length" class="cq-muted">暂无其他费用</p>
    <div v-if="index!=null" class="cq-between cq-divider"><strong>路段合计</strong><b class="cq-blue">¥{{ money(amount+fee.extraFees.reduce((sum,e)=>sum+extraAmount(e),0)) }}</b></div>
    <p v-if="error" class="cq-error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { billingOptions, extraAmount, feeQuantity, money, transportAmount } from './cargo-quote-model.js'
const props=defineProps({source:Object,form:Object,fee:Object,index:{default:null},error:String})
defineEmits(['extra'])
const quantity=computed(()=>feeQuantity(props.source,props.form,props.fee,props.index))
const amount=computed(()=>transportAmount(props.source,props.form,props.fee,props.index))
function addBox(){props.fee.boxes.push({id:crypto.randomUUID(),boxType:'GP',size:'40',cargoName:props.source.flows[0]?.cargoName||'',quantity:'',unitPrice:''})}
</script>
