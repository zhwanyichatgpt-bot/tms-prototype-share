import { reactive } from 'vue'
import { createGrabRecord,grabPrice,grabState,grabStateLabels } from './cargo-grab-model.js'
const key='lianyun-cargo-grabs-v1'
function validRecord(record){try{return record?.version===1&&record.status==='待执行'&&typeof record.id==='string'&&record.cargoId===record.snapshot?.id&&record.carrier?.id==='demo-current-carrier'&&Number.isFinite(Date.parse(record.submittedAt))&&grabPrice(record.snapshot)?.total===record.price?.total}catch{return false}}
function read(){try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(validRecord).slice(0,100):[]}catch{return []}}
export const cargoGrabStore=reactive({records:read(),storageError:false})
function mergeStored(){const rows=[...read(),...cargoGrabStore.records];cargoGrabStore.records=[...new Map(rows.map(row=>[row.cargoId,row])).values()]}
export function cargoGrabBadge(cargo){const record=cargoGrabStore.records.find(row=>row.cargoId===cargo.id);const state=grabState(cargo,record);return state==='ready'?'抢单':'抢单 · '+(grabStateLabels[state]||'暂不可抢单')}
export async function submitCargoGrab(cargo,fingerprint){
 const commit=()=>{
  mergeStored()
  const old=cargoGrabStore.records.find(row=>row.cargoId===cargo.id)
  const record=createGrabRecord(cargo,old,fingerprint)
  if(old)return old
  cargoGrabStore.records=[record,...cargoGrabStore.records].slice(0,100)
  try{localStorage.setItem(key,JSON.stringify(cargoGrabStore.records));cargoGrabStore.storageError=false}catch{cargoGrabStore.storageError=true}
  return record
 }
 // 同源多标签页在浏览器支持时串行提交；真实抢单仍需服务端原子校验。
 if(globalThis.navigator?.locks)return navigator.locks.request(key,commit)
 return commit()
}
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===key)mergeStored()})
