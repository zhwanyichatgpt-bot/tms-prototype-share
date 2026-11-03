<template>
  <div class="lcs-goods-list">
    <fieldset v-for="(item,index) in items" :key="item.id" class="lcs-goods-row">
      <legend>{{ title }} {{ index+1 }}<button type="button" :aria-label="`删除${prefix}货品${index+1}`" @click="items.splice(index,1)">删除</button></legend>
      <label v-if="sources" class="lcs-field"><span>货品 <em>*</em></span><select :value="item.sourceItemId" :aria-label="`${prefix}货品${index+1}`" @change="chooseSource(item,$event.target.value)"><option value="">请选择装货货品</option><option v-for="source in sources" :key="source.id" :value="source.id">{{ source.name }} · {{ source.sourceLabel }}</option></select></label>
      <label v-else class="lcs-field"><span>货品名称 <em>*</em></span><input v-model="item.name" :aria-label="`${prefix}货品${index+1}`" maxlength="80" placeholder="请输入货品名称"/></label>
      <label class="lcs-field"><span>{{ primary.label }} <em>*</em></span><div class="lcs-number"><input v-model="item[primary.key]" :aria-label="`${prefix}${primary.label}${index+1}`" type="number" min="0" max="100000000" step="any" inputmode="decimal" placeholder="请输入"/><small>{{ primary.unit }}</small></div></label>
      <details class="lcs-optional">
        <summary>补充信息<span>{{ hasExtra(item)?'已填写':'选填' }}</span></summary>
        <label v-if="showCode" class="lcs-field"><span>货品编号</span><input v-model="item.code" :aria-label="`${prefix}货品编号${index+1}`" maxlength="40" placeholder="选填"/></label>
        <label v-for="field in secondary" :key="field.key" class="lcs-field"><span>{{ field.label }}</span><div class="lcs-number"><input v-model="item[field.key]" :aria-label="`${prefix}${field.label}${index+1}`" type="number" min="0" max="100000000" step="any" inputmode="decimal" placeholder="选填"/><small>{{ field.unit }}</small></div></label>
        <label class="lcs-field"><span>货品单价</span><div class="lcs-number"><input v-model="item.unitPrice" :aria-label="`${prefix}货品单价${index+1}`" type="number" min="0" max="100000000" step="any" inputmode="decimal" :readonly="!!sources" placeholder="选填"/><small>元/吨</small></div></label>
        <div v-if="item.unitPrice!==''&&item.unitPrice!=null" class="lcs-field"><span>货品总价</span><output>¥{{ money(cargoAmount(item)) }}</output></div>
        <label class="lcs-field"><span>货品包装</span><select v-model="item.package" :aria-label="`${prefix}货品包装${index+1}`" :disabled="!!sources"><option value="">请选择</option><option>散装</option><option>袋装</option><option>吨包</option><option>托盘</option><option>裸装</option></select></label>
        <label class="lcs-field"><span>货品备注</span><input v-model="item.remark" :aria-label="`${prefix}货品备注${index+1}`" maxlength="50" placeholder="选填"/></label>
      </details>
    </fieldset>
    <button type="button" class="lcs-add" :aria-label="`添加${prefix}货品`" @click="items.push(newGoods())">＋ 添加货品</button>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { cargoAmount,money,newGoods } from './assistant-consignment-model.js'
const props=defineProps({prefix:{type:String,required:true},title:{default:'货品'},sources:Array,showCode:Boolean,billingMode:{type:String,default:'按重量'}})
const items=defineModel('items',{type:Array,required:true})
const amounts=[{key:'weight',label:'发货重量',unit:'吨',mode:'按重量'},{key:'volume',label:'发货体积',unit:'m³',mode:'按体积'},{key:'quantity',label:'发货数量',unit:'件',mode:'按数量'}]
const primary=computed(()=>amounts.find(field=>field.mode===props.billingMode)||amounts[0])
const secondary=computed(()=>amounts.filter(field=>field.key!==primary.value.key))
function hasExtra(item){return [...secondary.value.map(field=>field.key),'code','unitPrice','package','remark'].some(key=>item[key]!==''&&item[key]!=null)}
function chooseSource(item,id){const source=props.sources.find(s=>s.id===id);if(!source){item.sourceItemId='';item.name='';return}Object.assign(item,{sourceItemId:source.id,name:source.name,code:source.code,volume:source.volume,weight:source.weight,quantity:source.quantity,unitPrice:source.unitPrice,package:source.package})}
</script>
