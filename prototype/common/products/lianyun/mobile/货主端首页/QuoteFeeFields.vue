<template>
  <div class="cq-fee-fields">
    <template v-if="fee.carryForm==='集装箱运输'">
      <div class="cq-field-row"><span>计费条件</span><span class="cq-muted">按集装箱</span></div>
      <div v-for="(box,i) in fee.boxes" :key="box.id" class="cq-box-row">
        <strong v-if="source.isContainer">{{ box.size }}{{ box.boxType }} · {{ box.cargoName }} · {{ box.quantity }}箱</strong>
        <template v-else><label class="cq-field-row"><span>箱型</span><select v-model="box.size" aria-label="集装箱尺寸"><option>20</option><option>40</option><option>45</option></select><select v-model="box.boxType" aria-label="集装箱类型"><option>GP</option><option>HQ</option><option>HC</option></select></label><label class="cq-field-row"><span>货品名称</span><input v-model="box.cargoName" maxlength="80" placeholder="请输入"/></label><label class="cq-field-row"><span>箱数</span><input v-model="box.quantity" type="number" min="1" step="1" inputmode="numeric" placeholder="请输入"/></label></template>
        <label class="cq-field-row"><span>运输单价</span><input v-model="box.unitPrice" type="number" min="0" step="0.01" inputmode="decimal" :aria-label="`${box.size}${box.boxType}箱型单价`" placeholder="请输入"/><small>元/箱</small></label><div class="cq-between cq-muted"><span>¥{{ money(Number(box.quantity||0)*Number(box.unitPrice||0)) }}</span><button v-if="!source.isContainer" class="cq-link" @click="fee.boxes.splice(i,1)">删除箱型</button></div>
      </div><button v-if="!source.isContainer" class="cq-link" @click="addBox">＋ 添加箱型</button>
    </template>
    <template v-else>
      <label class="cq-field-row"><span>计费条件</span><select v-model="fee.billingDimension" aria-label="计费条件"><option v-for="option in billingOptions" :key="option">{{ option }}</option></select><van-icon name="arrow"/></label>
      <label class="cq-field-row"><span>计费依据</span><select v-model="fee.billingBasis" aria-label="计费依据"><option>按装货口径</option><option>按卸货口径</option></select><van-icon name="arrow"/></label>
      <label class="cq-field-row"><span>运输单价</span><input v-model="fee.unitPrice" type="number" min="0" step="0.01" inputmode="decimal" aria-label="运输单价" placeholder="请输入"/><small>元/{{ quantity.unit||'单位' }}</small></label>
    </template>
    <div class="cq-field-row cq-extra-heading"><span>{{ index==null?'其他费用':'本段其他费用' }}</span><button class="cq-link" @click="$emit('extra',{fee})"><van-icon name="add"/> 新增费用</button></div>
    <div v-if="fee.extraFees.length" class="cq-extra-list"><div v-for="extra in fee.extraFees" :key="extra.id" class="cq-extra-row"><button class="cq-delete-extra" :aria-label="`删除${extra.name}`" @click="fee.extraFees.splice(fee.extraFees.indexOf(extra),1)"><van-icon name="clear"/></button><button class="cq-extra-edit" :aria-label="`编辑${extra.name}`" @click="$emit('extra',{fee,extra})"><span>{{ extra.name }}<small v-if="extra.type==='减项'">（减项）</small></span><span>{{ extra.type==='减项'?'−':'＋' }}¥{{ money(Math.abs(extraAmount(extra))) }}</span></button></div></div>
    <div class="cq-fee-subtotal"><small>{{ fee.carryForm==='集装箱运输'?'按箱型计费':quantity.label }}</small><span>{{ index==null?'运输费':'路段运输费' }} ¥{{ money(amount) }}</span></div>
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
