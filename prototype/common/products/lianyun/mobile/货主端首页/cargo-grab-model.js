// 抢单价格与承接校验；仅服务本地演示，不承担真实服务端并发锁。
export const isGrabCargo=cargo=>cargo?.publishMode==='抢单'
const positive=value=>Number.isFinite(Number(value))&&Number(value)>0&&Number(value)<=100000000
const round=value=>Math.round((value+Number.EPSILON)*100)/100
export function grabPrice(cargo){
 if(!isGrabCargo(cargo))return null
 const fixed=cargo.fixedPrice
 if(cargo.businessType==='集装箱'){
  if(!Array.isArray(fixed?.lines)||!fixed.lines.length)return null
  const lines=fixed.lines.map(line=>({...line,quantity:Number(line.quantity),unitPrice:Number(line.unitPrice)}))
  if(lines.some(line=>!line.label||!positive(line.quantity)||!Number.isInteger(line.quantity)||!positive(line.unitPrice)))return null
  const total=round(lines.reduce((sum,line)=>sum+line.quantity*line.unitPrice,0))
  return positive(total)?{lines,total,quantity:lines.reduce((sum,line)=>sum+line.quantity,0),unit:'箱',unitPrice:null}:null
 }
 if(!['票','吨','m³','件'].includes(fixed?.unit)||!positive(fixed?.quantity)||!positive(fixed?.unitPrice))return null
 const total=round(Number(fixed.quantity)*Number(fixed.unitPrice))
 return positive(total)?{lines:[],total,quantity:Number(fixed.quantity),unit:fixed.unit,unitPrice:Number(fixed.unitPrice)}:null
}
export function grabState(cargo,record,now=Date.now()){
 if(!isGrabCargo(cargo))return 'quote'
 if(record?.cargoId===cargo.id)return 'won'
 if(cargo.grabAvailability==='taken')return 'taken'
 if(cargo.grabAvailability==='closed')return 'closed'
 const end=Date.parse(cargo.grabEndsAt)
 if(!Number.isFinite(end)||!grabPrice(cargo))return 'unavailable'
 if(now>=end)return 'expired'
 return 'ready'
}
export function cargoDiscoverable(cargo,record,now=Date.now()){return !isGrabCargo(cargo)||grabState(cargo,record,now)==='ready'}
export const grabStateLabels={ready:'抢单中',won:'待执行',taken:'已抢完',expired:'已截止',closed:'已关闭',unavailable:'暂不可抢单'}
export function grabFingerprint(cargo){return JSON.stringify([cargo.id,cargo.fixedPrice,cargo.fees,cargo.payment,cargo.requirements,cargo.summary,cargo.origin,cargo.destination,cargo.quantity,cargo.loadDate,cargo.unloadDate,cargo.loadWindow,cargo.unloadWindow,cargo.grabEndsAt])}
export function createGrabRecord(cargo,existing,fingerprint,now=Date.now()){
 const state=grabState(cargo,existing,now)
 if(state==='won')return existing
 if(state!=='ready'){const error=Error({taken:'该货源已被其他承运商抢走',expired:'该货源已截止',closed:'该货源已关闭',unavailable:'货源定价或有效期不完整',quote:'报价货源不能抢单'}[state]);error.code=state;throw error}
 if(fingerprint!==grabFingerprint(cargo)){const error=Error('货源价格或条件已变化，请重新核对');error.code='changed';throw error}
 return {version:1,id:'QD-'+new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date(now)).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8),cargoId:cargo.id,status:'待执行',carrier:{id:'demo-current-carrier',name:'当前承运企业（演示）'},submittedAt:new Date(now).toISOString(),snapshot:JSON.parse(JSON.stringify(cargo)),price:grabPrice(cargo)}
}
