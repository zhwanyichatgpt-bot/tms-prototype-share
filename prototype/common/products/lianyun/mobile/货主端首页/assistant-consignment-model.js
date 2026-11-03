// 指定托运的本地领域模型；字段沿用Web创建页，移除竞价发布配置。
export const boxTypes=['普通集装箱','冷藏集装箱','开顶集装箱','框架集装箱','罐式集装箱']
export const boxSizes=['20GP','40GP','40HQ','45GP','45HQ']
export const nodeTypes=['提空','提重','装货','卸货','还重','还空']
export const shipmentModes=['汽运','水运','火运','联运']
export const billingModes=['按重量','按体积','按数量']
// 本地原型的示例常用地址，后续由企业地址簿提供；不把查询城市当作具体地址。
export const consignmentCommonAddresses=[
 {id:'dl-warehouse',label:'大连仓库',location:'大连市甘井子区物流园A区1号仓'},
 {id:'gz-warehouse',label:'广州收货仓',location:'广州市黄埔区物流园B区2号仓'},
 {id:'fz-port',label:'福州港交接点',location:'福州市马尾区港口作业区1号交接点'},
 {id:'sz-warehouse',label:'苏州仓库',location:'苏州市工业园区物流园3号仓'},
 {id:'nb-warehouse',label:'宁波仓库',location:'宁波市北仑区物流园4号仓'},
 {id:'cq-warehouse',label:'重庆仓库',location:'重庆市江北区物流园5号仓'}
]

export const clone=value=>JSON.parse(JSON.stringify(value))
export const uid=()=>crypto.randomUUID()
export const money=value=>Number(value||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})
const dimension={按重量:'weight',按体积:'volume',按数量:'quantity'}
export const billingUnit=mode=>({按重量:'吨',按体积:'m³',按数量:'件'}[mode]||'')
export const newGoods=(name='')=>({id:uid(),code:'',name,volume:'',weight:'',quantity:'',unitPrice:'',package:'',remark:'',sourceItemId:''})
export const newNode=(type='装货',region='')=>({id:uid(),type,region,location:'',time:'',contact:'',phone:'',goodsItems:type==='装货'||type==='卸货'?[newGoods()]:[]})
export function createConsignment(demand,scheme){
 const nodes=[newNode('装货',demand.origin),newNode('卸货',demand.destination)]
 if(demand.departure)nodes[0].queryDate=demand.departure
 const name=demand.goodsProvided?demand.goodsDescription||demand.goods||'':''
 return {id:'',contextKey:[demand.origin,demand.destination,scheme.id].join('|'),businessType:scheme.mode==='air'?'散杂货':'集装箱',containerSource:'自有集装箱',allowMix:'允许',routeMode:'自定义',boxes:[{id:uid(),boxType:'普通集装箱',size:demand.equipmentProvided?demand.equipment:'',qty:demand.equipmentProvided?demand.quantity:'',remark:''}],goods:[newGoods(name)],nodes,billingMode:'按重量',expectedUnitPrice:'',paymentMethod:'',transportModes:[{road:'汽运',water:'水运',rail:'火运',multi:'联运'}[scheme.mode]].filter(Boolean),vouchers:['装货凭证'],remark:''}
}
export const isOwnContainer=form=>form.businessType==='集装箱'&&form.containerSource==='自有集装箱'
export function loadGoods(form){return isOwnContainer(form)?form.goods:form.nodes.filter(n=>n.type==='装货').flatMap(n=>n.goodsItems)}
export function sourcesBefore(form,index){return form.nodes.slice(0,index).filter(n=>n.type==='装货').flatMap(n=>n.goodsItems.filter(g=>g.name.trim()).map(g=>({...g,sourceNodeId:n.id,sourceLabel:n.location||n.region||'装货点'})))}
// Web货品金额采用重量乘货品单价，运输费单独按所选计费条件计算。
export const cargoAmount=item=>Number(item.weight||0)*Number(item.unitPrice||0)
export function freight(form){const key=dimension[form.billingMode];const quantity=loadGoods(form).reduce((s,g)=>s+Number(g[key]||0),0);return {quantity,unit:billingUnit(form.billingMode),amount:Math.round(quantity*Number(form.expectedUnitPrice||0)*100)/100}}
export function syncUnload(form){for(let i=0;i<form.nodes.length;i++){const n=form.nodes[i];if(n.type!=='卸货')continue;const sources=sourcesBefore(form,i);for(const g of n.goodsItems){const source=sources.find(s=>s.id===g.sourceItemId);if(!source){if(g.sourceItemId){g.sourceItemId='';g.name=''}continue}Object.assign(g,{name:source.name,code:source.code,unitPrice:source.unitPrice,package:source.package})}}}
const finiteNonnegative=v=>v===''||v==null||(Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=100000000)
const positive=v=>v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>0&&Number(v)<=100000000
export function validateConsignment(form,provider){
 const errors={};if(!provider?.id)errors.carrier='请选择一家承运商'
 if(!['散杂货','集装箱'].includes(form.businessType))errors.businessType='请选择托运业务类型'
 if(form.businessType==='集装箱'&&!['自有集装箱','承运商提供'].includes(form.containerSource))errors.containerSource='请选择用箱方式'
 if(isOwnContainer(form)){
  if(!form.boxes.length)errors.boxes='请至少填写一行柜种信息'
  const keys=new Set();for(const box of form.boxes){if(!boxTypes.includes(box.boxType)||!boxSizes.includes(box.size)||!positive(box.qty)||!Number.isInteger(Number(box.qty)))errors.boxes='请填写箱型、尺寸和大于0的整数箱量';const key=box.boxType+'|'+box.size;if(keys.has(key))errors.boxes='相同箱型和尺寸请合并箱量';keys.add(key)}
 }
 if(!form.nodes.some(n=>n.type==='装货')||!form.nodes.some(n=>n.type==='卸货'))errors.nodes='请至少填写一个装货点和一个卸货点'
 const goodsCheck=(list,key)=>{if(!list.length){errors[key]='请至少填写一行货品';return}for(const g of list){if(!g.name.trim())errors[key]='请填写货品名称';else if(![g.weight,g.volume,g.quantity].some(positive))errors[key]='请填写货品重量、体积或数量';else if(!['volume','weight','quantity','unitPrice'].every(k=>finiteNonnegative(g[k])))errors[key]='货品数值须为有效非负数，且不超过1亿'}}
 if(isOwnContainer(form))goodsCheck(form.goods,'goods')
 form.nodes.forEach((n,i)=>{
  const key='node-'+n.id;if(!nodeTypes.includes(n.type))errors[key]='请选择节点类型';else if(!n.location.trim())errors[key]='请补充具体节点地址，城市名称仅作为查询来源';else if(n.time&&!Number.isFinite(Date.parse(n.time)))errors[key]='请填写有效预计时间'
  if(!isOwnContainer(form)&&['装货','卸货'].includes(n.type)){goodsCheck(n.goodsItems,key);if(n.type==='卸货'){const available=sourcesBefore(form,i);if(n.goodsItems.some(g=>!available.some(s=>s.id===g.sourceItemId)))errors[key]='卸货货品须引用前序装货货品'}}
 })
 if(!isOwnContainer(form)){
  for(const g of loadGoods(form)){for(const k of ['weight','volume','quantity']){const used=form.nodes.filter(n=>n.type==='卸货').flatMap(n=>n.goodsItems).filter(row=>row.sourceItemId===g.id).reduce((s,row)=>s+Number(row[k]||0),0);if(used>Number(g[k]||0)+.00001)errors.nodes='卸货总量不能超过对应装货货品数量'}}
 }
 const dated=form.nodes.filter(n=>n.time);if(dated.some((n,i)=>i&&Date.parse(n.time)<Date.parse(dated[i-1].time)))errors.nodes='后续节点预计时间不能早于前序节点'
 if(!billingModes.includes(form.billingMode))errors.freight='请选择计费条件'
 else if(!loadGoods(form).length||loadGoods(form).some(g=>!positive(g[dimension[form.billingMode]])))errors.freight='请为装货货品填写对应计费条件的货量'
 else if(!positive(form.expectedUnitPrice)||Math.abs(Number(form.expectedUnitPrice)*100-Math.round(Number(form.expectedUnitPrice)*100))>.00001)errors.freight='请填写大于0的期望运输单价，最多两位小数'
 if(form.paymentMethod&&!['到付','月结','现结'].includes(form.paymentMethod))errors.freight='请选择有效支付方式'
 if(!form.transportModes.length||form.transportModes.some(m=>!shipmentModes.includes(m)))errors.modes='请选择至少一种期望运输方式'
 if(form.vouchers.some(v=>!['装货凭证','卸货凭证'].includes(v)))errors.vouchers='请选择有效单据凭证'
 if(form.remark.length>200)errors.remark='备注最多200字'
 if(!Number.isFinite(freight(form).amount)||freight(form).amount>100000000)errors.freight='预估总运费不能超过1亿元'
 return errors
}
export function carrierResponse(record,decision,reason=''){
 if(record.status!=='待承运商确认')throw Error('只有待确认托运单可以处理')
 if(!['确认','拒绝'].includes(decision))throw Error('无效的承运商操作')
 if(decision==='拒绝'&&!reason.trim())throw Error('请填写拒绝原因')
 return {...clone(record),status:decision==='确认'?'待执行':'已拒绝',carrierDecision:decision,responseReason:reason.trim(),respondedAt:new Date().toISOString()}
}
