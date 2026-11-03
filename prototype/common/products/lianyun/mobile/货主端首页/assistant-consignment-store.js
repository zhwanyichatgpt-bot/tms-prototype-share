import { reactive } from 'vue'
import { carrierResponse, clone, freight, uid, validateConsignment } from './assistant-consignment-model.js'
const key='lianyun-designated-consignments-v1'
function load(){try{const data=JSON.parse(globalThis.localStorage?.getItem(key)||'[]');return Array.isArray(data)?data.filter(r=>r?.id&&r.form&&['nodes','goods','boxes','transportModes','vouchers'].every(k=>Array.isArray(r.form[k]))&&r.provider?.id&&['草稿','待承运商确认','待执行','已拒绝'].includes(r.status)).slice(0,100):[]}catch{return []}}
export const consignmentStore=reactive({records:load(),storageError:false})
function persist(records){try{if(!globalThis.localStorage)throw Error();globalThis.localStorage.setItem(key,JSON.stringify(records));consignmentStore.storageError=false}catch{consignmentStore.storageError=true}consignmentStore.records=records}
export function saveConsignment(form,provider,scheme,status='草稿'){
 if(!provider?.id)throw Error('请选择一家承运商')
 if(!['草稿','待承运商确认'].includes(status))throw Error('无效的提交状态')
 const existing=consignmentStore.records.find(r=>r.id===form.id);if(existing&&existing.status!=='草稿')throw Error('托运单已提交，不能重复提交或修改')
 if(status!=='草稿'){const errors=validateConsignment(form,provider);if(Object.keys(errors).length)throw Error(Object.values(errors)[0])}
 const id=form.id||'TY-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+uid().slice(0,8)
 const record={id,version:1,publishMode:'指定托运',businessType:form.businessType,visibilityScope:'指定承运商',selectedCarrier:provider.id,status,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),submittedAt:status==='草稿'?null:new Date().toISOString(),form:clone({...form,id}),provider:clone(provider),scheme:{id:scheme.id,name:scheme.name},freight:freight(form)}
 persist([record,...consignmentStore.records.filter(r=>r.id!==id)].slice(0,100));return clone(record)
}
// 供承运方本地模拟及状态验证使用，货主页不提供代承运商确认/拒绝按钮。
export function respondToConsignment(id,decision,reason=''){const record=consignmentStore.records.find(r=>r.id===id);if(!record)throw Error('托运单不存在');const next=carrierResponse(record,decision,reason);persist(consignmentStore.records.map(r=>r.id===id?next:r));return clone(next)}
