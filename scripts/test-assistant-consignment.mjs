// 指定托运领域规则回归：仅使用进程内存存储，不读写浏览器或真实企业资料。
import assert from 'node:assert/strict'
import {consignmentCommonAddresses,createConsignment,newGoods,newNode,freight,validateConsignment,carrierResponse,clone,syncUnload} from '../prototype/common/products/lianyun/mobile/货主端首页/assistant-consignment-model.js'
assert.equal(new Set(consignmentCommonAddresses.map(a=>a.id)).size,consignmentCommonAddresses.length);assert(consignmentCommonAddresses.every(a=>a.label&&a.location.length>6));
const provider={id:'carrier-a',name:'验证承运商'},scheme={id:'scheme-a',mode:'multi',name:'公铁联运'}
const form=createConsignment({origin:'大连市',destination:'广州市',equipment:'40HQ',equipmentProvided:true,quantity:4},scheme)
assert(Object.keys(validateConsignment(form,provider)).length>0)
const dateOnly=createConsignment({origin:'大连',destination:'广州',departure:'2026-11-06'},scheme);assert.equal(dateOnly.nodes[0].time,'');assert.equal(dateOnly.nodes[0].queryDate,'2026-11-06')
form.boxes[0].qty=4;form.goods=[{...newGoods('钢材'),weight:20,volume:10,quantity:2,unitPrice:100,package:'裸装'}];form.nodes[0].location='大连装货仓';form.nodes[1].location='广州卸货仓';form.expectedUnitPrice=30
assert.deepEqual(validateConsignment(form,provider),{});assert.equal(freight(form).amount,600)
form.billingMode='按体积';assert.equal(freight(form).amount,300);const volumeOnly=clone(form);volumeOnly.goods[0].weight='';volumeOnly.goods[0].quantity='';volumeOnly.goods[0].unitPrice='';assert.deepEqual(validateConsignment(volumeOnly,provider),{});assert.equal(freight(volumeOnly).amount,300);form.billingMode='按数量';assert.equal(freight(form).amount,60)
form.nodes[0].time='2026-11-05T10:00';form.nodes[1].time='2026-11-04T10:00';assert(validateConsignment(form,provider).nodes);form.nodes.forEach(n=>n.time='')
form.boxes[0].qty=1.2;assert(validateConsignment(form,provider).boxes);form.boxes[0].qty=4
form.businessType='散杂货';form.billingMode='按重量';form.nodes[0].goodsItems=[clone(form.goods[0])];form.nodes[1].goodsItems=[{...clone(form.goods[0]),id:'unload-goods',sourceItemId:form.nodes[0].goodsItems[0].id}]
assert.deepEqual(validateConsignment(form,provider),{});assert.equal(freight(form).quantity,20)
form.nodes[1].goodsItems[0].weight=21;assert(validateConsignment(form,provider).nodes);form.nodes[1].goodsItems[0].weight=20
form.nodes[0].goodsItems[0].name='钢卷';syncUnload(form);assert.equal(form.nodes[1].goodsItems[0].name,'钢卷')
form.nodes[0].goodsItems=[];syncUnload(form);assert.equal(form.nodes[1].goodsItems[0].sourceItemId,'');assert(Object.keys(validateConsignment(form,provider)).length)
const record={id:'test',status:'待承运商确认',form:{}};assert.equal(carrierResponse(record,'确认').status,'待执行');assert.equal(carrierResponse(record,'拒绝','运力不足').status,'已拒绝');assert.throws(()=>carrierResponse(record,'拒绝'));assert.throws(()=>carrierResponse({...record,status:'待执行'},'拒绝','重复处理'))
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}
const {saveConsignment,respondToConsignment,consignmentStore}=await import('../prototype/common/products/lianyun/mobile/货主端首页/assistant-consignment-store.js')
const valid=createConsignment({origin:'大连',destination:'广州',equipment:'40HQ',equipmentProvided:true,quantity:4},scheme);valid.goods=[{...newGoods('钢材'),weight:20}];valid.nodes.forEach(n=>n.location='测试地址');valid.expectedUnitPrice=30
const draft=saveConsignment(valid,provider,scheme);assert.equal(draft.status,'草稿');valid.id=draft.id;const submitted=saveConsignment(valid,provider,scheme,'待承运商确认');assert.equal(submitted.id,draft.id);assert.equal(submitted.publishMode,'指定托运');assert.equal(submitted.visibilityScope,'指定承运商');assert.equal(submitted.selectedCarrier,provider.id);assert(!('quoteMode' in submitted.form));assert.equal(submitted.freight.amount,600);assert.throws(()=>saveConsignment(valid,provider,scheme,'待承运商确认'));assert.equal(respondToConsignment(submitted.id,'拒绝','运力不足').status,'已拒绝');assert.equal(consignmentStore.records.length,1);assert.equal(JSON.parse([...memory.values()][0])[0].status,'已拒绝')
console.log('通过：字段校验、三种计价、箱量、节点时间、货物流向、单承运商、草稿/提交幂等、本机保存、承运商确认/拒绝状态')
