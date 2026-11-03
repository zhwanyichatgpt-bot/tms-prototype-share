<template>
  <div class="lcs-summary">
    <section class="lcs-card"><h3>托运信息</h3><dl class="lcs-facts"><dt>业务类型</dt><dd>{{ form.businessType }}</dd><template v-if="form.businessType==='集装箱'"><dt>用箱方式</dt><dd>{{ form.containerSource }}</dd></template><template v-else><dt>允许货品混装</dt><dd>{{ form.allowMix }}</dd></template></dl><template v-if="isOwnContainer(form)"><h4>柜种信息</h4><p v-for="box in form.boxes" :key="box.id">{{ box.boxType }} · {{ box.size }} · {{ box.qty }}箱<small v-if="box.remark">{{ box.remark }}</small></p><h4>运输货品</h4><div v-for="item in form.goods" :key="item.id" class="lcs-goods-summary"><strong>{{ item.code }} {{ item.name }}</strong><p>{{ goodsText(item) }}</p></div></template></section>
    <section class="lcs-card"><h3>运输信息</h3><p v-if="isOwnContainer(form)">运输路线：{{ form.routeMode }}</p><article v-for="(node,index) in form.nodes" :key="node.id" class="lcs-node-summary"><h4>{{ index+1 }} · {{ node.type }}　{{ node.location }}</h4><p>{{ node.time?node.time.replace('T',' '):node.queryDate?node.queryDate+'（时刻未填写）':'预计时间未填写' }}</p><p v-if="node.contact||node.phone">{{ node.contact }} {{ node.phone }}</p><div v-if="!isOwnContainer(form)" class="lcs-goods-summary" v-for="item in node.goodsItems" :key="item.id"><strong>{{ item.name }}</strong><p>{{ goodsText(item) }}</p></div></article></section>
    <section class="lcs-card"><h3>运费设置</h3><dl class="lcs-facts"><dt>计费条件</dt><dd>{{ form.billingMode }}</dd><dt>计费货量</dt><dd>{{ total.quantity }} {{ total.unit }}</dd><dt>期望运输单价</dt><dd>¥{{ money(form.expectedUnitPrice) }}/{{ total.unit }}</dd><dt>预估总运费</dt><dd class="lcs-price">¥{{ money(total.amount) }}</dd><dt>支付方式</dt><dd>{{ form.paymentMethod||'未填写' }}</dd></dl><p class="lcs-muted">最终承运费用以双方确认为准。</p></section>
    <section class="lcs-card"><h3>运输要求</h3><dl class="lcs-facts"><dt>期望运输方式</dt><dd>{{ form.transportModes.join('、') }}</dd><dt>单据凭证</dt><dd>{{ form.vouchers.join('、')||'未选择' }}</dd><dt>备注</dt><dd class="lcs-note-text">{{ form.remark||'未填写' }}</dd></dl></section>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { cargoAmount,freight,isOwnContainer,money } from './assistant-consignment-model.js'
const props=defineProps({form:{type:Object,required:true}})
const total=computed(()=>freight(props.form))
function goodsText(g){return [g.volume!==''?g.volume+'m³':'',g.weight!==''?g.weight+'吨':'',g.quantity!==''?g.quantity+'件':'',g.unitPrice!==''?'货品单价¥'+money(g.unitPrice):'',g.unitPrice!==''&&g.unitPrice!=null?'货品总价¥'+money(cargoAmount(g)):'',g.package,g.remark].filter(Boolean).join(' · ')}
</script>
