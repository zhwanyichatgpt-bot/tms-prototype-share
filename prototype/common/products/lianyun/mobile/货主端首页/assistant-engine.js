import { blankDemand, modeLabels, schemeTemplates } from './assistant-data.js'
import { extraSchemes } from './assistant-scenarios.js'

export function parseRequest(text,current = blankDemand()) {
  const demand = {...current}
  const route = text.replace(/门到门|站到站|港到站|港到港|点到点/g,'').match(/(?:从)?(.+?)(?:运到|发到|到|至|→)([^，,。？?]+)/)
  if(route) { demand.origin = route[1].replace(/^(帮我查|查询|规划|我想从|我想|从)/,'').trim(); demand.destination = route[2].replace(/哪里$/,'').trim() }
  const destination = text.match(/(?:目的地|卸货地)(?:改成|改为|换成)([^，,。？?]+)/), origin = text.match(/装货地(?:改成|改为|换成)([^，,。？?]+)/)
  if(destination) { demand.destination = destination[1].trim(); demand.destinationPoint = null }
  if(origin) { demand.origin = origin[1].trim(); demand.originPoint = null }
  const equipment = text.toUpperCase().match(/20GP|40HQ/)
  if(equipment) {demand.equipment = equipment[0]; demand.equipmentProvided = true}
  const quantity = text.match(/(\d+)\s*(?:箱|个柜|个箱|柜)/)
  if(quantity) demand.quantity = Number(quantity[1])
  if(/危险|危化/.test(text)) {demand.goods = '危险品'; demand.goodsProvided = true}
  else if(/冷链|冷藏/.test(text)) {demand.goods = '冷链货物'; demand.goodsProvided = true}
  else if(/普货|普通货/.test(text)) {demand.goods = '普货'; demand.goodsProvided = true}
  if(/只(?:走|查|看)|改成.*运输|改为.*运输/.test(text)) {
    const mode = Object.entries(modeLabels).find(([key,label]) => key !== 'all' && text.includes(label))
    if(mode) demand.transportMode = mode[0]
  }
  if(/不限运输|全部方式/.test(text)) demand.transportMode = 'all'
  if(/门到门/.test(text)) demand.delivery = '门到门'
  if(/最便宜|费用优先|便宜/.test(text)) demand.priority = '费用优先'
  if(/最快|时效优先|快一点/.test(text)) demand.priority = '时效优先'
  return demand
}
export function demandIssue(demand) {
  if(!demand.origin?.trim() || !demand.destination?.trim()) return '请选择装货地和卸货地。'
  if(/^(中欧|欧洲|中缅|缅甸|东南亚)$/.test(demand.destination.trim())) return '请将运输方向细化为目的城市、港口或场站。'
  if(demand.origin.trim() === demand.destination.trim()) return '装货地与卸货地相同，请选择不同地点。'
  if(!Number.isInteger(Number(demand.quantity)) || Number(demand.quantity)<1 || Number(demand.quantity)>100) return '请输入1—100之间的整数箱量。'
  if(!['20GP','40HQ'].includes(demand.equipment)) return '请选择20GP或40HQ箱型。'
  return ''
}
export function sceneFor(demand) {
  if(/光谷配送/.test(demand.origin) && /未来科技城配送/.test(demand.destination)) return 'local-air'
  if(/大连/.test(demand.origin) && /广州/.test(demand.destination)) return 'dalian-guangzhou'
  if(!/武汉|阳逻/.test(demand.origin)) return ''
  return [['长沙','domestic'],['杜伊斯堡','europe'],['仰光','myanmar'],['伊斯兰堡','pakistan'],['卡拉奇','karachi'],['宁波|舟山','ningbo'],['上海','shanghai']].find(([pattern])=>new RegExp(pattern).test(demand.destination))?.[1] || ''
}
export const durationLabel = ([min,max]) => max<72 ? min+'—'+max+'小时' : +(min/24).toFixed(1)+'—'+ +(max/24).toFixed(1)+'天'
export function buildSchemes(demand) {
  const issue = demandIssue(demand)
  if(issue) return {items:[],reason:issue}
  const scene = sceneFor(demand), mode = demand.transportMode || 'all'
  if(!scene) return {items:[],reason:'暂未找到覆盖这组装卸地点的服务。可以调整具体节点，或保存需求后进一步咨询。'}
  if(demand.goodsProvided && demand.goods !== '普货') return {items:[],reason:'当前路线未确认这类货物的承接条件，请先核实专用运力、资质和装卸要求。'}
  let templates = [...schemeTemplates,...extraSchemes].filter(item=>item.scene===scene)
  if(scene==='domestic' && /铁路|场站/.test(demand.origin) && /铁路|场站/.test(demand.destination)) {
    const base = schemeTemplates.find(item=>item.id==='domestic-rail')
    templates.push({...base,id:'domestic-rail-only',name:'铁路站到站',label:'站到站',summary:'武汉铁路场站 → 长沙铁路场站',segments:[base.segments[1]],included:'铁路干线及约定场站交接',excluded:'两端公路接驳、货物装卸、堆存及超期用箱'})
  }
  templates = templates.filter(item=>{
    const kinds=[...new Set(item.segments.map(segment=>segment.mode))]
    return mode==='all' || (mode==='multi' ? kinds.length>1 : kinds.length===1 && kinds[0]===mode)
  }).filter(item=>!item.segments.every(segment=>segment.mode==='water') || /港/.test(demand.origin) && /港/.test(demand.destination))
  if(!templates.length) return {items:[],reason:mode==='water' ? '仅水路运输需要两端可交接港口。请选择目的港，或改为多式联运，允许港外公路接驳。' : mode==='rail' ? '仅铁路运输需要两端铁路场站。请选择场站，或改为多式联运，允许两端公路接驳。' : mode==='air' ? '低空配送仅支持指定服务点，需确认货物重量、尺寸及起降条件；不能替代这组地点的长途干线运输。' : '未找到符合所选运输方式的服务，请调整方式或具体节点。'}
  const items=templates.map(item=>{
    const segments=item.segments.map(segment=>({...segment,path:segment.path.map(point=>[...point])}))
    segments[0].from=demand.origin; segments.at(-1).to=demand.destination
    if(demand.originPoint) segments[0].path[0]=demand.originPoint
    if(demand.destinationPoint) segments.at(-1).path[segments.at(-1).path.length-1]=demand.destinationPoint
    const hours=segments.reduce((sum,segment)=>[sum[0]+segment.hours[0],sum[1]+segment.hours[1]],[0,0]), km=segments.reduce((sum,segment)=>sum+segment.km,0)
    const price=item.price.map(value=>Math.round(value*(demand.equipment==='20GP'?.75:1)/100)*100), modes=[...new Set(segments.map(segment=>segment.mode))]
    const delivery=modes.every(key=>key==='water')?'港到港':modes.every(key=>key==='rail')?'站到站':modes[0]==='air'?'指定服务点交接':demand.delivery
    return {...item,segments,price,priceKnown:price[0]>0,priceAssumed:!demand.equipmentProvided || !demand.goodsProvided,hours,km,duration:durationLabel(hours),mode:modes.length>1?'multi':modes[0],modeText:modes.map(key=>modeLabels[key]).join('＋'),delivery,transfers:Math.max(0,segments.length-1),demand:{...demand,delivery},total:price.map(value=>value*Number(demand.quantity)),providerIds:[...item.providerIds]}
  })
  if(demand.priority==='费用优先') items.sort((a,b)=>a.price[0]-b.price[0])
  if(demand.priority==='时效优先') items.sort((a,b)=>a.hours[1]-b.hours[1])
  return {items,reason:''}
}
export const money = range => '¥'+range.map(value=>value.toLocaleString('zh-CN')).join('—')
export function answerQuestion(text,scheme,demand) {
  if(/费用|价格|包含|收费|装卸/.test(text)) return scheme ? (scheme.priceKnown ? (scheme.priceAssumed ? '先按'+demand.equipment+'普货示例比较，' : '')+'当前参考费用'+money(scheme.price)+'/'+demand.equipment+'箱。' : '这条方案暂无参考价格，需服务商专项询价。')+'包含：'+scheme.included+'。不含：'+scheme.excluded+'。请向服务商核实出运日期、计价单位与附加费，再比较正式报价。' : '先选择装卸地点查看路线，补充货物与计价条件后再询价。'
  if(/时效|多久|时间|班期/.test(text)) return scheme ? '「'+scheme.name+'」预计'+scheme.duration+'，包含各段运输、计划等待和交接。具体发运与到达时间需按出运日期确认，不能视为班期承诺。' : '时效需结合起终点、运输方式及中转等待计算，请先查询路线。'
  if(/怎么走|路线|节点|途经/.test(text)) return scheme ? scheme.segments.map((segment,index)=>(index+1)+'. '+segment.from+' → '+segment.to+'：'+modeLabels[segment.mode]+'，约'+segment.km+'公里，'+durationLabel(segment.hours)+'。').join('\n') : '请先选择装卸地点，我会按运输段说明路线与交接节点。'
  if(/哪些运输方式|其他方案/.test(text)) return '选择“不限”可以比较当前匹配的运输方式。仅水路、仅铁路分别要求港口、场站交接；需要两端接驳时请选择多式联运。'
  if(/轨迹|在途/.test(text)) return '路线规划不是实时轨迹。查询在途信息请提供运单号，以运输节点记录及更新时间为准。'
  if(/供应商|承运商|服务商|谁能运/.test(text)) return '选择方案后点击“找服务商询价”，查看覆盖范围、承接能力与履约关系，再核实资源和报价。'
  if(/门到门/.test(text)) return '门到门是提货点至约定交付点的服务范围，不自动包含装卸、清关、税费或超期费用，需逐项约定。'
  return '我可以继续说明当前路线的途经节点、费用范围、预计时效与服务商匹配。涉及实时舱位、运力或特殊货物，需要服务商进一步确认。'
}
